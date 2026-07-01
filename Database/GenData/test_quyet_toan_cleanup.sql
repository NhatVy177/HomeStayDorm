USE [HOMEDORM4];
GO

-- Xoa cac dong test tao boi:
--   test_quyet_toan_thu_them.sql
--   test_quyet_toan_hoan_coc_hop_dong.sql
--   test_quyet_toan_hoan_coc_dat_coc.sql

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat
WHERE MaDoiSoat IN ('DS0090', 'DS0091', 'DS0092');

DELETE FROM dbo.PhieuTraPhong
WHERE MaPhieuTra IN ('TP0090', 'TP0091', 'TP0092');

UPDATE dbo.PhieuDatCoc
SET TrangThaiCoc = N'Hiệu lực',
    TrangThaiThanhToan = N'Đã TT'
WHERE MaPhieuDatCoc IN ('DC0017', 'DC0020');

UPDATE dbo.HopDongThue
SET TrangThai = N'Hiệu lực'
WHERE MaHopDong = 'HD0003';

COMMIT TRANSACTION;
GO

PRINT N'Da xoa du lieu test quyet toan TP0090/TP0091/TP0092 va DS0090/DS0091/DS0092.';
GO
