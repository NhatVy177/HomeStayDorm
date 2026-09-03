const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function listUsers() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const r = await client.query(`
    SELECT tk."TenDangNhap", tk."MaNguoiDung", tk."MatKhau", nd."HoTen", nd."LoaiNguoiDung", nv."ChucVu"
    FROM "TaiKhoan" tk
    LEFT JOIN "NguoiDung" nd ON nd."MaNguoiDung" = tk."MaNguoiDung"
    LEFT JOIN "NhanVien" nv ON nv."MaNhanVien" = tk."MaNguoiDung"
    ORDER BY tk."TenDangNhap"
  `);

  console.log(`Total accounts: ${r.rows.length}`);
  console.table(r.rows.map(row => ({
    TenDangNhap: row.TenDangNhap,
    MaNguoiDung: row.MaNguoiDung,
    HoTen: row.HoTen,
    LoaiNguoiDung: row.LoaiNguoiDung,
    ChucVu: row.ChucVu,
    MatKhau: row.MatKhau ? row.MatKhau.substring(0, 10) + '...' : null
  })));

  await client.end();
}

listUsers().catch(console.error);
