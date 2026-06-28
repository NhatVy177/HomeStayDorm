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
    
    await pool.request().query("UPDATE dbo.PhieuDangKy SET YeuCauKhac = REPLACE(REPLACE(REPLACE(REPLACE(YeuCauKhac, NCHAR(10) + N'Hình thức mong muốn: Ghép nữ', ''), NCHAR(10) + N'Hình thức mong muốn: Ghép nam', ''), N'Hình thức mong muốn: Ghép nữ', ''), N'Hình thức mong muốn: Ghép nam', '') WHERE YeuCauKhac LIKE N'%Hình thức mong muốn:%'");
    console.log('Cleaned up GhiChu in DB');
    process.exit(0);
  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}
run();
