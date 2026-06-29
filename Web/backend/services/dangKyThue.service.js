import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    50011: 400
  });
}

// UC: Gửi thông tin đăng ký thuê
// khachHangId lấy từ req.user (tài khoản đang đăng nhập), KHÔNG từ body
export async function createHoSoDangKy(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();

  if (!khachHangId) {
    throw createServiceError('Không thể xác định thông tin khách hàng. Vui lòng đăng nhập lại.', 401);
  }

  // Kiểm tra thông tin bắt buộc phía service (A4 trong UC)
  const hinhThucThueRaw = String(data.hinhThucThue || '').trim();
  const hinhThucThue = hinhThucThueRaw;
  const soNguoiO    = Number(data.soNguoiO);
  const ngayDuKienVaoO = data.ngayDuKienVaoO || null;

  if (!hinhThucThueRaw) {
    throw createServiceError('Vui lòng chọn hình thức thuê.');
  }
  if (!soNguoiO || soNguoiO < 1) {
    throw createServiceError('Vui lòng nhập số người dự kiến ở (tối thiểu 1 người).');
  }
  if (!ngayDuKienVaoO) {
    throw createServiceError('Vui lòng nhập thời gian dự kiến vào ở.');
  }

  try {
    const result = await executeProcedure('dbo.SP_TaoHoSoDangKy', [
      { name: 'KhachHangId',     type: sql.NVarChar(20),       value: khachHangId },
      { name: 'NhuCau',          type: sql.NVarChar(200),      value: hinhThucThue },
      { name: 'SoNguoiO',        type: sql.Int,                value: soNguoiO },
      { name: 'NgayDuKienVaoO',  type: sql.Date,               value: ngayDuKienVaoO },
      { name: 'GhiChu',          type: sql.NVarChar(sql.MAX),  value: data.ghiChu || null },
      { name: 'KhuVucMongMuon',  type: sql.NVarChar(100),      value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(50),       value: data.loaiPhongYeuCau || null },
      { name: 'MucGia',          type: sql.Decimal(15, 2),     value: data.mucGia ? Number(data.mucGia) : null },
      { name: 'MucGiaDen',       type: sql.Decimal(15, 2),     value: data.mucGiaDen ? Number(data.mucGiaDen) : null },
      { name: 'ThoiHanThue',     type: sql.Int,                value: data.thoiHanThue ? Number(data.thoiHanThue) : null }
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
  const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
    { name: 'Loai', type: sql.NVarChar(50), value: filter.loai || null }
  ]);
  return result.recordset;
}

export async function traCuuPhong(filter = {}) {
  const result = await executeProcedure('dbo.SP_TraCuuPhong', [
    { name: 'KhuVuc', type: sql.NVarChar(100), value: filter.khuVuc || null },
    { name: 'LoaiPhong', type: sql.NVarChar(50), value: filter.loaiPhong || null },
    { name: 'HinhThucThue', type: sql.NVarChar(50), value: filter.hinhThucThue || null },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: filter.mucGiaToiDa ? Number(filter.mucGiaToiDa) : null }
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
      { name: 'NhanVienSaleId',  type: sql.NVarChar(20),       value: data.nhanVienSaleId || null }
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
    const soNguoiO = Number(data.soNguoiO || 1);
    const thoiHanThue = Number(data.thoiHanThue || data.thoiHan || 1);
    const mucGia = data.mucGia ? Number(data.mucGia) : null;
    const hinhThucThue = data.hinhThucThue || null;

    const result = await executeProcedure('dbo.SP_TaoHoSoKhachVangLai', [
      { name: 'HoTen', type: sql.NVarChar(100), value: data.hoTen },
      { name: 'NgaySinh', type: sql.Date, value: data.ngaySinh },
      { name: 'GioiTinh', type: sql.NVarChar(5), value: data.gioiTinh },
      { name: 'SDT', type: sql.VarChar(20), value: data.sdt },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: data.diaChi || null },
      { name: 'QuocTich', type: sql.NVarChar(50), value: data.quocTich || 'Việt Nam' },
      { name: 'CCCD', type: sql.VarChar(20), value: data.cccd },
      { name: 'HinhThucThue', type: sql.NVarChar(20), value: hinhThucThue },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(50), value: data.loaiPhongYeuCau },
      { name: 'MucGia', type: sql.Decimal(15, 2), value: mucGia },
      { name: 'MucGiaDen', type: sql.Decimal(15, 2), value: data.mucGiaDen ? Number(data.mucGiaDen) : null },
      { name: 'SoNguoiO', type: sql.Int, value: soNguoiO },
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
