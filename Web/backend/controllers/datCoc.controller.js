import * as service from '../services/datCoc.service.js';
import { publicUrlFor } from '../middleware/upload.middleware.js';

export async function createPhieuDatCoc(req, res, next) {
  // DC02B - Sale lập phiếu cọc. Mã nhân viên lấy từ phiên đăng nhập, không nhận từ body.
  try { res.status(201).json(await service.createPhieuDatCoc(req.user, req.body)); } catch (err) { next(err); }
}
export async function getDanhSachChoTinhTien(req, res, next) {
  // DC03 - phiếu Sale đã lập, chờ kế toán tính tiền và chốt.
  try { res.json(await service.getDanhSachChoTinhTien(req.user)); } catch (err) { next(err); }
}
export async function chotPhieuDatCoc(req, res, next) {
  // DC03 - kế toán chốt hoặc hủy phiếu cọc.
  try { res.json(await service.chotPhieuDatCoc(req.user, req.params.id, req.body)); } catch (err) { next(err); }
}
export async function getPhieuDatCoc(req, res, next) {
  try { res.json(await service.getPhieuDatCoc(req.user.maNguoiDung)); } catch (err) { next(err); }
}
export async function xacNhanKhaNangNhanCoc(req, res, next) {
  try { res.json(await service.xacNhanKhaNangNhanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function phatHanhYeuCauThanhToanCoc(req, res, next) {
  try { res.json(await service.phatHanhYeuCauThanhToanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function capNhatMinhChungThanhToanCoc(req, res, next) {
  try {
    // File chứng từ (ảnh/PDF) lưu ở backend/uploads/chung-tu; DB chỉ giữ ĐƯỜNG DẪN.
    const chungTuThanhToan = req.file ? publicUrlFor(req.file.filename) : (req.body.chungTuThanhToan || null);
    res.json(await service.capNhatMinhChungThanhToanCoc(req.params.id, { chungTuThanhToan }));
  } catch (err) { next(err); }
}
export async function capNhatMinhChungCocKhach(req, res, next) {
  try {
    // Khách up file chứng từ (ảnh/PDF) -> lưu ở backend/uploads/chung-tu; DB chỉ giữ ĐƯỜNG DẪN.
    const chungTuThanhToan = req.file ? publicUrlFor(req.file.filename) : (req.body.chungTuThanhToan || null);
    res.json(await service.capNhatMinhChungCocKhach(req.user, req.params.id, { chungTuThanhToan }));
  } catch (err) { next(err); }
}
export async function chonPhuongThucCocKhach(req, res, next) {
  // Khách chọn phương thức thanh toán cho phiếu cọc của mình (DC04). Kiểm tra sở hữu trong service.
  try { res.json(await service.chonPhuongThucCocKhach(req.user, req.params.id, req.body)); } catch (err) { next(err); }
}
export async function chonPhuongThucCoc(req, res, next) {
  // Nhân viên sale chọn phương thức thanh toán cho phiếu cọc (DC04). Kiểm tra vai trò Sale trong service.
  try { res.json(await service.chonPhuongThucCoc(req.user, req.params.id, req.body)); } catch (err) { next(err); }
}

export async function xacNhanThanhToanCoc(req, res, next) {
  try { res.json(await service.xacNhanThanhToanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function guiYeuCauDatCoc(req, res, next) {
  // maNhanVienSale lấy từ phiên đăng nhập (req.user), không nhận từ body để đúng phân quyền vai trò.
  try { res.status(200).json(await service.guiYeuCauDatCoc({ ...req.body, maNhanVienSale: req.user.maNguoiDung })); } catch (err) { next(err); }
}
export async function capNhatThongTinCaNhan(req, res, next) {
  // DC01 (A4) - Sale chỉnh sửa thông tin cá nhân/liên hệ/giấy tờ khách hàng trước khi gửi yêu cầu.
  try { res.json(await service.capNhatThongTinCaNhan(req.params.maDangKy, req.body)); } catch (err) { next(err); }
}
export async function getDanhSachChoXacNhan(req, res, next) {
  try { res.json(await service.getDanhSachChoXacNhan(req.user.maNguoiDung)); } catch (err) { next(err); }
}
export async function getDanhSachChoLapPhieu(req, res, next) {
  try { res.json(await service.getDanhSachChoLapPhieu(req.user.maNguoiDung)); } catch (err) { next(err); }
}
export async function getGiuongTrong(req, res, next) {
  try { res.json(await service.getGiuongTrong(req.query.maPhong)); } catch (err) { next(err); }
}
export async function getPhongDaXem(req, res, next) {
  // DC01 - các phòng khách đã xem; Sale chốt 1 phòng trong số này.
  try { res.json(await service.getPhongDaXem(req.query.maDangKy)); } catch (err) { next(err); }
}
export async function chonPhongKhachChot(req, res, next) {
  // DC01 - Sale chốt/đổi phòng khách muốn thuê.
  try {
    res.json(await service.chonPhongKhachChot(req.user, req.params.maDangKy, req.body?.maPhong));
  } catch (err) { next(err); }
}
export async function getDanhSachChoGhiNhanChungTu(req, res, next) {
  try { res.json(await service.getDanhSachChoGhiNhanChungTu(req.user.maNguoiDung)); } catch (err) { next(err); }
}
export async function getDanhSachChoXacNhanThanhToan(req, res, next) {
  try { res.json(await service.getDanhSachChoXacNhanThanhToan(req.user.maNguoiDung)); } catch (err) { next(err); }
}
