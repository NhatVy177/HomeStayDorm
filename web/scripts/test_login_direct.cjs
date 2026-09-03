const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function testLogin() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!\n');

  // Check what sp_dang_nhap returns
  try {
    const r = await client.query(`SELECT p.proname, pg_get_function_arguments(p.oid) as args FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname ILIKE '%dang_nhap%'`);
    console.log('SP_DangNhap variants on Supabase:');
    r.rows.forEach(row => console.log(` - ${row.proname}(${row.args})`));
  } catch (e) {
    console.error('Query error:', e.message);
  }

  // Try calling with actual credentials (any user in DB)
  console.log('\nTrying to call sp_dang_nhap with test credentials...');
  try {
    // First find a valid user
    const users = await client.query(`SELECT tk."TenDangNhap", tk."MaNguoiDung" FROM "TaiKhoan" tk LIMIT 3`);
    console.log('Existing users:', users.rows);

    if (users.rows.length > 0) {
      const testUser = users.rows[0].TenDangNhap;
      const testPwd = users.rows[0].MatKhau;
      console.log(`\nTrying login as: ${testUser}`);
      
      // Get raw password hash from DB first
      const rawUser = await client.query(`SELECT "TenDangNhap", "MatKhau" FROM "TaiKhoan" LIMIT 5`);
      console.log('Raw users from DB:', rawUser.rows);
      
      // Try sp_dang_nhap
      try {
        const res = await client.query(`SELECT * FROM sp_dang_nhap($1, $2)`, [testUser, '123456']);
        console.log('sp_dang_nhap result:');
        console.log('Row keys:', Object.keys(res.rows[0] || {}));
        console.log('Data:', JSON.stringify(res.rows[0], null, 2));
      } catch(e2) {
        console.log('sp_dang_nhap error:', e2.message);
        // Try with capitalized SP
        try {
          const res2 = await client.query(`SELECT * FROM "sp_dang_nhap"($1, $2)`, [testUser, '123456']);
          console.log('Result2:', res2.rows);
        } catch(e3) {
          console.log('Error2:', e3.message);
        }
      }
    }
  } catch(e) {
    console.error('Error:', e.message);
  }

  await client.end();
}

testLogin().catch(e => { console.error(e); process.exit(1); });
