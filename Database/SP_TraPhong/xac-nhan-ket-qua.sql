USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: XÁC NHẬN KẾT QUẢ ĐỐI SOÁT (Nhân viên quản lý)
-- =============================================

-- 1. SP_TraPhong_QuanLy_DanhSachDoiSoat
-- Lấy danh sách các phiếu đối soát đang ở trạng thái 'Chờ xác nhận'
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachDoiSoat
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
        ds.MaDoiSoat AS maDoiSoat,
        pt.MaPhieuTra AS maPhieuTra,
        nd.HoTen AS hoTenKhach,
        p.TenPhong AS tenPhong,
        g.MaGiuong AS maGiuong,
        ds.NgayLap AS ngayLap,
        ds.TrangThai AS trangThai,
        CASE WHEN pt.MaHopDong IS NOT NULL THEN N'HopDong' ELSE N'DatCoc' END AS loaiNguon
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON ds.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
    LEFT JOIN dbo.Giuong g ON ctdc.MaGiuong = g.MaGiuong AND ctdc.MaPhong = g.MaPhong
    INNER JOIN dbo.KhachHang kh ON pdc.MaKhachHang = kh.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE ds.TrangThai = N'Chờ xác nhận' AND p.MaChiNhanh = @MaChiNhanh;
END;
GO

-- 2. SP_TraPhong_QuanLy_ChiTietDoiSoat
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietDoiSoat
    @MaDoiSoat VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    SELECT 
        ds.MaDoiSoat AS maDoiSoat,
        pt.MaPhieuTra AS maPhieuTra,
        nd.HoTen AS hoTenKhach,
        p.TenPhong AS tenPhong,
        g.MaGiuong AS maGiuong,
        pt.NgayTraThucTe AS ngayTraThucTe,
        ds.TienCocBanDau AS tienCocBanDau,
        ds.TyLeHoanCocHienTai AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan AS tienCocDuocHoan,
        ds.TienThueConNo AS tienThueConNo,
        ds.TienDichVuConNo AS tienDichVuConNo,
        ds.TongChiPhiSuaChua AS tongChiPhiSuaChua,
        ds.TienPhat AS tienPhat,
        ds.TongKhauTru AS tongKhauTru,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.TrangThai AS trangThai,
        hd.MaHopDong AS maHopDong,
        pdc.MaPhieuDatCoc AS maPhieuDatCoc
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON ds.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
    LEFT JOIN dbo.Giuong g ON ctdc.MaGiuong = g.MaGiuong AND ctdc.MaPhong = g.MaPhong
    INNER JOIN dbo.KhachHang kh ON pdc.MaKhachHang = kh.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE ds.MaDoiSoat = @MaDoiSoat AND p.MaChiNhanh = @MaChiNhanh;
END;
GO

-- 3. SP_TraPhong_QuanLy_XacNhanDoiSoat
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_XacNhanDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_XacNhanDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_XacNhanDoiSoat
    @MaDoiSoat VARCHAR(6),
    @MaNhanVien VARCHAR(6),
    @DongY BIT,
    @PhuongThucThanhToan NVARCHAR(20) = NULL,
    @LyDoKhongDongY NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TrangThaiHienTai NVARCHAR(30), @MaPhieuTra VARCHAR(6), @SoTienHoan DECIMAL(15,2), @SoTienPhaiTT DECIMAL(15,2);
        SELECT @TrangThaiHienTai = TrangThai, @MaPhieuTra = MaPhieuTra, @SoTienHoan = SoTienHoanThucTe, @SoTienPhaiTT = SoTienKhachPhaiTT 
        FROM dbo.DoiSoat WHERE MaDoiSoat = @MaDoiSoat;
        
        IF @TrangThaiHienTai <> N'Chờ xác nhận'
        BEGIN
            THROW 50010, N'Phiếu đối soát này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 1;
        END

        IF @DongY = 1
        BEGIN
            DECLARE @TrangThaiMoi NVARCHAR(30);
            IF @SoTienHoan > 0
            BEGIN
                SET @TrangThaiMoi = N'Chờ hoàn cọc';
            END
            ELSE IF @SoTienPhaiTT > 0
            BEGIN
                SET @TrangThaiMoi = N'Chờ thanh toán thêm';
            END
            ELSE
            BEGIN
                SET @TrangThaiMoi = N'Đã quyết toán';
            END
            
            UPDATE dbo.DoiSoat 
            SET TrangThai = @TrangThaiMoi, PhuongThucThanhToan = @PhuongThucThanhToan
            WHERE MaDoiSoat = @MaDoiSoat;
            
            UPDATE dbo.PhieuTraPhong
            SET TrangThai = N'Chờ ký biên bản'
            WHERE MaPhieuTra = @MaPhieuTra;
        END
        ELSE
        BEGIN
            UPDATE dbo.DoiSoat
            SET TrangThai = N'Cần điều chỉnh', GhiChuPhanHoiKhach = @LyDoKhongDongY
            WHERE MaDoiSoat = @MaDoiSoat;
            -- PhieuTraPhong remains 'Chờ đối soát'
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
