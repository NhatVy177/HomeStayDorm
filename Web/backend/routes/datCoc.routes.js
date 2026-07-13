import { Router } from 'express';
import * as controller from '../controllers/datCoc.controller.js';
import { uploadChungTu } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/', controller.createPhieuDatCoc);
router.get('/', controller.getPhieuDatCoc);
router.post('/gui-yeu-cau', controller.guiYeuCauDatCoc);
// DC01 (A4) - Sale chỉnh sửa thông tin cá nhân/liên hệ/giấy tờ khách hàng trước khi gửi yêu cầu.
router.put('/gui-yeu-cau/:maDangKy/thong-tin-ca-nhan', controller.capNhatThongTinCaNhan);
// DC01 - Sale chốt phòng khách muốn thuê (trong các phòng khách đã xem).
router.put('/gui-yeu-cau/:maDangKy/phong-chot', controller.chonPhongKhachChot);
router.get('/cho-xac-nhan', controller.getDanhSachChoXacNhan);
// DC02B - hồ sơ Quản lý đã duyệt, chờ Sale lập phiếu cọc.
router.get('/cho-lap-phieu', controller.getDanhSachChoLapPhieu);
// DC03 - phiếu Sale đã lập, chờ Kế toán tính tiền và chốt.
router.get('/cho-tinh-tien', controller.getDanhSachChoTinhTien);
router.get('/giuong-trong', controller.getGiuongTrong);
// DC01 - các phòng khách đã xem, để Sale chọn phòng chốt.
router.get('/phong-da-xem', controller.getPhongDaXem);
router.get('/cho-ghi-nhan-chung-tu', controller.getDanhSachChoGhiNhanChungTu);
router.get('/cho-xac-nhan-thanh-toan', controller.getDanhSachChoXacNhanThanhToan);
router.put('/:id/xac-nhan-kha-nang-nhan-coc', controller.xacNhanKhaNangNhanCoc);
// DC03 - kế toán chốt (hoặc hủy) phiếu cọc do Sale lập.
router.put('/:id/chot', controller.chotPhieuDatCoc);
router.put('/:id/phat-hanh-thanh-toan', controller.phatHanhYeuCauThanhToanCoc);
router.put('/:id/minh-chung-thanh-toan', uploadChungTu.single('file'), controller.capNhatMinhChungThanhToanCoc);
// DC04 - khách hàng tự ghi nhận chứng từ (cùng multer + SP, có check quyền sở hữu trong service).
router.put('/:id/minh-chung-khach', uploadChungTu.single('file'), controller.capNhatMinhChungCocKhach);
// DC04 - khách hàng chọn phương thức thanh toán (Tiền mặt / Chuyển khoản).
router.put('/:id/phuong-thuc-khach', controller.chonPhuongThucCocKhach);
// DC04 - nhân viên sale chọn phương thức thanh toán (Tiền mặt / Chuyển khoản).
router.put('/:id/phuong-thuc', controller.chonPhuongThucCoc);
router.put('/:id/xac-nhan-thanh-toan', controller.xacNhanThanhToanCoc);

export default router;
