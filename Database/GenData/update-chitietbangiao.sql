-- Script cập nhật số lượng và tên chìa khóa trong ChiTietBanGiao
USE HOMEDORM4;
GO

-- 1. Cập nhật tên 'chìa khóa/thẻ từ' thành 'chìa khóa' trong GhiChu
UPDATE ChiTietBanGiao
SET GhiChu = REPLACE(GhiChu, N'chìa khóa/thẻ từ', N'chìa khóa')
WHERE GhiChu LIKE N'%chìa khóa/thẻ từ%';

-- 2. Cập nhật SoLuongThucTe của TẤT CẢ tài sản bằng đúng Số giường thuê của Hợp đồng
UPDATE cb
SET cb.SoLuongThucTe = hd.SoGiuongThue
FROM ChiTietBanGiao cb
JOIN BienBanBanGiao bb ON bb.MaBienBan = cb.MaBienBan
JOIN HopDongThue hd ON hd.MaHopDong = bb.MaHopDong;

-- Xác nhận kết quả cập nhật
SELECT cb.MaChiTietBG, cb.MaBienBan, cb.MaPhong, cb.SoLuongThucTe, cb.GhiChu
FROM ChiTietBanGiao cb
WHERE cb.MaTaiSan = 'TS0004'
ORDER BY cb.MaChiTietBG;
GO
