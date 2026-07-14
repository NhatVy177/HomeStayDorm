USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: ĐĂNG KÝ LỊCH TRẢ PHÒNG (dành cho nhân viên Sale)
-- Chạy file này sau khi đã chạy app.sql.
--
-- Danh sách stored procedure:
--   1. SP_TraPhong_Sale_TimKhachHang        -- Tìm kiếm khách hàng theo tên / SĐT / CCCD
--   2. SP_TraPhong_Sale_DanhSachHopDong     -- Lấy HĐ + Phiếu cọc hợp lệ của 1 khách
--   3. SP_TraPhong_Sale_DangKyLichTraPhong  -- Tạo Phiếu trả phòng (trạng thái Chờ xử lý)
-- =============================================

IF OBJECT_ID(N'dbo.PhieuTraPhong', N'U') IS NULL
    THROW 50000, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước.', 1;
GO

-- =============================================
-- 4. SP_TraPhong_KhachHang_GuiYeuCau
-- Khach hang dang nhap tu gui yeu cau tra phong cho hop dong hieu luc.
-- Neu khong truyen ngay du kien tra, he thong lay ngay hien tai.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_KhachHang_GuiYeuCau', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KhachHang_GuiYeuCau AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KhachHang_GuiYeuCau
    @MaKhachHang   VARCHAR(6),
    @MaHopDong     VARCHAR(6) = NULL,
    @MaPhieuDatCoc VARCHAR(6) = NULL,
    @NgayDuKienTra DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MaKhachHang = NULLIF(LTRIM(RTRIM(@MaKhachHang)), '');
    SET @MaHopDong = NULLIF(LTRIM(RTRIM(@MaHopDong)), '');
    SET @MaPhieuDatCoc = NULLIF(LTRIM(RTRIM(@MaPhieuDatCoc)), '');

    IF @MaKhachHang IS NULL
        THROW 50011, N'Thiếu mã khách hàng.', 1;

    IF @NgayDuKienTra IS NULL
        THROW 50011, N'Ngày dự kiến trả phòng không hợp lệ. Vui lòng chọn từ ngày hiện tại trở đi.', 1;

    IF @NgayDuKienTra < CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày dự kiến trả phòng không hợp lệ. Vui lòng chọn từ ngày hiện tại trở đi.', 1;

    IF @MaHopDong IS NULL AND @MaPhieuDatCoc IS NULL
        THROW 50011, N'Vui lòng chọn hợp đồng hoặc phiếu đặt cọc để gửi yêu cầu trả phòng.', 1;

    IF @MaHopDong IS NOT NULL AND @MaPhieuDatCoc IS NOT NULL
        THROW 50011, N'Chỉ được chọn một trong hợp đồng hoặc phiếu đặt cọc.', 1;

    IF @MaHopDong IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.HopDongThue
            WHERE MaHopDong = @MaHopDong
              AND MaKhachHang = @MaKhachHang
              AND TrangThai IN (N'Hiệu lực', N'Hết hạn')
        )
            THROW 50011, N'Hợp đồng không còn hiệu lực/hết hạn hoặc không thuộc khách hàng hiện tại.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.PhieuTraPhong
            WHERE MaHopDong = @MaHopDong
              AND TrangThai NOT IN (N'Hủy', N'Hoàn tất')
        )
            THROW 50011, N'Hồ sơ không đủ điều kiện gửi yêu cầu trả phòng hoặc đã có yêu cầu đang được xử lý.', 1;
    END;

    IF @MaPhieuDatCoc IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.PhieuDatCoc
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc
              AND MaKhachHang = @MaKhachHang
              AND TrangThaiCoc = N'Hiệu lực'
              AND TrangThaiThanhToan = N'Đã TT'
        )
            THROW 50011, N'Phiếu đặt cọc không còn hiệu lực, chưa thanh toán hoặc không thuộc khách hàng hiện tại.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.HopDongThue
            WHERE MaPhieuCoc = @MaPhieuDatCoc
        )
            THROW 50011, N'Phiếu đặt cọc này đã được chuyển thành hợp đồng thuê.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.PhieuTraPhong
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc
              AND TrangThai NOT IN (N'Hủy', N'Hoàn tất')
        )
            THROW 50011, N'Hồ sơ không đủ điều kiện gửi yêu cầu trả phòng hoặc đã có yêu cầu đang được xử lý.', 1;
    END;

    DECLARE @SoThuTu INT;
    DECLARE @MaPhieuTra VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaPhieuTra, 3, 4))), 0) + 1
        FROM dbo.PhieuTraPhong WITH (UPDLOCK, HOLDLOCK)
        WHERE MaPhieuTra LIKE 'TP[0-9][0-9][0-9][0-9]';

        IF @SoThuTu > 9999
            THROW 50011, N'Không thể sinh thêm mã phiếu trả phòng mới.', 1;

        SET @MaPhieuTra = CONCAT('TP', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.PhieuTraPhong (
            MaPhieuTra,
            NgayDangKyTra,
            NgayDuKienTra,
            NgayTraThucTe,
            TrangThai,
            MaHopDong,
            MaPhieuDatCoc
        )
        VALUES (
            @MaPhieuTra,
            CAST(GETDATE() AS DATE),
            @NgayDuKienTra,
            NULL,
            N'Chờ xử lý',
            @MaHopDong,
            @MaPhieuDatCoc
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        MaPhieuTra    AS maPhieuTra,
        MaHopDong     AS maHopDong,
        MaPhieuDatCoc AS maPhieuDatCoc,
        NgayDangKyTra AS ngayDangKyTra,
        NgayDuKienTra AS ngayDuKienTra,
        TrangThai     AS trangThai
    FROM dbo.PhieuTraPhong
    WHERE MaPhieuTra = @MaPhieuTra;
END;
GO

-- =============================================
-- 5. SP_TraPhong_KhachHang_HuyYeuCau
-- Khach hang huy yeu cau tra phong khi phieu con o trang thai Cho xu ly.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_KhachHang_HuyYeuCau', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KhachHang_HuyYeuCau AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KhachHang_HuyYeuCau
    @MaKhachHang VARCHAR(6),
    @MaPhieuTra  VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaKhachHang = NULLIF(LTRIM(RTRIM(@MaKhachHang)), '');
    SET @MaPhieuTra = NULLIF(LTRIM(RTRIM(@MaPhieuTra)), '');

    IF @MaKhachHang IS NULL OR @MaPhieuTra IS NULL
        THROW 50011, N'Thiếu thông tin yêu cầu trả phòng cần hủy.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.PhieuTraPhong AS ptp
        LEFT JOIN dbo.HopDongThue AS hd ON hd.MaHopDong = ptp.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = ptp.MaPhieuDatCoc
        WHERE ptp.MaPhieuTra = @MaPhieuTra
          AND COALESCE(hd.MaKhachHang, pdc.MaKhachHang) = @MaKhachHang
    )
        THROW 50010, N'Không tìm thấy yêu cầu trả phòng của khách hàng hiện tại.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.PhieuTraPhong
        WHERE MaPhieuTra = @MaPhieuTra
          AND TrangThai = N'Chờ xử lý'
    )
        THROW 50011, N'Chỉ có thể hủy yêu cầu trả phòng đang chờ xử lý.', 1;

    UPDATE dbo.PhieuTraPhong
    SET TrangThai = N'Hủy'
    WHERE MaPhieuTra = @MaPhieuTra;

    SELECT
        MaPhieuTra    AS maPhieuTra,
        MaHopDong     AS maHopDong,
        MaPhieuDatCoc AS maPhieuDatCoc,
        NgayDangKyTra AS ngayDangKyTra,
        NgayDuKienTra AS ngayDuKienTra,
        TrangThai     AS trangThai
    FROM dbo.PhieuTraPhong
    WHERE MaPhieuTra = @MaPhieuTra;
END;
GO

