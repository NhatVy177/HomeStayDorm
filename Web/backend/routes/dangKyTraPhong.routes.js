import { Router } from 'express';
import * as controller from '../controllers/dangKyTraPhong.controller.js';

const router = Router();

// GET  /api/dang-ky-tra-phong/sale/tim-khach     : Tìm kiếm khách hàng theo tên/SĐT/CCCD
// GET  /api/dang-ky-tra-phong/sale/hop-dong/:id  : Lấy HĐ + Phiếu cọc hợp lệ của 1 khách
// POST /api/dang-ky-tra-phong/sale/dang-ky       : Tạo phiếu trả phòng (trạng thái Chờ xử lý)
router.get('/sale/tim-khach',             controller.saleTimKhachHang);
router.get('/sale/hop-dong/:maKhachHang', controller.saleDanhSachHopDong);
router.post('/sale/dang-ky',              controller.saleDangKyLichTraPhong);

export default router;
