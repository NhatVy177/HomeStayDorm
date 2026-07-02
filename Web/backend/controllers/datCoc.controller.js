import * as service from '../services/datCoc.service.js';
import { publicUrlFor } from '../middleware/upload.middleware.js';

export async function createPhieuDatCoc(req, res, next) {
  try { res.status(201).json(await service.createPhieuDatCoc(req.body)); } catch (err) { next(err); }
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
    res.json(await service.capNhatMinhChungThanhToanCoc(req.params.id, {
      chungTuThanhToan,
      ghiChu: req.body.ghiChu || null
    }));
  } catch (err) { next(err); }
}
export async function capNhatMinhChungCocKhach(req, res, next) {
  try {
    // Khách up file chứng từ (ảnh/PDF) -> lưu ở backend/uploads/chung-tu; DB chỉ giữ ĐƯỜNG DẪN.
    const chungTuThanhToan = req.file ? publicUrlFor(req.file.filename) : (req.body.chungTuThanhToan || null);
    res.json(await service.capNhatMinhChungCocKhach(req.user, req.params.id, {
      chungTuThanhToan,
      ghiChu: req.body.ghiChu || null
    }));
  } catch (err) { next(err); }
}
export async function chonPhuongThucCocKhach(req, res, next) {
  // Khách chọn phương thức thanh toán cho phiếu cọc của mình (DC04). Kiểm tra sở hữu trong service.
  try { res.json(await service.chonPhuongThucCocKhach(req.user, req.params.id, req.body)); } catch (err) { next(err); }
}
export async function xacNhanThanhToanCoc(req, res, next) {
  try { res.json(await service.xacNhanThanhToanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function guiYeuCauDatCoc(req, res, next) {
  // maNhanVienSale lấy từ phiên đăng nhập (req.user), không nhận từ body để đúng phân quyền vai trò.
  try { res.status(200).json(await service.guiYeuCauDatCoc({ ...req.body, maNhanVienSale: req.user.maNguoiDung })); } catch (err) { next(err); }
}
export async function getDanhSachChoXacNhan(req, res, next) {
  try { res.json(await service.getDanhSachChoXacNhan()); } catch (err) { next(err); }
}
export async function getDanhSachChoLapPhieu(req, res, next) {
  try { res.json(await service.getDanhSachChoLapPhieu()); } catch (err) { next(err); }
}
export async function getGiuongTrong(req, res, next) {
  try { res.json(await service.getGiuongTrong(req.query.maPhong)); } catch (err) { next(err); }
}
export async function getDanhSachChoGhiNhanChungTu(req, res, next) {
  try { res.json(await service.getDanhSachChoGhiNhanChungTu()); } catch (err) { next(err); }
}
export async function getDanhSachChoXacNhanThanhToan(req, res, next) {
  try { res.json(await service.getDanhSachChoXacNhanThanhToan()); } catch (err) { next(err); }
}
