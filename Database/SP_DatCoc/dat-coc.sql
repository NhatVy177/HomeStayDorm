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

-- Cho phép PhuongThucThanhToan = NULL: kế toán KHÔNG chọn phương thức khi lập phiếu (DC03);
-- khách hàng sẽ chọn phương thức sau (DC04). CHECK cũ vẫn cho qua NULL.
-- Idempotent: chỉ ALTER khi cột đang NOT NULL.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.PhieuDatCoc')
      AND name = 'PhuongThucThanhToan'
      AND is_nullable = 0
)
    ALTER TABLE dbo.PhieuDatCoc ALTER COLUMN PhuongThucThanhToan NVARCHAR(20) NULL;
GO

-- ============================================================
-- SP_CapNhatTinhTrangPhong — suy ra Phong.TinhTrang TỪ trạng thái các Giuong
-- trong phòng (nguồn sự thật duy nhất), thay vì để từng SP tự set tay.
-- Quy tắc (ưu tiên từ trên xuống):
--   1) Còn giường nào 'Giữ chỗ'                        -> 'Giữ chỗ'
--   2) Tất cả giường 'Trống'                           -> 'Trống'
--   3) Không còn giường 'Trống' và không có 'Đang thuê' -> 'Đã đặt cọc' (đã cọc hết, chưa ai dọn vào)
--   4) Không còn giường 'Trống' (có 'Đang thuê')        -> 'Đầy'
--   5) Còn lại (vừa có giường Trống, vừa có giường đã cọc/đang ở) -> 'Còn chỗ'
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_CapNhatTinhTrangPhong
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Tong INT, @Trong INT, @GiuCho INT, @DangThue INT;
    SELECT
        @Tong     = COUNT(*),
        @Trong    = SUM(CASE WHEN TinhTrang = N'Trống'     THEN 1 ELSE 0 END),
        @GiuCho   = SUM(CASE WHEN TinhTrang = N'Giữ chỗ'   THEN 1 ELSE 0 END),
        @DangThue = SUM(CASE WHEN TinhTrang = N'Đang thuê' THEN 1 ELSE 0 END)
    FROM dbo.Giuong
    WHERE MaPhong = @MaPhong;

    IF @Tong IS NULL RETURN; -- phòng không có giường (không nên xảy ra) -> không đổi gì

    UPDATE dbo.Phong
    SET TinhTrang = CASE
        WHEN @GiuCho > 0                 THEN N'Giữ chỗ'
        WHEN @Trong = @Tong               THEN N'Trống'
        WHEN @Trong = 0 AND @DangThue = 0 THEN N'Đã đặt cọc'
        WHEN @Trong = 0                   THEN N'Đầy'
        ELSE N'Còn chỗ'
    END
    WHERE MaPhong = @MaPhong;
END;
GO

-- ============================================================
-- SP_NhaChoCocHetHan — nhả 'Giữ chỗ' về 'Trống' cho các phiếu cọc quá hạn 24h
-- (đồng thời đặt phiếu sang 'Hết hạn' + 'Đã hủy'). Gọi ở DC03/DC04/DC05.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_NhaChoCocHetHan
AS
BEGIN
    SET NOCOUNT ON;

    -- Ghi nhận các phòng bị ảnh hưởng TRƯỚC khi nhả (để mở khóa giới tính + cập nhật tình trạng sau).
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

    UPDATE g SET g.TinhTrang = N'Trống'
    FROM dbo.Giuong AS g
    INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = g.MaPhong AND c.MaGiuong IS NULL
    INNER JOIN dbo.PhieuDatCoc  AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE()
      AND g.TinhTrang = N'Giữ chỗ';

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

    -- Suy lại Phong.TinhTrang từ trạng thái giường thật (thay vì set cứng 'Trống':
    -- phòng ghép có thể còn giường khác đang 'Giữ chỗ'/'Đã đặt cọc' bởi phiếu khác).
    DECLARE @MaPhongDangXet VARCHAR(4);
    DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT MaPhong FROM @PhongAnhHuong;
    OPEN cur;
    FETCH NEXT FROM cur INTO @MaPhongDangXet;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @MaPhongDangXet;
        FETCH NEXT FROM cur INTO @MaPhongDangXet;
    END
    CLOSE cur;
    DEALLOCATE cur;
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

    -- Giới hạn theo chi nhánh của Sale: chỉ thấy phiếu của phòng thuộc chi nhánh mình.
    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienSale);

    SELECT
        pdk.MaDangKy            AS maDangKy,
        nd.HoTen                AS hoTen,
        nd.NgaySinh             AS ngaySinh,
        nd.GioiTinh             AS gioiTinh,
        nd.SDT                  AS soDienThoai,
        nd.Email                AS email,
        kh.CCCD                 AS cccd,
        pdk.TrangThai           AS trangThaiDangKy,
        pdc.HinhThucThue        AS hinhThucThue,
        pdk.SoNguoiDuKienO      AS soNguoiDuKienO,
        pdk.SoNam               AS soNam,
        pdk.SoNu                AS soNu,
        pdk.NgayDangKy          AS ngayDangKy,
        pdk.GhiChuSale          AS ghiChuSale,   -- lý do từ chối (khi trạng thái = 'Từ chối')
        phong.maPhong,
        phong.tenPhong,
        phong.tenLoaiPhong,
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        -- ĐA PHÒNG: gộp mọi phòng/giường đã đặt cọc của phiếu (NULL nếu chưa lập phiếu cọc)
        (SELECT STRING_AGG(CONCAT(p2.TenPhong,
                    CASE WHEN c2.MaGiuong IS NOT NULL THEN N' - ' + c2.MaGiuong ELSE N'' END), N', ')
                WITHIN GROUP (ORDER BY c2.MaPhong, c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         INNER JOIN dbo.Phong AS p2 ON p2.MaPhong = c2.MaPhong
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc)          AS danhSachPhong,
        (SELECT COUNT(DISTINCT c3.MaPhong) FROM dbo.ChiTietDatCoc AS c3
         WHERE c3.MaPhieuDatCoc = pdc.MaPhieuDatCoc)          AS soPhong,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.TrangThaiCoc        AS trangThaiCoc,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    -- PHÒNG KHÁCH CHỐT (DC01) — không còn đoán bằng TOP 1 phòng đã xem nữa.
    -- NULL nếu Sale chưa chốt phòng (hồ sơ mới, đang 'Chờ tiếp nhận').
    OUTER APPLY (
        SELECT TOP 1
            ctxp.MaPhong    AS maPhong,
            p.TenPhong      AS tenPhong,
            lp.TenLoaiPhong AS tenLoaiPhong,
            p.MaChiNhanh    AS maChiNhanh
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
        LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        WHERE ctxp.MaDangKy = pdk.MaDangKy AND ctxp.KhachChon = 1
    ) AS phong
    -- Chi nhánh của hồ sơ: suy từ BẤT KỲ phòng nào khách đã xem (không phụ thuộc phòng chốt,
    -- vì hồ sơ 'Chờ tiếp nhận' chưa chốt phòng nhưng vẫn phải hiện cho Sale đúng chi nhánh).
    OUTER APPLY (
        SELECT TOP 1 p2.MaChiNhanh
        FROM dbo.ChiTietXemPhong AS c2
        INNER JOIN dbo.Phong AS p2 ON p2.MaPhong = c2.MaPhong
        WHERE c2.MaDangKy = pdk.MaDangKy
        ORDER BY c2.STTLich DESC
    ) AS cn
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
      AND (cn.MaChiNhanh IS NULL OR cn.MaChiNhanh = @MaChiNhanh)
      -- CHỈ PHIẾU TRONG NGÀY: Sale xử lý yêu cầu phát sinh trong ngày làm việc.
      AND pdk.NgayDangKy = CAST(GETDATE() AS DATE)
    ORDER BY pdk.MaDangKy DESC;
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
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Giới hạn theo chi nhánh của Quản lý: chỉ thấy phiếu của phòng thuộc chi nhánh mình.
    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

    SELECT
        pdk.MaDangKy        AS maDangKy,
        nd.HoTen            AS hoTen,
        nd.SDT              AS soDienThoai,
        pdk.NgayDangKy      AS ngayDangKy,
        pdk.TrangThai       AS trangThai,      -- để frontend tô badge + phân nhóm
        pdk.GhiChuSale      AS ghiChuSale,     -- lý do (khi trạng thái = 'Từ chối')
        pdk.MaNhanVienSale  AS maNhanVienSale,
        ndSale.HoTen        AS tenNhanVienSale,
        pdk.SoNam           AS soNam,
        pdk.SoNu            AS soNu,
        pdk.SoNguoiDuKienO  AS soNguoiDuKienO,
        CASE WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 THEN 1 ELSE 0 END AS khacGioi,
        phong.maPhong,
        p.TenPhong          AS tenPhong,
        p.GioiTinhChoPhep   AS gioiTinhChoPhep,
        p.TinhTrang         AS tinhTrangPhong,
        lp.SucChuaToiDa     AS sucChuaToiDa,
        g.soChoTrong        AS soChoTrong,
        g.tongGiuong        AS tongGiuong,
        -- GỢI Ý hình thức cho Quản lý; Kế toán mới chốt thật ở DC03.
        -- Nhóm khác giới buộc nguyên phòng (nam nữ không ghép chung một phòng).
        CASE WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 THEN N'Nguyên phòng' ELSE N'Ghép giường' END AS hinhThucThueDuKien,
        -- Quản lý duyệt ĐÚNG PHÒNG KHÁCH CHỐT (Sale chốt ở DC01), nên các luật dưới đây
        -- xét trên chính phòng đó — không còn xét ở mức chi nhánh.
        CASE
            WHEN pdk.TrangThai <> N'Chờ xác nhận cọc' THEN CAST(NULL AS BIT)
            WHEN phong.maPhong IS NULL THEN CAST(0 AS BIT)
            -- Nhóm khác giới -> nguyên phòng -> phòng phải trống hoàn toàn + đủ sức chứa
            WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 AND g.soChoTrong < g.tongGiuong THEN CAST(0 AS BIT)
            WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 AND pdk.SoNguoiDuKienO > lp.SucChuaToiDa THEN CAST(0 AS BIT)
            -- Nhóm cùng giới -> đủ giường trống + phòng không bị khóa sang giới khác
            WHEN (pdk.SoNam = 0 OR pdk.SoNu = 0) AND pdk.SoNguoiDuKienO > g.soChoTrong THEN CAST(0 AS BIT)
            WHEN (pdk.SoNam = 0 OR pdk.SoNu = 0)
             AND p.GioiTinhChoPhep <> N'Không phân biệt'
             AND p.GioiTinhChoPhep <> CASE WHEN pdk.SoNam > 0 THEN N'Nam' ELSE N'Nữ' END THEN CAST(0 AS BIT)
            ELSE CAST(1 AS BIT)
        END AS coTheNhanCoc,
        CASE
            WHEN pdk.TrangThai <> N'Chờ xác nhận cọc' THEN NULL
            WHEN phong.maPhong IS NULL THEN N'Hồ sơ chưa chốt phòng. Sale cần chọn phòng khách muốn thuê.'
            WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 AND g.soChoTrong < g.tongGiuong
                THEN N'Nhóm có cả nam và nữ phải thuê nguyên phòng: phòng chưa hoàn toàn trống.'
            WHEN pdk.SoNam > 0 AND pdk.SoNu > 0 AND pdk.SoNguoiDuKienO > lp.SucChuaToiDa
                THEN N'Số người dự kiến ở vượt quá sức chứa của phòng.'
            WHEN (pdk.SoNam = 0 OR pdk.SoNu = 0) AND pdk.SoNguoiDuKienO > g.soChoTrong
                THEN N'Phòng không đủ chỗ trống cho số người dự kiến ở.'
            WHEN (pdk.SoNam = 0 OR pdk.SoNu = 0)
             AND p.GioiTinhChoPhep <> N'Không phân biệt'
             AND p.GioiTinhChoPhep <> CASE WHEN pdk.SoNam > 0 THEN N'Nam' ELSE N'Nữ' END
                THEN N'Phòng đã được giữ cho giới tính khác, không thể xếp nhóm này.'
            ELSE NULL
        END AS lyDoKhongKhaDung
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS ndSale ON ndSale.MaNguoiDung = pdk.MaNhanVienSale
    -- PHÒNG KHÁCH CHỐT (DC01), không còn TOP 1 phòng đã xem
    OUTER APPLY (
        SELECT TOP 1 ctxp.MaPhong AS maPhong
        FROM dbo.ChiTietXemPhong AS ctxp
        WHERE ctxp.MaDangKy = pdk.MaDangKy AND ctxp.KhachChon = 1
    ) AS phong
    LEFT JOIN dbo.Phong     AS p  ON p.MaPhong      = phong.maPhong
    LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    OUTER APPLY (
        SELECT COUNT(*) AS tongGiuong,
               SUM(CASE WHEN TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS soChoTrong
        FROM dbo.Giuong
        WHERE MaPhong = phong.maPhong
    ) AS g
    -- Gồm phiếu chờ duyệt + đã xử lý (để Quản lý vẫn xem lại sau khi bấm);
    -- việc phân nhóm/đổi chiều sắp xếp do frontend đảm nhận.
    WHERE pdk.TrangThai IN (N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối')
      AND (p.MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
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

    -- Phòng Sale chốt ở DC01 -- Quản lý duyệt/từ chối ĐÚNG phòng này.
    DECLARE @MaPhong VARCHAR(4);
    SELECT TOP 1 @MaPhong = ctxp.MaPhong
    FROM dbo.ChiTietXemPhong AS ctxp
    WHERE ctxp.MaDangKy = @MaDangKy AND ctxp.KhachChon = 1;

    IF @MaPhong IS NULL
        THROW 50208, N'Hồ sơ chưa chốt phòng. Sale cần chọn phòng khách muốn thuê trước khi duyệt.', 1;

    IF @DuocNhanCoc = 1
    BEGIN
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
            -- Nhóm khác giới: nam nữ không ghép chung phòng -> buộc thuê nguyên phòng
            IF @SoChoTrong < @TongGiuong
                THROW 50209, N'Nhóm có cả nam và nữ phải thuê nguyên phòng: phòng chưa hoàn toàn trống.', 1;
            IF @SoNguoi > @SucChua
                THROW 50209, N'Số người dự kiến ở vượt quá sức chứa của phòng.', 1;
        END
        ELSE
        BEGIN
            -- Nhóm cùng giới: đủ chỗ trống là được (ghép giường hoặc nguyên phòng)
            IF @SoNguoi > @SoChoTrong
                THROW 50209, N'Phòng không đủ chỗ trống cho số người dự kiến ở.', 1;

            -- Phòng đã bị khóa sang giới khác thì không xếp nhóm này được
            DECLARE @GioiTinhPhongXN NVARCHAR(20), @GioiTinhNhomXN NVARCHAR(5);
            SELECT @GioiTinhPhongXN = GioiTinhChoPhep FROM dbo.Phong WHERE MaPhong = @MaPhong;
            SET @GioiTinhNhomXN = CASE WHEN @SoNam > 0 THEN N'Nam' ELSE N'Nữ' END;
            IF @GioiTinhPhongXN <> N'Không phân biệt' AND @GioiTinhPhongXN <> @GioiTinhNhomXN
                THROW 50209, N'Phòng đã được giữ cho giới tính khác, không thể xếp nhóm này.', 1;
        END

        UPDATE dbo.PhieuDangKy
        SET TrangThai = N'Xác nhận cọc'
        WHERE MaDangKy = @MaDangKy;
    END
    ELSE
    BEGIN
        -- ===== TỪ CHỐI =====
        -- Quản lý từ chối vì PHÒNG không còn phù hợp tại thời điểm duyệt (Sale ở DC01
        -- không nhìn thấy tình trạng phòng thật). Hồ sơ KHÔNG chết: nó quay lại DC01
        -- để Sale chọn phòng khác trong các phòng khách ĐÃ XEM còn lại.
        DECLARE @ConPhongKhac BIT;

        BEGIN TRY
            BEGIN TRAN;

            -- Đánh dấu phòng vừa bị từ chối: 1 -> 2. Từ giờ nó biến mất khỏi danh sách
            -- Sale chọn (SP_DanhSachPhongDaXem lọc <> 2) và không chọn lại được (50259).
            UPDATE dbo.ChiTietXemPhong
            SET KhachChon = 2
            WHERE MaDangKy = @MaDangKy AND MaPhong = @MaPhong;

            -- Còn phòng nào khách đã xem mà chưa bị từ chối không?
            SET @ConPhongKhac = CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.ChiTietXemPhong AS ctxp
                INNER JOIN dbo.LichXemPhong AS lxp
                        ON lxp.MaDangKy = ctxp.MaDangKy AND lxp.STTLich = ctxp.STTLich
                WHERE ctxp.MaDangKy = @MaDangKy
                  AND ctxp.KhachChon <> 2
                  AND lxp.TrangThai = N'Đã xem'
            ) THEN 1 ELSE 0 END;

            UPDATE dbo.PhieuDangKy
            SET TrangThai  = CASE WHEN @ConPhongKhac = 1
                                  THEN N'Chờ tiếp nhận'   -- quay lại DC01
                                  ELSE N'Từ chối'         -- hết phòng -> đóng hồ sơ
                             END,
                GhiChuSale = @LyDo
            WHERE MaDangKy = @MaDangKy;

            COMMIT TRAN;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0 ROLLBACK TRAN;
            THROW;
        END CATCH
    END

    SELECT
        pdk.MaDangKy    AS maDangKy,
        nd.HoTen        AS hoTen,
        pdk.TrangThai   AS trangThaiDangKy,
        p.TenPhong      AS tenPhongDuyet,
        -- 1 = hồ sơ đã trả về Sale để chọn phòng khác; 0 = hết phòng, hồ sơ bị từ chối hẳn
        ISNULL(@ConPhongKhac, 0) AS conPhongKhac
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung  = kh.MaKhachHang
    INNER JOIN dbo.Phong     AS p  ON p.MaPhong       = @MaPhong
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
-- DC01 - SP_DanhSachPhongDaXem
-- Các phòng khách ĐÃ XEM của 1 hồ sơ -> nguồn cho bộ chọn phòng ở modal DC01.
-- Sale chốt 1 phòng trong danh sách này (cột ChiTietXemPhong.KhachChon).
-- Trả kèm dữ liệu để Sale/Quản lý nhìn là biết phòng có xếp được nhóm này không.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachPhongDaXem', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachPhongDaXem AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachPhongDaXem
    @MaDangKy VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- CỐ Ý KHÔNG ĐỌC TÌNH TRẠNG PHÒNG/GIƯỜNG Ở ĐÂY.
    -- Sale chốt phòng dựa trên những gì khách ĐÃ ĐI XEM, tại thời điểm đó phòng còn trống;
    -- nhưng đến lúc khách quyết định cọc thì phòng có thể đã bị người khác giữ mất.
    -- Việc đối chiếu với tình trạng THẬT là của Quản lý ở DC02 -- đó là lý do DC02 tồn tại.
    -- Nếu trả tình trạng ra đây thì Sale sẽ tự lọc, và DC02 mất ý nghĩa nghiệp vụ.

    IF NOT EXISTS (SELECT 1 FROM dbo.ChiTietXemPhong WHERE MaDangKy = @MaDangKy)
        THROW 50250, N'Hồ sơ chưa có thông tin phòng đã xem.', 1;

    SELECT
        p.MaPhong                AS maPhong,
        p.TenPhong               AS tenPhong,
        p.MaChiNhanh             AS maChiNhanh,
        lp.TenLoaiPhong          AS tenLoaiPhong,
        lp.SucChuaToiDa          AS sucChuaToiDa,
        lp.GiaThueNguyenPhong    AS giaThueNguyenPhong,
        lp.GiaThueTheoGiuong     AS giaThueTheoGiuong,
        xem.KhachChon            AS khachChon,        -- 1 = phòng Sale đang chốt
        xem.DaXem                AS daXem             -- 1 = có ít nhất 1 lịch 'Đã xem' cho phòng này
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN (
        -- Gộp theo phòng: 1 phòng có thể xuất hiện ở nhiều buổi xem (nhiều STTLich)
        SELECT ctxp.MaPhong,
               KhachChon = MAX(CAST(ctxp.KhachChon AS INT)),
               DaXem     = MAX(CASE WHEN lxp.TrangThai = N'Đã xem' THEN 1 ELSE 0 END)
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.LichXemPhong AS lxp
                ON lxp.MaDangKy = ctxp.MaDangKy AND lxp.STTLich = ctxp.STTLich
        WHERE ctxp.MaDangKy = @MaDangKy
        GROUP BY ctxp.MaPhong
    ) AS xem ON xem.MaPhong = p.MaPhong
    -- KhachChon = 2: phòng đã bị Quản lý từ chối ở DC02 -> loại khỏi danh sách,
    -- Sale không được chọn lại đúng cái phòng vừa bị từ chối.
    WHERE xem.KhachChon <> 2
    ORDER BY xem.KhachChon DESC, p.MaPhong;   -- phòng đang chốt lên đầu
END;
GO

-- ============================================================
-- DC01 - SP_ChonPhongKhachChot
-- Sale chốt (hoặc đổi) phòng khách muốn thuê, trong các phòng khách ĐÃ XEM.
-- Đây là phòng mà Quản lý sẽ duyệt ở DC02 và Kế toán lập phiếu ở DC03.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_ChonPhongKhachChot', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_ChonPhongKhachChot AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_ChonPhongKhachChot
    @MaDangKy VARCHAR(6),
    @MaPhong  VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50201, N'Không tìm thấy phiếu đăng ký.', 1;

    -- Đã gửi yêu cầu rồi thì KHÔNG cho đổi phòng nữa: Quản lý đang duyệt đúng phòng đó,
    -- đổi giữa chừng sẽ khiến duyệt một đằng, dữ liệu một nẻo.
    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chờ tiếp nhận'
    )
        THROW 50202, N'Hồ sơ đã gửi yêu cầu, không đổi được phòng.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.ChiTietXemPhong
        WHERE MaDangKy = @MaDangKy AND MaPhong = @MaPhong
    )
        THROW 50256, N'Phòng không nằm trong danh sách phòng khách đã xem.', 1;

    -- Chưa xem thì chưa chốt thuê được
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.ChiTietXemPhong AS ctxp
        INNER JOIN dbo.LichXemPhong AS lxp
                ON lxp.MaDangKy = ctxp.MaDangKy AND lxp.STTLich = ctxp.STTLich
        WHERE ctxp.MaDangKy = @MaDangKy AND ctxp.MaPhong = @MaPhong
          AND lxp.TrangThai = N'Đã xem'
    )
        THROW 50257, N'Khách chưa xem phòng này, không thể chốt.', 1;

    -- Phòng đã bị Quản lý từ chối ở DC02 (KhachChon = 2) thì không chọn lại được:
    -- chọn lại chỉ dẫn tới việc Quản lý từ chối tiếp -> vòng lặp vô nghĩa.
    IF EXISTS (
        SELECT 1 FROM dbo.ChiTietXemPhong
        WHERE MaDangKy = @MaDangKy AND MaPhong = @MaPhong AND KhachChon = 2
    )
        THROW 50259, N'Phòng này đã bị Quản lý từ chối, vui lòng chọn phòng khác.', 1;

    BEGIN TRY
        BEGIN TRAN;

        -- GỠ cờ phòng cũ TRƯỚC, đặt phòng mới SAU. Thứ tự này bắt buộc:
        -- index UX_CTXP_KhachChon chỉ cho 1 phòng chốt / hồ sơ.
        -- Chỉ gỡ cờ 1 -> 0; TUYỆT ĐỐI không đụng các dòng KhachChon = 2 (đã bị từ chối).
        UPDATE dbo.ChiTietXemPhong
        SET KhachChon = 0
        WHERE MaDangKy = @MaDangKy AND KhachChon = 1 AND MaPhong <> @MaPhong;

        UPDATE dbo.ChiTietXemPhong
        SET KhachChon = 1
        WHERE MaDangKy = @MaDangKy AND MaPhong = @MaPhong;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;
    END CATCH

    SELECT
        pdk.MaDangKy    AS maDangKy,
        p.MaPhong       AS maPhongChot,
        p.TenPhong      AS tenPhongChot
    FROM dbo.PhieuDangKy AS pdk
    INNER JOIN dbo.Phong AS p ON p.MaPhong = @MaPhong
    WHERE pdk.MaDangKy = @MaDangKy;
END;
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

-- ============================================================
-- DC03 - SP_DanhSachChoTinhTienCoc
-- Danh sách phiếu cọc SALE ĐÃ LẬP nhưng KẾ TOÁN CHƯA CHỐT (MaNhanVienKeToan IS NULL).
--
-- Trả nguyên BẢNG TÍNH để kế toán đối soát:
--     đơn giá x số giường (hoặc nguyên phòng) = tiền thuê/tháng
--     tiền thuê/tháng x 2 tháng               = tiền cọc
-- SoTienCoc đã được trigger TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc tính sẵn;
-- kế toán KHÔNG gõ số, mà đối soát bảng tính rồi CHỐT.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoTinhTienCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoTinhTienCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoTinhTienCoc
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan;  -- phiếu quá hạn chờ chốt thì tự hủy, không hiện ra nữa

    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.MaPhieuYeuCauDangKy AS maDangKy,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        pdc.HinhThucThue        AS hinhThucThue,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS hanChot,        -- quá hạn này mà chưa chốt -> phiếu tự hủy
        p.TenPhong              AS tenPhong,
        lp.TenLoaiPhong         AS tenLoaiPhong,
        lp.SucChuaToiDa         AS sucChuaToiDa,
        pdk.SoNguoiDuKienO      AS soNguoiDuKienO,
        ndSale.HoTen            AS nhanVienSaleLap,
        (SELECT STRING_AGG(CAST(c2.MaGiuong AS NVARCHAR(3)), N', ')
                WITHIN GROUP (ORDER BY c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c2.MaGiuong IS NOT NULL) AS danhSachGiuong,
        -- ===== BẢNG TÍNH =====
        ct.SoDong               AS soDong,          -- ghép giường: số giường | nguyên phòng: 1
        CASE WHEN pdc.HinhThucThue = N'Ghép giường'
             THEN lp.GiaThueTheoGiuong
             ELSE lp.GiaThueNguyenPhong
        END                     AS donGia,
        ct.TienThueThang        AS tienThueThang,   -- = SUM(ChiTietDatCoc.GiaThue), trigger tính
        2                       AS soThangCoc,
        pdc.SoTienCoc           AS soTienCoc        -- = tienThueThang x 2, trigger tính
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy    = pdc.MaPhieuYeuCauDangKy
    INNER JOIN dbo.KhachHang   AS kh  ON kh.MaKhachHang  = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung   AS nd  ON nd.MaNguoiDung  = kh.MaKhachHang
    LEFT  JOIN dbo.NhanVien    AS nvS ON nvS.MaNhanVien  = pdk.MaNhanVienSale
    LEFT  JOIN dbo.NguoiDung   AS ndSale ON ndSale.MaNguoiDung = nvS.MaNhanVien
    CROSS APPLY (
        SELECT TOP 1 c.MaPhong FROM dbo.ChiTietDatCoc AS c
        WHERE c.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctp
    CROSS APPLY (
        SELECT SoDong = COUNT(*), TienThueThang = SUM(c.GiaThue)
        FROM dbo.ChiTietDatCoc AS c
        WHERE c.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ct
    INNER JOIN dbo.Phong     AS p  ON p.MaPhong      = ctp.MaPhong
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE pdc.MaNhanVienKeToan IS NULL          -- <== CHƯA CHỐT
      AND pdc.TrangThaiCoc       = N'Hiệu lực'
      AND pdc.TrangThaiThanhToan = N'Chờ TT'
      AND p.MaChiNhanh = @MaChiNhanh
    ORDER BY pdc.ThoiHanThanhToan ASC;          -- sắp hết hạn chốt lên đầu
END;
GO

-- ============================================================
-- DC03 - SP_ChotPhieuDatCoc
-- Kế toán CHỐT (hoặc HỦY) phiếu cọc do Sale lập.
--
-- CHỐT  : gán MaNhanVienKeToan + ĐẶT LẠI ThoiHanThanhToan = +24h.
--         Từ đây phiếu mới thật sự tới tay khách và đồng hồ 24h của KHÁCH bắt đầu chạy.
-- HỦY   : phiếu -> 'Đã hủy', NHẢ GIƯỜNG về 'Trống', mở khóa giới tính phòng.
--         Hồ sơ giữ nguyên 'Xác nhận cọc' -> Sale lập lại phiếu được (nhờ 50212 đã nới).
-- ============================================================
IF OBJECT_ID(N'dbo.SP_ChotPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_ChotPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_ChotPhieuDatCoc
    @MaPhieuDatCoc    VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6),
    @Chot             BIT,                 -- 1 = chốt phiếu | 0 = hủy phiếu
    @LyDo             NVARCHAR(MAX) = NULL -- bắt buộc khi hủy
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc)
        THROW 50270, N'Không tìm thấy phiếu đặt cọc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienKeToan)
        THROW 50213, N'Không tìm thấy nhân viên kế toán.', 1;

    DECLARE @TrangThaiCoc NVARCHAR(20), @TrangThaiTT NVARCHAR(20),
            @DaChot VARCHAR(6), @HanCu DATETIME;
    SELECT @TrangThaiCoc = TrangThaiCoc, @TrangThaiTT = TrangThaiThanhToan,
           @DaChot = MaNhanVienKeToan, @HanCu = ThoiHanThanhToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

    IF @DaChot IS NOT NULL
        THROW 50271, N'Phiếu đặt cọc đã được kế toán chốt.', 1;

    IF @TrangThaiCoc <> N'Hiệu lực'
        THROW 50272, N'Phiếu đặt cọc không còn hiệu lực.', 1;

    -- SP_NhaChoCocHetHan ở trên đã hủy phiếu quá hạn; đến đây mà vẫn 'Hết hạn' nghĩa là quá hạn thật.
    IF @TrangThaiTT = N'Hết hạn' OR @HanCu < GETDATE()
        THROW 50273, N'Phiếu đặt cọc đã quá hạn chốt và bị hủy tự động.', 1;

    IF @Chot = 0 AND NULLIF(LTRIM(RTRIM(COALESCE(@LyDo, N''))), N'') IS NULL
        THROW 50274, N'Vui lòng nhập lý do hủy phiếu.', 1;

    DECLARE @MaPhong VARCHAR(4) = (
        SELECT TOP 1 MaPhong FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc
    );

    BEGIN TRY
        BEGIN TRAN;

        IF @Chot = 1
        BEGIN
            UPDATE dbo.PhieuDatCoc
            SET MaNhanVienKeToan = @MaNhanVienKeToan,
                -- Đặt LẠI đồng hồ: 24h này mới là hạn của KHÁCH, không phải hạn chờ kế toán.
                ThoiHanThanhToan = DATEADD(HOUR, 24, GETDATE()),
                GhiChu           = NULL
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;
        END
        ELSE
        BEGIN
            UPDATE dbo.PhieuDatCoc
            SET TrangThaiCoc       = N'Đã hủy',
                TrangThaiThanhToan = N'Hết hạn',
                GhiChu             = @LyDo
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

            -- Nhả giường đang bị phiếu này giữ chỗ (cả ghép giường lẫn nguyên phòng)
            UPDATE g SET g.TinhTrang = N'Trống'
            FROM dbo.Giuong AS g
            INNER JOIN dbo.ChiTietDatCoc AS c
                    ON c.MaPhong = g.MaPhong
                   AND (c.MaGiuong = g.MaGiuong OR c.MaGiuong IS NULL)
            WHERE c.MaPhieuDatCoc = @MaPhieuDatCoc
              AND g.TinhTrang = N'Giữ chỗ';

            -- Mở khóa giới tính nếu phòng không còn ai giữ/cọc/thuê
            UPDATE p SET p.GioiTinhChoPhep = N'Không phân biệt'
            FROM dbo.Phong AS p
            WHERE p.MaPhong = @MaPhong
              AND p.GioiTinhChoPhep <> N'Không phân biệt'
              AND NOT EXISTS (
                  SELECT 1 FROM dbo.Giuong AS g
                  WHERE g.MaPhong = p.MaPhong AND g.TinhTrang <> N'Trống'
              );

            EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @MaPhong;
        END

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;
    END CATCH

    SELECT
        pdc.MaPhieuDatCoc    AS maPhieuDatCoc,
        pdc.SoTienCoc        AS soTienCoc,
        pdc.ThoiHanThanhToan AS thoiHanThanhToan,
        pdc.TrangThaiCoc     AS trangThaiCoc,
        nd.HoTen             AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
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

    -- DC01: phải chốt phòng trước khi gửi. Quản lý (DC02) duyệt đúng phòng này,
    -- Kế toán (DC03) lập phiếu cho đúng phòng này -> thiếu nó là cả dây chuyền treo.
    IF NOT EXISTS (
        SELECT 1 FROM dbo.ChiTietXemPhong
        WHERE MaDangKy = @MaDangKy AND KhachChon = 1
    )
        THROW 50258, N'Chưa chốt phòng khách muốn thuê. Vui lòng chọn phòng trước khi gửi yêu cầu.', 1;

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
-- DC01 (A4) - SP_CapNhatThongTinCaNhanKhachHang
-- Sale chỉnh sửa thông tin cá nhân/liên hệ/giấy tờ của khách hàng
-- trước khi gửi yêu cầu đặt cọc. Chỉ cho sửa khi phiếu còn ở
-- "Chờ tiếp nhận" (đúng phạm vi DC01, trước khi gửi yêu cầu).
-- KHÔNG đụng ThoiHanThue/ThoiGianDuKienVaoO (ngoài phạm vi SP này).
-- ============================================================
IF OBJECT_ID(N'dbo.SP_CapNhatThongTinCaNhanKhachHang', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_CapNhatThongTinCaNhanKhachHang AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_CapNhatThongTinCaNhanKhachHang
    @MaDangKy VARCHAR(6),
    @HoTen    NVARCHAR(100) = NULL,
    @NgaySinh DATE          = NULL,
    @GioiTinh NVARCHAR(5)   = NULL,
    @SDT      VARCHAR(20)   = NULL,
    @Email    VARCHAR(100)  = NULL,
    @CCCD     VARCHAR(20)   = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50260, N'Không tìm thấy phiếu đăng ký.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PhieuDangKy
        WHERE MaDangKy = @MaDangKy AND TrangThai = N'Chờ tiếp nhận'
    )
        THROW 50261, N'Phiếu đăng ký không ở trạng thái "Chờ tiếp nhận", không thể chỉnh sửa thông tin.', 1;

    SET @GioiTinh = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    IF @GioiTinh IS NOT NULL AND @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 50262, N'Giới tính không hợp lệ.', 1;

    DECLARE @MaKhachHang VARCHAR(6) = (SELECT MaKhachHang FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy);

    UPDATE dbo.NguoiDung
    SET HoTen    = ISNULL(NULLIF(LTRIM(RTRIM(@HoTen)), N''), HoTen),
        NgaySinh = ISNULL(@NgaySinh, NgaySinh),
        GioiTinh = ISNULL(@GioiTinh, GioiTinh),
        SDT      = ISNULL(NULLIF(LTRIM(RTRIM(@SDT)), N''), SDT),
        Email    = ISNULL(NULLIF(LTRIM(RTRIM(@Email)), N''), Email)
    WHERE MaNguoiDung = @MaKhachHang;

    UPDATE dbo.KhachHang
    SET CCCD = ISNULL(NULLIF(LTRIM(RTRIM(@CCCD)), N''), CCCD)
    WHERE MaKhachHang = @MaKhachHang;

    SELECT
        nd.MaNguoiDung AS maKhachHang,
        nd.HoTen       AS hoTen,
        nd.NgaySinh    AS ngaySinh,
        nd.GioiTinh    AS gioiTinh,
        nd.SDT         AS soDienThoai,
        nd.Email       AS email,
        kh.CCCD        AS cccd
    FROM dbo.NguoiDung AS nd
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE nd.MaNguoiDung = @MaKhachHang;
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
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Giới hạn theo chi nhánh của Sale: chỉ thấy phiếu của phòng thuộc chi nhánh mình.
    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.MaKhachHang         AS maKhachHang,
        nd.HoTen                AS hoTen,
        nd.NgaySinh             AS ngaySinh,       -- biên nhận: sinh năm bên A
        nd.GioiTinh             AS gioiTinh,
        nd.SDT                  AS soDienThoai,
        kh.CCCD                 AS cccd,           -- biên nhận: CMND/CCCD bên A
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        p.TenPhong              AS tenPhong,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.HinhThucThue        AS hinhThucThue,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS thoiHanThanhToan,
        pdc.ThoiGianNhanPhong   AS thoiGianNhanPhong,  -- biên nhận: ngày dự kiến ký HĐ/nhận phòng
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.ChungTuThanhToan    AS chungTuThanhToan,
        pdc.GhiChu              AS lyDoTuChoi,         -- DC05: có giá trị = chứng từ đang bị từ chối
        -- Chỉ mã giường (NULL khi thuê nguyên phòng) -> giao diện tách riêng nhãn Phòng / Giường.
        -- CAST sang NVARCHAR: MaGiuong là VARCHAR, không ghép được với dấu phân cách N', '
        (SELECT STRING_AGG(CAST(c2.MaGiuong AS NVARCHAR(3)), N', ') WITHIN GROUP (ORDER BY c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c2.MaGiuong IS NOT NULL) AS danhSachGiuong,
        cn.TenChiNhanh          AS tenChiNhanh,        -- biên nhận: bên B (công ty/chi nhánh)
        cn.DiaChi               AS diaChiChiNhanh,
        cn.SDT                  AS sdtChiNhanh
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctdc
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    -- Gồm phiếu chờ TT (đang xử lý) + đã TT + hết hạn (để Sale xem lại lịch sử);
    -- frontend tự phân nhóm/lọc/sort.
    WHERE pdc.TrangThaiThanhToan IN (N'Chờ TT', N'Đã TT', N'Hết hạn')
      -- Phiếu kế toán CHƯA CHỐT thì chưa tới lượt thanh toán -> không đưa vào hàng đợi này.
      -- (Sale vẫn theo dõi được nó ở màn lập phiếu, cột trạng thái 'Chờ kế toán chốt'.)
      AND pdc.MaNhanVienKeToan IS NOT NULL
      AND (p.MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
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
    @ChungTuThanhToan NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ma VARCHAR(6) = CAST(@PhieuId AS VARCHAR(6));

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma)
        THROW 50220, N'Không tìm thấy phiếu đặt cọc.', 1;

    DECLARE @TrangThai NVARCHAR(20), @ThoiHan DATETIME, @KeToan VARCHAR(6);
    SELECT @TrangThai = TrangThaiThanhToan, @ThoiHan = ThoiHanThanhToan,
           @KeToan = MaNhanVienKeToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma;

    -- Phiếu Sale vừa lập mà kế toán CHƯA CHỐT (MaNhanVienKeToan IS NULL) thì chưa có
    -- số tiền được duyệt -> khách không được thanh toán.
    IF @KeToan IS NULL
        THROW 50275, N'Phiếu đặt cọc chưa được kế toán chốt, chưa thể thanh toán.', 1;

    IF @TrangThai <> N'Chờ TT'
        THROW 50221, N'Phiếu đặt cọc không ở trạng thái "Chờ TT".', 1;

    IF @ThoiHan < GETDATE()
    BEGIN
        EXEC dbo.SP_NhaChoCocHetHan; -- nhả 'Giữ chỗ' về 'Trống' + đặt phiếu 'Hết hạn'
        THROW 50222, N'Phiếu đặt cọc đã hết hạn thanh toán 24 giờ và bị hủy tự động.', 1;
    END

    IF NULLIF(LTRIM(RTRIM(COALESCE(@ChungTuThanhToan, N''))), N'') IS NULL
        THROW 50223, N'Thiếu file chứng từ thanh toán.', 1;

    -- Gửi chứng từ mới -> XÓA lý do từ chối cũ (nếu có) để phiếu quay lại hàng đợi duyệt của quản lý.
    UPDATE dbo.PhieuDatCoc
    SET ChungTuThanhToan = CAST(@ChungTuThanhToan AS VARCHAR(500)),
        GhiChu           = NULL
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
-- DC04 - SP_ChonPhuongThucThanhToanCoc
-- Khách hàng (hoặc nhân viên) chọn phương thức thanh toán cho phiếu "Chờ TT".
-- Kế toán không còn chọn phương thức ở DC03 (cột PhuongThucThanhToan cho phép NULL).
-- ============================================================
IF OBJECT_ID(N'dbo.SP_ChonPhuongThucThanhToanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_ChonPhuongThucThanhToanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_ChonPhuongThucThanhToanCoc
    @PhieuId             NVARCHAR(30),
    @PhuongThucThanhToan NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ma VARCHAR(6) = CAST(@PhieuId AS VARCHAR(6));

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma)
        THROW 50240, N'Không tìm thấy phiếu đặt cọc.', 1;

    SET @PhuongThucThanhToan = NULLIF(LTRIM(RTRIM(@PhuongThucThanhToan)), N'');
    IF @PhuongThucThanhToan IS NULL OR @PhuongThucThanhToan NOT IN (N'Tiền mặt', N'Chuyển khoản')
        THROW 50241, N'Phương thức thanh toán không hợp lệ.', 1;

    DECLARE @TrangThai NVARCHAR(20), @ThoiHan DATETIME, @KeToan VARCHAR(6);
    SELECT @TrangThai = TrangThaiThanhToan, @ThoiHan = ThoiHanThanhToan,
           @KeToan = MaNhanVienKeToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma;

    -- Chưa chốt thì chưa có tiền để trả -> không cho chọn phương thức thanh toán.
    IF @KeToan IS NULL
        THROW 50275, N'Phiếu đặt cọc chưa được kế toán chốt, chưa thể thanh toán.', 1;

    IF @TrangThai <> N'Chờ TT'
        THROW 50242, N'Phiếu đặt cọc không ở trạng thái "Chờ TT".', 1;

    IF @ThoiHan < GETDATE()
    BEGIN
        EXEC dbo.SP_NhaChoCocHetHan; -- nhả 'Giữ chỗ' + đặt phiếu 'Hết hạn'
        THROW 50243, N'Phiếu đặt cọc đã hết hạn thanh toán 24 giờ và bị hủy tự động.', 1;
    END

    UPDATE dbo.PhieuDatCoc
    SET PhuongThucThanhToan = @PhuongThucThanhToan
    WHERE MaPhieuDatCoc = @Ma;

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan
    FROM dbo.PhieuDatCoc AS pdc
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
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Giới hạn theo chi nhánh của Quản lý: chỉ thấy phiếu của phòng thuộc chi nhánh mình.
    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

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
        pdc.ChungTuThanhToan    AS chungTuThanhToan,
        pdc.GhiChu              AS lyDoTuChoi,
        -- Chuỗi gộp phòng/giường cho DataGrid
        (SELECT STRING_AGG(CONCAT(p2.TenPhong,
                    CASE WHEN c2.MaGiuong IS NOT NULL THEN N' - ' + c2.MaGiuong ELSE N'' END), N', ')
                WITHIN GROUP (ORDER BY c2.MaPhong, c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         INNER JOIN dbo.Phong AS p2 ON p2.MaPhong = c2.MaPhong
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc)          AS danhSachPhong,
        -- Chỉ mã giường (NULL khi thuê nguyên phòng) -> modal tách riêng nhãn Phòng / Giường.
        -- CAST sang NVARCHAR: MaGiuong là VARCHAR, không ghép được với dấu phân cách N', '
        (SELECT STRING_AGG(CAST(c4.MaGiuong AS NVARCHAR(3)), N', ') WITHIN GROUP (ORDER BY c4.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c4
         WHERE c4.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c4.MaGiuong IS NOT NULL) AS danhSachGiuong
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctdc
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    -- Chờ xác nhận (Chờ TT + đã có chứng từ + CHƯA bị từ chối) + lịch sử (Đã TT / Hết hạn).
    -- GhiChu IS NULL: phiếu đã bị quản lý từ chối (GhiChu có lý do) vẫn giữ chứng từ cũ, nên phải
    -- loại khỏi hàng đợi — nếu không nó kẹt lại mãi. Nó quay lại khi Sale/khách gửi chứng từ mới
    -- (lúc đó SP_CapNhatMinhChungThanhToanCoc xóa GhiChu về NULL).
    WHERE (
        (pdc.TrangThaiThanhToan = N'Chờ TT'
         AND pdc.ChungTuThanhToan IS NOT NULL
         AND LTRIM(RTRIM(pdc.ChungTuThanhToan)) <> ''
         AND pdc.GhiChu IS NULL)
       OR pdc.TrangThaiThanhToan IN (N'Đã TT', N'Hết hạn')
    )
      -- Phiếu kế toán chưa chốt thì không bao giờ có chứng từ hợp lệ (guard 50275).
      -- Loại luôn để phiếu Sale lập rồi bỏ quên (hết hạn chờ chốt) không lẫn vào lịch sử của Quản lý.
      AND pdc.MaNhanVienKeToan IS NOT NULL
      AND (p.MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
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
        BEGIN TRY
            BEGIN TRAN;
                UPDATE dbo.PhieuDatCoc
                SET TrangThaiThanhToan = N'Đã TT', ThoiGianXacNhanTT = GETDATE(),
                    GhiChu = NULL   -- duyệt xong: dọn lý do từ chối cũ (nếu từng bị từ chối)
                WHERE MaPhieuDatCoc = @Ma;

                -- Ghép giường: lật ĐÚNG các giường của phiếu (MỌI dòng, MỌI phòng).
                -- (Trước đây dùng SELECT TOP 1 nên chỉ lật 1 giường -> bỏ sót giường thứ 2 trở đi.)
                UPDATE g SET g.TinhTrang = N'Đã đặt cọc'
                FROM dbo.Giuong AS g
                INNER JOIN dbo.ChiTietDatCoc AS c
                        ON c.MaPhong = g.MaPhong AND c.MaGiuong = g.MaGiuong
                WHERE c.MaPhieuDatCoc = @Ma AND c.MaGiuong IS NOT NULL;

                -- Nguyên phòng (MaGiuong NULL): lật TOÀN BỘ giường của mỗi phòng trong phiếu.
                UPDATE g SET g.TinhTrang = N'Đã đặt cọc'
                FROM dbo.Giuong AS g
                INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = g.MaPhong
                WHERE c.MaPhieuDatCoc = @Ma AND c.MaGiuong IS NULL;

                -- Suy lại Phong.TinhTrang cho TỪNG phòng distinct của phiếu.
                DECLARE @PhongXN VARCHAR(4);
                DECLARE curPhongXN CURSOR LOCAL FAST_FORWARD FOR
                    SELECT DISTINCT MaPhong FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @Ma;
                OPEN curPhongXN;
                FETCH NEXT FROM curPhongXN INTO @PhongXN;
                WHILE @@FETCH_STATUS = 0
                BEGIN
                    EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @PhongXN;
                    FETCH NEXT FROM curPhongXN INTO @PhongXN;
                END
                CLOSE curPhongXN;
                DEALLOCATE curPhongXN;
            COMMIT;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW;
        END CATCH
    END
    ELSE
    BEGIN
        -- @HopLe = 0: từ chối chứng từ -> GIỮ NGUYÊN chứng từ cũ (để Sale/khách xem lại chỗ sai),
        -- chỉ lưu lý do từ chối vào GhiChu. Phiếu vẫn 'Chờ TT'.
        -- Suy ra trạng thái "Bị từ chối" = ChungTuThanhToan IS NOT NULL AND GhiChu IS NOT NULL.
        -- Lý do sẽ bị xóa khi Sale/khách gửi chứng từ mới (SP_CapNhatMinhChungThanhToanCoc).
        UPDATE dbo.PhieuDatCoc
        SET GhiChu = @GhiChu
        WHERE MaPhieuDatCoc = @Ma;
    END

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
