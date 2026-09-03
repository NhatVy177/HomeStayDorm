const path = require('path');
const { pathToFileURL } = require('url');

async function testLogin() {
  const connUrl = pathToFileURL(path.join(__dirname, '../backend/database/connection.js')).href;
  const { executeProcedure, sql } = await import(connUrl);
  
  console.log('Testing SP_DangNhap and checking returned fields...');
  try {
    const result = await executeProcedure('dbo.SP_DangNhap', [
      { name: 'TenDangNhap', value: 'linhtran' },
      { name: 'MatKhau', value: '123456' }
    ]);
    console.log('\nRaw recordset[0]:');
    console.log(JSON.stringify(result.recordset[0], null, 2));
    console.log('\nAll field names returned:', Object.keys(result.recordset[0] || {}));
  } catch (err) {
    console.error('Login failed:', err.message);
  }
  
  process.exit(0);
}

testLogin().catch(e => { console.error(e); process.exit(1); });
