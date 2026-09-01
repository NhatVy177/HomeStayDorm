const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function listAllFunctions() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `);
    
    console.log(`Found ${res.rows.length} functions in public schema:\n`);
    res.rows.forEach(r => {
      console.log(`${r.function_name}(${r.arguments}) -> ${r.return_type}`);
    });
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

listAllFunctions();
