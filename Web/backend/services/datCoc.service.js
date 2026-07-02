import { executeProcedure, getPool, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    // DC04 - cập nhật minh chứng
    50220: 404, 50221: 409, 50222: 409, 50223: 400,
    // DC05 - xác nhận thanh toán
    50230: 404, 50231: 409, 50232: 409, 50233: 400, 50234: 409
  });
}

export async function getDanhSachChoGhiNhanChungTu() {
  const result = await executeProcedure('dbo.SP_DanhSachChoGhiNhanChungTu');
  return result.recordset;
}

export async function getDanhSachChoXacNhanThanhToan() {
  const result = await executeProcedure('dbo.SP_DanhSachChoXacNhanThanhToan');
  return result.recordset;
}

export async function getDanhSachChoLapPhieu() {
  const result = await executeProcedure('dbo.SP_DanhSachChoLapPhieuDatCoc');
  return result.recordset;
}

export async function createPhieuDatCoc(data = {}) {
  const maDangKy = String(data.maDangKy || '').trim();
  const maNhanVienKeToan = String(data.maNhanVienKeToan || '').trim();
  if (!maDangKy || !maNhanVienKeToan) {
    throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã nhân viên kế toán');
  }
  // Kế toán KHÔNG chọn phương thức ở DC03 (khách chọn sau ở DC04) -> cho phép để trống.
  const phuongThuc = String(data.phuongThucThanhToan || '').trim();
  if (phuongThuc && !['Tiền mặt', 'Chuyển khoản'].includes(phuongThuc)) {
    throw createServiceError('Phương thức thanh toán không hợp lệ');
  }
  // Tiền cọc = giá thuê × 2 do SP/trigger tự tính; @SoTienCoc chỉ là placeholder (truyền 0).
  // danhSachGiuong: mảng mã giường ['G01','G02'] (ghép) hoặc rỗng/null (nguyên phòng).
  const danhSachGiuong = Array.isArray(data.danhSachGiuong)
    ? data.danhSachGiuong.filter(Boolean).join(',')
    : String(data.danhSachGiuong || '').trim();

  try {
    const result = await executeProcedure('dbo.SP_LapPhieuDatCoc', [
      { name: 'MaDangKy',            type: sql.VarChar(6),        value: maDangKy },
      { name: 'MaNhanVienKeToan',    type: sql.VarChar(6),        value: maNhanVienKeToan },
      { name: 'SoTienCoc',           type: sql.Decimal(15, 2),    value: 0 },
      { name: 'PhuongThucThanhToan', type: sql.NVarChar(20),      value: phuongThuc || null },
      { name: 'DanhSachGiuong',      type: sql.NVarChar(sql.MAX), value: danhSachGiuong || null },
      { name: 'ThoiHanThanhToan',    type: sql.DateTime,          value: data.thoiHanThanhToan ? new Date(data.thoiHanThanhToan) : null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, {
      50210: 404, 50211: 409, 50212: 409, 50213: 404, 50214: 422, 50215: 409,
      50216: 422, 50217: 422, 50218: 409, 50219: 422
    });
  }
}

export async function getGiuongTrong(maPhong) {
  const result = await executeProcedure('dbo.SP_DanhSachGiuongTrong', [
    { name: 'MaPhong', type: sql.VarChar(4), value: String(maPhong || '').trim() }
  ]);
  return result.recordset;
}

export async function getPhieuDatCoc(maNhanVienSale) {
  const result = await executeProcedure('dbo.SP_DanhSachDatCocSale', [
    { name: 'MaNhanVienSale', type: sql.VarChar(6), value: String(maNhanVienSale || '').trim() }
  ]);
  return result.recordset;
}

export async function guiYeuCauDatCoc(data = {}) {
  const maDangKy = String(data.maDangKy || '').trim();
  const maNhanVienSale = String(data.maNhanVienSale || '').trim();
  if (!maDangKy || !maNhanVienSale) {
    throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã nhân viên');
  }

  try {
    const result = await executeProcedure('dbo.SP_GuiYeuCauDatCoc', [
      { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
      { name: 'MaNhanVienSale', type: sql.VarChar(6), value: maNhanVienSale }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, { 50201: 404, 50202: 409, 50203: 404 });
  }
}

export async function getDanhSachChoXacNhan() {
  const result = await executeProcedure('dbo.SP_DanhSachChoXacNhanCoc');
  return result.recordset;
}

export async function xacNhanKhaNangNhanCoc(id, data = {}) {
  const maDangKy = String(id || '').trim();
  const maQuanLy = String(data.maQuanLy || '').trim();
  if (!maDangKy || !maQuanLy) {
    throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã quản lý');
  }

  try {
    const result = await executeProcedure('dbo.SP_XacNhanKhaNangNhanCoc', [
      { name: 'MaDangKy',    type: sql.VarChar(6),          value: maDangKy },
      { name: 'MaQuanLy',    type: sql.VarChar(6),          value: maQuanLy },
      { name: 'DuocNhanCoc', type: sql.Bit,                 value: data.duocNhanCoc ? 1 : 0 },
      { name: 'LyDo',        type: sql.NVarChar(sql.MAX),   value: data.lyDo || null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, { 50204: 404, 50205: 409, 50206: 404, 50207: 400, 50208: 422, 50209: 422 });
  }
}

export async function phatHanhYeuCauThanhToanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_PhatHanhYeuCauThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'SoTienCoc', type: sql.Decimal(18, 2), value: data.soTienCoc == null ? null : Number(data.soTienCoc) },
      { name: 'KeToanPhatHanhId', type: sql.NVarChar(20), value: data.keToanPhatHanhId || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatMinhChungThanhToanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_CapNhatMinhChungThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'ChungTuThanhToan', type: sql.NVarChar(500), value: data.chungTuThanhToan || null },
      { name: 'GhiChu', type: sql.NVarChar(200), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

// DC04 - Khách hàng tự ghi nhận chứng từ thanh toán cọc.
// Khác đường Sale ở chỗ kiểm tra quyền sở hữu (khách chỉ up phiếu của chính mình),
// rồi tái dùng đúng SP_CapNhatMinhChungThanhToanCoc (đã có check hạn 24h + trạng thái).
export async function capNhatMinhChungCocKhach(user, id, data = {}) {
  if (!user || user.vaiTro !== 'KhachHang') {
    throw createServiceError('Chức năng này chỉ dành cho khách hàng', 403);
  }
  const maPhieuCoc = String(id || '').trim();
  if (!maPhieuCoc) throw createServiceError('Thiếu mã phiếu đặt cọc');
  if (!data.chungTuThanhToan) throw createServiceError('Thiếu file chứng từ thanh toán');

  // Kiểm tra phiếu thuộc về chính khách đang đăng nhập (KhachHang.MaKhachHang = NguoiDung.MaNguoiDung).
  const pool = await getPool();
  const owned = await pool.request()
    .input('MaPhieuCoc', sql.VarChar(6), maPhieuCoc)
    .input('MaKhachHang', sql.VarChar(6), user.maNguoiDung)
    .query(`
      SELECT 1 FROM dbo.PhieuDatCoc
      WHERE MaPhieuDatCoc = @MaPhieuCoc AND MaKhachHang = @MaKhachHang;
    `);
  if (!owned.recordset[0]) throw createServiceError('Không tìm thấy phiếu đặt cọc của bạn', 404);

  return capNhatMinhChungThanhToanCoc(maPhieuCoc, data);
}

// DC04 - Khách hàng chọn phương thức thanh toán cho phiếu cọc của chính mình.
// Kế toán không chọn ở DC03 nên phương thức có thể còn NULL; khách chọn ở đây.
export async function chonPhuongThucCocKhach(user, id, data = {}) {
  if (!user || user.vaiTro !== 'KhachHang') {
    throw createServiceError('Chức năng này chỉ dành cho khách hàng', 403);
  }
  const maPhieuCoc = String(id || '').trim();
  const phuongThuc = String(data.phuongThucThanhToan || '').trim();
  if (!maPhieuCoc) throw createServiceError('Thiếu mã phiếu đặt cọc');
  if (!['Tiền mặt', 'Chuyển khoản'].includes(phuongThuc)) {
    throw createServiceError('Phương thức thanh toán không hợp lệ');
  }

  // Kiểm tra phiếu thuộc về chính khách đang đăng nhập.
  const pool = await getPool();
  const owned = await pool.request()
    .input('MaPhieuCoc', sql.VarChar(6), maPhieuCoc)
    .input('MaKhachHang', sql.VarChar(6), user.maNguoiDung)
    .query(`
      SELECT 1 FROM dbo.PhieuDatCoc
      WHERE MaPhieuDatCoc = @MaPhieuCoc AND MaKhachHang = @MaKhachHang;
    `);
  if (!owned.recordset[0]) throw createServiceError('Không tìm thấy phiếu đặt cọc của bạn', 404);

  try {
    const result = await executeProcedure('dbo.SP_ChonPhuongThucThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: maPhieuCoc },
      { name: 'PhuongThucThanhToan', type: sql.NVarChar(20), value: phuongThuc }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, { 50240: 404, 50241: 400, 50242: 409, 50243: 409 });
  }
}

export async function xacNhanThanhToanCoc(id, data = {}) {
  try {
    const result = await executeProcedure('dbo.SP_XacNhanThanhToanCoc', [
      { name: 'PhieuId', type: sql.NVarChar(30), value: String(id || '').trim() },
      { name: 'HopLe', type: sql.Bit, value: Boolean(data.hopLe) },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null },
      { name: 'QuanLyXacNhanThanhToanId', type: sql.NVarChar(20), value: data.quanLyXacNhanThanhToanId || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}
