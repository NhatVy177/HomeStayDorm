USE [HOMEDORM4];
GO

-- Stored procedure phuc vu cong khach hang moi.
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

    SELECT
        p.MaPhong AS id,
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        CASE
            WHEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, LEN(p.MaPhong) - 1)) >= 100
                THEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, LEN(p.MaPhong) - 1)) / 100
            ELSE NULL
        END AS tang,
        lp.TenLoaiPhong AS loaiPhong,
        lp.MoTa AS moTa,
        COALESCE(lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong) AS giaThue,
        lp.SucChuaToiDa AS sucChua,
        SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS soChoTrong,
        cn.TenChiNhanh AS chiNhanh,
        cn.DiaChi AS diaChi,
        (
            SELECT TOP 1 hap.UrlImg
            FROM dbo.HinhAnhPhong AS hap
            WHERE hap.MaPhong = p.MaPhong
            ORDER BY CASE WHEN hap.STTAnh = 1 THEN 0 ELSE 1 END, hap.STTAnh
        ) AS urlImg
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    INNER JOIN dbo.Giuong AS g ON g.MaPhong = p.MaPhong
    WHERE p.TinhTrang IN (N'Trống', N'Còn chỗ')
      AND g.TinhTrang = N'Trống'
      AND (
          @TenPhong IS NULL
          OR p.TenPhong LIKE N'%' + @TenPhong + N'%'
          OR cn.TenChiNhanh LIKE N'%' + @TenPhong + N'%'
          OR cn.DiaChi LIKE N'%' + @TenPhong + N'%'
          OR lp.TenLoaiPhong LIKE N'%' + @TenPhong + N'%'
      )
      AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
      AND (@KhuVuc IS NULL OR cn.DiaChi LIKE N'%' + @KhuVuc + N'%')
      AND (@MucGiaToiDa IS NULL OR COALESCE(lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong) <= @MucGiaToiDa)
    GROUP BY p.MaPhong, p.TenPhong, lp.TenLoaiPhong, lp.MoTa, lp.GiaThueTheoGiuong,
        lp.GiaThueNguyenPhong, lp.SucChuaToiDa, cn.TenChiNhanh, cn.DiaChi
    ORDER BY COALESCE(lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong), p.TenPhong;
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
        pdk.HinhThucThue AS hinhThucThue,
        pdk.KhuVucMongMuon AS khuVucMongMuon,
        pdk.LoaiPhongYeuCau AS loaiPhongYeuCau,
        pdk.MucGia AS mucGia,
        pdk.MucGiaDen AS mucGiaDen,
        pdk.SoNguoiDuKienO AS soNguoiO,
        pdk.GioiTinh AS gioiTinh,
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
        phong.phongXem
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    OUTER APPLY (
        SELECT STRING_AGG(CONCAT(p.TenPhong,
            CASE WHEN ctxp.MaGiuong IS NULL THEN N'' ELSE CONCAT(N' · Giường ', ctxp.MaGiuong) END), N', ') AS phongXem
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
        WHERE ctxp.MaDangKy = lxp.MaDangKy AND ctxp.STTLich = lxp.STTLich
    ) AS phong
    WHERE pdk.MaKhachHang = @KhachHangId
    ORDER BY lxp.ThoiGianHen DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_TaoHoSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_TaoHoSo AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_TaoHoSo
    @KhachHangId VARCHAR(6),
    @HinhThucThue NVARCHAR(20),
    @KhuVucMongMuon NVARCHAR(100) = NULL,
    @LoaiPhongYeuCau NVARCHAR(50) = NULL,
    @MucGia DECIMAL(15, 2) = NULL,
    @MucGiaDen DECIMAL(15, 2) = NULL,
    @SoNguoiO INT,
    @NgayDuKienVaoO DATE,
    @ThoiHanThue INT = NULL,
    @PhongQuanTam NVARCHAR(400) = NULL,
    @GhiChu NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50101, N'Không tìm thấy khách hàng.', 1;

    IF EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaKhachHang = @KhachHangId)
       OR EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaKhachHang = @KhachHangId)
        THROW 50102, N'Tài khoản không còn ở trạng thái khách mới.', 1;

    IF @HinhThucThue NOT IN (N'Nguyên căn', N'Ghép')
       OR @SoNguoiO < 1
       OR @NgayDuKienVaoO IS NULL
        THROW 50104, N'Vui lòng nhập đầy đủ thông tin nhu cầu thuê.', 1;

    DECLARE @SoThuTu INT;
    DECLARE @MaDangKy VARCHAR(6);
    DECLARE @GioiTinh NVARCHAR(10);
    DECLARE @YeuCauKhac NVARCHAR(MAX);

    SELECT @GioiTinh = nd.GioiTinh
    FROM dbo.NguoiDung AS nd
    WHERE nd.MaNguoiDung = @KhachHangId;

    SET @YeuCauKhac = CONCAT(
        CASE WHEN NULLIF(@PhongQuanTam, N'') IS NULL THEN N'' ELSE CONCAT(N'Phòng quan tâm: ', @PhongQuanTam, N'. ') END,
        COALESCE(@GhiChu, N'')
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1 FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
            WHERE MaKhachHang = @KhachHangId
              AND TrangThai IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Chấp nhận')
        )
            THROW 50103, N'Bạn đang có hồ sơ thuê được xử lý. Không thể gửi thêm hồ sơ mới.', 1;

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDangKy, 3, 4))), 0) + 1
        FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDangKy LIKE 'DK%';

        SET @MaDangKy = CONCAT('DK', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNguoiDuKienO, GioiTinh, HinhThucThue,
            KhuVucMongMuon, LoaiPhongYeuCau, MucGia, MucGiaDen, ThoiGianDuKienVaoO,
            ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang
        )
        VALUES (
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @GioiTinh, @HinhThucThue,
            NULLIF(@KhuVucMongMuon, N''), NULLIF(@LoaiPhongYeuCau, N''), @MucGia, @MucGiaDen,
            @NgayDuKienVaoO, @ThoiHanThue, NULLIF(@YeuCauKhac, N''), N'Chờ tiếp nhận', @KhachHangId
        );

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
    @ThoiGianMoi DATETIME = NULL,
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

    IF @ThaoTac = N'Hủy'
    BEGIN
        UPDATE dbo.LichXemPhong
        SET TrangThai = N'Yêu cầu hủy'
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;
    END
    ELSE IF @ThaoTac = N'Đổi lịch' AND @ThoiGianMoi IS NOT NULL
    BEGIN
        UPDATE dbo.LichXemPhong
        SET TrangThai = N'Yêu cầu đổi lịch',
            ThoiGianHen = @ThoiGianMoi
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;
    END
    ELSE
        THROW 50106, N'Yêu cầu điều chỉnh lịch không hợp lệ.', 1;

    EXEC dbo.SP_KhachMoi_DanhSachLichXem @KhachHangId = @KhachHangId;
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
        pdk.NgayDangKy AS ngayDangKy,
        pdk.HinhThucThue AS hinhThucThue,
        pdk.KhuVucMongMuon AS khuVucMongMuon,
        pdk.LoaiPhongYeuCau AS loaiPhongYeuCau,
        pdk.MucGia AS mucGia,
        pdk.SoNguoiDuKienO AS soNguoiO,
        pdk.GioiTinh AS gioiTinh,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.ThoiHanThue AS thoiHanThue,
        pdk.YeuCauKhac AS ghiChu,
        pdk.TrangThai AS trangThaiHoSo,
        pdk.MaNhanVienSale AS maNhanVienSale,
        ndSale.HoTen AS tenNhanVienSale,
        ndSale.SDT AS sdtNhanVienSale,
        ndSale.Email AS emailNhanVienSale
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    LEFT JOIN dbo.NguoiDung AS ndSale ON ndSale.MaNguoiDung = pdk.MaNhanVienSale
    WHERE lxp.MaDangKy = @MaDangKy
      AND lxp.STTLich = @STTLich
      AND pdk.MaKhachHang = @KhachHangId;

    SELECT
        ctxp.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        ctxp.MaGiuong AS maGiuong,
        g.SoGiuong AS soGiuong,
        p.TinhTrang AS tinhTrangPhong,
        p.GioiTinhChoPhep AS gioiTinhChoPhep,
        lp.TenLoaiPhong AS loaiPhong,
        lp.SucChuaToiDa AS sucChua,
        CASE
            WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
            ELSE lp.GiaThueTheoGiuong
        END AS giaThue,
        cn.TenChiNhanh AS chiNhanh,
        cn.DiaChi AS diaChi,
        (
            SELECT TOP 1 hap.UrlImg
            FROM dbo.HinhAnhPhong AS hap
            WHERE hap.MaPhong = p.MaPhong
            ORDER BY hap.STTAnh ASC
        ) AS anhDaiDien
    FROM dbo.ChiTietXemPhong AS ctxp
    INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    LEFT JOIN dbo.Giuong AS g ON g.MaPhong = ctxp.MaPhong AND g.MaGiuong = ctxp.MaGiuong
    WHERE ctxp.MaDangKy = @MaDangKy
      AND ctxp.STTLich = @STTLich
    ORDER BY p.TenPhong, ctxp.MaGiuong;
END;
GO

-- =============================================
-- SP_KhachMoi_DanhSachPhongKhaDung
-- Lay danh sach phong con cho, kem anh dai dien (STTAnh = 1) tu HinhAnhPhong
-- =============================================
IF OBJECT_ID(N'dbo.SP_KhachMoi_DanhSachPhongKhaDung', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_DanhSachPhongKhaDung AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_DanhSachPhongKhaDung
    @TuKhoa        NVARCHAR(120)   = NULL,
    @LoaiPhong     NVARCHAR(100)   = NULL,
    @KhuVuc        NVARCHAR(100)   = NULL,
    @HinhThucThue  NVARCHAR(20)    = NULL,
    @MucGiaToiDa   DECIMAL(15, 2)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    WITH SoChoTrong AS (
        SELECT
            g.MaPhong,
            SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS soChoTrong
        FROM dbo.Giuong AS g
        GROUP BY g.MaPhong
    )
    SELECT
        p.MaPhong                       AS id,
        p.MaPhong                       AS maPhong,
        p.TenPhong                      AS tenPhong,
        CASE
            WHEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, LEN(p.MaPhong) - 1)) >= 100
                THEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, LEN(p.MaPhong) - 1)) / 100
            ELSE NULL
        END                             AS tang,
        p.GioiTinhChoPhep               AS gioiTinhChoPhep,
        CASE
            WHEN p.GioiTinhChoPhep = N'Nam'              THEN N'Ghép nam'
            WHEN p.GioiTinhChoPhep = N'Nữ'              THEN N'Ghép nữ'
            WHEN p.GioiTinhChoPhep = N'Không phân biệt' THEN N'Nguyên căn'
        END                             AS hinhThucThue,
        lp.MaLoaiPhong                  AS maLoaiPhong,
        lp.TenLoaiPhong                 AS loaiPhong,
        lp.MoTa                         AS moTa,
        CASE
            WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
            ELSE lp.GiaThueTheoGiuong
        END                             AS giaThue,
        lp.GiaThueTheoGiuong            AS giaThueTheoGiuong,
        lp.GiaThueNguyenPhong           AS giaThueNguyenPhong,
        lp.SucChuaToiDa                 AS sucChua,
        COALESCE(sct.soChoTrong, 0)     AS soChoTrong,
        cn.TenChiNhanh                  AS chiNhanh,
        cn.DiaChi                       AS diaChi,
        (
            SELECT TOP 1 hap.UrlImg
            FROM dbo.HinhAnhPhong AS hap
            WHERE hap.MaPhong = p.MaPhong
              AND hap.STTAnh = 1
        )                               AS anhDai
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong     AS lp  ON lp.MaLoaiPhong  = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh      AS cn  ON cn.MaChiNhanh   = p.MaChiNhanh
    LEFT  JOIN SoChoTrong        AS sct ON sct.MaPhong      = p.MaPhong
    WHERE
        p.TinhTrang IN (N'Trống', N'Còn chỗ')
        AND COALESCE(sct.soChoTrong, 0) > 0
        AND (@HinhThucThue IS NULL
            OR (@HinhThucThue = N'Ghép nam'   AND p.GioiTinhChoPhep = N'Nam')
            OR (@HinhThucThue = N'Ghép nữ'    AND p.GioiTinhChoPhep = N'Nữ')
            OR (@HinhThucThue = N'Nguyên căn' AND p.GioiTinhChoPhep = N'Không phân biệt')
        )
        AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
        AND (@KhuVuc IS NULL
            OR cn.DiaChi      LIKE N'%' + @KhuVuc + N'%'
            OR cn.TenChiNhanh LIKE N'%' + @KhuVuc + N'%')
        AND (@TuKhoa IS NULL
            OR p.TenPhong      LIKE N'%' + @TuKhoa + N'%'
            OR p.MaPhong       LIKE N'%' + @TuKhoa + N'%'
            OR cn.TenChiNhanh  LIKE N'%' + @TuKhoa + N'%'
            OR cn.DiaChi       LIKE N'%' + @TuKhoa + N'%'
            OR lp.TenLoaiPhong LIKE N'%' + @TuKhoa + N'%')
        AND (@MucGiaToiDa IS NULL OR
            CASE
                WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                    THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
                ELSE lp.GiaThueTheoGiuong
            END <= @MucGiaToiDa)
    ORDER BY giaThue ASC, p.TenPhong ASC;
END;
GO

-- =============================================
-- SP_KhachMoi_ChiTietPhong
-- Lay chi tiet 1 phong + toan bo hinh anh theo STTAnh
-- =============================================
IF OBJECT_ID(N'dbo.SP_KhachMoi_ChiTietPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_ChiTietPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_ChiTietPhong
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    -- Recordset 1: Thong tin phong
    SELECT
        p.MaPhong                       AS maPhong,
        p.TenPhong                      AS tenPhong,
        CASE
            WHEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, LEN(p.MaPhong) - 1)) >= 100
                THEN TRY_CONVERT(INT, SUBSTRING(p.MaPhong, 2, LEN(p.MaPhong) - 1)) / 100
            ELSE NULL
        END                             AS tang,
        p.GioiTinhChoPhep               AS gioiTinhChoPhep,
        CASE
            WHEN p.GioiTinhChoPhep = N'Nam'              THEN N'Ghép nam'
            WHEN p.GioiTinhChoPhep = N'Nữ'              THEN N'Ghép nữ'
            WHEN p.GioiTinhChoPhep = N'Không phân biệt' THEN N'Nguyên căn'
        END                             AS hinhThucThue,
        lp.MaLoaiPhong                  AS maLoaiPhong,
        lp.TenLoaiPhong                 AS loaiPhong,
        lp.MoTa                         AS moTa,
        lp.SucChuaToiDa                 AS sucChua,
        lp.GiaThueTheoGiuong            AS giaThueTheoGiuong,
        lp.GiaThueNguyenPhong           AS giaThueNguyenPhong,
        CASE
            WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
            ELSE lp.GiaThueTheoGiuong
        END                             AS giaThue,
        cn.TenChiNhanh                  AS chiNhanh,
        cn.DiaChi                       AS diaChi,
        cn.MaChiNhanh                   AS maChiNhanh,
        p.TinhTrang                     AS tinhTrang,
        COALESCE((
            SELECT SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END)
            FROM dbo.Giuong AS g
            WHERE g.MaPhong = p.MaPhong
        ), 0)                           AS soChoTrong
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh  AS cn ON cn.MaChiNhanh  = p.MaChiNhanh
    WHERE p.MaPhong = @MaPhong;

    -- Recordset 2: Toan bo hinh anh sap xep theo STTAnh
    SELECT
        hap.STTAnh  AS stt,
        hap.UrlImg  AS urlAnh
    FROM dbo.HinhAnhPhong AS hap
    WHERE hap.MaPhong = @MaPhong
    ORDER BY hap.STTAnh ASC;

    -- Recordset 3: Tien nghi/tai san dang co trong phong
    SELECT
        ts.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTienNghi,
        ts.SoLuong AS soLuong
    FROM dbo.TaiSan AS ts
    WHERE ts.MaPhong = @MaPhong
    ORDER BY ts.TenTaiSan ASC;

    -- Recordset 4: Chi phi dich vu dang ap dung trong he thong
    SELECT
        dv.MaDichVu AS maDichVu,
        dv.TenDichVu AS tenDichVu,
        dv.DonViTinh AS donViTinh,
        dv.DonGia AS donGia
    FROM dbo.DichVu AS dv
    ORDER BY dv.TenDichVu ASC;
END;
GO
