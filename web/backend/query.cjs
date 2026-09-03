const sql = require('mssql');
async function run() {
  try {
    const pool = await new sql.ConnectionPool({
      server: 'localhost',
      database: 'HOMEDORM4',
      user: 'sa',
      password: '123456',
      options: { encrypt: false, trustServerCertificate: true }
    }).connect();
    
    // Check columns in PhieuDangKy
    const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'PhieuDangKy' ORDER BY ORDINAL_POSITION");
    console.log('PhieuDangKy columns:', res.recordset.map(r => r.COLUMN_NAME));
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}
run();
