USE HOMEDORM4;
GO

SET DATEFORMAT ymd;
GO

PRINT N'============================================================';
PRINT N'DATA TEST NHAN PHONG: CU TRU -> HOP DONG -> THU TIEN -> BAN GIAO';
PRINT N'============================================================';

/*
    Muc dich:
    - HD9098: Ho so da duyet cu tru, da lap hop dong, CHUA thu tien ky dau.
              Dung de test tab "Ghi nhan thu phong" cua ke toan.
    - HD9099: Ho so da duyet cu tru, da lap hop dong, DA thu tien ky dau.
              Dung de test tab "Lap bien ban ban giao" cua quan ly.
    - HD9100: Thue ca phong/nguyen can, co 2 thanh vien cu tru, DA thu tien ky dau.
              Dung de test truong hop ban giao nguyen can.
    - DC9101: Phieu coc nguyen can con hieu luc, CHUA ghi nhan cu tru.
              Dung de test tab "Ghi nhan cu tru" cua sale.

    Luu y:
    - Script idempotent, co the chay lai nhieu lan.
    - Yeu cau da chay cac SP/schema bo sung cua SP_NhanPhong truoc do
      neu database goc chua co HoSoCuTru/ThanhVienCuTru/cac cot ban giao moi.
*/

/* ============================================================
   1. CLEANUP TEST DATA CU
   ============================================================ */
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @TestContracts TABLE (MaHopDong VARCHAR(6) PRIMARY KEY);

    INSERT INTO @TestContracts (MaHopDong)
    SELECT DISTINCT MaHopDong
    FROM dbo.HopDongThue
    WHERE MaHopDong IN ('HD9098', 'HD9099', 'HD9100')
       OR MaPhieuCoc IN ('DC9098', 'DC9099', 'DC9100', 'DC9101');

    DELETE FROM dbo.ChiTietBanGiao
    WHERE MaBienBan IN (
        SELECT MaBienBan FROM dbo.BienBanBanGiao
        WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts)
    );

    DELETE FROM dbo.BienBanBanGiao
    WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts)
       OR MaBienBan IN ('BG9098', 'BG9099', 'BG9100');

    DELETE FROM dbo.ChiTietHoaDon
    WHERE MaHoaDon IN (
        SELECT MaHoaDon FROM dbo.HoaDon
        WHERE MaHoaDon IN ('HO9098', 'HO9099', 'HO9100')
           OR MaHopDong IN (SELECT MaHopDong FROM @TestContracts)
    );

    DELETE FROM dbo.HoaDon
    WHERE MaHoaDon IN ('HO9098', 'HO9099', 'HO9100')
       OR MaHopDong IN (SELECT MaHopDong FROM @TestContracts);

    DELETE FROM dbo.ThanhVienHopDong
    WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts)
       OR MaThanhVien IN ('TV9098', 'TV9099', 'TV9101', 'TV9102');

    DELETE FROM dbo.DichVuHopDong
    WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts)
       OR MaChiTietDVHD IN ('VH9081', 'VH9082', 'VH9083', 'VH9091', 'VH9092', 'VH9093', 'VH9101', 'VH9102', 'VH9103');

    DELETE FROM dbo.QuiDinhHopDong
    WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts);

    DELETE FROM dbo.DieuKhoanViPhamHopDong
    WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts);

    DELETE FROM dbo.HopDongThue
    WHERE MaHopDong IN (SELECT MaHopDong FROM @TestContracts)
       OR MaPhieuCoc IN ('DC9098', 'DC9099', 'DC9100', 'DC9101');

    DELETE FROM dbo.ThanhVienHopDong
    WHERE MaHoSoCuTru IN (
            SELECT MaHoSoCuTru
            FROM dbo.HoSoCuTru
            WHERE MaHoSoCuTru IN ('CT9098', 'CT9099', 'CT9100')
               OR MaPhieuDatCoc IN ('DC9098', 'DC9099', 'DC9100', 'DC9101')
        )
       OR MaThanhVien IN ('TV9098', 'TV9099', 'TV9101', 'TV9102');

    IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.HoSoCuTru
        WHERE MaHoSoCuTru IN ('CT9098', 'CT9099', 'CT9100')
           OR MaPhieuDatCoc IN ('DC9098', 'DC9099', 'DC9100', 'DC9101');
    END

    DELETE FROM dbo.ChiTietDatCoc
    WHERE MaChiTietDC IN ('CD9098', 'CD9099', 'CD9100')
       OR MaPhieuDatCoc IN ('DC9098', 'DC9099', 'DC9100', 'DC9101');

    DELETE FROM dbo.PhieuDatCoc
    WHERE MaPhieuDatCoc IN ('DC9098', 'DC9099', 'DC9100', 'DC9101');

    DELETE FROM dbo.PDK_LoaiPhong
    WHERE MaDangKy IN ('DK9098', 'DK9099', 'DK9100', 'DK9101');

    DELETE FROM dbo.PhieuDangKy
    WHERE MaDangKy IN ('DK9098', 'DK9099', 'DK9100', 'DK9101');

    DELETE FROM dbo.TaiKhoan
    WHERE MaNguoiDung IN ('KH9098', 'KH9099', 'KH9100', 'KH9101');

    DELETE FROM dbo.KhachHang
    WHERE MaKhachHang IN ('KH9098', 'KH9099', 'KH9100', 'KH9101');

    DELETE FROM dbo.NguoiDung
    WHERE MaNguoiDung IN ('KH9098', 'KH9099', 'KH9100', 'KH9101');

    PRINT N'- Da cleanup data test HD9098/HD9099/HD9100/DC9101.';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

/* ============================================================
   2. DAM BAO DU LIEU NEN CHO PHONG/GIUONG/TAI SAN
   ============================================================ */
UPDATE dbo.LoaiPhong SET GiaThueNguyenPhong = 7200000
WHERE MaLoaiPhong = 'LP0002' AND (GiaThueNguyenPhong IS NULL OR GiaThueNguyenPhong = 0);

UPDATE dbo.LoaiPhong SET GiaThueNguyenPhong = 4400000
WHERE MaLoaiPhong = 'LP0001' AND (GiaThueNguyenPhong IS NULL OR GiaThueNguyenPhong = 0);

UPDATE dbo.LoaiPhong SET GiaThueNguyenPhong = 8400000
WHERE MaLoaiPhong = 'LP0003' AND (GiaThueNguyenPhong IS NULL OR GiaThueNguyenPhong = 0);

-- HD9098: ghep giuong P202-G02 phong nu, chua thu tien.
UPDATE dbo.Phong
SET TinhTrang = N'Còn chỗ',
    GioiTinhChoPhep = N'Nữ'
WHERE MaPhong = 'P202';

UPDATE dbo.Giuong
SET TinhTrang = N'Đã đặt cọc'
WHERE MaPhong = 'P202' AND MaGiuong = 'G02';

-- HD9099: nguyen phong P204, da thu tien, cho ban giao.
UPDATE dbo.Phong
SET TinhTrang = N'Đã đặt cọc',
    GioiTinhChoPhep = N'Nam'
WHERE MaPhong = 'P204';

UPDATE dbo.Giuong
SET TinhTrang = N'Đã đặt cọc'
WHERE MaPhong = 'P204';

-- HD9100: nguyen can P301, 2 thanh vien, da thu tien, cho ban giao.
UPDATE dbo.Phong
SET TinhTrang = N'Đã đặt cọc',
    GioiTinhChoPhep = N'Nữ'
WHERE MaPhong = 'P301';

UPDATE dbo.Giuong
SET TinhTrang = N'Đã đặt cọc'
WHERE MaPhong = 'P301';

-- DC9101: nguyen can P105, con hieu luc, chua ghi nhan cu tru.
UPDATE dbo.Phong
SET TinhTrang = N'Đã đặt cọc',
    GioiTinhChoPhep = N'Nữ'
WHERE MaPhong = 'P105';

UPDATE dbo.Giuong
SET TinhTrang = N'Đã đặt cọc'
WHERE MaPhong = 'P105';

PRINT N'- Da chuan bi trang thai phong/giuong P202-G02, P204, P301 va P105.';
GO

/* ============================================================
   3. TAO KHACH HANG, PHIEU DANG KY, PHIEU COC
   ============================================================ */
INSERT INTO dbo.NguoiDung (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung)
VALUES
    ('KH9098', N'Nguyễn Minh Ngân', '2001-05-12', N'Nữ', '0988009098', 'kh9098@homedorm.vn', NULL, 'KhachHang'),
    ('KH9099', N'Lê Hoàng Bàn Giao', '2000-09-20', N'Nam', '0988009099', 'kh9099@homedorm.vn', NULL, 'KhachHang'),
    ('KH9100', N'Trần Mai Nguyên Căn', '2001-11-18', N'Nữ', '0988009100', 'kh9100@homedorm.vn', NULL, 'KhachHang'),
    ('KH9101', N'Đặng Ngọc Nguyên Căn', '2002-08-14', N'Nữ', '0988009101', 'kh9101@homedorm.vn', NULL, 'KhachHang');

INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
VALUES
    ('KH9098', N'Việt Nam', '079200009098'),
    ('KH9099', N'Việt Nam', '079200009099'),
    ('KH9100', N'Việt Nam', '079200009100'),
    ('KH9101', N'Việt Nam', '079200009102');

INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
VALUES
    ('kh9098', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9098'),
    ('kh9099', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9099'),
    ('kh9100', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9100'),
    ('kh9101', 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', 'KH9101');

INSERT INTO dbo.PhieuDangKy (
    MaDangKy, NgayDangKy, SoNam, SoNu, SoNguoiDuKienO,
    KhuVucMongMuon, MucGiaToiDa, ThoiGianDuKienVaoO, ThoiHanThue,
    YeuCauKhac, TrangThai, MaKhachHang, MaNhanVienSale
)
VALUES
    ('DK9098', '2026-06-12', 0, 1, 1, N'Thủ Đức', 2500000, '2026-07-01', 6,
     N'Test nhận phòng: hợp đồng đã lập, chờ kế toán thu tiền.', N'Xác nhận cọc', 'KH9098', 'NV0001'),
    ('DK9099', '2026-06-12', 1, 0, 1, N'Thủ Đức', 10000000, '2026-07-01', 6,
     N'Test nhận phòng: đã thu tiền, chờ quản lý bàn giao.', N'Xác nhận cọc', 'KH9099', 'NV0001'),
    ('DK9100', '2026-06-13', 0, 2, 2, N'Thủ Đức', 5000000, '2026-07-01', 6,
     N'Test nhận phòng: thuê nguyên căn/phòng, nhóm 2 nữ, chờ bàn giao.', N'Xác nhận cọc', 'KH9100', 'NV0001'),
    ('DK9101', '2026-06-14', 0, 3, 3, N'Thủ Đức', 9000000, '2026-07-02', 6,
     N'Test ghi nhận cư trú: thuê nguyên căn, nhóm 3 nữ, chưa lập hợp đồng.', N'Xác nhận cọc', 'KH9101', 'NV0001');

INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong)
VALUES
    ('DK9098', 'LP0001'),
    ('DK9099', 'LP0002'),
    ('DK9100', 'LP0001'),
    ('DK9101', 'LP0003');

INSERT INTO dbo.PhieuDatCoc (
    MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc,
    PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT,
    ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc,
    MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
)
VALUES
    ('DC9098', '2026-06-15 08:00:00', '2026-06-17 08:00:00', 2800000,
     N'Chuyển khoản', N'Đã TT', '2026-06-15 09:00:00',
     '/uploads/chung-tu-coc/DC9098.pdf', '2026-07-01 08:00:00', N'Ghép giường', N'Đã lập HĐ',
     'DK9098', 'KH9098', 'NV0004'),
    ('DC9099', '2026-06-15 08:30:00', '2026-06-17 08:30:00', 5000000,
     N'Chuyển khoản', N'Đã TT', '2026-06-15 09:30:00',
     '/uploads/chung-tu-coc/DC9099.pdf', '2026-07-01 08:30:00', N'Nguyên phòng', N'Đã lập HĐ',
     'DK9099', 'KH9099', 'NV0004'),
    ('DC9100', '2026-06-15 09:00:00', '2026-06-17 09:00:00', 4400000,
     N'Chuyển khoản', N'Đã TT', '2026-06-15 10:00:00',
     '/uploads/chung-tu-coc/DC9100.pdf', '2026-07-01 09:00:00', N'Nguyên phòng', N'Đã lập HĐ',
     'DK9100', 'KH9100', 'NV0004'),
    ('DC9101', '2026-06-16 09:00:00', '2026-06-18 09:00:00', 8400000,
     N'Chuyển khoản', N'Đã TT', '2026-06-16 10:00:00',
     '/uploads/chung-tu-coc/DC9101.pdf', '2026-07-02 09:00:00', N'Nguyên phòng', N'Hiệu lực',
     'DK9101', 'KH9101', 'NV0004');

INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
VALUES
    ('CD9098', 'DC9098', 'P202', 'G02', 1400000),
    ('CD9099', 'DC9099', 'P204', NULL, 7200000),
    ('CD9100', 'DC9100', 'P301', NULL, 4400000),
    ('CD9101', 'DC9101', 'P105', NULL, 8400000);

PRINT N'- Da tao phieu dang ky/coc cho DC9098, DC9099, DC9100 va DC9101.';
GO

/* ============================================================
   4. TAO HO SO CU TRU DA DUYET
   ============================================================ */
IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.HoSoCuTru (
        MaHoSoCuTru, MaPhieuDatCoc, MaNhanVienSale, MaNhanVienQuanLy,
        TrangThaiHoSo, DaDoiChieuGiayTo, NgayCapNhat, NgayGuiDuyet, NgayDuyet,
        GhiChuSale, GhiChuQuanLy
    )
    VALUES
        ('CT9098', 'DC9098', 'NV0001', 'NV0003', N'Đã duyệt cư trú', 1,
         '2026-06-20 08:00:00', '2026-06-20 09:00:00', '2026-06-20 10:00:00',
         N'Đã đối chiếu giấy tờ khách đến nhận phòng.', N'Đủ điều kiện lưu trú.'),
        ('CT9099', 'DC9099', 'NV0001', 'NV0003', N'Đã duyệt cư trú', 1,
         '2026-06-20 08:30:00', '2026-06-20 09:30:00', '2026-06-20 10:30:00',
         N'Đã đối chiếu giấy tờ khách đến nhận phòng.', N'Đủ điều kiện lưu trú.'),
        ('CT9100', 'DC9100', 'NV0001', 'NV0003', N'Đã duyệt cư trú', 1,
         '2026-06-20 09:00:00', '2026-06-20 10:00:00', '2026-06-20 11:00:00',
         N'Đã đối chiếu giấy tờ nhóm thuê nguyên căn.', N'Cả nhóm đủ điều kiện lưu trú.');
END

INSERT INTO dbo.ThanhVienHopDong (
    MaThanhVien, MaHoSoCuTru, MaHopDong, HoTen, NgaySinh, GioiTinh,
    CCCD, SDT, Email, QuocTich, TrangThai, LyDoTuChoi
)
VALUES
    ('TV9098', 'CT9098', NULL, N'Nguyễn Minh Ngân', '2001-05-12', N'Nữ',
     '079200009098', '0988009098', 'kh9098@homedorm.vn', N'Việt Nam', N'Đủ điều kiện', NULL),
    ('TV9099', 'CT9099', NULL, N'Lê Hoàng Bàn Giao', '2000-09-20', N'Nam',
     '079200009099', '0988009099', 'kh9099@homedorm.vn', N'Việt Nam', N'Đủ điều kiện', NULL),
    ('TV9101', 'CT9100', NULL, N'Trần Mai Nguyên Căn', '2001-11-18', N'Nữ',
     '079200009100', '0988009100', 'kh9100@homedorm.vn', N'Việt Nam', N'Đủ điều kiện', NULL),
    ('TV9102', 'CT9100', NULL, N'Phạm Thu Hòa', '2002-03-09', N'Nữ',
     '079200009101', '0988009101', 'hoa9100@homedorm.vn', N'Việt Nam', N'Đủ điều kiện', NULL);
GO

/* ============================================================
   5. TAO HOP DONG VA DICH VU
   ============================================================ */
INSERT INTO dbo.HopDongThue (
    MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc,
    SoGiuongThue, GiaThue, KyThanhToan, TrangThai,
    MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy
)
VALUES
    ('HD9098', '2026-06-25', '2026-07-01', '2027-01-01',
     1, 1400000, N'Hàng tháng', N'Hiệu lực', 'DC9098', 'KH9098', 'NV0003'),
    ('HD9099', '2026-06-25', '2026-07-01', '2027-01-01',
     4, 7200000, N'Hàng tháng', N'Hiệu lực', 'DC9099', 'KH9099', 'NV0003'),
    ('HD9100', '2026-06-25', '2026-07-01', '2027-01-01',
     2, 4400000, N'Hàng tháng', N'Hiệu lực', 'DC9100', 'KH9100', 'NV0003');

UPDATE dbo.ThanhVienHopDong
SET MaHopDong = 'HD9098', TrangThai = N'Đang ở'
WHERE MaThanhVien = 'TV9098';

UPDATE dbo.ThanhVienHopDong
SET MaHopDong = 'HD9099', TrangThai = N'Đang ở'
WHERE MaThanhVien = 'TV9099';

UPDATE dbo.ThanhVienHopDong
SET MaHopDong = 'HD9100', TrangThai = N'Đang ở'
WHERE MaThanhVien IN ('TV9101', 'TV9102');

INSERT INTO dbo.DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu)
VALUES
    ('VH9081', 'DV0001', 'HD9098', N'Dịch vụ bắt buộc'),
    ('VH9082', 'DV0002', 'HD9098', N'Dịch vụ bắt buộc'),
    ('VH9083', 'DV0003', 'HD9098', N'Wifi tháng đầu'),
    ('VH9091', 'DV0001', 'HD9099', N'Dịch vụ bắt buộc'),
    ('VH9092', 'DV0002', 'HD9099', N'Dịch vụ bắt buộc'),
    ('VH9093', 'DV0003', 'HD9099', N'Wifi tháng đầu'),
    ('VH9101', 'DV0001', 'HD9100', N'Dịch vụ bắt buộc'),
    ('VH9102', 'DV0002', 'HD9100', N'Dịch vụ bắt buộc'),
    ('VH9103', 'DV0003', 'HD9100', N'Wifi tháng đầu');

PRINT N'- Da tao HD9098 chua thu tien, HD9099 va HD9100 da san sang thu/bangiao.';
GO

/* ============================================================
   6. TAO HOA DON DA THANH TOAN CHO CASE CHO BAN GIAO
   ============================================================ */
INSERT INTO dbo.HoaDon (
    MaHoaDon, KyThanhToan, NgayLap, NgayHanTT, TongTien,
    TrangThai, NgayThanhToan, PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan
)
VALUES (
    'HO9099', '2026-07', '2026-07-01', '2026-07-05', 7300000,
    N'Đã TT', '2026-07-01', N'Chuyển khoản', 'HD9099', 'NV0004'
),
(
    'HO9100', '2026-07', '2026-07-01', '2026-07-05', 4500000,
    N'Đã TT', '2026-07-01', N'Chuyển khoản', 'HD9100', 'NV0004'
);

INSERT INTO dbo.ChiTietHoaDon (
    MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien,
    MaHoaDon, MaChiTietDVHD, MaPhieuGhi
)
VALUES
    ('CT9091', 1, N'tháng', 7200000, 7200000, 'HO9099', 'VH9091', NULL),
    ('CT9092', 1, N'tháng', 100000, 100000, 'HO9099', 'VH9093', NULL),
    ('CT9101', 1, N'tháng', 4400000, 4400000, 'HO9100', 'VH9101', NULL),
    ('CT9102', 1, N'tháng', 100000, 100000, 'HO9100', 'VH9103', NULL);

PRINT N'- Da tao hoa don HO9099/HO9100 trang thai Da TT de vao danh sach cho ban giao.';
GO

/* ============================================================
   7. KIEM TRA NHANH CAC DIEM TREN UI
   ============================================================ */
PRINT N'============================================================';
PRINT N'KET QUA DATA TEST';
PRINT N'============================================================';

SELECT
    hd.MaHopDong,
    nd.HoTen,
    pdc.MaPhieuDatCoc,
    pdc.HinhThucThue,
    hd.GiaThue,
    hd.TrangThai AS TrangThaiHopDong,
    ISNULL(hdtt.TrangThai, N'Chưa có hóa đơn') AS TrangThaiHoaDonKyDau,
    CASE
        WHEN hd.MaHopDong = 'HD9098' THEN N'Test kế toán ghi nhận thu tiền nhận phòng'
        WHEN hd.MaHopDong = 'HD9099' THEN N'Test quản lý lập biên bản bàn giao vào'
        WHEN hd.MaHopDong = 'HD9100' THEN N'Test quản lý bàn giao nguyên căn/thuê cả phòng'
    END AS MucDichTest
FROM dbo.HopDongThue hd
JOIN dbo.KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
OUTER APPLY (
    SELECT TOP 1 h.TrangThai
    FROM dbo.HoaDon h
    WHERE h.MaHopDong = hd.MaHopDong
    ORDER BY h.NgayLap ASC, h.MaHoaDon ASC
) hdtt
WHERE hd.MaHopDong IN ('HD9098', 'HD9099', 'HD9100')
ORDER BY hd.MaHopDong;

PRINT N'- Vao tab Ke toan/Ghi nhan thu phong: tim HD9098.';
PRINT N'- Vao tab Quan ly/Lap bien ban ban giao: tim HD9099.';
PRINT N'- Vao tab Quan ly/Lap bien ban ban giao: tim HD9100 de test nguyen can.';
GO


-- Test pull
