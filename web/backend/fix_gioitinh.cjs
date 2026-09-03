const fs = require('fs');
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

(async function() {
  try {
    await sql.connect(config);
    const proc = `
CREATE OR ALTER PROCEDURE dbo.SP_DanhSachHoSoDangKy
    @TrangThai      NVARCHAR(30)    = NULL,
    @MaChiNhanh     VARCHAR(6)      = NULL,
    @NhanVienSaleId VARCHAR(6)      = NULL,
    @KhachHangId    VARCHAR(6)      = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @TrangThai      = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');
    SET @MaChiNhanh     = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @NhanVienSaleId = NULLIF(LTRIM(RTRIM(@NhanVienSaleId)), '');
    SET @KhachHangId    = NULLIF(LTRIM(RTRIM(@KhachHangId)), '');

    IF @TrangThai IS NOT NULL
       AND @TrangThai NOT IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối')
        THROW 50011, N'Trạng thái hồ sơ đăng ký không hợp lệ.', 1;

    IF @MaChiNhanh IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
        THROW 50011, N'Không tìm thấy chi nhánh.', 1;

    IF @NhanVienSaleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @NhanVienSaleId AND ChucVu = N'Sale'
       )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    IF @KhachHangId IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    SELECT
        pdk.MaDangKy            AS maDangKy,
        pdk.NgayDangKy          AS ngayDangKy,
        pdk.SoNguoiDuKienO      AS soNguoiO,
        pdk.SoNam               AS soNam,
        pdk.SoNu                AS soNu,
        pdk.KhuVucMongMuon      AS khuVucMongMuon,
        pdk.LoaiPhongYeuCau     AS loaiPhongYeuCau,
        pdk.MucGiaToiDa         AS mucGia,
        pdk.ThoiGianDuKienVaoO  AS ngayDuKienVaoO,
        pdk.ThoiHanThue         AS thoiHanThue,
        pdk.YeuCauKhac          AS ghiChu,
        pdk.GhiChuSale          AS ghiChuSale,
        pdk.TrangThai           AS trangThai,
        pdk.MaKhachHang         AS maKhachHang,
        nd.HoTen                AS hoTenKhach,
        nd.SDT                  AS sdtKhach,
        nd.Email                AS emailKhach,
        nd.GioiTinh             AS gioiTinh,
        kh.QuocTich             AS quocTich,
        kh.CCCD                 AS cccd,
        pdk.MaNhanVienSale      AS maNhanVienSale,
        nvnd.HoTen              AS hoTenSale,
        nvSale.MaChiNhanh       AS maChiNhanhSale,
        cnSale.TenChiNhanh      AS tenChiNhanhSale,
        lich.STTLich            AS sttLichMoiNhat,
        lich.ThoiGianHen        AS thoiGianHenMoiNhat,
        lich.TrangThai          AS trangThaiLichMoiNhat
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS nvnd ON nvnd.MaNguoiDung = pdk.MaNhanVienSale
    LEFT JOIN dbo.NhanVien AS nvSale ON nvSale.MaNhanVien = pdk.MaNhanVienSale
    LEFT JOIN dbo.ChiNhanh AS cnSale ON cnSale.MaChiNhanh = nvSale.MaChiNhanh
    OUTER APPLY (
        SELECT TOP (1) lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai
        FROM dbo.LichXemPhong AS lxp
        WHERE lxp.MaDangKy = pdk.MaDangKy
        ORDER BY lxp.STTLich DESC
    ) AS lich
    WHERE (@TrangThai IS NULL OR pdk.TrangThai = @TrangThai)
      AND (@NhanVienSaleId IS NULL OR pdk.MaNhanVienSale = @NhanVienSaleId)
      AND (@KhachHangId IS NULL OR pdk.MaKhachHang = @KhachHangId)
      AND (@MaChiNhanh IS NULL 
           OR nvSale.MaChiNhanh = @MaChiNhanh 
           OR EXISTS (
               SELECT 1 FROM dbo.ChiNhanh cn 
               WHERE cn.MaChiNhanh = @MaChiNhanh 
                 AND cn.TenChiNhanh LIKE N'%' + pdk.KhuVucMongMuon + N'%'
           )
      )
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
`;
    await sql.query(proc);
    console.log('Successfully applied update procedure.');
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
})();
