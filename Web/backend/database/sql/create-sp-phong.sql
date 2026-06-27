-- Chay script nay trong SSMS (database HOMEDORM4) de tao 2 SP moi
-- Sau do restart backend node index.js

USE [HOMEDORM4];
GO

-- =============================================
-- SP_KhachMoi_DanhSachPhongKhaDung
-- Lay danh sach phong con cho, kem anh dai dien (STTAnh = 1) tu HinhAnhPhong
-- =============================================
IF OBJECT_ID(N'dbo.SP_KhachMoi_DanhSachPhongKhaDung', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_DanhSachPhongKhaDung AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_DanhSachPhongKhaDung
    @TuKhoa        NVARCHAR(120)   = NULL,
    @LoaiPhong     NVARCHAR(100)   = NULL,
    @KhuVuc        NVARCHAR(100)   = NULL,
    @HinhThucThue  NVARCHAR(20)    = NULL,
    @MucGiaToiDa   DECIMAL(15, 2)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    WITH SoChoTrong AS (
        SELECT
            g.MaPhong,
            SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS soChoTrong
        FROM dbo.Giuong AS g
        GROUP BY g.MaPhong
    )
    SELECT
        p.MaPhong                       AS id,
        p.MaPhong                       AS maPhong,
        p.TenPhong                      AS tenPhong,
        p.GioiTinhChoPhep               AS gioiTinhChoPhep,
        CASE
            WHEN p.GioiTinhChoPhep = N'Nam'              THEN N'Ghép nam'
            WHEN p.GioiTinhChoPhep = N'Nữ'              THEN N'Ghép nữ'
            WHEN p.GioiTinhChoPhep = N'Không phân biệt' THEN N'Nguyên căn'
        END                             AS hinhThucThue,
        lp.MaLoaiPhong                  AS maLoaiPhong,
        lp.TenLoaiPhong                 AS loaiPhong,
        lp.MoTa                         AS moTa,
        CASE
            WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
            ELSE lp.GiaThueTheoGiuong
        END                             AS giaThue,
        lp.GiaThueTheoGiuong            AS giaThueTheoGiuong,
        lp.GiaThueNguyenPhong           AS giaThueNguyenPhong,
        lp.SucChuaToiDa                 AS sucChua,
        COALESCE(sct.soChoTrong, 0)     AS soChoTrong,
        cn.TenChiNhanh                  AS chiNhanh,
        cn.DiaChi                       AS diaChi,
        (
            SELECT TOP 1 hap.UrlImg
            FROM dbo.HinhAnhPhong AS hap
            WHERE hap.MaPhong = p.MaPhong
              AND hap.STTAnh = 1
        )                               AS anhDai
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong     AS lp  ON lp.MaLoaiPhong  = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh      AS cn  ON cn.MaChiNhanh   = p.MaChiNhanh
    LEFT  JOIN SoChoTrong        AS sct ON sct.MaPhong      = p.MaPhong
    WHERE
        -- Loc theo hinh thuc thue (neu co truyen vao)
        (@HinhThucThue IS NULL
            OR (@HinhThucThue = N'Ghép nam'   AND p.GioiTinhChoPhep = N'Nam')
            OR (@HinhThucThue = N'Ghép nữ'    AND p.GioiTinhChoPhep = N'Nữ')
            OR (@HinhThucThue = N'Nguyên căn' AND p.GioiTinhChoPhep = N'Không phân biệt')
        )
        AND (@LoaiPhong IS NULL OR lp.TenLoaiPhong = @LoaiPhong)
        AND (@KhuVuc IS NULL
            OR cn.DiaChi      LIKE N'%' + @KhuVuc + N'%'
            OR cn.TenChiNhanh LIKE N'%' + @KhuVuc + N'%')
        AND (@TuKhoa IS NULL
            OR p.TenPhong      LIKE N'%' + @TuKhoa + N'%'
            OR p.MaPhong       LIKE N'%' + @TuKhoa + N'%'
            OR cn.TenChiNhanh  LIKE N'%' + @TuKhoa + N'%'
            OR cn.DiaChi       LIKE N'%' + @TuKhoa + N'%'
            OR lp.TenLoaiPhong LIKE N'%' + @TuKhoa + N'%')
        AND (@MucGiaToiDa IS NULL OR
            CASE
                WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                    THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
                ELSE lp.GiaThueTheoGiuong
            END <= @MucGiaToiDa)
    ORDER BY giaThue ASC, p.TenPhong ASC;
END;
GO

-- =============================================
-- SP_KhachMoi_ChiTietPhong
-- Lay chi tiet 1 phong + toan bo hinh anh theo STTAnh
-- =============================================
IF OBJECT_ID(N'dbo.SP_KhachMoi_ChiTietPhong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_ChiTietPhong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_ChiTietPhong
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    -- Recordset 1: Thong tin phong
    SELECT
        p.MaPhong                       AS maPhong,
        p.TenPhong                      AS tenPhong,
        p.GioiTinhChoPhep               AS gioiTinhChoPhep,
        CASE
            WHEN p.GioiTinhChoPhep = N'Nam'              THEN N'Ghép nam'
            WHEN p.GioiTinhChoPhep = N'Nữ'              THEN N'Ghép nữ'
            WHEN p.GioiTinhChoPhep = N'Không phân biệt' THEN N'Nguyên căn'
        END                             AS hinhThucThue,
        lp.MaLoaiPhong                  AS maLoaiPhong,
        lp.TenLoaiPhong                 AS loaiPhong,
        lp.MoTa                         AS moTa,
        lp.SucChuaToiDa                 AS sucChua,
        lp.GiaThueTheoGiuong            AS giaThueTheoGiuong,
        lp.GiaThueNguyenPhong           AS giaThueNguyenPhong,
        CASE
            WHEN p.GioiTinhChoPhep = N'Không phân biệt'
                THEN COALESCE(lp.GiaThueNguyenPhong, lp.GiaThueTheoGiuong * lp.SucChuaToiDa)
            ELSE lp.GiaThueTheoGiuong
        END                             AS giaThue,
        cn.TenChiNhanh                  AS chiNhanh,
        cn.DiaChi                       AS diaChi,
        cn.MaChiNhanh                   AS maChiNhanh,
        p.TinhTrang                     AS tinhTrang,
        COALESCE((
            SELECT SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END)
            FROM dbo.Giuong AS g
            WHERE g.MaPhong = p.MaPhong
        ), 0)                           AS soChoTrong
    FROM dbo.Phong AS p
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    INNER JOIN dbo.ChiNhanh  AS cn ON cn.MaChiNhanh  = p.MaChiNhanh
    WHERE p.MaPhong = @MaPhong;

    -- Recordset 2: Toan bo hinh anh sap xep theo STTAnh
    SELECT
        hap.STTAnh  AS stt,
        hap.UrlImg  AS urlAnh
    FROM dbo.HinhAnhPhong AS hap
    WHERE hap.MaPhong = @MaPhong
    ORDER BY hap.STTAnh ASC;
END;
GO
