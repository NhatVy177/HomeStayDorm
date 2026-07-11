import { getPool } from '../database/connection.js';
import * as thuThemDoiSoatRepository from '../repositories/thuThemDoiSoat.repository.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

const THU_THEM_FILTERS = new Set(['all', 'can-ghi-nhan', 'cho-xac-nhan']);

function requireMaDoiSoat(maDoiSoat) {
  if (!maDoiSoat || String(maDoiSoat).trim().length > 6) {
    throw createServiceError('Mã đối soát không hợp lệ.', 400);
  }

  return String(maDoiSoat).trim();
}

function normalizeThuThemFilter(value) {
  const normalized = String(value || 'all').trim();
  if (!THU_THEM_FILTERS.has(normalized)) {
    throw createServiceError('Bộ lọc thu thêm không hợp lệ.', 400);
  }

  return normalized;
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

function mapThuThemDatabaseError(error) {
  mapDatabaseError(error, {
    50700: 400,
    50701: 409,
    50702: 409,
    50703: 409,
    50704: 404
  });
}

export async function getDanhSachChoThuThem(maNhanVienKeToan, boLocThuThem) {
  const normalizedFilter = normalizeThuThemFilter(boLocThuThem);
  const pool = await getPool();
  return thuThemDoiSoatRepository.getDanhSachChoThuThem(pool, maNhanVienKeToan, normalizedFilter);
}

export async function getDanhSachDaThuThem(maNhanVienKeToan) {
  const pool = await getPool();
  return thuThemDoiSoatRepository.getDanhSachDaThuThem(pool, maNhanVienKeToan);
}

export async function getChiTietThuThem(maDoiSoatInput, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(maDoiSoatInput);
  const pool = await getPool();
  const data = await thuThemDoiSoatRepository.getChiTietThuThem(pool, maDoiSoat, maNhanVienKeToan);

  if (!data.chiTiet) {
    throw createServiceError('Không tìm thấy phiếu đối soát.', 404);
  }

  return data;
}

export async function xacNhanThuThem(data, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(data?.maDoiSoat);
  const phuongThucThanhToan = normalizePaymentMethod(data?.phuongThucThanhToan);
  const ngayThanhToan = normalizePaymentDate(data?.ngayThanhToan);
  const chungTuThanhToan = String(data?.chungTuThanhToan || '').trim() || null;
  const pool = await getPool();

  try {
    return await thuThemDoiSoatRepository.xacNhanThuThem(pool, {
      maDoiSoat,
      maNhanVienKeToan,
      phuongThucThanhToan,
      ngayThanhToan,
      chungTuThanhToan
    });
  } catch (error) {
    mapThuThemDatabaseError(error);
  }
}

export async function khongXacNhanThuThem(data, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(data?.maDoiSoat);
  const pool = await getPool();

  try {
    return await thuThemDoiSoatRepository.khongXacNhanThuThem(pool, {
      maDoiSoat,
      maNhanVienKeToan
    });
  } catch (error) {
    mapThuThemDatabaseError(error);
  }
}

export default {
  getDanhSachChoThuThem,
  getDanhSachDaThuThem,
  getChiTietThuThem,
  xacNhanThuThem,
  khongXacNhanThuThem
};
