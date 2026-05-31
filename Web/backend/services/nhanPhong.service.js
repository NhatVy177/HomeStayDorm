import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

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
  const hopDongId = String(data.hopDongId || '').trim();
  if (!hopDongId || data.soTien == null) {
    throw createServiceError('Vui long nhap hop dong va so tien thu');
  }

  try {
    const result = await executeProcedure('dbo.SP_GhiNhanKhoanThuNhanPhong', [
      { name: 'HopDongId', type: sql.NVarChar(30), value: hopDongId },
      { name: 'SoTien', type: sql.Decimal(18, 2), value: Number(data.soTien || 0) },
      { name: 'NoiDung', type: sql.NVarChar(200), value: data.noiDung || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachHDChoThuDauKy() {
  try {
    const result = await executeProcedure('dbo.SP_DanhSachHDChoThuDauKy', []);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function ghiNhanThuDauKy(data = {}) {
  const maHopDong = String(data.maHopDong || '').trim();
  if (!maHopDong || data.soTienThucNop == null || !data.phuongThucTT) {
    throw createServiceError('Vui lòng nhập đầy đủ: mã hợp đồng, số tiền thực nộp và phương thức thanh toán.');
  }

  try {
    const result = await executeProcedure('dbo.SP_GhiNhanThuDauKy', [
      { name: 'MaHopDong',        type: sql.VarChar(6),       value: maHopDong },
      { name: 'SoTienThucNop',   type: sql.Decimal(18, 2),   value: Number(data.soTienThucNop) },
      { name: 'PhuongThucTT',    type: sql.NVarChar(20),     value: data.phuongThucTT },
      { name: 'MaNhanVienKeToan',type: sql.VarChar(6),       value: data.maNhanVienKeToan || null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function lapBienBanBanGiao(data = {}) {
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

export async function getDanhSachChoBanGiaoVao() {
  try {
    const result = await executeProcedure('dbo.SP_DanhSachChoBanGiaoVao', []);
    return result.recordset;
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
