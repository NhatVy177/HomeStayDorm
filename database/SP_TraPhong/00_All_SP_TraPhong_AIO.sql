-- =============================================
-- ALL IN ONE SCRIPT - MODULE TRẢ PHÒNG
-- Tự động gộp toàn bộ SP của các chức năng Trả phòng.
-- Hãy chạy file này để tạo toàn bộ Stored Procedure trong 1 lần.
-- =============================================
USE [HOMEDORM4];
GO

IF OBJECT_ID(N'dbo.ChiTietHuHong', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ChiTietHuHong', N'ThuTuTaiSan') IS NULL
BEGIN
    ALTER TABLE dbo.ChiTietHuHong ADD ThuTuTaiSan INT NULL;
END
GO


-- =============================================
-- START FILE: dang-ky-lich-tra-phong.sql
-- =============================================
USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: ĐĂNG KÝ LỊCH TRẢ PHÒNG
-- Chạy file này sau khi đã chạy app.sql.
--
-- Danh sách stored procedure:
--   1. SP_TraPhong_Sale_TimKhachHang         -- Tìm khách hàng kèm cờ coPhieuTraHienHanh
--   2. SP_TraPhong_Sale_LayHoSoHienHanh      -- Lấy hồ sơ lưu trú hiện hành + phiếu trả phòng
--   3. SP_TraPhong_Sale_DangKyLichTraPhong   -- Tạo Phiếu trả phòng (trạng thái Chờ xử lý)
--   4. SP_TraPhong_KhachHang_GuiYeuCau       -- Khách hàng tự gửi yêu cầu trả phòng
--   5. SP_TraPhong_KhachHang_HuyYeuCau       -- Khách hàng tự hủy yêu cầu trả phòng
-- =============================================

IF OBJECT_ID(N'dbo.PhieuTraPhong', N'U') IS NULL
    THROW 50000, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước.', 1;
GO
-- =============================================
-- 1. SP_TraPhong_Sale_TimKhachHang
-- Nhân viên Sale tra cứu khách hàng theo tên / SĐT / CCCD.
-- Kèm cờ coPhieuTraHienHanh: 1 nếu hồ sơ tại chi nhánh NV đã có
-- phiếu trả phòng trạng thái khác 'Hủy'; 0 ngược lại.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_Sale_TimKhachHang', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_Sale_TimKhachHang AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_Sale_TimKhachHang
    @TuKhoa     NVARCHAR(100) = NULL,   -- Tìm theo tên, SĐT, hoặc CCCD
    @MaNhanVien VARCHAR(6)    = NULL    -- Mã nhân viên sale (xác định chi nhánh)
AS
BEGIN
    SET NOCOUNT ON;

    SET @TuKhoa = NULLIF(LTRIM(RTRIM(@TuKhoa)), N'');

    -- Chi nhánh của nhân viên sale
    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    SELECT TOP 50
        kh.MaKhachHang          AS maKhachHang,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS sdt,
        nd.Email                AS email,
        kh.CCCD                 AS cccd,
        kh.QuocTich             AS quocTich,
        nd.GioiTinh             AS gioiTinh,
        nd.NgaySinh             AS ngaySinh,
        -- Cờ: hồ sơ lưu trú hiện hành tại chi nhánh NV đang có phiếu trả phòng chưa hủy
        CAST(
            CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.PhieuTraPhong ptp
                WHERE ptp.TrangThai <> N'Hủy'
                  AND (
                        -- Hợp đồng thuê chưa thanh lý, thuộc chi nhánh NV
                        EXISTS (
                            SELECT 1 FROM dbo.HopDongThue hd
                            INNER JOIN dbo.PhieuDatCoc pdc2 ON pdc2.MaPhieuDatCoc = hd.MaPhieuCoc
                            INNER JOIN dbo.ChiTietDatCoc ctdc2 ON ctdc2.MaPhieuDatCoc = pdc2.MaPhieuDatCoc
                            INNER JOIN dbo.Phong p2 ON p2.MaPhong = ctdc2.MaPhong
                            WHERE hd.MaHopDong = ptp.MaHopDong
                              AND hd.MaKhachHang = kh.MaKhachHang
                              AND hd.TrangThai IN (N'Hiệu lực', N'Hết hạn')
                              AND p2.MaChiNhanh = @MaChiNhanh
                        )
                        OR
                        -- Phiếu đặt cọc hiệu lực, thuộc chi nhánh NV
                        EXISTS (
                            SELECT 1 FROM dbo.PhieuDatCoc pdc3
                            INNER JOIN dbo.ChiTietDatCoc ctdc3 ON ctdc3.MaPhieuDatCoc = pdc3.MaPhieuDatCoc
                            INNER JOIN dbo.Phong p3 ON p3.MaPhong = ctdc3.MaPhong
                            WHERE pdc3.MaPhieuDatCoc = ptp.MaPhieuDatCoc
                              AND pdc3.MaKhachHang = kh.MaKhachHang
                              AND pdc3.TrangThaiCoc = N'Hiệu lực'
                              AND pdc3.TrangThaiThanhToan = N'Đã TT'
                              AND p3.MaChiNhanh = @MaChiNhanh
                              AND NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = pdc3.MaPhieuDatCoc)
                        )
                  )
            ) THEN 1 ELSE 0 END
        AS BIT)                 AS coPhieuTraHienHanh
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
-- 2. SP_TraPhong_Sale_LayHoSoHienHanh
-- Lấy hồ sơ lưu trú hiện hành của khách tại chi nhánh NV sale,
-- kèm thông tin phiếu trả phòng hiện có (nếu có trạng thái khác 'Hủy').
--
-- Hồ sơ hợp lệ:
--   (a) Hợp đồng thuê TrangThai IN ('Hiệu lực', 'Hết hạn'), chưa thanh lý
--   (b) Phiếu đặt cọc TrangThaiCoc='Hiệu lực', TrangThaiThanhToan='Đã TT',
--       chưa chuyển thành hợp đồng thuê
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_Sale_LayHoSoHienHanh', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_Sale_LayHoSoHienHanh AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_Sale_LayHoSoHienHanh
    @MaKhachHang VARCHAR(6),
    @MaNhanVien  VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaKhachHang = NULLIF(LTRIM(RTRIM(@MaKhachHang)), '');
    SET @MaNhanVien  = NULLIF(LTRIM(RTRIM(@MaNhanVien)),  '');

    IF @MaKhachHang IS NULL
        THROW 50011, N'Thiếu mã khách hàng.', 1;
    IF @MaNhanVien IS NULL
        THROW 50011, N'Thiếu mã nhân viên.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @MaKhachHang)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
        THROW 50011, N'Không xác định được chi nhánh của nhân viên.', 1;

    -- Hồ sơ hiện hành (lấy tối đa 1 bản ghi: khách chỉ có 1 hồ sơ tại 1 thời điểm)
    -- Kết hợp hợp đồng thuê và phiếu đặt cọc bằng UNION ALL rồi lấy TOP 1
    SELECT TOP 1
        hs.loai,
        hs.maHoSo,
        hs.maHopDong,
        hs.maPhieuDatCoc,
        hs.trangThaiHoSo,
        hs.tenPhong,
        hs.maGiuong,
        hs.tenChiNhanh,
        hs.hinhThucThue,
        hs.giaThu,
        hs.soGiuong,
        hs.ngayBatDau,
        hs.ngayKetThuc,
        hs.tienCoc,
        hs.ngayDatCoc,
        -- Thông tin phiếu trả phòng hiện có (nếu có, trạng thái <> 'Hủy')
        ptp.MaPhieuTra          AS maPhieuTra,
        ptp.TrangThai           AS trangThaiPhieu,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 120) AS ngayDuKienTra
    FROM (
        -- (a) Hợp đồng thuê
        SELECT
            N'HopDong'                                      AS loai,
            hd.MaHopDong                                    AS maHoSo,
            hd.MaHopDong                                    AS maHopDong,
            NULL                                            AS maPhieuDatCoc,
            hd.TrangThai                                    AS trangThaiHoSo,
            p.TenPhong                                      AS tenPhong,
            ctdc.MaGiuong                                   AS maGiuong,
            cn.TenChiNhanh                                  AS tenChiNhanh,
            pdc.HinhThucThue                                AS hinhThucThue,
            hd.GiaThue                                      AS giaThu,
            hd.SoGiuongThue                                 AS soGiuong,
            CONVERT(VARCHAR(10), hd.NgayBatDau, 120)        AS ngayBatDau,
            CONVERT(VARCHAR(10), hd.NgayKetThuc, 120)       AS ngayKetThuc,
            CASE 
                WHEN pdc.HinhThucThue = N'Ghép giường' THEN 
                    ISNULL((SELECT TOP 1 lp.GiaThueTheoGiuong 
                     FROM dbo.ChiTietDatCoc ctdc 
                     INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong 
                     INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong 
                     WHERE ctdc.MaPhieuDatCoc = hd.MaPhieuCoc), 0) * 2 * ISNULL(hd.SoGiuongThue, 1)
                ELSE pdc.SoTienCoc
            END AS tienCoc,
            CONVERT(VARCHAR(10), pdc.ThoiDiemDatCoc, 120)  AS ngayDatCoc
        FROM dbo.HopDongThue AS hd
        INNER JOIN dbo.PhieuDatCoc AS pdc    ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
        INNER JOIN dbo.ChiTietDatCoc AS ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.Phong AS p            ON p.MaPhong = ctdc.MaPhong
        INNER JOIN dbo.ChiNhanh AS cn        ON cn.MaChiNhanh = p.MaChiNhanh
        WHERE hd.MaKhachHang = @MaKhachHang
          AND hd.TrangThai IN (N'Hiệu lực', N'Hết hạn')
          AND cn.MaChiNhanh = @MaChiNhanh

        UNION ALL

        -- (b) Phiếu đặt cọc hiệu lực, đã thanh toán, chưa lập hợp đồng
        SELECT
            N'DatCoc'                                       AS loai,
            pdc2.MaPhieuDatCoc                              AS maHoSo,
            NULL                                            AS maHopDong,
            pdc2.MaPhieuDatCoc                              AS maPhieuDatCoc,
            pdc2.TrangThaiCoc                               AS trangThaiHoSo,
            p2.TenPhong                                     AS tenPhong,
            ctdc2.MaGiuong                                  AS maGiuong,
            cn2.TenChiNhanh                                 AS tenChiNhanh,
            pdc2.HinhThucThue                               AS hinhThucThue,
            ctdc2.GiaThue                                   AS giaThu,
            NULL                                            AS soGiuong,
            NULL                                            AS ngayBatDau,
            NULL                                            AS ngayKetThuc,
            CASE 
                WHEN pdc2.HinhThucThue = N'Ghép giường' THEN 
                    ISNULL((SELECT TOP 1 lp.GiaThueTheoGiuong 
                     FROM dbo.ChiTietDatCoc ctdc 
                     INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong 
                     INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong 
                     WHERE ctdc.MaPhieuDatCoc = pdc2.MaPhieuDatCoc), 0) * 2 * (SELECT COUNT(*) FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = pdc2.MaPhieuDatCoc)
                ELSE pdc2.SoTienCoc
            END AS tienCoc,
            CONVERT(VARCHAR(10), pdc2.ThoiDiemDatCoc, 120) AS ngayDatCoc
        FROM dbo.PhieuDatCoc AS pdc2
        INNER JOIN dbo.ChiTietDatCoc AS ctdc2 ON ctdc2.MaPhieuDatCoc = pdc2.MaPhieuDatCoc
        INNER JOIN dbo.Phong AS p2             ON p2.MaPhong = ctdc2.MaPhong
        INNER JOIN dbo.ChiNhanh AS cn2         ON cn2.MaChiNhanh = p2.MaChiNhanh
        WHERE pdc2.MaKhachHang = @MaKhachHang
          AND pdc2.TrangThaiCoc = N'Hiệu lực'
          AND pdc2.TrangThaiThanhToan = N'Đã TT'
          AND cn2.MaChiNhanh = @MaChiNhanh
          AND NOT EXISTS (
              SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = pdc2.MaPhieuDatCoc
          )
    ) AS hs
    -- JOIN với PhieuTraPhong hiện có (trạng thái <> 'Hủy')
    LEFT JOIN dbo.PhieuTraPhong AS ptp
           ON (ptp.MaHopDong = hs.maHopDong OR ptp.MaPhieuDatCoc = hs.maPhieuDatCoc)
          AND ptp.TrangThai <> N'Hủy'
    ORDER BY hs.loai; -- HopDong trước DatCoc
END;
GO

-- =============================================
-- 3. SP_TraPhong_Sale_DangKyLichTraPhong
-- Nhân viên Sale đăng ký lịch trả phòng cho khách.
-- Tạo PhieuTraPhong với trạng thái "Chờ xử lý".
-- Ràng buộc:
--   - Ngày dự kiến trả >= ngày hiện tại
--   - HĐ/Phiếu cọc chưa có phiếu trả phòng có TrangThai <> 'Hủy'
--   - Hồ sơ phải thuộc chi nhánh của NV sale
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_Sale_DangKyLichTraPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_Sale_DangKyLichTraPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_Sale_DangKyLichTraPhong
    @MaKhachHang    VARCHAR(6),
    @MaNhanVien     VARCHAR(6),
    @MaHopDong      VARCHAR(6)  = NULL,
    @MaPhieuDatCoc  VARCHAR(6)  = NULL,
    @NgayDuKienTra  DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- ── Làm sạch tham số ────────────────────────────────────────────
    SET @MaKhachHang   = NULLIF(LTRIM(RTRIM(@MaKhachHang)),   '');
    SET @MaNhanVien    = NULLIF(LTRIM(RTRIM(@MaNhanVien)),    '');
    SET @MaHopDong     = NULLIF(LTRIM(RTRIM(@MaHopDong)),     '');
    SET @MaPhieuDatCoc = NULLIF(LTRIM(RTRIM(@MaPhieuDatCoc)), '');

    -- ── Kiểm tra tham số bắt buộc ───────────────────────────────────
    IF @MaKhachHang IS NULL
        THROW 50011, N'Thiếu mã khách hàng.', 1;
    IF @MaNhanVien IS NULL
        THROW 50011, N'Thiếu mã nhân viên.', 1;
    IF @NgayDuKienTra IS NULL
        THROW 50011, N'Vui lòng nhập ngày dự kiến trả phòng.', 1;
    IF @MaHopDong IS NULL AND @MaPhieuDatCoc IS NULL
        THROW 50011, N'Vui lòng chọn hợp đồng hoặc phiếu đặt cọc.', 1;
    IF @MaHopDong IS NOT NULL AND @MaPhieuDatCoc IS NOT NULL
        THROW 50011, N'Chỉ được chọn một trong hợp đồng hoặc phiếu đặt cọc.', 1;

    -- ── Kiểm tra tồn tại khách hàng ─────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @MaKhachHang)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    -- ── Lấy chi nhánh nhân viên ──────────────────────────────────────
    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;
    IF @MaChiNhanh IS NULL
        THROW 50011, N'Không xác định được chi nhánh của nhân viên.', 1;

    -- ── Kiểm tra ngày dự kiến hợp lệ ────────────────────────────────
    IF @NgayDuKienTra < CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày dự kiến trả phòng không hợp lệ. Vui lòng chọn ngày từ ngày hiện tại trở đi.', 1;

    -- ── Kiểm tra Hợp đồng thuê ──────────────────────────────────────
    IF @MaHopDong IS NOT NULL
    BEGIN
        -- Hồ sơ phải thuộc khách, còn hiệu lực/hết hạn, thuộc chi nhánh NV
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.HopDongThue hd
            INNER JOIN dbo.PhieuDatCoc pdc    ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
            INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
            INNER JOIN dbo.Phong p            ON p.MaPhong = ctdc.MaPhong
            WHERE hd.MaHopDong   = @MaHopDong
              AND hd.MaKhachHang = @MaKhachHang
              AND hd.TrangThai   IN (N'Hiệu lực', N'Hết hạn')
              AND p.MaChiNhanh   = @MaChiNhanh
        )
            THROW 50011, N'Không tìm thấy hợp đồng thuê hợp lệ tại chi nhánh này.', 1;

        -- Hồ sơ chưa có phiếu trả phòng trạng thái khác 'Hủy'
        IF EXISTS (
            SELECT 1 FROM dbo.PhieuTraPhong
            WHERE MaHopDong = @MaHopDong
              AND TrangThai <> N'Hủy'
        )
            THROW 50011, N'Hợp đồng này đã có phiếu trả phòng đang được xử lý.', 1;
    END;

    -- ── Kiểm tra Phiếu đặt cọc ──────────────────────────────────────
    IF @MaPhieuDatCoc IS NOT NULL
    BEGIN
        -- Hồ sơ phải hợp lệ và thuộc chi nhánh NV
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.PhieuDatCoc pdc
            INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
            INNER JOIN dbo.Phong p            ON p.MaPhong = ctdc.MaPhong
            WHERE pdc.MaPhieuDatCoc      = @MaPhieuDatCoc
              AND pdc.MaKhachHang        = @MaKhachHang
              AND pdc.TrangThaiCoc       = N'Hiệu lực'
              AND pdc.TrangThaiThanhToan = N'Đã TT'
              AND p.MaChiNhanh           = @MaChiNhanh
        )
            THROW 50011, N'Không tìm thấy phiếu đặt cọc hợp lệ tại chi nhánh này.', 1;

        -- Phiếu cọc chưa được chuyển thành hợp đồng
        IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = @MaPhieuDatCoc)
            THROW 50011, N'Phiếu đặt cọc này đã được chuyển thành hợp đồng thuê.', 1;

        -- Hồ sơ chưa có phiếu trả phòng trạng thái khác 'Hủy'
        IF EXISTS (
            SELECT 1 FROM dbo.PhieuTraPhong
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc
              AND TrangThai <> N'Hủy'
        )
            THROW 50011, N'Phiếu đặt cọc này đã có phiếu trả phòng đang được xử lý.', 1;
    END;

    -- ── Sinh mã phiếu trả phòng và tạo bản ghi ──────────────────────
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
            CAST(GETDATE() AS DATE),    -- Hệ thống tự ghi nhận
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
        ptp.MaPhieuTra                               AS maPhieuTra,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 120) AS ngayDuKienTra,
        ptp.TrangThai                                AS trangThai,
        ptp.MaHopDong                                AS maHopDong,
        ptp.MaPhieuDatCoc                            AS maPhieuDatCoc,
        nd.HoTen                                     AS hoTenKhach,
        nd.SDT                                       AS sdtKhach
    FROM dbo.PhieuTraPhong AS ptp
    LEFT JOIN dbo.HopDongThue AS hd  ON hd.MaHopDong      = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = ptp.MaPhieuDatCoc
    INNER JOIN dbo.KhachHang  AS kh  ON kh.MaKhachHang    = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
    INNER JOIN dbo.NguoiDung  AS nd  ON nd.MaNguoiDung     = kh.MaKhachHang
    WHERE ptp.MaPhieuTra = @MaPhieuTra;
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


GO


-- =============================================
-- START FILE: kiem-tra-tra-phong.sql
-- =============================================
-- =========================================================================
-- MODULE: KIỂM TRA TRẢ PHÒNG (Dành cho Quản lý)
-- =========================================================================

-- =============================================
-- 1. SP_TraPhong_QuanLy_DanhSachChoXuLy
-- Lấy danh sách phiếu trả phòng đang "Chờ xử lý" theo chi nhánh của QL
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachChoXuLy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachChoXuLy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachChoXuLy
    @MaNhanVien VARCHAR(6),
    @TrangThaiLoc NVARCHAR(50) = N'Chờ xử lý'
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy mã chi nhánh của quản lý
    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
    BEGIN
        THROW 50000, N'Không tìm thấy thông tin nhân viên quản lý.', 1;
    END

    SELECT 
        ptp.MaPhieuTra                              AS maPhieuTra,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 120) AS ngayDuKienTra,
        ptp.MaHopDong                               AS maHopDong,
        ptp.MaPhieuDatCoc                           AS maPhieuDatCoc,
        CASE WHEN ptp.MaHopDong IS NOT NULL THEN N'HopDong' ELSE N'DatCoc' END AS loaiNguon,
        COALESCE(ptp.MaHopDong, ptp.MaPhieuDatCoc)  AS maNguon,
        nd.HoTen                                    AS hoTenKhach,
        nd.SDT                                      AS sdtKhach,
        p.TenPhong                                  AS tenPhong,
        ctdc_p.MaGiuong                             AS maGiuong,
        ptp.TrangThai                               AS trangThai
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
    CROSS APPLY (
        SELECT TOP 1 MaPhong, 
               STUFF((SELECT ', ' + c2.MaGiuong 
                      FROM dbo.ChiTietDatCoc c2
                      WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c2.MaGiuong IS NOT NULL
                      FOR XML PATH('')), 1, 2, '') AS MaGiuong
        FROM dbo.ChiTietDatCoc c1
        WHERE c1.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctdc_p
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc_p.MaPhong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hdt.MaKhachHang, pdc.MaKhachHang)
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE p.MaChiNhanh = @MaChiNhanh
      AND (
          (@TrangThaiLoc = N'Chờ xử lý' AND ptp.TrangThai = N'Chờ xử lý') OR
          (@TrangThaiLoc = N'Đã xử lý'  AND ptp.TrangThai IN (N'Chờ đối soát', N'Chờ ký biên bản', N'Chờ hoàn cọc', N'Hoàn tất')) OR
          (@TrangThaiLoc = N'Tất cả'    AND ptp.TrangThai IN (N'Chờ xử lý', N'Chờ đối soát', N'Chờ ký biên bản', N'Chờ hoàn cọc', N'Hoàn tất'))
      )
    ORDER BY ptp.NgayDuKienTra ASC;
END;
GO

-- =============================================
-- 2. SP_TraPhong_QuanLy_ChiTietPhieu
-- Lấy thông tin chi tiết của 1 phiếu trả phòng
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietPhieu', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietPhieu AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietPhieu
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    -- 1. Lấy thông tin cơ bản của phiếu trả phòng
    SELECT 
        ptp.MaPhieuTra                              AS maPhieuTra,
        ptp.TrangThai                               AS trangThai,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 120) AS ngayDangKyTra,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 120) AS ngayDuKienTra,
        ptp.MaHopDong                               AS maHopDong,
        ptp.MaPhieuDatCoc                           AS maPhieuDatCoc,
        CASE WHEN ptp.MaHopDong IS NOT NULL THEN N'HopDong' ELSE N'DatCoc' END AS loaiNguon,
        nd.HoTen                                    AS hoTenKhach,
        nd.SDT                                      AS sdtKhach,
        kh.CCCD                                     AS cccdKhach,
        p.MaPhong                                   AS maPhong,
        p.TenPhong                                  AS tenPhong,
        ctdc.MaGiuong                               AS maGiuong,
        CASE 
            WHEN pdc.HinhThucThue = N'Ghép giường' THEN 
                ISNULL((SELECT TOP 1 lp.GiaThueTheoGiuong 
                 FROM dbo.ChiTietDatCoc ctdc_sub 
                 INNER JOIN dbo.Phong p_sub ON p_sub.MaPhong = ctdc_sub.MaPhong 
                 INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p_sub.MaLoaiPhong 
                 WHERE ctdc_sub.MaPhieuDatCoc = ptp.MaPhieuDatCoc), 0) * 2 * ISNULL(hdt.SoGiuongThue, 1)
            ELSE pdc.SoTienCoc
        END                                         AS tienCocHD,
        pdc.SoTienCoc                               AS tienCocPDC,
        pdc.HinhThucThue                            AS hinhThucThue,
        COALESCE(hdt.GiaThue, ctdc.GiaThue)         AS giaThue,
        CONVERT(VARCHAR(10), hdt.NgayBatDau, 120)   AS ngayBatDauThue,
        CONVERT(VARCHAR(10), hdt.NgayKetThuc, 120)  AS ngayKetThucThue,
        cn.TenChiNhanh                              AS tenChiNhanh,
        CONVERT(VARCHAR(19), pdc.ThoiDiemDatCoc, 120) AS ngayDatCoc,
        hdt.TrangThai                               AS trangThaiHopDong,
        pdc.TrangThaiCoc                            AS trangThaiCoc,
        pdc.TrangThaiThanhToan                      AS trangThaiThanhToanPDC,
        nd.Email                                    AS emailKhach,
        p.TinhTrang                                 AS tinhTrangPhongDB,
        bbkt.TinhTrangPhong                       AS tinhTrangPhongThucTe,
        CONVERT(VARCHAR(19), bbkt.NgayKiemTra, 120) AS ngayLapBBKT,
        lp.TenLoaiPhong                             AS loaiPhong,
        CONVERT(VARCHAR(10), ptp.NgayTraThucTe, 120) AS ngayTraThucTe
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hdt.MaKhachHang, pdc.MaKhachHang)
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    LEFT JOIN dbo.BienBanKiemTraPhong bbkt ON bbkt.MaPhieuTra = ptp.MaPhieuTra
    WHERE ptp.MaPhieuTra = @MaPhieuTra AND p.MaChiNhanh = @MaChiNhanh;

    IF @@ROWCOUNT = 0
    BEGIN
        THROW 50010, N'Không tìm thấy phiếu trả phòng hoặc bạn không có quyền truy cập.', 1;
    END

    -- Lấy mã phòng để query tiếp
    DECLARE @MaPhong VARCHAR(4), @MaHopDong VARCHAR(6);
    SELECT 
        @MaPhong = p.MaPhong, 
        @MaHopDong = ptp.MaHopDong
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    WHERE ptp.MaPhieuTra = @MaPhieuTra;

    -- 2. Lấy thông tin nghĩa vụ (Chỉ khi là hợp đồng)
    IF @MaHopDong IS NOT NULL
    BEGIN
        SELECT 
            'HoaDon' AS LoaiNghiaVu,
            hd.MaHoaDon AS Ma,
            N'Hóa đơn kỳ ' + hd.KyThanhToan AS Ten,
            hd.TongTien AS SoTien,
            CAST(NULL AS VARCHAR(10)) AS ThoiGian,
            hd.TrangThai AS TrangThai
        FROM dbo.HoaDon hd
        WHERE hd.MaHopDong = @MaHopDong AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
        
        UNION ALL
        
        SELECT 
            'ViPham' AS LoaiNghiaVu,
            bbvp.MaBBViPham AS Ma,
            bbvp.MoTaViPham AS Ten,
            bbvp.SoTienPhat AS SoTien,
            CONVERT(VARCHAR(10), bbvp.NgayViPham, 103) AS ThoiGian,
            CAST(NULL AS NVARCHAR(50)) AS TrangThai
        FROM dbo.BienBanViPham bbvp
        WHERE bbvp.MaHopDong = @MaHopDong;
    END
    ELSE
    BEGIN
        SELECT 1 WHERE 1=0; -- Trả về result set rỗng
    END

    -- 3. Lấy thông tin tài sản trong phòng (để kiểm tra)
    IF @MaHopDong IS NOT NULL
    BEGIN
        DECLARE @HinhThucThue_Check NVARCHAR(50);
        SELECT TOP 1 @HinhThucThue_Check = pdc.HinhThucThue
        FROM dbo.PhieuTraPhong ptp
        LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
        WHERE ptp.MaPhieuTra = @MaPhieuTra;

        IF @HinhThucThue_Check = N'Nguyên phòng'
        BEGIN
            ;WITH Numbers AS (
                SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
                UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
                UNION ALL SELECT 9 UNION ALL SELECT 10
            )
            SELECT 
                ts.MaTaiSan + '_' + CAST(Numbers.n AS VARCHAR(2)) AS maTaiSan,
                ts.MaTaiSan AS maTaiSanGoc,
                Numbers.n AS thuTuTaiSan,
                ts.TenTaiSan + CASE 
                    WHEN (SELECT COUNT(*) FROM dbo.Giuong WHERE MaPhong = @MaPhong) = COALESCE(ctbg.SoLuongThucTe, ts.SoLuong) 
                         AND (ts.TenTaiSan LIKE N'%Giường%' OR ts.TenTaiSan LIKE N'%Nệm%' OR ts.TenTaiSan LIKE N'%Tủ%' OR ts.TenTaiSan LIKE N'%Chìa%') THEN 
                        N' ' + ISNULL((SELECT MaGiuong FROM (SELECT MaGiuong, ROW_NUMBER() OVER(ORDER BY MaGiuong) AS rn FROM dbo.Giuong WHERE MaPhong = @MaPhong) g WHERE g.rn = Numbers.n), CAST(Numbers.n AS VARCHAR(2)))
                    WHEN COALESCE(ctbg.SoLuongThucTe, ts.SoLuong) > 1 THEN N' ' + CAST(Numbers.n AS VARCHAR(2))
                    ELSE ''
                END AS tenTaiSan,
                1 AS soLuongBanGiao,
                ts.DonGia AS donGiaBoiThuong,
                cthh.MucDoHuHong AS mucDoHuHong,
                cthh.SoLuong AS soLuongHuMat,
                cthh.MoTaHuHong AS moTaHuHong,
                cthh.ChiPhiSuaChua AS chiPhiSuaChua
            FROM dbo.TaiSan ts
            LEFT JOIN (
                SELECT cb.MaTaiSan, cb.SoLuongThucTe
                FROM dbo.BienBanBanGiao bb
                JOIN dbo.ChiTietBanGiao cb ON cb.MaBienBan = bb.MaBienBan
                WHERE bb.MaHopDong = @MaHopDong AND bb.LoaiBanGiao = N'Bàn giao vào'
            ) ctbg ON ctbg.MaTaiSan = ts.MaTaiSan
            INNER JOIN Numbers ON Numbers.n <= COALESCE(ctbg.SoLuongThucTe, ts.SoLuong)
            LEFT JOIN (
                SELECT 
                    MaTaiSan, ThuTuTaiSan, MucDoHuHong, SoLuong, MoTaHuHong, ChiPhiSuaChua,
                    ROW_NUMBER() OVER(PARTITION BY MaTaiSan ORDER BY MaChiTietHH) AS rn
                FROM dbo.ChiTietHuHong
                WHERE MaBienBanKT = (SELECT MaBienBanKT FROM dbo.BienBanKiemTraPhong WHERE MaPhieuTra = @MaPhieuTra)
            ) cthh ON cthh.MaTaiSan = ts.MaTaiSan AND COALESCE(cthh.ThuTuTaiSan, cthh.rn) = Numbers.n
            WHERE ts.MaPhong = @MaPhong;
        END
        ELSE
        BEGIN
            ;WITH Numbers AS (
                SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
                UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
                UNION ALL SELECT 9 UNION ALL SELECT 10
            ),
            CtBanGiao AS (
                SELECT cb.MaTaiSan, SUM(cb.SoLuongThucTe) AS SoLuongThucTe
                FROM dbo.BienBanBanGiao bb
                JOIN dbo.ChiTietBanGiao cb ON cb.MaBienBan = bb.MaBienBan
                WHERE bb.MaHopDong = @MaHopDong AND bb.LoaiBanGiao = N'Bàn giao vào'
                GROUP BY cb.MaTaiSan
            ),
            HuHong AS (
                SELECT 
                    MaTaiSan, ThuTuTaiSan, MucDoHuHong, SoLuong, MoTaHuHong, ChiPhiSuaChua,
                    ROW_NUMBER() OVER(PARTITION BY MaTaiSan ORDER BY MaChiTietHH) AS rn
                FROM dbo.ChiTietHuHong
                WHERE MaBienBanKT = (
                    SELECT TOP 1 MaBienBanKT
                    FROM dbo.BienBanKiemTraPhong
                    WHERE MaPhieuTra = @MaPhieuTra
                    ORDER BY NgayKiemTra DESC, MaBienBanKT DESC
                )
            )
            SELECT 
                ts.MaTaiSan + '_' + CAST(Numbers.n AS VARCHAR(2)) AS maTaiSan,
                ts.MaTaiSan AS maTaiSanGoc,
                Numbers.n AS thuTuTaiSan,
                ts.TenTaiSan + CASE
                    WHEN COALESCE(ctbg.SoLuongThucTe, hdt.SoGiuongThue, ts.SoLuong) > 1 THEN N' ' + CAST(Numbers.n AS VARCHAR(2))
                    ELSE ''
                END AS tenTaiSan,
                1 AS soLuongBanGiao,
                ts.DonGia AS donGiaBoiThuong,
                cthh.MucDoHuHong AS mucDoHuHong,
                cthh.SoLuong AS soLuongHuMat,
                cthh.MoTaHuHong AS moTaHuHong,
                cthh.ChiPhiSuaChua AS chiPhiSuaChua
            FROM dbo.TaiSan ts
            LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = @MaHopDong
            LEFT JOIN CtBanGiao ctbg ON ctbg.MaTaiSan = ts.MaTaiSan
            INNER JOIN Numbers ON Numbers.n <= COALESCE(ctbg.SoLuongThucTe, hdt.SoGiuongThue, ts.SoLuong)
            LEFT JOIN HuHong cthh ON cthh.MaTaiSan = ts.MaTaiSan AND COALESCE(cthh.ThuTuTaiSan, cthh.rn) = Numbers.n
            WHERE ts.MaPhong = @MaPhong;
        END
    END
    ELSE
    BEGIN
        SELECT 1 WHERE 1=0;
    END
END;
GO

-- =============================================
-- 3. SP_TraPhong_QuanLy_XacNhanHuyCoc
-- Xác nhận hoàn tất kiểm tra đối với phiếu đặt cọc (chưa có HĐ)
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_XacNhanHuyCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_XacNhanHuyCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_XacNhanHuyCoc
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra phiếu có hợp lệ không
    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuTraPhong WHERE MaPhieuTra = @MaPhieuTra AND TrangThai = N'Chờ xử lý')
    BEGIN
        THROW 50010, N'Phiếu trả phòng này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 1;
    END

    -- Cập nhật trạng thái phiếu
    UPDATE dbo.PhieuTraPhong
    SET TrangThai = N'Chờ đối soát',
        NgayTraThucTe = NgayDuKienTra
    WHERE MaPhieuTra = @MaPhieuTra;
END;
GO

-- =============================================
-- 4. SP_TraPhong_QuanLy_LapBienBanKiemTra
-- Lập biên bản kiểm tra trả phòng
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra
    @MaPhieuTra     VARCHAR(6),
    @MaNhanVien     VARCHAR(6),
    @NgayTraThucTe  DATE,
    @TinhTrangPhong NVARCHAR(MAX),
    @TongChiPhi     DECIMAL(15,2),
    @MaBienBanKT    VARCHAR(6) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Kiểm tra trạng thái
        DECLARE @MaHD VARCHAR(6);
        SELECT @MaHD = MaHopDong FROM dbo.PhieuTraPhong WHERE MaPhieuTra = @MaPhieuTra AND TrangThai = N'Chờ xử lý';

        IF @MaHD IS NULL
        BEGIN
            THROW 50010, N'Phiếu trả phòng này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 1;
        END

        IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = @MaHD AND TrangThai = N'Đã thanh lý')
        BEGIN
            THROW 50011, N'Hợp đồng đã thanh lý, không đủ điều kiện lập biên bản.', 1;
        END

        -- 2. Tạo mã Biên Bản Kiểm Tra
        SELECT @MaBienBanKT = 'KT' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaBienBanKT, 3, 4) AS INT)), 0) + 1 AS VARCHAR), 4)
        FROM dbo.BienBanKiemTraPhong;

        -- 3. Insert Biên Bản
        INSERT INTO dbo.BienBanKiemTraPhong (MaBienBanKT, MaPhieuTra, MaNhanVienQL, NgayKiemTra, TinhTrangPhong, TongChiPhiSuaChua)
        VALUES (@MaBienBanKT, @MaPhieuTra, @MaNhanVien, GETDATE(), @TinhTrangPhong, @TongChiPhi);

        -- 4. Cập nhật trạng thái phiếu trả phòng
        UPDATE dbo.PhieuTraPhong
        SET TrangThai = N'Chờ đối soát',
            NgayTraThucTe = @NgayTraThucTe
        WHERE MaPhieuTra = @MaPhieuTra;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- 5. SP_TraPhong_QuanLy_ThemChiTietHuHong
-- Ghi nhận từng chi tiết hư hỏng tài sản (gọi nhiều lần từ backend)
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ThemChiTietHuHong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ThemChiTietHuHong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ThemChiTietHuHong
    @MaBienBanKT    VARCHAR(6),
    @MaPhieuTra     VARCHAR(6),
    @MaTaiSan       VARCHAR(6),
    @MoTaHuHong     NVARCHAR(MAX),
    @ChiPhiSuaChua  DECIMAL(15,2),
    @SoLuong        INT,
    @MucDoHuHong    NVARCHAR(100),
    @TyLeHuHong     DECIMAL(5,2),
    @MaQuyDinhTruTien VARCHAR(6),
    @ThuTuTaiSan    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Lấy mã phòng từ phiếu trả
        DECLARE @MaPhong VARCHAR(4);
        SELECT @MaPhong = p.MaPhong 
        FROM dbo.PhieuTraPhong ptp
        LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
        INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
        WHERE ptp.MaPhieuTra = @MaPhieuTra;

        -- Tạo mã chi tiết hư hỏng
        DECLARE @MaChiTietHH VARCHAR(6);
        SELECT @MaChiTietHH = 'HH' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaChiTietHH, 3, 4) AS INT)), 0) + 1 AS VARCHAR), 4) FROM dbo.ChiTietHuHong;

        -- Insert Chi Tiết
        INSERT INTO dbo.ChiTietHuHong (MaChiTietHH, MaBienBanKT, MaPhong, MaTaiSan, MoTaHuHong, ChiPhiSuaChua, SoLuong, MucDoHuHong, TyLeHuHong, MaQuyDinhTruTien, ThuTuTaiSan)
        VALUES (@MaChiTietHH, @MaBienBanKT, @MaPhong, @MaTaiSan, @MoTaHuHong, @ChiPhiSuaChua, @SoLuong, @MucDoHuHong, @TyLeHuHong, @MaQuyDinhTruTien, @ThuTuTaiSan);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

GO


-- =============================================
-- START FILE: ke-toan-doi-soat.sql
-- =============================================
USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: LAP PHIEU DOI SOAT TRA PHONG (Nhan vien ke toan)
-- =============================================

IF OBJECT_ID(N'dbo.DoiSoat', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.DoiSoat', 'ThongTinNhanHoanCoc') IS NULL
    ALTER TABLE dbo.DoiSoat ADD ThongTinNhanHoanCoc NVARCHAR(500) NULL;
GO

IF OBJECT_ID(N'dbo.DichVuHopDong', N'U') IS NOT NULL
   AND COL_LENGTH('dbo.DichVuHopDong', 'DonGiaApDung') IS NULL
    ALTER TABLE dbo.DichVuHopDong ADD DonGiaApDung DECIMAL(15,2) NULL;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat
    @MaNhanVienKeToan VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVienKeToan;

    SELECT
        ptp.MaPhieuTra AS maPhieuTra,
        ptp.NgayDangKyTra AS ngayDangKyTra,
        ptp.NgayDuKienTra AS ngayDuKienTra,
        ptp.NgayTraThucTe AS ngayTraThucTe,
        ptp.TrangThai AS trangThai,
        ptp.MaHopDong AS maHopDong,
        ptp.MaPhieuDatCoc AS maPhieuDatCoc,
        dsActive.MaDoiSoat AS maDoiSoat,
        dsActive.LoaiQuyetToan AS loaiQuyetToan,
        dsActive.TrangThai AS trangThaiDoiSoat,
        CAST(CASE WHEN dsActive.MaDoiSoat IS NULL THEN 0 ELSE 1 END AS BIT) AS daDoiSoat,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        nd.Email AS emailKhachHang
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ptp.MaPhieuDatCoc
    LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
    LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1
            ds.MaDoiSoat,
            ds.LoaiQuyetToan,
            ds.TrangThai,
            ds.NgayLap
        FROM dbo.DoiSoat ds
        WHERE ds.MaPhieuTra = ptp.MaPhieuTra
          AND ds.TrangThai IN (
              N'Chờ xác nhận',
              N'Chờ phản hồi',
              N'Chờ hoàn cọc',
              N'Chờ thanh toán thêm',
              N'Cần điều chỉnh'
          )
        ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC
    ) dsActive
    WHERE ptp.TrangThai = N'Chờ đối soát'
      AND (
          @MaChiNhanh IS NULL
          OR EXISTS (
              SELECT 1
              FROM dbo.PhieuDatCoc pdcFilter
              INNER JOIN dbo.ChiTietDatCoc ctdcFilter
                  ON ctdcFilter.MaPhieuDatCoc = pdcFilter.MaPhieuDatCoc
              INNER JOIN dbo.Phong pFilter
                  ON pFilter.MaPhong = ctdcFilter.MaPhong
              WHERE pdcFilter.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hd.MaPhieuCoc)
                AND pFilter.MaChiNhanh = @MaChiNhanh
          )
      )
    ORDER BY ptp.NgayTraThucTe DESC, ptp.NgayDangKyTra DESC, ptp.MaPhieuTra DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachChoThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachChoThuThem
    @MaNhanVienKeToan VARCHAR(6) = NULL,
    @BoLocThuThem VARCHAR(30) = 'all'
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
        ds.ChungTuThanhToan AS chungTuThanhToan,
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
      AND ds.LoaiQuyetToan = N'Thu thêm'
      AND pt.TrangThai = N'Chờ ký biên bản'
      AND ISNULL(ds.SoTienKhachPhaiTT, 0) > 0
      AND (
          @BoLocThuThem IS NULL
          OR @BoLocThuThem = 'all'
          OR (
              @BoLocThuThem = 'can-ghi-nhan'
              AND (
                  NULLIF(LTRIM(RTRIM(ds.PhuongThucThanhToan)), N'') IS NULL
                  OR (
                      ds.PhuongThucThanhToan = N'Chuyển khoản'
                      AND NULLIF(LTRIM(RTRIM(ISNULL(ds.ChungTuThanhToan, ''))), '') IS NULL
                  )
              )
          )
          OR (
              @BoLocThuThem = 'cho-xac-nhan'
              AND NULLIF(LTRIM(RTRIM(ds.PhuongThucThanhToan)), N'') IS NOT NULL
              AND (
                  ds.PhuongThucThanhToan <> N'Chuyển khoản'
                  OR NULLIF(LTRIM(RTRIM(ISNULL(ds.ChungTuThanhToan, ''))), '') IS NOT NULL
              )
          )
      )
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
        ds.ChungTuThanhToan,
        ds.TrangThai,
        pt.TrangThai
    ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_ChiTietThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_ChiTietThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachDaThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachDaThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachDaThuThem
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
        ds.NgayThanhToan AS ngayThanhToan,
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
        ds.ChungTuThanhToan AS chungTuThanhToan,
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
    WHERE ds.TrangThai = N'Đã quyết toán'
      AND ds.LoaiQuyetToan = N'Thu thêm'
      AND ISNULL(ds.SoTienKhachPhaiTT, 0) > 0
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat,
        pt.MaPhieuTra,
        ds.NgayLap,
        ds.NgayThanhToan,
        nd.HoTen,
        nd.SDT,
        pt.MaHopDong,
        pt.MaPhieuDatCoc,
        ds.SoTienKhachPhaiTT,
        ds.LoaiQuyetToan,
        ds.PhuongThucThanhToan,
        ds.ChungTuThanhToan,
        ds.TrangThai,
        pt.TrangThai
    ORDER BY ds.NgayThanhToan DESC, ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
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
        ds.SoThangLuuTru AS soThangLuuTru,
        ds.TyLeHoanCocHienTai AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan AS tienCocDuocHoan,
        ds.TienThueConNo AS tienThueConNo,
        ds.TienDichVuConNo AS tienDichVuConNo,
        ds.TongChiPhiSuaChua AS tongChiPhiSuaChua,
        ds.TienPhat AS tienPhat,
        ds.TongKhauTru AS tongKhauTru,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.NgayThanhToan AS ngayThanhToan,
        ds.ChungTuThanhToan AS chungTuThanhToan,
        ds.ThongTinNhanHoanCoc AS thongTinNhanHoanCoc,
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
            @PhuongThucThanhToanHienTai NVARCHAR(20),
            @SoTienKhachPhaiTT DECIMAL(15,2);

        SELECT
            @TrangThaiDoiSoat = ds.TrangThai,
            @MaPhieuTra = ds.MaPhieuTra,
            @PhuongThucThanhToanHienTai = ds.PhuongThucThanhToan,
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

        IF NULLIF(LTRIM(RTRIM(ISNULL(@PhuongThucThanhToanHienTai, N''))), N'') IS NOT NULL
           AND NULLIF(LTRIM(RTRIM(@PhuongThucThanhToanHienTai)), N'') <> @PhuongThucThanhToan
        BEGIN
            THROW 50703, N'Khách đã ghi nhận phương thức thanh toán, kế toán không thể thay đổi phương thức.', 1;
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

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_KhongXacNhanThuThem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_KhongXacNhanThuThem AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_KhongXacNhanThuThem
    @MaDoiSoat VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @TrangThaiDoiSoat NVARCHAR(30),
            @TrangThaiPhieuTra NVARCHAR(50),
            @MaPhieuTra VARCHAR(6),
            @LoaiQuyetToan NVARCHAR(30),
            @PhuongThucThanhToan NVARCHAR(20),
            @SoTienKhachPhaiTT DECIMAL(15,2);

        SELECT
            @TrangThaiDoiSoat = ds.TrangThai,
            @MaPhieuTra = ds.MaPhieuTra,
            @LoaiQuyetToan = ds.LoaiQuyetToan,
            @PhuongThucThanhToan = ds.PhuongThucThanhToan,
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

        IF ISNULL(@LoaiQuyetToan, N'') <> N'Thu thêm' OR ISNULL(@SoTienKhachPhaiTT, 0) <= 0
        BEGIN
            THROW 50700, N'Phiếu đối soát không phát sinh số tiền cần thu thêm.', 1;
        END

        IF ISNULL(@PhuongThucThanhToan, N'') <> N'Chuyển khoản'
        BEGIN
            THROW 50700, N'Chỉ có thể không xác nhận chứng từ khi khách thanh toán chuyển khoản.', 1;
        END

        UPDATE dbo.DoiSoat
        SET
            ChungTuThanhToan = NULL,
            NgayThanhToan = NULL,
            TrangThai = N'Chờ thanh toán thêm',
            MaNhanVienKeToan = COALESCE(@MaNhanVienKeToan, MaNhanVienKeToan)
        WHERE MaDoiSoat = @MaDoiSoat;

        COMMIT TRANSACTION;

        SELECT
            @MaDoiSoat AS maDoiSoat,
            @MaPhieuTra AS maPhieuTra,
            N'Chờ thanh toán thêm' AS trangThaiDoiSoat,
            @TrangThaiPhieuTra AS trangThaiPhieuTra,
            @PhuongThucThanhToan AS phuongThucThanhToan,
            CAST(NULL AS DATE) AS ngayThanhToan,
            CAST(NULL AS VARCHAR(500)) AS chungTuThanhToan;
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
      AND ds.LoaiQuyetToan = N'Hoàn cọc'
      AND ISNULL(ds.SoTienHoanThucTe, 0) > 0
      AND pt.TrangThai = N'Chờ hoàn cọc'
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
IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_DanhSachDaHoanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachDaHoanCoc AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_DanhSachDaHoanCoc
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
        ds.NgayThanhToan AS ngayThanhToan,
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
        ds.ChungTuThanhToan AS chungTuThanhToan,
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
    WHERE ds.TrangThai = N'Đã quyết toán'
      AND ds.LoaiQuyetToan = N'Hoàn cọc'
      AND ISNULL(ds.SoTienHoanThucTe, 0) > 0
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat,
        pt.MaPhieuTra,
        ds.NgayLap,
        ds.NgayThanhToan,
        nd.HoTen,
        nd.SDT,
        pt.MaHopDong,
        pt.MaPhieuDatCoc,
        ds.SoTienHoanThucTe,
        ds.PhuongThucThanhToan,
        ds.ChungTuThanhToan,
        ds.TrangThai,
        pt.TrangThai
    ORDER BY ds.NgayThanhToan DESC, ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_KetQuaDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_KetQuaDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_KetQuaDoiSoat
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
        ds.NgayThanhToan AS ngayThanhToan,
        nd.HoTen AS hoTenKhachHang,
        nd.SDT AS sdtKhachHang,
        pt.MaHopDong AS maHopDong,
        pt.MaPhieuDatCoc AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        MIN(p.TenPhong) AS tenPhong,
        MIN(g.MaGiuong) AS maGiuong,
        COUNT(DISTINCT ctdc.MaChiTietDC) AS soLuongPhongGiuong,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.ChungTuThanhToan AS chungTuThanhToan,
        ds.TrangThai AS trangThaiDoiSoat,
        pt.TrangThai AS trangThaiPhieuTra,
        CASE
            WHEN ds.LoaiQuyetToan = N'Hoàn cọc' THEN N'hoan-coc'
            WHEN ds.LoaiQuyetToan = N'Thu thêm' THEN N'thu-them'
            ELSE N'khong-phat-sinh'
        END AS ketQuaDoiSoat
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ds.TrangThai = N'Đã quyết toán'
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat,
        pt.MaPhieuTra,
        ds.NgayLap,
        ds.NgayThanhToan,
        nd.HoTen,
        nd.SDT,
        pt.MaHopDong,
        pt.MaPhieuDatCoc,
        ds.SoTienHoanThucTe,
        ds.SoTienKhachPhaiTT,
        ds.LoaiQuyetToan,
        ds.PhuongThucThanhToan,
        ds.ChungTuThanhToan,
        ds.TrangThai,
        pt.TrangThai
    ORDER BY COALESCE(ds.NgayThanhToan, ds.NgayLap) DESC, ds.MaDoiSoat DESC;
END;
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
        ds.SoThangLuuTru AS soThangLuuTru,
        ds.TyLeHoanCocHienTai AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan AS tienCocDuocHoan,
        ds.TienThueConNo AS tienThueConNo,
        ds.TienDichVuConNo AS tienDichVuConNo,
        ds.TongChiPhiSuaChua AS tongChiPhiSuaChua,
        ds.TienPhat AS tienPhat,
        ds.TongKhauTru AS tongKhauTru,
        ds.SoTienHoanThucTe AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.NgayThanhToan AS ngayThanhToan,
        ds.ChungTuThanhToan AS chungTuThanhToan,
        ds.ThongTinNhanHoanCoc AS thongTinNhanHoanCoc,
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
            TrangThai = N'Đã quyết toán',
            MaNhanVienKeToan = COALESCE(@MaNhanVienKeToan, MaNhanVienKeToan)
        WHERE MaDoiSoat = @MaDoiSoat;

        UPDATE dbo.PhieuTraPhong
        SET TrangThai = N'Hoàn tất'
        WHERE MaPhieuTra = @MaPhieuTra;

        IF @MaHopDong IS NULL AND @MaPhieuDatCoc IS NOT NULL
        BEGIN
            DECLARE @PhongCanCapNhat TABLE (MaPhong VARCHAR(4) PRIMARY KEY);

            INSERT INTO @PhongCanCapNhat (MaPhong)
            SELECT DISTINCT MaPhong
            FROM dbo.ChiTietDatCoc
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

            UPDATE dbo.PhieuDatCoc
            SET TrangThaiCoc = N'Đã hủy'
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

            UPDATE g
            SET TinhTrang = N'Trống'
            FROM dbo.Giuong g
            INNER JOIN dbo.ChiTietDatCoc ctdc
                ON ctdc.MaPhong = g.MaPhong
               AND ctdc.MaGiuong = g.MaGiuong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
              AND ctdc.MaGiuong IS NOT NULL;

            UPDATE g
            SET TinhTrang = N'Trống'
            FROM dbo.Giuong g
            INNER JOIN dbo.ChiTietDatCoc ctdc
                ON ctdc.MaPhong = g.MaPhong
               AND ctdc.MaGiuong IS NULL
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc;

            UPDATE p
            SET
                TinhTrang =
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM dbo.Giuong g
                            WHERE g.MaPhong = p.MaPhong
                              AND g.TinhTrang <> N'Trống'
                        ) THEN N'Trống'
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM dbo.Giuong g
                            WHERE g.MaPhong = p.MaPhong
                              AND g.TinhTrang = N'Trống'
                        ) THEN N'Đầy'
                        ELSE N'Còn chỗ'
                    END,
                GioiTinhChoPhep =
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM dbo.Giuong g
                            WHERE g.MaPhong = p.MaPhong
                              AND g.TinhTrang <> N'Trống'
                        ) THEN N'Không phân biệt'
                        ELSE p.GioiTinhChoPhep
                    END
            FROM dbo.Phong p
            INNER JOIN @PhongCanCapNhat pc ON pc.MaPhong = p.MaPhong;
        END

        COMMIT TRANSACTION;

        SELECT
            @MaDoiSoat AS maDoiSoat,
            @MaPhieuTra AS maPhieuTra,
            N'Đã quyết toán' AS trangThaiDoiSoat,
            N'Hoàn tất' AS trangThaiPhieuTra,
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
    @LockForUpdate BIT = 0,
    @MaNhanVienKeToan VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVienKeToan;

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
        WHERE ptp.MaPhieuTra = @MaPhieuTra
          AND (
              @MaChiNhanh IS NULL
              OR EXISTS (
                  SELECT 1
                  FROM dbo.PhieuDatCoc pdcFilter
                  INNER JOIN dbo.ChiTietDatCoc ctdcFilter
                      ON ctdcFilter.MaPhieuDatCoc = pdcFilter.MaPhieuDatCoc
                  INNER JOIN dbo.Phong pFilter
                      ON pFilter.MaPhong = ctdcFilter.MaPhong
                  WHERE pdcFilter.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hd.MaPhieuCoc)
                    AND pFilter.MaChiNhanh = @MaChiNhanh
              )
          );

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
    WHERE ptp.MaPhieuTra = @MaPhieuTra
      AND (
          @MaChiNhanh IS NULL
          OR EXISTS (
              SELECT 1
              FROM dbo.PhieuDatCoc pdcFilter
              INNER JOIN dbo.ChiTietDatCoc ctdcFilter
                  ON ctdcFilter.MaPhieuDatCoc = pdcFilter.MaPhieuDatCoc
              INNER JOIN dbo.Phong pFilter
                  ON pFilter.MaPhong = ctdcFilter.MaPhong
              WHERE pdcFilter.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hd.MaPhieuCoc)
                AND pFilter.MaChiNhanh = @MaChiNhanh
          )
      );
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
                  N'Chờ phản hồi',
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
        CASE 
            WHEN pdc.HinhThucThue = N'Ghép giường' THEN 
                ISNULL((SELECT TOP 1 lp.GiaThueTheoGiuong 
                 FROM dbo.ChiTietDatCoc ctdc 
                 INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong 
                 INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong 
                 WHERE ctdc.MaPhieuDatCoc = hd.MaPhieuCoc), 0) * 2 * ISNULL(hd.SoGiuongThue, 1)
            ELSE pdc.SoTienCoc
        END AS soTienCoc,
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
    ORDER BY bbvp.NgayViPham ASC, bbvp.MaBBViPham ASC;

    -- Recordset 6: Dich vu dang ap dung trong hop dong, dung khi hoa don chua co chi tiet.
    SELECT
        dvhd.MaChiTietDVHD AS maChiTietDVHD,
        dvhd.MaDichVu AS maDichVu,
        dv.TenDichVu AS tenDichVu,
        dv.DonViTinh AS donViTinh,
        COALESCE(dvhd.DonGiaApDung, dv.DonGia, 0) AS donGia,
        dvhd.GhiChu AS ghiChu
    FROM dbo.DichVuHopDong dvhd
    LEFT JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE @MaHopDong IS NOT NULL
      AND dvhd.MaHopDong = @MaHopDong
    ORDER BY dv.TenDichVu ASC, dvhd.MaChiTietDVHD ASC;
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
    @LoaiQuyetToan NVARCHAR(30),
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
        LoaiQuyetToan,
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
        @LoaiQuyetToan,
        N'Chờ xác nhận',
        @MaNhanVienKeToan,
        @MaPhieuTra,
        @MaQuyDinhHoanCoc
    );
END;
GO

IF OBJECT_ID(N'dbo.SP_TraPhong_KeToan_UpdateDoiSoatCanDieuChinh', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_KeToan_UpdateDoiSoatCanDieuChinh AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_KeToan_UpdateDoiSoatCanDieuChinh
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
    @LoaiQuyetToan NVARCHAR(30),
    @MaNhanVienKeToan VARCHAR(6),
    @MaPhieuTra VARCHAR(6),
    @MaQuyDinhHoanCoc VARCHAR(6) = NULL,
    @GhiChuPhanHoiKhach NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.DoiSoat
    SET
        NgayLap = GETDATE(),
        TienCocBanDau = @TienCocBanDau,
        SoThangLuuTru = @SoThangLuuTru,
        TyLeHoanCocHienTai = @TyLeHoanCocHienTai,
        TienCocDuocHoan = @TienCocDuocHoan,
        TienThueConNo = @TienThueConNo,
        TienDichVuConNo = @TienDichVuConNo,
        TongChiPhiSuaChua = @TongChiPhiSuaChua,
        TienPhat = @TienPhat,
        TongKhauTru = @TongKhauTru,
        SoTienHoanThucTe = @SoTienHoanThucTe,
        SoTienKhachPhaiTT = @SoTienKhachPhaiTT,
        PhuongThucThanhToan = NULL,
        ChungTuThanhToan = NULL,
        NgayThanhToan = NULL,
        GhiChuPhanHoiKhach = @GhiChuPhanHoiKhach,
        LoaiQuyetToan = @LoaiQuyetToan,
        TrangThai = N'Chờ xác nhận',
        MaNhanVienKeToan = @MaNhanVienKeToan,
        MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc
    WHERE MaDoiSoat = @MaDoiSoat
      AND MaPhieuTra = @MaPhieuTra
      AND TrangThai = N'Cần điều chỉnh';

    IF @@ROWCOUNT = 0
    BEGIN
        RETURN;
    END

    SELECT
        MaDoiSoat AS maDoiSoat,
        MaPhieuTra AS maPhieuTra,
        TrangThai AS trangThai,
        LoaiQuyetToan AS loaiQuyetToan
    FROM dbo.DoiSoat
    WHERE MaDoiSoat = @MaDoiSoat
      AND MaPhieuTra = @MaPhieuTra
      AND TrangThai = N'Chờ xác nhận';
END;
GO

GO


-- =============================================
-- START FILE: xacnhanphanhoi.sql
-- =============================================
USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: XU LY PHAN HOI DOI SOAT (Nhan vien quan ly)
-- Gom 2 SPs:
--   1. SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi  -- danh sach DS trang thai "Cho phan hoi"
--   2. SP_TraPhong_QuanLy_ChiTietPhanHoi          -- chi tiet 1 phieu doi soat
--   3. SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat      -- xu ly (xac nhan dieu chinh | giu nguyen)
-- =============================================

-- ─── 1. Danh sach cho xu ly phan hoi ────────────────────────────────────────
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi
    @MaNhanVien VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    SELECT
        ds.MaDoiSoat       AS maDoiSoat,
        ds.NgayLap         AS ngayLap,
        pt.MaPhieuTra      AS maPhieuTra,
        pt.NgayTraThucTe   AS ngayTraThucTe,
        nd.HoTen           AS hoTenKhach,
        nd.SDT             AS sdtKhach,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        pt.MaHopDong       AS maHopDong,
        pt.MaPhieuDatCoc   AS maPhieuDatCoc,
        MIN(p.TenPhong)    AS tenPhong,
        MIN(g.MaGiuong)    AS maGiuong,
        ds.TrangThai       AS trangThaiDoiSoat,
        ds.GhiChuPhanHoiKhach AS ghiChuPhanHoiKhach
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT  JOIN dbo.HopDongThue hd  ON hd.MaHopDong  = pt.MaHopDong
    LEFT  JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p          ON p.MaPhong = ctdc.MaPhong
    LEFT  JOIN dbo.Giuong g         ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh     ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd     ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE ds.TrangThai IN (N'Chờ phản hồi', N'Cần điều chỉnh', N'Chờ hoàn cọc', N'Chờ thanh toán thêm', N'Đã quyết toán')
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat, ds.NgayLap, ds.TrangThai, ds.GhiChuPhanHoiKhach,
        pt.MaPhieuTra, pt.NgayTraThucTe, pt.MaHopDong, pt.MaPhieuDatCoc,
        nd.HoTen, nd.SDT
    ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO


-- ─── 2. Chi tiet phieu doi soat cho xu ly phan hoi ──────────────────────────
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi
    @MaDoiSoat  VARCHAR(6),
    @MaNhanVien VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    -- Thong tin tong quat + tai chinh
    SELECT TOP 1
        ds.MaDoiSoat                AS maDoiSoat,
        ds.NgayLap                  AS ngayLap,
        ds.TrangThai                AS trangThaiDoiSoat,
        ds.GhiChuPhanHoiKhach       AS ghiChuPhanHoiKhach,
        pt.MaPhieuTra               AS maPhieuTra,
        pt.NgayTraThucTe            AS ngayTraThucTe,
        pt.TrangThai                AS trangThaiPhieuTra,
        pt.MaHopDong                AS maHopDong,
        pt.MaPhieuDatCoc            AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        nd.HoTen                    AS hoTenKhach,
        nd.SDT                      AS sdtKhach,
        nd.Email                    AS emailKhach,
        kh.CCCD                     AS cccd,
        kh.MaKhachHang              AS maKhachHang,
        hd.TrangThai                AS trangThaiHopDong,
        pdc.TrangThaiCoc            AS trangThaiCoc,
        ds.TienCocBanDau            AS tienCocBanDau,
        ds.TyLeHoanCocHienTai       AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan          AS tienCocDuocHoan,
        ds.TienThueConNo            AS tienThueConNo,
        ds.TienDichVuConNo          AS tienDichVuConNo,
        ds.TongChiPhiSuaChua        AS tongChiPhiSuaChua,
        ds.TienPhat                 AS tienPhat,
        ds.TongKhauTru              AS tongKhauTru,
        ds.SoTienHoanThucTe         AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT        AS soTienKhachPhaiTT,
        ds.SoThangLuuTru            AS soThangLuuTru,
        hd.NgayBatDau               AS ngayBatDau,
        hd.NgayKetThuc              AS ngayKetThuc,
        hd.KyThanhToan              AS kyThanhToan,
        pdc.ThoiDiemDatCoc          AS thoiDiemDatCoc
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT  JOIN dbo.HopDongThue hd   ON hd.MaHopDong  = pt.MaHopDong
    LEFT  JOIN dbo.PhieuDatCoc pdc  ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p           ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.KhachHang kh      ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd      ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh);

    -- Danh sach phong / giuong
    SELECT
        p.MaPhong   AS maPhong,
        p.TenPhong  AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        ctdc.GiaThue  AS giaThue
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT  JOIN dbo.HopDongThue hd   ON hd.MaHopDong  = pt.MaHopDong
    LEFT  JOIN dbo.PhieuDatCoc pdc  ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p            ON p.MaPhong = ctdc.MaPhong
    WHERE ds.MaDoiSoat = @MaDoiSoat
    ORDER BY p.MaPhong, ctdc.MaGiuong;

    -- Chi tiet hu hong / mat mat phuc vu quan ly xu ly phan hoi
    SELECT
        bbkt.MaBienBanKT AS maBienBanKT,
        cthh.MaChiTietHH AS maChiTietHH,
        cthh.MaPhong AS maPhong,
        cthh.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        cthh.MucDoHuHong AS mucDoHuHong,
        cthh.MoTaHuHong AS moTaHuHong,
        cthh.ChiPhiSuaChua AS chiPhiSuaChua
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    INNER JOIN dbo.BienBanKiemTraPhong bbkt ON bbkt.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.ChiTietHuHong cthh ON cthh.MaBienBanKT = bbkt.MaBienBanKT
    INNER JOIN dbo.Phong p ON p.MaPhong = cthh.MaPhong
    LEFT JOIN dbo.TaiSan ts ON ts.MaPhong = cthh.MaPhong AND ts.MaTaiSan = cthh.MaTaiSan
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    ORDER BY bbkt.MaBienBanKT ASC, cthh.MaChiTietHH ASC;
END;
GO


-- ─── 3. Xu ly phan hoi doi soat ─────────────────────────────────────────────
--   @HanhDong: 'XacNhanDieuChinh'  -> doi soat -> "Can dieu chinh"
--              'GiuNguyen'          -> doi soat -> tiep theo; phieu tra -> "Cho ky bien ban"
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat
    @MaDoiSoat          VARCHAR(6),
    @MaNhanVien         VARCHAR(6),
    @HanhDong           NVARCHAR(30)   -- 'XacNhanDieuChinh' | 'GiuNguyen'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Kiem tra hanh dong hop le
    IF @HanhDong NOT IN (N'XacNhanDieuChinh', N'GiuNguyen')
        THROW 50800, N'Hành động không hợp lệ. Chỉ chấp nhận XacNhanDieuChinh hoặc GiuNguyen.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @TrangThaiDoiSoat   NVARCHAR(30),
            @MaPhieuTra         VARCHAR(6),
            @SoTienHoan         DECIMAL(15,2),
            @SoTienPhaiTT       DECIMAL(15,2);

        -- Khoa dong va doc trang thai hien tai
        SELECT
            @TrangThaiDoiSoat = ds.TrangThai,
            @MaPhieuTra       = ds.MaPhieuTra,
            @SoTienHoan       = ds.SoTienHoanThucTe,
            @SoTienPhaiTT     = ds.SoTienKhachPhaiTT
        FROM dbo.DoiSoat ds WITH (UPDLOCK, HOLDLOCK)
        WHERE ds.MaDoiSoat = @MaDoiSoat;

        -- E9: Phieu doi soat da thay doi trang thai
        IF @MaPhieuTra IS NULL
            THROW 50801, N'Không tìm thấy phiếu đối soát.', 1;

        IF @TrangThaiDoiSoat <> N'Chờ phản hồi'
            THROW 50802, N'Phiếu đối soát này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác. Vui lòng làm mới danh sách.', 1;

        -- ─── Nhanh: Xac nhan dieu chinh ─────────────────────────────────────
        IF @HanhDong = N'XacNhanDieuChinh'
        BEGIN
            -- Doi soat -> "Can dieu chinh"
            UPDATE dbo.DoiSoat
            SET TrangThai = N'Cần điều chỉnh'
            WHERE MaDoiSoat = @MaDoiSoat;

            -- Phieu tra phong giu nguyen "Cho doi soat"
            -- (khong update)
        END

        -- ─── Nhanh: Giu nguyen doi soat ─────────────────────────────────────
        ELSE -- 'GiuNguyen'
        BEGIN
            -- Xac dinh trang thai tiep theo cho doi soat
            DECLARE @TrangThaiMoiDS NVARCHAR(30);

            IF ISNULL(@SoTienHoan, 0) > 0
                SET @TrangThaiMoiDS = N'Chờ hoàn cọc';
            ELSE IF ISNULL(@SoTienPhaiTT, 0) > 0
                SET @TrangThaiMoiDS = N'Chờ thanh toán thêm';
            ELSE
                SET @TrangThaiMoiDS = N'Đã quyết toán';

            -- Cap nhat doi soat
            UPDATE dbo.DoiSoat
            SET TrangThai = @TrangThaiMoiDS
            WHERE MaDoiSoat = @MaDoiSoat;

            -- Cap nhat phieu tra phong -> "Cho ky bien ban"
            UPDATE dbo.PhieuTraPhong
            SET TrangThai = N'Chờ ký biên bản'
            WHERE MaPhieuTra = @MaPhieuTra;
        END

        COMMIT TRANSACTION;

        -- Tra ve ket qua
        SELECT
            @MaDoiSoat  AS maDoiSoat,
            @MaPhieuTra AS maPhieuTra,
            @HanhDong   AS hanhDong;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

GO


-- =============================================
-- START FILE: thanh-ly-tra-phong.sql
-- =============================================
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
        ds.PhuongThucThanhToan AS phuongThucThanhToan,
        ds.ChungTuThanhToan AS chungTuThanhToan,
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

GO


-- =============================================
-- START FILE: GhiNhanBanGiaoRa.sql
-- =============================================
USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: GHI NHAN BAN GIAO RA (Nhan vien quan ly)
-- Use-case thay the chuc nang "Cap nhat hoan tat".
-- Dieu kien:
--   - Phieu tra phong: Hoan tat
--   - Co hop dong thue
--   - Hop dong: Da thanh ly
--   - Doi soat: Da quyet toan
--   - Da co bien ban ban giao vao
--   - Chua co bien ban ban giao ra khi lap moi
-- =============================================

-- 1. Danh sach ho so ban giao ra
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa
    @MaNhanVien VARCHAR(6),
    @TrangThaiLoc NVARCHAR(50) = N'Chờ bàn giao'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
        THROW 50000, N'Nhân viên không tồn tại hoặc không hợp lệ.', 1;

    SELECT DISTINCT
        pt.MaPhieuTra AS maPhieuTra,
        nd.HoTen AS hoTenKhach,
        nd.SDT AS sdtKhach,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        ds.MaDoiSoat AS maDoiSoat,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        pt.TrangThai AS trangThaiPhieuTra,
        hd.TrangThai AS trangThaiHopDong,
        ds.TrangThai AS trangThaiDoiSoat,
        CASE
            WHEN bgRa.MaBienBan IS NULL THEN N'Chờ bàn giao'
            ELSE N'Đã bàn giao'
        END AS trangThaiBanGiao,
        bgRa.MaBienBan AS maBienBanBanGiaoRa,
        N'HopDong' AS loaiNguon
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    INNER JOIN dbo.BienBanBanGiao bgVao ON bgVao.MaHopDong = hd.MaHopDong AND bgVao.LoaiBanGiao = N'Bàn giao vào'
    INNER JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.BienBanBanGiao bgRa ON bgRa.MaHopDong = hd.MaHopDong AND bgRa.LoaiBanGiao = N'Bàn giao ra'
    WHERE p.MaChiNhanh = @MaChiNhanh
      AND pt.MaHopDong IS NOT NULL
      AND pt.TrangThai = N'Hoàn tất'
      AND hd.TrangThai = N'Đã thanh lý'
      AND ds.TrangThai = N'Đã quyết toán'
      AND (
          (@TrangThaiLoc = N'Chờ bàn giao' AND bgRa.MaBienBan IS NULL) OR
          (@TrangThaiLoc = N'Đã bàn giao'  AND bgRa.MaBienBan IS NOT NULL) OR
          (@TrangThaiLoc = N'Tất cả')
      )
    ORDER BY pt.NgayTraThucTe DESC, pt.MaPhieuTra DESC;
END;
GO

-- 2. Chi tiet ho so ban giao ra
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
        THROW 50100, N'Nhân viên không tồn tại hoặc không hợp lệ.', 1;

    DECLARE @MaHopDong VARCHAR(6);
    SELECT @MaHopDong = MaHopDong
    FROM dbo.PhieuTraPhong
    WHERE MaPhieuTra = @MaPhieuTra;

    -- Thong tin ho so
    SELECT TOP 1
        pt.MaPhieuTra AS maPhieuTra,
        pt.TrangThai AS trangThaiPhieuTra,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        nd.HoTen AS hoTenKhach,
        nd.SDT AS soDienThoai,
        nd.Email AS emailKhach,
        kh.CCCD AS cccdKhach,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        cn.TenChiNhanh AS khuVuc,
        lp.SucChuaToiDa AS sucChuaToiDa,
        CAST(1 AS BIT) AS hasHopDong,
        hd.MaHopDong AS maHopDong,
        hd.NgayBatDau AS ngayBatDauHopDong,
        hd.NgayKetThuc AS ngayKetThucHopDong,
        hd.TrangThai AS trangThaiHopDong,
        hd.SoGiuongThue AS soGiuongThue,
        pdc.MaPhieuDatCoc AS maPhieuDatCoc,
        pdc.TrangThaiCoc AS trangThaiCoc,
        ds.MaDoiSoat AS maDoiSoat,
        ds.TrangThai AS trangThaiDoiSoat,
        bkt.MaBienBanKT AS maBienBanKiemTra,
        bkt.NgayKiemTra AS ngayKiemTra,
        bkt.TinhTrangPhong AS tinhTrangKiemTra,
        bkt.TongChiPhiSuaChua AS tongChiPhiSuaChua,
        bgRa.MaBienBan AS maBienBanBanGiaoRa,
        bgRa.NgayBanGiao AS ngayBanGiaoRa,
        CASE WHEN bgRa.MaBienBan IS NULL THEN N'Chờ bàn giao' ELSE N'Đã bàn giao' END AS trangThaiBanGiao
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    INNER JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.BienBanBanGiao bgRa ON bgRa.MaHopDong = hd.MaHopDong AND bgRa.LoaiBanGiao = N'Bàn giao ra'
    WHERE pt.MaPhieuTra = @MaPhieuTra
      AND p.MaChiNhanh = @MaChiNhanh;

    -- Danh sach thanh vien hop dong
    SELECT
        MaThanhVien AS maThanhVien,
        HoTen AS hoTen,
        CCCD AS cccd,
        SDT AS sdt,
        NgaySinh AS ngaySinh,
        GioiTinh AS gioiTinh,
        Email AS email,
        TrangThai AS trangThai
    FROM dbo.ThanhVienHopDong
    WHERE MaHopDong = @MaHopDong
    ORDER BY MaThanhVien;

    -- Tai san/chia khoa/the da ban giao vao va ket qua thu hoi neu da ban giao ra
    SELECT
        ctVao.MaPhong AS maPhong,
        ts.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        ctVao.SoLuongThucTe AS soLuongBanGiaoVao,
        COALESCE(ctRa.SoLuongThucTe, ctVao.SoLuongThucTe) AS soLuongThuHoi,
        ctRa.GhiChu AS ghiChu,
        hh.MucDoHuHong AS mucDoHuHong,
        hh.MoTaHuHong AS moTaHuHong,
        hh.ChiPhiSuaChua AS chiPhiSuaChua
    FROM dbo.BienBanBanGiao bgVao
    INNER JOIN dbo.ChiTietBanGiao ctVao ON ctVao.MaBienBan = bgVao.MaBienBan
    INNER JOIN dbo.TaiSan ts ON ts.MaPhong = ctVao.MaPhong AND ts.MaTaiSan = ctVao.MaTaiSan
    LEFT JOIN dbo.BienBanBanGiao bgRa ON bgRa.MaHopDong = bgVao.MaHopDong AND bgRa.LoaiBanGiao = N'Bàn giao ra'
    LEFT JOIN dbo.ChiTietBanGiao ctRa ON ctRa.MaBienBan = bgRa.MaBienBan AND ctRa.MaPhong = ctVao.MaPhong AND ctRa.MaTaiSan = ctVao.MaTaiSan
    LEFT JOIN dbo.PhieuTraPhong pt ON pt.MaHopDong = bgVao.MaHopDong AND pt.MaPhieuTra = @MaPhieuTra
    LEFT JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.ChiTietHuHong hh ON hh.MaBienBanKT = bkt.MaBienBanKT AND hh.MaPhong = ctVao.MaPhong AND hh.MaTaiSan = ctVao.MaTaiSan
    WHERE bgVao.MaHopDong = @MaHopDong
      AND bgVao.LoaiBanGiao = N'Bàn giao vào'
    ORDER BY ctVao.MaPhong, ts.MaTaiSan;

    -- Ket qua kiem tra tra phong
    SELECT
        hh.MaChiTietHH AS maChiTietHH,
        hh.MaPhong AS maPhong,
        hh.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        hh.MucDoHuHong AS mucDoHuHong,
        hh.MoTaHuHong AS moTaHuHong,
        hh.ChiPhiSuaChua AS chiPhiSuaChua
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.ChiTietHuHong hh ON hh.MaBienBanKT = bkt.MaBienBanKT
    LEFT JOIN dbo.TaiSan ts ON ts.MaPhong = hh.MaPhong AND ts.MaTaiSan = hh.MaTaiSan
    WHERE pt.MaPhieuTra = @MaPhieuTra
    ORDER BY hh.MaChiTietHH;
END;
GO

-- 3. Lap bien ban ban giao ra
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6),
    @JSONBanGiaoRa NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @MaChiNhanhNV VARCHAR(6),
            @MaChiNhanhPT VARCHAR(6),
            @TrangThaiPT NVARCHAR(30),
            @MaHopDong VARCHAR(6),
            @MaPhieuDatCoc VARCHAR(6),
            @TrangThaiHD NVARCHAR(30),
            @TrangThaiDS NVARCHAR(30),
            @MaBienBanBG VARCHAR(6);

        SELECT @MaChiNhanhNV = MaChiNhanh
        FROM dbo.NhanVien
        WHERE MaNhanVien = @MaNhanVien;

        IF @MaChiNhanhNV IS NULL
            THROW 50200, N'Nhân viên không tồn tại hoặc không hợp lệ.', 1;

        SELECT TOP 1
            @TrangThaiPT = pt.TrangThai,
            @MaHopDong = pt.MaHopDong,
            @MaPhieuDatCoc = hd.MaPhieuCoc,
            @TrangThaiHD = hd.TrangThai,
            @TrangThaiDS = ds.TrangThai,
            @MaChiNhanhPT = p.MaChiNhanh
        FROM dbo.PhieuTraPhong pt WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
        INNER JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
        INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
        INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
        WHERE pt.MaPhieuTra = @MaPhieuTra;

        IF @TrangThaiPT IS NULL
            THROW 50201, N'Không tìm thấy phiếu trả phòng.', 1;

        IF @MaChiNhanhPT <> @MaChiNhanhNV
            THROW 50202, N'Phiếu trả phòng không thuộc chi nhánh của nhân viên quản lý.', 1;

        IF @MaHopDong IS NULL
            THROW 50203, N'Use-case ghi nhận bàn giao ra chỉ áp dụng cho hồ sơ có hợp đồng thuê.', 1;

        IF @TrangThaiPT <> N'Hoàn tất'
            THROW 50204, N'Hồ sơ không đủ điều kiện ghi nhận bàn giao ra.', 1;

        IF @TrangThaiHD <> N'Đã thanh lý' OR @TrangThaiDS <> N'Đã quyết toán'
            THROW 50205, N'Hồ sơ không đủ điều kiện ghi nhận bàn giao ra.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.BienBanBanGiao WITH (UPDLOCK, HOLDLOCK)
            WHERE MaHopDong = @MaHopDong
              AND LoaiBanGiao = N'Bàn giao ra'
        )
            THROW 50206, N'Hồ sơ này đã được ghi nhận bàn giao ra trước đó.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.BienBanBanGiao
            WHERE MaHopDong = @MaHopDong
              AND LoaiBanGiao = N'Bàn giao vào'
        )
            THROW 50207, N'Không tìm thấy thông tin tài sản đã bàn giao vào để đối chiếu.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.BienBanKiemTraPhong
            WHERE MaPhieuTra = @MaPhieuTra
        )
            THROW 50208, N'Không tìm thấy kết quả kiểm tra trả phòng liên quan đến hồ sơ.', 1;

        IF @JSONBanGiaoRa IS NULL OR ISJSON(@JSONBanGiaoRa) <> 1 OR NOT EXISTS (SELECT 1 FROM OPENJSON(@JSONBanGiaoRa))
            THROW 50209, N'Thông tin bàn giao ra không hợp lệ.', 1;

        DECLARE @BanGiao TABLE (
            MaPhong VARCHAR(4) NOT NULL,
            MaTaiSan VARCHAR(6) NOT NULL,
            SoLuongThuHoi INT NOT NULL,
            GhiChu NVARCHAR(255) NULL
        );

        INSERT INTO @BanGiao (MaPhong, MaTaiSan, SoLuongThuHoi, GhiChu)
        SELECT
            MaPhong,
            MaTaiSan,
            SoLuongThuHoi,
            GhiChu
        FROM OPENJSON(@JSONBanGiaoRa)
        WITH (
            MaPhong VARCHAR(4) '$.maPhong',
            MaTaiSan VARCHAR(6) '$.maTaiSan',
            SoLuongThuHoi INT '$.soLuongThuHoi',
            GhiChu NVARCHAR(255) '$.ghiChu'
        );

        IF EXISTS (
            SELECT 1
            FROM @BanGiao
            WHERE MaPhong IS NULL
               OR MaTaiSan IS NULL
               OR SoLuongThuHoi IS NULL
               OR SoLuongThuHoi < 0
        )
            THROW 50210, N'Thông tin bàn giao ra không hợp lệ.', 1;

        IF EXISTS (
            SELECT 1
            FROM @BanGiao bg
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.BienBanBanGiao bgVao
                INNER JOIN dbo.ChiTietBanGiao ctVao ON ctVao.MaBienBan = bgVao.MaBienBan
                WHERE bgVao.MaHopDong = @MaHopDong
                  AND bgVao.LoaiBanGiao = N'Bàn giao vào'
                  AND ctVao.MaPhong = bg.MaPhong
                  AND ctVao.MaTaiSan = bg.MaTaiSan
                  AND bg.SoLuongThuHoi <= ctVao.SoLuongThucTe
            )
        )
            THROW 50211, N'Số lượng hoặc tài sản bàn giao ra không hợp lệ so với biên bản bàn giao vào.', 1;

        SELECT @MaBienBanBG = 'BG' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaBienBan, 3, 4) AS INT)), 0) + 1 AS VARCHAR), 4)
        FROM dbo.BienBanBanGiao WITH (UPDLOCK, HOLDLOCK)
        WHERE MaBienBan LIKE 'BG[0-9][0-9][0-9][0-9]';

        INSERT INTO dbo.BienBanBanGiao (MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy)
        VALUES (@MaBienBanBG, CAST(GETDATE() AS DATE), N'Bàn giao ra', @MaHopDong, @MaNhanVien);

        DECLARE @MaxCT INT;
        SELECT @MaxCT = ISNULL(MAX(CAST(SUBSTRING(MaChiTietBG, 3, 4) AS INT)), 0)
        FROM dbo.ChiTietBanGiao WITH (UPDLOCK, HOLDLOCK)
        WHERE MaChiTietBG LIKE 'CB[0-9][0-9][0-9][0-9]';

        INSERT INTO dbo.ChiTietBanGiao (MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
        SELECT
            'CB' + RIGHT('0000' + CAST(@MaxCT + ROW_NUMBER() OVER (ORDER BY MaPhong, MaTaiSan) AS VARCHAR), 4),
            @MaBienBanBG,
            MaPhong,
            MaTaiSan,
            SoLuongThuHoi,
            GhiChu
        FROM @BanGiao;

        UPDATE ts
        SET ts.SoLuong = ts.SoLuong - (ctVao.SoLuongThucTe - bg.SoLuongThuHoi)
        FROM dbo.TaiSan ts
        INNER JOIN @BanGiao bg ON bg.MaPhong = ts.MaPhong AND bg.MaTaiSan = ts.MaTaiSan
        INNER JOIN dbo.BienBanBanGiao bgVao ON bgVao.MaHopDong = @MaHopDong AND bgVao.LoaiBanGiao = N'Bàn giao vào'
        INNER JOIN dbo.ChiTietBanGiao ctVao ON ctVao.MaBienBan = bgVao.MaBienBan AND ctVao.MaPhong = bg.MaPhong AND ctVao.MaTaiSan = bg.MaTaiSan;

        UPDATE dbo.ThanhVienHopDong
        SET TrangThai = N'Đã rời'
        WHERE MaHopDong = @MaHopDong
          AND TrangThai = N'Đang ở';

        ;WITH PhongHopDong AS (
            SELECT DISTINCT ctdc.MaPhong
            FROM dbo.ChiTietDatCoc ctdc
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
        ),
        GiuongHopDong AS (
            SELECT ctdc.MaPhong, ctdc.MaGiuong
            FROM dbo.ChiTietDatCoc ctdc
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
        )
        UPDATE g
        SET TinhTrang = N'Trống'
        FROM dbo.Giuong g
        INNER JOIN GiuongHopDong gh
            ON gh.MaPhong = g.MaPhong
           AND (gh.MaGiuong IS NULL OR gh.MaGiuong = g.MaGiuong);

        ;WITH PhongHopDong AS (
            SELECT DISTINCT ctdc.MaPhong
            FROM dbo.ChiTietDatCoc ctdc
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
        )
        UPDATE p
        SET TinhTrang =
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM dbo.Giuong g
                    WHERE g.MaPhong = p.MaPhong
                      AND g.TinhTrang <> N'Trống'
                ) THEN N'Trống'
                WHEN EXISTS (
                    SELECT 1 FROM dbo.Giuong g
                    WHERE g.MaPhong = p.MaPhong
                      AND g.TinhTrang = N'Trống'
                ) THEN N'Còn chỗ'
                ELSE N'Đầy'
            END
        FROM dbo.Phong p
        INNER JOIN PhongHopDong ph ON ph.MaPhong = p.MaPhong;

        UPDATE dbo.PhieuDatCoc
        SET TrangThaiCoc = N'Đã hủy'
        WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

        COMMIT TRANSACTION;

        SELECT
            @MaBienBanBG AS maBienBanBanGiaoRa,
            @MaPhieuTra AS maPhieuTra,
            @MaHopDong AS maHopDong,
            N'Ghi nhận bàn giao ra thành công.' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

GO

