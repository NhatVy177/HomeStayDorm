USE HOMEDORM4;
GO

-- ================================================================
-- FILE: 03_backfill.sql  (PHIÊN BẢN ĐÃ SỬA THEO CHECKLIST)
-- Database: HOMEDORM4
-- Thứ tự fill:
--   1.  LoaiPhong.GiaThueNguyenPhong
--   2.  ChiTietDatCoc.GiaThue
--   3.  PhieuDatCoc.SoTienCoc
--   4.  HopDongThue.GiaThue + SoGiuongThue
--   5.  PhieuGhiChiSo.KyGhi
--   6.  ChiTietHoaDon.SoLuong
--   7.  ChiTietHoaDon.ThanhTien
--   8.  HoaDon.TongTien
--   9.  BienBanKiemTraPhong.TongChiPhiSuaChua
--   10. BienBanViPham.SoTienPhat
--   11. DoiSoat → gọi SP_TinhDoiSoat cho từng phiếu trả phòng
--
-- Cách chạy:
--   1. schema.sql → 2. Data.sql → 3. 01_triggers_basic.sql
--   4. File này:  EXEC SP_Backfill_DuLieuSuyDienNull;
-- ================================================================


-- ================================================================
-- SP PHỤ: SP_TinhDoiSoat
-- Mục đích: Tính toàn bộ cột tài chính cho 1 phiếu trả phòng cụ thể.
-- Dùng trong:
--   - Backfill dữ liệu cũ (gọi cho từng MaPhieuTra)
--   - Nghiệp vụ mới: khi nhân viên lập phiếu đối soát
--
-- Logic TyLeHoanCoc:
--   Chưa ký HĐ (MaHopDong IS NULL)       → 80%
--   Trả đúng/sau hạn                      → 100%
--   Trả trước hạn, lưu trú < 6 tháng     → 50%
--   Trả trước hạn, lưu trú >= 6 tháng    → 70%
--
-- Logic TrangThai đối soát:
--   SoTienHoanThucTe > 0  → 'Chờ hoàn cọc'
--   SoTienKhachPhaiTT > 0 → 'Chờ thanh toán thêm'
--   Cả hai = 0            → 'Đã quyết toán'
-- ================================================================
IF OBJECT_ID('SP_TinhDoiSoat', 'P') IS NOT NULL
    DROP PROCEDURE SP_TinhDoiSoat;
GO

CREATE PROCEDURE SP_TinhDoiSoat
    @MaPhieuTra VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Biến lưu thông tin cơ bản
    DECLARE @MaHopDong      VARCHAR(6);
    DECLARE @MaPhieuCoc     VARCHAR(6);
    DECLARE @NgayBatDau     DATE;
    DECLARE @NgayKetThuc    DATE;
    DECLARE @NgayTraThucTe  DATE;
    DECLARE @MaDoiSoat      VARCHAR(6);
    DECLARE @GiaThueHD      DECIMAL(15,2);

    -- Lấy thông tin từ PhieuTraPhong → HopDongThue
    SELECT
        @MaHopDong     = ptp.MaHopDong,
        @NgayTraThucTe = ptp.NgayTraThucTe,
        @NgayBatDau    = hdt.NgayBatDau,
        @NgayKetThuc   = hdt.NgayKetThuc,
        @MaPhieuCoc    = CASE WHEN ptp.MaHopDong IS NOT NULL
                              THEN hdt.MaPhieuCoc
                              ELSE ptp.MaPhieuDatCoc
                         END,
        @GiaThueHD     = hdt.GiaThue
    FROM PhieuTraPhong ptp
    LEFT JOIN HopDongThue hdt ON hdt.MaHopDong = ptp.MaHopDong
    WHERE ptp.MaPhieuTra = @MaPhieuTra;

    -- Lấy MaDoiSoat liên kết (nếu đã có)
    SELECT @MaDoiSoat = MaDoiSoat
    FROM   DoiSoat
    WHERE  MaPhieuTra = @MaPhieuTra;

    IF @MaDoiSoat IS NULL
    BEGIN
        PRINT N'SP_TinhDoiSoat: Không tìm thấy DoiSoat cho MaPhieuTra = ' + @MaPhieuTra;
        RETURN;
    END;

    -- Tính toán các biến trung gian
    DECLARE @TienCocBanDau      DECIMAL(15,2);
    DECLARE @SoThangLuuTru      INT;
    DECLARE @TyLeHoanCoc        DECIMAL(5,2);
    DECLARE @TienCocDuocHoan    DECIMAL(15,2);
    DECLARE @TienThueConNo      DECIMAL(15,2);
    DECLARE @TienDichVuConNo    DECIMAL(15,2);
    DECLARE @TongChiPhiSuaChua  DECIMAL(15,2);
    DECLARE @TienPhat           DECIMAL(15,2);
    DECLARE @TongKhauTru        DECIMAL(15,2);
    DECLARE @SoTienHoanThucTe   DECIMAL(15,2);
    DECLARE @SoTienKhachPhaiTT  DECIMAL(15,2);
    DECLARE @TrangThai          NVARCHAR(50);

    -- 1. TienCocBanDau: từ PhieuDatCoc
    SELECT @TienCocBanDau = ISNULL(SoTienCoc, 0)
    FROM   PhieuDatCoc
    WHERE  MaPhieuDatCoc = @MaPhieuCoc;

    -- 2. SoThangLuuTru
    SET @SoThangLuuTru =
        CASE WHEN @MaHopDong IS NULL THEN 0
             ELSE ISNULL(DATEDIFF(MONTH, @NgayBatDau, @NgayTraThucTe), 0)
        END;

    -- 3. TyLeHoanCoc
    SET @TyLeHoanCoc =
        CASE
            WHEN @MaHopDong IS NULL                    THEN 80.00
            WHEN @NgayTraThucTe >= @NgayKetThuc        THEN 100.00
            WHEN @SoThangLuuTru < 6                    THEN 50.00
            ELSE                                            70.00
        END;

    -- 4. TienCocDuocHoan
    SET @TienCocDuocHoan = @TienCocBanDau * @TyLeHoanCoc / 100.0;

    -- 5. TienThueConNo: hóa đơn tiền thuê phòng chưa thanh toán
    SELECT @TienThueConNo = ISNULL(SUM(cthd.ThanhTien), 0)
    FROM   ChiTietHoaDon cthd
    INNER JOIN DichVuHopDong dvhd ON dvhd.MaChiTietDVHD = cthd.MaChiTietDVHD
    INNER JOIN DichVu        dv   ON dv.MaDichVu         = dvhd.MaDichVu
    INNER JOIN HoaDon        hd   ON hd.MaHoaDon         = cthd.MaHoaDon
    WHERE  hd.MaHopDong  = @MaHopDong
      AND  hd.TrangThai  IN (N'Chưa TT', N'Nợ', N'Tạm tính')
      AND  dv.DonViTinh  = N'tháng'
      AND  cthd.DonGia   = @GiaThueHD;   -- phân biệt tiền thuê với wifi/gửi xe

    -- 6. TienDichVuConNo: điện, nước, wifi, gửi xe... chưa thanh toán
    SELECT @TienDichVuConNo = ISNULL(SUM(cthd.ThanhTien), 0)
    FROM   ChiTietHoaDon cthd
    INNER JOIN DichVuHopDong dvhd ON dvhd.MaChiTietDVHD = cthd.MaChiTietDVHD
    INNER JOIN DichVu        dv   ON dv.MaDichVu         = dvhd.MaDichVu
    INNER JOIN HoaDon        hd   ON hd.MaHoaDon         = cthd.MaHoaDon
    WHERE  hd.MaHopDong  = @MaHopDong
      AND  hd.TrangThai  IN (N'Chưa TT', N'Nợ', N'Tạm tính')
      AND  cthd.DonGia  <> @GiaThueHD;  -- loại trừ dòng tiền thuê

    -- 7. TongChiPhiSuaChua: từ biên bản kiểm tra phòng
    SELECT @TongChiPhiSuaChua = ISNULL(SUM(bbkt.TongChiPhiSuaChua), 0)
    FROM   BienBanKiemTraPhong bbkt
    WHERE  bbkt.MaPhieuTra = @MaPhieuTra;

    -- 8. TienPhat: chỉ tính biên bản vi phạm trạng thái 'Chờ xử lý'
    --    (tránh tính trùng biên bản đã xử lý / đã thu ở kỳ trước)
    SELECT @TienPhat = ISNULL(SUM(bbvp.SoTienPhat), 0)
    FROM   BienBanViPham bbvp
    WHERE  bbvp.MaHopDong = @MaHopDong
      AND  bbvp.TrangThai  = N'Chờ xử lý';

    -- 9. TongKhauTru
    SET @TongKhauTru = @TienThueConNo + @TienDichVuConNo
                     + @TongChiPhiSuaChua + @TienPhat;

    -- 10. SoTienHoanThucTe = MAX(TienCocDuocHoan - TongKhauTru, 0)
    SET @SoTienHoanThucTe =
        CASE WHEN @TienCocDuocHoan > @TongKhauTru
             THEN @TienCocDuocHoan - @TongKhauTru
             ELSE 0
        END;

    -- 11. SoTienKhachPhaiTT = MAX(TongKhauTru - TienCocDuocHoan, 0)
    SET @SoTienKhachPhaiTT =
        CASE WHEN @TongKhauTru > @TienCocDuocHoan
             THEN @TongKhauTru - @TienCocDuocHoan
             ELSE 0
        END;

    -- 12. TrangThai đối soát
    SET @TrangThai =
        CASE
            WHEN @SoTienHoanThucTe  > 0 THEN N'Chờ hoàn cọc'
            WHEN @SoTienKhachPhaiTT > 0 THEN N'Chờ thanh toán thêm'
            ELSE                             N'Đã quyết toán'
        END;

    -- Cập nhật vào bảng DoiSoat
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


-- ================================================================
-- SP CHÍNH: SP_Backfill_DuLieuSuyDienNull
-- Fill lại tất cả cột suy diễn đang NULL trong Data.sql
-- ================================================================
IF OBJECT_ID('SP_Backfill_DuLieuSuyDienNull', 'P') IS NOT NULL
    DROP PROCEDURE SP_Backfill_DuLieuSuyDienNull;
GO

CREATE PROCEDURE SP_Backfill_DuLieuSuyDienNull
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SoHang1 INT;  -- dòng ảnh hưởng nhánh 1
    DECLARE @SoHang2 INT;  -- dòng ảnh hưởng nhánh 2
    DECLARE @MaPhieuTra VARCHAR(6);

    PRINT N'=== BẮT ĐẦU BACKFILL DỮ LIỆU NULL ===';
    PRINT N'';

    -- ============================================================
    -- BƯỚC 1: LoaiPhong.GiaThueNguyenPhong
    -- ============================================================
    PRINT N'--- 1. LoaiPhong.GiaThueNguyenPhong ---';

    UPDATE LoaiPhong
    SET    GiaThueNguyenPhong = SucChuaToiDa * GiaThueTheoGiuong
    WHERE  GiaThueNguyenPhong IS NULL
      AND  SucChuaToiDa       IS NOT NULL
      AND  GiaThueTheoGiuong  IS NOT NULL;

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 2: ChiTietDatCoc.GiaThue
    -- [FIX] Cộng tổng @@ROWCOUNT của cả ghép giường và nguyên căn
    -- ============================================================
    PRINT N'--- 2. ChiTietDatCoc.GiaThue ---';

    -- Ghép giường
    UPDATE ctdc
    SET    ctdc.GiaThue = lp.GiaThueTheoGiuong
    FROM   ChiTietDatCoc ctdc
    INNER JOIN Phong     p  ON p.MaPhong      = ctdc.MaPhong
    INNER JOIN LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE  ctdc.GiaThue IS NULL AND ctdc.MaGiuong IS NOT NULL
      AND  lp.GiaThueTheoGiuong IS NOT NULL;
    SET @SoHang1 = @@ROWCOUNT;

    -- Nguyên căn
    UPDATE ctdc
    SET    ctdc.GiaThue = lp.GiaThueNguyenPhong
    FROM   ChiTietDatCoc ctdc
    INNER JOIN Phong     p  ON p.MaPhong      = ctdc.MaPhong
    INNER JOIN LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE  ctdc.GiaThue IS NULL AND ctdc.MaGiuong IS NULL
      AND  lp.GiaThueNguyenPhong IS NOT NULL;
    SET @SoHang2 = @@ROWCOUNT;

    PRINT N'  → Ghép giường: ' + CAST(@SoHang1 AS NVARCHAR) + N' dòng';
    PRINT N'  → Nguyên căn:  ' + CAST(@SoHang2 AS NVARCHAR) + N' dòng';
    PRINT N'  → Tổng:        ' + CAST(@SoHang1 + @SoHang2 AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 3: PhieuDatCoc.SoTienCoc = SUM(GiaThue) × 2
    -- ============================================================
    PRINT N'--- 3. PhieuDatCoc.SoTienCoc ---';

    UPDATE pdc
    SET    pdc.SoTienCoc = sub.TongGia * 2
    FROM   PhieuDatCoc pdc
    INNER JOIN (
        SELECT MaPhieuDatCoc, SUM(GiaThue) AS TongGia
        FROM   ChiTietDatCoc
        WHERE  GiaThue IS NOT NULL
        GROUP BY MaPhieuDatCoc
    ) sub ON sub.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    WHERE  pdc.SoTienCoc IS NULL;

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 4: HopDongThue.GiaThue + SoGiuongThue
    -- [FIX] Cộng tổng @@ROWCOUNT của cả 2 trường hợp
    -- ============================================================
    PRINT N'--- 4. HopDongThue.GiaThue + SoGiuongThue ---';

    -- Nguyên phòng
    UPDATE hdt
    SET    hdt.GiaThue      = lp.GiaThueNguyenPhong,
           hdt.SoGiuongThue = lp.SucChuaToiDa
    FROM   HopDongThue   hdt
    INNER JOIN PhieuDatCoc   pdc  ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
    INNER JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                                  AND ctdc.MaGiuong IS NULL
    INNER JOIN Phong         p    ON p.MaPhong       = ctdc.MaPhong
    INNER JOIN LoaiPhong     lp   ON lp.MaLoaiPhong  = p.MaLoaiPhong
    WHERE  pdc.HinhThucThue = N'Nguyên phòng'
      AND  (hdt.GiaThue IS NULL OR hdt.SoGiuongThue IS NULL);
    SET @SoHang1 = @@ROWCOUNT;

    -- Ghép giường
    UPDATE hdt
    SET    hdt.GiaThue      = sub.TongGia,
           hdt.SoGiuongThue = sub.SoGiuong
    FROM   HopDongThue hdt
    INNER JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
    INNER JOIN (
        SELECT MaPhieuDatCoc, SUM(GiaThue) AS TongGia, COUNT(MaGiuong) AS SoGiuong
        FROM   ChiTietDatCoc
        WHERE  MaGiuong IS NOT NULL AND GiaThue IS NOT NULL
        GROUP BY MaPhieuDatCoc
    ) sub ON sub.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    WHERE  pdc.HinhThucThue = N'Ghép giường'
      AND  (hdt.GiaThue IS NULL OR hdt.SoGiuongThue IS NULL);
    SET @SoHang2 = @@ROWCOUNT;

    PRINT N'  → Nguyên phòng: ' + CAST(@SoHang1 AS NVARCHAR) + N' dòng';
    PRINT N'  → Ghép giường:  ' + CAST(@SoHang2 AS NVARCHAR) + N' dòng';
    PRINT N'  → Tổng:         ' + CAST(@SoHang1 + @SoHang2 AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 5: PhieuGhiChiSo.KyGhi = FORMAT(NgayGhi, 'yyyy-MM')
    -- ============================================================
    PRINT N'--- 5. PhieuGhiChiSo.KyGhi ---';

    UPDATE PhieuGhiChiSo
    SET    KyGhi = FORMAT(NgayGhi, 'yyyy-MM')
    WHERE  NgayGhi IS NOT NULL
      AND  (KyGhi IS NULL OR KyGhi <> FORMAT(NgayGhi, 'yyyy-MM'));

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 6: ChiTietHoaDon.SoLuong
    -- ============================================================
    PRINT N'--- 6. ChiTietHoaDon.SoLuong ---';

    -- 6a: Dịch vụ tháng cố định → SoLuong = 1
    UPDATE ChiTietHoaDon
    SET    SoLuong = 1
    WHERE  SoLuong IS NULL AND DonViTinh = N'tháng';
    PRINT N'  → Dịch vụ tháng (=1): ' + CAST(@@ROWCOUNT AS NVARCHAR);

    -- 6b: Điện — Nguyên phòng
    UPDATE cthd
    SET    cthd.SoLuong = (pgcs.ChiSoDienCuoi - pgcs.ChiSoDienDau)
    FROM   ChiTietHoaDon cthd
    INNER JOIN HoaDon        hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue   hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc   pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN PhieuGhiChiSo pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
    WHERE  cthd.SoLuong IS NULL AND cthd.DonViTinh = N'kWh'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Nguyên phòng';
    PRINT N'  → Điện nguyên phòng:  ' + CAST(@@ROWCOUNT AS NVARCHAR);

    -- 6c: Nước — Nguyên phòng
    UPDATE cthd
    SET    cthd.SoLuong = (pgcs.ChiSoNuocCuoi - pgcs.ChiSoNuocDau)
    FROM   ChiTietHoaDon cthd
    INNER JOIN HoaDon        hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue   hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc   pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN PhieuGhiChiSo pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
    WHERE  cthd.SoLuong IS NULL AND cthd.DonViTinh = N'm3'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Nguyên phòng';
    PRINT N'  → Nước nguyên phòng:  ' + CAST(@@ROWCOUNT AS NVARCHAR);

    -- 6d: Điện — Ghép giường (chia theo tỉ lệ giường)
    UPDATE cthd
    SET cthd.SoLuong = CAST(
            (pgcs.ChiSoDienCuoi - pgcs.ChiSoDienDau)
            * CAST(hdt.SoGiuongThue AS DECIMAL(10,4))
            / CAST(phong_kt.TongGiuong AS DECIMAL(10,4))
        AS DECIMAL(10,2))
    FROM ChiTietHoaDon cthd
    INNER JOIN HoaDon        hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue   hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc   pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                                  AND ctdc.MaGiuong IS NOT NULL
    INNER JOIN PhieuGhiChiSo pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
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
    ) phong_kt ON phong_kt.MaPhong = ctdc.MaPhong AND phong_kt.KyGhi = pgcs.KyGhi
    WHERE  cthd.SoLuong IS NULL AND cthd.DonViTinh = N'kWh'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Ghép giường'
      AND  phong_kt.TongGiuong > 0;
    PRINT N'  → Điện ghép giường:   ' + CAST(@@ROWCOUNT AS NVARCHAR);

    -- 6e: Nước — Ghép giường
    UPDATE cthd
    SET cthd.SoLuong = CAST(
            (pgcs.ChiSoNuocCuoi - pgcs.ChiSoNuocDau)
            * CAST(hdt.SoGiuongThue AS DECIMAL(10,4))
            / CAST(phong_kt.TongGiuong AS DECIMAL(10,4))
        AS DECIMAL(10,2))
    FROM ChiTietHoaDon cthd
    INNER JOIN HoaDon        hd   ON hd.MaHoaDon        = cthd.MaHoaDon
    INNER JOIN HopDongThue   hdt  ON hdt.MaHopDong      = hd.MaHopDong
    INNER JOIN PhieuDatCoc   pdc  ON pdc.MaPhieuDatCoc  = hdt.MaPhieuCoc
    INNER JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
                                  AND ctdc.MaGiuong IS NOT NULL
    INNER JOIN PhieuGhiChiSo pgcs ON pgcs.MaPhieuGhi    = cthd.MaPhieuGhi
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
    ) phong_kt ON phong_kt.MaPhong = ctdc.MaPhong AND phong_kt.KyGhi = pgcs.KyGhi
    WHERE  cthd.SoLuong IS NULL AND cthd.DonViTinh = N'm3'
      AND  cthd.MaPhieuGhi IS NOT NULL
      AND  pdc.HinhThucThue = N'Ghép giường'
      AND  phong_kt.TongGiuong > 0;
    PRINT N'  → Nước ghép giường:   ' + CAST(@@ROWCOUNT AS NVARCHAR);
    PRINT N'';


    -- ============================================================
    -- BƯỚC 7: ChiTietHoaDon.ThanhTien = SoLuong × DonGia
    -- ============================================================
    PRINT N'--- 7. ChiTietHoaDon.ThanhTien ---';

    UPDATE ChiTietHoaDon
    SET    ThanhTien = SoLuong * DonGia
    WHERE  ThanhTien IS NULL AND SoLuong IS NOT NULL AND DonGia IS NOT NULL;

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 8: HoaDon.TongTien = SUM(ChiTietHoaDon.ThanhTien)
    -- ============================================================
    PRINT N'--- 8. HoaDon.TongTien ---';

    UPDATE hd
    SET    hd.TongTien = ISNULL(
               (SELECT SUM(c.ThanhTien) FROM ChiTietHoaDon c
                WHERE  c.MaHoaDon = hd.MaHoaDon AND c.ThanhTien IS NOT NULL), 0)
    FROM   HoaDon hd
    WHERE  hd.TongTien IS NULL;

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 9: BienBanKiemTraPhong.TongChiPhiSuaChua
    -- ============================================================
    PRINT N'--- 9. BienBanKiemTraPhong.TongChiPhiSuaChua ---';

    UPDATE bbkt
    SET    bbkt.TongChiPhiSuaChua = ISNULL(
               (SELECT SUM(h.ChiPhiSuaChua) FROM ChiTietHuHong h
                WHERE  h.MaBienBanKT = bbkt.MaBienBanKT), 0)
    FROM   BienBanKiemTraPhong bbkt
    WHERE  bbkt.TongChiPhiSuaChua IS NULL;

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 10: BienBanViPham.SoTienPhat
    -- ============================================================
    PRINT N'--- 10. BienBanViPham.SoTienPhat ---';

    UPDATE bbvp
    SET    bbvp.SoTienPhat =
               CASE WHEN dkvp.HinhThucXuPhat = N'Phạt tiền'
                    THEN ISNULL(dkvp.MucPhat, 0) ELSE 0 END
    FROM   BienBanViPham bbvp
    INNER JOIN DieuKhoanViPham dkvp ON dkvp.MaDieuKhoan = bbvp.MaDieuKhoan
    WHERE  bbvp.SoTienPhat IS NULL AND bbvp.MaDieuKhoan IS NOT NULL;

    PRINT N'  → Đã cập nhật: ' + CAST(@@ROWCOUNT AS NVARCHAR) + N' dòng';
    PRINT N'';


    -- ============================================================
    -- BƯỚC 11: DoiSoat — gọi SP_TinhDoiSoat cho từng phiếu trả phòng
    -- [SUA] Không copy lại logic dài, gọi SP riêng để dễ maintain
    -- ============================================================
    PRINT N'--- 11. DoiSoat (gọi SP_TinhDoiSoat cho từng phiếu) ---';

    DECLARE cur_ds CURSOR FAST_FORWARD FOR
        SELECT ds.MaPhieuTra
        FROM   DoiSoat ds
        WHERE  ds.TienCocBanDau IS NULL
            OR ds.SoThangLuuTru IS NULL
            OR ds.TyLeHoanCocHienTai IS NULL;

    OPEN cur_ds;
    FETCH NEXT FROM cur_ds INTO @MaPhieuTra;

    DECLARE @DemDS INT = 0;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC SP_TinhDoiSoat @MaPhieuTra;
        SET @DemDS = @DemDS + 1;
        FETCH NEXT FROM cur_ds INTO @MaPhieuTra;
    END;

    CLOSE cur_ds;
    DEALLOCATE cur_ds;

    PRINT N'  → Đã tính đối soát: ' + CAST(@DemDS AS NVARCHAR) + N' phiếu';
    PRINT N'';


    -- ============================================================
    -- KIỂM TRA: Số NULL còn sót
    -- ============================================================
    PRINT N'=== KIỂM TRA NULL CÒN SÓT ===';

    SELECT Cot, SoNullConLai FROM (
        SELECT N'LoaiPhong.GiaThueNguyenPhong'   AS Cot, COUNT(*) AS SoNullConLai
        FROM LoaiPhong WHERE GiaThueNguyenPhong IS NULL
        UNION ALL
        SELECT N'PhieuDatCoc.SoTienCoc',           COUNT(*)
        FROM PhieuDatCoc WHERE SoTienCoc IS NULL
        UNION ALL
        SELECT N'ChiTietDatCoc.GiaThue',           COUNT(*)
        FROM ChiTietDatCoc WHERE GiaThue IS NULL
        UNION ALL
        SELECT N'HopDongThue.GiaThue',             COUNT(*)
        FROM HopDongThue WHERE GiaThue IS NULL
        UNION ALL
        SELECT N'ChiTietHoaDon.SoLuong',           COUNT(*)
        FROM ChiTietHoaDon WHERE SoLuong IS NULL
        UNION ALL
        SELECT N'ChiTietHoaDon.ThanhTien',         COUNT(*)
        FROM ChiTietHoaDon WHERE ThanhTien IS NULL
        UNION ALL
        SELECT N'HoaDon.TongTien',                 COUNT(*)
        FROM HoaDon WHERE TongTien IS NULL
        UNION ALL
        SELECT N'BienBanKiemTraPhong.TongChiPhi',  COUNT(*)
        FROM BienBanKiemTraPhong WHERE TongChiPhiSuaChua IS NULL
        UNION ALL
        SELECT N'DoiSoat.TienCocBanDau',           COUNT(*)
        FROM DoiSoat WHERE TienCocBanDau IS NULL
        UNION ALL
        SELECT N'DoiSoat.TyLeHoanCocHienTai',      COUNT(*)
        FROM DoiSoat WHERE TyLeHoanCocHienTai IS NULL
        UNION ALL
        SELECT N'DoiSoat.SoTienHoanThucTe',        COUNT(*)
        FROM DoiSoat WHERE SoTienHoanThucTe IS NULL
    ) kt
    ORDER BY SoNullConLai DESC;

    PRINT N'';
    PRINT N'=== BACKFILL HOÀN THÀNH ===';
END;
GO


-- ================================================================
-- THỰC THI: Chạy backfill ngay
-- ================================================================
EXEC SP_Backfill_DuLieuSuyDienNull;
GO


-- ================================================================
-- XEM KẾT QUẢ SAU KHI BACKFILL
-- Chạy từng khối SELECT để kiểm tra từng bảng
-- ================================================================

-- ---------------------------------------------------------------
-- 1. LoaiPhong — Giá thuê nguyên phòng đã được tính chưa?
-- ---------------------------------------------------------------
PRINT N'== 1. LoaiPhong ==';
SELECT
    MaLoaiPhong,
    TenLoaiPhong,
    SucChuaToiDa,
    FORMAT(GiaThueTheoGiuong,  'N0', 'vi-VN') AS GiaThue_1Giuong,
    FORMAT(GiaThueNguyenPhong, 'N0', 'vi-VN') AS GiaThue_NguyenPhong,
    CASE WHEN GiaThueNguyenPhong = SucChuaToiDa * GiaThueTheoGiuong
         THEN N'✅ Đúng'
         ELSE N'❌ Sai / NULL'
    END AS KiemTra
FROM LoaiPhong
ORDER BY MaLoaiPhong;
GO

-- ---------------------------------------------------------------
-- 2. ChiTietDatCoc + PhieuDatCoc — GiaThue và SoTienCoc
-- ---------------------------------------------------------------
PRINT N'== 2. ChiTietDatCoc & PhieuDatCoc ==';
SELECT
    ctdc.MaChiTietDC,
    ctdc.MaPhieuDatCoc,
    ctdc.MaPhong,
    ctdc.MaGiuong,
    CASE WHEN ctdc.MaGiuong IS NULL THEN N'Nguyên căn' ELSE N'Ghép giường' END AS HinhThuc,
    FORMAT(ctdc.GiaThue, 'N0', 'vi-VN')    AS GiaThue,
    FORMAT(pdc.SoTienCoc, 'N0', 'vi-VN')   AS SoTienCoc_Phieu,
    CASE WHEN ctdc.GiaThue IS NULL THEN N'❌ NULL' ELSE N'✅' END AS KT_GiaThue
FROM ChiTietDatCoc ctdc
INNER JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
ORDER BY ctdc.MaPhieuDatCoc, ctdc.MaChiTietDC;
GO

-- ---------------------------------------------------------------
-- 3. HopDongThue — GiaThue và SoGiuongThue
-- ---------------------------------------------------------------
PRINT N'== 3. HopDongThue ==';
SELECT
    hdt.MaHopDong,
    hdt.MaPhieuCoc,
    pdc.HinhThucThue,
    hdt.SoGiuongThue,
    FORMAT(hdt.GiaThue, 'N0', 'vi-VN')  AS GiaThue,
    hdt.KyThanhToan,
    hdt.TrangThai,
    CASE WHEN hdt.GiaThue IS NULL OR hdt.SoGiuongThue IS NULL
         THEN N'❌ NULL' ELSE N'✅' END   AS KiemTra
FROM HopDongThue hdt
INNER JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
ORDER BY hdt.MaHopDong;
GO

-- ---------------------------------------------------------------
-- 4. PhieuGhiChiSo — KyGhi đã đúng định dạng yyyy-MM chưa?
-- ---------------------------------------------------------------
PRINT N'== 4. PhieuGhiChiSo ==';
SELECT
    MaPhieuGhi,
    MaPhong,
    CONVERT(VARCHAR(10), NgayGhi, 120) AS NgayGhi,
    KyGhi,
    ChiSoDienDau, ChiSoDienCuoi, (ChiSoDienCuoi - ChiSoDienDau) AS TieuThu_kWh,
    ChiSoNuocDau, ChiSoNuocCuoi, (ChiSoNuocCuoi - ChiSoNuocDau) AS TieuThu_m3,
    CASE WHEN KyGhi = FORMAT(NgayGhi, 'yyyy-MM')
         THEN N'✅' ELSE N'❌ Sai' END AS KiemTra
FROM PhieuGhiChiSo
ORDER BY MaPhong, NgayGhi;
GO

-- ---------------------------------------------------------------
-- 5. ChiTietHoaDon — SoLuong và ThanhTien
-- ---------------------------------------------------------------
PRINT N'== 5. ChiTietHoaDon (mẫu 30 dòng đầu) ==';
SELECT TOP 30
    cthd.MaChiTietHD,
    cthd.MaHoaDon,
    hd.MaHopDong,
    hd.KyThanhToan,
    dv.TenDichVu,
    cthd.DonViTinh,
    cthd.SoLuong,
    FORMAT(cthd.DonGia,    'N0', 'vi-VN') AS DonGia,
    FORMAT(cthd.ThanhTien, 'N0', 'vi-VN') AS ThanhTien,
    CASE WHEN cthd.SoLuong IS NULL    THEN N'❌ SoLuong NULL'
         WHEN cthd.ThanhTien IS NULL  THEN N'❌ ThanhTien NULL'
         WHEN cthd.ThanhTien <> cthd.SoLuong * cthd.DonGia THEN N'❌ Sai phép tính'
         ELSE N'✅'
    END AS KiemTra
FROM ChiTietHoaDon cthd
INNER JOIN HoaDon          hd   ON hd.MaHoaDon         = cthd.MaHoaDon
INNER JOIN DichVuHopDong   dvhd ON dvhd.MaChiTietDVHD  = cthd.MaChiTietDVHD
INNER JOIN DichVu          dv   ON dv.MaDichVu          = dvhd.MaDichVu
ORDER BY cthd.MaHoaDon, cthd.MaChiTietHD;
GO

-- ---------------------------------------------------------------
-- 6. HoaDon — TongTien
-- ---------------------------------------------------------------
PRINT N'== 6. HoaDon ==';
SELECT
    hd.MaHoaDon,
    hd.MaHopDong,
    hd.KyThanhToan,
    hd.TrangThai,
    FORMAT(hd.TongTien, 'N0', 'vi-VN')                        AS TongTien,
    FORMAT(
        (SELECT ISNULL(SUM(c.ThanhTien),0)
         FROM ChiTietHoaDon c WHERE c.MaHoaDon = hd.MaHoaDon),
        'N0', 'vi-VN')                                         AS TongTien_TinhLai,
    CASE WHEN hd.TongTien IS NULL THEN N'❌ NULL'
         WHEN ABS(hd.TongTien -
              ISNULL((SELECT SUM(c.ThanhTien) FROM ChiTietHoaDon c
                       WHERE c.MaHoaDon = hd.MaHoaDon), 0)) < 1
         THEN N'✅'
         ELSE N'❌ Lệch'
    END AS KiemTra
FROM HoaDon hd
ORDER BY hd.MaHopDong, hd.KyThanhToan;
GO

-- ---------------------------------------------------------------
-- 7. BienBanKiemTraPhong — TongChiPhiSuaChua
-- ---------------------------------------------------------------
PRINT N'== 7. BienBanKiemTraPhong ==';
SELECT
    bbkt.MaBienBanKT,
    bbkt.MaPhieuTra,
    FORMAT(bbkt.TongChiPhiSuaChua, 'N0', 'vi-VN') AS TongChiPhiSuaChua,
    ISNULL(
        (SELECT STRING_AGG(
            cthh.MaTaiSan + N': ' + FORMAT(cthh.ChiPhiSuaChua, 'N0', 'vi-VN'),
            N' | ')
         FROM ChiTietHuHong cthh WHERE cthh.MaBienBanKT = bbkt.MaBienBanKT),
        N'(Không có hư hỏng)')                       AS ChiTiet_HuHong,
    CASE WHEN bbkt.TongChiPhiSuaChua IS NULL THEN N'❌ NULL' ELSE N'✅' END AS KiemTra
FROM BienBanKiemTraPhong bbkt
ORDER BY bbkt.MaBienBanKT;
GO

-- ---------------------------------------------------------------
-- 8. BienBanViPham — SoTienPhat
-- ---------------------------------------------------------------
PRINT N'== 8. BienBanViPham ==';
SELECT
    bbvp.MaBBViPham,
    bbvp.MaHopDong,
    dkvp.TenDieuKhoan,
    dkvp.HinhThucXuPhat,
    FORMAT(dkvp.MucPhat,      'N0', 'vi-VN') AS MucPhat_DieuKhoan,
    FORMAT(bbvp.SoTienPhat,   'N0', 'vi-VN') AS SoTienPhat,
    bbvp.TrangThai,
    CASE WHEN bbvp.SoTienPhat IS NULL THEN N'❌ NULL'
         WHEN dkvp.HinhThucXuPhat = N'Phạt tiền'
              AND bbvp.SoTienPhat = dkvp.MucPhat  THEN N'✅'
         WHEN dkvp.HinhThucXuPhat <> N'Phạt tiền'
              AND bbvp.SoTienPhat = 0             THEN N'✅'
         ELSE N'❌ Sai'
    END AS KiemTra
FROM BienBanViPham bbvp
INNER JOIN DieuKhoanViPham dkvp ON dkvp.MaDieuKhoan = bbvp.MaDieuKhoan
ORDER BY bbvp.MaBBViPham;
GO

-- ---------------------------------------------------------------
-- 9. DoiSoat — Tất cả cột tài chính
-- ---------------------------------------------------------------
PRINT N'== 9. DoiSoat ==';
SELECT
    ds.MaDoiSoat,
    ds.MaPhieuTra,
    ptp.MaHopDong,
    FORMAT(ds.TienCocBanDau,      'N0', 'vi-VN') AS TienCocBanDau,
    ds.SoThangLuuTru,
    CAST(ds.TyLeHoanCocHienTai AS VARCHAR) + N'%' AS TyLeHoanCoc,
    FORMAT(ds.TienCocDuocHoan,    'N0', 'vi-VN') AS TienCocDuocHoan,
    FORMAT(ds.TienThueConNo,      'N0', 'vi-VN') AS TienThueConNo,
    FORMAT(ds.TienDichVuConNo,    'N0', 'vi-VN') AS TienDichVuConNo,
    FORMAT(ds.TongChiPhiSuaChua,  'N0', 'vi-VN') AS TongChiPhiSuaChua,
    FORMAT(ds.TienPhat,           'N0', 'vi-VN') AS TienPhat,
    FORMAT(ds.TongKhauTru,        'N0', 'vi-VN') AS TongKhauTru,
    FORMAT(ds.SoTienHoanThucTe,   'N0', 'vi-VN') AS SoTienHoanThucTe,
    FORMAT(ds.SoTienKhachPhaiTT,  'N0', 'vi-VN') AS SoTienKhachPhaiTT,
    ds.TrangThai,
    -- Kiểm tra tổng khấu trừ
    CASE WHEN ds.TienCocBanDau IS NULL OR ds.TyLeHoanCocHienTai IS NULL
         THEN N'❌ NULL'
         WHEN ABS(ds.TongKhauTru -
              (ISNULL(ds.TienThueConNo,0) + ISNULL(ds.TienDichVuConNo,0)
             + ISNULL(ds.TongChiPhiSuaChua,0) + ISNULL(ds.TienPhat,0))) < 1
         THEN N'✅'
         ELSE N'❌ Lệch TongKhauTru'
    END AS KiemTra
FROM DoiSoat ds
INNER JOIN PhieuTraPhong ptp ON ptp.MaPhieuTra = ds.MaPhieuTra
ORDER BY ds.MaDoiSoat;
GO
