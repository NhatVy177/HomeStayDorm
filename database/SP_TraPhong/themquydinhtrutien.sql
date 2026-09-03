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