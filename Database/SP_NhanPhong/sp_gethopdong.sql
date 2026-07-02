USE HOMEDORM4;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GetHopDongDashboard
    @MaKhachHang VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaHopDong VARCHAR(6);
    DECLARE @MaPhong VARCHAR(4);

    SELECT TOP 1
        @MaHopDong = hd.MaHopDong,
        @MaPhong = ct.MaPhong
    FROM dbo.HopDongThue AS hd
    INNER JOIN dbo.PhieuDatCoc AS pdc
        ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
        ORDER BY MaChiTietDC
    ) AS ct
    WHERE hd.MaKhachHang = @MaKhachHang
    ORDER BY
        CASE WHEN hd.TrangThai = N'Hiệu lực' THEN 0 ELSE 1 END,
        hd.NgayKyHD DESC;

    SELECT
        hd.MaHopDong,
        hd.NgayKyHD,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.SoGiuongThue,
        hd.GiaThue,
        hd.KyThanhToan,
        hd.TrangThai,
        hd.MaPhieuCoc,
        hd.MaKhachHang,
        p.MaPhong,
        p.TenPhong,
        ct.MaGiuong,
        lp.TenLoaiPhong,
        cn.TenChiNhanh,
        cn.DiaChi,
        ha.UrlImg
    FROM dbo.HopDongThue AS hd
    INNER JOIN dbo.PhieuDatCoc AS pdc
        ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
        ORDER BY MaChiTietDC
    ) AS ct
    LEFT JOIN dbo.Phong AS p
        ON p.MaPhong = ct.MaPhong
    LEFT JOIN dbo.LoaiPhong AS lp
        ON lp.MaLoaiPhong = p.MaLoaiPhong
    LEFT JOIN dbo.ChiNhanh AS cn
        ON cn.MaChiNhanh = p.MaChiNhanh
    OUTER APPLY (
        SELECT TOP 1 UrlImg
        FROM dbo.HinhAnhPhong
        WHERE MaPhong = p.MaPhong
        ORDER BY STTAnh
    ) AS ha
    WHERE hd.MaHopDong = @MaHopDong;

    SELECT
        ts.MaTaiSan,
        ts.TenTaiSan,
        ts.SoLuong,
        ts.DonGia
    FROM dbo.TaiSan AS ts
    WHERE ts.MaPhong = @MaPhong
    ORDER BY ts.MaTaiSan;

    SELECT
        qd.MaQuyDinh,
        qd.TieuDeNoiQuy,
        qd.NoiDung
    FROM dbo.QuiDinh AS qd
    WHERE qd.TrangThai = N'Hiệu lực'
    ORDER BY qd.MaQuyDinh;
END;
GO