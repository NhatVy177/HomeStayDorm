USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: DAT COC - GUI YEU CAU (Nhan vien Sale) - DC01
-- =============================================

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
-- SP_GuiYeuCauDatCoc
-- Sale chuyển PhieuDangKy từ "Chờ tiếp nhận" → "Chờ xác nhận cọc".
-- ============================================================
IF OBJECT_ID(N'dbo.SP_GuiYeuCauDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_GuiYeuCauDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
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
