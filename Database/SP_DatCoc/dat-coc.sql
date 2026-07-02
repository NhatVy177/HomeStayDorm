USE [HOMEDORM4];
GO

-- Cần cho việc tạo SP có INSERT vào bảng có filtered index (ChiTietDatCoc).
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhieuDatCoc', N'U') IS NULL
    THROW 50200, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước khi chạy dat-coc.sql.', 1;
GO

-- ============================================================
-- SP_NhaChoCocHetHan — nhả 'Giữ chỗ' về 'Trống' cho các phiếu cọc quá hạn 24h
-- (đồng thời đặt phiếu sang 'Hết hạn' + 'Đã hủy'). Gọi ở DC03/DC04/DC05.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_NhaChoCocHetHan
AS
BEGIN
    SET NOCOUNT ON;

    -- Ghi nhận các phòng bị ảnh hưởng TRƯỚC khi nhả (để mở khóa giới tính sau).
    DECLARE @PhongAnhHuong TABLE (MaPhong VARCHAR(4) PRIMARY KEY);
    INSERT INTO @PhongAnhHuong (MaPhong)
    SELECT DISTINCT c.MaPhong
    FROM dbo.ChiTietDatCoc AS c
    INNER JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE();

    UPDATE g SET g.TinhTrang = N'Trống'
    FROM dbo.Giuong AS g
    INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = g.MaPhong AND c.MaGiuong = g.MaGiuong
    INNER JOIN dbo.PhieuDatCoc  AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE()
      AND g.TinhTrang = N'Giữ chỗ';

    UPDATE p SET p.TinhTrang = N'Trống'
    FROM dbo.Phong AS p
    INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = p.MaPhong AND c.MaGiuong IS NULL
    INNER JOIN dbo.PhieuDatCoc  AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE()
      AND p.TinhTrang = N'Giữ chỗ';

    UPDATE dbo.PhieuDatCoc
    SET TrangThaiThanhToan = N'Hết hạn', TrangThaiCoc = N'Đã hủy'
    WHERE TrangThaiThanhToan = N'Chờ TT' AND ThoiHanThanhToan < GETDATE();

    -- MỞ KHÓA GIỚI TÍNH: phòng nào không còn giường nào bị giữ/đặt cọc/đang thuê
    -- thì trả về 'Không phân biệt' (mô hình KPB-mặc-định, chỉ khóa khi có người giữ).
    UPDATE p SET p.GioiTinhChoPhep = N'Không phân biệt'
    FROM dbo.Phong AS p
    INNER JOIN @PhongAnhHuong AS a ON a.MaPhong = p.MaPhong
    WHERE p.GioiTinhChoPhep <> N'Không phân biệt'
      AND NOT EXISTS (
          SELECT 1 FROM dbo.Giuong AS g
          WHERE g.MaPhong = p.MaPhong AND g.TinhTrang <> N'Trống'
      );
END;
GO

-- ============================================================
-- SP_DanhSachDatCocSale
-- Trả về PhieuDangKy ở các giai đoạn cọc kèm thông tin phiếu.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachDatCocSale', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachDatCocSale AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachDatCocSale
    @MaNhanVienSale VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdk.MaDangKy            AS maDangKy,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        pdk.TrangThai           AS trangThaiDangKy,
        pdc.HinhThucThue        AS hinhThucThue,
        pdk.SoNguoiDuKienO      AS soNguoiDuKienO,
        pdk.SoNam               AS soNam,
        pdk.SoNu                AS soNu,
        pdk.NgayDangKy          AS ngayDangKy,
        pdk.GhiChuSale          AS ghiChuSale,   -- lý do từ chối (khi trạng thái = 'Từ chối')
        phong.maPhong,
        phong.tenPhong,
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1
            ctxp.MaPhong    AS maPhong,
            p.TenPhong      AS tenPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
        WHERE ctxp.MaDangKy = pdk.MaDangKy
        ORDER BY ctxp.STTLich DESC
    ) AS phong
    OUTER APPLY (
        SELECT TOP 1
            MaPhieuDatCoc,
            HinhThucThue,
            TrangThaiThanhToan,
            TrangThaiCoc,
            SoTienCoc,
            ThoiDiemDatCoc
        FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = pdk.MaDangKy
        ORDER BY ThoiDiemDatCoc DESC
    ) AS pdc
    WHERE pdk.TrangThai IN (N'Chờ tiếp nhận', N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối')
      AND (
        pdk.TrangThai = N'Chờ tiếp nhận'
        OR pdk.MaNhanVienSale = @MaNhanVienSale
      )
    -- Sắp theo thời gian (mới nhất trước) làm mặc định; việc phân nhóm trạng thái
    -- và đổi chiều sắp xếp do frontend đảm nhận (chip lọc + sort).
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

-- ============================================================
-- SP_GuiYeuCauDatCoc
-- Sale chuyển PhieuDangKy từ "Chờ tiếp nhận" → "Chờ xác nhận cọc".
-- ============================================================
IF OBJECT_ID(N'dbo.SP_GuiYeuCauDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_GuiYeuCauDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

-- ============================================================
-- SP_DanhSachChoXacNhanCoc
-- Danh sách PhieuDangKy đang chờ Quản lý xác nhận khả năng nhận cọc.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoXacNhanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoXacNhanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoXacNhanCoc
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdk.MaDangKy        AS maDangKy,
        nd.HoTen            AS hoTen,
        nd.SDT              AS soDienThoai,
        pdk.NgayDangKy      AS ngayDangKy,
        pdk.TrangThai       AS trangThai,      -- để frontend tô badge + phân nhóm
        pdk.GhiChuSale      AS ghiChuSale,     -- lý do (khi trạng thái = 'Từ chối')
        pdk.MaNhanVienSale  AS maNhanVienSale,
        pdk.SoNam           AS soNam,
        pdk.SoNu            AS soNu,
        pdk.SoNguoiDuKienO  AS soNguoiDuKienO,
        CASE WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 THEN 1 ELSE 0 END AS khacGioi,
        phong.maPhong,
        p.TenPhong          AS tenPhong,
        p.GioiTinhChoPhep   AS gioiTinhChoPhep,
        p.TinhTrang         AS tinhTrangPhong,
        lp.SucChuaToiDa     AS sucChuaToiDa,
        (SELECT COUNT(*) FROM dbo.Giuong g
         WHERE g.MaPhong = phong.maPhong AND g.TinhTrang = N'Trống') AS soChoTrong
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 ctxp.MaPhong AS maPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = pdk.MaDangKy
        ORDER BY ctxp.STTLich DESC
    ) AS phong
    LEFT JOIN dbo.Phong     AS p  ON p.MaPhong      = phong.maPhong
    LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    -- Gồm phiếu chờ duyệt + đã xử lý (để Quản lý vẫn xem lại sau khi bấm);
    -- việc phân nhóm/đổi chiều sắp xếp do frontend đảm nhận.
    WHERE pdk.TrangThai IN (N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối')
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

-- ============================================================
-- SP_XacNhanKhaNangNhanCoc
-- Quản lý chấp nhận hoặc từ chối yêu cầu đặt cọc.
-- Khi chấp nhận: SP tự kiểm tra phòng/giường phải còn khả dụng.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_XacNhanKhaNangNhanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_XacNhanKhaNangNhanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_XacNhanKhaNangNhanCoc
    @MaDangKy    VARCHAR(6),
    @MaQuanLy    VARCHAR(6),
    @DuocNhanCoc BIT,
    @LyDo        NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50204, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chờ xác nhận cọc'
    )
        THROW 50205, N'Phiếu đăng ký không ở trạng thái "Chờ xác nhận cọc".', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaQuanLy)
        THROW 50206, N'Không tìm thấy nhân viên quản lý.', 1;

    IF @DuocNhanCoc = 0 AND NULLIF(LTRIM(RTRIM(COALESCE(@LyDo, N''))), N'') IS NULL
        THROW 50207, N'Vui lòng nhập lý do từ chối.', 1;

    IF @DuocNhanCoc = 1
    BEGIN
        DECLARE @MaPhong VARCHAR(4);
        SELECT TOP 1 @MaPhong = ctxp.MaPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = @MaDangKy
        ORDER BY ctxp.STTLich DESC;

        IF @MaPhong IS NULL
            THROW 50208, N'Hồ sơ chưa có thông tin phòng. Cần có lịch xem phòng trước khi duyệt.', 1;

        DECLARE @SoNam INT, @SoNu INT, @SoNguoi INT, @SucChua INT, @SoChoTrong INT, @TongGiuong INT;
        SELECT @SoNam = ISNULL(SoNam, 0), @SoNu = ISNULL(SoNu, 0), @SoNguoi = SoNguoiDuKienO
        FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy;

        SELECT @SucChua = lp.SucChuaToiDa
        FROM dbo.Phong p JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        WHERE p.MaPhong = @MaPhong;

        SELECT @TongGiuong = COUNT(*),
               @SoChoTrong = SUM(CASE WHEN TinhTrang = N'Trống' THEN 1 ELSE 0 END)
        FROM dbo.Giuong WHERE MaPhong = @MaPhong;

        IF @SoNam > 0 AND @SoNu > 0
        BEGIN
            -- Nhóm khác giới: buộc thuê nguyên phòng -> phòng phải trống hoàn toàn
            IF @SoChoTrong < @TongGiuong
                THROW 50209, N'Nhóm có cả nam và nữ phải thuê nguyên phòng: phòng chưa hoàn toàn trống.', 1;
            IF @SoNguoi > @SucChua
                THROW 50209, N'Số người dự kiến ở vượt quá sức chứa của phòng.', 1;
        END
        ELSE
        BEGIN
            -- Nhóm cùng giới: đủ chỗ trống cho cả nhóm là được
            IF @SoNguoi > @SoChoTrong
                THROW 50209, N'Phòng không đủ chỗ trống cho số người dự kiến ở.', 1;

            -- Phòng đã khóa sang giới khác thì nhóm cùng giới này không xếp được
            -- (ghép thì sai giới, nguyên phòng thì phòng không trống).
            DECLARE @GioiTinhPhongXN NVARCHAR(20), @GioiTinhNhomXN NVARCHAR(5);
            SELECT @GioiTinhPhongXN = GioiTinhChoPhep FROM dbo.Phong WHERE MaPhong = @MaPhong;
            SET @GioiTinhNhomXN = CASE WHEN @SoNam > 0 THEN N'Nam' ELSE N'Nữ' END;
            IF @GioiTinhPhongXN <> N'Không phân biệt' AND @GioiTinhPhongXN <> @GioiTinhNhomXN
                THROW 50209, N'Phòng đã được giữ cho giới tính khác, không thể xếp nhóm này.', 1;
        END
    END

    UPDATE dbo.PhieuDangKy
    SET TrangThai  = CASE WHEN @DuocNhanCoc = 1 THEN N'Xác nhận cọc' ELSE N'Từ chối' END,
        -- Lưu lý do khi từ chối để Sale xem lại; duyệt thì giữ nguyên ghi chú cũ.
        GhiChuSale = CASE WHEN @DuocNhanCoc = 0 THEN @LyDo ELSE GhiChuSale END
    WHERE MaDangKy = @MaDangKy;

    SELECT
        pdk.MaDangKy    AS maDangKy,
        nd.HoTen        AS hoTen,
        pdk.TrangThai   AS trangThaiDangKy
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE pdk.MaDangKy = @MaDangKy;
END;
GO

-- ============================================================
-- SP_DanhSachChoLapPhieuDatCoc
-- Danh sách PhieuDangKy đã được Quản lý chấp nhận, chưa có PhieuDatCoc.
-- Kế toán dùng danh sách này để lập phiếu.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoLapPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoLapPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
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
-- SP_DanhSachChoLapPhieuDatCoc — trả cả 2 giá + số chỗ trống để form tính tiền
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoLapPhieuDatCoc
AS
BEGIN
    SET NOCOUNT ON;

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
        lp.GiaThueNguyenPhong AS giaThueNguyenPhong,
        lp.GiaThueTheoGiuong  AS giaThueTheoGiuong,
        (SELECT COUNT(*) FROM dbo.Giuong g
         WHERE g.MaPhong = phong.maPhong AND g.TinhTrang = N'Trống') AS soChoTrong,
        -- Trạng thái xử lý phía kế toán + thông tin phiếu cọc (nếu đã lập)
        CASE WHEN pdc.MaPhieuDatCoc IS NULL THEN N'Chờ lập' ELSE N'Đã lập' END AS trangThai,
        pdc.MaPhieuDatCoc      AS maPhieuDatCoc,
        pdc.SoTienCoc          AS soTienCocPhieu,
        pdc.TrangThaiThanhToan AS trangThaiThanhToan,
        pdc.HinhThucThue       AS hinhThucThuePhieu,
        pdc.ThoiDiemDatCoc     AS thoiDiemDatCoc
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang  AS kh ON kh.MaKhachHang  = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung  AS nd ON nd.MaNguoiDung   = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 ctxp.MaPhong AS maPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = pdk.MaDangKy
        ORDER BY ctxp.STTLich DESC
    ) AS phong
    OUTER APPLY (
        SELECT TOP 1 MaPhieuDatCoc, SoTienCoc, TrangThaiThanhToan, HinhThucThue, ThoiDiemDatCoc
        FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = pdk.MaDangKy
        ORDER BY ThoiDiemDatCoc DESC
    ) AS pdc
    LEFT JOIN dbo.Phong     AS p  ON p.MaPhong       = phong.maPhong
    LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong  = p.MaLoaiPhong
    -- Gồm hồ sơ chờ lập + đã lập (để kế toán vẫn thấy phiếu cũ); phân nhóm/sort do frontend lo.
    WHERE pdk.TrangThai = N'Xác nhận cọc'
    ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
END;
GO

-- ============================================================
-- SP_LapPhieuDatCoc
-- Kế toán tạo PhieuDatCoc + ChiTietDatCoc cho hồ sơ đã được chấp nhận.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_LapPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_LapPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_LapPhieuDatCoc
    @MaDangKy            VARCHAR(6),
    @MaNhanVienKeToan    VARCHAR(6),
    @SoTienCoc           DECIMAL(15,2),          -- bỏ qua: cọc tự tính = tổng giá thuê × 2 (khớp trigger)
    @PhuongThucThanhToan NVARCHAR(20),
    @DanhSachGiuong      NVARCHAR(MAX) = NULL,   -- CSV mã giường 'G01,G02' (ghép); NULL/'' = nguyên phòng
    @ThoiHanThanhToan    DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan; -- dọn phiếu quá hạn (nhả 'Giữ chỗ') trước khi lập mới

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50210, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Xác nhận cọc'
    )
        THROW 50211, N'Phiếu đăng ký chưa được quản lý chấp nhận.', 1;

    IF EXISTS (
        SELECT 1 FROM dbo.PhieuDatCoc
        WHERE MaPhieuYeuCauDangKy = @MaDangKy
    )
        THROW 50212, N'Hồ sơ này đã có phiếu đặt cọc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienKeToan)
        THROW 50213, N'Không tìm thấy nhân viên kế toán.', 1;

    -- Thông tin hồ sơ (số nam/nữ để xác định hình thức thuê)
    DECLARE @MaKhachHang VARCHAR(6), @SoNam INT, @SoNu INT, @SoNguoi INT;
    SELECT @MaKhachHang = MaKhachHang, @SoNam = ISNULL(SoNam, 0),
           @SoNu = ISNULL(SoNu, 0), @SoNguoi = SoNguoiDuKienO
    FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy;

    -- Phòng khách đã xem (ChiTietXemPhong chỉ còn phòng, KHÔNG còn giường)
    DECLARE @MaPhong VARCHAR(4);
    SELECT TOP 1 @MaPhong = ctxp.MaPhong
    FROM dbo.ChiTietXemPhong AS ctxp
    WHERE ctxp.MaDangKy = @MaDangKy
    ORDER BY ctxp.STTLich DESC;
    IF @MaPhong IS NULL
        THROW 50214, N'Hồ sơ chưa có thông tin phòng.', 1;

    -- Tách danh sách giường (CSV) -> bảng tạm
    DECLARE @Giuongs TABLE (MaGiuong VARCHAR(3) PRIMARY KEY);
    IF @DanhSachGiuong IS NOT NULL AND LTRIM(RTRIM(@DanhSachGiuong)) <> N''
        INSERT INTO @Giuongs (MaGiuong)
        SELECT DISTINCT LTRIM(RTRIM(value))
        FROM STRING_SPLIT(@DanhSachGiuong, ',')
        WHERE LTRIM(RTRIM(value)) <> N'';

    DECLARE @SoGiuongChon INT = (SELECT COUNT(*) FROM @Giuongs);
    DECLARE @LaGhep   BIT = CASE WHEN @SoGiuongChon > 0 THEN 1 ELSE 0 END;
    DECLARE @KhacGioi BIT = CASE WHEN @SoNam > 0 AND @SoNu > 0 THEN 1 ELSE 0 END;
    DECLARE @GioiTinhNhom NVARCHAR(5) = CASE WHEN @SoNam > 0 THEN N'Nam' ELSE N'Nữ' END;

    -- Thông tin loại phòng
    DECLARE @SucChua INT, @GiaGiuong DECIMAL(15,2), @GiaNguyenPhong DECIMAL(15,2),
            @GioiTinhPhong NVARCHAR(20);
    SELECT @SucChua = lp.SucChuaToiDa, @GiaGiuong = lp.GiaThueTheoGiuong,
           @GiaNguyenPhong = lp.GiaThueNguyenPhong, @GioiTinhPhong = p.GioiTinhChoPhep
    FROM dbo.Phong p JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaPhong = @MaPhong;

    DECLARE @HinhThucThueDC NVARCHAR(20), @GiaThueDong DECIMAL(15,2);

    IF @LaGhep = 1
    BEGIN
        -- ===== GHÉP GIƯỜNG (chỉ cho nhóm cùng giới) =====
        IF @KhacGioi = 1
            THROW 50216, N'Nhóm có cả nam và nữ chỉ được thuê nguyên phòng, không thể ghép giường.', 1;
        IF @SoGiuongChon <> @SoNguoi
            THROW 50217, N'Số giường chọn phải bằng số người dự kiến ở.', 1;
        -- Luật KPB: phòng 'Không phân biệt' cho ghép & sẽ bị khóa sang giới của nhóm.
        -- Chỉ chặn khi phòng đã khóa sang giới KHÁC nhóm.
        IF @GioiTinhPhong <> N'Không phân biệt' AND @GioiTinhPhong <> @GioiTinhNhom
            THROW 50218, N'Phòng đã được giữ cho giới tính khác, không thể ghép giường nhóm này.', 1;
        IF EXISTS (
            SELECT 1 FROM @Giuongs g
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.Giuong gi
                WHERE gi.MaPhong = @MaPhong AND gi.MaGiuong = g.MaGiuong AND gi.TinhTrang = N'Trống'
            )
        )
            THROW 50215, N'Có giường không tồn tại trong phòng hoặc không còn trống.', 1;

        SET @HinhThucThueDC = N'Ghép giường';
        SET @GiaThueDong    = @GiaGiuong;
    END
    ELSE
    BEGIN
        -- ===== NGUYÊN PHÒNG =====
        IF EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Trống')
            THROW 50215, N'Phòng chưa hoàn toàn trống, không thể thuê nguyên phòng.', 1;
        IF @SoNguoi > @SucChua
            THROW 50219, N'Số người dự kiến ở vượt quá sức chứa của phòng.', 1;

        SET @HinhThucThueDC = N'Nguyên phòng';
        SET @GiaThueDong    = @GiaNguyenPhong;
    END

    -- Cọc = 2 tháng tiền thuê (tự tính cho khớp trigger; KHÔNG dùng @SoTienCoc kế toán nhập)
    DECLARE @SoTienCocTinh DECIMAL(15,2) =
        @GiaThueDong * (CASE WHEN @LaGhep = 1 THEN @SoGiuongChon ELSE 1 END) * 2;

    IF @ThoiHanThanhToan IS NULL
        SET @ThoiHanThanhToan = DATEADD(HOUR, 24, GETDATE());

    DECLARE @MaPhieuDatCoc VARCHAR(6);

    BEGIN TRY
        BEGIN TRAN;

        -- Sinh mã phiếu cọc (tiền tố 'DC' khớp seed data.sql)
        SELECT @MaPhieuDatCoc = 'DC' + RIGHT('0000' + CAST(
            ISNULL(MAX(CAST(SUBSTRING(MaPhieuDatCoc, 3, 4) AS INT)), 0) + 1 AS VARCHAR(10)), 4)
        FROM dbo.PhieuDatCoc;

        INSERT INTO dbo.PhieuDatCoc (
            MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
            PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue,
            TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
        ) VALUES (
            @MaPhieuDatCoc, GETDATE(), @ThoiHanThanhToan, @SoTienCocTinh,
            @PhuongThucThanhToan, N'Chờ TT', @HinhThucThueDC,
            N'Hiệu lực', @MaDangKy, @MaKhachHang, @MaNhanVienKeToan
        );

        -- ChiTietDatCoc (tiền tố 'CD' khớp seed data.sql)
        DECLARE @Base INT = (SELECT ISNULL(MAX(CAST(SUBSTRING(MaChiTietDC, 3, 4) AS INT)), 0)
                             FROM dbo.ChiTietDatCoc);

        IF @LaGhep = 1
        BEGIN
            -- mỗi giường một dòng
            INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
            SELECT 'CD' + RIGHT('0000' + CAST(@Base + ROW_NUMBER() OVER (ORDER BY g.MaGiuong) AS VARCHAR(10)), 4),
                   @MaPhieuDatCoc, @MaPhong, g.MaGiuong, @GiaThueDong
            FROM @Giuongs g;

            UPDATE dbo.Giuong SET TinhTrang = N'Giữ chỗ'
            WHERE MaPhong = @MaPhong AND MaGiuong IN (SELECT MaGiuong FROM @Giuongs);

            -- KHÓA GIỚI TÍNH: ghép vào phòng 'Không phân biệt' -> phòng thành giới của nhóm.
            IF @GioiTinhPhong = N'Không phân biệt'
                UPDATE dbo.Phong SET GioiTinhChoPhep = @GioiTinhNhom
                WHERE MaPhong = @MaPhong AND GioiTinhChoPhep = N'Không phân biệt';
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
            VALUES ('CD' + RIGHT('0000' + CAST(@Base + 1 AS VARCHAR(10)), 4),
                    @MaPhieuDatCoc, @MaPhong, NULL, @GiaThueDong);

            -- giữ chỗ cả phòng + toàn bộ giường trong phòng
            UPDATE dbo.Phong  SET TinhTrang = N'Giữ chỗ' WHERE MaPhong = @MaPhong;
            UPDATE dbo.Giuong SET TinhTrang = N'Giữ chỗ' WHERE MaPhong = @MaPhong;
        END

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;
    END CATCH

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS thoiHanThanhToan,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        nd.HoTen                AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;
END;
GO

-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_GuiYeuCauDatCoc
    @MaDangKy       VARCHAR(6),
    @MaNhanVienSale VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50201, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chờ tiếp nhận'
    )
        THROW 50202, N'Phiếu đăng ký không ở trạng thái "Chờ tiếp nhận".', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienSale)
        THROW 50203, N'Không tìm thấy nhân viên sale.', 1;

    UPDATE dbo.PhieuDangKy
    SET TrangThai      = N'Chờ xác nhận cọc',
        MaNhanVienSale = @MaNhanVienSale
    WHERE MaDangKy = @MaDangKy;

    SELECT
        pdk.MaDangKy    AS maDangKy,
        nd.HoTen        AS hoTen,
        pdk.TrangThai   AS trangThaiDangKy
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE pdk.MaDangKy = @MaDangKy;
END;
GO

-- ============================================================
-- DC04 - SP_DanhSachChoGhiNhanChungTu
-- Danh sách phiếu đặt cọc "Chờ TT" còn hạn 24h, cho Sale/khách ghi nhận chứng từ.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoGhiNhanChungTu', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoGhiNhanChungTu AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoGhiNhanChungTu
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        p.TenPhong              AS tenPhong,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS thoiHanThanhToan,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.ChungTuThanhToan    AS chungTuThanhToan
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctdc
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    -- Gồm phiếu chờ TT (đang xử lý) + đã TT + hết hạn (để Sale xem lại lịch sử);
    -- frontend tự phân nhóm/lọc/sort.
    WHERE pdc.TrangThaiThanhToan IN (N'Chờ TT', N'Đã TT', N'Hết hạn')
    ORDER BY pdc.ThoiHanThanhToan DESC;
END;
GO

-- ============================================================
-- DC04 - SP_CapNhatMinhChungThanhToanCoc
-- Sale/khách ghi nhận chứng từ thanh toán; giữ nguyên TrangThaiThanhToan = 'Chờ TT'.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_CapNhatMinhChungThanhToanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_CapNhatMinhChungThanhToanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_CapNhatMinhChungThanhToanCoc
    @PhieuId          NVARCHAR(30),
    @ChungTuThanhToan NVARCHAR(500),
    @GhiChu           NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ma VARCHAR(6) = CAST(@PhieuId AS VARCHAR(6));

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma)
        THROW 50220, N'Không tìm thấy phiếu đặt cọc.', 1;

    DECLARE @TrangThai NVARCHAR(20), @ThoiHan DATETIME;
    SELECT @TrangThai = TrangThaiThanhToan, @ThoiHan = ThoiHanThanhToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma;

    IF @TrangThai <> N'Chờ TT'
        THROW 50221, N'Phiếu đặt cọc không ở trạng thái "Chờ TT".', 1;

    IF @ThoiHan < GETDATE()
    BEGIN
        EXEC dbo.SP_NhaChoCocHetHan; -- nhả 'Giữ chỗ' về 'Trống' + đặt phiếu 'Hết hạn'
        THROW 50222, N'Phiếu đặt cọc đã hết hạn thanh toán 24 giờ và bị hủy tự động.', 1;
    END

    IF NULLIF(LTRIM(RTRIM(COALESCE(@ChungTuThanhToan, N''))), N'') IS NULL
        THROW 50223, N'Thiếu file chứng từ thanh toán.', 1;

    UPDATE dbo.PhieuDatCoc
    SET ChungTuThanhToan = CAST(@ChungTuThanhToan AS VARCHAR(500))
    WHERE MaPhieuDatCoc = @Ma;

    SELECT
        pdc.MaPhieuDatCoc      AS maPhieuDatCoc,
        pdc.TrangThaiThanhToan AS trangThaiThanhToan,
        pdc.ChungTuThanhToan   AS chungTuThanhToan,
        nd.HoTen               AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @Ma;
END;
GO

-- ============================================================
-- DC05 - SP_DanhSachChoXacNhanThanhToan
-- Danh sách phiếu "Chờ TT" đã có chứng từ, cho Quản lý đối chiếu & xác nhận.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoXacNhanThanhToan', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoXacNhanThanhToan AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoXacNhanThanhToan
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        p.TenPhong              AS tenPhong,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS thoiHanThanhToan,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.ChungTuThanhToan    AS chungTuThanhToan
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctdc
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    -- Chờ xác nhận (Chờ TT + đã có chứng từ) + lịch sử (Đã TT / Hết hạn); frontend lọc/sort.
    WHERE (pdc.TrangThaiThanhToan = N'Chờ TT'
           AND pdc.ChungTuThanhToan IS NOT NULL
           AND LTRIM(RTRIM(pdc.ChungTuThanhToan)) <> '')
       OR pdc.TrangThaiThanhToan IN (N'Đã TT', N'Hết hạn')
    ORDER BY pdc.ThoiHanThanhToan DESC;
END;
GO

-- ============================================================
-- DC05 - SP_XacNhanThanhToanCoc
-- Quản lý xác nhận (Đã TT + phòng/giường 'Đã đặt cọc') hoặc từ chối (giữ 'Chờ TT').
-- ============================================================
IF OBJECT_ID(N'dbo.SP_XacNhanThanhToanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_XacNhanThanhToanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_XacNhanThanhToanCoc
    @PhieuId                  NVARCHAR(30),
    @HopLe                    BIT,
    @GhiChu                   NVARCHAR(MAX) = NULL,
    @QuanLyXacNhanThanhToanId NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ma VARCHAR(6) = CAST(@PhieuId AS VARCHAR(6));

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma)
        THROW 50230, N'Không tìm thấy phiếu đặt cọc.', 1;

    DECLARE @TrangThai NVARCHAR(20), @ThoiHan DATETIME, @ChungTu VARCHAR(500);
    SELECT @TrangThai = TrangThaiThanhToan, @ThoiHan = ThoiHanThanhToan, @ChungTu = ChungTuThanhToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma;

    IF @TrangThai <> N'Chờ TT'
        THROW 50231, N'Phiếu đặt cọc không ở trạng thái "Chờ TT".', 1;

    IF @ThoiHan < GETDATE()
    BEGIN
        EXEC dbo.SP_NhaChoCocHetHan; -- nhả 'Giữ chỗ' về 'Trống' + đặt phiếu 'Hết hạn'
        THROW 50234, N'Phiếu đặt cọc đã hết hạn thanh toán và bị hủy tự động.', 1;
    END

    IF @ChungTu IS NULL OR LTRIM(RTRIM(@ChungTu)) = ''
        THROW 50232, N'Phiếu chưa có chứng từ thanh toán để xác nhận.', 1;

    IF @HopLe = 0 AND NULLIF(LTRIM(RTRIM(COALESCE(@GhiChu, N''))), N'') IS NULL
        THROW 50233, N'Vui lòng nhập lý do từ chối.', 1;

    IF @HopLe = 1
    BEGIN
        DECLARE @MaPhong VARCHAR(4), @MaGiuong VARCHAR(3);
        SELECT TOP 1 @MaPhong = MaPhong, @MaGiuong = MaGiuong
        FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @Ma;

        BEGIN TRY
            BEGIN TRAN;
                UPDATE dbo.PhieuDatCoc
                SET TrangThaiThanhToan = N'Đã TT', ThoiGianXacNhanTT = GETDATE()
                WHERE MaPhieuDatCoc = @Ma;

                IF @MaGiuong IS NOT NULL
                    UPDATE dbo.Giuong SET TinhTrang = N'Đã đặt cọc'
                    WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong;
                ELSE IF @MaPhong IS NOT NULL
                    UPDATE dbo.Phong SET TinhTrang = N'Đã đặt cọc'
                    WHERE MaPhong = @MaPhong;
            COMMIT;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW;
        END CATCH
    END
    -- @HopLe = 0: giữ nguyên 'Chờ TT' để khách cung cấp lại chứng từ.

    SELECT
        pdc.MaPhieuDatCoc      AS maPhieuDatCoc,
        pdc.TrangThaiThanhToan AS trangThaiThanhToan,
        pdc.ThoiGianXacNhanTT  AS thoiGianXacNhanTT,
        nd.HoTen               AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @Ma;
END;
GO
