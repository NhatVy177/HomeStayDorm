import { Router } from 'express';
import * as controller from '../controllers/hopDong.controller.js';

const router = Router();

router.get('/phieu-coc', controller.traCuuPhieuCoc);
router.get('/phieu-coc/:id', controller.layChiTietPhieuCoc);
router.get('/phieu-coc/:id/kiem-tra', controller.kiemTraDieuKienLapHopDong);
router.get('/phieu-coc/:id/cu-tru-duyet', controller.layHoSoCuTruDaDuyetTheoPhieuCoc);
router.get('/dich-vu', controller.layDanhSachDichVu);
router.get('/quan-ly', controller.layDanhSachQuanLy);
router.post('/phieu-coc/:id/thanh-vien/kiem-tra', controller.kiemTraThanhVienHopDongTam);
router.post('/', controller.lapHopDongThue);
router.get('/phieu-coc/:id/hop-dong', controller.layChiTietHopDongTheoPhieuCoc);
router.get('/:id', controller.layChiTietHopDongThue);

export default router;
