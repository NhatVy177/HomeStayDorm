/* ============================================================
   KỊCH BẢN DỮ LIỆU TEST CHỨC NĂNG BÀN GIAO PHÒNG
   ============================================================ */

-- Xóa dữ liệu test cũ nếu đã tồn tại để tránh trùng lặp
-- A. Xóa dữ liệu các bảng tham chiếu phụ thuộc sâu nhất
DELETE FROM dbo.ChiTietBanGiao WHERE MaBienBan IN ('BB_T01', 'BB_T02') OR MaPhong IN ('P104', 'P204', 'P302', 'P303');
DELETE FROM dbo.BienBanBanGiao WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');
DELETE FROM dbo.ChiTietHoaDon WHERE MaHoaDon IN ('HD_IV1', 'HD_IV2', 'HD_IV3', 'HD_IV4');

-- B. Xóa dữ liệu các bảng tham chiếu trực tiếp đến HopDongThue
DELETE FROM dbo.ThanhVienHopDong WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');
DELETE FROM dbo.DichVuHopDong WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');
DELETE FROM dbo.YeuCauSuaChua WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');
DELETE FROM dbo.BienBanViPham WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');
DELETE FROM dbo.PhieuTraPhong WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');
DELETE FROM dbo.HoaDon WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04') OR MaHoaDon IN ('HD_IV1', 'HD_IV2', 'HD_IV3', 'HD_IV4');

-- C. Xóa Hợp đồng
DELETE FROM dbo.HopDongThue WHERE MaHopDong IN ('HD_T01', 'HD_T02', 'HD_T03', 'HD_T04');

-- D. Xóa Chi tiết đặt cọc và Phiếu đặt cọc
DELETE FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc IN ('PC_T01', 'PC_T02', 'PC_T03', 'PC_T04') OR MaChiTietDC IN ('CD_T01', 'CD_T02', 'CD_T03', 'CD_T04');
DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc IN ('PC_T01', 'PC_T02', 'PC_T03', 'PC_T04');

-- Thiết lập trạng thái giường
-- Case 1: Thuê ghép giường (Hợp lệ) -> P104-G01 sang 'Đã đặt cọc'
UPDATE dbo.Giuong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P104' AND MaGiuong = 'G01';
UPDATE dbo.Giuong SET TinhTrang = N'Trống' WHERE MaPhong = 'P104' AND MaGiuong <> 'G01';

-- Case 2: Thuê nguyên phòng (Hợp lệ) -> tất cả giường P204 sang 'Đã đặt cọc'
UPDATE dbo.Giuong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P204';

-- Case 3: Thuê ghép giường (Chưa đóng tiền đầu kỳ) -> P302-G01 sang 'Đã đặt cọc'
UPDATE dbo.Giuong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P302' AND MaGiuong = 'G01';

-- Case 4: Thuê ghép giường (Chưa hợp lệ do giường chưa ở trạng thái Đặt cọc) -> P303-G01 sang 'Trống'
UPDATE dbo.Giuong SET TinhTrang = N'Trống' WHERE MaPhong = 'P303' AND MaGiuong = 'G01';

-- Phiếu đặt cọc & Chi tiết đặt cọc test
INSERT INTO dbo.PhieuDatCoc (
    MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, 
    TrangThaiThanhToan, ThoiGianXacNhanTT, ChungTuThanhToan, ThoiGianNhanPhong, 
    HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan
) VALUES 
    (N'PC_T01', N'2026-05-15 10:00:00', N'2026-05-16 10:00:00', 2200000, N'Chuyển khoản', N'Đã TT', N'2026-05-15 11:00:00', NULL, N'2026-06-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0013', N'KH0026', N'NV0004'),
    (N'PC_T02', N'2026-05-15 10:00:00', N'2026-05-16 10:00:00', 7200000, N'Chuyển khoản', N'Đã TT', N'2026-05-15 11:00:00', NULL, N'2026-06-01 08:00:00', N'Nguyên phòng', N'Đã lập HĐ', N'DK0014', N'KH0028', N'NV0004'),
    (N'PC_T03', N'2026-05-15 10:00:00', N'2026-05-16 10:00:00', 2200000, N'Chuyển khoản', N'Đã TT', N'2026-05-15 11:00:00', NULL, N'2026-06-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0013', N'KH0029', N'NV0004'),
    (N'PC_T04', N'2026-05-15 10:00:00', N'2026-05-16 10:00:00', 1800000, N'Chuyển khoản', N'Đã TT', N'2026-05-15 11:00:00', NULL, N'2026-06-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0013', N'KH0030', N'NV0004');

INSERT INTO dbo.ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue) VALUES 
    (N'CD_T01', N'PC_T01', N'P104', N'G01', 1800000),
    (N'CD_T02', N'PC_T02', N'P204', NULL, 7200000),
    (N'CD_T03', N'PC_T03', N'P302', N'G01', 2200000),
    (N'CD_T04', N'PC_T04', N'P303', N'G01', 1800000);

-- Hợp đồng thuê test (status 'Hiệu lực')
INSERT INTO dbo.HopDongThue (
    MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, 
    KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy
) VALUES 
    (N'HD_T01', N'2026-05-15', N'2026-06-01', N'2027-05-31', 1, 1800000, N'Hàng tháng', N'Hiệu lực', N'PC_T01', N'KH0026', N'NV0003'),
    (N'HD_T02', N'2026-05-15', N'2026-06-01', N'2027-05-31', 4, 7200000, N'Hàng tháng', N'Hiệu lực', N'PC_T02', N'KH0028', N'NV0003'),
    (N'HD_T03', N'2026-05-15', N'2026-06-01', N'2027-05-31', 1, 2200000, N'Hàng tháng', N'Hiệu lực', N'PC_T03', N'KH0029', N'NV0003'),
    (N'HD_T04', N'2026-05-15', N'2026-06-01', N'2027-05-31', 1, 1800000, N'Hàng tháng', N'Hiệu lực', N'PC_T04', N'KH0030', N'NV0003');

-- Hóa đơn kỳ đầu test
INSERT INTO dbo.HoaDon (
    MaHoaDon, KyThanhToan, NgayLap, NgayHanTT, TongTien, TrangThai, 
    NgayThanhToan, PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan
) VALUES 
    (N'HD_IV1', N'2026-06', N'2026-05-16', N'2026-05-30', 1800000, N'Đã TT', N'2026-05-18', N'Chuyển khoản', N'HD_T01', N'NV0004'),
    (N'HD_IV2', N'2026-06', N'2026-05-16', N'2026-05-30', 7200000, N'Đã TT', N'2026-05-18', N'Chuyển khoản', N'HD_T02', N'NV0004'),
    (N'HD_IV3', N'2026-06', N'2026-05-16', N'2026-05-30', 2200000, N'Chưa TT', NULL, NULL, N'HD_T03', N'NV0004'),
    (N'HD_IV4', N'2026-06', N'2026-05-16', N'2026-05-30', 1800000, N'Đã TT', N'2026-05-18', N'Chuyển khoản', N'HD_T04', N'NV0004');


GO

/* ===== QUERY CHECK NHANH SAU KHI CHẠY =====
SELECT MaNguoiDung, HoTen, GioiTinh FROM NguoiDung WHERE GioiTinh NOT IN (N'Nam', N'Nữ');
SELECT MaPhong, GioiTinhChoPhep FROM Phong WHERE GioiTinhChoPhep NOT IN (N'Nam', N'Nữ');
SELECT tk.MaNguoiDung, COUNT(*) AS SoTaiKhoan FROM TaiKhoan tk GROUP BY tk.MaNguoiDung HAVING COUNT(*) > 1;
SELECT ctdc.MaPhong, COUNT(DISTINCT tv.GioiTinh) AS SoLoaiGioiTinh
FROM HopDongThue hd
JOIN ChiTietDatCoc ctdc ON hd.MaPhieuCoc = ctdc.MaPhieuDatCoc
JOIN ThanhVienHopDong tv ON hd.MaHopDong = tv.MaHopDong
WHERE hd.TrangThai = N'Hiệu lực' AND tv.TrangThai = N'Đang ở'
GROUP BY ctdc.MaPhong
HAVING COUNT(DISTINCT tv.GioiTinh) > 1;
*/