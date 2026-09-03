import React, { useEffect, useRef, useState } from 'react';
import PortalIcon from './PortalIcon.jsx';
import './employeeAccount.css';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'NV';
}

function displayRole(role) {
  return role === 'NhanVien' ? 'Nhân viên' : role || 'Chưa cập nhật';
}

export function EmployeeAccountMenu({ user, positionLabel, onShowAccount, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function showAccount() {
    setIsOpen(false);
    onShowAccount();
  }

  function logout() {
    setIsOpen(false);
    onLogout();
  }

  return (
    <div className="employee-account" ref={menuRef}>
      <button
        className="employee-account-trigger"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="employee-account-avatar">{initials(user?.hoTen)}</span>
        <span className="employee-account-text">
          <strong>{user?.hoTen || 'Nhân viên'}</strong>
          <small>{positionLabel}</small>
        </span>
        <span className={`employee-account-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">⌄</span>
      </button>

      {isOpen && (
        <div className="employee-account-menu" role="menu">
          <strong>{user?.hoTen || 'Nhân viên'}</strong>
          <span>{user?.email || user?.tenDangNhap || 'Chưa cập nhật'}</span>
          <button className="employee-account-info" type="button" role="menuitem" onClick={showAccount}>
            Thông tin tài khoản
          </button>
          <button className="employee-account-logout" type="button" role="menuitem" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export function EmployeeAccountView({ user, positionLabel }) {
  return (
    <section className="employee-account-view">
      <div className="employee-account-view-head">
        <span><PortalIcon name="profile" /></span>
        <div>
          <h2>Thông tin tài khoản</h2>
          <p>Thông tin nhân viên đang đăng nhập vào hệ thống HappyRoom.</p>
        </div>
      </div>
      <div className="employee-account-panels">
        <article>
          <h3>Thông tin đăng nhập</h3>
          <dl>
            <div><dt>Tên đăng nhập</dt><dd>{user?.tenDangNhap || 'Chưa cập nhật'}</dd></div>
            <div><dt>Vai trò</dt><dd>{displayRole(user?.vaiTro)}</dd></div>
            <div><dt>Chức vụ</dt><dd>{user?.chucVu || positionLabel}</dd></div>
            <div><dt>Chi nhánh</dt><dd>{user?.maChiNhanh || 'Chưa cập nhật'}</dd></div>
          </dl>
        </article>
        <article>
          <h3>Thông tin cá nhân</h3>
          <dl>
            <div><dt>Họ và tên</dt><dd>{user?.hoTen || 'Chưa cập nhật'}</dd></div>
            <div><dt>Email</dt><dd>{user?.email || 'Chưa cập nhật'}</dd></div>
            <div><dt>Số điện thoại</dt><dd>{user?.soDienThoai || 'Chưa cập nhật'}</dd></div>
            <div><dt>Trạng thái</dt><dd>{user?.trangThai || 'Chưa cập nhật'}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}
