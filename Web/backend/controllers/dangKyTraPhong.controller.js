import * as service from '../services/dangKyTraPhong.service.js';

/**
 * GET /api/dang-ky-tra-phong/sale/tim-khach?tuKhoa=xxx
 * Tìm khách hàng, kèm cờ coPhieuTraHienHanh để UI quyết định nút "Chọn"/"Xem phiếu".
 */
export async function saleTimKhachHang(req, res, next) {
  try {
    const tuKhoa    = req.query.tuKhoa || '';
    const maNhanVien = req.user?.maNguoiDung;
    const data = await service.saleTimKhachHang(tuKhoa, maNhanVien);
    res.json({ danhSach: data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dang-ky-tra-phong/sale/ho-so-hien-hanh/:maKhachHang
 * Lấy hồ sơ lưu trú hiện hành + thông tin phiếu trả phòng (nếu có).
 * Trả về null nếu không có hồ sơ hợp lệ.
 */
export async function saleLayHoSoHienHanh(req, res, next) {
  try {
    const { maKhachHang } = req.params;
    const maNhanVien = req.user?.maNguoiDung;
    const hoSo = await service.saleLayHoSoHienHanh(maKhachHang, maNhanVien);
    res.json({ hoSo });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/dang-ky-tra-phong/sale/dang-ky
 * Tạo phiếu đăng ký lịch trả phòng (trạng thái "Chờ xử lý").
 * Body: { maKhachHang, maHopDong?, maPhieuDatCoc?, ngayDuKienTra }
 */
export async function saleDangKyLichTraPhong(req, res, next) {
  try {
    const maNhanVien = req.user?.maNguoiDung;
    const phieu = await service.saleDangKyLichTraPhong(req.body, maNhanVien);
    res.status(201).json({ phieu, message: 'Đăng ký lịch trả phòng thành công.' });
  } catch (err) {
    next(err);
  }
}
