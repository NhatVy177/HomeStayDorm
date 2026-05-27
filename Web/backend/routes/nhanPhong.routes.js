import { Router } from 'express';
import * as controller from '../controllers/nhanPhong.controller.js';

const router = Router();

router.post('/thong-tin-cu-tru', controller.capNhatThongTinCuTru);
router.post('/hop-dong', controller.lapHopDongThue);
router.post('/thu-dau-ky', controller.ghiNhanKhoanThuNhanPhong);
router.post('/ban-giao', controller.lapBienBanBanGiao);

export default router;
