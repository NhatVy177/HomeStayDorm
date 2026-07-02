USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

-- Test case: Ke toan can thu them tien sau doi soat tra phong.
-- Man hinh can test: Quyet toan tra phong / Cho thanh toan them.
-- Tai khoan goi API: NV0004 (Ke toan CN0001 - Pham Hoai Thuong).
-- Du lieu tao ra:
--   TP0090: Phieu tra phong o trang thai Cho ky bien ban
--   DS0090: Doi soat o trang thai Cho thanh toan them, khach phai TT 650000

IF DB_ID(N'HOMEDORM4') IS NULL
    THROW 51000, N'Chua co database HOMEDORM4.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = 'HD0001')
    THROW 51001, N'Thieu du lieu goc HD0001. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
    THROW 51002, N'Thieu nhan vien ke toan NV0004.', 1;

BEGIN TRANSACTION;

DELETE FROM dbo.DoiSoat WHERE MaDoiSoat = 'DS0090';
DELETE FROM dbo.PhieuTraPhong WHERE MaPhieuTra = 'TP0090';

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
    'TP0090',
    '2026-07-01',
    '2026-07-01',
    '2026-07-01',
    N'Chờ ký biên bản',
    'HD0001',
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
    'DS0090',
    '2026-07-01',
    2800000.00,
    5.0,
    100.00,
    2800000.00,
    1200000.00,
    450000.00,
    1600000.00,
    200000.00,
    3450000.00,
    0.00,
    650000.00,
    N'Chuyển khoản',
    NULL,
    NULL,
    N'Test: Tong khau tru lon hon tien coc duoc hoan nen can thu them.',
    N'Chờ thanh toán thêm',
    'NV0004',
    'TP0090',
    'QH0004'
);

COMMIT TRANSACTION;
GO

EXEC dbo.SP_TraPhong_KeToan_DanhSachChoThuThem @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_ChiTietThuThem @MaDoiSoat = 'DS0090', @MaNhanVienKeToan = 'NV0004';
GO
