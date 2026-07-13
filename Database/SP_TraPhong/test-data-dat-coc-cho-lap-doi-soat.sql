USE HOMEDORM4;
GO

SET DATEFORMAT ymd;
GO

-- Ca test: khách đã đặt cọc, chưa ký hợp đồng, vừa gửi yêu cầu trả phòng.
-- Dùng để kế toán test chức năng lập đối soát từ phiếu trả phòng.
-- Tài khoản kế toán chi nhánh Thủ Đức: nv0012 / 123.

IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = 'DK9097')
BEGIN
    INSERT INTO dbo.PhieuDangKy (
        MaDangKy,
        NgayDangKy,
        SoNam,
        SoNu,
        SoNguoiDuKienO,
        KhuVucMongMuon,
        MucGiaToiDa,
        ThoiGianDuKienVaoO,
        ThoiHanThue,
        YeuCauKhac,
        TrangThai,
        MaKhachHang,
        MaNhanVienSale,
        GhiChuSale
    )
    VALUES (
        'DK9097',
        '2026-07-09',
        1,
        0,
        1,
        N'Thủ Đức',
        1400000,
        '2026-07-15',
        6,
        N'Dữ liệu test khách đặt cọc yêu cầu trả phòng trước khi ký hợp đồng.',
        N'Đã tiếp nhận',
        'KH0016',
        'NV0010',
        N'Ca test lập đối soát đặt cọc.'
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.PDK_LoaiPhong
    WHERE MaDangKy = 'DK9097'
      AND MaLoaiPhong = 'LP0003'
)
BEGIN
    INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong)
    VALUES ('DK9097', 'LP0003');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = 'DC9097')
BEGIN
    INSERT INTO dbo.PhieuDatCoc (
        MaPhieuDatCoc,
        ThoiDiemDatCoc,
        ThoiHanThanhToan,
        SoTienCoc,
        PhuongThucThanhToan,
        TrangThaiThanhToan,
        ThoiGianXacNhanTT,
        ChungTuThanhToan,
        ThoiGianNhanPhong,
        TrangThaiCoc,
        MaPhieuYeuCauDangKy,
        MaKhachHang,
        MaNhanVienKeToan
    )
    VALUES (
        'DC9097',
        '2026-07-10 09:15:00',
        '2026-07-11 09:15:00',
        2800000,
        N'Chuyển khoản',
        N'Đã TT',
        '2026-07-10 09:30:00',
        '/uploads/chung-tu-coc/DC9097.pdf',
        '2026-07-15 09:00:00',
        N'Hiệu lực',
        'DK9097',
        'KH0016',
        'NV0012'
    );
END
ELSE
BEGIN
    UPDATE dbo.PhieuDatCoc
    SET
        SoTienCoc = 2800000,
        TrangThaiThanhToan = N'Đã TT',
        TrangThaiCoc = N'Hiệu lực',
        MaKhachHang = 'KH0016',
        MaNhanVienKeToan = 'NV0012'
    WHERE MaPhieuDatCoc = 'DC9097';
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ChiTietDatCoc WHERE MaChiTietDC = 'CD9097')
BEGIN
    INSERT INTO dbo.ChiTietDatCoc (
        MaChiTietDC,
        MaPhieuDatCoc,
        MaPhong,
        MaGiuong,
        GiaThue,
        HinhThucThue
    )
    VALUES (
        'CD9097',
        'DC9097',
        'P305',
        'G01',
        1400000,
        N'Ghép giường'
    );
END
GO

UPDATE dbo.ChiTietDatCoc
SET GiaThue = 1400000,
    HinhThucThue = N'Ghép giường'
WHERE MaChiTietDC = 'CD9097'
  AND (
      GiaThue IS NULL
      OR GiaThue <> 1400000
      OR HinhThucThue IS NULL
      OR HinhThucThue <> N'Ghép giường'
  );
GO

UPDATE dbo.PhieuDatCoc
SET SoTienCoc = 2800000
WHERE MaPhieuDatCoc = 'DC9097'
  AND (SoTienCoc IS NULL OR SoTienCoc <> 2800000);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.PhieuTraPhong WHERE MaPhieuTra = 'TP9097')
BEGIN
    INSERT INTO dbo.PhieuTraPhong (
        MaPhieuTra,
        NgayDangKyTra,
        NgayDuKienTra,
        NgayTraThucTe,
        TrangThai,
        MaHopDong,
        MaPhieuDatCoc
    )
    VALUES (
        'TP9097',
        '2026-07-11',
        '2026-07-11',
        '2026-07-11',
        N'Chờ đối soát',
        NULL,
        'DC9097'
    );
END
ELSE IF NOT EXISTS (SELECT 1 FROM dbo.DoiSoat WHERE MaPhieuTra = 'TP9097')
BEGIN
    UPDATE dbo.PhieuTraPhong
    SET
        NgayDangKyTra = '2026-07-11',
        NgayDuKienTra = '2026-07-11',
        NgayTraThucTe = '2026-07-11',
        TrangThai = N'Chờ đối soát',
        MaHopDong = NULL,
        MaPhieuDatCoc = 'DC9097'
    WHERE MaPhieuTra = 'TP9097';
END
GO

UPDATE dbo.Giuong
SET TinhTrang = N'Đã đặt cọc'
WHERE MaPhong = 'P305'
  AND MaGiuong = 'G01';
GO

UPDATE dbo.Phong
SET TinhTrang = N'Còn chỗ'
WHERE MaPhong = 'P305';
GO

SELECT
    pt.MaPhieuTra,
    pt.TrangThai AS TrangThaiPhieuTra,
    pdc.MaPhieuDatCoc,
    pdc.TrangThaiThanhToan,
    pdc.TrangThaiCoc,
    pdc.SoTienCoc,
    nd.HoTen AS HoTenKhachHang,
    ctdc.MaPhong,
    ctdc.MaGiuong,
    p.MaChiNhanh
FROM dbo.PhieuTraPhong pt
INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = pt.MaPhieuDatCoc
INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
WHERE pt.MaPhieuTra = 'TP9097';
GO
