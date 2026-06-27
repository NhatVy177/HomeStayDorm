USE HOMEDORM4;
GO

-- ================================================================
-- TEST 1: SP_TraCuuPhieuCocLapHopDong
-- ================================================================

-- [T1-A] Lấy tất cả phiếu cọc
EXEC SP_TraCuuPhieuCocLapHopDong;
GO

-- [T1-B] Tìm theo tên khách hàng
EXEC SP_TraCuuPhieuCocLapHopDong @TuKhoa = N'Minh';
GO

-- [T1-C] Lọc phiếu đang Hiệu lực
EXEC SP_TraCuuPhieuCocLapHopDong @TrangThaiCoc = N'Hiệu lực';
GO

-- [T1-D] Tìm theo mã phiếu DC0016
EXEC SP_TraCuuPhieuCocLapHopDong @TuKhoa = N'DC0016';
GO

-- [T1-E] Lọc theo ngày tạo
EXEC SP_TraCuuPhieuCocLapHopDong @NgayTao = '2026-02-02';
GO

-- ================================================================
-- TEST 2: SP_LayChiTietPhieuCocLapHopDong
-- ================================================================

-- [T2-A] Phiếu Hiệu lực – Ghép giường P304/G04
EXEC SP_LayChiTietPhieuCocLapHopDong @MaPhieuDatCoc = 'DC0016';
GO

-- [T2-B] Phiếu đã lập HĐ
EXEC SP_LayChiTietPhieuCocLapHopDong @MaPhieuDatCoc = 'DC0001';
GO

-- [T2-C] Mã phiếu không tồn tại → result set rỗng
EXEC SP_LayChiTietPhieuCocLapHopDong @MaPhieuDatCoc = 'DC9999';
GO

-- ================================================================
-- TEST 3: SP_KiemTraDieuKienLapHopDong
-- ================================================================

-- [T3-A] Phiếu hợp lệ → HopLe=1, MaLoi=0
DECLARE @HL3A BIT, @ML3A INT, @TB3A NVARCHAR(500);
EXEC SP_KiemTraDieuKienLapHopDong
    @MaPhieuDatCoc = 'DC0016',
    @HopLe         = @HL3A  OUTPUT,
    @MaLoi         = @ML3A  OUTPUT,
    @ThongBao      = @TB3A  OUTPUT;
SELECT N'[T3-A] DC0016 hợp lệ' AS Test, @HL3A AS HopLe, @ML3A AS MaLoi, @TB3A AS ThongBao;
GO

-- [T3-B] Phiếu đã lập HĐ → MaLoi=-4
DECLARE @HL3B BIT, @ML3B INT, @TB3B NVARCHAR(500);
EXEC SP_KiemTraDieuKienLapHopDong
    @MaPhieuDatCoc = 'DC0001',
    @HopLe         = @HL3B  OUTPUT,
    @MaLoi         = @ML3B  OUTPUT,
    @ThongBao      = @TB3B  OUTPUT;
SELECT N'[T3-B] DC0001 đã lập HĐ' AS Test, @HL3B AS HopLe, @ML3B AS MaLoi, @TB3B AS ThongBao;
GO

-- [T3-C] Mã phiếu không tồn tại → MaLoi=-1
DECLARE @HL3C BIT, @ML3C INT, @TB3C NVARCHAR(500);
EXEC SP_KiemTraDieuKienLapHopDong
    @MaPhieuDatCoc = 'DC9999',
    @HopLe         = @HL3C  OUTPUT,
    @MaLoi         = @ML3C  OUTPUT,
    @ThongBao      = @TB3C  OUTPUT;
SELECT N'[T3-C] DC9999 không tồn tại' AS Test, @HL3C AS HopLe, @ML3C AS MaLoi, @TB3C AS ThongBao;
GO

-- ================================================================
-- TEST 4: SP_LayDanhSachDichVu
-- Kỳ vọng: DV0001(Điện), DV0002(Nước) BatBuoc=1; còn lại BatBuoc=0
-- ================================================================
EXEC SP_LayDanhSachDichVu;
GO

-- ================================================================
-- TEST 5: SP_KiemTraThanhVienHopDongTam
-- ================================================================

-- [T5-A] P304 (Không phân biệt, sức chứa 4) – 2 hợp lệ, 2 bị từ chối
DECLARE @TV5A TVP_ThanhVienHopDong;
INSERT INTO @TV5A(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES
    (N'Nguyễn Văn An',  '1998-01-10', N'Nam', '038201001001', '0912345001', 'an@mail.com',   N'Việt Nam'),  -- hợp lệ
    (N'Trần Thị Bình',  '1999-02-15', N'Nữ',  '038201001002', '0912345002', 'binh@mail.com', N'Việt Nam'),  -- hợp lệ (KPB)
    (N'Lê Văn Cường',   '2000-03-20', N'Nam', '',             '0912345003', 'cuong@mail.com',N'Việt Nam'),  -- thiếu CCCD
    (N'Phạm Hải Đăng',  '2001-04-25', N'Nam', '038201001004', '',           'dang@mail.com', N'Việt Nam');  -- thiếu SĐT

EXEC SP_KiemTraThanhVienHopDongTam
    @MaPhieuDatCoc     = 'DC0016',
    @DanhSachThanhVien = @TV5A;
GO

-- [T5-B] P102 (chỉ Nữ) – truyền Nam → bị từ chối
DECLARE @TV5B TVP_ThanhVienHopDong;
INSERT INTO @TV5B(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES
    (N'Trần Văn Bình', '2000-05-05', N'Nam', '038201002001', '0912345101', 'binh2@mail.com', N'Việt Nam');

EXEC SP_KiemTraThanhVienHopDongTam
    @MaPhieuDatCoc     = 'DC0019',
    @DanhSachThanhVien = @TV5B;
GO

-- [T5-C] P305 (sức chứa 6) – nhập 7 người → KetLuan = Vượt sức chứa
DECLARE @TV5C TVP_ThanhVienHopDong;
INSERT INTO @TV5C(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES
    (N'TV01', '2000-01-01', N'Nam', '111111111111', '0900000001', NULL, N'Việt Nam'),
    (N'TV02', '2000-01-02', N'Nam', '111111111112', '0900000002', NULL, N'Việt Nam'),
    (N'TV03', '2000-01-03', N'Nam', '111111111113', '0900000003', NULL, N'Việt Nam'),
    (N'TV04', '2000-01-04', N'Nam', '111111111114', '0900000004', NULL, N'Việt Nam'),
    (N'TV05', '2000-01-05', N'Nam', '111111111115', '0900000005', NULL, N'Việt Nam'),
    (N'TV06', '2000-01-06', N'Nam', '111111111116', '0900000006', NULL, N'Việt Nam'),
    (N'TV07', '2000-01-07', N'Nam', '111111111117', '0900000007', NULL, N'Việt Nam');

EXEC SP_KiemTraThanhVienHopDongTam
    @MaPhieuDatCoc     = 'DC0017',
    @DanhSachThanhVien = @TV5C;
GO

-- ================================================================
-- TEST 6: SP_LapHopDongThue – CÁC TRƯỜNG HỢP LỖI
-- ================================================================

-- [T6-E1] Phiếu không tồn tại → MaLoi=-1
DECLARE @TV6E TVP_ThanhVienHopDong;
DECLARE @DV6E TVP_DichVuHopDong;
DECLARE @MaHD6E VARCHAR(6), @ML6E INT, @TB6E NVARCHAR(500);
INSERT INTO @DV6E VALUES ('DV0001', NULL), ('DV0002', NULL);
INSERT INTO @TV6E(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES (N'Test', '2000-01-01', N'Nam', '123456789', '0900000001', NULL, N'Việt Nam');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc='DC9999', @MaNhanVienQuanLy='NV0003',
    @NgayBatDau='2026-07-01', @NgayKetThuc='2027-07-01',
    @KyThanhToan=N'Hàng tháng',
    @KhachHangDaXacNhan=1, @NhanVienDaXacNhan=1,
    @DanhSachThanhVien=@TV6E, @DanhSachDichVu=@DV6E,
    @MaHopDong=@MaHD6E OUTPUT, @MaLoi=@ML6E OUTPUT, @ThongBao=@TB6E OUTPUT;
SELECT N'[T6-E1] Phiếu không tồn tại' AS Test, @MaHD6E AS MaHD, @ML6E AS MaLoi, @TB6E AS ThongBao;
GO

-- [T6-E2] Phiếu đã lập HĐ → MaLoi=-4
DECLARE @TV6E2 TVP_ThanhVienHopDong;
DECLARE @DV6E2 TVP_DichVuHopDong;
DECLARE @MaHD6E2 VARCHAR(6), @ML6E2 INT, @TB6E2 NVARCHAR(500);
INSERT INTO @DV6E2 VALUES ('DV0001', NULL), ('DV0002', NULL);
INSERT INTO @TV6E2(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES (N'Test', '2000-01-01', N'Nam', '123456789', '0900000001', NULL, N'Việt Nam');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc='DC0001', @MaNhanVienQuanLy='NV0003',
    @NgayBatDau='2026-07-01', @NgayKetThuc='2027-07-01',
    @KyThanhToan=N'Hàng tháng',
    @KhachHangDaXacNhan=1, @NhanVienDaXacNhan=1,
    @DanhSachThanhVien=@TV6E2, @DanhSachDichVu=@DV6E2,
    @MaHopDong=@MaHD6E2 OUTPUT, @MaLoi=@ML6E2 OUTPUT, @ThongBao=@TB6E2 OUTPUT;
SELECT N'[T6-E2] Phiếu đã lập HĐ' AS Test, @MaHD6E2 AS MaHD, @ML6E2 AS MaLoi, @TB6E2 AS ThongBao;
GO

-- [T6-E3] Ngày không hợp lệ (NgayKetThuc < NgayBatDau) → MaLoi=-5
DECLARE @TV6E3 TVP_ThanhVienHopDong;
DECLARE @DV6E3 TVP_DichVuHopDong;
DECLARE @MaHD6E3 VARCHAR(6), @ML6E3 INT, @TB6E3 NVARCHAR(500);
INSERT INTO @DV6E3 VALUES ('DV0001', NULL), ('DV0002', NULL);
INSERT INTO @TV6E3(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES (N'Test', '2000-01-01', N'Nam', '123456789', '0900000001', NULL, N'Việt Nam');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc='DC0016', @MaNhanVienQuanLy='NV0003',
    @NgayBatDau='2027-07-01', @NgayKetThuc='2026-07-01',  -- ngược ngày
    @KyThanhToan=N'Hàng tháng',
    @KhachHangDaXacNhan=1, @NhanVienDaXacNhan=1,
    @DanhSachThanhVien=@TV6E3, @DanhSachDichVu=@DV6E3,
    @MaHopDong=@MaHD6E3 OUTPUT, @MaLoi=@ML6E3 OUTPUT, @ThongBao=@TB6E3 OUTPUT;
SELECT N'[T6-E3] Ngày không hợp lệ' AS Test, @MaHD6E3 AS MaHD, @ML6E3 AS MaLoi, @TB6E3 AS ThongBao;
GO

-- [T6-E4a] Khách hàng chưa tick checkbox → MaLoi=-7
DECLARE @TV6E4 TVP_ThanhVienHopDong;
DECLARE @DV6E4 TVP_DichVuHopDong;
DECLARE @MaHD6E4 VARCHAR(6), @ML6E4 INT, @TB6E4 NVARCHAR(500);
INSERT INTO @DV6E4 VALUES ('DV0001', NULL), ('DV0002', NULL);
INSERT INTO @TV6E4(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES (N'Test', '2000-01-01', N'Nam', '123456789', '0900000001', NULL, N'Việt Nam');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc='DC0016', @MaNhanVienQuanLy='NV0003',
    @NgayBatDau='2026-07-01', @NgayKetThuc='2027-07-01',
    @KyThanhToan=N'Hàng tháng',
    @KhachHangDaXacNhan=0, @NhanVienDaXacNhan=1,  -- khách chưa tick
    @DanhSachThanhVien=@TV6E4, @DanhSachDichVu=@DV6E4,
    @MaHopDong=@MaHD6E4 OUTPUT, @MaLoi=@ML6E4 OUTPUT, @ThongBao=@TB6E4 OUTPUT;
SELECT N'[T6-E4a] Khách chưa xác nhận' AS Test, @MaHD6E4 AS MaHD, @ML6E4 AS MaLoi, @TB6E4 AS ThongBao;
GO

-- [T6-E4b] Nhân viên chưa tick checkbox → MaLoi=-7
DECLARE @TV6E4b TVP_ThanhVienHopDong;
DECLARE @DV6E4b TVP_DichVuHopDong;
DECLARE @MaHD6E4b VARCHAR(6), @ML6E4b INT, @TB6E4b NVARCHAR(500);
INSERT INTO @DV6E4b VALUES ('DV0001', NULL), ('DV0002', NULL);
INSERT INTO @TV6E4b(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES (N'Test', '2000-01-01', N'Nam', '123456789', '0900000001', NULL, N'Việt Nam');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc='DC0016', @MaNhanVienQuanLy='NV0003',
    @NgayBatDau='2026-07-01', @NgayKetThuc='2027-07-01',
    @KyThanhToan=N'Hàng tháng',
    @KhachHangDaXacNhan=1, @NhanVienDaXacNhan=0,  -- nhân viên chưa tick
    @DanhSachThanhVien=@TV6E4b, @DanhSachDichVu=@DV6E4b,
    @MaHopDong=@MaHD6E4b OUTPUT, @MaLoi=@ML6E4b OUTPUT, @ThongBao=@TB6E4b OUTPUT;
SELECT N'[T6-E4b] NV chưa xác nhận' AS Test, @MaHD6E4b AS MaHD, @ML6E4b AS MaLoi, @TB6E4b AS ThongBao;
GO

-- [T6-E5] Thiếu dịch vụ bắt buộc (chỉ có Wifi) → MaLoi=-9
DECLARE @TV6E5 TVP_ThanhVienHopDong;
DECLARE @DV6E5 TVP_DichVuHopDong;
DECLARE @MaHD6E5 VARCHAR(6), @ML6E5 INT, @TB6E5 NVARCHAR(500);
INSERT INTO @DV6E5 VALUES ('DV0003', NULL);  -- chỉ Wifi
INSERT INTO @TV6E5(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES (N'Test', '2000-01-01', N'Nam', '123456789', '0900000001', NULL, N'Việt Nam');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc='DC0016', @MaNhanVienQuanLy='NV0003',
    @NgayBatDau='2026-07-01', @NgayKetThuc='2027-07-01',
    @KyThanhToan=N'Hàng tháng',
    @KhachHangDaXacNhan=1, @NhanVienDaXacNhan=1,
    @DanhSachThanhVien=@TV6E5, @DanhSachDichVu=@DV6E5,
    @MaHopDong=@MaHD6E5 OUTPUT, @MaLoi=@ML6E5 OUTPUT, @ThongBao=@TB6E5 OUTPUT;
SELECT N'[T6-E5] Thiếu dịch vụ Điện & Nước' AS Test, @MaHD6E5 AS MaHD, @ML6E5 AS MaLoi, @TB6E5 AS ThongBao;
GO

-- ================================================================
-- TEST 6-OK: Lập HĐ thành công cho DC0016
-- ⚠ Chỉ chạy nếu muốn tạo HĐ thật vào DB!
-- ================================================================

-- DC0016 – KH0003 (Nam) – P304/G04 – Ghép giường – Không phân biệt
DECLARE @TV6OK TVP_ThanhVienHopDong;
DECLARE @DV6OK TVP_DichVuHopDong;
DECLARE @MaHD6OK VARCHAR(6), @ML6OK INT, @TB6OK NVARCHAR(500);

INSERT INTO @TV6OK(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES
    (N'Lê Quốc Cường',  '1998-04-04', N'Nam', '079200000003', '091200003',  'kh0003@mail.com', N'Việt Nam'),
    (N'Nguyễn Văn Hòa', '1999-05-05', N'Nam', '038201099901', '0923456789', 'hoa@mail.com',    N'Việt Nam');

INSERT INTO @DV6OK(MaDichVu, GhiChu)
VALUES
    ('DV0001', N'Điện theo chỉ số đồng hồ'),
    ('DV0002', N'Nước định mức'),
    ('DV0003', N'Wifi tốc độ cao');

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc      = 'DC0016',
    @MaNhanVienQuanLy   = 'NV0003',
    @NgayBatDau         = '2026-07-01',
    @NgayKetThuc        = '2027-07-01',
    @KyThanhToan        = N'Hàng tháng',
    @KhachHangDaXacNhan = 1,           -- checkbox 1 ✓
    @NhanVienDaXacNhan  = 1,           -- checkbox 2 ✓
    @DanhSachThanhVien  = @TV6OK,
    @DanhSachDichVu     = @DV6OK,
    @MaHopDong          = @MaHD6OK OUTPUT,
    @MaLoi              = @ML6OK   OUTPUT,
    @ThongBao           = @TB6OK   OUTPUT;

SELECT N'[T6-OK] Lập HĐ thành công' AS Test, @MaHD6OK AS MaHopDong, @ML6OK AS MaLoi, @TB6OK AS ThongBao;
GO

-- ================================================================
-- TEST 6B: Ghép giường, TVP rỗng → tự tạo TV từ KH đại diện (DC0017)
-- ⚠ Chỉ chạy nếu muốn tạo HĐ thật vào DB!
-- ================================================================

-- DC0017 – KH0016 – P305/G02 – Ghép giường – Không phân biệt
DECLARE @TV6B TVP_ThanhVienHopDong;  -- rỗng → SP tự lấy KH0016
DECLARE @DV6B TVP_DichVuHopDong;
DECLARE @MaHD6B VARCHAR(6), @ML6B INT, @TB6B NVARCHAR(500);

INSERT INTO @DV6B VALUES ('DV0001', NULL), ('DV0002', NULL);

EXEC SP_LapHopDongThue
    @MaPhieuDatCoc      = 'DC0017',
    @MaNhanVienQuanLy   = 'NV0003',
    @NgayBatDau         = '2026-07-01',
    @NgayKetThuc        = '2027-01-01',
    @KyThanhToan        = N'Hàng quý',
    @KhachHangDaXacNhan = 1,
    @NhanVienDaXacNhan  = 1,
    @DanhSachThanhVien  = @TV6B,
    @DanhSachDichVu     = @DV6B,
    @MaHopDong          = @MaHD6B OUTPUT,
    @MaLoi              = @ML6B   OUTPUT,
    @ThongBao           = @TB6B   OUTPUT;

SELECT N'[T6B] Ghép giường – TVP rỗng – tự tạo TV' AS Test,
       @MaHD6B AS MaHopDong, @ML6B AS MaLoi, @TB6B AS ThongBao;
GO

-- ================================================================
-- TEST 7: Kiểm tra kết quả sau khi lập HĐ
-- ================================================================

SELECT 'HopDongThue' AS Bang, * FROM HopDongThue
WHERE MaPhieuCoc IN ('DC0016', 'DC0017')
ORDER BY NgayKyHD DESC;

SELECT 'ThanhVienHopDong' AS Bang, tv.*
FROM ThanhVienHopDong tv
JOIN HopDongThue hd ON hd.MaHopDong = tv.MaHopDong
WHERE hd.MaPhieuCoc IN ('DC0016', 'DC0017');

SELECT 'DichVuHopDong' AS Bang, dvhd.*, dv.TenDichVu
FROM DichVuHopDong dvhd
JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
JOIN HopDongThue hd ON hd.MaHopDong = dvhd.MaHopDong
WHERE hd.MaPhieuCoc IN ('DC0016', 'DC0017');

SELECT 'PhieuDatCoc' AS Bang, MaPhieuDatCoc, TrangThaiCoc, TrangThaiThanhToan
FROM PhieuDatCoc
WHERE MaPhieuDatCoc IN ('DC0016', 'DC0017');
GO

-- ================================================================
-- TEST 7.5: SP_LayChiTietHopDongThue
-- ================================================================
-- Lấy chi tiết hợp đồng để hiển thị lên giao diện chi tiết hoặc thông báo thành công.
EXEC SP_LayChiTietHopDongThue @MaHopDong = 'HD0001';
GO

-- ================================================================
-- TEST 8: Rollback – Hoàn tác nếu muốn test lại từ đầu
-- ⚠ Bỏ comment block bên dưới nếu muốn xóa HĐ vừa tạo!
-- ================================================================
/*
DECLARE @MaHD_DC0016 VARCHAR(6), @MaHD_DC0017 VARCHAR(6);
SELECT @MaHD_DC0016 = MaHopDong FROM HopDongThue WHERE MaPhieuCoc = 'DC0016';
SELECT @MaHD_DC0017 = MaHopDong FROM HopDongThue WHERE MaPhieuCoc = 'DC0017';

DELETE FROM DichVuHopDong    WHERE MaHopDong IN (@MaHD_DC0016, @MaHD_DC0017);
DELETE FROM ThanhVienHopDong WHERE MaHopDong IN (@MaHD_DC0016, @MaHD_DC0017);
DELETE FROM HopDongThue      WHERE MaPhieuCoc IN ('DC0016', 'DC0017');
UPDATE PhieuDatCoc SET TrangThaiCoc = N'Hiệu lực'
WHERE MaPhieuDatCoc IN ('DC0016', 'DC0017');
*/
GO

