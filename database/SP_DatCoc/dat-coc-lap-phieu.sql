USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: DAT COC - LAP PHIEU (Nhan vien Sale) - DC02B
-- =============================================

-- ============================================================
-- SP_DanhSachChoLapPhieuDatCoc
-- Danh sách PhieuDangKy đã được Quản lý chấp nhận, chưa có PhieuDatCoc.
-- Kế toán dùng danh sách này để lập phiếu.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoLapPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoLapPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

-- ============================================================
-- DC02B - SP_DanhSachChoLapPhieuDatCoc
-- Danh sách hồ sơ Quản lý ĐÃ DUYỆT, để SALE lập phiếu đặt cọc.
--
-- TUYỆT ĐỐI KHÔNG TRẢ TIỀN (giá thuê, tiền cọc): Sale không được thấy tiền.
-- Có trả số chỗ trống + sức chứa vì Sale cần chúng để chọn hình thức thuê và giường
-- -- khác với DC01 (chốt phòng), ở đây Quản lý đã xác nhận phòng khả dụng rồi.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoLapPhieuDatCoc
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan;  -- dọn phiếu quá hạn trước khi liệt kê (số chỗ trống mới đúng)

    -- Giới hạn theo chi nhánh của Sale: chỉ thấy hồ sơ của phòng thuộc chi nhánh mình.
    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

    SELECT
        pdk.MaDangKy        AS maDangKy,
        nd.HoTen            AS hoTen,
        nd.SDT              AS soDienThoai,
        pdk.NgayDangKy      AS ngayDangKy,
        pdk.MaKhachHang     AS maKhachHang,
        pdk.SoNam           AS soNam,
        pdk.SoNu            AS soNu,
        pdk.SoNguoiDuKienO  AS soNguoiDuKienO,
        CASE WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 THEN 1 ELSE 0 END AS khacGioi,
        phong.maPhong,
        p.TenPhong            AS tenPhong,
        p.GioiTinhChoPhep     AS gioiTinhChoPhep,
        lp.SucChuaToiDa       AS sucChuaToiDa,
        (SELECT COUNT(*) FROM dbo.Giuong g
         WHERE g.MaPhong = phong.maPhong AND g.TinhTrang = N'Trống') AS soChoTrong,
        -- Trạng thái công việc của Sale + tình trạng phiếu (nếu đã lập)
        CASE
            WHEN pdc.MaPhieuDatCoc      IS NULL THEN N'Chờ lập'
            WHEN pdc.MaNhanVienKeToan   IS NULL THEN N'Chờ kế toán chốt'
            ELSE N'Đã chốt'
        END                     AS trangThai,
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.HinhThucThue        AS hinhThucThuePhieu,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        (SELECT STRING_AGG(CAST(c2.MaGiuong AS NVARCHAR(3)), N', ')
                WITHIN GROUP (ORDER BY c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c2.MaGiuong IS NOT NULL) AS danhSachGiuong
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang  AS kh ON kh.MaKhachHang  = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung  AS nd ON nd.MaNguoiDung   = kh.MaKhachHang
    -- PHÒNG KHÁCH CHỐT (Sale chốt ở DC01, Quản lý duyệt ở DC02)
    OUTER APPLY (
        SELECT TOP 1 ctxp.MaPhong AS maPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = pdk.MaDangKy AND ctxp.KhachChon = 1
    ) AS phong
    -- Chỉ nhìn phiếu CÒN HIỆU LỰC: phiếu đã hủy/hết hạn coi như chưa lập,
    -- để Sale lập lại được (khớp với luật 50212 đã nới trong SP_LapPhieuDatCoc).
    OUTER APPLY (
        SELECT TOP 1 MaPhieuDatCoc, HinhThucThue, ThoiDiemDatCoc,
                     TrangThaiThanhToan, MaNhanVienKeToan
        FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = pdk.MaDangKy AND TrangThaiCoc = N'Hiệu lực'
        ORDER BY ThoiDiemDatCoc DESC
    ) AS pdc
    LEFT JOIN dbo.Phong     AS p  ON p.MaPhong       = phong.maPhong
    LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong  = p.MaLoaiPhong
    WHERE pdk.TrangThai = N'Xác nhận cọc'
      AND (p.MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

-- ============================================================
-- SP_DanhSachGiuongTrong — danh sách giường còn trống của 1 phòng (dropdown chọn giường DC03)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_DanhSachGiuongTrong
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT g.MaGiuong AS maGiuong, g.SoGiuong AS soGiuong, g.TinhTrang AS tinhTrang
    FROM dbo.Giuong AS g
    WHERE g.MaPhong = @MaPhong AND g.TinhTrang = N'Trống'
    ORDER BY g.SoGiuong;
END;
GO

-- ============================================================
-- DC02B - SP_LapPhieuDatCoc
-- SALE lập PhieuDatCoc + ChiTietDatCoc cho hồ sơ đã được Quản lý chấp nhận.
--
-- VÌ SAO LÀ SALE, KHÔNG PHẢI KẾ TOÁN:
--   Hình thức thuê (nguyên phòng / ghép giường) và giường cụ thể là thứ phải TRAO ĐỔI
--   VỚI KHÁCH. Người tiếp xúc khách là Sale, kế toán không gặp khách -> để kế toán tự
--   quyết hai thứ này là sai vai trò.
--
-- SALE KHÔNG THẤY TIỀN:
--   SP này KHÔNG trả SoTienCoc trong recordset. Tiền do kế toán đối soát và chốt ở DC03.
--   (SoTienCoc vẫn được trigger TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc tự tính trong DB,
--    chỉ là không lộ ra cho Sale.)
--
-- PHIẾU CHƯA CHỐT = MaNhanVienKeToan IS NULL.
--   Phiếu ở trạng thái này thì khách CHƯA thanh toán được (xem guard 50275 ở DC04/DC05).
--   ThoiHanThanhToan lúc này là HẠN CHO KẾ TOÁN CHỐT (24h); nếu kế toán quên,
--   SP_NhaChoCocHetHan sẽ tự hủy phiếu và nhả giường -> không giữ chỗ vô thời hạn.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_LapPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_LapPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_LapPhieuDatCoc
    @MaDangKy         VARCHAR(6),
    @MaNhanVienSale   VARCHAR(6),
    @HinhThucThue     NVARCHAR(20),           -- 'Nguyên phòng' | 'Ghép giường' -- Sale chọn cùng khách
    @DanhSachGiuong   NVARCHAR(MAX) = NULL    -- CSV mã giường ('G01,G02'); chỉ dùng khi Ghép giường
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan; -- dọn phiếu quá hạn (nhả 'Giữ chỗ') trước khi lập mới

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50210, N'Không tìm thấy phiếu đăng ký.', 1;

    UPDATE dbo.LichXemPhong
    SET TrangThai = N'Đã xem'
    WHERE MaDangKy = @MaDangKy
      AND TrangThai IN (N'Chờ xem', N'Yêu cầu đổi lịch', N'Yêu cầu hủy')
      AND ThoiGianHen <= GETDATE();

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Xác nhận cọc'
    )
        THROW 50211, N'Phiếu đăng ký chưa được quản lý chấp nhận.', 1;

    -- CHỈ chặn khi hồ sơ đang có phiếu cọc CÒN HIỆU LỰC.
    -- Phiếu cũ đã 'Đã hủy' (kế toán hủy ở DC03, hoặc quá hạn bị SP_NhaChoCocHetHan hủy)
    -- vẫn nằm lại trong bảng. Nếu chặn theo EXISTS thuần thì hồ sơ sẽ KẸT CỨNG vĩnh viễn:
    -- không còn phiếu nào sống mà cũng không lập lại được.
    IF EXISTS (
        SELECT 1 FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = @MaDangKy AND TrangThaiCoc = N'Hiệu lực'
    )
        THROW 50212, N'Hồ sơ này đã có phiếu đặt cọc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienSale)
        THROW 50213, N'Không tìm thấy nhân viên sale.', 1;

    IF @HinhThucThue IS NULL OR @HinhThucThue NOT IN (N'Nguyên phòng', N'Ghép giường')
        THROW 50251, N'Hình thức thuê không hợp lệ (chỉ "Nguyên phòng" hoặc "Ghép giường").', 1;

    -- PHÒNG = PHÒNG KHÁCH CHỐT (Sale chốt ở DC01, Quản lý duyệt ở DC02).
    -- KHÔNG nhận từ client: không thể lập phiếu cho phòng khác phòng đã được duyệt.
    DECLARE @MaPhong VARCHAR(4);
    SELECT TOP 1 @MaPhong = ctxp.MaPhong
    FROM dbo.ChiTietXemPhong AS ctxp
    WHERE ctxp.MaDangKy = @MaDangKy AND ctxp.KhachChon = 1;

    IF @MaPhong IS NULL
        THROW 50214, N'Hồ sơ chưa chốt phòng.', 1;

    -- Thông tin nhóm khách để xét luật giới tính / sức chứa
    DECLARE @MaKhachHang VARCHAR(6), @SoNam INT, @SoNu INT, @SoNguoi INT;
    SELECT @MaKhachHang = MaKhachHang, @SoNam = ISNULL(SoNam, 0),
           @SoNu = ISNULL(SoNu, 0), @SoNguoi = SoNguoiDuKienO
    FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy;

    DECLARE @LaGhep       BIT = CASE WHEN @HinhThucThue = N'Ghép giường' THEN 1 ELSE 0 END;
    DECLARE @KhacGioi     BIT = CASE WHEN @SoNam > 0 AND @SoNu > 0 THEN 1 ELSE 0 END;
    DECLARE @GioiTinhNhom NVARCHAR(5) = CASE WHEN @SoNam > 0 THEN N'Nam' ELSE N'Nữ' END;

    DECLARE @SucChua INT, @TongGiuong INT, @SoChoTrong INT, @GioiTinhPhong NVARCHAR(20);
    SELECT @SucChua = lp.SucChuaToiDa, @GioiTinhPhong = p.GioiTinhChoPhep
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaPhong = @MaPhong;

    SELECT @TongGiuong = COUNT(*),
           @SoChoTrong = SUM(CASE WHEN TinhTrang = N'Trống' THEN 1 ELSE 0 END)
    FROM dbo.Giuong WHERE MaPhong = @MaPhong;

    DECLARE @GiuongChon TABLE (MaGiuong VARCHAR(3) PRIMARY KEY);

    IF @LaGhep = 1
    BEGIN
        -- ===== GHÉP GIƯỜNG =====
        -- Nam và nữ không ở chung một phòng -> nhóm khác giới buộc thuê nguyên phòng.
        IF @KhacGioi = 1
            THROW 50216, N'Nhóm có cả nam và nữ chỉ được thuê nguyên phòng, không thể ghép giường.', 1;

        BEGIN TRY
            INSERT INTO @GiuongChon (MaGiuong)
            SELECT DISTINCT LTRIM(RTRIM(s.value))
            FROM STRING_SPLIT(ISNULL(@DanhSachGiuong, N''), ',') AS s
            WHERE LTRIM(RTRIM(s.value)) <> N'';
        END TRY
        BEGIN CATCH
            THROW 50252, N'Danh sách giường không hợp lệ.', 1;
        END CATCH

        IF NOT EXISTS (SELECT 1 FROM @GiuongChon)
            THROW 50252, N'Chưa chọn giường nào để ghép.', 1;

        -- Số giường phải bằng ĐÚNG số người dự kiến ở
        IF (SELECT COUNT(*) FROM @GiuongChon) <> @SoNguoi
            THROW 50217, N'Số giường chọn phải bằng số người dự kiến ở.', 1;

        -- Mọi giường phải tồn tại trong phòng và đang Trống
        IF EXISTS (
            SELECT 1 FROM @GiuongChon gc
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.Giuong g
                WHERE g.MaPhong = @MaPhong AND g.MaGiuong = gc.MaGiuong AND g.TinhTrang = N'Trống'
            )
        )
            THROW 50215, N'Có giường không tồn tại trong phòng hoặc không còn trống.', 1;

        -- Phòng 'Không phân biệt' ghép được và sẽ bị KHÓA sang giới của nhóm.
        -- Chỉ chặn phòng đã khóa sang giới KHÁC.
        IF @GioiTinhPhong <> N'Không phân biệt' AND @GioiTinhPhong <> @GioiTinhNhom
            THROW 50218, N'Phòng đã được giữ cho giới tính khác, không thể ghép giường nhóm này.', 1;
    END
    ELSE
    BEGIN
        -- ===== NGUYÊN PHÒNG (thuê trọn) =====
        -- Thuê trọn thì KHÔNG xét giới tính phòng (nhóm nam + nữ vẫn được).
        IF @SoChoTrong < @TongGiuong
            THROW 50215, N'Phòng chưa hoàn toàn trống, không thể thuê nguyên phòng.', 1;

        IF @SoNguoi > @SucChua
            THROW 50219, N'Số người dự kiến ở vượt quá sức chứa của phòng.', 1;
    END

    -- Hạn 24h này là hạn CHO KẾ TOÁN CHỐT, chưa phải hạn khách trả tiền.
    -- Khi kế toán chốt ở DC03, SP_ChotPhieuDatCoc sẽ GHI ĐÈ lại = GETDATE() + 24h,
    -- lúc đó mới là đồng hồ của khách.
    DECLARE @ThoiHanThanhToan DATETIME = DATEADD(HOUR, 24, GETDATE());

    DECLARE @MaPhieuDatCoc VARCHAR(6);

    BEGIN TRY
        BEGIN TRAN;

        SELECT @MaPhieuDatCoc = 'DC' + RIGHT('0000' + CAST(
            ISNULL(MAX(CAST(SUBSTRING(MaPhieuDatCoc, 3, 4) AS INT)), 0) + 1 AS VARCHAR(10)), 4)
        FROM dbo.PhieuDatCoc;

        -- SoTienCoc để 0: trigger TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc tự tính
        -- GiaThue từng dòng rồi SUM(GiaThue) * 2.
        -- MaNhanVienKeToan = NULL => phiếu CHƯA ĐƯỢC KẾ TOÁN CHỐT.
        -- PhuongThucThanhToan = NULL => khách tự chọn sau ở DC04.
        INSERT INTO dbo.PhieuDatCoc (
            MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
            PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue,
            TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
        ) VALUES (
            @MaPhieuDatCoc, GETDATE(), @ThoiHanThanhToan, 0,
            NULL, N'Chờ TT', @HinhThucThue,
            N'Hiệu lực', @MaDangKy, @MaKhachHang, NULL
        );

        DECLARE @Base INT = (SELECT ISNULL(MAX(CAST(SUBSTRING(MaChiTietDC, 3, 4) AS INT)), 0)
                             FROM dbo.ChiTietDatCoc);

        IF @LaGhep = 1
        BEGIN
            -- mỗi giường một dòng
            INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
            SELECT 'CD' + RIGHT('0000' + CAST(@Base + ROW_NUMBER() OVER (ORDER BY gc.MaGiuong) AS VARCHAR(10)), 4),
                   @MaPhieuDatCoc, @MaPhong, gc.MaGiuong, 0
            FROM @GiuongChon gc;

            UPDATE g SET g.TinhTrang = N'Giữ chỗ'
            FROM dbo.Giuong AS g
            INNER JOIN @GiuongChon AS gc ON gc.MaGiuong = g.MaGiuong
            WHERE g.MaPhong = @MaPhong;

            -- KHÓA GIỚI TÍNH: phòng 'Không phân biệt' -> khóa sang giới của nhóm
            IF @GioiTinhPhong = N'Không phân biệt'
                UPDATE dbo.Phong SET GioiTinhChoPhep = @GioiTinhNhom WHERE MaPhong = @MaPhong;
        END
        ELSE
        BEGIN
            -- 1 dòng, MaGiuong NULL = thuê trọn phòng
            INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
            VALUES ('CD' + RIGHT('0000' + CAST(@Base + 1 AS VARCHAR(10)), 4),
                    @MaPhieuDatCoc, @MaPhong, NULL, 0);

            -- giữ chỗ toàn bộ giường của phòng
            UPDATE dbo.Giuong SET TinhTrang = N'Giữ chỗ' WHERE MaPhong = @MaPhong;
        END

        EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @MaPhong;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;
    END CATCH

    -- KHÔNG trả SoTienCoc: Sale không được thấy tiền.
    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.HinhThucThue        AS hinhThucThue,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        p.TenPhong              AS tenPhong,
        nd.HoTen                AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    INNER JOIN dbo.Phong     AS p  ON p.MaPhong       = @MaPhong
    WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;
END;
GO
