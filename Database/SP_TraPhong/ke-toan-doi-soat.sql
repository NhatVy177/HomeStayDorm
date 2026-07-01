USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: LAP PHIEU DOI SOAT TRA PHONG (Nhan vien ke toan)
-- =============================================

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ptp.MaPhieuTra AS maPhieuTra,
        ptp.NgayDangKyTra AS ngayDangKyTra,
        ptp.NgayDuKienTra AS ngayDuKienTra,
        ptp.NgayTraThucTe AS ngayTraThucTe,
        ptp.TrangThai AS trangThai,
        ptp.MaHopDong AS maHopDong,
        ptp.MaPhieuDatCoc AS maPhieuDatCoc,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ptp.MaPhieuDatCoc
    LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
    LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ptp.TrangThai = N'Chờ đối soát'
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.DoiSoat ds
          WHERE ds.MaPhieuTra = ptp.MaPhieuTra
            AND ds.TrangThai IN (
                N'Chờ xác nhận',
                N'Chờ hoàn cọc',
                N'Chờ thanh toán thêm',
                N'Cần điều chỉnh'
            )
      )
    ORDER BY ptp.NgayTraThucTe DESC, ptp.NgayDangKyTra DESC, ptp.MaPhieuTra DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachChoThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoThuThem
    @MaNhanVienKeToan VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVienKeToan;

    SELECT
        ds.MaDoiSoat AS maDoiSoat,
        pt.MaPhieuTra AS maPhieuTra,
        ds.NgayLap AS ngayLap,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        MIN(p.TenPhong) AS tenPhong,
        MIN(g.MaGiuong) AS maGiuong,
        COUNT(DISTINCT ctdc.MaChiTietDC) AS soLuongPhongGiuong,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.TrangThai AS trangThaiDoiSoat,
        pt.TrangThai AS trangThaiPhieuTra
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ds.TrangThai = N'Chờ thanh toán thêm'
      AND pt.TrangThai = N'Chờ ký biên bản'
      AND ISNULL(ds.SoTienKhachPhaiTT, 0) > 0
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat,
        pt.MaPhieuTra,
        ds.NgayLap,
        nd.HoTen,
        nd.SDT,
        pt.MaHopDong,
        pt.MaPhieuDatCoc,
        ds.SoTienKhachPhaiTT,
        ds.PhuongThucThanhToan,
        ds.TrangThai,
        pt.TrangThai
    ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_ChiTietThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietThuThem
    @MaDoiSoat VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVienKeToan;

    SELECT TOP 1
        ds.MaDoiSoat AS maDoiSoat,
        ds.NgayLap AS ngayLap,
        pt.MaPhieuTra AS maPhieuTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        pt.TrangThai AS trangThaiPhieuTra,
        ds.TrangThai AS trangThaiDoiSoat,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        hd.TrangThai AS trangThaiHopDong,
        pdc.TrangThaiCoc AS trangThaiCoc,
        ds.TienCocBanDau AS tienCocBanDau,
        ds.TyLeHoanCocHienTai AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan AS tienCocDuocHoan,
        ds.TongKhauTru AS tongKhauTru,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.NgayThanhToan AS ngayThanhToan,
        ds.ChungTuThanhToan AS chungTuThanhToan,
        ds.GhiChuPhanHoiKhach AS ghiChuPhanHoiKhach
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh);

    SELECT
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        ctdc.GiaThue AS giaThue
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    ORDER BY p.MaPhong, ctdc.MaGiuong;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_XacNhanThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_XacNhanThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_XacNhanThuThem
    @MaDoiSoat VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6),
    @PhuongThucThanhToan NVARCHAR(20),
    @NgayThanhToan DATE,
    @ChungTuThanhToan VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @PhuongThucThanhToan NOT IN (N'Tiền mặt', N'Chuyển khoản')
    BEGIN
        THROW 50700, N'Phương thức thanh toán không hợp lệ.', 1;
    END

    IF @NgayThanhToan IS NULL
    BEGIN
        THROW 50700, N'Ngày thanh toán không được để trống.', 1;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @TrangThaiDoiSoat NVARCHAR(30),
            @TrangThaiPhieuTra NVARCHAR(50),
            @MaPhieuTra VARCHAR(6),
            @SoTienKhachPhaiTT DECIMAL(15,2);

        SELECT
            @TrangThaiDoiSoat = ds.TrangThai,
            @MaPhieuTra = ds.MaPhieuTra,
            @SoTienKhachPhaiTT = ds.SoTienKhachPhaiTT,
            @TrangThaiPhieuTra = pt.TrangThai
        FROM dbo.DoiSoat ds WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PhieuTraPhong pt WITH (UPDLOCK, HOLDLOCK) ON pt.MaPhieuTra = ds.MaPhieuTra
        WHERE ds.MaDoiSoat = @MaDoiSoat;

        IF @MaPhieuTra IS NULL
        BEGIN
            THROW 50704, N'Không tìm thấy phiếu đối soát.', 1;
        END

        IF @TrangThaiDoiSoat <> N'Chờ thanh toán thêm'
        BEGIN
            THROW 50701, N'Phiếu đối soát này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 1;
        END

        IF @TrangThaiPhieuTra <> N'Chờ ký biên bản'
        BEGIN
            THROW 50702, N'Phiếu trả phòng không còn ở trạng thái chờ ký biên bản.', 1;
        END

        IF ISNULL(@SoTienKhachPhaiTT, 0) <= 0
        BEGIN
            THROW 50700, N'Phiếu đối soát không phát sinh số tiền cần thu thêm.', 1;
        END

        UPDATE dbo.DoiSoat
        SET
            PhuongThucThanhToan = @PhuongThucThanhToan,
            NgayThanhToan = @NgayThanhToan,
            ChungTuThanhToan = NULLIF(LTRIM(RTRIM(@ChungTuThanhToan)), ''),
            TrangThai = N'Đã quyết toán',
            MaNhanVienKeToan = COALESCE(@MaNhanVienKeToan, MaNhanVienKeToan)
        WHERE MaDoiSoat = @MaDoiSoat;

        COMMIT TRANSACTION;

        SELECT
            @MaDoiSoat AS maDoiSoat,
            @MaPhieuTra AS maPhieuTra,
            N'Đã quyết toán' AS trangThaiDoiSoat,
            @TrangThaiPhieuTra AS trangThaiPhieuTra,
            @PhuongThucThanhToan AS phuongThucThanhToan,
            @NgayThanhToan AS ngayThanhToan,
            @ChungTuThanhToan AS chungTuThanhToan;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc
    @MaNhanVienKeToan VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVienKeToan;

    SELECT
        ds.MaDoiSoat AS maDoiSoat,
        pt.MaPhieuTra AS maPhieuTra,
        ds.NgayLap AS ngayLap,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        MIN(p.TenPhong) AS tenPhong,
        MIN(g.MaGiuong) AS maGiuong,
        COUNT(DISTINCT ctdc.MaChiTietDC) AS soLuongPhongGiuong,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.TrangThai AS trangThaiDoiSoat,
        pt.TrangThai AS trangThaiPhieuTra
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ds.TrangThai = N'Chờ hoàn cọc'
      AND pt.TrangThai = N'Chờ hoàn cọc'
      AND ISNULL(ds.SoTienHoanThucTe, 0) > 0
      AND (pt.MaHopDong IS NULL OR hd.TrangThai = N'Đã thanh lý')
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat,
        pt.MaPhieuTra,
        ds.NgayLap,
        nd.HoTen,
        nd.SDT,
        pt.MaHopDong,
        pt.MaPhieuDatCoc,
        ds.SoTienHoanThucTe,
        ds.PhuongThucThanhToan,
        ds.TrangThai,
        pt.TrangThai
    ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_ChiTietHoanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietHoanCoc AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietHoanCoc
    @MaDoiSoat VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVienKeToan;

    SELECT TOP 1
        ds.MaDoiSoat AS maDoiSoat,
        ds.NgayLap AS ngayLap,
        pt.MaPhieuTra AS maPhieuTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        pt.TrangThai AS trangThaiPhieuTra,
        ds.TrangThai AS trangThaiDoiSoat,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        hd.TrangThai AS trangThaiHopDong,
        pdc.TrangThaiCoc AS trangThaiCoc,
        ds.TienCocBanDau AS tienCocBanDau,
        ds.TyLeHoanCocHienTai AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan AS tienCocDuocHoan,
        ds.TongKhauTru AS tongKhauTru,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.NgayThanhToan AS ngayThanhToan,
        ds.ChungTuThanhToan AS chungTuThanhToan,
        ds.GhiChuPhanHoiKhach AS ghiChuPhanHoiKhach
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh);

    SELECT
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        ctdc.GiaThue AS giaThue
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    ORDER BY p.MaPhong, ctdc.MaGiuong;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_XacNhanHoanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_XacNhanHoanCoc AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_XacNhanHoanCoc
    @MaDoiSoat VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6),
    @PhuongThucThanhToan NVARCHAR(20),
    @NgayThanhToan DATE,
    @ChungTuThanhToan VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @PhuongThucThanhToan NOT IN (N'Tiền mặt', N'Chuyển khoản')
    BEGIN
        THROW 50600, N'Phương thức thanh toán không hợp lệ.', 1;
    END

    IF @NgayThanhToan IS NULL
    BEGIN
        THROW 50600, N'Ngày thanh toán không được để trống.', 1;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @TrangThaiDoiSoat NVARCHAR(30),
            @TrangThaiPhieuTra NVARCHAR(50),
            @MaPhieuTra VARCHAR(6),
            @MaHopDong VARCHAR(6),
            @MaPhieuDatCoc VARCHAR(6),
            @TrangThaiHopDong NVARCHAR(20),
            @SoTienHoanThucTe DECIMAL(15,2);

        SELECT
            @TrangThaiDoiSoat = ds.TrangThai,
            @MaPhieuTra = ds.MaPhieuTra,
            @SoTienHoanThucTe = ds.SoTienHoanThucTe,
            @TrangThaiPhieuTra = pt.TrangThai,
            @MaHopDong = pt.MaHopDong,
            @MaPhieuDatCoc = pt.MaPhieuDatCoc,
            @TrangThaiHopDong = hd.TrangThai
        FROM dbo.DoiSoat ds WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PhieuTraPhong pt WITH (UPDLOCK, HOLDLOCK) ON pt.MaPhieuTra = ds.MaPhieuTra
        LEFT JOIN dbo.HopDongThue hd WITH (UPDLOCK, HOLDLOCK) ON hd.MaHopDong = pt.MaHopDong
        WHERE ds.MaDoiSoat = @MaDoiSoat;

        IF @MaPhieuTra IS NULL
        BEGIN
            THROW 50604, N'Không tìm thấy phiếu đối soát.', 1;
        END

        IF @TrangThaiDoiSoat <> N'Chờ hoàn cọc'
        BEGIN
            THROW 50601, N'Phiếu đối soát này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 1;
        END

        IF @TrangThaiPhieuTra <> N'Chờ hoàn cọc'
        BEGIN
            THROW 50602, N'Phiếu trả phòng không còn ở trạng thái chờ hoàn cọc.', 1;
        END

        IF ISNULL(@SoTienHoanThucTe, 0) <= 0
        BEGIN
            THROW 50600, N'Phiếu đối soát không phát sinh số tiền hoàn cọc.', 1;
        END

        IF @MaHopDong IS NOT NULL AND ISNULL(@TrangThaiHopDong, N'') <> N'Đã thanh lý'
        BEGIN
            THROW 50603, N'Hợp đồng thuê chưa được thanh lý.', 1;
        END

        UPDATE dbo.DoiSoat
        SET
            PhuongThucThanhToan = @PhuongThucThanhToan,
            NgayThanhToan = @NgayThanhToan,
            ChungTuThanhToan = NULLIF(LTRIM(RTRIM(@ChungTuThanhToan)), ''),
            TrangThai = N'Đã hoàn cọc',
            MaNhanVienKeToan = COALESCE(@MaNhanVienKeToan, MaNhanVienKeToan)
        WHERE MaDoiSoat = @MaDoiSoat;

        UPDATE dbo.PhieuTraPhong
        SET TrangThai = N'Chờ hoàn tất'
        WHERE MaPhieuTra = @MaPhieuTra;

        IF @MaPhieuDatCoc IS NOT NULL
        BEGIN
            UPDATE dbo.PhieuDatCoc
            SET TrangThaiCoc = N'Đã hủy'
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;
        END

        COMMIT TRANSACTION;

        SELECT
            @MaDoiSoat AS maDoiSoat,
            @MaPhieuTra AS maPhieuTra,
            N'Đã hoàn cọc' AS trangThaiDoiSoat,
            N'Chờ hoàn tất' AS trangThaiPhieuTra,
            @PhuongThucThanhToan AS phuongThucThanhToan,
            @NgayThanhToan AS ngayThanhToan,
            @ChungTuThanhToan AS chungTuThanhToan;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_LayPhieuTraPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_LayPhieuTraPhong AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_LayPhieuTraPhong
    @MaPhieuTra VARCHAR(6),
    @LockForUpdate BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @LockForUpdate = 1
    BEGIN
        SELECT
            ptp.MaPhieuTra AS maPhieuTra,
            ptp.NgayDangKyTra AS ngayDangKyTra,
            ptp.NgayDuKienTra AS ngayDuKienTra,
            ptp.NgayTraThucTe AS ngayTraThucTe,
            ptp.TrangThai AS trangThai,
            ptp.MaHopDong AS maHopDong,
            ptp.MaPhieuDatCoc AS maPhieuDatCoc,
            nd.HoTen AS hoTenKhachHang,
            nd.SDT AS sdtKhachHang,
            nd.Email AS emailKhachHang,
            kh.CCCD AS cccd,
            kh.QuocTich AS quocTich,
            kh.MaKhachHang AS maKhachHang
        FROM dbo.PhieuTraPhong ptp WITH (UPDLOCK, HOLDLOCK)
        LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = ptp.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ptp.MaPhieuDatCoc
        LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
        LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
        WHERE ptp.MaPhieuTra = @MaPhieuTra;

        RETURN;
    END

    SELECT
        ptp.MaPhieuTra AS maPhieuTra,
        ptp.NgayDangKyTra AS ngayDangKyTra,
        ptp.NgayDuKienTra AS ngayDuKienTra,
        ptp.NgayTraThucTe AS ngayTraThucTe,
        ptp.TrangThai AS trangThai,
        ptp.MaHopDong AS maHopDong,
        ptp.MaPhieuDatCoc AS maPhieuDatCoc,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang,
        kh.CCCD AS cccd,
        kh.QuocTich AS quocTich,
        kh.MaKhachHang AS maKhachHang
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ptp.MaPhieuDatCoc
    LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
    LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ptp.MaPhieuTra = @MaPhieuTra;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_CoDoiSoatDangXuLy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_CoDoiSoatDangXuLy AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_CoDoiSoatDangXuLy
    @MaPhieuTra VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CASE WHEN EXISTS (
            SELECT 1
            FROM dbo.DoiSoat ds WITH (UPDLOCK, HOLDLOCK)
            WHERE ds.MaPhieuTra = @MaPhieuTra
              AND ds.TrangThai IN (
                  N'Chờ xác nhận',
                  N'Chờ hoàn cọc',
                  N'Chờ thanh toán thêm',
                  N'Cần điều chỉnh'
              )
        )
        THEN 1 ELSE 0 END AS hasDoiSoatDangXuLy;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_LayHopDongHoSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_LayHopDongHoSo AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_LayHopDongHoSo
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hd.MaHopDong AS maHopDong,
        hd.NgayBatDau AS ngayBatDau,
        hd.NgayKetThuc AS ngayKetThuc,
        hd.GiaThue AS giaThue,
        hd.KyThanhToan AS kyThanhToan,
        hd.TrangThai AS trangThai,
        hd.MaPhieuCoc AS maPhieuCoc,
        hd.MaKhachHang AS maKhachHang,
        pdc.SoTienCoc AS soTienCoc,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang
    FROM dbo.HopDongThue hd
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE hd.MaHopDong = @MaHopDong;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_LayPhieuDatCocHoSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_LayPhieuDatCocHoSo AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_LayPhieuDatCocHoSo
    @MaPhieuDatCoc VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdc.MaPhieuDatCoc AS maPhieuDatCoc,
        pdc.SoTienCoc AS soTienCoc,
        pdc.TrangThaiThanhToan AS trangThaiThanhToan,
        pdc.TrangThaiCoc AS trangThaiCoc,
        pdc.MaKhachHang AS maKhachHang,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang
    FROM dbo.PhieuDatCoc pdc
    LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_LayPhongTrongPhieuCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_LayPhongTrongPhieuCoc AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_LayPhongTrongPhieuCoc
    @MaPhieuDatCoc VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ctdc.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        cn.TenChiNhanh AS tenChiNhanh
    FROM dbo.ChiTietDatCoc ctdc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
    ORDER BY ctdc.MaPhong, ctdc.MaGiuong;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_TongChiPhiSuaChua', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_TongChiPhiSuaChua AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_TongChiPhiSuaChua
    @MaPhieuTra VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ISNULL(SUM(TongChiPhiSuaChua), 0) AS tongChiPhiSuaChua,
        COUNT(1) AS soBienBanKiemTra
    FROM dbo.BienBanKiemTraPhong
    WHERE MaPhieuTra = @MaPhieuTra;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_TienPhatChoXuLy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_TienPhatChoXuLy AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_TienPhatChoXuLy
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT ISNULL(SUM(SoTienPhat), 0) AS tienPhat
    FROM dbo.BienBanViPham
    WHERE MaHopDong = @MaHopDong
      AND TrangThai = N'Chờ xử lý';
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_TienHoaDonConNo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_TienHoaDonConNo AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_TienHoaDonConNo
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ISNULL(SUM(hdt.GiaThue), 0) AS tienThueConNo,
        ISNULL(SUM(ISNULL(dvNo.tienDichVuConNo, 0)), 0) AS tienDichVuConNo
    FROM dbo.HoaDon hd
    INNER JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
    OUTER APPLY (
        SELECT SUM(ISNULL(cthd.ThanhTien, 0)) AS tienDichVuConNo
        FROM dbo.ChiTietHoaDon cthd
        WHERE cthd.MaHoaDon = hd.MaHoaDon
    ) dvNo
    WHERE hdt.MaHopDong = @MaHopDong
      AND hd.TrangThai IN (N'Chưa TT', N'Nợ');
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_ChiTietKhauTru', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietKhauTru AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietKhauTru
    @MaPhieuTra VARCHAR(6),
    @MaHopDong VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Recordset 1: Hoa don con no, trong do tien thue lay tu GiaThue hop dong.
    SELECT
        hd.MaHoaDon AS maHoaDon,
        N'Tiền thuê kỳ ' + ISNULL(hd.KyThanhToan, N'--') AS tenKhoanThue,
        hd.KyThanhToan AS kyThanhToan,
        hd.NgayLap AS ngayLap,
        hd.NgayHanTT AS ngayHanTT,
        hdt.GiaThue AS thanhTien,
        ISNULL(dvNo.tienDichVuConNo, 0) AS tienDichVuConNo,
        hdt.GiaThue + ISNULL(dvNo.tienDichVuConNo, 0) AS tongTienNo,
        hd.TongTien AS tongTienHoaDon,
        hd.TrangThai AS trangThai,
        hdt.MaHopDong AS maHopDong,
        hdt.GiaThue AS giaThueHopDong,
        hdt.KyThanhToan AS kyThanhToanHopDong
    FROM dbo.HoaDon hd
    INNER JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
    OUTER APPLY (
        SELECT SUM(ISNULL(cthd.ThanhTien, 0)) AS tienDichVuConNo
        FROM dbo.ChiTietHoaDon cthd
        WHERE cthd.MaHoaDon = hd.MaHoaDon
    ) dvNo
    WHERE @MaHopDong IS NOT NULL
      AND hdt.MaHopDong = @MaHopDong
      AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
    ORDER BY hd.NgayHanTT ASC, hd.NgayLap ASC, hd.MaHoaDon ASC;

    -- Recordset 2: Chi tiet dich vu trong cac hoa don con no.
    SELECT
        hd.MaHoaDon AS maHoaDon,
        cthd.MaChiTietHD AS maChiTietHD,
        N'Dịch vụ' AS loaiKhoanNo,
        dv.TenDichVu AS tenDichVu,
        cthd.SoLuong AS soLuong,
        cthd.DonViTinh AS donViTinh,
        cthd.DonGia AS donGia,
        ISNULL(cthd.ThanhTien, 0) AS thanhTien,
        cthd.MaPhieuGhi AS maPhieuGhi
    FROM dbo.HoaDon hd
    INNER JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
    INNER JOIN dbo.ChiTietHoaDon cthd ON cthd.MaHoaDon = hd.MaHoaDon
    LEFT JOIN dbo.DichVuHopDong dvhd ON dvhd.MaChiTietDVHD = cthd.MaChiTietDVHD
    LEFT JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE @MaHopDong IS NOT NULL
      AND hdt.MaHopDong = @MaHopDong
      AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
    ORDER BY hd.MaHoaDon ASC, cthd.MaChiTietHD ASC;

    -- Recordset 3: Bien ban kiem tra phong, dung de tinh chi phi sua chua.
    SELECT
        bbkt.MaBienBanKT AS maBienBanKT,
        bbkt.NgayKiemTra AS ngayKiemTra,
        bbkt.TinhTrangPhong AS tinhTrangPhong,
        bbkt.TongChiPhiSuaChua AS tongChiPhiSuaChua
    FROM dbo.BienBanKiemTraPhong bbkt
    WHERE bbkt.MaPhieuTra = @MaPhieuTra
    ORDER BY bbkt.NgayKiemTra ASC, bbkt.MaBienBanKT ASC;

    -- Recordset 4: Tung hu hong/tai san bi hu.
    SELECT
        bbkt.MaBienBanKT AS maBienBanKT,
        cthh.MaChiTietHH AS maChiTietHH,
        cthh.MaPhong AS maPhong,
        cthh.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        cthh.MoTaHuHong AS moTaHuHong,
        cthh.ChiPhiSuaChua AS chiPhiSuaChua
    FROM dbo.BienBanKiemTraPhong bbkt
    INNER JOIN dbo.ChiTietHuHong cthh ON cthh.MaBienBanKT = bbkt.MaBienBanKT
    LEFT JOIN dbo.TaiSan ts ON ts.MaPhong = cthh.MaPhong AND ts.MaTaiSan = cthh.MaTaiSan
    WHERE bbkt.MaPhieuTra = @MaPhieuTra
    ORDER BY bbkt.MaBienBanKT ASC, cthh.MaChiTietHH ASC;

    -- Recordset 5: Bien ban vi pham dang cho xu ly.
    SELECT
        bbvp.MaBBViPham AS maBBViPham,
        bbvp.NgayViPham AS ngayViPham,
        bbvp.MoTaViPham AS moTaViPham,
        bbvp.SoTienPhat AS soTienPhat,
        bbvp.TrangThai AS trangThai,
        bbvp.MaDieuKhoan AS maDieuKhoan,
        dkvp.TenDieuKhoan AS tenDieuKhoan,
        dkvp.HinhThucXuPhat AS hinhThucXuPhat
    FROM dbo.BienBanViPham bbvp
    LEFT JOIN dbo.DieuKhoanViPham dkvp ON dkvp.MaDieuKhoan = bbvp.MaDieuKhoan
    WHERE @MaHopDong IS NOT NULL
      AND bbvp.MaHopDong = @MaHopDong
      AND bbvp.TrangThai = N'Chờ xử lý'
    ORDER BY bbvp.NgayViPham ASC, bbvp.MaBBViPham ASC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_LayMaQuyDinhHoanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_LayMaQuyDinhHoanCoc AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_LayMaQuyDinhHoanCoc
    @TyLeHoanCocHienTai DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1 MaQuyDinhHoanCoc AS maQuyDinhHoanCoc
    FROM dbo.QuyDinhHoanCoc
    WHERE TyLeHoanCoc = @TyLeHoanCocHienTai;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_SinhMaDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_SinhMaDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_SinhMaDoiSoat
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        'DS' + RIGHT('0000' + CAST(
            ISNULL(MAX(CAST(SUBSTRING(MaDoiSoat, 3, 4) AS INT)), 0) + 1
            AS VARCHAR(4)
        ), 4) AS maDoiSoat
    FROM dbo.DoiSoat WITH (UPDLOCK, HOLDLOCK)
    WHERE MaDoiSoat LIKE 'DS[0-9][0-9][0-9][0-9]';
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_InsertDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_InsertDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_InsertDoiSoat
    @MaDoiSoat VARCHAR(6),
    @TienCocBanDau DECIMAL(15,2),
    @SoThangLuuTru DECIMAL(5,1),
    @TyLeHoanCocHienTai DECIMAL(5,2),
    @TienCocDuocHoan DECIMAL(15,2),
    @TienThueConNo DECIMAL(15,2),
    @TienDichVuConNo DECIMAL(15,2),
    @TongChiPhiSuaChua DECIMAL(15,2),
    @TienPhat DECIMAL(15,2),
    @TongKhauTru DECIMAL(15,2),
    @SoTienHoanThucTe DECIMAL(15,2),
    @SoTienKhachPhaiTT DECIMAL(15,2),
    @MaNhanVienKeToan VARCHAR(6),
    @MaPhieuTra VARCHAR(6),
    @MaQuyDinhHoanCoc VARCHAR(6) = NULL,
    @GhiChuPhanHoiKhach NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.DoiSoat (
        MaDoiSoat,
        NgayLap,
        TienCocBanDau,
        SoThangLuuTru,
        TyLeHoanCocHienTai,
        TienCocDuocHoan,
        TienThueConNo,
        TienDichVuConNo,
        TongChiPhiSuaChua,
        TienPhat,
        TongKhauTru,
        SoTienHoanThucTe,
        SoTienKhachPhaiTT,
        PhuongThucThanhToan,
        ChungTuThanhToan,
        NgayThanhToan,
        GhiChuPhanHoiKhach,
        TrangThai,
        MaNhanVienKeToan,
        MaPhieuTra,
        MaQuyDinhHoanCoc
    )
    VALUES (
        @MaDoiSoat,
        GETDATE(),
        @TienCocBanDau,
        @SoThangLuuTru,
        @TyLeHoanCocHienTai,
        @TienCocDuocHoan,
        @TienThueConNo,
        @TienDichVuConNo,
        @TongChiPhiSuaChua,
        @TienPhat,
        @TongKhauTru,
        @SoTienHoanThucTe,
        @SoTienKhachPhaiTT,
        NULL,
        NULL,
        NULL,
        @GhiChuPhanHoiKhach,
        N'Chờ xác nhận',
        @MaNhanVienKeToan,
        @MaPhieuTra,
        @MaQuyDinhHoanCoc
    );
END;
GO
