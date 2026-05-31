import * as service from '../services/traPhong.service.js';

// ─── Cũ (giữ nguyên) ─────────────────────────────────────────────────────────
export async function dangKyLichTraPhong(req, res, next) {
  try { res.status(201).json(await service.dangKyLichTraPhong(req.body)); } catch (err) { next(err); }
}
export async function lapBienBanKiemTraTraPhong(req, res, next) {
  try { res.status(201).json(await service.lapBienBanKiemTraTraPhong(req.body)); } catch (err) { next(err); }
}
export async function xuLyQuyetToanTraPhong(req, res, next) {
  try { res.status(201).json(await service.xuLyQuyetToanTraPhong(req.body)); } catch (err) { next(err); }
}
export async function ghiNhanThanhLyHopDong(req, res, next) {
  try { res.json(await service.ghiNhanThanhLyHopDong(req.body)); } catch (err) { next(err); }
}

// ─── Yêu cầu trả phòng (khách hàng) ─────────────────────────────────────────

/**
 * GET /api/tra-phong/yeu-cau/hop-dong
 * Lấy danh sách hợp đồng + phiếu cọc hợp lệ để chọn khi gửi yêu cầu.
 */
export async function layDanhSachHopDong(req, res, next) {
  try {
    const maKhachHang = req.user?.maNguoiDung;
    const data = await service.layDanhSachHopDong(maKhachHang);
    res.json({ danhSach: data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tra-phong/yeu-cau/lich-su
 * Lấy lịch sử phiếu trả phòng của khách hàng.
 */
export async function layLichSu(req, res, next) {
  try {
    const maKhachHang = req.user?.maNguoiDung;
    const data = await service.layLichSu(maKhachHang);
    res.json({ lichSu: data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tra-phong/yeu-cau
 * Gửi yêu cầu trả phòng mới.
 * Body: { maHopDong?, maPhieuDatCoc?, ngayDuKienTra }
 */
export async function taoYeuCau(req, res, next) {
  try {
    const maKhachHang = req.user?.maNguoiDung;
    const phieu = await service.taoYeuCau(maKhachHang, req.body);
    res.status(201).json({ phieu, message: 'Gửi yêu cầu trả phòng thành công.' });
  } catch (err) {
    next(err);
  }
}
