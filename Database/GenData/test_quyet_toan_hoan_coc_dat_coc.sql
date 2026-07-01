USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

-- Test case: Ke toan can hoan coc cho phieu dat coc chua ky hop dong.
-- Man hinh can test: Quyet toan tra phong / Cho hoan coc.
-- Tai khoan goi API: NV0004 (Ke toan CN0001 - Pham Hoai Thuong).
-- Du lieu tao ra:
--   TP0092: Phieu tra phong theo phieu dat coc DC0020, trang thai Cho hoan coc
--   DS0092: Doi soat o trang thai Cho hoan coc, so tien hoan 1200000

IF DB_ID(N'HOMEDORM4') IS NULL
    THROW 51200, N'Chua co database HOMEDORM4.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = 'DC0020')
    THROW 51201, N'Thieu du lieu goc DC0020. Hay chay Database/GenData/data.sql truoc.', 1;

IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = 'DC0020')
    THROW 51202, N'DC0020 da co hop dong, khong dung duoc cho case dat coc chua ky HD.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
    THROW 51203, N'Thieu nhan vien ke toan NV0004.', 1;

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat WHERE MaDoiSoat = 'DS0092';
DELETE FROM dbo.PhieuTraPhong WHERE MaPhieuTra = 'TP0092';

UPDATE dbo.PhieuDatCoc
SET TrangThaiCoc = N'Hiệu lực',
    TrangThaiThanhToan = N'Đã TT'
WHERE MaPhieuDatCoc = 'DC0020';

INSERT INTO dbo.PhieuTraPhong (
    MaPhieuTra,
    NgayDangKyTra,
    NgayDuKienTra,
    NgayTraThucTe,
    TrangThai,
    MaHopDong,
    MaPhieuDatCoc
)
VALUES (
    'TP0092',
    '2026-07-01',
    '2026-07-01',
    '2026-07-01',
    N'Chờ hoàn cọc',
    NULL,
    'DC0020'
);

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
    TrangThai,
    MaNhanVienKeToan,
    MaPhieuTra,
    MaQuyDinhHoanCoc
)
VALUES (
    'DS0092',
    '2026-07-01',
    1800000.00,
    0.0,
    80.00,
    1440000.00,
    0.00,
    0.00,
    240000.00,
    0.00,
    240000.00,
    1200000.00,
    0.00,
    N'Chuyển khoản',
    NULL,
    NULL,
    N'Test: Huy coc truoc khi ky hop dong, hoan 80% sau khi tru chi phi.',
    N'Chờ hoàn cọc',
    'NV0004',
    'TP0092',
    'QH0001'
);

COMMIT TRANSACTION;
GO

EXEC dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_ChiTietHoanCoc @MaDoiSoat = 'DS0092', @MaNhanVienKeToan = 'NV0004';
GO
