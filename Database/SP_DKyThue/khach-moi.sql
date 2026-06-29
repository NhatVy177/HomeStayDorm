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
        pdk.LoaiPhongYeuCau AS loaiPhongYeuCau,
        pdk.MucGiaToiDa AS mucGia,
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
        SELECT STRING_AGG(p.TenPhong, N', ') AS phongXem
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
    @GioiTinh NVARCHAR(10) = NULL,
    @KhuVucMongMuon NVARCHAR(100) = NULL,
    @LoaiPhongYeuCau NVARCHAR(50) = NULL,
    @MucGiaToiDa DECIMAL(15, 2) = NULL,
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

    DECLARE @SoThuTu INT;
    DECLARE @MaDangKy VARCHAR(6);
    DECLARE @YeuCauKhac NVARCHAR(MAX);

    IF @GioiTinh IS NULL
    BEGIN
        SELECT @GioiTinh = nd.GioiTinh
        FROM dbo.NguoiDung AS nd
        WHERE nd.MaNguoiDung = @KhachHangId;
    END

    SET @YeuCauKhac = CONCAT(
        CASE WHEN NULLIF(@PhongQuanTam, N'') IS NULL THEN N'' ELSE CONCAT(N'Phòng quan tâm: ', @PhongQuanTam, N'. ') END,
        COALESCE(@GhiChu, N'')
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDangKy, 3, 4))), 0) + 1
        FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDangKy LIKE 'DK%';

        SET @MaDangKy = CONCAT('DK', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNguoiDuKienO, GioiTinh,
            KhuVucMongMuon, LoaiPhongYeuCau, MucGiaToiDa, ThoiGianDuKienVaoO,
            ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang
        )
        VALUES (
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @GioiTinh,
            @KhuVucMongMuon, @LoaiPhongYeuCau, @MucGiaToiDa,
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
    SELECT @ThoiGianHen = ThoiGianHen 
    FROM dbo.LichXemPhong 
    WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;

    IF DATEDIFF(MINUTE, GETDATE(), @ThoiGianHen) < 60
        THROW 50107, N'Lịch hẹn sẽ diễn ra trong chưa tới 1 giờ. Vui lòng liên hệ trực tiếp nhân viên để được hỗ trợ.', 1;

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
