const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function updateAuthSP() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase!\n');

  // 1. Reset all password hashes in TaiKhoan back to SQL Server default '123' hash:
  // A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3
  console.log('Updating password hashes to support 123...');
  await client.query(`
    UPDATE "TaiKhoan"
    SET "MatKhau" = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
  `);

  // 2. Update sp_dang_nhap to support BOTH '123' and '123456' seamlessly!
  console.log('Deploying flexible sp_dang_nhap function...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.sp_dang_nhap(p_ten_dang_nhap character varying, p_mat_khau character varying)
    RETURNS TABLE(
      "tenDangNhap" character varying,
      "maNguoiDung" character varying,
      "hoTen" character varying,
      "ngaySinh" date,
      "gioiTinh" character varying,
      email character varying,
      "soDienThoai" character varying,
      "vaiTro" character varying,
      "trangThai" character varying,
      "chucVu" character varying,
      "maChiNhanh" character varying,
      "quocTich" character varying,
      cccd character varying
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_ten_dang_nhap varchar(50);
      v_hash varchar(64);
    BEGIN
      v_ten_dang_nhap := btrim(COALESCE(p_ten_dang_nhap, ''));

      v_hash := upper(encode(digest(COALESCE(p_mat_khau, ''), 'sha256'), 'hex'));

      IF NOT EXISTS (
        SELECT 1
        FROM "TaiKhoan" tk
        WHERE lower(tk."TenDangNhap") = lower(v_ten_dang_nhap)
          AND (
            upper(tk."MatKhau") = v_hash
            -- Allow both '123' and '123456'
            OR (p_mat_khau IN ('123', '123456') AND upper(tk."MatKhau") IN ('A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', '8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92'))
          )
      ) THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM "TaiKhoan" tk
        WHERE lower(tk."TenDangNhap") = lower(v_ten_dang_nhap)
          AND tk."TrangThai" = 'Vô hiệu hóa'
      ) THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'Tài khoản đã bị vô hiệu hóa.';
      END IF;

      RETURN QUERY
      SELECT
        tk."TenDangNhap"::VARCHAR AS "tenDangNhap",
        tk."MaNguoiDung"::VARCHAR AS "maNguoiDung",
        nd."HoTen"::VARCHAR AS "hoTen",
        nd."NgaySinh"::DATE AS "ngaySinh",
        nd."GioiTinh"::VARCHAR AS "gioiTinh",
        nd."Email"::VARCHAR AS email,
        nd."SDT"::VARCHAR AS "soDienThoai",
        nd."LoaiNguoiDung"::VARCHAR AS "vaiTro",
        tk."TrangThai"::VARCHAR AS "trangThai",
        nv."ChucVu"::VARCHAR AS "chucVu",
        nv."MaChiNhanh"::VARCHAR AS "maChiNhanh",
        kh."QuocTich"::VARCHAR AS "quocTich",
        kh."CCCD"::VARCHAR AS cccd
      FROM "TaiKhoan" tk
      INNER JOIN "NguoiDung" nd ON nd."MaNguoiDung" = tk."MaNguoiDung"
      LEFT JOIN "NhanVien" nv ON nv."MaNhanVien" = tk."MaNguoiDung"
      LEFT JOIN "KhachHang" kh ON kh."MaKhachHang" = tk."MaNguoiDung"
      WHERE lower(tk."TenDangNhap") = lower(v_ten_dang_nhap);
    END;
    $$;
  `);

  console.log('Testing login with nv0001 and password 123...');
  const test1 = await client.query(`SELECT * FROM sp_dang_nhap($1, $2)`, ['nv0001', '123']);
  console.log('Test 1 (nv0001 with 123):', test1.rows[0]);

  console.log('\nTesting login with kh0015 and password 123...');
  const test2 = await client.query(`SELECT * FROM sp_dang_nhap($1, $2)`, ['kh0015', '123']);
  console.log('Test 2 (kh0015 with 123):', test2.rows[0]);

  await client.end();
  console.log('\nSUCCESS!');
}

updateAuthSP().catch(console.error);
