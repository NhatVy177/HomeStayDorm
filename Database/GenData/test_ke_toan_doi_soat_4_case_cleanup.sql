USE [HOMEDORM4];
GO

/*
  Cleanup cho Database/GenData/test_ke_toan_doi_soat_4_case.sql.
  Chi xoa cac ma test TP0991-TP0994 va DS0991-DS0993.
*/

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat
WHERE MaDoiSoat IN ('DS0991', 'DS0992', 'DS0993');

DELETE FROM dbo.PhieuTraPhong
WHERE MaPhieuTra IN ('TP0991', 'TP0992', 'TP0993', 'TP0994');

UPDATE dbo.HopDongThue
SET TrangThai = N'Hiệu lực'
WHERE MaHopDong IN ('HD0001', 'HD0003');

UPDATE dbo.PhieuDatCoc
SET TrangThaiCoc = N'Hiệu lực',
    TrangThaiThanhToan = N'Đã TT'
WHERE MaPhieuDatCoc IN ('DC0019', 'DC0021');

COMMIT TRANSACTION;
GO

PRINT N'Da xoa du lieu test 4 case doi soat TP0991-TP0994 va DS0991-DS0993.';
GO
