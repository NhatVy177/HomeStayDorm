USE [HOMEDORM4];
GO

-- Du lieu va stored procedure phuc vu cong khach hang moi.
-- Khach moi duoc xac dinh la khach chua tung co phieu dat coc hoac hop dong.

IF OBJECT_ID(N'dbo.KhachHang', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Phong', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
    THROW 50100, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước khi chạy khach-moi.sql.', 1;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_TrangThai', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_TrangThai AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_TrangThai
    @KhachHangId VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50101, N'Không tìm thấy khách hàng.', 1;

    SELECT
        @KhachHangId AS khachHangId,
        CAST(CASE
            WHEN EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaKhachHang = @KhachHangId)
              OR EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaKhachHang = @KhachHangId)
            THEN 0 ELSE 1 END AS BIT) AS laKhachMoi,
        (SELECT COUNT(*) FROM dbo.PhieuDangKy WHERE MaKhachHang = @KhachHangId) AS soHoSo,
        (SELECT COUNT(*) FROM dbo.LichXemPhong lxp
            INNER JOIN dbo.PhieuDangKy pdk ON pdk.MaDangKy = lxp.MaDangKy
            WHERE pdk.MaKhachHang = @KhachHangId) AS soLichXem,
        (SELECT COUNT(*) FROM dbo.PhieuDatCoc WHERE MaKhachHang = @KhachHangId) AS soPhieuCoc,
        (SELECT COUNT(*) FROM dbo.HopDongThue WHERE MaKhachHang = @KhachHangId) AS soHopDong;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_DanhSachPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_DanhSachPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_DanhSachPhong
    @TenPhong NVARCHAR(100) = NULL,
    @LoaiPhong NVARCHAR(100) = NULL,
    @KhuVuc NVARCHAR(100) = NULL,
    @MucGiaToiDa DECIMAL(15, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @TenPhong = NULLIF(LTRIM(RTRIM(@TenPhong)), N'');
    SET @LoaiPhong = NULLIF(LTRIM(RTRIM(@LoaiPhong)), N'');
    SET @KhuVuc = NULLIF(LTRIM(RTRIM(@KhuVuc)), N'');

    IF @MucGiaToiDa IS NOT NULL AND @MucGiaToiDa < 0
        THROW 50104, N'Mức giá tối đa không hợp lệ.', 1;

    WITH PhongKhaDung AS (
        SELECT
            p.MaPhong AS id,
            p.MaPhong AS maPhong,
            p.TenPhong AS tenPhong,
            lp.TenLoaiPhong AS loaiPhong,
            lp.MoTa AS moTa,
            lp.GiaThueTheoGiuong AS giaTheoGiuong,
            COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) AS giaNguyenPhong,
            COALESCE(lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong) AS giaThue,
            lp.SucChuaToiDa AS sucChua,
            CASE
                WHEN SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) > lp.SucChuaToiDa
                    THEN lp.SucChuaToiDa
                ELSE SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END)
            END AS soChoTrong,
            p.GioiTinhChoPhep AS gioiTinhChoPhep,
            cn.TenChiNhanh AS chiNhanh,
            cn.DiaChi AS diaChi,
            (SELECT TOP 1 UrlImg FROM dbo.HinhAnhPhong hap WHERE hap.MaPhong = p.MaPhong ORDER BY hap.STTAnh) AS urlImg
        FROM dbo.Phong AS p
        INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
        INNER JOIN dbo.Giuong AS g ON g.MaPhong = p.MaPhong
        -- Remove WHERE p.TinhTrang IN ('Trống', 'Còn chỗ')
        WHERE cn.TrangThai = N'Hoạt động'
          AND (
              @TenPhong IS NULL
              OR p.TenPhong LIKE N'%' + @TenPhong + N'%'
              OR cn.TenChiNhanh LIKE N'%' + @TenPhong + N'%'
              OR cn.DiaChi LIKE N'%' + @TenPhong + N'%'
              OR lp.TenLoaiPhong LIKE N'%' + @TenPhong + N'%'
          )
          AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
          AND (@KhuVuc IS NULL OR cn.DiaChi LIKE N'%' + @KhuVuc + N'%')
        GROUP BY p.MaPhong, p.TenPhong, p.GioiTinhChoPhep, lp.TenLoaiPhong, lp.MoTa,
            lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong, lp.SucChuaToiDa,
            cn.TenChiNhanh, cn.DiaChi
    )
    SELECT *
    FROM PhongKhaDung
    WHERE (1=1)
      AND (
          @MucGiaToiDa IS NULL
          OR COALESCE(giaTheoGiuong, giaNguyenPhong) <= @MucGiaToiDa
      )
    ORDER BY COALESCE(giaTheoGiuong, giaNguyenPhong), tenPhong;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_ChiTietPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_ChiTietPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_ChiTietPhong
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');

    IF @MaPhong IS NULL
        THROW 50104, N'Mã phòng không hợp lệ.', 1;

    SELECT
        p.MaPhong AS id,
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        lp.TenLoaiPhong AS loaiPhong,
        lp.MoTa AS moTa,
        lp.SucChuaToiDa AS sucChua,
        p.GioiTinhChoPhep AS gioiTinhChoPhep,
        p.TinhTrang AS tinhTrang,
        cn.TenChiNhanh AS chiNhanh,
        cn.DiaChi AS diaChi,
        lp.GiaThueTheoGiuong AS giaTheoGiuong,
        lp.GiaThueTheoGiuong AS giaThueTheoGiuong,
        COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) AS giaNguyenPhong,
        COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa) AS giaThueNguyenPhong,
        COALESCE(lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong) AS giaThue,
        CASE
            WHEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, 1)) IS NULL THEN NULL
            ELSE TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, 1))
        END AS tang,
        (
            SELECT COUNT(*)
            FROM dbo.Giuong AS g
            WHERE g.MaPhong = p.MaPhong
              AND g.TinhTrang = N'Trống'
        ) AS soChoTrong,
        (
            SELECT TOP (1) hap.UrlImg
            FROM dbo.HinhAnhPhong AS hap
            WHERE hap.MaPhong = p.MaPhong
            ORDER BY hap.STTAnh
        ) AS anhDai,
        (
            SELECT TOP (1) hap.UrlImg
            FROM dbo.HinhAnhPhong AS hap
            WHERE hap.MaPhong = p.MaPhong
            ORDER BY hap.STTAnh
        ) AS urlImg
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    WHERE p.MaPhong = @MaPhong;

    SELECT
        hap.STTAnh AS stt,
        hap.STTAnh AS sttAnh,
        hap.UrlImg AS urlAnh,
        hap.UrlImg AS urlImg,
        CONCAT(N'Ảnh phòng ', hap.STTAnh) AS moTa
    FROM dbo.HinhAnhPhong AS hap
    WHERE hap.MaPhong = @MaPhong
    ORDER BY hap.STTAnh;

    SELECT
        ts.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        ts.TenTaiSan AS tenTienNghi,
        ts.SoLuong AS soLuong,
        ts.DonGia AS donGia
    FROM dbo.TaiSan AS ts
    WHERE ts.MaPhong = @MaPhong
    ORDER BY ts.TenTaiSan;

    SELECT
        dv.MaDichVu AS maDichVu,
        dv.TenDichVu AS tenDichVu,
        dv.DonGia AS donGia,
        dv.DonViTinh AS donViTinh
    FROM dbo.DichVu AS dv
    ORDER BY dv.TenDichVu;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_DanhSachHoSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_DanhSachHoSo AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_DanhSachHoSo
    @KhachHangId VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdk.MaDangKy AS id,
        pdk.MaDangKy AS maDangKy,
        pdk.NgayDangKy AS ngayDangKy,
        pdk.KhuVucMongMuon AS khuVucMongMuon,
        (SELECT STRING_AGG(lp.TenLoaiPhong, ', ') 
         FROM dbo.PDK_LoaiPhong pdklp 
         JOIN dbo.LoaiPhong lp ON pdklp.MaLoaiPhong = lp.MaLoaiPhong 
         WHERE pdklp.MaDangKy = pdk.MaDangKy) AS loaiPhongYeuCau,
        pdk.MucGiaToiDa AS mucGia,
        pdk.SoNguoiDuKienO AS soNguoiO,
        pdk.SoNam AS soNam,
        pdk.SoNu AS soNu,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.ThoiHanThue AS thoiHanThue,
        pdk.YeuCauKhac AS ghiChu,
        pdk.TrangThai AS trangThai,
        lich.STTLich AS sttLich,
        lich.ThoiGianHen AS thoiGianHen,
        lich.TrangThai AS trangThaiLich
    FROM dbo.PhieuDangKy AS pdk
    OUTER APPLY (
        SELECT TOP (1) lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai
        FROM dbo.LichXemPhong AS lxp
        WHERE lxp.MaDangKy = pdk.MaDangKy
        ORDER BY lxp.STTLich DESC
    ) AS lich
    WHERE pdk.MaKhachHang = @KhachHangId
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_DanhSachLichXem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_DanhSachLichXem AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_DanhSachLichXem
    @KhachHangId VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CONCAT(lxp.MaDangKy, '-', lxp.STTLich) AS id,
        lxp.MaDangKy AS maDangKy,
        lxp.STTLich AS sttLich,
        lxp.ThoiGianHen AS thoiGianHen,
        lxp.TrangThai AS trangThai,
        lxp.GhiChu AS ghiChu,
        pdk.MaNhanVienSale AS maNhanVienSale,
        ndSale.HoTen AS tenNhanVienSale,
        ndSale.SDT AS sdtNhanVienSale,
        phong.phongXem
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    LEFT JOIN dbo.NguoiDung AS ndSale ON ndSale.MaNguoiDung = pdk.MaNhanVienSale
    OUTER APPLY (
        SELECT STRING_AGG(p.TenPhong, N', ') AS phongXem
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
        WHERE ctxp.MaDangKy = lxp.MaDangKy AND ctxp.STTLich = lxp.STTLich
    ) AS phong
    WHERE pdk.MaKhachHang = @KhachHangId
    ORDER BY lxp.ThoiGianHen DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_ChiTietLichXem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_ChiTietLichXem AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_ChiTietLichXem
    @KhachHangId VARCHAR(6),
    @MaDangKy VARCHAR(6),
    @STTLich INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.LichXemPhong AS lxp
        INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
        WHERE lxp.MaDangKy = @MaDangKy
          AND lxp.STTLich = @STTLich
          AND pdk.MaKhachHang = @KhachHangId
    )
        THROW 50105, N'Không tìm thấy lịch xem phòng của bạn.', 1;

    SELECT
        CONCAT(lxp.MaDangKy, '-', lxp.STTLich) AS id,
        lxp.MaDangKy AS maDangKy,
        lxp.STTLich AS sttLich,
        lxp.ThoiGianHen AS thoiGianHen,
        lxp.TrangThai AS trangThai,
        lxp.GhiChu AS ghiChu,
        pdk.MaNhanVienSale AS maNhanVienSale,
        ndSale.HoTen AS tenNhanVienSale,
        ndSale.SDT AS sdtNhanVienSale
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    LEFT JOIN dbo.NguoiDung AS ndSale ON ndSale.MaNguoiDung = pdk.MaNhanVienSale
    WHERE lxp.MaDangKy = @MaDangKy
      AND lxp.STTLich = @STTLich
      AND pdk.MaKhachHang = @KhachHangId;

    SELECT
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        lp.TenLoaiPhong AS loaiPhong,
        p.GioiTinhChoPhep AS gioiTinhChoPhep,
        p.TinhTrang AS tinhTrang,
        lp.SucChuaToiDa AS sucChua,
        lp.GiaThueTheoGiuong AS giaThueTheoGiuong,
        lp.GiaThueNguyenPhong AS giaThueNguyenPhong,
        cn.TenChiNhanh AS tenChiNhanh,
        cn.TenChiNhanh AS chiNhanh,
        cn.DiaChi AS diaChi,
        img.UrlImg AS urlImg,
        NULL AS maGiuong
    FROM dbo.ChiTietXemPhong AS ctxp
    INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    OUTER APPLY (
        SELECT TOP (1) hap.UrlImg
        FROM dbo.HinhAnhPhong AS hap
        WHERE hap.MaPhong = p.MaPhong
        ORDER BY hap.STTAnh
    ) AS img
    WHERE ctxp.MaDangKy = @MaDangKy
      AND ctxp.STTLich = @STTLich
    ORDER BY p.TenPhong, p.MaPhong;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_TaoHoSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_TaoHoSo AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_TaoHoSo
    @KhachHangId VARCHAR(6),
    @GioiTinh NVARCHAR(10) = NULL,
    @SoNamInput INT = 0,
    @SoNuInput INT = 0,
    @KhuVucMongMuon NVARCHAR(100) = NULL,
    @LoaiPhongYeuCau NVARCHAR(200) = NULL,
    @MucGiaToiDa DECIMAL(15, 2) = NULL,
    @SoNguoiO INT,
    @NgayDuKienVaoO DATE,
    @ThoiHanThue INT = NULL,
    @PhongQuanTam NVARCHAR(400) = NULL,
    @GhiChu NVARCHAR(MAX) = NULL,
    @HoTenKhach NVARCHAR(100) = NULL,
    @NgaySinhKhach DATE = NULL,
    @GioiTinhKhach NVARCHAR(5) = NULL,
    @SDTKhach VARCHAR(20) = NULL,
    @EmailKhach VARCHAR(100) = NULL,
    @QuocTichKhach NVARCHAR(50) = NULL,
    @CCCDKhach VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50101, N'Không tìm thấy khách hàng.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.HopDongThue
        WHERE MaKhachHang = @KhachHangId
          AND TrangThai NOT IN (N'Hết hạn', N'Đã thanh lý')
    )
        THROW 50102, N'Bạn đang có hợp đồng thuê chưa kết thúc. Chỉ được tạo phiếu đăng ký mới khi hợp đồng kết thúc.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.PhieuDatCoc AS pdc
        WHERE pdc.MaKhachHang = @KhachHangId
          AND pdc.TrangThaiCoc <> N'Đã hủy'
          AND pdc.TrangThaiThanhToan <> N'Hết hạn'
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.HopDongThue AS hd
              WHERE hd.MaPhieuCoc = pdc.MaPhieuDatCoc
                AND hd.TrangThai IN (N'Hết hạn', N'Đã thanh lý')
          )
    )
        THROW 50102, N'Bạn đang có phiếu đặt cọc chưa kết thúc. Không thể tạo phiếu đăng ký mới.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.PhieuDangKy AS pdk
        WHERE pdk.MaKhachHang = @KhachHangId
          AND (
              NOT EXISTS (
                  SELECT 1
                  FROM dbo.LichXemPhong AS lxpAny
                  WHERE lxpAny.MaDangKy = pdk.MaDangKy
              )
              OR EXISTS (
                  SELECT 1
                  FROM dbo.LichXemPhong AS lxpActive
                  WHERE lxpActive.MaDangKy = pdk.MaDangKy
                    AND lxpActive.TrangThai <> N'Đã hủy'
              )
          )
          AND pdk.TrangThai <> N'Từ chối'
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.PhieuDatCoc AS pdc
              INNER JOIN dbo.HopDongThue AS hd ON hd.MaPhieuCoc = pdc.MaPhieuDatCoc
              WHERE pdc.MaPhieuYeuCauDangKy = pdk.MaDangKy
                AND hd.TrangThai IN (N'Hết hạn', N'Đã thanh lý')
          )
    )
        THROW 50102, N'Bạn đang có phiếu đăng ký chưa kết thúc. Chỉ được tạo phiếu đăng ký mới khi luồng thuê hiện tại kết thúc.', 1;

    SET @KhuVucMongMuon = NULLIF(LTRIM(RTRIM(@KhuVucMongMuon)), N'');
    SET @LoaiPhongYeuCau = NULLIF(LTRIM(RTRIM(@LoaiPhongYeuCau)), N'');

    IF @SoNguoiO < 1
       OR @NgayDuKienVaoO IS NULL
       OR @NgayDuKienVaoO <= CAST(GETDATE() AS DATE)
       OR @KhuVucMongMuon IS NULL
       OR @LoaiPhongYeuCau IS NULL
       OR @MucGiaToiDa IS NULL
       OR @MucGiaToiDa <= 0
       OR @ThoiHanThue IS NULL
       OR @ThoiHanThue < 1
        THROW 50104, N'Vui lòng nhập đầy đủ thông tin nhu cầu thuê.', 1;

    -- Update thông tin cá nhân nếu có truyền vào
    BEGIN TRY
        BEGIN TRANSACTION;

    UPDATE dbo.NguoiDung
    SET HoTen = ISNULL(NULLIF(LTRIM(RTRIM(@HoTenKhach)), N''), HoTen),
        NgaySinh = ISNULL(@NgaySinhKhach, NgaySinh),
        GioiTinh = ISNULL(NULLIF(LTRIM(RTRIM(@GioiTinhKhach)), N''), GioiTinh),
        SDT = ISNULL(NULLIF(LTRIM(RTRIM(@SDTKhach)), ''), SDT),
        Email = ISNULL(NULLIF(LTRIM(RTRIM(@EmailKhach)), ''), Email)
    WHERE MaNguoiDung = @KhachHangId;

    IF EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
    BEGIN
        UPDATE dbo.KhachHang
        SET QuocTich = ISNULL(NULLIF(LTRIM(RTRIM(@QuocTichKhach)), N''), QuocTich),
            CCCD = ISNULL(NULLIF(LTRIM(RTRIM(@CCCDKhach)), ''), CCCD)
        WHERE MaKhachHang = @KhachHangId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
        VALUES (@KhachHangId, NULLIF(LTRIM(RTRIM(@QuocTichKhach)), N''), NULLIF(LTRIM(RTRIM(@CCCDKhach)), ''));
    END

    DECLARE @SoThuTu INT;
    DECLARE @MaDangKy VARCHAR(6);
    DECLARE @YeuCauKhac NVARCHAR(MAX);
    DECLARE @SoNam INT = ISNULL(@SoNamInput, 0);
    DECLARE @SoNu INT = ISNULL(@SoNuInput, 0);

    IF @GioiTinh IS NULL
    BEGIN
        SELECT @GioiTinh = nd.GioiTinh
        FROM dbo.NguoiDung AS nd
        WHERE nd.MaNguoiDung = @KhachHangId;
    END
    
    IF @GioiTinh = N'Nam' BEGIN
        SET @SoNam = @SoNguoiO;
        SET @SoNu = 0;
    END
    ELSE IF @GioiTinh = N'Nữ' BEGIN
        SET @SoNu = @SoNguoiO;
        SET @SoNam = 0;
    END
    ELSE IF @GioiTinh = N'Khác' BEGIN
        IF @SoNam = 0 AND @SoNu = 0 SET @SoNam = @SoNguoiO;
    END
    ELSE BEGIN
        SET @SoNam = @SoNguoiO;
        SET @SoNu = 0;
    END

    SET @YeuCauKhac = CONCAT(
        CASE WHEN NULLIF(@PhongQuanTam, N'') IS NULL THEN N'' ELSE CONCAT(N'Phòng quan tâm: ', @PhongQuanTam, N'. ') END,
        COALESCE(@GhiChu, N'')
    );

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDangKy, 3, 4))), 0) + 1
        FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDangKy LIKE 'DK%';

        SET @MaDangKy = CONCAT('DK', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNguoiDuKienO, SoNam, SoNu,
            KhuVucMongMuon, MucGiaToiDa, ThoiGianDuKienVaoO,
            ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang
        )
        VALUES (
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @SoNam, @SoNu,
            @KhuVucMongMuon, @MucGiaToiDa,
            @NgayDuKienVaoO, @ThoiHanThue, NULLIF(@YeuCauKhac, N''), N'Chờ tiếp nhận', @KhachHangId
        );

        IF @LoaiPhongYeuCau IS NOT NULL
        BEGIN
            INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong)
            SELECT @MaDangKy, lp.MaLoaiPhong
            FROM dbo.LoaiPhong lp
            WHERE lp.TenLoaiPhong IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@LoaiPhongYeuCau, ','));
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    EXEC dbo.SP_KhachMoi_DanhSachHoSo @KhachHangId = @KhachHangId;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_YeuCauDieuChinhLich', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_YeuCauDieuChinhLich AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_YeuCauDieuChinhLich
    @KhachHangId VARCHAR(6),
    @MaDangKy VARCHAR(6),
    @STTLich INT,
    @ThaoTac NVARCHAR(20),
    @ThoiGianMoi NVARCHAR(255) = NULL,
    @LyDo NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.LichXemPhong AS lxp
        INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
        WHERE lxp.MaDangKy = @MaDangKy
          AND lxp.STTLich = @STTLich
          AND pdk.MaKhachHang = @KhachHangId
    )
        THROW 50105, N'Không tìm thấy lịch xem phòng của bạn.', 1;

    -- Kiểm tra thời gian: Chỉ cho phép yêu cầu nếu còn >= 1 tiếng so với lịch hẹn
    DECLARE @ThoiGianHen DATETIME;
    DECLARE @TrangThaiHienTai NVARCHAR(30);
    SELECT
        @ThoiGianHen = ThoiGianHen,
        @TrangThaiHienTai = TrangThai
    FROM dbo.LichXemPhong 
    WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;

    IF @TrangThaiHienTai <> N'Chờ xem'
        THROW 50107, N'Chỉ được gửi yêu cầu điều chỉnh lịch đang chờ xem.', 1;

    IF DATEDIFF(MINUTE, GETDATE(), @ThoiGianHen) < 120
        THROW 50107, N'Lịch hẹn sẽ diễn ra trong chưa tới 2 giờ. Vui lòng liên hệ trực tiếp nhân viên để được hỗ trợ.', 1;

    DECLARE @GhiChuKhach NVARCHAR(MAX) = N'';

    IF @ThaoTac = N'Hủy'
    BEGIN
        SET @GhiChuKhach = N'Thời gian đề xuất: ' + ISNULL(@ThoiGianMoi, N'Không có') + N'. Lý do hủy: ' + ISNULL(@LyDo, N'Không có');
        UPDATE dbo.LichXemPhong
        SET TrangThai = N'Yêu cầu hủy',
            GhiChu = @GhiChuKhach
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;
    END
    ELSE IF @ThaoTac = N'Đổi lịch'
    BEGIN
        SET @GhiChuKhach = N'Thời gian đề xuất: ' + ISNULL(@ThoiGianMoi, N'Không có') + N'. Lý do đổi: ' + ISNULL(@LyDo, N'Không có');
        UPDATE dbo.LichXemPhong
        SET TrangThai = N'Yêu cầu đổi lịch',
            GhiChu = @GhiChuKhach
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;
    END
    ELSE
        THROW 50106, N'Yêu cầu điều chỉnh lịch không hợp lệ.', 1;

    EXEC dbo.SP_KhachMoi_DanhSachLichXem @KhachHangId = @KhachHangId;
END;
GO
