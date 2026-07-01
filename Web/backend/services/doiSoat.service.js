import { getPool, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';
import {
  LOAI_HO_SO_TRA_PHONG,
  calculateDoiSoatTraPhong,
  safeNumber
} from './doiSoatCalculator.service.js';
import * as doiSoatRepository from '../repositories/doiSoat.repository.js';

const TRANG_THAI_CHO_DOI_SOAT = 'Chờ đối soát';
const MESSAGE_STALE =
  'Phiếu trả phòng này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.';

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

function mapThuThemDatabaseError(error) {
  mapDatabaseError(error, {
    50700: 400,
    50701: 409,
    50702: 409,
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

function determineLoaiHoSo(phieuTraPhong) {
  if (phieuTraPhong.maHopDong) {
    return LOAI_HO_SO_TRA_PHONG.HOP_DONG_THUE;
  }

  if (phieuTraPhong.maPhieuDatCoc) {
    return LOAI_HO_SO_TRA_PHONG.DAT_COC_CHUA_KY_HOP_DONG;
  }

  throw createServiceError('Phiếu trả phòng thiếu thông tin hợp đồng hoặc phiếu đặt cọc.', 400);
}

async function buildHoSoContext(db, phieuTraPhong, options = {}) {
  const loaiHoSo = determineLoaiHoSo(phieuTraPhong);
  const suaChua = await doiSoatRepository.getTongChiPhiSuaChua(db, phieuTraPhong.maPhieuTra);

  if (loaiHoSo === LOAI_HO_SO_TRA_PHONG.HOP_DONG_THUE) {
    const hopDong = await doiSoatRepository.getHopDongHoSo(db, phieuTraPhong.maHopDong);

    if (!hopDong) {
      throw createServiceError('Không tìm thấy hợp đồng thuê hợp lệ cho phiếu trả phòng.', 400);
    }

    if (options.requireBienBanKiemTra && safeNumber(suaChua.soBienBanKiemTra) <= 0) {
      throw createServiceError('Phiếu trả phòng chưa có biên bản kiểm tra phòng.', 400);
    }

    if (!phieuTraPhong.ngayTraThucTe) {
      throw createServiceError('Ngày trả thực tế chưa có dữ liệu để tính thời gian lưu trú.', 400);
    }

    const tienPhat = await doiSoatRepository.getTienPhatChoXuLy(db, hopDong.maHopDong);
    const tienHoaDonConNo = await doiSoatRepository.getTienHoaDonConNo(db, hopDong.maHopDong);
    const danhSachPhong = await doiSoatRepository.getPhongTrongPhieuCoc(db, hopDong.maPhieuCoc);

    return {
      loaiHoSo,
      hopDong,
      phieuDatCoc: null,
      danhSachPhong,
      defaults: {
        tienThueConNo: safeNumber(tienHoaDonConNo.tienThueConNo),
        tienDichVuConNo: safeNumber(tienHoaDonConNo.tienDichVuConNo),
        tongChiPhiSuaChua: suaChua.tongChiPhiSuaChua,
        tienPhat
      },
      tienCocBanDau: safeNumber(hopDong.soTienCoc),
      ngayBatDau: hopDong.ngayBatDau,
      ngayKetThuc: hopDong.ngayKetThuc,
      ngayTraThucTe: phieuTraPhong.ngayTraThucTe
    };
  }

  const phieuDatCoc = await doiSoatRepository.getPhieuDatCocHoSo(db, phieuTraPhong.maPhieuDatCoc);

  if (!phieuDatCoc) {
    throw createServiceError('Không tìm thấy phiếu đặt cọc cho phiếu trả phòng.', 400);
  }

  if (phieuDatCoc.trangThaiThanhToan !== 'Đã TT' || phieuDatCoc.trangThaiCoc !== 'Hiệu lực') {
    throw createServiceError('Phiếu đặt cọc chưa đủ điều kiện đối soát.', 400);
  }

  const danhSachPhong = await doiSoatRepository.getPhongTrongPhieuCoc(db, phieuDatCoc.maPhieuDatCoc);

  return {
    loaiHoSo,
    hopDong: null,
    phieuDatCoc,
    danhSachPhong,
    defaults: {
      tienThueConNo: 0,
      tienDichVuConNo: 0,
      tongChiPhiSuaChua: suaChua.tongChiPhiSuaChua,
      tienPhat: 0
    },
    tienCocBanDau: safeNumber(phieuDatCoc.soTienCoc),
    ngayBatDau: null,
    ngayKetThuc: null,
    ngayTraThucTe: phieuTraPhong.ngayTraThucTe
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

export async function getDanhSachChoDoiSoat() {
  const pool = await getPool();
  return doiSoatRepository.getDanhSachChoDoiSoat(pool);
}

export async function getChiTietPhieuTraPhong(maPhieuTraInput) {
  const maPhieuTra = requireMaPhieuTra(maPhieuTraInput);
  const pool = await getPool();
  const phieuTraPhong = await doiSoatRepository.getPhieuTraPhongById(pool, maPhieuTra);

  if (!phieuTraPhong) {
    throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);
  }

  const context = await buildHoSoContext(pool, phieuTraPhong);
  const chiTietKhauTru = await doiSoatRepository.getChiTietKhauTru(
    pool,
    phieuTraPhong.maPhieuTra,
    phieuTraPhong.maHopDong
  );
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

    const phieuTraPhong = await doiSoatRepository.getPhieuTraPhongById(transaction, maPhieuTra, true);

    if (!phieuTraPhong) {
      throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);
    }

    if (phieuTraPhong.trangThai !== TRANG_THAI_CHO_DOI_SOAT) {
      throw createServiceError(MESSAGE_STALE, 409);
    }

    const existed = await doiSoatRepository.hasDoiSoatDangXuLy(transaction, maPhieuTra);
    if (existed) {
      throw createServiceError(MESSAGE_STALE, 409);
    }

    const context = await buildHoSoContext(transaction, phieuTraPhong, { requireBienBanKiemTra: true });
    const result = buildPreview(phieuTraPhong, context, data);
    const maQuyDinhHoanCoc = await doiSoatRepository.getMaQuyDinhHoanCoc(
      transaction,
      result.tyLeHoanCocHienTai
    );
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

export async function getDanhSachChoHoanCoc(maNhanVienKeToan) {
  const pool = await getPool();
  return doiSoatRepository.getDanhSachChoHoanCoc(pool, maNhanVienKeToan);
}

export async function getDanhSachChoThuThem(maNhanVienKeToan) {
  const pool = await getPool();
  return doiSoatRepository.getDanhSachChoThuThem(pool, maNhanVienKeToan);
}

export async function getChiTietThuThem(maDoiSoatInput, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(maDoiSoatInput);
  const pool = await getPool();
  const data = await doiSoatRepository.getChiTietThuThem(pool, maDoiSoat, maNhanVienKeToan);

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
    return await doiSoatRepository.xacNhanThuThem(pool, {
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

export async function getChiTietHoanCoc(maDoiSoatInput, maNhanVienKeToan) {
  const maDoiSoat = requireMaDoiSoat(maDoiSoatInput);
  const pool = await getPool();
  const data = await doiSoatRepository.getChiTietHoanCoc(pool, maDoiSoat, maNhanVienKeToan);

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
    return await doiSoatRepository.xacNhanHoanCoc(pool, {
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
  getDanhSachChoThuThem,
  getChiTietThuThem,
  xacNhanThuThem,
  getDanhSachChoHoanCoc,
  getChiTietHoanCoc,
  xacNhanHoanCoc
};
