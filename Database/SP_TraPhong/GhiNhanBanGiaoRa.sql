USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: GHI NHAN BAN GIAO RA (Nhan vien quan ly)
-- Use-case thay the chuc nang "Cap nhat hoan tat".
-- Dieu kien:
--   - Phieu tra phong: Hoan tat
--   - Co hop dong thue
--   - Hop dong: Da thanh ly
--   - Doi soat: Da quyet toan
--   - Da co bien ban ban giao vao
--   - Chua co bien ban ban giao ra khi lap moi
-- =============================================

-- 1. Danh sach ho so ban giao ra
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa
    @MaNhanVien VARCHAR(6),
    @TrangThaiLoc NVARCHAR(50) = N'Chờ bàn giao'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
        THROW 50000, N'Nhân viên không tồn tại hoặc không hợp lệ.', 1;

    SELECT DISTINCT
        pt.MaPhieuTra AS maPhieuTra,
        nd.HoTen AS hoTenKhach,
        nd.SDT AS sdtKhach,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        ds.MaDoiSoat AS maDoiSoat,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        pt.TrangThai AS trangThaiPhieuTra,
        hd.TrangThai AS trangThaiHopDong,
        ds.TrangThai AS trangThaiDoiSoat,
        CASE
            WHEN bgRa.MaBienBan IS NULL THEN N'Chờ bàn giao'
            ELSE N'Đã bàn giao'
        END AS trangThaiBanGiao,
        bgRa.MaBienBan AS maBienBanBanGiaoRa,
        N'HopDong' AS loaiNguon
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    LEFT JOIN dbo.Giuong g ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    INNER JOIN dbo.BienBanBanGiao bgVao ON bgVao.MaHopDong = hd.MaHopDong AND bgVao.LoaiBanGiao = N'Bàn giao vào'
    INNER JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.BienBanBanGiao bgRa ON bgRa.MaHopDong = hd.MaHopDong AND bgRa.LoaiBanGiao = N'Bàn giao ra'
    WHERE p.MaChiNhanh = @MaChiNhanh
      AND pt.MaHopDong IS NOT NULL
      AND pt.TrangThai = N'Hoàn tất'
      AND hd.TrangThai = N'Đã thanh lý'
      AND ds.TrangThai = N'Đã quyết toán'
      AND (
          (@TrangThaiLoc = N'Chờ bàn giao' AND bgRa.MaBienBan IS NULL) OR
          (@TrangThaiLoc = N'Đã bàn giao'  AND bgRa.MaBienBan IS NOT NULL) OR
          (@TrangThaiLoc = N'Tất cả')
      )
    ORDER BY pt.NgayTraThucTe DESC, pt.MaPhieuTra DESC;
END;
GO

-- 2. Chi tiet ho so ban giao ra
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    IF @MaChiNhanh IS NULL
        THROW 50100, N'Nhân viên không tồn tại hoặc không hợp lệ.', 1;

    DECLARE @MaHopDong VARCHAR(6);
    SELECT @MaHopDong = MaHopDong
    FROM dbo.PhieuTraPhong
    WHERE MaPhieuTra = @MaPhieuTra;

    -- Thong tin ho so
    SELECT TOP 1
        pt.MaPhieuTra AS maPhieuTra,
        pt.TrangThai AS trangThaiPhieuTra,
        pt.NgayDangKyTra AS ngayDangKyTra,
        pt.NgayTraThucTe AS ngayTraThucTe,
        nd.HoTen AS hoTenKhach,
        nd.SDT AS soDienThoai,
        nd.Email AS emailKhach,
        kh.CCCD AS cccdKhach,
        p.TenPhong AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        cn.TenChiNhanh AS khuVuc,
        lp.SucChuaToiDa AS sucChuaToiDa,
        CAST(1 AS BIT) AS hasHopDong,
        hd.MaHopDong AS maHopDong,
        hd.NgayBatDau AS ngayBatDauHopDong,
        hd.NgayKetThuc AS ngayKetThucHopDong,
        hd.TrangThai AS trangThaiHopDong,
        hd.SoGiuongThue AS soGiuongThue,
        pdc.MaPhieuDatCoc AS maPhieuDatCoc,
        pdc.TrangThaiCoc AS trangThaiCoc,
        ds.MaDoiSoat AS maDoiSoat,
        ds.TrangThai AS trangThaiDoiSoat,
        bkt.MaBienBanKT AS maBienBanKiemTra,
        bkt.NgayKiemTra AS ngayKiemTra,
        bkt.TinhTrangPhong AS tinhTrangKiemTra,
        bkt.TongChiPhiSuaChua AS tongChiPhiSuaChua,
        bgRa.MaBienBan AS maBienBanBanGiaoRa,
        bgRa.NgayBanGiao AS ngayBanGiaoRa,
        CASE WHEN bgRa.MaBienBan IS NULL THEN N'Chờ bàn giao' ELSE N'Đã bàn giao' END AS trangThaiBanGiao
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
    INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    INNER JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.BienBanBanGiao bgRa ON bgRa.MaHopDong = hd.MaHopDong AND bgRa.LoaiBanGiao = N'Bàn giao ra'
    WHERE pt.MaPhieuTra = @MaPhieuTra
      AND p.MaChiNhanh = @MaChiNhanh;

    -- Danh sach thanh vien hop dong
    SELECT
        MaThanhVien AS maThanhVien,
        HoTen AS hoTen,
        CCCD AS cccd,
        SDT AS sdt,
        NgaySinh AS ngaySinh,
        GioiTinh AS gioiTinh,
        Email AS email,
        TrangThai AS trangThai
    FROM dbo.ThanhVienHopDong
    WHERE MaHopDong = @MaHopDong
    ORDER BY MaThanhVien;

    -- Tai san/chia khoa/the da ban giao vao va ket qua thu hoi neu da ban giao ra
    SELECT
        ctVao.MaPhong AS maPhong,
        ts.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        ctVao.SoLuongThucTe AS soLuongBanGiaoVao,
        COALESCE(ctRa.SoLuongThucTe, ctVao.SoLuongThucTe) AS soLuongThuHoi,
        ctRa.GhiChu AS ghiChu,
        hh.MucDoHuHong AS mucDoHuHong,
        hh.MoTaHuHong AS moTaHuHong,
        hh.ChiPhiSuaChua AS chiPhiSuaChua
    FROM dbo.BienBanBanGiao bgVao
    INNER JOIN dbo.ChiTietBanGiao ctVao ON ctVao.MaBienBan = bgVao.MaBienBan
    INNER JOIN dbo.TaiSan ts ON ts.MaPhong = ctVao.MaPhong AND ts.MaTaiSan = ctVao.MaTaiSan
    LEFT JOIN dbo.BienBanBanGiao bgRa ON bgRa.MaHopDong = bgVao.MaHopDong AND bgRa.LoaiBanGiao = N'Bàn giao ra'
    LEFT JOIN dbo.ChiTietBanGiao ctRa ON ctRa.MaBienBan = bgRa.MaBienBan AND ctRa.MaPhong = ctVao.MaPhong AND ctRa.MaTaiSan = ctVao.MaTaiSan
    LEFT JOIN dbo.PhieuTraPhong pt ON pt.MaHopDong = bgVao.MaHopDong AND pt.MaPhieuTra = @MaPhieuTra
    LEFT JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    LEFT JOIN dbo.ChiTietHuHong hh ON hh.MaBienBanKT = bkt.MaBienBanKT AND hh.MaPhong = ctVao.MaPhong AND hh.MaTaiSan = ctVao.MaTaiSan
    WHERE bgVao.MaHopDong = @MaHopDong
      AND bgVao.LoaiBanGiao = N'Bàn giao vào'
    ORDER BY ctVao.MaPhong, ts.MaTaiSan;

    -- Ket qua kiem tra tra phong
    SELECT
        hh.MaChiTietHH AS maChiTietHH,
        hh.MaPhong AS maPhong,
        hh.MaTaiSan AS maTaiSan,
        ts.TenTaiSan AS tenTaiSan,
        hh.MucDoHuHong AS mucDoHuHong,
        hh.MoTaHuHong AS moTaHuHong,
        hh.ChiPhiSuaChua AS chiPhiSuaChua
    FROM dbo.PhieuTraPhong pt
    INNER JOIN dbo.BienBanKiemTraPhong bkt ON bkt.MaPhieuTra = pt.MaPhieuTra
    INNER JOIN dbo.ChiTietHuHong hh ON hh.MaBienBanKT = bkt.MaBienBanKT
    LEFT JOIN dbo.TaiSan ts ON ts.MaPhong = hh.MaPhong AND ts.MaTaiSan = hh.MaTaiSan
    WHERE pt.MaPhieuTra = @MaPhieuTra
    ORDER BY hh.MaChiTietHH;
END;
GO

-- 3. Lap bien ban ban giao ra
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa
    @MaPhieuTra VARCHAR(6),
    @MaNhanVien VARCHAR(6),
    @JSONBanGiaoRa NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @MaChiNhanhNV VARCHAR(6),
            @MaChiNhanhPT VARCHAR(6),
            @TrangThaiPT NVARCHAR(30),
            @MaHopDong VARCHAR(6),
            @MaPhieuDatCoc VARCHAR(6),
            @TrangThaiHD NVARCHAR(30),
            @TrangThaiDS NVARCHAR(30),
            @MaBienBanBG VARCHAR(6);

        SELECT @MaChiNhanhNV = MaChiNhanh
        FROM dbo.NhanVien
        WHERE MaNhanVien = @MaNhanVien;

        IF @MaChiNhanhNV IS NULL
            THROW 50200, N'Nhân viên không tồn tại hoặc không hợp lệ.', 1;

        SELECT TOP 1
            @TrangThaiPT = pt.TrangThai,
            @MaHopDong = pt.MaHopDong,
            @MaPhieuDatCoc = hd.MaPhieuCoc,
            @TrangThaiHD = hd.TrangThai,
            @TrangThaiDS = ds.TrangThai,
            @MaChiNhanhPT = p.MaChiNhanh
        FROM dbo.PhieuTraPhong pt WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.DoiSoat ds ON ds.MaPhieuTra = pt.MaPhieuTra
        INNER JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
        INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
        INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
        WHERE pt.MaPhieuTra = @MaPhieuTra;

        IF @TrangThaiPT IS NULL
            THROW 50201, N'Không tìm thấy phiếu trả phòng.', 1;

        IF @MaChiNhanhPT <> @MaChiNhanhNV
            THROW 50202, N'Phiếu trả phòng không thuộc chi nhánh của nhân viên quản lý.', 1;

        IF @MaHopDong IS NULL
            THROW 50203, N'Use-case ghi nhận bàn giao ra chỉ áp dụng cho hồ sơ có hợp đồng thuê.', 1;

        IF @TrangThaiPT <> N'Hoàn tất'
            THROW 50204, N'Hồ sơ không đủ điều kiện ghi nhận bàn giao ra.', 1;

        IF @TrangThaiHD <> N'Đã thanh lý' OR @TrangThaiDS <> N'Đã quyết toán'
            THROW 50205, N'Hồ sơ không đủ điều kiện ghi nhận bàn giao ra.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.BienBanBanGiao WITH (UPDLOCK, HOLDLOCK)
            WHERE MaHopDong = @MaHopDong
              AND LoaiBanGiao = N'Bàn giao ra'
        )
            THROW 50206, N'Hồ sơ này đã được ghi nhận bàn giao ra trước đó.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.BienBanBanGiao
            WHERE MaHopDong = @MaHopDong
              AND LoaiBanGiao = N'Bàn giao vào'
        )
            THROW 50207, N'Không tìm thấy thông tin tài sản đã bàn giao vào để đối chiếu.', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.BienBanKiemTraPhong
            WHERE MaPhieuTra = @MaPhieuTra
        )
            THROW 50208, N'Không tìm thấy kết quả kiểm tra trả phòng liên quan đến hồ sơ.', 1;

        IF @JSONBanGiaoRa IS NULL OR ISJSON(@JSONBanGiaoRa) <> 1 OR NOT EXISTS (SELECT 1 FROM OPENJSON(@JSONBanGiaoRa))
            THROW 50209, N'Thông tin bàn giao ra không hợp lệ.', 1;

        DECLARE @BanGiao TABLE (
            MaPhong VARCHAR(4) NOT NULL,
            MaTaiSan VARCHAR(6) NOT NULL,
            SoLuongThuHoi INT NOT NULL,
            GhiChu NVARCHAR(255) NULL
        );

        INSERT INTO @BanGiao (MaPhong, MaTaiSan, SoLuongThuHoi, GhiChu)
        SELECT
            MaPhong,
            MaTaiSan,
            SoLuongThuHoi,
            GhiChu
        FROM OPENJSON(@JSONBanGiaoRa)
        WITH (
            MaPhong VARCHAR(4) '$.maPhong',
            MaTaiSan VARCHAR(6) '$.maTaiSan',
            SoLuongThuHoi INT '$.soLuongThuHoi',
            GhiChu NVARCHAR(255) '$.ghiChu'
        );

        IF EXISTS (
            SELECT 1
            FROM @BanGiao
            WHERE MaPhong IS NULL
               OR MaTaiSan IS NULL
               OR SoLuongThuHoi IS NULL
               OR SoLuongThuHoi < 0
        )
            THROW 50210, N'Thông tin bàn giao ra không hợp lệ.', 1;

        IF EXISTS (
            SELECT 1
            FROM @BanGiao bg
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.BienBanBanGiao bgVao
                INNER JOIN dbo.ChiTietBanGiao ctVao ON ctVao.MaBienBan = bgVao.MaBienBan
                WHERE bgVao.MaHopDong = @MaHopDong
                  AND bgVao.LoaiBanGiao = N'Bàn giao vào'
                  AND ctVao.MaPhong = bg.MaPhong
                  AND ctVao.MaTaiSan = bg.MaTaiSan
                  AND bg.SoLuongThuHoi <= ctVao.SoLuongThucTe
            )
        )
            THROW 50211, N'Số lượng hoặc tài sản bàn giao ra không hợp lệ so với biên bản bàn giao vào.', 1;

        SELECT @MaBienBanBG = 'BG' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaBienBan, 3, 4) AS INT)), 0) + 1 AS VARCHAR), 4)
        FROM dbo.BienBanBanGiao WITH (UPDLOCK, HOLDLOCK)
        WHERE MaBienBan LIKE 'BG[0-9][0-9][0-9][0-9]';

        INSERT INTO dbo.BienBanBanGiao (MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy)
        VALUES (@MaBienBanBG, CAST(GETDATE() AS DATE), N'Bàn giao ra', @MaHopDong, @MaNhanVien);

        DECLARE @MaxCT INT;
        SELECT @MaxCT = ISNULL(MAX(CAST(SUBSTRING(MaChiTietBG, 3, 4) AS INT)), 0)
        FROM dbo.ChiTietBanGiao WITH (UPDLOCK, HOLDLOCK)
        WHERE MaChiTietBG LIKE 'CB[0-9][0-9][0-9][0-9]';

        INSERT INTO dbo.ChiTietBanGiao (MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
        SELECT
            'CB' + RIGHT('0000' + CAST(@MaxCT + ROW_NUMBER() OVER (ORDER BY MaPhong, MaTaiSan) AS VARCHAR), 4),
            @MaBienBanBG,
            MaPhong,
            MaTaiSan,
            SoLuongThuHoi,
            GhiChu
        FROM @BanGiao;

        UPDATE ts
        SET ts.SoLuong = ts.SoLuong - (ctVao.SoLuongThucTe - bg.SoLuongThuHoi)
        FROM dbo.TaiSan ts
        INNER JOIN @BanGiao bg ON bg.MaPhong = ts.MaPhong AND bg.MaTaiSan = ts.MaTaiSan
        INNER JOIN dbo.BienBanBanGiao bgVao ON bgVao.MaHopDong = @MaHopDong AND bgVao.LoaiBanGiao = N'Bàn giao vào'
        INNER JOIN dbo.ChiTietBanGiao ctVao ON ctVao.MaBienBan = bgVao.MaBienBan AND ctVao.MaPhong = bg.MaPhong AND ctVao.MaTaiSan = bg.MaTaiSan;

        UPDATE dbo.ThanhVienHopDong
        SET TrangThai = N'Đã rời'
        WHERE MaHopDong = @MaHopDong
          AND TrangThai = N'Đang ở';

        ;WITH PhongHopDong AS (
            SELECT DISTINCT ctdc.MaPhong
            FROM dbo.ChiTietDatCoc ctdc
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
        ),
        GiuongHopDong AS (
            SELECT ctdc.MaPhong, ctdc.MaGiuong
            FROM dbo.ChiTietDatCoc ctdc
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
        )
        UPDATE g
        SET TinhTrang = N'Trống'
        FROM dbo.Giuong g
        INNER JOIN GiuongHopDong gh
            ON gh.MaPhong = g.MaPhong
           AND (gh.MaGiuong IS NULL OR gh.MaGiuong = g.MaGiuong);

        ;WITH PhongHopDong AS (
            SELECT DISTINCT ctdc.MaPhong
            FROM dbo.ChiTietDatCoc ctdc
            WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
        )
        UPDATE p
        SET TinhTrang =
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM dbo.Giuong g
                    WHERE g.MaPhong = p.MaPhong
                      AND g.TinhTrang <> N'Trống'
                ) THEN N'Trống'
                WHEN EXISTS (
                    SELECT 1 FROM dbo.Giuong g
                    WHERE g.MaPhong = p.MaPhong
                      AND g.TinhTrang = N'Trống'
                ) THEN N'Còn chỗ'
                ELSE N'Đầy'
            END
        FROM dbo.Phong p
        INNER JOIN PhongHopDong ph ON ph.MaPhong = p.MaPhong;

        UPDATE dbo.PhieuDatCoc
        SET TrangThaiCoc = N'Đã hủy'
        WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

        COMMIT TRANSACTION;

        SELECT
            @MaBienBanBG AS maBienBanBanGiaoRa,
            @MaPhieuTra AS maPhieuTra,
            @MaHopDong AS maHopDong,
            N'Ghi nhận bàn giao ra thành công.' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
