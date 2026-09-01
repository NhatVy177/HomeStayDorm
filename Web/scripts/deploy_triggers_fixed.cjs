const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
const fs = require('fs');

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

// List of all table names (mixed case) in the database
const TABLE_NAMES = [
  'BienBanBanGiao', 'BienBanKiemTraPhong', 'BienBanViPham', 'CauHinhSaoLuu',
  'ChiNhanh', 'ChiTietBanGiao', 'ChiTietDatCoc', 'ChiTietHoaDon', 'ChiTietHuHong',
  'ChiTietXemPhong', 'DichVu', 'DichVuHopDong', 'DieuKhoanViPham', 'DoiSoat',
  'Giuong', 'HinhAnhPhong', 'HoSoCuTru', 'HoaDon', 'HopDongThue', 'KhachHang',
  'LichSuSaoLuu', 'LichXemPhong', 'LoaiPhong', 'NguoiDung', 'NhanVien',
  'NhatKyHeThong', 'PDK_LoaiPhong', 'PhieuDangKy', 'PhieuDatCoc', 'PhieuGhiChiSo',
  'PhieuTraPhong', 'Phong', 'QuiDinh', 'QuyDinhHoanCoc', 'QuyDinhTruTien',
  'TaiKhoan', 'TaiSan', 'ThamSoHeThong', 'ThanhVienHopDong', 'YeuCauSuaChua'
];

async function deployTriggers() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Supabase!\n');

    // Build trigger statements with quoted table names
    const triggers = [
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_LoaiPhong_TinhGiaThueNguyenPhong" ON "LoaiPhong";`,
        create: `CREATE TRIGGER "TRG_LoaiPhong_TinhGiaThueNguyenPhong"
BEFORE INSERT OR UPDATE OF "SucChuaToiDa", "GiaThueTheoGiuong" ON "LoaiPhong"
FOR EACH ROW EXECUTE FUNCTION trg_fn_loaiphong_tinhgiathuenguyenphong();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_ChiTietDatCoc_TinhGiaThue_Before" ON "ChiTietDatCoc";`,
        create: `CREATE TRIGGER "TRG_ChiTietDatCoc_TinhGiaThue_Before"
BEFORE INSERT OR UPDATE OF "MaPhong", "MaGiuong" ON "ChiTietDatCoc"
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitietdatcoc_tinhgiathue_before();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_ChiTietDatCoc_TinhSoTienCoc_After" ON "ChiTietDatCoc";`,
        create: `CREATE TRIGGER "TRG_ChiTietDatCoc_TinhSoTienCoc_After"
AFTER INSERT OR UPDATE OR DELETE ON "ChiTietDatCoc"
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitietdatcoc_tinhsotiencoc_after();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_HopDongThue_TinhGiaThueSoGiuong" ON "HopDongThue";`,
        create: `CREATE TRIGGER "TRG_HopDongThue_TinhGiaThueSoGiuong"
BEFORE INSERT ON "HopDongThue"
FOR EACH ROW EXECUTE FUNCTION trg_fn_hopdongthue_tinhgiathuesogiuong();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_PhieuGhiChiSo_SetKyGhi" ON "PhieuGhiChiSo";`,
        create: `CREATE TRIGGER "TRG_PhieuGhiChiSo_SetKyGhi"
BEFORE INSERT OR UPDATE OF "NgayGhi" ON "PhieuGhiChiSo"
FOR EACH ROW EXECUTE FUNCTION trg_fn_phieughichiso_setkyghi();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_ChiTietHoaDon_TinhSoLuong_Before" ON "ChiTietHoaDon";`,
        create: `CREATE TRIGGER "TRG_ChiTietHoaDon_TinhSoLuong_Before"
BEFORE INSERT OR UPDATE ON "ChiTietHoaDon"
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitiethoadon_tinhsoluong_before();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_HoaDon_TinhTongTien_After" ON "ChiTietHoaDon";`,
        create: `CREATE TRIGGER "TRG_HoaDon_TinhTongTien_After"
AFTER INSERT OR UPDATE OR DELETE ON "ChiTietHoaDon"
FOR EACH ROW EXECUTE FUNCTION trg_fn_hoadon_tinhtongtien_after();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_ChiTietHuHong_CapNhatTongSuaChua" ON "ChiTietHuHong";`,
        create: `CREATE TRIGGER "TRG_ChiTietHuHong_CapNhatTongSuaChua"
AFTER INSERT OR UPDATE OR DELETE ON "ChiTietHuHong"
FOR EACH ROW EXECUTE FUNCTION trg_fn_chitiethuhong_capnhattongsuachua();`
      },
      {
        drop: `DROP TRIGGER IF EXISTS "TRG_BienBanViPham_TinhSoTienPhat" ON "BienBanViPham";`,
        create: `CREATE TRIGGER "TRG_BienBanViPham_TinhSoTienPhat"
BEFORE INSERT OR UPDATE OF "MaDieuKhoan" ON "BienBanViPham"
FOR EACH ROW EXECUTE FUNCTION trg_fn_bienbanvipham_tinhsotienphat();`
      },
    ];

    let success = 0;
    let errors = [];

    for (const t of triggers) {
      // DROP
      try {
        await client.query(t.drop);
        console.log(`✓ DROP: ${t.drop.split('"')[1]}`);
      } catch (e) {
        console.log(`  DROP skipped: ${e.message.substring(0, 80)}`);
      }
      // CREATE
      try {
        await client.query(t.create);
        console.log(`✓ CREATE: ${t.create.split('"')[1]}`);
        success++;
      } catch (e) {
        console.log(`✗ CREATE FAILED: ${e.message.substring(0, 120)}`);
        errors.push({ trigger: t.create.split('"')[1], error: e.message });
      }
    }

    console.log(`\n=====================================`);
    console.log(`TRIGGER DEPLOY DONE: ${success}/${triggers.length} success`);
    if (errors.length) {
      console.log('Errors:');
      errors.forEach(e => console.log(` - ${e.trigger}: ${e.error}`));
    }

    // Final total
    const res = await client.query(`
      SELECT COUNT(*) as cnt FROM information_schema.triggers WHERE trigger_schema = 'public';
    `);
    console.log(`Total triggers on Supabase: ${res.rows[0].cnt}`);

    await client.end();
  } catch (err) {
    console.error('Fatal:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

deployTriggers();
