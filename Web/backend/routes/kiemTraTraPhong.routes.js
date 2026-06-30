import { Router } from 'express';
import * as controller from '../controllers/kiemTraTraPhong.controller.js';

const router = Router();

// GET  /api/kiem-tra-tra-phong/quan-ly/cho-xu-ly     : Danh sách phiếu chờ xử lý
// GET  /api/kiem-tra-tra-phong/quan-ly/chi-tiet/:maPhieuTra : Lấy chi tiết phiếu
// POST /api/kiem-tra-tra-phong/quan-ly/xac-nhan-huy-coc   : Xác nhận hủy cọc (phiếu cọc)
// POST /api/kiem-tra-tra-phong/quan-ly/kiem-tra           : Lưu biên bản kiểm tra (hợp đồng)

router.get('/quan-ly/cho-xu-ly', controller.quanLyDanhSachChoXuLy);
router.get('/quan-ly/chi-tiet/:maPhieuTra', controller.quanLyChiTietPhieu);
router.post('/quan-ly/xac-nhan-huy-coc', controller.quanLyXacNhanHuyCoc);
router.post('/quan-ly/kiem-tra', controller.quanLyLapBienBanKiemTra);

export default router;
