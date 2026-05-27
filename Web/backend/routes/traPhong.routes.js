import { Router } from 'express';
import * as controller from '../controllers/traPhong.controller.js';

const router = Router();

router.post('/lich-tra-phong', controller.dangKyLichTraPhong);
router.post('/bien-ban-kiem-tra', controller.lapBienBanKiemTraTraPhong);
router.post('/quyet-toan', controller.xuLyQuyetToanTraPhong);
router.put('/thanh-ly-hop-dong', controller.ghiNhanThanhLyHopDong);

export default router;
