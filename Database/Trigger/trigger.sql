USE HOMEDORM4;
GO

-- ================================================================
-- FILE: 01_triggers_basic.sql  (PHIÊN BẢN ĐÃ SỬA THEO CHECKLIST)
-- Database: HOMEDORM4

-- Danh sách trigger (9 trigger, thứ tự phụ thuộc):
--   1. TRG_LoaiPhong_TinhGiaThueNguyenPhong
--   2. TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc  ← ĐÃ GỘP
--   3. TRG_HopDongThue_TinhGiaThueSoGiuong
--   4. TRG_PhieuGhiChiSo_SetKyGhi
--   5. TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien  ← ĐÃ GỘP
--   6. TRG_HoaDon_TinhTongTien_OnDelete
--   7. SP_TinhDoiSoat
--   8. TRG_ChiTietHuHong_CapNhatTongSuaChua
--   9. TRG_BienBanViPham_TinhSoTienPhat
-- ================================================================


-- ================================================================
-- XÓA CÁC TRIGGER CŨ NẾU CÒN TỒN TẠI
-- ================================================================
IF OBJECT_ID('TRG_CTDatCoc_TinhGiaThue',              'TR') IS NOT NULL DROP TRIGGER TRG_CTDatCoc_TinhGiaThue;
IF OBJECT_ID('TRG_PhieuDatCoc_TinhSoTienCoc',         'TR') IS NOT NULL DROP TRIGGER TRG_PhieuDatCoc_TinhSoTienCoc;
IF OBJECT_ID('TRG_DoiSoat_TinhTaiChinh',              'TR') IS NOT NULL DROP TRIGGER TRG_DoiSoat_TinhTaiChinh;
IF OBJECT_ID('TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc','TR') IS NOT NULL DROP TRIGGER TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc;
IF OBJECT_ID('TRG_LoaiPhong_TinhGiaThueNguyenPhong',  'TR') IS NOT NULL DROP TRIGGER TRG_LoaiPhong_TinhGiaThueNguyenPhong;
IF OBJECT_ID('TRG_HopDongThue_TinhGiaThueSoGiuong',   'TR') IS NOT NULL DROP TRIGGER TRG_HopDongThue_TinhGiaThueSoGiuong;
IF OBJECT_ID('TRG_PhieuGhiChiSo_SetKyGhi',            'TR') IS NOT NULL DROP TRIGGER TRG_PhieuGhiChiSo_SetKyGhi;
IF OBJECT_ID('TRG_ChiTietHoaDon_TinhSoLuong',         'TR') IS NOT NULL DROP TRIGGER TRG_ChiTietHoaDon_TinhSoLuong;
IF OBJECT_ID('TRG_ChiTietHoaDon_TinhThanhTien',       'TR') IS NOT NULL DROP TRIGGER TRG_ChiTietHoaDon_TinhThanhTien;
IF OBJECT_ID('TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien','TR') IS NOT NULL DROP TRIGGER TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien;
IF OBJECT_ID('TRG_HoaDon_TinhTongTien_OnDelete',      'TR') IS NOT NULL DROP TRIGGER TRG_HoaDon_TinhTongTien_OnDelete;
IF OBJECT_ID('TRG_HoaDon_ChuyenNoQuaHan',             'TR') IS NOT NULL DROP TRIGGER TRG_HoaDon_ChuyenNoQuaHan;
IF OBJECT_ID('TRG_ChiTietHuHong_CapNhatTongSuaChua',  'TR') IS NOT NULL DROP TRIGGER TRG_ChiTietHuHong_CapNhatTongSuaChua;
IF OBJECT_ID('TRG_BienBanViPham_TinhSoTienPhat',      'TR') IS NOT NULL DROP TRIGGER TRG_BienBanViPham_TinhSoTienPhat;
GO


-- ================================================================
-- TRIGGER 1: TRG_LoaiPhong_TinhGiaThueNguyenPhong
-- Bảng : LoaiPhong   |  Sự kiện: AFTER INSERT, UPDATE
-- Cột  : GiaThueNguyenPhong = SucChuaToiDa × GiaThueTheoGiuong
-- ================================================================
CREATE TRIGGER TRG_LoaiPhong_TinhGiaThueNguyenPhong
ON LoaiPhong
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE lp
    SET    lp.GiaThueNguyenPhong = i.SucChuaToiDa * i.GiaThueTheoGiuong
    FROM   LoaiPhong lp
    INNER JOIN inserted i ON lp.MaLoaiPhong = i.MaLoaiPhong
    WHERE  i.SucChuaToiDa IS NOT NULL AND i.GiaThueTheoGiuong IS NOT NULL;
END;
GO


-- ================================================================
-- TRIGGER 2: TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc
-- Bảng : ChiTietDatCoc   |  Sự kiện: AFTER INSERT, UPDATE, DELETE
-- Logic GiaThue:
--   MaGiuong IS NOT NULL → thuê ghép  → GiaThueTheoGiuong
--   MaGiuong IS NULL     → nguyên căn → GiaThueNguyenPhong
--
-- Logic SoTienCoc:
--   SoTienCoc = SUM(GiaThue) × 2   (tiền cọc = 2 tháng thuê)
-- ================================================================
CREATE TRIGGER TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc
ON ChiTietDatCoc
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- ---- BƯỚC 1: Tính GiaThue cho các dòng vừa INSERT/UPDATE ----
    -- (Chỉ chạy khi có INSERT/UPDATE, không chạy khi DELETE thuần túy)
    IF EXISTS (SELECT 1 FROM inserted)
    BEGIN
        -- Ghép giường: GiaThue = GiaThueTheoGiuong của LoaiPhong
        UPDATE ctdc
        SET    ctdc.GiaThue = lp.GiaThueTheoGiuong
        FROM   ChiTietDatCoc ctdc
        INNER JOIN inserted  i  ON ctdc.MaChiTietDC = i.MaChiTietDC
        INNER JOIN Phong     p  ON p.MaPhong         = i.MaPhong
        INNER JOIN LoaiPhong lp ON lp.MaLoaiPhong    = p.MaLoaiPhong
        WHERE  i.MaGiuong IS NOT NULL;

        -- Nguyên căn: GiaThue = GiaThueNguyenPhong của LoaiPhong
        UPDATE ctdc
        SET    ctdc.GiaThue = lp.GiaThueNguyenPhong
        FROM   ChiTietDatCoc ctdc
        INNER JOIN inserted  i  ON ctdc.MaChiTietDC = i.MaChiTietDC
        INNER JOIN Phong     p  ON p.MaPhong         = i.MaPhong
        INNER JOIN LoaiPhong lp ON lp.MaLoaiPhong    = p.MaLoaiPhong
        WHERE  i.MaGiuong IS NULL;
    END;

    -- ---- BƯỚC 2: Tính lại SoTienCoc cho PhieuDatCoc bị ảnh hưởng ----
    -- Gom tất cả phiếu cọc có thay đổi (INSERT, UPDATE và DELETE đều cần)
    DECLARE @Aff TABLE (MaPhieuDatCoc VARCHAR(6) PRIMARY KEY);
    INSERT INTO @Aff
        SELECT DISTINCT MaPhieuDatCoc FROM inserted
        UNION
        SELECT DISTINCT MaPhieuDatCoc FROM deleted;

    -- Đọc lại GiaThue từ bảng (KHÔNG từ inserted) → đã có giá trị đúng sau bước 1
    UPDATE pdc
    SET    pdc.SoTienCoc = ISNULL(
               (SELECT SUM(c.GiaThue) * 2
                FROM   ChiTietDatCoc c
                WHERE  c.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                  AND  c.GiaThue IS NOT NULL),
               0)
    FROM   PhieuDatCoc pdc
    WHERE  pdc.MaPhieuDatCoc IN (SELECT MaPhieuDatCoc FROM @Aff);
END;
GO


-- ================================================================
-- TRIGGER 3: TRG_HopDongThue_TinhGiaThueSoGiuong
-- Bảng : HopDongThue   |  Sự kiện: AFTER INSERT
-- Cột  : GiaThue, SoGiuongThue
--
-- Chỉ chạy khi INSERT (không override khi nhân viên UPDATE thủ công).
-- Tính từ ChiTietDatCoc của phiếu cọc liên kết:
--   Nguyên phòng → GiaThueNguyenPhong / SucChuaToiDa
--   Ghép giường  → SUM(CTDC.GiaThue) / COUNT(MaGiuong)
--
-- Nếu hệ thống cho phép sửa MaPhieuCoc sau khi lập HĐ,
-- đổi thành AFTER INSERT, UPDATE và thêm điều kiện UPDATE(MaPhieuCoc).
-- ================================================================
CREATE TRIGGER TRG_HopDongThue_TinhGiaThueSoGiuong
ON HopDongThue
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Nguyên phòng
    UPDATE hdt
    SET    hdt.GiaThue      = lp.GiaThueNguyenPhong,
           hdt.SoGiuongThue = lp.SucChuaToiDa
    FROM   HopDongThue   hdt
    INNER JOIN inserted      i    ON hdt.MaHopDong        = i.MaHopDong
    INNER JOIN PhieuDatCoc   pdc  ON pdc.MaPhieuDatCoc    = i.MaPhieuCoc
    INNER JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc   = pdc.MaPhieuDatCoc
                                  AND ctdc.MaGiuong IS NULL
    INNER JOIN Phong         p    ON p.MaPhong             = ctdc.MaPhong
    INNER JOIN LoaiPhong     lp   ON lp.MaLoaiPhong        = p.MaLoaiPhong
    WHERE  pdc.HinhThucThue = N'Nguyên phòng'
      AND  (i.GiaThue IS NULL OR i.SoGiuongThue IS NULL);

    -- Ghép giường
    UPDATE hdt
    SET    hdt.GiaThue      = sub.TongGia,
           hdt.SoGiuongThue = sub.SoGiuong
    FROM   HopDongThue hdt
    INNER JOIN inserted    i   ON hdt.MaHopDong = i.MaHopDong
    INNER JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = i.MaPhieuCoc
    INNER JOIN (
        SELECT MaPhieuDatCoc,
               SUM(GiaThue)    AS TongGia,
               COUNT(MaGiuong) AS SoGiuong
        FROM   ChiTietDatCoc
        WHERE  MaGiuong IS NOT NULL AND GiaThue IS NOT NULL
        GROUP BY MaPhieuDatCoc
    ) sub ON sub.MaPhieuDatCoc = i.MaPhieuCoc
    WHERE  pdc.HinhThucThue = N'Ghép giường'
      AND  (i.GiaThue IS NULL OR i.SoGiuongThue IS NULL);
END;
GO


-- ================================================================
-- TRIGGER 4: TRG_PhieuGhiChiSo_SetKyGhi
-- Bảng : PhieuGhiChiSo   |  Sự kiện: AFTER INSERT, UPDATE
-- Cột  : KyGhi = FORMAT(NgayGhi, 'yyyy-MM')
--
-- KyGhi theo định dạng YYYY-MM để khớp KyThanhToan của hóa đơn tháng.
-- Hóa đơn quý dùng YYYY-QX — do SP_LapHoaDonQuy tạo, không phải trigger.
-- ================================================================
CREATE TRIGGER TRG_PhieuGhiChiSo_SetKyGhi
ON PhieuGhiChiSo
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;  -- chống đệ quy

    UPDATE pgcs
    SET    pgcs.KyGhi = FORMAT(i.NgayGhi, 'yyyy-MM')
    FROM   PhieuGhiChiSo pgcs
    INNER JOIN inserted i ON pgcs.MaPhieuGhi = i.MaPhieuGhi
    WHERE  i.NgayGhi IS NOT NULL;
END;
GO


-- ================================================================
-- TRIGGER 5+6: TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien
-- Bảng : ChiTietHoaDon | Sự kiện: AFTER INSERT, UPDATE
-- Cột  :
--   1. SoLuong:
--      - Dịch vụ theo tháng: 1
--      - Điện/nước nguyên phòng: lấy toàn bộ mức tiêu thụ
--      - Điện/nước ghép giường: chia theo tỉ lệ số giường thuê
--   2. ThanhTien = SoLuong * DonGia
--   3. HoaDon.TongTien = HopDongThue.GiaThue + SUM(ChiTietHoaDon.ThanhTien)
--
-- Lưu ý nghiệp vụ:
--   ChiTietHoaDon KHÔNG lưu tiền thuê phòng.
--   Tiền thuê phòng lấy từ HopDongThue.GiaThue và chỉ cộng vào HoaDon.TongTien.
-- ================================================================
CREATE TRIGGER TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien
ON ChiTietHoaDon
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;

    -- ---- A: Dịch vụ tháng cố định: wifi, vệ sinh, gửi xe... ----
    UPDATE cthd
    SET    cthd.SoLuong = 1
    FROM   ChiTietHoaDon cthd
    INNER JOIN inserted i ON cthd.MaChiTietHD = i.MaChiTietHD
    WHERE  cthd.SoLuong IS NULL
      AND  cthd.DonViTinh = N'tháng';

    -- ---- B: ĐIỆN — Nguyên phòng ----
    UPDATE cthd
    SET    cthd.SoLuong = pgcs.ChiSoDienCuoi - pgcs.ChiSoDienDau
    FROM   ChiTietHoaDon cthd
    INNER JOIN inserted        i    ON cthd.MaChiTietHD   = i.MaChiTietHD
    INNER JOIN HoaDon          hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue     hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc     pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN PhieuGhiChiSo   pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
    WHERE  cthd.SoLuong IS NULL
      AND  cthd.DonViTinh = N'kWh'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Nguyên phòng';

    -- ---- C: NƯỚC — Nguyên phòng ----
    UPDATE cthd
    SET    cthd.SoLuong = pgcs.ChiSoNuocCuoi - pgcs.ChiSoNuocDau
    FROM   ChiTietHoaDon cthd
    INNER JOIN inserted        i    ON cthd.MaChiTietHD   = i.MaChiTietHD
    INNER JOIN HoaDon          hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue     hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc     pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN PhieuGhiChiSo   pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
    WHERE  cthd.SoLuong IS NULL
      AND  cthd.DonViTinh = N'm3'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Nguyên phòng';

    -- ---- D: ĐIỆN — Ghép giường ----
    UPDATE cthd
    SET    cthd.SoLuong = CAST(
               (pgcs.ChiSoDienCuoi - pgcs.ChiSoDienDau)
               * CAST(hdt.SoGiuongThue AS DECIMAL(10,4))
               / CAST(tong.TongGiuong AS DECIMAL(10,4))
           AS DECIMAL(10,2))
    FROM   ChiTietHoaDon cthd
    INNER JOIN inserted        i    ON cthd.MaChiTietHD   = i.MaChiTietHD
    INNER JOIN HoaDon          hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue     hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc     pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN ChiTietDatCoc   ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                                    AND ctdc.MaGiuong IS NOT NULL
    INNER JOIN PhieuGhiChiSo   pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
                                    AND pgcs.MaPhong       = ctdc.MaPhong
    INNER JOIN (
        SELECT ctdc2.MaPhong, pgcs2.KyGhi, SUM(hdt2.SoGiuongThue) AS TongGiuong
        FROM   HopDongThue     hdt2
        INNER JOIN PhieuDatCoc   pdc2  ON pdc2.MaPhieuDatCoc  = hdt2.MaPhieuCoc
        INNER JOIN ChiTietDatCoc ctdc2 ON ctdc2.MaPhieuDatCoc = pdc2.MaPhieuDatCoc
                                       AND ctdc2.MaGiuong IS NOT NULL
        INNER JOIN HoaDon        hd2   ON hd2.MaHopDong  = hdt2.MaHopDong
        INNER JOIN ChiTietHoaDon ch2   ON ch2.MaHoaDon   = hd2.MaHoaDon
                                       AND ch2.DonViTinh  = N'kWh'
        INNER JOIN PhieuGhiChiSo pgcs2 ON pgcs2.MaPhieuGhi = ch2.MaPhieuGhi
                                       AND pgcs2.MaPhong    = ctdc2.MaPhong
        WHERE  pdc2.HinhThucThue = N'Ghép giường'
        GROUP BY ctdc2.MaPhong, pgcs2.KyGhi
    ) tong ON tong.MaPhong = ctdc.MaPhong AND tong.KyGhi = pgcs.KyGhi
    WHERE  cthd.SoLuong IS NULL
      AND  cthd.DonViTinh = N'kWh'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Ghép giường'
      AND  tong.TongGiuong > 0;

    -- ---- E: NƯỚC — Ghép giường ----
    UPDATE cthd
    SET    cthd.SoLuong = CAST(
               (pgcs.ChiSoNuocCuoi - pgcs.ChiSoNuocDau)
               * CAST(hdt.SoGiuongThue AS DECIMAL(10,4))
               / CAST(tong.TongGiuong AS DECIMAL(10,4))
           AS DECIMAL(10,2))
    FROM   ChiTietHoaDon cthd
    INNER JOIN inserted        i    ON cthd.MaChiTietHD   = i.MaChiTietHD
    INNER JOIN HoaDon          hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue     hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc     pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN ChiTietDatCoc   ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                                    AND ctdc.MaGiuong IS NOT NULL
    INNER JOIN PhieuGhiChiSo   pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
                                    AND pgcs.MaPhong       = ctdc.MaPhong
    INNER JOIN (
        SELECT ctdc2.MaPhong, pgcs2.KyGhi, SUM(hdt2.SoGiuongThue) AS TongGiuong
        FROM   HopDongThue     hdt2
        INNER JOIN PhieuDatCoc   pdc2  ON pdc2.MaPhieuDatCoc  = hdt2.MaPhieuCoc
        INNER JOIN ChiTietDatCoc ctdc2 ON ctdc2.MaPhieuDatCoc = pdc2.MaPhieuDatCoc
                                       AND ctdc2.MaGiuong IS NOT NULL
        INNER JOIN HoaDon        hd2   ON hd2.MaHopDong  = hdt2.MaHopDong
        INNER JOIN ChiTietHoaDon ch2   ON ch2.MaHoaDon   = hd2.MaHoaDon
                                       AND ch2.DonViTinh  = N'm3'
        INNER JOIN PhieuGhiChiSo pgcs2 ON pgcs2.MaPhieuGhi = ch2.MaPhieuGhi
                                       AND pgcs2.MaPhong    = ctdc2.MaPhong
        WHERE  pdc2.HinhThucThue = N'Ghép giường'
        GROUP BY ctdc2.MaPhong, pgcs2.KyGhi
    ) tong ON tong.MaPhong = ctdc.MaPhong AND tong.KyGhi = pgcs.KyGhi
    WHERE  cthd.SoLuong IS NULL
      AND  cthd.DonViTinh = N'm3'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Ghép giường'
      AND  tong.TongGiuong > 0;

    -- ---- F: ThanhTien = SoLuong * DonGia ----
    UPDATE cthd
    SET    cthd.ThanhTien = cthd.SoLuong * cthd.DonGia
    FROM   ChiTietHoaDon cthd
    INNER JOIN inserted i ON cthd.MaChiTietHD = i.MaChiTietHD
    WHERE  cthd.SoLuong IS NOT NULL
      AND  cthd.DonGia IS NOT NULL;

    -- ---- G: HoaDon.TongTien = tiền thuê + tổng dịch vụ ----
    UPDATE hd
    SET    hd.TongTien = ISNULL(hdt.GiaThue, 0)
                         + ISNULL((
                               SELECT SUM(c.ThanhTien)
                               FROM   ChiTietHoaDon c
                               WHERE  c.MaHoaDon = hd.MaHoaDon
                                 AND  c.ThanhTien IS NOT NULL
                           ), 0)
    FROM   HoaDon hd
    INNER JOIN HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
    WHERE  hd.MaHoaDon IN (SELECT DISTINCT MaHoaDon FROM inserted);
END;
GO


-- ================================================================
-- TRIGGER 7: TRG_HoaDon_TinhTongTien_OnDelete
-- Bảng : ChiTietHoaDon | Sự kiện: AFTER DELETE
-- Cập nhật HoaDon.TongTien khi xóa dòng dịch vụ.
-- Công thức: TongTien = HopDongThue.GiaThue + SUM(ChiTietHoaDon.ThanhTien)
-- ================================================================
CREATE TRIGGER TRG_HoaDon_TinhTongTien_OnDelete
ON ChiTietHoaDon
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE hd
    SET    hd.TongTien = ISNULL(hdt.GiaThue, 0)
                         + ISNULL((
                               SELECT SUM(c.ThanhTien)
                               FROM   ChiTietHoaDon c
                               WHERE  c.MaHoaDon = hd.MaHoaDon
                                 AND  c.ThanhTien IS NOT NULL
                           ), 0)
    FROM   HoaDon hd
    INNER JOIN HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
    WHERE  hd.MaHoaDon IN (SELECT DISTINCT MaHoaDon FROM deleted);
END;
GO

-- ================================================================
-- TRIGGER: TRG_HoaDon_ChuyenNoQuaHan
-- Bang : HoaDon | Su kien: AFTER INSERT, UPDATE
-- Neu hoa don qua NgayHanTT ma van Chua TT thi tu dong chuyen thanh No.
-- Khong dung vao hoa don Da TT, No, Tam tinh hoac hoa don da co NgayThanhToan.
-- ================================================================
CREATE TRIGGER TRG_HoaDon_ChuyenNoQuaHan
ON HoaDon
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;

    EXEC dbo.SP_HoaDon_CapNhatNoQuaHan @TraKetQua = 0;
END;
GO


-- ================================================================
-- TRIGGER 8: TRG_ChiTietHuHong_CapNhatTongSuaChua
-- Bảng : ChiTietHuHong   |  Sự kiện: AFTER INSERT, UPDATE, DELETE
-- Cột  : BienBanKiemTraPhong.TongChiPhiSuaChua = SUM(ChiPhiSuaChua)
-- ================================================================
CREATE TRIGGER TRG_ChiTietHuHong_CapNhatTongSuaChua
ON ChiTietHuHong
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Aff TABLE (MaBienBanKT VARCHAR(6) PRIMARY KEY);
    INSERT INTO @Aff
        SELECT DISTINCT MaBienBanKT FROM inserted
        UNION
        SELECT DISTINCT MaBienBanKT FROM deleted;

    UPDATE bbkt
    SET    bbkt.TongChiPhiSuaChua = ISNULL(
               (SELECT SUM(h.ChiPhiSuaChua)
                FROM   ChiTietHuHong h
                WHERE  h.MaBienBanKT = bbkt.MaBienBanKT), 0)
    FROM   BienBanKiemTraPhong bbkt
    WHERE  bbkt.MaBienBanKT IN (SELECT MaBienBanKT FROM @Aff);
END;
GO


-- ================================================================
-- TRIGGER 9: TRG_BienBanViPham_TinhSoTienPhat
-- Bảng : BienBanViPham   |  Sự kiện: AFTER INSERT, UPDATE
-- Cột  : SoTienPhat
--   HinhThucXuPhat = 'Phạt tiền' → SoTienPhat = MucPhat (từ DieuKhoanViPham)
--   Ngược lại (Nhắc nhở / NULL)  → SoTienPhat = 0
-- ================================================================
CREATE TRIGGER TRG_BienBanViPham_TinhSoTienPhat
ON BienBanViPham
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE bbvp
    SET    bbvp.SoTienPhat =
               CASE WHEN dkvp.HinhThucXuPhat = N'Phạt tiền'
                    THEN ISNULL(dkvp.MucPhat, 0)
                    ELSE 0
               END
    FROM   BienBanViPham   bbvp
    INNER JOIN inserted        i    ON bbvp.MaBBViPham  = i.MaBBViPham
    INNER JOIN DieuKhoanViPham dkvp ON dkvp.MaDieuKhoan = i.MaDieuKhoan
    WHERE  i.MaDieuKhoan IS NOT NULL;

    -- MaDieuKhoan chưa gán → về 0
    UPDATE bbvp
    SET    bbvp.SoTienPhat = 0
    FROM   BienBanViPham bbvp
    INNER JOIN inserted i ON bbvp.MaBBViPham = i.MaBBViPham
    WHERE  i.MaDieuKhoan IS NULL;
END;
GO


-- ================================================================
-- XÁC NHẬN: Danh sách 9 trigger vừa tạo
-- ================================================================
SELECT
    name                   AS TenTrigger,
    OBJECT_NAME(parent_id) AS BangApDung,
    is_disabled            AS BiVoHieuHoa,
    create_date            AS NgayTao
FROM sys.triggers
WHERE OBJECT_NAME(parent_id) IN (
    'LoaiPhong', 'ChiTietDatCoc', 'HopDongThue', 'PhieuGhiChiSo',
    'ChiTietHoaDon', 'HoaDon', 'ChiTietHuHong', 'BienBanViPham'
)
ORDER BY BangApDung, TenTrigger;
GO

PRINT N'';
PRINT N'=== 01_triggers_basic.sql: 9 trigger đã tạo thành công ===';
PRINT N'';
PRINT N'  #01  TRG_LoaiPhong_TinhGiaThueNguyenPhong';
PRINT N'  #02  TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc  ← ĐÃ GỘP (fix thứ tự)';
PRINT N'  #03  TRG_HopDongThue_TinhGiaThueSoGiuong';
PRINT N'  #04  TRG_PhieuGhiChiSo_SetKyGhi';
PRINT N'  #05  TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien';
PRINT N'  #06  TRG_HoaDon_TinhTongTien_OnDelete';
PRINT N'  #07  TRG_HoaDon_TinhTongTien_OnDelete';
PRINT N'  #08  TRG_ChiTietHuHong_CapNhatTongSuaChua';
PRINT N'  #09  TRG_BienBanViPham_TinhSoTienPhat';
PRINT N'  SP   SP_TinhDoiSoat  ← gọi thủ công khi lập đối soát';
GO


-- ================================================================
-- SP: SP_TinhDoiSoat
-- ================================================================
-- Mục đích:
--   Tính toàn bộ cột tài chính cho bảng DoiSoat theo 1 phiếu trả phòng.
--
-- Quy ước tiền thuê:
--   ChiTietHoaDon chỉ lưu tiền dịch vụ phát sinh.
--   Tiền thuê phòng lấy từ HopDongThue.GiaThue.
--
-- Quy ước hóa đơn Tạm tính:
--   Với hợp đồng Hàng quý, hóa đơn tháng có TrangThai = 'Tạm tính'
--   là hóa đơn chờ gom quý, không cho thanh toán trực tiếp.
--   Khi đã có hóa đơn quý Đã TT cho cùng quý thì không tính lại các
--   hóa đơn tháng Tạm tính trong quý đó.
-- ================================================================
IF OBJECT_ID('SP_TinhDoiSoat', 'P') IS NOT NULL
    DROP PROCEDURE SP_TinhDoiSoat;
GO

CREATE PROCEDURE SP_TinhDoiSoat
    @MaPhieuTra VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaHopDong     VARCHAR(6);
    DECLARE @MaPhieuCoc    VARCHAR(6);
    DECLARE @NgayBatDau    DATE;
    DECLARE @NgayKetThuc   DATE;
    DECLARE @NgayTraThucTe DATE;
    DECLARE @GiaThueHD     DECIMAL(15,2);
    DECLARE @KyThanhToanHD NVARCHAR(20);
    DECLARE @MaDoiSoat     VARCHAR(6);

    SELECT
        @MaHopDong     = ptp.MaHopDong,
        @NgayTraThucTe = ptp.NgayTraThucTe,
        @NgayBatDau    = hdt.NgayBatDau,
        @NgayKetThuc   = hdt.NgayKetThuc,
        @GiaThueHD     = hdt.GiaThue,
        @KyThanhToanHD = hdt.KyThanhToan,
        @MaPhieuCoc    = CASE
                             WHEN ptp.MaHopDong IS NOT NULL THEN hdt.MaPhieuCoc
                             ELSE ptp.MaPhieuDatCoc
                         END
    FROM PhieuTraPhong ptp
    LEFT JOIN HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    WHERE ptp.MaPhieuTra = @MaPhieuTra;

    SELECT @MaDoiSoat = MaDoiSoat
    FROM   DoiSoat
    WHERE  MaPhieuTra = @MaPhieuTra;

    IF @MaDoiSoat IS NULL
    BEGIN
        PRINT N'SP_TinhDoiSoat: Chưa có dòng DoiSoat cho MaPhieuTra = ' + @MaPhieuTra;
        PRINT N'  → Hãy INSERT dòng DoiSoat trước, rồi gọi lại SP này.';
        RETURN;
    END;

    DECLARE @TienCocBanDau     DECIMAL(15,2);
    DECLARE @SoThangLuuTru     INT;
    DECLARE @TyLeHoanCoc       DECIMAL(5,2);
    DECLARE @TienCocDuocHoan   DECIMAL(15,2);
    DECLARE @TienThueConNo     DECIMAL(15,2);
    DECLARE @TienDichVuConNo   DECIMAL(15,2);
    DECLARE @TongChiPhiSuaChua DECIMAL(15,2);
    DECLARE @TienPhat          DECIMAL(15,2);
    DECLARE @TongKhauTru       DECIMAL(15,2);
    DECLARE @SoTienHoanThucTe  DECIMAL(15,2);
    DECLARE @SoTienKhachPhaiTT DECIMAL(15,2);
    DECLARE @TrangThai         NVARCHAR(50);

    -- 1. TienCocBanDau
    SELECT @TienCocBanDau = ISNULL(SoTienCoc, 0)
    FROM   PhieuDatCoc
    WHERE  MaPhieuDatCoc = @MaPhieuCoc;

    -- 2. SoThangLuuTru
    SET @SoThangLuuTru = CASE
        WHEN @MaHopDong IS NULL THEN 0
        ELSE ISNULL(DATEDIFF(MONTH, @NgayBatDau, @NgayTraThucTe), 0)
    END;

    -- 3. TyLeHoanCoc
    SET @TyLeHoanCoc = CASE
        WHEN @MaHopDong IS NULL                 THEN 80.00
        WHEN @NgayTraThucTe >= @NgayKetThuc     THEN 100.00
        WHEN @SoThangLuuTru < 6                 THEN 50.00
        ELSE                                         70.00
    END;

    -- 4. TienCocDuocHoan
    SET @TienCocDuocHoan = ISNULL(@TienCocBanDau, 0) * ISNULL(@TyLeHoanCoc, 0) / 100.0;

    ----------------------------------------------------------------
    -- Các hóa đơn còn phải thanh toán dùng cho đối soát
    --  - Hàng tháng: Chưa TT / Nợ
    --  - Hàng quý:
    --      + Tháng Tạm tính được tính nếu quý đó chưa có hóa đơn quý Đã TT
    --      + Chưa TT / Nợ vẫn được tính
    --  - Đã TT không bao giờ tính nợ
    ----------------------------------------------------------------
    DECLARE @HoaDonConNo TABLE (
        MaHoaDon VARCHAR(6) PRIMARY KEY
    );

    INSERT INTO @HoaDonConNo (MaHoaDon)
    SELECT hd.MaHoaDon
    FROM HoaDon hd
    WHERE hd.MaHopDong = @MaHopDong
      AND (
            (
                @KyThanhToanHD = N'Hàng tháng'
                AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
            )
            OR
            (
                @KyThanhToanHD = N'Hàng quý'
                AND hd.KyThanhToan NOT LIKE '%-Q%'
                AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
            )
            OR
            (
                @KyThanhToanHD = N'Hàng quý'
                AND hd.KyThanhToan NOT LIKE '%-Q%'
                AND hd.TrangThai = N'Tạm tính'
                AND NOT EXISTS (
                    SELECT 1
                    FROM HoaDon hdq
                    WHERE hdq.MaHopDong = hd.MaHopDong
                    AND hdq.KyThanhToan LIKE '%-Q%'
                    AND hdq.TrangThai = N'Đã TT'
                    -- Hóa đơn quý Đã TT bao phủ 3 tháng kết thúc tại tháng lập hóa đơn quý.
                    -- Ví dụ: NgayLap = 2026-04-30 => bao phủ 2026-02, 2026-03, 2026-04.
                    AND TRY_CONVERT(date, hd.KyThanhToan + '-01') BETWEEN
                        DATEADD(MONTH, -2, DATEFROMPARTS(YEAR(hdq.NgayLap), MONTH(hdq.NgayLap), 1))
                        AND DATEFROMPARTS(YEAR(hdq.NgayLap), MONTH(hdq.NgayLap), 1)
                )
            )
          );

    -- 5. TienThueConNo
    -- ChiTietHoaDon không có tiền thuê, nên tiền thuê còn nợ = số hóa đơn tháng còn nợ * GiaThue hợp đồng.
    SELECT @TienThueConNo = ISNULL(COUNT(*), 0) * ISNULL(@GiaThueHD, 0)
    FROM @HoaDonConNo;

    -- 6. TienDichVuConNo
    -- Chỉ lấy tổng dịch vụ trong ChiTietHoaDon của các hóa đơn còn phải thanh toán.
    SELECT @TienDichVuConNo = ISNULL(SUM(cthd.ThanhTien), 0)
    FROM @HoaDonConNo hdn
    INNER JOIN ChiTietHoaDon cthd ON cthd.MaHoaDon = hdn.MaHoaDon;

    -- 7. TongChiPhiSuaChua
    SELECT @TongChiPhiSuaChua = ISNULL(SUM(bbkt.TongChiPhiSuaChua), 0)
    FROM   BienBanKiemTraPhong bbkt
    WHERE  bbkt.MaPhieuTra = @MaPhieuTra;

    -- 8. TienPhat
    SELECT @TienPhat = ISNULL(SUM(bbvp.SoTienPhat), 0)
    FROM   BienBanViPham bbvp
    WHERE  bbvp.MaHopDong = @MaHopDong
      AND  bbvp.TrangThai = N'Chờ xử lý';

    -- 9. TongKhauTru
    SET @TongKhauTru = ISNULL(@TienThueConNo, 0)
                     + ISNULL(@TienDichVuConNo, 0)
                     + ISNULL(@TongChiPhiSuaChua, 0)
                     + ISNULL(@TienPhat, 0);

    -- 10. SoTienHoanThucTe
    SET @SoTienHoanThucTe = CASE
        WHEN @TienCocDuocHoan > @TongKhauTru
        THEN @TienCocDuocHoan - @TongKhauTru
        ELSE 0
    END;

    -- 11. SoTienKhachPhaiTT
    SET @SoTienKhachPhaiTT = CASE
        WHEN @TongKhauTru > @TienCocDuocHoan
        THEN @TongKhauTru - @TienCocDuocHoan
        ELSE 0
    END;

    -- 12. TrangThai đối soát
    SET @TrangThai = CASE
        WHEN @SoTienHoanThucTe  > 0 THEN N'Chờ hoàn cọc'
        WHEN @SoTienKhachPhaiTT > 0 THEN N'Chờ thanh toán thêm'
        ELSE                             N'Đã quyết toán'
    END;

    UPDATE DoiSoat
    SET
        TienCocBanDau      = @TienCocBanDau,
        SoThangLuuTru      = @SoThangLuuTru,
        TyLeHoanCocHienTai = @TyLeHoanCoc,
        TienCocDuocHoan    = @TienCocDuocHoan,
        TienThueConNo      = @TienThueConNo,
        TienDichVuConNo    = @TienDichVuConNo,
        TongChiPhiSuaChua  = @TongChiPhiSuaChua,
        TienPhat           = @TienPhat,
        TongKhauTru        = @TongKhauTru,
        SoTienHoanThucTe   = @SoTienHoanThucTe,
        SoTienKhachPhaiTT  = @SoTienKhachPhaiTT,
        TrangThai          = @TrangThai
    WHERE MaPhieuTra = @MaPhieuTra;

END;
GO
IF OBJECT_ID('TRG_Phong_CapNhatGioiTinhChoPhep', 'TR') IS NOT NULL
    DROP TRIGGER TRG_Phong_CapNhatGioiTinhChoPhep;
GO

CREATE TRIGGER TRG_Phong_CapNhatGioiTinhChoPhep
ON ThanhVienHopDong
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PhongBiAnhHuong TABLE (
        MaPhong VARCHAR(4) PRIMARY KEY
    );

    INSERT INTO @PhongBiAnhHuong (MaPhong)
    SELECT DISTINCT ctdc.MaPhong
    FROM inserted i
    JOIN HopDongThue hdt 
        ON i.MaHopDong = hdt.MaHopDong
    JOIN ChiTietDatCoc ctdc 
        ON hdt.MaPhieuCoc = ctdc.MaPhieuDatCoc

    UNION

    SELECT DISTINCT ctdc.MaPhong
    FROM deleted d
    JOIN HopDongThue hdt 
        ON d.MaHopDong = hdt.MaHopDong
    JOIN ChiTietDatCoc ctdc 
        ON hdt.MaPhieuCoc = ctdc.MaPhieuDatCoc;


    IF EXISTS (
        SELECT 1
        FROM @PhongBiAnhHuong pbh
        JOIN ChiTietDatCoc ctdc 
            ON pbh.MaPhong = ctdc.MaPhong
        JOIN HopDongThue hdt 
            ON ctdc.MaPhieuDatCoc = hdt.MaPhieuCoc
        JOIN ThanhVienHopDong tvhd 
            ON hdt.MaHopDong = tvhd.MaHopDong
        WHERE tvhd.TrangThai = N'Đang ở'
          AND hdt.TrangThai = N'Hiệu lực'
        GROUP BY pbh.MaPhong
        HAVING COUNT(DISTINCT tvhd.GioiTinh) > 1
    )
    BEGIN
        RAISERROR(N'Không thể xếp Nam và Nữ vào cùng một phòng.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;


    UPDATE p
    SET p.GioiTinhChoPhep = COALESCE(CAST(gt.GioiTinh AS NVARCHAR(20)), N'Không phân biệt')
    FROM Phong p
    JOIN @PhongBiAnhHuong pbh 
        ON p.MaPhong = pbh.MaPhong
    OUTER APPLY (
        SELECT MAX(CAST(tvhd.GioiTinh AS NVARCHAR(20))) AS GioiTinh
        FROM ChiTietDatCoc ctdc
        JOIN HopDongThue hdt 
            ON ctdc.MaPhieuDatCoc = hdt.MaPhieuCoc
        JOIN ThanhVienHopDong tvhd 
            ON hdt.MaHopDong = tvhd.MaHopDong
        WHERE ctdc.MaPhong = p.MaPhong
          AND hdt.TrangThai = N'Hiệu lực'
          AND tvhd.TrangThai = N'Đang ở'
    ) gt;
END;
GO
