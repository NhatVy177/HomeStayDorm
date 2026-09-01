const fs = require('fs');
const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

// Scan all JS files in backend for executeProcedure
function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (file !== 'node_modules') getFiles(full, files);
    } else if (file.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

const backendDir = path.join(__dirname, '../backend');
const files = getFiles(backendDir);
const spCalls = new Set();

const regex = /executeProcedure\s*\(\s*['"`]([^'"`]+)['"`]/g;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    spCalls.add(match[1]);
  }
}

async function verifySPs() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  const res = await client.query(`
    SELECT p.proname, pg_get_function_arguments(p.oid) as args
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
  `);
  
  const dbFuncs = new Map();
  res.rows.forEach(r => dbFuncs.set(r.proname.toLowerCase(), r));
  
  console.log(`Backend calls ${spCalls.size} unique SPs:`);
  
  for (const sp of spCalls) {
    let clean = sp.replace(/^dbo\./i, '').replace(/__+/g, '_');
    // Normalize to lowercase without special chars
    let snake = clean.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/__+/g, '_');
    let compact = clean.toLowerCase().replace(/_/g, '');
    
    // Find matching function in db
    let found = null;
    if (dbFuncs.has(snake)) {
      found = snake;
    } else if (dbFuncs.has(clean.toLowerCase())) {
      found = clean.toLowerCase();
    } else {
      // search by fuzzy match
      for (const [name] of dbFuncs) {
        if (name.replace(/_/g, '') === compact) {
          found = name;
          break;
        }
      }
    }
    
    if (found) {
      console.log(`  ✓ "${sp}" -> DB: "${found}" (${dbFuncs.get(found).args})`);
    } else {
      console.log(`  ✗ "${sp}" -> NOT FOUND IN SUPABASE!`);
    }
  }
  
  await client.end();
}

verifySPs();
