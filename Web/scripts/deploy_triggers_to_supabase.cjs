const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres:Nhatvy1707%40@db.dzyjchpbrqasblnvzjkk.supabase.co:5432/postgres';

async function deployTriggers() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase!');

    const triggersSql = `
-- Bật extension pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TRG_LoaiPhong_TinhGiaThueNguyenPhong
CREATE OR REPLACE FUNCTION trg_fn_loaiphong_tinhgiathuenguyenphong()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."SucChuaToiDa" IS NOT NULL AND NEW."GiaThueTheoGiuong" IS NOT NULL THEN
        NEW."GiaThueNguyenPhong" := NEW."SucChuaToiDa" * NEW."GiaThueTheoGiuong";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "TRG_LoaiPhong_TinhGiaThueNguyenPhong" ON "LoaiPhong";
DROP TRIGGER IF EXISTS trg_loaiphong_tinhgiathuenguyenphong ON "LoaiPhong";
CREATE TRIGGER trg_loaiphong_tinhgiathuenguyenphong
BEFORE INSERT OR UPDATE OF "SucChuaToiDa", "GiaThueTheoGiuong" ON "LoaiPhong"
FOR EACH ROW EXECUTE FUNCTION trg_fn_loaiphong_tinhgiathuenguyenphong();

-- 2. TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc
CREATE OR REPLACE FUNCTION trg_fn_chitietdatcoc_tinhgiathue_before()
RETURNS TRIGGER AS $$
DECLARE
    v_GiaThueTheoGiuong DECIMAL(15,2);
    v_GiaThueNguyenPhong DECIMAL(15,2);
BEGIN
    SELECT lp."GiaThueTheoGiuong", lp."GiaThueNguyenPhong"
    INTO v_GiaThueTheoGiuong, v_GiaThueNguyenPhong
    FROM "Phong" p
    JOIN "LoaiPhong" lp ON lp."MaLoaiPhong" = p."MaLoaiPhong"
    WHERE p."MaPhong" = NEW."MaPhong";

    IF NEW."MaGiuong" IS NOT NULL THEN
        NEW."GiaThue" := v_GiaThueTheoGiuong;
    ELSE
        NEW."GiaThue" := v_GiaThueNguyenPhong;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chitietdatcoc_tinhgiathue_before ON "ChiTietDatCoc";
CREATE TRIGGER trg_chitietdatcoc_tinhgiathue_before
BEFORE INSERT OR UPDATE OF "MaPhong", "MaGiuong" ON "ChiTietDatCoc"
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitietdatcoc_tinhgiathue_before();

CREATE OR REPLACE FUNCTION trg_fn_chitietdatcoc_tinhsotiencoc_after()
RETURNS TRIGGER AS $$
DECLARE
    v_MaPhieuCoc VARCHAR(6);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_MaPhieuCoc := OLD."MaPhieuDatCoc";
    ELSE
        v_MaPhieuCoc := NEW."MaPhieuDatCoc";
    END IF;

    UPDATE "PhieuDatCoc"
    SET "SoTienCoc" = COALESCE((
        SELECT SUM(c."GiaThue") * 2
        FROM "ChiTietDatCoc" c
        WHERE c."MaPhieuDatCoc" = v_MaPhieuCoc
          AND c."GiaThue" IS NOT NULL
    ), 0)
    WHERE "MaPhieuDatCoc" = v_MaPhieuCoc;

    IF TG_OP = 'UPDATE' AND OLD."MaPhieuDatCoc" <> NEW."MaPhieuDatCoc" THEN
        UPDATE "PhieuDatCoc"
        SET "SoTienCoc" = COALESCE((
            SELECT SUM(c."GiaThue") * 2
            FROM "ChiTietDatCoc" c
            WHERE c."MaPhieuDatCoc" = OLD."MaPhieuDatCoc"
              AND c."GiaThue" IS NOT NULL
        ), 0)
        WHERE "MaPhieuDatCoc" = OLD."MaPhieuDatCoc";
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chitietdatcoc_tinhsotiencoc_after ON "ChiTietDatCoc";
CREATE TRIGGER trg_chitietdatcoc_tinhsotiencoc_after
AFTER INSERT OR UPDATE OR DELETE ON "ChiTietDatCoc"
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
    IF NEW."GiaThue" IS NOT NULL AND NEW."SoGiuongThue" IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT pdc."HinhThucThue" INTO v_HinhThucThue
    FROM "PhieuDatCoc" pdc WHERE pdc."MaPhieuDatCoc" = NEW."MaPhieuCoc";

    IF v_HinhThucThue = 'Nguyên phòng' THEN
        SELECT lp."GiaThueNguyenPhong", lp."SucChuaToiDa"
        INTO v_GiaThueNguyenPhong, v_SucChuaToiDa
        FROM "ChiTietDatCoc" ctdc
        JOIN "Phong" p ON p."MaPhong" = ctdc."MaPhong"
        JOIN "LoaiPhong" lp ON lp."MaLoaiPhong" = p."MaLoaiPhong"
        WHERE ctdc."MaPhieuDatCoc" = NEW."MaPhieuCoc" AND ctdc."MaGiuong" IS NULL
        LIMIT 1;

        NEW."GiaThue" := COALESCE(NEW."GiaThue", v_GiaThueNguyenPhong);
        NEW."SoGiuongThue" := COALESCE(NEW."SoGiuongThue", v_SucChuaToiDa);
    ELSE
        SELECT SUM(ctdc."GiaThue"), COUNT(ctdc."MaGiuong")
        INTO v_TongGia, v_SoGiuong
        FROM "ChiTietDatCoc" ctdc
        WHERE ctdc."MaPhieuDatCoc" = NEW."MaPhieuCoc" AND ctdc."MaGiuong" IS NOT NULL;

        NEW."GiaThue" := COALESCE(NEW."GiaThue", v_TongGia);
        NEW."SoGiuongThue" := COALESCE(NEW."SoGiuongThue", v_SoGiuong);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hopdongthue_tinhgiathuesogiuong ON "HopDongThue";
CREATE TRIGGER trg_hopdongthue_tinhgiathuesogiuong
BEFORE INSERT ON "HopDongThue"
FOR EACH ROW EXECUTE FUNCTION trg_fn_hopdongthue_tinhgiathuesogiuong();

-- 4. TRG_PhieuGhiChiSo_SetKyGhi
CREATE OR REPLACE FUNCTION trg_fn_phieughichiso_setkyghi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."NgayGhi" IS NOT NULL THEN
        NEW."KyGhi" := TO_CHAR(NEW."NgayGhi", 'YYYY-MM');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_phieughichiso_setkyghi ON "PhieuGhiChiSo";
CREATE TRIGGER trg_phieughichiso_setkyghi
BEFORE INSERT OR UPDATE OF "NgayGhi" ON "PhieuGhiChiSo"
FOR EACH ROW EXECUTE FUNCTION trg_fn_phieughichiso_setkyghi();

-- 8. TRG_ChiTietHuHong_CapNhatTongSuaChua
CREATE OR REPLACE FUNCTION trg_fn_chitiethuhong_capnhattongsuachua()
RETURNS TRIGGER AS $$
DECLARE
    v_MaBienBanKT VARCHAR(6);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_MaBienBanKT := OLD."MaBienBanKT";
    ELSE
        v_MaBienBanKT := NEW."MaBienBanKT";
    END IF;

    UPDATE "BienBanKiemTraPhong" bbkt
    SET "TongChiPhiSuaChua" = COALESCE((
        SELECT SUM(h."ChiPhiSuaChua")
        FROM "ChiTietHuHong" h
        WHERE h."MaBienBanKT" = bbkt."MaBienBanKT"
    ), 0)
    WHERE bbkt."MaBienBanKT" = v_MaBienBanKT;

    IF TG_OP = 'UPDATE' AND OLD."MaBienBanKT" <> NEW."MaBienBanKT" THEN
        UPDATE "BienBanKiemTraPhong" bbkt
        SET "TongChiPhiSuaChua" = COALESCE((
            SELECT SUM(h."ChiPhiSuaChua")
            FROM "ChiTietHuHong" h
            WHERE h."MaBienBanKT" = bbkt."MaBienBanKT"
        ), 0)
        WHERE bbkt."MaBienBanKT" = OLD."MaBienBanKT";
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chitiethuhong_capnhattongsuachua ON "ChiTietHuHong";
CREATE TRIGGER trg_chitiethuhong_capnhattongsuachua
AFTER INSERT OR UPDATE OR DELETE ON "ChiTietHuHong"
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitiethuhong_capnhattongsuachua();

-- 9. TRG_BienBanViPham_TinhSoTienPhat
CREATE OR REPLACE FUNCTION trg_fn_bienbanvipham_tinhsotienphat()
RETURNS TRIGGER AS $$
DECLARE
    v_HinhThucXuPhat VARCHAR(50);
    v_MucPhat DECIMAL(15,2);
BEGIN
    IF NEW."MaDieuKhoan" IS NOT NULL THEN
        SELECT dkvp."HinhThucXuPhat", dkvp."MucPhat"
        INTO v_HinhThucXuPhat, v_MucPhat
        FROM "DieuKhoanViPham" dkvp
        WHERE dkvp."MaDieuKhoan" = NEW."MaDieuKhoan";

        IF v_HinhThucXuPhat = 'Phạt tiền' THEN
            NEW."SoTienPhat" := COALESCE(v_MucPhat, 0);
        ELSE
            NEW."SoTienPhat" := 0;
        END IF;
    ELSE
        NEW."SoTienPhat" := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bienbanvipham_tinhsotienphat ON "BienBanViPham";
CREATE TRIGGER trg_bienbanvipham_tinhsotienphat
BEFORE INSERT OR UPDATE OF "MaDieuKhoan" ON "BienBanViPham"
FOR EACH ROW EXECUTE FUNCTION trg_fn_bienbanvipham_tinhsotienphat();
    `;

    console.log('Applying triggers to Supabase...');
    await client.query(triggersSql);
    console.log('Triggers deployed successfully!');

    // Check triggers in information_schema
    const checkRes = await client.query(`
      SELECT trigger_name, event_object_table, action_timing, event_manipulation 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public';
    `);
    console.log('Triggers currently active on Supabase:');
    console.table(checkRes.rows);

    await client.end();
  } catch (err) {
    console.error('Trigger deployment error:', err);
  }
}

deployTriggers();
