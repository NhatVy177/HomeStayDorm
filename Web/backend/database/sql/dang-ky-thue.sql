USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: ĐĂNG KÝ THUÊ PHÒNG (dành cho nhân viên Sale)
-- Chạy file này sau khi đã chạy app.sql và auth.sql.
--
-- Danh sách stored procedure:
--   1. SP_TaoHoSoDangKy          -- Khách hàng tạo hồ sơ nhu cầu thuê
--   2. SP_DanhSachHoSoDangKy     -- Nhân viên Sale xem danh sách hồ sơ chờ xử lý
--   3. SP_DanhSachPhongGiuongKhaDung -- Lấy phòng/giường còn trống để gợi ý
--   4. SP_KiemTraDieuKienThue    -- Kiểm tra hồ sơ đủ điều kiện tiến lên đặt cọc
--   5. SP_CapNhatKetQuaXuLyHoSo  -- Sale cập nhật kết quả xử lý hồ sơ
--   6. SP_TiepNhanHoSoDangKy     -- Sale tiếp nhận hồ sơ đăng ký
--   7. SP_TaoHoSoKhachVangLai    -- Sale tạo hồ sơ cho khách vãng lai
--   8. SP_LayThongTinKhachHangChoDonDangKy -- Lấy thông tin khách để tự động điền đơn
-- =============================================

IF OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
   OR OBJECT_ID(N'dbo.KhachHang', N'U') IS NULL
   OR OBJECT_ID(N'dbo.NhanVien', N'U') IS NULL
    THROW 50000, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước.', 1;
GO

IF COL_LENGTH('dbo.NguoiDung', 'DiaChi') IS NULL
BEGIN
    ALTER TABLE dbo.NguoiDung
        ADD DiaChi NVARCHAR(255) NULL;
END;
GO

-- =============================================
-- 1. SP_TaoHoSoDangKy
-- Khách hàng gửi hồ sơ nhu cầu thuê phòng.
-- Mỗi khách chỉ được có 1 hồ sơ đang hoạt động (Chờ tiếp nhận / Chờ xác nhận cọc / Chấp nhận).
-- =============================================
IF OBJECT_ID(N'dbo.SP_TaoHoSoDangKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TaoHoSoDangKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TaoHoSoDangKy
    @KhachHangId        NVARCHAR(20),
    @NhuCau             NVARCHAR(200)   = NULL,
    @SoNguoiO           INT             = 1,
    @NgayDuKienVaoO     DATE            = NULL,
    @GhiChu             NVARCHAR(MAX)   = NULL,
    @KhuVucMongMuon     NVARCHAR(100)   = NULL,
    @LoaiPhongYeuCau    NVARCHAR(50)    = NULL,
    @MucGia             DECIMAL(18,2)   = NULL,
    @ThoiHanThue        INT             = NULL,
    @GioiTinh           NVARCHAR(10)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @KhachHangId    = LTRIM(RTRIM(@KhachHangId));
    SET @NhuCau         = NULLIF(LTRIM(RTRIM(@NhuCau)), N'');
    SET @GhiChu         = NULLIF(LTRIM(RTRIM(@GhiChu)), N'');
    SET @KhuVucMongMuon = NULLIF(LTRIM(RTRIM(@KhuVucMongMuon)), N'');
    SET @LoaiPhongYeuCau= NULLIF(LTRIM(RTRIM(@LoaiPhongYeuCau)), N'');
    SET @GioiTinh       = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');

    IF @NhuCau = N'Nguyên phòng'
        SET @NhuCau = N'Nguyên căn';

    DECLARE @GioiTinhPhong NVARCHAR(10) = NULL;
    IF @NhuCau = N'Ghép nam'
    BEGIN
        SET @GioiTinhPhong = N'Nam';
        SET @NhuCau = N'Ghép';
    END
    ELSE IF @NhuCau = N'Ghép nữ'
    BEGIN
        SET @GioiTinhPhong = N'Nữ';
        SET @NhuCau = N'Ghép';
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    IF @NhuCau IS NULL OR @NhuCau NOT IN (N'Nguyên căn', N'Ghép')
        THROW 50011, N'Hình thức thuê không hợp lệ.', 1;

    IF @SoNguoiO IS NULL OR @SoNguoiO < 1
        THROW 50011, N'Số người dự kiến ở phải ít nhất là 1.', 1;

    IF @GioiTinh IS NULL AND @GioiTinhPhong IS NULL
    BEGIN
        SELECT @GioiTinh = nd.GioiTinh
        FROM dbo.KhachHang kh
        JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
        WHERE kh.MaKhachHang = @KhachHangId;
    END

    SET @GioiTinh = ISNULL(@GioiTinhPhong, @GioiTinh);

    IF @GioiTinh IS NULL OR @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 50011, N'Giới tính không hợp lệ.', 1;

    IF @KhuVucMongMuon IS NULL
        THROW 50011, N'Vui lòng nhập khu vực mong muốn.', 1;

    IF @LoaiPhongYeuCau IS NULL
        THROW 50011, N'Vui lòng nhập loại phòng yêu cầu.', 1;

    IF @MucGia IS NULL OR @MucGia <= 0
        THROW 50011, N'Mức giá mong muốn phải lớn hơn 0.', 1;

    IF @NgayDuKienVaoO IS NULL OR @NgayDuKienVaoO <= CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày dự kiến vào ở phải lớn hơn ngày hiện tại.', 1;

    IF @ThoiHanThue IS NULL OR @ThoiHanThue < 1
        THROW 50011, N'Thời hạn thuê phải ít nhất là 1 tháng.', 1;

    DECLARE @SoThuTu    INT;
    DECLARE @MaDangKy   VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
            WHERE MaKhachHang = @KhachHangId
              AND TrangThai IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Xác nhận cọc')
        )
            THROW 50011, N'Bạn đang có hồ sơ thuê chưa được kết thúc.', 1;

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDangKy, 3, 4))), 0) + 1
        FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDangKy LIKE 'DK%';

        SET @MaDangKy = CONCAT('DK', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNguoiDuKienO, GioiTinh, HinhThucThue, 
            MucGia, ThoiGianDuKienVaoO, YeuCauKhac, TrangThai, MaKhachHang,
            KhuVucMongMuon, LoaiPhongYeuCau, ThoiHanThue
        )
        VALUES (
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @GioiTinh, @NhuCau,
            @MucGia, @NgayDuKienVaoO, @GhiChu, N'Chờ tiếp nhận', @KhachHangId,
            @KhuVucMongMuon, @LoaiPhongYeuCau, @ThoiHanThue
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    -- Trả về hồ sơ vừa tạo
    SELECT
        pdk.MaDangKy        AS maDangKy,
        pdk.NgayDangKy      AS ngayDangKy,
        pdk.SoNguoiDuKienO  AS soNguoiO,
        pdk.GioiTinh        AS gioiTinh,
        pdk.HinhThucThue    AS hinhThucThue,
        pdk.KhuVucMongMuon  AS khuVucMongMuon,
        pdk.LoaiPhongYeuCau AS loaiPhongYeuCau,
        pdk.MucGia          AS mucGia,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.ThoiHanThue     AS thoiHanThue,
        pdk.YeuCauKhac      AS ghiChu,
        pdk.GhiChuSale      AS ghiChuSale,
        pdk.TrangThai       AS trangThai,
        pdk.MaKhachHang     AS maKhachHang,
        nd.HoTen            AS hoTenKhach,
        nd.SDT              AS sdtKhach,
        nd.Email            AS emailKhach
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    WHERE pdk.MaDangKy = @MaDangKy;
END;
GO

-- =============================================
-- 6. SP_TiepNhanHoSoDangKy
-- Nhân viên Sale tiếp nhận hồ sơ đang ở trạng thái chờ tiếp nhận.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TiepNhanHoSoDangKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TiepNhanHoSoDangKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

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
        SET MaNhanVienSale = @NhanVienSaleId
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
GO

-- =============================================
-- 7. SP_TaoHoSoKhachVangLai
-- Sale tạo khách hàng mới và lập hồ sơ nhu cầu thuê trong cùng giao dịch.
-- =============================================
IF OBJECT_ID(N'dbo.SP_TaoHoSoKhachVangLai', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TaoHoSoKhachVangLai AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TaoHoSoKhachVangLai
    @HoTen              NVARCHAR(100),
    @NgaySinh           DATE,
    @GioiTinh           NVARCHAR(5),
    @SDT                VARCHAR(20),
    @Email              VARCHAR(100)    = NULL,
    @DiaChi             NVARCHAR(255)   = NULL,
    @QuocTich           NVARCHAR(50)    = NULL,
    @CCCD               VARCHAR(20),
    @HinhThucThue       NVARCHAR(20),
    @KhuVucMongMuon     NVARCHAR(100),
    @LoaiPhongYeuCau    NVARCHAR(50),
    @MucGia             DECIMAL(15,2)   = NULL,
    @SoNguoiO           INT,
    @NgayDuKienVaoO     DATE,
    @ThoiHanThue        INT,
    @GhiChu             NVARCHAR(MAX)   = NULL,
    @NhanVienSaleId     VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @HoTen              = NULLIF(LTRIM(RTRIM(@HoTen)), N'');
    SET @GioiTinh           = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    SET @SDT                = NULLIF(LTRIM(RTRIM(@SDT)), '');
    SET @Email              = NULLIF(LTRIM(RTRIM(@Email)), '');
    SET @DiaChi             = NULLIF(LTRIM(RTRIM(@DiaChi)), N'');
    SET @QuocTich           = COALESCE(NULLIF(LTRIM(RTRIM(@QuocTich)), N''), N'Việt Nam');
    SET @CCCD               = NULLIF(LTRIM(RTRIM(@CCCD)), '');
    SET @HinhThucThue       = NULLIF(LTRIM(RTRIM(@HinhThucThue)), N'');

    DECLARE @GioiTinhPhong NVARCHAR(10) = NULL;
    IF @HinhThucThue = N'Ghép nam'
    BEGIN
        SET @GioiTinhPhong = N'Nam';
        SET @HinhThucThue = N'Ghép';
    END
    ELSE IF @HinhThucThue = N'Ghép nữ'
    BEGIN
        SET @GioiTinhPhong = N'Nữ';
        SET @HinhThucThue = N'Ghép';
    END

    SET @KhuVucMongMuon     = NULLIF(LTRIM(RTRIM(@KhuVucMongMuon)), N'');
    SET @LoaiPhongYeuCau    = NULLIF(LTRIM(RTRIM(@LoaiPhongYeuCau)), N'');
    SET @GhiChu             = NULLIF(LTRIM(RTRIM(@GhiChu)), N'');
    SET @NhanVienSaleId     = NULLIF(LTRIM(RTRIM(@NhanVienSaleId)), '');

    IF @HoTen IS NULL OR @NgaySinh IS NULL OR @GioiTinh IS NULL OR @SDT IS NULL
       OR @CCCD IS NULL OR @HinhThucThue IS NULL OR @KhuVucMongMuon IS NULL
       OR @LoaiPhongYeuCau IS NULL OR @NgayDuKienVaoO IS NULL
       OR @MucGia IS NULL OR @SoNguoiO IS NULL OR @ThoiHanThue IS NULL OR @NhanVienSaleId IS NULL
        THROW 50011, N'Vui lòng nhập đầy đủ thông tin khách hàng và nhu cầu thuê.', 1;

    IF @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 50011, N'Giới tính không hợp lệ.', 1;

    IF @HinhThucThue NOT IN (N'Ghép', N'Nguyên căn')
        THROW 50011, N'Hình thức thuê không hợp lệ.', 1;

    IF LEN(@SDT) <> 10 OR @SDT LIKE '%[^0-9]%'
        THROW 50011, N'Số điện thoại phải đủ 10 số.', 1;

    IF LEN(@CCCD) <> 12 OR @CCCD LIKE '%[^0-9]%'
        THROW 50011, N'CCCD phải đủ 12 số.', 1;

    IF @NgaySinh >= CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày sinh phải nhỏ hơn ngày hiện tại.', 1;

    IF @NgayDuKienVaoO <= CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày dự kiến vào ở phải lớn hơn ngày hiện tại.', 1;

    IF @SoNguoiO < 1
        THROW 50011, N'Số người dự kiến ở phải ít nhất là 1.', 1;

    IF @ThoiHanThue < 1
        THROW 50011, N'Thời hạn thuê phải ít nhất là 1 tháng.', 1;

    IF @MucGia <= 0
        THROW 50011, N'Mức giá mong muốn phải lớn hơn 0.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.NhanVien
        WHERE MaNhanVien = @NhanVienSaleId
          AND ChucVu = N'Sale'
    )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    IF EXISTS (SELECT 1 FROM dbo.KhachHang WHERE CCCD = @CCCD)
        THROW 50011, N'CCCD đã tồn tại trong hồ sơ khách hàng.', 1;

    IF EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE SDT = @SDT AND LoaiNguoiDung = 'KhachHang')
        THROW 50011, N'Số điện thoại đã tồn tại trong hồ sơ khách hàng.', 1;

    IF @Email IS NOT NULL
       AND EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE Email = @Email AND LoaiNguoiDung = 'KhachHang')
        THROW 50011, N'Email đã tồn tại trong hồ sơ khách hàng.', 1;

    DECLARE @SoKhach INT;
    DECLARE @MaKhachHang VARCHAR(6);
    DECLARE @SoDangKy INT;
    DECLARE @MaDangKy VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @SoKhach = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaNguoiDung, 3, 4))), 0) + 1
        FROM dbo.NguoiDung WITH (UPDLOCK, HOLDLOCK)
        WHERE MaNguoiDung LIKE 'KH[0-9][0-9][0-9][0-9]';

        IF @SoKhach > 9999
            THROW 50011, N'Không thể sinh thêm mã khách hàng mới.', 1;

        SET @MaKhachHang = CONCAT('KH', RIGHT(CONCAT('0000', @SoKhach), 4));

        INSERT INTO dbo.NguoiDung (
            MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, DiaChi, UrlAvt, LoaiNguoiDung
        )
        VALUES (
            @MaKhachHang, @HoTen, @NgaySinh, @GioiTinh, @SDT, @Email, @DiaChi, NULL, 'KhachHang'
        );

        INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
        VALUES (@MaKhachHang, @QuocTich, @CCCD);

        SELECT @SoDangKy = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDangKy, 3, 4))), 0) + 1
        FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDangKy LIKE 'DK[0-9][0-9][0-9][0-9]';

        IF @SoDangKy > 9999
            THROW 50011, N'Không thể sinh thêm mã hồ sơ đăng ký mới.', 1;

        SET @MaDangKy = CONCAT('DK', RIGHT(CONCAT('0000', @SoDangKy), 4));

        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNguoiDuKienO, GioiTinh, HinhThucThue,
            KhuVucMongMuon, LoaiPhongYeuCau, MucGia, ThoiGianDuKienVaoO,
            ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang, MaNhanVienSale
        )
        VALUES (
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @GioiTinh, @HinhThucThue,
            @KhuVucMongMuon, @LoaiPhongYeuCau, @MucGia, @NgayDuKienVaoO,
            @ThoiHanThue, @GhiChu, N'Chờ tiếp nhận', @MaKhachHang, @NhanVienSaleId
        );

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
        nd.DiaChi               AS diaChi,
        kh.QuocTich             AS quocTich,
        kh.CCCD                 AS cccd,
        pdk.MaNhanVienSale      AS maNhanVienSale,
        nvnd.HoTen              AS hoTenSale
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS nvnd ON nvnd.MaNguoiDung = pdk.MaNhanVienSale
    WHERE pdk.MaDangKy = @MaDangKy;
END;
GO

-- =============================================
-- 8. SP_LayThongTinKhachHangChoDonDangKy
-- Lấy thông tin khách hàng và hồ sơ gần nhất để hệ thống tự động điền đơn đăng ký.
-- Có thể tìm bằng mã khách hàng, CCCD, số điện thoại hoặc email.
-- =============================================
IF OBJECT_ID(N'dbo.SP_LayThongTinKhachHangChoDonDangKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_LayThongTinKhachHangChoDonDangKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_LayThongTinKhachHangChoDonDangKy
    @KhachHangId VARCHAR(6)   = NULL,
    @CCCD        VARCHAR(20)  = NULL,
    @SDT         VARCHAR(20)  = NULL,
    @Email       VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @KhachHangId = NULLIF(LTRIM(RTRIM(@KhachHangId)), '');
    SET @CCCD        = NULLIF(LTRIM(RTRIM(@CCCD)), '');
    SET @SDT         = NULLIF(LTRIM(RTRIM(@SDT)), '');
    SET @Email       = NULLIF(LTRIM(RTRIM(@Email)), '');

    IF @KhachHangId IS NULL AND @CCCD IS NULL AND @SDT IS NULL AND @Email IS NULL
        THROW 50011, N'Vui lòng nhập mã khách hàng, CCCD, số điện thoại hoặc email để tra cứu.', 1;

    DECLARE @MaKhachHangTimThay VARCHAR(6);

    SELECT TOP (1)
        @MaKhachHangTimThay = kh.MaKhachHang
    FROM dbo.KhachHang AS kh
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE (@KhachHangId IS NOT NULL AND kh.MaKhachHang = @KhachHangId)
       OR (@CCCD IS NOT NULL AND kh.CCCD = @CCCD)
       OR (@SDT IS NOT NULL AND nd.SDT = @SDT)
       OR (@Email IS NOT NULL AND nd.Email = @Email)
    ORDER BY
        CASE
            WHEN @KhachHangId IS NOT NULL AND kh.MaKhachHang = @KhachHangId THEN 1
            WHEN @CCCD IS NOT NULL AND kh.CCCD = @CCCD THEN 2
            WHEN @SDT IS NOT NULL AND nd.SDT = @SDT THEN 3
            WHEN @Email IS NOT NULL AND nd.Email = @Email THEN 4
            ELSE 5
        END,
        kh.MaKhachHang;

    IF @MaKhachHangTimThay IS NULL
        THROW 50010, N'Không tìm thấy khách hàng phù hợp.', 1;

    SELECT
        kh.MaKhachHang          AS maKhachHang,
        nd.HoTen                AS hoTenKhach,
        nd.HoTen                AS hoTen,
        nd.NgaySinh             AS ngaySinh,
        nd.GioiTinh             AS gioiTinh,
        nd.SDT                  AS sdtKhach,
        nd.SDT                  AS soDienThoai,
        nd.Email                AS emailKhach,
        nd.Email                AS email,
        nd.DiaChi               AS diaChi,
        kh.QuocTich             AS quocTich,
        kh.CCCD                 AS cccd,
        hoSo.MaDangKy           AS maDangKyGanNhat,
        hoSo.HinhThucThue       AS hinhThucThue,
        hoSo.KhuVucMongMuon     AS khuVucMongMuon,
        hoSo.LoaiPhongYeuCau    AS loaiPhongYeuCau,
        hoSo.MucGia             AS mucGia,
        hoSo.SoNguoiDuKienO     AS soNguoiO,
        hoSo.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        hoSo.ThoiHanThue        AS thoiHanThue,
        hoSo.YeuCauKhac         AS ghiChu,
        hoSo.GhiChuSale         AS ghiChuSale,
        hoSo.TrangThai          AS trangThaiHoSoGanNhat
    FROM dbo.KhachHang AS kh
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP (1)
            pdk.MaDangKy,
            pdk.HinhThucThue,
            pdk.KhuVucMongMuon,
            pdk.LoaiPhongYeuCau,
            pdk.MucGia,
            pdk.SoNguoiDuKienO,
            pdk.ThoiGianDuKienVaoO,
            pdk.ThoiHanThue,
            pdk.YeuCauKhac,
            pdk.GhiChuSale,
            pdk.TrangThai
        FROM dbo.PhieuDangKy AS pdk
        WHERE pdk.MaKhachHang = kh.MaKhachHang
        ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC
    ) AS hoSo
    WHERE kh.MaKhachHang = @MaKhachHangTimThay;
END;
GO

-- =============================================
-- 2. SP_DanhSachHoSoDangKy
-- Nhân viên Sale xem danh sách hồ sơ đăng ký thuê.
-- Mặc định lấy hồ sơ đang chờ xử lý.
-- Hỗ trợ lọc theo trạng thái và chi nhánh.
-- =============================================
IF OBJECT_ID(N'dbo.SP_DanhSachHoSoDangKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachHoSoDangKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachHoSoDangKy
    @TrangThai      NVARCHAR(30)    = NULL,     -- NULL = lấy tất cả; hoặc lọc theo trạng thái cụ thể
    @MaChiNhanh     VARCHAR(6)      = NULL,     -- NULL = tất cả chi nhánh
    @NhanVienSaleId VARCHAR(6)      = NULL,     -- NULL = không lọc theo sale
    @KhachHangId    VARCHAR(6)      = NULL      -- NULL = không lọc theo khách hàng
AS
BEGIN
    SET NOCOUNT ON;

    SET @TrangThai      = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');
    SET @MaChiNhanh     = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @NhanVienSaleId = NULLIF(LTRIM(RTRIM(@NhanVienSaleId)), '');
    SET @KhachHangId    = NULLIF(LTRIM(RTRIM(@KhachHangId)), '');

    IF @TrangThai IS NOT NULL
       AND @TrangThai NOT IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối')
        THROW 50011, N'Trạng thái hồ sơ đăng ký không hợp lệ.', 1;

    IF @MaChiNhanh IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
        THROW 50011, N'Không tìm thấy chi nhánh.', 1;

    IF @NhanVienSaleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @NhanVienSaleId AND ChucVu = N'Sale'
       )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    IF @KhachHangId IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

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
        kh.QuocTich             AS quocTich,
        kh.CCCD                 AS cccd,
        pdk.MaNhanVienSale      AS maNhanVienSale,
        nvnd.HoTen              AS hoTenSale,
        nvSale.MaChiNhanh       AS maChiNhanhSale,
        cnSale.TenChiNhanh      AS tenChiNhanhSale,
        -- Lịch xem phòng gần nhất
        lich.STTLich            AS sttLichMoiNhat,
        lich.ThoiGianHen        AS thoiGianHenMoiNhat,
        lich.TrangThai          AS trangThaiLichMoiNhat
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS nvnd ON nvnd.MaNguoiDung = pdk.MaNhanVienSale
    LEFT JOIN dbo.NhanVien AS nvSale ON nvSale.MaNhanVien = pdk.MaNhanVienSale
    LEFT JOIN dbo.ChiNhanh AS cnSale ON cnSale.MaChiNhanh = nvSale.MaChiNhanh
    OUTER APPLY (
        SELECT TOP (1) lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai
        FROM dbo.LichXemPhong AS lxp
        WHERE lxp.MaDangKy = pdk.MaDangKy
        ORDER BY lxp.STTLich DESC
    ) AS lich
    WHERE (@TrangThai IS NULL OR pdk.TrangThai = @TrangThai)
      AND (@NhanVienSaleId IS NULL OR pdk.MaNhanVienSale = @NhanVienSaleId)
      AND (@KhachHangId IS NULL OR pdk.MaKhachHang = @KhachHangId)
      AND (@MaChiNhanh IS NULL OR nvSale.MaChiNhanh = @MaChiNhanh)
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

-- =============================================
-- 3. SP_DanhSachPhongGiuongKhaDung
-- Lấy danh sách phòng và giường còn trống để Sale gợi ý cho khách.
-- Hỗ trợ lọc theo loại, giới tính, chi nhánh, khu vực, loại phòng, mức giá, số người hoặc hồ sơ đăng ký.
-- =============================================
IF OBJECT_ID(N'dbo.SP_DanhSachPhongGiuongKhaDung', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachPhongGiuongKhaDung AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachPhongGiuongKhaDung
    @Loai           NVARCHAR(50)    = NULL,     -- N'Nguyên căn' hoặc N'Ghép' hoặc NULL (lấy tất cả)
    @GioiTinh       NVARCHAR(5)     = NULL,     -- N'Nam' hoặc N'Nữ' hoặc NULL
    @MaChiNhanh     VARCHAR(6)      = NULL,     -- Lọc theo chi nhánh
    @KhuVuc         NVARCHAR(100)   = NULL,     -- Lọc theo địa chỉ/tên chi nhánh
    @LoaiPhong      NVARCHAR(50)    = NULL,     -- Lọc theo tên loại phòng
    @MucGiaTu       DECIMAL(15,2)   = NULL,     -- Lọc theo ngân sách tối thiểu
    @MucGiaToiDa    DECIMAL(15,2)   = NULL,     -- Lọc theo ngân sách tối đa
    @SoNguoiO       INT             = NULL,     -- Lọc phòng đủ sức chứa/chỗ trống
    @HoSoId         VARCHAR(6)      = NULL      -- Tự lấy tiêu chí từ phiếu đăng ký
AS
BEGIN
    SET NOCOUNT ON;

    SET @Loai       = NULLIF(LTRIM(RTRIM(@Loai)), N'');
    SET @GioiTinh   = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @KhuVuc     = NULLIF(LTRIM(RTRIM(@KhuVuc)), N'');
    SET @LoaiPhong  = NULLIF(LTRIM(RTRIM(@LoaiPhong)), N'');
    SET @HoSoId     = NULLIF(LTRIM(RTRIM(@HoSoId)), '');

    IF @HoSoId IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @HoSoId)
            THROW 50010, N'Không tìm thấy hồ sơ đăng ký.', 1;

        SELECT
            @Loai        = COALESCE(@Loai, HinhThucThue),
            @GioiTinh    = COALESCE(@GioiTinh, GioiTinh),
            @KhuVuc      = COALESCE(@KhuVuc, KhuVucMongMuon),
            @LoaiPhong   = COALESCE(@LoaiPhong, LoaiPhongYeuCau),
            @MucGiaTu    = COALESCE(@MucGiaTu, MucGia),
            @MucGiaToiDa = COALESCE(@MucGiaToiDa, MucGiaDen),
            @SoNguoiO    = COALESCE(@SoNguoiO, SoNguoiDuKienO)
        FROM dbo.PhieuDangKy
        WHERE MaDangKy = @HoSoId;
    END;

    IF @Loai = N'Nguyên phòng'
        SET @Loai = N'Nguyên căn';

    IF @Loai IS NOT NULL AND @Loai NOT IN (N'Nguyên căn', N'Ghép')
        THROW 50011, N'Hình thức tra cứu phòng/giường không hợp lệ.', 1;

    IF @GioiTinh IS NOT NULL AND @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 50011, N'Giới tính không hợp lệ.', 1;

    IF @MucGiaTu IS NOT NULL AND @MucGiaTu < 0
        THROW 50011, N'Mức giá tối thiểu không hợp lệ.', 1;

    IF @MucGiaToiDa IS NOT NULL AND @MucGiaToiDa < 0
        THROW 50011, N'Mức giá tối đa không hợp lệ.', 1;

    IF @SoNguoiO IS NOT NULL AND @SoNguoiO < 1
        THROW 50011, N'Số người ở phải ít nhất là 1.', 1;

    IF @MaChiNhanh IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
        THROW 50011, N'Không tìm thấy chi nhánh.', 1;

    -- === Phòng nguyên căn còn trống ===
    IF @Loai IS NULL OR @Loai = N'Nguyên căn'
    BEGIN
        SELECT
            p.MaPhong               AS maPhong,
            p.TenPhong              AS tenPhong,
            N'Nguyên căn'           AS loaiThue,
            lp.TenLoaiPhong         AS loaiPhong,
            lp.MoTa                 AS moTa,
            COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) AS giaThue,
            lp.SucChuaToiDa         AS sucChua,
            p.GioiTinhChoPhep       AS gioiTinhChoPhep,
            p.TinhTrang             AS tinhTrang,
            cn.MaChiNhanh           AS maChiNhanh,
            cn.TenChiNhanh          AS tenChiNhanh,
            cn.DiaChi               AS diaChi,
            (SELECT TOP 1 UrlImg FROM dbo.HinhAnhPhong hap WHERE hap.MaPhong = p.MaPhong ORDER BY hap.STTAnh) AS urlImg,
            NULL                    AS maGiuong,
            NULL                    AS soGiuong
        FROM dbo.Phong AS p
        INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
        WHERE p.TinhTrang = N'Trống'
          AND COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) IS NOT NULL
          AND cn.TrangThai = N'Hoạt động'
          AND (@GioiTinh IS NULL OR p.GioiTinhChoPhep IN (@GioiTinh, N'Không phân biệt'))
          AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
          AND (@KhuVuc IS NULL OR cn.DiaChi LIKE N'%' + @KhuVuc + N'%' OR cn.TenChiNhanh LIKE N'%' + @KhuVuc + N'%')
          AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
          AND (@MucGiaTu IS NULL OR COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) >= @MucGiaTu)
          AND (@MucGiaToiDa IS NULL OR COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) <= @MucGiaToiDa)
          AND (@SoNguoiO IS NULL OR lp.SucChuaToiDa >= @SoNguoiO)
        ORDER BY COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa), p.TenPhong;
    END;

    -- === Giường ghép còn trống ===
    IF @Loai IS NULL OR @Loai = N'Ghép'
    BEGIN
        SELECT
            p.MaPhong               AS maPhong,
            p.TenPhong              AS tenPhong,
            N'Ghép'                 AS loaiThue,
            lp.TenLoaiPhong         AS loaiPhong,
            lp.MoTa                 AS moTa,
            lp.GiaThueTheoGiuong    AS giaThue,
            lp.SucChuaToiDa         AS sucChua,
            p.GioiTinhChoPhep       AS gioiTinhChoPhep,
            p.TinhTrang             AS tinhTrang,
            cn.MaChiNhanh           AS maChiNhanh,
            cn.TenChiNhanh          AS tenChiNhanh,
            cn.DiaChi               AS diaChi,
            (SELECT TOP 1 UrlImg FROM dbo.HinhAnhPhong hap WHERE hap.MaPhong = p.MaPhong ORDER BY hap.STTAnh) AS urlImg,
            g.MaGiuong              AS maGiuong,
            g.SoGiuong              AS soGiuong
        FROM dbo.Phong AS p
        INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
        INNER JOIN dbo.Giuong AS g ON g.MaPhong = p.MaPhong
        WHERE p.TinhTrang IN (N'Trống', N'Còn chỗ')
          AND g.TinhTrang = N'Trống'
          AND lp.GiaThueTheoGiuong IS NOT NULL
          AND cn.TrangThai = N'Hoạt động'
          AND (@GioiTinh IS NULL OR p.GioiTinhChoPhep IN (@GioiTinh, N'Không phân biệt'))
          AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
          AND (@KhuVuc IS NULL OR cn.DiaChi LIKE N'%' + @KhuVuc + N'%' OR cn.TenChiNhanh LIKE N'%' + @KhuVuc + N'%')
          AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
          AND (@MucGiaTu IS NULL OR lp.GiaThueTheoGiuong >= @MucGiaTu)
          AND (@MucGiaToiDa IS NULL OR lp.GiaThueTheoGiuong <= @MucGiaToiDa)
          AND (
              @SoNguoiO IS NULL
              OR (
                  SELECT COUNT(*)
                  FROM dbo.Giuong AS gTrong
                  WHERE gTrong.MaPhong = p.MaPhong
                    AND gTrong.TinhTrang = N'Trống'
              ) >= @SoNguoiO
          )
        ORDER BY lp.GiaThueTheoGiuong, p.TenPhong, g.MaGiuong;
    END;
END;
GO

-- =============================================
-- 4. SP_KiemTraDieuKienThue
-- Kiểm tra hồ sơ đăng ký có đủ điều kiện để chuyển sang bước đặt cọc không.
-- Trả về: hopLe (BIT), lyDo (NVARCHAR)
-- =============================================
IF OBJECT_ID(N'dbo.SP_KiemTraDieuKienThue', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KiemTraDieuKienThue AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KiemTraDieuKienThue
    @HoSoId NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    SET @HoSoId = LTRIM(RTRIM(@HoSoId));

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @HoSoId)
        THROW 50010, N'Không tìm thấy hồ sơ đăng ký.', 1;

    DECLARE @TrangThai          NVARCHAR(30);
    DECLARE @MaKhachHang        VARCHAR(6);
    DECLARE @HinhThucThue       NVARCHAR(20);
    DECLARE @NgayDuKienVaoO     DATE;
    DECLARE @SoLichXemDaXem     INT;

    SELECT
        @TrangThai          = pdk.TrangThai,
        @MaKhachHang        = pdk.MaKhachHang,
        @HinhThucThue       = pdk.HinhThucThue,
        @NgayDuKienVaoO     = pdk.ThoiGianDuKienVaoO
    FROM dbo.PhieuDangKy AS pdk
    WHERE pdk.MaDangKy = @HoSoId;

    -- Đếm số lần đã xem phòng thành công
    SELECT @SoLichXemDaXem = COUNT(*)
    FROM dbo.LichXemPhong
    WHERE MaDangKy = @HoSoId AND TrangThai = N'Đã xem';

    SELECT
        @HoSoId                             AS maDangKy,
        @TrangThai                          AS trangThai,
        @HinhThucThue                       AS hinhThucThue,
        @NgayDuKienVaoO                     AS ngayDuKienVaoO,
        @SoLichXemDaXem                     AS soLichXemDaXem,
        -- Hồ sơ hợp lệ khi: đang ở trạng thái Chờ tiếp nhận + đã xem phòng ít nhất 1 lần
        CAST(CASE
            WHEN @TrangThai = N'Chờ tiếp nhận' AND @SoLichXemDaXem >= 1 THEN 1
            ELSE 0
        END AS BIT)                         AS hopLe,
        CASE
            WHEN @TrangThai = N'Chờ xác nhận cọc' THEN N'Hồ sơ đã được chấp nhận và đang chờ đặt cọc.'
            WHEN @TrangThai = N'Chấp nhận'         THEN N'Hồ sơ đã được chấp nhận.'
            WHEN @TrangThai = N'Từ chối'           THEN N'Hồ sơ đã bị từ chối.'
            WHEN @SoLichXemDaXem < 1               THEN N'Khách hàng chưa xem phòng lần nào. Cần sắp xếp lịch xem phòng trước.'
            ELSE N'Hồ sơ đủ điều kiện tiến hành đặt cọc.'
        END                                 AS lyDo;
END;
GO

-- =============================================
-- 5. SP_CapNhatKetQuaXuLyHoSo
-- Nhân viên Sale cập nhật kết quả xử lý hồ sơ đăng ký.
-- TrangThai hợp lệ: N'Chấp nhận', N'Từ chối', N'Chờ xác nhận cọc'
-- =============================================
IF OBJECT_ID(N'dbo.SP_CapNhatKetQuaXuLyHoSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_CapNhatKetQuaXuLyHoSo AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_CapNhatKetQuaXuLyHoSo
    @HoSoId         NVARCHAR(30),
    @TrangThai      NVARCHAR(50),
    @GhiChuXuLy     NVARCHAR(MAX)   = NULL,
    @NhanVienSaleId NVARCHAR(20)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @HoSoId         = LTRIM(RTRIM(@HoSoId));
    SET @TrangThai      = LTRIM(RTRIM(@TrangThai));
    SET @NhanVienSaleId = NULLIF(LTRIM(RTRIM(@NhanVienSaleId)), '');
    SET @GhiChuXuLy     = NULLIF(LTRIM(RTRIM(@GhiChuXuLy)), N'');

    -- Kiểm tra hồ sơ tồn tại
    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @HoSoId)
        THROW 50010, N'Không tìm thấy hồ sơ đăng ký.', 1;

    -- Kiểm tra trạng thái mới hợp lệ
    IF @TrangThai NOT IN (N'Chấp nhận', N'Từ chối', N'Chờ xác nhận cọc')
        THROW 50011, N'Trạng thái xử lý không hợp lệ. Chỉ chấp nhận: "Chấp nhận", "Từ chối", "Chờ xác nhận cọc".', 1;

    -- Kiểm tra hồ sơ có đang ở trạng thái có thể cập nhật không
    DECLARE @TrangThaiHienTai NVARCHAR(30);
    SELECT @TrangThaiHienTai = TrangThai FROM dbo.PhieuDangKy WHERE MaDangKy = @HoSoId;

    IF @TrangThaiHienTai NOT IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc')
        THROW 50011, N'Hồ sơ đã được kết thúc hoặc không thể cập nhật nữa.', 1;

    IF @NhanVienSaleId IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM dbo.PhieuDangKy
           WHERE MaDangKy = @HoSoId
             AND MaNhanVienSale IS NOT NULL
             AND MaNhanVienSale <> @NhanVienSaleId
       )
        THROW 50011, N'Hồ sơ đang do nhân viên Sale khác xử lý.', 1;

    -- Kiểm tra nhân viên Sale tồn tại (nếu có truyền vào)
    IF @NhanVienSaleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @NhanVienSaleId AND ChucVu = N'Sale'
       )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    -- Nếu chấp nhận hồ sơ hoặc chuyển sang bước cọc: khách phải đã xem phòng ít nhất 1 lần
    IF @TrangThai IN (N'Chờ xác nhận cọc', N'Chấp nhận')
       AND NOT EXISTS (
           SELECT 1 FROM dbo.LichXemPhong
           WHERE MaDangKy = @HoSoId AND TrangThai = N'Đã xem'
       )
        THROW 50011, N'Không thể chấp nhận hồ sơ khi khách chưa xem phòng lần nào.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.PhieuDangKy
        SET TrangThai       = @TrangThai,
            GhiChuSale      = CASE WHEN @GhiChuXuLy IS NOT NULL THEN @GhiChuXuLy ELSE GhiChuSale END,
            MaNhanVienSale  = ISNULL(@NhanVienSaleId, MaNhanVienSale)
        WHERE MaDangKy = @HoSoId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    -- Trả về hồ sơ sau khi cập nhật
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
    WHERE pdk.MaDangKy = @HoSoId;
END;
GO
-- =============================================
-- 9. SP_TraCuuPhong
-- Tra cứu toàn bộ danh sách phòng để hiển thị trên màn hình Tra Cứu Phòng của Sale
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraCuuPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraCuuPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraCuuPhong
    @KhuVuc         NVARCHAR(100) = NULL,
    @LoaiPhong      NVARCHAR(50)  = NULL,
    @HinhThucThue   NVARCHAR(50)  = NULL,
    @MucGiaToiDa    DECIMAL(15,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @KhuVuc = NULLIF(LTRIM(RTRIM(@KhuVuc)), N'');
    SET @LoaiPhong = NULLIF(LTRIM(RTRIM(@LoaiPhong)), N'');
    SET @HinhThucThue = NULLIF(LTRIM(RTRIM(@HinhThucThue)), N'');
    
    IF @KhuVuc = N'Tất cả khu vực' SET @KhuVuc = NULL;
    IF @LoaiPhong = N'Tất cả loại phòng' SET @LoaiPhong = NULL;
    IF @HinhThucThue = N'Tất cả hình thức' SET @HinhThucThue = NULL;

    SELECT 
        p.MaPhong AS id,
        p.TenPhong AS name,
        cn.TenChiNhanh AS subName,
        cn.DiaChi AS area,
        CASE 
            WHEN p.GioiTinhChoPhep = N'Nam' THEN N'Ghép nam'
            WHEN p.GioiTinhChoPhep = N'Nữ' THEN N'Ghép nữ'
            ELSE N'Nguyên căn' 
        END AS type,
        COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong) AS price,
        (
            SELECT COUNT(*) 
            FROM dbo.Giuong g 
            WHERE g.MaPhong = p.MaPhong AND g.TinhTrang = N'Trống'
        ) AS emptyBeds,
        lp.SucChuaToiDa AS capacity,
        p.TinhTrang AS status
    FROM dbo.Phong p
    INNER JOIN dbo.LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh cn ON p.MaChiNhanh = cn.MaChiNhanh
    WHERE cn.TrangThai = N'Hoạt động'
      AND (@KhuVuc IS NULL OR cn.DiaChi LIKE N'%' + @KhuVuc + N'%' OR cn.TenChiNhanh LIKE N'%' + @KhuVuc + N'%')
      AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
      AND (@HinhThucThue IS NULL OR 
           (@HinhThucThue = N'Nguyên căn' AND (p.GioiTinhChoPhep = N'Không phân biệt' OR p.GioiTinhChoPhep IS NULL)) OR
           (@HinhThucThue = N'Ghép nam' AND p.GioiTinhChoPhep = N'Nam') OR
           (@HinhThucThue = N'Ghép nữ' AND p.GioiTinhChoPhep = N'Nữ')
          )
      AND (@MucGiaToiDa IS NULL OR COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong) <= @MucGiaToiDa)
    ORDER BY p.TenPhong;
END;
GO
