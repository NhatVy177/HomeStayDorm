const fs = require('fs');
const path = require('path');

function cleanTsql(text) {
  // Remove BOM if present
  let s = text.replace(/^\uFEFF/, '');

  // Remove USE and GO
  s = s.replace(/^\s*USE\s+\[?[a-zA-Z0-9_]+\]?;?\s*$/gmi, '');
  s = s.replace(/^\s*GO\s*$/gmi, '');
  s = s.replace(/SET\s+NOCOUNT\s+ON;?/gi, '');
  s = s.replace(/SET\s+XACT_ABORT\s+ON;?/gi, '');
  s = s.replace(/SET\s+QUOTED_IDENTIFIER\s+ON;?/gi, '');
  s = s.replace(/SET\s+ANSI_NULLS\s+ON;?/gi, '');
  s = s.replace(/IF\s+OBJECT_ID\([^)]+\)\s+IS\s+NULL\s+EXEC\([^)]+\);?/gi, '');

  return s;
}

// Convert a single T-SQL CREATE PROCEDURE block into PostgreSQL function
function convertProcedure(block) {
  // Extract procedure name and parameters
  const headerMatch = block.match(/CREATE(?:\s+OR\s+ALTER)?\s+PROCEDURE\s+(?:dbo\.)?([a-zA-Z0-9_]+)([\s\S]*?)\bAS\b/i);
  if (!headerMatch) return null;

  const procName = headerMatch[1];
  const paramsRaw = headerMatch[2].trim();
  const bodyRaw = block.substring(headerMatch.index + headerMatch[0].length).trim();

  // Parse parameters: @Name TYPE [= DEFAULT] [OUTPUT]
  const paramLines = [];
  const params = [];
  if (paramsRaw) {
    // Split by comma taking into account types like DECIMAL(15,2)
    const paramRegex = /@([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?)(?:\s*=\s*([^,]+?))?(?:\s+OUTPUT)?(?=,|$)/gi;
    let m;
    while ((m = paramRegex.exec(paramsRaw)) !== null) {
      let pName = m[1];
      let pType = m[2].toUpperCase().trim();
      let pDef = m[3] ? m[3].trim() : null;

      // Type mapping
      pType = pType.replace(/\bNVARCHAR\(MAX\)/g, 'TEXT')
                   .replace(/\bVARCHAR\(MAX\)/g, 'TEXT')
                   .replace(/\bNVARCHAR\b/g, 'VARCHAR')
                   .replace(/\bNCHAR\b/g, 'CHAR')
                   .replace(/\bDATETIME2\(\d+\)/g, 'TIMESTAMP')
                   .replace(/\bDATETIME2\b/g, 'TIMESTAMP')
                   .replace(/\bDATETIME\b/g, 'TIMESTAMP')
                   .replace(/\bBIT\b/g, 'BOOLEAN');

      let defStr = '';
      if (pDef !== null) {
        if (pDef.toUpperCase() === 'NULL') defStr = ' DEFAULT NULL';
        else if (pDef.startsWith("N'")) defStr = ` DEFAULT '${pDef.substring(2)}`;
        else defStr = ` DEFAULT ${pDef}`;
      }
      params.push(`p_${pName} ${pType}${defStr}`);
    }
  }

  // Convert Body
  let body = bodyRaw;

  // Replace variable declarations
  // DECLARE @a TYPE, @b TYPE = val;
  const declareVars = [];
  body = body.replace(/DECLARE\s+@([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?)(?:\s*=\s*([^,;]+))?/gi, (match, vName, vType, vVal) => {
    let t = vType.toUpperCase().trim()
                 .replace(/\bNVARCHAR\(MAX\)/g, 'TEXT')
                 .replace(/\bVARCHAR\(MAX\)/g, 'TEXT')
                 .replace(/\bNVARCHAR\b/g, 'VARCHAR')
                 .replace(/\bDATETIME2\(\d+\)/g, 'TIMESTAMP')
                 .replace(/\bDATETIME2\b/g, 'TIMESTAMP')
                 .replace(/\bDATETIME\b/g, 'TIMESTAMP')
                 .replace(/\bBIT\b/g, 'BOOLEAN');
    if (vVal) {
      declareVars.push(`v_${vName} ${t} := ${vVal.trim().replace(/^N'/g, "'")};`);
    } else {
      declareVars.push(`v_${vName} ${t};`);
    }
    return '';
  });

  // Parameter references @Name -> p_Name (when in param list) or v_Name
  const paramNames = new Set();
  if (paramsRaw) {
    const prRegex = /@([a-zA-Z0-9_]+)/gi;
    let pm;
    while ((pm = prRegex.exec(paramsRaw)) !== null) {
      paramNames.add(pm[1].toLowerCase());
    }
  }

  // Replace all @VarName in body
  body = body.replace(/@([a-zA-Z0-9_]+)/g, (match, v) => {
    if (paramNames.has(v.toLowerCase())) {
      return `p_${v}`;
    }
    return `v_${v}`;
  });

  // T-SQL syntax transformations
  body = body.replace(/N'([^']*(?:''[^']*)*)'/g, "'$1'");
  body = body.replace(/\bGETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
  body = body.replace(/\bSYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP');
  body = body.replace(/\bISNULL\s*\(/gi, 'COALESCE(');
  body = body.replace(/\bLEN\s*\(/gi, 'LENGTH(');
  body = body.replace(/\bLTRIM\s*\(\s*RTRIM\s*\(/gi, 'TRIM(');
  body = body.replace(/TRY_CONVERT\s*\(\s*INT\s*,\s*([^)]+)\)/gi, "CASE WHEN ($1) ~ '^[0-9]+$' THEN ($1)::INT ELSE NULL END");

  body = body.replace(/THROW\s+\d+\s*,\s*([^,;]+)\s*,\s*\d+;?/gi, 'RAISE EXCEPTION %;', '$1');
  body = body.replace(/RAISERROR\s*\(\s*([^,]+)\s*,\s*\d+\s*,\s*\d+\s*\);?/gi, 'RAISE EXCEPTION %;', '$1');
  body = body.replace(/WITH\s*\(\s*(?:UPDLOCK\s*,\s*HOLDLOCK|UPDLOCK|HOLDLOCK|NOLOCK|READPAST)\s*\)/gi, '');

  // SET v_x = val -> v_x := val
  body = body.replace(/SET\s+([pv]_[a-zA-Z0-9_]+)\s*=\s*([^;]+);/gi, '$1 := $2;');

  // SELECT TOP (1) v_x = col FROM ... -> SELECT col INTO v_x FROM ... LIMIT 1;
  body = body.replace(/SELECT\s+TOP\s*\(\s*1\s*\)\s+([pv]_[a-zA-Z0-9_]+)\s*=\s*([^,;]+)\s+FROM\s+/gi, 'SELECT $2 INTO $1 FROM ');
  body = body.replace(/SELECT\s+([pv]_[a-zA-Z0-9_]+)\s*=\s*([^,;]+)\s+FROM\s+/gi, 'SELECT $2 INTO $1 FROM ');

  // IF EXISTS (SELECT ...) BEGIN ... END -> IF EXISTS (SELECT ...) THEN ... END IF;
  // Let's handle IF statements cleanly

  return {
    name: procName,
    params: params.join(', '),
    declare: declareVars.join('\n    '),
    body: body.trim()
  };
}

module.exports = { cleanTsql, convertProcedure };
