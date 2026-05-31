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
-- ============================================================
-- SP_DanhSachHDChoThuDauKy
-- Trả về danh sách HopDongThue Hiệu lực chưa có HoaDon kỳ đầu Đã TT.
-- Dành cho kế toán chọn để ghi nhận thu đầu kỳ.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachHDChoThuDauKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachHDChoThuDauKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachHDChoThuDauKy
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hdt.MaHopDong           AS maHopDong,
        hdt.NgayBatDau          AS ngayBatDau,
        hdt.NgayKetThuc         AS ngayKetThuc,
        hdt.GiaThue             AS giaThue,
        hdt.KyThanhToan         AS kyThanhToan,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        kh.CCCD                 AS cccd,
        -- Phòng/Giường từ chi tiết đặt cọc (snapshot khi lập hợp đồng)
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        p.TenPhong              AS tenPhong,
        -- Tổng tiền kỳ đầu = GiaThue * SoThang + Tổng DichVu * SoThang  (tính trước để UI preview)
        CASE hdt.KyThanhToan WHEN N'Hàng quý' THEN 3 ELSE 1 END AS soThangKyDau,
        -- Tổng phí dịch vụ đã snapshot trong DichVuHopDong
        ISNULL((
            SELECT SUM(dv.DonGia)
            FROM dbo.DichVuHopDong dvhd
            INNER JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
            WHERE dvhd.MaHopDong = hdt.MaHopDong
        ), 0) AS tongDonGiaDichVuThang,
        -- Danh sách dịch vụ dạng JSON để frontend hiển thị chi tiết
        (
            SELECT dv.TenDichVu AS name, dv.DonGia AS price
            FROM dbo.DichVuHopDong dvhd
            INNER JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
            WHERE dvhd.MaHopDong = hdt.MaHopDong
            FOR JSON PATH
        ) AS danhSachDichVuStr
    FROM dbo.HopDongThue hdt
    INNER JOIN dbo.KhachHang kh    ON kh.MaKhachHang  = hdt.MaKhachHang
    INNER JOIN dbo.NguoiDung nd    ON nd.MaNguoiDung   = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 ctxp.MaPhong, ctxp.MaGiuong
        FROM dbo.ChiTietDatCoc ctxp
        WHERE ctxp.MaPhieuDatCoc = hdt.MaPhieuCoc
    ) ctdc
    LEFT JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    WHERE hdt.TrangThai = N'Hiệu lực'
      AND NOT EXISTS (
          SELECT 1 FROM dbo.HoaDon hd
          WHERE hd.MaHopDong = hdt.MaHopDong
            AND hd.TrangThai = N'Đã TT'
      )
    ORDER BY hdt.NgayBatDau ASC;
END;
GO


-- ============================================================
-- SP_GhiNhanThuDauKy
-- Tạo HoaDon kỳ đầu + các dòng ChiTietHoaDon.
-- Tất cả logic tính tiền nằm trong SP này (không có SQL trong code web).
--
-- Ghi chú cho người gộp:
--   @MaHopDong        VARCHAR(6)     — Mã hợp đồng cần thu
--   @SoTienThucNop    DECIMAL(18,2)  — Số tiền khách thực nộp (kế toán nhập)
--   @PhuongThucTT     NVARCHAR(20)   — 'Tiền mặt' hoặc 'Chuyển khoản'
--   @MaNhanVienKeToan VARCHAR(6)     — Mã NV kế toán đang thực hiện
-- Trả về: bản ghi HoaDon vừa tạo
-- ============================================================
IF OBJECT_ID(N'dbo.SP_GhiNhanThuDauKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_GhiNhanThuDauKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_GhiNhanThuDauKy
    @MaHopDong          VARCHAR(6),
    @SoTienThucNop      DECIMAL(18, 2),
    @PhuongThucTT       NVARCHAR(20),
    @MaNhanVienKeToan   VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- ── 1. Validate hợp đồng ──────────────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = @MaHopDong AND TrangThai = N'Hiệu lực')
        THROW 50400, N'Hợp đồng không tồn tại hoặc không ở trạng thái Hiệu lực.', 1;

    -- BR-1: chưa có hóa đơn kỳ đầu Đã TT
    IF EXISTS (
        SELECT 1 FROM dbo.HoaDon
        WHERE MaHopDong = @MaHopDong AND TrangThai = N'Đã TT'
    )
        THROW 50401, N'Hợp đồng này đã có hóa đơn kỳ đầu thanh toán đầy đủ.', 1;

    -- ── 2. Đọc thông tin hợp đồng để tính tiền ──────────────────────────
    DECLARE @GiaThue        DECIMAL(15,2);
    DECLARE @KyThanhToan    NVARCHAR(20);
    DECLARE @SoThang        INT;

    SELECT @GiaThue = GiaThue, @KyThanhToan = KyThanhToan
    FROM dbo.HopDongThue WHERE MaHopDong = @MaHopDong;

    -- BR-3: GiaThue phải hợp lệ
    IF @GiaThue IS NULL OR @GiaThue <= 0
        THROW 50402, N'GiaThue của hợp đồng bất thường (NULL hoặc <= 0). Liên hệ nhân viên sale chỉnh sửa.', 1;

    SET @SoThang = CASE @KyThanhToan WHEN N'Hàng quý' THEN 3 ELSE 1 END;

    -- ── 3. Tính tổng tiền hóa đơn kỳ đầu ────────────────────────────────
    -- 3a. Tiền thuê
    DECLARE @TienThueKyDau DECIMAL(15,2) = @GiaThue * @SoThang;

    -- 3b. Phí dịch vụ (snapshot từ DichVuHopDong JOIN DichVu)
    DECLARE @TongDichVu DECIMAL(15,2);
    SELECT @TongDichVu = ISNULL(SUM(dv.DonGia * @SoThang), 0)
    FROM dbo.DichVuHopDong dvhd
    INNER JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE dvhd.MaHopDong = @MaHopDong
      AND (dv.DonGia IS NOT NULL AND dv.DonGia > 0);

    DECLARE @TongTien DECIMAL(15,2) = @TienThueKyDau + @TongDichVu;

    -- ── 4. Xác định trạng thái hóa đơn ─────────────────────────────────
    DECLARE @TrangThaiHD NVARCHAR(20);
    SET @TrangThaiHD = CASE WHEN @SoTienThucNop >= @TongTien THEN N'Đã TT' ELSE N'Chưa TT' END;

    DECLARE @NgayTT DATE = CASE WHEN @TrangThaiHD = N'Đã TT' THEN CAST(GETDATE() AS DATE) ELSE NULL END;

    -- ── 5. Sinh mã HoaDon ────────────────────────────────────────────────
    DECLARE @NewMaHD  VARCHAR(6);
    DECLARE @NextHDNo INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @NextHDNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaHoaDon, 3, 4) AS INT)), 0) + 1
        FROM dbo.HoaDon WITH (UPDLOCK, HOLDLOCK);

        SET @NewMaHD = 'HD' + RIGHT('0000' + CAST(@NextHDNo AS VARCHAR), 4);

        -- Kỳ thanh toán dạng 'YYYY-MM' cho kỳ đầu
        DECLARE @KyGhi VARCHAR(7) = FORMAT(GETDATE(), 'yyyy-MM');

        -- Hạn thanh toán: 3 ngày kể từ ngày lập
        DECLARE @NgayHanTT DATE = DATEADD(DAY, 3, CAST(GETDATE() AS DATE));

        -- 6. Tạo HoaDon
        INSERT INTO dbo.HoaDon (
            MaHoaDon, KyThanhToan, NgayLap, NgayHanTT,
            TongTien, TrangThai, NgayThanhToan,
            PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan
        ) VALUES (
            @NewMaHD, @KyGhi, CAST(GETDATE() AS DATE), @NgayHanTT,
            @TongTien, @TrangThaiHD, @NgayTT,
            @PhuongThucTT, @MaHopDong, @MaNhanVienKeToan
        );

        -- 7. Sinh mã ChiTietHoaDon
        DECLARE @NextCTNo INT;
        SELECT @NextCTNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaChiTietHD, 3, 4) AS INT)), 0)
        FROM dbo.ChiTietHoaDon WITH (UPDLOCK, HOLDLOCK);

        -- 7a. Dòng tiền thuê phòng (MaChiTietDVHD = cột đầu tiên trong DichVuHopDong của HĐ này)
        -- Theo schema ChiTietHoaDon.MaChiTietDVHD NOT NULL → dùng mã DVHD đầu tiên làm đại diện dòng thuê
        -- (Nếu sau này muốn tách riêng "dòng thuê" vs "dòng dịch vụ" thì sửa schema để cho phép NULL)
        DECLARE @MaDVHDDauTien VARCHAR(6);
        SELECT TOP 1 @MaDVHDDauTien = MaChiTietDVHD
        FROM dbo.DichVuHopDong
        WHERE MaHopDong = @MaHopDong
        ORDER BY MaChiTietDVHD;

        IF @MaDVHDDauTien IS NOT NULL
        BEGIN
            SET @NextCTNo = @NextCTNo + 1;
            INSERT INTO dbo.ChiTietHoaDon (MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien, MaHoaDon, MaChiTietDVHD, MaPhieuGhi)
            VALUES (
                'CT' + RIGHT('0000' + CAST(@NextCTNo AS VARCHAR), 4),
                @SoThang, N'tháng', @GiaThue, @TienThueKyDau,
                @NewMaHD, @MaDVHDDauTien, NULL
            );
        END

        -- 7b. Các dòng dịch vụ (bỏ qua dòng đầu đã dùng làm đại diện tiền thuê)
        INSERT INTO dbo.ChiTietHoaDon (MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien, MaHoaDon, MaChiTietDVHD, MaPhieuGhi)
        SELECT
            'CT' + RIGHT('0000' + CAST(@NextCTNo + ROW_NUMBER() OVER (ORDER BY dvhd.MaChiTietDVHD) AS VARCHAR), 4),
            @SoThang,
            N'tháng',
            dv.DonGia,
            dv.DonGia * @SoThang,
            @NewMaHD,
            dvhd.MaChiTietDVHD,
            NULL
        FROM dbo.DichVuHopDong dvhd
        INNER JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
        WHERE dvhd.MaHopDong = @MaHopDong
          AND dvhd.MaChiTietDVHD <> ISNULL(@MaDVHDDauTien, '');

        COMMIT TRANSACTION;

        -- 8. Trả về hóa đơn vừa tạo
        SELECT
            hd.MaHoaDon         AS maHoaDon,
            hd.KyThanhToan      AS kyThanhToan,
            hd.NgayLap          AS ngayLap,
            hd.TongTien         AS tongTien,
            hd.TrangThai        AS trangThai,
            hd.NgayThanhToan    AS ngayThanhToan,
            hd.PhuongThucThanhToan AS phuongThucThanhToan,
            hd.MaHopDong        AS maHopDong
        FROM dbo.HoaDon hd
        WHERE hd.MaHoaDon = @NewMaHD;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- SP_DanhSachChoBanGiaoVao
-- Trả về danh sách hợp đồng đã đóng đủ tiền chờ bàn giao vào.
-- Dành cho quản lý chọn để lập biên bản bàn giao.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoBanGiaoVao', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoBanGiaoVao AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoBanGiaoVao
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hdt.MaHopDong           AS maHopDong,
        hdt.NgayBatDau          AS ngayBatDau,
        hdt.NgayKetThuc         AS ngayKetThuc,
        hdt.GiaThue             AS giaThue,
        hdt.KyThanhToan         AS kyThanhToan,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        kh.CCCD                 AS cccd,
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        p.TenPhong              AS tenPhong,
        -- Kiểm tra xem đã đóng tiền thu nhận phòng kỳ đầu chưa
        CASE WHEN EXISTS (
            SELECT 1 FROM dbo.HoaDon hd
            WHERE hd.MaHopDong = hdt.MaHopDong
              AND hd.TrangThai = N'Đã TT'
        ) THEN 1 ELSE 0 END AS daDongTienDauKy,
        -- Trạng thái giường để validate (phải ở trạng thái 'Đã đặt cọc')
        g.TinhTrang             AS tinhTrangGiuong,
        -- Trạng thái giường hợp lệ (nếu ctdc.MaGiuong IS NULL thì tất cả giường trong phòng phải 'Đã đặt cọc')
        CASE WHEN ctdc.MaGiuong IS NOT NULL THEN
            CASE WHEN g.TinhTrang = N'Đã đặt cọc' THEN 1 ELSE 0 END
        ELSE
            CASE WHEN NOT EXISTS (
                SELECT 1 FROM dbo.Giuong g2
                WHERE g2.MaPhong = ctdc.MaPhong
                  AND g2.TinhTrang <> N'Đã đặt cọc'
            ) THEN 1 ELSE 0 END
        END AS tinhTrangGiuongHopLe
    FROM dbo.HopDongThue hdt
    INNER JOIN dbo.KhachHang kh    ON kh.MaKhachHang  = hdt.MaKhachHang
    INNER JOIN dbo.NguoiDung nd    ON nd.MaNguoiDung   = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 ctxp.MaPhong, ctxp.MaGiuong
        FROM dbo.ChiTietDatCoc ctxp
        WHERE ctxp.MaPhieuDatCoc = hdt.MaPhieuCoc
    ) ctdc
    LEFT JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    WHERE hdt.TrangThai = N'Hiệu lực'
      AND NOT EXISTS (
          SELECT 1 FROM dbo.BienBanBanGiao bbbg
          WHERE bbbg.MaHopDong = hdt.MaHopDong
            AND bbbg.LoaiBanGiao = N'Bàn giao vào'
      )
    ORDER BY hdt.NgayBatDau ASC;
END;
GO

-- ============================================================
-- SP_DanhSachTaiSanBanGiao
-- Trả về danh sách tài sản tiêu chuẩn của phòng trọ.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachTaiSanBanGiao', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachTaiSanBanGiao AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachTaiSanBanGiao
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ts.MaTaiSan     AS maTaiSan,
        ts.TenTaiSan    AS tenTaiSan,
        ts.SoLuong      AS soLuongChuan,
        ts.DonGia       AS donGiaBoiThuong
    FROM dbo.TaiSan ts
    WHERE ts.MaPhong = @MaPhong;
END;
GO

-- ============================================================
-- SP_LapBienBanBanGiao
-- Tạo Biên bản bàn giao vào + Chi tiết bàn giao.
-- Cập nhật trạng thái Giường ('Đang thuê') và Phòng ('Đầy' / 'Còn chỗ').
-- ============================================================
IF OBJECT_ID(N'dbo.SP_LapBienBanBanGiao', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_LapBienBanBanGiao AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_LapBienBanBanGiao
    @HopDongId          VARCHAR(6),
    @PhongGiuongId      VARCHAR(20) = NULL,
    @DanhSachTaiSan     NVARCHAR(MAX),
    @GhiChu             NVARCHAR(MAX) = NULL,
    @MaNhanVienQuanLy   VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Validate hợp đồng & hóa đơn kỳ đầu
    IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = @HopDongId AND TrangThai = N'Hiệu lực')
        THROW 50500, N'Hợp đồng không tồn tại hoặc không ở trạng thái Hiệu lực.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.HoaDon hd
        WHERE hd.MaHopDong = @HopDongId AND hd.TrangThai = N'Đã TT'
    )
        THROW 50501, N'Chưa hoàn tất thanh toán hóa đơn kỳ đầu cho hợp đồng này.', 1;

    IF EXISTS (
        SELECT 1 FROM dbo.BienBanBanGiao
        WHERE MaHopDong = @HopDongId AND LoaiBanGiao = N'Bàn giao vào'
    )
        THROW 50502, N'Hợp đồng này đã có biên bản bàn giao vào.', 1;

    -- 2. Đọc thông tin phòng / giường từ ChiTietDatCoc của hợp đồng
    DECLARE @MaPhong  VARCHAR(4);
    DECLARE @MaGiuong VARCHAR(3);

    SELECT TOP 1 @MaPhong = ctdc.MaPhong, @MaGiuong = ctdc.MaGiuong
    FROM dbo.HopDongThue hdt
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = hdt.MaPhieuCoc
    WHERE hdt.MaHopDong = @HopDongId;

    IF @MaPhong IS NULL
        THROW 50503, N'Không tìm thấy thông tin phòng/giường liên kết với hợp đồng.', 1;

    -- Validate giường trạng thái đặt cọc
    IF @MaGiuong IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong AND TinhTrang = N'Đã đặt cọc')
            THROW 50504, N'Giường thuê không ở trạng thái [Đã đặt cọc].', 1;
    END
    ELSE
    BEGIN
        -- Thuê nguyên phòng, kiểm tra tất cả giường trong phòng phải Đã đặt cọc
        IF EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Đã đặt cọc')
            THROW 50505, N'Một số giường trong phòng không ở trạng thái [Đã đặt cọc].', 1;
    END

    -- 3. Tiến hành tạo biên bản bàn giao
    DECLARE @NewMaBB  VARCHAR(6);
    DECLARE @NextBBNo INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Sinh mã Biên bản bàn giao dạng BB0001
        SELECT @NextBBNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaBienBan, 3, 4) AS INT)), 0) + 1
        FROM dbo.BienBanBanGiao WITH (UPDLOCK, HOLDLOCK);

        SET @NewMaBB = 'BB' + RIGHT('0000' + CAST(@NextBBNo AS VARCHAR), 4);

        -- Thêm Biên bản bàn giao
        INSERT INTO dbo.BienBanBanGiao (
            MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy
        ) VALUES (
            @NewMaBB, GETDATE(), N'Bàn giao vào', @HopDongId, @MaNhanVienQuanLy
        );

        -- 4. Thêm chi tiết bàn giao từ JSON
        DECLARE @NextBGNo INT;
        SELECT @NextBGNo = ISNULL(MAX(TRY_CAST(SUBSTRING(MaChiTietBG, 3, 4) AS INT)), 0) FROM dbo.ChiTietBanGiao;

        INSERT INTO dbo.ChiTietBanGiao (
            MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu
        )
        SELECT
            'BG' + RIGHT('0000' + CAST(@NextBGNo + ROW_NUMBER() OVER (ORDER BY j.MaTaiSan) AS VARCHAR), 4),
            @NewMaBB,
            @MaPhong,
            j.MaTaiSan,
            j.SoLuongThucTe,
            j.GhiChu
        FROM OPENJSON(@DanhSachTaiSan)
        WITH (
            MaTaiSan VARCHAR(6) '$.maTaiSan',
            SoLuongThucTe INT '$.soLuongThucTe',
            GhiChu NVARCHAR(255) '$.ghiChu'
        ) j;

        -- 5. Cập nhật trạng thái giường sang 'Đang thuê'
        IF @MaGiuong IS NOT NULL
        BEGIN
            UPDATE dbo.Giuong
            SET TinhTrang = N'Đang thuê'
            WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong;
        END
        ELSE
        BEGIN
            UPDATE dbo.Giuong
            SET TinhTrang = N'Đang thuê'
            WHERE MaPhong = @MaPhong;
        END

        -- 6. Tính lại trạng thái phòng
        DECLARE @RoomStatus NVARCHAR(20);
        IF EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Trống')
            SET @RoomStatus = N'Còn chỗ';
        ELSE
            SET @RoomStatus = N'Đầy';

        UPDATE dbo.Phong
        SET TinhTrang = @RoomStatus
        WHERE MaPhong = @MaPhong;

        COMMIT TRANSACTION;

        -- Trả về biên bản bàn giao vừa tạo
        SELECT
            bb.MaBienBan        AS maBienBan,
            bb.NgayBanGiao      AS ngayBanGiao,
            bb.LoaiBanGiao      AS loaiBanGiao,
            bb.MaHopDong        AS maHopDong,
            bb.MaNhanVienQuanLy  AS maNhanVienQuanLy,
            @MaPhong            AS maPhong,
            @RoomStatus         AS tinhTrangPhongMoi
        FROM dbo.BienBanBanGiao bb
        WHERE bb.MaBienBan = @NewMaBB;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
