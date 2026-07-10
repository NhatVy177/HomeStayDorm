USE [HOMEDORM4];
GO

/*
  Cleanup cho Database/GenData/test_ke_toan_doi_soat_rieng.sql.
  Chi xoa cac ma test TP0980-TP0986 va DS0981-DS0986.
*/

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat
WHERE MaDoiSoat IN ('DS0981', 'DS0982', 'DS0983', 'DS0984', 'DS0985', 'DS0986');

DELETE FROM dbo.PhieuTraPhong
WHERE MaPhieuTra IN ('TP0980', 'TP0981', 'TP0982', 'TP0983', 'TP0984', 'TP0985', 'TP0986');

UPDATE dbo.PhieuDatCoc
SET TrangThaiCoc = N'Hiệu lực',
    TrangThaiThanhToan = N'Đã TT'
WHERE MaPhieuDatCoc IN ('DC0019', 'DC0020', 'DC0021');

UPDATE dbo.HopDongThue
SET TrangThai = N'Hiệu lực'
WHERE MaHopDong = 'HD0001';

COMMIT TRANSACTION;
GO

PRINT N'Da xoa du lieu test ke toan doi soat TP0980-TP0986 va DS0981-DS0986.';
GO
