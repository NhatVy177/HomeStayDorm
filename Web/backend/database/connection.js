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
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

/**
 * Temporary wrapper to mimic mssql's executeProcedure
 */
export async function executeProcedure(procedureName, parameters = []) {
  const pool = getPool();
  // Remove 'dbo.' prefix and convert to snake_case
  let funcName = procedureName.replace(/^dbo\./i, '');
  funcName = funcName.replace(/^SP_/i, 'sp_'); // e.g. SP_LapHopDongThue -> sp_LapHopDongThue
  funcName = funcName.substring(0, 3) + toSnakeCase(funcName.substring(3)); // sp_lap_hop_dong_thue
  
  // Extract values, ignoring mssql types
  const values = parameters.map(p => {
    // If the value is a mssql TVP (Table), convert to JSON
    if (p.value && typeof p.value === 'object' && p.value.rowsArray) {
      // We need to map the TVP columns to keys for JSON
      const columns = p.value.columnsList;
      const jsonArr = p.value.rowsArray.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          // Convert column name to snake_case
          const snakeCol = toSnakeCase(col);
          obj[snakeCol] = row[i];
        });
        return obj;
      });
      return JSON.stringify(jsonArr);
    }
    return p.value;
  });
  
  const args = parameters.map((p, i) => {
    const paramName = 'p_' + toSnakeCase(p.name);
    return `${paramName} := $${i + 1}`;
  }).join(', ');
  
function toPascalCase(str) {
  if (str.includes('_')) {
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mapRowsToPascalCase(rows) {
  if (!rows) return rows;
  return rows.map(row => {
    const newRow = {};
    for (const key of Object.keys(row)) {
      newRow[toPascalCase(key)] = row[key];
    }
    return newRow;
  });
}

  const query = `SELECT * FROM "${funcName}"(${args});`;
  
  try {
    const result = await pool.query(query, values);
    const pascalRows = mapRowsToPascalCase(result.rows);
    
    // In mssql, SPs returning multiple tables use recordsets. 
    // Postgres returns JSON or records. Since our SPs were ported, we just return rows.
    return {
      recordset: pascalRows,
      recordsets: [pascalRows],
      output: pascalRows[0] || {} // Map output variables to the first row's columns
    };
  } catch (err) {
    console.error(`Error executing procedure ${funcName}:`, err.message);
    throw err;
  }
}

/**
 * Temporary wrapper to mimic mssql's executeQuery
 */
export async function executeQuery(sqlString, parameters = []) {
  const pool = getPool();
  let pgSql = sqlString;
  const values = [];
  
  parameters.forEach((param, index) => {
    // Replace @ParamName with $1, $2, etc.
    const regex = new RegExp(`@${param.name}\\b`, 'g');
    pgSql = pgSql.replace(regex, `$${index + 1}`);
    values.push(param.value);
  });
  
  // Attempt to fix dbo.
  pgSql = pgSql.replace(/dbo\./g, '"').replace(/([a-zA-Z0-9_]+)(\s)/g, (match, p1, p2) => {
      // Very naive quoting, real queries in repos need manual fixing
      return match;
  });

  try {
    const result = await pool.query(pgSql, values);
    return {
      recordset: result.rows,
      recordsets: [result.rows],
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
