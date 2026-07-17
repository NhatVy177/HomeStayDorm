import * as repository from '../repositories/hopDong.repository.js';
import { PhieuDatCocDTO, DichVuDTO, ThanhVienHopDongDTO, HopDongThueDTO } from '../models/hopDong.dto.js';
import { createServiceError } from './serviceErrors.js';

/**
 * Business Logic Layer (BUS) for HopDongThue feature.
 * Performs validations, checks business constraints, and coordinates data flow.
 */

export async function traCuuPhieuCoc(tuKhoa = null, trangThaiCoc = null, ngayTao = null) {
  const rawList = await repository.traCuuPhieuCoc(tuKhoa, trangThaiCoc, ngayTao);
  return PhieuDatCocDTO.fromList(rawList);
}

export async function layChiTietPhieuCoc(maPhieuDatCoc) {
  if (!maPhieuDatCoc) {
    throw createServiceError('Vui lòng cung cấp mã phiếu đặt cọc.', 400);
  }
  const rawRows = await repository.layChiTietPhieuCoc(maPhieuDatCoc);
  if (!rawRows || rawRows.length === 0) {
    throw createServiceError('Không tìm thấy thông tin phiếu đặt cọc.', 404);
  }
  
  // Since SQL query joins tables, it might return multiple rows if there are multiple details.
  // Group them by mapping the first row.
  return new PhieuDatCocDTO(rawRows[0]);
}

function mapThanhVienCuTru(row = {}) {
  let status = row.TrangThaiDuyet;
  if (status && (status.includes('di') || status.includes('du') || status.includes('dieu') || status.includes('d?'))) {
    status = 'Đủ điều kiện';
  } else if (status && (status.includes('tu choi') || status.includes('t?') || status.includes('choi') || status.includes('chi'))) {
    status = 'Bị từ chối';
  }
  return {
    maThanhVienCuTru: row.MaThanhVienCuTru,
    hoTen: row.HoTen,
    ten: row.HoTen,
    ngaySinh: row.NgaySinh,
    gioiTinh: row.GioiTinh,
    cccd: row.CCCD,
    sdt: row.SDT,
    email: row.Email,
    quocTich: row.QuocTich,
    trangThaiDuyet: status,
    lyDoTuChoi: row.LyDoTuChoi
  };
}

export async function layHoSoCuTruDaDuyetTheoPhieuCoc(maPhieuDatCoc) {
  if (!maPhieuDatCoc) {
    throw createServiceError('Vui lòng cung cấp mã phiếu đặt cọc.', 400);
  }

  const result = await repository.layHoSoCuTruDaDuyetTheoPhieuCoc(maPhieuDatCoc);
  if (!result.hoSo) {
    throw createServiceError('Phiếu đặt cọc này chưa có hồ sơ cư trú đã được quản lý duyệt.', 404);
  }

  const thanhVien = result.thanhVien.map(mapThanhVienCuTru);
  const soDuDieuKien = thanhVien.filter((item) => item.trangThaiDuyet === 'Đủ điều kiện').length;
  const soBiTuChoi = thanhVien.filter((item) => item.trangThaiDuyet === 'Bị từ chối').length;

  let hosoStatus = result.hoSo.TrangThaiHoSo;
  if (hosoStatus && (hosoStatus.includes('duy') || hosoStatus.includes('duy?t'))) {
    hosoStatus = 'Đã duyệt cư trú';
  }

  return {
    hoSo: {
      maHoSoCuTru: result.hoSo.MaHoSoCuTru,
      maPhieuDatCoc: result.hoSo.MaPhieuDatCoc,
      maNhanVienQuanLy: result.hoSo.MaNhanVienQuanLy,
      trangThaiHoSo: hosoStatus,
      daDoiChieuGiayTo: result.hoSo.DaDoiChieuGiayTo === true || result.hoSo.DaDoiChieuGiayTo === 1,
      ngayGuiDuyet: result.hoSo.NgayGuiDuyet,
      ngayDuyet: result.hoSo.NgayDuyet,
      ghiChuSale: result.hoSo.GhiChuSale,
      ghiChuQuanLy: result.hoSo.GhiChuQuanLy
    },
    thanhVien,
    summary: {
      tongThanhVien: thanhVien.length,
      soDuDieuKien,
      soBiTuChoi,
      coTheTiepTucLapHopDong: soDuDieuKien > 0
    }
  };
}

export async function kiemTraDieuKienLapHopDong(maPhieuDatCoc) {
  if (!maPhieuDatCoc) {
    throw createServiceError('Vui lòng cung cấp mã phiếu đặt cọc.', 400);
  }
  const result = await repository.kiemTraDieuKienLapHopDong(maPhieuDatCoc);
  try {
    await layHoSoCuTruDaDuyetTheoPhieuCoc(maPhieuDatCoc);
  } catch {
    return {
      hopLe: false,
      maLoi: 30,
      thongBao: 'Phiếu đặt cọc chưa có hồ sơ cư trú được quản lý duyệt. Vui lòng chờ duyệt cư trú trước khi lập hợp đồng.'
    };
  }
  return result; // returns { hopLe, maLoi, thongBao }
}

export async function layDanhSachDichVu() {
  const rawList = await repository.layDanhSachDichVu();
  return DichVuDTO.fromList(rawList);
}

export async function kiemTraThanhVienHopDongTam(maPhieuDatCoc, thanhVienList = []) {
  if (!maPhieuDatCoc) {
    throw createServiceError('Vui lòng cung cấp mã phiếu đặt cọc.', 400);
  }

  // Basic validation in Node.js
  for (const tv of thanhVienList) {
    const hoTen = String(tv.hoTen || tv.ten || '').trim();
    if (!hoTen) {
      throw createServiceError('Họ tên thành viên không được để trống.', 400);
    }
    if (tv.cccd && !/^[0-9a-zA-Z]{9,12}$/.test(String(tv.cccd).trim())) {
      throw createServiceError(`Số CCCD/Hộ chiếu "${tv.cccd}" của thành viên ${hoTen} không hợp lệ (phải từ 9-12 ký tự).`, 400);
    }
    if (tv.sdt && !/^[0-9+]{10,12}$/.test(String(tv.sdt).trim())) {
      throw createServiceError(`Số điện thoại "${tv.sdt}" của thành viên ${hoTen} không hợp lệ.`, 400);
    }
  }

  const result = await repository.kiemTraThanhVienHopDongTam(maPhieuDatCoc, thanhVienList);
  
  return {
    thanhVienValidation: ThanhVienHopDongDTO.fromList(result.thanhVienValidation),
    summary: result.summary
  };
}

export async function lapHopDongThue(data = {}, currentUser = {}) {
  const maPhieuDatCoc = String(data.maPhieuDatCoc || '').trim();

  if (!maPhieuDatCoc) {
    throw createServiceError('Thiếu mã phiếu đặt cọc.', 400);
  }

  const residenceReview = await layHoSoCuTruDaDuyetTheoPhieuCoc(maPhieuDatCoc);
  if (!residenceReview.summary.coTheTiepTucLapHopDong) {
    throw createServiceError('Hồ sơ cư trú đã duyệt nhưng không còn thành viên đủ điều kiện để lập hợp đồng.', 400);
  }
  const maNhanVienQuanLy = String(residenceReview.hoSo.maNhanVienQuanLy || currentUser.maNguoiDung || '').trim();
  if (!maNhanVienQuanLy) {
    throw createServiceError('Không xác định được quản lý đã duyệt cư trú cho hồ sơ này.', 400);
  }

  // 1. Check client confirmation
  if (!data.khachHangDaXacNhan || !data.nhanVienDaXacNhan) {
    throw createServiceError('Hợp đồng chưa được xác nhận ký bởi khách hàng hoặc nhân viên sale.', 400);
  }

  // 2. Date checks
  if (!data.ngayBatDau || !data.ngayKetThuc) {
    throw createServiceError('Vui lòng chọn ngày bắt đầu và kết thúc hợp đồng.', 400);
  }
  const ngayBatDau = new Date(data.ngayBatDau);
  const ngayKetThuc = new Date(data.ngayKetThuc);
  if (isNaN(ngayBatDau.getTime()) || isNaN(ngayKetThuc.getTime())) {
    throw createServiceError('Định dạng ngày bắt đầu hoặc ngày kết thúc không hợp lệ.', 400);
  }
  if (ngayKetThuc <= ngayBatDau) {
    throw createServiceError('Ngày kết thúc phải lớn hơn ngày bắt đầu hợp đồng.', 400);
  }

  // 3. Price check
  // Note: basePrice is verified inside Stored Procedure but we can also check if data.tienThue has some value
  // We can trust DB SP for database level checks, but checking here prevents useless db calls.

  // 4. Validate required services (Điện and Nước)
  const availableServices = await repository.layDanhSachDichVu();
  const requiredServiceIds = availableServices
    .filter(dv => dv.TenDichVu.includes('Điện') || dv.TenDichVu.includes('Nước') || dv.BatBuoc === 1)
    .map(dv => dv.MaDichVu);

  const selectedServiceIds = (data.danhSachDichVu || []).map(dv => dv.maDichVu || dv.id);

  const missingRequired = requiredServiceIds.filter(id => !selectedServiceIds.includes(id));
  if (missingRequired.length > 0) {
    throw createServiceError('Hợp đồng bắt buộc phải đăng ký đầy đủ dịch vụ Điện và Nước.', 400);
  }

  // 5. Call Repository to run SP_LapHopDongThue in database transaction
  const payload = {
    maPhieuDatCoc,
    maNhanVienQuanLy,
    ngayBatDau: data.ngayBatDau,
    ngayKetThuc: data.ngayKetThuc,
    kyThanhToan: data.kyThanhToan || 'Hàng tháng',
    khachHangDaXacNhan: data.khachHangDaXacNhan,
    nhanVienDaXacNhan: data.nhanVienDaXacNhan,
    danhSachThanhVien: data.danhSachThanhVien || [],
    danhSachDichVu: data.danhSachDichVu || []
  };

  const dbResult = await repository.lapHopDongThue(payload);

  if (dbResult.maLoi !== 0) {
    throw createServiceError(dbResult.thongBao || 'Lập hợp đồng thất bại.', 400);
  }

  // 6. Fetch full contract details after success
  return await layChiTietHopDongThue(dbResult.maHopDong);
}

export async function layChiTietHopDongThue(maHopDong) {
  if (!maHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng.', 400);
  }
  const dbDetailResult = await repository.layChiTietHopDongThue(maHopDong);
  if (!dbDetailResult.hopDong) {
    throw createServiceError('Không tìm thấy thông tin chi tiết hợp đồng.', 404);
  }
  return new HopDongThueDTO(dbDetailResult);
}

export async function layChiTietHopDongTheoPhieuCoc(maPhieuDatCoc) {
  if (!maPhieuDatCoc) {
    throw createServiceError('Vui lòng cung cấp mã phiếu đặt cọc.', 400);
  }
  const maHopDong = await repository.layMaHopDongTheoPhieuCoc(maPhieuDatCoc);
  if (!maHopDong) {
    throw createServiceError('Không tìm thấy hợp đồng nào liên kết với phiếu đặt cọc này.', 404);
  }
  return await layChiTietHopDongThue(maHopDong);
}

export async function layDanhSachQuanLy() {
  return await repository.layDanhSachQuanLy();
}
