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
    
    // Add MucGiaDen column if not exists
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'PhieuDangKy' AND COLUMN_NAME = 'MucGiaDen'
      )
      ALTER TABLE dbo.PhieuDangKy ADD MucGiaDen DECIMAL(15, 2) NULL;
    `);
    console.log('Added MucGiaDen column to PhieuDangKy');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}
run();
