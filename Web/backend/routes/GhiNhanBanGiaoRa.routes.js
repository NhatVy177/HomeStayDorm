import { Router } from 'express';
import { getDanhSachBanGiaoRa, getChiTietBanGiaoRa, ghiNhanBanGiaoRa } from '../controllers/GhiNhanBanGiaoRa.controller.js';

const router = Router();

router.get('/danh-sach', getDanhSachBanGiaoRa);
router.get('/chi-tiet/:maPhieuTra', getChiTietBanGiaoRa);
router.post('/xac-nhan', ghiNhanBanGiaoRa);

export default router;
