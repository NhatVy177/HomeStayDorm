import { Router } from 'express';
import { getDanhSachHoanTat, getChiTietHoanTat, capNhatHoanTat } from '../controllers/capnhattraphong.controller.js';

const router = Router();

router.get('/danh-sach', getDanhSachHoanTat);
router.get('/chi-tiet/:maPhieuTra', getChiTietHoanTat);
router.post('/xac-nhan', capNhatHoanTat);

export default router;
