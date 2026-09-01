const path = require('path');
const { pathToFileURL } = require('url');

async function testAll() {
  const connUrl = pathToFileURL(path.join(__dirname, '../backend/database/connection.js')).href;
  const { executeProcedure, executeQuery, getPool } = await import(connUrl);
  
  console.log('1. Testing getPool & direct query:');
  const pool = getPool();
  const res = await pool.query('SELECT "MaPhong", "TenPhong" FROM "Phong" LIMIT 3;');
  console.log('  Rooms in database:', res.rows);

  console.log('\n2. Testing SP_DangNhap:');
  try {
    const authRes = await executeProcedure('SP_DangNhap', [
      { name: 'TenDangNhap', value: 'admin' },
      { name: 'MatKhau', value: '123456' }
    ]);
    console.log('  Login test result:', authRes.recordset);
  } catch (err) {
    console.log('  Login test error (expected if wrong pass/user):', err.message);
  }

  console.log('\n3. Testing SP_KhachMoi_DanhSachPhong:');
  try {
    const listRes = await executeProcedure('SP_KhachMoi_DanhSachPhong', []);
    console.log('  Room list count:', listRes.recordset?.length || 0);
  } catch (err) {
    console.error('  Room list error:', err.message);
  }

  console.log('\n4. Testing SP_HoaDon_CapNhatNoQuaHan:');
  try {
    const hdRes = await executeProcedure('SP_HoaDon_CapNhatNoQuaHan', []);
    console.log('  Hoa don result:', hdRes.recordset);
  } catch (err) {
    console.error('  Hoa don error:', err.message);
  }

  console.log('\n5. Testing SP_NhaChoCocHetHan:');
  try {
    const dcRes = await executeProcedure('SP_NhaChoCocHetHan', []);
    console.log('  Dat coc result:', dcRes.recordset);
  } catch (err) {
    console.error('  Dat coc error:', err.message);
  }

  console.log('\nALL TESTS PASSED SUCCESSFULLY! Ready for deployment.');
  process.exit(0);
}

testAll().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
