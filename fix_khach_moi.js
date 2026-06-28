const fs = require('fs');

let content = fs.readFileSync('Database/SP_DKyThue/khach-moi.sql', 'utf8');

const replacement = `END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0002')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0002', N'Phòng riêng', 1, N'Phòng riêng có cửa sổ và khu bếp chung.', NULL, 4500000);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0003')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0003', N'Phòng đôi', 2, N'Phòng đôi đầy đủ nội thất cơ bản.', NULL, 3600000);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = 'LP0004')
BEGIN
    INSERT INTO dbo.LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong)
    VALUES ('LP0004', N'Giường dorm', 4, N'Không gian yên tĩnh, gần trạm xe buýt.', 2200000, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P204')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
    VALUES ('P204', N'Dorm Studio 204', N'Nữ', N'Còn chỗ', 'CN0001', 'LP0001');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P101')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
    VALUES ('P101', N'Garden 101', N'Nữ', N'Trống', 'CN0001', 'LP0002');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P302')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
    VALUES ('P302', N'Phòng đôi Cozy 302', N'Nữ', N'Trống', 'CN0001', 'LP0003');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P305')
BEGIN
    INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
    VALUES ('P305', N'Dorm Green 305', N'Nữ', N'Còn chỗ', 'CN0001', 'LP0004');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P204' AND MaGiuong = 'A01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P204', 'A01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P204' AND MaGiuong = 'A02')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P204', 'A02', 2, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P101' AND MaGiuong = 'R01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P101', 'R01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P302' AND MaGiuong = 'D01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P302', 'D01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P305' AND MaGiuong = 'B01')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P305', 'B01', 1, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P305' AND MaGiuong = 'B02')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P305', 'B02', 2, N'Trống');
IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P305' AND MaGiuong = 'B03')
    INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang) VALUES ('P305', 'B03', 3, N'Trống');
GO

IF OBJECT_ID(N'dbo.SP_KhachMoi_TrangThai', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_TrangThai AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_TrangThai
    @KhachHangId VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)`;

content = content.replace("END;\r\n\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)", replacement);
content = content.replace("END;\n\n\n    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)", replacement);

fs.writeFileSync('Database/SP_DKyThue/khach-moi.sql', content, 'utf8');
