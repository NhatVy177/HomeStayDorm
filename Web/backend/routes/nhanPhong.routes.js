import { Router } from 'express';
import * as controller from '../controllers/nhanPhong.controller.js';

const router = Router();

router.get('/danh-sach', controller.getDanhSachChoNhanPhong);
router.post('/thong-tin-cu-tru', controller.capNhatThongTinCuTru);
router.post('/hop-dong', controller.lapHopDongThue);
router.post('/thu-dau-ky', controller.ghiNhanKhoanThuNhanPhong);
router.post('/ban-giao', controller.lapBienBanBanGiao);
router.get('/cho-thu-dau-ky', controller.getDanhSachHDChoThuDauKy);
router.post('/ghi-nhan-thu-dau-ky', controller.ghiNhanThuDauKy);
router.get('/cho-ban-giao', controller.getDanhSachChoBanGiaoVao);
router.get('/tai-san-ban-giao/:maPhong', controller.getDanhSachTaiSanBanGiao);

export default router;
