import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import '../khachHang/khachHangPortal.css'; // Reuse main layout styles
import '../nhanVienKeToan/nhanVienKeToanPortal.css'; // Use specific styles for content
import './nhanVienQuanLy.css';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import XacNhanNhanPhongTab from './XacNhanNhanPhongTab.jsx';
import DuyetCuTruTab from './DuyetCuTruTab.jsx';
import XacNhanThanhToanTab from './XacNhanThanhToanTab.jsx';
import BanGiaoPhongTab from './BanGiaoPhongTab.jsx';
import XuLyTraPhongTab from './XuLyTraPhongTab.jsx';
import CapNhatDichVuTab from './CapNhatDichVuTab.jsx';
import BaoTriSuaChuaTab from './BaoTriSuaChuaTab.jsx';

function Brand() {
  return (
    <Link className="kp-brand" to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', textDecoration: 'none' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
      <span style={{ fontSize: '19px', fontFamily: '"Montserrat", "Inter", sans-serif', fontWeight: '700', letterSpacing: '0' }}>
        <span style={{ color: '#00666d' }}>Homestay</span><span style={{ color: '#a43c12' }}>Dorm</span>
      </span>
    </Link>
  );
}

function firstName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || 'bạn';
}

export default function NhanVienQuanLyPage() {
  const { user, dangXuat } = useAuth();
  const [activeTab, setActiveTab] = useState('xac-nhan-nhan-phong');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: 'xac-nhan-nhan-phong', label: 'Xác nhận khả năng nhận cọc', icon: 'assignment_turned_in' },
    { id: 'duyet-cu-tru', label: 'Duyệt cư trú', icon: 'fact_check' },
    { id: 'xac-nhan-thanh-toan', label: 'Duyệt thanh toán', icon: 'payments' },
    { id: 'lap-bien-ban-ban-giao', label: 'Bàn giao phòng', icon: 'description' },
    { id: 'lap-bien-ban-kiem-tra-phong', label: 'Xử lý trả phòng', icon: 'receipt_long' },
    { id: 'cap-nhat-dich-vu', label: 'Cập nhật dịch vụ', icon: 'bolt' },
    { id: 'bao-tri-sua-chua', label: 'Bảo trì', icon: 'info' }
  ];

  return (
    <div className="kp-page kh-page">
      <aside className="kp-sidebar" style={{ borderRight: '1px solid #bec8c9' }}>
        <div className="kp-sidebar-brand">
          <Brand />
        </div>
        <nav className="ktp-sidebar-nav" aria-label="Menu quản lý">
          {navItems.map((item) => (
            <button
              className={`ktp-side-item ${activeTab === item.id ? 'is-active' : ''}`}
              type="button"
              key={item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon name={item.icon} />
              <span className="ktp-side-item-text">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="kp-app">
        <header className="kp-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Chào {firstName(user?.hoTen)},</h1>
            <p>Đây là không gian làm việc của bạn hôm nay.</p>
          </div>
          
          <div className="kp-top-actions">
            <div ref={dropdownRef} className="kp-user-box" style={{ position: 'relative' }}>
              <button
                type="button"
                className="kp-user-box-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '10px', transition: 'background 0.18s' }}
                onClick={() => setShowDropdown((prev) => !prev)}
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                <span className="kp-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2f6765', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {firstName(user?.hoTen).charAt(0).toUpperCase()}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#191c1d' }}>{user?.hoTen || 'Nhân viên'}</strong>
                  <small style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#3f494a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    NHÂN VIÊN QUẢN LÝ
                  </small>
                </div>
                <svg style={{ marginLeft: '2px', opacity: 0.5, transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {showDropdown && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 59 }} onClick={() => setShowDropdown(false)} aria-hidden="true" />
                  <div className="kh-account-menu" style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, width: '220px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '8px', zIndex: 60, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'none', width: '100%', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#191c1d' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }}>
                      <Icon name="account_circle" style={{ fontSize: '18px' }} /> Thông tin tài khoản
                    </button>
                    <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: 'none', background: 'none', width: '100%', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#e53e3e' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'} onClick={(e) => { e.stopPropagation(); setShowDropdown(false); dangXuat(); }}>
                      <Icon name="logout" style={{ fontSize: '18px' }} /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="kp-main" style={{ padding: 0 }}>
          {activeTab === 'xac-nhan-nhan-phong' && <XacNhanNhanPhongTab />}
          {activeTab === 'duyet-cu-tru' && <DuyetCuTruTab />}
          {activeTab === 'xac-nhan-thanh-toan' && <XacNhanThanhToanTab />}
          {activeTab === 'lap-bien-ban-ban-giao' && <BanGiaoPhongTab />}
          {activeTab === 'lap-bien-ban-kiem-tra-phong' && <XuLyTraPhongTab />}
          {activeTab === 'cap-nhat-dich-vu' && <CapNhatDichVuTab />}
          {activeTab === 'bao-tri-sua-chua' && <BaoTriSuaChuaTab />}
          {activeTab !== 'xac-nhan-nhan-phong' && activeTab !== 'duyet-cu-tru' && activeTab !== 'xac-nhan-thanh-toan' && activeTab !== 'lap-bien-ban-ban-giao' && activeTab !== 'lap-bien-ban-kiem-tra-phong' && activeTab !== 'cap-nhat-dich-vu' && activeTab !== 'bao-tri-sua-chua' && (
            <div className="ktp-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <h2 style={{ color: '#6f797a' }}>Đang phát triển chức năng: {navItems.find(i => i.id === activeTab)?.label}</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
