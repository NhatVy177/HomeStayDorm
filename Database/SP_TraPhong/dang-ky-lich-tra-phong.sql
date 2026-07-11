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
-- 1. SP_TraPhong_Sale_TimKhachHang
-- Nhân viên Sale tra cứu khách hàng theo tên / SĐT / CCCD.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_Sale_TimKhachHang', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_Sale_TimKhachHang AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_Sale_TimKhachHang
    @TuKhoa     NVARCHAR(100) = NULL    -- Tìm theo tên, SĐT, hoặc CCCD
AS
BEGIN
    SET NOCOUNT ON;

    SET @TuKhoa = NULLIF(LTRIM(RTRIM(@TuKhoa)), N'');

    SELECT TOP 50
        kh.MaKhachHang          AS maKhachHang,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS sdt,
        nd.Email                AS email,
        kh.CCCD                 AS cccd,
        kh.QuocTich             AS quocTich,
        nd.GioiTinh             AS gioiTinh,
        nd.NgaySinh             AS ngaySinh
    FROM dbo.KhachHang AS kh
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE @TuKhoa IS NULL
       OR nd.HoTen LIKE N'%' + @TuKhoa + N'%'
       OR nd.SDT   LIKE '%' + @TuKhoa + '%'
       OR kh.CCCD  LIKE '%' + @TuKhoa + '%'
    ORDER BY nd.HoTen;
END;
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
              AND TrangThai = N'Hiệu lực'
        )
            THROW 50011, N'Hợp đồng không còn hiệu lực hoặc không thuộc khách hàng hiện tại.', 1;

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

-- =============================================
-- 2. SP_TraPhong_Sale_DanhSachHopDong
-- Lấy tất cả Hợp đồng thuê chưa thanh lý hoặc Phiếu đặt cọc còn hiệu lực,
-- đã thanh toán nhưng chưa lập hợp đồng của một khách hàng.
-- Kèm cờ dangCoYeuCau để UI cảnh báo.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_Sale_DanhSachHopDong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_Sale_DanhSachHopDong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_Sale_DanhSachHopDong
    @MaKhachHang    VARCHAR(6),
    @MaNhanVien     VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaKhachHang = NULLIF(LTRIM(RTRIM(@MaKhachHang)), '');

    IF @MaKhachHang IS NULL
        THROW 50011, N'Vui lòng cung cấp mã khách hàng.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @MaKhachHang)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    -- Hợp đồng thuê còn hiệu lực
    SELECT
        hdt.MaHopDong               AS maHopDong,
        N'HopDong'                  AS loai,
        p.TenPhong                  AS tenPhong,
        cn.TenChiNhanh              AS tenChiNhanh,
        cn.DiaChi                   AS diaChiChiNhanh,
        pdc.HinhThucThue            AS hinhThucThue,
        hdt.GiaThue                 AS giaThu,
        hdt.SoGiuongThue            AS soGiuong,
        ctdc.MaGiuong               AS maGiuong,
        CONVERT(VARCHAR(10), hdt.NgayBatDau, 120)   AS ngayBatDau,
        CONVERT(VARCHAR(10), hdt.NgayKetThuc, 120)  AS ngayKetThuc,
        hdt.TrangThai               AS trangThai,
        pdc.SoTienCoc               AS tienCoc,
        CONVERT(VARCHAR(10), pdc.ThoiDiemDatCoc, 120) AS ngayDatCoc,
        CAST(
            CASE WHEN EXISTS (
                SELECT 1 FROM dbo.PhieuTraPhong AS ptp
                WHERE ptp.MaHopDong = hdt.MaHopDong
                  AND ptp.TrangThai = N'Chờ xử lý'
            ) THEN 1 ELSE 0 END
        AS BIT)                     AS dangCoYeuCau
    FROM dbo.HopDongThue AS hdt
    INNER JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
    INNER JOIN dbo.ChiTietDatCoc AS ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    WHERE hdt.MaKhachHang = @MaKhachHang
      AND hdt.TrangThai IN (N'Hiệu lực', N'Hết hạn')
      AND cn.MaChiNhanh = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien)

    UNION ALL

    -- Phiếu đặt cọc còn hiệu lực, đã thanh toán, chưa lập hợp đồng
    SELECT
        pdc.MaPhieuDatCoc           AS maHopDong,
        N'DatCoc'                   AS loai,
        p.TenPhong                  AS tenPhong,
        cn.TenChiNhanh              AS tenChiNhanh,
        cn.DiaChi                   AS diaChiChiNhanh,
        pdc.HinhThucThue            AS hinhThucThue,
        ctdc.GiaThue                AS giaThu,
        NULL                        AS soGiuong,
        ctdc.MaGiuong               AS maGiuong,
        NULL                        AS ngayBatDau,
        NULL                        AS ngayKetThuc,
        pdc.TrangThaiCoc            AS trangThai,
        pdc.SoTienCoc               AS tienCoc,
        CONVERT(VARCHAR(10), pdc.ThoiDiemDatCoc, 120) AS ngayDatCoc,
        CAST(
            CASE WHEN EXISTS (
                SELECT 1 FROM dbo.PhieuTraPhong AS ptp
                WHERE ptp.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                  AND ptp.TrangThai = N'Chờ xử lý'
            ) THEN 1 ELSE 0 END
        AS BIT)                     AS dangCoYeuCau
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.ChiTietDatCoc AS ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    WHERE pdc.MaKhachHang = @MaKhachHang
      AND pdc.TrangThaiCoc = N'Hiệu lực'
      AND pdc.TrangThaiThanhToan = N'Đã TT'
      AND cn.MaChiNhanh = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien)
      AND NOT EXISTS (
          SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = pdc.MaPhieuDatCoc
      )

    ORDER BY loai, maHopDong;
END;
GO

-- =============================================
-- 3. SP_TraPhong_Sale_DangKyLichTraPhong
-- Nhân viên Sale đăng ký lịch trả phòng cho khách.
-- Tạo PhieuTraPhong với trạng thái "Chờ xử lý".
-- Ràng buộc:
--   - Ngày dự kiến trả >= ngày hiện tại
--   - HĐ/Phiếu cọc chưa có phiếu trả phòng đang ở trạng thái "Chờ xử lý"
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_Sale_DangKyLichTraPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_Sale_DangKyLichTraPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_Sale_DangKyLichTraPhong
    @MaKhachHang        VARCHAR(6),
    @MaHopDong          VARCHAR(6)  = NULL,
    @MaPhieuDatCoc      VARCHAR(6)  = NULL,
    @NgayDuKienTra      DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- ── Làm sạch tham số ────────────────────────────────────────────
    SET @MaKhachHang   = NULLIF(LTRIM(RTRIM(@MaKhachHang)), '');
    SET @MaHopDong     = NULLIF(LTRIM(RTRIM(@MaHopDong)), '');
    SET @MaPhieuDatCoc = NULLIF(LTRIM(RTRIM(@MaPhieuDatCoc)), '');

    -- ── Kiểm tra tham số bắt buộc ───────────────────────────────────
    IF @MaKhachHang IS NULL
        THROW 50011, N'Thiếu mã khách hàng.', 1;

    IF @NgayDuKienTra IS NULL
        THROW 50011, N'Vui lòng nhập ngày dự kiến trả phòng.', 1;

    IF @MaHopDong IS NULL AND @MaPhieuDatCoc IS NULL
        THROW 50011, N'Vui lòng chọn hợp đồng hoặc phiếu đặt cọc.', 1;

    IF @MaHopDong IS NOT NULL AND @MaPhieuDatCoc IS NOT NULL
        THROW 50011, N'Chỉ được chọn một trong hợp đồng hoặc phiếu đặt cọc.', 1;

    -- ── Kiểm tra tồn tại khách hàng ─────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @MaKhachHang)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    -- ── Kiểm tra ngày dự kiến hợp lệ ────────────────────────────────
    IF @NgayDuKienTra < CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày dự kiến trả phòng không hợp lệ (phải từ hôm nay trở đi).', 1;

    -- ── Kiểm tra Hợp đồng thuê ──────────────────────────────────────
    IF @MaHopDong IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM dbo.HopDongThue
            WHERE MaHopDong    = @MaHopDong
              AND MaKhachHang  = @MaKhachHang
              AND TrangThai    = N'Hiệu lực'
        )
            THROW 50011, N'Không tìm thấy hợp đồng thuê còn hiệu lực của khách hàng này.', 1;

        -- Kiểm tra đã có phiếu trả phòng đang chờ xử lý chưa (E9)
        IF EXISTS (
            SELECT 1 FROM dbo.PhieuTraPhong
            WHERE MaHopDong = @MaHopDong
              AND TrangThai = N'Chờ xử lý'
        )
            THROW 50011, N'Hợp đồng này đã có một phiếu trả phòng đang được xử lý.', 1;
    END;

    -- ── Kiểm tra Phiếu đặt cọc ──────────────────────────────────────
    IF @MaPhieuDatCoc IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM dbo.PhieuDatCoc
            WHERE MaPhieuDatCoc      = @MaPhieuDatCoc
              AND MaKhachHang        = @MaKhachHang
              AND TrangThaiCoc       = N'Hiệu lực'
              AND TrangThaiThanhToan = N'Đã TT'
        )
            THROW 50011, N'Không tìm thấy phiếu đặt cọc hợp lệ của khách hàng này.', 1;

        IF EXISTS (
            SELECT 1 FROM dbo.HopDongThue
            WHERE MaPhieuCoc = @MaPhieuDatCoc
        )
            THROW 50011, N'Phiếu đặt cọc này đã được chuyển thành hợp đồng thuê.', 1;

        -- Kiểm tra đã có phiếu trả phòng đang chờ xử lý chưa (E9)
        IF EXISTS (
            SELECT 1 FROM dbo.PhieuTraPhong
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc
              AND TrangThai     = N'Chờ xử lý'
        )
            THROW 50011, N'Phiếu đặt cọc này đã có một phiếu trả phòng đang được xử lý.', 1;
    END;

    -- ── Sinh mã phiếu trả phòng ─────────────────────────────────────
    DECLARE @SoThuTu    INT;
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
            CAST(GETDATE() AS DATE),    -- Ngày đăng ký = ngày hiện tại (hệ thống tự ghi nhận)
            @NgayDuKienTra,
            NULL,
            N'Chờ xử lý',
            @MaHopDong,
            @MaPhieuDatCoc
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    -- Trả về phiếu vừa tạo kèm thông tin liên quan
    SELECT
        ptp.MaPhieuTra                              AS maPhieuTra,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 120) AS ngayDuKienTra,
        ptp.TrangThai                               AS trangThai,
        ptp.MaHopDong                               AS maHopDong,
        ptp.MaPhieuDatCoc                           AS maPhieuDatCoc,
        nd.HoTen                                    AS hoTenKhach,
        nd.SDT                                      AS sdtKhach
    FROM dbo.PhieuTraPhong AS ptp
    LEFT JOIN dbo.HopDongThue AS hdt    ON hdt.MaHopDong         = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc AS pdc2   ON pdc2.MaPhieuDatCoc    = ptp.MaPhieuDatCoc
    INNER JOIN dbo.KhachHang  AS kh     ON kh.MaKhachHang        = COALESCE(hdt.MaKhachHang, pdc2.MaKhachHang)
    INNER JOIN dbo.NguoiDung  AS nd     ON nd.MaNguoiDung         = kh.MaKhachHang
    WHERE ptp.MaPhieuTra = @MaPhieuTra;
END;
GO

