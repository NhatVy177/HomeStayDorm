import * as service from '../services/dangKyTraPhong.service.js';

/**
 * GET /api/dang-ky-tra-phong/sale/tim-khach?tuKhoa=xxx
 * Nhân viên Sale tìm kiếm khách hàng theo tên / SĐT / CCCD.
 */
export async function saleTimKhachHang(req, res, next) {
  try {
    const tuKhoa = req.query.tuKhoa || '';
    const data = await service.saleTimKhachHang(tuKhoa);
    res.json({ danhSach: data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dang-ky-tra-phong/sale/hop-dong/:maKhachHang
 * Lấy danh sách HĐ + Phiếu cọc hợp lệ để nhân viên Sale chọn.
 */
export async function saleDanhSachHopDong(req, res, next) {
  try {
    const { maKhachHang } = req.params;
    const maNhanVien = req.user?.maNguoiDung;
    const data = await service.saleDanhSachHopDong(maKhachHang, maNhanVien);
    res.json({ danhSach: data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/dang-ky-tra-phong/sale/dang-ky
 * Nhân viên Sale tạo phiếu đăng ký lịch trả phòng.
 * Body: { maKhachHang, maHopDong?, maPhieuDatCoc?, ngayDuKienTra }
 */
export async function saleDangKyLichTraPhong(req, res, next) {
  try {
    const phieu = await service.saleDangKyLichTraPhong(req.body);
    res.status(201).json({ phieu, message: 'Đăng ký lịch trả phòng thành công.' });
  } catch (err) {
    next(err);
  }
}

