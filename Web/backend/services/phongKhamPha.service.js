import { executeProcedure, getPool, sql } from '../database/connection.js';

// Chuan hoa gia tri HinhThucThue truoc khi truyen vao SP
function normalizeHinhThucThue(value) {
  const map = {
    'ghep nam': 'Ghép nam',
    'nam': 'Ghép nam',
    'ghep nu': 'Ghép nữ',
    'nu': 'Ghép nữ',
    'nguyen can': 'Nguyên căn',
    'nguyen phong': 'Nguyên căn',
    'khong phan biet': 'Nguyên căn'
  };
  const normalized = String(value || '')
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[-_]+/g, ' ')
    .trim();
  return map[normalized] || null;
}

/**
 * Lay danh sach phong kha dung.
 * Goi SP dbo.SP_KhachMoi_DanhSachPhongKhaDung.
 * Anh dai dien (anhDai) = UrlImg voi STTAnh = 1 trong HinhAnhPhong.
 */
export async function getDanhSachPhongKhamPha(filter = {}) {
  const hinhThucThue = normalizeHinhThucThue(
    filter.hinhThucThue || filter.hinhThuc || filter.loaiThue
  );
  const mucGiaToiDa = (() => {
    const v = filter.mucGiaToiDa ?? filter.mucGia ?? null;
    const n = v == null || v === '' ? null : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const tuKhoa = String(filter.tuKhoa || filter.tenPhong || '').trim() || null;

  const result = await executeProcedure('dbo.SP_KhachMoi_DanhSachPhongKhaDung', [
    { name: 'TuKhoa',       type: sql.NVarChar(120),    value: tuKhoa },
    { name: 'LoaiPhong',    type: sql.NVarChar(100),    value: filter.loaiPhong || null },
    { name: 'KhuVuc',       type: sql.NVarChar(100),    value: filter.khuVuc || null },
    { name: 'HinhThucThue', type: sql.NVarChar(20),     value: hinhThucThue },
    { name: 'MucGiaToiDa',  type: sql.Decimal(15, 2),  value: mucGiaToiDa }
  ]);

  return result.recordset || [];
}

/**
 * Lay chi tiet 1 phong + toan bo hinh anh.
 * Goi SP dbo.SP_KhachMoi_ChiTietPhong.
 * Tra ve { ...thongTinPhong, hinhAnh, tienNghi, dichVuUocTinh }
 */
export async function getChiTietPhong(maPhong) {
  const result = await executeProcedure('dbo.SP_KhachMoi_ChiTietPhong', [
    { name: 'MaPhong', type: sql.VarChar(4), value: maPhong }
  ]);

  const phong = result.recordsets?.[0]?.[0] || null;
  if (!phong) return null;

  return {
    ...phong,
    hinhAnh: result.recordsets?.[1] || [],
    tienNghi: result.recordsets?.[2] || [],
    dichVuUocTinh: result.recordsets?.[3] || []
  };
}

/**
 * Lay danh sach bo loc (loai phong, khu vuc) cho trang kham pha phong.
 * Dung raw query vi day la select don gian, chua co SP rieng.
 */
export async function getBoLocPhongKhamPha() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT MaLoaiPhong AS maLoaiPhong, TenLoaiPhong AS tenLoaiPhong
    FROM dbo.LoaiPhong
    ORDER BY TenLoaiPhong;

    SELECT DISTINCT TenChiNhanh AS tenChiNhanh, DiaChi AS diaChi
    FROM dbo.ChiNhanh
    ORDER BY DiaChi;
  `);

  return {
    loaiPhong: result.recordsets[0] || [],
    khuVuc: result.recordsets[1] || []
  };
}
