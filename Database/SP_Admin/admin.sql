USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: ADMIN
-- Chạy file này sau app.sql và data.sql.
--
-- Stored procedure chính:
--   1. SP_Admin_TaoTaiKhoanNhanVien
--   2. SP_Admin_KhoaMoTaiKhoan
--   3. SP_Admin_GanChucVuNhanVien
--   4. SP_Admin_CapNhatThongTinNhanVien
--   5. SP_Admin_QuanLyChiNhanh
--   6. SP_Admin_QuanLyLoaiPhong
--   7. SP_Admin_TaoPhongGiuong
--   8. SP_Admin_CapNhatTrangThaiPhongGiuong
--   9. SP_Admin_QuanLyTaiSanPhong
--  10. SP_Admin_CauHinhQuyDinhHoanCoc
--  11. SP_Admin_DanhSachNhanVien
--  12. SP_Admin_QuanLyPhong
--  13. SP_Admin_QuanLyGiuong
--  14. SP_Admin_QuanLyDichVu
--  15. SP_Admin_QuanLyNoiQuy
--  16. SP_Admin_QuanLyDieuKhoanViPham
--  17. SP_Admin_CauHinhThamSo
--  18. SP_Admin_CauHinhSaoLuu
--  19. SP_Admin_SaoLuuThuCong
--  20. SP_Admin_DanhSachSaoLuu
--  21. SP_Admin_PhucHoiDuLieu
--  22. SP_Admin_XemNhatKyHeThong
-- =============================================

IF OBJECT_ID(N'dbo.NguoiDung', N'U') IS NULL
   OR OBJECT_ID(N'dbo.NhanVien', N'U') IS NULL
   OR OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NULL
   OR OBJECT_ID(N'dbo.ChiNhanh', N'U') IS NULL
   OR OBJECT_ID(N'dbo.LoaiPhong', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Phong', N'U') IS NULL
   OR OBJECT_ID(N'dbo.Giuong', N'U') IS NULL
   OR OBJECT_ID(N'dbo.TaiSan', N'U') IS NULL
   OR OBJECT_ID(N'dbo.DichVu', N'U') IS NULL
   OR OBJECT_ID(N'dbo.QuiDinh', N'U') IS NULL
   OR OBJECT_ID(N'dbo.DieuKhoanViPham', N'U') IS NULL
   OR OBJECT_ID(N'dbo.QuyDinhHoanCoc', N'U') IS NULL
    THROW 51000, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước.', 1;
GO

IF OBJECT_ID(N'dbo.NhatKyHeThong', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NhatKyHeThong (
        MaNhatKy      INT IDENTITY(1,1) PRIMARY KEY,
        ThoiGian      DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
        MaNguoiDung   VARCHAR(6)     NULL,
        HanhDong      NVARCHAR(100)  NOT NULL,
        DoiTuong      NVARCHAR(100)  NULL,
        MaDoiTuong    NVARCHAR(50)   NULL,
        NoiDung       NVARCHAR(MAX)  NULL,
        DuLieuTruoc   NVARCHAR(MAX)  NULL,
        DuLieuSau     NVARCHAR(MAX)  NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.CHK_Phong_TinhTrang', N'C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Phong DROP CONSTRAINT CHK_Phong_TinhTrang;
END;
GO

ALTER TABLE dbo.Phong
    ADD CONSTRAINT CHK_Phong_TinhTrang
    CHECK (TinhTrang IN (N'Trống', N'Đã đặt cọc', N'Còn chỗ', N'Đầy', N'Giữ chỗ', N'Bảo trì'));
GO

IF COL_LENGTH('dbo.TaiSan', 'LoaiTaiSan') IS NULL
BEGIN
    ALTER TABLE dbo.TaiSan
        ADD LoaiTaiSan NVARCHAR(20) NOT NULL
            CONSTRAINT DF_TaiSan_LoaiTaiSan DEFAULT N'Chung';
END;
GO

IF COL_LENGTH('dbo.TaiSan', 'MaGiuong') IS NULL
BEGIN
    ALTER TABLE dbo.TaiSan
        ADD MaGiuong VARCHAR(3) NULL;
END;
GO

IF OBJECT_ID(N'dbo.CK_TaiSan_LoaiTaiSan', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.TaiSan
        ADD CONSTRAINT CK_TaiSan_LoaiTaiSan
        CHECK (
            (LoaiTaiSan = N'Chung' AND MaGiuong IS NULL)
            OR (LoaiTaiSan = N'Riêng' AND MaGiuong IS NOT NULL)
        );
END;
GO

IF OBJECT_ID(N'dbo.FK_TaiSan_Giuong', N'F') IS NULL
BEGIN
    ALTER TABLE dbo.TaiSan
        ADD CONSTRAINT FK_TaiSan_Giuong
        FOREIGN KEY (MaPhong, MaGiuong) REFERENCES dbo.Giuong(MaPhong, MaGiuong);
END;
GO

IF COL_LENGTH('dbo.ChiTietXemPhong', 'MaGiuong') IS NULL
BEGIN
    ALTER TABLE dbo.ChiTietXemPhong
        ADD MaGiuong VARCHAR(3) NULL;
END;
GO

IF OBJECT_ID(N'dbo.FK_CTXP_Giuong', N'F') IS NULL
BEGIN
    ALTER TABLE dbo.ChiTietXemPhong
        ADD CONSTRAINT FK_CTXP_Giuong
        FOREIGN KEY (MaPhong, MaGiuong) REFERENCES dbo.Giuong(MaPhong, MaGiuong);
END;
GO

IF OBJECT_ID(N'dbo.ThamSoHeThong', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ThamSoHeThong (
        MaThamSo     VARCHAR(50)     PRIMARY KEY,
        NhomThamSo   NVARCHAR(50)    NOT NULL,
        TenThamSo    NVARCHAR(100)   NOT NULL,
        GiaTri        NVARCHAR(255)   NOT NULL,
        KieuDuLieu    NVARCHAR(20)    NOT NULL DEFAULT N'Chuỗi',
        DonViTinh     NVARCHAR(30)    NULL,
        MoTa          NVARCHAR(MAX)   NULL,
        CapNhatLuc    DATETIME2(0)    NOT NULL DEFAULT SYSDATETIME(),
        CapNhatBoi    VARCHAR(6)      NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ThamSoHeThong WHERE MaThamSo = 'THOI_HAN_THANH_TOAN_COC_GIO')
BEGIN
    INSERT INTO dbo.ThamSoHeThong (
        MaThamSo, NhomThamSo, TenThamSo, GiaTri, KieuDuLieu, DonViTinh, MoTa
    )
    VALUES (
        'THOI_HAN_THANH_TOAN_COC_GIO',
        N'Cọc',
        N'Thời hạn thanh toán cọc',
        N'24',
        N'Số',
        N'Giờ',
        N'Số giờ khách cần thanh toán cọc sau khi phát hành yêu cầu.'
    );
END;
GO

IF OBJECT_ID(N'dbo.CauHinhSaoLuu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CauHinhSaoLuu (
        MaCauHinh          INT          NOT NULL CONSTRAINT PK_CauHinhSaoLuu PRIMARY KEY,
        ChuKyFull          NVARCHAR(20) NOT NULL DEFAULT N'Hàng tuần',
        ChuKyIncremental   NVARCHAR(20) NOT NULL DEFAULT N'Hàng ngày',
        ThuMucLuuTru       NVARCHAR(500) NOT NULL,
        CapNhatLuc         DATETIME2(0) NOT NULL DEFAULT SYSDATETIME(),
        CapNhatBoi         VARCHAR(6)   NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.CauHinhSaoLuu WHERE MaCauHinh = 1)
BEGIN
    INSERT INTO dbo.CauHinhSaoLuu (
        MaCauHinh, ChuKyFull, ChuKyIncremental, ThuMucLuuTru
    )
    VALUES (
        1, N'Hàng tuần', N'Hàng ngày', N'C:\SQLBackups'
    );
END;
GO

IF OBJECT_ID(N'dbo.LichSuSaoLuu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LichSuSaoLuu (
        MaSaoLuu       INT IDENTITY(1,1) PRIMARY KEY,
        LoaiSaoLuu     NVARCHAR(20)   NOT NULL,
        DuongDanFile    NVARCHAR(500)  NOT NULL,
        DungLuongByte   BIGINT         NULL,
        TrangThai       NVARCHAR(20)   NOT NULL DEFAULT N'Đang chạy',
        ThoiGianBatDau  DATETIME2(0)   NOT NULL DEFAULT SYSDATETIME(),
        ThoiGianKetThuc DATETIME2(0)   NULL,
        ThongBao        NVARCHAR(MAX)  NULL,
        MaNguoiDung     VARCHAR(6)     NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_GhiNhatKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_GhiNhatKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_GhiNhatKy
    @AdminId     VARCHAR(6)     = NULL,
    @HanhDong    NVARCHAR(100),
    @DoiTuong    NVARCHAR(100)  = NULL,
    @MaDoiTuong  NVARCHAR(50)   = NULL,
    @NoiDung     NVARCHAR(MAX)  = NULL,
    @DuLieuTruoc NVARCHAR(MAX)  = NULL,
    @DuLieuSau   NVARCHAR(MAX)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @AdminId = NULLIF(LTRIM(RTRIM(@AdminId)), '');

    INSERT INTO dbo.NhatKyHeThong (
        MaNguoiDung, HanhDong, DoiTuong, MaDoiTuong, NoiDung, DuLieuTruoc, DuLieuSau
    )
    VALUES (
        @AdminId, @HanhDong, @DoiTuong, @MaDoiTuong, @NoiDung, @DuLieuTruoc, @DuLieuSau
    );
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_TaoTaiKhoanNhanVien', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_TaoTaiKhoanNhanVien AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_TaoTaiKhoanNhanVien
    @TenDangNhap VARCHAR(50),
    @MatKhau     VARCHAR(255),
    @HoTen       NVARCHAR(100),
    @NgaySinh    DATE          = NULL,
    @GioiTinh    NVARCHAR(5)   = NULL,
    @SDT         VARCHAR(20)   = NULL,
    @Email       VARCHAR(100)  = NULL,
    @DiaChi      NVARCHAR(255) = NULL,
    @MaChiNhanh  VARCHAR(6),
    @NgayVaoLam  DATE          = NULL,
    @ChucVu      NVARCHAR(20),
    @AdminId     VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @TenDangNhap = NULLIF(LTRIM(RTRIM(@TenDangNhap)), '');
    SET @MatKhau     = NULLIF(LTRIM(RTRIM(@MatKhau)), '');
    SET @HoTen       = NULLIF(LTRIM(RTRIM(@HoTen)), N'');
    SET @GioiTinh    = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    SET @SDT         = NULLIF(LTRIM(RTRIM(@SDT)), '');
    SET @Email       = NULLIF(LTRIM(RTRIM(@Email)), '');
    SET @DiaChi      = NULLIF(LTRIM(RTRIM(@DiaChi)), N'');
    SET @MaChiNhanh  = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @ChucVu      = NULLIF(LTRIM(RTRIM(@ChucVu)), N'');

    IF @TenDangNhap IS NULL OR @MatKhau IS NULL OR @HoTen IS NULL
       OR @MaChiNhanh IS NULL OR @ChucVu IS NULL
        THROW 51001, N'Vui lòng nhập tên đăng nhập, mật khẩu, họ tên, chi nhánh và chức vụ.', 1;

    IF @GioiTinh IS NOT NULL AND @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 51002, N'Giới tính không hợp lệ.', 1;

    IF @ChucVu NOT IN (N'Sale', N'Quản lý', N'Kế toán')
        THROW 51003, N'Chức vụ nhân viên không hợp lệ.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
        THROW 51004, N'Không tìm thấy chi nhánh.', 1;

    IF EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @TenDangNhap)
        THROW 51005, N'Tên đăng nhập đã tồn tại.', 1;

    IF @SDT IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE SDT = @SDT)
        THROW 51006, N'Số điện thoại đã tồn tại.', 1;

    IF @Email IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE Email = @Email)
        THROW 51007, N'Email đã tồn tại.', 1;

    DECLARE @SoThuTu INT;
    DECLARE @MaNhanVien VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaNguoiDung, 3, 4))), 0) + 1
        FROM dbo.NguoiDung WITH (UPDLOCK, HOLDLOCK)
        WHERE MaNguoiDung LIKE 'NV[0-9][0-9][0-9][0-9]';

        IF @SoThuTu > 9999
            THROW 51008, N'Không thể sinh thêm mã nhân viên mới.', 1;

        SET @MaNhanVien = CONCAT('NV', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.NguoiDung (
            MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, DiaChi, UrlAvt, LoaiNguoiDung
        )
        VALUES (
            @MaNhanVien, @HoTen, @NgaySinh, @GioiTinh, @SDT, @Email, @DiaChi, NULL, 'NhanVien'
        );

        INSERT INTO dbo.NhanVien (MaNhanVien, MaChiNhanh, NgayVaoLam, ChucVu)
        VALUES (@MaNhanVien, @MaChiNhanh, ISNULL(@NgayVaoLam, CAST(GETDATE() AS DATE)), @ChucVu);

        INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
        VALUES (
            @TenDangNhap,
            CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @MatKhau), 2),
            N'Hoạt động',
            @MaNhanVien
        );

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Tạo tài khoản nhân viên',
            @DoiTuong = N'NhanVien',
            @MaDoiTuong = @MaNhanVien,
            @NoiDung = N'Tạo nhân viên và tài khoản đăng nhập mới.';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        nv.MaNhanVien     AS maNhanVien,
        tk.TenDangNhap    AS tenDangNhap,
        nd.HoTen          AS hoTen,
        nd.NgaySinh       AS ngaySinh,
        nd.GioiTinh       AS gioiTinh,
        nd.SDT            AS soDienThoai,
        nd.Email          AS email,
        nd.DiaChi         AS diaChi,
        nv.ChucVu         AS chucVu,
        nv.NgayVaoLam     AS ngayVaoLam,
        nv.MaChiNhanh     AS maChiNhanh,
        cn.TenChiNhanh    AS tenChiNhanh,
        tk.TrangThai      AS trangThaiTaiKhoan
    FROM dbo.NhanVien AS nv
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = nv.MaNhanVien
    INNER JOIN dbo.TaiKhoan AS tk ON tk.MaNguoiDung = nv.MaNhanVien
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = nv.MaChiNhanh
    WHERE nv.MaNhanVien = @MaNhanVien;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_KhoaMoTaiKhoan', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_KhoaMoTaiKhoan AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_KhoaMoTaiKhoan
    @TenDangNhap VARCHAR(50)  = NULL,
    @MaNhanVien  VARCHAR(6)   = NULL,
    @TrangThai   NVARCHAR(20),
    @AdminId     VARCHAR(6)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @TenDangNhap = NULLIF(LTRIM(RTRIM(@TenDangNhap)), '');
    SET @MaNhanVien  = NULLIF(LTRIM(RTRIM(@MaNhanVien)), '');
    SET @TrangThai   = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');

    IF @TenDangNhap IS NULL AND @MaNhanVien IS NULL
        THROW 51011, N'Vui lòng truyền tên đăng nhập hoặc mã nhân viên.', 1;

    IF @TrangThai NOT IN (N'Hoạt động', N'Vô hiệu hóa')
        THROW 51012, N'Trạng thái tài khoản không hợp lệ.', 1;

    DECLARE @TenDangNhapCanSua VARCHAR(50);
    DECLARE @MaNguoiDung VARCHAR(6);
    DECLARE @DuLieuTruoc NVARCHAR(MAX);

    SELECT TOP (1)
        @TenDangNhapCanSua = tk.TenDangNhap,
        @MaNguoiDung = tk.MaNguoiDung
    FROM dbo.TaiKhoan AS tk
    INNER JOIN dbo.NhanVien AS nv ON nv.MaNhanVien = tk.MaNguoiDung
    WHERE (@TenDangNhap IS NOT NULL AND tk.TenDangNhap = @TenDangNhap)
       OR (@MaNhanVien IS NOT NULL AND tk.MaNguoiDung = @MaNhanVien);

    IF @TenDangNhapCanSua IS NULL
        THROW 51013, N'Không tìm thấy tài khoản nhân viên.', 1;

    SELECT @DuLieuTruoc = (
        SELECT TenDangNhap, TrangThai, MaNguoiDung
        FROM dbo.TaiKhoan
        WHERE TenDangNhap = @TenDangNhapCanSua
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.TaiKhoan
    SET TrangThai = @TrangThai
    WHERE TenDangNhap = @TenDangNhapCanSua;

    EXEC dbo.SP_Admin_GhiNhatKy
        @AdminId = @AdminId,
        @HanhDong = N'Khóa/mở tài khoản',
        @DoiTuong = N'TaiKhoan',
        @MaDoiTuong = @TenDangNhapCanSua,
        @NoiDung = @TrangThai,
        @DuLieuTruoc = @DuLieuTruoc,
        @DuLieuSau = NULL;

    SELECT
        tk.TenDangNhap AS tenDangNhap,
        tk.MaNguoiDung AS maNhanVien,
        nd.HoTen       AS hoTen,
        tk.TrangThai   AS trangThaiTaiKhoan
    FROM dbo.TaiKhoan AS tk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = tk.MaNguoiDung
    WHERE tk.TenDangNhap = @TenDangNhapCanSua;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_GanChucVuNhanVien', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_GanChucVuNhanVien AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_GanChucVuNhanVien
    @MaNhanVien VARCHAR(6),
    @ChucVu     NVARCHAR(20),
    @AdminId    VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MaNhanVien = NULLIF(LTRIM(RTRIM(@MaNhanVien)), '');
    SET @ChucVu = NULLIF(LTRIM(RTRIM(@ChucVu)), N'');

    IF @MaNhanVien IS NULL
        THROW 51021, N'Mã nhân viên không hợp lệ.', 1;

    IF @ChucVu NOT IN (N'Sale', N'Quản lý', N'Kế toán')
        THROW 51022, N'Chức vụ nhân viên không hợp lệ.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien)
        THROW 51023, N'Không tìm thấy nhân viên.', 1;

    DECLARE @DuLieuTruoc NVARCHAR(MAX);
    SELECT @DuLieuTruoc = (
        SELECT MaNhanVien, ChucVu
        FROM dbo.NhanVien
        WHERE MaNhanVien = @MaNhanVien
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.NhanVien
    SET ChucVu = @ChucVu
    WHERE MaNhanVien = @MaNhanVien;

    EXEC dbo.SP_Admin_GhiNhatKy
        @AdminId = @AdminId,
        @HanhDong = N'Gắn chức vụ nhân viên',
        @DoiTuong = N'NhanVien',
        @MaDoiTuong = @MaNhanVien,
        @NoiDung = @ChucVu,
        @DuLieuTruoc = @DuLieuTruoc;

    SELECT
        nv.MaNhanVien AS maNhanVien,
        nd.HoTen      AS hoTen,
        nv.ChucVu     AS chucVu,
        nv.MaChiNhanh AS maChiNhanh
    FROM dbo.NhanVien AS nv
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = nv.MaNhanVien
    WHERE nv.MaNhanVien = @MaNhanVien;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_CapNhatThongTinNhanVien', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_CapNhatThongTinNhanVien AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_CapNhatThongTinNhanVien
    @MaNhanVien        VARCHAR(6),
    @HoTen             NVARCHAR(100) = NULL,
    @NgaySinh          DATE          = NULL,
    @GioiTinh          NVARCHAR(5)   = NULL,
    @SDT               VARCHAR(20)   = NULL,
    @Email             VARCHAR(100)  = NULL,
    @DiaChi            NVARCHAR(255) = NULL,
    @MaChiNhanh        VARCHAR(6)    = NULL,
    @NgayVaoLam        DATE          = NULL,
    @TrangThaiTaiKhoan NVARCHAR(20)  = NULL,
    @AdminId           VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MaNhanVien        = NULLIF(LTRIM(RTRIM(@MaNhanVien)), '');
    SET @HoTen             = NULLIF(LTRIM(RTRIM(@HoTen)), N'');
    SET @GioiTinh          = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    SET @SDT               = NULLIF(LTRIM(RTRIM(@SDT)), '');
    SET @Email             = NULLIF(LTRIM(RTRIM(@Email)), '');
    SET @DiaChi            = NULLIF(LTRIM(RTRIM(@DiaChi)), N'');
    SET @MaChiNhanh        = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @TrangThaiTaiKhoan = NULLIF(LTRIM(RTRIM(@TrangThaiTaiKhoan)), N'');

    IF @MaNhanVien IS NULL
        THROW 51031, N'Mã nhân viên không hợp lệ.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien)
        THROW 51032, N'Không tìm thấy nhân viên.', 1;

    IF @GioiTinh IS NOT NULL AND @GioiTinh NOT IN (N'Nam', N'Nữ')
        THROW 51033, N'Giới tính không hợp lệ.', 1;

    IF @TrangThaiTaiKhoan IS NOT NULL AND @TrangThaiTaiKhoan NOT IN (N'Hoạt động', N'Vô hiệu hóa')
        THROW 51034, N'Trạng thái tài khoản không hợp lệ.', 1;

    IF @MaChiNhanh IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
        THROW 51035, N'Không tìm thấy chi nhánh.', 1;

    IF @SDT IS NOT NULL AND EXISTS (
        SELECT 1 FROM dbo.NguoiDung WHERE SDT = @SDT AND MaNguoiDung <> @MaNhanVien
    )
        THROW 51036, N'Số điện thoại đã tồn tại.', 1;

    IF @Email IS NOT NULL AND EXISTS (
        SELECT 1 FROM dbo.NguoiDung WHERE Email = @Email AND MaNguoiDung <> @MaNhanVien
    )
        THROW 51037, N'Email đã tồn tại.', 1;

    DECLARE @DuLieuTruoc NVARCHAR(MAX);
    SELECT @DuLieuTruoc = (
        SELECT nd.MaNguoiDung, nd.HoTen, nd.NgaySinh, nd.GioiTinh, nd.SDT, nd.Email, nd.DiaChi,
               nv.MaChiNhanh, nv.NgayVaoLam, nv.ChucVu, tk.TrangThai AS TrangThaiTaiKhoan
        FROM dbo.NhanVien AS nv
        INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = nv.MaNhanVien
        LEFT JOIN dbo.TaiKhoan AS tk ON tk.MaNguoiDung = nv.MaNhanVien
        WHERE nv.MaNhanVien = @MaNhanVien
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.NguoiDung
        SET HoTen = ISNULL(@HoTen, HoTen),
            NgaySinh = ISNULL(@NgaySinh, NgaySinh),
            GioiTinh = ISNULL(@GioiTinh, GioiTinh),
            SDT = ISNULL(@SDT, SDT),
            Email = ISNULL(@Email, Email),
            DiaChi = ISNULL(@DiaChi, DiaChi)
        WHERE MaNguoiDung = @MaNhanVien;

        UPDATE dbo.NhanVien
        SET MaChiNhanh = ISNULL(@MaChiNhanh, MaChiNhanh),
            NgayVaoLam = ISNULL(@NgayVaoLam, NgayVaoLam)
        WHERE MaNhanVien = @MaNhanVien;

        IF @TrangThaiTaiKhoan IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE MaNguoiDung = @MaNhanVien)
                THROW 51038, N'Nhân viên chưa có tài khoản để cập nhật trạng thái.', 1;

            UPDATE dbo.TaiKhoan
            SET TrangThai = @TrangThaiTaiKhoan
            WHERE MaNguoiDung = @MaNhanVien;
        END;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật thông tin nhân viên',
            @DoiTuong = N'NhanVien',
            @MaDoiTuong = @MaNhanVien,
            @NoiDung = N'Cập nhật hồ sơ/chuyển chi nhánh/trạng thái làm việc.',
            @DuLieuTruoc = @DuLieuTruoc;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        nv.MaNhanVien     AS maNhanVien,
        nd.HoTen          AS hoTen,
        nd.NgaySinh       AS ngaySinh,
        nd.GioiTinh       AS gioiTinh,
        nd.SDT            AS soDienThoai,
        nd.Email          AS email,
        nd.DiaChi         AS diaChi,
        nv.ChucVu         AS chucVu,
        nv.NgayVaoLam     AS ngayVaoLam,
        nv.MaChiNhanh     AS maChiNhanh,
        cn.TenChiNhanh    AS tenChiNhanh,
        tk.TrangThai      AS trangThaiTaiKhoan
    FROM dbo.NhanVien AS nv
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = nv.MaNhanVien
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = nv.MaChiNhanh
    LEFT JOIN dbo.TaiKhoan AS tk ON tk.MaNguoiDung = nv.MaNhanVien
    WHERE nv.MaNhanVien = @MaNhanVien;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_DanhSachNhanVien', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_DanhSachNhanVien AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_DanhSachNhanVien
    @MaNhanVien        VARCHAR(6)    = NULL,
    @MaChiNhanh        VARCHAR(6)    = NULL,
    @ChucVu            NVARCHAR(20)  = NULL,
    @TrangThaiTaiKhoan NVARCHAR(20)  = NULL,
    @TuKhoa            NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @MaNhanVien = NULLIF(LTRIM(RTRIM(@MaNhanVien)), '');
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @ChucVu = NULLIF(LTRIM(RTRIM(@ChucVu)), N'');
    SET @TrangThaiTaiKhoan = NULLIF(LTRIM(RTRIM(@TrangThaiTaiKhoan)), N'');
    SET @TuKhoa = NULLIF(LTRIM(RTRIM(@TuKhoa)), N'');

    SELECT
        nv.MaNhanVien     AS maNhanVien,
        tk.TenDangNhap    AS tenDangNhap,
        nd.HoTen          AS hoTen,
        nd.NgaySinh       AS ngaySinh,
        nd.GioiTinh       AS gioiTinh,
        nd.SDT            AS soDienThoai,
        nd.Email          AS email,
        nd.DiaChi         AS diaChi,
        nv.ChucVu         AS chucVu,
        nv.NgayVaoLam     AS ngayVaoLam,
        nv.MaChiNhanh     AS maChiNhanh,
        cn.TenChiNhanh    AS tenChiNhanh,
        tk.TrangThai      AS trangThaiTaiKhoan
    FROM dbo.NhanVien AS nv
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = nv.MaNhanVien
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = nv.MaChiNhanh
    LEFT JOIN dbo.TaiKhoan AS tk ON tk.MaNguoiDung = nv.MaNhanVien
    WHERE (@MaNhanVien IS NULL OR nv.MaNhanVien = @MaNhanVien)
      AND (@MaChiNhanh IS NULL OR nv.MaChiNhanh = @MaChiNhanh)
      AND (@ChucVu IS NULL OR nv.ChucVu = @ChucVu)
      AND (@TrangThaiTaiKhoan IS NULL OR tk.TrangThai = @TrangThaiTaiKhoan)
      AND (
          @TuKhoa IS NULL
          OR nd.HoTen LIKE N'%' + @TuKhoa + N'%'
          OR nv.MaNhanVien LIKE '%' + CONVERT(VARCHAR(100), @TuKhoa) + '%'
          OR tk.TenDangNhap LIKE '%' + CONVERT(VARCHAR(100), @TuKhoa) + '%'
          OR nd.SDT LIKE '%' + CONVERT(VARCHAR(100), @TuKhoa) + '%'
          OR nd.Email LIKE '%' + CONVERT(VARCHAR(100), @TuKhoa) + '%'
      )
    ORDER BY nv.MaNhanVien;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyChiNhanh', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyChiNhanh AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyChiNhanh
    @ThaoTac     NVARCHAR(20)  = N'DANH_SACH',
    @MaChiNhanh  VARCHAR(6)    = NULL,
    @TenChiNhanh NVARCHAR(100) = NULL,
    @DiaChi      NVARCHAR(255) = NULL,
    @SDT         VARCHAR(20)   = NULL,
    @Email       VARCHAR(100)  = NULL,
    @TrangThai   NVARCHAR(20)  = NULL,
    @AdminId     VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @TenChiNhanh = NULLIF(LTRIM(RTRIM(@TenChiNhanh)), N'');
    SET @DiaChi = NULLIF(LTRIM(RTRIM(@DiaChi)), N'');
    SET @SDT = NULLIF(LTRIM(RTRIM(@SDT)), '');
    SET @Email = NULLIF(LTRIM(RTRIM(@Email)), '');
    SET @TrangThai = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');

    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            cn.MaChiNhanh AS maChiNhanh,
            cn.TenChiNhanh AS tenChiNhanh,
            cn.DiaChi AS diaChi,
            cn.SDT AS soDienThoai,
            cn.Email AS email,
            cn.TrangThai AS trangThai,
            COUNT(DISTINCT nv.MaNhanVien) AS soNhanVien,
            COUNT(DISTINCT p.MaPhong) AS soPhong
        FROM dbo.ChiNhanh AS cn
        LEFT JOIN dbo.NhanVien AS nv ON nv.MaChiNhanh = cn.MaChiNhanh
        LEFT JOIN dbo.Phong AS p ON p.MaChiNhanh = cn.MaChiNhanh
        WHERE (@MaChiNhanh IS NULL OR cn.MaChiNhanh = @MaChiNhanh)
          AND (@TrangThai IS NULL OR cn.TrangThai = @TrangThai)
        GROUP BY cn.MaChiNhanh, cn.TenChiNhanh, cn.DiaChi, cn.SDT, cn.Email, cn.TrangThai
        ORDER BY cn.MaChiNhanh;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'DOI_TRANG_THAI', N'XOA')
        THROW 51041, N'Thao tác quản lý chi nhánh không hợp lệ.', 1;

    IF @TrangThai IS NOT NULL AND @TrangThai NOT IN (N'Hoạt động', N'Ngừng hoạt động')
        THROW 51042, N'Trạng thái chi nhánh không hợp lệ.', 1;

    IF @ThaoTac = N'TAO'
    BEGIN
        IF @TenChiNhanh IS NULL
            THROW 51043, N'Vui lòng nhập tên chi nhánh.', 1;

        DECLARE @SoChiNhanh INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaChiNhanh IS NULL
            BEGIN
                SELECT @SoChiNhanh = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaChiNhanh, 3, 4))), 0) + 1
                FROM dbo.ChiNhanh WITH (UPDLOCK, HOLDLOCK)
                WHERE MaChiNhanh LIKE 'CN[0-9][0-9][0-9][0-9]';

                IF @SoChiNhanh > 9999
                    THROW 51044, N'Không thể sinh thêm mã chi nhánh mới.', 1;

                SET @MaChiNhanh = CONCAT('CN', RIGHT(CONCAT('0000', @SoChiNhanh), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
                THROW 51045, N'Mã chi nhánh đã tồn tại.', 1;

            INSERT INTO dbo.ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SDT, Email, TrangThai)
            VALUES (@MaChiNhanh, @TenChiNhanh, @DiaChi, @SDT, @Email, ISNULL(@TrangThai, N'Hoạt động'));

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo chi nhánh',
                @DoiTuong = N'ChiNhanh',
                @MaDoiTuong = @MaChiNhanh,
                @NoiDung = @TenChiNhanh;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE
    BEGIN
        IF @MaChiNhanh IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
            THROW 51046, N'Không tìm thấy chi nhánh.', 1;

        IF @ThaoTac = N'DOI_TRANG_THAI' AND @TrangThai IS NULL
            THROW 51047, N'Vui lòng nhập trạng thái chi nhánh.', 1;

        DECLARE @DuLieuTruocChiNhanh NVARCHAR(MAX);
        SELECT @DuLieuTruocChiNhanh = (
            SELECT * FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        IF @ThaoTac = N'XOA'
        BEGIN
            IF EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaChiNhanh = @MaChiNhanh)
               OR EXISTS (SELECT 1 FROM dbo.Phong WHERE MaChiNhanh = @MaChiNhanh)
                THROW 51048, N'Không thể xóa chi nhánh đang có nhân viên hoặc phòng liên quan.', 1;

            DELETE FROM dbo.ChiNhanh
            WHERE MaChiNhanh = @MaChiNhanh;

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Xóa chi nhánh',
                @DoiTuong = N'ChiNhanh',
                @MaDoiTuong = @MaChiNhanh,
                @DuLieuTruoc = @DuLieuTruocChiNhanh;

            SELECT CAST(1 AS BIT) AS daXoa, @MaChiNhanh AS maChiNhanh;
            RETURN;
        END;

        UPDATE dbo.ChiNhanh
        SET TenChiNhanh = CASE WHEN @ThaoTac = N'CAP_NHAT' THEN ISNULL(@TenChiNhanh, TenChiNhanh) ELSE TenChiNhanh END,
            DiaChi = CASE WHEN @ThaoTac = N'CAP_NHAT' THEN ISNULL(@DiaChi, DiaChi) ELSE DiaChi END,
            SDT = CASE WHEN @ThaoTac = N'CAP_NHAT' THEN ISNULL(@SDT, SDT) ELSE SDT END,
            Email = CASE WHEN @ThaoTac = N'CAP_NHAT' THEN ISNULL(@Email, Email) ELSE Email END,
            TrangThai = ISNULL(@TrangThai, TrangThai)
        WHERE MaChiNhanh = @MaChiNhanh;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật chi nhánh',
            @DoiTuong = N'ChiNhanh',
            @MaDoiTuong = @MaChiNhanh,
            @NoiDung = @ThaoTac,
            @DuLieuTruoc = @DuLieuTruocChiNhanh;
    END;

    EXEC dbo.SP_Admin_QuanLyChiNhanh @ThaoTac = N'DANH_SACH', @MaChiNhanh = @MaChiNhanh;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyLoaiPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyLoaiPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyLoaiPhong
    @ThaoTac             NVARCHAR(20)  = N'DANH_SACH',
    @MaLoaiPhong         VARCHAR(6)    = NULL,
    @TenLoaiPhong        NVARCHAR(100) = NULL,
    @SucChuaToiDa        INT           = NULL,
    @MoTa                NVARCHAR(MAX) = NULL,
    @GiaThueTheoGiuong   DECIMAL(15,2) = NULL,
    @GiaThueNguyenPhong  DECIMAL(15,2) = NULL,
    @AdminId             VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaLoaiPhong = NULLIF(LTRIM(RTRIM(@MaLoaiPhong)), '');
    SET @TenLoaiPhong = NULLIF(LTRIM(RTRIM(@TenLoaiPhong)), N'');
    SET @MoTa = NULLIF(LTRIM(RTRIM(@MoTa)), N'');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            lp.MaLoaiPhong AS maLoaiPhong,
            lp.TenLoaiPhong AS tenLoaiPhong,
            lp.SucChuaToiDa AS sucChuaToiDa,
            lp.MoTa AS moTa,
            lp.GiaThueTheoGiuong AS giaThueTheoGiuong,
            lp.GiaThueNguyenPhong AS giaThueNguyenPhong,
            COUNT(p.MaPhong) AS soPhong
        FROM dbo.LoaiPhong AS lp
        LEFT JOIN dbo.Phong AS p ON p.MaLoaiPhong = lp.MaLoaiPhong
        WHERE (@MaLoaiPhong IS NULL OR lp.MaLoaiPhong = @MaLoaiPhong)
        GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.SucChuaToiDa, lp.MoTa, lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong
        ORDER BY lp.MaLoaiPhong;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51051, N'Thao tác quản lý loại phòng không hợp lệ.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND (@TenLoaiPhong IS NULL OR @SucChuaToiDa IS NULL)
            THROW 51052, N'Vui lòng nhập tên loại phòng và sức chứa.', 1;

        IF @SucChuaToiDa IS NOT NULL AND @SucChuaToiDa < 1
            THROW 51053, N'Sức chứa tối đa phải lớn hơn 0.', 1;

        IF @GiaThueTheoGiuong IS NOT NULL AND @GiaThueTheoGiuong < 0
            THROW 51054, N'Giá thuê theo giường không hợp lệ.', 1;

        IF @GiaThueNguyenPhong IS NOT NULL AND @GiaThueNguyenPhong < 0
            THROW 51055, N'Giá thuê nguyên phòng không hợp lệ.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoLoaiPhong INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaLoaiPhong IS NULL
            BEGIN
                SELECT @SoLoaiPhong = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaLoaiPhong, 3, 4))), 0) + 1
                FROM dbo.LoaiPhong WITH (UPDLOCK, HOLDLOCK)
                WHERE MaLoaiPhong LIKE 'LP[0-9][0-9][0-9][0-9]';

                IF @SoLoaiPhong > 9999
                    THROW 51056, N'Không thể sinh thêm mã loại phòng mới.', 1;

                SET @MaLoaiPhong = CONCAT('LP', RIGHT(CONCAT('0000', @SoLoaiPhong), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
                THROW 51057, N'Mã loại phòng đã tồn tại.', 1;

            INSERT INTO dbo.LoaiPhong (
                MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong
            )
            VALUES (
                @MaLoaiPhong, @TenLoaiPhong, @SucChuaToiDa, @MoTa, @GiaThueTheoGiuong, @GiaThueNguyenPhong
            );

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo loại phòng',
                @DoiTuong = N'LoaiPhong',
                @MaDoiTuong = @MaLoaiPhong,
                @NoiDung = @TenLoaiPhong;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaLoaiPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51058, N'Không tìm thấy loại phòng.', 1;

        DECLARE @DuLieuTruocLoaiPhong NVARCHAR(MAX);
        SELECT @DuLieuTruocLoaiPhong = (
            SELECT * FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        IF @SucChuaToiDa IS NOT NULL AND EXISTS (
            SELECT 1
            FROM dbo.Phong AS p
            WHERE p.MaLoaiPhong = @MaLoaiPhong
              AND (
                  SELECT COUNT(1)
                  FROM dbo.Giuong AS g
                  WHERE g.MaPhong = p.MaPhong
              ) > @SucChuaToiDa
        )
            THROW 51060, N'Không thể giảm sức chứa thấp hơn số giường hiện có của phòng đang dùng loại này.', 1;

        UPDATE dbo.LoaiPhong
        SET TenLoaiPhong = ISNULL(@TenLoaiPhong, TenLoaiPhong),
            SucChuaToiDa = ISNULL(@SucChuaToiDa, SucChuaToiDa),
            MoTa = ISNULL(@MoTa, MoTa),
            GiaThueTheoGiuong = ISNULL(@GiaThueTheoGiuong, GiaThueTheoGiuong),
            GiaThueNguyenPhong = ISNULL(@GiaThueNguyenPhong, GiaThueNguyenPhong)
        WHERE MaLoaiPhong = @MaLoaiPhong;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật loại phòng',
            @DoiTuong = N'LoaiPhong',
            @MaDoiTuong = @MaLoaiPhong,
            @DuLieuTruoc = @DuLieuTruocLoaiPhong;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaLoaiPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51058, N'Không tìm thấy loại phòng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Phong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51059, N'Không thể xóa loại phòng đang được sử dụng.', 1;

        DELETE FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa loại phòng',
            @DoiTuong = N'LoaiPhong',
            @MaDoiTuong = @MaLoaiPhong;

        SELECT CAST(1 AS BIT) AS daXoa, @MaLoaiPhong AS maLoaiPhong;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyLoaiPhong @ThaoTac = N'DANH_SACH', @MaLoaiPhong = @MaLoaiPhong;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_TaoPhongGiuong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_TaoPhongGiuong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_TaoPhongGiuong
    @MaPhong         VARCHAR(4)    = NULL,
    @TenPhong        NVARCHAR(100),
    @GioiTinhChoPhep NVARCHAR(20),
    @MaChiNhanh      VARCHAR(6),
    @MaLoaiPhong     VARCHAR(6),
    @TinhTrang       NVARCHAR(20)  = N'Trống',
    @UrlImg          VARCHAR(500)  = NULL,
    @SoGiuong        INT           = NULL,
    @AdminId         VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');
    SET @TenPhong = NULLIF(LTRIM(RTRIM(@TenPhong)), N'');
    SET @GioiTinhChoPhep = NULLIF(LTRIM(RTRIM(@GioiTinhChoPhep)), N'');
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @MaLoaiPhong = NULLIF(LTRIM(RTRIM(@MaLoaiPhong)), '');
    SET @TinhTrang = COALESCE(NULLIF(LTRIM(RTRIM(@TinhTrang)), N''), N'Trống');
    EXEC dbo.SP_Admin_QuanLyChiNhanh @ThaoTac = N'DANH_SACH', @MaChiNhanh = @MaChiNhanh;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyLoaiPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyLoaiPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyLoaiPhong
    @ThaoTac             NVARCHAR(20)  = N'DANH_SACH',
    @MaLoaiPhong         VARCHAR(6)    = NULL,
    @TenLoaiPhong        NVARCHAR(100) = NULL,
    @SucChuaToiDa        INT           = NULL,
    @MoTa                NVARCHAR(MAX) = NULL,
    @GiaThueTheoGiuong   DECIMAL(15,2) = NULL,
    @GiaThueNguyenPhong  DECIMAL(15,2) = NULL,
    @AdminId             VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaLoaiPhong = NULLIF(LTRIM(RTRIM(@MaLoaiPhong)), '');
    SET @TenLoaiPhong = NULLIF(LTRIM(RTRIM(@TenLoaiPhong)), N'');
    SET @MoTa = NULLIF(LTRIM(RTRIM(@MoTa)), N'');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            lp.MaLoaiPhong AS maLoaiPhong,
            lp.TenLoaiPhong AS tenLoaiPhong,
            lp.SucChuaToiDa AS sucChuaToiDa,
            lp.MoTa AS moTa,
            lp.GiaThueTheoGiuong AS giaThueTheoGiuong,
            lp.GiaThueNguyenPhong AS giaThueNguyenPhong,
            COUNT(p.MaPhong) AS soPhong
        FROM dbo.LoaiPhong AS lp
        LEFT JOIN dbo.Phong AS p ON p.MaLoaiPhong = lp.MaLoaiPhong
        WHERE (@MaLoaiPhong IS NULL OR lp.MaLoaiPhong = @MaLoaiPhong)
        GROUP BY lp.MaLoaiPhong, lp.TenLoaiPhong, lp.SucChuaToiDa, lp.MoTa, lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong
        ORDER BY lp.MaLoaiPhong;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51051, N'Thao tác quản lý loại phòng không hợp lệ.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND (@TenLoaiPhong IS NULL OR @SucChuaToiDa IS NULL)
            THROW 51052, N'Vui lòng nhập tên loại phòng và sức chứa.', 1;

        IF @SucChuaToiDa IS NOT NULL AND @SucChuaToiDa < 1
            THROW 51053, N'Sức chứa tối đa phải lớn hơn 0.', 1;

        IF @GiaThueTheoGiuong IS NOT NULL AND @GiaThueTheoGiuong < 0
            THROW 51054, N'Giá thuê theo giường không hợp lệ.', 1;

        IF @GiaThueNguyenPhong IS NOT NULL AND @GiaThueNguyenPhong < 0
            THROW 51055, N'Giá thuê nguyên phòng không hợp lệ.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoLoaiPhong INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaLoaiPhong IS NULL
            BEGIN
                SELECT @SoLoaiPhong = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaLoaiPhong, 3, 4))), 0) + 1
                FROM dbo.LoaiPhong WITH (UPDLOCK, HOLDLOCK)
                WHERE MaLoaiPhong LIKE 'LP[0-9][0-9][0-9][0-9]';

                IF @SoLoaiPhong > 9999
                    THROW 51056, N'Không thể sinh thêm mã loại phòng mới.', 1;

                SET @MaLoaiPhong = CONCAT('LP', RIGHT(CONCAT('0000', @SoLoaiPhong), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
                THROW 51057, N'Mã loại phòng đã tồn tại.', 1;

            INSERT INTO dbo.LoaiPhong (
                MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong
            )
            VALUES (
                @MaLoaiPhong, @TenLoaiPhong, @SucChuaToiDa, @MoTa, @GiaThueTheoGiuong, @GiaThueNguyenPhong
            );

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo loại phòng',
                @DoiTuong = N'LoaiPhong',
                @MaDoiTuong = @MaLoaiPhong,
                @NoiDung = @TenLoaiPhong;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaLoaiPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51058, N'Không tìm thấy loại phòng.', 1;

        DECLARE @DuLieuTruocLoaiPhong NVARCHAR(MAX);
        SELECT @DuLieuTruocLoaiPhong = (
            SELECT * FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        IF @SucChuaToiDa IS NOT NULL AND EXISTS (
            SELECT 1
            FROM dbo.Phong AS p
            WHERE p.MaLoaiPhong = @MaLoaiPhong
              AND (
                  SELECT COUNT(1)
                  FROM dbo.Giuong AS g
                  WHERE g.MaPhong = p.MaPhong
              ) > @SucChuaToiDa
        )
            THROW 51060, N'Không thể giảm sức chứa thấp hơn số giường hiện có của phòng đang dùng loại này.', 1;

        UPDATE dbo.LoaiPhong
        SET TenLoaiPhong = ISNULL(@TenLoaiPhong, TenLoaiPhong),
            SucChuaToiDa = ISNULL(@SucChuaToiDa, SucChuaToiDa),
            MoTa = ISNULL(@MoTa, MoTa),
            GiaThueTheoGiuong = ISNULL(@GiaThueTheoGiuong, GiaThueTheoGiuong),
            GiaThueNguyenPhong = ISNULL(@GiaThueNguyenPhong, GiaThueNguyenPhong)
        WHERE MaLoaiPhong = @MaLoaiPhong;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật loại phòng',
            @DoiTuong = N'LoaiPhong',
            @MaDoiTuong = @MaLoaiPhong,
            @DuLieuTruoc = @DuLieuTruocLoaiPhong;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaLoaiPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51058, N'Không tìm thấy loại phòng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Phong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51059, N'Không thể xóa loại phòng đang được sử dụng.', 1;

        DELETE FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa loại phòng',
            @DoiTuong = N'LoaiPhong',
            @MaDoiTuong = @MaLoaiPhong;

        SELECT CAST(1 AS BIT) AS daXoa, @MaLoaiPhong AS maLoaiPhong;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyLoaiPhong @ThaoTac = N'DANH_SACH', @MaLoaiPhong = @MaLoaiPhong;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_TaoPhongGiuong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_TaoPhongGiuong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_TaoPhongGiuong
    @MaPhong         VARCHAR(4)    = NULL,
    @TenPhong        NVARCHAR(100),
    @GioiTinhChoPhep NVARCHAR(20),
    @MaChiNhanh      VARCHAR(6),
    @MaLoaiPhong     VARCHAR(6),
    @TinhTrang       NVARCHAR(20)  = N'Trống',
    @UrlImg          VARCHAR(500)  = NULL,
    @SoGiuong        INT           = NULL,
    @AdminId         VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');
    SET @TenPhong = NULLIF(LTRIM(RTRIM(@TenPhong)), N'');
    SET @GioiTinhChoPhep = NULLIF(LTRIM(RTRIM(@GioiTinhChoPhep)), N'');
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @MaLoaiPhong = NULLIF(LTRIM(RTRIM(@MaLoaiPhong)), '');
    SET @TinhTrang = COALESCE(NULLIF(LTRIM(RTRIM(@TinhTrang)), N''), N'Trống');
    SET @UrlImg = NULLIF(LTRIM(RTRIM(@UrlImg)), '');

    IF @TenPhong IS NULL OR @GioiTinhChoPhep IS NULL OR @MaChiNhanh IS NULL OR @MaLoaiPhong IS NULL
        THROW 51061, N'Vui lòng nhập tên phòng, giới tính, chi nhánh và loại phòng.', 1;

    IF @GioiTinhChoPhep NOT IN (N'Nam', N'Nữ', N'Không phân biệt')
        THROW 51062, N'Giới tính cho phép không hợp lệ.', 1;

    IF @TinhTrang NOT IN (N'Trống', N'Đã đặt cọc', N'Còn chỗ', N'Đầy', N'Giữ chỗ')
        THROW 51063, N'Tình trạng phòng không hợp lệ.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
        THROW 51064, N'Không tìm thấy chi nhánh.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
        THROW 51065, N'Không tìm thấy loại phòng.', 1;

    DECLARE @SucChuaLoaiPhong INT;
    SELECT @SucChuaLoaiPhong = SucChuaToiDa
    FROM dbo.LoaiPhong
    WHERE MaLoaiPhong = @MaLoaiPhong;

    IF @SoGiuong IS NULL
        SET @SoGiuong = @SucChuaLoaiPhong;

    IF @SoGiuong < 1 OR @SoGiuong > 99
        THROW 51066, N'Số giường phải nằm trong khoảng 1 đến 99.', 1;

    IF @SoGiuong > @SucChuaLoaiPhong
        THROW 51069, N'Số giường không được vượt sức chứa tối đa của loại phòng.', 1;

    DECLARE @SoPhong INT;
    DECLARE @SoChiNhanh INT = TRY_CONVERT(INT, SUBSTRING(@MaChiNhanh, 3, 4));
    DECLARE @Index INT = 1;
    DECLARE @MaGiuong VARCHAR(3);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @MaPhong IS NULL
        BEGIN
            IF @SoChiNhanh IS NULL OR @SoChiNhanh NOT BETWEEN 1 AND 9
                THROW 51067, N'Chỉ tự sinh mã phòng P1XX đến P9XX cho chi nhánh CN0001 đến CN0009.', 1;

            SELECT @SoPhong = ISNULL(MAX(TRY_CONVERT(INT, RIGHT(MaPhong, 2))), 0) + 1
            FROM dbo.Phong WITH (UPDLOCK, HOLDLOCK)
            WHERE MaChiNhanh = @MaChiNhanh
              AND MaPhong LIKE CONCAT('P', @SoChiNhanh, '[0-9][0-9]');

            IF @SoPhong > 99
                THROW 51067, N'Chi nhánh này đã hết mã phòng theo định dạng PnXX.', 1;

            SET @MaPhong = CONCAT('P', @SoChiNhanh, RIGHT(CONCAT('00', @SoPhong), 2));
        END;

        IF EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
            THROW 51068, N'Mã phòng đã tồn tại.', 1;

        INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
        VALUES (@MaPhong, @TenPhong, @GioiTinhChoPhep, @TinhTrang, @MaChiNhanh, @MaLoaiPhong);

        IF @UrlImg IS NOT NULL
        BEGIN
            INSERT INTO dbo.HinhAnhPhong (MaPhong, STTAnh, UrlImg)
            VALUES (@MaPhong, 1, @UrlImg);
        END;

        WHILE @Index <= @SoGiuong
        BEGIN
            SET @MaGiuong = CONCAT('G', RIGHT(CONCAT('00', @Index), 2));

            INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang)
            VALUES (@MaPhong, @MaGiuong, @Index, N'Trống');

            SET @Index += 1;
        END;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Tạo phòng giường',
            @DoiTuong = N'Phong',
            @MaDoiTuong = @MaPhong,
            @NoiDung = @TenPhong;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        p.GioiTinhChoPhep AS gioiTinhChoPhep,
        p.TinhTrang AS tinhTrangPhong,
        (SELECT TOP 1 hap.UrlImg FROM dbo.HinhAnhPhong AS hap WHERE hap.MaPhong = p.MaPhong ORDER BY hap.STTAnh) AS urlImgPhong,
        p.MaChiNhanh AS maChiNhanh,
        cn.TenChiNhanh AS tenChiNhanh,
        p.MaLoaiPhong AS maLoaiPhong,
        lp.TenLoaiPhong AS tenLoaiPhong,
        g.MaGiuong AS maGiuong,
        g.SoGiuong AS soGiuong,
        g.TinhTrang AS tinhTrangGiuong
    FROM dbo.Phong AS p
    INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    LEFT JOIN dbo.Giuong AS g ON g.MaPhong = p.MaPhong
    WHERE p.MaPhong = @MaPhong
    ORDER BY g.SoGiuong;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_CapNhatTrangThaiPhongGiuong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_CapNhatTrangThaiPhongGiuong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_CapNhatTrangThaiPhongGiuong
    @LoaiDoiTuong NVARCHAR(20),
    @MaPhong      VARCHAR(4),
    @MaGiuong     VARCHAR(3)   = NULL,
    @TrangThai    NVARCHAR(20),
    @AdminId      VARCHAR(6)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @LoaiDoiTuong = UPPER(NULLIF(LTRIM(RTRIM(@LoaiDoiTuong)), N''));
    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');
    SET @MaGiuong = NULLIF(LTRIM(RTRIM(@MaGiuong)), '');
    SET @TrangThai = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');

    IF @LoaiDoiTuong NOT IN (N'PHONG', N'GIUONG')
        THROW 51071, N'Loại đối tượng chỉ nhận PHONG hoặc GIUONG.', 1;

    IF @MaPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
        THROW 51072, N'Không tìm thấy phòng.', 1;

    IF @LoaiDoiTuong = N'PHONG' AND @TrangThai NOT IN (N'Trống', N'Đã đặt cọc', N'Còn chỗ', N'Đầy', N'Giữ chỗ', N'Bảo trì')
        THROW 51073, N'Trạng thái phòng không hợp lệ.', 1;

    IF @LoaiDoiTuong = N'GIUONG' AND @TrangThai NOT IN (N'Trống', N'Đã đặt cọc', N'Đang thuê')
        THROW 51074, N'Trạng thái giường không hợp lệ.', 1;

    IF @LoaiDoiTuong = N'GIUONG'
       AND (@MaGiuong IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong
       ))
        THROW 51075, N'Không tìm thấy giường.', 1;

    DECLARE @DuLieuTruoc NVARCHAR(MAX);

    IF @LoaiDoiTuong = N'PHONG'
        SELECT @DuLieuTruoc = (
            SELECT * FROM dbo.Phong WHERE MaPhong = @MaPhong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );
    ELSE
        SELECT @DuLieuTruoc = (
            SELECT * FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @LoaiDoiTuong = N'PHONG'
        BEGIN
            UPDATE dbo.Phong
            SET TinhTrang = @TrangThai
            WHERE MaPhong = @MaPhong;
        END
        ELSE
        BEGIN
            UPDATE dbo.Giuong
            SET TinhTrang = @TrangThai
            WHERE MaPhong = @MaPhong
              AND MaGiuong = @MaGiuong;

            UPDATE dbo.Phong
            SET TinhTrang = CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Trống'
                ) THEN N'Trống'
                WHEN NOT EXISTS (
                    SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Trống'
                ) THEN N'Đầy'
                WHEN EXISTS (
                    SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Đã đặt cọc'
                ) THEN N'Còn chỗ'
                ELSE N'Còn chỗ'
            END
            WHERE MaPhong = @MaPhong;
        END;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật trạng thái phòng/giường',
            @DoiTuong = @LoaiDoiTuong,
            @MaDoiTuong = @MaPhong,
            @NoiDung = @TrangThai,
            @DuLieuTruoc = @DuLieuTruoc;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT
        p.MaPhong AS maPhong,
        p.TenPhong AS tenPhong,
        p.TinhTrang AS tinhTrangPhong,
        g.MaGiuong AS maGiuong,
        g.SoGiuong AS soGiuong,
        g.TinhTrang AS tinhTrangGiuong
    FROM dbo.Phong AS p
    LEFT JOIN dbo.Giuong AS g ON g.MaPhong = p.MaPhong
    WHERE p.MaPhong = @MaPhong
      AND (@MaGiuong IS NULL OR g.MaGiuong = @MaGiuong)
    ORDER BY g.SoGiuong;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyPhong
    @ThaoTac         NVARCHAR(20)  = N'DANH_SACH',
    @MaPhong         VARCHAR(4)    = NULL,
    @TenPhong        NVARCHAR(100) = NULL,
    @GioiTinhChoPhep NVARCHAR(20)  = NULL,
    @TinhTrang       NVARCHAR(20)  = NULL,
    @UrlImg          VARCHAR(500)  = NULL,
    @MaChiNhanh      VARCHAR(6)    = NULL,
    @MaLoaiPhong     VARCHAR(6)    = NULL,
    @AdminId         VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');
    SET @TenPhong = NULLIF(LTRIM(RTRIM(@TenPhong)), N'');
    SET @GioiTinhChoPhep = NULLIF(LTRIM(RTRIM(@GioiTinhChoPhep)), N'');
    SET @TinhTrang = NULLIF(LTRIM(RTRIM(@TinhTrang)), N'');
    SET @UrlImg = NULLIF(LTRIM(RTRIM(@UrlImg)), '');
    SET @MaChiNhanh = NULLIF(LTRIM(RTRIM(@MaChiNhanh)), '');
    SET @MaLoaiPhong = NULLIF(LTRIM(RTRIM(@MaLoaiPhong)), '');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            p.MaPhong AS maPhong,
            p.TenPhong AS tenPhong,
            p.GioiTinhChoPhep AS gioiTinhChoPhep,
            p.TinhTrang AS tinhTrang,
            (SELECT TOP 1 hap.UrlImg FROM dbo.HinhAnhPhong AS hap WHERE hap.MaPhong = p.MaPhong ORDER BY hap.STTAnh) AS urlImg,
            p.MaChiNhanh AS maChiNhanh,
            cn.TenChiNhanh AS tenChiNhanh,
            p.MaLoaiPhong AS maLoaiPhong,
            lp.TenLoaiPhong AS tenLoaiPhong,
            COUNT(g.MaGiuong) AS soGiuong,
            SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS soGiuongTrong
        FROM dbo.Phong AS p
        INNER JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
        INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        LEFT JOIN dbo.Giuong AS g ON g.MaPhong = p.MaPhong
        WHERE (@MaPhong IS NULL OR p.MaPhong = @MaPhong)
          AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
          AND (@MaLoaiPhong IS NULL OR p.MaLoaiPhong = @MaLoaiPhong)
          AND (@TinhTrang IS NULL OR p.TinhTrang = @TinhTrang)
        GROUP BY p.MaPhong, p.TenPhong, p.GioiTinhChoPhep, p.TinhTrang,
                 p.MaChiNhanh, cn.TenChiNhanh, p.MaLoaiPhong, lp.TenLoaiPhong
        ORDER BY p.MaPhong;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51101, N'Thao tác quản trị phòng không hợp lệ.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO'
           AND (@TenPhong IS NULL OR @GioiTinhChoPhep IS NULL OR @MaChiNhanh IS NULL OR @MaLoaiPhong IS NULL)
            THROW 51102, N'Vui lòng nhập đầy đủ tên phòng, giới tính, chi nhánh và loại phòng.', 1;

        IF @GioiTinhChoPhep IS NOT NULL AND @GioiTinhChoPhep NOT IN (N'Nam', N'Nữ', N'Không phân biệt')
            THROW 51103, N'Giới tính cho phép không hợp lệ.', 1;

        IF @TinhTrang IS NOT NULL AND @TinhTrang NOT IN (N'Trống', N'Đã đặt cọc', N'Còn chỗ', N'Đầy', N'Giữ chỗ', N'Bảo trì')
            THROW 51104, N'Tình trạng phòng không hợp lệ.', 1;

        IF @MaChiNhanh IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.ChiNhanh WHERE MaChiNhanh = @MaChiNhanh)
            THROW 51105, N'Không tìm thấy chi nhánh.', 1;

        IF @MaLoaiPhong IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.LoaiPhong WHERE MaLoaiPhong = @MaLoaiPhong)
            THROW 51106, N'Không tìm thấy loại phòng.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoPhongMoi INT;
        DECLARE @SoChiNhanhPhong INT = TRY_CONVERT(INT, SUBSTRING(@MaChiNhanh, 3, 4));

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaPhong IS NULL
            BEGIN
                IF @SoChiNhanhPhong IS NULL OR @SoChiNhanhPhong NOT BETWEEN 1 AND 9
                    THROW 51107, N'Chỉ tự sinh mã phòng P1XX đến P9XX cho chi nhánh CN0001 đến CN0009.', 1;

                SELECT @SoPhongMoi = ISNULL(MAX(TRY_CONVERT(INT, RIGHT(MaPhong, 2))), 0) + 1
                FROM dbo.Phong WITH (UPDLOCK, HOLDLOCK)
                WHERE MaChiNhanh = @MaChiNhanh
                  AND MaPhong LIKE CONCAT('P', @SoChiNhanhPhong, '[0-9][0-9]');

                IF @SoPhongMoi > 99
                    THROW 51107, N'Chi nhánh này đã hết mã phòng theo định dạng PnXX.', 1;

                SET @MaPhong = CONCAT('P', @SoChiNhanhPhong, RIGHT(CONCAT('00', @SoPhongMoi), 2));
            END;

            IF EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
                THROW 51108, N'Mã phòng đã tồn tại.', 1;

            INSERT INTO dbo.Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, MaChiNhanh, MaLoaiPhong)
            VALUES (@MaPhong, @TenPhong, @GioiTinhChoPhep, ISNULL(@TinhTrang, N'Trống'), @MaChiNhanh, @MaLoaiPhong);

            IF @UrlImg IS NOT NULL
            BEGIN
                INSERT INTO dbo.HinhAnhPhong (MaPhong, STTAnh, UrlImg)
                VALUES (@MaPhong, 1, @UrlImg);
            END;

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo phòng',
                @DoiTuong = N'Phong',
                @MaDoiTuong = @MaPhong,
                @NoiDung = @TenPhong;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
            THROW 51109, N'Không tìm thấy phòng.', 1;

        DECLARE @DuLieuTruocPhong NVARCHAR(MAX);
        SELECT @DuLieuTruocPhong = (
            SELECT * FROM dbo.Phong WHERE MaPhong = @MaPhong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.Phong
        SET TenPhong = ISNULL(@TenPhong, TenPhong),
            GioiTinhChoPhep = ISNULL(@GioiTinhChoPhep, GioiTinhChoPhep),
            TinhTrang = ISNULL(@TinhTrang, TinhTrang),
            MaChiNhanh = ISNULL(@MaChiNhanh, MaChiNhanh),
            MaLoaiPhong = ISNULL(@MaLoaiPhong, MaLoaiPhong)
        WHERE MaPhong = @MaPhong;

        IF @UrlImg IS NOT NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM dbo.HinhAnhPhong WHERE MaPhong = @MaPhong AND STTAnh = 1)
                UPDATE dbo.HinhAnhPhong
                SET UrlImg = @UrlImg
                WHERE MaPhong = @MaPhong AND STTAnh = 1;
            ELSE
                INSERT INTO dbo.HinhAnhPhong (MaPhong, STTAnh, UrlImg)
                VALUES (@MaPhong, 1, @UrlImg);
        END;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật phòng',
            @DoiTuong = N'Phong',
            @MaDoiTuong = @MaPhong,
            @DuLieuTruoc = @DuLieuTruocPhong;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
            THROW 51109, N'Không tìm thấy phòng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Trống')
            THROW 51110, N'Không thể xóa phòng đang có giường được đặt cọc hoặc đang thuê.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.ChiTietDatCoc AS ctdc
            INNER JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
            WHERE ctdc.MaPhong = @MaPhong
              AND pdc.TrangThaiCoc IN (N'Hiệu lực', N'Đã lập HĐ')
        )
            THROW 51111, N'Không thể xóa phòng đã phát sinh đặt cọc.', 1;

        IF EXISTS (SELECT 1 FROM dbo.ChiTietDatCoc WHERE MaPhong = @MaPhong)
            THROW 51113, N'Không thể xóa phòng đã có lịch sử đặt cọc/hợp đồng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.TaiSan WHERE MaPhong = @MaPhong)
           OR EXISTS (SELECT 1 FROM dbo.ChiTietXemPhong WHERE MaPhong = @MaPhong)
           OR EXISTS (SELECT 1 FROM dbo.PhieuGhiChiSo WHERE MaPhong = @MaPhong)
            THROW 51112, N'Không thể xóa phòng đang có dữ liệu liên quan.', 1;

        DECLARE @DuLieuTruocPhongXoa NVARCHAR(MAX);
        SELECT @DuLieuTruocPhongXoa = (
            SELECT * FROM dbo.Phong WHERE MaPhong = @MaPhong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        BEGIN TRY
            BEGIN TRANSACTION;

            DELETE FROM dbo.Giuong WHERE MaPhong = @MaPhong;
            DELETE FROM dbo.Phong WHERE MaPhong = @MaPhong;

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Xóa phòng',
                @DoiTuong = N'Phong',
                @MaDoiTuong = @MaPhong,
                @DuLieuTruoc = @DuLieuTruocPhongXoa;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;

        SELECT CAST(1 AS BIT) AS daXoa, @MaPhong AS maPhong;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyPhong @ThaoTac = N'DANH_SACH', @MaPhong = @MaPhong;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyGiuong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyGiuong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyGiuong
    @ThaoTac   NVARCHAR(20) = N'DANH_SACH',
    @MaPhong   VARCHAR(4)   = NULL,
    @MaGiuong  VARCHAR(3)   = NULL,
    @SoGiuong  INT          = NULL,
    @TinhTrang NVARCHAR(20) = NULL,
    @UrlImg    VARCHAR(500) = NULL,
    @AdminId   VARCHAR(6)   = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');
    SET @MaGiuong = NULLIF(LTRIM(RTRIM(@MaGiuong)), '');
    SET @TinhTrang = NULLIF(LTRIM(RTRIM(@TinhTrang)), N'');
    SET @UrlImg = NULLIF(LTRIM(RTRIM(@UrlImg)), '');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            g.MaPhong AS maPhong,
            p.TenPhong AS tenPhong,
            g.MaGiuong AS maGiuong,
            g.SoGiuong AS soGiuong,
            g.TinhTrang AS tinhTrang,
            lp.SucChuaToiDa AS sucChuaToiDa,
            (
                SELECT COUNT(1)
                FROM dbo.TaiSan AS tsChung
                WHERE tsChung.MaPhong = g.MaPhong
                  AND tsChung.LoaiTaiSan = N'Chung'
            ) AS soTaiSanChung,
            CAST(0 AS INT) AS soTaiSanRieng
        FROM dbo.Giuong AS g
        INNER JOIN dbo.Phong AS p ON p.MaPhong = g.MaPhong
        INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        WHERE (@MaPhong IS NULL OR g.MaPhong = @MaPhong)
          AND (@MaGiuong IS NULL OR g.MaGiuong = @MaGiuong)
          AND (@TinhTrang IS NULL OR g.TinhTrang = @TinhTrang)
        ORDER BY g.MaPhong, g.SoGiuong, g.MaGiuong;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51121, N'Thao tác quản trị giường không hợp lệ.', 1;

    IF @MaPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
        THROW 51122, N'Không tìm thấy phòng.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND @SoGiuong IS NULL
            THROW 51123, N'Vui lòng nhập số giường.', 1;

        IF @SoGiuong IS NOT NULL AND @SoGiuong < 1
            THROW 51124, N'Số giường không hợp lệ.', 1;

        IF @TinhTrang IS NOT NULL AND @TinhTrang NOT IN (N'Trống', N'Đã đặt cọc', N'Đang thuê')
            THROW 51125, N'Tình trạng giường không hợp lệ.', 1;
    END;

    DECLARE @SucChuaToiDa INT;
    SELECT @SucChuaToiDa = lp.SucChuaToiDa
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaPhong = @MaPhong;

    IF @SoGiuong IS NOT NULL AND @SoGiuong > @SucChuaToiDa
        THROW 51120, N'Số giường không được vượt sức chứa tối đa của loại phòng.', 1;

    IF @ThaoTac = N'TAO'
    BEGIN
        IF (SELECT COUNT(*) FROM dbo.Giuong WHERE MaPhong = @MaPhong) >= @SucChuaToiDa
            THROW 51126, N'Số giường hiện tại đã đạt sức chứa tối đa của loại phòng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND SoGiuong = @SoGiuong)
            THROW 51127, N'Số giường đã tồn tại trong phòng.', 1;

        IF @MaGiuong IS NULL
        BEGIN
            DECLARE @SoMaGiuong INT;
            SELECT @SoMaGiuong = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaGiuong, 2, 2))), 0) + 1
            FROM dbo.Giuong WITH (UPDLOCK, HOLDLOCK)
            WHERE MaPhong = @MaPhong
              AND MaGiuong LIKE 'G[0-9][0-9]';

            IF @SoMaGiuong > 99
                THROW 51128, N'Không thể sinh thêm mã giường mới.', 1;

            SET @MaGiuong = CONCAT('G', RIGHT(CONCAT('00', @SoMaGiuong), 2));
        END;

        IF EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong)
            THROW 51129, N'Mã giường đã tồn tại trong phòng.', 1;

        BEGIN TRY
            BEGIN TRANSACTION;

            INSERT INTO dbo.Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang)
            VALUES (@MaPhong, @MaGiuong, @SoGiuong, ISNULL(@TinhTrang, N'Trống'));

            UPDATE dbo.Phong
            SET TinhTrang = CASE
                WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Trống') THEN N'Trống'
                WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Trống') THEN N'Đầy'
                ELSE N'Còn chỗ'
            END
            WHERE MaPhong = @MaPhong;

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo giường',
                @DoiTuong = N'Giuong',
                @MaDoiTuong = @MaGiuong,
                @NoiDung = @MaPhong;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaGiuong IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong
        )
            THROW 51130, N'Không tìm thấy giường.', 1;

        IF @SoGiuong IS NOT NULL AND EXISTS (
            SELECT 1
            FROM dbo.Giuong
            WHERE MaPhong = @MaPhong
              AND SoGiuong = @SoGiuong
              AND MaGiuong <> @MaGiuong
        )
            THROW 51127, N'Số giường đã tồn tại trong phòng.', 1;

        DECLARE @DuLieuTruocGiuong NVARCHAR(MAX);
        SELECT @DuLieuTruocGiuong = (
            SELECT * FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.Giuong
        SET SoGiuong = ISNULL(@SoGiuong, SoGiuong),
            TinhTrang = ISNULL(@TinhTrang, TinhTrang)
        WHERE MaPhong = @MaPhong
          AND MaGiuong = @MaGiuong;

        UPDATE dbo.Phong
        SET TinhTrang = CASE
            WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong) THEN N'Trống'
            WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Trống') THEN N'Trống'
            WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Trống') THEN N'Đầy'
            ELSE N'Còn chỗ'
        END
        WHERE MaPhong = @MaPhong;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật giường',
            @DoiTuong = N'Giuong',
            @MaDoiTuong = @MaGiuong,
            @NoiDung = @MaPhong,
            @DuLieuTruoc = @DuLieuTruocGiuong;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaGiuong IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong
        )
            THROW 51130, N'Không tìm thấy giường.', 1;

        IF EXISTS (
            SELECT 1 FROM dbo.Giuong
            WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong AND TinhTrang <> N'Trống'
        )
            THROW 51131, N'Không thể xóa giường đang được sử dụng hoặc đã đặt cọc.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.ChiTietDatCoc AS ctdc
            INNER JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
            WHERE ctdc.MaPhong = @MaPhong
              AND ctdc.MaGiuong = @MaGiuong
              AND pdc.TrangThaiCoc IN (N'Hiệu lực', N'Đã lập HĐ')
        )
            THROW 51132, N'Không thể xóa giường đã phát sinh đặt cọc.', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.ChiTietDatCoc
            WHERE MaPhong = @MaPhong
              AND MaGiuong = @MaGiuong
        )
            THROW 51134, N'Không thể xóa giường đã có lịch sử đặt cọc/hợp đồng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.ChiTietXemPhong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong)
            THROW 51133, N'Không thể xóa giường đang có dữ liệu liên quan.', 1;

        DECLARE @DuLieuTruocGiuongXoa NVARCHAR(MAX);
        SELECT @DuLieuTruocGiuongXoa = (
            SELECT * FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuong FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        BEGIN TRY
            BEGIN TRANSACTION;

            DELETE FROM dbo.Giuong
            WHERE MaPhong = @MaPhong
              AND MaGiuong = @MaGiuong;

            UPDATE dbo.Phong
            SET TinhTrang = CASE
                WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong) THEN N'Trống'
                WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang <> N'Trống') THEN N'Trống'
                WHEN NOT EXISTS (SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND TinhTrang = N'Trống') THEN N'Đầy'
                ELSE N'Còn chỗ'
            END
            WHERE MaPhong = @MaPhong;

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Xóa giường',
                @DoiTuong = N'Giuong',
                @MaDoiTuong = @MaGiuong,
                @NoiDung = @MaPhong,
                @DuLieuTruoc = @DuLieuTruocGiuongXoa;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;

        SELECT CAST(1 AS BIT) AS daXoa, @MaPhong AS maPhong, @MaGiuong AS maGiuong;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyGiuong @ThaoTac = N'DANH_SACH', @MaPhong = @MaPhong, @MaGiuong = @MaGiuong;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyTaiSanPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyTaiSanPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyTaiSanPhong
    @ThaoTac   NVARCHAR(20)  = N'DANH_SACH',
    @MaPhong   VARCHAR(4)    = NULL,
    @MaTaiSan  VARCHAR(6)    = NULL,
    @TenTaiSan NVARCHAR(100) = NULL,
    @SoLuong   INT           = NULL,
    @DonGia    DECIMAL(15,2) = NULL,
    @LoaiTaiSan NVARCHAR(20) = NULL,
    @MaGiuong   VARCHAR(3)   = NULL,
    @AdminId   VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaPhong = NULLIF(LTRIM(RTRIM(@MaPhong)), '');
    SET @MaTaiSan = NULLIF(LTRIM(RTRIM(@MaTaiSan)), '');
    SET @TenTaiSan = NULLIF(LTRIM(RTRIM(@TenTaiSan)), N'');
    SET @LoaiTaiSan = NULLIF(LTRIM(RTRIM(@LoaiTaiSan)), N'');
    SET @MaGiuong = NULLIF(LTRIM(RTRIM(@MaGiuong)), '');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            ts.MaPhong AS maPhong,
            p.TenPhong AS tenPhong,
            ts.MaTaiSan AS maTaiSan,
            ts.TenTaiSan AS tenTaiSan,
            ts.SoLuong AS soLuong,
            ts.DonGia AS donGia,
            ts.LoaiTaiSan AS loaiTaiSan,
            ts.MaGiuong AS maGiuong,
            g.SoGiuong AS soGiuong
        FROM dbo.TaiSan AS ts
        INNER JOIN dbo.Phong AS p ON p.MaPhong = ts.MaPhong
        LEFT JOIN dbo.Giuong AS g ON g.MaPhong = ts.MaPhong AND g.MaGiuong = ts.MaGiuong
        WHERE (@MaPhong IS NULL OR ts.MaPhong = @MaPhong)
          AND (@MaTaiSan IS NULL OR ts.MaTaiSan = @MaTaiSan)
          AND (@MaGiuong IS NULL OR ts.MaGiuong = @MaGiuong)
          AND (@LoaiTaiSan IS NULL OR ts.LoaiTaiSan = @LoaiTaiSan)
        ORDER BY ts.MaPhong, ts.LoaiTaiSan, ts.MaGiuong, ts.MaTaiSan;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51081, N'Thao tác quản lý tài sản không hợp lệ.', 1;

    IF @MaPhong IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.Phong WHERE MaPhong = @MaPhong)
        THROW 51082, N'Không tìm thấy phòng.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND @TenTaiSan IS NULL
            THROW 51083, N'Vui lòng nhập tên tài sản.', 1;

        IF @SoLuong IS NOT NULL AND @SoLuong <= 0
            THROW 51084, N'Số lượng tài sản không hợp lệ.', 1;

        IF @DonGia IS NOT NULL AND @DonGia < 0
            THROW 51085, N'Đơn giá tài sản không hợp lệ.', 1;

        DECLARE @LoaiTaiSanSau NVARCHAR(20);
        DECLARE @MaGiuongSau VARCHAR(3);

        IF @ThaoTac = N'TAO'
        BEGIN
            SET @LoaiTaiSanSau = ISNULL(@LoaiTaiSan, N'Chung');
            SET @MaGiuongSau = @MaGiuong;
        END
        ELSE
        BEGIN
            IF @MaTaiSan IS NULL OR NOT EXISTS (
                SELECT 1 FROM dbo.TaiSan WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan
            )
                THROW 51088, N'Không tìm thấy tài sản phòng.', 1;

            SELECT
                @LoaiTaiSanSau = ISNULL(@LoaiTaiSan, LoaiTaiSan),
                @MaGiuongSau = CASE
                    WHEN @LoaiTaiSan = N'Chung' THEN NULL
                    ELSE ISNULL(@MaGiuong, MaGiuong)
                END
            FROM dbo.TaiSan
            WHERE MaPhong = @MaPhong
              AND MaTaiSan = @MaTaiSan;
        END;

        IF @LoaiTaiSanSau NOT IN (N'Chung', N'Riêng')
            THROW 51090, N'Loại tài sản chỉ được là Chung hoặc Riêng.', 1;

        IF @LoaiTaiSanSau = N'Chung'
            SET @MaGiuongSau = NULL;

        IF @LoaiTaiSanSau = N'Riêng' AND @MaGiuongSau IS NULL
            THROW 51091, N'Tài sản riêng phải gắn với một giường.', 1;

        IF @MaGiuongSau IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.Giuong WHERE MaPhong = @MaPhong AND MaGiuong = @MaGiuongSau
        )
            THROW 51092, N'Giường không thuộc phòng đang quản lý tài sản.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoTaiSan INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaTaiSan IS NULL
            BEGIN
                SELECT @SoTaiSan = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaTaiSan, 3, 4))), 0) + 1
                FROM dbo.TaiSan WITH (UPDLOCK, HOLDLOCK)
                WHERE MaPhong = @MaPhong
                  AND MaTaiSan LIKE 'TS[0-9][0-9][0-9][0-9]';

                IF @SoTaiSan > 9999
                    THROW 51086, N'Không thể sinh thêm mã tài sản mới.', 1;

                SET @MaTaiSan = CONCAT('TS', RIGHT(CONCAT('0000', @SoTaiSan), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.TaiSan WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan)
                THROW 51087, N'Mã tài sản đã tồn tại trong phòng.', 1;

            INSERT INTO dbo.TaiSan (
                MaPhong, MaTaiSan, TenTaiSan, SoLuong, DonGia, LoaiTaiSan, MaGiuong
            )
            VALUES (
                @MaPhong, @MaTaiSan, @TenTaiSan, ISNULL(@SoLuong, 1),
                @DonGia, @LoaiTaiSanSau, @MaGiuongSau
            );

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo tài sản phòng',
                @DoiTuong = N'TaiSan',
                @MaDoiTuong = @MaTaiSan,
                @NoiDung = @MaPhong;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaTaiSan IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.TaiSan WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan
        )
            THROW 51088, N'Không tìm thấy tài sản phòng.', 1;

        DECLARE @DuLieuTruocTaiSan NVARCHAR(MAX);
        SELECT @DuLieuTruocTaiSan = (
            SELECT * FROM dbo.TaiSan WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.TaiSan
        SET TenTaiSan = ISNULL(@TenTaiSan, TenTaiSan),
            SoLuong = ISNULL(@SoLuong, SoLuong),
            DonGia = ISNULL(@DonGia, DonGia),
            LoaiTaiSan = @LoaiTaiSanSau,
            MaGiuong = @MaGiuongSau
        WHERE MaPhong = @MaPhong
          AND MaTaiSan = @MaTaiSan;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật tài sản phòng',
            @DoiTuong = N'TaiSan',
            @MaDoiTuong = @MaTaiSan,
            @NoiDung = @MaPhong,
            @DuLieuTruoc = @DuLieuTruocTaiSan;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaTaiSan IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.TaiSan WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan
        )
            THROW 51088, N'Không tìm thấy tài sản phòng.', 1;

        IF EXISTS (SELECT 1 FROM dbo.ChiTietBanGiao WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan)
           OR EXISTS (SELECT 1 FROM dbo.ChiTietHuHong WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan)
           OR EXISTS (SELECT 1 FROM dbo.YeuCauSuaChua WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan)
            THROW 51089, N'Không thể xóa tài sản đã phát sinh nghiệp vụ.', 1;

        DELETE FROM dbo.TaiSan WHERE MaPhong = @MaPhong AND MaTaiSan = @MaTaiSan;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa tài sản phòng',
            @DoiTuong = N'TaiSan',
            @MaDoiTuong = @MaTaiSan,
            @NoiDung = @MaPhong;

        SELECT CAST(1 AS BIT) AS daXoa, @MaPhong AS maPhong, @MaTaiSan AS maTaiSan;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyTaiSanPhong
        @ThaoTac = N'DANH_SACH',
        @MaPhong = @MaPhong,
        @MaTaiSan = @MaTaiSan;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_CauHinhQuyDinhHoanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_CauHinhQuyDinhHoanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_CauHinhQuyDinhHoanCoc
    @ThaoTac           NVARCHAR(20)  = N'DANH_SACH',
    @MaQuyDinhHoanCoc VARCHAR(6)    = NULL,
    @TenQuyDinh        NVARCHAR(255) = NULL,
    @TyLeHoanCoc       DECIMAL(5,2)  = NULL,
    @AdminId           VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaQuyDinhHoanCoc = NULLIF(LTRIM(RTRIM(@MaQuyDinhHoanCoc)), '');
    SET @TenQuyDinh = NULLIF(LTRIM(RTRIM(@TenQuyDinh)), N'');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            qh.MaQuyDinhHoanCoc AS maQuyDinhHoanCoc,
            qh.TenQuyDinh AS tenQuyDinh,
            qh.TyLeHoanCoc AS tyLeHoanCoc,
            COUNT(ds.MaQuyDinhHoanCoc) AS soLanApDung
        FROM dbo.QuyDinhHoanCoc AS qh
        LEFT JOIN dbo.DoiSoat AS ds ON ds.MaQuyDinhHoanCoc = qh.MaQuyDinhHoanCoc
        WHERE (@MaQuyDinhHoanCoc IS NULL OR qh.MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc)
        GROUP BY qh.MaQuyDinhHoanCoc, qh.TenQuyDinh, qh.TyLeHoanCoc
        ORDER BY qh.MaQuyDinhHoanCoc;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51091, N'Thao tác cấu hình quy định hoàn cọc không hợp lệ.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND (@TenQuyDinh IS NULL OR @TyLeHoanCoc IS NULL)
            THROW 51092, N'Vui lòng nhập tên quy định và tỷ lệ hoàn cọc.', 1;

        IF @TyLeHoanCoc IS NOT NULL AND (@TyLeHoanCoc < 0 OR @TyLeHoanCoc > 100)
            THROW 51093, N'Tỷ lệ hoàn cọc phải nằm trong khoảng 0 đến 100.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoQuyDinh INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaQuyDinhHoanCoc IS NULL
            BEGIN
                SELECT @SoQuyDinh = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaQuyDinhHoanCoc, 3, 4))), 0) + 1
                FROM dbo.QuyDinhHoanCoc WITH (UPDLOCK, HOLDLOCK)
                WHERE MaQuyDinhHoanCoc LIKE 'QH[0-9][0-9][0-9][0-9]';

                IF @SoQuyDinh > 9999
                    THROW 51094, N'Không thể sinh thêm mã quy định hoàn cọc mới.', 1;

                SET @MaQuyDinhHoanCoc = CONCAT('QH', RIGHT(CONCAT('0000', @SoQuyDinh), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc)
                THROW 51095, N'Mã quy định hoàn cọc đã tồn tại.', 1;

            INSERT INTO dbo.QuyDinhHoanCoc (MaQuyDinhHoanCoc, TenQuyDinh, TyLeHoanCoc)
            VALUES (@MaQuyDinhHoanCoc, @TenQuyDinh, @TyLeHoanCoc);

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo quy định hoàn cọc',
                @DoiTuong = N'QuyDinhHoanCoc',
                @MaDoiTuong = @MaQuyDinhHoanCoc,
                @NoiDung = @TenQuyDinh;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaQuyDinhHoanCoc IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc
        )
            THROW 51096, N'Không tìm thấy quy định hoàn cọc.', 1;

        DECLARE @DuLieuTruocHoanCoc NVARCHAR(MAX);
        SELECT @DuLieuTruocHoanCoc = (
            SELECT * FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.QuyDinhHoanCoc
        SET TenQuyDinh = ISNULL(@TenQuyDinh, TenQuyDinh),
            TyLeHoanCoc = ISNULL(@TyLeHoanCoc, TyLeHoanCoc)
        WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật quy định hoàn cọc',
            @DoiTuong = N'QuyDinhHoanCoc',
            @MaDoiTuong = @MaQuyDinhHoanCoc,
            @DuLieuTruoc = @DuLieuTruocHoanCoc;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaQuyDinhHoanCoc IS NULL OR NOT EXISTS (
            SELECT 1 FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc
        )
            THROW 51096, N'Không tìm thấy quy định hoàn cọc.', 1;

        IF EXISTS (SELECT 1 FROM dbo.DoiSoat WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc)
            THROW 51097, N'Không thể xóa quy định hoàn cọc đã phát sinh đối soát.', 1;

        DELETE FROM dbo.QuyDinhHoanCoc WHERE MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa quy định hoàn cọc',
            @DoiTuong = N'QuyDinhHoanCoc',
            @MaDoiTuong = @MaQuyDinhHoanCoc;

        SELECT CAST(1 AS BIT) AS daXoa, @MaQuyDinhHoanCoc AS maQuyDinhHoanCoc;
        RETURN;
    END;

    EXEC dbo.SP_Admin_CauHinhQuyDinhHoanCoc @ThaoTac = N'DANH_SACH', @MaQuyDinhHoanCoc = @MaQuyDinhHoanCoc;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyDichVu', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyDichVu AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyDichVu
    @ThaoTac   NVARCHAR(20)  = N'DANH_SACH',
    @MaDichVu  VARCHAR(6)    = NULL,
    @TenDichVu NVARCHAR(100) = NULL,
    @DonViTinh VARCHAR(20)   = NULL,
    @DonGia    DECIMAL(15,2) = NULL,
    @AdminId   VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaDichVu = NULLIF(LTRIM(RTRIM(@MaDichVu)), '');
    SET @TenDichVu = NULLIF(LTRIM(RTRIM(@TenDichVu)), N'');
    SET @DonViTinh = NULLIF(LTRIM(RTRIM(@DonViTinh)), '');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            dv.MaDichVu AS maDichVu,
            dv.TenDichVu AS tenDichVu,
            dv.DonViTinh AS donViTinh,
            dv.DonGia AS donGia,
            COUNT(DISTINCT dvhd.MaChiTietDVHD) AS soHopDongSuDung,
            COUNT(cthd.MaChiTietHD) AS soDongHoaDon
        FROM dbo.DichVu AS dv
        LEFT JOIN dbo.DichVuHopDong AS dvhd ON dvhd.MaDichVu = dv.MaDichVu
        LEFT JOIN dbo.ChiTietHoaDon AS cthd ON cthd.MaChiTietDVHD = dvhd.MaChiTietDVHD
        WHERE (@MaDichVu IS NULL OR dv.MaDichVu = @MaDichVu)
          AND (@TenDichVu IS NULL OR dv.TenDichVu LIKE N'%' + @TenDichVu + N'%')
        GROUP BY dv.MaDichVu, dv.TenDichVu, dv.DonViTinh, dv.DonGia
        ORDER BY dv.MaDichVu;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'XOA')
        THROW 51201, N'Thao tác quản lý dịch vụ không hợp lệ.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND (@TenDichVu IS NULL OR @DonViTinh IS NULL OR @DonGia IS NULL)
            THROW 51202, N'Vui lòng nhập tên dịch vụ, đơn vị tính và đơn giá.', 1;

        IF @DonGia IS NOT NULL AND @DonGia <= 0
            THROW 51203, N'Đơn giá dịch vụ phải lớn hơn 0.', 1;

        IF @TenDichVu IS NOT NULL AND EXISTS (
            SELECT 1
            FROM dbo.DichVu
            WHERE TenDichVu = @TenDichVu
              AND (@MaDichVu IS NULL OR MaDichVu <> @MaDichVu)
        )
            THROW 51204, N'Tên dịch vụ đã tồn tại.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoDichVu INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaDichVu IS NULL
            BEGIN
                SELECT @SoDichVu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDichVu, 3, 4))), 0) + 1
                FROM dbo.DichVu WITH (UPDLOCK, HOLDLOCK)
                WHERE MaDichVu LIKE 'DV[0-9][0-9][0-9][0-9]';

                IF @SoDichVu > 9999
                    THROW 51205, N'Không thể sinh thêm mã dịch vụ mới.', 1;

                SET @MaDichVu = CONCAT('DV', RIGHT(CONCAT('0000', @SoDichVu), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.DichVu WHERE MaDichVu = @MaDichVu)
                THROW 51206, N'Mã dịch vụ đã tồn tại.', 1;

            INSERT INTO dbo.DichVu (MaDichVu, TenDichVu, DonViTinh, DonGia)
            VALUES (@MaDichVu, @TenDichVu, @DonViTinh, @DonGia);

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo dịch vụ',
                @DoiTuong = N'DichVu',
                @MaDoiTuong = @MaDichVu,
                @NoiDung = @TenDichVu;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaDichVu IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.DichVu WHERE MaDichVu = @MaDichVu)
            THROW 51207, N'Không tìm thấy dịch vụ.', 1;

        DECLARE @DuLieuTruocDichVu NVARCHAR(MAX);
        SELECT @DuLieuTruocDichVu = (
            SELECT * FROM dbo.DichVu WHERE MaDichVu = @MaDichVu FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.DichVu
        SET TenDichVu = ISNULL(@TenDichVu, TenDichVu),
            DonViTinh = ISNULL(@DonViTinh, DonViTinh),
            DonGia = ISNULL(@DonGia, DonGia)
        WHERE MaDichVu = @MaDichVu;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật dịch vụ',
            @DoiTuong = N'DichVu',
            @MaDoiTuong = @MaDichVu,
            @DuLieuTruoc = @DuLieuTruocDichVu;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaDichVu IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.DichVu WHERE MaDichVu = @MaDichVu)
            THROW 51207, N'Không tìm thấy dịch vụ.', 1;

        IF EXISTS (SELECT 1 FROM dbo.DichVuHopDong WHERE MaDichVu = @MaDichVu)
            THROW 51208, N'Không thể xóa dịch vụ đã phát sinh hợp đồng hoặc hóa đơn.', 1;

        DELETE FROM dbo.DichVu WHERE MaDichVu = @MaDichVu;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa dịch vụ',
            @DoiTuong = N'DichVu',
            @MaDoiTuong = @MaDichVu;

        SELECT CAST(1 AS BIT) AS daXoa, @MaDichVu AS maDichVu;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyDichVu @ThaoTac = N'DANH_SACH', @MaDichVu = @MaDichVu;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyNoiQuy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyNoiQuy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyNoiQuy
    @ThaoTac      NVARCHAR(20)  = N'DANH_SACH',
    @MaQuyDinh    VARCHAR(6)    = NULL,
    @TieuDeNoiQuy NVARCHAR(255) = NULL,
    @NoiDung      NVARCHAR(MAX) = NULL,
    @TrangThai    NVARCHAR(20)  = NULL,
    @AdminId      VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaQuyDinh = NULLIF(LTRIM(RTRIM(@MaQuyDinh)), '');
    SET @TieuDeNoiQuy = NULLIF(LTRIM(RTRIM(@TieuDeNoiQuy)), N'');
    SET @TrangThai = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            qd.MaQuyDinh AS maQuyDinh,
            qd.TieuDeNoiQuy AS tieuDeNoiQuy,
            qd.NoiDung AS noiDung,
            qd.TrangThai AS trangThai
        FROM dbo.QuiDinh AS qd
        WHERE (@MaQuyDinh IS NULL OR qd.MaQuyDinh = @MaQuyDinh)
          AND (@TrangThai IS NULL OR qd.TrangThai = @TrangThai)
          AND (@TieuDeNoiQuy IS NULL OR qd.TieuDeNoiQuy LIKE N'%' + @TieuDeNoiQuy + N'%')
        ORDER BY qd.MaQuyDinh;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'VO_HIEU', N'XOA')
        THROW 51221, N'Thao tác quản lý nội quy không hợp lệ.', 1;

    IF @TrangThai IS NOT NULL AND @TrangThai NOT IN (N'Hiệu lực', N'Hết hiệu lực')
        THROW 51222, N'Trạng thái nội quy không hợp lệ.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND @TieuDeNoiQuy IS NULL
            THROW 51223, N'Vui lòng nhập tiêu đề nội quy.', 1;

        IF @TieuDeNoiQuy IS NOT NULL AND EXISTS (
            SELECT 1
            FROM dbo.QuiDinh
            WHERE TieuDeNoiQuy = @TieuDeNoiQuy
              AND (@MaQuyDinh IS NULL OR MaQuyDinh <> @MaQuyDinh)
        )
            THROW 51224, N'Tiêu đề nội quy đã tồn tại.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoQuyDinhNoiQuy INT;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaQuyDinh IS NULL
            BEGIN
                SELECT @SoQuyDinhNoiQuy = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaQuyDinh, 3, 4))), 0) + 1
                FROM dbo.QuiDinh WITH (UPDLOCK, HOLDLOCK)
                WHERE MaQuyDinh LIKE 'QD[0-9][0-9][0-9][0-9]';

                IF @SoQuyDinhNoiQuy > 9999
                    THROW 51225, N'Không thể sinh thêm mã nội quy mới.', 1;

                SET @MaQuyDinh = CONCAT('QD', RIGHT(CONCAT('0000', @SoQuyDinhNoiQuy), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.QuiDinh WHERE MaQuyDinh = @MaQuyDinh)
                THROW 51226, N'Mã nội quy đã tồn tại.', 1;

            INSERT INTO dbo.QuiDinh (MaQuyDinh, TieuDeNoiQuy, NoiDung, TrangThai)
            VALUES (@MaQuyDinh, @TieuDeNoiQuy, @NoiDung, ISNULL(@TrangThai, N'Hiệu lực'));

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo nội quy',
                @DoiTuong = N'QuiDinh',
                @MaDoiTuong = @MaQuyDinh,
                @NoiDung = @TieuDeNoiQuy;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaQuyDinh IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.QuiDinh WHERE MaQuyDinh = @MaQuyDinh)
            THROW 51227, N'Không tìm thấy nội quy.', 1;

        DECLARE @DuLieuTruocNoiQuy NVARCHAR(MAX);
        SELECT @DuLieuTruocNoiQuy = (
            SELECT * FROM dbo.QuiDinh WHERE MaQuyDinh = @MaQuyDinh FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.QuiDinh
        SET TieuDeNoiQuy = ISNULL(@TieuDeNoiQuy, TieuDeNoiQuy),
            NoiDung = ISNULL(@NoiDung, NoiDung),
            TrangThai = ISNULL(@TrangThai, TrangThai)
        WHERE MaQuyDinh = @MaQuyDinh;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật nội quy',
            @DoiTuong = N'QuiDinh',
            @MaDoiTuong = @MaQuyDinh,
            @DuLieuTruoc = @DuLieuTruocNoiQuy;
    END
    ELSE IF @ThaoTac = N'VO_HIEU'
    BEGIN
        IF @MaQuyDinh IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.QuiDinh WHERE MaQuyDinh = @MaQuyDinh)
            THROW 51227, N'Không tìm thấy nội quy.', 1;

        UPDATE dbo.QuiDinh
        SET TrangThai = N'Hết hiệu lực'
        WHERE MaQuyDinh = @MaQuyDinh;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Vô hiệu hóa nội quy',
            @DoiTuong = N'QuiDinh',
            @MaDoiTuong = @MaQuyDinh;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaQuyDinh IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.QuiDinh WHERE MaQuyDinh = @MaQuyDinh)
            THROW 51227, N'Không tìm thấy nội quy.', 1;

        DELETE FROM dbo.QuiDinh WHERE MaQuyDinh = @MaQuyDinh;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa nội quy',
            @DoiTuong = N'QuiDinh',
            @MaDoiTuong = @MaQuyDinh;

        SELECT CAST(1 AS BIT) AS daXoa, @MaQuyDinh AS maQuyDinh;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyNoiQuy @ThaoTac = N'DANH_SACH', @MaQuyDinh = @MaQuyDinh;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_QuanLyDieuKhoanViPham', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_QuanLyDieuKhoanViPham AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_QuanLyDieuKhoanViPham
    @ThaoTac        NVARCHAR(20)  = N'DANH_SACH',
    @MaDieuKhoan    VARCHAR(6)    = NULL,
    @TenDieuKhoan   NVARCHAR(255) = NULL,
    @HinhThucXuPhat NVARCHAR(20)  = NULL,
    @MucPhat        DECIMAL(15,2) = NULL,
    @TrangThai      NVARCHAR(20)  = NULL,
    @AdminId        VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaDieuKhoan = NULLIF(LTRIM(RTRIM(@MaDieuKhoan)), '');
    SET @TenDieuKhoan = NULLIF(LTRIM(RTRIM(@TenDieuKhoan)), N'');
    SET @HinhThucXuPhat = NULLIF(LTRIM(RTRIM(@HinhThucXuPhat)), N'');
    SET @TrangThai = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            dk.MaDieuKhoan AS maDieuKhoan,
            dk.TenDieuKhoan AS tenDieuKhoan,
            dk.HinhThucXuPhat AS hinhThucXuPhat,
            dk.MucPhat AS mucPhat,
            dk.TrangThai AS trangThai,
            COUNT(bb.MaBBViPham) AS soBienBanApDung
        FROM dbo.DieuKhoanViPham AS dk
        LEFT JOIN dbo.BienBanViPham AS bb ON bb.MaDieuKhoan = dk.MaDieuKhoan
        WHERE (@MaDieuKhoan IS NULL OR dk.MaDieuKhoan = @MaDieuKhoan)
          AND (@TrangThai IS NULL OR dk.TrangThai = @TrangThai)
          AND (@TenDieuKhoan IS NULL OR dk.TenDieuKhoan LIKE N'%' + @TenDieuKhoan + N'%')
        GROUP BY dk.MaDieuKhoan, dk.TenDieuKhoan, dk.HinhThucXuPhat, dk.MucPhat, dk.TrangThai
        ORDER BY dk.MaDieuKhoan;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT', N'VO_HIEU', N'XOA')
        THROW 51241, N'Thao tác quản lý điều khoản vi phạm không hợp lệ.', 1;

    IF @HinhThucXuPhat IS NOT NULL AND @HinhThucXuPhat NOT IN (N'Nhắc nhở', N'Phạt tiền')
        THROW 51242, N'Hình thức xử phạt không hợp lệ.', 1;

    IF @TrangThai IS NOT NULL AND @TrangThai NOT IN (N'Hiệu lực', N'Hết hiệu lực')
        THROW 51243, N'Trạng thái điều khoản vi phạm không hợp lệ.', 1;

    IF @MucPhat IS NOT NULL AND @MucPhat < 0
        THROW 51244, N'Mức phạt không được âm.', 1;

    IF @ThaoTac IN (N'TAO', N'CAP_NHAT')
    BEGIN
        IF @ThaoTac = N'TAO' AND (@TenDieuKhoan IS NULL OR @HinhThucXuPhat IS NULL)
            THROW 51245, N'Vui lòng nhập tên điều khoản và hình thức xử phạt.', 1;

        IF @TenDieuKhoan IS NOT NULL AND EXISTS (
            SELECT 1
            FROM dbo.DieuKhoanViPham
            WHERE TenDieuKhoan = @TenDieuKhoan
              AND (@MaDieuKhoan IS NULL OR MaDieuKhoan <> @MaDieuKhoan)
        )
            THROW 51246, N'Tên điều khoản vi phạm đã tồn tại.', 1;
    END;

    IF @ThaoTac = N'TAO'
    BEGIN
        DECLARE @SoDieuKhoan INT;

        IF @HinhThucXuPhat = N'Phạt tiền' AND ISNULL(@MucPhat, 0) <= 0
            THROW 51247, N'Điều khoản phạt tiền phải có mức phạt lớn hơn 0.', 1;

        IF @HinhThucXuPhat = N'Nhắc nhở' AND @MucPhat IS NULL
            SET @MucPhat = 0;

        BEGIN TRY
            BEGIN TRANSACTION;

            IF @MaDieuKhoan IS NULL
            BEGIN
                SELECT @SoDieuKhoan = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaDieuKhoan, 3, 4))), 0) + 1
                FROM dbo.DieuKhoanViPham WITH (UPDLOCK, HOLDLOCK)
                WHERE MaDieuKhoan LIKE 'VP[0-9][0-9][0-9][0-9]';

                IF @SoDieuKhoan > 9999
                    THROW 51248, N'Không thể sinh thêm mã điều khoản vi phạm mới.', 1;

                SET @MaDieuKhoan = CONCAT('VP', RIGHT(CONCAT('0000', @SoDieuKhoan), 4));
            END;

            IF EXISTS (SELECT 1 FROM dbo.DieuKhoanViPham WHERE MaDieuKhoan = @MaDieuKhoan)
                THROW 51249, N'Mã điều khoản vi phạm đã tồn tại.', 1;

            INSERT INTO dbo.DieuKhoanViPham (
                MaDieuKhoan, TenDieuKhoan, HinhThucXuPhat, MucPhat, TrangThai
            )
            VALUES (
                @MaDieuKhoan, @TenDieuKhoan, @HinhThucXuPhat, ISNULL(@MucPhat, 0), ISNULL(@TrangThai, N'Hiệu lực')
            );

            EXEC dbo.SP_Admin_GhiNhatKy
                @AdminId = @AdminId,
                @HanhDong = N'Tạo điều khoản vi phạm',
                @DoiTuong = N'DieuKhoanViPham',
                @MaDoiTuong = @MaDieuKhoan,
                @NoiDung = @TenDieuKhoan;

            COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            IF XACT_STATE() <> 0
                ROLLBACK TRANSACTION;
            THROW;
        END CATCH;
    END
    ELSE IF @ThaoTac = N'CAP_NHAT'
    BEGIN
        IF @MaDieuKhoan IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.DieuKhoanViPham WHERE MaDieuKhoan = @MaDieuKhoan)
            THROW 51250, N'Không tìm thấy điều khoản vi phạm.', 1;

        DECLARE @HinhThucSau NVARCHAR(20);
        DECLARE @MucPhatSau DECIMAL(15,2);

        SELECT
            @HinhThucSau = ISNULL(@HinhThucXuPhat, HinhThucXuPhat),
            @MucPhatSau = ISNULL(@MucPhat, MucPhat)
        FROM dbo.DieuKhoanViPham
        WHERE MaDieuKhoan = @MaDieuKhoan;

        IF @HinhThucSau = N'Phạt tiền' AND ISNULL(@MucPhatSau, 0) <= 0
            THROW 51247, N'Điều khoản phạt tiền phải có mức phạt lớn hơn 0.', 1;

        IF @HinhThucSau = N'Nhắc nhở' AND @MucPhatSau IS NULL
            SET @MucPhatSau = 0;

        DECLARE @DuLieuTruocDieuKhoan NVARCHAR(MAX);
        SELECT @DuLieuTruocDieuKhoan = (
            SELECT * FROM dbo.DieuKhoanViPham WHERE MaDieuKhoan = @MaDieuKhoan FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.DieuKhoanViPham
        SET TenDieuKhoan = ISNULL(@TenDieuKhoan, TenDieuKhoan),
            HinhThucXuPhat = @HinhThucSau,
            MucPhat = @MucPhatSau,
            TrangThai = ISNULL(@TrangThai, TrangThai)
        WHERE MaDieuKhoan = @MaDieuKhoan;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật điều khoản vi phạm',
            @DoiTuong = N'DieuKhoanViPham',
            @MaDoiTuong = @MaDieuKhoan,
            @DuLieuTruoc = @DuLieuTruocDieuKhoan;
    END
    ELSE IF @ThaoTac = N'VO_HIEU'
    BEGIN
        IF @MaDieuKhoan IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.DieuKhoanViPham WHERE MaDieuKhoan = @MaDieuKhoan)
            THROW 51250, N'Không tìm thấy điều khoản vi phạm.', 1;

        UPDATE dbo.DieuKhoanViPham
        SET TrangThai = N'Hết hiệu lực'
        WHERE MaDieuKhoan = @MaDieuKhoan;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Vô hiệu hóa điều khoản vi phạm',
            @DoiTuong = N'DieuKhoanViPham',
            @MaDoiTuong = @MaDieuKhoan;
    END
    ELSE IF @ThaoTac = N'XOA'
    BEGIN
        IF @MaDieuKhoan IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.DieuKhoanViPham WHERE MaDieuKhoan = @MaDieuKhoan)
            THROW 51250, N'Không tìm thấy điều khoản vi phạm.', 1;

        IF EXISTS (SELECT 1 FROM dbo.BienBanViPham WHERE MaDieuKhoan = @MaDieuKhoan)
            THROW 51251, N'Không thể xóa điều khoản đã phát sinh biên bản vi phạm.', 1;

        DELETE FROM dbo.DieuKhoanViPham WHERE MaDieuKhoan = @MaDieuKhoan;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Xóa điều khoản vi phạm',
            @DoiTuong = N'DieuKhoanViPham',
            @MaDoiTuong = @MaDieuKhoan;

        SELECT CAST(1 AS BIT) AS daXoa, @MaDieuKhoan AS maDieuKhoan;
        RETURN;
    END;

    EXEC dbo.SP_Admin_QuanLyDieuKhoanViPham @ThaoTac = N'DANH_SACH', @MaDieuKhoan = @MaDieuKhoan;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_CauHinhThamSo', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_CauHinhThamSo AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_CauHinhThamSo
    @ThaoTac    NVARCHAR(20)  = N'DANH_SACH',
    @MaThamSo   VARCHAR(50)   = NULL,
    @NhomThamSo NVARCHAR(50)  = NULL,
    @TenThamSo  NVARCHAR(100) = NULL,
    @GiaTri     NVARCHAR(255) = NULL,
    @KieuDuLieu NVARCHAR(20)  = NULL,
    @DonViTinh  NVARCHAR(30)  = NULL,
    @MoTa       NVARCHAR(MAX) = NULL,
    @AdminId    VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ThaoTac = UPPER(NULLIF(LTRIM(RTRIM(@ThaoTac)), N''));
    SET @MaThamSo = NULLIF(LTRIM(RTRIM(@MaThamSo)), '');
    SET @NhomThamSo = NULLIF(LTRIM(RTRIM(@NhomThamSo)), N'');
    SET @TenThamSo = NULLIF(LTRIM(RTRIM(@TenThamSo)), N'');
    SET @GiaTri = NULLIF(LTRIM(RTRIM(@GiaTri)), N'');
    SET @KieuDuLieu = NULLIF(LTRIM(RTRIM(@KieuDuLieu)), N'');
    SET @DonViTinh = NULLIF(LTRIM(RTRIM(@DonViTinh)), N'');
    IF @ThaoTac IS NULL SET @ThaoTac = N'DANH_SACH';

    IF @ThaoTac = N'DANH_SACH'
    BEGIN
        SELECT
            MaThamSo AS maThamSo,
            NhomThamSo AS nhomThamSo,
            TenThamSo AS tenThamSo,
            GiaTri AS giaTri,
            KieuDuLieu AS kieuDuLieu,
            DonViTinh AS donViTinh,
            MoTa AS moTa,
            CapNhatLuc AS capNhatLuc,
            CapNhatBoi AS capNhatBoi
        FROM dbo.ThamSoHeThong
        WHERE (@MaThamSo IS NULL OR MaThamSo = @MaThamSo)
          AND (@NhomThamSo IS NULL OR NhomThamSo = @NhomThamSo)
        ORDER BY NhomThamSo, MaThamSo;
        RETURN;
    END;

    IF @ThaoTac NOT IN (N'TAO', N'CAP_NHAT')
        THROW 51261, N'Thao tác cấu hình tham số không hợp lệ.', 1;

    IF @ThaoTac = N'TAO' AND (@MaThamSo IS NULL OR @NhomThamSo IS NULL OR @TenThamSo IS NULL OR @GiaTri IS NULL)
        THROW 51262, N'Vui lòng nhập đủ mã, nhóm, tên và giá trị tham số.', 1;

    IF @MaThamSo IS NULL
        THROW 51263, N'Mã tham số không hợp lệ.', 1;

    IF @KieuDuLieu IS NOT NULL AND @KieuDuLieu NOT IN (N'Chuỗi', N'Số', N'Ngày', N'Boolean')
        THROW 51264, N'Kiểu dữ liệu tham số không hợp lệ.', 1;

    DECLARE @KieuDuLieuSau NVARCHAR(20);
    DECLARE @GiaTriSau NVARCHAR(255);

    IF @ThaoTac = N'TAO'
    BEGIN
        SET @KieuDuLieuSau = ISNULL(@KieuDuLieu, N'Chuỗi');
        SET @GiaTriSau = @GiaTri;
    END
    ELSE
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.ThamSoHeThong WHERE MaThamSo = @MaThamSo)
            THROW 51265, N'Không tìm thấy tham số hệ thống.', 1;

        SELECT
            @KieuDuLieuSau = ISNULL(@KieuDuLieu, KieuDuLieu),
            @GiaTriSau = ISNULL(@GiaTri, GiaTri)
        FROM dbo.ThamSoHeThong
        WHERE MaThamSo = @MaThamSo;
    END;

    IF @KieuDuLieuSau = N'Số' AND (TRY_CONVERT(DECIMAL(18,2), @GiaTriSau) IS NULL OR TRY_CONVERT(DECIMAL(18,2), @GiaTriSau) < 0)
        THROW 51266, N'Giá trị tham số kiểu số không hợp lệ.', 1;

    IF @MaThamSo = 'THOI_HAN_THANH_TOAN_COC_GIO'
       AND (TRY_CONVERT(INT, @GiaTriSau) IS NULL OR TRY_CONVERT(INT, @GiaTriSau) <= 0)
        THROW 51267, N'Thời hạn thanh toán cọc phải là số giờ lớn hơn 0.', 1;

    IF @ThaoTac = N'TAO'
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.ThamSoHeThong WHERE MaThamSo = @MaThamSo)
            THROW 51268, N'Mã tham số đã tồn tại.', 1;

        INSERT INTO dbo.ThamSoHeThong (
            MaThamSo, NhomThamSo, TenThamSo, GiaTri, KieuDuLieu, DonViTinh, MoTa, CapNhatBoi
        )
        VALUES (
            @MaThamSo, @NhomThamSo, @TenThamSo, @GiaTriSau, @KieuDuLieuSau, @DonViTinh, @MoTa, @AdminId
        );

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Tạo tham số hệ thống',
            @DoiTuong = N'ThamSoHeThong',
            @MaDoiTuong = @MaThamSo,
            @NoiDung = @TenThamSo;
    END
    ELSE
    BEGIN
        DECLARE @DuLieuTruocThamSo NVARCHAR(MAX);
        SELECT @DuLieuTruocThamSo = (
            SELECT * FROM dbo.ThamSoHeThong WHERE MaThamSo = @MaThamSo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        UPDATE dbo.ThamSoHeThong
        SET NhomThamSo = ISNULL(@NhomThamSo, NhomThamSo),
            TenThamSo = ISNULL(@TenThamSo, TenThamSo),
            GiaTri = @GiaTriSau,
            KieuDuLieu = @KieuDuLieuSau,
            DonViTinh = ISNULL(@DonViTinh, DonViTinh),
            MoTa = ISNULL(@MoTa, MoTa),
            CapNhatLuc = SYSDATETIME(),
            CapNhatBoi = @AdminId
        WHERE MaThamSo = @MaThamSo;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Cập nhật tham số hệ thống',
            @DoiTuong = N'ThamSoHeThong',
            @MaDoiTuong = @MaThamSo,
            @DuLieuTruoc = @DuLieuTruocThamSo;
    END;

    EXEC dbo.SP_Admin_CauHinhThamSo @ThaoTac = N'DANH_SACH', @MaThamSo = @MaThamSo;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_CauHinhSaoLuu', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_CauHinhSaoLuu AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_CauHinhSaoLuu
    @ChuKyFull        NVARCHAR(20)  = NULL,
    @ChuKyIncremental NVARCHAR(20)  = NULL,
    @ThuMucLuuTru     NVARCHAR(500) = NULL,
    @AdminId          VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @ChuKyFull = NULLIF(LTRIM(RTRIM(@ChuKyFull)), N'');
    SET @ChuKyIncremental = NULLIF(LTRIM(RTRIM(@ChuKyIncremental)), N'');
    SET @ThuMucLuuTru = NULLIF(LTRIM(RTRIM(@ThuMucLuuTru)), N'');

    IF @ChuKyFull IS NOT NULL AND @ChuKyFull NOT IN (N'Hàng tuần', N'Hàng tháng')
        THROW 51281, N'Chu kỳ sao lưu full không hợp lệ.', 1;

    IF @ChuKyIncremental IS NOT NULL AND @ChuKyIncremental NOT IN (N'Hàng ngày', N'Hàng tuần')
        THROW 51282, N'Chu kỳ sao lưu incremental không hợp lệ.', 1;

    IF @ThuMucLuuTru IS NOT NULL
    BEGIN
        SET @ThuMucLuuTru = REPLACE(@ThuMucLuuTru, '/', '\');
        WHILE RIGHT(@ThuMucLuuTru, 1) = '\'
            SET @ThuMucLuuTru = LEFT(@ThuMucLuuTru, LEN(@ThuMucLuuTru) - 1);
    END;

    IF @ChuKyFull IS NULL AND @ChuKyIncremental IS NULL AND @ThuMucLuuTru IS NULL
    BEGIN
        SELECT
            MaCauHinh AS maCauHinh,
            ChuKyFull AS chuKyFull,
            ChuKyIncremental AS chuKyIncremental,
            ThuMucLuuTru AS thuMucLuuTru,
            CapNhatLuc AS capNhatLuc,
            CapNhatBoi AS capNhatBoi
        FROM dbo.CauHinhSaoLuu
        WHERE MaCauHinh = 1;
        RETURN;
    END;

    DECLARE @DuLieuTruocSaoLuu NVARCHAR(MAX);
    SELECT @DuLieuTruocSaoLuu = (
        SELECT * FROM dbo.CauHinhSaoLuu WHERE MaCauHinh = 1 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.CauHinhSaoLuu
    SET ChuKyFull = ISNULL(@ChuKyFull, ChuKyFull),
        ChuKyIncremental = ISNULL(@ChuKyIncremental, ChuKyIncremental),
        ThuMucLuuTru = ISNULL(@ThuMucLuuTru, ThuMucLuuTru),
        CapNhatLuc = SYSDATETIME(),
        CapNhatBoi = @AdminId
    WHERE MaCauHinh = 1;

    EXEC dbo.SP_Admin_GhiNhatKy
        @AdminId = @AdminId,
        @HanhDong = N'Cấu hình sao lưu',
        @DoiTuong = N'CauHinhSaoLuu',
        @MaDoiTuong = N'1',
        @DuLieuTruoc = @DuLieuTruocSaoLuu;

    SELECT
        MaCauHinh AS maCauHinh,
        ChuKyFull AS chuKyFull,
        ChuKyIncremental AS chuKyIncremental,
        ThuMucLuuTru AS thuMucLuuTru,
        CapNhatLuc AS capNhatLuc,
        CapNhatBoi AS capNhatBoi
    FROM dbo.CauHinhSaoLuu
    WHERE MaCauHinh = 1;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_SaoLuuThuCong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_SaoLuuThuCong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_SaoLuuThuCong
    @LoaiSaoLuu  NVARCHAR(20)  = N'Full',
    @DuongDanFile NVARCHAR(500) = NULL,
    @AdminId      VARCHAR(6)    = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @LoaiSaoLuu = NULLIF(LTRIM(RTRIM(@LoaiSaoLuu)), N'');
    SET @DuongDanFile = NULLIF(LTRIM(RTRIM(@DuongDanFile)), N'');
    IF @LoaiSaoLuu IS NULL SET @LoaiSaoLuu = N'Full';

    DECLARE @LoaiSaoLuuChuan NVARCHAR(20) = UPPER(@LoaiSaoLuu);
    IF @LoaiSaoLuuChuan = N'FULL'
        SET @LoaiSaoLuu = N'Full';
    ELSE IF @LoaiSaoLuuChuan IN (N'INCREMENTAL', N'DIFFERENTIAL')
        SET @LoaiSaoLuu = N'Incremental';

    IF @LoaiSaoLuu NOT IN (N'Full', N'Incremental')
        THROW 51291, N'Loại sao lưu chỉ hỗ trợ Full hoặc Incremental.', 1;

    IF @DuongDanFile IS NULL
    BEGIN
        DECLARE @ThuMucLuuTru NVARCHAR(500);
        SELECT @ThuMucLuuTru = ThuMucLuuTru
        FROM dbo.CauHinhSaoLuu
        WHERE MaCauHinh = 1;

        IF @ThuMucLuuTru IS NULL
            THROW 51292, N'Chưa cấu hình thư mục lưu trữ sao lưu.', 1;

        SET @ThuMucLuuTru = REPLACE(@ThuMucLuuTru, '/', '\');
        WHILE RIGHT(@ThuMucLuuTru, 1) = '\'
            SET @ThuMucLuuTru = LEFT(@ThuMucLuuTru, LEN(@ThuMucLuuTru) - 1);

        SET @DuongDanFile =
            @ThuMucLuuTru + N'\' + DB_NAME() + N'_' + @LoaiSaoLuu + N'_' +
            CONVERT(CHAR(8), GETDATE(), 112) + REPLACE(CONVERT(CHAR(8), GETDATE(), 108), ':', '') + N'.bak';
    END;

    DECLARE @MaSaoLuu INT;
    DECLARE @LenhSaoLuu NVARCHAR(MAX);

    INSERT INTO dbo.LichSuSaoLuu (
        LoaiSaoLuu, DuongDanFile, TrangThai, ThoiGianBatDau, MaNguoiDung
    )
    VALUES (
        @LoaiSaoLuu, @DuongDanFile, N'Đang chạy', SYSDATETIME(), @AdminId
    );

    SET @MaSaoLuu = SCOPE_IDENTITY();
    SET @LenhSaoLuu =
        N'BACKUP DATABASE ' + QUOTENAME(DB_NAME()) +
        N' TO DISK = N''' + REPLACE(@DuongDanFile, '''', '''''') +
        N''' WITH ' +
        CASE WHEN @LoaiSaoLuu = N'Incremental' THEN N'DIFFERENTIAL, INIT' ELSE N'INIT' END +
        N';';

    BEGIN TRY
        EXEC(@LenhSaoLuu);

        UPDATE dbo.LichSuSaoLuu
        SET TrangThai = N'Thành công',
            ThoiGianKetThuc = SYSDATETIME(),
            ThongBao = N'Sao lưu hoàn tất.'
        WHERE MaSaoLuu = @MaSaoLuu;

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Sao lưu thủ công',
            @DoiTuong = N'LichSuSaoLuu',
            @MaDoiTuong = @MaSaoLuu,
            @NoiDung = @DuongDanFile;
    END TRY
    BEGIN CATCH
        UPDATE dbo.LichSuSaoLuu
        SET TrangThai = N'Thất bại',
            ThoiGianKetThuc = SYSDATETIME(),
            ThongBao = ERROR_MESSAGE()
        WHERE MaSaoLuu = @MaSaoLuu;

        THROW;
    END CATCH;

    SELECT
        MaSaoLuu AS maSaoLuu,
        LoaiSaoLuu AS loaiSaoLuu,
        DuongDanFile AS duongDanFile,
        TrangThai AS trangThai,
        ThoiGianBatDau AS thoiGianBatDau,
        ThoiGianKetThuc AS thoiGianKetThuc,
        ThongBao AS thongBao
    FROM dbo.LichSuSaoLuu
    WHERE MaSaoLuu = @MaSaoLuu;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_DanhSachSaoLuu', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_DanhSachSaoLuu AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_DanhSachSaoLuu
    @SoDong     INT          = 100,
    @TrangThai  NVARCHAR(20) = NULL,
    @LoaiSaoLuu NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @TrangThai = NULLIF(LTRIM(RTRIM(@TrangThai)), N'');
    SET @LoaiSaoLuu = NULLIF(LTRIM(RTRIM(@LoaiSaoLuu)), N'');

    IF @SoDong IS NULL OR @SoDong < 1 OR @SoDong > 1000
        SET @SoDong = 100;

    SELECT TOP (@SoDong)
        ls.MaSaoLuu AS maSaoLuu,
        ls.LoaiSaoLuu AS loaiSaoLuu,
        ls.DuongDanFile AS duongDanFile,
        ls.DungLuongByte AS dungLuongByte,
        ls.TrangThai AS trangThai,
        ls.ThoiGianBatDau AS thoiGianBatDau,
        ls.ThoiGianKetThuc AS thoiGianKetThuc,
        ls.ThongBao AS thongBao,
        ls.MaNguoiDung AS maNguoiDung,
        nd.HoTen AS hoTenNguoiDung
    FROM dbo.LichSuSaoLuu AS ls
    LEFT JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = ls.MaNguoiDung
    WHERE (@TrangThai IS NULL OR ls.TrangThai = @TrangThai)
      AND (@LoaiSaoLuu IS NULL OR ls.LoaiSaoLuu = @LoaiSaoLuu)
    ORDER BY ls.ThoiGianBatDau DESC, ls.MaSaoLuu DESC;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_PhucHoiDuLieu', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_PhucHoiDuLieu AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_PhucHoiDuLieu
    @MaSaoLuu    INT           = NULL,
    @DuongDanFile NVARCHAR(500) = NULL,
    @AdminId      VARCHAR(6)    = NULL,
    @ChiTaoLenh   BIT           = 1
AS
BEGIN
    SET NOCOUNT ON;

    SET @DuongDanFile = NULLIF(LTRIM(RTRIM(@DuongDanFile)), N'');

    IF @DuongDanFile IS NULL AND @MaSaoLuu IS NOT NULL
    BEGIN
        SELECT @DuongDanFile = DuongDanFile
        FROM dbo.LichSuSaoLuu
        WHERE MaSaoLuu = @MaSaoLuu
          AND TrangThai = N'Thành công';
    END;

    IF @DuongDanFile IS NULL
        THROW 51301, N'Vui lòng chọn bản sao lưu thành công hoặc nhập đường dẫn file backup.', 1;

    DECLARE @TenDatabase SYSNAME = DB_NAME();
    DECLARE @LenhSingleUser NVARCHAR(MAX);
    DECLARE @LenhRestore NVARCHAR(MAX);
    DECLARE @LenhMultiUser NVARCHAR(MAX);
    DECLARE @LenhDayDu NVARCHAR(MAX);

    SET @LenhSingleUser = N'USE [master]; ALTER DATABASE ' + QUOTENAME(@TenDatabase) + N' SET SINGLE_USER WITH ROLLBACK IMMEDIATE;';
    SET @LenhRestore = N'USE [master]; RESTORE DATABASE ' + QUOTENAME(@TenDatabase) +
        N' FROM DISK = N''' + REPLACE(@DuongDanFile, '''', '''''') + N''' WITH REPLACE;';
    SET @LenhMultiUser = N'USE [master]; ALTER DATABASE ' + QUOTENAME(@TenDatabase) + N' SET MULTI_USER;';
    SET @LenhDayDu = @LenhSingleUser + CHAR(13) + CHAR(10) + @LenhRestore + CHAR(13) + CHAR(10) + @LenhMultiUser;

    IF @ChiTaoLenh = 1
    BEGIN
        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Tạo lệnh phục hồi dữ liệu',
            @DoiTuong = N'LichSuSaoLuu',
            @MaDoiTuong = @MaSaoLuu,
            @NoiDung = @DuongDanFile;

        SELECT
            @TenDatabase AS tenDatabase,
            @DuongDanFile AS duongDanFile,
            @LenhDayDu AS lenhPhucHoi,
            CAST(1 AS BIT) AS chiTaoLenh;
        RETURN;
    END;

    BEGIN TRY
        EXEC(@LenhSingleUser);
        EXEC(@LenhRestore);
        EXEC(@LenhMultiUser);

        EXEC dbo.SP_Admin_GhiNhatKy
            @AdminId = @AdminId,
            @HanhDong = N'Phục hồi dữ liệu',
            @DoiTuong = N'LichSuSaoLuu',
            @MaDoiTuong = @MaSaoLuu,
            @NoiDung = @DuongDanFile;
    END TRY
    BEGIN CATCH
        BEGIN TRY
            EXEC(@LenhMultiUser);
        END TRY
        BEGIN CATCH
        END CATCH;

        THROW;
    END CATCH;

    SELECT
        @TenDatabase AS tenDatabase,
        @DuongDanFile AS duongDanFile,
        CAST(1 AS BIT) AS daPhucHoi;
END;
GO

IF OBJECT_ID(N'dbo.SP_Admin_XemNhatKyHeThong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_Admin_XemNhatKyHeThong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_Admin_XemNhatKyHeThong
    @TuNgay     DATETIME2(0)  = NULL,
    @DenNgay    DATETIME2(0)  = NULL,
    @AdminId    VARCHAR(6)    = NULL,
    @DoiTuong   NVARCHAR(100) = NULL,
    @HanhDong   NVARCHAR(100) = NULL,
    @TuKhoa     NVARCHAR(100) = NULL,
    @SoDong     INT           = 200
AS
BEGIN
    SET NOCOUNT ON;

    SET @AdminId = NULLIF(LTRIM(RTRIM(@AdminId)), '');
    SET @DoiTuong = NULLIF(LTRIM(RTRIM(@DoiTuong)), N'');
    SET @HanhDong = NULLIF(LTRIM(RTRIM(@HanhDong)), N'');
    SET @TuKhoa = NULLIF(LTRIM(RTRIM(@TuKhoa)), N'');

    IF @SoDong IS NULL OR @SoDong < 1 OR @SoDong > 1000
        SET @SoDong = 200;

    SELECT TOP (@SoDong)
        nk.MaNhatKy AS maNhatKy,
        nk.ThoiGian AS thoiGian,
        nk.MaNguoiDung AS maNguoiDung,
        nd.HoTen AS hoTenNguoiDung,
        nk.HanhDong AS hanhDong,
        nk.DoiTuong AS doiTuong,
        nk.MaDoiTuong AS maDoiTuong,
        nk.NoiDung AS noiDung,
        nk.DuLieuTruoc AS duLieuTruoc,
        nk.DuLieuSau AS duLieuSau
    FROM dbo.NhatKyHeThong AS nk
    LEFT JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = nk.MaNguoiDung
    WHERE (@TuNgay IS NULL OR nk.ThoiGian >= @TuNgay)
      AND (@DenNgay IS NULL OR nk.ThoiGian < DATEADD(DAY, 1, @DenNgay))
      AND (@AdminId IS NULL OR nk.MaNguoiDung = @AdminId)
      AND (@DoiTuong IS NULL OR nk.DoiTuong = @DoiTuong)
      AND (@HanhDong IS NULL OR nk.HanhDong LIKE N'%' + @HanhDong + N'%')
      AND (
          @TuKhoa IS NULL
          OR nk.NoiDung LIKE N'%' + @TuKhoa + N'%'
          OR nk.MaDoiTuong LIKE N'%' + @TuKhoa + N'%'
          OR nk.HanhDong LIKE N'%' + @TuKhoa + N'%'
      )
    ORDER BY nk.ThoiGian DESC, nk.MaNhatKy DESC;
END;
GO
