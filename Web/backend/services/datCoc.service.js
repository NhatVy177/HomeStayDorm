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

export async function getDanhSachChoLapPhieu() {
  const result = await executeProcedure('dbo.SP_DanhSachChoLapPhieuDatCoc');
  return result.recordset;
}

export async function createPhieuDatCoc(data = {}) {
  const maDangKy = String(data.maDangKy || '').trim();
  const maNhanVienKeToan = String(data.maNhanVienKeToan || '').trim();
  if (!maDangKy || !maNhanVienKeToan) {
    throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã nhân viên kế toán');
  }
  const soTienCoc = Number(data.soTienCoc);
  if (!soTienCoc || soTienCoc <= 0) {
    throw createServiceError('Số tiền cọc không hợp lệ');
  }
  const phuongThuc = String(data.phuongThucThanhToan || '').trim();
  if (!['Tiền mặt', 'Chuyển khoản'].includes(phuongThuc)) {
    throw createServiceError('Phương thức thanh toán không hợp lệ');
  }

  try {
    const result = await executeProcedure('dbo.SP_LapPhieuDatCoc', [
      { name: 'MaDangKy',            type: sql.VarChar(6),        value: maDangKy },
      { name: 'MaNhanVienKeToan',    type: sql.VarChar(6),        value: maNhanVienKeToan },
      { name: 'SoTienCoc',           type: sql.Decimal(15, 2),    value: soTienCoc },
      { name: 'PhuongThucThanhToan', type: sql.NVarChar(20),      value: phuongThuc },
      { name: 'ThoiHanThanhToan',    type: sql.DateTime,          value: data.thoiHanThanhToan ? new Date(data.thoiHanThanhToan) : null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, { 50210: 404, 50211: 409, 50212: 409, 50213: 404, 50214: 422 });
  }
}

export async function getPhieuDatCoc(maNhanVienSale) {
  const result = await executeProcedure('dbo.SP_DanhSachDatCocSale', [
    { name: 'MaNhanVienSale', type: sql.VarChar(6), value: String(maNhanVienSale || '').trim() }
  ]);
  return result.recordset;
}

export async function guiYeuCauDatCoc(data = {}) {
  const maDangKy = String(data.maDangKy || '').trim();
  const maNhanVienSale = String(data.maNhanVienSale || '').trim();
  if (!maDangKy || !maNhanVienSale) {
    throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã nhân viên');
  }

  try {
    const result = await executeProcedure('dbo.SP_GuiYeuCauDatCoc', [
      { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
      { name: 'MaNhanVienSale', type: sql.VarChar(6), value: maNhanVienSale }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, { 50201: 404, 50202: 409, 50203: 404 });
  }
}

export async function getDanhSachChoXacNhan() {
  const result = await executeProcedure('dbo.SP_DanhSachChoXacNhanCoc');
  return result.recordset;
}

export async function xacNhanKhaNangNhanCoc(id, data = {}) {
  const maDangKy = String(id || '').trim();
  const maQuanLy = String(data.maQuanLy || '').trim();
  if (!maDangKy || !maQuanLy) {
    throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã quản lý');
  }

  try {
    const result = await executeProcedure('dbo.SP_XacNhanKhaNangNhanCoc', [
      { name: 'MaDangKy',    type: sql.VarChar(6),          value: maDangKy },
      { name: 'MaQuanLy',    type: sql.VarChar(6),          value: maQuanLy },
      { name: 'DuocNhanCoc', type: sql.Bit,                 value: data.duocNhanCoc ? 1 : 0 },
      { name: 'LyDo',        type: sql.NVarChar(sql.MAX),   value: data.lyDo || null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, { 50204: 404, 50205: 409, 50206: 404, 50207: 400, 50208: 422, 50209: 422 });
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
