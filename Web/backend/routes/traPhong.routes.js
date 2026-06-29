// ─── Backend routes: nhân viên Sale – Đăng ký lịch trả phòng ──────────────────
// Thêm vào file traPhong.routes.js (hoặc tạo file mới nếu muốn tách biệt)

import { Router } from 'express';
import * as controller from '../controllers/traPhong.controller.js';

const router = Router();

// ─── Routes cũ ───────────────────────────────────────────────────────────────
router.post('/lich-tra-phong', controller.dangKyLichTraPhong);
router.post('/bien-ban-kiem-tra', controller.lapBienBanKiemTraTraPhong);
router.post('/quyet-toan', controller.xuLyQuyetToanTraPhong);
router.put('/thanh-ly-hop-dong', controller.ghiNhanThanhLyHopDong);

// ─── Yêu cầu trả phòng (khách hàng) ─────────────────────────────────────────
router.get('/yeu-cau/hop-dong', controller.layDanhSachHopDong);
router.get('/yeu-cau/lich-su',  controller.layLichSu);
router.post('/yeu-cau',         controller.taoYeuCau);

export default router;
