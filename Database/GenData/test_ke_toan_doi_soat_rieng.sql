USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

/*
  Du lieu test rieng cho man hinh Ke toan > Quyet toan tra phong / Doi soat.

  Can chay truoc:
    1. Database/CreateDB/app.sql
    2. Database/GenData/data.sql
    3. Database/SP_TraPhong/ke-toan-doi-soat.sql

  Tai khoan test:
    nv0004 / 123  (Nhan vien ke toan CN0001)

  Cac case tao ra:
    TP0980: Chua doi soat, dung de bam "Lap doi soat"
    TP0981 + DS0981: Da lap doi soat, DoiSoat = Cho xac nhan
    TP0982 + DS0982: Khach yeu cau dieu chinh, DoiSoat = Cho phan hoi
    TP0983 + DS0983: Quan ly da chap nhan dieu chinh, DoiSoat = Can dieu chinh
    TP0984 + DS0984: Cho ke toan xac nhan thu them
    TP0985 + DS0985: Cho ke toan xac nhan hoan coc
    TP0986 + DS0986: Da quyet toan, dung de xem ket qua doi soat
*/

IF DB_ID(N'HOMEDORM4') IS NULL
    THROW 59800, N'Chua co database HOMEDORM4.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
    THROW 59801, N'Thieu nhan vien ke toan NV0004. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc IN ('DC0019', 'DC0020', 'DC0021'))
    THROW 59802, N'Thieu du lieu coc DC0019/DC0020/DC0021. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = 'HD0001')
    THROW 59803, N'Thieu hop dong HD0001. Hay chay Database/GenData/data.sql truoc.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc IN ('QH0001', 'QH0004'))
    THROW 59804, N'Thieu quy dinh hoan coc QH0001/QH0004. Hay chay Database/GenData/data.sql truoc.', 1;

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
    ('TP0980', '2026-07-01', '2026-07-03', '2026-07-03', N'Chờ đối soát', NULL, 'DC0021'),
    ('TP0981', '2026-07-02', '2026-07-04', '2026-07-04', N'Chờ đối soát', NULL, 'DC0020'),
    ('TP0982', '2026-07-03', '2026-07-05', '2026-07-05', N'Chờ đối soát', NULL, 'DC0019'),
    ('TP0983', '2026-07-04', '2026-07-06', '2026-07-06', N'Chờ đối soát', NULL, 'DC0021'),
    ('TP0984', '2026-07-05', '2026-07-07', '2026-07-07', N'Chờ ký biên bản', 'HD0001', NULL),
    ('TP0985', '2026-07-06', '2026-07-08', '2026-07-08', N'Chờ hoàn cọc', NULL, 'DC0020'),
    ('TP0986', '2026-07-07', '2026-07-09', '2026-07-09', N'Hoàn tất', NULL, 'DC0019');

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
    -- Da lap, dang cho khach xac nhan.
    ('DS0981', '2026-07-04', 1800000.00, 0.0, 80.00, 1440000.00, 0.00, 0.00, 140000.00, 0.00, 140000.00, 1300000.00, 0.00, NULL, NULL, NULL, NULL, N'Hoàn cọc', N'Chờ xác nhận', 'NV0004', 'TP0981', 'QH0001'),

    -- Khach khong dong y, dang cho quan ly xem phan hoi.
    ('DS0982', '2026-07-05', 1800000.00, 0.0, 80.00, 1440000.00, 0.00, 0.00, 300000.00, 0.00, 300000.00, 1140000.00, 0.00, NULL, NULL, NULL, N'Khách phản hồi: chi phí sửa chữa chưa đúng, cần kiểm tra lại.', N'Hoàn cọc', N'Chờ phản hồi', 'NV0004', 'TP0982', 'QH0001'),

    -- Quan ly chap nhan dieu chinh, ke toan can tinh/lap lai.
    ('DS0983', '2026-07-06', 1800000.00, 0.0, 80.00, 1440000.00, 0.00, 0.00, 500000.00, 0.00, 500000.00, 940000.00, 0.00, NULL, NULL, NULL, N'Quản lý yêu cầu kế toán điều chỉnh lại chi phí sửa chữa.', N'Hoàn cọc', N'Cần điều chỉnh', 'NV0004', 'TP0983', 'QH0001'),

    -- Khach da dong y va can thanh toan them; ke toan xac nhan sau khi nhan tien.
    ('DS0984', '2026-07-07', 2800000.00, 5.0, 100.00, 2800000.00, 1200000.00, 450000.00, 1600000.00, 200000.00, 3450000.00, 0.00, 650000.00, NULL, NULL, NULL, N'Khách đã đồng ý, chờ khách thanh toán thêm.', N'Thu thêm', N'Chờ thanh toán thêm', 'NV0004', 'TP0984', 'QH0004'),

    -- Khach da dong y va can hoan coc; ke toan xac nhan sau khi chuyen tien.
    ('DS0985', '2026-07-08', 1800000.00, 0.0, 80.00, 1440000.00, 0.00, 0.00, 240000.00, 0.00, 240000.00, 1200000.00, 0.00, NULL, NULL, NULL, N'Khách đã đồng ý, chờ kế toán hoàn cọc.', N'Hoàn cọc', N'Chờ hoàn cọc', 'NV0004', 'TP0985', 'QH0001'),

    -- Case da hoan tat quyet toan.
    ('DS0986', '2026-07-09', 1800000.00, 0.0, 80.00, 1440000.00, 0.00, 0.00, 240000.00, 0.00, 240000.00, 1200000.00, 0.00, N'Chuyển khoản', '/uploads/chung-tu-doi-soat/DS0986_test.pdf', '2026-07-09', N'Đã hoàn tất quyết toán test.', N'Hoàn cọc', N'Đã quyết toán', 'NV0004', 'TP0986', 'QH0001');

COMMIT TRANSACTION;
GO

PRINT N'Da tao du lieu test ke toan doi soat: TP0980-TP0986, DS0981-DS0986.';
GO

-- Kiem tra nhanh cac danh sach chinh cua man hinh ke toan.
EXEC dbo.SP_TraPhong_KeToan_DanhSachChoDoiSoat @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_DanhSachChoThuThem @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_DanhSachChoHoanCoc @MaNhanVienKeToan = 'NV0004';
EXEC dbo.SP_TraPhong_KeToan_KetQuaDoiSoat @MaNhanVienKeToan = 'NV0004';
GO
