import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404
  });
}

function requireNhanVien(maNhanVien) {
  if (!maNhanVien) throw createServiceError('Thiếu thông tin nhân viên.', 401);
  return String(maNhanVien).trim();
}

function requireMaKhachHang(maKhachHang) {
  const value = String(maKhachHang || '').trim();
  if (!value) throw createServiceError('Vui lòng cung cấp mã khách hàng.', 400);
  return value;
}

export function kiemTraChonDungMotHoSo(maHopDong, maPhieuDatCoc) {
  return Boolean(maHopDong || maPhieuDatCoc) && !(maHopDong && maPhieuDatCoc);
}

/**
 * Tìm kiếm khách hàng theo tên / SĐT / CCCD.
 * Kèm cờ coPhieuTraHienHanh để UI biết hiển thị nút "Xem phiếu" hay "Chọn".
 *
 * @param {string} tuKhoa
 * @param {string} maNhanVien - Mã NV sale (để xác định chi nhánh)
 */
export async function saleTimKhachHang(tuKhoa, maNhanVien) {
  const maNhanVienHopLe = requireNhanVien(maNhanVien);
  try {
    const result = await executeProcedure('dbo.SP_TraPhong_Sale_TimKhachHang', [
      { name: 'TuKhoa', type: sql.NVarChar(100), value: tuKhoa ? String(tuKhoa).trim() : null },
      { name: 'MaNhanVien', type: sql.VarChar(6), value: maNhanVienHopLe }
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
 * Lấy hồ sơ lưu trú hiện hành của một khách hàng tại chi nhánh NV sale,
 * kèm thông tin phiếu trả phòng hiện có (nếu có, trạng thái <> 'Hủy').
 *
 * @param {string} maKhachHang
 * @param {string} maNhanVien
 */
export async function saleLayHoSoHienHanh(maKhachHang, maNhanVien) {
  const maKhachHangHopLe = requireMaKhachHang(maKhachHang);
  const maNhanVienHopLe = requireNhanVien(maNhanVien);
  try {
    const result = await executeProcedure('dbo.SP_TraPhong_Sale_LayHoSoHienHanh', [
      { name: 'MaKhachHang', type: sql.VarChar(6), value: maKhachHangHopLe },
      { name: 'MaNhanVien', type: sql.VarChar(6), value: maNhanVienHopLe }
    ]);
    // Trả null nếu không tìm thấy hồ sơ hợp lệ
    return result.recordset[0] || null;
  } catch (error) {
    const msg = error?.originalError?.info?.message || error?.message || '';
    if (msg) throw createServiceError(msg, 400);
    handleDatabaseError(error);
    throw error;
  }
}

/**
 * Kiểm tra ngày dự kiến trả phòng hợp lệ (từ ngày hiện tại trở đi).
 * So sánh phần ngày, bỏ qua giờ/phút/giây để tránh lỗi múi giờ.
 *
 * @param {string|Date} ngayDuKienTra
 * @returns {boolean}
 */
function parseNgayDuKienTra(ngayDuKienTra) {
  const value = String(ngayDuKienTra || '').trim();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  // Loại các ngày không tồn tại, ví dụ 2026-02-31
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return {
    value,
    date
  };
}

export function kiemTraNgayDuKienTra(ngayDuKienTra) {
  const parsed = parseNgayDuKienTra(ngayDuKienTra);
  if (!parsed) return false;

  const homNay = new Date();
  homNay.setHours(0, 0, 0, 0);

  return parsed.date >= homNay;
}

/**
 * Nhân viên Sale tạo phiếu đăng ký lịch trả phòng.
 *
 * @param {object} body
 * @param {string} body.maKhachHang
 * @param {string} [body.maHopDong]
 * @param {string} [body.maPhieuDatCoc]
 * @param {string} body.ngayDuKienTra
 * @param {string} maNhanVien
 */
export async function saleDangKyLichTraPhong(body = {}, maNhanVien) {
  const maKhachHang = requireMaKhachHang(body.maKhachHang);
  const maNhanVienHopLe = requireNhanVien(maNhanVien);
  const maHopDong = String(body.maHopDong || '').trim() || null;
  const maPhieuDatCoc = String(body.maPhieuDatCoc || '').trim() || null;

  if (!kiemTraNgayDuKienTra(body.ngayDuKienTra)) {
    throw createServiceError('Ngày dự kiến trả phòng không hợp lệ. Vui lòng chọn ngày từ ngày hiện tại trở đi.', 400);
  }
  if (!kiemTraChonDungMotHoSo(maHopDong, maPhieuDatCoc)) {
    throw createServiceError(maHopDong || maPhieuDatCoc
      ? 'Chỉ được chọn một trong hợp đồng hoặc phiếu đặt cọc.'
      : 'Vui lòng chọn hợp đồng hoặc phiếu đặt cọc.', 400);
  }

  try {
    const result = await executeProcedure('dbo.SP_TraPhong_Sale_DangKyLichTraPhong', [
      { name: 'MaKhachHang', type: sql.VarChar(6), value: maKhachHang },
      { name: 'MaNhanVien', type: sql.VarChar(6), value: maNhanVienHopLe },
      { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong },
      { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc },
      { name: 'NgayDuKienTra', type: sql.Date, value: String(body.ngayDuKienTra).split('T')[0] }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    const msg = error?.originalError?.info?.message || error?.message || '';
    if (msg) throw createServiceError(msg, 400);
    handleDatabaseError(error);
    throw error;
  }
}
