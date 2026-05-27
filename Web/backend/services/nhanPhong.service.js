import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404
  });
}

function serializeJsonValue(value) {
  if (value == null) {
    return null;
  }

  return typeof value === 'string' ? value : JSON.stringify(value);
}

export async function capNhatThongTinCuTru(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  if (!khachHangId || !data.cccd || !data.diaChiThuongTru || !data.ngayBatDauCuTru) {
    throw createServiceError('Vui long nhap du thong tin cu tru');
  }

  try {
    const result = await executeProcedure('dbo.SP_CapNhatThongTinCuTru', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'Cccd', type: sql.NVarChar(20), value: data.cccd },
      { name: 'DiaChiThuongTru', type: sql.NVarChar(200), value: data.diaChiThuongTru },
      { name: 'NgayBatDauCuTru', type: sql.Date, value: data.ngayBatDauCuTru },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function lapHopDongThue(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  const phongGiuongId = String(data.phongGiuongId || '').trim();
  if (!khachHangId || !phongGiuongId || !data.ngayBatDau || !data.ngayKetThucDuKien) {
    throw createServiceError('Vui long nhap du thong tin hop dong');
  }

  try {
    const result = await executeProcedure('dbo.SP_LapHopDongThue', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'PhongGiuongId', type: sql.NVarChar(20), value: phongGiuongId },
      { name: 'NgayBatDau', type: sql.Date, value: data.ngayBatDau },
      { name: 'NgayKetThucDuKien', type: sql.Date, value: data.ngayKetThucDuKien },
      { name: 'TienThue', type: sql.Decimal(18, 2), value: Number(data.tienThue || 0) },
      { name: 'TienCoc', type: sql.Decimal(18, 2), value: Number(data.tienCoc || 0) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function ghiNhanKhoanThuNhanPhong(data = {}) {
  const hopDongId = String(data.hopDongId || '').trim();
  if (!hopDongId || data.soTien == null) {
    throw createServiceError('Vui long nhap hop dong va so tien thu');
  }

  try {
    const result = await executeProcedure('dbo.SP_GhiNhanKhoanThuNhanPhong', [
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'SoTien', type: sql.Decimal(18, 2), value: Number(data.soTien || 0) },
      { name: 'NoiDung', type: sql.NVarChar(200), value: data.noiDung || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function lapBienBanBanGiao(data = {}) {
  const hopDongId = String(data.hopDongId || '').trim();
  const phongGiuongId = String(data.phongGiuongId || '').trim();
  if (!hopDongId || !phongGiuongId) {
    throw createServiceError('Vui long nhap hop dong va phong/giuong');
  }

  try {
    const result = await executeProcedure('dbo.SP_LapBienBanBanGiao', [
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'PhongGiuongId', type: sql.NVarChar(20), value: phongGiuongId },
      { name: 'DanhSachTaiSan', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.danhSachTaiSan) },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
