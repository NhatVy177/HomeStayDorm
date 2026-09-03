import express from 'express';
import xacNhanKetQuaController from '../controllers/xacNhanKetQua.controller.js';
const router = express.Router();

router.get('/cho-xac-nhan', xacNhanKetQuaController.getDanhSachChoXacNhan);
router.get('/chi-tiet/:id', xacNhanKetQuaController.getChiTietDoiSoat);
router.post('/xac-nhan', xacNhanKetQuaController.xacNhanDoiSoat);

export default router;
