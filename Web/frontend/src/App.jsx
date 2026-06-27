import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { getAuthenticatedHomePath } from './auth/auth.routes.js';
import MainLayout from './layouts/MainLayout.jsx';
import DangNhapPage from './pages/auth/DangNhapPage.jsx';
import DangKyPage from './pages/auth/DangKyPage.jsx';
import TrangChu from './pages/TrangChu.jsx';
import KhamPhaPhongPage from './pages/khamPhaPhong/KhamPhaPhongPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import DangKyThuePage from './pages/dangKyThue/DangKyThuePage.jsx';
import LichXemPhongPage from './pages/lichXemPhong/LichXemPhongPage.jsx';
import DatCocPage from './pages/datCoc/DatCocPage.jsx';
import NhanPhongPage from './pages/nhanPhong/NhanPhongPage.jsx';
import TraPhongPage from './pages/traPhong/TraPhongPage.jsx';
import SuaChuaBaoTriPage from './pages/suaChuaBaoTri/SuaChuaBaoTriPage.jsx';
import KhachHangPortalPage from './pages/khachHang/KhachHangPortalPage.jsx';
import NhanVienSalePage from './pages/nhanVienSale/NhanVienSalePage.jsx';
import NhanVienQuanLyPage from './pages/nhanVienQuanLy/NhanVienQuanLyPage.jsx';
import NhanVienKeToanPage from './pages/nhanVienKeToan/NhanVienKeToanPage.jsx';

function LoadingScreen() {
  return <div className="auth-loading">Đang kiểm tra phiên đăng nhập...</div>;
}

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/dang-nhap" state={{ from: location }} replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (user) return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  return children;
}

function CustomerOnlyRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (user.vaiTro !== 'KhachHang') return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  return children;
}

function EmployeePositionRoute({ position, children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (user.vaiTro !== 'NhanVien') return <Navigate to="/khach-hang" replace />;
  if (user.chucVu !== position) return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrangChu />} />
      <Route path="/kham-pha-phong" element={<KhamPhaPhongPage />} />
      <Route
        path="/dang-nhap"
        element={(
          <PublicOnlyRoute>
            <DangNhapPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/dang-ky"
        element={(
          <PublicOnlyRoute>
            <DangKyPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/khach-hang"
        element={(
          <ProtectedRoute>
            <CustomerOnlyRoute>
              <KhachHangPortalPage />
            </CustomerOnlyRoute>
          </ProtectedRoute>
        )}
      />
      <Route path="/khach-moi" element={<Navigate to="/khach-hang" replace />} />
      <Route
        path="/nhan-vien-sale"
        element={(
          <ProtectedRoute>
            <EmployeePositionRoute position="Sale">
              <NhanVienSalePage />
            </EmployeePositionRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/nhan-vien-quan-ly"
        element={(
          <ProtectedRoute>
            <EmployeePositionRoute position="Quản lý">
              <NhanVienQuanLyPage />
            </EmployeePositionRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/nhan-vien-ke-toan"
        element={(
          <ProtectedRoute>
            <EmployeePositionRoute position="Kế toán">
              <NhanVienKeToanPage />
            </EmployeePositionRoute>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<DashboardPage />} />
        <Route path="dang-ky-thue" element={<DangKyThuePage />} />
        <Route path="lich-xem-phong" element={<LichXemPhongPage />} />
        <Route path="dat-coc" element={<DatCocPage />} />
        <Route path="nhan-phong" element={<NhanPhongPage />} />
        <Route path="tra-phong" element={<TraPhongPage />} />
        <Route path="sua-chua-bao-tri" element={<SuaChuaBaoTriPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
