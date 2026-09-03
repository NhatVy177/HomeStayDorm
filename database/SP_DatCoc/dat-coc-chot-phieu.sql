USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: DAT COC - CHOT PHIEU (Nhan vien Ke toan) - DC03
-- =============================================

-- ============================================================
-- DC03 - SP_DanhSachChoTinhTienCoc
-- Danh sách phiếu cọc SALE ĐÃ LẬP nhưng KẾ TOÁN CHƯA CHỐT (MaNhanVienKeToan IS NULL).
--
-- Trả nguyên BẢNG TÍNH để kế toán đối soát:
--     đơn giá x số giường (hoặc nguyên phòng) = tiền thuê/tháng
--     tiền thuê/tháng x 2 tháng               = tiền cọc
-- SoTienCoc đã được trigger TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc tính sẵn;
-- kế toán KHÔNG gõ số, mà đối soát bảng tính rồi CHỐT.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoTinhTienCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoTinhTienCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoTinhTienCoc
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan;  -- phiếu quá hạn chờ chốt thì tự hủy, không hiện ra nữa

    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        pdc.MaPhieuYeuCauDangKy AS maDangKy,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        pdc.HinhThucThue        AS hinhThucThue,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS hanChot,        -- quá hạn này mà chưa chốt -> phiếu tự hủy
        p.TenPhong              AS tenPhong,
        lp.TenLoaiPhong         AS tenLoaiPhong,
        lp.SucChuaToiDa         AS sucChuaToiDa,
        pdk.SoNguoiDuKienO      AS soNguoiDuKienO,
        ndSale.HoTen            AS nhanVienSaleLap,
        (SELECT STRING_AGG(CAST(c2.MaGiuong AS NVARCHAR(3)), N', ')
                WITHIN GROUP (ORDER BY c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c2.MaGiuong IS NOT NULL) AS danhSachGiuong,
        -- ===== BẢNG TÍNH =====
        ct.SoDong               AS soDong,          -- ghép giường: số giường | nguyên phòng: 1
        CASE WHEN pdc.HinhThucThue = N'Ghép giường'
             THEN lp.GiaThueTheoGiuong
             ELSE lp.GiaThueNguyenPhong
        END                     AS donGia,
        ct.TienThueThang        AS tienThueThang,   -- = SUM(ChiTietDatCoc.GiaThue), trigger tính
        2                       AS soThangCoc,
        pdc.SoTienCoc           AS soTienCoc,       -- = tienThueThang x 2, trigger tính
        -- Trạng thái THẬT của phiếu (không phải suy từ hạn chốt như trước) — để frontend
        -- vừa hiện phiếu chờ chốt vừa hiện lại phiếu đã chốt/đã hủy TRONG NGÀY.
        CASE
            WHEN pdc.TrangThaiCoc = N'Đã hủy'    THEN N'Đã hủy'
            WHEN pdc.MaNhanVienKeToan IS NOT NULL THEN N'Đã chốt'
            ELSE N'Chờ chốt'
        END                     AS trangThaiPhieu
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy    = pdc.MaPhieuYeuCauDangKy
    INNER JOIN dbo.KhachHang   AS kh  ON kh.MaKhachHang  = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung   AS nd  ON nd.MaNguoiDung  = kh.MaKhachHang
    LEFT  JOIN dbo.NhanVien    AS nvS ON nvS.MaNhanVien  = pdk.MaNhanVienSale
    LEFT  JOIN dbo.NguoiDung   AS ndSale ON ndSale.MaNguoiDung = nvS.MaNhanVien
    CROSS APPLY (
        SELECT TOP 1 c.MaPhong FROM dbo.ChiTietDatCoc AS c
        WHERE c.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctp
    CROSS APPLY (
        SELECT SoDong = COUNT(*), TienThueThang = SUM(c.GiaThue)
        FROM dbo.ChiTietDatCoc AS c
        WHERE c.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ct
    INNER JOIN dbo.Phong     AS p  ON p.MaPhong      = ctp.MaPhong
    INNER JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaChiNhanh = @MaChiNhanh
      AND (
        -- CHƯA CHỐT: luôn hiện, bất kể lập từ bao giờ (đây là hàng đợi việc phải làm).
        (pdc.MaNhanVienKeToan IS NULL AND pdc.TrangThaiCoc = N'Hiệu lực' AND pdc.TrangThaiThanhToan = N'Chờ TT')
        -- ĐÃ CHỐT/ĐÃ HỦY: chỉ hiện lại phiếu LẬP TRONG HÔM NAY (giống cách Sale chỉ thấy
        -- yêu cầu trong ngày ở SP_DanhSachDatCocSale) — đủ để xem lại vừa xử lý, không kéo
        -- lịch sử vô hạn.
        OR (
            CAST(pdc.ThoiDiemDatCoc AS DATE) = CAST(GETDATE() AS DATE)
            AND (pdc.MaNhanVienKeToan IS NOT NULL OR pdc.TrangThaiCoc = N'Đã hủy')
        )
      )
    ORDER BY
        CASE WHEN pdc.MaNhanVienKeToan IS NULL AND pdc.TrangThaiCoc = N'Hiệu lực' THEN 0 ELSE 1 END,
        CASE WHEN pdc.MaNhanVienKeToan IS NULL AND pdc.TrangThaiCoc = N'Hiệu lực'
             THEN pdc.ThoiHanThanhToan END ASC,     -- chờ chốt: sắp hết hạn lên đầu
        pdc.ThoiDiemDatCoc DESC;                     -- đã xử lý: mới nhất lên đầu
END;
GO

-- ============================================================
-- DC03 - SP_ChotPhieuDatCoc
-- Kế toán CHỐT (hoặc HỦY) phiếu cọc do Sale lập.
--
-- CHỐT  : gán MaNhanVienKeToan + ĐẶT LẠI ThoiHanThanhToan = +24h.
--         Từ đây phiếu mới thật sự tới tay khách và đồng hồ 24h của KHÁCH bắt đầu chạy.
-- HỦY   : phiếu -> 'Đã hủy', NHẢ GIƯỜNG về 'Trống', mở khóa giới tính phòng.
--         Hồ sơ giữ nguyên 'Xác nhận cọc' -> Sale lập lại phiếu được (nhờ 50212 đã nới).
-- ============================================================
IF OBJECT_ID(N'dbo.SP_ChotPhieuDatCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_ChotPhieuDatCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_ChotPhieuDatCoc
    @MaPhieuDatCoc    VARCHAR(6),
    @MaNhanVienKeToan VARCHAR(6),
    @Chot             BIT,                 -- 1 = chốt phiếu | 0 = hủy phiếu
    @LyDo             NVARCHAR(MAX) = NULL -- bắt buộc khi hủy
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_NhaChoCocHetHan;

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc)
        THROW 50270, N'Không tìm thấy phiếu đặt cọc.', 1;

    IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienKeToan)
        THROW 50213, N'Không tìm thấy nhân viên kế toán.', 1;

    DECLARE @TrangThaiCoc NVARCHAR(20), @TrangThaiTT NVARCHAR(20),
            @DaChot VARCHAR(6), @HanCu DATETIME;
    SELECT @TrangThaiCoc = TrangThaiCoc, @TrangThaiTT = TrangThaiThanhToan,
           @DaChot = MaNhanVienKeToan, @HanCu = ThoiHanThanhToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

    IF @DaChot IS NOT NULL
        THROW 50271, N'Phiếu đặt cọc đã được kế toán chốt.', 1;

    IF @TrangThaiCoc <> N'Hiệu lực'
        THROW 50272, N'Phiếu đặt cọc không còn hiệu lực.', 1;

    -- SP_NhaChoCocHetHan ở trên đã hủy phiếu quá hạn; đến đây mà vẫn 'Hết hạn' nghĩa là quá hạn thật.
    IF @TrangThaiTT = N'Hết hạn' OR @HanCu < GETDATE()
        THROW 50273, N'Phiếu đặt cọc đã quá hạn chốt và bị hủy tự động.', 1;

    IF @Chot = 0 AND NULLIF(LTRIM(RTRIM(COALESCE(@LyDo, N''))), N'') IS NULL
        THROW 50274, N'Vui lòng nhập lý do hủy phiếu.', 1;

    DECLARE @MaPhong VARCHAR(4) = (
        SELECT TOP 1 MaPhong FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc
    );

    BEGIN TRY
        BEGIN TRAN;

        IF @Chot = 1
        BEGIN
            UPDATE dbo.PhieuDatCoc
            SET MaNhanVienKeToan = @MaNhanVienKeToan,
                -- Đặt LẠI đồng hồ: 24h này mới là hạn của KHÁCH, không phải hạn chờ kế toán.
                ThoiHanThanhToan = DATEADD(HOUR, 24, GETDATE()),
                GhiChu           = NULL
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;
        END
        ELSE
        BEGIN
            UPDATE dbo.PhieuDatCoc
            SET TrangThaiCoc       = N'Đã hủy',
                TrangThaiThanhToan = N'Hết hạn',
                GhiChu             = @LyDo
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

            -- Nhả giường đang bị phiếu này giữ chỗ (cả ghép giường lẫn nguyên phòng)
            UPDATE g SET g.TinhTrang = N'Trống'
            FROM dbo.Giuong AS g
            INNER JOIN dbo.ChiTietDatCoc AS c
                    ON c.MaPhong = g.MaPhong
                   AND (c.MaGiuong = g.MaGiuong OR c.MaGiuong IS NULL)
            WHERE c.MaPhieuDatCoc = @MaPhieuDatCoc
              AND g.TinhTrang = N'Giữ chỗ';

            -- Mở khóa giới tính nếu phòng không còn ai giữ/cọc/thuê
            UPDATE p SET p.GioiTinhChoPhep = N'Không phân biệt'
            FROM dbo.Phong AS p
            WHERE p.MaPhong = @MaPhong
              AND p.GioiTinhChoPhep <> N'Không phân biệt'
              AND NOT EXISTS (
                  SELECT 1 FROM dbo.Giuong AS g
                  WHERE g.MaPhong = p.MaPhong AND g.TinhTrang <> N'Trống'
              );

            EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @MaPhong;
        END

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;
    END CATCH

    SELECT
        pdc.MaPhieuDatCoc    AS maPhieuDatCoc,
        pdc.SoTienCoc        AS soTienCoc,
        pdc.ThoiHanThanhToan AS thoiHanThanhToan,
        pdc.TrangThaiCoc     AS trangThaiCoc,
        nd.HoTen             AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;
END;
GO
