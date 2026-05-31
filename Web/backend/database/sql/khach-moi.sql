USE [HOMEDORM4];
GO

-- Du lieu va stored procedure phuc vu cong khach hang moi.
-- Khach moi duoc xac dinh la khach chua tung co phieu dat coc hoac hop dong.

IF OBJECT_ID(N'dbo.KhachHang', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Phong', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
    THROW 50100, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước khi chạy khach-moi.sql.', 1;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = 'CN0001')
BEGIN
    INSERT INTO dbo.ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SDT, Email, TrangThai)
    VALUES ('CN0001', N'Homestay Dorm Đà Nẵng', N'123 Nguyễn Văn Linh, Đà Nẵng', '0905123456', 'hello@homestaydorm.vn', N'Hoạt động');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0001')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0001', N'Giường dorm', 4, N'Phòng dorm tiện nghi cho sinh viên.', 2800000, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0002')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0002', N'Phòng riêng', 1, N'Phòng riêng có cửa sổ và khu bếp chung.', NULL, 4500000);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0003')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0003', N'Phòng đôi', 2, N'Phòng đôi đầy đủ nội thất cơ bản.', NULL, 3600000);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0004')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0004', N'Giường dorm', 4, N'Không gian yên tĩnh, gần trạm xe buýt.', 2200000, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P204')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, UrlImg, MaChiNhanh, MaLoaiPhong)
    VALUES ('P204', N'Dorm Studio 204', N'Nữ', N'Còn chỗ', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', 'CN0001', 'LP0001');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P101')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, UrlImg, MaChiNhanh, MaLoaiPhong)
    VALUES ('P101', N'Garden 101', N'Nữ', N'Trống', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80', 'CN0001', 'LP0002');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P302')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, UrlImg, MaChiNhanh, MaLoaiPhong)
    VALUES ('P302', N'Phòng đôi Cozy 302', N'Nữ', N'Trống', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', 'CN0001', 'LP0003');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P305')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, UrlImg, MaChiNhanh, MaLoaiPhong)
    VALUES ('P305', N'Dorm Green 305', N'Nữ', N'Còn chỗ', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', 'CN0001', 'LP0004');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P204' AND MaGiuong = 'A01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P204', 'A01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P204' AND MaGiuong = 'A02')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P204', 'A02', 2, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P101' AND MaGiuong = 'R01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P101', 'R01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P302' AND MaGiuong = 'D01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P302', 'D01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P305' AND MaGiuong = 'B01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P305', 'B01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P305' AND MaGiuong = 'B02')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P305', 'B02', 2, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P305' AND MaGiuong = 'B03')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P305', 'B03', 3, N'Trống');
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
        lp.TenLoaiPhong AS loaiPhong,
        lp.MoTa AS moTa,
        COALESCE(lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong) AS giaThue,
        lp.SucChuaToiDa AS sucChua,
        SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS soChoTrong,
        cn.TenChiNhanh AS chiNhanh,
        cn.DiaChi AS diaChi,
        p.UrlImg AS urlImg
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
        lp.GiaThueNguyenPhong, lp.SucChuaToiDa, cn.TenChiNhanh, cn.DiaChi, p.UrlImg
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
        pdk.SoNguoiDuKienO AS soNguoiO,
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
            KhuVucMongMuon, LoaiPhongYeuCau, MucGia, ThoiGianDuKienVaoO,
            ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang
        )
        VALUES (
            @MaDangKy, CAST(GETDATE() AS DATE), @SoNguoiO, @GioiTinh, @HinhThucThue,
            NULLIF(@KhuVucMongMuon, N''), NULLIF(@LoaiPhongYeuCau, N''), @MucGia,
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
