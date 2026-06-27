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
  const hinhThucThue = hinhThucThueRaw === 'Nguyên căn' ? 'Nguyên căn' : 'Ghép';
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
      { name: 'ThoiHanThue',     type: sql.Int,                value: data.thoiHanThue ? Number(data.thoiHanThue) : null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getHoSoDangKy() {
  const result = await executeProcedure('dbo.SP_DanhSachHoSoDangKy');
  return result.recordset;
}

export async function getPhongGiuongKhaDung(filter = {}) {
  const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
    { name: 'Loai', type: sql.NVarChar(50), value: filter.loai || null }
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
