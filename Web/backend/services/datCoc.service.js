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

export async function createPhieuDatCoc(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  const phongGiuongId = String(data.phongGiuongId || '').trim();
  if (!khachHangId || !phongGiuongId) {
    throw createServiceError('Vui long chon khach hang va phong/giuong');
  }

  try {
    const result = await executeProcedure('dbo.SP_TaoPhieuDatCoc', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'PhongGiuongId', type: sql.NVarChar(20), value: phongGiuongId },
      { name: 'SoTienDuKien', type: sql.Decimal(18, 2), value: Number(data.soTienDuKien || 0) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getPhieuDatCoc() {
  const result = await executeProcedure('dbo.SP_DanhSachPhieuDatCoc');
  return result.recordset;
}

export async function xacNhanKhaNangNhanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_XacNhanKhaNangNhanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'DuocNhanCoc', type: sql.Bit, value: Boolean(data.duocNhanCoc) },
      { name: 'QuanLyXacNhanId', type: sql.NVarChar(20), value: data.quanLyXacNhanId || null },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function phatHanhYeuCauThanhToanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_PhatHanhYeuCauThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'SoTienCoc', type: sql.Decimal(18, 2), value: data.soTienCoc == null ? null : Number(data.soTienCoc) },
      { name: 'KeToanPhatHanhId', type: sql.NVarChar(20), value: data.keToanPhatHanhId || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatMinhChungThanhToanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_CapNhatMinhChungThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'MinhChungThanhToan', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.minhChungThanhToan) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function xacNhanThanhToanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_XacNhanThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'HopLe', type: sql.Bit, value: Boolean(data.hopLe) },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null },
      { name: 'QuanLyXacNhanThanhToanId', type: sql.NVarChar(20), value: data.quanLyXacNhanThanhToanId || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
