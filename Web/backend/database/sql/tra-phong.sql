USE HOMEDORM4;
GO

-- ============================================================
-- SP_TraPhong_DanhSachHopDong
-- Lấy danh sách hợp đồng thuê + phiếu đặt cọc hợp lệ của
-- khách hàng để hiển thị trong trang Yêu cầu trả phòng.
-- Hợp đồng hợp lệ: TrangThai = 'Hiệu lực' hoặc 'Hết hạn'
-- Phiếu cọc hợp lệ: TrangThaiCoc = 'Hiệu lực'
--                   (đã TT cọc nhưng chưa ký HĐ)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_DanhSachHopDong
    @MaKhachHang VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Hợp đồng đang hiệu lực hoặc hết hạn (chưa thanh lý)
    SELECT
        hd.MaHopDong                AS maHopDong,
        N'HopDong'                  AS loai,
        p.TenPhong                  AS tenPhong,
        cn.TenChiNhanh              AS tenChiNhanh,
        cn.DiaChi                   AS diaChiChiNhanh,
        lp.TenLoaiPhong             AS loaiPhong,
        pdc.HinhThucThue            AS hinhThucThue,
        hd.SoGiuongThue             AS soGiuong,
        hd.GiaThue                  AS giaThu,
        pdc.SoTienCoc               AS tienCoc,
        CONVERT(VARCHAR(10), hd.NgayBatDau, 103)    AS ngayBatDau,
        CONVERT(VARCHAR(10), hd.NgayKetThuc, 103)   AS ngayKetThuc,
        hd.TrangThai                AS trangThai,
        -- Kiểm tra xem đã có PhieuTraPhong đang chờ xử lý chưa
        CASE WHEN EXISTS (
            SELECT 1 FROM PhieuTraPhong ptp
            WHERE ptp.MaHopDong = hd.MaHopDong
              AND ptp.TrangThai IN (N'Chờ xử lý', N'Chờ đối soát', N'Chờ thanh lý')
        ) THEN 1 ELSE 0 END         AS dangCoYeuCau
    FROM HopDongThue hd
    JOIN PhieuDatCoc pdc ON hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON ctdc.MaPhong = p.MaPhong
    JOIN ChiNhanh cn ON p.MaChiNhanh = cn.MaChiNhanh
    JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    WHERE hd.MaKhachHang = @MaKhachHang
      AND hd.TrangThai IN (N'Hiệu lực', N'Hết hạn')

    UNION ALL

    -- Phiếu đặt cọc hợp lệ chưa ký hợp đồng
    SELECT
        pdc.MaPhieuDatCoc           AS maHopDong,
        N'DatCoc'                   AS loai,
        p.TenPhong                  AS tenPhong,
        cn.TenChiNhanh              AS tenChiNhanh,
        cn.DiaChi                   AS diaChiChiNhanh,
        lp.TenLoaiPhong             AS loaiPhong,
        pdc.HinhThucThue            AS hinhThucThue,
        NULL                        AS soGiuong,
        ctdc.GiaThue                AS giaThu,
        pdc.SoTienCoc               AS tienCoc,
        NULL                        AS ngayBatDau,
        NULL                        AS ngayKetThuc,
        N'Hiệu lực — chưa ký HĐ'  AS trangThai,
        CASE WHEN EXISTS (
            SELECT 1 FROM PhieuTraPhong ptp
            WHERE ptp.MaPhieuDatCoc = pdc.MaPhieuDatCoc
              AND ptp.TrangThai IN (N'Chờ xử lý', N'Chờ đối soát', N'Chờ thanh lý')
        ) THEN 1 ELSE 0 END         AS dangCoYeuCau
    FROM PhieuDatCoc pdc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON ctdc.MaPhong = p.MaPhong
    JOIN ChiNhanh cn ON p.MaChiNhanh = cn.MaChiNhanh
    JOIN LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    WHERE pdc.MaKhachHang = @MaKhachHang
      AND pdc.TrangThaiCoc = N'Hiệu lực'
      AND pdc.TrangThaiThanhToan = N'Đã TT'
      -- chưa có hợp đồng liên kết
      AND NOT EXISTS (
          SELECT 1 FROM HopDongThue hd2
          WHERE hd2.MaPhieuCoc = pdc.MaPhieuDatCoc
            AND hd2.TrangThai NOT IN (N'Hủy')
      )

    ORDER BY loai, maHopDong;
END;
GO

-- ============================================================
-- SP_TraPhong_LichSu
-- Lấy lịch sử phiếu trả phòng của khách hàng (tất cả trạng thái)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_LichSu
    @MaKhachHang VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ptp.MaPhieuTra              AS maPhieuTra,
        ISNULL(p.TenPhong, N'—')   AS tenPhong,
        ISNULL(ctdc.MaGiuong, N'—') AS maGiuong,
        CASE
            WHEN ptp.MaHopDong IS NOT NULL THEN ptp.MaHopDong
            ELSE ptp.MaPhieuDatCoc
        END                         AS maNguon,
        CASE
            WHEN ptp.MaHopDong IS NOT NULL THEN N'Hợp đồng'
            ELSE N'Đặt cọc'
        END                         AS loaiNguon,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 103)   AS ngayDangKy,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 103)   AS ngayDuKienTra,
        ptp.TrangThai               AS trangThai
    FROM PhieuTraPhong ptp
    -- Nối qua hợp đồng để lấy phòng
    LEFT JOIN HopDongThue hd ON ptp.MaHopDong = hd.MaHopDong
    LEFT JOIN PhieuDatCoc pdc2 ON ISNULL(hd.MaPhieuCoc, ptp.MaPhieuDatCoc) = pdc2.MaPhieuDatCoc
    LEFT JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc2.MaPhieuDatCoc
    LEFT JOIN Phong p ON ctdc.MaPhong = p.MaPhong
    WHERE
        -- Lọc theo khách hàng qua hợp đồng
        (ptp.MaHopDong IS NOT NULL AND hd.MaKhachHang = @MaKhachHang)
        OR
        -- Lọc theo phiếu đặt cọc trực tiếp
        (ptp.MaPhieuDatCoc IS NOT NULL AND EXISTS (
            SELECT 1 FROM PhieuDatCoc pdc3
            WHERE pdc3.MaPhieuDatCoc = ptp.MaPhieuDatCoc
              AND pdc3.MaKhachHang = @MaKhachHang
        ))
    ORDER BY ptp.NgayDangKyTra DESC;
END;
GO

-- ============================================================
-- SP_TraPhong_TaoYeuCau
-- Tạo phiếu trả phòng mới (Dòng sự kiện chính Use Case)
--
-- Luồng:
--  1. Kiểm tra @MaHopDong hoặc @MaPhieuDatCoc tồn tại, thuộc
--     đúng @MaKhachHang.
--  2. Kiểm tra ngày dự kiến trả >= hôm nay (A6).
--  3. Kiểm tra đã tồn tại yêu cầu chưa xử lý xong (E6).
--  4. Sinh mã phiếu, INSERT PhieuTraPhong.
--  5. Trả về bản ghi vừa tạo.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_TaoYeuCau
    @MaKhachHang    VARCHAR(6),
    @MaHopDong      VARCHAR(6)   = NULL,
    @MaPhieuDatCoc  VARCHAR(6)   = NULL,
    @NgayDuKienTra  DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Validate: phải có đúng một trong hai ──────────────────
    IF (@MaHopDong IS NULL AND @MaPhieuDatCoc IS NULL)
        OR (@MaHopDong IS NOT NULL AND @MaPhieuDatCoc IS NOT NULL)
    BEGIN
        RAISERROR(N'Phải cung cấp đúng một trong MaHopDong hoặc MaPhieuDatCoc.', 16, 1);
        RETURN;
    END

    -- ── Validate: ngày dự kiến trả >= hôm nay (A6) ───────────
    IF @NgayDuKienTra < CAST(GETDATE() AS DATE)
    BEGIN
        RAISERROR(N'Ngày dự kiến trả phòng không hợp lệ (phải từ hôm nay trở đi).', 16, 2);
        RETURN;
    END

    -- ── Validate: hợp đồng tồn tại và thuộc khách hàng ────────
    IF @MaHopDong IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM HopDongThue
            WHERE MaHopDong = @MaHopDong
              AND MaKhachHang = @MaKhachHang
              AND TrangThai IN (N'Hiệu lực', N'Hết hạn')
        )
        BEGIN
            RAISERROR(N'Hợp đồng không tồn tại hoặc không thuộc khách hàng này.', 16, 3);
            RETURN;
        END

        -- E6: đã có yêu cầu chưa xử lý xong
        IF EXISTS (
            SELECT 1 FROM PhieuTraPhong
            WHERE MaHopDong = @MaHopDong
              AND TrangThai IN (N'Chờ xử lý', N'Chờ đối soát', N'Chờ thanh lý')
        )
        BEGIN
            RAISERROR(N'Hợp đồng này đã có một yêu cầu trả phòng đang được xử lý.', 16, 4);
            RETURN;
        END
    END

    -- ── Validate: phiếu đặt cọc tồn tại và thuộc khách hàng ──
    IF @MaPhieuDatCoc IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM PhieuDatCoc
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc
              AND MaKhachHang = @MaKhachHang
              AND TrangThaiCoc = N'Hiệu lực'
        )
        BEGIN
            RAISERROR(N'Phiếu đặt cọc không tồn tại hoặc không hợp lệ.', 16, 5);
            RETURN;
        END

        -- E6: phiếu cọc đã có yêu cầu chưa xử lý xong
        IF EXISTS (
            SELECT 1 FROM PhieuTraPhong
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc
              AND TrangThai IN (N'Chờ xử lý', N'Chờ đối soát', N'Chờ thanh lý')
        )
        BEGIN
            RAISERROR(N'Phiếu đặt cọc này đã có một yêu cầu trả phòng đang được xử lý.', 16, 6);
            RETURN;
        END
    END

    -- ── Sinh mã phiếu tự động ─────────────────────────────────
    DECLARE @SoThuTu INT;
    DECLARE @MaPhieuTra VARCHAR(6);

    SELECT @SoThuTu = ISNULL(MAX(CAST(SUBSTRING(MaPhieuTra, 3, 4) AS INT)), 0) + 1
    FROM PhieuTraPhong;

    SET @MaPhieuTra = 'PT' + RIGHT('0000' + CAST(@SoThuTu AS VARCHAR(4)), 4);

    -- ── Tạo phiếu ────────────────────────────────────────────
    INSERT INTO PhieuTraPhong (
        MaPhieuTra, NgayDangKyTra, NgayDuKienTra,
        NgayTraThucTe, TrangThai, MaHopDong, MaPhieuDatCoc
    )
    VALUES (
        @MaPhieuTra,
        CAST(GETDATE() AS DATE),
        @NgayDuKienTra,
        NULL,
        N'Chờ xử lý',
        @MaHopDong,
        @MaPhieuDatCoc
    );

    -- ── Trả về bản ghi vừa tạo ────────────────────────────────
    SELECT
        ptp.MaPhieuTra,
        CONVERT(VARCHAR(10), ptp.NgayDangKyTra, 103)   AS ngayDangKy,
        CONVERT(VARCHAR(10), ptp.NgayDuKienTra, 103)   AS ngayDuKienTra,
        ptp.TrangThai,
        ptp.MaHopDong,
        ptp.MaPhieuDatCoc
    FROM PhieuTraPhong ptp
    WHERE ptp.MaPhieuTra = @MaPhieuTra;
END;
GO
