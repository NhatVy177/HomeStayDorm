import { executeProcedure, getPool, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    // DC04 - cập nhật minh chứng
    50220: 404, 50221: 409, 50222: 409, 50223: 400,
    // DC05 - xác nhận thanh toán
    50230: 404, 50231: 409, 50232: 409, 50233: 400, 50234: 409,
    // DC01 (A4) - cập nhật thông tin cá nhân khách hàng
    50260: 404, 50261: 409, 50262: 400,
    // Phiếu kế toán chưa chốt -> chưa được thanh toán
    50275: 409
  });
}

export async function getDanhSachChoGhiNhanChungTu(maNhanVien) {
  const result = await executeProcedure('dbo.SP_DanhSachChoGhiNhanChungTu', [
    { name: 'MaNhanVien', type: sql.VarChar(6), value: String(maNhanVien || '').trim() }
  ]);
  return result.recordset;
}

export async function getDanhSachChoXacNhanThanhToan(maNhanVien) {
  const result = await executeProcedure('dbo.SP_DanhSachChoXacNhanThanhToan', [
    { name: 'MaNhanVien', type: sql.VarChar(6), value: String(maNhanVien || '').trim() }
  ]);
  return result.recordset;
}

export async function getDanhSachChoLapPhieu(maNhanVien) {
  const result = await executeProcedure('dbo.SP_DanhSachChoLapPhieuDatCoc', [
    { name: 'MaNhanVien', type: sql.VarChar(6), value: String(maNhanVien || '').trim() }
  ]);
  return result.recordset;
}

// DC01 - Các phòng khách ĐÃ XEM của hồ sơ; Sale chốt 1 phòng trong số này.
export async function getPhongDaXem(maDangKy) {
  const ma = String(maDangKy || '').trim();
  if (!ma) throw createServiceError('Thiếu mã phiếu đăng ký');
  try {
    const result = await executeProcedure('dbo.SP_DanhSachPhongDaXem', [
      { name: 'MaDangKy', type: sql.VarChar(6), value: ma }
    ]);
    return result.recordset;
  } catch (error) {
    mapDatabaseError(error, { 50250: 422 });
  }
}

// DC01 - Sale chốt (hoặc đổi) phòng khách muốn thuê. Phòng này sẽ được Quản lý duyệt ở DC02
// và Kế toán lập phiếu ở DC03 -> chỉ Sale mới được quyết.
export async function chonPhongKhachChot(user, maDangKy, maPhong) {
  if (!user || user.vaiTro !== 'NhanVien' || user.chucVu !== 'Sale') {
    throw createServiceError('Chỉ nhân viên Sale được chốt phòng cho khách', 403);
  }
  const ma = String(maDangKy || '').trim();
  const phong = String(maPhong || '').trim();
  if (!ma || !phong) throw createServiceError('Thiếu mã phiếu đăng ký hoặc mã phòng');

  try {
    const result = await executeProcedure('dbo.SP_ChonPhongKhachChot', [
      { name: 'MaDangKy', type: sql.VarChar(6), value: ma },
      { name: 'MaPhong',  type: sql.VarChar(4), value: phong }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, {
      50201: 404,   // không tìm thấy hồ sơ
      50202: 409,   // hồ sơ đã gửi yêu cầu -> không đổi phòng
      50256: 422,   // phòng không nằm trong danh sách đã xem
      50257: 409    // khách chưa xem phòng này
    });
  }
}

// DC02B - SALE lập phiếu đặt cọc (không phải kế toán).
// Hình thức thuê và giường là thứ phải trao đổi với khách, mà người gặp khách là Sale.
//
// PHÒNG KHÔNG TRUYỀN TỪ ĐÂY: SP tự lấy phòng khách đã chốt ở DC01 (ChiTietXemPhong.KhachChon),
// nên không thể lập phiếu cho phòng khác với phòng Quản lý đã duyệt ở DC02.
// SP cũng KHÔNG trả về số tiền -> Sale không thấy tiền. Tiền do kế toán chốt ở DC03.
export async function createPhieuDatCoc(user, data = {}) {
  if (!user || user.vaiTro !== 'NhanVien' || user.chucVu !== 'Sale') {
    throw createServiceError('Chỉ nhân viên Sale được lập phiếu đặt cọc', 403);
  }

  const maDangKy = String(data.maDangKy || '').trim();
  if (!maDangKy) throw createServiceError('Thiếu mã phiếu đăng ký');

  const hinhThucThue = String(data.hinhThucThue || '').trim();
  if (!['Nguyên phòng', 'Ghép giường'].includes(hinhThucThue)) {
    throw createServiceError('Hình thức thuê không hợp lệ (chỉ "Nguyên phòng" hoặc "Ghép giường")');
  }

  const laGhep = hinhThucThue === 'Ghép giường';
  const giuongs = Array.isArray(data.giuongs)
    ? data.giuongs.filter(Boolean).map((g) => String(g).trim()).join(',')
    : String(data.giuongs || '').trim();

  if (laGhep && !giuongs) throw createServiceError('Chưa chọn giường nào để ghép');

  try {
    const result = await executeProcedure('dbo.SP_LapPhieuDatCoc', [
      { name: 'MaDangKy',        type: sql.VarChar(6),        value: maDangKy },
      { name: 'MaNhanVienSale',  type: sql.VarChar(6),        value: user.maNguoiDung },
      { name: 'HinhThucThue',    type: sql.NVarChar(20),      value: hinhThucThue },
      { name: 'DanhSachGiuong',  type: sql.NVarChar(sql.MAX), value: laGhep ? giuongs : null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, {
      50210: 404,   // không tìm thấy hồ sơ
      50211: 409,   // hồ sơ chưa được quản lý duyệt
      50212: 409,   // hồ sơ đã có phiếu cọc còn hiệu lực
      50213: 404,   // không tìm thấy nhân viên sale
      50214: 422,   // hồ sơ chưa chốt phòng
      50215: 409,   // giường/phòng không còn trống
      50216: 422,   // nhóm khác giới không được ghép giường
      50217: 422,   // số giường ≠ số người
      50218: 409,   // phòng đã khóa sang giới khác
      50219: 422,   // vượt sức chứa
      50251: 400,   // hình thức thuê không hợp lệ
      50252: 400    // danh sách giường không hợp lệ
    });
  }
}

// DC03 - Danh sách phiếu Sale đã lập, chờ KẾ TOÁN tính tiền và chốt.
export async function getDanhSachChoTinhTien(user) {
  if (!user || user.vaiTro !== 'NhanVien' || user.chucVu !== 'Kế toán') {
    throw createServiceError('Chức năng này chỉ dành cho nhân viên kế toán', 403);
  }
  const result = await executeProcedure('dbo.SP_DanhSachChoTinhTienCoc', [
    { name: 'MaNhanVien', type: sql.VarChar(6), value: user.maNguoiDung }
  ]);
  return result.recordset;
}

// DC03 - Kế toán CHỐT (hoặc HỦY) phiếu cọc do Sale lập.
// Chốt xong mới gán MaNhanVienKeToan -> phiếu tới tay khách và đồng hồ 24h bắt đầu chạy.
export async function chotPhieuDatCoc(user, id, data = {}) {
  if (!user || user.vaiTro !== 'NhanVien' || user.chucVu !== 'Kế toán') {
    throw createServiceError('Chỉ nhân viên kế toán được chốt phiếu đặt cọc', 403);
  }
  const maPhieuCoc = String(id || '').trim();
  if (!maPhieuCoc) throw createServiceError('Thiếu mã phiếu đặt cọc');

  const chot = Boolean(data.chot);
  const lyDo = String(data.lyDo || '').trim();
  if (!chot && !lyDo) throw createServiceError('Vui lòng nhập lý do hủy phiếu');

  try {
    const result = await executeProcedure('dbo.SP_ChotPhieuDatCoc', [
      { name: 'MaPhieuDatCoc',    type: sql.VarChar(6),        value: maPhieuCoc },
      { name: 'MaNhanVienKeToan', type: sql.VarChar(6),        value: user.maNguoiDung },
      { name: 'Chot',             type: sql.Bit,               value: chot ? 1 : 0 },
      { name: 'LyDo',             type: sql.NVarChar(sql.MAX), value: lyDo || null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    mapDatabaseError(error, {
      50213: 404,   // không tìm thấy kế toán
      50270: 404,   // không tìm thấy phiếu
      50271: 409,   // phiếu đã được chốt
      50272: 409,   // phiếu không còn hiệu lực
      50273: 409,   // phiếu quá hạn chốt
      50274: 400    // thiếu lý do hủy
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
    mapDatabaseError(error, {
      50201: 404,
      50202: 409,
      50203: 404,
      50258: 409   // chưa chốt phòng khách muốn thuê
    });
  }
}

export async function capNhatThongTinCaNhan(maDangKy, data = {}) {
  const ma = String(maDangKy || '').trim();
  if (!ma) {
    throw createServiceError('Thiếu mã phiếu đăng ký');
  }
  if (data.gioiTinh && !['Nam', 'Nữ'].includes(data.gioiTinh)) {
    throw createServiceError('Giới tính không hợp lệ');
  }

  try {
    const result = await executeProcedure('dbo.SP_CapNhatThongTinCaNhanKhachHang', [
      { name: 'MaDangKy', type: sql.VarChar(6), value: ma },
      { name: 'HoTen', type: sql.NVarChar(100), value: data.hoTen || null },
      { name: 'NgaySinh', type: sql.Date, value: data.ngaySinh || null },
      { name: 'GioiTinh', type: sql.NVarChar(5), value: data.gioiTinh || null },
      { name: 'SDT', type: sql.VarChar(20), value: data.soDienThoai || null },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'CCCD', type: sql.VarChar(20), value: data.cccd || null }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachChoXacNhan(maNhanVien) {
  const result = await executeProcedure('dbo.SP_DanhSachChoXacNhanCoc', [
    { name: 'MaNhanVien', type: sql.VarChar(6), value: String(maNhanVien || '').trim() }
  ]);
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
      { name: 'ChungTuThanhToan', type: sql.NVarChar(500), value: data.chungTuThanhToan || null }
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

// DC04 - Nhân viên sale chọn phương thức thanh toán cho phiếu (không giới hạn sở hữu như khách).
// Tái dùng SP_ChonPhuongThucThanhToanCoc (đã trung lập vai trò, tự kiểm tra trạng thái/hạn).
export async function chonPhuongThucCoc(user, id, data = {}) {
  if (!user || user.vaiTro !== 'NhanVien' || user.chucVu !== 'Sale') {
    throw createServiceError('Chức năng này chỉ dành cho nhân viên sale', 403);
  }
  const maPhieuCoc = String(id || '').trim();
  const phuongThuc = String(data.phuongThucThanhToan || '').trim();
  if (!maPhieuCoc) throw createServiceError('Thiếu mã phiếu đặt cọc');
  if (!['Tiền mặt', 'Chuyển khoản'].includes(phuongThuc)) {
    throw createServiceError('Phương thức thanh toán không hợp lệ');
  }

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
