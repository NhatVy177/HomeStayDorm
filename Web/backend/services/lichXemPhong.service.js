import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404
  });
}

export async function createLichXemPhong(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  const phongGiuongId = String(data.phongGiuongId || '').trim();
  const thoiGianXem = data.thoiGianXem || null;

  if (!khachHangId || !phongGiuongId || !thoiGianXem) {
    throw createServiceError('Vui long nhap khach hang, phong/giuong va thoi gian xem');
  }

  try {
    const result = await executeProcedure('dbo.SP_TaoLichXemPhong', [
      { name: 'HoSoDangKyId', type: sql.NVarChar(30), value: data.hoSoDangKyId || null },
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'PhongGiuongId', type: sql.NVarChar(20), value: phongGiuongId },
      { name: 'ThoiGianXem', type: sql.DateTime2, value: thoiGianXem },
      { name: 'NhanVienSaleId', type: sql.NVarChar(20), value: data.nhanVienSaleId || null },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getLichXemPhong() {
  const result = await executeProcedure('dbo.SP_DanhSachLichXemPhong');
  return result.recordset;
}

export async function yeuCauDieuChinhLich(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_YeuCauDieuChinhLich', [
      { name: 'LichId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'ThoiGianMoi', type: sql.DateTime2, value: data.thoiGianMoi || null },
      { name: 'LyDo', type: sql.NVarChar(sql.MAX), value: data.lyDo || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatLichXemPhong(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_CapNhatLichXemPhong', [
      { name: 'LichId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'ThoiGianXem', type: sql.DateTime2, value: data.thoiGianXem || null },
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || null },
      { name: 'GhiChuXuLy', type: sql.NVarChar(sql.MAX), value: data.ghiChuXuLy || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
