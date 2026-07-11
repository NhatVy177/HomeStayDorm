import fs from 'fs/promises';
import path from 'path';
import { getPool, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';
import {
  calculateDoiSoatTraPhong,
  safeNumber
} from './doiSoatCalculator.service.js';
import * as phieuTraPhongService from './phieuTraPhong.service.js';
import * as hoSoThueService from './hoSoThue.service.js';
import * as khauTruDoiSoatService from './khauTruDoiSoat.service.js';
import * as doiSoatRepository from '../repositories/doiSoat.repository.js';
import * as quyDinhHoanCocRepository from '../repositories/quyDinhHoanCoc.repository.js';
import * as thuThemDoiSoatRepository from '../repositories/thuThemDoiSoat.repository.js';
import * as hoanCocDoiSoatRepository from '../repositories/hoanCocDoiSoat.repository.js';
import * as ketQuaDoiSoatRepository from '../repositories/ketQuaDoiSoat.repository.js';

const MESSAGE_STALE =
  'Phiếu trả phòng này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.';
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads/chung-tu-doi-soat');
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROOF_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
const THU_THEM_FILTERS = new Set(['all', 'can-ghi-nhan', 'cho-xac-nhan']);

function requireMaPhieuTra(maPhieuTra) {
  if (!maPhieuTra || String(maPhieuTra).trim().length > 6) {
    throw createServiceError('Mã phiếu trả phòng không hợp lệ.', 400);
  }

  return String(maPhieuTra).trim();
}

function requireMaDoiSoat(maDoiSoat) {
  if (!maDoiSoat || String(maDoiSoat).trim().length > 6) {
    throw createServiceError('Mã đối soát không hợp lệ.', 400);
  }

  return String(maDoiSoat).trim();
}

function sanitizeFileName(value) {
  const raw = String(value || 'chung-tu').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const safe = raw.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe || 'chung-tu';
}

function extensionFromContentType(contentType) {
  switch (contentType) {
    case 'image/jpeg': return '.jpg';
    case 'image/png': return '.png';
    case 'image/webp': return '.webp';
    case 'image/gif': return '.gif';
    case 'application/pdf': return '.pdf';
    default: return '';
  }
}

function contentTypeFromFileName(fileName) {
  switch (path.extname(fileName).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.pdf':
      return 'application/pdf';
    default:
      return '';
  }
}

function normalizePaymentMethod(value) {
  const normalized = String(value || '').trim();
  if (!['Tiền mặt', 'Chuyển khoản'].includes(normalized)) {
    throw createServiceError('Vui lòng chọn phương thức thanh toán.', 400);
  }

  return normalized;
}

function normalizeThuThemFilter(value) {
  const normalized = String(value || 'all').trim();
  if (!THU_THEM_FILTERS.has(normalized)) {
    throw createServiceError('Bộ lọc thu thêm không hợp lệ.', 400);
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

function mapThuThemDatabaseError(error) {
  mapDatabaseError(error, {
    50700: 400,
    50701: 409,
    50702: 409,
    50703: 409,
    50704: 404
  });
}

function pickMoney(inputValue, defaultValue) {
  return inputValue === undefined ? safeNumber(defaultValue) : safeNumber(inputValue);
}

function validateNonNegativeMoney(values) {
  for (const [label, value] of Object.entries(values)) {
    if (safeNumber(value) < 0) {
      throw createServiceError(`${label} không được âm.`, 400);
    }
  }
}

function buildDoiSoatContext(hoSoContext, khauTruContext) {
  return {
    ...hoSoContext,
    defaults: {
      ...hoSoContext.defaults,
      ...khauTruContext.defaults
    }
  };
}

function buildPreview(phieuTraPhong, context, overrides = {}) {
  const tienThueConNo = pickMoney(overrides.tienThueConNo, context.defaults.tienThueConNo);
  const tienDichVuConNo = pickMoney(overrides.tienDichVuConNo, context.defaults.tienDichVuConNo);
  const tongChiPhiSuaChua = pickMoney(overrides.tongChiPhiSuaChua, context.defaults.tongChiPhiSuaChua);
  const tienPhat = pickMoney(overrides.tienPhat, context.defaults.tienPhat);

  return calculateDoiSoatTraPhong({
    loaiHoSo: context.loaiHoSo,
    tienCocBanDau: context.tienCocBanDau,
    ngayBatDau: context.ngayBatDau,
    ngayKetThuc: context.ngayKetThuc,
    ngayTraThucTe: phieuTraPhong.ngayTraThucTe,
    tienThueConNo,
    tienDichVuConNo,
    tongChiPhiSuaChua,
    tienPhat
  });
}

export async function getDanhSachChoDoiSoat(maNhanVienKeToan) {
  const pool = await getPool();
  return doiSoatRepository.getDanhSachChoDoiSoat(pool, maNhanVienKeToan);
}

export async function getChiTietPhieuTraPhong(maPhieuTraInput, maNhanVienKeToan) {
  const maPhieuTra = requireMaPhieuTra(maPhieuTraInput);
  const pool = await getPool();
  const phieuTraPhong = await phieuTraPhongService.layThongTinPhieuTra(
    maPhieuTra,
    maNhanVienKeToan,
    pool
  );

  phieuTraPhongService.kiemTraPhieuTraDuDieuKienLapDoiSoat(phieuTraPhong);

  const hoSoContext = await hoSoThueService.layThongTinHoSo(phieuTraPhong, pool);
  const khauTruContext = await khauTruDoiSoatService.layCacKhoanKhauTru(
    phieuTraPhong.maPhieuTra,
    phieuTraPhong.maHopDong,
    pool
  );
  const context = buildDoiSoatContext(hoSoContext, khauTruContext);
  const chiTietKhauTru = khauTruContext.chiTietKhauTru;
  let tinhToanTam = null;

  try {
    tinhToanTam = buildPreview(phieuTraPhong, context);
  } catch {
    tinhToanTam = null;
  }

  return {
    phieuTraPhong,
    loaiHoSo: context.loaiHoSo,
    khachHang: {
      maKhachHang: phieuTraPhong.maKhachHang || context.hopDong?.maKhachHang || context.phieuDatCoc?.maKhachHang || null,
      hoTen: phieuTraPhong.hoTenKhachHang || context.hopDong?.hoTenKhachHang || context.phieuDatCoc?.hoTenKhachHang || null,
      sdt: phieuTraPhong.sdtKhachHang || context.hopDong?.sdtKhachHang || context.phieuDatCoc?.sdtKhachHang || null,
      email: phieuTraPhong.emailKhachHang || context.hopDong?.emailKhachHang || context.phieuDatCoc?.emailKhachHang || null,
      cccd: phieuTraPhong.cccd || null,
      quocTich: phieuTraPhong.quocTich || null
    },
    hopDong: context.hopDong,
    phieuDatCoc: context.phieuDatCoc,
    danhSachPhong: context.danhSachPhong,
    macDinhKhauTru: context.defaults,
    chiTietKhauTru,
    tinhToanTam
  };
}

export async function taoDoiSoat(data, maNhanVienKeToan) {
  const maPhieuTra = requireMaPhieuTra(data?.maPhieuTra);
  const maDoiSoatDieuChinh = data?.maDoiSoat ? requireMaDoiSoat(data.maDoiSoat) : null;

  validateNonNegativeMoney({
    'Tiền thuê còn nợ': data?.tienThueConNo,
    'Tiền dịch vụ còn nợ': data?.tienDichVuConNo,
    'Chi phí sửa chữa': data?.tongChiPhiSuaChua,
    'Tiền phạt': data?.tienPhat
  });

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    const phieuTraPhong = await phieuTraPhongService.layThongTinPhieuTraKhoaDong(
      maPhieuTra,
      maNhanVienKeToan,
      transaction
    );

    if (!maDoiSoatDieuChinh) {
      try {
        phieuTraPhongService.kiemTraPhieuTraDuDieuKienLapDoiSoat(phieuTraPhong);
      } catch (error) {
        if (error.statusCode === 409) {
          throw createServiceError(MESSAGE_STALE, 409);
        }
        throw error;
      }
    }

    const hoSoContext = await hoSoThueService.layThongTinHoSo(phieuTraPhong, transaction);
    const khauTruContext = await khauTruDoiSoatService.layCacKhoanKhauTru(
      phieuTraPhong.maPhieuTra,
      phieuTraPhong.maHopDong,
      transaction
    );

    if (!maDoiSoatDieuChinh && hoSoContext.hopDong) {
      khauTruDoiSoatService.kiemTraDaCoBienBanKiemTra(khauTruContext);
    }

    const context = buildDoiSoatContext(hoSoContext, khauTruContext);
    const result = buildPreview(phieuTraPhong, context, data);
    const maQuyDinhHoanCoc = await quyDinhHoanCocRepository.getMaQuyDinhHoanCoc(
      transaction,
      result.tyLeHoanCocHienTai
    );

    if (maDoiSoatDieuChinh) {
      const updated = await doiSoatRepository.updateDoiSoatCanDieuChinh(transaction, {
        maDoiSoat: maDoiSoatDieuChinh,
        maPhieuTra,
        maNhanVienKeToan,
        maQuyDinhHoanCoc,
        ghiChuPhanHoiKhach: data?.ghiChuPhanHoiKhach,
        tienCocBanDau: context.tienCocBanDau,
        ...result
      });

      if (!updated) {
        throw createServiceError(MESSAGE_STALE, 409);
      }

      await transaction.commit();

      return {
        maDoiSoat: maDoiSoatDieuChinh,
        maPhieuTra,
        trangThai: updated.trangThai || 'Chờ xác nhận',
        maQuyDinhHoanCoc,
        tienCocBanDau: context.tienCocBanDau,
        ...result
      };
    }

    const existed = await doiSoatRepository.hasDoiSoatDangXuLy(transaction, maPhieuTra);
    if (existed) {
      throw createServiceError(MESSAGE_STALE, 409);
    }

    const maDoiSoat = await doiSoatRepository.generateMaDoiSoat(transaction);

    if (!maDoiSoat) {
      throw createServiceError('Không sinh được mã đối soát.', 500);
    }

    await doiSoatRepository.insertDoiSoat(transaction, {
      maDoiSoat,
      maPhieuTra,
      maNhanVienKeToan,
      maQuyDinhHoanCoc,
      ghiChuPhanHoiKhach: data?.ghiChuPhanHoiKhach,
      tienCocBanDau: context.tienCocBanDau,
      ...result
    });

    await transaction.commit();

    return {
      maDoiSoat,
      maPhieuTra,
      trangThai: 'Chờ xác nhận',
      maQuyDinhHoanCoc,
      tienCocBanDau: context.tienCocBanDau,
      ...result
    };
  } catch (error) {
    if (!transaction._aborted) {
      try {
        await transaction.rollback();
      } catch {
        // Ignore rollback errors so the original validation/database error is preserved.
      }
    }

    if (error.message === 'Các khoản tiền không được âm.' || error.message?.startsWith('Thiếu ngày')) {
      throw createServiceError(error.message, 400);
    }

    throw error;
  }
}

export async function uploadChungTuThanhToan(data, maNhanVienKeToan) {
  if (!maNhanVienKeToan) {
    throw createServiceError('Bạn cần đăng nhập để tải chứng từ.', 401);
  }

  const maDoiSoat = requireMaDoiSoat(data?.maDoiSoat);
  const fileName = sanitizeFileName(data?.fileName);
  const contentType = String(data?.contentType || '').trim() || contentTypeFromFileName(fileName);
  const dataBase64 = String(data?.dataBase64 || '').trim();

  if (!ALLOWED_PROOF_TYPES.has(contentType)) {
    throw createServiceError('Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF hoặc PDF.', 400);
  }

  if (!dataBase64) {
    throw createServiceError('Thiếu dữ liệu chứng từ.', 400);
  }

  const buffer = Buffer.from(dataBase64, 'base64');
  if (buffer.length <= 0 || buffer.length > MAX_PROOF_BYTES) {
    throw createServiceError('Dung lượng chứng từ tối đa là 5MB.', 400);
  }

  const pool = await getPool();
  const detail = await thuThemDoiSoatRepository.getChiTietThuThem(pool, maDoiSoat, maNhanVienKeToan);
  const hasThuThem = Boolean(detail.chiTiet);
  const hasHoanCoc = hasThuThem
    ? false
    : Boolean((await hoanCocDoiSoatRepository.getChiTietHoanCoc(pool, maDoiSoat, maNhanVienKeToan)).chiTiet);

  if (!hasThuThem && !hasHoanCoc) {
    throw createServiceError('Không tìm thấy phiếu đối soát trong chi nhánh của bạn.', 404);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const parsed = path.parse(fileName);
  const extension = parsed.ext || extensionFromContentType(contentType);
  const baseName = sanitizeFileName(parsed.name || maDoiSoat);
  const savedName = `${maDoiSoat}_${Date.now()}_${baseName}${extension}`;
  const savedPath = path.join(UPLOAD_DIR, savedName);

  await fs.writeFile(savedPath, buffer);

  return {
    url: `/uploads/chung-tu-doi-soat/${savedName}`,
    fileName: savedName
  };
}

export async function getDanhSachChoHoanCoc(maNhanVienKeToan) {
  const pool = await getPool();
  return hoanCocDoiSoatRepository.getDanhSachChoHoanCoc(pool, maNhanVienKeToan);
}

export async function getDanhSachDaHoanCoc(maNhanVienKeToan) {
  const pool = await getPool();
  return hoanCocDoiSoatRepository.getDanhSachDaHoanCoc(pool, maNhanVienKeToan);
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

export async function getKetQuaDoiSoat(maNhanVienKeToan) {
  const pool = await getPool();
  return ketQuaDoiSoatRepository.getKetQuaDoiSoat(pool, maNhanVienKeToan);
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
  getDanhSachChoDoiSoat,
  getChiTietPhieuTraPhong,
  taoDoiSoat,
  uploadChungTuThanhToan,
  getDanhSachChoThuThem,
  getDanhSachDaThuThem,
  getKetQuaDoiSoat,
  getChiTietThuThem,
  xacNhanThuThem,
  khongXacNhanThuThem,
  getDanhSachChoHoanCoc,
  getDanhSachDaHoanCoc,
  getChiTietHoanCoc,
  xacNhanHoanCoc
};
