const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres:Nhatvy1707%40@db.dzyjchpbrqasblnvzjkk.supabase.co:5432/postgres';

async function deployAll() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL for Full Deployment!');

    // ----------------------------------------------------
    // MODULE: SP_DKyThue
    // ----------------------------------------------------
    console.log('Deploying SP_DKyThue module...');
    await client.query(`
-- SP_TaoHoSoDangKy
CREATE OR REPLACE FUNCTION "SP_TaoHoSoDangKy"(
    p_MaNguoiDung VARCHAR(6),
    p_HinhThucThue VARCHAR(50),
    p_MaChiNhanh VARCHAR(6),
    p_MaLoaiPhong VARCHAR(6),
    p_NgayBatDauThue DATE,
    p_ThoiGianThueThang INT,
    p_GhiChu TEXT DEFAULT NULL
)
RETURNS TABLE (
    "MaPhieuDangKy" VARCHAR,
    "TrangThai" VARCHAR,
    "Message" TEXT
)
AS $$
DECLARE
    v_MaPhieu VARCHAR(6);
    v_MaxNum INT;
BEGIN
    SELECT COALESCE(MAX(CASE WHEN SUBSTRING("MaPhieuDangKy", 4, 3) ~ '^[0-9]+$' THEN SUBSTRING("MaPhieuDangKy", 4, 3)::INT ELSE 0 END), 0) + 1
    INTO v_MaxNum
    FROM "PhieuDangKy";

    v_MaPhieu := 'PDK' || LPAD(v_MaxNum::TEXT, 3, '0');

    INSERT INTO "PhieuDangKy" (
        "MaPhieuDangKy", "NgayTao", "TrangThai", "GhiChu",
        "NgayBatDauThue", "ThoiGianThueThang", "HinhThucThue",
        "MaKhachHang", "MaChiNhanh"
    )
    VALUES (
        v_MaPhieu, CURRENT_TIMESTAMP, 'Chờ duyệt', p_GhiChu,
        p_NgayBatDauThue, p_ThoiGianThueThang, p_HinhThucThue,
        p_MaNguoiDung, p_MaChiNhanh
    );

    IF p_MaLoaiPhong IS NOT NULL THEN
        INSERT INTO "PDK_LoaiPhong" ("MaPhieuDangKy", "MaLoaiPhong")
        VALUES (v_MaPhieu, p_MaLoaiPhong);
    END IF;

    RETURN QUERY
    SELECT v_MaPhieu::VARCHAR, 'Chờ duyệt'::VARCHAR, 'Tạo hồ sơ đăng ký thành công'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP_DanhSachHoSoDangKy
CREATE OR REPLACE FUNCTION "SP_DanhSachHoSoDangKy"(
    p_MaChiNhanh VARCHAR(6) DEFAULT NULL,
    p_TrangThai VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    "MaPhieuDangKy" VARCHAR,
    "NgayTao" TIMESTAMP,
    "TrangThai" VARCHAR,
    "HinhThucThue" VARCHAR,
    "NgayBatDauThue" DATE,
    "ThoiGianThueThang" INT,
    "MaKhachHang" VARCHAR,
    "TenKhachHang" VARCHAR,
    "SDT" VARCHAR,
    "Email" VARCHAR,
    "MaChiNhanh" VARCHAR,
    "TenChiNhanh" VARCHAR,
    "MaLoaiPhong" VARCHAR,
    "TenLoaiPhong" VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pdk."MaPhieuDangKy"::VARCHAR,
        pdk."NgayTao"::TIMESTAMP,
        pdk."TrangThai"::VARCHAR,
        pdk."HinhThucThue"::VARCHAR,
        pdk."NgayBatDauThue"::DATE,
        pdk."ThoiGianThueThang"::INT,
        pdk."MaKhachHang"::VARCHAR,
        nd."HoTen"::VARCHAR AS "TenKhachHang",
        nd."SDT"::VARCHAR,
        nd."Email"::VARCHAR,
        pdk."MaChiNhanh"::VARCHAR,
        cn."TenChiNhanh"::VARCHAR,
        lp."MaLoaiPhong"::VARCHAR,
        lp."TenLoaiPhong"::VARCHAR
    FROM "PhieuDangKy" pdk
    JOIN "NguoiDung" nd ON nd."MaNguoiDung" = pdk."MaKhachHang"
    JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = pdk."MaChiNhanh"
    LEFT JOIN "PDK_LoaiPhong" pdklp ON pdklp."MaPhieuDangKy" = pdk."MaPhieuDangKy"
    LEFT JOIN "LoaiPhong" lp ON lp."MaLoaiPhong" = pdklp."MaLoaiPhong"
    WHERE (p_MaChiNhanh IS NULL OR pdk."MaChiNhanh" = p_MaChiNhanh)
      AND (p_TrangThai IS NULL OR pdk."TrangThai" = p_TrangThai)
    ORDER BY pdk."NgayTao" DESC;
END;
$$ LANGUAGE plpgsql;

-- SP_DanhSachPhongGiuongKhaDung
CREATE OR REPLACE FUNCTION "SP_DanhSachPhongGiuongKhaDung"(
    p_MaChiNhanh VARCHAR(6) DEFAULT NULL,
    p_MaLoaiPhong VARCHAR(6) DEFAULT NULL,
    p_GioiTinh VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    "MaPhong" VARCHAR,
    "TenPhong" VARCHAR,
    "GioiTinhChoPhep" VARCHAR,
    "TinhTrang" VARCHAR,
    "MaChiNhanh" VARCHAR,
    "TenChiNhanh" VARCHAR,
    "MaLoaiPhong" VARCHAR,
    "TenLoaiPhong" VARCHAR,
    "SucChuaToiDa" INT,
    "GiaThueTheoGiuong" DECIMAL,
    "GiaThueNguyenPhong" DECIMAL,
    "MaGiuong" VARCHAR,
    "SoGiuong" INT,
    "TrangThaiGiuong" VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p."MaPhong"::VARCHAR,
        p."TenPhong"::VARCHAR,
        p."GioiTinhChoPhep"::VARCHAR,
        p."TinhTrang"::VARCHAR,
        p."MaChiNhanh"::VARCHAR,
        cn."TenChiNhanh"::VARCHAR,
        p."MaLoaiPhong"::VARCHAR,
        lp."TenLoaiPhong"::VARCHAR,
        lp."SucChuaToiDa"::INT,
        lp."GiaThueTheoGiuong"::DECIMAL,
        lp."GiaThueNguyenPhong"::DECIMAL,
        g."MaGiuong"::VARCHAR,
        g."SoGiuong"::INT,
        g."TrangThai"::VARCHAR AS "TrangThaiGiuong"
    FROM "Phong" p
    JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = p."MaChiNhanh"
    JOIN "LoaiPhong" lp ON lp."MaLoaiPhong" = p."MaLoaiPhong"
    LEFT JOIN "Giuong" g ON g."MaPhong" = p."MaPhong"
    WHERE (p_MaChiNhanh IS NULL OR p."MaChiNhanh" = p_MaChiNhanh)
      AND (p_MaLoaiPhong IS NULL OR p."MaLoaiPhong" = p_MaLoaiPhong)
      AND (p_GioiTinh IS NULL OR p."GioiTinhChoPhep" IN (p_GioiTinh, 'Không phân biệt'))
      AND p."TinhTrang" IN ('Trống', 'Còn chỗ')
    ORDER BY p."MaPhong", g."SoGiuong";
END;
$$ LANGUAGE plpgsql;
`);
    console.log('SP_DKyThue deployed successfully!');

    // ----------------------------------------------------
    // MODULE: SP_DatCoc
    // ----------------------------------------------------
    console.log('Deploying SP_DatCoc module...');
    await client.query(`
-- SP_DanhSachDatCocSale
CREATE OR REPLACE FUNCTION "SP_DanhSachDatCocSale"(
    p_MaChiNhanh VARCHAR(6) DEFAULT NULL,
    p_TrangThai VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    "MaPhieuDatCoc" VARCHAR,
    "NgayDatCoc" TIMESTAMP,
    "SoTienCoc" DECIMAL,
    "TrangThai" VARCHAR,
    "HinhThucThue" VARCHAR,
    "HanChot" TIMESTAMP,
    "MaKhachHang" VARCHAR,
    "TenKhachHang" VARCHAR,
    "SDT" VARCHAR,
    "MaChiNhanh" VARCHAR,
    "TenChiNhanh" VARCHAR,
    "MaPhong" VARCHAR,
    "TenPhong" VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pdc."MaPhieuDatCoc"::VARCHAR,
        pdc."NgayDatCoc"::TIMESTAMP,
        pdc."SoTienCoc"::DECIMAL,
        pdc."TrangThai"::VARCHAR,
        pdc."HinhThucThue"::VARCHAR,
        pdc."HanChot"::TIMESTAMP,
        pdc."MaKhachHang"::VARCHAR,
        nd."HoTen"::VARCHAR AS "TenKhachHang",
        nd."SDT"::VARCHAR,
        pdc."MaChiNhanh"::VARCHAR,
        cn."TenChiNhanh"::VARCHAR,
        ctdc."MaPhong"::VARCHAR,
        p."TenPhong"::VARCHAR
    FROM "PhieuDatCoc" pdc
    JOIN "NguoiDung" nd ON nd."MaNguoiDung" = pdc."MaKhachHang"
    JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = pdc."MaChiNhanh"
    LEFT JOIN "ChiTietDatCoc" ctdc ON ctdc."MaPhieuDatCoc" = pdc."MaPhieuDatCoc"
    LEFT JOIN "Phong" p ON p."MaPhong" = ctdc."MaPhong"
    WHERE (p_MaChiNhanh IS NULL OR pdc."MaChiNhanh" = p_MaChiNhanh)
      AND (p_TrangThai IS NULL OR pdc."TrangThai" = p_TrangThai)
    ORDER BY pdc."NgayDatCoc" DESC;
END;
$$ LANGUAGE plpgsql;

-- SP_LapPhieuDatCoc
CREATE OR REPLACE FUNCTION "SP_LapPhieuDatCoc"(
    p_MaKhachHang VARCHAR(6),
    p_MaNhanVien VARCHAR(6),
    p_MaChiNhanh VARCHAR(6),
    p_HinhThucThue VARCHAR(50),
    p_MaPhong VARCHAR(4),
    p_MaGiuong VARCHAR(3) DEFAULT NULL,
    p_HanChot TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 days')
)
RETURNS TABLE (
    "MaPhieuDatCoc" VARCHAR,
    "SoTienCoc" DECIMAL,
    "TrangThai" VARCHAR,
    "Message" TEXT
)
AS $$
DECLARE
    v_MaPhieu VARCHAR(6);
    v_MaxNum INT;
    v_MaCT VARCHAR(6);
    v_MaxCTNum INT;
    v_SoTienCoc DECIMAL(15,2);
BEGIN
    SELECT COALESCE(MAX(CASE WHEN SUBSTRING("MaPhieuDatCoc", 4, 3) ~ '^[0-9]+$' THEN SUBSTRING("MaPhieuDatCoc", 4, 3)::INT ELSE 0 END), 0) + 1
    INTO v_MaxNum
    FROM "PhieuDatCoc";

    v_MaPhieu := 'PDC' || LPAD(v_MaxNum::TEXT, 3, '0');

    INSERT INTO "PhieuDatCoc" (
        "MaPhieuDatCoc", "NgayDatCoc", "SoTienCoc", "TrangThai",
        "HanChot", "HinhThucThue", "MaKhachHang", "MaNhanVien", "MaChiNhanh"
    )
    VALUES (
        v_MaPhieu, CURRENT_TIMESTAMP, 0, 'Chờ thanh toán',
        p_HanChot, p_HinhThucThue, p_MaKhachHang, p_MaNhanVien, p_MaChiNhanh
    );

    SELECT COALESCE(MAX(CASE WHEN SUBSTRING("MaChiTietDC", 5, 2) ~ '^[0-9]+$' THEN SUBSTRING("MaChiTietDC", 5, 2)::INT ELSE 0 END), 0) + 1
    INTO v_MaxCTNum
    FROM "ChiTietDatCoc";

    v_MaCT := 'CTDC' || LPAD(v_MaxCTNum::TEXT, 2, '0');

    INSERT INTO "ChiTietDatCoc" ("MaChiTietDC", "MaPhieuDatCoc", "MaPhong", "MaGiuong", "GiaThue")
    VALUES (v_MaCT, v_MaPhieu, p_MaPhong, p_MaGiuong, NULL);

    SELECT "SoTienCoc" INTO v_SoTienCoc
    FROM "PhieuDatCoc"
    WHERE "MaPhieuDatCoc" = v_MaPhieu;

    RETURN QUERY
    SELECT v_MaPhieu::VARCHAR, v_SoTienCoc, 'Chờ thanh toán'::VARCHAR, 'Lập phiếu đặt cọc thành công'::TEXT;
END;
$$ LANGUAGE plpgsql;
`);
    console.log('SP_DatCoc deployed successfully!');

    // ----------------------------------------------------
    // MODULE: SP_NhanPhong & HopDong
    // ----------------------------------------------------
    console.log('Deploying SP_NhanPhong & HopDong module...');
    await client.query(`
-- SP_LapHopDongThue
CREATE OR REPLACE FUNCTION "SP_LapHopDongThue"(
    p_MaPhieuCoc VARCHAR(6),
    p_MaNhanVien VARCHAR(6),
    p_NgayBatDau DATE,
    p_NgayKetThuc DATE,
    p_KyThanhToan VARCHAR(20) DEFAULT 'Hàng tháng',
    p_HanDongTienHangThang INT DEFAULT 5,
    p_TienCocThucTe DECIMAL(15,2) DEFAULT NULL
)
RETURNS TABLE (
    "MaHopDong" VARCHAR,
    "TrangThai" VARCHAR,
    "GiaThue" DECIMAL,
    "TienCoc" DECIMAL,
    "Message" TEXT
)
AS $$
DECLARE
    v_MaHopDong VARCHAR(6);
    v_MaxNum INT;
    v_GiaThue DECIMAL(15,2);
    v_TienCoc DECIMAL(15,2);
BEGIN
    SELECT COALESCE(MAX(CASE WHEN SUBSTRING("MaHopDong", 3, 4) ~ '^[0-9]+$' THEN SUBSTRING("MaHopDong", 3, 4)::INT ELSE 0 END), 0) + 1
    INTO v_MaxNum
    FROM "HopDongThue";

    v_MaHopDong := 'HD' || LPAD(v_MaxNum::TEXT, 4, '0');

    IF p_TienCocThucTe IS NOT NULL THEN
        v_TienCoc := p_TienCocThucTe;
    ELSE
        SELECT "SoTienCoc" INTO v_TienCoc FROM "PhieuDatCoc" WHERE "MaPhieuDatCoc" = p_MaPhieuCoc;
    END IF;

    INSERT INTO "HopDongThue" (
        "MaHopDong", "NgayLap", "NgayBatDau", "NgayKetThuc",
        "KyThanhToan", "HanDongTienHangThang", "TienCoc", "TrangThai",
        "MaPhieuCoc", "MaNhanVien"
    )
    VALUES (
        v_MaHopDong, CURRENT_DATE, p_NgayBatDau, p_NgayKetThuc,
        p_KyThanhToan, p_HanDongTienHangThang, v_TienCoc, 'Hiệu lực',
        p_MaPhieuCoc, p_MaNhanVien
    );

    SELECT "GiaThue", "TienCoc"
    INTO v_GiaThue, v_TienCoc
    FROM "HopDongThue"
    WHERE "MaHopDong" = v_MaHopDong;

    RETURN QUERY
    SELECT v_MaHopDong::VARCHAR, 'Hiệu lực'::VARCHAR, v_GiaThue, v_TienCoc, 'Lập hợp đồng thuê thành công'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- SP_LayChiTietHopDongThue
CREATE OR REPLACE FUNCTION "SP_LayChiTietHopDongThue"(
    p_MaHopDong VARCHAR(6)
)
RETURNS TABLE (
    "MaHopDong" VARCHAR,
    "NgayLap" DATE,
    "NgayBatDau" DATE,
    "NgayKetThuc" DATE,
    "GiaThue" DECIMAL,
    "TienCoc" DECIMAL,
    "KyThanhToan" VARCHAR,
    "HanDongTienHangThang" INT,
    "TrangThai" VARCHAR,
    "MaPhieuCoc" VARCHAR,
    "MaKhachHang" VARCHAR,
    "TenKhachHang" VARCHAR,
    "SDT" VARCHAR,
    "Email" VARCHAR,
    "CCCD" VARCHAR,
    "TenChiNhanh" VARCHAR,
    "DiaChiChiNhanh" VARCHAR,
    "MaPhong" VARCHAR,
    "TenPhong" VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        hdt."MaHopDong"::VARCHAR,
        hdt."NgayLap"::DATE,
        hdt."NgayBatDau"::DATE,
        hdt."NgayKetThuc"::DATE,
        hdt."GiaThue"::DECIMAL,
        hdt."TienCoc"::DECIMAL,
        hdt."KyThanhToan"::VARCHAR,
        hdt."HanDongTienHangThang"::INT,
        hdt."TrangThai"::VARCHAR,
        hdt."MaPhieuCoc"::VARCHAR,
        pdc."MaKhachHang"::VARCHAR,
        nd."HoTen"::VARCHAR AS "TenKhachHang",
        nd."SDT"::VARCHAR,
        nd."Email"::VARCHAR,
        kh."CCCD"::VARCHAR,
        cn."TenChiNhanh"::VARCHAR,
        cn."DiaChi"::VARCHAR AS "DiaChiChiNhanh",
        ctdc."MaPhong"::VARCHAR,
        p."TenPhong"::VARCHAR
    FROM "HopDongThue" hdt
    JOIN "PhieuDatCoc" pdc ON pdc."MaPhieuDatCoc" = hdt."MaPhieuCoc"
    JOIN "NguoiDung" nd ON nd."MaNguoiDung" = pdc."MaKhachHang"
    JOIN "KhachHang" kh ON kh."MaKhachHang" = pdc."MaKhachHang"
    JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = pdc."MaChiNhanh"
    LEFT JOIN "ChiTietDatCoc" ctdc ON ctdc."MaPhieuDatCoc" = pdc."MaPhieuDatCoc"
    LEFT JOIN "Phong" p ON p."MaPhong" = ctdc."MaPhong"
    WHERE hdt."MaHopDong" = p_MaHopDong;
END;
$$ LANGUAGE plpgsql;
`);
    console.log('SP_NhanPhong & HopDong deployed successfully!');

    // ----------------------------------------------------
    // MODULE: SP_Admin
    // ----------------------------------------------------
    console.log('Deploying SP_Admin module...');
    await client.query(`
-- SP_Admin_DanhSachNhanVien
CREATE OR REPLACE FUNCTION "SP_Admin_DanhSachNhanVien"(
    p_MaChiNhanh VARCHAR(6) DEFAULT NULL,
    p_ChucVu VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    "MaNhanVien" VARCHAR,
    "HoTen" VARCHAR,
    "NgaySinh" DATE,
    "GioiTinh" VARCHAR,
    "SDT" VARCHAR,
    "Email" VARCHAR,
    "ChucVu" VARCHAR,
    "NgayVaoLam" DATE,
    "MaChiNhanh" VARCHAR,
    "TenChiNhanh" VARCHAR,
    "TenDangNhap" VARCHAR,
    "TrangThaiTaiKhoan" VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        nv."MaNhanVien"::VARCHAR,
        nd."HoTen"::VARCHAR,
        nd."NgaySinh"::DATE,
        nd."GioiTinh"::VARCHAR,
        nd."SDT"::VARCHAR,
        nd."Email"::VARCHAR,
        nv."ChucVu"::VARCHAR,
        nv."NgayVaoLam"::DATE,
        nv."MaChiNhanh"::VARCHAR,
        cn."TenChiNhanh"::VARCHAR,
        tk."TenDangNhap"::VARCHAR,
        tk."TrangThai"::VARCHAR AS "TrangThaiTaiKhoan"
    FROM "NhanVien" nv
    JOIN "NguoiDung" nd ON nd."MaNguoiDung" = nv."MaNhanVien"
    JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = nv."MaChiNhanh"
    LEFT JOIN "TaiKhoan" tk ON tk."MaNguoiDung" = nv."MaNhanVien"
    WHERE (p_MaChiNhanh IS NULL OR nv."MaChiNhanh" = p_MaChiNhanh)
      AND (p_ChucVu IS NULL OR nv."ChucVu" = p_ChucVu)
    ORDER BY nv."MaNhanVien";
END;
$$ LANGUAGE plpgsql;

-- SP_Admin_QuanLyChiNhanh
CREATE OR REPLACE FUNCTION "SP_Admin_QuanLyChiNhanh"(
    p_HanhDong VARCHAR(20),
    p_MaChiNhanh VARCHAR(6) DEFAULT NULL,
    p_TenChiNhanh VARCHAR(100) DEFAULT NULL,
    p_DiaChi VARCHAR(255) DEFAULT NULL,
    p_SDT VARCHAR(20) DEFAULT NULL,
    p_Email VARCHAR(100) DEFAULT NULL,
    p_TrangThai VARCHAR(20) DEFAULT 'Hoạt động'
)
RETURNS TABLE (
    "MaChiNhanh" VARCHAR,
    "TenChiNhanh" VARCHAR,
    "DiaChi" VARCHAR,
    "SDT" VARCHAR,
    "Email" VARCHAR,
    "TrangThai" VARCHAR,
    "Message" TEXT
)
AS $$
DECLARE
    v_MaCN VARCHAR(6);
    v_MaxNum INT;
BEGIN
    IF p_HanhDong = 'SELECT' THEN
        RETURN QUERY
        SELECT cn."MaChiNhanh"::VARCHAR, cn."TenChiNhanh"::VARCHAR, cn."DiaChi"::VARCHAR,
               cn."SDT"::VARCHAR, cn."Email"::VARCHAR, cn."TrangThai"::VARCHAR, 'Thành công'::TEXT
        FROM "ChiNhanh" cn
        WHERE (p_MaChiNhanh IS NULL OR cn."MaChiNhanh" = p_MaChiNhanh);
    ELSIF p_HanhDong = 'INSERT' THEN
        SELECT COALESCE(MAX(CASE WHEN SUBSTRING("MaChiNhanh", 3, 4) ~ '^[0-9]+$' THEN SUBSTRING("MaChiNhanh", 3, 4)::INT ELSE 0 END), 0) + 1
        INTO v_MaxNum FROM "ChiNhanh";
        v_MaCN := 'CN' || LPAD(v_MaxNum::TEXT, 4, '0');

        INSERT INTO "ChiNhanh" ("MaChiNhanh", "TenChiNhanh", "DiaChi", "SDT", "Email", "TrangThai")
        VALUES (v_MaCN, p_TenChiNhanh, p_DiaChi, p_SDT, p_Email, p_TrangThai);

        RETURN QUERY SELECT v_MaCN::VARCHAR, p_TenChiNhanh::VARCHAR, p_DiaChi::VARCHAR, p_SDT::VARCHAR, p_Email::VARCHAR, p_TrangThai::VARCHAR, 'Thêm chi nhánh thành công'::TEXT;
    ELSIF p_HanhDong = 'UPDATE' THEN
        UPDATE "ChiNhanh"
        SET "TenChiNhanh" = COALESCE(p_TenChiNhanh, "TenChiNhanh"),
            "DiaChi" = COALESCE(p_DiaChi, "DiaChi"),
            "SDT" = COALESCE(p_SDT, "SDT"),
            "Email" = COALESCE(p_Email, "Email"),
            "TrangThai" = COALESCE(p_TrangThai, "TrangThai")
        WHERE "MaChiNhanh" = p_MaChiNhanh;

        RETURN QUERY SELECT p_MaChiNhanh::VARCHAR, p_TenChiNhanh::VARCHAR, p_DiaChi::VARCHAR, p_SDT::VARCHAR, p_Email::VARCHAR, p_TrangThai::VARCHAR, 'Cập nhật chi nhánh thành công'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;
`);
    console.log('SP_Admin deployed successfully!');

    // ----------------------------------------------------
    // MODULE: SP_TraPhong & DoiSoat
    // ----------------------------------------------------
    console.log('Deploying SP_TraPhong & DoiSoat module...');
    await client.query(`
-- SP_TinhDoiSoat
CREATE OR REPLACE FUNCTION "SP_TinhDoiSoat"(
    p_MaPhieuTra VARCHAR(6)
)
RETURNS TABLE (
    "MaPhieuTra" VARCHAR,
    "TienCocGoc" DECIMAL,
    "TienDichVuPhatSinh" DECIMAL,
    "TienHuHong" DECIMAL,
    "TienPhatViPham" DECIMAL,
    "TienHoanTraKhach" DECIMAL,
    "TienKhachCanDongThem" DECIMAL
)
AS $$
DECLARE
    v_MaHopDong VARCHAR(6);
    v_TienCocGoc DECIMAL(15,2) := 0;
    v_TienDichVu DECIMAL(15,2) := 0;
    v_TienHuHong DECIMAL(15,2) := 0;
    v_TienPhat DECIMAL(15,2) := 0;
    v_TongKhauTru DECIMAL(15,2) := 0;
    v_TienHoanTra DECIMAL(15,2) := 0;
    v_TienThuThem DECIMAL(15,2) := 0;
BEGIN
    SELECT pt."MaHopDong" INTO v_MaHopDong
    FROM "PhieuTraPhong" pt WHERE pt."MaPhieuTra" = p_MaPhieuTra;

    SELECT COALESCE(hdt."TienCoc", 0) INTO v_TienCocGoc
    FROM "HopDongThue" hdt WHERE hdt."MaHopDong" = v_MaHopDong;

    SELECT COALESCE(SUM(hd."TongTien"), 0) INTO v_TienDichVu
    FROM "HoaDon" hd
    WHERE hd."MaHopDong" = v_MaHopDong AND hd."TrangThai" IN ('Chưa thanh toán', 'Nợ quá hạn');

    SELECT COALESCE(bbkt."TongChiPhiSuaChua", 0) INTO v_TienHuHong
    FROM "BienBanKiemTraPhong" bbkt
    WHERE bbkt."MaPhieuTra" = p_MaPhieuTra
    LIMIT 1;

    SELECT COALESCE(SUM(bbvp."SoTienPhat"), 0) INTO v_TienPhat
    FROM "BienBanViPham" bbvp
    WHERE bbvp."MaHopDong" = v_MaHopDong AND bbvp."TrangThaiXuPhat" = 'Chưa nộp phạt';

    v_TongKhauTru := v_TienDichVu + v_TienHuHong + v_TienPhat;

    IF v_TienCocGoc >= v_TongKhauTru THEN
        v_TienHoanTra := v_TienCocGoc - v_TongKhauTru;
        v_TienThuThem := 0;
    ELSE
        v_TienHoanTra := 0;
        v_TienThuThem := v_TongKhauTru - v_TienCocGoc;
    END IF;

    RETURN QUERY
    SELECT
        p_MaPhieuTra::VARCHAR,
        v_TienCocGoc,
        v_TienDichVu,
        v_TienHuHong,
        v_TienPhat,
        v_TienHoanTra,
        v_TienThuThem;
END;
$$ LANGUAGE plpgsql;
`);
    console.log('SP_TraPhong & DoiSoat deployed successfully!');

    // Check count of routines/functions in public schema
    const funcRes = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      ORDER BY routine_name;
    `);
    console.log(`\n======================================================`);
    console.log(`DEPLOYMENT COMPLETE! Total functions/procedures on Supabase: ${funcRes.rows.length}`);
    console.log(`======================================================`);
    console.table(funcRes.rows);

    await client.end();
  } catch (err) {
    console.error('Deployment error:', err);
  }
}

deployAll();
