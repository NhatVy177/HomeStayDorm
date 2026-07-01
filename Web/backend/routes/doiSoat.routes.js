import express from 'express';
import {
  getChiTietPhieuTraPhong,
  getDanhSachChoDoiSoat,
  getChiTietHoanCoc,
  getChiTietThuThem,
  getDanhSachChoHoanCoc,
  getDanhSachChoThuThem,
  uploadChungTuThanhToan,
  xacNhanHoanCoc,
  xacNhanThuThem,
  taoDoiSoat
} from '../controllers/doiSoat.controller.js';

const router = express.Router();

router.get('/cho-doi-soat', getDanhSachChoDoiSoat);
router.get('/cho-thu-them', getDanhSachChoThuThem);
router.get('/thu-them/:maDoiSoat', getChiTietThuThem);
router.post('/thu-them/xac-nhan', xacNhanThuThem);
router.get('/cho-hoan-coc', getDanhSachChoHoanCoc);
router.get('/hoan-coc/:maDoiSoat', getChiTietHoanCoc);
router.post('/hoan-coc/xac-nhan', xacNhanHoanCoc);
router.post('/chung-tu', uploadChungTuThanhToan);
router.get('/phieu-tra-phong/:maPhieuTra', getChiTietPhieuTraPhong);
router.post('/', taoDoiSoat);

export default router;
