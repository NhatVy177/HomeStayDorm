USE HOMEDORM4;
GO

SET DATEFORMAT ymd;
SET NOCOUNT ON;

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @SaleId VARCHAR(6) = 'NV0001'; -- Nguyen Minh Khoa, CN0001

DECLARE @Khach TABLE (
    MaKhachHang VARCHAR(6) PRIMARY KEY,
    HoTen NVARCHAR(100),
    NgaySinh DATE,
    GioiTinh NVARCHAR(5),
    SDT VARCHAR(20),
    Email VARCHAR(100),
    CCCD VARCHAR(20)
);

INSERT INTO @Khach (MaKhachHang, HoTen, NgaySinh, GioiTinh, SDT, Email, CCCD)
VALUES
    ('KH9301', N'Test YC Cọc Chờ Gửi',       '2001-01-10', N'Nam', '0912930101', 'kh9301@test.local', '079930000101'),
    ('KH9302', N'Test YC Cọc Chờ Duyệt',     '2000-02-11', N'Nữ',  '0912930102', 'kh9302@test.local', '079930000102'),
    ('KH9303', N'Test YC Cọc Đã Duyệt',      '1999-03-12', N'Nam', '0912930103', 'kh9303@test.local', '079930000103'),
    ('KH9304', N'Test YC Cọc Bị Từ Chối',    '1998-04-13', N'Nữ',  '0912930104', 'kh9304@test.local', '079930000104');

MERGE dbo.NguoiDung AS target
USING @Khach AS source
ON target.MaNguoiDung = source.MaKhachHang
WHEN MATCHED THEN
    UPDATE SET
        HoTen = source.HoTen,
        NgaySinh = source.NgaySinh,
        GioiTinh = source.GioiTinh,
        SDT = source.SDT,
        Email = source.Email,
        LoaiNguoiDung = 'KhachHang'
WHEN NOT MATCHED THEN
    INSERT (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung)
    VALUES (source.MaKhachHang, source.HoTen, source.NgaySinh, source.GioiTinh, source.SDT, source.Email, NULL, 'KhachHang');

MERGE dbo.KhachHang AS target
USING @Khach AS source
ON target.MaKhachHang = source.MaKhachHang
WHEN MATCHED THEN
    UPDATE SET
        QuocTich = N'Việt Nam',
        CCCD = source.CCCD
WHEN NOT MATCHED THEN
    INSERT (MaKhachHang, QuocTich, CCCD)
    VALUES (source.MaKhachHang, N'Việt Nam', source.CCCD);

DECLARE @YeuCau TABLE (
    MaDangKy VARCHAR(6) PRIMARY KEY,
    MaKhachHang VARCHAR(6),
    SoNam INT,
    SoNu INT,
    SoNguoi INT,
    KhuVuc NVARCHAR(100),
    LoaiPhongYeuCau NVARCHAR(100),
    MaLoaiPhong VARCHAR(6),
    MucGia DECIMAL(15,2),
    NgayVao DATE,
    ThoiHan INT,
    YeuCauKhac NVARCHAR(MAX),
    TrangThai NVARCHAR(30),
    MaNhanVienSale VARCHAR(6) NULL,
    MaPhong VARCHAR(4),
    KhachChon TINYINT,
    GhiChuSale NVARCHAR(MAX) NULL
);

INSERT INTO @YeuCau (
    MaDangKy, MaKhachHang, SoNam, SoNu, SoNguoi, KhuVuc, LoaiPhongYeuCau, MaLoaiPhong,
    MucGia, NgayVao, ThoiHan, YeuCauKhac, TrangThai, MaNhanVienSale, MaPhong, KhachChon, GhiChuSale
)
VALUES
    ('DK9301', 'KH9301', 1, 0, 1, N'Quận 1', N'Phòng 4 người',     'LP0002', 1800000, DATEADD(DAY, 7, @Today),  6, N'Test tab Gửi yêu cầu đặt cọc - trạng thái chờ gửi.',       N'Chờ tiếp nhận',      NULL,    'P103', 1, NULL),
    ('DK9302', 'KH9302', 0, 1, 1, N'Quận 1', N'Phòng 6 người',     'LP0003', 1400000, DATEADD(DAY, 10, @Today), 6, N'Test tab Gửi yêu cầu đặt cọc - trạng thái chờ duyệt.',     N'Chờ xác nhận cọc', @SaleId, 'P105', 1, NULL),
    ('DK9303', 'KH9303', 1, 0, 1, N'Quận 1', N'Phòng 2 người',     'LP0001', 2200000, DATEADD(DAY, 14, @Today), 12, N'Test tab Gửi yêu cầu đặt cọc - trạng thái đã duyệt.',     N'Xác nhận cọc',     @SaleId, 'P101', 1, NULL),
    ('DK9304', 'KH9304', 0, 1, 1, N'Quận 1', N'Phòng 2 người',     'LP0001', 2200000, DATEADD(DAY, 12, @Today), 3, N'Test tab Gửi yêu cầu đặt cọc - trạng thái bị từ chối.',    N'Từ chối',          @SaleId, 'P102', 1, N'Test lý do từ chối yêu cầu đặt cọc.');

MERGE dbo.PhieuDangKy AS target
USING @YeuCau AS source
ON target.MaDangKy = source.MaDangKy
WHEN MATCHED THEN
    UPDATE SET
        NgayDangKy = @Today,
        SoNam = source.SoNam,
        SoNu = source.SoNu,
        SoNguoiDuKienO = source.SoNguoi,
        KhuVucMongMuon = source.KhuVuc,
        LoaiPhongYeuCau = source.LoaiPhongYeuCau,
        MucGiaToiDa = source.MucGia,
        ThoiGianDuKienVaoO = source.NgayVao,
        ThoiHanThue = source.ThoiHan,
        YeuCauKhac = source.YeuCauKhac,
        TrangThai = source.TrangThai,
        MaKhachHang = source.MaKhachHang,
        MaNhanVienSale = source.MaNhanVienSale,
        GhiChuSale = source.GhiChuSale
WHEN NOT MATCHED THEN
    INSERT (
        MaDangKy, NgayDangKy, SoNam, SoNu, SoNguoiDuKienO,
        KhuVucMongMuon, LoaiPhongYeuCau, MucGiaToiDa,
        ThoiGianDuKienVaoO, ThoiHanThue, YeuCauKhac,
        TrangThai, MaKhachHang, MaNhanVienSale, GhiChuSale
    )
    VALUES (
        source.MaDangKy, @Today, source.SoNam, source.SoNu, source.SoNguoi,
        source.KhuVuc, source.LoaiPhongYeuCau, source.MucGia,
        source.NgayVao, source.ThoiHan, source.YeuCauKhac,
        source.TrangThai, source.MaKhachHang, source.MaNhanVienSale, source.GhiChuSale
    );

MERGE dbo.PDK_LoaiPhong AS target
USING @YeuCau AS source
ON target.MaDangKy = source.MaDangKy AND target.MaLoaiPhong = source.MaLoaiPhong
WHEN NOT MATCHED THEN
    INSERT (MaDangKy, MaLoaiPhong)
    VALUES (source.MaDangKy, source.MaLoaiPhong);

MERGE dbo.LichXemPhong AS target
USING @YeuCau AS source
ON target.MaDangKy = source.MaDangKy AND target.STTLich = 1
WHEN MATCHED THEN
    UPDATE SET
        ThoiGianHen = DATEADD(HOUR, 9, CAST(@Today AS DATETIME)),
        TrangThai = N'Đã xem',
        GhiChu = N'Lịch xem phòng test cho luồng yêu cầu đặt cọc.'
WHEN NOT MATCHED THEN
    INSERT (MaDangKy, STTLich, ThoiGianHen, TrangThai, GhiChu)
    VALUES (source.MaDangKy, 1, DATEADD(HOUR, 9, CAST(@Today AS DATETIME)), N'Đã xem', N'Lịch xem phòng test cho luồng yêu cầu đặt cọc.');

MERGE dbo.ChiTietXemPhong AS target
USING @YeuCau AS source
ON target.MaDangKy = source.MaDangKy AND target.MaPhong = source.MaPhong AND target.STTLich = 1
WHEN MATCHED THEN
    UPDATE SET KhachChon = source.KhachChon
WHEN NOT MATCHED THEN
    INSERT (MaDangKy, MaPhong, STTLich, KhachChon)
    VALUES (source.MaDangKy, source.MaPhong, 1, source.KhachChon);

UPDATE ctxp
SET KhachChon = 0
FROM dbo.ChiTietXemPhong AS ctxp
INNER JOIN @YeuCau AS yc ON yc.MaDangKy = ctxp.MaDangKy
WHERE ctxp.MaPhong <> yc.MaPhong
  AND ctxp.KhachChon = 1;

SELECT
    pdk.MaDangKy,
    nd.HoTen,
    nd.SDT,
    pdk.TrangThai,
    pdk.NgayDangKy,
    pdk.MaNhanVienSale,
    ctxp.MaPhong,
    ctxp.KhachChon
FROM dbo.PhieuDangKy AS pdk
INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
LEFT JOIN dbo.ChiTietXemPhong AS ctxp
    ON ctxp.MaDangKy = pdk.MaDangKy AND ctxp.KhachChon = 1
WHERE pdk.MaDangKy IN ('DK9301', 'DK9302', 'DK9303', 'DK9304')
ORDER BY pdk.MaDangKy;
GO
