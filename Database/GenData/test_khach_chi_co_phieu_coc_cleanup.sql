USE [HOMEDORM4];
GO

BEGIN TRANSACTION;

BEGIN TRY
    DELETE ds
    FROM dbo.DoiSoat ds
    JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    WHERE pt.MaPhieuDatCoc = 'DC0999';

    DELETE FROM dbo.PhieuTraPhong WHERE MaPhieuDatCoc = 'DC0999';
    DELETE FROM dbo.ChiTietDatCoc WHERE MaChiTietDC = 'CD0999' OR MaPhieuDatCoc = 'DC0999';
    DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = 'DC0999';
    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
        EXEC sp_executesql N'DELETE FROM dbo.PDK_LoaiPhong WHERE MaDangKy = @MaDangKy;',
            N'@MaDangKy VARCHAR(6)',
            @MaDangKy = 'DK0999';
    DELETE FROM dbo.PhieuDangKy WHERE MaDangKy = 'DK0999';
    DELETE FROM dbo.TaiKhoan WHERE TenDangNhap = 'kh0999';
    DELETE FROM dbo.KhachHang WHERE MaKhachHang = 'KH0999';
    DELETE FROM dbo.NguoiDung WHERE MaNguoiDung = 'KH0999';

    UPDATE dbo.Giuong
    SET TinhTrang = N'Trống'
    WHERE MaPhong = 'P105' AND MaGiuong = 'G06';

    UPDATE dbo.Phong
    SET TinhTrang =
        CASE
            WHEN NOT EXISTS (
                SELECT 1
                FROM dbo.Giuong
                WHERE MaPhong = 'P105'
                  AND TinhTrang <> N'Trống'
            )
                THEN N'Trống'
            WHEN NOT EXISTS (
                SELECT 1
                FROM dbo.Giuong
                WHERE MaPhong = 'P105'
                  AND TinhTrang = N'Trống'
            )
                THEN N'Đầy'
            ELSE N'Còn chỗ'
        END
    WHERE MaPhong = 'P105';

    COMMIT TRANSACTION;

    PRINT N'Da xoa case KH0999 / DC0999 va tra P105-G06 ve trang thai Trong.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
