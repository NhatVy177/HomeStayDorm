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
        nd.SDT AS sdtKhach,
        p.TenPhong AS tenPhong,
        g.MaGiuong AS maGiuong,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        pt.TrangThai AS trangThai,
        ds.TrangThai AS trangThaiDoiSoat,
        hd.TrangThai AS trangThaiHopDong,
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
    WHERE p.MaChiNhanh = @MaChiNhanh
      AND (
          (
              pt.TrangThai = N'Chờ ký biên bản'
              AND (
                  (pt.MaHopDong IS NOT NULL AND ds.TrangThai IN (N'Đã quyết toán', N'Chờ hoàn cọc') AND ISNULL(hd.TrangThai, N'') <> N'Đã thanh lý')
                  OR (pt.MaHopDong IS NULL AND pt.MaPhieuDatCoc IS NOT NULL AND ds.TrangThai = N'Chờ hoàn cọc')
              )
          )
          OR pt.TrangThai IN (N'Chờ hoàn cọc', N'Hoàn tất')
      )
    ORDER BY pt.NgayDangKyTra DESC, pt.MaPhieuTra DESC;
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
        nd.Email AS emailKhach,
        kh.CCCD AS cccdKhach,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        pdc.TrangThaiCoc AS trangThaiCoc,
        CONVERT(VARCHAR(10), pdc.ThoiDiemDatCoc, 120) AS ngayDatCoc,
        p.TenPhong AS tenPhong,
        p.TinhTrang AS trangThaiPhong,
        g.MaGiuong AS maGiuong,
        cn.TenChiNhanh AS khuVuc,
        CONVERT(VARCHAR(10), pt.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), pt.NgayTraThucTe, 120) AS ngayTraThucTe,
        pt.TrangThai AS trangThaiPhieuTra,
        CONVERT(VARCHAR(10), hd.NgayBatDau, 120) AS ngayBatDauHopDong,
        CONVERT(VARCHAR(10), hd.NgayKetThuc, 120) AS ngayKetThucHopDong,
        hd.TrangThai AS trangThaiHopDong,
        hd.SoGiuongThue AS soGiuongThue,
        lp.SucChuaToiDa AS sucChuaToiDa,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.TrangThai AS trangThaiDoiSoat,
        ds.TienCocBanDau AS tienCocBanDau,
        ds.TienCocDuocHoan AS tienCocDuocHoan,
        ds.TienThueConNo AS tienThueConNo,
        ds.TienDichVuConNo AS tienDichVuConNo,
        ds.TongChiPhiSuaChua AS tongChiPhiSuaChua,
        ds.TienPhat AS tienPhat,
        ds.TongKhauTru AS tongKhauTru,
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
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE
            @TrangThaiPT NVARCHAR(30),
            @MaHopDong VARCHAR(6),
            @MaPhieuDatCoc VARCHAR(6),
            @TrangThaiDS NVARCHAR(30),
            @TrangThaiHD NVARCHAR(30),
            @MaChiNhanhNV VARCHAR(6),
            @MaChiNhanhPT VARCHAR(6);

        SELECT @MaChiNhanhNV = MaChiNhanh
        FROM dbo.NhanVien
        WHERE MaNhanVien = @MaNhanVien;

        IF @MaChiNhanhNV IS NULL
            THROW 50009, N'Không tìm thấy thông tin nhân viên quản lý.', 1;

        SELECT TOP 1
            @TrangThaiPT = pt.TrangThai,
            @MaHopDong = pt.MaHopDong,
            @MaPhieuDatCoc = pt.MaPhieuDatCoc,
            @TrangThaiDS = ds.TrangThai,
            @TrangThaiHD = hd.TrangThai,
            @MaChiNhanhPT = p.MaChiNhanh
        FROM dbo.PhieuTraPhong pt
        INNER JOIN dbo.DoiSoat ds ON pt.MaPhieuTra = ds.MaPhieuTra
        LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
        INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
        WHERE pt.MaPhieuTra = @MaPhieuTra;

        IF @TrangThaiPT IS NULL
            THROW 50008, N'Không tìm thấy phiếu trả phòng.', 1;

        IF @MaChiNhanhPT <> @MaChiNhanhNV
            THROW 50011, N'Phiếu trả phòng không thuộc chi nhánh của nhân viên quản lý.', 1;
        
        IF @TrangThaiPT <> N'Chờ ký biên bản'
            THROW 50010, N'Phiếu trả phòng này không ở trạng thái Chờ ký biên bản.', 1;

        DECLARE @TrangThaiMoi NVARCHAR(30);
        DECLARE @ThongBao NVARCHAR(255);

        IF @MaHopDong IS NOT NULL
        BEGIN
            IF @TrangThaiDS NOT IN (N'Đã quyết toán', N'Chờ hoàn cọc')
                THROW 50012, N'Phiếu đối soát của hợp đồng chưa ở trạng thái phù hợp để thanh lý.', 1;

            IF ISNULL(@TrangThaiHD, N'') = N'Đã thanh lý'
                THROW 50013, N'Hợp đồng thuê đã được thanh lý trước đó.', 1;

            UPDATE dbo.HopDongThue
            SET TrangThai = N'Đã thanh lý'
            WHERE MaHopDong = @MaHopDong;

            IF @TrangThaiDS = N'Chờ hoàn cọc'
                SET @TrangThaiMoi = N'Chờ hoàn cọc';
            ELSE
                SET @TrangThaiMoi = N'Hoàn tất';

            SET @ThongBao = N'Đã ghi nhận khách hàng ký biên bản và thanh lý hợp đồng thuê.';
        END
        ELSE
        BEGIN
            IF @MaPhieuDatCoc IS NULL
                THROW 50014, N'Phiếu trả phòng không liên kết hợp đồng hoặc phiếu đặt cọc hợp lệ.', 1;

            IF @TrangThaiDS <> N'Chờ hoàn cọc'
                THROW 50015, N'Phiếu đặt cọc chỉ được xác nhận ký biên bản khi đối soát ở trạng thái Chờ hoàn cọc.', 1;

            SET @TrangThaiMoi = N'Chờ hoàn cọc';
            SET @ThongBao = N'Đã ghi nhận khách hàng ký biên bản trả phòng.';
        END

        UPDATE dbo.PhieuTraPhong
        SET TrangThai = @TrangThaiMoi
        WHERE MaPhieuTra = @MaPhieuTra;

        COMMIT TRANSACTION;

        SELECT
            @MaPhieuTra AS maPhieuTra,
            @MaHopDong AS maHopDong,
            @MaPhieuDatCoc AS maPhieuDatCoc,
            @TrangThaiDS AS trangThaiDoiSoat,
            @TrangThaiMoi AS trangThaiPhieuTra,
            CASE WHEN @MaHopDong IS NOT NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS hasHopDong,
            @ThongBao AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
