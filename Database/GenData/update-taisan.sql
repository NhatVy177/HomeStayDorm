-- Script cập nhật tên và số lượng chìa khóa theo đúng sức chứa của phòng
USE HOMEDORM4;
GO

-- 1. Cập nhật tên tài sản từ 'Chìa khóa/thẻ từ' thành 'Chìa khóa'
UPDATE TaiSan
SET TenTaiSan = N'Chìa khóa'
WHERE MaTaiSan = 'TS0004';

-- 2. Cập nhật số lượng chìa khóa cho các phòng loại 4 người (LP0002)
UPDATE TaiSan
SET SoLuong = 4
WHERE MaTaiSan = 'TS0004'
  AND MaPhong IN (
      SELECT p.MaPhong 
      FROM Phong p 
      WHERE p.MaLoaiPhong = 'LP0002'
  );

-- 3. Cập nhật số lượng chìa khóa cho các phòng loại 6 người (LP0003)
UPDATE TaiSan
SET SoLuong = 6
WHERE MaTaiSan = 'TS0004'
  AND MaPhong IN (
      SELECT p.MaPhong 
      FROM Phong p 
      WHERE p.MaLoaiPhong = 'LP0003'
  );

-- Xác nhận kết quả cập nhật
SELECT p.TenPhong, ts.TenTaiSan, ts.SoLuong, lp.SucChuaToiDa
FROM TaiSan ts
JOIN Phong p ON p.MaPhong = ts.MaPhong
JOIN LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
WHERE ts.MaTaiSan = 'TS0004';
GO
