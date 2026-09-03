const fs = require('fs');
const path = require('path');

// Helper to convert T-SQL text to PostgreSQL text
function convertTsqlBodyToPlpgsql(body) {
  let s = body;

  // 1. Remove USE and GO
  s = s.replace(/^\s*USE\s+\[?[a-zA-Z0-9_]+\]?;?\s*$/gmi, '');
  s = s.replace(/^\s*GO\s*$/gmi, '');
  s = s.replace(/SET\s+NOCOUNT\s+ON;?/gi, '');
  s = s.replace(/SET\s+XACT_ABORT\s+ON;?/gi, '');
  s = s.replace(/SET\s+QUOTED_IDENTIFIER\s+ON;?/gi, '');

  // 2. Types replacement
  s = s.replace(/\bNVARCHAR\(MAX\)/gi, 'TEXT');
  s = s.replace(/\bVARCHAR\(MAX\)/gi, 'TEXT');
  s = s.replace(/\bNVARCHAR\b/gi, 'VARCHAR');
  s = s.replace(/\bNCHAR\b/gi, 'CHAR');
  s = s.replace(/\bDATETIME2\(\d+\)/gi, 'TIMESTAMP');
  s = s.replace(/\bDATETIME2\b/gi, 'TIMESTAMP');
  s = s.replace(/\bDATETIME\b/gi, 'TIMESTAMP');
  s = s.replace(/\bBIT\b/gi, 'BOOLEAN');

  // 3. String literals with N'...' -> '...'
  s = s.replace(/N'([^']*(?:''[^']*)*)'/g, "'$1'");

  // 4. Built-in functions
  s = s.replace(/\bGETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
  s = s.replace(/\bSYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP');
  s = s.replace(/\bISNULL\s*\(/gi, 'COALESCE(');
  s = s.replace(/\bLEN\s*\(/gi, 'LENGTH(');
  s = s.replace(/\bLTRIM\s*\(\s*RTRIM\s*\(/gi, 'TRIM(');

  // 5. TRY_CONVERT(INT, x) -> CASE WHEN x ~ '^[0-9]+$' THEN x::INT ELSE NULL END
  s = s.replace(/TRY_CONVERT\s*\(\s*INT\s*,\s*([^)]+)\)/gi, "CASE WHEN ($1) ~ '^[0-9]+$' THEN ($1)::INT ELSE NULL END");

  // 6. THROW / RAISERROR
  s = s.replace(/THROW\s+\d+\s*,\s*([^,;]+)\s*,\s*\d+;?/gi, (m, msg) => {
    return `RAISE EXCEPTION ${msg};`;
  });
  s = s.replace(/RAISERROR\s*\(\s*([^,]+)\s*,\s*\d+\s*,\s*\d+\s*\);?/gi, (m, msg) => {
    return `RAISE EXCEPTION ${msg};`;
  });

  // 7. Locking hints
  s = s.replace(/WITH\s*\(\s*(?:UPDLOCK\s*,\s*HOLDLOCK|UPDLOCK|HOLDLOCK|NOLOCK|READPAST)\s*\)/gi, '');

  return s;
}

console.log('Converter helper defined');
