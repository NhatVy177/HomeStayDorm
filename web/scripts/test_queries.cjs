const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres:Nhatvy1707%40@db.dzyjchpbrqasblnvzjkk.supabase.co:5432/postgres';

async function test() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase!');

    const res = await client.query('SELECT * FROM "SP_Admin_DanhSachNhanVien"() LIMIT 3;');
    console.log('SP_Admin_DanhSachNhanVien result:');
    console.table(res.rows);

    const res2 = await client.query('SELECT * FROM "SP_Admin_QuanLyChiNhanh"(\'SELECT\') LIMIT 3;');
    console.log('SP_Admin_QuanLyChiNhanh result:');
    console.table(res2.rows);

    await client.end();
  } catch (err) {
    console.error('Test query error:', err);
  }
}

test();
