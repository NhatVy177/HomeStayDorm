import { getPool } from '../database/connection.js';
import * as hoanCocDoiSoatRepository from '../repositories/hoanCocDoiSoat.repository.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function requireMaDoiSoat(maDoiSoat) {
  if (!maDoiSoat || String(maDoiSoat).trim().length > 6) {
    throw createServiceError('Mã đối soát không hợp lệ.', 400);
  }

  return String(maDoiSoat).trim();
}

function normalizePaymentMethod(value) {
  const normalized = String(value || '').trim();
  if (!['Tiền mặt', 'Chuyển khoản'].includes(normalized)) {
    throw createServiceError('Vui lòng chọn phương thức thanh toán.', 400);
  }

  return normalized;
}

function normalizePaymentDate(value) {
  if (!value) {
    throw createServiceError('Vui lòng chọn ngày thanh toán.', 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createServiceError('Ngày thanh toán không hợp lệ.', 400);
  }

  return value;
}

function mapHoanCocDatabaseError(error) {
  mapDatabaseError(error, {
    50600: 400,
    50601: 409,
    50602: 409,
    50603: 400,
    50604: 404
  });
}

export async function getDanhSachChoHoanCoc(maNhanVienKeToan) {
  const pool = await getPool();
  return hoanCocDoiSoatRepository.getDanhSachChoHoanCoc(pool, maNhanVienKeToan);
}

export async function getDanhSachDaHoanCoc(maNhanVienKeToan) {
  const pool = await getPool();
  return hoanCocDoiSoatRepository.getDanhSachDaHoanCoc(pool, maNhanVienKeToan);
}

export async function getChiTietHoanCoc(maDoiSoatInput, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(maDoiSoatInput);
  const pool = await getPool();
  const data = await hoanCocDoiSoatRepository.getChiTietHoanCoc(pool, maDoiSoat, maNhanVienKeToan);

  if (!data.chiTiet) {
    throw createServiceError('Không tìm thấy phiếu đối soát.', 404);
  }

  return data;
}

export async function xacNhanHoanCoc(data, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(data?.maDoiSoat);
  const phuongThucThanhToan = normalizePaymentMethod(data?.phuongThucThanhToan);
  const ngayThanhToan = normalizePaymentDate(data?.ngayThanhToan);
  const chungTuThanhToan = String(data?.chungTuThanhToan || '').trim() || null;
  const pool = await getPool();

  try {
    return await hoanCocDoiSoatRepository.xacNhanHoanCoc(pool, {
      maDoiSoat,
      maNhanVienKeToan,
      phuongThucThanhToan,
      ngayThanhToan,
      chungTuThanhToan
    });
  } catch (error) {
    mapHoanCocDatabaseError(error);
  }
}

export default {
  getDanhSachChoHoanCoc,
  getDanhSachDaHoanCoc,
  getChiTietHoanCoc,
  xacNhanHoanCoc
};
