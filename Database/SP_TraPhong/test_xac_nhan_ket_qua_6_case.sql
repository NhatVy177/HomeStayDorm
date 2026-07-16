USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

/*
  Du lieu test rieng cho luong KHACH HANG xac nhan ket qua doi soat.

  Can chay truoc:
    1. Database/CreateDB/app.sql
    2. Database/GenData/data.sql
    3. Database/SP_TraPhong/ke-toan-doi-soat.sql

  Mat khau tat ca tai khoan test: 123

  Ma tran case:
    kh9201 / KH9201: Co hop dong, thu them (co HO9201 + ChiTietHoaDon) -> DS9201 / HD9201 / TP9201
    kh9202 / KH9202: Co hop dong, khong phat sinh (co HO9202 + ChiTietHoaDon) -> DS9202 / HD9202 / TP9202
    kh9203 / KH9203: Co hop dong, hoan coc      -> DS9203 / HD9203 / TP9203
    kh9204 / KH9204: Chi co dat coc, hoan coc toan bo -> DS9204 / DC9204 / TP9204
    kh9205 / KH9205: Chi co dat coc, hoan coc mot phan -> DS9205 / DC9205 / TP9205
    kh9206 / KH9206: Chi co dat coc, hoan coc mot phan -> DS9206 / DC9206 / TP9206

  Luu y nghiep vu:
    - Case co HopDong va co tien thue/dich vu con no phai co HoaDon + ChiTietHoaDon ro rang.
    - Case chi co DatCoc (KH9204-KH9206) chua ky HopDong nen khong tao HoaDon/ChiTietHoaDon.
      Day la case hoan coc theo quy dinh, khong phai day mot khoan no khong ro sang khach.

  Tat ca DoiSoat ban dau o trang thai N'Cho xac nhan' de test:
    - Khach bam Dong y
    - Khach bam Yeu cau dieu chinh
*/

IF DB_ID(N'HOMEDORM4') IS NULL
    THROW 59200, N'Chua co database HOMEDORM4.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = 'CN0001')
    THROW 59201, N'Thieu chi nhanh CN0001. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0001')
    THROW 59202, N'Thieu loai phong LP0001. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0001')
   OR NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0003')
   OR NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
    THROW 59203, N'Thieu nhan vien NV0001/NV0003/NV0004. Hay chay Database/GenData/data.sql truoc.', 1;

IF (SELECT COUNT(*) FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc IN ('QH0001', 'QH0004')) < 2
    THROW 59204, N'Thieu quy dinh hoan coc QH0001/QH0004. Hay chay Database/GenData/data.sql truoc.', 1;

BEGIN TRANSACTION;

BEGIN TRY
    -- Cleanup nhe de file co the chay lai nhieu lan.
    DELETE FROM dbo.YeuCauSuaChua
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926')
       OR MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.ChiTietHuHong
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE cthh
    FROM dbo.ChiTietHuHong cthh
    INNER JOIN dbo.BienBanKiemTraPhong bbkt
        ON bbkt.MaBienBanKT = cthh.MaBienBanKT
    WHERE bbkt.MaPhieuTra IN ('TP9201', 'TP9202', 'TP9203', 'TP9204', 'TP9205', 'TP9206');

    DELETE ctbg
    FROM dbo.ChiTietBanGiao ctbg
    WHERE ctbg.MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926')
       OR ctbg.MaBienBan IN (
            SELECT bbbg.MaBienBan
            FROM dbo.BienBanBanGiao bbbg
            WHERE bbbg.MaHopDong IN ('HD9201', 'HD9202', 'HD9203')
       );

    DELETE FROM dbo.BienBanBanGiao
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.DoiSoat
    WHERE MaDoiSoat IN ('DS9201', 'DS9202', 'DS9203', 'DS9204', 'DS9205', 'DS9206');

    DELETE FROM dbo.BienBanKiemTraPhong
    WHERE MaPhieuTra IN ('TP9201', 'TP9202', 'TP9203', 'TP9204', 'TP9205', 'TP9206');

    DELETE cthd
    FROM dbo.ChiTietHoaDon cthd
    INNER JOIN dbo.HoaDon hd
        ON hd.MaHoaDon = cthd.MaHoaDon
    WHERE hd.MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE cthd
    FROM dbo.ChiTietHoaDon cthd
    INNER JOIN dbo.PhieuGhiChiSo pgcs
        ON pgcs.MaPhieuGhi = cthd.MaPhieuGhi
    WHERE pgcs.MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.HoaDon
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.DichVuHopDong
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.ThanhVienHopDong
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.ThanhVienHopDong', N'MaHoSoCuTru') IS NOT NULL
        EXEC sp_executesql N'
            DELETE tvhd
            FROM dbo.ThanhVienHopDong tvhd
            INNER JOIN dbo.HoSoCuTru hsct
                ON hsct.MaHoSoCuTru = tvhd.MaHoSoCuTru
            WHERE hsct.MaPhieuDatCoc IN (''DC9201'', ''DC9202'', ''DC9203'', ''DC9204'', ''DC9205'', ''DC9206'');
        ';

    DELETE FROM dbo.BienBanViPham
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203')
       OR MaKhachHang IN ('KH9201', 'KH9202', 'KH9203', 'KH9204', 'KH9205', 'KH9206');

    IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NOT NULL
        EXEC sp_executesql N'
            DELETE FROM dbo.HoSoCuTru
            WHERE MaPhieuDatCoc IN (''DC9201'', ''DC9202'', ''DC9203'', ''DC9204'', ''DC9205'', ''DC9206'');
        ';

    DELETE FROM dbo.PhieuTraPhong
    WHERE MaPhieuTra IN ('TP9201', 'TP9202', 'TP9203', 'TP9204', 'TP9205', 'TP9206');

    DELETE FROM dbo.HopDongThue
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.ChiTietDatCoc
    WHERE MaChiTietDC IN ('CD9201', 'CD9202', 'CD9203', 'CD9204', 'CD9205', 'CD9206')
       OR MaPhieuDatCoc IN ('DC9201', 'DC9202', 'DC9203', 'DC9204', 'DC9205', 'DC9206');

    DELETE FROM dbo.PhieuDatCoc
    WHERE MaPhieuDatCoc IN ('DC9201', 'DC9202', 'DC9203', 'DC9204', 'DC9205', 'DC9206');

    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
        EXEC sp_executesql N'
            DELETE FROM dbo.PDK_LoaiPhong
            WHERE MaDangKy IN (''DK9201'', ''DK9202'', ''DK9203'', ''DK9204'', ''DK9205'', ''DK9206'');
        ';

    DELETE FROM dbo.ChiTietXemPhong
    WHERE MaDangKy IN ('DK9201', 'DK9202', 'DK9203', 'DK9204', 'DK9205', 'DK9206')
       OR MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.LichXemPhong
    WHERE MaDangKy IN ('DK9201', 'DK9202', 'DK9203', 'DK9204', 'DK9205', 'DK9206');

    DELETE FROM dbo.PhieuDangKy
    WHERE MaDangKy IN ('DK9201', 'DK9202', 'DK9203', 'DK9204', 'DK9205', 'DK9206');

    DELETE FROM dbo.TaiKhoan
    WHERE TenDangNhap IN ('kh9201', 'kh9202', 'kh9203', 'kh9204', 'kh9205', 'kh9206');

    DELETE FROM dbo.KhachHang
    WHERE MaKhachHang IN ('KH9201', 'KH9202', 'KH9203', 'KH9204', 'KH9205', 'KH9206');

    DELETE FROM dbo.NguoiDung
    WHERE MaNguoiDung IN ('KH9201', 'KH9202', 'KH9203', 'KH9204', 'KH9205', 'KH9206');

    DELETE FROM dbo.HinhAnhPhong
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.PhieuGhiChiSo
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.Giuong
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.TaiSan
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.Phong
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    INSERT INTO dbo.NguoiDung (
        MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung
    )
    VALUES
        ('KH9201', N'Test HD Thu Thêm',       '2001-01-01', N'Nam', '0912920001', 'kh9201@homedorm.vn', NULL, 'KhachHang'),
        ('KH9202', N'Test HD Không Phát Sinh','2001-02-02', N'Nữ',  '0912920002', 'kh9202@homedorm.vn', NULL, 'KhachHang'),
        ('KH9203', N'Test HD Hoàn Cọc',       '2001-03-03', N'Nam', '0912920003', 'kh9203@homedorm.vn', NULL, 'KhachHang'),
        ('KH9204', N'Test Cọc Hoàn Toàn Bộ',  '2001-04-04', N'Nữ',  '0912920004', 'kh9204@homedorm.vn', NULL, 'KhachHang'),
        ('KH9205', N'Test Cọc Hoàn Một Phần', '2001-05-05', N'Nam', '0912920005', 'kh9205@homedorm.vn', NULL, 'KhachHang'),
        ('KH9206', N'Test Cọc Hoàn Cọc',      '2001-06-06', N'Nữ',  '0912920006', 'kh9206@homedorm.vn', NULL, 'KhachHang');

    INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
    VALUES
        ('KH9201', N'Việt Nam', '079202920001'),
        ('KH9202', N'Việt Nam', '079202920002'),
        ('KH9203', N'Việt Nam', '079202920003'),
        ('KH9204', N'Việt Nam', '079202920004'),
        ('KH9205', N'Việt Nam', '079202920005'),
        ('KH9206', N'Việt Nam', '079202920006');

    INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
    VALUES
        ('kh9201', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9201'),
        ('kh9202', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9202'),
        ('kh9203', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9203'),
        ('kh9204', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9204'),
        ('kh9205', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9205'),
        ('kh9206', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9206');

    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
    VALUES
        ('P921', N'Phòng test HD thu thêm',        N'Không phân biệt', N'Đầy',       'CN0001', 'LP0001'),
        ('P922', N'Phòng test HD không phát sinh', N'Không phân biệt', N'Đầy',       'CN0001', 'LP0001'),
        ('P923', N'Phòng test HD hoàn cọc',        N'Không phân biệt', N'Đầy',       'CN0001', 'LP0001'),
        ('P924', N'Phòng test cọc hoàn toàn bộ',   N'Không phân biệt', N'Đã đặt cọc','CN0001', 'LP0001'),
        ('P925', N'Phòng test cọc hoàn một phần',  N'Không phân biệt', N'Đã đặt cọc','CN0001', 'LP0001'),
        ('P926', N'Phòng test cọc hoàn cọc',       N'Không phân biệt', N'Đã đặt cọc','CN0001', 'LP0001');

    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang)
    VALUES
        ('P921', 'G01', 1, N'Đang thuê'),
        ('P922', 'G01', 1, N'Đang thuê'),
        ('P923', 'G01', 1, N'Đang thuê'),
        ('P924', 'G01', 1, N'Đã đặt cọc'),
        ('P925', 'G01', 1, N'Đã đặt cọc'),
        ('P926', 'G01', 1, N'Đã đặt cọc');

    INSERT INTO dbo.PhieuDangKy (
        MaDangKy, NgayDangKy, SoNam, SoNu, SoNguoiDuKienO,
        KhuVucMongMuon, MucGiaToiDa,
        ThoiGianDuKienVaoO, ThoiHanThue, YeuCauKhac,
        TrangThai, MaKhachHang, MaNhanVienSale, GhiChuSale
    )
    VALUES
        ('DK9201', '2026-06-01', 1, 0, 1, N'Quận 1', 2500000, '2026-06-10', 6,  N'Test có hợp đồng - thu thêm.',        N'Xác nhận cọc', 'KH9201', 'NV0001', NULL),
        ('DK9202', '2026-06-01', 0, 1, 1, N'Quận 1', 2500000, '2026-06-10', 6,  N'Test có hợp đồng - không phát sinh.', N'Xác nhận cọc', 'KH9202', 'NV0001', NULL),
        ('DK9203', '2026-06-01', 1, 0, 1, N'Quận 1', 2500000, '2026-06-10', 6,  N'Test có hợp đồng - hoàn cọc.',        N'Xác nhận cọc', 'KH9203', 'NV0001', NULL),
        ('DK9204', '2026-06-01', 0, 1, 1, N'Quận 1', 2500000, '2026-06-10', 6,  N'Test chỉ đặt cọc - hoàn toàn bộ.',  N'Xác nhận cọc', 'KH9204', 'NV0001', NULL),
        ('DK9205', '2026-06-01', 1, 0, 1, N'Quận 1', 2500000, '2026-06-10', 6,  N'Test chỉ đặt cọc - hoàn một phần.', N'Xác nhận cọc', 'KH9205', 'NV0001', NULL),
        ('DK9206', '2026-06-01', 0, 1, 1, N'Quận 1', 2500000, '2026-06-10', 6,  N'Test chỉ đặt cọc - hoàn cọc.',       N'Xác nhận cọc', 'KH9206', 'NV0001', NULL);

    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
        EXEC sp_executesql N'
            INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong)
            VALUES
                (''DK9201'', ''LP0001''),
                (''DK9202'', ''LP0001''),
                (''DK9203'', ''LP0001''),
                (''DK9204'', ''LP0001''),
                (''DK9205'', ''LP0001''),
                (''DK9206'', ''LP0001'');
        ';

    INSERT INTO dbo.PhieuDatCoc (
        MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
        PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT,
        ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc,
        MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
    )
    VALUES
        ('DC9201', '2026-06-02 09:00:00', '2026-06-03 09:00:00', 2200000, N'Chuyển khoản', N'Đã TT', '2026-06-02 09:20:00', '/uploads/chung-tu-coc/DC9201.pdf', '2026-06-10 09:00:00', N'Ghép giường', N'Đã lập HĐ', 'DK9201', 'KH9201', 'NV0004'),
        ('DC9202', '2026-06-02 09:10:00', '2026-06-03 09:10:00', 2400000, N'Chuyển khoản', N'Đã TT', '2026-06-02 09:30:00', '/uploads/chung-tu-coc/DC9202.pdf', '2026-06-10 09:00:00', N'Ghép giường', N'Đã lập HĐ', 'DK9202', 'KH9202', 'NV0004'),
        ('DC9203', '2026-06-02 09:20:00', '2026-06-03 09:20:00', 2200000, N'Chuyển khoản', N'Đã TT', '2026-06-02 09:40:00', '/uploads/chung-tu-coc/DC9203.pdf', '2026-06-10 09:00:00', N'Ghép giường', N'Đã lập HĐ', 'DK9203', 'KH9203', 'NV0004'),
        ('DC9204', '2026-06-02 09:30:00', '2026-06-03 09:30:00', 1800000, N'Chuyển khoản', N'Đã TT', '2026-06-02 09:50:00', '/uploads/chung-tu-coc/DC9204.pdf', '2026-06-10 09:00:00', N'Ghép giường', N'Hiệu lực',  'DK9204', 'KH9204', 'NV0004'),
        ('DC9205', '2026-06-02 09:40:00', '2026-06-03 09:40:00', 1800000, N'Chuyển khoản', N'Đã TT', '2026-06-02 10:00:00', '/uploads/chung-tu-coc/DC9205.pdf', '2026-06-10 09:00:00', N'Ghép giường', N'Hiệu lực',  'DK9205', 'KH9205', 'NV0004'),
        ('DC9206', '2026-06-02 09:50:00', '2026-06-03 09:50:00', 1800000, N'Chuyển khoản', N'Đã TT', '2026-06-02 10:10:00', '/uploads/chung-tu-coc/DC9206.pdf', '2026-06-10 09:00:00', N'Ghép giường', N'Hiệu lực',  'DK9206', 'KH9206', 'NV0004');

    INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
    VALUES
        ('CD9201', 'DC9201', 'P921', 'G01', 2200000),
        ('CD9202', 'DC9202', 'P922', 'G01', 2200000),
        ('CD9203', 'DC9203', 'P923', 'G01', 2200000),
        ('CD9204', 'DC9204', 'P924', 'G01', 1800000),
        ('CD9205', 'DC9205', 'P925', 'G01', 1800000),
        ('CD9206', 'DC9206', 'P926', 'G01', 1800000);

    INSERT INTO dbo.HopDongThue (
        MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue,
        GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy
    )
    VALUES
        ('HD9201', '2026-06-05', '2026-06-10', '2026-12-10', 1, 2200000, N'Hàng tháng', N'Hiệu lực', 'DC9201', 'KH9201', 'NV0003'),
        ('HD9202', '2026-06-05', '2026-06-10', '2026-12-10', 1, 2200000, N'Hàng tháng', N'Hiệu lực', 'DC9202', 'KH9202', 'NV0003'),
        ('HD9203', '2026-06-05', '2026-06-10', '2026-12-10', 1, 2200000, N'Hàng tháng', N'Hiệu lực', 'DC9203', 'KH9203', 'NV0003');

    -- Du lieu hoa don con no de man doi soat hien ro HoaDon + ChiTietHoaDon.
    -- Tien thue con no lay theo GiaThue hop dong; ChiTietHoaDon chi luu tien dich vu.
    INSERT INTO dbo.DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu)
    VALUES
        ('V9101', 'DV0001', 'HD9201', N'Dịch vụ điện test đối soát KH9201.'),
        ('V9102', 'DV0002', 'HD9201', N'Dịch vụ nước test đối soát KH9201.'),
        ('V9103', 'DV0003', 'HD9201', N'Dịch vụ wifi test đối soát KH9201.'),
        ('V9104', 'DV0005', 'HD9201', N'Dịch vụ vệ sinh test đối soát KH9201.'),
        ('V9201', 'DV0001', 'HD9202', N'Dịch vụ điện test đối soát KH9202.'),
        ('V9202', 'DV0002', 'HD9202', N'Dịch vụ nước test đối soát KH9202.'),
        ('V9203', 'DV0003', 'HD9202', N'Dịch vụ wifi test đối soát KH9202.'),
        ('V9204', 'DV0004', 'HD9202', N'Dịch vụ gửi xe test đối soát KH9202.'),
        ('V9205', 'DV0005', 'HD9202', N'Dịch vụ vệ sinh test đối soát KH9202.');

    INSERT INTO dbo.HoaDon (
        MaHoaDon, KyThanhToan, NgayLap, NgayHanTT, TongTien,
        TrangThai, NgayThanhToan, PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan
    )
    VALUES
        ('HO9201', '2026-07', '2026-07-05', '2026-07-12', 2450000, N'Nợ', NULL, NULL, 'HD9201', 'NV0004'),
        ('HO9202', '2026-07', '2026-07-05', '2026-07-12', 2400000, N'Nợ', NULL, NULL, 'HD9202', 'NV0004');

    INSERT INTO dbo.ChiTietHoaDon (
        MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien,
        MaHoaDon, MaChiTietDVHD, MaPhieuGhi
    )
    VALUES
        ('C9101', 20, 'kWh', 2500.00, 50000.00, 'HO9201', 'V9101', NULL),
        ('C9102', 5, 'm3', 10000.00, 50000.00, 'HO9201', 'V9102', NULL),
        ('C9103', 1, 'tháng', 100000.00, 100000.00, 'HO9201', 'V9103', NULL),
        ('C9104', 1, 'tháng', 50000.00, 50000.00, 'HO9201', 'V9104', NULL),
        ('C9201', 10, 'kWh', 4000.00, 40000.00, 'HO9202', 'V9201', NULL),
        ('C9202', 2, 'm3', 18000.00, 36000.00, 'HO9202', 'V9202', NULL),
        ('C9203', 1, 'tháng', 50000.00, 50000.00, 'HO9202', 'V9203', NULL),
        ('C9204', 1, 'tháng', 44000.00, 44000.00, 'HO9202', 'V9204', NULL),
        ('C9205', 1, 'tháng', 30000.00, 30000.00, 'HO9202', 'V9205', NULL);

    INSERT INTO dbo.PhieuTraPhong (
        MaPhieuTra, NgayDangKyTra, NgayDuKienTra, NgayTraThucTe,
        TrangThai, MaHopDong, MaPhieuDatCoc
    )
    VALUES
        ('TP9201', '2026-07-01', '2026-07-05', '2026-07-05', N'Chờ đối soát', 'HD9201', NULL),
        ('TP9202', '2026-07-01', '2026-07-05', '2026-07-05', N'Chờ đối soát', 'HD9202', NULL),
        ('TP9203', '2026-07-01', '2026-07-05', '2026-07-05', N'Chờ đối soát', 'HD9203', NULL),
        ('TP9204', '2026-07-01', '2026-07-05', '2026-07-05', N'Chờ đối soát', NULL, 'DC9204'),
        ('TP9205', '2026-07-01', '2026-07-05', '2026-07-05', N'Chờ đối soát', NULL, 'DC9205'),
        ('TP9206', '2026-07-01', '2026-07-05', '2026-07-05', N'Chờ đối soát', NULL, 'DC9206');

    INSERT INTO dbo.DoiSoat (
        MaDoiSoat, NgayLap, TienCocBanDau, SoThangLuuTru, TyLeHoanCocHienTai,
        TienCocDuocHoan, TienThueConNo, TienDichVuConNo, TongChiPhiSuaChua,
        TienPhat, TongKhauTru, SoTienHoanThucTe, SoTienKhachPhaiTT,
        PhuongThucThanhToan, ChungTuThanhToan, NgayThanhToan, ThongTinNhanHoanCoc,
        GhiChuPhanHoiKhach, LoaiQuyetToan, TrangThai, MaNhanVienKeToan,
        MaPhieuTra, MaQuyDinhHoanCoc
    )
    VALUES
        -- Co hop dong: thu them.
        ('DS9201', '2026-07-05', 2200000, 1.0, 100.00, 2200000, 2200000, 250000, 400000, 0, 2850000, 0, 650000, NULL, NULL, NULL, NULL, NULL, N'Thu thêm', N'Chờ xác nhận', 'NV0004', 'TP9201', 'QH0004'),
        -- Co hop dong: khong phat sinh.
        ('DS9202', '2026-07-05', 2400000, 1.0, 100.00, 2400000, 2200000, 200000, 0, 0, 2400000, 0, 0, NULL, NULL, NULL, NULL, NULL, N'Không phát sinh', N'Chờ xác nhận', 'NV0004', 'TP9202', 'QH0004'),
        -- Co hop dong: hoan coc.
        ('DS9203', '2026-07-05', 2200000, 1.0, 100.00, 2200000, 0, 0, 500000, 0, 500000, 1700000, 0, NULL, NULL, NULL, NULL, NULL, N'Hoàn cọc', N'Chờ xác nhận', 'NV0004', 'TP9203', 'QH0004'),

        -- Chi co dat coc: hoan coc toan bo.
        ('DS9204', '2026-07-05', 1800000, 0.0, 100.00, 1800000, 0, 0, 0, 0, 0, 1800000, 0, NULL, NULL, NULL, NULL, NULL, N'Hoàn cọc', N'Chờ xác nhận', 'NV0004', 'TP9204', 'QH0004'),
        -- Chi co dat coc: hoan coc mot phan theo quy dinh.
        ('DS9205', '2026-07-05', 1800000, 0.0, 80.00, 1440000, 0, 0, 0, 0, 0, 1440000, 0, NULL, NULL, NULL, NULL, NULL, N'Hoàn cọc', N'Chờ xác nhận', 'NV0004', 'TP9205', 'QH0001'),
        -- Chi co dat coc: hoan coc mot phan theo quy dinh.
        ('DS9206', '2026-07-05', 1800000, 0.0, 80.00, 1440000, 0, 0, 0, 0, 0, 1440000, 0, NULL, NULL, NULL, NULL, NULL, N'Hoàn cọc', N'Chờ xác nhận', 'NV0004', 'TP9206', 'QH0001');

    COMMIT TRANSACTION;

    PRINT N'Da tao 6 tai khoan/case test xac nhan ket qua doi soat. Mat khau tat ca: 123.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

SELECT
    tk.TenDangNhap AS taiKhoan,
    N'123' AS matKhau,
    nd.MaNguoiDung AS maKhachHang,
    nd.HoTen AS tenCase,
    hd.MaHopDong AS maHopDong,
    pdc.MaPhieuDatCoc AS maPhieuDatCoc,
    pt.MaPhieuTra AS maPhieuTra,
    ds.MaDoiSoat AS maDoiSoat,
    ds.LoaiQuyetToan AS loaiQuyetToan,
    ds.TrangThai AS trangThaiDoiSoat
FROM dbo.TaiKhoan tk
JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = tk.MaNguoiDung
JOIN dbo.KhachHang kh ON kh.MaKhachHang = nd.MaNguoiDung
JOIN dbo.PhieuDatCoc pdc ON pdc.MaKhachHang = kh.MaKhachHang
LEFT JOIN dbo.HopDongThue hd ON hd.MaPhieuCoc = pdc.MaPhieuDatCoc
JOIN dbo.PhieuTraPhong pt ON pt.MaHopDong = hd.MaHopDong OR pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc
JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
WHERE tk.TenDangNhap IN ('kh9201', 'kh9202', 'kh9203', 'kh9204', 'kh9205', 'kh9206')
ORDER BY tk.TenDangNhap;
GO

PRINT N'--- Kiem tra nguon tien thue/dich vu trong doi soat so voi HoaDon/ChiTietHoaDon ---';
GO

SELECT
    tk.TenDangNhap AS taiKhoan,
    ds.MaDoiSoat AS maDoiSoat,
    ds.LoaiQuyetToan AS loaiQuyetToan,
    ds.TienThueConNo AS tienThueConNoTrongDoiSoat,
    ISNULL(SUM(CASE WHEN hdNo.MaHoaDon IS NULL THEN 0 ELSE hdt.GiaThue END), 0) AS tienThueTheoHoaDonConNo,
    ds.TienDichVuConNo AS tienDichVuConNoTrongDoiSoat,
    ISNULL(SUM(ISNULL(dvNo.tienDichVuConNo, 0)), 0) AS tienDichVuTheoChiTietHoaDon,
    ds.TongKhauTru AS tongKhauTru,
    ds.SoTienHoanThucTe AS soTienHoanThucTe,
    ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
    CASE
        WHEN hdt.MaHopDong IS NULL THEN N'Khong co HoaDon vi khach chi co PhieuDatCoc, chua ky HopDong.'
        WHEN ds.TienThueConNo = ISNULL(SUM(CASE WHEN hdNo.MaHoaDon IS NULL THEN 0 ELSE hdt.GiaThue END), 0)
         AND ds.TienDichVuConNo = ISNULL(SUM(ISNULL(dvNo.tienDichVuConNo, 0)), 0)
            THEN N'OK - DoiSoat khop HoaDon/ChiTietHoaDon.'
        ELSE N'CAN KIEM TRA - DoiSoat chua khop HoaDon/ChiTietHoaDon.'
    END AS ghiChuKiemTra
FROM dbo.DoiSoat ds
JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = pt.MaHopDong
LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hdt.MaPhieuCoc)
JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hdt.MaKhachHang, pdc.MaKhachHang)
JOIN dbo.TaiKhoan tk ON tk.MaNguoiDung = kh.MaKhachHang
LEFT JOIN dbo.HoaDon hdNo
    ON hdNo.MaHopDong = hdt.MaHopDong
   AND hdNo.TrangThai IN (N'Chưa TT', N'Nợ')
OUTER APPLY (
    SELECT SUM(ISNULL(cthd.ThanhTien, 0)) AS tienDichVuConNo
    FROM dbo.ChiTietHoaDon cthd
    WHERE cthd.MaHoaDon = hdNo.MaHoaDon
) dvNo
WHERE tk.TenDangNhap IN ('kh9201', 'kh9202', 'kh9203', 'kh9204', 'kh9205', 'kh9206')
GROUP BY
    tk.TenDangNhap,
    ds.MaDoiSoat,
    ds.LoaiQuyetToan,
    ds.TienThueConNo,
    ds.TienDichVuConNo,
    ds.TongKhauTru,
    ds.SoTienHoanThucTe,
    ds.SoTienKhachPhaiTT,
    hdt.MaHopDong
ORDER BY tk.TenDangNhap;
GO

PRINT N'--- Chi tiet HoaDon/ChiTietHoaDon de doi chieu truoc khi khach xac nhan ---';
GO

SELECT
    tk.TenDangNhap AS taiKhoan,
    ds.MaDoiSoat AS maDoiSoat,
    CASE WHEN hdt.MaHopDong IS NULL THEN 'DAT_COC_CHUA_KY_HD' ELSE 'HOP_DONG_THUE' END AS loaiHoSo,
    hdt.MaHopDong AS maHopDong,
    pdc.MaPhieuDatCoc AS maPhieuDatCoc,
    hdNo.MaHoaDon AS maHoaDon,
    hdNo.KyThanhToan AS kyThanhToan,
    hdNo.TrangThai AS trangThaiHoaDon,
    hdNo.TongTien AS tongTienHoaDon,
    hdt.GiaThue AS tienThueTrongHoaDon,
    cthd.MaChiTietHD AS maChiTietHoaDon,
    dv.TenDichVu AS tenDichVu,
    cthd.SoLuong AS soLuong,
    cthd.DonViTinh AS donViTinh,
    cthd.DonGia AS donGia,
    cthd.ThanhTien AS thanhTienDichVu,
    CASE
        WHEN hdt.MaHopDong IS NULL THEN N'Khong co HoaDon/ChiTietHoaDon vi day la case chi co dat coc.'
        WHEN hdNo.MaHoaDon IS NULL THEN N'Khong co hoa don con no.'
        ELSE N'Dong dich vu trong ChiTietHoaDon; tien thue lay tu HopDongThue.GiaThue.'
    END AS ghiChuHoaDon
FROM dbo.DoiSoat ds
JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
LEFT JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = pt.MaHopDong
LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hdt.MaPhieuCoc)
JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hdt.MaKhachHang, pdc.MaKhachHang)
JOIN dbo.TaiKhoan tk ON tk.MaNguoiDung = kh.MaKhachHang
LEFT JOIN dbo.HoaDon hdNo
    ON hdNo.MaHopDong = hdt.MaHopDong
   AND hdNo.TrangThai IN (N'Chưa TT', N'Nợ')
LEFT JOIN dbo.ChiTietHoaDon cthd ON cthd.MaHoaDon = hdNo.MaHoaDon
LEFT JOIN dbo.DichVuHopDong dvhd ON dvhd.MaChiTietDVHD = cthd.MaChiTietDVHD
LEFT JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
WHERE tk.TenDangNhap IN ('kh9201', 'kh9202', 'kh9203', 'kh9204', 'kh9205', 'kh9206')
ORDER BY tk.TenDangNhap, hdNo.MaHoaDon, cthd.MaChiTietHD;
GO
