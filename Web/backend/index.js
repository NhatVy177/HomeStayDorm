import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from './database/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requireAuth } from './middleware/auth.middleware.js';

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
import capNhatTraPhongRoutes from './routes/capnhattraphong.routes.js';
import suaChuaBaoTriRoutes from './routes/suaChuaBaoTri.routes.js';
import khachMoiRoutes from './routes/khachMoi.routes.js';
import trangChuRoutes from './routes/trangChu.routes.js';
import adminRoutes from './routes/admin.routes.js';
import doiSoatRoutes from './routes/doiSoat.routes.js';
import { startHoaDonQuaHanScheduler } from './services/hoaDonQuaHan.service.js';
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
app.use('/api/dang-ky-thue', requireAuth, dangKyThueRoutes);
app.use('/api/lich-xem-phong', requireAuth, lichXemPhongRoutes);
app.use('/api/dat-coc', requireAuth, datCocRoutes);
app.use('/api/nhan-phong', requireAuth, nhanPhongRoutes);
app.use('/api/dang-ky-tra-phong', requireAuth, dangKyTraPhongRoutes);
app.use('/api/kiem-tra-tra-phong', requireAuth, kiemTraTraPhongRoutes);
app.use('/api/xac-nhan-ket-qua', requireAuth, xacNhanKetQuaRoutes);
app.use('/api/xac-nhan-phan-hoi', requireAuth, xacNhanPhanHoiRoutes);
app.use('/api/thanh-ly-tra-phong', requireAuth, thanhLyTraPhongRoutes);
app.use('/api/cap-nhat-tra-phong', requireAuth, capNhatTraPhongRoutes);
app.use('/api/sua-chua-bao-tri', requireAuth, suaChuaBaoTriRoutes);
app.use('/api/khach-moi', requireAuth, khachMoiRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/accountant/doi-soat', requireAuth, doiSoatRoutes);
app.use('/api/hop-dong', requireAuth, hopDongRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await getPool();

  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Connected to SQL Server database: ${process.env.DB_NAME || 'not configured'}`);
    startHoaDonQuaHanScheduler();
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
