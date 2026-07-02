import express from 'express';
import xacNhanPhanHoiController from '../controllers/xacNhanPhanHoi.controller.js';

const router = express.Router();

router.get('/cho-xu-ly', xacNhanPhanHoiController.getDanhSachChoXuLyPhanHoi);
router.get('/chi-tiet/:id', xacNhanPhanHoiController.getChiTietPhanHoi);
router.post('/xu-ly', xacNhanPhanHoiController.xuLyPhanHoi);

export default router;
