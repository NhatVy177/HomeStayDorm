import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    50011: 400
  });
}

export async function createHoSoDangKy(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  if (!khachHangId) {
    throw createServiceError('Vui long chon khach hang');
  }

  try {
    const result = await executeProcedure('dbo.SP_TaoHoSoDangKy', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'NhuCau', type: sql.NVarChar(200), value: data.nhuCau || null },
      { name: 'SoNguoiO', type: sql.Int, value: Number(data.soNguoiO || 1) },
      { name: 'NgayDuKienVaoO', type: sql.Date, value: data.ngayDuKienVaoO || null },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
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
      { name: 'HoSoId', type: sql.NVarChar(30), value: String(hoSoId || '').trim() },
      { name: 'TrangThai', type: sql.NVarChar(50), value: data.trangThai || null },
      { name: 'GhiChuXuLy', type: sql.NVarChar(sql.MAX), value: data.ghiChuXuLy || null },
      { name: 'NhanVienSaleId', type: sql.NVarChar(20), value: data.nhanVienSaleId || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
