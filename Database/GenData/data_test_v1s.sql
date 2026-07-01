USE [HOMEDORM4];
GO

-- =============================================
-- TEST DATA: Prepare data for "Thanh lý trả phòng" Use-Case
-- Updates DoiSoat and PhieuTraPhong states to simulate the condition 
-- AFTER a successful "Xác nhận đối soát".
-- =============================================

PRINT N'>> Bắt đầu tạo dữ liệu test cho Thanh lý trả phòng...';

-- 1. DS0005 (TP0007): Khách được hoàn cọc
-- Trạng thái đối soát: Chờ hoàn cọc
-- Trạng thái phiếu trả: Chờ ký biên bản
UPDATE dbo.DoiSoat 
SET TrangThai = N'Chờ hoàn cọc', PhuongThucThanhToan = N'Chuyển khoản'
WHERE MaDoiSoat = 'DS0005';

UPDATE dbo.PhieuTraPhong 
SET TrangThai = N'Chờ ký biên bản' 
WHERE MaPhieuTra = 'TP0007';

-- 2. DS0006 (TP0010): Khách phải thanh toán thêm
-- Giả sử kế toán đã thu tiền xong nên phiếu đối soát chuyển thành Đã quyết toán
-- Trạng thái đối soát: Đã quyết toán
-- Trạng thái phiếu trả: Chờ ký biên bản
UPDATE dbo.DoiSoat 
SET TrangThai = N'Đã quyết toán', PhuongThucThanhToan = N'Tiền mặt'
WHERE MaDoiSoat = 'DS0006';

UPDATE dbo.PhieuTraPhong 
SET TrangThai = N'Chờ ký biên bản' 
WHERE MaPhieuTra = 'TP0010';

-- 3. DS0007 (TP0011): Hoàn cọc lại cho khách
-- Trạng thái đối soát: Chờ hoàn cọc
-- Trạng thái phiếu trả: Chờ ký biên bản
UPDATE dbo.DoiSoat 
SET TrangThai = N'Chờ hoàn cọc', SoTienHoanThucTe = 1400000
WHERE MaDoiSoat = 'DS0007';

UPDATE dbo.PhieuTraPhong 
SET TrangThai = N'Chờ ký biên bản' 
WHERE MaPhieuTra = 'TP0011';

PRINT N'>> Tạo dữ liệu test Thanh lý trả phòng thành công!';
GO
