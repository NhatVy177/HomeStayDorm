USE [HOMEDORM4];
GO

SET DATEFORMAT ymd;
GO

BEGIN TRANSACTION;

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = 'NV0004')
        THROW 51000, N'Thieu nhan vien ke toan NV0004. Hay chay data.sql truoc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = 'P105')
        THROW 51001, N'Thieu phong P105. Hay chay data.sql truoc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = 'P105' AND MaGiuong = 'G06')
        THROW 51002, N'Thieu giuong P105-G06. Hay chay data.sql truoc.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.PhieuDatCoc
        WHERE MaPhieuDatCoc = 'DC0999'
    )
    OR EXISTS (
        SELECT 1
        FROM dbo.PhieuDangKy
        WHERE MaDangKy = 'DK0999'
    )
    OR EXISTS (
        SELECT 1
        FROM dbo.NguoiDung
        WHERE MaNguoiDung = 'KH0999'
    )
    BEGIN
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
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.Giuong
        WHERE MaPhong = 'P105'
          AND TinhTrang <> N'Trống'
    )
    BEGIN
        THROW 51003, N'Phong P105 khong con trong hoan toan. Hay chay cleanup hoac doi sang phong/giuong khac.', 1;
    END;

    INSERT INTO dbo.NguoiDung (
        MaNguoiDung,
        HoTen,
        NgaySinh,
        GioiTinh,
        SDT,
        Email,
        UrlAvt,
        LoaiNguoiDung
    )
    VALUES (
        'KH0999',
        N'Nguyễn Khách Mới',
        '2002-09-09',
        N'Nữ',
        '0912099999',
        'khachmoi0999@homedorm.vn',
        NULL,
        'KhachHang'
    );

    INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
    VALUES ('KH0999', N'Việt Nam', '079202099999');

    INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
    VALUES (
        'kh0999',
        'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3',
        N'Hoạt động',
        'KH0999'
    );

    INSERT INTO dbo.PhieuDangKy (
        MaDangKy,
        NgayDangKy,
        SoNam,
        SoNu,
        SoNguoiDuKienO,
        KhuVucMongMuon,
        MucGiaToiDa,
        ThoiGianDuKienVaoO,
        ThoiHanThue,
        YeuCauKhac,
        TrangThai,
        MaKhachHang,
        MaNhanVienSale,
        GhiChuSale
    )
    VALUES (
        'DK0999',
        '2026-07-08',
        0,
        1,
        1,
        N'Chi nhánh trung tâm',
        1800000,
        '2026-07-15',
        6,
        N'Khách mới chỉ mới đặt cọc, chưa lập hợp đồng.',
        N'Xác nhận cọc',
        'KH0999',
        NULL,
        NULL
    );

    IF OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
    BEGIN
        EXEC sp_executesql N'
            INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong)
            SELECT @MaDangKy, @MaLoaiPhong
            WHERE EXISTS (
                SELECT 1
                FROM dbo.LoaiPhong
                WHERE MaLoaiPhong = @MaLoaiPhong
            )
            AND NOT EXISTS (
                SELECT 1
                FROM dbo.PDK_LoaiPhong
                WHERE MaDangKy = @MaDangKy
                  AND MaLoaiPhong = @MaLoaiPhong
            );
        ', N'@MaDangKy VARCHAR(6), @MaLoaiPhong VARCHAR(6)',
        @MaDangKy = 'DK0999',
        @MaLoaiPhong = 'LP0003';
    END;

    INSERT INTO dbo.PhieuDatCoc (
        MaPhieuDatCoc,
        ThoiDiemDatCoc,
        ThoiHanThanhToan,
        SoTienCoc,
        PhuongThucThanhToan,
        TrangThaiThanhToan,
        ThoiGianXacNhanTT,
        ChungTuThanhToan,
        ThoiGianNhanPhong,
        HinhThucThue,
        TrangThaiCoc,
        MaPhieuYeuCauDangKy,
        MaKhachHang,
        MaNhanVienKeToan
    )
    VALUES (
        'DC0999',
        '2026-07-08 09:00:00',
        '2026-07-09 09:00:00',
        1800000,
        N'Chuyển khoản',
        N'Đã TT',
        '2026-07-08 09:20:00',
        '/uploads/chung-tu-coc/DC0999_test.pdf',
        '2026-07-15 09:00:00',
        N'Ghép giường',
        N'Hiệu lực',
        'DK0999',
        'KH0999',
        'NV0004'
    );

    INSERT INTO dbo.ChiTietDatCoc (
        MaChiTietDC,
        MaPhieuDatCoc,
        MaPhong,
        MaGiuong,
        GiaThue
    )
    VALUES ('CD0999', 'DC0999', 'P105', 'G06', 1800000);

    UPDATE dbo.Giuong
    SET TinhTrang = N'Đã đặt cọc'
    WHERE MaPhong = 'P105' AND MaGiuong = 'G06';

    UPDATE dbo.Phong
    SET TinhTrang = N'Đã đặt cọc'
    WHERE MaPhong = 'P105';

    COMMIT TRANSACTION;

    PRINT N'Da tao case khach moi chi co phieu dat coc: KH0999 / DC0999. Tai khoan: kh0999 / 123.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

SELECT
    nd.MaNguoiDung,
    nd.HoTen,
    tk.TenDangNhap,
    pdk.MaDangKy,
    pdc.MaPhieuDatCoc,
    pdc.TrangThaiThanhToan,
    pdc.TrangThaiCoc,
    ctdc.MaPhong,
    ctdc.MaGiuong
FROM dbo.NguoiDung nd
JOIN dbo.KhachHang kh ON kh.MaKhachHang = nd.MaNguoiDung
JOIN dbo.TaiKhoan tk ON tk.MaNguoiDung = nd.MaNguoiDung
JOIN dbo.PhieuDangKy pdk ON pdk.MaKhachHang = kh.MaKhachHang
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuYeuCauDangKy = pdk.MaDangKy
JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
WHERE nd.MaNguoiDung = 'KH0999';

SELECT COUNT(*) AS SoHopDong
FROM dbo.HopDongThue
WHERE MaKhachHang = 'KH0999' OR MaPhieuCoc = 'DC0999';

SELECT COUNT(*) AS SoPhieuTraPhong
FROM dbo.PhieuTraPhong
WHERE MaPhieuDatCoc = 'DC0999';

SELECT COUNT(*) AS SoDoiSoat
FROM dbo.DoiSoat ds
JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
WHERE pt.MaPhieuDatCoc = 'DC0999';
GO
