import { createServiceError, mapDatabaseError } from './serviceErrors.js';
import { assertSingleRoomTypeCapacity } from './rentRegistrationRules.js';
import * as dangKyThueRepository from '../repositories/dangKyThue.repository.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    50011: 400
  });
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();
  if (!raw) return null;

  const numericText = raw.replace(/[^\d,.-]/g, '');
  const commaAsDecimal = numericText.includes(',') && numericText.lastIndexOf(',') > numericText.lastIndexOf('.');
  const cleaned = commaAsDecimal
    ? numericText.replace(/\./g, '').replace(',', '.')
    : numericText.replace(/,/g, '');
  const compact = (cleaned.match(/\./g) || []).length > 1
    ? cleaned.replace(/\./g, '')
    : cleaned;
  const number = Number(compact);

  return Number.isFinite(number) ? number : null;
}

function normalizeMoneyVnd(value) {
  const number = parseMoney(value);
  if (number == null || number <= 0) return null;
  const vnd = Math.round(number);
  const remainder = ((vnd % 1000) + 1000) % 1000;
  if (remainder <= 10) return vnd - remainder;
  if (1000 - remainder <= 10) return vnd + (1000 - remainder);
  return vnd;
}

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('vi-VN');
}

function getAvailableSlots(row = {}) {
  return Math.max(0, Number(row.soGiuongTrong ?? row.soGiuongDuKienXep ?? row.sucChua ?? 0));
}

function getRoomCapacity(row = {}) {
  return Math.max(0, Number(row.sucChua ?? row.SucChuaToiDa ?? row.capacity ?? 0));
}

function roomAllowsMixedGender(row = {}) {
  return ['không phân biệt', 'khác', 'hỗn hợp'].includes(normalizeText(row.gioiTinhChoPhep ?? row.GioiTinhChoPhep));
}

function roomAllowsSingleGender(row = {}, gender) {
  const roomGender = normalizeText(row.gioiTinhChoPhep ?? row.GioiTinhChoPhep);
  return roomGender === gender || roomAllowsMixedGender(row);
}

function getProfileOccupancy(profile = {}) {
  const total = Math.max(1, Number(
    profile.SoNguoiDuKienO ?? profile.soNguoiDuKienO ?? profile.soNguoiO ?? profile.SoNguoiO ?? 1
  ));
  let male = Math.max(0, Number(profile.SoNam ?? profile.soNam ?? 0));
  let female = Math.max(0, Number(profile.SoNu ?? profile.soNu ?? 0));
  const gender = normalizeText(profile.GioiTinh ?? profile.gioiTinh);

  if (male === 0 && female === 0) {
    if (gender === 'nam') male = total;
    if (gender === 'nữ') female = total;
  }

  return { total, male, female };
}

function isRoomSuitableForProfile(row = {}, profile = {}) {
  const { total, male, female } = getProfileOccupancy(profile);
  const availableSlots = getAvailableSlots(row);
  const capacity = getRoomCapacity(row);

  if (male > 0 && female > 0) {
    return roomAllowsMixedGender(row)
      && capacity >= total
      && availableSlots >= capacity;
  }

  if (male > 0) {
    return roomAllowsSingleGender(row, 'nam') && availableSlots >= total;
  }

  if (female > 0) {
    return roomAllowsSingleGender(row, 'nữ') && availableSlots >= total;
  }

  return availableSlots >= total;
}

const ACTIVE_RENT_FLOW_MESSAGE = 'Khách hàng đang có phiếu đăng ký/đặt cọc/hợp đồng chưa kết thúc. Chỉ được tạo phiếu đăng ký mới khi luồng thuê hiện tại kết thúc.';

async function getActiveRentFlow(khachHangId) {
  const id = String(khachHangId || '').trim();
  if (!id) return null;

  return dangKyThueRepository.timLuongThueDangHoatDong(id);
}

async function assertCanCreateRentRegistration(khachHangId) {
  const activeFlow = await getActiveRentFlow(khachHangId);
  if (activeFlow) {
    throw createServiceError(
      `${ACTIVE_RENT_FLOW_MESSAGE} Đang tồn tại ${activeFlow.loai} ${activeFlow.maThamChieu} (${activeFlow.trangThai}).`,
      409
    );
  }
}

// UC: Gửi thông tin đăng ký thuê
// khachHangId lấy từ req.user (tài khoản đang đăng nhập), KHÔNG từ body
export async function createHoSoDangKy(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();

  if (!khachHangId) {
    throw createServiceError('Không thể xác định thông tin khách hàng. Vui lòng đăng nhập lại.', 401);
  }

  // Kiểm tra thông tin bắt buộc phía service (A4 trong UC)
  const gioiTinhThue = data.gioiTinhThue || data.gioiTinh || null;
  const soNguoiO    = Number(data.soNguoiO);
  const ngayDuKienVaoO = data.ngayDuKienVaoO || null;
  const mucGiaToiDa = normalizeMoneyVnd(data.mucGiaToiDa ?? data.mucGiaDen ?? data.mucGia);

  if (!soNguoiO || soNguoiO < 1) {
    throw createServiceError('Vui lòng nhập số người dự kiến ở (tối thiểu 1 người).');
  }
  if (!ngayDuKienVaoO) {
    throw createServiceError('Vui lòng nhập thời gian dự kiến vào ở.');
  }
  if (!mucGiaToiDa) {
    throw createServiceError('Vui lòng nhập mức giá mong muốn hợp lệ.');
  }
  const loaiPhongYeuCau = await assertSingleRoomTypeCapacity(data.loaiPhongYeuCau, soNguoiO);

  await assertCanCreateRentRegistration(khachHangId);

  try {
    return await dangKyThueRepository.taoHoSoDangKy({
      khachHangId,
      soNguoiO,
      soNam: data.soNam || 0,
      soNu: data.soNu || 0,
      ngayDuKienVaoO,
      ghiChu: data.ghiChu || null,
      khuVucMongMuon: data.khuVucMongMuon || null,
      loaiPhongYeuCau,
      mucGiaToiDa,
      thoiHanThue: data.thoiHanThue,
      gioiTinh: gioiTinhThue
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getHoSoDangKy(filter = {}) {
  const rows = await dangKyThueRepository.layDanhSachHoSoDangKy(filter);
  const cancelledRows = await dangKyThueRepository.layMaDangKyBiHuyDoTatCaLichXemBiHuy();
  const cancelledIds = new Set(cancelledRows.map((row) => row.MaDangKy));

  return rows.map((row) => {
    const biHuyDoTatCaLich = cancelledIds.has(row.maDangKy);
    return {
      ...row,
      biHuyDoTatCaLich,
      trangThaiHienThi: biHuyDoTatCaLich ? 'Hủy' : row.trangThai
    };
  });
}

export async function kiemTraKhachHangTonTai(filter = {}) {
  const sdt = String(filter.sdt || '').trim();
  const cccd = String(filter.cccd || '').trim();

  const base = await dangKyThueRepository.kiemTraSdtCccdTonTai({ sdt, cccd });
  const matchedCustomer = await dangKyThueRepository.timKhachHangTheoSdt(sdt);
  const maKhachHang = matchedCustomer?.MaKhachHang || null;
  const maKhachHangTheoCccd = cccd
    ? await dangKyThueRepository.timMaKhachHangTheoCccd(cccd)
    : null;
  const activeFlow = maKhachHang ? await getActiveRentFlow(maKhachHang) : null;

  return {
    ...base,
    maKhachHang,
    khachHang: matchedCustomer ? {
      maKhachHang,
      hoTen: matchedCustomer.HoTen,
      ngaySinh: matchedCustomer.NgaySinh,
      gioiTinh: matchedCustomer.GioiTinh,
      sdt: matchedCustomer.SDT,
      email: matchedCustomer.Email,
      quocTich: matchedCustomer.QuocTich,
      cccd: matchedCustomer.CCCD
    } : null,
    cccdThuocKhachKhac: Boolean(
      maKhachHangTheoCccd && (!maKhachHang || maKhachHangTheoCccd !== maKhachHang)
    ),
    dangCoLuongThueDangHoatDong: Boolean(activeFlow),
    luongThueDangHoatDong: activeFlow || null,
    thongBao: activeFlow
      ? `${ACTIVE_RENT_FLOW_MESSAGE} Đang tồn tại ${activeFlow.loai} ${activeFlow.maThamChieu} (${activeFlow.trangThai}).`
      : null
  };
}

export async function getPhongGiuongKhaDung(filter = {}) {
  const hoSoId = String(filter.hoSoId || '').trim();
  let mucGiaToiDa = normalizeMoneyVnd(filter.mucGiaToiDa);
  const soNguoiO = Number(filter.soNguoiO);
  let profileCriteria = {
    SoNguoiDuKienO: Number.isFinite(soNguoiO) && soNguoiO > 0 ? soNguoiO : null,
    SoNam: filter.soNam || 0,
    SoNu: filter.soNu || 0,
    GioiTinh: filter.gioiTinh || null
  };

  if (hoSoId) {
    const record = await dangKyThueRepository.layTieuChiHoSoDangKy(hoSoId);
    if (!mucGiaToiDa) {
      mucGiaToiDa = normalizeMoneyVnd(record.MucGiaToiDa);
    }
    profileCriteria = record;
  }

  const rooms = await dangKyThueRepository.layDanhSachPhongGiuongKhaDung({
    loai: filter.loai || null,
    gioiTinh: filter.gioiTinh || null,
    maChiNhanh: filter.maChiNhanh || null,
    khuVuc: filter.khuVuc || null,
    loaiPhong: filter.loaiPhong || null,
    mucGiaTu: normalizeMoneyVnd(filter.mucGiaTu),
    mucGiaToiDa,
    soNguoiO: Number.isFinite(soNguoiO) && soNguoiO > 0 ? soNguoiO : null,
    hoSoId: hoSoId || null
  });

  let isRegionValid = true;
  if (hoSoId) {
    isRegionValid = await dangKyThueRepository.kiemTraKhuVucHoSoHopLe(hoSoId);
  }

  return {
    rooms: rooms.filter((row) => row.maPhong && isRoomSuitableForProfile(row, profileCriteria)),
    isRegionValid
  };
}

export async function traCuuPhong(filter = {}) {
  return dangKyThueRepository.traCuuPhong({
    khuVuc: filter.khuVuc || null,
    loaiPhong: filter.loaiPhong || null,
    hinhThucThue: filter.hinhThucThue || null,
    mucGiaToiDa: normalizeMoneyVnd(filter.mucGiaToiDa)
  });
}

export async function kiemTraDieuKienThue(hoSoId) {
  try {
    return await dangKyThueRepository.kiemTraDieuKienThue(hoSoId);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatKetQuaXuLy(hoSoId, data = {}) {
  try {
    return await dangKyThueRepository.capNhatKetQuaXuLy(hoSoId, data);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function tiepNhanHoSoDangKy(hoSoId, nhanVienSaleId) {
  try {
    return await dangKyThueRepository.tiepNhanHoSoDangKy(hoSoId, nhanVienSaleId);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function huyTiepNhanHoSoDangKy(hoSoId, nhanVienSaleId) {
  try {
    return await dangKyThueRepository.huyTiepNhanHoSoDangKy(hoSoId, nhanVienSaleId);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function taoHoSoKhachVangLai(data, nhanVienSaleId) {
  try {
    const soNguoiO = Number(data.soNguoiO || data.soNguoi || 1);
    const thoiHanThue = Number(data.thoiHanThue || data.thoiHan || 1);
    const mucGia = normalizeMoneyVnd(data.mucGiaToiDa ?? data.mucGiaDen ?? data.mucGia);
    const hinhThucThue = data.hinhThucThue || data.hinhThuc || null;
    const sdt = String(data.sdt || '').trim();
    const cccd = String(data.cccd || '').trim();
    const loaiPhongYeuCau = await assertSingleRoomTypeCapacity(data.loaiPhongYeuCau || data.loaiPhong, soNguoiO);

    if (!/^\d{10}$/.test(sdt)) {
      throw createServiceError('Số điện thoại phải có đúng 10 chữ số.');
    }
    if (!/^\d{12}$/.test(cccd)) {
      throw createServiceError('CCCD phải có đúng 12 chữ số.');
    }

    const existingCustomer = await dangKyThueRepository.timKhachHangKhachVangLaiTheoSdt(sdt);

    if (existingCustomer) {
      if (String(existingCustomer.CCCD || '').trim() !== cccd) {
        throw createServiceError('CCCD không khớp với khách hàng đã đăng ký bằng SĐT này.', 409);
      }

      await assertCanCreateRentRegistration(existingCustomer.MaKhachHang);
      const registration = await dangKyThueRepository.taoHoSoDangKy({
        khachHangId: existingCustomer.MaKhachHang,
        soNguoiO,
        soNam: data.soNam || 0,
        soNu: data.soNu || 0,
        ngayDuKienVaoO: data.ngayVao || data.ngayDuKienVaoO,
        ghiChu: data.ghiChu || data.yeuCau || null,
        khuVucMongMuon: data.khuVucMongMuon || data.khuVuc,
        loaiPhongYeuCau,
        mucGiaToiDa: mucGia,
        thoiHanThue,
        gioiTinh: data.gioiTinhO || data.gioiTinh
      });

      return registration ? { ...registration, maNhanVienSale: null, hoTenSale: null } : null;
    }

    return await dangKyThueRepository.taoHoSoKhachVangLai({
      hoTen: data.hoTen,
      ngaySinh: data.ngaySinh,
      gioiTinh: data.gioiTinhO || data.gioiTinh,
      sdt,
      email: data.email || null,
      quocTich: data.quocTich || 'Việt Nam',
      cccd,
      hinhThucThue,
      khuVucMongMuon: data.khuVucMongMuon || data.khuVuc,
      loaiPhongYeuCau,
      mucGiaToiDa: mucGia,
      soNguoiO,
      soNam: data.soNam || 0,
      soNu: data.soNu || 0,
      ngayDuKienVaoO: data.ngayVao || data.ngayDuKienVaoO,
      thoiHanThue,
      ghiChu: data.ghiChu || data.yeuCau || null,
      nhanVienSaleId
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}
