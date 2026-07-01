IF OBJECT_ID(N'dbo.SP_DanhSachPhongGiuongKhaDung', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachPhongGiuongKhaDung AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachPhongGiuongKhaDung
    @Loai           NVARCHAR(50)    = NULL,
    @GioiTinh       NVARCHAR(10)    = NULL,
    @MaChiNhanh     VARCHAR(6)      = NULL,
    @KhuVuc         NVARCHAR(100)   = NULL,
    @LoaiPhong      NVARCHAR(100)   = NULL,
    @MucGiaTu       DECIMAL(15,2)   = NULL,
    @MucGiaToiDa    DECIMAL(15,2)   = NULL,
    @SoNguoiO       INT             = NULL,
    @HoSoId         VARCHAR(6)      = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @Loai       = NULLIF(LTRIM(RTRIM(@Loai)), N'');
    SET @GioiTinh   = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @KhuVuc     = NULLIF(LTRIM(RTRIM(@KhuVuc)), N'');
    SET @LoaiPhong  = NULLIF(LTRIM(RTRIM(@LoaiPhong)), N'');
    SET @HoSoId     = NULLIF(LTRIM(RTRIM(@HoSoId)), '');

    IF @Loai IN (N'Nguyên căn', N'Nguyên phòng')
        SET @Loai = N'Nguyên phòng';
    IF @Loai IN (N'Ghép', N'Ghép giường')
        SET @Loai = N'Ghép giường';

    IF @Loai IS NOT NULL AND @Loai NOT IN (N'Nguyên phòng', N'Ghép giường')
        THROW 50011, N'Hình thức tra cứu phòng/giường không hợp lệ.', 1;

    IF @GioiTinh IS NOT NULL AND @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 50011, N'Giới tính không hợp lệ.', 1;

    IF @MucGiaTu IS NOT NULL AND @MucGiaTu < 0
        THROW 50011, N'Mức giá tối thiểu không hợp lệ.', 1;

    IF @MucGiaToiDa IS NOT NULL AND @MucGiaToiDa < 0
        THROW 50011, N'Mức giá tối đa không hợp lệ.', 1;

    IF @SoNguoiO IS NOT NULL AND @SoNguoiO < 1
        THROW 50011, N'Số người ở phải ít nhất là 1.', 1;

    DECLARE @SoNam INT = 0;
    DECLARE @SoNu INT = 0;
    DECLARE @HinhThucThue NVARCHAR(50) = NULL;

    IF @HoSoId IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @HoSoId)
            THROW 50010, N'Không tìm thấy hồ sơ đăng ký.', 1;

        SELECT
            @SoNam       = ISNULL(SoNam, 0),
            @SoNu        = ISNULL(SoNu, 0),
            @KhuVuc      = COALESCE(@KhuVuc, KhuVucMongMuon),
            @MucGiaToiDa = COALESCE(@MucGiaToiDa, MucGiaToiDa),
            @SoNguoiO    = COALESCE(@SoNguoiO, SoNguoiDuKienO)
        FROM dbo.PhieuDangKy
        WHERE MaDangKy = @HoSoId;

        IF COL_LENGTH(N'dbo.PhieuDangKy', N'HinhThucThue') IS NOT NULL
        BEGIN
            EXEC sys.sp_executesql
                N'SELECT @HinhThucThueOut = HinhThucThue FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy',
                N'@MaDangKy VARCHAR(6), @HinhThucThueOut NVARCHAR(50) OUTPUT',
                @MaDangKy = @HoSoId,
                @HinhThucThueOut = @HinhThucThue OUTPUT;
        END;

        IF @Loai IS NULL AND @HinhThucThue IS NOT NULL
        BEGIN
            IF @HinhThucThue IN (N'Nguyên căn', N'Nguyên phòng')
                SET @Loai = N'Nguyên phòng';
            ELSE IF @HinhThucThue IN (N'Ghép', N'Ghép giường')
                SET @Loai = N'Ghép giường';
        END;

        IF @GioiTinh IS NULL
        BEGIN
            IF @SoNam > 0 AND @SoNu = 0 SET @GioiTinh = N'Nam';
            ELSE IF @SoNu > 0 AND @SoNam = 0 SET @GioiTinh = N'Nữ';
        END;
    END;

    IF @SoNguoiO IS NULL AND (@SoNam + @SoNu) > 0
        SET @SoNguoiO = @SoNam + @SoNu;

    DECLARE @SoNguoiCanXep INT = ISNULL(NULLIF(@SoNguoiO, 0), CASE WHEN (@SoNam + @SoNu) > 0 THEN @SoNam + @SoNu ELSE 1 END);
    DECLARE @LaNhomHonHop BIT = CASE WHEN @SoNam > 0 AND @SoNu > 0 THEN 1 ELSE 0 END;

    CREATE TABLE #KetQua (
        phuongAn INT NOT NULL,
        maPhong VARCHAR(4) NULL,
        tenPhong NVARCHAR(100) NULL,
        loaiThue NVARCHAR(30) NULL,
        maLoaiPhong VARCHAR(6) NULL,
        loaiPhong NVARCHAR(100) NULL,
        moTa NVARCHAR(MAX) NULL,
        giaThue DECIMAL(15,2) NULL,
        sucChua INT NULL,
        gioiTinhChoPhep NVARCHAR(20) NULL,
        tinhTrang NVARCHAR(20) NULL,
        maChiNhanh VARCHAR(6) NULL,
        tenChiNhanh NVARCHAR(100) NULL,
        diaChi NVARCHAR(255) NULL,
        urlImg VARCHAR(500) NULL,
        maGiuong VARCHAR(3) NULL,
        soGiuong INT NULL,
        soGiuongTrong INT NULL,
        soGiuongDuKienXep INT NULL,
        tongNamDuocXep INT NULL,
        tongNuDuocXep INT NULL,
        khongCoChiNhanhPhuHop BIT NOT NULL
    );

    CREATE TABLE #ChiNhanhPhuHop (MaChiNhanh VARCHAR(6) PRIMARY KEY);

    IF @MaChiNhanh IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
            THROW 50011, N'Không tìm thấy chi nhánh.', 1;

        INSERT INTO #ChiNhanhPhuHop (MaChiNhanh)
        SELECT MaChiNhanh
        FROM dbo.ChiNhanh
        WHERE MaChiNhanh = @MaChiNhanh
          AND TrangThai = N'Hoạt động';
    END
    ELSE IF @KhuVuc IS NULL
    BEGIN
        INSERT INTO #ChiNhanhPhuHop (MaChiNhanh)
        SELECT MaChiNhanh
        FROM dbo.ChiNhanh
        WHERE TrangThai = N'Hoạt động';
    END
    ELSE
    BEGIN
        INSERT INTO #ChiNhanhPhuHop (MaChiNhanh)
        SELECT MaChiNhanh
        FROM dbo.ChiNhanh
        WHERE TrangThai = N'Hoạt động'
          AND (DiaChi LIKE N'%' + @KhuVuc + N'%' OR TenChiNhanh LIKE N'%' + @KhuVuc + N'%');
    END;

    DECLARE @KhongCoChiNhanhPhuHop BIT =
        CASE WHEN @MaChiNhanh IS NULL AND @KhuVuc IS NOT NULL AND NOT EXISTS (SELECT 1 FROM #ChiNhanhPhuHop)
             THEN 1 ELSE 0 END;

    IF @KhongCoChiNhanhPhuHop = 1
    BEGIN
        INSERT INTO #KetQua (phuongAn, khongCoChiNhanhPhuHop)
        VALUES (1, 1);

        SELECT *
        FROM #KetQua
        ORDER BY phuongAn;
        RETURN;
    END;

    CREATE TABLE #LoaiPhongYeuCau (MaLoaiPhong VARCHAR(6) PRIMARY KEY);
    DECLARE @CoLocLoaiPhongTrucTiep BIT = CASE WHEN @LoaiPhong IS NOT NULL THEN 1 ELSE 0 END;
    DECLARE @DaDocLoaiPhongTuHoSo BIT = 0;

    IF @LoaiPhong IS NOT NULL
    BEGIN
        INSERT INTO #LoaiPhongYeuCau (MaLoaiPhong)
        SELECT MaLoaiPhong
        FROM dbo.LoaiPhong
        WHERE MaLoaiPhong = @LoaiPhong OR TenLoaiPhong = @LoaiPhong;
    END
    ELSE IF @HoSoId IS NOT NULL
       AND OBJECT_ID(N'dbo.PhieuDangKy_LoaiPhong', N'U') IS NOT NULL
    BEGIN
        SET @DaDocLoaiPhongTuHoSo = 1;

        INSERT INTO #LoaiPhongYeuCau (MaLoaiPhong)
        SELECT DISTINCT MaLoaiPhong
        FROM dbo.PhieuDangKy_LoaiPhong
        WHERE MaDangKy = @HoSoId;
    END
    ELSE IF @HoSoId IS NOT NULL
       AND OBJECT_ID(N'dbo.PDK_LoaiPhong', N'U') IS NOT NULL
    BEGIN
        SET @DaDocLoaiPhongTuHoSo = 1;

        INSERT INTO #LoaiPhongYeuCau (MaLoaiPhong)
        SELECT DISTINCT MaLoaiPhong
        FROM dbo.PDK_LoaiPhong
        WHERE MaDangKy = @HoSoId;
    END;

    IF @CoLocLoaiPhongTrucTiep = 0
       AND @DaDocLoaiPhongTuHoSo = 0
       AND NOT EXISTS (SELECT 1 FROM #LoaiPhongYeuCau)
    BEGIN
        INSERT INTO #LoaiPhongYeuCau (MaLoaiPhong)
        SELECT MaLoaiPhong
        FROM dbo.LoaiPhong;
    END;

    CREATE TABLE #BaseRooms (
        MaPhong VARCHAR(4) NOT NULL PRIMARY KEY,
        TenPhong NVARCHAR(100) NOT NULL,
        GioiTinhChoPhep NVARCHAR(20) NOT NULL,
        TinhTrang NVARCHAR(20) NOT NULL,
        MaChiNhanh VARCHAR(6) NOT NULL,
        MaLoaiPhong VARCHAR(6) NOT NULL,
        TenLoaiPhong NVARCHAR(100) NOT NULL,
        MoTa NVARCHAR(MAX) NULL,
        SucChuaToiDa INT NOT NULL,
        GiaThueTheoGiuong DECIMAL(15,2) NULL,
        GiaThueNguyenPhong DECIMAL(15,2) NULL,
        TenChiNhanh NVARCHAR(100) NOT NULL,
        DiaChi NVARCHAR(255) NULL,
        SoGiuongTrong INT NOT NULL,
        UrlImg VARCHAR(500) NULL
    );

    INSERT INTO #BaseRooms (
        MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong,
        TenLoaiPhong, MoTa, SucChuaToiDa, GiaThueTheoGiuong, GiaThueNguyenPhong,
        TenChiNhanh, DiaChi, SoGiuongTrong, UrlImg
    )
    SELECT
        p.MaPhong,
        p.TenPhong,
        p.GioiTinhChoPhep,
        p.TinhTrang,
        p.MaChiNhanh,
        p.MaLoaiPhong,
        lp.TenLoaiPhong,
        lp.MoTa,
        lp.SucChuaToiDa,
        lp.GiaThueTheoGiuong,
        lp.GiaThueNguyenPhong,
        cn.TenChiNhanh,
        cn.DiaChi,
        ISNULL(bc.SoGiuongTrong, 0) AS SoGiuongTrong,
        (SELECT TOP (1) hap.UrlImg FROM dbo.HinhAnhPhong hap WHERE hap.MaPhong = p.MaPhong ORDER BY hap.STTAnh) AS UrlImg
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    INNER JOIN #ChiNhanhPhuHop AS cnp ON cnp.MaChiNhanh = p.MaChiNhanh
    INNER JOIN #LoaiPhongYeuCau AS lpyc ON lpyc.MaLoaiPhong = p.MaLoaiPhong
    OUTER APPLY (
        SELECT COUNT(*) AS SoGiuongTrong
        FROM dbo.Giuong AS g
        WHERE g.MaPhong = p.MaPhong
          AND g.TinhTrang = N'Trống'
    ) AS bc;

    CREATE TABLE #PhongUngVien (
        MaPhong VARCHAR(4) NOT NULL PRIMARY KEY,
        MaLoaiPhong VARCHAR(6) NOT NULL,
        GiaMoiNguoi DECIMAL(15,2) NOT NULL,
        LaTrongNguyenPhong BIT NOT NULL,
        SoGiuongNam INT NOT NULL,
        SoGiuongNu INT NOT NULL,
        SoGiuongKhongPhanBiet INT NOT NULL
    );

    INSERT INTO #PhongUngVien (
        MaPhong, MaLoaiPhong, GiaMoiNguoi, LaTrongNguyenPhong,
        SoGiuongNam, SoGiuongNu, SoGiuongKhongPhanBiet
    )
    SELECT
        br.MaPhong,
        br.MaLoaiPhong,
        COALESCE(br.GiaThueTheoGiuong, br.GiaThueNguyenPhong / NULLIF(br.SucChuaToiDa, 0)) AS GiaMoiNguoi,
        CASE
            WHEN br.TinhTrang = N'Trống'
             AND br.SoGiuongTrong >= br.SucChuaToiDa
             AND br.GioiTinhChoPhep = N'Không phân biệt'
                THEN 1 ELSE 0
        END AS LaTrongNguyenPhong,
        CASE WHEN br.GioiTinhChoPhep = N'Nam' THEN br.SoGiuongTrong ELSE 0 END AS SoGiuongNam,
        CASE WHEN br.GioiTinhChoPhep = N'Nữ' THEN br.SoGiuongTrong ELSE 0 END AS SoGiuongNu,
        CASE WHEN br.GioiTinhChoPhep = N'Không phân biệt' THEN br.SoGiuongTrong ELSE 0 END AS SoGiuongKhongPhanBiet
    FROM #BaseRooms AS br
    WHERE br.TinhTrang IN (N'Trống', N'Còn chỗ')
      AND br.SoGiuongTrong > 0
      AND COALESCE(br.GiaThueTheoGiuong, br.GiaThueNguyenPhong / NULLIF(br.SucChuaToiDa, 0)) IS NOT NULL
      AND (@MucGiaTu IS NULL OR COALESCE(br.GiaThueTheoGiuong, br.GiaThueNguyenPhong / NULLIF(br.SucChuaToiDa, 0)) >= @MucGiaTu)
      AND (@MucGiaToiDa IS NULL OR COALESCE(br.GiaThueTheoGiuong, br.GiaThueNguyenPhong / NULLIF(br.SucChuaToiDa, 0)) <= @MucGiaToiDa)
      AND (
          @Loai IS NULL
          OR @Loai = N'Ghép giường'
          OR (
              @Loai = N'Nguyên phòng'
              AND br.TinhTrang = N'Trống'
              AND br.SoGiuongTrong >= br.SucChuaToiDa
          )
      );

    CREATE TABLE #LoaiPhongHopLe (
        MaLoaiPhong VARCHAR(6) NOT NULL PRIMARY KEY
    );

    INSERT INTO #LoaiPhongHopLe (MaLoaiPhong)
    SELECT puv.MaLoaiPhong
    FROM #PhongUngVien AS puv
    GROUP BY puv.MaLoaiPhong
    HAVING
        (
            @LaNhomHonHop = 0
            AND SUM(CASE
                WHEN @GioiTinh = N'Nam'
                    THEN puv.SoGiuongNam + puv.SoGiuongKhongPhanBiet
                WHEN @GioiTinh = N'Nữ'
                    THEN puv.SoGiuongNu + puv.SoGiuongKhongPhanBiet
                ELSE puv.SoGiuongNam + puv.SoGiuongNu + puv.SoGiuongKhongPhanBiet
            END) >= @SoNguoiCanXep
        )
        OR
        (
            @LaNhomHonHop = 1
            AND (
                MAX(CASE WHEN puv.LaTrongNguyenPhong = 1 AND puv.SoGiuongKhongPhanBiet >= @SoNguoiCanXep THEN 1 ELSE 0 END) = 1
                OR (
                    SUM(puv.SoGiuongNam) >= @SoNam
                    AND SUM(puv.SoGiuongNu) >= @SoNu
                )
            )
        );

    ;WITH PhongTraVe AS (
        SELECT
            ROW_NUMBER() OVER (
                PARTITION BY br.MaLoaiPhong
                ORDER BY
                    CASE WHEN puv.LaTrongNguyenPhong = 1 THEN 0 ELSE 1 END,
                    puv.GiaMoiNguoi,
                    br.TenPhong,
                    br.MaPhong
            ) AS rn,
            br.*,
            puv.GiaMoiNguoi,
            puv.LaTrongNguyenPhong
        FROM #BaseRooms AS br
        INNER JOIN #PhongUngVien AS puv ON puv.MaPhong = br.MaPhong
        INNER JOIN #LoaiPhongHopLe AS lphl ON lphl.MaLoaiPhong = br.MaLoaiPhong
        WHERE
            (
                @LaNhomHonHop = 0
                AND (
                    puv.SoGiuongKhongPhanBiet > 0
                    OR (@GioiTinh = N'Nam' AND puv.SoGiuongNam > 0)
                    OR (@GioiTinh = N'Nữ' AND puv.SoGiuongNu > 0)
                    OR (@GioiTinh IS NULL AND puv.SoGiuongNam + puv.SoGiuongNu + puv.SoGiuongKhongPhanBiet > 0)
                )
            )
            OR
            (
                @LaNhomHonHop = 1
                AND (
                    (puv.LaTrongNguyenPhong = 1 AND puv.SoGiuongKhongPhanBiet >= @SoNguoiCanXep)
                    OR (@SoNam > 0 AND puv.SoGiuongNam > 0)
                    OR (@SoNu > 0 AND puv.SoGiuongNu > 0)
                )
            )
    )
    INSERT INTO #KetQua (
        phuongAn, maPhong, tenPhong, loaiThue, maLoaiPhong, loaiPhong, moTa,
        giaThue, sucChua, gioiTinhChoPhep, tinhTrang, maChiNhanh, tenChiNhanh,
        diaChi, urlImg, maGiuong, soGiuong, soGiuongTrong, soGiuongDuKienXep,
        tongNamDuocXep, tongNuDuocXep, khongCoChiNhanhPhuHop
    )
    SELECT
        rn,
        MaPhong,
        TenPhong,
        CASE WHEN LaTrongNguyenPhong = 1 THEN N'Nguyên phòng' ELSE N'Ghép giường' END,
        MaLoaiPhong,
        TenLoaiPhong,
        MoTa,
        GiaMoiNguoi,
        SucChuaToiDa,
        GioiTinhChoPhep,
        TinhTrang,
        MaChiNhanh,
        TenChiNhanh,
        DiaChi,
        UrlImg,
        NULL,
        NULL,
        SoGiuongTrong,
        CASE WHEN SoGiuongTrong >= @SoNguoiCanXep THEN @SoNguoiCanXep ELSE SoGiuongTrong END,
        ISNULL(@SoNam, 0),
        ISNULL(@SoNu, 0),
        @KhongCoChiNhanhPhuHop
    FROM PhongTraVe;

    SELECT *
    FROM #KetQua
    ORDER BY loaiThue, maLoaiPhong, phuongAn, giaThue, tenPhong, maPhong;
END;
GO

IF OBJECT_ID(N'dbo.SP_TuDongXuLyPhieuDangKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TuDongXuLyPhieuDangKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TuDongXuLyPhieuDangKy
    @MaDangKy VARCHAR(6),
    @MaNhanVienSale VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaDangKy = NULLIF(LTRIM(RTRIM(@MaDangKy)), '');

    IF @MaDangKy IS NULL
        THROW 50011, N'Mã hồ sơ không hợp lệ.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy)
        THROW 50010, N'Không tìm thấy hồ sơ đăng ký.', 1;

    IF @MaNhanVienSale IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM dbo.NhanVien
           WHERE MaNhanVien = @MaNhanVienSale
             AND ChucVu = N'Sale'
       )
        THROW 50011, N'Không tìm thấy nhân viên Sale.', 1;

    EXEC dbo.SP_DanhSachPhongGiuongKhaDung
        @HoSoId = @MaDangKy;
END;
GO
