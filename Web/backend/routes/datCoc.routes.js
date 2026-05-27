import { Router } from 'express';
import * as controller from '../controllers/datCoc.controller.js';

const router = Router();

router.post('/', controller.createPhieuDatCoc);
router.get('/', controller.getPhieuDatCoc);
router.put('/:id/xac-nhan-kha-nang-nhan-coc', controller.xacNhanKhaNangNhanCoc);
router.put('/:id/phat-hanh-thanh-toan', controller.phatHanhYeuCauThanhToanCoc);
router.put('/:id/minh-chung-thanh-toan', controller.capNhatMinhChungThanhToanCoc);
router.put('/:id/xac-nhan-thanh-toan', controller.xacNhanThanhToanCoc);

export default router;
