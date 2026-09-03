const fs = require('fs');
const path = require('path');

const dir = 'd:/NAM3/HomeStayDorm/Web/frontend/src/pages/nhanVienSale';

const tabs = [
  'TongQuanTab.jsx',
  'HoSoDangKyTab.jsx',
  'LichXemPhongTab.jsx',
  'DatCocTab.jsx',
  'NhanPhongTab.jsx',
  'KhachHangTab.jsx',
  'TraCuuPhongTab.jsx'
];

tabs.forEach(tab => {
  const compName = tab.replace('.jsx', '');
  const content = `import React from 'react';

export default function ${compName}() {
  return (
    <div className="ktp-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <h2 style={{ color: '#6f797a' }}>Đang phát triển chức năng: ${compName.replace('Tab', '')}</h2>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, tab), content);
});

const pageContent = `import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import '../khachHang/khachHangPortal.css';
import '../nhanVienKeToan/nhanVienKeToanPortal.css'; // Use ke toan specific styles for content

import TongQuanTab from './TongQuanTab.jsx';
import HoSoDangKyTab from './HoSoDangKyTab.jsx';
import LichXemPhongTab from './LichXemPhongTab.jsx';
import DatCocTab from './DatCocTab.jsx';
import NhanPhongTab from './NhanPhongTab.jsx';
import KhachHangTab from './KhachHangTab.jsx';
import TraCuuPhongTab from './TraCuuPhongTab.jsx';

function Icon({ name }) {
  return <span className="material-symbols-rounded">{name}</span>;
}

function Brand() {
  return (
    <Link className="kp-brand" to="/">
      <span className="kp-brand-mark"><Icon name="home" /></span>
      <span>Homestay<strong>Dorm</strong></span>
    </Link>
  );
}

function firstName(name = '') {
  const parts = String(name).trim().split(/\\s+/).filter(Boolean);
  return parts[parts.length - 1] || 'bạn';
}

export default function NhanVienSalePage() {
  const { user, dangXuat } = useAuth();
  const [activeTab, setActiveTab] = useState('tong-quan');
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
    { id: 'tong-quan', label: 'Tổng quan', icon: 'dashboard' },
    { id: 'ho-so', label: 'Hồ sơ đăng ký', icon: 'list' },
    { id: 'lich-xem', label: 'Lịch xem phòng', icon: 'calendar_today' },
    { id: 'dat-coc', label: 'Đặt cọc', icon: 'account_balance_wallet' },
    { id: 'nhan-phong', label: 'Nhận phòng', icon: 'key' },
    { id: 'khach-hang', label: 'Khách hàng', icon: 'group' },
    { id: 'tra-cuu', label: 'Phòng/Giường', icon: 'meeting_room' }
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
              className={\`ktp-side-item \${activeTab === item.id ? 'is-active' : ''}\`}
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div 
              ref={dropdownRef}
              className="ktp-user-menu"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px' }}
            >
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#191c1d' }}>{user?.hoTen || 'Nhân viên sale'}</p>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#3f494a', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#edeeef', padding: '0px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                  NHÂN VIÊN SALE
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2f6765', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                {firstName(user?.hoTen).charAt(0).toUpperCase()}
              </div>

              {showDropdown && (
                <div className="ktp-user-dropdown">
                  <button className="ktp-user-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); }}>
                    <Icon name="account_circle" /> Thông tin tài khoản
                  </button>
                  <button className="ktp-user-dropdown-item logout" onClick={(e) => { e.stopPropagation(); dangXuat(); }}>
                    <Icon name="logout" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="kp-main" style={{ padding: 0 }}>
          {activeTab === 'tong-quan' && <TongQuanTab />}
          {activeTab === 'ho-so' && <HoSoDangKyTab />}
          {activeTab === 'lich-xem' && <LichXemPhongTab />}
          {activeTab === 'dat-coc' && <DatCocTab />}
          {activeTab === 'nhan-phong' && <NhanPhongTab />}
          {activeTab === 'khach-hang' && <KhachHangTab />}
          {activeTab === 'tra-cuu' && <TraCuuPhongTab />}
        </main>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(dir, 'NhanVienSalePage.jsx'), pageContent);

if (fs.existsSync(path.join(dir, 'nhanVienSale.css'))) {
  fs.unlinkSync(path.join(dir, 'nhanVienSale.css'));
}

console.log('Done refactoring');
