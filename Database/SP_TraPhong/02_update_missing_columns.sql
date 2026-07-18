USE HOMEDORM4;
GO

-- 1. Bảng DoiSoat
IF COL_LENGTH('dbo.DoiSoat', 'LoaiQuyetToan') IS NULL 
    ALTER TABLE dbo.DoiSoat ADD LoaiQuyetToan NVARCHAR(50);
IF COL_LENGTH('dbo.DoiSoat', 'ThongTinNhanHoanCoc') IS NULL 
    ALTER TABLE dbo.DoiSoat ADD ThongTinNhanHoanCoc NVARCHAR(500);

-- 2. Bảng ThanhVienHopDong
IF COL_LENGTH('dbo.ThanhVienHopDong', 'LyDoTuChoi') IS NULL 
    ALTER TABLE dbo.ThanhVienHopDong ADD LyDoTuChoi NVARCHAR(500);

-- 3. Bảng ChiTietHuHong
IF COL_LENGTH('dbo.ChiTietHuHong', 'MucDoHuHong') IS NULL 
    ALTER TABLE dbo.ChiTietHuHong ADD MucDoHuHong NVARCHAR(50);
IF COL_LENGTH('dbo.ChiTietHuHong', 'SoLuong') IS NULL 
    ALTER TABLE dbo.ChiTietHuHong ADD SoLuong INT;
IF COL_LENGTH('dbo.ChiTietHuHong', 'TyLeHuHong') IS NULL 
    ALTER TABLE dbo.ChiTietHuHong ADD TyLeHuHong FLOAT;
IF COL_LENGTH('dbo.ChiTietHuHong', 'MaQuyDinhTruTien') IS NULL 
    ALTER TABLE dbo.ChiTietHuHong ADD MaQuyDinhTruTien VARCHAR(6);

-- 4. Bảng ChiTietHoaDon
IF COL_LENGTH('dbo.ChiTietHoaDon', 'GhiChu') IS NULL 
    ALTER TABLE dbo.ChiTietHoaDon ADD GhiChu NVARCHAR(500);
IF COL_LENGTH('dbo.ChiTietHoaDon', 'NoiDung') IS NULL 
    ALTER TABLE dbo.ChiTietHoaDon ADD NoiDung NVARCHAR(500);

-- 5. Bảng PhieuDatCoc
IF COL_LENGTH('dbo.PhieuDatCoc', 'GhiChu') IS NULL 
    ALTER TABLE dbo.PhieuDatCoc ADD GhiChu NVARCHAR(500);

-- 6. Bảng BienBanViPham
IF COL_LENGTH('dbo.BienBanViPham', 'GhiChu') IS NULL 
    ALTER TABLE dbo.BienBanViPham ADD GhiChu NVARCHAR(500);
GO
