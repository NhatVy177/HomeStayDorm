import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import '../khachHang/khachHangPortal.css';
import '../nhanVienKeToan/nhanVienKeToanPortal.css'; // Use ke toan specific styles for content

import HoSoDangKyTab from './HoSoDangKyTab.jsx';
import LichXemPhongTab from './LichXemPhongTab.jsx';
import DatCocTab from './DatCocTab.jsx';
import LapHopDongTab from './LapHopDongTab.jsx';
import KhachHangTab from './KhachHangTab.jsx';
import TraCuuPhongTab from './TraCuuPhongTab.jsx';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

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

export default function NhanVienSalePage() {
  const { user, dangXuat } = useAuth();
  const [activeTab, setActiveTab] = useState('ho-so');
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
    { id: 'ho-so', label: 'Hồ sơ đăng ký', icon: 'description' },
    { id: 'tra-cuu', label: 'Kiểm tra phòng/giường', icon: 'meeting_room' },
    { id: 'lich-xem', label: 'Lịch xem phòng', icon: 'pending_actions' },
    { id: 'dat-coc', label: 'Đặt cọc', icon: 'account_balance_wallet' },
    { id: 'hop-dong-thue', label: 'Hợp đồng thuê', icon: 'article' },
    { id: 'tra-phong', label: 'Trả phòng', icon: 'logout' },
    { id: 'khach-hang', label: 'Khách hàng', icon: 'person' }
  ];

  return (
    <div className="kp-page kh-page">
      <aside className="kp-sidebar" style={{ borderRight: '1px solid #bec8c9' }}>
        <div className="kp-sidebar-brand">
          <Brand />
        </div>
        <nav className="ktp-sidebar-nav" aria-label="Menu sale">
          {navItems.map((item) => (
            <button
              className={`ktp-side-item ${activeTab === item.id ? 'is-active' : ''}`}
              type="button"
              key={item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
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
                    NHÂN VIÊN SALE
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
          {activeTab === 'ho-so' && <HoSoDangKyTab onNavigate={setActiveTab} />}
          {activeTab === 'tra-cuu' && <TraCuuPhongTab />}
          {activeTab === 'lich-xem' && <LichXemPhongTab onNavigate={setActiveTab} />}
          {activeTab === 'dat-coc' && <DatCocTab />}
          {activeTab === 'hop-dong-thue' && <LapHopDongTab />}
          {activeTab === 'tra-phong' && (
            <div className="ktp-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '600px' }}>
              <div style={{ textAlign: 'center' }}>
                <Icon name="build" style={{ fontSize: '48px', color: '#9eaaab', marginBottom: '16px' }} />
                <h2 style={{ color: '#3f494a', margin: '0 0 8px' }}>Chức năng đang phát triển</h2>
                <p style={{ color: '#6f797a', margin: 0 }}>Tính năng Trả phòng sẽ sớm được cập nhật trong phiên bản tiếp theo.</p>
              </div>
            </div>
          )}
          {activeTab === 'khach-hang' && <KhachHangTab />}
        </main>
      </div>
    </div>
  );
}
