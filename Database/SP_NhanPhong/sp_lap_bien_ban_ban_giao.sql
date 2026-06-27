USE HOMEDORM4;
GO

-- ============================================================
-- PHẦN 1: NÂNG CẤP SCHEMA (HƯỚNG B)
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.BienBanBanGiao')
      AND name = N'GhiChuChung'
)
BEGIN
    -- Sử dụng dynamic SQL để tránh lỗi biên dịch do cột chưa tồn tại trong cùng batch
    EXEC sp_executesql N'
    ALTER TABLE BienBanBanGiao
    ADD GhiChuChung NVARCHAR(500) NULL,
        KhachCoMat BIT NOT NULL DEFAULT 1,
        DaKyBienBan BIT NOT NULL DEFAULT 1,
        TrangThai NVARCHAR(20) NOT NULL DEFAULT N''Đã lập'';
    ';

    EXEC sp_executesql N'
    ALTER TABLE BienBanBanGiao
    ADD CONSTRAINT CHK_BBBG_TrangThai
    CHECK (TrangThai IN (N''Nháp'', N''Đã lập'', N''Đã hủy''));
    ';

    PRINT N'Đã nâng cấp schema cho BienBanBanGiao (GhiChuChung, KhachCoMat, DaKyBienBan, TrangThai).';
END
ELSE
BEGIN
    PRINT N'Bảng BienBanBanGiao đã có cấu trúc nâng cấp – bỏ qua.';
END
GO

-- ============================================================
-- PHẦN 2: TABLE-VALUED PARAMETER TYPE
-- ============================================================
IF TYPE_ID(N'dbo.TVP_ChiTietBanGiao') IS NOT NULL
BEGIN
    PRINT N'TYPE TVP_ChiTietBanGiao đã tồn tại.';
END
ELSE
BEGIN
    CREATE TYPE dbo.TVP_ChiTietBanGiao AS TABLE
    (
        MaPhong VARCHAR(4) NOT NULL,
        MaTaiSan VARCHAR(6) NOT NULL,
        SoLuongThucTe INT NULL,
        GhiChu NVARCHAR(255) NULL
    );
    PRINT N'Đã tạo TYPE TVP_ChiTietBanGiao.';
END
GO

-- ============================================================
-- PHẦN 3: STORED PROCEDURES
-- ============================================================

-- ------------------------------------------------------------
-- SP01 – SP_TraCuuHopDongBanGiao
-- Màn hình: Lập biên bản bàn giao (nút "Kiểm tra hợp đồng")
-- Mục đích: Tìm kiếm và lấy thông tin hợp đồng, phòng giường, khách thuê
-- Input:    @MaHopDong
-- Output:   Result set thông tin hợp đồng phục vụ hiển thị các Card
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_TraCuuHopDongBanGiao
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy thông tin hóa đơn kỳ đầu (hóa đơn lập sớm nhất của HĐ)
    DECLARE @TrangThaiHoaDonKyDau NVARCHAR(20) = NULL;
    SELECT TOP 1 @TrangThaiHoaDonKyDau = TrangThai
    FROM HoaDon
    WHERE MaHopDong = @MaHopDong
    ORDER BY NgayLap ASC, MaHoaDon ASC;

    -- Lấy số người ở (số lượng thành viên cư trú hợp lệ)
    DECLARE @SoNguoiO INT = 0;
    SELECT @SoNguoiO = COUNT(*)
    FROM ThanhVienHopDong
    WHERE MaHopDong = @MaHopDong
      AND TrangThai <> N'Bị từ chối';

    -- Truy vấn chính
    SELECT 
        hd.MaHopDong,
        hd.TrangThai AS TrangThaiHopDong,
        hd.NgayBatDau,
        DATEDIFF(MONTH, hd.NgayBatDau, hd.NgayKetThuc) AS ThoiHanThue,
        hd.MaKhachHang,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        @SoNguoiO AS SoNguoiO,
        p.MaPhong,
        p.TenPhong,
        cn.TenChiNhanh AS TenChiNhanh,
        -- Ghép danh sách giường
        ISNULL(STRING_AGG(ctdc.MaGiuong, ', ') WITHIN GROUP (ORDER BY ctdc.MaGiuong), N'Nguyên phòng') AS DanhSachGiuong,
        -- Trạng thái giường
        ISNULL(STRING_AGG(g.TinhTrang, ', ') WITHIN GROUP (ORDER BY ctdc.MaGiuong), N'Nguyên phòng') AS TinhTrangGiuong,
        @TrangThaiHoaDonKyDau AS TrangThaiHoaDonKyDau,
        -- Đã có biên bản bàn giao vào chính thức chưa
        CAST(CASE WHEN EXISTS (
            SELECT 1 FROM BienBanBanGiao bb
            WHERE bb.MaHopDong = hd.MaHopDong 
              AND bb.LoaiBanGiao = N'Bàn giao vào' 
              AND bb.TrangThai = N'Đã lập'
        ) THEN 1 ELSE 0 END AS BIT) AS DaCoBienBanBanGiaoVao,
        -- Có thể tiến hành bàn giao (nếu HĐ hiệu lực, HĐ kỳ đầu đã TT, và chưa có biên bản chính thức)
        CAST(CASE 
            WHEN hd.TrangThai = N'Hiệu lực'
             AND @TrangThaiHoaDonKyDau = N'Đã TT'
             AND NOT EXISTS (
                 SELECT 1 FROM BienBanBanGiao bb
                 WHERE bb.MaHopDong = hd.MaHopDong 
                   AND bb.LoaiBanGiao = N'Bàn giao vào' 
                   AND bb.TrangThai = N'Đã lập'
             )
            THEN 1 ELSE 0 
        END AS BIT) AS CoTheBanGiao
    FROM HopDongThue hd
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON p.MaPhong = ctdc.MaPhong
    JOIN ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    LEFT JOIN Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    WHERE hd.MaHopDong = @MaHopDong
    GROUP BY 
        hd.MaHopDong, hd.TrangThai, hd.NgayBatDau, hd.NgayKetThuc, 
        hd.MaKhachHang, nd.HoTen, nd.SDT, p.MaPhong, p.TenPhong, cn.TenChiNhanh;
END;
GO

-- ------------------------------------------------------------
-- SP02 – SP_KiemTraDieuKienBanGiaoVao
-- Màn hình: Lập biên bản bàn giao (checklist kiểm tra trước khi lưu)
-- Mục đích: Kiểm tra các điều kiện nghiệp vụ để đảm bảo hợp lệ.
-- Output:   @HopLe (0/1), @MaLoi, @ThongBao
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_KiemTraDieuKienBanGiaoVao
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

    DECLARE @TrangThaiHopDong NVARCHAR(20), @MaPhieuCoc VARCHAR(6);
    SELECT @TrangThaiHopDong = TrangThai, @MaPhieuCoc = MaPhieuCoc
    FROM HopDongThue
    WHERE MaHopDong = @MaHopDong;

    -- [2] Hợp đồng hiệu lực?
    IF @TrangThaiHopDong <> N'Hiệu lực'
    BEGIN
        SET @MaLoi = -2;
        SET @ThongBao = N'Hợp đồng không còn hiệu lực.';
        RETURN;
    END;

    -- [3] Có hóa đơn kỳ đầu?
    DECLARE @MaHoaDonKyDau VARCHAR(6), @TrangThaiHD NVARCHAR(20);
    SELECT TOP 1 @MaHoaDonKyDau = MaHoaDon, @TrangThaiHD = TrangThai
    FROM HoaDon
    WHERE MaHopDong = @MaHopDong
    ORDER BY NgayLap ASC, MaHoaDon ASC;

    IF @MaHoaDonKyDau IS NULL
    BEGIN
        SET @MaLoi = -3;
        SET @ThongBao = N'Hợp đồng chưa được lập hóa đơn kỳ đầu.';
        RETURN;
    END;

    -- [4] Hóa đơn kỳ đầu đã thanh toán?
    IF @TrangThaiHD <> N'Đã TT'
    BEGIN
        SET @MaLoi = -4;
        SET @ThongBao = N'Hóa đơn kỳ đầu chưa được thanh toán (Trạng thái: ' + @TrangThaiHD + N').';
        RETURN;
    END;

    -- [5] Chưa có biên bản bàn giao vào chính thức?
    IF EXISTS (
        SELECT 1 FROM BienBanBanGiao bb
        WHERE bb.MaHopDong = @MaHopDong
          AND bb.LoaiBanGiao = N'Bàn giao vào'
          AND bb.TrangThai = N'Đã lập'
    )
    BEGIN
        SET @MaLoi = -5;
        SET @ThongBao = N'Hợp đồng đã lập biên bản bàn giao vào.';
        RETURN;
    END;

    -- [6] Giường trong hợp đồng đang là N'Đã đặt cọc'?
    DECLARE @HinhThucThue NVARCHAR(20);
    SELECT @HinhThucThue = HinhThucThue FROM PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuCoc;

    IF @HinhThucThue = N'Ghép giường'
    BEGIN
        IF EXISTS (
            SELECT 1 
            FROM ChiTietDatCoc ctdc
            JOIN Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
              AND g.TinhTrang <> N'Đã đặt cọc'
        )
        BEGIN
            SET @MaLoi = -6;
            SET @ThongBao = N'Có giường thuê ghép không ở trạng thái "Đã đặt cọc".';
            RETURN;
        END;
    END;
    ELSE -- Nguyên phòng
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM ChiTietDatCoc ctdc
            JOIN Giuong g ON g.MaPhong = ctdc.MaPhong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
              AND g.TinhTrang <> N'Đã đặt cọc'
        )
        BEGIN
            SET @MaLoi = -6;
            SET @ThongBao = N'Có giường trong phòng thuê nguyên căn không ở trạng thái "Đã đặt cọc".';
            RETURN;
        END;
    END;

    -- [7] Có tài sản bàn giao?
    IF NOT EXISTS (
        SELECT 1
        FROM ChiTietDatCoc ctdc
        JOIN TaiSan ts ON ts.MaPhong = ctdc.MaPhong
        WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
    )
    BEGIN
        SET @MaLoi = -7;
        SET @ThongBao = N'Không tìm thấy tài sản nào thuộc phòng để bàn giao.';
        RETURN;
    END;

    -- Tất cả đều hợp lệ
    SET @HopLe = 1;
    SET @MaLoi = 0;
    SET @ThongBao = N'Hợp đồng đủ điều kiện lập biên bản bàn giao.';
END;
GO

-- ------------------------------------------------------------
-- SP03 – SP_LayDanhSachTaiSanBanGiao
-- Màn hình: Lập biên bản bàn giao (phần hiển thị bảng danh sách tài sản)
-- Mục đích: Lấy danh sách tài sản và số lượng định mức của phòng.
--           Tự động nhân bản tài sản cá nhân theo giường khi thuê ghép,
--           và gom nhóm tài sản chung hiển thị 1 lần cho phòng.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_LayDanhSachTaiSanBanGiao
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaPhieuCoc VARCHAR(6), @HinhThucThue NVARCHAR(20);
    SELECT @MaPhieuCoc = MaPhieuCoc
    FROM HopDongThue
    WHERE MaHopDong = @MaHopDong;

    SELECT @HinhThucThue = HinhThucThue
    FROM PhieuDatCoc
    WHERE MaPhieuDatCoc = @MaPhieuCoc;

    IF @HinhThucThue = N'Nguyên phòng'
    BEGIN
        SELECT 
            ctdc.MaPhong,
            p.TenPhong,
            CAST(NULL AS VARCHAR(3)) AS MaGiuong,
            ts.MaTaiSan,
            ts.TenTaiSan,
            ts.SoLuong AS SoLuongHeThong,
            ts.DonGia,
            ts.SoLuong AS SoLuongThucTeMacDinh,
            CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
        FROM HopDongThue hd
        JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
        JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        JOIN Phong p ON p.MaPhong = ctdc.MaPhong
        JOIN TaiSan ts ON ts.MaPhong = ctdc.MaPhong
        WHERE hd.MaHopDong = @MaHopDong
        ORDER BY ts.MaTaiSan;
    END;
    ELSE -- Ghép giường
    BEGIN
        -- Tài sản cá nhân: nhân bản theo giường
        SELECT 
            ctdc.MaPhong,
            p.TenPhong,
            ctdc.MaGiuong,
            ts.MaTaiSan,
            ts.TenTaiSan,
            1 AS SoLuongHeThong, -- Mỗi giường nhận định mức 1
            ts.DonGia,
            1 AS SoLuongThucTeMacDinh,
            CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
        FROM HopDongThue hd
        JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
        JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        JOIN Phong p ON p.MaPhong = ctdc.MaPhong
        JOIN TaiSan ts ON ts.MaPhong = ctdc.MaPhong
        WHERE hd.MaHopDong = @MaHopDong
          AND (
               ts.TenTaiSan LIKE N'%Giường%' 
            OR ts.TenTaiSan LIKE N'%Nệm%' 
            OR ts.TenTaiSan LIKE N'%Tủ cá nhân%' 
            OR ts.TenTaiSan LIKE N'%Bàn học%' 
            OR ts.TenTaiSan LIKE N'%Khóa%' 
            OR ts.TenTaiSan LIKE N'%Thẻ%' 
            OR ts.TenTaiSan LIKE N'%Ghế%'
          )

        UNION ALL

        -- Tài sản chung: hiển thị 1 lần cho cả phòng
        SELECT DISTINCT
            ctdc.MaPhong,
            p.TenPhong,
            CAST(NULL AS VARCHAR(3)) AS MaGiuong,
            ts.MaTaiSan,
            ts.TenTaiSan,
            ts.SoLuong AS SoLuongHeThong,
            ts.DonGia,
            ts.SoLuong AS SoLuongThucTeMacDinh,
            CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
        FROM HopDongThue hd
        JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
        JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        JOIN Phong p ON p.MaPhong = ctdc.MaPhong
        JOIN TaiSan ts ON ts.MaPhong = ctdc.MaPhong
        WHERE hd.MaHopDong = @MaHopDong
          AND NOT (
               ts.TenTaiSan LIKE N'%Giường%' 
            OR ts.TenTaiSan LIKE N'%Nệm%' 
            OR ts.TenTaiSan LIKE N'%Tủ cá nhân%' 
            OR ts.TenTaiSan LIKE N'%Bàn học%' 
            OR ts.TenTaiSan LIKE N'%Khóa%' 
            OR ts.TenTaiSan LIKE N'%Thẻ%' 
            OR ts.TenTaiSan LIKE N'%Ghế%'
          )
        ORDER BY MaGiuong, MaTaiSan;
    END;
END;
GO

-- ------------------------------------------------------------
-- SP04 – SP_LuuNhapBienBanBanGiao
-- Màn hình: Lập biên bản bàn giao (nút "Lưu nháp")
-- Mục đích: Tạo biên bản nháp, không cập nhật phòng/giường.
--           Nếu đã có nháp cũ của HĐ này thì ghi đè lên.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_LuuNhapBienBanBanGiao
    @MaHopDong          VARCHAR(6),
    @MaNhanVienQuanLy   VARCHAR(6),
    @GhiChuChung        NVARCHAR(500) = NULL,
    @DanhSachTaiSan     dbo.TVP_ChiTietBanGiao READONLY,
    @MaBienBan          VARCHAR(6)          OUTPUT,
    @MaLoi              INT                 OUTPUT,
    @ThongBao           NVARCHAR(500)       OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaBienBan = NULL;
    SET @MaLoi = 0;
    SET @ThongBao = N'';

    DECLARE @TranCounter INT = @@TRANCOUNT;

    BEGIN TRY
        IF @TranCounter > 0
            SAVE TRANSACTION SP_LuuNhap_Save;
        ELSE
            BEGIN TRANSACTION;

        -- [1] Hợp đồng tồn tại?
        IF NOT EXISTS (SELECT 1 FROM HopDongThue WHERE MaHopDong = @MaHopDong)
        BEGIN
            SET @MaLoi = -1;
            SET @ThongBao = N'Hợp đồng không tồn tại.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LuuNhap_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [2] Kiểm tra nhân viên quản lý
        IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVienQuanLy)
        BEGIN
            SET @MaLoi = -15;
            SET @ThongBao = N'Nhân viên quản lý không tồn tại.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LuuNhap_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- Tìm biên bản nháp cũ của hợp đồng này (nếu có)
        SELECT TOP 1 @MaBienBan = MaBienBan
        FROM BienBanBanGiao
        WHERE MaHopDong = @MaHopDong
          AND LoaiBanGiao = N'Bàn giao vào'
          AND TrangThai = N'Nháp';

        IF @MaBienBan IS NULL
        BEGIN
            -- Sinh mã biên bản mới BG0001, BG0002...
            DECLARE @SoMaMax INT;
            SELECT @SoMaMax = ISNULL(MAX(CAST(SUBSTRING(MaBienBan, 3, 4) AS INT)), 0)
            FROM BienBanBanGiao
            WHERE MaBienBan LIKE 'BG[0-9][0-9][0-9][0-9]';

            SET @MaBienBan = 'BG' + RIGHT('0000' + CAST(@SoMaMax + 1 AS VARCHAR(4)), 4);

            -- Thêm mới biên bản nháp
            INSERT INTO BienBanBanGiao (
                MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy,
                GhiChuChung, KhachCoMat, DaKyBienBan, TrangThai
            )
            VALUES (
                @MaBienBan,
                CAST(GETDATE() AS DATE),
                N'Bàn giao vào',
                @MaHopDong,
                @MaNhanVienQuanLy,
                @GhiChuChung,
                1,
                1,
                N'Nháp'
            );
        END;
        ELSE
        BEGIN
            -- Cập nhật thông tin biên bản nháp
            UPDATE BienBanBanGiao
            SET GhiChuChung = @GhiChuChung,
                MaNhanVienQuanLy = @MaNhanVienQuanLy,
                NgayBanGiao = CAST(GETDATE() AS DATE)
            WHERE MaBienBan = @MaBienBan;

            -- Xóa chi tiết bàn giao cũ của bản nháp
            DELETE FROM ChiTietBanGiao WHERE MaBienBan = @MaBienBan;
        END;

        -- Thêm chi tiết bàn giao
        DECLARE @SoMaCTMax INT;
        SELECT @SoMaCTMax = ISNULL(MAX(CAST(SUBSTRING(MaChiTietBG, 3, 4) AS INT)), 0)
        FROM ChiTietBanGiao
        WHERE MaChiTietBG LIKE 'CT[0-9][0-9][0-9][0-9]';

        -- Cursor để lưu từng tài sản
        DECLARE ts_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT MaPhong, MaTaiSan, SoLuongThucTe, GhiChu
            FROM @DanhSachTaiSan;

        DECLARE
            @MaPhong    VARCHAR(4),
            @MaTaiSan   VARCHAR(6),
            @SLThucTe   INT,
            @GhiChu     NVARCHAR(255);

        OPEN ts_cursor;
        FETCH NEXT FROM ts_cursor INTO @MaPhong, @MaTaiSan, @SLThucTe, @GhiChu;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @SoMaCTMax = @SoMaCTMax + 1;
            DECLARE @MaChiTietBG VARCHAR(6) = 'CT' + RIGHT('0000' + CAST(@SoMaCTMax AS VARCHAR(4)), 4);

            INSERT INTO ChiTietBanGiao (MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
            VALUES (@MaChiTietBG, @MaBienBan, @MaPhong, @MaTaiSan, ISNULL(@SLThucTe, 0), @GhiChu);

            FETCH NEXT FROM ts_cursor INTO @MaPhong, @MaTaiSan, @SLThucTe, @GhiChu;
        END;

        CLOSE ts_cursor;
        DEALLOCATE ts_cursor;

        IF @TranCounter = 0
            COMMIT TRAN;
        SET @MaLoi = 0;
        SET @ThongBao = N'Lưu nháp biên bản bàn giao thành công.';

    END TRY
    BEGIN CATCH
        IF @TranCounter > 0
        BEGIN
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION SP_LuuNhap_Save;
        END;
        ELSE
        BEGIN
            IF @@TRANCOUNT > 0
                ROLLBACK TRAN;
        END;
        SET @MaBienBan = NULL;
        SET @MaLoi = -99;
        SET @ThongBao = N'Lỗi hệ thống khi lưu nháp: ' + ERROR_MESSAGE();
    END CATCH;
END;
GO

-- ------------------------------------------------------------
-- SP05 – SP_LapBienBanBanGiaoVao
-- Màn hình: Lập biên bản bàn giao (nút "Lưu biên bản")
-- Mục đích: Stored Procedure chính để lập biên bản bàn giao.
--           Cập nhật trạng thái giường sang "Đang thuê" và
--           trạng thái phòng tương ứng (Đầy / Còn chỗ).
--           Bọc trong Transaction, có lock chống race condition.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_LapBienBanBanGiaoVao
    @MaHopDong          VARCHAR(6),
    @MaNhanVienQuanLy   VARCHAR(6),
    @KhachCoMat         BIT,
    @DaKyBienBan        BIT,
    @GhiChuChung        NVARCHAR(500) = NULL,
    @DanhSachTaiSan     dbo.TVP_ChiTietBanGiao READONLY,
    @MaBienBan          VARCHAR(6)          OUTPUT,
    @MaLoi              INT                 OUTPUT,
    @ThongBao           NVARCHAR(500)       OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Bước 1: Khởi tạo output
    SET @MaBienBan = NULL;
    SET @MaLoi = 0;
    SET @ThongBao = N'';

    -- Bước 2: Kiểm tra khách có mặt và ký biên bản
    IF ISNULL(@KhachCoMat, 0) = 0
    BEGIN
        SET @MaLoi = -8;
        SET @ThongBao = N'Khách hàng không có mặt tại thời điểm bàn giao.';
        RETURN;
    END;

    IF ISNULL(@DaKyBienBan, 0) = 0
    BEGIN
        SET @MaLoi = -9;
        SET @ThongBao = N'Khách hàng chưa ký xác nhận biên bản.';
        RETURN;
    END;

    DECLARE @TranCounter INT = @@TRANCOUNT;

    BEGIN TRY
        IF @TranCounter > 0
            SAVE TRANSACTION SP_LapBG_Save;
        ELSE
            BEGIN TRANSACTION;

        -- Khóa và đọc thông tin hợp đồng (chống race condition)
        DECLARE @TrangThaiHopDong NVARCHAR(20), @MaPhieuCoc VARCHAR(6);
        SELECT 
            @TrangThaiHopDong = hd.TrangThai, 
            @MaPhieuCoc = hd.MaPhieuCoc
        FROM HopDongThue hd WITH (UPDLOCK, HOLDLOCK)
        WHERE hd.MaHopDong = @MaHopDong;

        -- [Bước 3.1] Hợp đồng tồn tại?
        IF @TrangThaiHopDong IS NULL
        BEGIN
            SET @MaLoi = -1;
            SET @ThongBao = N'Hợp đồng không tồn tại.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.2] Hợp đồng hiệu lực?
        IF @TrangThaiHopDong <> N'Hiệu lực'
        BEGIN
            SET @MaLoi = -2;
            SET @ThongBao = N'Hợp đồng không còn hiệu lực.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.3] Hóa đơn kỳ đầu đã thanh toán?
        DECLARE @MaHoaDonKyDau VARCHAR(6), @TrangThaiHD NVARCHAR(20);
        SELECT TOP 1 @MaHoaDonKyDau = MaHoaDon, @TrangThaiHD = TrangThai
        FROM HoaDon
        WHERE MaHopDong = @MaHopDong
        ORDER BY NgayLap ASC, MaHoaDon ASC;

        IF @MaHoaDonKyDau IS NULL
        BEGIN
            SET @MaLoi = -3;
            SET @ThongBao = N'Hợp đồng chưa được lập hóa đơn kỳ đầu.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        IF @TrangThaiHD <> N'Đã TT'
        BEGIN
            SET @MaLoi = -4;
            SET @ThongBao = N'Hóa đơn kỳ đầu chưa được thanh toán (Trạng thái: ' + @TrangThaiHD + N').';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.4] Chưa có biên bản bàn giao vào chính thức?
        IF EXISTS (
            SELECT 1 FROM BienBanBanGiao bb WITH (UPDLOCK, HOLDLOCK)
            WHERE bb.MaHopDong = @MaHopDong
              AND bb.LoaiBanGiao = N'Bàn giao vào'
              AND bb.TrangThai = N'Đã lập'
        )
        BEGIN
            SET @MaLoi = -5;
            SET @ThongBao = N'Hợp đồng đã có biên bản bàn giao vào.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 3.5] Giường thuộc hợp đồng đang là N'Đã đặt cọc'?
        DECLARE @HinhThucThue NVARCHAR(20);
        SELECT @HinhThucThue = HinhThucThue FROM PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuCoc;

        IF @HinhThucThue = N'Ghép giường'
        BEGIN
            IF EXISTS (
                SELECT 1 
                FROM ChiTietDatCoc ctdc
                JOIN Giuong g WITH (UPDLOCK, HOLDLOCK) ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
                  AND g.TinhTrang <> N'Đã đặt cọc'
            )
            BEGIN
                SET @MaLoi = -6;
                SET @ThongBao = N'Có giường thuê ghép không ở trạng thái "Đã đặt cọc".';
                IF @TranCounter > 0
                    ROLLBACK TRANSACTION SP_LapBG_Save;
                ELSE
                    ROLLBACK TRANSACTION;
                RETURN;
            END;
        END;
        ELSE -- Nguyên phòng
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM ChiTietDatCoc ctdc
                JOIN Giuong g WITH (UPDLOCK, HOLDLOCK) ON g.MaPhong = ctdc.MaPhong
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
                  AND g.TinhTrang <> N'Đã đặt cọc'
            )
            BEGIN
                SET @MaLoi = -6;
                SET @ThongBao = N'Có giường trong phòng thuê nguyên căn không ở trạng thái "Đã đặt cọc".';
                IF @TranCounter > 0
                    ROLLBACK TRANSACTION SP_LapBG_Save;
                ELSE
                    ROLLBACK TRANSACTION;
                RETURN;
            END;
        END;

        -- [Bước 3.6] Phòng có tài sản không?
        IF NOT EXISTS (
            SELECT 1
            FROM ChiTietDatCoc ctdc
            JOIN TaiSan ts ON ts.MaPhong = ctdc.MaPhong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
        )
        BEGIN
            SET @MaLoi = -7;
            SET @ThongBao = N'Không tìm thấy tài sản nào thuộc phòng này để bàn giao.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 4] Kiểm tra danh sách tài sản truyền vào
        -- 4.1. Danh sách không được trống
        IF NOT EXISTS (SELECT 1 FROM @DanhSachTaiSan)
        BEGIN
            SET @MaLoi = -10;
            SET @ThongBao = N'Danh sách tài sản truyền vào trống.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 4.2. Còn tài sản bắt buộc chưa nhập số lượng thực tế
        IF EXISTS (
            SELECT 1 
            FROM ChiTietDatCoc ctdc
            JOIN TaiSan ts ON ts.MaPhong = ctdc.MaPhong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc
              AND NOT EXISTS (
                  SELECT 1 FROM @DanhSachTaiSan tvp 
                  WHERE tvp.MaPhong = ctdc.MaPhong AND tvp.MaTaiSan = ts.MaTaiSan
              )
        )
        BEGIN
            SET @MaLoi = -11;
            SET @ThongBao = N'Còn tài sản bắt buộc chưa nhập số lượng thực tế.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 4.3. Số lượng thực tế không hợp lệ (< 0 hoặc NULL)
        IF EXISTS (SELECT 1 FROM @DanhSachTaiSan WHERE SoLuongThucTe IS NULL OR SoLuongThucTe < 0)
        BEGIN
            SET @MaLoi = -12;
            SET @ThongBao = N'Số lượng thực tế của tài sản không hợp lệ.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 4.4. Có tài sản chênh lệch nhưng chưa nhập ghi chú
        IF EXISTS (
            SELECT 1 
            FROM @DanhSachTaiSan tvp
            JOIN TaiSan ts ON ts.MaPhong = tvp.MaPhong AND ts.MaTaiSan = tvp.MaTaiSan
            CROSS APPLY (
                SELECT CASE 
                    WHEN @HinhThucThue = N'Ghép giường' AND (
                        ts.TenTaiSan LIKE N'%Giường%' 
                     OR ts.TenTaiSan LIKE N'%Nệm%' 
                     OR ts.TenTaiSan LIKE N'%Tủ cá nhân%' 
                     OR ts.TenTaiSan LIKE N'%Bàn học%' 
                     OR ts.TenTaiSan LIKE N'%Khóa%' 
                     OR ts.TenTaiSan LIKE N'%Thẻ%' 
                     OR ts.TenTaiSan LIKE N'%Ghế%'
                    ) THEN 1
                    ELSE ts.SoLuong
                END AS SoLuongDuKien
            ) calc
            WHERE tvp.SoLuongThucTe <> calc.SoLuongDuKien
              AND (tvp.GhiChu IS NULL OR LTRIM(RTRIM(tvp.GhiChu)) = '')
        )
        BEGIN
            SET @MaLoi = -13;
            SET @ThongBao = N'Có tài sản chênh lệch số lượng thực tế nhưng chưa nhập ghi chú.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 4.5. Tài sản không thuộc phòng của hợp đồng
        IF EXISTS (
            SELECT 1 
            FROM @DanhSachTaiSan tvp
            WHERE NOT EXISTS (
                SELECT 1 FROM ChiTietDatCoc ctdc
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc AND ctdc.MaPhong = tvp.MaPhong
            )
        )
        BEGIN
            SET @MaLoi = -14;
            SET @ThongBao = N'Có tài sản không thuộc phòng của hợp đồng này.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- 4.6. Kiểm tra nhân viên quản lý
        IF NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaNhanVien = @MaNhanVienQuanLy)
        BEGIN
            SET @MaLoi = -15;
            SET @ThongBao = N'Nhân viên quản lý không tồn tại.';
            IF @TranCounter > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
            ELSE
                ROLLBACK TRANSACTION;
            RETURN;
        END;

        -- [Bước 5 & 6] Sinh mã biên bản và ghi nhận BienBanBanGiao
        DECLARE @DraftMaBienBan VARCHAR(6) = NULL;
        SELECT TOP 1 @DraftMaBienBan = MaBienBan
        FROM BienBanBanGiao bb WITH (UPDLOCK, HOLDLOCK)
        WHERE bb.MaHopDong = @MaHopDong
          AND bb.LoaiBanGiao = N'Bàn giao vào'
          AND bb.TrangThai = N'Nháp';

        IF @DraftMaBienBan IS NOT NULL
        BEGIN
            SET @MaBienBan = @DraftMaBienBan;
            
            -- Chuyển trạng thái từ Nháp sang Đã lập
            UPDATE BienBanBanGiao
            SET NgayBanGiao = CAST(GETDATE() AS DATE),
                MaNhanVienQuanLy = @MaNhanVienQuanLy,
                GhiChuChung = @GhiChuChung,
                KhachCoMat = @KhachCoMat,
                DaKyBienBan = @DaKyBienBan,
                TrangThai = N'Đã lập'
            WHERE MaBienBan = @MaBienBan;

            -- Xóa các chi tiết bàn giao cũ của bản nháp
            DELETE FROM ChiTietBanGiao WHERE MaBienBan = @MaBienBan;
        END;
        ELSE
        BEGIN
            -- Sinh mã biên bản mới
            DECLARE @SoMaMax INT;
            SELECT @SoMaMax = ISNULL(MAX(CAST(SUBSTRING(MaBienBan, 3, 4) AS INT)), 0)
            FROM BienBanBanGiao;

            SET @MaBienBan = 'BG' + RIGHT('0000' + CAST(@SoMaMax + 1 AS VARCHAR(4)), 4);

            -- Thêm mới biên bản bàn giao
            INSERT INTO BienBanBanGiao (
                MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy,
                GhiChuChung, KhachCoMat, DaKyBienBan, TrangThai
            )
            VALUES (
                @MaBienBan,
                CAST(GETDATE() AS DATE),
                N'Bàn giao vào',
                @MaHopDong,
                @MaNhanVienQuanLy,
                @GhiChuChung,
                @KhachCoMat,
                @DaKyBienBan,
                N'Đã lập'
            );
        END;

        -- [Bước 7] Insert ChiTietBanGiao
        DECLARE @SoMaCTMax INT;
        SELECT @SoMaCTMax = ISNULL(MAX(CAST(SUBSTRING(MaChiTietBG, 3, 4) AS INT)), 0)
        FROM ChiTietBanGiao
        WHERE MaChiTietBG LIKE 'CT[0-9][0-9][0-9][0-9]';

        -- Dùng cursor để duyệt qua danh sách và sinh mã
        DECLARE ts_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT MaPhong, MaTaiSan, SoLuongThucTe, GhiChu
            FROM @DanhSachTaiSan;

        DECLARE
            @MaPhong2    VARCHAR(4),
            @MaTaiSan2   VARCHAR(6),
            @SLThucTe2   INT,
            @GhiChu2     NVARCHAR(255);

        OPEN ts_cursor;
        FETCH NEXT FROM ts_cursor INTO @MaPhong2, @MaTaiSan2, @SLThucTe2, @GhiChu2;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @SoMaCTMax = @SoMaCTMax + 1;
            DECLARE @MaChiTietBG VARCHAR(6) = 'CT' + RIGHT('0000' + CAST(@SoMaCTMax AS VARCHAR(4)), 4);

            INSERT INTO ChiTietBanGiao (MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
            VALUES (@MaChiTietBG, @MaBienBan, @MaPhong2, @MaTaiSan2, @SLThucTe2, @GhiChu2);

            FETCH NEXT FROM ts_cursor INTO @MaPhong2, @MaTaiSan2, @SLThucTe2, @GhiChu2;
        END;

        CLOSE ts_cursor;
        DEALLOCATE ts_cursor;

        -- [Bước 8] Cập nhật trạng thái giường sang N'Đang thuê'
        IF @HinhThucThue = N'Ghép giường'
        BEGIN
            UPDATE g
            SET TinhTrang = N'Đang thuê'
            FROM Giuong g
            JOIN ChiTietDatCoc ctdc ON ctdc.MaPhong = g.MaPhong AND ctdc.MaGiuong = g.MaGiuong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc;
        END;
        ELSE -- Nguyên phòng
        BEGIN
            UPDATE g
            SET TinhTrang = N'Đang thuê'
            FROM Giuong g
            JOIN ChiTietDatCoc ctdc ON ctdc.MaPhong = g.MaPhong
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuCoc;
        END;

        -- [Bước 9] Cập nhật trạng thái phòng (Đầy / Còn chỗ)
        DECLARE @PhongAnhHuong TABLE (MaPhong VARCHAR(4) PRIMARY KEY);
        INSERT INTO @PhongAnhHuong
        SELECT DISTINCT MaPhong
        FROM ChiTietDatCoc
        WHERE MaPhieuDatCoc = @MaPhieuCoc;

        UPDATE p
        SET p.TinhTrang = CASE 
            -- Nếu còn ít nhất 1 giường Trống trong phòng
            WHEN EXISTS (
                SELECT 1 FROM Giuong g 
                WHERE g.MaPhong = p.MaPhong AND g.TinhTrang = N'Trống'
            ) THEN N'Còn chỗ'
            ELSE N'Đầy'
        END
        FROM Phong p
        WHERE p.MaPhong IN (SELECT MaPhong FROM @PhongAnhHuong);

        IF @TranCounter = 0
            COMMIT TRAN;
        SET @MaLoi = 0;
        SET @ThongBao = N'Lập biên bản bàn giao thành công.';

    END TRY
    BEGIN CATCH
        IF @TranCounter > 0
        BEGIN
            IF @@TRANCOUNT > 0
                ROLLBACK TRANSACTION SP_LapBG_Save;
        END;
        ELSE
        BEGIN
            IF @@TRANCOUNT > 0
                ROLLBACK TRAN;
        END;
        SET @MaBienBan = NULL;
        SET @MaLoi = -99;
        SET @ThongBao = N'Lỗi hệ thống: ' + ERROR_MESSAGE()
                        + N' (Line ' + CAST(ERROR_LINE() AS NVARCHAR) + N')';
    END CATCH;
END;
GO

-- ------------------------------------------------------------
-- SP06 – SP_LayKetQuaLapBienBanBanGiao
-- Màn hình: Popup kết quả lập thành công
-- Mục đích: Truy xuất các thông tin vừa tạo để hiển thị lên popup thông báo.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_LayKetQuaLapBienBanBanGiao
    @MaBienBan VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        bb.MaBienBan,
        bb.MaHopDong,
        nd.HoTen AS HoTenKhachHang,
        p.TenPhong,
        -- Danh sách giường thuê
        ISNULL(STRING_AGG(ctdc.MaGiuong, ', ') WITHIN GROUP (ORDER BY ctdc.MaGiuong), N'Nguyên phòng') AS DanhSachGiuong,
        bb.NgayBanGiao,
        bb.LoaiBanGiao,
        p.TinhTrang AS TrangThaiPhong,
        (SELECT COUNT(*) FROM ChiTietBanGiao WHERE MaBienBan = bb.MaBienBan) AS SoTaiSanBanGiao
    FROM BienBanBanGiao bb
    JOIN HopDongThue hd ON hd.MaHopDong = bb.MaHopDong
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON p.MaPhong = ctdc.MaPhong
    WHERE bb.MaBienBan = @MaBienBan
    GROUP BY 
        bb.MaBienBan, bb.MaHopDong, nd.HoTen, p.TenPhong, 
        bb.NgayBanGiao, bb.LoaiBanGiao, p.TinhTrang;
END;
GO

-- ------------------------------------------------------------
-- SP07 – SP_LayChiTietBienBanBanGiao
-- Màn hình: Xem lại chi tiết biên bản bàn giao
-- Mục đích: Lấy đầy đủ thông tin để hiển thị lại giao diện biên bản đã ký.
-- Output:   5 Result sets
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE SP_LayChiTietBienBanBanGiao
    @MaBienBan VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- [Result Set 1] Thông tin biên bản
    SELECT 
        bb.MaBienBan,
        bb.NgayBanGiao,
        bb.LoaiBanGiao,
        bb.MaHopDong,
        bb.MaNhanVienQuanLy,
        nd.HoTen AS HoTenNhanVienQuanLy,
        bb.GhiChuChung,
        bb.KhachCoMat,
        bb.DaKyBienBan,
        bb.TrangThai
    FROM BienBanBanGiao bb
    LEFT JOIN NhanVien nv ON nv.MaNhanVien = bb.MaNhanVienQuanLy
    LEFT JOIN NguoiDung nd ON nd.MaNguoiDung = nv.MaNhanVien
    WHERE bb.MaBienBan = @MaBienBan;

    -- Tìm mã hợp đồng và mã phiếu cọc
    DECLARE @MaHopDong VARCHAR(6), @MaPhieuCoc VARCHAR(6), @HinhThucThue NVARCHAR(20);
    SELECT 
        @MaHopDong = MaHopDong,
        @MaPhieuCoc = MaPhieuCoc
    FROM HopDongThue 
    WHERE MaHopDong = (SELECT MaHopDong FROM BienBanBanGiao WHERE MaBienBan = @MaBienBan);

    SELECT @HinhThucThue = HinhThucThue FROM PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuCoc;

    -- [Result Set 2] Thông tin hợp đồng và khách thuê
    SELECT 
        hd.MaHopDong,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        kh.CCCD,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.GiaThue,
        hd.KyThanhToan,
        hd.TrangThai AS TrangThaiHopDong
    FROM HopDongThue hd
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE hd.MaHopDong = @MaHopDong;

    -- [Result Set 3] Thông tin phòng/giường
    SELECT DISTINCT
        p.MaPhong,
        p.TenPhong,
        ISNULL(STRING_AGG(ctdc.MaGiuong, ', ') WITHIN GROUP (ORDER BY ctdc.MaGiuong), N'Nguyên phòng') AS MaGiuong,
        ISNULL(STRING_AGG(g.TinhTrang, ', ') WITHIN GROUP (ORDER BY ctdc.MaGiuong), N'Nguyên phòng') AS TinhTrangGiuong,
        cn.TenChiNhanh
    FROM HopDongThue hd
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON p.MaPhong = ctdc.MaPhong
    JOIN ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    LEFT JOIN Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    WHERE hd.MaHopDong = @MaHopDong
    GROUP BY p.MaPhong, p.TenPhong, cn.TenChiNhanh;

    -- [Result Set 4] Thành viên cư trú
    SELECT 
        MaThanhVien,
        HoTen,
        SDT,
        CCCD,
        TrangThai
    FROM ThanhVienHopDong
    WHERE MaHopDong = @MaHopDong;

    -- [Result Set 5] Chi tiết tài sản bàn giao
    SELECT 
        ctbg.MaTaiSan,
        ts.TenTaiSan,
        ctbg.MaPhong,
        calc.SoLuongHeThong,
        ctbg.SoLuongThucTe,
        (ctbg.SoLuongThucTe - calc.SoLuongHeThong) AS ChenhLech,
        ts.DonGia,
        ctbg.GhiChu
    FROM ChiTietBanGiao ctbg
    JOIN TaiSan ts ON ts.MaPhong = ctbg.MaPhong AND ts.MaTaiSan = ctbg.MaTaiSan
    CROSS APPLY (
        SELECT CASE 
            WHEN @HinhThucThue = N'Ghép giường' AND (
                ts.TenTaiSan LIKE N'%Giường%' 
             OR ts.TenTaiSan LIKE N'%Nệm%' 
             OR ts.TenTaiSan LIKE N'%Tủ cá nhân%' 
             OR ts.TenTaiSan LIKE N'%Bàn học%' 
             OR ts.TenTaiSan LIKE N'%Khóa%' 
             OR ts.TenTaiSan LIKE N'%Thẻ%' 
             OR ts.TenTaiSan LIKE N'%Ghế%'
            ) THEN 1
            ELSE ts.SoLuong
        END AS SoLuongHeThong
    ) calc
    WHERE ctbg.MaBienBan = @MaBienBan
    ORDER BY ctbg.MaTaiSan;
END;
GO
