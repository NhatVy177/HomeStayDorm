const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres:Nhatvy1707%40@db.dzyjchpbrqasblnvzjkk.supabase.co:5432/postgres';

async function testConnection() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected to Supabase successfully!');

    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");

    console.log('Existing tables in public schema:', res.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();
