const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres:Nhatvy1707%40@db.dzyjchpbrqasblnvzjkk.supabase.co:5432/postgres';

async function verify() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase!');

    const res = await client.query('SELECT * FROM "SP_DanhSachDatCocSale"() LIMIT 5;');
    console.log('SP_DanhSachDatCocSale test result count:', res.rows.length);

    const res2 = await client.query('SELECT * FROM "SP_Admin_DanhSachNhanVien"() LIMIT 5;');
    console.log('SP_Admin_DanhSachNhanVien test result count:', res2.rows.length);

    await client.end();
  } catch (err) {
    console.error('Verify error:', err);
  }
}

verify();
