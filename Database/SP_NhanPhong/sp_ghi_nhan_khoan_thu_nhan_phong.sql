USE HOMEDORM4;
GO



-- ============================================================================
-- 3. SP_TraCuuHopDongChoThuNhanPhong
-- Màn hình: Danh sách hợp đồng chờ thu tiền nhận phòng
-- ============================================================================
CREATE OR ALTER PROCEDURE SP_TraCuuHopDongChoThuNhanPhong
    @TrangThaiThuTien    NVARCHAR(20) = NULL, -- NULL | N'Đã thanh toán' | N'Chưa thanh toán'
    @TuKhoa              NVARCHAR(100) = NULL, -- Tìm theo mã hợp đồng, tên khách hàng, SĐT
    @MaPhong             VARCHAR(4) = NULL,   -- Bộ lọc phòng
    @MaGiuong            VARCHAR(3) = NULL    -- Bộ lọc giường
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn hóa từ khóa tìm kiếm
    DECLARE @TuKhoaLike NVARCHAR(104) = NULL;
    IF @TuKhoa IS NOT NULL AND LTRIM(RTRIM(@TuKhoa)) <> N''
        SET @TuKhoaLike = N'%' + LTRIM(RTRIM(@TuKhoa)) + N'%';

    SELECT 
        hd.MaHopDong,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        -- Ghép tên phòng và giường để tương thích với UI (ví dụ: "P.102 - Giường A" hoặc ghép danh sách nếu thuê nhiều giường)
        (
            SELECT STRING_AGG(p2.TenPhong + CASE WHEN ctdc2.MaGiuong IS NOT NULL THEN N' - Giường ' + CAST(ctdc2.MaGiuong AS NVARCHAR(3)) ELSE N'' END, N', ')
            FROM (
                SELECT TOP (hd.SoGiuongThue) ctdc_inner.MaPhong, ctdc_inner.MaGiuong
                FROM dbo.ChiTietDatCoc ctdc_inner
                WHERE ctdc_inner.MaPhieuDatCoc = hd.MaPhieuCoc
                ORDER BY ctdc_inner.MaChiTietDC
            ) AS ctdc2
            JOIN dbo.Phong p2 ON p2.MaPhong = ctdc2.MaPhong
        ) AS PhongGiuong,
        hd.NgayBatDau,
        -- Tính động TongTien theo kỳ thanh toán (GiaThue * 3 nếu Hàng quý, GiaThue nếu Hàng tháng) cộng dịch vụ đi kèm
        (CASE WHEN hd.KyThanhToan = N'Hàng tháng' THEN hd.GiaThue ELSE hd.GiaThue * 3 END)
        + ISNULL((
            SELECT SUM(dv.DonGia * CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END) 
            FROM DichVuHopDong dvhd 
            JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu 
            WHERE dvhd.MaHopDong = hd.MaHopDong 
              AND dv.MaDichVu NOT IN ('DV0001', 'DV0002')
        ), 0) AS TongTien,
        -- Trạng thái thanh toán
        CASE 
            WHEN h.TrangThai = N'Đã TT' THEN N'Đã thanh toán'
            ELSE N'Chưa thanh toán'
        END AS TrangThaiThuTien,
        -- Hành động hiển thị nút trên UI
        CASE 
            WHEN h.TrangThai = N'Đã TT' THEN N'Chi tiết'
            ELSE N'Ghi nhận thu tiền'
        END AS HanhDong
    FROM HopDongThue hd
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON p.MaPhong = ctdc.MaPhong
    -- Join hóa đơn kỳ đầu tương ứng với tháng bắt đầu của hợp đồng
    LEFT JOIN HoaDon h ON h.MaHopDong = hd.MaHopDong AND h.KyThanhToan = CONVERT(CHAR(7), hd.NgayBatDau, 120)
    WHERE hd.TrangThai = N'Hiệu lực'
      AND (
          (@TrangThaiThuTien = N'Đã thanh toán' AND h.TrangThai = N'Đã TT')
          OR (ISNULL(@TrangThaiThuTien, N'Chưa thanh toán') <> N'Đã thanh toán' AND (h.MaHoaDon IS NULL OR h.TrangThai <> N'Đã TT'))
      )
      AND (
          @TuKhoaLike IS NULL 
          OR hd.MaHopDong LIKE @TuKhoaLike
          OR nd.HoTen LIKE @TuKhoaLike
          OR nd.SDT LIKE @TuKhoaLike
      )
      AND (@MaPhong IS NULL OR ctdc.MaPhong = @MaPhong)
      AND (@MaGiuong IS NULL OR ctdc.MaGiuong = @MaGiuong)
    GROUP BY 
        hd.MaHopDong, 
        nd.HoTen, 
        nd.SDT, 
        hd.NgayBatDau, 
        hd.KyThanhToan,
        hd.GiaThue,
        hd.SoGiuongThue,
        hd.MaPhieuCoc,
        h.TongTien, 
        h.TrangThai
    ORDER BY hd.MaHopDong DESC;
END;
GO

-- ============================================================================
-- 4. SP_TinhKhoanThuNhanPhong
-- Màn hình: Modal ghi nhận khoản thu nhận phòng (khi load thông tin)
-- ============================================================================
CREATE OR ALTER PROCEDURE SP_TinhKhoanThuNhanPhong
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- [1] Kiểm tra hợp đồng tồn tại
    IF NOT EXISTS (SELECT 1 FROM HopDongThue WHERE MaHopDong = @MaHopDong)
    BEGIN
        DECLARE @err1 NVARCHAR(255) = N'Hợp đồng ' + @MaHopDong + N' không tồn tại.';
        THROW 50001, @err1, 1;
        RETURN;
    END;

    -- [2] Kiểm tra trạng thái hợp đồng
    DECLARE @TrangThai NVARCHAR(20), @GiaThue DECIMAL(15,2);
    SELECT @TrangThai = TrangThai, @GiaThue = GiaThue FROM HopDongThue WHERE MaHopDong = @MaHopDong;
    IF @TrangThai <> N'Hiệu lực'
    BEGIN
        DECLARE @err2 NVARCHAR(255) = N'Hợp đồng ' + @MaHopDong + N' không ở trạng thái Hiệu lực (Trạng thái hiện tại: ' + @TrangThai + N').';
        THROW 50002, @err2, 1;
        RETURN;
    END;

    -- [3] Kiểm tra giá thuê hợp lệ
    IF @GiaThue IS NULL OR @GiaThue <= 0
    BEGIN
        DECLARE @err3 NVARCHAR(255) = N'Hợp đồng ' + @MaHopDong + N' có giá thuê không hợp lệ (GiaThue = ' + ISNULL(CAST(@GiaThue AS NVARCHAR), 'NULL') + N').';
        THROW 50003, @err3, 1;
        RETURN;
    END;

    -- [4] Kiểm tra dịch vụ đơn giá âm
    IF EXISTS (
        SELECT 1 
        FROM DichVuHopDong dvhd 
        JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu 
        WHERE dvhd.MaHopDong = @MaHopDong 
          AND (dv.DonGia IS NULL OR dv.DonGia < 0)
    )
    BEGIN
        DECLARE @err4 NVARCHAR(255) = N'Hợp đồng ' + @MaHopDong + N' chứa dịch vụ có đơn giá không hợp lệ (đơn giá NULL hoặc âm).';
        THROW 50004, @err4, 1;
        RETURN;
    END;

    -- [5] Không cho tính/ghi nhận tiếp nếu hóa đơn kỳ đầu đã thanh toán
    IF EXISTS (
        SELECT 1
        FROM HoaDon h
        JOIN HopDongThue hd ON hd.MaHopDong = h.MaHopDong
        WHERE h.MaHopDong = @MaHopDong
          AND h.KyThanhToan = CONVERT(CHAR(7), hd.NgayBatDau, 120)
          AND h.TrangThai = N'Đã TT'
    )
    BEGIN
        DECLARE @err5 NVARCHAR(255) = N'Hợp đồng ' + @MaHopDong + N' đã có hóa đơn kỳ đầu Đã TT.';
        THROW 50005, @err5, 1;
        RETURN;
    END;

    -- Khai báo và tính toán
    DECLARE @TienThueKyDau DECIMAL(15,2);
    DECLARE @TienDichVu DECIMAL(15,2);
    DECLARE @KyThanhToan NVARCHAR(20);
    
    SELECT @KyThanhToan = KyThanhToan FROM HopDongThue WHERE MaHopDong = @MaHopDong;

    IF @KyThanhToan NOT IN (N'Hàng tháng', N'Hàng quý')
    BEGIN
        DECLARE @err6 NVARCHAR(255) = N'Hợp đồng ' + @MaHopDong + N' có kỳ thanh toán không hợp lệ.';
        THROW 50006, @err6, 1;
        RETURN;
    END;

    IF @KyThanhToan = N'Hàng tháng'
        SET @TienThueKyDau = @GiaThue;
    ELSE -- Hàng quý
        SET @TienThueKyDau = @GiaThue * 3;

    SELECT @TienDichVu = ISNULL(SUM(dv.DonGia * CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END), 0)
    FROM DichVuHopDong dvhd
    JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE dvhd.MaHopDong = @MaHopDong
      AND dv.MaDichVu NOT IN ('DV0001', 'DV0002');

    IF (@TienThueKyDau + @TienDichVu) <= 0
    BEGIN
        DECLARE @err7 NVARCHAR(255) = N'Tổng tiền cần thu của hợp đồng ' + @MaHopDong + N' không hợp lệ (<= 0).';
        THROW 50007, @err7, 1;
        RETURN;
    END;

    -- Tính toán hoàn cọc nếu có giường bị hủy
    DECLARE @SoGiuongDatCoc INT = 0;
    DECLARE @TienCocBanDau DECIMAL(15,2) = 0.00;
    DECLARE @SoNguoiHuy INT = 0;
    DECLARE @TienHoanCoc DECIMAL(15,2) = 0.00;
    DECLARE @DonGiaHoanCoc DECIMAL(15,2) = 0.00;

    DECLARE @MaPhieuCoc VARCHAR(6);
    DECLARE @SoGiuongThue INT;
    SELECT @MaPhieuCoc = MaPhieuCoc, @SoGiuongThue = SoGiuongThue FROM HopDongThue WHERE MaHopDong = @MaHopDong;

    IF @MaPhieuCoc IS NOT NULL
    BEGIN
        SELECT 
            @SoGiuongDatCoc = COUNT(*),
            @TienCocBanDau = MIN(pdc.SoTienCoc)
        FROM dbo.ChiTietDatCoc ctdc
        JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
        WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc;

        IF @SoGiuongDatCoc > 0 AND @SoGiuongDatCoc > @SoGiuongThue
        BEGIN
            SET @SoNguoiHuy = @SoGiuongDatCoc - @SoGiuongThue;
            SET @TienHoanCoc = (@TienCocBanDau / @SoGiuongDatCoc) * @SoNguoiHuy * 0.8;
            SET @DonGiaHoanCoc = (@TienCocBanDau / @SoGiuongDatCoc) * 0.8;
        END;
    END;

    -- RESULT SET 1: Thông tin tổng quan
    SELECT 
        hd.MaHopDong,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        nd.Email,
        (
            SELECT STRING_AGG(p2.TenPhong + CASE WHEN ctdc2.MaGiuong IS NOT NULL THEN N' - Giường ' + CAST(ctdc2.MaGiuong AS NVARCHAR(3)) ELSE N'' END, N', ')
            FROM (
                SELECT TOP (hd.SoGiuongThue) ctdc_inner.MaPhong, ctdc_inner.MaGiuong
                FROM dbo.ChiTietDatCoc ctdc_inner
                WHERE ctdc_inner.MaPhieuDatCoc = hd.MaPhieuCoc
                ORDER BY ctdc_inner.MaChiTietDC
            ) AS ctdc2
            JOIN dbo.Phong p2 ON p2.MaPhong = ctdc2.MaPhong
        ) AS PhongGiuong,
        hd.NgayBatDau,
        hd.KyThanhToan,
        hd.GiaThue,
        @TienThueKyDau AS TienThueKyDau,
        @TienDichVu AS TienDichVu,
        (@TienThueKyDau + @TienDichVu) AS TongCongCanThu,
        @TienHoanCoc AS TienHoanCoc,
        @SoNguoiHuy AS SoNguoiHuy,
        @DonGiaHoanCoc AS DonGiaHoanCoc
    FROM HopDongThue hd
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    WHERE hd.MaHopDong = @MaHopDong
    GROUP BY hd.MaHopDong, nd.HoTen, nd.SDT, nd.Email, hd.NgayBatDau, hd.KyThanhToan, hd.GiaThue, hd.SoGiuongThue, hd.MaPhieuCoc;

    -- RESULT SET 2: Chi tiết các dòng tính tiền
    -- Dòng 1: Tiền thuê kỳ đầu
    SELECT 
        N'Tiền thuê' AS LoaiKhoanThu,
        N'Tiền thuê kỳ đầu (' + hd.KyThanhToan + ')' AS NoiDung,
        1.00 AS SoLuong,
        N'Kỳ' AS DonViTinh,
        @TienThueKyDau AS DonGia,
        @TienThueKyDau AS ThanhTien,
        CAST(NULL AS VARCHAR(6)) AS MaChiTietDVHD
    FROM HopDongThue hd
    WHERE hd.MaHopDong = @MaHopDong

    UNION ALL

    -- Các dòng dịch vụ đăng ký
    SELECT 
        N'Dịch vụ' AS LoaiKhoanThu,
        dv.TenDichVu AS NoiDung,
        CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END AS SoLuong,
        CAST(dv.DonViTinh AS NVARCHAR(20)) AS DonViTinh,
        dv.DonGia,
        (dv.DonGia * CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END) AS ThanhTien,
        dvhd.MaChiTietDVHD
    FROM DichVuHopDong dvhd
    JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE dvhd.MaHopDong = @MaHopDong
      AND dv.MaDichVu NOT IN ('DV0001', 'DV0002');
END;
GO

-- ============================================================================
-- 5. SP_GhiNhanKhoanThuNhanPhong
-- Màn hình: Modal ghi nhận khoản thu nhận phòng (nút "Xác nhận & Hoàn tất")
-- ============================================================================
CREATE OR ALTER PROCEDURE SP_GhiNhanKhoanThuNhanPhong
    @MaHopDong              VARCHAR(6),
    @MaNhanVienKeToan       VARCHAR(6),
    @SoTienKhachThanhToan   DECIMAL(15,2),
    @PhuongThucThanhToan    NVARCHAR(20),
    @GhiChuThanhToan        NVARCHAR(255) = NULL,
    @MaHoaDon               VARCHAR(6)          OUTPUT,
    @MaLoi                  INT                 OUTPUT,
    @ThongBao               NVARCHAR(500)       OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaHoaDon = NULL;
    SET @MaLoi = 0;
    SET @ThongBao = N'';

    -- [1] Kiểm tra phương thức thanh toán hợp lệ
    IF @PhuongThucThanhToan NOT IN (N'Tiền mặt', N'Chuyển khoản')
    BEGIN
        SET @MaLoi = -7;
        SET @ThongBao = N'Phương thức thanh toán không hợp lệ (Chỉ chấp nhận "Tiền mặt" hoặc "Chuyển khoản").';
        RETURN;
    END;

    -- [2] Kiểm tra số tiền thanh toán hợp lệ
    IF @SoTienKhachThanhToan IS NULL OR @SoTienKhachThanhToan < 0
    BEGIN
        SET @MaLoi = -6;
        SET @ThongBao = N'Số tiền khách thanh toán không hợp lệ (không được âm hoặc NULL).';
        RETURN;
    END;

    -- [3] Kiểm tra nhân viên kế toán tồn tại
    IF @MaNhanVienKeToan IS NULL OR NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVienKeToan)
    BEGIN
        SET @MaLoi = -8;
        SET @ThongBao = N'Nhân viên kế toán thực hiện không tồn tại hoặc không hợp lệ.';
        RETURN;
    END;

    DECLARE @TranCounter INT = @@TRANCOUNT;

    BEGIN TRY
        IF @TranCounter > 0
            SAVE TRANSACTION SP_GhiNhanThu_Save;
        ELSE
            BEGIN TRANSACTION;

        -- Đọc và khóa thông tin hợp đồng để chống tranh chấp đồng thời
        DECLARE @TrangThaiHopDong NVARCHAR(20), @GiaThue DECIMAL(15,2), @KyThanhToan NVARCHAR(20), @NgayBatDau DATE, @MaPhieuCoc VARCHAR(6), @SoGiuongThue INT;
        SELECT 
            @TrangThaiHopDong = TrangThai,
            @GiaThue = GiaThue,
            @KyThanhToan = KyThanhToan,
            @NgayBatDau = NgayBatDau,
            @MaPhieuCoc = MaPhieuCoc,
            @SoGiuongThue = SoGiuongThue
        FROM HopDongThue WITH (UPDLOCK, HOLDLOCK)
        WHERE MaHopDong = @MaHopDong;

        -- [Bước 3.1] Hợp đồng tồn tại?
        IF @TrangThaiHopDong IS NULL
        BEGIN
            SET @MaLoi = -1;
            SET @ThongBao = N'Hợp đồng không tồn tại.';
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.2] Hợp đồng hiệu lực?
        IF @TrangThaiHopDong <> N'Hiệu lực'
        BEGIN
            SET @MaLoi = -2;
            SET @ThongBao = N'Hợp đồng không còn hiệu lực.';
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.3] Giá thuê hợp lệ?
        IF @GiaThue IS NULL OR @GiaThue <= 0
        BEGIN
            SET @MaLoi = -4;
            SET @ThongBao = N'Giá thuê của hợp đồng không hợp lệ (NULL hoặc <= 0).';
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.3b] Kỳ thanh toán hợp lệ?
        IF @KyThanhToan NOT IN (N'Hàng tháng', N'Hàng quý')
        BEGIN
            SET @MaLoi = -9;
            SET @ThongBao = N'Kỳ thanh toán của hợp đồng không hợp lệ. Chỉ chấp nhận Hàng tháng hoặc Hàng quý.';
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.4] Kiểm tra đơn giá dịch vụ
        IF EXISTS (
            SELECT 1 
            FROM DichVuHopDong dvhd 
            JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu 
            WHERE dvhd.MaHopDong = @MaHopDong 
              AND (dv.DonGia IS NULL OR dv.DonGia < 0)
        )
        BEGIN
            SET @MaLoi = -5;
            SET @ThongBao = N'Dữ liệu đơn giá dịch vụ đi kèm hợp đồng không hợp lệ (có đơn giá NULL hoặc âm).';
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Xác định kỳ thanh toán đầu tiên dạng 'yyyy-MM'
        DECLARE @KyThanhToanDau VARCHAR(7) = CONVERT(CHAR(7), @NgayBatDau, 120);

        -- Kiểm tra xem đã có hóa đơn kỳ đầu đã thanh toán chưa
        DECLARE @ExistMaHoaDon VARCHAR(6) = NULL;
        DECLARE @ExistTrangThai NVARCHAR(20) = NULL;

        SELECT TOP 1 
            @ExistMaHoaDon = MaHoaDon, 
            @ExistTrangThai = TrangThai
        FROM HoaDon WITH (UPDLOCK, HOLDLOCK)
        WHERE MaHopDong = @MaHopDong
          AND KyThanhToan = @KyThanhToanDau;

        -- [Bước 3.5] Hóa đơn kỳ đầu đã thanh toán trước đó?
        IF @ExistMaHoaDon IS NOT NULL AND @ExistTrangThai = N'Đã TT'
        BEGIN
            SET @MaLoi = -3;
            SET @ThongBao = N'Đã có hóa đơn kỳ đầu được xác nhận thanh toán.';
            SET @MaHoaDon = @ExistMaHoaDon;
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Tính tổng tiền cần thanh toán
        DECLARE @TienThueKyDau DECIMAL(15,2);
        DECLARE @TienDichVu DECIMAL(15,2);
        
        IF @KyThanhToan = N'Hàng tháng'
            SET @TienThueKyDau = @GiaThue;
        ELSE -- Hàng quý
            SET @TienThueKyDau = @GiaThue * 3;

        SELECT @TienDichVu = ISNULL(SUM(dv.DonGia * CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END), 0)
        FROM DichVuHopDong dvhd
        JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
        WHERE dvhd.MaHopDong = @MaHopDong
          AND dv.MaDichVu NOT IN ('DV0001', 'DV0002');

        DECLARE @TongTien DECIMAL(15,2) = @TienThueKyDau + @TienDichVu;

        IF @TongTien <= 0
        BEGIN
            SET @MaLoi = -10;
            SET @ThongBao = N'Tổng tiền cần thu không hợp lệ (<= 0). Vui lòng kiểm tra lại hợp đồng và dịch vụ.';
            IF @TranCounter > 0 ROLLBACK TRANSACTION SP_GhiNhanThu_Save; ELSE ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Tính toán hoàn cọc nếu có giường bị hủy để tính số tiền thực thu/trả chênh lệch
        DECLARE @SoGiuongDatCoc INT = 0;
        DECLARE @TienCocBanDau DECIMAL(15,2) = 0.00;
        DECLARE @SoNguoiHuy INT = 0;
        DECLARE @TienHoanCoc DECIMAL(15,2) = 0.00;

        SELECT 
            @SoGiuongDatCoc = COUNT(*),
            @TienCocBanDau = MIN(pdc.SoTienCoc)
        FROM dbo.ChiTietDatCoc ctdc
        JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
        WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc;

        IF @SoGiuongDatCoc > 0 AND @SoGiuongDatCoc > @SoGiuongThue
        BEGIN
            SET @SoNguoiHuy = @SoGiuongDatCoc - @SoGiuongThue;
            SET @TienHoanCoc = (@TienCocBanDau / @SoGiuongDatCoc) * @SoNguoiHuy * 0.8;
        END;

        DECLARE @NetDifference DECIMAL(15,2) = @TongTien - @TienHoanCoc;
        DECLARE @TienCanThanhToanToiThieu DECIMAL(15,2);
        IF @NetDifference > 0
            SET @TienCanThanhToanToiThieu = @NetDifference;
        ELSE
            SET @TienCanThanhToanToiThieu = ABS(@NetDifference);

        -- Xác định trạng thái hóa đơn dựa trên số tiền thực nộp
        DECLARE @TrangThaiHD NVARCHAR(20) = N'Chưa TT';
        DECLARE @NgayThanhToan DATE = NULL;
        IF @SoTienKhachThanhToan >= @TienCanThanhToanToiThieu
        BEGIN
            SET @TrangThaiHD = N'Đã TT';
            SET @NgayThanhToan = CAST(GETDATE() AS DATE);
        END;

        IF @ExistMaHoaDon IS NOT NULL
        BEGIN
            -- Cập nhật lại hóa đơn đã tồn tại nhưng chưa thanh toán
            SET @MaHoaDon = @ExistMaHoaDon;

            UPDATE HoaDon
            SET TongTien = @TongTien,
                TrangThai = @TrangThaiHD,
                NgayThanhToan = @NgayThanhToan,
                PhuongThucThanhToan = @PhuongThucThanhToan,
                MaNhanVienKeToan = @MaNhanVienKeToan,
                NgayLap = CAST(GETDATE() AS DATE)
            WHERE MaHoaDon = @MaHoaDon;

            -- Xóa các chi tiết cũ của hóa đơn để chèn lại
            DELETE FROM ChiTietHoaDon WHERE MaHoaDon = @MaHoaDon;
        END;
        ELSE
        BEGIN
            -- Sinh mã hóa đơn mới HO0001, HO0002...
            DECLARE @SoMaMax INT;
            SELECT @SoMaMax = ISNULL(MAX(CAST(SUBSTRING(MaHoaDon, 3, 4) AS INT)), 0)
            FROM HoaDon
            WHERE MaHoaDon LIKE 'HO[0-9][0-9][0-9][0-9]';

            SET @MaHoaDon = 'HO' + RIGHT('0000' + CAST(@SoMaMax + 1 AS VARCHAR(4)), 4);

            -- Thêm mới hóa đơn
            INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, NgayHanTT, TongTien, TrangThai, NgayThanhToan, PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan)
            VALUES (
                @MaHoaDon,
                @KyThanhToanDau,
                CAST(GETDATE() AS DATE),
                DATEADD(day, 3, CAST(GETDATE() AS DATE)), -- Hạn thanh toán sau 3 ngày
                @TongTien,
                @TrangThaiHD,
                @NgayThanhToan,
                @PhuongThucThanhToan,
                @MaHopDong,
                @MaNhanVienKeToan
            );
        END;

        -- Ghi chi tiết các phí dịch vụ vào ChiTietHoaDon (không ghi tiền thuê vì ràng buộc khóa ngoại NOT NULL của Schema)
        DECLARE @SoMaCTMax INT;
        SELECT @SoMaCTMax = ISNULL(MAX(CAST(SUBSTRING(MaChiTietHD, 3, 4) AS INT)), 0)
        FROM ChiTietHoaDon
        WHERE MaChiTietHD LIKE 'CH[0-9][0-9][0-9][0-9]';

        -- Cursor duyệt qua các dịch vụ
        DECLARE dv_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT dvhd.MaChiTietDVHD, dv.DonGia, dv.DonViTinh,
                   CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END AS Qty
            FROM DichVuHopDong dvhd
            JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
            WHERE dvhd.MaHopDong = @MaHopDong
              AND dv.MaDichVu NOT IN ('DV0001', 'DV0002');

        DECLARE 
            @MaChiTietDVHD  VARCHAR(6),
            @DonGia         DECIMAL(15,2),
            @DonViTinh      VARCHAR(20),
            @Qty            DECIMAL(10,2);

        OPEN dv_cursor;
        FETCH NEXT FROM dv_cursor INTO @MaChiTietDVHD, @DonGia, @DonViTinh, @Qty;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @SoMaCTMax = @SoMaCTMax + 1;
            DECLARE @MaChiTietHD VARCHAR(6) = 'CH' + RIGHT('0000' + CAST(@SoMaCTMax AS VARCHAR(4)), 4);

            INSERT INTO ChiTietHoaDon (MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien, MaHoaDon, MaChiTietDVHD, MaPhieuGhi)
            VALUES (
                @MaChiTietHD,
                @Qty,
                @DonViTinh,
                @DonGia,
                (@DonGia * @Qty),
                @MaHoaDon,
                @MaChiTietDVHD,
                NULL
            );

            FETCH NEXT FROM dv_cursor INTO @MaChiTietDVHD, @DonGia, @DonViTinh, @Qty;
        END;

        CLOSE dv_cursor;
        DEALLOCATE dv_cursor;

        -- Hoàn tất transaction
        IF @TranCounter = 0
            COMMIT TRANSACTION;

        -- Thiết lập kết quả trả về
        IF @SoTienKhachThanhToan >= @TongTien
        BEGIN
            SET @MaLoi = 0;
            SET @ThongBao = N'Ghi nhận khoản thu nhận phòng thành công. Có thể tiến hành bàn giao phòng.';
        END;
        ELSE
        BEGIN
            SET @MaLoi = 1;
            SET @ThongBao = N'Số tiền thanh toán chưa đủ. Chưa thể bàn giao phòng.';
        END;

    END TRY
    BEGIN CATCH
        IF @TranCounter > 0
        BEGIN
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION SP_GhiNhanThu_Save;
        END;
        ELSE
        BEGIN
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION;
        END;

        SET @MaHoaDon = NULL;
        SET @MaLoi = -99;
        SET @ThongBao = N'Lỗi hệ thống khi ghi nhận khoản thu: ' + ERROR_MESSAGE();
    END CATCH;
END;
GO

-- ============================================================================
-- 6. SP_LayChiTietThuNhanPhong
-- Màn hình: Modal chi tiết thu nhận phòng (sau khi click "Chi tiết" hoặc ghi nhận xong)
-- ============================================================================
CREATE OR ALTER PROCEDURE SP_LayChiTietThuNhanPhong
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- RESULT SET 1: Thông tin tổng quan hiển thị trên Modal
    DECLARE @GiaThueDetail DECIMAL(15,2), @KyTTDetail NVARCHAR(20);
    SELECT @GiaThueDetail = GiaThue, @KyTTDetail = KyThanhToan
    FROM HopDongThue WHERE MaHopDong = @MaHopDong;

    DECLARE @TienThueDetail DECIMAL(15,2);
    SET @TienThueDetail = CASE WHEN @KyTTDetail = N'Hàng tháng' THEN @GiaThueDetail ELSE @GiaThueDetail * 3 END;

    DECLARE @TienDichVuDetail DECIMAL(15,2);
    SELECT @TienDichVuDetail = ISNULL(SUM(dv.DonGia * CASE WHEN ISNUMERIC(dvhd.GhiChu) = 1 THEN CAST(dvhd.GhiChu AS DECIMAL(10,2)) ELSE 1.00 END), 0)
    FROM DichVuHopDong dvhd
    JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE dvhd.MaHopDong = @MaHopDong
      AND dv.MaDichVu NOT IN ('DV0001', 'DV0002');

    DECLARE @TongKhoanThuDetail DECIMAL(15,2) = @TienThueDetail + @TienDichVuDetail;

    -- Tính toán hoàn cọc nếu có giường bị hủy
    DECLARE @SoGiuongDatCoc INT = 0;
    DECLARE @TienCocBanDau DECIMAL(15,2) = 0.00;
    DECLARE @SoNguoiHuy INT = 0;
    DECLARE @TienHoanCoc DECIMAL(15,2) = 0.00;
    DECLARE @DonGiaHoanCoc DECIMAL(15,2) = 0.00;

    DECLARE @MaPhieuCoc VARCHAR(6);
    DECLARE @SoGiuongThue INT;
    SELECT @MaPhieuCoc = MaPhieuCoc, @SoGiuongThue = SoGiuongThue FROM HopDongThue WHERE MaHopDong = @MaHopDong;

    IF @MaPhieuCoc IS NOT NULL
    BEGIN
        SELECT 
            @SoGiuongDatCoc = COUNT(*),
            @TienCocBanDau = MIN(pdc.SoTienCoc)
        FROM dbo.ChiTietDatCoc ctdc
        JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
        WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc;

        IF @SoGiuongDatCoc > 0 AND @SoGiuongDatCoc > @SoGiuongThue
        BEGIN
            SET @SoNguoiHuy = @SoGiuongDatCoc - @SoGiuongThue;
            SET @TienHoanCoc = (@TienCocBanDau / @SoGiuongDatCoc) * @SoNguoiHuy * 0.8;
            SET @DonGiaHoanCoc = (@TienCocBanDau / @SoGiuongDatCoc) * 0.8;
        END;
    END;

    SELECT 
        hd.MaHopDong,
        CASE 
            WHEN h.TrangThai = N'Đã TT' THEN N'Đã thanh toán'
            ELSE N'Chưa thanh toán'
        END AS TrangThaiThuTien,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        nd.Email,
        (
            SELECT STRING_AGG(p2.TenPhong + CASE WHEN ctdc2.MaGiuong IS NOT NULL THEN N' - Giường ' + CAST(ctdc2.MaGiuong AS NVARCHAR(3)) ELSE N'' END, N', ')
            FROM (
                SELECT TOP (hd.SoGiuongThue) ctdc_inner.MaPhong, ctdc_inner.MaGiuong
                FROM dbo.ChiTietDatCoc ctdc_inner
                WHERE ctdc_inner.MaPhieuDatCoc = hd.MaPhieuCoc
                ORDER BY ctdc_inner.MaChiTietDC
            ) AS ctdc2
            JOIN dbo.Phong p2 ON p2.MaPhong = ctdc2.MaPhong
        ) AS PhongGiuong,
        hd.NgayBatDau,
        -- Tính động để đảm bảo khớp với chi tiết (không dùng h.TongTien vì có thể lưu sai từ trước)
        @TongKhoanThuDetail AS TongKhoanThu,
        CASE WHEN h.TrangThai = N'Đã TT' THEN @TongKhoanThuDetail ELSE 0.00 END AS DaThanhToan,
        h.PhuongThucThanhToan,
        h.NgayThanhToan,
        @TienHoanCoc AS TienHoanCoc,
        @SoNguoiHuy AS SoNguoiHuy,
        @DonGiaHoanCoc AS DonGiaHoanCoc
    FROM HopDongThue hd
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    LEFT JOIN HoaDon h ON h.MaHopDong = hd.MaHopDong AND h.KyThanhToan = CONVERT(CHAR(7), hd.NgayBatDau, 120)
    WHERE hd.MaHopDong = @MaHopDong
    GROUP BY 
        hd.MaHopDong, 
        nd.HoTen, 
        nd.SDT, 
        nd.Email, 
        hd.NgayBatDau, 
        hd.SoGiuongThue,
        hd.MaPhieuCoc,
        h.TongTien, 
        h.TrangThai, 
        h.PhuongThucThanhToan, 
        h.NgayThanhToan;

    -- RESULT SET 2: Chi tiết hóa đơn (Ghép động dòng tiền thuê kỳ đầu để hiển thị đồng bộ trên UI)
    DECLARE @MaHoaDon VARCHAR(6), @KyThanhToanDau VARCHAR(7), @GiaThue DECIMAL(15,2), @KyTT NVARCHAR(20);
    
    SELECT 
        @KyThanhToanDau = CONVERT(CHAR(7), hd.NgayBatDau, 120),
        @GiaThue = hd.GiaThue,
        @KyTT = hd.KyThanhToan
    FROM HopDongThue hd
    WHERE hd.MaHopDong = @MaHopDong;

    SELECT TOP 1 @MaHoaDon = MaHoaDon 
    FROM HoaDon 
    WHERE MaHopDong = @MaHopDong AND KyThanhToan = @KyThanhToanDau;

    -- Dòng 1: Tiền thuê kỳ đầu (Tính động)
    SELECT 
        @MaHoaDon AS MaHoaDon,
        @KyThanhToanDau AS KyThanhToan,
        N'Tiền thuê kỳ đầu (' + @KyTT + ')' AS NoiDung,
        1.00 AS SoLuong,
        N'Kỳ' AS DonViTinh,
        CASE WHEN @KyTT = N'Hàng tháng' THEN @GiaThue ELSE @GiaThue * 3 END AS DonGia,
        CASE WHEN @KyTT = N'Hàng tháng' THEN @GiaThue ELSE @GiaThue * 3 END AS ThanhTien
    WHERE @MaHoaDon IS NOT NULL

    UNION ALL

    -- Các dòng dịch vụ (Được truy vấn thực tế từ ChiTietHoaDon)
    SELECT 
        cth.MaHoaDon,
        @KyThanhToanDau AS KyThanhToan,
        dv.TenDichVu AS NoiDung,
        cth.SoLuong,
        CAST(cth.DonViTinh AS NVARCHAR(20)) AS DonViTinh,
        cth.DonGia,
        cth.ThanhTien
    FROM ChiTietHoaDon cth
    JOIN DichVuHopDong dvhd ON dvhd.MaChiTietDVHD = cth.MaChiTietDVHD
    JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE cth.MaHoaDon = @MaHoaDon
      AND dv.MaDichVu NOT IN ('DV0001', 'DV0002');
END;
GO

-- ============================================================================
-- 7. SP_KiemTraDieuKienBanGiaoSauThuTien
-- Nghiệp vụ liên kết: Được gọi bởi Use Case Lập biên bản bàn giao để kiểm tra điều kiện.
-- ============================================================================
CREATE OR ALTER PROCEDURE SP_KiemTraDieuKienBanGiaoSauThuTien
    @MaHopDong      VARCHAR(6),
    @HopLe          BIT             OUTPUT,
    @MaLoi          INT             OUTPUT,
    @ThongBao       NVARCHAR(500)   OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @HopLe = 0;
    SET @MaLoi = 0;
    SET @ThongBao = N'';

    -- [1] Hợp đồng tồn tại?
    IF NOT EXISTS (SELECT 1 FROM HopDongThue WHERE MaHopDong = @MaHopDong)
    BEGIN
        SET @MaLoi = -1;
        SET @ThongBao = N'Hợp đồng không tồn tại.';
        RETURN;
    END;

    DECLARE @TrangThaiHopDong NVARCHAR(20), @NgayBatDau DATE;
    SELECT @TrangThaiHopDong = TrangThai, @NgayBatDau = NgayBatDau
    FROM HopDongThue
    WHERE MaHopDong = @MaHopDong;

    -- [2] Hợp đồng hiệu lực?
    IF @TrangThaiHopDong <> N'Hiệu lực'
    BEGIN
        SET @MaLoi = -2;
        SET @ThongBao = N'Hợp đồng không còn hiệu lực.';
        RETURN;
    END;

    -- Lấy hóa đơn kỳ đầu
    DECLARE @KyThanhToanDau VARCHAR(7) = CONVERT(CHAR(7), @NgayBatDau, 120);
    DECLARE @TrangThaiHD NVARCHAR(20);

    SELECT TOP 1 @TrangThaiHD = TrangThai
    FROM HoaDon
    WHERE MaHopDong = @MaHopDong
      AND KyThanhToan = @KyThanhToanDau;

    -- [3] Có hóa đơn kỳ đầu?
    IF @TrangThaiHD IS NULL
    BEGIN
        SET @MaLoi = -3;
        SET @ThongBao = N'Hợp đồng chưa được lập hóa đơn kỳ đầu.';
        RETURN;
    END;

    -- [4] Đã thanh toán?
    IF @TrangThaiHD <> N'Đã TT'
    BEGIN
        SET @MaLoi = -4;
        SET @ThongBao = N'Hóa đơn kỳ đầu chưa được thanh toán (Trạng thái hiện tại: ' + @TrangThaiHD + N').';
        RETURN;
    END;

    -- [5] Chưa có biên bản bàn giao vào?
    IF EXISTS (
        SELECT 1
        FROM BienBanBanGiao
        WHERE MaHopDong = @MaHopDong
          AND LoaiBanGiao = N'Bàn giao vào'
    )
    BEGIN
        SET @MaLoi = -5;
        SET @ThongBao = N'Hợp đồng đã có biên bản bàn giao vào.';
        RETURN;
    END;

    -- Đầy đủ điều kiện
    SET @HopLe = 1;
    SET @MaLoi = 0;
    SET @ThongBao = N'Đã thu đủ khoản nhận phòng. Có thể tiến hành lập biên bản bàn giao.';
END;
GO
