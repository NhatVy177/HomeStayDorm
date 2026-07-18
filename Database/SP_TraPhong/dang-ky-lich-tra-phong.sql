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
            (hd.GiaThue * (SELECT COUNT(*) FROM dbo.ChiTietDatCoc ctdc2 WHERE ctdc2.MaPhieuDatCoc = hd.MaPhieuCoc))       AS tienCoc,
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
            pdc2.SoTienCoc                                  AS tienCoc,
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

