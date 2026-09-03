import { Router } from 'express';
import * as controller from '../controllers/lichXemPhong.controller.js';

const router = Router();

router.post('/', controller.createLichXemPhong);
router.get('/', controller.getLichXemPhong);
router.get('/phong-phu-hop', controller.getPhongPhuHop);
router.put('/:id/yeu-cau-dieu-chinh', controller.yeuCauDieuChinhLich);
router.put('/:id/cap-nhat', controller.capNhatLichXemPhong);

export default router;
