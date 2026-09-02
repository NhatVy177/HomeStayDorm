const path = require('path');
const { pathToFileURL } = require('url');

async function testDangNhapService() {
  process.env.DATABASE_URL = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
  
  const authUrl = pathToFileURL(path.join(__dirname, '../backend/services/auth.service.js')).href;
  const { dangNhap } = await import(authUrl);

  console.log('--- TEST 1: kh0015 with 123 ---');
  const resKh = await dangNhap({ tenDangNhap: 'kh0015', matKhau: '123' });
  console.log('Customer User Object:', resKh.user);

  console.log('\n--- TEST 2: nv0001 with 123 ---');
  const resSale = await dangNhap({ tenDangNhap: 'nv0001', matKhau: '123' });
  console.log('Sale User Object:', resSale.user);

  console.log('\n--- TEST 3: nv0013 with 123 ---');
  const resAdmin = await dangNhap({ tenDangNhap: 'nv0013', matKhau: '123' });
  console.log('Admin User Object:', resAdmin.user);

  process.exit(0);
}

testDangNhapService().catch(e => { console.error('FAILED:', e); process.exit(1); });
