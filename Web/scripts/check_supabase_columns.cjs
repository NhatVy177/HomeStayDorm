const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function checkCols() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `);

    const tableMap = {};
    for (const r of res.rows) {
      if (!tableMap[r.table_name]) tableMap[r.table_name] = [];
      tableMap[r.table_name].push(r.column_name);
    }

    console.log('Columns per table:', JSON.stringify(tableMap, null, 2));

    await client.end();
  } catch (err) {
    console.error('Check cols error:', err);
  }
}

checkCols();
