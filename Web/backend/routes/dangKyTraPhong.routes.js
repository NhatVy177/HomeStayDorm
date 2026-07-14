import { Router } from 'express';
import * as controller from '../controllers/dangKyTraPhong.controller.js';

const router = Router();

// GET  /api/dang-ky-tra-phong/sale/tim-khach                       : Tìm khách hàng (kèm cờ coPhieuTraHienHanh)
// GET  /api/dang-ky-tra-phong/sale/ho-so-hien-hanh/:maKhachHang    : Lấy hồ sơ hiện hành + phiếu trả nếu có
// POST /api/dang-ky-tra-phong/sale/dang-ky                         : Tạo phiếu trả phòng (trạng thái Chờ xử lý)
router.get('/sale/tim-khach',                          controller.saleTimKhachHang);
router.get('/sale/ho-so-hien-hanh/:maKhachHang',      controller.saleLayHoSoHienHanh);
router.post('/sale/dang-ky',                           controller.saleDangKyLichTraPhong);

export default router;
