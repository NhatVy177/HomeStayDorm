import { Router } from 'express';
import * as controller from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Phân quyền: Nên có middleware kiểm tra vai trò Admin ở đây, 
// nhưng tạm thời dùng chung requireAuth.
router.use(requireAuth);

// Danh mục
router.get('/branches', controller.getDanhSachChiNhanh);
router.post('/branches', controller.taoChiNhanh);
router.put('/branches/:id', controller.capNhatChiNhanh);
router.get('/room-types', controller.getDanhSachLoaiPhong);
router.get('/rooms', controller.getDanhSachPhong);
router.post('/rooms', controller.taoPhongGiuong);
router.patch('/rooms/:id/status', controller.capNhatTrangThaiPhong);

// Giai đoạn 1: Nhân viên
router.get('/employees', controller.getDanhSachNhanVien);
router.get('/employees/next-id', controller.getMaNhanVienTiepTheo);
router.get('/employees/:id', controller.getChiTietNhanVien);
router.post('/employees', controller.taoTaiKhoanNhanVien);
router.patch('/employees/:id/lock', controller.khoaMoTaiKhoan);
router.patch('/employees/:id/role', controller.ganChucVuNhanVien);
router.put('/employees/:id', controller.capNhatThongTinNhanVien);

// Dịch vụ
router.get('/services', (req, res, next) => { req.body.thaoTac = 'DANH_SACH'; controller.quanLyDichVu(req, res, next) });
router.post('/services', (req, res, next) => { req.body.thaoTac = 'TAO'; controller.quanLyDichVu(req, res, next) });
router.put('/services/:id', (req, res, next) => { req.body.thaoTac = 'CAP_NHAT'; req.body.maDichVu = req.params.id; controller.quanLyDichVu(req, res, next) });
router.delete('/services/:id', (req, res, next) => { req.body.thaoTac = 'XOA'; req.body.maDichVu = req.params.id; controller.quanLyDichVu(req, res, next) });

// Nội quy
router.get('/rules', (req, res, next) => { req.body.thaoTac = 'DANH_SACH'; controller.quanLyNoiQuy(req, res, next) });
router.post('/rules', (req, res, next) => { req.body.thaoTac = 'TAO'; controller.quanLyNoiQuy(req, res, next) });
router.put('/rules/:id', (req, res, next) => { req.body.thaoTac = 'CAP_NHAT'; req.body.maQuyDinh = req.params.id; controller.quanLyNoiQuy(req, res, next) });
router.delete('/rules/:id', (req, res, next) => { req.body.thaoTac = 'XOA'; req.body.maQuyDinh = req.params.id; controller.quanLyNoiQuy(req, res, next) });

// Điều khoản vi phạm
router.get('/violations', (req, res, next) => { req.body.thaoTac = 'DANH_SACH'; controller.quanLyDieuKhoanViPham(req, res, next) });
router.post('/violations', (req, res, next) => { req.body.thaoTac = 'TAO'; controller.quanLyDieuKhoanViPham(req, res, next) });
router.put('/violations/:id', (req, res, next) => { req.body.thaoTac = 'CAP_NHAT'; req.body.maDieuKhoan = req.params.id; controller.quanLyDieuKhoanViPham(req, res, next) });
router.delete('/violations/:id', (req, res, next) => { req.body.thaoTac = 'XOA'; req.body.maDieuKhoan = req.params.id; controller.quanLyDieuKhoanViPham(req, res, next) });

// Cấu hình hệ thống
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);

// Sao lưu dữ liệu
router.get('/backups', controller.getDanhSachSaoLuu);
router.post('/backups/manual', controller.saoLuuThuCong);

// Nhật ký hệ thống
router.get('/logs', controller.getNhatKyHeThong);

// Giường trong phòng
router.get('/rooms/:id/beds', (req, res, next) => { req.body.thaoTac = 'DANH_SACH'; req.body.maPhong = req.params.id; controller.quanLyGiuong(req, res, next) });
router.post('/rooms/:id/beds', (req, res, next) => { req.body.thaoTac = 'TAO'; req.body.maPhong = req.params.id; controller.quanLyGiuong(req, res, next) });
router.put('/rooms/:id/beds/:bedId', (req, res, next) => { req.body.thaoTac = 'CAP_NHAT'; req.body.maPhong = req.params.id; req.body.maGiuong = req.params.bedId; controller.quanLyGiuong(req, res, next) });
router.delete('/rooms/:id/beds/:bedId', (req, res, next) => { req.body.thaoTac = 'XOA'; req.body.maPhong = req.params.id; req.body.maGiuong = req.params.bedId; controller.quanLyGiuong(req, res, next) });

// Tài sản phòng
router.get('/rooms/:id/assets', (req, res, next) => { req.body.thaoTac = 'DANH_SACH'; req.body.maPhong = req.params.id; controller.quanLyTaiSanPhong(req, res, next) });
router.post('/rooms/:id/assets', (req, res, next) => { req.body.thaoTac = 'TAO'; req.body.maPhong = req.params.id; controller.quanLyTaiSanPhong(req, res, next) });
router.put('/rooms/:id/assets/:assetId', (req, res, next) => { req.body.thaoTac = 'CAP_NHAT'; req.body.maPhong = req.params.id; req.body.maTaiSan = req.params.assetId; controller.quanLyTaiSanPhong(req, res, next) });
router.delete('/rooms/:id/assets/:assetId', (req, res, next) => { req.body.thaoTac = 'XOA'; req.body.maPhong = req.params.id; req.body.maTaiSan = req.params.assetId; controller.quanLyTaiSanPhong(req, res, next) });

export default router;
