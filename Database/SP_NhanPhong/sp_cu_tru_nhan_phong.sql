USE HOMEDORM4;
GO

-- Tạo bảng HoSoCuTru nếu chưa tồn tại
IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HoSoCuTru (
        MaHoSoCuTru        VARCHAR(6)    NOT NULL PRIMARY KEY,
        MaPhieuDatCoc      VARCHAR(6)    NOT NULL,
        MaNhanVienSale     VARCHAR(6)    NOT NULL,
        MaNhanVienQuanLy   VARCHAR(6)    NULL,
        TrangThaiHoSo      NVARCHAR(30)  NOT NULL DEFAULT N'Chưa cập nhật',
        DaDoiChieuGiayTo   BIT           NOT NULL DEFAULT 0,
        NgayCapNhat        DATETIME      NOT NULL DEFAULT GETDATE(),
        NgayGuiDuyet       DATETIME      NULL,
        NgayDuyet          DATETIME      NULL,
        GhiChuSale         NVARCHAR(500) NULL,
        GhiChuQuanLy       NVARCHAR(500) NULL,
        CONSTRAINT UQ_HSCT_PhieuDatCoc UNIQUE (MaPhieuDatCoc),
        CONSTRAINT CHK_HSCT_TrangThai CHECK (TrangThaiHoSo IN (
            N'Chưa cập nhật', N'Chờ duyệt cư trú', N'Đã duyệt cư trú', N'Từ chối cư trú'
        )),
        CONSTRAINT FK_HSCT_PhieuDatCoc FOREIGN KEY (MaPhieuDatCoc) REFERENCES dbo.PhieuDatCoc(MaPhieuDatCoc),
        CONSTRAINT FK_HSCT_NhanVienSale FOREIGN KEY (MaNhanVienSale) REFERENCES dbo.NhanVien(MaNhanVien),
        CONSTRAINT FK_HSCT_NhanVienQuanLy FOREIGN KEY (MaNhanVienQuanLy) REFERENCES dbo.NhanVien(MaNhanVien)
    );
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraCuuPhieuCocCapNhatCuTru
    @TuKhoa NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TuKhoaLike NVARCHAR(104) = NULL;
    IF @TuKhoa IS NOT NULL AND LTRIM(RTRIM(@TuKhoa)) <> N''
        SET @TuKhoaLike = N'%' + LTRIM(RTRIM(@TuKhoa)) + N'%';

    SELECT
        pdc.MaPhieuDatCoc,
        hs.MaHoSoCuTru,
        pdc.MaPhieuYeuCauDangKy,
        nd.HoTen AS HoTenKhachHang,
        nd.NgaySinh,
        nd.GioiTinh AS GioiTinhKhachHang,
        nd.SDT,
        nd.Email,
        kh.CCCD,
        kh.QuocTich,
        pdk.SoNguoiDuKienO,
        pdk.SoNam,
        pdk.SoNu,
        pdk.ThoiHanThue,
        pdk.KhuVucMongMuon,
        pdc.HinhThucThue,
        STRING_AGG(
            CASE WHEN ctdc.MaGiuong IS NULL
                THEN p.TenPhong
                ELSE p.TenPhong + N' - Giường ' + ctdc.MaGiuong
            END,
            N', '
        ) AS ViTriThue,
        pdc.ThoiGianNhanPhong,
        pdc.TrangThaiThanhToan,
        ISNULL(hs.TrangThaiHoSo, N'Chưa cập nhật') AS TrangThaiHoSo,
        MIN(p.GioiTinhChoPhep) AS GioiTinhChoPhep,
        MAX(lp.SucChuaToiDa) AS SucChuaToiDa,
        COUNT(ctdc.MaChiTietDC) AS SoGiuongDaCoc,
        -- Kiểm tra phòng đang có hợp đồng có hiệu lực hay không (tức là có ngườơi đang ở)
        CAST(
            CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.HopDongThue hd2
                JOIN dbo.ChiTietHopDong cthd ON cthd.MaHopDong = hd2.MaHopDong
                WHERE cthd.MaPhong = ctdc.MaPhong
                  AND hd2.TrangThaiHopDong = N'Hiệu lực'
            ) THEN 1 ELSE 0 END
        AS BIT) AS CoNguoiDangO
    FROM dbo.PhieuDatCoc pdc
    JOIN dbo.PhieuDangKy pdk ON pdk.MaDangKy = pdc.MaPhieuYeuCauDangKy
    JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    LEFT JOIN dbo.HoSoCuTru hs ON hs.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    WHERE pdc.TrangThaiCoc = N'Hiệu lực'
      AND pdc.TrangThaiThanhToan = N'Đã TT'
      AND NOT EXISTS (SELECT 1 FROM dbo.HopDongThue hd WHERE hd.MaPhieuCoc = pdc.MaPhieuDatCoc)
      AND (
          @TuKhoaLike IS NULL
          OR pdc.MaPhieuDatCoc LIKE @TuKhoaLike
          OR nd.HoTen LIKE @TuKhoaLike
          OR nd.SDT LIKE @TuKhoaLike
      )
    GROUP BY
        pdc.MaPhieuDatCoc, hs.MaHoSoCuTru, pdc.MaPhieuYeuCauDangKy,
        nd.HoTen, nd.NgaySinh, nd.GioiTinh, nd.SDT, nd.Email,
        kh.CCCD, kh.QuocTich, pdk.SoNguoiDuKienO, pdk.SoNam, pdk.SoNu,
        pdk.ThoiHanThue, pdk.KhuVucMongMuon,
        pdc.HinhThucThue, pdc.ThoiGianNhanPhong,
        pdc.TrangThaiThanhToan, hs.TrangThaiHoSo
    ORDER BY pdc.ThoiGianNhanPhong DESC, pdc.MaPhieuDatCoc DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_LuuHoSoCuTru
    @MaPhieuDatCoc VARCHAR(6),
    @MaNhanVienSale VARCHAR(6),
    @DaDoiChieuGiayTo BIT,
    @GhiChu NVARCHAR(500) = NULL,
    @DanhSachThanhVienJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.PhieuDatCoc pdc
        WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc
          AND pdc.TrangThaiCoc = N'Hiệu lực'
          AND pdc.TrangThaiThanhToan = N'Đã TT'
    )
        THROW 50010, N'Phiếu đặt cọc không đủ điều kiện ghi nhận thông tin cư trú.', 1;

    IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = @MaPhieuDatCoc)
        THROW 50011, N'Phiếu đặt cọc đã lập hợp đồng, không thể ghi nhận thông tin cư trú.', 1;

    IF @DaDoiChieuGiayTo = 0
        THROW 50012, N'Cần đối chiếu giấy tờ tùy thân trước khi lưu hồ sơ.', 1;

    IF ISJSON(@DanhSachThanhVienJson) <> 1
        THROW 50013, N'Danh sách thành viên cư trú không hợp lệ.', 1;

    BEGIN TRAN;

    DECLARE @MaHoSoCuTru VARCHAR(6);
    SELECT @MaHoSoCuTru = MaHoSoCuTru FROM dbo.HoSoCuTru WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

    IF @MaHoSoCuTru IS NULL
    BEGIN
        SELECT @MaHoSoCuTru = 'CT' + RIGHT('0000' + CAST(ISNULL(MAX(CAST(SUBSTRING(MaHoSoCuTru, 3, 4) AS INT)), 0) + 1 AS VARCHAR(4)), 4)
        FROM dbo.HoSoCuTru WITH (UPDLOCK, HOLDLOCK)
        WHERE MaHoSoCuTru LIKE 'CT[0-9][0-9][0-9][0-9]';

        INSERT INTO dbo.HoSoCuTru (
            MaHoSoCuTru, MaPhieuDatCoc, MaNhanVienSale,
            TrangThaiHoSo, DaDoiChieuGiayTo, NgayCapNhat, GhiChuSale
        )
        VALUES (
            @MaHoSoCuTru, @MaPhieuDatCoc, @MaNhanVienSale,
            N'Chưa cập nhật', @DaDoiChieuGiayTo, GETDATE(), @GhiChu
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.HoSoCuTru
        SET MaNhanVienSale = @MaNhanVienSale,
            TrangThaiHoSo = N'Chưa cập nhật',
            DaDoiChieuGiayTo = @DaDoiChieuGiayTo,
            NgayCapNhat = GETDATE(),
            GhiChuSale = @GhiChu,
            GhiChuQuanLy = NULL
        WHERE MaHoSoCuTru = @MaHoSoCuTru;

        DELETE FROM dbo.ThanhVienHopDong WHERE MaHoSoCuTru = @MaHoSoCuTru;
    END

    DECLARE @StartIndex INT;
    SELECT @StartIndex = ISNULL(MAX(CAST(SUBSTRING(MaThanhVien, 3, 4) AS INT)), 0)
    FROM dbo.ThanhVienHopDong WITH (UPDLOCK, HOLDLOCK)
    WHERE MaThanhVien LIKE 'TV[0-9][0-9][0-9][0-9]';

    ;WITH RawMembers AS (
        SELECT
            ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS RN,
            HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich
        FROM OPENJSON(@DanhSachThanhVienJson)
        WITH (
            HoTen NVARCHAR(100) '$.hoTen',
            NgaySinh DATE '$.ngaySinh',
            GioiTinh NVARCHAR(4) '$.gioiTinh',
            CCCD VARCHAR(20) '$.cccd',
            SDT VARCHAR(20) '$.sdt',
            Email VARCHAR(100) '$.email',
            QuocTich NVARCHAR(50) '$.quocTich'
        )
    )
    INSERT INTO dbo.ThanhVienHopDong (
        MaThanhVien, MaHoSoCuTru, MaHopDong, HoTen, NgaySinh,
        GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, LyDoTuChoi
    )
    SELECT
        'TV' + RIGHT('0000' + CAST(@StartIndex + RN AS VARCHAR(4)), 4),
        @MaHoSoCuTru,
        NULL,
        HoTen,
        NgaySinh,
        GioiTinh,
        CCCD,
        SDT,
        Email,
        ISNULL(QuocTich, N'Việt Nam'),
        N'Chờ duyệt',
        NULL
    FROM RawMembers
    WHERE HoTen IS NOT NULL AND CCCD IS NOT NULL AND GioiTinh IN (N'Nam', N'Nữ');

    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK;
        THROW 50014, N'Hồ sơ cư trú cần ít nhất một thành viên hợp lệ.', 1;
    END

    COMMIT;

    EXEC dbo.SP_LayChiTietHoSoCuTru @MaHoSoCuTru = @MaHoSoCuTru;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_GuiDuyetHoSoCuTru
    @MaHoSoCuTru VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.HoSoCuTru
    SET TrangThaiHoSo = N'Chờ duyệt cư trú',
        NgayGuiDuyet = GETDATE(),
        GhiChuQuanLy = NULL
    WHERE MaHoSoCuTru = @MaHoSoCuTru
      AND TrangThaiHoSo IN (N'Chưa cập nhật', N'Từ chối cư trú');

    IF @@ROWCOUNT = 0
        THROW 50015, N'Hồ sơ cư trú không ở trạng thái có thể gửi duyệt.', 1;

    SELECT * FROM dbo.HoSoCuTru WHERE MaHoSoCuTru = @MaHoSoCuTru;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachHoSoCuTruChoDuyet
    @TuKhoa NVARCHAR(100) = NULL,
    @TrangThaiHoSo NVARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TuKhoaLike NVARCHAR(104) = NULL;
    IF @TuKhoa IS NOT NULL AND LTRIM(RTRIM(@TuKhoa)) <> N''
        SET @TuKhoaLike = N'%' + LTRIM(RTRIM(@TuKhoa)) + N'%';

    SELECT
        hs.MaHoSoCuTru,
        hs.MaPhieuDatCoc,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        pdc.HinhThucThue,
        STRING_AGG(
            CASE WHEN ctdc.MaGiuong IS NULL
                THEN p.TenPhong
                ELSE p.TenPhong + N' - Giường ' + ctdc.MaGiuong
            END,
            N', '
        ) AS ViTriThue,
        MIN(p.GioiTinhChoPhep) AS GioiTinhChoPhep,
        MAX(lp.SucChuaToiDa) AS SucChuaToiDa,
        COUNT(ctdc.MaChiTietDC) AS SoGiuongDaCoc,
        hs.TrangThaiHoSo,
        hs.NgayCapNhat,
        hs.GhiChuSale,
        -- Kiểm tra phòng đang có hợp đồng có hiệu lực hay không
        CAST(
            CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.HopDongThue hd2
                JOIN dbo.ChiTietHopDong cthd ON cthd.MaHopDong = hd2.MaHopDong
                WHERE cthd.MaPhong = p.MaPhong
                  AND hd2.TrangThaiHopDong = N'Hiệu lực'
            ) THEN 1 ELSE 0 END
        AS BIT) AS CoNguoiDangO
    FROM dbo.HoSoCuTru hs
    JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hs.MaPhieuDatCoc
    JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE (@TrangThaiHoSo IS NULL OR @TrangThaiHoSo = N'' OR hs.TrangThaiHoSo = @TrangThaiHoSo)
      AND (
          @TuKhoaLike IS NULL
          OR hs.MaHoSoCuTru LIKE @TuKhoaLike
          OR hs.MaPhieuDatCoc LIKE @TuKhoaLike
          OR nd.HoTen LIKE @TuKhoaLike
          OR nd.SDT LIKE @TuKhoaLike
      )
    GROUP BY
        hs.MaHoSoCuTru, hs.MaPhieuDatCoc, nd.HoTen, nd.SDT,
        pdc.HinhThucThue, hs.TrangThaiHoSo, hs.NgayCapNhat, hs.GhiChuSale
    ORDER BY hs.NgayCapNhat DESC;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_LayChiTietHoSoCuTru
    @MaHoSoCuTru VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        hs.MaHoSoCuTru,
        hs.MaPhieuDatCoc,
        nd.HoTen AS HoTenKhachHang,
        nd.SDT,
        pdc.HinhThucThue,
        STRING_AGG(
            CASE WHEN ctdc.MaGiuong IS NULL
                THEN p.TenPhong
                ELSE p.TenPhong + N' - Giường ' + ctdc.MaGiuong
            END,
            N', '
        ) AS ViTriThue,
        MIN(p.GioiTinhChoPhep) AS GioiTinhChoPhep,
        MAX(lp.SucChuaToiDa) AS SucChuaToiDa,
        COUNT(ctdc.MaChiTietDC) AS SoGiuongDaCoc,
        hs.TrangThaiHoSo,
        hs.DaDoiChieuGiayTo,
        hs.NgayCapNhat,
        hs.NgayGuiDuyet,
        hs.NgayDuyet,
        hs.GhiChuSale,
        hs.GhiChuQuanLy,
        -- Kiểm tra phòng đang có hợp đồng có hiệu lực hay không
        CAST(
            CASE WHEN EXISTS (
                SELECT 1
                FROM dbo.HopDongThue hd2
                JOIN dbo.ChiTietHopDong cthd ON cthd.MaHopDong = hd2.MaHopDong
                WHERE cthd.MaPhong = p.MaPhong
                  AND hd2.TrangThaiHopDong = N'Hiệu lực'
            ) THEN 1 ELSE 0 END
        AS BIT) AS CoNguoiDangO
    FROM dbo.HoSoCuTru hs
    JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hs.MaPhieuDatCoc
    JOIN dbo.KhachHang kh ON kh.MaKhachHang = pdc.MaKhachHang
    JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
    JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
    JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE hs.MaHoSoCuTru = @MaHoSoCuTru
    GROUP BY
        hs.MaHoSoCuTru, hs.MaPhieuDatCoc, nd.HoTen, nd.SDT,
        pdc.HinhThucThue, hs.TrangThaiHoSo, hs.DaDoiChieuGiayTo,
        hs.NgayCapNhat, hs.NgayGuiDuyet, hs.NgayDuyet,
        hs.GhiChuSale, hs.GhiChuQuanLy;

    SELECT
        MaThanhVien,
        MaThanhVien AS MaThanhVienCuTru,
        MaHoSoCuTru,
        HoTen,
        NgaySinh,
        GioiTinh,
        CCCD,
        SDT,
        Email,
        QuocTich,
        TrangThai,
        TrangThai AS TrangThaiDuyet,
        LyDoTuChoi
    FROM dbo.ThanhVienHopDong
    WHERE MaHoSoCuTru = @MaHoSoCuTru
    ORDER BY MaThanhVien;
END
GO

CREATE OR ALTER PROCEDURE dbo.SP_DuyetHoSoCuTru
    @MaHoSoCuTru VARCHAR(6),
    @MaNhanVienQuanLy VARCHAR(6),
    @KetQua NVARCHAR(30),
    @GhiChuQuanLy NVARCHAR(500) = NULL,
    @DanhSachKetQuaThanhVienJson NVARCHAR(MAX) = N'[]'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @KetQua NOT IN (N'Đã duyệt cư trú', N'Từ chối cư trú')
        THROW 50016, N'Kết quả duyệt hồ sơ cư trú không hợp lệ.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.HoSoCuTru
        WHERE MaHoSoCuTru = @MaHoSoCuTru
          AND TrangThaiHoSo = N'Chờ duyệt cư trú'
    )
        THROW 50017, N'Hồ sơ cư trú không ở trạng thái chờ duyệt.', 1;

    BEGIN TRAN;

    IF ISJSON(@DanhSachKetQuaThanhVienJson) = 1
    BEGIN
        ;WITH DecisionRows AS (
            SELECT
                COALESCE(MaThanhVien, MaThanhVienCuTru) AS MaThanhVienCuTru,
                TrangThaiDuyet,
                LyDoTuChoi
            FROM OPENJSON(@DanhSachKetQuaThanhVienJson)
            WITH (
                MaThanhVien VARCHAR(6) '$.maThanhVien',
                MaThanhVienCuTru VARCHAR(6) '$.maThanhVienCuTru',
                TrangThaiDuyet NVARCHAR(20) '$.trangThaiDuyet',
                LyDoTuChoi NVARCHAR(500) '$.lyDoTuChoi'
            )
        )
        UPDATE tv
        SET TrangThai = CASE
                WHEN d.TrangThaiDuyet = N'Bị từ chối' THEN N'Bị từ chối'
                ELSE N'Đủ điều kiện'
            END,
            LyDoTuChoi = CASE WHEN d.TrangThaiDuyet = N'Bị từ chối' THEN d.LyDoTuChoi ELSE NULL END
        FROM dbo.ThanhVienHopDong tv
        JOIN DecisionRows d ON d.MaThanhVienCuTru = tv.MaThanhVien
        WHERE tv.MaHoSoCuTru = @MaHoSoCuTru;
    END

    IF @KetQua = N'Đã duyệt cư trú'
       AND NOT EXISTS (
            SELECT 1 FROM dbo.ThanhVienHopDong
            WHERE MaHoSoCuTru = @MaHoSoCuTru
              AND TrangThai = N'Đủ điều kiện'
       )
    BEGIN
        ROLLBACK;
        THROW 50018, N'Cần có ít nhất một thành viên đủ điều kiện để duyệt hồ sơ.', 1;
    END

    UPDATE dbo.HoSoCuTru
    SET TrangThaiHoSo = @KetQua,
        MaNhanVienQuanLy = @MaNhanVienQuanLy,
        NgayDuyet = GETDATE(),
        GhiChuQuanLy = @GhiChuQuanLy
    WHERE MaHoSoCuTru = @MaHoSoCuTru;

    COMMIT;

    EXEC dbo.SP_LayChiTietHoSoCuTru @MaHoSoCuTru = @MaHoSoCuTru;
END
GO
