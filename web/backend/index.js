import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './database/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { auditMutations } from './middleware/audit.middleware.js';

import authRoutes from './routes/auth.routes.js';
import dangKyThueRoutes from './routes/dangKyThue.routes.js';
import lichXemPhongRoutes from './routes/lichXemPhong.routes.js';
import datCocRoutes from './routes/datCoc.routes.js';
import nhanPhongRoutes from './routes/nhanPhong.routes.js';
import dangKyTraPhongRoutes from './routes/dangKyTraPhong.routes.js';
import kiemTraTraPhongRoutes from './routes/kiemTraTraPhong.routes.js';
import xacNhanKetQuaRoutes from './routes/xacNhanKetQua.routes.js';
import xacNhanPhanHoiRoutes from './routes/xacNhanPhanHoi.routes.js';
import thanhLyTraPhongRoutes from './routes/thanhlytraphong.routes.js';
import banGiaoRaRoutes from './routes/GhiNhanBanGiaoRa.routes.js';
import suaChuaBaoTriRoutes from './routes/suaChuaBaoTri.routes.js';
import khachMoiRoutes from './routes/khachMoi.routes.js';
import trangChuRoutes from './routes/trangChu.routes.js';
import adminRoutes from './routes/admin.routes.js';
import doiSoatRoutes from './routes/doiSoat.routes.js';
import { startHoaDonQuaHanScheduler } from './services/hoaDonQuaHan.service.js';
import { startDatCocHetHanScheduler } from './services/datCocHetHan.service.js';
import { startLichXemPhongDenGioScheduler } from './services/lichXemPhongDenGio.service.js';
import hopDongRoutes from './routes/hopDong.routes.js';

// Load bien moi truong trong file .env
dotenv.config();

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const clientOrigins = String(process.env.CLIENT_URL || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const localDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin(origin, callback) {
    const isLocalDevelopmentRequest = process.env.NODE_ENV !== 'production'
      && localDevelopmentOrigin.test(origin || '');

    if (!origin || clientOrigins.includes('*') || clientOrigins.includes(origin) || isLocalDevelopmentRequest) {
      return callback(null, true);
    }

    return callback(null, false);
  }
}));
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.join(backendDir, 'uploads')));
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'HappyRoom backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trang-chu', trangChuRoutes); // Public — no auth

// Moi luong nghiep vu co route rieng, de nhom tach code de hon
app.use('/api/dang-ky-thue', requireAuth, auditMutations({ chucNang: 'Đăng ký thuê', doiTuong: 'PhieuDangKy' }), dangKyThueRoutes);
app.use('/api/lich-xem-phong', requireAuth, auditMutations({ chucNang: 'Lịch xem phòng', doiTuong: 'LichXemPhong' }), lichXemPhongRoutes);
app.use('/api/dat-coc', requireAuth, auditMutations({ chucNang: 'Đặt cọc và thanh toán cọc', doiTuong: 'PhieuDatCoc' }), datCocRoutes);
app.use('/api/nhan-phong', requireAuth, auditMutations({ chucNang: 'Nhận phòng và bàn giao', doiTuong: 'NhanPhong' }), nhanPhongRoutes);
app.use('/api/dang-ky-tra-phong', requireAuth, auditMutations({ chucNang: 'Đăng ký trả phòng', doiTuong: 'PhieuTraPhong' }), dangKyTraPhongRoutes);
app.use('/api/kiem-tra-tra-phong', requireAuth, auditMutations({ chucNang: 'Kiểm tra trả phòng', doiTuong: 'BienBanKiemTra' }), kiemTraTraPhongRoutes);
app.use('/api/xac-nhan-ket-qua', requireAuth, auditMutations({ chucNang: 'Xác nhận kết quả trả phòng', doiTuong: 'KetQuaDoiSoat' }), xacNhanKetQuaRoutes);
app.use('/api/xac-nhan-phan-hoi', requireAuth, auditMutations({ chucNang: 'Xác nhận phản hồi trả phòng', doiTuong: 'PhanHoiDoiSoat' }), xacNhanPhanHoiRoutes);
app.use('/api/thanh-ly-tra-phong', requireAuth, auditMutations({ chucNang: 'Thanh lý hợp đồng', doiTuong: 'HopDongThue' }), thanhLyTraPhongRoutes);
app.use('/api/ban-giao-ra', requireAuth, auditMutations({ chucNang: 'Bàn giao trả phòng', doiTuong: 'BienBanBanGiao' }), banGiaoRaRoutes);
app.use('/api/sua-chua-bao-tri', requireAuth, auditMutations({ chucNang: 'Sửa chữa bảo trì', doiTuong: 'YeuCauSuaChua' }), suaChuaBaoTriRoutes);
app.use('/api/khach-moi', requireAuth, auditMutations({ chucNang: 'Portal khách hàng', doiTuong: 'KhachHang' }), khachMoiRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/accountant/doi-soat', requireAuth, auditMutations({ chucNang: 'Đối soát và thanh toán', doiTuong: 'DoiSoat' }), doiSoatRoutes);
app.use('/api/hop-dong', requireAuth, auditMutations({ chucNang: 'Hợp đồng thuê', doiTuong: 'HopDongThue' }), hopDongRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await getPool();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Connected to SQL Server database: ${process.env.DB_NAME || 'not configured'}`);
    startHoaDonQuaHanScheduler();
    startDatCocHetHanScheduler();
    startLichXemPhongDenGioScheduler();
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} dang duoc su dung. Backend da chay o mot terminal khac.`);
      process.exit(1);
    }

    throw error;
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
