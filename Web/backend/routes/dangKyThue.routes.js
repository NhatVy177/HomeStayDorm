import { Router } from 'express';
import * as controller from '../controllers/dangKyThue.controller.js';

const router = Router();

router.post('/', controller.createHoSoDangKy);
router.post('/khach-vang-lai', controller.taoHoSoKhachVangLai);
router.get('/', controller.getHoSoDangKy);
router.get('/kiem-tra-khach-hang', controller.kiemTraKhachHangTonTai);
router.get('/phong-giuong-kha-dung', controller.getPhongGiuongKhaDung);
router.get('/tra-cuu-phong', controller.traCuuPhong);
router.get('/:id/kiem-tra-dieu-kien', controller.kiemTraDieuKienThue);
router.put('/:id/ket-qua-xu-ly', controller.capNhatKetQuaXuLy);
router.put('/:id/tiep-nhan', controller.tiepNhanHoSoDangKy);
router.put('/:id/huy-tiep-nhan', controller.huyTiepNhanHoSoDangKy);

export default router;
