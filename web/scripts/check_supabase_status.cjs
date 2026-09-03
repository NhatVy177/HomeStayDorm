const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function checkStatus() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase!\n');

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(`=== TABLES (${tables.rows.length}) ===`);
    tables.rows.forEach(r => console.log(' -', r.table_name));

    const funcs = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `);
    console.log(`\n=== FUNCTIONS/PROCEDURES (${funcs.rows.length}) ===`);
    funcs.rows.forEach(r => console.log(' -', r.routine_name));

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStatus();
