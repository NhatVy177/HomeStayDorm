USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: XU LY PHAN HOI DOI SOAT (Nhan vien quan ly)
-- Gom 2 SPs:
--   1. SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi  -- danh sach DS trang thai "Cho phan hoi"
--   2. SP_TraPhong_QuanLy_ChiTietPhanHoi          -- chi tiet 1 phieu doi soat
--   3. SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat      -- xu ly (xac nhan dieu chinh | giu nguyen)
-- =============================================

-- ─── 1. Danh sach cho xu ly phan hoi ────────────────────────────────────────
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi
    @MaNhanVien VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    SELECT
        ds.MaDoiSoat       AS maDoiSoat,
        ds.NgayLap         AS ngayLap,
        pt.MaPhieuTra      AS maPhieuTra,
        pt.NgayTraThucTe   AS ngayTraThucTe,
        nd.HoTen           AS hoTenKhach,
        nd.SDT             AS sdtKhach,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        pt.MaHopDong       AS maHopDong,
        pt.MaPhieuDatCoc   AS maPhieuDatCoc,
        MIN(p.TenPhong)    AS tenPhong,
        MIN(g.MaGiuong)    AS maGiuong,
        ds.TrangThai       AS trangThaiDoiSoat,
        ds.GhiChuPhanHoiKhach AS ghiChuPhanHoiKhach
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT  JOIN dbo.HopDongThue hd  ON hd.MaHopDong  = pt.MaHopDong
    LEFT  JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p          ON p.MaPhong = ctdc.MaPhong
    LEFT  JOIN dbo.Giuong g         ON g.MaPhong = ctdc.MaPhong AND g.MaGiuong = ctdc.MaGiuong
    INNER JOIN dbo.KhachHang kh     ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd     ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE ds.TrangThai = N'Chờ phản hồi'
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    GROUP BY
        ds.MaDoiSoat, ds.NgayLap, ds.TrangThai, ds.GhiChuPhanHoiKhach,
        pt.MaPhieuTra, pt.NgayTraThucTe, pt.MaHopDong, pt.MaPhieuDatCoc,
        nd.HoTen, nd.SDT
    ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO


-- ─── 2. Chi tiet phieu doi soat cho xu ly phan hoi ──────────────────────────
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi
    @MaDoiSoat  VARCHAR(6),
    @MaNhanVien VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaChiNhanh VARCHAR(6);
    SELECT @MaChiNhanh = MaChiNhanh
    FROM dbo.NhanVien
    WHERE MaNhanVien = @MaNhanVien;

    -- Thong tin tong quat + tai chinh
    SELECT TOP 1
        ds.MaDoiSoat                AS maDoiSoat,
        ds.NgayLap                  AS ngayLap,
        ds.TrangThai                AS trangThaiDoiSoat,
        ds.GhiChuPhanHoiKhach       AS ghiChuPhanHoiKhach,
        pt.MaPhieuTra               AS maPhieuTra,
        pt.NgayTraThucTe            AS ngayTraThucTe,
        pt.TrangThai                AS trangThaiPhieuTra,
        pt.MaHopDong                AS maHopDong,
        pt.MaPhieuDatCoc            AS maPhieuDatCoc,
        COALESCE(pt.MaHopDong, pt.MaPhieuDatCoc) AS maHoSo,
        nd.HoTen                    AS hoTenKhach,
        nd.SDT                      AS sdtKhach,
        nd.Email                    AS emailKhach,
        kh.CCCD                     AS cccd,
        kh.MaKhachHang              AS maKhachHang,
        hd.TrangThai                AS trangThaiHopDong,
        pdc.TrangThaiCoc            AS trangThaiCoc,
        ds.TienCocBanDau            AS tienCocBanDau,
        ds.TyLeHoanCocHienTai       AS tyLeHoanCocHienTai,
        ds.TienCocDuocHoan          AS tienCocDuocHoan,
        ds.TienThueConNo            AS tienThueConNo,
        ds.TienDichVuConNo          AS tienDichVuConNo,
        ds.TongChiPhiSuaChua        AS tongChiPhiSuaChua,
        ds.TienPhat                 AS tienPhat,
        ds.TongKhauTru              AS tongKhauTru,
        ds.SoTienHoanThucTe         AS soTienHoanThucTe,
        ds.SoTienKhachPhaiTT        AS soTienKhachPhaiTT,
        ds.SoThangLuuTru            AS soThangLuuTru,
        hd.NgayBatDau               AS ngayBatDau,
        hd.NgayKetThuc              AS ngayKetThuc,
        hd.KyThanhToan              AS kyThanhToan,
        pdc.ThoiDiemDatCoc          AS thoiDiemDatCoc
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT  JOIN dbo.HopDongThue hd   ON hd.MaHopDong  = pt.MaHopDong
    LEFT  JOIN dbo.PhieuDatCoc pdc  ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p           ON p.MaPhong = ctdc.MaPhong
    INNER JOIN dbo.KhachHang kh      ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung nd      ON nd.MaNguoiDung  = kh.MaKhachHang
    WHERE ds.MaDoiSoat = @MaDoiSoat
      AND (@MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh);

    -- Danh sach phong / giuong
    SELECT
        p.MaPhong   AS maPhong,
        p.TenPhong  AS tenPhong,
        ctdc.MaGiuong AS maGiuong,
        ctdc.GiaThue  AS giaThue
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
    LEFT  JOIN dbo.HopDongThue hd   ON hd.MaHopDong  = pt.MaHopDong
    LEFT  JOIN dbo.PhieuDatCoc pdc  ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
    INNER JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    INNER JOIN dbo.Phong p            ON p.MaPhong = ctdc.MaPhong
    WHERE ds.MaDoiSoat = @MaDoiSoat
    ORDER BY p.MaPhong, ctdc.MaGiuong;
END;
GO


-- ─── 3. Xu ly phan hoi doi soat ─────────────────────────────────────────────
--   @HanhDong: 'XacNhanDieuChinh'  -> doi soat -> "Can dieu chinh"
--              'GiuNguyen'          -> doi soat -> tiep theo; phieu tra -> "Cho ky bien ban"
IF OBJECT_ID(N'dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat
    @MaDoiSoat          VARCHAR(6),
    @MaNhanVien         VARCHAR(6),
    @HanhDong           NVARCHAR(30)   -- 'XacNhanDieuChinh' | 'GiuNguyen'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Kiem tra hanh dong hop le
    IF @HanhDong NOT IN (N'XacNhanDieuChinh', N'GiuNguyen')
        THROW 50800, N'Hành động không hợp lệ. Chỉ chấp nhận XacNhanDieuChinh hoặc GiuNguyen.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @TrangThaiDoiSoat   NVARCHAR(30),
            @MaPhieuTra         VARCHAR(6),
            @SoTienHoan         DECIMAL(15,2),
            @SoTienPhaiTT       DECIMAL(15,2);

        -- Khoa dong va doc trang thai hien tai
        SELECT
            @TrangThaiDoiSoat = ds.TrangThai,
            @MaPhieuTra       = ds.MaPhieuTra,
            @SoTienHoan       = ds.SoTienHoanThucTe,
            @SoTienPhaiTT     = ds.SoTienKhachPhaiTT
        FROM dbo.DoiSoat ds WITH (UPDLOCK, HOLDLOCK)
        WHERE ds.MaDoiSoat = @MaDoiSoat;

        -- E9: Phieu doi soat da thay doi trang thai
        IF @MaPhieuTra IS NULL
            THROW 50801, N'Không tìm thấy phiếu đối soát.', 1;

        IF @TrangThaiDoiSoat <> N'Chờ phản hồi'
            THROW 50802, N'Phiếu đối soát này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác. Vui lòng làm mới danh sách.', 1;

        -- ─── Nhanh: Xac nhan dieu chinh ─────────────────────────────────────
        IF @HanhDong = N'XacNhanDieuChinh'
        BEGIN
            -- Doi soat -> "Can dieu chinh"
            UPDATE dbo.DoiSoat
            SET TrangThai = N'Cần điều chỉnh'
            WHERE MaDoiSoat = @MaDoiSoat;

            -- Phieu tra phong giu nguyen "Cho doi soat"
            -- (khong update)
        END

        -- ─── Nhanh: Giu nguyen doi soat ─────────────────────────────────────
        ELSE -- 'GiuNguyen'
        BEGIN
            -- Xac dinh trang thai tiep theo cho doi soat
            DECLARE @TrangThaiMoiDS NVARCHAR(30);

            IF ISNULL(@SoTienHoan, 0) > 0
                SET @TrangThaiMoiDS = N'Chờ hoàn cọc';
            ELSE IF ISNULL(@SoTienPhaiTT, 0) > 0
                SET @TrangThaiMoiDS = N'Chờ thanh toán thêm';
            ELSE
                SET @TrangThaiMoiDS = N'Đã quyết toán';

            -- Cap nhat doi soat
            UPDATE dbo.DoiSoat
            SET TrangThai = @TrangThaiMoiDS
            WHERE MaDoiSoat = @MaDoiSoat;

            -- Cap nhat phieu tra phong -> "Cho ky bien ban"
            UPDATE dbo.PhieuTraPhong
            SET TrangThai = N'Chờ ký biên bản'
            WHERE MaPhieuTra = @MaPhieuTra;
        END

        COMMIT TRANSACTION;

        -- Tra ve ket qua
        SELECT
            @MaDoiSoat  AS maDoiSoat,
            @MaPhieuTra AS maPhieuTra,
            @HanhDong   AS hanhDong;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
