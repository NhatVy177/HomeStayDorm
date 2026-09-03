const { Client } = require('../backend/node_modules/pg');

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function testCalls() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Testing SP_HoaDon_CapNhatNoQuaHan...');
  try {
    const res1 = await client.query('SELECT * FROM sp_hoadon_capnhatnoquahan();');
    console.log('Result 1:', res1.rows);
  } catch (e) {
    console.error('Error 1:', e.message);
  }

  console.log('\nTesting SP_NhaChoCocHetHan...');
  try {
    const res2 = await client.query('SELECT * FROM sp_nha_cho_coc_het_han();');
    console.log('Result 2:', res2.rows);
  } catch (e) {
    console.error('Error 2:', e.message);
  }

  console.log('\nTesting SP_DanhSachPhongDaXem with arg...');
  try {
    const res3 = await client.query('SELECT * FROM sp_danh_sach_phong_da_xem($1);', ['PDK001']);
    console.log('Result 3 count:', res3.rows.length);
  } catch (e) {
    console.error('Error 3:', e.message);
  }

  await client.end();
}

testCalls();
