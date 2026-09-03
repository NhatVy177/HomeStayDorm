-- ===============================
-- update-chitietbangiao.sql
-- ===============================
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


-- ===============================
-- update-taisan.sql
-- ===============================
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


-- ===============================
-- Data ThanhVienHopDong
-- ===============================
USE HOMEDORM4;
GO

INSERT INTO ThanhVienHopDong (
    MaThanhVien,
    HoTen,
    NgaySinh,
    GioiTinh,
    CCCD,
    SDT,
    Email,
    QuocTich,
    TrangThai,
    MaHopDong
) VALUES
    ('TV0019', N'Nguyễn Hoàng Vũ', '2000-10-15', N'Nam', '079200000119', '091200119', 'tv0019@mail.com', N'Việt Nam', N'Đang ở', 'HD0001'),
    ('TV0020', N'Trần Đình Trọng', '2001-05-20', N'Nam', '079200000120', '091200120', 'tv0020@mail.com', N'Việt Nam', N'Đang ở', 'HD0001'),
    ('TV0021', N'Lê Quang Hải', '1999-12-05', N'Nam', '079200000121', '091200121', 'tv0021@mail.com', N'Việt Nam', N'Đang ở', 'HD0001');
GO

-- ===============================
-- themquydinhtrutien.sql
-- ===============================
IF OBJECT_ID('QuyDinhTruTien', 'U') IS NULL
BEGIN
    CREATE TABLE QuyDinhTruTien (
        MaQuyDinhTruTien VARCHAR(6) PRIMARY KEY,
        MucDoHuHong NVARCHAR(50) NOT NULL,
        TyLeHuHong DECIMAL(5,2) NOT NULL,
        MoTa NVARCHAR(255) NULL,
        TrangThai NVARCHAR(20) NOT NULL DEFAULT N'Đang áp dụng',

        CONSTRAINT CHK_QDTT_MucDoHuHong 
            CHECK (MucDoHuHong IN (N'Hư hỏng nhẹ', N'Hư hỏng nặng', N'Mất mát')),

        CONSTRAINT CHK_QDTT_TyLeHuHong 
            CHECK (TyLeHuHong >= 0 AND TyLeHuHong <= 1),

        CONSTRAINT CHK_QDTT_TrangThai 
            CHECK (TrangThai IN (N'Đang áp dụng', N'Ngừng áp dụng'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM QuyDinhTruTien WHERE MaQuyDinhTruTien = 'QD001')
BEGIN
    INSERT INTO QuyDinhTruTien 
    (MaQuyDinhTruTien, MucDoHuHong, TyLeHuHong, MoTa, TrangThai)
    VALUES
    ('QD001', N'Hư hỏng nhẹ', 0.20, N'Tài sản hư nhẹ, vẫn còn khả năng sử dụng hoặc sửa chữa đơn giản', N'Đang áp dụng'),
    ('QD002', N'Hư hỏng nặng', 0.60, N'Tài sản hư nặng, ảnh hưởng lớn đến khả năng sử dụng', N'Đang áp dụng'),
    ('QD003', N'Mất mát',      1.00, N'Tài sản bị mất hoặc không thể thu hồi', N'Đang áp dụng');
END;
GO

IF COL_LENGTH('ChiTietHuHong', 'SoLuong') IS NULL
BEGIN
    ALTER TABLE ChiTietHuHong
    ADD SoLuong INT NOT NULL DEFAULT 1;
END;
GO

IF COL_LENGTH('ChiTietHuHong', 'MucDoHuHong') IS NULL
BEGIN
    ALTER TABLE ChiTietHuHong
    ADD MucDoHuHong NVARCHAR(50) NULL;
END;
GO

IF COL_LENGTH('ChiTietHuHong', 'TyLeHuHong') IS NULL
BEGIN
    ALTER TABLE ChiTietHuHong
    ADD TyLeHuHong DECIMAL(5,2) NULL;
END;
GO

IF COL_LENGTH('ChiTietHuHong', 'MaQuyDinhTruTien') IS NULL
BEGIN
    ALTER TABLE ChiTietHuHong
    ADD MaQuyDinhTruTien VARCHAR(6) NULL;
END;
GO

/* 
    Nếu bảng TaiSan của mày không có cột DonGia
    thì đổi ts.DonGiaBoiThuong thành tên cột đơn giá thật:
    ví dụ: ts.GiaTri, ts.DonGia, ts.GiaTaiSan...
*/

-- HH0001: Giường - hư hỏng nhẹ
UPDATE cthh
SET 
    cthh.SoLuong = 1,
    cthh.MucDoHuHong = qd.MucDoHuHong,
    cthh.TyLeHuHong = qd.TyLeHuHong,
    cthh.MaQuyDinhTruTien = qd.MaQuyDinhTruTien,
    cthh.MoTaHuHong = N'Giường: Khung giường bị trầy xước và lỏng ốc, vẫn còn sử dụng được nhưng cần sửa chữa nhẹ.',
    cthh.ChiPhiSuaChua = ts.DonGia * 1 * qd.TyLeHuHong
FROM ChiTietHuHong cthh
JOIN TaiSan ts 
    ON ts.MaTaiSan = cthh.MaTaiSan
JOIN QuyDinhTruTien qd 
    ON qd.MaQuyDinhTruTien = 'QD001'
WHERE cthh.MaChiTietHH = 'HH0001';


-- HH0002: Tủ cá nhân - hư hỏng nhẹ
UPDATE cthh
SET 
    cthh.SoLuong = 1,
    cthh.MucDoHuHong = qd.MucDoHuHong,
    cthh.TyLeHuHong = qd.TyLeHuHong,
    cthh.MaQuyDinhTruTien = qd.MaQuyDinhTruTien,
    cthh.MoTaHuHong = N'Tủ cá nhân: Cánh tủ bị trầy xước nhẹ, bản lề hơi lỏng nhưng vẫn còn sử dụng được.',
    cthh.ChiPhiSuaChua = ts.DonGia * 1 * qd.TyLeHuHong
FROM ChiTietHuHong cthh
JOIN TaiSan ts 
    ON ts.MaTaiSan = cthh.MaTaiSan
JOIN QuyDinhTruTien qd 
    ON qd.MaQuyDinhTruTien = 'QD001'
WHERE cthh.MaChiTietHH = 'HH0002';


