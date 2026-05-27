import { Router } from 'express';
import * as controller from '../controllers/khachMoi.controller.js';

const router = Router();

router.get('/trang-thai', controller.getTrangThai);
router.get('/tong-quan', controller.getTongQuan);
router.get('/phong-kha-dung', controller.getPhongKhaDung);
router.post('/ho-so', controller.createHoSo);
router.put('/lich-xem/:id/yeu-cau-dieu-chinh', controller.yeuCauDieuChinhLich);

export default router;
