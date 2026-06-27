USE HOMEDORM4;
GO
SET DATEFORMAT ymd;
GO

/* ================================================================
   FILE: 04_test_trigger_data.sql
   Mục đích: Thêm một cụm dữ liệu nhỏ, có logic, để test các trigger đã chốt.

   Thứ tự chạy đề xuất:
   1) schema.sql
   2) Data.sql
   3) 01_triggers_basic.sql
   4) 03_backfill.sql
   5) 04_test_trigger_data.sql  <-- file này

   Ghi chú:
   - File có cleanup ở đầu để chạy lại nhiều lần không bị trùng khóa chính.
   - Các cột suy diễn cố tình để NULL/sai tạm thời, để trigger tự cập nhật.
   ================================================================ */

/* ================================================================
   0. CLEANUP DỮ LIỆU TEST CŨ NẾU CÓ
   ================================================================ */
DELETE FROM DoiSoat               WHERE MaDoiSoat IN ('DS9001');
DELETE FROM ChiTietHuHong         WHERE MaChiTietHH IN ('HH9001', 'HH9002');
DELETE FROM BienBanKiemTraPhong   WHERE MaBienBanKT IN ('BK9001');
DELETE FROM PhieuTraPhong         WHERE MaPhieuTra IN ('PT9001');
DELETE FROM BienBanViPham         WHERE MaBBViPham IN ('BV9001', 'BV9002');
DELETE FROM ChiTietHoaDon         WHERE MaChiTietHD IN ('CH9001', 'CH9002', 'CH9003');
DELETE FROM HoaDon                WHERE MaHoaDon IN ('HO9001');
DELETE FROM PhieuGhiChiSo         WHERE MaPhieuGhi IN ('PG9001');
DELETE FROM ThanhVienHopDong      WHERE MaThanhVien IN ('TV9001', 'TV9002', 'TV9003', 'TV9004');
DELETE FROM DichVuHopDong         WHERE MaChiTietDVHD IN ('VH9001', 'VH9002', 'VH9003');
DELETE FROM HopDongThue           WHERE MaHopDong IN ('HD9001', 'HD9002');
DELETE FROM ChiTietDatCoc         WHERE MaChiTietDC IN ('CD9001', 'CD9002', 'CD9003');
DELETE FROM PhieuDatCoc           WHERE MaPhieuDatCoc IN ('DC9001', 'DC9002');
DELETE FROM PhieuDangKy           WHERE MaDangKy IN ('DK9001', 'DK9002');
DELETE FROM TaiSan                WHERE MaPhong IN ('T101', 'T102');
DELETE FROM Giuong                WHERE MaPhong IN ('T101', 'T102');
DELETE FROM Phong                 WHERE MaPhong IN ('T101', 'T102');
DELETE FROM LoaiPhong             WHERE MaLoaiPhong IN ('LP9001');
GO

/* ================================================================
   1. TEST LoaiPhong.GiaThueNguyenPhong
   Trigger test: TRG_LoaiPhong_TinhGiaThueNguyenPhong
   Expected: LP9001.GiaThueNguyenPhong = 2 * 2500000 = 5000000
   ================================================================ */
INSERT INTO LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
VALUES ('LP9001', N'Phòng test 2 người', 2, N'Dữ liệu test trigger', 2500000, NULL);
GO
SELECT * FROM LoaiPhong WHERE MaLoaiPhong = 'LP9001';
GO

INSERT INTO Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong) VALUES
    ('T101', N'Phòng test nguyên phòng', N'Không phân biệt', N'Trống', 'CN0001', 'LP9001'),
    ('T102', N'Phòng test ghép giường',  N'Không phân biệt', N'Trống', 'CN0001', 'LP9001');
GO
SELECT * FROM Phong WHERE MaPhong IN ('T101', 'T102') ORDER BY MaPhong;
GO

INSERT INTO Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES
    ('T101', 'G01', 1, N'Trống'),
    ('T101', 'G02', 2, N'Trống'),
    ('T102', 'G01', 1, N'Trống'),
    ('T102', 'G02', 2, N'Trống');
GO
SELECT * FROM Giuong WHERE MaPhong IN ('T101', 'T102') ORDER BY MaPhong, MaGiuong;
GO

INSERT INTO TaiSan (MaPhong, MaTaiSan, TenTaiSan, SoLuong, DonGia) VALUES
    ('T101', 'TS0001', N'Giường', 2, 1800000),
    ('T101', 'TS0002', N'Nệm', 2, 900000),
    ('T102', 'TS0001', N'Giường', 2, 1800000),
    ('T102', 'TS0002', N'Nệm', 2, 900000);
GO
SELECT * FROM TaiSan WHERE MaPhong IN ('T101', 'T102') ORDER BY MaPhong, MaTaiSan;
GO

SELECT N'1. LoaiPhong' AS TestCase,
       MaLoaiPhong, SucChuaToiDa, GiaThueTheoGiuong, GiaThueNguyenPhong,
       CASE WHEN GiaThueNguyenPhong = 5000000 THEN N'OK' ELSE N'KIỂM TRA LẠI' END AS KetQua
FROM LoaiPhong
WHERE MaLoaiPhong = 'LP9001';
GO

/* ================================================================
   2. TEST ChiTietDatCoc.GiaThue + PhieuDatCoc.SoTienCoc
   Trigger test:
   - TRG_CTDatCoc_TinhGiaThue
   - TRG_PhieuDatCoc_TinhSoTienCoc

   Case A: Thuê nguyên phòng T101
     Expected CD9001.GiaThue = 5000000
     Expected DC9001.SoTienCoc = 5000000 * 2 = 10000000

   Case B: Thuê ghép 2 giường T102
     Expected mỗi dòng GiaThue = 2500000
     Expected DC9002.SoTienCoc = (2500000 + 2500000) * 2 = 10000000
   ================================================================ */
INSERT INTO PhieuDangKy (MaDangKy, NgayDangKy, SoNguoiDuKienO, GioiTinh, HinhThucThue, KhuVucMongMuon, LoaiPhongYeuCau, MucGia, ThoiGianDuKienVaoO, ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang, MaNhanVienSale) VALUES
    ('DK9001', '2026-04-01', 2, NULL,   N'Nguyên căn', N'Quận 1', N'Phòng test 2 người', 5000000, '2026-04-05', 12, N'Test thuê nguyên phòng', N'Chấp nhận', 'KH0001', 'NV0001'),
    ('DK9002', '2026-04-01', 2, N'Nam', N'Ghép',       N'Quận 1', N'Phòng test 2 người', 2500000, '2026-04-05', 12, N'Test thuê ghép 2 giường', N'Chấp nhận', 'KH0002', 'NV0001');
GO
SELECT * FROM PhieuDangKy WHERE MaDangKy IN ('DK9001', 'DK9002') ORDER BY MaDangKy;
GO

INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT, ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan) VALUES
    ('DC9001', '2026-04-02 09:00:00', '2026-04-03 09:00:00', NULL, N'Chuyển khoản', N'Đã TT', '2026-04-02 09:30:00', '/test/DC9001.pdf', '2026-04-05 09:00:00', N'Nguyên phòng', N'Đã lập HĐ', 'DK9001', 'KH0001', 'NV0004'),
    ('DC9002', '2026-04-02 10:00:00', '2026-04-03 10:00:00', NULL, N'Tiền mặt',     N'Đã TT', '2026-04-02 10:30:00', '/test/DC9002.pdf', '2026-04-05 10:00:00', N'Ghép giường',  N'Đã lập HĐ', 'DK9002', 'KH0002', 'NV0004');
GO
SELECT * FROM PhieuDatCoc WHERE MaPhieuDatCoc IN ('DC9001', 'DC9002') ORDER BY MaPhieuDatCoc;
GO

INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue) VALUES
    ('CD9001', 'DC9001', 'T101', NULL,  NULL),
    ('CD9002', 'DC9002', 'T102', 'G01', NULL),
    ('CD9003', 'DC9002', 'T102', 'G02', NULL);
GO
SELECT * FROM ChiTietDatCoc WHERE MaChiTietDC IN ('CD9001', 'CD9002', 'CD9003') ORDER BY MaChiTietDC;
GO
SELECT * FROM PhieuDatCoc WHERE MaPhieuDatCoc IN ('DC9001', 'DC9002') ORDER BY MaPhieuDatCoc;
GO

SELECT N'2A. ChiTietDatCoc.GiaThue' AS TestCase,
       MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue
FROM ChiTietDatCoc
WHERE MaChiTietDC IN ('CD9001', 'CD9002', 'CD9003')
ORDER BY MaChiTietDC;

SELECT N'2B. PhieuDatCoc.SoTienCoc' AS TestCase,
       MaPhieuDatCoc, HinhThucThue, SoTienCoc,
       CASE WHEN SoTienCoc = 10000000 THEN N'OK' ELSE N'KIỂM TRA THỨ TỰ TRIGGER ChiTietDatCoc' END AS KetQua
FROM PhieuDatCoc
WHERE MaPhieuDatCoc IN ('DC9001', 'DC9002')
ORDER BY MaPhieuDatCoc;
GO

/* ================================================================
   3. TEST HopDongThue.SoGiuongThue + HopDongThue.GiaThue
   Trigger test: TRG_HopDongThue_TinhGiaThueSoGiuong

   Expected:
   - HD9001 nguyên phòng: SoGiuongThue = 2, GiaThue = 5000000
   - HD9002 ghép 2 giường: SoGiuongThue = 2, GiaThue = 5000000
   ================================================================ */
INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy) VALUES
    ('HD9001', '2026-04-04', '2026-04-05', '2027-04-05', NULL, NULL, N'Hàng tháng', N'Hiệu lực', 'DC9001', 'KH0001', 'NV0003'),
    ('HD9002', '2026-04-04', '2026-04-05', '2027-04-05', NULL, NULL, N'Hàng quý',   N'Hiệu lực', 'DC9002', 'KH0002', 'NV0003');
GO
SELECT * FROM HopDongThue WHERE MaHopDong IN ('HD9001', 'HD9002') ORDER BY MaHopDong;
GO

INSERT INTO ThanhVienHopDong (MaThanhVien, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, MaHopDong) VALUES
    ('TV9001', N'Nguyễn Test Một', '2000-01-01', N'Nam', '079299990001', '0999000001', 'test1@mail.com', N'Việt Nam', N'Đang ở', 'HD9001'),
    ('TV9002', N'Trần Test Hai',   '2000-02-02', N'Nữ',  '079299990002', '0999000002', 'test2@mail.com', N'Việt Nam', N'Đang ở', 'HD9001'),
    ('TV9003', N'Lê Test Ba',      '2000-03-03', N'Nam', '079299990003', '0999000003', 'test3@mail.com', N'Việt Nam', N'Đang ở', 'HD9002'),
    ('TV9004', N'Phạm Test Bốn',   '2000-04-04', N'Nam', '079299990004', '0999000004', 'test4@mail.com', N'Việt Nam', N'Đang ở', 'HD9002');
GO
SELECT * FROM ThanhVienHopDong WHERE MaThanhVien IN ('TV9001', 'TV9002', 'TV9003', 'TV9004') ORDER BY MaThanhVien;
GO

SELECT N'3. HopDongThue' AS TestCase,
       MaHopDong, MaPhieuCoc, KyThanhToan, SoGiuongThue, GiaThue,
       CASE WHEN SoGiuongThue = 2 AND GiaThue = 5000000 THEN N'OK' ELSE N'KIỂM TRA LẠI' END AS KetQua
FROM HopDongThue
WHERE MaHopDong IN ('HD9001', 'HD9002')
ORDER BY MaHopDong;
GO

/* ================================================================
   4. TEST PhieuGhiChiSo.KyGhi
   Trigger test: TRG_PhieuGhiChiSo_SetKyGhi
   Expected: PG9001.KyGhi = 2026-04
   ================================================================ */
INSERT INTO PhieuGhiChiSo (MaPhieuGhi, KyGhi, NgayGhi, ChiSoNuocDau, ChiSoNuocCuoi, ChiSoDienDau, ChiSoDienCuoi, TrangThai, MaNhanVienQuanLy, MaPhong)
VALUES ('PG9001', 'TEMP', '2026-04-30', 100, 112, 500, 580, N'Chưa Lập HD', 'NV0003', 'T101');
GO
SELECT * FROM PhieuGhiChiSo WHERE MaPhieuGhi = 'PG9001';
GO

SELECT N'4. PhieuGhiChiSo.KyGhi' AS TestCase,
       MaPhieuGhi, NgayGhi, KyGhi,
       CASE WHEN KyGhi = '2026-04' THEN N'OK' ELSE N'KIỂM TRA LẠI' END AS KetQua
FROM PhieuGhiChiSo
WHERE MaPhieuGhi = 'PG9001';
GO

/* ================================================================
   5. TEST ChiTietHoaDon.ThanhTien + HoaDon.TongTien
   Trigger test:
   - TRG_ChiTietHoaDon_TinhThanhTien
   - TRG_HoaDon_TinhTongTien_OnDelete

   Lưu ý: trigger hiện tại KHÔNG tự tính SoLuong điện/nước, nên file test nhập sẵn SoLuong.
   Expected:
   - CH9001: 80 kWh * 4000 = 320000
   - CH9002: 1 tháng wifi * 100000 = 100000
   - HO9001.TongTien = 420000
   ================================================================ */
INSERT INTO DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu) VALUES
    ('VH9001', 'DV0001', 'HD9001', N'Test điện cho HD9001'),
    ('VH9002', 'DV0003', 'HD9001', N'Test wifi cho HD9001'),
    ('VH9003', 'DV0005', 'HD9001', N'Test vệ sinh cho HD9001');
GO
SELECT * FROM DichVuHopDong WHERE MaChiTietDVHD IN ('VH9001', 'VH9002', 'VH9003') ORDER BY MaChiTietDVHD;
GO

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, NgayHanTT, TongTien, TrangThai, NgayThanhToan, PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan)
VALUES ('HO9001', '2026-04', '2026-04-30', '2026-05-05', NULL, N'Chưa TT', NULL, NULL, 'HD9001', 'NV0004');
GO
SELECT * FROM HoaDon WHERE MaHoaDon = 'HO9001';
GO

INSERT INTO ChiTietHoaDon (MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien, MaHoaDon, MaChiTietDVHD, MaPhieuGhi) VALUES
    ('CH9001', 80, 'kWh',   4000,   NULL, 'HO9001', 'VH9001', 'PG9001'),
    ('CH9002', 1,  'tháng', 100000, NULL, 'HO9001', 'VH9002', NULL);
GO
SELECT * FROM ChiTietHoaDon WHERE MaChiTietHD IN ('CH9001', 'CH9002') ORDER BY MaChiTietHD;
GO
SELECT * FROM HoaDon WHERE MaHoaDon = 'HO9001';
GO

SELECT N'5A. ChiTietHoaDon.ThanhTien' AS TestCase,
       MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien
FROM ChiTietHoaDon
WHERE MaChiTietHD IN ('CH9001', 'CH9002')
ORDER BY MaChiTietHD;

SELECT N'5B. HoaDon.TongTien sau INSERT chi tiết' AS TestCase,
       MaHoaDon, TongTien,
       CASE WHEN TongTien = 420000 THEN N'OK' ELSE N'KIỂM TRA LẠI' END AS KetQua
FROM HoaDon
WHERE MaHoaDon = 'HO9001';
GO

-- Test thêm nhánh DELETE: xóa dòng wifi, TongTien phải còn 320000.
DELETE FROM ChiTietHoaDon WHERE MaChiTietHD = 'CH9002';
GO

SELECT N'5C. HoaDon.TongTien sau DELETE chi tiết' AS TestCase,
       MaHoaDon, TongTien,
       CASE WHEN TongTien = 320000 THEN N'OK' ELSE N'KIỂM TRA LẠI TRIGGER DELETE' END AS KetQua
FROM HoaDon
WHERE MaHoaDon = 'HO9001';
GO

/* ================================================================
   6. TEST BienBanKiemTraPhong.TongChiPhiSuaChua
   Trigger test: TRG_ChiTietHuHong_CapNhatTongSuaChua
   Expected: BK9001.TongChiPhiSuaChua = 300000 + 250000 = 550000
   ================================================================ */
INSERT INTO PhieuTraPhong (MaPhieuTra, NgayDangKyTra, NgayDuKienTra, NgayTraThucTe, TrangThai, MaHopDong, MaPhieuDatCoc)
VALUES ('PT9001', '2026-06-01', '2026-06-05', '2026-06-05', N'Chờ đối soát', 'HD9001', 'DC9001');
GO
SELECT * FROM PhieuTraPhong WHERE MaPhieuTra = 'PT9001';
GO

INSERT INTO BienBanKiemTraPhong (MaBienBanKT, MaPhieuTra, MaNhanVienQL, NgayKiemTra, TinhTrangPhong, TongChiPhiSuaChua)
VALUES ('BK9001', 'PT9001', 'NV0003', '2026-06-05', N'Test: hư nệm và mất chìa khóa', 0);
GO
SELECT * FROM BienBanKiemTraPhong WHERE MaBienBanKT = 'BK9001';
GO

INSERT INTO ChiTietHuHong (MaChiTietHH, MaBienBanKT, MaPhong, MaTaiSan, MoTaHuHong, ChiPhiSuaChua) VALUES
    ('HH9001', 'BK9001', 'T101', 'TS0001', N'Giường bị trầy', 300000),
    ('HH9002', 'BK9001', 'T101', 'TS0002', N'Nệm bị bẩn cần vệ sinh', 250000);
GO
SELECT * FROM ChiTietHuHong WHERE MaChiTietHH IN ('HH9001', 'HH9002') ORDER BY MaChiTietHH;
GO
SELECT * FROM BienBanKiemTraPhong WHERE MaBienBanKT = 'BK9001';
GO

SELECT N'6. BienBanKiemTraPhong.TongChiPhiSuaChua' AS TestCase,
       MaBienBanKT, TongChiPhiSuaChua,
       CASE WHEN TongChiPhiSuaChua = 550000 THEN N'OK' ELSE N'KIỂM TRA LẠI' END AS KetQua
FROM BienBanKiemTraPhong
WHERE MaBienBanKT = 'BK9001';
GO

/* ================================================================
   7. TEST BienBanViPham.SoTienPhat
   Trigger test: TRG_BienBanViPham_TinhSoTienPhat
   Expected:
   - BV9001 dùng VP0003: Phạt tiền 200000
   - BV9002 dùng VP0005: Nhắc nhở => 0
   ================================================================ */
INSERT INTO BienBanViPham (MaBBViPham, NgayViPham, MoTaViPham, SoTienPhat, TrangThai, MaKhachHang, MaHopDong, MaDieuKhoan) VALUES
    ('BV9001', '2026-05-10', N'Test gây ồn sau giờ quy định', NULL, N'Chờ xử lý', 'KH0001', 'HD9001', 'VP0003'),
    ('BV9002', '2026-05-11', N'Test nhắc nhở vệ sinh phòng',   NULL, N'Chờ xử lý', 'KH0002', 'HD9002', 'VP0005');
GO
SELECT * FROM BienBanViPham WHERE MaBBViPham IN ('BV9001', 'BV9002') ORDER BY MaBBViPham;
GO

SELECT N'7. BienBanViPham.SoTienPhat' AS TestCase,
       MaBBViPham, MaDieuKhoan, SoTienPhat,
       CASE
           WHEN MaBBViPham = 'BV9001' AND SoTienPhat = 200000 THEN N'OK'
           WHEN MaBBViPham = 'BV9002' AND SoTienPhat = 0      THEN N'OK'
           ELSE N'KIỂM TRA LẠI'
       END AS KetQua
FROM BienBanViPham
WHERE MaBBViPham IN ('BV9001', 'BV9002')
ORDER BY MaBBViPham;
GO

/* ================================================================
   8. OPTIONAL: TEST BACKFILL DoiSoat
   Trigger không tự tính DoiSoat. Nếu muốn test SP backfill thì chạy block này.
   Expected sau EXEC SP_Backfill_DuLieuSuyDienNull:
   - TienCocBanDau lấy từ DC9001
   - TongChiPhiSuaChua lấy từ BK9001
   - TienPhat cộng BV9001 nếu trạng thái Chờ xử lý
   ================================================================ */
INSERT INTO DoiSoat (MaDoiSoat, NgayLap, TienCocBanDau, SoThangLuuTru, TyLeHoanCocHienTai, TienCocDuocHoan, TienThueConNo, TienDichVuConNo, TongChiPhiSuaChua, TienPhat, TongKhauTru, SoTienHoanThucTe, SoTienKhachPhaiTT, PhuongThucThanhToan, TrangThai, MaNhanVienKeToan, MaPhieuTra, MaQuyDinhHoanCoc)
VALUES ('DS9001', '2026-06-05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Chuyển khoản', N'Chờ xác nhận', 'NV0004', 'PT9001', NULL);
GO
SELECT * FROM DoiSoat WHERE MaDoiSoat = 'DS9001';
GO

-- Test SP tính đối soát cho phiếu trả phòng PT9001
EXEC SP_TinhDoiSoat @MaPhieuTra = 'PT9001';
GO

SELECT N'8. DoiSoat sau khi chạy SP_TinhDoiSoat' AS TestCase,
       MaDoiSoat, TienCocBanDau, SoThangLuuTru, TyLeHoanCocHienTai,
       TienCocDuocHoan, TienThueConNo, TienDichVuConNo,
       TongChiPhiSuaChua, TienPhat, TongKhauTru,
       SoTienHoanThucTe, SoTienKhachPhaiTT
FROM DoiSoat
WHERE MaDoiSoat = 'DS9001';
GO
