import * as phongKhamPhaRepository from '../repositories/phongKhamPha.repository.js';

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
  const mucGiaToiDa = (() => {
    const v = filter.mucGiaToiDa ?? filter.mucGia ?? null;
    const n = v == null || v === '' ? null : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const tuKhoa = String(filter.tuKhoa || filter.tenPhong || '').trim() || null;

  return phongKhamPhaRepository.layDanhSachPhongKhamPha({
    tuKhoa,
    loaiPhong: filter.loaiPhong || null,
    khuVuc: filter.khuVuc || null,
    mucGiaToiDa
  });
}

/**
 * Lay chi tiet 1 phong + toan bo hinh anh.
 * Goi SP dbo.SP_KhachMoi_ChiTietPhong.
 * Tra ve { ...thongTinPhong, hinhAnh, tienNghi, dichVuUocTinh }
 */
export async function getChiTietPhong(maPhong) {
  const recordsets = await phongKhamPhaRepository.layChiTietPhong(maPhong);
  const phong = recordsets?.[0]?.[0] || null;
  if (!phong) return null;

  return {
    ...phong,
    hinhAnh: recordsets?.[1] || [],
    tienNghi: recordsets?.[2] || [],
    dichVuUocTinh: recordsets?.[3] || []
  };
}

/**
 * Lay danh sach bo loc (loai phong, khu vuc) cho trang kham pha phong.
 * Repository dung raw query vi day la select don gian, chua co SP rieng.
 */
export async function getBoLocPhongKhamPha() {
  const recordsets = await phongKhamPhaRepository.layBoLocPhongKhamPha();

  return {
    loaiPhong: recordsets[0] || [],
    khuVuc: recordsets[1] || []
  };
}
