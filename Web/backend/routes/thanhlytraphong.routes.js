import express from 'express';
import thanhLyTraPhongController from '../controllers/thanhlytraphong.controller.js';
const router = express.Router();

router.get('/danh-sach', thanhLyTraPhongController.getDanhSachThanhLy);
router.get('/chi-tiet/:id', thanhLyTraPhongController.getChiTietThanhLy);
router.post('/xac-nhan', thanhLyTraPhongController.xacNhanThanhLy);

export default router;
