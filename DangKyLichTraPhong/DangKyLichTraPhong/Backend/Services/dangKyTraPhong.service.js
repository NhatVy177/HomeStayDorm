import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404
  });
}

/**
 * Tìm kiếm khách hàng theo tên / SĐT / CCCD.
 */
export async function saleTimKhachHang(tuKhoa) {
  try {
    const result = await executeProcedure('dbo.SP_TraPhong_Sale_TimKhachHang', [
      { name: 'TuKhoa', type: sql.NVarChar(100), value: tuKhoa ? String(tuKhoa).trim() : null }
    ]);
    return result.recordset;
  } catch (error) {
    const msg = error?.originalError?.info?.message || error?.message || '';
    if (msg) throw createServiceError(msg, 400);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Lấy danh sách HĐ + Phiếu cọc hợp lệ của một khách hàng (dùng cho sale).
 */
export async function saleDanhSachHopDong(maKhachHang, maNhanVien) {
  if (!maKhachHang) throw createServiceError('Thiếu mã khách hàng.', 400);
  if (!maNhanVien) throw createServiceError('Thiếu thông tin nhân viên.', 401);
  try {
    const result = await executeProcedure('dbo.SP_TraPhong_Sale_DanhSachHopDong', [
      { name: 'MaKhachHang', type: sql.VarChar(6), value: String(maKhachHang).trim() },
      { name: 'MaNhanVien',  type: sql.VarChar(6), value: String(maNhanVien).trim() }
    ]);
    return result.recordset;
  } catch (error) {
    const msg = error?.originalError?.info?.message || error?.message || '';
    if (msg) throw createServiceError(msg, 400);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Nhân viên Sale tạo phiếu đăng ký lịch trả phòng.
 */
export async function saleDangKyLichTraPhong(body = {}) {
  const maKhachHang   = String(body.maKhachHang   || '').trim();
  const maHopDong     = String(body.maHopDong     || '').trim() || null;
  const maPhieuDatCoc = String(body.maPhieuDatCoc || '').trim() || null;

  if (!maKhachHang)      throw createServiceError('Vui lòng cung cấp mã khách hàng.', 400);
  if (!body.ngayDuKienTra) throw createServiceError('Vui lòng nhập ngày dự kiến trả phòng.', 400);
  if (!maHopDong && !maPhieuDatCoc) {
    throw createServiceError('Vui lòng chọn hợp đồng hoặc phiếu đặt cọc.', 400);
  }
  if (maHopDong && maPhieuDatCoc) {
    throw createServiceError('Chỉ được chọn một trong hợp đồng hoặc phiếu đặt cọc.', 400);
  }

  try {
    const result = await executeProcedure('dbo.SP_TraPhong_Sale_DangKyLichTraPhong', [
      { name: 'MaKhachHang',   type: sql.VarChar(6), value: maKhachHang },
      { name: 'MaHopDong',     type: sql.VarChar(6), value: maHopDong },
      { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc },
      { name: 'NgayDuKienTra', type: sql.Date,        value: new Date(body.ngayDuKienTra) }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    const msg = error?.originalError?.info?.message || error?.message || '';
    if (msg) throw createServiceError(msg, 400);
    handleDatabaseError(error);
    throw error;
  }
}

