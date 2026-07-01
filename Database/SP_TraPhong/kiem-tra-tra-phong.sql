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
    @MaNhanVien VARCHAR(6)
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
        ctdc.MaGiuong                               AS maGiuong
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hdt.MaKhachHang, pdc.MaKhachHang)
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE ptp.TrangThai = N'Chờ xử lý' 
      AND p.MaChiNhanh = @MaChiNhanh
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
        pdc.SoTienCoc                               AS tienCocHD,
        pdc.SoTienCoc                               AS tienCocPDC,
        pdc.HinhThucThue                            AS hinhThucThue,
        COALESCE(hdt.GiaThue, ctdc.GiaThue)         AS giaThue,
        CONVERT(VARCHAR(10), hdt.NgayBatDau, 120)   AS ngayBatDauThue,
        CONVERT(VARCHAR(10), hdt.NgayKetThuc, 120)  AS ngayKetThucThue
    FROM dbo.PhieuTraPhong ptp
    LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hdt.MaKhachHang, pdc.MaKhachHang)
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
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
            hd.TongTien AS SoTien
        FROM dbo.HoaDon hd
        WHERE hd.MaHopDong = @MaHopDong AND (hd.TrangThai = N'Chưa TT' OR hd.TrangThai = N'Nợ')
        
        UNION ALL
        
        SELECT 
            'ViPham' AS LoaiNghiaVu,
            bbvp.MaBBViPham AS Ma,
            bbvp.MoTaViPham AS Ten,
            bbvp.SoTienPhat AS SoTien
        FROM dbo.BienBanViPham bbvp
        WHERE bbvp.MaHopDong = @MaHopDong AND bbvp.TrangThai = N'Chưa xử lý';
    END
    ELSE
    BEGIN
        SELECT 1 WHERE 1=0; -- Trả về result set rỗng
    END

    -- 3. Lấy thông tin tài sản trong phòng (để kiểm tra)
    IF @MaHopDong IS NOT NULL
    BEGIN
        SELECT 
            MaTaiSan AS maTaiSan,
            TenTaiSan AS tenTaiSan,
            SoLuong AS soLuongBanGiao,
            DonGia AS donGiaBoiThuong
        FROM dbo.TaiSan
        WHERE MaPhong = @MaPhong;
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
        NgayTraThucTe = GETDATE()
    WHERE MaPhieuTra = @MaPhieuTra;
END;
GO

-- =============================================
-- 4. SP_TraPhong_QuanLy_LapBienBanKiemTra
-- Lập biên bản kiểm tra trả phòng và ghi nhận hư hỏng (cho hợp đồng)
-- =============================================
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra
    @MaPhieuTra     VARCHAR(6),
    @MaNhanVien     VARCHAR(6),
    @NgayTraThucTe  DATE,
    @TinhTrangPhong NVARCHAR(MAX),
    @JSONHuHong     NVARCHAR(MAX) -- Dạng: [{"maTaiSan":"TS01", "moTa":"Hỏng", "chiPhi": 100000}]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Kiểm tra trạng thái
        IF NOT EXISTS (SELECT 1 FROM dbo.PhieuTraPhong WHERE MaPhieuTra = @MaPhieuTra AND TrangThai = N'Chờ xử lý')
        BEGIN
            THROW 50010, N'Phiếu trả phòng này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 1;
        END

        -- 2. Tạo mã Biên Bản Kiểm Tra
        DECLARE @MaBienBanKT VARCHAR(6);
        SELECT @MaBienBanKT = 'KT' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaBienBanKT, 3, 4) AS INT)), 0) + 1 AS VARCHAR), 4)
        FROM dbo.BienBanKiemTraPhong;

        -- 3. Tính tổng chi phí sửa chữa từ JSON
        DECLARE @TongChiPhi DECIMAL(15,2) = 0;
        IF @JSONHuHong IS NOT NULL AND LTRIM(RTRIM(@JSONHuHong)) <> '' AND @JSONHuHong <> '[]'
        BEGIN
            SELECT @TongChiPhi = SUM(CAST(JSON_VALUE(value, '$.chiPhi') AS DECIMAL(15,2)))
            FROM OPENJSON(@JSONHuHong);
        END

        -- 4. Insert Biên Bản
        INSERT INTO dbo.BienBanKiemTraPhong (MaBienBanKT, MaPhieuTra, MaNhanVienQL, NgayKiemTra, TinhTrangPhong, TongChiPhiSuaChua)
        VALUES (@MaBienBanKT, @MaPhieuTra, @MaNhanVien, GETDATE(), @TinhTrangPhong, @TongChiPhi);

        -- 5. Lấy mã phòng
        DECLARE @MaPhong VARCHAR(4);
        SELECT @MaPhong = p.MaPhong 
        FROM dbo.PhieuTraPhong ptp
        LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(ptp.MaPhieuDatCoc, hdt.MaPhieuCoc)
        INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
        WHERE ptp.MaPhieuTra = @MaPhieuTra;

        -- 6. Insert Chi Tiết Hư Hỏng nếu có
        IF @JSONHuHong IS NOT NULL AND LTRIM(RTRIM(@JSONHuHong)) <> '' AND @JSONHuHong <> '[]'
        BEGIN
            -- Lấy max ID để sinh mã tự động
            DECLARE @MaxID INT = 0;
            SELECT @MaxID = ISNULL(MAX(CAST(SUBSTRING(MaChiTietHH, 3, 4) AS INT)), 0) FROM dbo.ChiTietHuHong;

            INSERT INTO dbo.ChiTietHuHong (MaChiTietHH, MaBienBanKT, MaPhong, MaTaiSan, MoTaHuHong, ChiPhiSuaChua, SoLuong, MucDoHuHong, TyLeHuHong, MaQuyDinhTruTien)
            SELECT 
                'HH' + RIGHT('0000' + CAST((@MaxID + ROW_NUMBER() OVER(ORDER BY (SELECT NULL))) AS VARCHAR), 4),
                @MaBienBanKT,
                @MaPhong,
                JSON_VALUE(value, '$.maTaiSan'),
                JSON_VALUE(value, '$.moTa'),
                CAST(JSON_VALUE(value, '$.chiPhi') AS DECIMAL(15,2)),
                CAST(JSON_VALUE(value, '$.soLuong') AS INT),
                JSON_VALUE(value, '$.mucDoHuHong'),
                CAST(JSON_VALUE(value, '$.tyLeHuHong') AS DECIMAL(5,2)),
                JSON_VALUE(value, '$.maQuyDinhTruTien')
            FROM OPENJSON(@JSONHuHong);
        END

        -- 7. Cập nhật trạng thái phiếu trả phòng
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
