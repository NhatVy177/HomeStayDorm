USE [HOMEDORM4];
GO

-- Chay file nay trong SQL Server sau khi da chay app.sql.
-- Backend chi EXEC cac procedure nay, khong tao procedure tu JavaScript.

IF OBJECT_ID(N'dbo.TaiKhoan', N'U') IS NULL
   OR OBJECT_ID(N'dbo.NguoiDung', N'U') IS NULL
   OR OBJECT_ID(N'dbo.KhachHang', N'U') IS NULL
   OR OBJECT_ID(N'dbo.NhanVien', N'U') IS NULL
    THROW 50000, N'Chưa có bảng auth. Hãy chạy app.sql trên database HOMEDORM4 trước khi chạy auth.sql.', 1;
GO

IF OBJECT_ID(N'dbo.SP_DangKy', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DangKy AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DangKy
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255),
    @HoTen NVARCHAR(100),
    @NgaySinh DATE,
    @GioiTinh NVARCHAR(5),
    @SDT VARCHAR(20),
    @Email VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @TenDangNhap = LTRIM(RTRIM(@TenDangNhap));
    SET @HoTen = LTRIM(RTRIM(@HoTen));
    SET @GioiTinh = NULLIF(LTRIM(RTRIM(@GioiTinh)), N'');
    SET @SDT = NULLIF(LTRIM(RTRIM(@SDT)), '');
    SET @Email = NULLIF(LTRIM(RTRIM(@Email)), '');

    IF NULLIF(@TenDangNhap, '') IS NULL
       OR NULLIF(@HoTen, N'') IS NULL
       OR NULLIF(@MatKhau, '') IS NULL
       OR @NgaySinh IS NULL
       OR @GioiTinh IS NULL
       OR @GioiTinh NOT IN (N'Nam', N'Nữ')
       OR @SDT IS NULL
        THROW 50001, N'Vui lòng nhập đầy đủ họ tên, tên đăng nhập, giới tính, số điện thoại, ngày sinh và mật khẩu.', 1;

    DECLARE @SoThuTu INT;
    DECLARE @MaNguoiDung VARCHAR(6);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (
            SELECT 1
            FROM dbo.TaiKhoan WITH (UPDLOCK, HOLDLOCK)
            WHERE TenDangNhap = @TenDangNhap
        )
            THROW 50002, N'Tên đăng nhập đã tồn tại.', 1;

        SELECT @SoThuTu = ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaNguoiDung, 3, 4))), 0) + 1
        FROM dbo.NguoiDung WITH (UPDLOCK, HOLDLOCK)
        WHERE MaNguoiDung LIKE 'KH%';

        IF @SoThuTu > 9999
            THROW 50003, N'Không thể cấp thêm mã khách hàng.', 1;

        SET @MaNguoiDung = CONCAT('KH', RIGHT(CONCAT('0000', @SoThuTu), 4));

        INSERT INTO dbo.NguoiDung (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, LoaiNguoiDung)
        VALUES (@MaNguoiDung, @HoTen, @NgaySinh, @GioiTinh, @SDT, @Email, 'KhachHang');

        INSERT INTO dbo.KhachHang (MaKhachHang, QuocTich, CCCD)
        VALUES (@MaNguoiDung, NULL, NULL);

        INSERT INTO dbo.TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung)
        VALUES (
            @TenDangNhap,
            CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @MatKhau), 2),
            N'Hoạt động',
            @MaNguoiDung
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;

    SELECT
        tk.TenDangNhap AS tenDangNhap,
        tk.MaNguoiDung AS maNguoiDung,
        nd.HoTen AS hoTen,
        nd.NgaySinh AS ngaySinh,
        nd.GioiTinh AS gioiTinh,
        nd.Email AS email,
        nd.SDT AS soDienThoai,
        nd.LoaiNguoiDung AS vaiTro,
        tk.TrangThai AS trangThai,
        nv.ChucVu AS chucVu,
        nv.MaChiNhanh AS maChiNhanh
    FROM dbo.TaiKhoan AS tk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = tk.MaNguoiDung
    LEFT JOIN dbo.NhanVien AS nv ON nv.MaNhanVien = tk.MaNguoiDung
    WHERE tk.TenDangNhap = @TenDangNhap;
END;
GO

IF OBJECT_ID(N'dbo.SP_DangNhap', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DangNhap AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DangNhap
    @TenDangNhap VARCHAR(50),
    @MatKhau VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SET @TenDangNhap = LTRIM(RTRIM(@TenDangNhap));

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.TaiKhoan
        WHERE TenDangNhap = @TenDangNhap
          AND MatKhau = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @MatKhau), 2)
    )
        THROW 50004, N'Tên đăng nhập hoặc mật khẩu không đúng.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.TaiKhoan
        WHERE TenDangNhap = @TenDangNhap
          AND TrangThai = N'Vô hiệu hóa'
    )
        THROW 50005, N'Tài khoản đã bị vô hiệu hóa.', 1;

    SELECT
        tk.TenDangNhap AS tenDangNhap,
        tk.MaNguoiDung AS maNguoiDung,
        nd.HoTen AS hoTen,
        nd.NgaySinh AS ngaySinh,
        nd.GioiTinh AS gioiTinh,
        nd.Email AS email,
        nd.SDT AS soDienThoai,
        nd.LoaiNguoiDung AS vaiTro,
        tk.TrangThai AS trangThai,
        nv.ChucVu AS chucVu,
        nv.MaChiNhanh AS maChiNhanh
    FROM dbo.TaiKhoan AS tk
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = tk.MaNguoiDung
    LEFT JOIN dbo.NhanVien AS nv ON nv.MaNhanVien = tk.MaNguoiDung
    WHERE tk.TenDangNhap = @TenDangNhap;
END;
GO
