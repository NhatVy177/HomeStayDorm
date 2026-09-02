import pg from 'pg';
const { Pool } = pg;

let poolInstance;

function getConnectionString() {
  // Use Vercel/Supabase standard environment variables if available
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  
  // Fallback to manual construction
  const host = process.env.DB_SERVER || 'db.dzyjchpbrqasblnvzjkk.supabase.co';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'postgres';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASS || 'Nhatvy1707@';
  
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getPool() {
  if (!poolInstance) {
    const connectionString = getConnectionString();
    poolInstance = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    // Add mssql request shim
    poolInstance.request = function() {
      const req = {
        _inputs: [],
        _outputs: [],
        input: function(name, type, value) {
          this._inputs.push({ name, type, value });
          return this;
        },
        output: function(name, type) {
          this._outputs.push({ name, type });
          return this;
        },
        query: async function(sqlString) {
          return executeQuery(sqlString, this._inputs);
        },
        execute: async function(procedureName) {
          return executeProcedure(procedureName, this._inputs);
        }
      };
      return req;
    };
  }
  return poolInstance;
}

function toSnakeCase(str) {
  return str
    .replace(/([A-Z]+)/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/__+/g, '_');
}

function toPascalCase(str) {
  if (!str) return str;
  if (str.includes('_')) {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mapRowsToPascalCase(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(row => {
    if (!row || typeof row !== 'object') return row;
    const newRow = {};
    for (const key of Object.keys(row)) {
      newRow[key] = row[key];
      newRow[toPascalCase(key)] = row[key];
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      newRow[camelKey] = row[key];
    }
    return newRow;
  });
}

// Function registry cache
let functionRegistry = null;

async function getFunctionMetadata(funcName) {
  const pool = getPool();
  if (!functionRegistry) {
    try {
      const res = await pool.query(`
        SELECT p.proname, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as ret
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public';
      `);
      functionRegistry = new Map();
      for (const r of res.rows) {
        functionRegistry.set(r.proname.toLowerCase(), r);
      }
    } catch (e) {
      console.warn('Could not load function registry:', e.message);
    }
  }

  const clean = funcName.replace(/^dbo\./i, '');
  const cleanLower = clean.toLowerCase();
  const snake = toSnakeCase(clean);
  const compact = cleanLower.replace(/_/g, '');

  if (functionRegistry) {
    if (functionRegistry.has(snake)) return functionRegistry.get(snake).proname;
    if (functionRegistry.has(cleanLower)) return functionRegistry.get(cleanLower).proname;
    if (functionRegistry.has('sp_' + snake)) return functionRegistry.get('sp_' + snake).proname;
    for (const [key, val] of functionRegistry) {
      if (key.replace(/_/g, '') === compact || key.replace(/_/g, '') === 'sp' + compact) {
        return val.proname;
      }
    }
  }

  // Fallback to snake_case
  return 'sp_' + snake.replace(/^sp_/, '');
}

/**
 * Robust wrapper to mimic mssql's executeProcedure
 */
export async function executeProcedure(procedureName, parameters = []) {
  const pool = getPool();
  const resolvedFuncName = await getFunctionMetadata(procedureName);

  // Extract values, handling TVP / table types
  const values = parameters.map(p => {
    if (p.value && typeof p.value === 'object' && p.value.rowsArray) {
      const columns = p.value.columnsList;
      const jsonArr = p.value.rowsArray.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[toSnakeCase(col)] = row[i];
        });
        return obj;
      });
      return JSON.stringify(jsonArr);
    }
    return p.value;
  });

  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const query = `SELECT * FROM "${resolvedFuncName}"(${placeholders});`;

  try {
    const result = await pool.query(query, values);
    let rows = result.rows;

    // If Postgres returned a single JSON column with the function name, unpack it if needed
    if (rows.length === 1 && Object.keys(rows[0]).length === 1 && typeof rows[0][resolvedFuncName] === 'object' && rows[0][resolvedFuncName] !== null) {
      const unpacked = rows[0][resolvedFuncName];
      rows = Array.isArray(unpacked) ? unpacked : [unpacked];
    }

    const pascalRows = mapRowsToPascalCase(rows);

    return {
      recordset: pascalRows,
      recordsets: [pascalRows],
      output: pascalRows[0] || {},
      rowsAffected: [result.rowCount]
    };
  } catch (err) {
    console.error(`Error executing procedure ${resolvedFuncName} (from ${procedureName}):`, err.message);
    throw err;
  }
}

/**
 * Robust wrapper to mimic mssql's executeQuery
 */
export async function executeQuery(sqlString, parameters = []) {
  const pool = getPool();
  let pgSql = sqlString;
  const values = [];

  parameters.forEach((param, index) => {
    const regex = new RegExp(`@${param.name}\\b`, 'g');
    pgSql = pgSql.replace(regex, `$${index + 1}`);
    values.push(param.value);
  });

  // Clean T-SQL syntax
  pgSql = pgSql.replace(/\bdbo\./gi, '');
  pgSql = pgSql.replace(/N'([^']*(?:''[^']*)*)'/g, "'$1'");
  pgSql = pgSql.replace(/\bGETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/\bSYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/\bISNULL\s*\(/gi, 'COALESCE(');

  try {
    const result = await pool.query(pgSql, values);
    const pascalRows = mapRowsToPascalCase(result.rows);
    return {
      recordset: pascalRows,
      recordsets: [pascalRows],
      rowsAffected: [result.rowCount]
    };
  } catch (err) {
    console.error(`Error executing query:`, err.message);
    throw err;
  }
}

// Dummy sql object to prevent immediate crashes in unmigrated files
export const sql = {
  VarChar: () => {},
  NVarChar: () => {},
  Int: () => {},
  Date: () => {},
  Bit: () => {},
  Decimal: () => {},
  DateTime: () => {},
  Text: () => {},
  NText: () => {},
  Float: () => {},
  MAX: 'MAX',
  TVP: 'TVP',
  Table: class {
    constructor() {
      this.columnsList = [];
      this.columns = {
        add: (name) => { this.columnsList.push(name); }
      };
      this.rowsArray = [];
      this.rows = {
        add: (...args) => { this.rowsArray.push(args); }
      };
    }
  }
};
