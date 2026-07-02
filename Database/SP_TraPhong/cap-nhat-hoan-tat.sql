USE [HOMEDORM4];
GO

-- 1. SP_TraPhong_QuanLy_DanhSachHoanTat
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachHoanTat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachHoanTat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachHoanTat
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
    BEGIN
        RAISERROR(N'Nhân viên không tồn tại hoặc không hợp lệ.', 16, 1);
        RETURN;
    END

    SELECT DISTINCT
        pt.MaPhieuTra AS maPhieuTra,
        nd.HoTen AS hoTenKhach,
        p.TenPhong AS tenPhong,
        g.MaGiuong AS maGiuong,
        ds.MaDoiSoat AS maDoiSoat,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.TrangThai AS trangThai,
        CASE WHEN pt.MaHopDong IS NOT NULL THEN N'HopDong' ELSE N'DatCoc' END AS loaiNguon
    FROM dbo.PhieuTraPhong pt
    LEFT JOIN dbo.DoiSoat ds ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
    LEFT JOIN dbo.Giuong g ON ctdc.MaGiuong = g.MaGiuong AND ctdc.MaPhong = g.MaPhong
    INNER JOIN dbo.KhachHang kh ON pdc.MaKhachHang = kh.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE pt.TrangThai = N'Chờ hoàn tất' AND p.MaChiNhanh = @MaChiNhanh;
END;
GO

-- 2. SP_TraPhong_QuanLy_ChiTietHoanTat
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietHoanTat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietHoanTat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietHoanTat
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien;

    -- Lấy thông tin chung
    SELECT DISTINCT
        pt.MaPhieuTra AS maPhieuTra,
        nd.HoTen AS hoTenKhach,
        nd.SDT AS soDienThoai,
        p.TenPhong AS tenPhong,
        g.MaGiuong AS maGiuong,
        cn.TenChiNhanh AS khuVuc,
        CASE WHEN pt.MaHopDong IS NOT NULL THEN 1 ELSE 0 END AS hasHopDong,
        pt.MaHopDong AS maHopDong,
        pdc.MaPhieuDatCoc AS maPhieuDatCoc,
        CONVERT(VARCHAR(10), hd.NgayBatDau, 120) AS ngayBatDauHopDong,
        CONVERT(VARCHAR(10), hd.NgayKetThuc, 120) AS ngayKetThucHopDong,
        hd.TrangThai AS trangThaiHopDong,
        hd.SoGiuongThue AS soGiuongThue,
        lp.SucChuaToiDa AS sucChuaToiDa,
        ds.TrangThai AS trangThaiDoiSoat,
        ds.MaDoiSoat AS maDoiSoat,
        CONVERT(VARCHAR(10), bkt.NgayKiemTra, 120) AS ngayTraThucTe
    FROM dbo.PhieuTraPhong pt
    LEFT JOIN dbo.DoiSoat ds ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT JOIN dbo.BienBanKiemTraPhong bkt ON pt.MaPhieuTra = bkt.MaPhieuTra
    LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
    LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON ctdc.MaPhong = p.MaPhong
    INNER JOIN dbo.LoaiPhong lp ON p.MaLoaiPhong = lp.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh cn ON p.MaChiNhanh = cn.MaChiNhanh
    LEFT JOIN dbo.Giuong g ON ctdc.MaGiuong = g.MaGiuong AND ctdc.MaPhong = g.MaPhong
    INNER JOIN dbo.KhachHang kh ON pdc.MaKhachHang = kh.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON kh.MaKhachHang = nd.MaNguoiDung
    WHERE pt.MaPhieuTra = @MaPhieuTra AND p.MaChiNhanh = @MaChiNhanh;

    -- Lấy danh sách tài sản/chìa khóa/thẻ đã bàn giao vào (để làm template trả ra)
    DECLARE @MaHopDong VARCHAR(6);
    SELECT @MaHopDong = MaHopDong FROM dbo.PhieuTraPhong WHERE MaPhieuTra = @MaPhieuTra;

    IF @MaHopDong IS NOT NULL
    BEGIN
        SELECT DISTINCT
            ts.MaTaiSan AS maTaiSan,
            ts.TenTaiSan AS tenTaiSan,
            ct.SoLuongThucTe AS soLuongBanGiaoVao
        FROM dbo.BienBanBanGiao bg
        INNER JOIN dbo.ChiTietBanGiao ct ON bg.MaBienBan = ct.MaBienBan
        INNER JOIN dbo.TaiSan ts ON ct.MaTaiSan = ts.MaTaiSan
        WHERE bg.MaHopDong = @MaHopDong AND bg.LoaiBanGiao = N'Bàn giao vào';
    END
END;
GO

-- 3. SP_TraPhong_QuanLy_CapNhatHoanTat
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_CapNhatHoanTat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_CapNhatHoanTat AS BEGIN SET NOCOUNT ON; END;');
GO
CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_CapNhatHoanTat
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6),
    @JSONBanGiaoRa NVARCHAR(MAX) = NULL -- [{"maTaiSan":"TS01", "soLuongThuHoi": 1, "ghiChu": "Tốt"}]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TrangThaiPT NVARCHAR(30), @MaHopDong VARCHAR(6), @MaPhong VARCHAR(6), @MaGiuong VARCHAR(6);
        
        SELECT 
            @TrangThaiPT = pt.TrangThai, 
            @MaHopDong = pt.MaHopDong,
            @MaPhong = ctdc.MaPhong,
            @MaGiuong = ctdc.MaGiuong
        FROM dbo.PhieuTraPhong pt
        LEFT JOIN dbo.HopDongThue hd ON pt.MaHopDong = hd.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pt.MaPhieuDatCoc = pdc.MaPhieuDatCoc OR hd.MaPhieuCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.ChiTietDatCoc ctdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
        WHERE pt.MaPhieuTra = @MaPhieuTra;

        -- E8.1: Không còn ở trạng thái Chờ hoàn tất
        IF @TrangThaiPT <> N'Chờ hoàn tất'
        BEGIN
            THROW 50010, N'Phiếu trả phòng không còn ở trạng thái chờ hoàn tất hoặc đã được cập nhật bởi nhân viên khác.', 1;
        END

        -- E8.2: Hồ sơ chưa đủ điều kiện (nếu có hợp đồng thì hợp đồng phải "Đã thanh lý")
        IF @MaHopDong IS NOT NULL
        BEGIN
            DECLARE @TrangThaiHD NVARCHAR(30);
            SELECT @TrangThaiHD = TrangThai FROM dbo.HopDongThue WHERE MaHopDong = @MaHopDong;
            IF @TrangThaiHD <> N'Đã thanh lý'
            BEGIN
                THROW 50011, N'Hồ sơ trả phòng chưa đủ điều kiện hoàn tất.', 1;
            END
        END

        -- 1. Xử lý bàn giao ra nếu có hợp đồng
        IF @MaHopDong IS NOT NULL AND @JSONBanGiaoRa IS NOT NULL AND LTRIM(RTRIM(@JSONBanGiaoRa)) <> '' AND @JSONBanGiaoRa <> '[]'
        BEGIN
            DECLARE @MaBienBanBG VARCHAR(6);
            SELECT @MaBienBanBG = 'BG' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaBienBan, 3, 4) AS INT)), 0) + 1 AS VARCHAR), 4) FROM dbo.BienBanBanGiao;

            INSERT INTO dbo.BienBanBanGiao (MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy)
            VALUES (@MaBienBanBG, GETDATE(), N'Bàn giao ra', @MaHopDong, @MaNhanVien);

            -- Thêm chi tiết bàn giao ra
            DECLARE @MaChiTietBG VARCHAR(6);
            SELECT @MaChiTietBG = ISNULL(MAX(MaChiTietBG), 'CB0000') FROM dbo.ChiTietBanGiao;
            DECLARE @MaxID INT = CAST(SUBSTRING(@MaChiTietBG, 3, 4) AS INT);

            INSERT INTO dbo.ChiTietBanGiao (MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
            SELECT 
                'CB' + RIGHT('0000' + CAST(@MaxID + ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) AS VARCHAR), 4),
                @MaBienBanBG,
                @MaPhong,
                maTaiSan,
                soLuongThuHoi,
                ghiChu
            FROM OPENJSON(@JSONBanGiaoRa)
            WITH (
                maTaiSan VARCHAR(6) '$.maTaiSan',
                soLuongThuHoi INT '$.soLuongThuHoi',
                ghiChu NVARCHAR(500) '$.ghiChu'
            );
        END

        -- 2. Cập nhật khách thuê "Đã rời"
        IF @MaHopDong IS NOT NULL
        BEGIN
            UPDATE dbo.ThanhVienHopDong
            SET TrangThai = N'Đã rời'
            WHERE MaHopDong = @MaHopDong;
        END

        -- 3. Cập nhật phòng/giường thành "Trống"
        IF @MaGiuong IS NOT NULL
        BEGIN
            -- Thuê giường
            UPDATE dbo.Giuong
            SET TinhTrang = N'Trống'
            WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong;
            
            -- Cập nhật trạng thái phòng nếu tất cả giường đều trống
            IF NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Đang thuê')
            BEGIN
                UPDATE dbo.Phong SET TinhTrang = N'Trống' WHERE MaPhong = @MaPhong;
            END
        END
        ELSE
        BEGIN
            -- Thuê nguyên phòng
            UPDATE dbo.Phong SET TinhTrang = N'Trống' WHERE MaPhong = @MaPhong;
            UPDATE dbo.Giuong SET TinhTrang = N'Trống' WHERE MaPhong = @MaPhong;
        END

        -- 4. Cập nhật phiếu trả phòng thành Hoàn tất
        UPDATE dbo.PhieuTraPhong
        SET TrangThai = N'Hoàn tất',
            NgayTraThucTe = CAST(GETDATE() AS DATE)
        WHERE MaPhieuTra = @MaPhieuTra;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
