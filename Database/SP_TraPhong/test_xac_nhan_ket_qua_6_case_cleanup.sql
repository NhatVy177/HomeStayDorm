USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

BEGIN TRANSACTION;

BEGIN TRY
    DELETE cthh
    FROM dbo.ChiTietHuHong cthh
    INNER JOIN dbo.BienBanKiemTraPhong bbkt
        ON bbkt.MaBienBanKT = cthh.MaBienBanKT
    WHERE bbkt.MaPhieuTra IN ('TP9201', 'TP9202', 'TP9203', 'TP9204', 'TP9205', 'TP9206');

    DELETE FROM dbo.DoiSoat
    WHERE MaDoiSoat IN ('DS9201', 'DS9202', 'DS9203', 'DS9204', 'DS9205', 'DS9206');

    DELETE FROM dbo.BienBanKiemTraPhong
    WHERE MaPhieuTra IN ('TP9201', 'TP9202', 'TP9203', 'TP9204', 'TP9205', 'TP9206');

    DELETE cthd
    FROM dbo.ChiTietHoaDon cthd
    INNER JOIN dbo.HoaDon hd
        ON hd.MaHoaDon = cthd.MaHoaDon
    WHERE hd.MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.HoaDon
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.DichVuHopDong
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.ThanhVienHopDong
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.BienBanViPham
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203')
       OR MaKhachHang IN ('KH9201', 'KH9202', 'KH9203', 'KH9204', 'KH9205', 'KH9206');

    DELETE FROM dbo.PhieuTraPhong
    WHERE MaPhieuTra IN ('TP9201', 'TP9202', 'TP9203', 'TP9204', 'TP9205', 'TP9206');

    DELETE FROM dbo.HopDongThue
    WHERE MaHopDong IN ('HD9201', 'HD9202', 'HD9203');

    DELETE FROM dbo.ChiTietDatCoc
    WHERE MaChiTietDC IN ('CD9201', 'CD9202', 'CD9203', 'CD9204', 'CD9205', 'CD9206')
       OR MaPhieuDatCoc IN ('DC9201', 'DC9202', 'DC9203', 'DC9204', 'DC9205', 'DC9206');

    DELETE FROM dbo.PhieuDatCoc
    WHERE MaPhieuDatCoc IN ('DC9201', 'DC9202', 'DC9203', 'DC9204', 'DC9205', 'DC9206');

    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
        EXEC sp_executesql N'
            DELETE FROM dbo.PDK_LoaiPhong
            WHERE MaDangKy IN (''DK9201'', ''DK9202'', ''DK9203'', ''DK9204'', ''DK9205'', ''DK9206'');
        ';

    DELETE FROM dbo.PhieuDangKy
    WHERE MaDangKy IN ('DK9201', 'DK9202', 'DK9203', 'DK9204', 'DK9205', 'DK9206');

    DELETE FROM dbo.TaiKhoan
    WHERE TenDangNhap IN ('kh9201', 'kh9202', 'kh9203', 'kh9204', 'kh9205', 'kh9206');

    DELETE FROM dbo.KhachHang
    WHERE MaKhachHang IN ('KH9201', 'KH9202', 'KH9203', 'KH9204', 'KH9205', 'KH9206');

    DELETE FROM dbo.NguoiDung
    WHERE MaNguoiDung IN ('KH9201', 'KH9202', 'KH9203', 'KH9204', 'KH9205', 'KH9206');

    DELETE FROM dbo.Giuong
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    DELETE FROM dbo.Phong
    WHERE MaPhong IN ('P921', 'P922', 'P923', 'P924', 'P925', 'P926');

    COMMIT TRANSACTION;

    PRINT N'Da xoa 6 case test xac nhan ket qua doi soat KH9201-KH9206.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
