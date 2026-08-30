const fs = require('fs');
const path = require('path');

const outputPath = path.resolve(__dirname, '../../Database/supabase_all_procedures_and_triggers.sql');

let sqlContent = `-- ============================================================================
-- SUPABASE POSTGRESQL MIGRATION: ALL TRIGGERS & PROCEDURES/FUNCTIONS
-- HOMESTAY DORM MANAGEMENT SYSTEM
-- Tương thích hoàn toàn với PostgreSQL 14+ / Supabase
-- ============================================================================

-- Bật extension pgcrypto (nếu cần mã hóa SHA256 / UUID)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Thiết lập múi giờ chuẩn VN (UTC+7)
SET timezone = 'Asia/Ho_Chi_Minh';

-- ============================================================================
-- PHẦN 1: TẤT CẢ DATABASE TRIGGERS (9 TRIGGERS)
-- ============================================================================

-- 1. TRG_LoaiPhong_TinhGiaThueNguyenPhong
CREATE OR REPLACE FUNCTION trg_fn_loaiphong_tinhgiathuenguyenphong()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.SucChuaToiDa IS NOT NULL AND NEW.GiaThueTheoGiuong IS NOT NULL THEN
        NEW.GiaThueNguyenPhong := NEW.SucChuaToiDa * NEW.GiaThueTheoGiuong;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_LoaiPhong_TinhGiaThueNguyenPhong ON LoaiPhong;
CREATE TRIGGER TRG_LoaiPhong_TinhGiaThueNguyenPhong
BEFORE INSERT OR UPDATE OF SucChuaToiDa, GiaThueTheoGiuong ON LoaiPhong
FOR EACH ROW EXECUTE FUNCTION trg_fn_loaiphong_tinhgiathuenguyenphong();


-- 2. TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc
CREATE OR REPLACE FUNCTION trg_fn_chitietdatcoc_tinhgiathue_before()
RETURNS TRIGGER AS $$
DECLARE
    v_GiaThueTheoGiuong DECIMAL(15,2);
    v_GiaThueNguyenPhong DECIMAL(15,2);
BEGIN
    SELECT lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong
    INTO v_GiaThueTheoGiuong, v_GiaThueNguyenPhong
    FROM Phong p
    JOIN LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE p.MaPhong = NEW.MaPhong;

    IF NEW.MaGiuong IS NOT NULL THEN
        NEW.GiaThue := v_GiaThueTheoGiuong;
    ELSE
        NEW.GiaThue := v_GiaThueNguyenPhong;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_ChiTietDatCoc_TinhGiaThue_Before ON ChiTietDatCoc;
CREATE TRIGGER TRG_ChiTietDatCoc_TinhGiaThue_Before
BEFORE INSERT OR UPDATE OF MaPhong, MaGiuong ON ChiTietDatCoc
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitietdatcoc_tinhgiathue_before();

CREATE OR REPLACE FUNCTION trg_fn_chitietdatcoc_tinhsotiencoc_after()
RETURNS TRIGGER AS $$
DECLARE
    v_MaPhieuCoc VARCHAR(6);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_MaPhieuCoc := OLD.MaPhieuDatCoc;
    ELSE
        v_MaPhieuCoc := NEW.MaPhieuDatCoc;
    END IF;

    UPDATE PhieuDatCoc
    SET SoTienCoc = COALESCE((
        SELECT SUM(c.GiaThue) * 2
        FROM ChiTietDatCoc c
        WHERE c.MaPhieuDatCoc = v_MaPhieuCoc
          AND c.GiaThue IS NOT NULL
    ), 0)
    WHERE MaPhieuDatCoc = v_MaPhieuCoc;

    IF TG_OP = 'UPDATE' AND OLD.MaPhieuDatCoc <> NEW.MaPhieuDatCoc THEN
        UPDATE PhieuDatCoc
        SET SoTienCoc = COALESCE((
            SELECT SUM(c.GiaThue) * 2
            FROM ChiTietDatCoc c
            WHERE c.MaPhieuDatCoc = OLD.MaPhieuDatCoc
              AND c.GiaThue IS NOT NULL
        ), 0)
        WHERE MaPhieuDatCoc = OLD.MaPhieuDatCoc;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_ChiTietDatCoc_TinhSoTienCoc_After ON ChiTietDatCoc;
CREATE TRIGGER TRG_ChiTietDatCoc_TinhSoTienCoc_After
AFTER INSERT OR UPDATE OR DELETE ON ChiTietDatCoc
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitietdatcoc_tinhsotiencoc_after();


-- 3. TRG_HopDongThue_TinhGiaThueSoGiuong
CREATE OR REPLACE FUNCTION trg_fn_hopdongthue_tinhgiathuesogiuong()
RETURNS TRIGGER AS $$
DECLARE
    v_HinhThucThue VARCHAR(50);
    v_GiaThueNguyenPhong DECIMAL(15,2);
    v_SucChuaToiDa INT;
    v_TongGia DECIMAL(15,2);
    v_SoGiuong INT;
BEGIN
    IF NEW.GiaThue IS NOT NULL AND NEW.SoGiuongThue IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT pdc.HinhThucThue INTO v_HinhThucThue
    FROM PhieuDatCoc pdc WHERE pdc.MaPhieuDatCoc = NEW.MaPhieuCoc;

    IF v_HinhThucThue = 'Nguyên phòng' THEN
        SELECT lp.GiaThueNguyenPhong, lp.SucChuaToiDa
        INTO v_GiaThueNguyenPhong, v_SucChuaToiDa
        FROM ChiTietDatCoc ctdc
        JOIN Phong p ON p.MaPhong = ctdc.MaPhong
        JOIN LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
        WHERE ctdc.MaPhieuDatCoc = NEW.MaPhieuCoc AND ctdc.MaGiuong IS NULL
        LIMIT 1;

        NEW.GiaThue := COALESCE(NEW.GiaThue, v_GiaThueNguyenPhong);
        NEW.SoGiuongThue := COALESCE(NEW.SoGiuongThue, v_SucChuaToiDa);
    ELSE
        SELECT SUM(ctdc.GiaThue), COUNT(ctdc.MaGiuong)
        INTO v_TongGia, v_SoGiuong
        FROM ChiTietDatCoc ctdc
        WHERE ctdc.MaPhieuDatCoc = NEW.MaPhieuCoc AND ctdc.MaGiuong IS NOT NULL;

        NEW.GiaThue := COALESCE(NEW.GiaThue, v_TongGia);
        NEW.SoGiuongThue := COALESCE(NEW.SoGiuongThue, v_SoGiuong);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_HopDongThue_TinhGiaThueSoGiuong ON HopDongThue;
CREATE TRIGGER TRG_HopDongThue_TinhGiaThueSoGiuong
BEFORE INSERT ON HopDongThue
FOR EACH ROW EXECUTE FUNCTION trg_fn_hopdongthue_tinhgiathuesogiuong();


-- 4. TRG_PhieuGhiChiSo_SetKyGhi
CREATE OR REPLACE FUNCTION trg_fn_phieughichiso_setkyghi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.NgayGhi IS NOT NULL THEN
        NEW.KyGhi := TO_CHAR(NEW.NgayGhi, 'YYYY-MM');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_PhieuGhiChiSo_SetKyGhi ON PhieuGhiChiSo;
CREATE TRIGGER TRG_PhieuGhiChiSo_SetKyGhi
BEFORE INSERT OR UPDATE OF NgayGhi ON PhieuGhiChiSo
FOR EACH ROW EXECUTE FUNCTION trg_fn_phieughichiso_setkyghi();


-- 5 + 6. TRG_ChiTietHoaDon_TinhSoLuong_ThanhTien_TongTien & OnDelete
CREATE OR REPLACE FUNCTION trg_fn_chitiethoadon_tinhsoluong_before()
RETURNS TRIGGER AS $$
DECLARE
    v_HinhThucThue VARCHAR(50);
    v_ChiSoDienCuoi DECIMAL(10,2);
    v_ChiSoDienDau DECIMAL(10,2);
    v_ChiSoNuocCuoi DECIMAL(10,2);
    v_ChiSoNuocDau DECIMAL(10,2);
    v_SoGiuongThue INT;
    v_TongGiuong INT;
    v_MaPhong VARCHAR(4);
    v_KyGhi VARCHAR(10);
BEGIN
    IF NEW.SoLuong IS NULL THEN
        IF NEW.DonViTinh = 'tháng' THEN
            NEW.SoLuong := 1;
        ELSIF NEW.DonViTinh IN ('kWh', 'm3') AND NEW.MaPhieuGhi IS NOT NULL THEN
            SELECT pdc.HinhThucThue, hdt.SoGiuongThue, ctdc.MaPhong, pgcs.KyGhi,
                   pgcs.ChiSoDienCuoi, pgcs.ChiSoDienDau, pgcs.ChiSoNuocCuoi, pgcs.ChiSoNuocDau
            INTO v_HinhThucThue, v_SoGiuongThue, v_MaPhong, v_KyGhi,
                 v_ChiSoDienCuoi, v_ChiSoDienDau, v_ChiSoNuocCuoi, v_ChiSoNuocDau
            FROM HoaDon hd
            JOIN HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
            JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hdt.MaPhieuCoc
            JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = hdt.MaPhieuCoc
            JOIN PhieuGhiChiSo pgcs ON pgcs.MaPhieuGhi = NEW.MaPhieuGhi AND pgcs.MaPhong = ctdc.MaPhong
            WHERE hd.MaHoaDon = NEW.MaHoaDon
            LIMIT 1;

            IF v_HinhThucThue = 'Nguyên phòng' THEN
                IF NEW.DonViTinh = 'kWh' THEN
                    NEW.SoLuong := COALESCE(v_ChiSoDienCuoi - v_ChiSoDienDau, 0);
                ELSIF NEW.DonViTinh = 'm3' THEN
                    NEW.SoLuong := COALESCE(v_ChiSoNuocCuoi - v_ChiSoNuocDau, 0);
                END IF;
            ELSIF v_HinhThucThue = 'Ghép giường' THEN
                SELECT SUM(hdt2.SoGiuongThue) INTO v_TongGiuong
                FROM HopDongThue hdt2
                JOIN PhieuDatCoc pdc2 ON pdc2.MaPhieuDatCoc = hdt2.MaPhieuCoc
                JOIN ChiTietDatCoc ctdc2 ON ctdc2.MaPhieuDatCoc = hdt2.MaPhieuCoc AND ctdc2.MaGiuong IS NOT NULL
                JOIN HoaDon hd2 ON hd2.MaHopDong = hdt2.MaHopDong
                JOIN ChiTietHoaDon ch2 ON ch2.MaHoaDon = hd2.MaHoaDon AND ch2.DonViTinh = NEW.DonViTinh
                JOIN PhieuGhiChiSo pgcs2 ON pgcs2.MaPhieuGhi = ch2.MaPhieuGhi AND pgcs2.MaPhong = ctdc2.MaPhong
                WHERE pdc2.HinhThucThue = 'Ghép giường' AND ctdc2.MaPhong = v_MaPhong AND pgcs2.KyGhi = v_KyGhi;

                IF COALESCE(v_TongGiuong, 0) > 0 THEN
                    IF NEW.DonViTinh = 'kWh' THEN
                        NEW.SoLuong := ROUND(((v_ChiSoDienCuoi - v_ChiSoDienDau) * v_SoGiuongThue::NUMERIC / v_TongGiuong::NUMERIC), 2);
                    ELSIF NEW.DonViTinh = 'm3' THEN
                        NEW.SoLuong := ROUND(((v_ChiSoNuocCuoi - v_ChiSoNuocDau) * v_SoGiuongThue::NUMERIC / v_TongGiuong::NUMERIC), 2);
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    IF NEW.SoLuong IS NOT NULL AND NEW.DonGia IS NOT NULL THEN
        NEW.ThanhTien := NEW.SoLuong * NEW.DonGia;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_ChiTietHoaDon_TinhSoLuong_Before ON ChiTietHoaDon;
CREATE TRIGGER TRG_ChiTietHoaDon_TinhSoLuong_Before
BEFORE INSERT OR UPDATE ON ChiTietHoaDon
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitiethoadon_tinhsoluong_before();

CREATE OR REPLACE FUNCTION trg_fn_hoadon_tinhtongtien_after()
RETURNS TRIGGER AS $$
DECLARE
    v_MaHoaDon VARCHAR(6);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_MaHoaDon := OLD.MaHoaDon;
    ELSE
        v_MaHoaDon := NEW.MaHoaDon;
    END IF;

    UPDATE HoaDon hd
    SET TongTien = COALESCE(hdt.GiaThue, 0) + COALESCE((
        SELECT SUM(c.ThanhTien)
        FROM ChiTietHoaDon c
        WHERE c.MaHoaDon = hd.MaHoaDon AND c.ThanhTien IS NOT NULL
    ), 0)
    FROM HopDongThue hdt
    WHERE hdt.MaHopDong = hd.MaHopDong AND hd.MaHoaDon = v_MaHoaDon;

    IF TG_OP = 'UPDATE' AND OLD.MaHoaDon <> NEW.MaHoaDon THEN
        UPDATE HoaDon hd
        SET TongTien = COALESCE(hdt.GiaThue, 0) + COALESCE((
            SELECT SUM(c.ThanhTien)
            FROM ChiTietHoaDon c
            WHERE c.MaHoaDon = hd.MaHoaDon AND c.ThanhTien IS NOT NULL
        ), 0)
        FROM HopDongThue hdt
        WHERE hdt.MaHopDong = hd.MaHopDong AND hd.MaHoaDon = OLD.MaHoaDon;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_HoaDon_TinhTongTien_After ON ChiTietHoaDon;
CREATE TRIGGER TRG_HoaDon_TinhTongTien_After
AFTER INSERT OR UPDATE OR DELETE ON ChiTietHoaDon
FOR EACH ROW EXECUTE FUNCTION trg_fn_hoadon_tinhtongtien_after();


-- 8. TRG_ChiTietHuHong_CapNhatTongSuaChua
CREATE OR REPLACE FUNCTION trg_fn_chitiethuhong_capnhattongsuachua()
RETURNS TRIGGER AS $$
DECLARE
    v_MaBienBanKT VARCHAR(6);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_MaBienBanKT := OLD.MaBienBanKT;
    ELSE
        v_MaBienBanKT := NEW.MaBienBanKT;
    END IF;

    UPDATE BienBanKiemTraPhong bbkt
    SET TongChiPhiSuaChua = COALESCE((
        SELECT SUM(h.ChiPhiSuaChua)
        FROM ChiTietHuHong h
        WHERE h.MaBienBanKT = bbkt.MaBienBanKT
    ), 0)
    WHERE bbkt.MaBienBanKT = v_MaBienBanKT;

    IF TG_OP = 'UPDATE' AND OLD.MaBienBanKT <> NEW.MaBienBanKT THEN
        UPDATE BienBanKiemTraPhong bbkt
        SET TongChiPhiSuaChua = COALESCE((
            SELECT SUM(h.ChiPhiSuaChua)
            FROM ChiTietHuHong h
            WHERE h.MaBienBanKT = bbkt.MaBienBanKT
        ), 0)
        WHERE bbkt.MaBienBanKT = OLD.MaBienBanKT;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_ChiTietHuHong_CapNhatTongSuaChua ON ChiTietHuHong;
CREATE TRIGGER TRG_ChiTietHuHong_CapNhatTongSuaChua
AFTER INSERT OR UPDATE OR DELETE ON ChiTietHuHong
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitiethuhong_capnhattongsuachua();


-- 9. TRG_BienBanViPham_TinhSoTienPhat
CREATE OR REPLACE FUNCTION trg_fn_bienbanvipham_tinhsotienphat()
RETURNS TRIGGER AS $$
DECLARE
    v_HinhThucXuPhat VARCHAR(50);
    v_MucPhat DECIMAL(15,2);
BEGIN
    IF NEW.MaDieuKhoan IS NOT NULL THEN
        SELECT dkvp.HinhThucXuPhat, dkvp.MucPhat
        INTO v_HinhThucXuPhat, v_MucPhat
        FROM DieuKhoanViPham dkvp
        WHERE dkvp.MaDieuKhoan = NEW.MaDieuKhoan;

        IF v_HinhThucXuPhat = 'Phạt tiền' THEN
            NEW.SoTienPhat := COALESCE(v_MucPhat, 0);
        ELSE
            NEW.SoTienPhat := 0;
        END IF;
    ELSE
        NEW.SoTienPhat := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS TRG_BienBanViPham_TinhSoTienPhat ON BienBanViPham;
CREATE TRIGGER TRG_BienBanViPham_TinhSoTienPhat
BEFORE INSERT OR UPDATE OF MaDieuKhoan ON BienBanViPham
FOR EACH ROW EXECUTE FUNCTION trg_fn_bienbanvipham_tinhsotienphat();

`;

console.log('Writing base trigger script...');
fs.writeFileSync(outputPath, sqlContent, 'utf8');
console.log('Base triggers written successfully.');
