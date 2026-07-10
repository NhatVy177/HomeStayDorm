USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

/*
  Du lieu test rieng cho 4 truong hop ke toan doi soat:

  1. TP0991 + DS0991: Hoan coc sau khi hop dong da thanh ly
  2. TP0992 + DS0992: Thu them
  3. TP0993 + DS0993: Khong phat sinh thu/hoan
  4. TP0994: Tra phong khi moi co phieu coc, chua lap hop dong

  Tai khoan test:
    nv0004 / 123  (Nhan vien ke toan CN0001)

  Chay sau:
    Database/GenData/data.sql
    Database/SP_TraPhong/ke-toan-doi-soat.sql
*/

IF DB_ID(N'HOMEDORM4') IS NULL
    THROW 59900, N'Chua co database HOMEDORM4.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
    THROW 59901, N'Thieu nhan vien ke toan NV0004. Hay chay data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong IN ('HD0001', 'HD0003'))
    THROW 59902, N'Thieu hop dong HD0001/HD0003. Hay chay data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc IN ('DC0019', 'DC0021'))
    THROW 59903, N'Thieu phieu coc DC0019/DC0021. Hay chay data.sql truoc.', 1;

IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = 'DC0021')
    THROW 59904, N'DC0021 da co hop dong, khong dung duoc cho case chi moi co phieu coc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc IN ('QH0001', 'QH0004'))
    THROW 59905, N'Thieu quy dinh hoan coc QH0001/QH0004. Hay chay data.sql truoc.', 1;

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat
WHERE MaDoiSoat IN ('DS0991', 'DS0992', 'DS0993');

DELETE FROM dbo.PhieuTraPhong
WHERE MaPhieuTra IN ('TP0991', 'TP0992', 'TP0993', 'TP0994');

UPDATE dbo.HopDongThue
SET TrangThai = N'Đã thanh lý'
WHERE MaHopDong = 'HD0003';

UPDATE dbo.HopDongThue
SET TrangThai = N'Hiệu lực'
WHERE MaHopDong = 'HD0001';

UPDATE dbo.PhieuDatCoc
SET TrangThaiCoc = N'Hiệu lực',
    TrangThaiThanhToan = N'Đã TT'
WHERE MaPhieuDatCoc IN ('DC0019', 'DC0021');

INSERT INTO dbo.PhieuTraPhong (
    MaPhieuTra,
    NgayDangKyTra,
    NgayDuKienTra,
    NgayTraThucTe,
    TrangThai,
    MaHopDong,
    MaPhieuDatCoc
)
VALUES
    -- 1. Truong hop hoan coc: da qua buoc thanh ly, cho ke toan chuyen tien hoan coc.
    ('TP0991', '2026-07-10', '2026-07-12', '2026-07-12', N'Chờ hoàn cọc', 'HD0003', NULL),

    -- 2. Truong hop thu them: khach da dong y, cho ke toan xac nhan da nhan tien.
    ('TP0992', '2026-07-11', '2026-07-13', '2026-07-13', N'Chờ ký biên bản', 'HD0001', NULL),

    -- 3. Truong hop khong phat sinh: da quyet toan xong, xem trong tab ket qua.
    ('TP0993', '2026-07-12', '2026-07-14', '2026-07-14', N'Hoàn tất', NULL, 'DC0019'),

    -- 4. Truong hop chi moi co phieu coc, chua lap hop dong: dung de bam Lap doi soat.
    ('TP0994', '2026-07-13', '2026-07-15', '2026-07-15', N'Chờ đối soát', NULL, 'DC0021');

INSERT INTO dbo.DoiSoat (
    MaDoiSoat,
    NgayLap,
    TienCocBanDau,
    SoThangLuuTru,
    TyLeHoanCocHienTai,
    TienCocDuocHoan,
    TienThueConNo,
    TienDichVuConNo,
    TongChiPhiSuaChua,
    TienPhat,
    TongKhauTru,
    SoTienHoanThucTe,
    SoTienKhachPhaiTT,
    PhuongThucThanhToan,
    ChungTuThanhToan,
    NgayThanhToan,
    GhiChuPhanHoiKhach,
    LoaiQuyetToan,
    TrangThai,
    MaNhanVienKeToan,
    MaPhieuTra,
    MaQuyDinhHoanCoc
)
VALUES
    -- 1. Hoan coc: hien o tab Ghi nhan hoan coc.
    ('DS0991', '2026-07-12', 2800000.00, 5.0, 100.00, 2800000.00, 0.00, 480000.00, 600000.00, 0.00, 1080000.00, 1720000.00, 0.00, NULL, NULL, NULL, N'Case test hoan coc: tien coc duoc hoan lon hon tong khau tru.', N'Hoàn cọc', N'Chờ hoàn cọc', 'NV0004', 'TP0991', 'QH0004'),

    -- 2. Thu them: hien o tab Ghi nhan thu them.
    ('DS0992', '2026-07-13', 2800000.00, 5.0, 100.00, 2800000.00, 1200000.00, 450000.00, 1600000.00, 200000.00, 3450000.00, 0.00, 650000.00, NULL, NULL, NULL, N'Case test thu them: tong khau tru lon hon tien coc duoc hoan.', N'Thu thêm', N'Chờ thanh toán thêm', 'NV0004', 'TP0992', 'QH0004'),

    -- 3. Khong phat sinh: hien o tab Ket qua doi soat.
    ('DS0993', '2026-07-14', 1800000.00, 0.0, 80.00, 1440000.00, 0.00, 0.00, 1440000.00, 0.00, 1440000.00, 0.00, 0.00, NULL, NULL, '2026-07-14', N'Case test khong phat sinh: tien coc duoc hoan bang tong khau tru.', N'Không phát sinh', N'Đã quyết toán', 'NV0004', 'TP0993', 'QH0001');

COMMIT TRANSACTION;
GO

PRINT N'Da tao du lieu test 4 case doi soat: TP0991-TP0994, DS0991-DS0993.';
GO

-- Kiem tra nhanh:
EXEC dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_DanhSachChoThuThem @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_KetQuaDoiSoat @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat @MaNhanVienKeToan = 'NV0004';
GO
