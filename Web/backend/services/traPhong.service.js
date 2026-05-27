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

export async function dangKyLichTraPhong(data = {}) {
  const hopDongId = String(data.hopDongId || '').trim();
  const khachHangId = String(data.khachHangId || '').trim();
  if (!hopDongId || !khachHangId || !data.thoiGianTraPhong) {
    throw createServiceError('Vui long nhap du thong tin lich tra phong');
  }

  try {
    const result = await executeProcedure('dbo.SP_DangKyLichTraPhong', [
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'ThoiGianTraPhong', type: sql.DateTime2, value: data.thoiGianTraPhong },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function lapBienBanKiemTraTraPhong(data = {}) {
  const yeuCauTraPhongId = String(data.yeuCauTraPhongId || '').trim();
  const hopDongId = String(data.hopDongId || '').trim();
  if (!yeuCauTraPhongId || !hopDongId || !data.hienTrangPhong) {
    throw createServiceError('Vui long nhap du thong tin bien ban kiem tra');
  }

  try {
    const result = await executeProcedure('dbo.SP_LapBienBanKiemTraTraPhong', [
      { name: 'YeuCauTraPhongId', type: sql.NVarChar(30), value: yeuCauTraPhongId },
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'HienTrangPhong', type: sql.NVarChar(200), value: data.hienTrangPhong },
      { name: 'TaiSanHuHong', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.taiSanHuHong) },
      { name: 'LoiDoKhachGayRa', type: sql.Bit, value: Boolean(data.loiDoKhachGayRa) },
      { name: 'ChiPhiSuaChuaDuKien', type: sql.Decimal(18, 2), value: Number(data.chiPhiSuaChuaDuKien || 0) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function xuLyQuyetToanTraPhong(data = {}) {
  const hopDongId = String(data.hopDongId || '').trim();
  if (!hopDongId) {
    throw createServiceError('Vui long nhap hop dong');
  }

  try {
    const result = await executeProcedure('dbo.SP_XuLyQuyetToanTraPhong', [
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'TienCoc', type: sql.Decimal(18, 2), value: Number(data.tienCoc || 0) },
      { name: 'TongKhauTru', type: sql.Decimal(18, 2), value: Number(data.tongKhauTru || 0) },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function ghiNhanThanhLyHopDong(data = {}) {
  const hopDongId = String(data.hopDongId || '').trim();
  if (!hopDongId) {
    throw createServiceError('Vui long nhap hop dong');
  }

  try {
    const result = await executeProcedure('dbo.SP_GhiNhanThanhLyHopDong', [
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
