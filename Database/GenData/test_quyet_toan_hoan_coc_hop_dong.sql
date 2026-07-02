USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

-- Test case: Ke toan can hoan coc cho khach da thanh ly hop dong.
-- Man hinh can test: Quyet toan tra phong / Cho hoan coc.
-- Tai khoan goi API: NV0004 (Ke toan CN0001 - Pham Hoai Thuong).
-- Du lieu tao ra:
--   TP0091: Phieu tra phong o trang thai Cho hoan coc
--   DS0091: Doi soat o trang thai Cho hoan coc, so tien hoan 1720000

IF DB_ID(N'HOMEDORM4') IS NULL
    THROW 51100, N'Chua co database HOMEDORM4.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = 'HD0003')
    THROW 51101, N'Thieu du lieu goc HD0003. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
    THROW 51102, N'Thieu nhan vien ke toan NV0004.', 1;

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat WHERE MaDoiSoat = 'DS0091';
DELETE FROM dbo.PhieuTraPhong WHERE MaPhieuTra = 'TP0091';

UPDATE dbo.HopDongThue
SET TrangThai = N'Đã thanh lý'
WHERE MaHopDong = 'HD0003';

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
    'TP0091',
    '2026-07-01',
    '2026-07-01',
    '2026-07-01',
    N'Chờ hoàn cọc',
    'HD0003',
    NULL
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
    'DS0091',
    '2026-07-01',
    2800000.00,
    5.0,
    100.00,
    2800000.00,
    0.00,
    480000.00,
    600000.00,
    0.00,
    1080000.00,
    1720000.00,
    0.00,
    N'Chuyển khoản',
    NULL,
    NULL,
    N'Test: Tien coc duoc hoan lon hon tong khau tru nen cho hoan coc.',
    N'Chờ hoàn cọc',
    'NV0004',
    'TP0091',
    'QH0004'
);

COMMIT TRANSACTION;
GO

EXEC dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_ChiTietHoanCoc @MaDoiSoat = 'DS0091', @MaNhanVienKeToan = 'NV0004';
GO
