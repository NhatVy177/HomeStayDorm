import React from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getAuthenticatedHomePath } from '../auth/auth.routes.js';

export default function MainLayout() {
  const { user, dangXuat } = useAuth();
  const homePath = getAuthenticatedHomePath(user);

  if (homePath !== '/dashboard') {
    return <Navigate to={homePath} replace />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/">HappyRoom</NavLink>
        <nav>
          <NavLink to="/dashboard" end>Dashboard</NavLink>
          <NavLink to="/dashboard/dang-ky-thue">Đăng ký thuê</NavLink>
          <NavLink to="/dashboard/lich-xem-phong">Lịch xem phòng</NavLink>
          <NavLink to="/dashboard/dat-coc">Đặt cọc</NavLink>
          <NavLink to="/dashboard/nhan-phong">Nhận phòng</NavLink>
          <NavLink to="/dashboard/tra-phong">Trả phòng</NavLink>
        </nav>
        <div className="account-menu">
          <strong>{user.hoTen}</strong>
          <span>@{user.tenDangNhap}</span>
          <button className="secondary-button" type="button" onClick={dangXuat}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
