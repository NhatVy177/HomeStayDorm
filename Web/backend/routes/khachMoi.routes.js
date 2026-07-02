import { Router } from 'express';
import * as controller from '../controllers/khachMoi.controller.js';
import { uploadChungTu } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/trang-thai', controller.getTrangThai);
router.get('/tong-quan', controller.getTongQuan);
router.get('/phong-kha-dung', controller.getPhongKhaDung);
router.get('/phong/:maPhong', controller.getChiTietPhongHandler);
router.post('/ho-so', controller.createHoSo);
router.get('/ho-so/:id', controller.getHoSoDetail);
router.put('/ho-so/:id', controller.updateHoSo);
router.get('/lich-xem/:id', controller.getLichXemDetail);
router.put('/lich-xem/:id/yeu-cau-dieu-chinh', controller.yeuCauDieuChinhLich);
router.get('/dat-coc', controller.getDatCoc);
router.post('/dat-coc/:id/minh-chung', controller.uploadMinhChung);
router.get('/hop-dong-dashboard', controller.getHopDongDashboard);
router.post('/hop-dong-dashboard/tra-phong', controller.guiYeuCauTraPhong);
router.delete('/hop-dong-dashboard/tra-phong/:id', controller.huyYeuCauTraPhong);
router.post('/hop-dong-dashboard/doi-soat/:id/phan-hoi', controller.phanHoiDoiSoatTraPhong);
router.post('/hop-dong-dashboard/doi-soat/:id/thanh-toan', uploadChungTu.single('file'), controller.ghiNhanThanhToanDoiSoatTraPhong);

export default router;
