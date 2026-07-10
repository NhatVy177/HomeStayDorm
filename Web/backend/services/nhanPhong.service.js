import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';
import * as thuNhanPhongRepository from '../repositories/thuNhanPhong.repository.js';
import * as banGiaoRepository from '../repositories/banGiao.repository.js';
import * as cuTruRepository from '../repositories/cuTru.repository.js';
import {
  HopDongBanGiaoDTO,
  KetQuaLapBienBanBanGiaoDTO,
  TaiSanBanGiaoDTO
} from '../models/banGiao.dto.js';
import {
  ChiTietThuNhanPhongDTO,
  HopDongChoThuNhanPhongDTO,
  KetQuaDieuKienBanGiaoDTO,
  KetQuaThanhToanDTO,
  KhoanThuNhanPhongDTO
} from '../models/thuNhanPhong.dto.js';

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

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function isFutureStartDate(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return date > today;
}

function formatDateVi(value) {
  return new Date(value).toLocaleDateString('vi-VN');
}

function getFutureStartDateMessage(value) {
  return `Chưa tới ngày hẹn bàn giao. Ngày bắt đầu hợp đồng là ${formatDateVi(value)}.`;
}

function normalizeMember(item = {}) {
  const maTV = item.maThanhVien || item.MaThanhVien || item.maThanhVienCuTru || item.MaThanhVienCuTru || null;
  const status = item.trangThai || item.TrangThai || item.trangThaiDuyet || item.TrangThaiDuyet || 'Chờ duyệt';
  return {
    maThanhVien: maTV,
    maThanhVienCuTru: maTV,
    hoTen: String(item.hoTen || item.HoTen || '').trim(),
    ngaySinh: item.ngaySinh || item.NgaySinh || null,
    gioiTinh: item.gioiTinh || item.GioiTinh || null,
    cccd: String(item.cccd || item.CCCD || '').trim(),
    sdt: String(item.sdt || item.SDT || '').trim(),
    email: String(item.email || item.Email || '').trim(),
    quocTich: String(item.quocTich || item.QuocTich || 'Việt Nam').trim(),
    trangThai: status,
    trangThaiDuyet: status,
    lyDoTuChoi: item.lyDoTuChoi || item.LyDoTuChoi || null
  };
}

function requireValidMembers(members = []) {
  if (!Array.isArray(members) || members.length === 0) {
    throw createServiceError('Vui lòng nhập ít nhất một người cư trú.');
  }

  return members.map((member, index) => {
    const normalized = normalizeMember(member);
    if (!normalized.hoTen || !normalized.cccd || !normalized.gioiTinh) {
      throw createServiceError(`Thành viên dòng ${index + 1} thiếu họ tên, CCCD hoặc giới tính.`);
    }
    return normalized;
  });
}

export async function getDanhSachChoNhanPhong(maNhanVienSale) {
  try {
    const result = await executeProcedure('dbo.SP_DanhSachChoNhanPhong', [
      { name: 'MaNhanVienSale', type: sql.VarChar(6), value: String(maNhanVienSale || '').trim() || null }
    ]);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatThongTinCuTru(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  if (!khachHangId || !data.cccd) {
    throw createServiceError('Vui lòng nhập đầy đủ thông tin cư trú');
  }

  try {
    const result = await executeProcedure('dbo.SP_CapNhatThongTinCuTru', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'Cccd', type: sql.NVarChar(20), value: data.cccd },
      { name: 'QuocTich', type: sql.NVarChar(50), value: data.quocTich || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function traCuuPhieuCocCapNhatCuTru(filters = {}) {
  try {
    return await cuTruRepository.traCuuPhieuCocCapNhatCuTru(filters);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function luuHoSoCuTru(data = {}) {
  const maPhieuDatCoc = String(data.maPhieuDatCoc || '').trim();
  const maNhanVienSale = String(data.maNhanVienSale || '').trim();
  const danhSachThanhVien = requireValidMembers(data.danhSachThanhVien);

  if (!maPhieuDatCoc) {
    throw createServiceError('Vui lòng chọn phiếu đặt cọc cần cập nhật cư trú.');
  }
  if (!maNhanVienSale) {
    throw createServiceError('Không xác định được nhân viên sale đang thực hiện.');
  }
  if (!normalizeBoolean(data.daDoiChieuGiayTo)) {
    throw createServiceError('Cần xác nhận đã đối chiếu giấy tờ tùy thân trước khi gửi duyệt.');
  }

  try {
    return await cuTruRepository.luuHoSoCuTru({
      maPhieuDatCoc,
      maNhanVienSale,
      daDoiChieuGiayTo: true,
      ghiChu: data.ghiChu || null,
      danhSachThanhVien
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function guiDuyetHoSoCuTru(maHoSoCuTru) {
  const cleanId = String(maHoSoCuTru || '').trim();
  if (!cleanId) {
    throw createServiceError('Vui lòng cung cấp mã hồ sơ cư trú.');
  }

  try {
    return await cuTruRepository.guiDuyetHoSoCuTru(cleanId);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function layDanhSachHoSoCuTruChoDuyet(filters = {}) {
  try {
    return await cuTruRepository.layDanhSachHoSoCuTruChoDuyet(filters);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function layChiTietHoSoCuTru(maHoSoCuTru) {
  const cleanId = String(maHoSoCuTru || '').trim();
  if (!cleanId) {
    throw createServiceError('Vui lòng cung cấp mã hồ sơ cư trú.');
  }

  try {
    return await cuTruRepository.layChiTietHoSoCuTru(cleanId);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function duyetHoSoCuTru(data = {}) {
  const maHoSoCuTru = String(data.maHoSoCuTru || '').trim();
  const maNhanVienQuanLy = String(data.maNhanVienQuanLy || '').trim();
  const ketQua = String(data.ketQua || '').trim();
  const danhSachKetQuaThanhVien = Array.isArray(data.danhSachKetQuaThanhVien)
    ? data.danhSachKetQuaThanhVien.map(normalizeMember)
    : [];

  if (!maHoSoCuTru) {
    throw createServiceError('Vui lòng chọn hồ sơ cư trú cần duyệt.');
  }
  if (!maNhanVienQuanLy) {
    throw createServiceError('Không xác định được nhân viên quản lý đang thực hiện.');
  }
  if (!['Đã duyệt cư trú', 'Từ chối cư trú'].includes(ketQua)) {
    throw createServiceError('Kết quả duyệt hồ sơ cư trú không hợp lệ.');
  }
  if (ketQua === 'Từ chối cư trú' && !String(data.ghiChuQuanLy || '').trim()) {
    throw createServiceError('Vui lòng nhập ghi chú khi từ chối hồ sơ.');
  }

  try {
    return await cuTruRepository.duyetHoSoCuTru({
      maHoSoCuTru,
      maNhanVienQuanLy,
      ketQua,
      ghiChuQuanLy: data.ghiChuQuanLy || null,
      danhSachKetQuaThanhVien
    });
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function lapHopDongThue(data = {}) {
  const khachHangId = String(data.khachHangId || '').trim();
  const phongGiuongId = String(data.phongGiuongId || '').trim();
  if (!khachHangId || !phongGiuongId || !data.ngayBatDau || !data.ngayKetThucDuKien) {
    throw createServiceError('Vui long nhap du thong tin hop dong');
  }

  try {
    const result = await executeProcedure('dbo.SP_LapHopDongThue', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'PhongGiuongId', type: sql.NVarChar(20), value: phongGiuongId },
      { name: 'NgayBatDau', type: sql.Date, value: data.ngayBatDau },
      { name: 'NgayKetThucDuKien', type: sql.Date, value: data.ngayKetThucDuKien },
      { name: 'TienThue', type: sql.Decimal(18, 2), value: Number(data.tienThue || 0) },
      { name: 'TienCoc', type: sql.Decimal(18, 2), value: Number(data.tienCoc || 0) },
      { name: 'KyThanhToan', type: sql.NVarChar(20), value: data.kyThanhToan || 'Hàng tháng' },
      { name: 'DanhSachThanhVien', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.danhSachThanhVien) },
      { name: 'DanhSachDichVu', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.danhSachDichVu) }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function ghiNhanKhoanThuNhanPhong(data = {}) {
  return ghiNhanThuDauKy({
    maHopDong: data.maHopDong || data.hopDongId,
    soTienThucNop: data.soTienKhachThanhToan ?? data.soTienThucNop ?? data.soTien,
    phuongThucTT: data.phuongThucThanhToan || data.phuongThucTT,
    ghiChu: data.ghiChuThanhToan || data.ghiChu,
    maNhanVienKeToan: data.maNhanVienKeToan
  });
}

export async function getDanhSachHDChoThuDauKy(filters = {}) {
  try {
    const rows = await thuNhanPhongRepository.traCuuHopDongChoThuNhanPhong(filters);
    return HopDongChoThuNhanPhongDTO.fromList(rows);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function tinhKhoanThuNhanPhong(maHopDong) {
  if (!maHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng.', 400);
  }
  try {
    const result = await thuNhanPhongRepository.tinhKhoanThuNhanPhong(maHopDong);
    return new KhoanThuNhanPhongDTO(result);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function layChiTietThuNhanPhong(maHopDong) {
  if (!maHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng.', 400);
  }
  try {
    const result = await thuNhanPhongRepository.layChiTietThuNhanPhong(maHopDong);
    return new ChiTietThuNhanPhongDTO(result);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function kiemTraDieuKienBanGiaoSauThuTien(maHopDong) {
  if (!maHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng.', 400);
  }
  try {
    const result = await thuNhanPhongRepository.kiemTraDieuKienBanGiaoSauThuTien(maHopDong);
    return new KetQuaDieuKienBanGiaoDTO(result);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function ghiNhanThuDauKy(data = {}) {
  const maHopDong = String(data.maHopDong || '').trim();
  const soTienThucNop = Number(data.soTienThucNop);
  const phuongThucTT = String(data.phuongThucTT || '').trim();
  const maNhanVienKeToan = String(data.maNhanVienKeToan || '').trim();
  const ghiChu = data.ghiChu ? String(data.ghiChu).trim() : null;

  if (!maHopDong) {
    throw createServiceError('Vui lòng chọn hợp đồng cần ghi nhận khoản thu.');
  }
  if (data.soTienThucNop == null || data.soTienThucNop === '' || isNaN(soTienThucNop) || soTienThucNop < 0) {
    throw createServiceError('Số tiền khách thanh toán phải được nhập và không được âm.');
  }
  if (!['Tiền mặt', 'Chuyển khoản'].includes(phuongThucTT)) {
    throw createServiceError('Vui lòng chọn phương thức thanh toán hợp lệ: Tiền mặt hoặc Chuyển khoản.');
  }
  if (!maNhanVienKeToan) {
    throw createServiceError('Không xác định được nhân viên kế toán đang thực hiện.');
  }

  try {
    const result = await thuNhanPhongRepository.ghiNhanKhoanThuNhanPhong({
      maHopDong,
      maNhanVienKeToan,
      soTienKhachThanhToan: soTienThucNop,
      phuongThucThanhToan: phuongThucTT,
      ghiChuThanhToan: ghiChu
    });

    if (result.maLoi < 0) {
      throw createServiceError(result.thongBao, 400);
    }

    return new KetQuaThanhToanDTO(result);
  } catch (error) {
    handleDatabaseError(error);
  }
}

async function lapBienBanBanGiaoCu(data = {}) {
  const hopDongId = String(data.hopDongId || '').trim();
  const phongGiuongId = String(data.phongGiuongId || '').trim();
  if (!hopDongId || !phongGiuongId) {
    throw createServiceError('Vui lòng nhập đầy đủ mã hợp đồng và phòng/giường');
  }

  try {
    const result = await executeProcedure('dbo.SP_LapBienBanBanGiao', [
      { name: 'HopDongId', type: sql.VarChar(6), value: hopDongId },
      { name: 'PhongGiuongId', type: sql.VarChar(20), value: phongGiuongId },
      { name: 'DanhSachTaiSan', type: sql.NVarChar(sql.MAX), value: serializeJsonValue(data.danhSachTaiSan) },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null },
      { name: 'MaNhanVienQuanLy', type: sql.VarChar(6), value: data.maNhanVienQuanLy || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function lapBienBanBanGiao(data = {}) {
  const maHopDong = String(data.maHopDong || data.hopDongId || '').trim();
  const maNhanVienQuanLy = String(data.maNhanVienQuanLy || '').trim();
  const khachCoMat = normalizeBoolean(data.khachCoMat);
  const daKyBienBan = normalizeBoolean(data.daKyBienBan);
  const danhSachTaiSan = Array.isArray(data.danhSachTaiSan) ? data.danhSachTaiSan : [];

  if (!maHopDong) {
    throw createServiceError('Vui lòng nhập mã hợp đồng cần bàn giao.');
  }
  if (!maNhanVienQuanLy) {
    throw createServiceError('Không xác định được nhân viên quản lý đang thực hiện.');
  }
  if (!khachCoMat) {
    throw createServiceError('Khách hàng không có mặt tại thời điểm bàn giao. Không thể lập biên bản.');
  }
  if (!daKyBienBan) {
    throw createServiceError('Khách hàng chưa ký xác nhận biên bản. Không thể lập biên bản.');
  }
  if (danhSachTaiSan.length === 0) {
    throw createServiceError('Danh sách tài sản bàn giao đang trống.');
  }

  const normalizedItems = danhSachTaiSan.map((item, index) => {
    const soLuongThucTe = item.soLuongThucTe === '' || item.soLuongThucTe == null ? null : Number(item.soLuongThucTe);
    const soLuongHeThong = Number(item.soLuongHeThong);
    const ghiChu = String(item.ghiChu || '').trim();

    if (!item.maPhong || !item.maTaiSan) {
      throw createServiceError(`Dòng tài sản ${index + 1} thiếu mã phòng hoặc mã tài sản.`);
    }
    if (soLuongThucTe == null || !Number.isFinite(soLuongThucTe) || soLuongThucTe < 0) {
      throw createServiceError(`Vui lòng nhập số lượng thực tế hợp lệ cho tài sản ${item.tenTaiSan || item.maTaiSan}.`);
    }
    if (Number.isFinite(soLuongHeThong) && soLuongThucTe !== soLuongHeThong && !ghiChu) {
      throw createServiceError(`Tài sản ${item.tenTaiSan || item.maTaiSan} chênh lệch số lượng, vui lòng nhập ghi chú.`);
    }

    return {
      maPhong: String(item.maPhong).trim(),
      maTaiSan: String(item.maTaiSan).trim(),
      soLuongThucTe,
      ghiChu: ghiChu || null
    };
  });

  try {
    const hopDong = await banGiaoRepository.traCuuHopDongBanGiao(maHopDong);
    if (isFutureStartDate(hopDong?.NgayBatDau)) {
      throw createServiceError(getFutureStartDateMessage(hopDong.NgayBatDau), 400);
    }

    const result = await banGiaoRepository.lapBienBanBanGiaoVao({
      maHopDong,
      maNhanVienQuanLy,
      khachCoMat,
      daKyBienBan,
      ghiChuChung: data.ghiChuChung || data.ghiChu || null,
      danhSachTaiSan: normalizedItems
    });

    if (result.maLoi < 0) {
      throw createServiceError(result.thongBao || 'Không thể lập biên bản bàn giao.', 400);
    }

    const summary = result.maBienBan
      ? await banGiaoRepository.layKetQuaLapBienBanBanGiao(result.maBienBan)
      : null;
    return new KetQuaLapBienBanBanGiaoDTO(result, summary);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function traCuuHopDongBanGiao(maHopDong) {
  const cleanMaHopDong = String(maHopDong || '').trim();
  if (!cleanMaHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng cần bàn giao.', 400);
  }

  try {
    const [hopDong, dieuKien, taiSan] = await Promise.all([
      banGiaoRepository.traCuuHopDongBanGiao(cleanMaHopDong),
      banGiaoRepository.kiemTraDieuKienBanGiaoVao(cleanMaHopDong),
      banGiaoRepository.layDanhSachTaiSanBanGiao(cleanMaHopDong)
    ]);

    if (!hopDong) {
      throw createServiceError('Không tìm thấy hợp đồng cần bàn giao.', 404);
    }

    const dieuKienHienThi = isFutureStartDate(hopDong.NgayBatDau)
      ? {
          ...dieuKien,
          hopLe: false,
          maLoi: -16,
          thongBao: getFutureStartDateMessage(hopDong.NgayBatDau)
        }
      : dieuKien;

    return {
      hopDong: new HopDongBanGiaoDTO(hopDong),
      dieuKien: dieuKienHienThi,
      danhSachTaiSan: TaiSanBanGiaoDTO.fromList(taiSan)
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function kiemTraDieuKienBanGiaoVao(maHopDong) {
  const cleanMaHopDong = String(maHopDong || '').trim();
  if (!cleanMaHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng cần bàn giao.', 400);
  }

  try {
    return await banGiaoRepository.kiemTraDieuKienBanGiaoVao(cleanMaHopDong);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function layDanhSachTaiSanBanGiaoTheoHopDong(maHopDong) {
  const cleanMaHopDong = String(maHopDong || '').trim();
  if (!cleanMaHopDong) {
    throw createServiceError('Vui lòng cung cấp mã hợp đồng để lấy danh sách tài sản.', 400);
  }

  try {
    const rows = await banGiaoRepository.layDanhSachTaiSanBanGiao(cleanMaHopDong);
    return TaiSanBanGiaoDTO.fromList(rows);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function layKetQuaLapBienBanBanGiao(maBienBan) {
  const cleanMaBienBan = String(maBienBan || '').trim();
  if (!cleanMaBienBan) {
    throw createServiceError('Vui lòng cung cấp mã biên bản.', 400);
  }

  try {
    return await banGiaoRepository.layKetQuaLapBienBanBanGiao(cleanMaBienBan);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function layChiTietBienBanBanGiao(maBienBan) {
  const cleanMaBienBan = String(maBienBan || '').trim();
  if (!cleanMaBienBan) {
    throw createServiceError('Vui lòng cung cấp mã biên bản.', 400);
  }

  try {
    return await banGiaoRepository.layChiTietBienBanBanGiao(cleanMaBienBan);
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachChoBanGiaoVao() {
  try {
    const result = await executeProcedure('dbo.SP_DanhSachChoBanGiaoVao', []);
    return (result.recordset || []).filter((item) => (
      Boolean(item.tinhTrangGiuongHopLe) && !isFutureStartDate(item.ngayBatDau)
    ));
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachTaiSanBanGiao(maPhong) {
  const cleanMaPhong = String(maPhong || '').trim();
  if (!cleanMaPhong) {
    throw createServiceError('Vui lòng cung cấp mã phòng để lấy danh sách tài sản.');
  }

  try {
    const result = await executeProcedure('dbo.SP_DanhSachTaiSanBanGiao', [
      { name: 'MaPhong', type: sql.VarChar(4), value: cleanMaPhong }
    ]);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}
