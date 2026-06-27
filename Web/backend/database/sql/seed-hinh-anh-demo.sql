USE [HOMEDORM4];
GO

-- Anh demo cho cac phong da ton tai trong DB.
-- Script chi cap nhat/them HinhAnhPhong, khong tao phong moi.

IF OBJECT_ID(N'dbo.Phong', N'U') IS NULL
   OR OBJECT_ID(N'dbo.HinhAnhPhong', N'U') IS NULL
    THROW 50120, N'Chua co bang Phong/HinhAnhPhong.', 1;
GO

;WITH AnhMau AS (
    SELECT *
    FROM (VALUES
        (1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85'),
        (2, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85'),
        (3, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85'),
        (4, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=85'),
        (5, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=85')
    ) AS img(STTAnh, UrlImg)
),
AnhTheoPhong AS (
    SELECT
        p.MaPhong,
        img.STTAnh,
        img.UrlImg
    FROM dbo.Phong AS p
    CROSS JOIN AnhMau AS img
)
MERGE dbo.HinhAnhPhong AS target
USING AnhTheoPhong AS source
    ON target.MaPhong = source.MaPhong
   AND target.STTAnh = source.STTAnh
WHEN MATCHED THEN
    UPDATE SET UrlImg = source.UrlImg
WHEN NOT MATCHED BY TARGET THEN
    INSERT (MaPhong, STTAnh, UrlImg)
    VALUES (source.MaPhong, source.STTAnh, source.UrlImg);
GO
