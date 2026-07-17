import { createServiceError, mapDatabaseError } from './serviceErrors.js';
import * as lichXemPhongRepository from '../repositories/lichXemPhong.repository.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    50011: 400
  });
}

function parseScheduleId(id) {
  const raw = String(id || '').trim();
  const match = raw.match(/^([A-Za-z]{2}\d{4})-(\d+)$/);
  if (!match) {
    throw createServiceError('Mã lịch xem phòng không hợp lệ.');
  }
  return {
    maDangKy: match[1],
    sttLich: Number(match[2])
  };
}

function normalizeRooms(data = {}) {
  const source = Array.isArray(data.rooms)
    ? data.rooms
    : Array.isArray(data.phongIds)
      ? data.phongIds
      : data.maPhong
        ? [data.maPhong]
        : data.phongGiuongId
          ? [data.phongGiuongId]
          : [];

  return [...new Set(source
    .map((item) => String(item?.maPhong || item?.id || item || '').trim())
    .filter(Boolean))];
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

function filterRoomsByProfileCapacity(rows = [], profile = {}) {
  return rows.filter((row) => isRoomSuitableForProfile(row, profile));
}

function isSaleUser(user = {}) {
  return (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Sale') || user?.vaiTro === 'NhanVienSale';
}

function isCustomerUser(user = {}) {
  return user?.vaiTro === 'KhachHang';
}

function requireSaleUser(user = {}) {
  if (!isSaleUser(user)) {
    throw createServiceError('Chỉ nhân viên Sale mới được thực hiện thao tác này.', 403);
  }
}

function validateAppointmentTime(value) {
  const appointment = new Date(value);
  if (!value || Number.isNaN(appointment.valueOf())) {
    throw createServiceError('Thời gian xem phòng không hợp lệ.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDay = new Date(appointment);
  appointmentDay.setHours(0, 0, 0, 0);
  if (appointmentDay <= today) {
    throw createServiceError('Ngày xem phòng phải sau ngày hiện tại.');
  }

  const minutes = appointment.getHours() * 60 + appointment.getMinutes();
  if (minutes < 7 * 60 || minutes > 17 * 60) {
    throw createServiceError('Giờ xem phòng chỉ được chọn từ 07:00 đến 17:00.');
  }

  return appointment;
}

function normalizeStatus(value) {
  return normalizeText(value);
}

function assertCanAccessSchedule(row, user = {}) {
  if (!row) {
    throw createServiceError('Không tìm thấy lịch xem phòng.', 404);
  }

  if (isCustomerUser(user)) {
    if (row.maKhachHang !== user.maNguoiDung) {
      throw createServiceError('Bạn không có quyền truy cập lịch xem phòng này.', 403);
    }
    return;
  }

  if (isSaleUser(user)) {
    const sameSale = row.maNhanVienSale && row.maNhanVienSale === user.maNguoiDung;
    const sameBranch = row.maChiNhanh && user.maChiNhanh && row.maChiNhanh === user.maChiNhanh;
    if (!sameSale && !sameBranch) {
      throw createServiceError('Bạn không có quyền xử lý lịch xem phòng ngoài chi nhánh.', 403);
    }
  }
}

export async function createLichXemPhong(data = {}, user = null) {
  requireSaleUser(user);
  const maDangKy = String(data.maDangKy || data.hoSoDangKyId || '').trim();
  const thoiGianHen = validateAppointmentTime(data.thoiGianXem || data.thoiGianHen || null);
  const phongIds = normalizeRooms(data);
  const nhanVienSaleId = String(data.nhanVienSaleId || user?.maNguoiDung || '').trim() || null;

  if (!maDangKy || phongIds.length === 0) {
    throw createServiceError('Vui lòng chọn hồ sơ, phòng và thời gian xem.');
  }

  try {
    const sttLich = await lichXemPhongRepository.taoLichXemPhong({
      maDangKy,
      thoiGianHen,
      phongIds,
      nhanVienSaleId,
      ghiChu: data.ghiChu || null,
      user
    });

    const result = await getLichXemPhong({ maDangKy, sttLich }, user);
    return result[0] || { id: `${maDangKy}-${sttLich}`, maDangKy, sttLich };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getLichXemPhong(filter = {}, user = null) {
  const maDangKy = filter.maDangKy ? String(filter.maDangKy).trim() : null;
  const sttLich = filter.sttLich ? Number(filter.sttLich) : null;
  const maKhachHang = isCustomerUser(user)
    ? user.maNguoiDung
    : (filter.maKhachHang ? String(filter.maKhachHang).trim() : null);
  const nhanVienSaleId = isSaleUser(user)
    ? user.maNguoiDung
    : (filter.nhanVienSaleId ? String(filter.nhanVienSaleId).trim() : null);
  const maChiNhanh = isSaleUser(user)
    ? user.maChiNhanh
    : (filter.maChiNhanh ? String(filter.maChiNhanh).trim() : null);

  return lichXemPhongRepository.layDanhSachLichXemPhong({
    maDangKy,
    sttLich,
    maKhachHang,
    nhanVienSaleId,
    maChiNhanh
  });
}

export async function yeuCauDieuChinhLich(id, data = {}, user = null) {
  try {
    const { maDangKy, sttLich } = parseScheduleId(id);
    const current = (await getLichXemPhong({ maDangKy, sttLich }, user))[0];
    assertCanAccessSchedule(current, user);
    const thoiGianMoi = data.thoiGianMoi || data.timeText || null;
    const lyDo = data.lyDo || data.reason || null;
    const ghiChu = [
      thoiGianMoi ? `Thời gian đề xuất: ${thoiGianMoi}` : null,
      lyDo ? `Lý do đổi: ${lyDo}` : null
    ].filter(Boolean).join('. ');

    await lichXemPhongRepository.ghiNhanYeuCauDieuChinhLich({
      maDangKy,
      sttLich,
      lyDo: ghiChu || lyDo
    });

    const result = await getLichXemPhong({ maDangKy, sttLich }, user);
    return result[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatLichXemPhong(id, data = {}, user = null) {
  requireSaleUser(user);
  try {
    const { maDangKy, sttLich } = parseScheduleId(id);
    const thaoTac = String(data.thaoTac || '').trim().toLowerCase();
    const current = (await getLichXemPhong({ maDangKy, sttLich }, user))[0];
    assertCanAccessSchedule(current, user);
    const currentStatus = normalizeStatus(current.trangThai);
    const isCancelAction = ['huy', 'hủy', 'cancel'].includes(thaoTac);

    if (currentStatus === 'đã hủy') {
      throw createServiceError('Lịch xem phòng đã kết thúc, không thể cập nhật.');
    }

    if (isCancelAction) {
      if (!current.coTheHuy) {
        throw createServiceError('Chỉ được hủy lịch trong vòng 30 phút sau giờ hẹn và trước khi gửi yêu cầu đặt cọc.');
      }

      const soLichCapNhat = await lichXemPhongRepository.huyLichXemPhong({
        maDangKy,
        sttLich,
        ghiChuXuLy: data.ghiChuXuLy || null
      });
      if (!soLichCapNhat) {
        throw createServiceError('Lịch xem phòng không còn đủ điều kiện để hủy.');
      }
      await lichXemPhongRepository.tuChoiHoSoNeuTatCaLichBiHuy(maDangKy);
    } else {
      if (currentStatus === 'đã xem') {
        throw createServiceError('Lịch xem phòng đã đến giờ xem, không thể đổi lịch.');
      }
      if (!data.thoiGianXem) {
        throw createServiceError('Vui lòng chọn thời gian xem phòng mới.');
      }
      const thoiGianHen = validateAppointmentTime(data.thoiGianXem);

      await lichXemPhongRepository.capNhatThoiGianLichXemPhong({
        maDangKy,
        sttLich,
        thoiGianHen,
        ghiChuXuLy: data.ghiChuXuLy || null
      });
    }

    const result = await getLichXemPhong({ maDangKy, sttLich }, user);
    return result[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getPhongPhuHop(maDangKy, user = null) {
  requireSaleUser(user);
  const hoSoId = String(maDangKy || '').trim();
  if (!hoSoId) {
    throw createServiceError('Vui lòng cung cấp mã đăng ký.');
  }

  try {
    const profileRecord = await lichXemPhongRepository.layHoSoDangKyChoPhongPhuHop(hoSoId);
    if (!profileRecord) {
      throw createServiceError('Không tìm thấy hồ sơ đăng ký.', 404);
    }
    if (normalizeStatus(profileRecord.TrangThai) !== normalizeStatus('Đã tiếp nhận')) {
      throw createServiceError('Chỉ được kiểm tra phòng cho hồ sơ đã tiếp nhận.');
    }
    if (profileRecord.MaNhanVienSale && profileRecord.MaNhanVienSale !== user?.maNguoiDung) {
      throw createServiceError('Hồ sơ đang do nhân viên Sale khác xử lý.', 403);
    }
    const mucGiaToiDa = normalizeMoneyVnd(profileRecord.MucGiaToiDa);

    const roomRows = await lichXemPhongRepository.layPhongGiuongKhaDungChoHoSo({
      hoSoId,
      mucGiaToiDa
    });

    const rows = filterRoomsByProfileCapacity(roomRows, profileRecord)
      .filter((row) => !user?.maChiNhanh || row.maChiNhanh === user.maChiNhanh || row.MaChiNhanh === user.maChiNhanh);
    const khongCoChiNhanhPhuHop = rows.some((row) => Boolean(row.khongCoChiNhanhPhuHop));
    const rooms = rows
      .filter((row) => row.maPhong)
      .map((row) => ({
        ...row,
        id: row.maPhong,
        name: row.tenPhong,
        type: row.loaiPhong || row.loaiThue,
        price: row.giaThue,
        address: row.diaChi,
        img: row.urlImg,
        status: row.tinhTrang
      }));

    return {
      rooms,
      isRegionValid: !khongCoChiNhanhPhuHop,
      khongCoChiNhanhPhuHop
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}
