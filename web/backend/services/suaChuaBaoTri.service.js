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

export async function createYeuCauSuaChua(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  const hopDongId = String(data.hopDongId || '').trim();
  if (!khachHangId || !hopDongId || !data.moTaHuHong) {
    throw createServiceError('Vui long nhap du thong tin yeu cau sua chua');
  }

  try {
    const result = await executeProcedure('dbo.SP_TaoYeuCauSuaChua', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'TaiSanId', type: sql.NVarChar(50), value: data.taiSanId || null },
      { name: 'MoTaHuHong', type: sql.NVarChar(sql.MAX), value: data.moTaHuHong },
      { name: 'HinhAnhMinhChung', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.hinhAnhMinhChung) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getYeuCauSuaChua() {
  const result = await executeProcedure('dbo.SP_DanhSachYeuCauSuaChua');
  return result.recordset;
}

export async function tiepNhanYeuCauSuaChua(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_TiepNhanYeuCauSuaChua', [
      { name: 'YeuCauId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'NhanVienQuanLyId', type: sql.NVarChar(20), value: data.nhanVienQuanLyId || null },
      { name: 'GhiChuTiepNhan', type: sql.NVarChar(sql.MAX), value: data.ghiChuTiepNhan || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function hoanTatYeuCauSuaChua(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_HoanTatYeuCauSuaChua', [
      { name: 'YeuCauId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'GhiChuXuLy', type: sql.NVarChar(sql.MAX), value: data.ghiChuXuLy || null },
      { name: 'ChiPhiSuaChua', type: sql.Decimal(18, 2), value: data.chiPhiSuaChua == null ? 0 : Number(data.chiPhiSuaChua) },
      { name: 'LoiDoKhachGayRa', type: sql.Bit, value: Boolean(data.loiDoKhachGayRa) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function tuChoiYeuCauSuaChua(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_TuChoiYeuCauSuaChua', [
      { name: 'YeuCauId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'LyDoTuChoi', type: sql.NVarChar(sql.MAX), value: data.lyDoTuChoi || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
