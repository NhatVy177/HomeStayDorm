const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres:Nhatvy1707%40@db.dzyjchpbrqasblnvzjkk.supabase.co:5432/postgres';

async function deployAuth() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase for Auth module deployment...');

    const authSql = `
-- SP_DangKy
CREATE OR REPLACE FUNCTION "SP_DangKy"(
    "TenDangNhap" VARCHAR(50),
    "MatKhau" VARCHAR(255),
    "HoTen" VARCHAR(100),
    "NgaySinh" DATE,
    "GioiTinh" VARCHAR(5),
    "SDT" VARCHAR(20),
    "Email" VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    "tenDangNhap" VARCHAR,
    "maNguoiDung" VARCHAR,
    "hoTen" VARCHAR,
    "ngaySinh" DATE,
    "gioiTinh" VARCHAR,
    "email" VARCHAR,
    "soDienThoai" VARCHAR,
    "vaiTro" VARCHAR,
    "trangThai" VARCHAR,
    "chucVu" VARCHAR,
    "maChiNhanh" VARCHAR,
    "quocTich" VARCHAR,
    "cccd" VARCHAR
)
AS $$
DECLARE
    v_TenDangNhap VARCHAR(50) := TRIM("TenDangNhap");
    v_HoTen VARCHAR(100) := TRIM("HoTen");
    v_GioiTinh VARCHAR(5) := NULLIF(TRIM("GioiTinh"), '');
    v_SDT VARCHAR(20) := NULLIF(TRIM("SDT"), '');
    v_Email VARCHAR(100) := NULLIF(TRIM("Email"), '');
    v_MaNguoiDung VARCHAR(6);
    v_SoThuTu INT;
BEGIN
    IF NULLIF(v_TenDangNhap, '') IS NULL
       OR NULLIF(v_HoTen, '') IS NULL
       OR NULLIF("MatKhau", '') IS NULL
       OR "NgaySinh" IS NULL
       OR v_GioiTinh IS NULL
       OR v_GioiTinh NOT IN ('Nam', 'Nữ')
       OR v_SDT IS NULL THEN
        RAISE EXCEPTION 'Vui lòng nhập đầy đủ họ tên, tên đăng nhập, giới tính, số điện thoại, ngày sinh và mật khẩu.';
    END IF;

    IF LENGTH(v_SDT) <> 10 OR v_SDT ~ '[^0-9]' THEN
        RAISE EXCEPTION 'Số điện thoại phải có đúng 10 chữ số.';
    END IF;

    IF "NgaySinh" >= CURRENT_DATE THEN
        RAISE EXCEPTION 'Ngày sinh phải trước ngày hiện tại.';
    END IF;

    IF EXISTS (SELECT 1 FROM "TaiKhoan" WHERE "TenDangNhap" = v_TenDangNhap) THEN
        RAISE EXCEPTION 'Tên đăng nhập đã tồn tại.';
    END IF;

    SELECT nd."MaNguoiDung" INTO v_MaNguoiDung
    FROM "NguoiDung" nd
    JOIN "KhachHang" kh ON kh."MaKhachHang" = nd."MaNguoiDung"
    WHERE nd."SDT" = v_SDT AND nd."LoaiNguoiDung" = 'KhachHang'
    LIMIT 1;

    IF v_MaNguoiDung IS NOT NULL AND EXISTS (
        SELECT 1 FROM "TaiKhoan" WHERE "MaNguoiDung" = v_MaNguoiDung
    ) THEN
        RAISE EXCEPTION 'Số điện thoại này đã được liên kết với một tài khoản. Vui lòng đăng nhập.';
    END IF;

    IF v_MaNguoiDung IS NULL THEN
        SELECT COALESCE(MAX(CASE WHEN SUBSTRING("MaNguoiDung", 3, 4) ~ '^[0-9]+$' THEN SUBSTRING("MaNguoiDung", 3, 4)::INT ELSE 0 END), 0) + 1
        INTO v_SoThuTu
        FROM "NguoiDung"
        WHERE "MaNguoiDung" LIKE 'KH%';

        IF v_SoThuTu > 9999 THEN
            RAISE EXCEPTION 'Không thể cấp thêm mã khách hàng.';
        END IF;

        v_MaNguoiDung := 'KH' || LPAD(v_SoThuTu::TEXT, 4, '0');

        INSERT INTO "NguoiDung" ("MaNguoiDung", "HoTen", "NgaySinh", "GioiTinh", "SDT", "Email", "LoaiNguoiDung")
        VALUES (v_MaNguoiDung, v_HoTen, "NgaySinh", v_GioiTinh, v_SDT, v_Email, 'KhachHang');

        INSERT INTO "KhachHang" ("MaKhachHang", "QuocTich", "CCCD")
        VALUES (v_MaNguoiDung, NULL, NULL);
    ELSE
        UPDATE "NguoiDung"
        SET "Email" = COALESCE("Email", v_Email)
        WHERE "MaNguoiDung" = v_MaNguoiDung;
    END IF;

    INSERT INTO "TaiKhoan" ("TenDangNhap", "MatKhau", "TrangThai", "MaNguoiDung")
    VALUES (
        v_TenDangNhap,
        UPPER(encode(digest("MatKhau", 'sha256'), 'hex')),
        'Hoạt động',
        v_MaNguoiDung
    );

    RETURN QUERY
    SELECT
        tk."TenDangNhap"::VARCHAR AS "tenDangNhap",
        tk."MaNguoiDung"::VARCHAR AS "maNguoiDung",
        nd."HoTen"::VARCHAR AS "hoTen",
        nd."NgaySinh"::DATE AS "ngaySinh",
        nd."GioiTinh"::VARCHAR AS "gioiTinh",
        nd."Email"::VARCHAR AS "email",
        nd."SDT"::VARCHAR AS "soDienThoai",
        nd."LoaiNguoiDung"::VARCHAR AS "vaiTro",
        tk."TrangThai"::VARCHAR AS "trangThai",
        nv."ChucVu"::VARCHAR AS "chucVu",
        nv."MaChiNhanh"::VARCHAR AS "maChiNhanh",
        kh."QuocTich"::VARCHAR AS "quocTich",
        kh."CCCD"::VARCHAR AS "cccd"
    FROM "TaiKhoan" tk
    JOIN "NguoiDung" nd ON nd."MaNguoiDung" = tk."MaNguoiDung"
    LEFT JOIN "NhanVien" nv ON nv."MaNhanVien" = tk."MaNguoiDung"
    LEFT JOIN "KhachHang" kh ON kh."MaKhachHang" = tk."MaNguoiDung"
    WHERE tk."TenDangNhap" = v_TenDangNhap;
END;
$$ LANGUAGE plpgsql;

-- SP_DangNhap
CREATE OR REPLACE FUNCTION "SP_DangNhap"(
    "TenDangNhap" VARCHAR(50),
    "MatKhau" VARCHAR(255)
)
RETURNS TABLE (
    "tenDangNhap" VARCHAR,
    "maNguoiDung" VARCHAR,
    "hoTen" VARCHAR,
    "ngaySinh" DATE,
    "gioiTinh" VARCHAR,
    "email" VARCHAR,
    "soDienThoai" VARCHAR,
    "vaiTro" VARCHAR,
    "trangThai" VARCHAR,
    "chucVu" VARCHAR,
    "maChiNhanh" VARCHAR,
    "quocTich" VARCHAR,
    "cccd" VARCHAR
)
AS $$
DECLARE
    v_TenDangNhap VARCHAR(50) := TRIM("TenDangNhap");
    v_HashedPassword VARCHAR(64) := UPPER(encode(digest("MatKhau", 'sha256'), 'hex'));
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "TaiKhoan"
        WHERE "TenDangNhap" = v_TenDangNhap
          AND UPPER("MatKhau") = v_HashedPassword
    ) THEN
        RAISE EXCEPTION 'Tên đăng nhập hoặc mật khẩu không đúng.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "TaiKhoan"
        WHERE "TenDangNhap" = v_TenDangNhap
          AND "TrangThai" = 'Vô hiệu hóa'
    ) THEN
        RAISE EXCEPTION 'Tài khoản đã bị vô hiệu hóa.';
    END IF;

    RETURN QUERY
    SELECT
        tk."TenDangNhap"::VARCHAR AS "tenDangNhap",
        tk."MaNguoiDung"::VARCHAR AS "maNguoiDung",
        nd."HoTen"::VARCHAR AS "hoTen",
        nd."NgaySinh"::DATE AS "ngaySinh",
        nd."GioiTinh"::VARCHAR AS "gioiTinh",
        nd."Email"::VARCHAR AS "email",
        nd."SDT"::VARCHAR AS "soDienThoai",
        nd."LoaiNguoiDung"::VARCHAR AS "vaiTro",
        tk."TrangThai"::VARCHAR AS "trangThai",
        nv."ChucVu"::VARCHAR AS "chucVu",
        nv."MaChiNhanh"::VARCHAR AS "maChiNhanh",
        kh."QuocTich"::VARCHAR AS "quocTich",
        kh."CCCD"::VARCHAR AS "cccd"
    FROM "TaiKhoan" tk
    JOIN "NguoiDung" nd ON nd."MaNguoiDung" = tk."MaNguoiDung"
    LEFT JOIN "NhanVien" nv ON nv."MaNhanVien" = tk."MaNguoiDung"
    LEFT JOIN "KhachHang" kh ON kh."MaKhachHang" = tk."MaNguoiDung"
    WHERE tk."TenDangNhap" = v_TenDangNhap;
END;
$$ LANGUAGE plpgsql;

-- SP_HoaDon_CapNhatNoQuaHan
CREATE OR REPLACE FUNCTION "SP_HoaDon_CapNhatNoQuaHan"(
    "NgayHienTai" DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    "SoLuongCapNhat" INT
)
AS $$
DECLARE
    v_Count INT := 0;
BEGIN
    UPDATE "HoaDon"
    SET "TrangThai" = 'Nợ quá hạn'
    WHERE "TrangThai" = 'Chưa thanh toán'
      AND "HanThanhToan" IS NOT NULL
      AND "HanThanhToan" < "NgayHienTai";

    GET DIAGNOSTICS v_Count = ROW_COUNT;

    RETURN QUERY SELECT v_Count;
END;
$$ LANGUAGE plpgsql;
    `;

    await client.query(authSql);
    console.log('Auth module procedures deployed successfully!');
    await client.end();
  } catch (err) {
    console.error('Auth deployment error:', err);
  }
}

deployAuth();
