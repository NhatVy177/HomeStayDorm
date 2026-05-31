USE [HOMEDORM4];
GO

IF OBJECT_ID(N'dbo.HopDongThue', N'U') IS NULL
    THROW 50300, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước.', 1;
GO

-- ============================================================
-- SP_DanhSachChoNhanPhong
-- Trả về danh sách phiếu đặt cọc đã thanh toán và còn hiệu lực,
-- chưa có hợp đồng thuê, dành cho Sale xử lý nhận phòng.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoNhanPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoNhanPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoNhanPhong
    @MaNhanVienSale VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.MaKhachHang         AS maKhachHang,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        nd.Email                AS email,
        nd.NgaySinh             AS ngaySinh,
        nd.GioiTinh             AS gioiTinh,
        kh.CCCD                 AS cccd,
        kh.QuocTich             AS quocTich,
        pdc.HinhThucThue        AS hinhThucThue,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.ThoiGianNhanPhong   AS thoiGianNhanPhong,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        ctdc.GiaThue            AS giaThue,
        p.TenPhong              AS tenPhong,
        pdk.MaDangKy            AS maDangKy,
        pdk.MaNhanVienSale      AS maNhanVienSale
    FROM dbo.PhieuDatCoc pdc
    INNER JOIN dbo.KhachHang kh  ON kh.MaKhachHang  = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd  ON nd.MaNguoiDung   = kh.MaKhachHang
    INNER JOIN dbo.PhieuDangKy pdk ON pdk.MaDangKy   = pdc.MaPhieuYeuCauDangKy
    OUTER APPLY (
        SELECT TOP 1
            ctxp.MaPhong, ctxp.MaGiuong, ctxp.GiaThue
        FROM dbo.ChiTietDatCoc ctxp
        WHERE ctxp.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) ctdc
    LEFT JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    WHERE pdc.TrangThaiThanhToan = N'Đã TT'
      AND pdc.TrangThaiCoc = N'Hiệu lực'
      AND NOT EXISTS (
          SELECT 1 FROM dbo.HopDongThue hdt
          WHERE hdt.MaPhieuCoc = pdc.MaPhieuDatCoc
      )
      AND (
          @MaNhanVienSale IS NULL
          OR pdk.MaNhanVienSale = @MaNhanVienSale
      )
    ORDER BY pdc.ThoiDiemDatCoc ASC;
END;
GO



-- ============================================================
-- SP_CapNhatThongTinCuTru
-- Cập nhật CCCD, Quốc tịch cho Khách hàng
-- và đồng bộ sang ThanhVienHopDong nếu đã có hợp đồng.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_CapNhatThongTinCuTru', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_CapNhatThongTinCuTru AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_CapNhatThongTinCuTru
    @KhachHangId      VARCHAR(6),
    @Cccd             VARCHAR(20),
    @QuocTich         NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
        THROW 50301, N'Không tìm thấy thông tin khách hàng.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Cập nhật bảng KhachHang
        UPDATE dbo.KhachHang
        SET CCCD = @Cccd,
            QuocTich = COALESCE(@QuocTich, QuocTich)
        WHERE MaKhachHang = @KhachHangId;

        -- 2. Cập nhật sang ThanhVienHopDong nếu thành viên này đã ở trong hợp đồng nào đó
        UPDATE dbo.ThanhVienHopDong
        SET CCCD = @Cccd,
            QuocTich = COALESCE(@QuocTich, QuocTich)
        WHERE Email = (SELECT Email FROM dbo.NguoiDung WHERE MaNguoiDung = @KhachHangId)
           OR SDT = (SELECT SDT FROM dbo.NguoiDung WHERE MaNguoiDung = @KhachHangId);

        COMMIT TRANSACTION;

        SELECT 
            kh.MaKhachHang AS khachHangId,
            nd.HoTen AS hoTen,
            kh.CCCD AS cccd,
            kh.QuocTich AS quocTich
        FROM dbo.KhachHang kh
        INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
        WHERE kh.MaKhachHang = @KhachHangId;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- SP_LapHopDongThue
-- Tạo hợp đồng thuê phòng/giường từ phiếu đặt cọc đủ điều kiện.
-- Tự động sinh mã hợp đồng, đăng ký các thành viên cư trú (ThanhVienHopDong),
-- và lưu các dịch vụ đi kèm hợp đồng (DichVuHopDong).
-- ============================================================
IF OBJECT_ID(N'dbo.SP_LapHopDongThue', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_LapHopDongThue AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_LapHopDongThue
    @KhachHangId         VARCHAR(6),
    @PhongGiuongId       VARCHAR(20),
    @NgayBatDau          DATE,
    @NgayKetThucDuKien   DATE,
    @TienThue            DECIMAL(18, 2),
    @TienCoc             DECIMAL(18, 2) = NULL,
    @KyThanhToan         NVARCHAR(20) = N'Hàng tháng',
    @DanhSachThanhVien   NVARCHAR(MAX) = NULL, -- JSON array chứa các thành viên
    @DanhSachDichVu       NVARCHAR(MAX) = NULL  -- JSON array chứa các dịch vụ được chọn
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Trích xuất MaPhong và MaGiuong từ PhongGiuongId
    DECLARE @MaPhong VARCHAR(4);
    DECLARE @MaGiuong VARCHAR(3) = NULL;
    DECLARE @CleanedId VARCHAR(20);
    SET @CleanedId = REPLACE(@PhongGiuongId, ' ', '');

    IF CHARINDEX(N'·', @CleanedId) > 0
    BEGIN
        SET @MaPhong = SUBSTRING(@CleanedId, 1, CHARINDEX(N'·', @CleanedId) - 1);
        SET @MaGiuong = SUBSTRING(@CleanedId, CHARINDEX(N'·', @CleanedId) + 1, LEN(@CleanedId));
    END
    ELSE IF CHARINDEX(N'-', @CleanedId) > 0
    BEGIN
        SET @MaPhong = SUBSTRING(@CleanedId, 1, CHARINDEX(N'-', @CleanedId) - 1);
        SET @MaGiuong = SUBSTRING(@CleanedId, CHARINDEX(N'-', @CleanedId) + 1, LEN(@CleanedId));
    END
    ELSE
    BEGIN
        SET @MaPhong = @CleanedId;
    END

    -- 2. Validate các điều kiện cơ bản
    IF @NgayBatDau >= @NgayKetThucDuKien
        THROW 50302, N'Ngày bắt đầu phải trước ngày kết thúc dự kiến.', 1;

    IF @TienThue <= 0
        THROW 50303, N'Giá thuê phải lớn hơn 0.', 1;

    -- 3. Tìm phiếu cọc hợp lệ
    DECLARE @MaPhieuCoc VARCHAR(6);
    DECLARE @HinhThucThue NVARCHAR(20);

    SELECT TOP 1 
        @MaPhieuCoc = MaPhieuDatCoc,
        @HinhThucThue = HinhThucThue
    FROM dbo.PhieuDatCoc
    WHERE MaKhachHang = @KhachHangId
      AND TrangThaiCoc = N'Hiệu lực'
      AND TrangThaiThanhToan = N'Đã TT'
    ORDER BY ThoiDiemDatCoc DESC;

    IF @MaPhieuCoc IS NULL
        THROW 50304, N'Không tìm thấy phiếu đặt cọc có hiệu lực và đã thanh toán của khách hàng này.', 1;

    -- Kiểm tra xem phiếu cọc đã được tạo hợp đồng chưa
    IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = @MaPhieuCoc)
        THROW 50305, N'Phiếu đặt cọc này đã được lập hợp đồng thuê.', 1;

    -- Kiểm tra phòng/giường xem có đang bị trùng lặp hợp đồng hiệu lực cùng thời gian không
    IF @MaGiuong IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.HopDongThue hdt
            INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
            INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
            WHERE ctdc.MaPhong = @MaPhong AND ctdc.MaGiuong = @MaGiuong
              AND hdt.TrangThai = N'Hiệu lực'
              AND NOT (@NgayKetThucDuKien <= hdt.NgayBatDau OR @NgayBatDau >= hdt.NgayKetThuc)
        )
            THROW 50306, N'Giường đã có hợp đồng hiệu lực khác trong khoảng thời gian này.', 1;
    END
    ELSE
    BEGIN
        IF EXISTS (
            SELECT 1 FROM dbo.HopDongThue hdt
            INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
            INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
            WHERE ctdc.MaPhong = @MaPhong
              AND hdt.TrangThai = N'Hiệu lực'
              AND NOT (@NgayKetThucDuKien <= hdt.NgayBatDau OR @NgayBatDau >= hdt.NgayKetThuc)
        )
            THROW 50307, N'Phòng đã có hợp đồng hiệu lực khác trong khoảng thời gian này.', 1;
    END

    -- 4. Bắt đầu giao dịch tạo hợp đồng
    DECLARE @NewMaHopDong VARCHAR(6);
    DECLARE @NextHDNo INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Sinh mã hợp đồng tự động
        SELECT @NextHDNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaHopDong, 3, 4) AS INT)), 0) + 1
        FROM dbo.HopDongThue WITH (UPDLOCK, HOLDLOCK);

        SET @NewMaHopDong = 'HD' + RIGHT('0000' + CAST(@NextHDNo AS VARCHAR), 4);

        -- Lấy số lượng giường cọc từ chi tiết đặt cọc
        DECLARE @SoGiuongThue INT;
        SELECT @SoGiuongThue = COUNT(*) FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @MaPhieuCoc;
        IF @SoGiuongThue = 0 SET @SoGiuongThue = 1;

        -- Thêm Hợp đồng thuê
        INSERT INTO dbo.HopDongThue (
            MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang
        ) VALUES (
            @NewMaHopDong, CAST(GETDATE() AS DATE), @NgayBatDau, @NgayKetThucDuKien, @SoGiuongThue, @TienThue, @KyThanhToan, N'Hiệu lực', @MaPhieuCoc, @KhachHangId
        );

        -- Cập nhật Trạng thái phiếu đặt cọc
        UPDATE dbo.PhieuDatCoc
        SET TrangThaiCoc = N'Đã lập HĐ'
        WHERE MaPhieuDatCoc = @MaPhieuCoc;

        -- Thêm dịch vụ được chọn vào DichVuHopDong
        DECLARE @NextDVHDNo INT;
        SELECT @NextDVHDNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaChiTietDVHD, 3, 4) AS INT)), 0) FROM dbo.DichVuHopDong WITH (UPDLOCK, HOLDLOCK);

        IF @DanhSachDichVu IS NOT NULL AND ISJSON(@DanhSachDichVu) = 1
        BEGIN
            INSERT INTO dbo.DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu)
            SELECT 
                'DH' + RIGHT('0000' + CAST(@NextDVHDNo + ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS VARCHAR), 4),
                j.MaDichVu,
                @NewMaHopDong,
                CASE WHEN j.MaDichVu IN ('DV0001', 'DV0002') THEN N'Bắt buộc' ELSE N'Áp dụng theo hợp đồng' END
            FROM OPENJSON(@DanhSachDichVu)
            WITH (
                MaDichVu VARCHAR(6) '$'
            ) j;
        END
        ELSE
        BEGIN
            SET @NextDVHDNo = @NextDVHDNo + 1;
            INSERT INTO dbo.DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu)
            VALUES ('DH' + RIGHT('0000' + CAST(@NextDVHDNo AS VARCHAR), 4), 'DV0001', @NewMaHopDong, N'Bắt buộc');

            SET @NextDVHDNo = @NextDVHDNo + 1;
            INSERT INTO dbo.DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu)
            VALUES ('DH' + RIGHT('0000' + CAST(@NextDVHDNo AS VARCHAR), 4), 'DV0002', @NewMaHopDong, N'Bắt buộc');
        END

        -- Đăng ký thành viên cư trú (ThanhVienHopDong)
        DECLARE @NextTVNo INT;
        SELECT @NextTVNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaThanhVien, 3, 4) AS INT)), 0) FROM dbo.ThanhVienHopDong WITH (UPDLOCK, HOLDLOCK);

        -- Parse JSON danh sách thành viên nếu có
        IF @DanhSachThanhVien IS NOT NULL AND ISJSON(@DanhSachThanhVien) = 1
        BEGIN
            -- Thêm các thành viên từ JSON
            INSERT INTO dbo.ThanhVienHopDong (MaThanhVien, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, MaHopDong)
            SELECT 
                'TV' + RIGHT('0000' + CAST(@NextTVNo + ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS VARCHAR), 4),
                j.HoTen,
                CAST(j.NgaySinh AS DATE),
                j.GioiTinh,
                j.CCCD,
                j.SDT,
                j.Email,
                j.QuocTich,
                N'Đang ở',
                @NewMaHopDong
            FROM OPENJSON(@DanhSachThanhVien)
            WITH (
                HoTen NVARCHAR(100) '$.hoTen',
                NgaySinh VARCHAR(10) '$.ngaySinh',
                GioiTinh NVARCHAR(5) '$.gioiTinh',
                CCCD VARCHAR(20) '$.cccd',
                SDT VARCHAR(20) '$.sdt',
                Email VARCHAR(100) '$.email',
                QuocTich NVARCHAR(50) '$.quocTich'
            ) j;
        END
        ELSE
        BEGIN
            -- Đi đơn: tự động lấy thông tin từ KhachHang + NguoiDung
            SET @NextTVNo = @NextTVNo + 1;
            INSERT INTO dbo.ThanhVienHopDong (MaThanhVien, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, MaHopDong)
            SELECT 
                'TV' + RIGHT('0000' + CAST(@NextTVNo AS VARCHAR), 4),
                nd.HoTen,
                nd.NgaySinh,
                nd.GioiTinh,
                kh.CCCD,
                nd.SDT,
                nd.Email,
                kh.QuocTich,
                N'Đang ở',
                @NewMaHopDong
            FROM dbo.KhachHang kh
            INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
            WHERE kh.MaKhachHang = @KhachHangId;
        END

        COMMIT TRANSACTION;

        -- Trả về thông tin hợp đồng vừa tạo
        SELECT 
            MaHopDong AS maHopDong,
            NgayKyHD AS ngayKyHD,
            NgayBatDau AS ngayBatDau,
            NgayKetThuc AS ngayKetThuc,
            GiaThue AS giaThue,
            KyThanhToan AS kyThanhToan,
            TrangThai AS trangThai
        FROM dbo.HopDongThue
        WHERE MaHopDong = @NewMaHopDong;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
