USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: DAT COC - THANH TOAN (Khach hang / Nhan vien Sale) - DC04
-- =============================================

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
