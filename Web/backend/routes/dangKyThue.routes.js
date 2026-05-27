import { Router } from 'express';
import * as controller from '../controllers/dangKyThue.controller.js';

const router = Router();

router.post('/', controller.createHoSoDangKy);
router.get('/', controller.getHoSoDangKy);
router.get('/phong-giuong-kha-dung', controller.getPhongGiuongKhaDung);
router.get('/:id/kiem-tra-dieu-kien', controller.kiemTraDieuKienThue);
router.put('/:id/ket-qua-xu-ly', controller.capNhatKetQuaXuLy);

export default router;
