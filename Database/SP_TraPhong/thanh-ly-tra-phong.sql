-- =============================================
-- 1. SP_TraPhong_QuanLy_DanhSachThanhLy
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachThanhLy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachThanhLy AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachThanhLy
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
    BEGIN
        THROW 50000, N'Không tìm thấy thông tin nhân viên quản lý.', 1;
    END

    SELECT 
        pt.MaPhieuTra AS maPhieuTra,
        ds.MaDoiSoat AS maDoiSoat,
        nd.HoTen AS hoTenKhach,
        p.TenPhong AS tenPhong,
        g.MaGiuong AS maGiuong,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.TrangThai AS trangThai,
        ds.TrangThai AS trangThaiDoiSoat,
        CASE WHEN pt.MaHopDong IS NOT NULL THEN N'HopDong' ELSE N'DatCoc' END AS loaiNguon
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.DoiSoat ds ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
    LEFT JOIN dbo.Giuong g ON ctdc.MaGiuong = g.MaGiuong AND ctdc.MaPhong = g.MaPhong
    INNER JOIN dbo.KhachHang kh ON pdc.MaKhachHang = kh.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE pt.TrangThai = N'Chờ ký biên bản' AND p.MaChiNhanh = @MaChiNhanh;
END;
GO

-- =============================================
-- 2. SP_TraPhong_QuanLy_ChiTietThanhLy
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietThanhLy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietThanhLy AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietThanhLy
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    SELECT 
        pt.MaPhieuTra AS maPhieuTra,
        ds.MaDoiSoat AS maDoiSoat,
        nd.HoTen AS hoTenKhach,
        nd.SDT AS soDienThoai,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        pdc.TrangThaiCoc AS trangThaiCoc,
        CONVERT(VARCHAR(10), pdc.ThoiDiemDatCoc, 120) AS ngayDatCoc,
        p.TenPhong AS tenPhong,
        p.TinhTrang AS trangThaiPhong,
        g.MaGiuong AS maGiuong,
        cn.TenChiNhanh AS khuVuc,
        CONVERT(VARCHAR(10), pt.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), hd.NgayBatDau, 120) AS ngayBatDauHopDong,
        CONVERT(VARCHAR(10), hd.NgayKetThuc, 120) AS ngayKetThucHopDong,
        hd.TrangThai AS trangThaiHopDong,
        hd.SoGiuongThue AS soGiuongThue,
        lp.SucChuaToiDa AS sucChuaToiDa,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.TrangThai AS trangThaiDoiSoat,
        CASE WHEN pt.MaHopDong IS NOT NULL THEN 1 ELSE 0 END AS hasHopDong
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.DoiSoat ds ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
    INNER JOIN dbo.LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh cn ON p.MaChiNhanh = cn.MaChiNhanh
    LEFT JOIN dbo.Giuong g ON ctdc.MaGiuong = g.MaGiuong AND ctdc.MaPhong = g.MaPhong
    INNER JOIN dbo.KhachHang kh ON pdc.MaKhachHang = kh.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE pt.MaPhieuTra = @MaPhieuTra AND p.MaChiNhanh = @MaChiNhanh;
END;
GO

-- =============================================
-- 3. SP_TraPhong_QuanLy_XacNhanThanhLy
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_XacNhanThanhLy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_XacNhanThanhLy AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_XacNhanThanhLy
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TrangThaiPT NVARCHAR(30), @MaHopDong VARCHAR(6), @TrangThaiDS NVARCHAR(30);
        SELECT @TrangThaiPT = pt.TrangThai, @MaHopDong = pt.MaHopDong, @TrangThaiDS = ds.TrangThai
        FROM dbo.PhieuTraPhong pt
        INNER JOIN dbo.DoiSoat ds ON pt.MaPhieuTra = ds.MaPhieuTra
        WHERE pt.MaPhieuTra = @MaPhieuTra;
        
        IF @TrangThaiPT <> N'Chờ ký biên bản'
        BEGIN
            THROW 50010, N'Phiếu trả phòng này không ở trạng thái Chờ ký biên bản.', 1;
        END

        -- 1. Thanh lý hợp đồng (nếu có)
        IF @MaHopDong IS NOT NULL
        BEGIN
            UPDATE dbo.HopDongThue
            SET TrangThai = N'Đã thanh lý'
            WHERE MaHopDong = @MaHopDong;
        END

        -- 2. Cập nhật phiếu trả phòng
        DECLARE @TrangThaiMoi NVARCHAR(30);
        IF @TrangThaiDS = N'Chờ hoàn cọc'
        BEGIN
            SET @TrangThaiMoi = N'Chờ hoàn cọc';
        END
        ELSE
        BEGIN
            SET @TrangThaiMoi = N'Chờ hoàn tất';
        END

        UPDATE dbo.PhieuTraPhong
        SET TrangThai = @TrangThaiMoi
        WHERE MaPhieuTra = @MaPhieuTra;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
