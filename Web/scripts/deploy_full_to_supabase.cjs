const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
const fs = require('fs');

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
const sqlFile = path.join(__dirname, '../../Database/supabase_all_procedures_and_triggers.sql');

// Split by CREATE OR REPLACE FUNCTION / CREATE TRIGGER / DROP TRIGGER
function splitStatements(sql) {
  // Split on statement boundaries: each CREATE OR REPLACE / DROP TRIGGER / CREATE TRIGGER
  const parts = [];
  const regex = /(CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|TRIGGER)|DROP\s+TRIGGER\s+IF\s+EXISTS)/gi;
  let lastIndex = 0;
  let match;
  const matches = [];
  
  while ((match = regex.exec(sql)) !== null) {
    matches.push(match.index);
  }
  
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1] : sql.length;
    const stmt = sql.substring(start, end).trim();
    if (stmt) parts.push(stmt);
  }
  
  // Add content before first match as header (SET timezone, CREATE EXTENSION, etc.)
  if (matches.length > 0 && matches[0] > 0) {
    const header = sql.substring(0, matches[0]).trim();
    if (header) parts.unshift(header);
  }
  
  return parts;
}

async function deployAll() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase!\n');

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(`SQL file: ${(sql.length / 1024).toFixed(1)} KB\n`);

    const stmts = splitStatements(sql);
    console.log(`Total statements to deploy: ${stmts.length}\n`);

    let success = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      if (!stmt || stmt.length < 5) continue;
      try {
        await client.query(stmt);
        success++;
        if (success % 20 === 0) {
          console.log(`  Progress: ${success} deployed so far...`);
        }
      } catch (err) {
        const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
        errors.push({ i, preview, error: err.message });
        skipped++;
      }
    }

    console.log(`\n========================================`);
    console.log(`DEPLOY COMPLETE:`);
    console.log(`  SUCCESS: ${success}`);
    console.log(`  ERRORS:  ${skipped}`);
    console.log(`========================================`);

    if (errors.length > 0) {
      console.log('\nFailed statements:');
      errors.forEach(e => {
        console.log(`  [${e.i}] ${e.preview}`);
        console.log(`       Error: ${e.error}`);
      });
    }

    // Final count
    const funcs = await client.query(`
      SELECT COUNT(*) as cnt FROM information_schema.routines WHERE routine_schema = 'public';
    `);
    console.log(`\nTotal functions on Supabase now: ${funcs.rows[0].cnt}`);

    await client.end();
  } catch (err) {
    console.error('Fatal error:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

deployAll();
