import { Router } from 'express';
import * as controller from '../controllers/datCoc.controller.js';
import { uploadChungTu } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/', controller.createPhieuDatCoc);
router.get('/', controller.getPhieuDatCoc);
router.post('/gui-yeu-cau', controller.guiYeuCauDatCoc);
router.get('/cho-xac-nhan', controller.getDanhSachChoXacNhan);
router.get('/cho-lap-phieu', controller.getDanhSachChoLapPhieu);
router.get('/giuong-trong', controller.getGiuongTrong);
router.get('/cho-ghi-nhan-chung-tu', controller.getDanhSachChoGhiNhanChungTu);
router.get('/cho-xac-nhan-thanh-toan', controller.getDanhSachChoXacNhanThanhToan);
router.put('/:id/xac-nhan-kha-nang-nhan-coc', controller.xacNhanKhaNangNhanCoc);
router.put('/:id/phat-hanh-thanh-toan', controller.phatHanhYeuCauThanhToanCoc);
router.put('/:id/minh-chung-thanh-toan', uploadChungTu.single('file'), controller.capNhatMinhChungThanhToanCoc);
// DC04 - khách hàng tự ghi nhận chứng từ (cùng multer + SP, có check quyền sở hữu trong service).
router.put('/:id/minh-chung-khach', uploadChungTu.single('file'), controller.capNhatMinhChungCocKhach);
router.put('/:id/xac-nhan-thanh-toan', controller.xacNhanThanhToanCoc);

export default router;
