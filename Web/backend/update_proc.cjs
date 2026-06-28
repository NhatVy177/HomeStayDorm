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
CREATE OR ALTER PROCEDURE dbo.SP_TiepNhanHoSoDangKy
    @MaDangKy        VARCHAR(6),
    @NhanVienSaleId  VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MaDangKy       = NULLIF(LTRIM(RTRIM(@MaDangKy)), '');
    SET @NhanVienSaleId = NULLIF(LTRIM(RTRIM(@NhanVienSaleId)), '');

    IF @MaDangKy IS NULL
        THROW 50011, N'Mã hồ sơ không hợp lệ.', 1;

    IF @NhanVienSaleId IS NULL
        THROW 50011, N'Vui lòng chọn nhân viên Sale tiếp nhận.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50010, N'Không tìm thấy hồ sơ đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.NhanVien
        WHERE MaNhanVien = @NhanVienSaleId
          AND ChucVu = N'Sale'
    )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy
          AND TrangThai = N'Chờ tiếp nhận'
    )
        THROW 50011, N'Hồ sơ không còn ở trạng thái chờ tiếp nhận.', 1;

    DECLARE @SaleDangXuLy VARCHAR(6);
    SELECT @SaleDangXuLy = MaNhanVienSale
    FROM dbo.PhieuDangKy
    WHERE MaDangKy = @MaDangKy;

    IF @SaleDangXuLy IS NOT NULL AND @SaleDangXuLy <> @NhanVienSaleId
        THROW 50011, N'Hồ sơ đã được nhân viên Sale khác tiếp nhận.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.PhieuDangKy
        SET MaNhanVienSale = @NhanVienSaleId,
            TrangThai = N'Đã tiếp nhận'
        WHERE MaDangKy = @MaDangKy
          AND TrangThai = N'Chờ tiếp nhận';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        pdk.MaDangKy            AS maDangKy,
        pdk.NgayDangKy          AS ngayDangKy,
        pdk.HinhThucThue        AS hinhThucThue,
        pdk.SoNguoiDuKienO      AS soNguoiO,
        pdk.GioiTinh            AS gioiTinh,
        pdk.KhuVucMongMuon      AS khuVucMongMuon,
        pdk.LoaiPhongYeuCau     AS loaiPhongYeuCau,
        pdk.MucGia              AS mucGia,
        pdk.ThoiGianDuKienVaoO  AS ngayDuKienVaoO,
        pdk.ThoiHanThue         AS thoiHanThue,
        pdk.YeuCauKhac          AS ghiChu,
        pdk.GhiChuSale          AS ghiChuSale,
        pdk.TrangThai           AS trangThai,
        pdk.MaKhachHang         AS maKhachHang,
        nd.HoTen                AS hoTenKhach,
        nd.SDT                  AS sdtKhach,
        nd.Email                AS emailKhach,
        pdk.MaNhanVienSale      AS maNhanVienSale,
        nvnd.HoTen              AS hoTenSale
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS nvnd ON nvnd.MaNguoiDung = pdk.MaNhanVienSale
    WHERE pdk.MaDangKy = @MaDangKy;
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
