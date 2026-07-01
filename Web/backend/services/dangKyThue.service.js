import { executeProcedure, executeQuery, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    50011: 400
  });
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();
  if (!raw) return null;

  const numericText = raw.replace(/[^\d,.-]/g, '');
  const commaAsDecimal = numericText.includes(',') && numericText.lastIndexOf(',') > numericText.lastIndexOf('.');
  const cleaned = commaAsDecimal
    ? numericText.replace(/\./g, '').replace(',', '.')
    : numericText.replace(/,/g, '');
  const compact = (cleaned.match(/\./g) || []).length > 1
    ? cleaned.replace(/\./g, '')
    : cleaned;
  const number = Number(compact);

  return Number.isFinite(number) ? number : null;
}

function normalizeMoneyVnd(value) {
  const number = parseMoney(value);
  if (number == null || number <= 0) return null;
  const vnd = Math.round(number);
  const remainder = ((vnd % 1000) + 1000) % 1000;
  if (remainder <= 10) return vnd - remainder;
  if (1000 - remainder <= 10) return vnd + (1000 - remainder);
  return vnd;
}

// UC: Gửi thông tin đăng ký thuê
// khachHangId lấy từ req.user (tài khoản đang đăng nhập), KHÔNG từ body
export async function createHoSoDangKy(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();

  if (!khachHangId) {
    throw createServiceError('Không thể xác định thông tin khách hàng. Vui lòng đăng nhập lại.', 401);
  }

  // Kiểm tra thông tin bắt buộc phía service (A4 trong UC)
  const gioiTinhThue = data.gioiTinhThue || data.gioiTinh || null;
  const soNguoiO    = Number(data.soNguoiO);
  const ngayDuKienVaoO = data.ngayDuKienVaoO || null;
  const mucGiaToiDa = normalizeMoneyVnd(data.mucGiaToiDa ?? data.mucGiaDen ?? data.mucGia);

  if (!soNguoiO || soNguoiO < 1) {
    throw createServiceError('Vui lòng nhập số người dự kiến ở (tối thiểu 1 người).');
  }
  if (!ngayDuKienVaoO) {
    throw createServiceError('Vui lòng nhập thời gian dự kiến vào ở.');
  }
  if (!mucGiaToiDa) {
    throw createServiceError('Vui lòng nhập mức giá mong muốn hợp lệ.');
  }

  try {
    const result = await executeProcedure('dbo.SP_TaoHoSoDangKy', [
      { name: 'KhachHangId',     type: sql.NVarChar(20),       value: khachHangId },
      { name: 'SoNguoiO',        type: sql.Int,                value: soNguoiO },
      { name: 'SoNamInput',      type: sql.Int,                value: data.soNam || 0 },
      { name: 'SoNuInput',       type: sql.Int,                value: data.soNu || 0 },
      { name: 'NgayDuKienVaoO',  type: sql.Date,               value: ngayDuKienVaoO },
      { name: 'GhiChu',          type: sql.NVarChar(sql.MAX),  value: data.ghiChu || null },
      { name: 'KhuVucMongMuon',  type: sql.NVarChar(100),      value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(200),      value: data.loaiPhongYeuCau || null },
      { name: 'MucGiaToiDa',     type: sql.Decimal(18, 2),     value: mucGiaToiDa },
      { name: 'ThoiHanThue',     type: sql.Int,                value: data.thoiHanThue ? Number(data.thoiHanThue) : null },
      { name: 'GioiTinh',        type: sql.NVarChar(10),       value: gioiTinhThue }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getHoSoDangKy(filter = {}) {
  const result = await executeProcedure('dbo.SP_DanhSachHoSoDangKy', [
    { name: 'TrangThai', type: sql.NVarChar(30), value: filter.trangThai || null },
    { name: 'MaChiNhanh', type: sql.VarChar(6), value: filter.maChiNhanh || null },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: filter.nhanVienSaleId || null },
    { name: 'KhachHangId', type: sql.VarChar(6), value: filter.khachHangId || null }
  ]);
  return result.recordset;
}

export async function getPhongGiuongKhaDung(filter = {}) {
  const hoSoId = String(filter.hoSoId || '').trim();
  let mucGiaToiDa = normalizeMoneyVnd(filter.mucGiaToiDa);

  if (hoSoId && !mucGiaToiDa) {
    const profile = await executeQuery(`
      SELECT MucGiaToiDa
      FROM dbo.PhieuDangKy
      WHERE MaDangKy = @HoSoId
    `, [
      { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
    ]);
    mucGiaToiDa = normalizeMoneyVnd(profile.recordset[0]?.MucGiaToiDa);
  }

  const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
    { name: 'Loai', type: sql.NVarChar(50), value: filter.loai || null },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: mucGiaToiDa },
    { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId || null }
  ]);

  let isRegionValid = true;
  if (hoSoId) {
    const check = await executeQuery(`
      SELECT 1 
      FROM PhieuDangKy pdk
      JOIN ChiNhanh cn ON cn.DiaChi LIKE '%' + pdk.KhuVucMongMuon + '%' OR cn.TenChiNhanh LIKE '%' + pdk.KhuVucMongMuon + '%'
      WHERE pdk.MaDangKy = @HoSoId
    `, [
      { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
    ]);
    isRegionValid = check.recordset.length > 0;
  }

  return {
    rooms: result.recordset,
    isRegionValid
  };
}

export async function traCuuPhong(filter = {}) {
  const result = await executeProcedure('dbo.SP_TraCuuPhong', [
    { name: 'KhuVuc', type: sql.NVarChar(100), value: filter.khuVuc || null },
    { name: 'LoaiPhong', type: sql.NVarChar(50), value: filter.loaiPhong || null },
    { name: 'HinhThucThue', type: sql.NVarChar(50), value: filter.hinhThucThue || null },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: normalizeMoneyVnd(filter.mucGiaToiDa) }
  ]);
  return result.recordset;
}

export async function kiemTraDieuKienThue(hoSoId) {
  try {
    const result = await executeProcedure('dbo.SP_KiemTraDieuKienThue', [
      { name: 'HoSoId', type: sql.NVarChar(30), value: String(hoSoId || '').trim() }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatKetQuaXuLy(hoSoId, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_CapNhatKetQuaXuLyHoSo', [
      { name: 'HoSoId',          type: sql.NVarChar(30),       value: String(hoSoId || '').trim() },
      { name: 'TrangThai',       type: sql.NVarChar(50),       value: data.trangThai || null },
      { name: 'GhiChuXuLy',     type: sql.NVarChar(sql.MAX),  value: data.ghiChuXuLy || null },
      { name: 'NhanVienSaleId', type: sql.NVarChar(20),       value: data.nhanVienSaleId || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function tiepNhanHoSoDangKy(hoSoId, nhanVienSaleId) {
  try {
    const result = await executeProcedure('dbo.SP_TiepNhanHoSoDangKy', [
      { name: 'MaDangKy', type: sql.VarChar(6), value: String(hoSoId || '').trim() },
      { name: 'NhanVienSaleId', type: sql.VarChar(6), value: String(nhanVienSaleId || '').trim() }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function taoHoSoKhachVangLai(data, nhanVienSaleId) {
  try {
    const soNguoiO = Number(data.soNguoiO || data.soNguoi || 1);
    const thoiHanThue = Number(data.thoiHanThue || data.thoiHan || 1);
    const mucGia = normalizeMoneyVnd(data.mucGiaToiDa ?? data.mucGiaDen ?? data.mucGia);
    const hinhThucThue = data.hinhThucThue || data.hinhThuc || null;

    const result = await executeProcedure('dbo.SP_TaoHoSoKhachVangLai', [
      { name: 'HoTen', type: sql.NVarChar(100), value: data.hoTen },
      { name: 'NgaySinh', type: sql.Date, value: data.ngaySinh },
      { name: 'GioiTinh', type: sql.NVarChar(5), value: data.gioiTinhO || data.gioiTinh },
      { name: 'SDT', type: sql.VarChar(20), value: data.sdt },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: data.diaChi || null },
      { name: 'QuocTich', type: sql.NVarChar(50), value: data.quocTich || 'Việt Nam' },
      { name: 'CCCD', type: sql.VarChar(20), value: data.cccd },
      { name: 'HinhThucThue', type: sql.NVarChar(20), value: hinhThucThue },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || data.khuVuc },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(200), value: data.loaiPhongYeuCau || data.loaiPhong },
      { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: mucGia },
      { name: 'SoNguoiO', type: sql.Int, value: soNguoiO },
      { name: 'SoNamInput', type: sql.Int, value: data.soNam || 0 },
      { name: 'SoNuInput', type: sql.Int, value: data.soNu || 0 },
      { name: 'NgayDuKienVaoO', type: sql.Date, value: data.ngayVao || data.ngayDuKienVaoO },
      { name: 'ThoiHanThue', type: sql.Int, value: thoiHanThue },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || data.yeuCau || null },
      { name: 'NhanVienSaleId', type: sql.VarChar(6), value: nhanVienSaleId }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
