import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(config).then(p => {
  return p.request()
    .input('KhachHangId', sql.VarChar, 'KH0001')
    .execute('dbo.SP_KhachMoi_DanhSachHoSo');
}).then(res => {
  console.log(res.recordset[0]);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
