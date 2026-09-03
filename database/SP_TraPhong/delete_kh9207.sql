USE HOMEDORM4;
GO

/*
    Xoa sach du lieu test KH9207 de chay lai test-data-yeu-cau-tra-phong-9207-9208.sql.

    KH9207 co cau truc:
        NguoiDung       : KH9207
        KhachHang       : KH9207
        TaiKhoan        : kh9207
        PhieuDangKy     : DK9207
        PDK_LoaiPhong   : DK9207 / LP0001
        PhieuDatCoc     : DC9207
        ChiTietDatCoc   : CD9207
        HopDongThue     : HD9207
        ThanhVienHopDong: TV9207
        DichVuHopDong   : VH9207
        Phong           : P927
        Giuong          : P927 / G01

    Script cung xoa cac du lieu phat sinh khi da test:
        PhieuTraPhong, BienBanKiemTraPhong, DoiSoat, HoaDon, BienBanBanGiao,
        YeuCauSuaChua, BienBanViPham, HoSoCuTru (neu co).

    Thu tu xoa: con truoc cha (theo khoa ngoai).
*/

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Cac nghiep vu phat sinh tu hop dong/phieu tra/phong
    DELETE FROM dbo.YeuCauSuaChua
    WHERE MaHopDong = 'HD9207'
       OR MaPhong = 'P927';

    DELETE FROM dbo.BienBanViPham
    WHERE MaHopDong = 'HD9207'
       OR MaKhachHang = 'KH9207';

    DELETE cthh
    FROM dbo.ChiTietHuHong cthh
    INNER JOIN dbo.BienBanKiemTraPhong bbkt
        ON bbkt.MaBienBanKT = cthh.MaBienBanKT
    INNER JOIN dbo.PhieuTraPhong ptp
        ON ptp.MaPhieuTra = bbkt.MaPhieuTra
    WHERE ptp.MaHopDong = 'HD9207'
       OR ptp.MaPhieuDatCoc = 'DC9207';

    DELETE FROM dbo.ChiTietHuHong
    WHERE MaPhong = 'P927';

    DELETE FROM dbo.DoiSoat
    WHERE MaPhieuTra IN (
        SELECT MaPhieuTra
        FROM dbo.PhieuTraPhong
        WHERE MaHopDong = 'HD9207'
           OR MaPhieuDatCoc = 'DC9207'
    );

    DELETE FROM dbo.BienBanKiemTraPhong
    WHERE MaPhieuTra IN (
        SELECT MaPhieuTra
        FROM dbo.PhieuTraPhong
        WHERE MaHopDong = 'HD9207'
           OR MaPhieuDatCoc = 'DC9207'
    );

    DELETE ctbg
    FROM dbo.ChiTietBanGiao ctbg
    WHERE ctbg.MaPhong = 'P927'
       OR ctbg.MaBienBan IN (
            SELECT bbbg.MaBienBan
            FROM dbo.BienBanBanGiao bbbg
            WHERE bbbg.MaHopDong = 'HD9207'
       );

    DELETE FROM dbo.BienBanBanGiao
    WHERE MaHopDong = 'HD9207';

    -- 2. Hoa don / dich vu hop dong
    DELETE cthd
    FROM dbo.ChiTietHoaDon cthd
    INNER JOIN dbo.HoaDon hd
        ON hd.MaHoaDon = cthd.MaHoaDon
    WHERE hd.MaHopDong = 'HD9207';

    DELETE cthd
    FROM dbo.ChiTietHoaDon cthd
    INNER JOIN dbo.PhieuGhiChiSo pgcs
        ON pgcs.MaPhieuGhi = cthd.MaPhieuGhi
    WHERE pgcs.MaPhong = 'P927';

    DELETE FROM dbo.HoaDon
    WHERE MaHopDong = 'HD9207';

    DELETE cthd
    FROM dbo.ChiTietHoaDon cthd
    WHERE cthd.MaChiTietDVHD = 'VH9207'
       OR cthd.MaChiTietDVHD IN (
            SELECT MaChiTietDVHD
            FROM dbo.DichVuHopDong
            WHERE MaHopDong = 'HD9207'
       );

    DELETE FROM dbo.DichVuHopDong
    WHERE MaHopDong = 'HD9207'
       OR MaChiTietDVHD = 'VH9207';

    -- 3. Thanh vien / ho so cu tru
    DELETE FROM dbo.ThanhVienHopDong
    WHERE MaHopDong = 'HD9207'
       OR MaThanhVien = 'TV9207';

    IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.ThanhVienHopDong', N'MaHoSoCuTru') IS NOT NULL
        EXEC sp_executesql N'
            DELETE tvhd
            FROM dbo.ThanhVienHopDong tvhd
            INNER JOIN dbo.HoSoCuTru hsct
                ON hsct.MaHoSoCuTru = tvhd.MaHoSoCuTru
            WHERE hsct.MaPhieuDatCoc = ''DC9207'';
        ';

    IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NOT NULL
        EXEC sp_executesql N'
            DELETE FROM dbo.HoSoCuTru
            WHERE MaPhieuDatCoc = ''DC9207'';
        ';

    -- 4. Phieu tra / hop dong / phieu coc
    DELETE FROM dbo.PhieuTraPhong
    WHERE MaHopDong = 'HD9207'
       OR MaPhieuDatCoc = 'DC9207';

    DELETE FROM dbo.HopDongThue
    WHERE MaHopDong = 'HD9207'
       OR MaPhieuCoc = 'DC9207'
       OR MaKhachHang = 'KH9207';

    DELETE FROM dbo.ChiTietDatCoc
    WHERE MaChiTietDC = 'CD9207'
       OR MaPhieuDatCoc = 'DC9207'
       OR MaPhong = 'P927';

    DELETE FROM dbo.PhieuDatCoc
    WHERE MaPhieuDatCoc = 'DC9207'
       OR MaKhachHang = 'KH9207';

    -- 5. Ho so dang ky
    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
        EXEC sp_executesql N'
            DELETE FROM dbo.PDK_LoaiPhong
            WHERE MaDangKy = ''DK9207'';
        ';

    DELETE FROM dbo.ChiTietXemPhong
    WHERE MaDangKy = 'DK9207'
       OR MaPhong = 'P927';

    DELETE FROM dbo.LichXemPhong
    WHERE MaDangKy = 'DK9207';

    DELETE FROM dbo.PhieuDangKy
    WHERE MaDangKy = 'DK9207'
       OR MaKhachHang = 'KH9207';

    -- 6. Phong/giuong va du lieu lien quan den phong test
    DELETE FROM dbo.HinhAnhPhong
    WHERE MaPhong = 'P927';

    DELETE FROM dbo.PhieuGhiChiSo
    WHERE MaPhong = 'P927';

    DELETE FROM dbo.Giuong
    WHERE MaPhong = 'P927';

    DELETE FROM dbo.TaiSan
    WHERE MaPhong = 'P927';

    DELETE FROM dbo.Phong
    WHERE MaPhong = 'P927';

    -- 7. Tai khoan / khach hang / nguoi dung
    DELETE FROM dbo.TaiKhoan
    WHERE TenDangNhap = 'kh9207'
       OR MaNguoiDung = 'KH9207';

    DELETE FROM dbo.KhachHang
    WHERE MaKhachHang = 'KH9207';

    DELETE FROM dbo.NguoiDung
    WHERE MaNguoiDung = 'KH9207';

    COMMIT TRANSACTION;
    PRINT N'Da xoa sach du lieu KH9207.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- Kiem tra con ton tai khong
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = 'KH9207')
          OR EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = 'KH9207')
          OR EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = 'kh9207' OR MaNguoiDung = 'KH9207')
          OR EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = 'DK9207' OR MaKhachHang = 'KH9207')
          OR EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = 'DC9207' OR MaKhachHang = 'KH9207')
          OR EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaHopDong = 'HD9207' OR MaPhieuCoc = 'DC9207' OR MaKhachHang = 'KH9207')
          OR EXISTS (SELECT 1 FROM dbo.PhieuTraPhong WHERE MaHopDong = 'HD9207' OR MaPhieuDatCoc = 'DC9207')
          OR EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P927')
        THEN N'[LOI] KH9207 van con du lieu lien quan!'
        ELSE N'[OK] KH9207 da duoc xoa sach. Co the chay lai test script.'
    END AS KetQua;
GO
