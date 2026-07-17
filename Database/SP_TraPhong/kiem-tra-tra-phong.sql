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
        ctdc.MaGiuong                               AS maGiuong,
        ptp.TrangThai                               AS trangThai
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
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
        ISNULL((hdt.GiaThue * (SELECT COUNT(*) FROM dbo.ChiTietDatCoc ctdc WHERE ctdc.MaPhieuDatCoc = hdt.MaPhieuCoc)), pdc.SoTienCoc) AS tienCocHD,
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
        SELECT 
            ts.MaTaiSan AS maTaiSan,
            ts.TenTaiSan AS tenTaiSan,
            COALESCE(ctbg.SoLuongThucTe, ts.SoLuong) AS soLuongBanGiao,
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
        LEFT JOIN dbo.BienBanKiemTraPhong bbkt ON bbkt.MaPhieuTra = @MaPhieuTra
        LEFT JOIN dbo.ChiTietHuHong cthh ON cthh.MaBienBanKT = bbkt.MaBienBanKT AND cthh.MaTaiSan = ts.MaTaiSan
        WHERE ts.MaPhong = @MaPhong;
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
    @MaQuyDinhTruTien VARCHAR(6)
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
        INSERT INTO dbo.ChiTietHuHong (MaChiTietHH, MaBienBanKT, MaPhong, MaTaiSan, MoTaHuHong, ChiPhiSuaChua, SoLuong, MucDoHuHong, TyLeHuHong, MaQuyDinhTruTien)
        VALUES (@MaChiTietHH, @MaBienBanKT, @MaPhong, @MaTaiSan, @MoTaHuHong, @ChiPhiSuaChua, @SoLuong, @MucDoHuHong, @TyLeHuHong, @MaQuyDinhTruTien);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
