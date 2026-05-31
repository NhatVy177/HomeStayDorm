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
-- =============================================

IF OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
   OR OBJECT_ID(N'dbo.KhachHang', N'U') IS NULL
   OR OBJECT_ID(N'dbo.NhanVien', N'U') IS NULL
    THROW 50000, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước.', 1;
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

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50010, N'Không tìm thấy khách hàng.', 1;

    IF @NhuCau IS NOT NULL AND @NhuCau NOT IN (N'Nguyên căn', N'Ghép')
        THROW 50011, N'Hình thức thuê không hợp lệ.', 1;

    IF @SoNguoiO < 1
        THROW 50011, N'Số người dự kiến ở phải ít nhất là 1.', 1;

    IF @NgayDuKienVaoO IS NOT NULL AND @NgayDuKienVaoO < CAST(GETDATE() AS DATE)
        THROW 50011, N'Ngày dự kiến vào ở không được là ngày trong quá khứ.', 1;

    DECLARE @SoThuTu    INT;
    DECLARE @MaDangKy   VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
            WHERE MaKhachHang = @KhachHangId
              AND TrangThai IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Chấp nhận')
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
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @GioiTinh, ISNULL(@NhuCau, N'Ghép'),
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
        pdk.MucGia          AS mucGia,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.YeuCauKhac      AS ghiChu,
        pdk.TrangThai       AS trangThai,
        nd.HoTen            AS hoTenKhach,
        nd.SDT              AS sdtKhach,
        nd.Email            AS emailKhach
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    WHERE pdk.MaDangKy = @MaDangKy;
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
    @NhanVienSaleId VARCHAR(6)      = NULL      -- NULL = không lọc theo sale
AS
BEGIN
    SET NOCOUNT ON;

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
        nvnd.HoTen              AS hoTenSale,
        -- Lịch xem phòng gần nhất
        lich.STTLich            AS sttLichMoiNhat,
        lich.ThoiGianHen        AS thoiGianHenMoiNhat,
        lich.TrangThai          AS trangThaiLichMoiNhat
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS nvnd ON nvnd.MaNguoiDung = pdk.MaNhanVienSale
    OUTER APPLY (
        SELECT TOP (1) lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai
        FROM dbo.LichXemPhong AS lxp
        WHERE lxp.MaDangKy = pdk.MaDangKy
        ORDER BY lxp.STTLich DESC
    ) AS lich
    WHERE (@TrangThai IS NULL OR pdk.TrangThai = @TrangThai)
      AND (@NhanVienSaleId IS NULL OR pdk.MaNhanVienSale = @NhanVienSaleId)
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

-- =============================================
-- 3. SP_DanhSachPhongGiuongKhaDung
-- Lấy danh sách phòng và giường còn trống để Sale gợi ý cho khách.
-- Hỗ trợ lọc theo loại (Nguyên căn / Ghép), giới tính, chi nhánh.
-- =============================================
IF OBJECT_ID(N'dbo.SP_DanhSachPhongGiuongKhaDung', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachPhongGiuongKhaDung AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachPhongGiuongKhaDung
    @Loai           NVARCHAR(50)    = NULL,     -- N'Nguyên căn' hoặc N'Ghép' hoặc NULL (lấy tất cả)
    @GioiTinh       NVARCHAR(5)     = NULL,     -- N'Nam' hoặc N'Nữ' hoặc NULL
    @MaChiNhanh     VARCHAR(6)      = NULL      -- Lọc theo chi nhánh
AS
BEGIN
    SET NOCOUNT ON;

    -- === Phòng nguyên căn còn trống ===
    IF @Loai IS NULL OR @Loai = N'Nguyên căn'
    BEGIN
        SELECT
            p.MaPhong               AS maPhong,
            p.TenPhong              AS tenPhong,
            N'Nguyên căn'           AS loaiThue,
            lp.TenLoaiPhong         AS loaiPhong,
            lp.MoTa                 AS moTa,
            lp.GiaThueNguyenPhong   AS giaThue,
            lp.SucChuaToiDa         AS sucChua,
            p.GioiTinhChoPhep       AS gioiTinhChoPhep,
            p.TinhTrang             AS tinhTrang,
            cn.MaChiNhanh           AS maChiNhanh,
            cn.TenChiNhanh          AS tenChiNhanh,
            cn.DiaChi               AS diaChi,
            p.UrlImg                AS urlImg,
            NULL                    AS maGiuong,
            NULL                    AS soGiuong
        FROM dbo.Phong AS p
        INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
        WHERE p.TinhTrang = N'Trống'
          AND lp.GiaThueNguyenPhong IS NOT NULL
          AND cn.TrangThai = N'Hoạt động'
          AND (@GioiTinh IS NULL OR p.GioiTinhChoPhep = @GioiTinh)
          AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
        ORDER BY lp.GiaThueNguyenPhong, p.TenPhong;
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
            p.UrlImg                AS urlImg,
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
          AND (@GioiTinh IS NULL OR p.GioiTinhChoPhep = @GioiTinh)
          AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
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

    -- Kiểm tra nhân viên Sale tồn tại (nếu có truyền vào)
    IF @NhanVienSaleId IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @NhanVienSaleId AND ChucVu = N'Sale'
       )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    -- Nếu chuyển sang "Chờ xác nhận cọc": khách phải đã xem phòng ít nhất 1 lần
    IF @TrangThai = N'Chờ xác nhận cọc'
       AND NOT EXISTS (
           SELECT 1 FROM dbo.LichXemPhong
           WHERE MaDangKy = @HoSoId AND TrangThai = N'Đã xem'
       )
        THROW 50011, N'Không thể chuyển sang Chờ xác nhận cọc khi khách chưa xem phòng lần nào.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.PhieuDangKy
        SET TrangThai       = @TrangThai,
            YeuCauKhac      = CASE
                                WHEN @GhiChuXuLy IS NOT NULL
                                THEN ISNULL(YeuCauKhac + N' | Ghi chú Sale: ', N'Ghi chú Sale: ') + @GhiChuXuLy
                                ELSE YeuCauKhac
                              END,
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
        pdk.YeuCauKhac          AS ghiChu,
        pdk.TrangThai           AS trangThai,
        pdk.MaKhachHang         AS maKhachHang,
        nd.HoTen                AS hoTenKhach,
        nd.SDT                  AS sdtKhach,
        pdk.MaNhanVienSale      AS maNhanVienSale,
        nvnd.HoTen              AS hoTenSale
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS nvnd ON nvnd.MaNguoiDung = pdk.MaNhanVienSale
    WHERE pdk.MaDangKy = @HoSoId;
END;
GO
