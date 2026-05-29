USE [HOMEDORM4];
GO

IF OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhieuDatCoc', N'U') IS NULL
    THROW 50200, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước khi chạy dat-coc.sql.', 1;
GO

-- ============================================================
-- SP_DanhSachDatCocSale
-- Trả về PhieuDangKy ở các giai đoạn cọc kèm thông tin phiếu.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachDatCocSale', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachDatCocSale AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachDatCocSale
    @MaNhanVienSale VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdk.MaDangKy            AS maDangKy,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        pdk.TrangThai           AS trangThaiDangKy,
        pdk.HinhThucThue        AS hinhThucThue,
        pdk.NgayDangKy          AS ngayDangKy,
        phong.maPhong,
        phong.maGiuong,
        phong.tenPhong,
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1
            ctxp.MaPhong    AS maPhong,
            ctxp.MaGiuong   AS maGiuong,
            p.TenPhong      AS tenPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
        WHERE ctxp.MaDangKy = pdk.MaDangKy
        ORDER BY ctxp.STTLich DESC
    ) AS phong
    OUTER APPLY (
        SELECT TOP 1
            MaPhieuDatCoc,
            TrangThaiThanhToan,
            TrangThaiCoc,
            SoTienCoc,
            ThoiDiemDatCoc
        FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = pdk.MaDangKy
        ORDER BY ThoiDiemDatCoc DESC
    ) AS pdc
    WHERE pdk.TrangThai IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Chấp nhận')
      AND (
        pdk.TrangThai = N'Chờ tiếp nhận'
        OR pdk.MaNhanVienSale = @MaNhanVienSale
      )
    ORDER BY
        CASE pdk.TrangThai
            WHEN N'Chờ xác nhận cọc' THEN 1
            WHEN N'Chấp nhận'        THEN 2
            WHEN N'Chờ tiếp nhận'    THEN 3
            ELSE 4
        END,
        pdk.NgayDangKy DESC;
END;
GO

-- ============================================================
-- SP_GuiYeuCauDatCoc
-- Sale chuyển PhieuDangKy từ "Chờ tiếp nhận" → "Chờ xác nhận cọc".
-- ============================================================
IF OBJECT_ID(N'dbo.SP_GuiYeuCauDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_GuiYeuCauDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

-- ============================================================
-- SP_DanhSachChoXacNhanCoc
-- Danh sách PhieuDangKy đang chờ Quản lý xác nhận khả năng nhận cọc.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoXacNhanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoXacNhanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoXacNhanCoc
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdk.MaDangKy        AS maDangKy,
        nd.HoTen            AS hoTen,
        nd.SDT              AS soDienThoai,
        pdk.HinhThucThue    AS hinhThucThue,
        pdk.NgayDangKy      AS ngayDangKy,
        pdk.MaNhanVienSale  AS maNhanVienSale,
        phong.maPhong,
        phong.maGiuong,
        p.TenPhong          AS tenPhong,
        p.TinhTrang         AS tinhTrangPhong,
        g.TinhTrang         AS tinhTrangGiuong
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1
            ctxp.MaPhong    AS maPhong,
            ctxp.MaGiuong   AS maGiuong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = pdk.MaDangKy
        ORDER BY ctxp.STTLich DESC
    ) AS phong
    LEFT JOIN dbo.Phong  AS p ON p.MaPhong = phong.maPhong
    LEFT JOIN dbo.Giuong AS g ON g.MaPhong = phong.maPhong AND g.MaGiuong = phong.maGiuong
    WHERE pdk.TrangThai = N'Chờ xác nhận cọc'
    ORDER BY pdk.NgayDangKy ASC;
END;
GO

-- ============================================================
-- SP_XacNhanKhaNangNhanCoc
-- Quản lý chấp nhận hoặc từ chối yêu cầu đặt cọc.
-- Khi chấp nhận: SP tự kiểm tra phòng/giường phải còn khả dụng.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_XacNhanKhaNangNhanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_XacNhanKhaNangNhanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_XacNhanKhaNangNhanCoc
    @MaDangKy    VARCHAR(6),
    @MaQuanLy    VARCHAR(6),
    @DuocNhanCoc BIT,
    @LyDo        NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50204, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chờ xác nhận cọc'
    )
        THROW 50205, N'Phiếu đăng ký không ở trạng thái "Chờ xác nhận cọc".', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaQuanLy)
        THROW 50206, N'Không tìm thấy nhân viên quản lý.', 1;

    IF @DuocNhanCoc = 0 AND NULLIF(LTRIM(RTRIM(COALESCE(@LyDo, N''))), N'') IS NULL
        THROW 50207, N'Vui lòng nhập lý do từ chối.', 1;

    IF @DuocNhanCoc = 1
    BEGIN
        DECLARE @MaPhong  VARCHAR(4);
        DECLARE @MaGiuong VARCHAR(3);

        SELECT TOP 1 @MaPhong = ctxp.MaPhong, @MaGiuong = ctxp.MaGiuong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = @MaDangKy
        ORDER BY ctxp.STTLich DESC;

        IF @MaPhong IS NULL
            THROW 50208, N'Hồ sơ chưa có thông tin phòng/giường cụ thể. Cần có lịch xem phòng trước khi chấp nhận.', 1;

        IF @MaGiuong IS NOT NULL
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM dbo.Giuong
                WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong AND TinhTrang = N'Trống'
            )
                THROW 50209, N'Giường đang được sử dụng hoặc không khả dụng. Không thể chấp nhận.', 1;
        END
        ELSE
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM dbo.Phong
                WHERE MaPhong = @MaPhong AND TinhTrang IN (N'Trống', N'Còn chỗ')
            )
                THROW 50209, N'Phòng không còn chỗ trống. Không thể chấp nhận.', 1;
        END
    END

    UPDATE dbo.PhieuDangKy
    SET TrangThai = CASE WHEN @DuocNhanCoc = 1 THEN N'Chấp nhận' ELSE N'Từ chối' END
    WHERE MaDangKy = @MaDangKy;

    SELECT
        pdk.MaDangKy    AS maDangKy,
        nd.HoTen        AS hoTen,
        pdk.TrangThai   AS trangThaiDangKy
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE pdk.MaDangKy = @MaDangKy;
END;
GO

-- ============================================================
-- SP_DanhSachChoLapPhieuDatCoc
-- Danh sách PhieuDangKy đã được Quản lý chấp nhận, chưa có PhieuDatCoc.
-- Kế toán dùng danh sách này để lập phiếu.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoLapPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoLapPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoLapPhieuDatCoc
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdk.MaDangKy        AS maDangKy,
        nd.HoTen            AS hoTen,
        nd.SDT              AS soDienThoai,
        pdk.HinhThucThue    AS hinhThucThue,
        pdk.NgayDangKy      AS ngayDangKy,
        pdk.MaKhachHang     AS maKhachHang,
        phong.maPhong,
        phong.maGiuong,
        p.TenPhong          AS tenPhong,
        CASE
            WHEN pdk.HinhThucThue = N'Ghép' THEN lp.GiaThueTheoGiuong
            ELSE lp.GiaThueNguyenPhong
        END                 AS giaThue
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang  AS kh ON kh.MaKhachHang  = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung  AS nd ON nd.MaNguoiDung   = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1
            ctxp.MaPhong  AS maPhong,
            ctxp.MaGiuong AS maGiuong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = pdk.MaDangKy
        ORDER BY ctxp.STTLich DESC
    ) AS phong
    LEFT JOIN dbo.Phong     AS p  ON p.MaPhong       = phong.maPhong
    LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong  = p.MaLoaiPhong
    WHERE pdk.TrangThai = N'Chấp nhận'
      AND NOT EXISTS (
          SELECT 1 FROM dbo.PhieuDatCoc AS pdc
          WHERE pdc.MaPhieuYeuCauDangKy = pdk.MaDangKy
      )
    ORDER BY pdk.NgayDangKy ASC;
END;
GO

-- ============================================================
-- SP_LapPhieuDatCoc
-- Kế toán tạo PhieuDatCoc + ChiTietDatCoc cho hồ sơ đã được chấp nhận.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_LapPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_LapPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_LapPhieuDatCoc
    @MaDangKy            VARCHAR(6),
    @MaNhanVienKeToan    VARCHAR(6),
    @SoTienCoc           DECIMAL(15,2),
    @PhuongThucThanhToan NVARCHAR(20),
    @ThoiHanThanhToan    DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50210, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chấp nhận'
    )
        THROW 50211, N'Phiếu đăng ký chưa được quản lý chấp nhận.', 1;

    IF EXISTS (
        SELECT 1 FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = @MaDangKy
    )
        THROW 50212, N'Hồ sơ này đã có phiếu đặt cọc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienKeToan)
        THROW 50213, N'Không tìm thấy nhân viên kế toán.', 1;

    DECLARE @MaPhong  VARCHAR(4);
    DECLARE @MaGiuong VARCHAR(3);

    SELECT TOP 1 @MaPhong = ctxp.MaPhong, @MaGiuong = ctxp.MaGiuong
    FROM dbo.ChiTietXemPhong AS ctxp
    WHERE ctxp.MaDangKy = @MaDangKy
    ORDER BY ctxp.STTLich DESC;

    IF @MaPhong IS NULL
        THROW 50214, N'Hồ sơ chưa có thông tin phòng/giường.', 1;

    DECLARE @MaKhachHang  VARCHAR(6);
    DECLARE @HinhThucThue NVARCHAR(20);
    SELECT @MaKhachHang = MaKhachHang, @HinhThucThue = HinhThucThue
    FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy;

    DECLARE @HinhThucThueDC NVARCHAR(20);
    SET @HinhThucThueDC = CASE WHEN @HinhThucThue = N'Ghép' THEN N'Ghép giường' ELSE N'Nguyên phòng' END;

    DECLARE @GiaThue DECIMAL(15,2);
    SELECT @GiaThue = CASE
        WHEN @HinhThucThue = N'Ghép' THEN lp.GiaThueTheoGiuong
        ELSE lp.GiaThueNguyenPhong
    END
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaPhong = @MaPhong;

    IF @ThoiHanThanhToan IS NULL
        SET @ThoiHanThanhToan = DATEADD(HOUR, 24, GETDATE());

    DECLARE @MaPhieuDatCoc VARCHAR(6);
    SELECT @MaPhieuDatCoc = 'PC' + RIGHT('0000' + CAST(
        ISNULL(MAX(CAST(SUBSTRING(MaPhieuDatCoc, 3, 4) AS INT)), 0) + 1
    AS VARCHAR), 4)
    FROM dbo.PhieuDatCoc;

    DECLARE @MaChiTietDC VARCHAR(6);
    SELECT @MaChiTietDC = 'CT' + RIGHT('0000' + CAST(
        ISNULL(MAX(CAST(SUBSTRING(MaChiTietDC, 3, 4) AS INT)), 0) + 1
    AS VARCHAR), 4)
    FROM dbo.ChiTietDatCoc;

    INSERT INTO dbo.PhieuDatCoc (
        MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
        PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue,
        TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
    ) VALUES (
        @MaPhieuDatCoc, GETDATE(), @ThoiHanThanhToan, @SoTienCoc,
        @PhuongThucThanhToan, N'Chờ TT', @HinhThucThueDC,
        N'Hiệu lực', @MaDangKy, @MaKhachHang, @MaNhanVienKeToan
    );

    INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
    VALUES (@MaChiTietDC, @MaPhieuDatCoc, @MaPhong, @MaGiuong, ISNULL(@GiaThue, @SoTienCoc));

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS thoiHanThanhToan,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        nd.HoTen                AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;
END;
GO

-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_GuiYeuCauDatCoc
    @MaDangKy       VARCHAR(6),
    @MaNhanVienSale VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50201, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chờ tiếp nhận'
    )
        THROW 50202, N'Phiếu đăng ký không ở trạng thái "Chờ tiếp nhận".', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienSale)
        THROW 50203, N'Không tìm thấy nhân viên sale.', 1;

    UPDATE dbo.PhieuDangKy
    SET TrangThai      = N'Chờ xác nhận cọc',
        MaNhanVienSale = @MaNhanVienSale
    WHERE MaDangKy = @MaDangKy;

    SELECT
        pdk.MaDangKy    AS maDangKy,
        nd.HoTen        AS hoTen,
        pdk.TrangThai   AS trangThaiDangKy
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE pdk.MaDangKy = @MaDangKy;
END;
GO
