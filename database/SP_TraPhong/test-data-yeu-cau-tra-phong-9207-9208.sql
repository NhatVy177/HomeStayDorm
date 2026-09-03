USE HOMEDORM4;
GO

SET DATEFORMAT ymd;
GO

/*
    Test data cho luong khach hang gui yeu cau tra phong.

    Tai khoan:
    - kh9207 / 123: khach da co hop dong HD9207, chua co PhieuTraPhong, chua co DoiSoat.
    - kh9208 / 123: khach chi co phieu coc DC9208, chua co HopDongThue, chua co PhieuTraPhong, chua co DoiSoat.

    Script nay co the chay lai nhieu lan. Khong tao PhieuTraPhong va khong tao DoiSoat.
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- Khach hang + tai khoan
    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = 'KH9207')
        INSERT INTO dbo.NguoiDung (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung)
        VALUES ('KH9207', N'Test Yêu Cầu Trả Phòng HĐ', '2001-07-07', N'Nam', '0912920007', 'kh9207@homedorm.vn', NULL, 'KhachHang');
    ELSE
        UPDATE dbo.NguoiDung
        SET HoTen = N'Test Yêu Cầu Trả Phòng HĐ',
            NgaySinh = '2001-07-07',
            GioiTinh = N'Nam',
            SDT = '0912920007',
            Email = 'kh9207@homedorm.vn',
            LoaiNguoiDung = 'KhachHang'
        WHERE MaNguoiDung = 'KH9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = 'KH9208')
        INSERT INTO dbo.NguoiDung (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung)
        VALUES ('KH9208', N'Test Yêu Cầu Trả Phòng Cọc', '2001-08-08', N'Nữ', '0912920008', 'kh9208@homedorm.vn', NULL, 'KhachHang');
    ELSE
        UPDATE dbo.NguoiDung
        SET HoTen = N'Test Yêu Cầu Trả Phòng Cọc',
            NgaySinh = '2001-08-08',
            GioiTinh = N'Nữ',
            SDT = '0912920008',
            Email = 'kh9208@homedorm.vn',
            LoaiNguoiDung = 'KhachHang'
        WHERE MaNguoiDung = 'KH9208';

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = 'KH9207')
        INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
        VALUES ('KH9207', N'Việt Nam', '079202920007');
    ELSE
        UPDATE dbo.KhachHang SET QuocTich = N'Việt Nam', CCCD = '079202920007' WHERE MaKhachHang = 'KH9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = 'KH9208')
        INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
        VALUES ('KH9208', N'Việt Nam', '079202920008');
    ELSE
        UPDATE dbo.KhachHang SET QuocTich = N'Việt Nam', CCCD = '079202920008' WHERE MaKhachHang = 'KH9208';

    IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = 'kh9207')
        INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
        VALUES ('kh9207', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9207');
    ELSE
        UPDATE dbo.TaiKhoan
        SET MatKhau = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3',
            TrangThai = N'Hoạt động',
            MaNguoiDung = 'KH9207'
        WHERE TenDangNhap = 'kh9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = 'kh9208')
        INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
        VALUES ('kh9208', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9208');
    ELSE
        UPDATE dbo.TaiKhoan
        SET MatKhau = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3',
            TrangThai = N'Hoạt động',
            MaNguoiDung = 'KH9208'
        WHERE TenDangNhap = 'kh9208';

    -- Phong/giuong rieng cho test
    IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P927')
        INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
        VALUES ('P927', N'Phòng test yêu cầu trả HĐ 9207', N'Không phân biệt', N'Đầy', 'CN0001', 'LP0001');
    ELSE
        UPDATE dbo.Phong
        SET TenPhong = N'Phòng test yêu cầu trả HĐ 9207',
            GioiTinhChoPhep = N'Không phân biệt',
            TinhTrang = N'Đầy',
            MaChiNhanh = 'CN0001',
            MaLoaiPhong = 'LP0001'
        WHERE MaPhong = 'P927';

    IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P928')
        INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
        VALUES ('P928', N'Phòng test yêu cầu trả cọc 9208', N'Không phân biệt', N'Đã đặt cọc', 'CN0001', 'LP0001');
    ELSE
        UPDATE dbo.Phong
        SET TenPhong = N'Phòng test yêu cầu trả cọc 9208',
            GioiTinhChoPhep = N'Không phân biệt',
            TinhTrang = N'Đã đặt cọc',
            MaChiNhanh = 'CN0001',
            MaLoaiPhong = 'LP0001'
        WHERE MaPhong = 'P928';

    IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P927' AND MaGiuong = 'G01')
        INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang)
        VALUES ('P927', 'G01', 1, N'Đang thuê');
    ELSE
        UPDATE dbo.Giuong SET SoGiuong = 1, TinhTrang = N'Đang thuê' WHERE MaPhong = 'P927' AND MaGiuong = 'G01';

    IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P928' AND MaGiuong = 'G01')
        INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang)
        VALUES ('P928', 'G01', 1, N'Đã đặt cọc');
    ELSE
        UPDATE dbo.Giuong SET SoGiuong = 1, TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P928' AND MaGiuong = 'G01';

    -- Ho so dang ky + phieu coc
    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = 'DK9207')
        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNam, SoNu, SoNguoiDuKienO,
            KhuVucMongMuon, MucGiaToiDa, ThoiGianDuKienVaoO, ThoiHanThue,
            YeuCauKhac, TrangThai, MaKhachHang, MaNhanVienSale, GhiChuSale
        )
        VALUES (
            'DK9207', '2026-07-01', 1, 0, 1,
            N'Quận 1', 2200000, '2026-07-10', 12,
            N'Dữ liệu test gửi yêu cầu trả phòng từ hợp đồng.', N'Xác nhận cọc', 'KH9207', 'NV0001', N'Test 9207'
        );
    ELSE
        UPDATE dbo.PhieuDangKy
        SET NgayDangKy = '2026-07-01',
            SoNam = 1,
            SoNu = 0,
            SoNguoiDuKienO = 1,
            KhuVucMongMuon = N'Quận 1',
            MucGiaToiDa = 2200000,
            ThoiGianDuKienVaoO = '2026-07-10',
            ThoiHanThue = 12,
            YeuCauKhac = N'Dữ liệu test gửi yêu cầu trả phòng từ hợp đồng.',
            TrangThai = N'Xác nhận cọc',
            MaKhachHang = 'KH9207',
            MaNhanVienSale = 'NV0001',
            GhiChuSale = N'Test 9207'
        WHERE MaDangKy = 'DK9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = 'DK9208')
        INSERT INTO dbo.PhieuDangKy (
            MaDangKy, NgayDangKy, SoNam, SoNu, SoNguoiDuKienO,
            KhuVucMongMuon, MucGiaToiDa, ThoiGianDuKienVaoO, ThoiHanThue,
            YeuCauKhac, TrangThai, MaKhachHang, MaNhanVienSale, GhiChuSale
        )
        VALUES (
            'DK9208', '2026-07-01', 0, 1, 1,
            N'Quận 1', 2200000, '2026-07-10', 6,
            N'Dữ liệu test gửi yêu cầu trả phòng từ phiếu cọc.', N'Xác nhận cọc', 'KH9208', 'NV0001', N'Test 9208'
        );
    ELSE
        UPDATE dbo.PhieuDangKy
        SET NgayDangKy = '2026-07-01',
            SoNam = 0,
            SoNu = 1,
            SoNguoiDuKienO = 1,
            KhuVucMongMuon = N'Quận 1',
            MucGiaToiDa = 2200000,
            ThoiGianDuKienVaoO = '2026-07-10',
            ThoiHanThue = 6,
            YeuCauKhac = N'Dữ liệu test gửi yêu cầu trả phòng từ phiếu cọc.',
            TrangThai = N'Xác nhận cọc',
            MaKhachHang = 'KH9208',
            MaNhanVienSale = 'NV0001',
            GhiChuSale = N'Test 9208'
        WHERE MaDangKy = 'DK9208';

    IF NOT EXISTS (SELECT 1 FROM dbo.PDK_LoaiPhong WHERE MaDangKy = 'DK9207' AND MaLoaiPhong = 'LP0001')
        INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong) VALUES ('DK9207', 'LP0001');

    IF NOT EXISTS (SELECT 1 FROM dbo.PDK_LoaiPhong WHERE MaDangKy = 'DK9208' AND MaLoaiPhong = 'LP0001')
        INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong) VALUES ('DK9208', 'LP0001');

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = 'DC9207')
        INSERT INTO dbo.PhieuDatCoc (
            MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
            PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT,
            ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc,
            MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
        )
        VALUES (
            'DC9207', '2026-07-02 09:00:00', '2026-07-03 09:00:00', 4400000,
            N'Chuyển khoản', N'Đã TT', '2026-07-02 09:20:00',
            '/uploads/chung-tu-coc/DC9207.pdf', '2026-07-10 09:00:00', N'Ghép giường', N'Đã lập HĐ',
            'DK9207', 'KH9207', 'NV0004'
        );
    ELSE
        UPDATE dbo.PhieuDatCoc
        SET SoTienCoc = 4400000,
            PhuongThucThanhToan = N'Chuyển khoản',
            TrangThaiThanhToan = N'Đã TT',
            ThoiGianXacNhanTT = '2026-07-02 09:20:00',
            ChungTuThanhToan = '/uploads/chung-tu-coc/DC9207.pdf',
            ThoiGianNhanPhong = '2026-07-10 09:00:00',
            HinhThucThue = N'Ghép giường',
            TrangThaiCoc = N'Đã lập HĐ',
            MaPhieuYeuCauDangKy = 'DK9207',
            MaKhachHang = 'KH9207',
            MaNhanVienKeToan = 'NV0004'
        WHERE MaPhieuDatCoc = 'DC9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = 'DC9208')
        INSERT INTO dbo.PhieuDatCoc (
            MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
            PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT,
            ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc,
            MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
        )
        VALUES (
            'DC9208', '2026-07-02 10:00:00', '2026-07-03 10:00:00', 4400000,
            N'Chuyển khoản', N'Đã TT', '2026-07-02 10:20:00',
            '/uploads/chung-tu-coc/DC9208.pdf', '2026-07-10 09:00:00', N'Ghép giường', N'Hiệu lực',
            'DK9208', 'KH9208', 'NV0004'
        );
    ELSE
        UPDATE dbo.PhieuDatCoc
        SET SoTienCoc = 4400000,
            PhuongThucThanhToan = N'Chuyển khoản',
            TrangThaiThanhToan = N'Đã TT',
            ThoiGianXacNhanTT = '2026-07-02 10:20:00',
            ChungTuThanhToan = '/uploads/chung-tu-coc/DC9208.pdf',
            ThoiGianNhanPhong = '2026-07-10 09:00:00',
            HinhThucThue = N'Ghép giường',
            TrangThaiCoc = N'Hiệu lực',
            MaPhieuYeuCauDangKy = 'DK9208',
            MaKhachHang = 'KH9208',
            MaNhanVienKeToan = 'NV0004'
        WHERE MaPhieuDatCoc = 'DC9208';

    IF NOT EXISTS (SELECT 1 FROM dbo.ChiTietDatCoc WHERE MaChiTietDC = 'CD9207')
        INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
        VALUES ('CD9207', 'DC9207', 'P927', 'G01', 2200000);
    ELSE
        UPDATE dbo.ChiTietDatCoc
        SET MaPhieuDatCoc = 'DC9207',
            MaPhong = 'P927',
            MaGiuong = 'G01',
            GiaThue = 2200000
        WHERE MaChiTietDC = 'CD9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.ChiTietDatCoc WHERE MaChiTietDC = 'CD9208')
        INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
        VALUES ('CD9208', 'DC9208', 'P928', 'G01', 2200000);
    ELSE
        UPDATE dbo.ChiTietDatCoc
        SET MaPhieuDatCoc = 'DC9208',
            MaPhong = 'P928',
            MaGiuong = 'G01',
            GiaThue = 2200000
        WHERE MaChiTietDC = 'CD9208';

    -- Chi tao hop dong cho KH9207. KH9208 giu nguyen la chi co phieu coc.
    IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = 'HD9207')
        INSERT INTO dbo.HopDongThue (
            MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue,
            GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy
        )
        VALUES (
            'HD9207', '2026-07-05', '2026-07-10', '2027-07-10', 1,
            2200000, N'Hàng tháng', N'Hiệu lực', 'DC9207', 'KH9207', 'NV0003'
        );
    ELSE
        UPDATE dbo.HopDongThue
        SET NgayKyHD = '2026-07-05',
            NgayBatDau = '2026-07-10',
            NgayKetThuc = '2027-07-10',
            SoGiuongThue = 1,
            GiaThue = 2200000,
            KyThanhToan = N'Hàng tháng',
            TrangThai = N'Hiệu lực',
            MaPhieuCoc = 'DC9207',
            MaKhachHang = 'KH9207',
            MaNhanVienQuanLy = 'NV0003'
        WHERE MaHopDong = 'HD9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.ThanhVienHopDong WHERE MaThanhVien = 'TV9207')
        INSERT INTO dbo.ThanhVienHopDong (
            MaThanhVien, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, MaHopDong
        )
        VALUES (
            'TV9207', N'Test Yêu Cầu Trả Phòng HĐ', '2001-07-07', N'Nam',
            '079202920007', '0912920007', 'kh9207@homedorm.vn', N'Việt Nam', N'Đang ở', 'HD9207'
        );
    ELSE
        UPDATE dbo.ThanhVienHopDong
        SET HoTen = N'Test Yêu Cầu Trả Phòng HĐ',
            NgaySinh = '2001-07-07',
            GioiTinh = N'Nam',
            CCCD = '079202920007',
            SDT = '0912920007',
            Email = 'kh9207@homedorm.vn',
            QuocTich = N'Việt Nam',
            TrangThai = N'Đang ở',
            MaHopDong = 'HD9207'
        WHERE MaThanhVien = 'TV9207';

    IF NOT EXISTS (SELECT 1 FROM dbo.DichVuHopDong WHERE MaChiTietDVHD = 'VH9207')
        INSERT INTO dbo.DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu)
        VALUES ('VH9207', 'DV0003', 'HD9207', N'Dịch vụ wifi cho dữ liệu test yêu cầu trả phòng HD9207.');
    ELSE
        UPDATE dbo.DichVuHopDong
        SET MaDichVu = 'DV0003',
            MaHopDong = 'HD9207',
            GhiChu = N'Dịch vụ wifi cho dữ liệu test yêu cầu trả phòng HD9207.'
        WHERE MaChiTietDVHD = 'VH9207';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

SELECT
    tk.TenDangNhap,
    nd.MaNguoiDung,
    nd.HoTen,
    CASE
        WHEN hd.MaHopDong IS NOT NULL THEN N'Có hợp đồng'
        ELSE N'Chỉ có phiếu cọc'
    END AS LoaiTest,
    hd.MaHopDong,
    pdc.MaPhieuDatCoc,
    pt.MaPhieuTra,
    ds.MaDoiSoat
FROM dbo.TaiKhoan tk
INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = tk.MaNguoiDung
LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaKhachHang = nd.MaNguoiDung
LEFT JOIN dbo.HopDongThue hd ON hd.MaPhieuCoc = pdc.MaPhieuDatCoc
LEFT JOIN dbo.PhieuTraPhong pt ON pt.MaHopDong = hd.MaHopDong OR pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc
LEFT JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
WHERE tk.TenDangNhap IN ('kh9207', 'kh9208')
ORDER BY tk.TenDangNhap;
GO
