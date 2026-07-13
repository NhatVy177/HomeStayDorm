USE HOMEDORM4;
GO

/*
    Xoa sach du lieu test KH9208 de chay lai test-data-yeu-cau-tra-phong-9207-9208.sql.

    KH9208 co cau truc:
        NguoiDung    : KH9208
        KhachHang    : KH9208
        TaiKhoan     : kh9208
        PhieuDangKy  : DK9208
        PDK_LoaiPhong: DK9208 / LP0001
        PhieuDatCoc  : DC9208
        ChiTietDatCoc: CD9208
        Phong        : P928
        Giuong       : P928 / G01

    KHONG co HopDongThue, PhieuTraPhong, BienBanKiemTraPhong, DoiSoat.

    Thu tu xoa: con truoc cha (theo khoa ngoai).
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. DoiSoat (neu co - an toan de xoa truoc)
    DELETE FROM dbo.DoiSoat
    WHERE MaPhieuTra IN (
        SELECT MaPhieuTra FROM dbo.PhieuTraPhong
        WHERE MaPhieuDatCoc = 'DC9208'
    );

    -- 2. BienBanKiemTraPhong (neu co)
    DELETE FROM dbo.BienBanKiemTraPhong
    WHERE MaPhieuTra IN (
        SELECT MaPhieuTra FROM dbo.PhieuTraPhong
        WHERE MaPhieuDatCoc = 'DC9208'
    );

    -- 3. PhieuTraPhong (neu co)
    DELETE FROM dbo.PhieuTraPhong
    WHERE MaPhieuDatCoc = 'DC9208';

    -- 4. ChiTietDatCoc
    DELETE FROM dbo.ChiTietDatCoc
    WHERE MaChiTietDC = 'CD9208'
       OR MaPhieuDatCoc = 'DC9208';

    -- 5. PhieuDatCoc
    DELETE FROM dbo.PhieuDatCoc
    WHERE MaPhieuDatCoc = 'DC9208';

    -- 6. PDK_LoaiPhong
    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
        EXEC sp_executesql N'
            DELETE FROM dbo.PDK_LoaiPhong
            WHERE MaDangKy = ''DK9208'';
        ';

    -- 7. PhieuDangKy
    DELETE FROM dbo.PhieuDangKy
    WHERE MaDangKy = 'DK9208';

    -- 8. Giuong
    DELETE FROM dbo.Giuong
    WHERE MaPhong = 'P928';

    -- 9. Phong
    DELETE FROM dbo.Phong
    WHERE MaPhong = 'P928';

    -- 10. TaiKhoan
    DELETE FROM dbo.TaiKhoan
    WHERE TenDangNhap = 'kh9208';

    -- 11. KhachHang
    DELETE FROM dbo.KhachHang
    WHERE MaKhachHang = 'KH9208';

    -- 12. NguoiDung
    DELETE FROM dbo.NguoiDung
    WHERE MaNguoiDung = 'KH9208';

    COMMIT TRANSACTION;
    PRINT N'Da xoa sach du lieu KH9208.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- Kiem tra con ton tai khong
SELECT
    CASE WHEN EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = 'KH9208')
         THEN N'[LOI] KH9208 van con trong NguoiDung!'
         ELSE N'[OK] KH9208 da duoc xoa sach. Co the chay lai test script.'
    END AS KetQua;
GO
