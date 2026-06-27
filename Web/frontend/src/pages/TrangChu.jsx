import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getAuthenticatedHomePath } from '../auth/auth.routes.js';
import { httpClient } from '../api/httpClient.js';
import '../styles/TrangChu.css';

// ── Ảnh placeholder theo loại phòng ─────────────────────────
const ROOM_IMAGES = {
  LP0001: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
  LP0002: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
  LP0003: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  LP0004: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
};

// ── Tiện ích mặc định theo loại phòng ───────────────────────
const ROOM_AMENITIES = {
  LP0001: ['Điều hòa', 'Wifi', 'Tủ cá nhân'],
  LP0002: ['Điều hòa', 'Wifi', 'Tủ cá nhân'],
  LP0003: ['Wifi', 'Quạt', 'Tủ cá nhân'],
  LP0004: ['Điều hòa', 'Wifi', 'WC riêng'],
};

// ── Đánh giá tĩnh ───────────────────────────────────────────
const TESTIMONIALS = [
  { id: 1, name: 'Nguyễn Văn An', role: 'Sinh viên ĐH Bách Khoa', avatar: 'A', rating: 5,
    text: 'Giao diện rất dễ dùng, tìm phòng nhanh và quy trình đặt cọc rõ ràng. Mình đã thuê phòng chỉ trong 1 ngày!' },
  { id: 2, name: 'Trần Thị Bình', role: 'Nhân viên văn phòng', avatar: 'B', rating: 5,
    text: 'Phòng chất lượng, đúng như mô tả. Hệ thống thông báo hạn thanh toán rất tiện, không lo quên.' },
  { id: 3, name: 'Lê Quốc Cường', role: 'Học viên cao học', avatar: 'C', rating: 4,
    text: 'Thích nhất là phần quản lý hợp đồng và gửi yêu cầu sửa chữa ngay trên app. Nhân viên phản hồi rất nhanh.' },
];

const PROCESS_STEPS = [
  { step: '01', icon: 'register', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản khách hàng miễn phí và điền thông tin cá nhân cần thiết.' },
  { step: '02', icon: 'search', title: 'Tìm & xem phòng', desc: 'Lọc phòng theo khu vực, loại phòng, giá thuê và xem chi tiết tiện ích.' },
  { step: '03', icon: 'deposit', title: 'Đặt cọc xác nhận', desc: 'Nhân viên xác nhận thông tin và hướng dẫn bạn hoàn tất đặt cọc nhanh chóng.' },
  { step: '04', icon: 'home', title: 'Nhận phòng & ở', desc: 'Nhận bàn giao phòng, ký hợp đồng và bắt đầu cuộc sống mới tiện nghi.' },
];

function ProcessIcon({ name }) {
  const icons = {
    register: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tc-step-svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <circle cx="9" cy="9" r="1" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tc-step-svg">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
    deposit: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tc-step-svg">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <path d="M12 14v2M8 15h8" />
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="tc-step-svg">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  };
  return icons[name] || null;
}

// ────────────────────────────────────────────────────────────
// Auth Modal (Đăng nhập / Đăng ký inline)
// ────────────────────────────────────────────────────────────
const INIT_LOGIN = { tenDangNhap: '', matKhau: '' };
const INIT_REGISTER = { tenDangNhap: '', hoTen: '', ngaySinh: '', gioiTinh: '', email: '', soDienThoai: '', matKhau: '', xacNhanMatKhau: '' };

function AuthModal({ mode, onClose, onSwitchMode }) {
  const { dangNhap, dangKy } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginForm, setLoginForm] = useState(INIT_LOGIN);
  const [regForm, setRegForm] = useState(INIT_REGISTER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef();

  // Close on ESC
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await dangNhap(loginForm);
      onClose();
      navigate(location.state?.from?.pathname || getAuthenticatedHomePath(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đăng nhập lúc này.');
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regForm.matKhau !== regForm.xacNhanMatKhau) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true);
    try {
      await dangKy(regForm);
      onClose();
      navigate('/khach-hang', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đăng ký lúc này.');
    } finally { setLoading(false); }
  }

  function updateLogin(e) { setLoginForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  function updateReg(e) { setRegForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  return (
    <div className="tc-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="tc-modal-outer">
        <div className="tc-modal tc-modal-inner" role="dialog" aria-modal="true">
          {/* Tabs */}
          <div className="tc-modal-tabs">
            <button
              className={`tc-modal-tab ${mode === 'login' ? 'tc-modal-tab--active' : ''}`}
              onClick={() => { setError(''); onSwitchMode('login'); }}
              type="button"
            >Đăng nhập</button>
            <button
              className={`tc-modal-tab ${mode === 'register' ? 'tc-modal-tab--active' : ''}`}
              onClick={() => { setError(''); onSwitchMode('register'); }}
              type="button"
            >Đăng ký</button>
            <button className="tc-modal-close-btn" onClick={onClose} type="button" aria-label="Đóng">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Error */}
          {error && <div className="tc-modal-error">{error}</div>}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form className="tc-modal-form" onSubmit={handleLogin}>
              <div className="tc-modal-header">
                <span className="tc-modal-emoji">👋</span>
                <h2>Chào mừng trở lại</h2>
                <p>Đăng nhập để quản lý thuê phòng của bạn.</p>
              </div>
              <label className="tc-form-field">
                <span>Tên đăng nhập</span>
                <input name="tenDangNhap" value={loginForm.tenDangNhap} onChange={updateLogin}
                  placeholder="kh0001" required autoComplete="username" />
              </label>
              <label className="tc-form-field">
                <span>Mật khẩu</span>
                <input name="matKhau" type="password" value={loginForm.matKhau} onChange={updateLogin}
                  placeholder="••••••••" required autoComplete="current-password" />
              </label>
              <button className="tc-modal-submit" type="submit" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <p className="tc-modal-switch">
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => { setError(''); onSwitchMode('register'); }}>Đăng ký ngay</button>
              </p>
            </form>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <form className="tc-modal-form" onSubmit={handleRegister}>
              <div className="tc-modal-header">
                <span className="tc-modal-emoji">🏠</span>
                <h2>Tạo tài khoản mới</h2>
                <p>Đăng ký để tìm phòng và quản lý hợp đồng dễ dàng.</p>
              </div>
              <label className="tc-form-field">
                <span>Họ và tên <span className="tc-required">*</span></span>
                <input name="hoTen" value={regForm.hoTen} onChange={updateReg}
                  placeholder="Nguyễn Văn An" required />
              </label>
              <label className="tc-form-field">
                <span>Tên đăng nhập <span className="tc-required">*</span></span>
                <input name="tenDangNhap" value={regForm.tenDangNhap} onChange={updateReg}
                  placeholder="nguyenvanan" required maxLength={50} autoComplete="username" />
              </label>
              <div className="tc-form-row">
                <label className="tc-form-field">
                  <span>Giới tính <span className="tc-required">*</span></span>
                  <select name="gioiTinh" value={regForm.gioiTinh} onChange={updateReg} required>
                    <option value="">Chọn</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </label>
                <label className="tc-form-field">
                  <span>Ngày sinh <span className="tc-required">*</span></span>
                  <input name="ngaySinh" type="date" value={regForm.ngaySinh} onChange={updateReg} required />
                </label>
              </div>
              <div className="tc-form-row">
                <label className="tc-form-field">
                  <span>Email</span>
                  <input name="email" type="email" value={regForm.email} onChange={updateReg}
                    placeholder="ban@example.com" />
                </label>
                <label className="tc-form-field">
                  <span>Số điện thoại <span className="tc-required">*</span></span>
                  <input name="soDienThoai" type="tel" value={regForm.soDienThoai} onChange={updateReg}
                    placeholder="0901234567" required />
                </label>
              </div>
              <div className="tc-form-row">
                <label className="tc-form-field">
                  <span>Mật khẩu <span className="tc-required">*</span></span>
                  <input name="matKhau" type="password" value={regForm.matKhau} onChange={updateReg}
                    placeholder="••••••••" required autoComplete="new-password" />
                </label>
                <label className="tc-form-field">
                  <span>Xác nhận mật khẩu <span className="tc-required">*</span></span>
                  <input name="xacNhanMatKhau" type="password" value={regForm.xacNhanMatKhau} onChange={updateReg}
                    placeholder="••••••••" required autoComplete="new-password" />
                </label>
              </div>
              <button className="tc-modal-submit" type="submit" disabled={loading}>
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>
              <p className="tc-modal-switch">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => { setError(''); onSwitchMode('login'); }}>Đăng nhập</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────
function HeaderPublic({ onOpenAuth }) {
  const { user, dangXuat } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="tc-header">
      <nav className="tc-nav-inner">
        <a href="#trang-chu" className="tc-logo">
          <svg className="tc-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
          </svg>
          Homestay<strong>Dorm</strong>
        </a>

        <div className={`tc-nav-links ${mobileOpen ? 'tc-nav-links--open' : ''}`}>
          <a href="#trang-chu" className="tc-nav-link tc-nav-link--active">Trang chủ</a>
          <a href="#phong-noi-bat" className="tc-nav-link">Phòng & Giường</a>
          <a href="#quy-trinh" className="tc-nav-link">Quy trình</a>
          <a href="#lien-he" className="tc-nav-link">Liên hệ</a>
        </div>

        <div className="tc-nav-actions">
          {user ? (
            <>
              <button className="tc-btn-ghost" type="button" onClick={() => navigate(getAuthenticatedHomePath(user))}>
                Dashboard
              </button>
              <button className="tc-btn-outline" type="button" onClick={dangXuat}>Đăng xuất</button>
            </>
          ) : (
            <>
              <button className="tc-btn-ghost" type="button" onClick={() => onOpenAuth('login')}>Đăng nhập</button>
              <button className="tc-btn-primary" type="button" onClick={() => onOpenAuth('register')}>Đăng ký</button>
            </>
          )}
          <button
            className={`tc-hamburger ${mobileOpen ? 'tc-hamburger--open' : ''}`}
            type="button" aria-label="Mở menu"
            onClick={() => setMobileOpen(v => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>
    </header>
  );
}

// ────────────────────────────────────────────────────────────
// Hero Section
// ────────────────────────────────────────────────────────────
function SearchFieldIcon({ name }) {
  const icons = {
    area: (
      <>
        <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    rent: (
      <>
        <path d="M4 20V9.5L12 4l8 5.5V20" />
        <path d="M8 20v-6h8v6" />
        <path d="M9 10.5h.01M15 10.5h.01" />
      </>
    ),
    room: (
      <>
        <path d="M4 19v-8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1h3a3 3 0 0 1 3 3v4" />
        <path d="M4 14h16M4 19h16" />
        <path d="M7 8V6" />
      </>
    ),
    price: (
      <>
        <rect x="3.5" y="7" width="17" height="10" rx="2" />
        <circle cx="12" cy="12" r="2.2" />
        <path d="M6.8 10.1h.01M17.2 13.9h.01" />
      </>
    )
  };

  return (
    <svg className="tc-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[name] || icons.area}
    </svg>
  );
}

function SearchDropdown({ icon, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className={`tc-search-field ${open ? 'tc-search-field--open' : ''}`} ref={dropdownRef}>
      <SearchFieldIcon name={icon} />
      <div className="tc-search-field-inner">
        <span className="tc-search-label">{label}</span>
        <button
          className="tc-search-dropdown-toggle"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span>{selected.label}</span>
          <svg className="tc-search-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </button>
        {open && (
          <div className="tc-search-dropdown-menu" role="listbox">
            {options.map((option) => (
              <button
                className={`tc-search-dropdown-option ${option.value === value ? 'is-selected' : ''}`}
                key={`${label}-${option.value || 'all'}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroSection({ onOpenAuth }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ area: '', hinhThuc: '', type: '', price: '' });
  const areaOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'Quận 1', label: 'Quận 1' },
    { value: 'Bình Thạnh', label: 'Bình Thạnh' },
    { value: 'Thủ Đức', label: 'Thủ Đức' }
  ];
  const rentOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'Ghép nam', label: 'Ghép nam' },
    { value: 'Ghép nữ', label: 'Ghép nữ' },
    { value: 'Nguyên căn', label: 'Nguyên căn' }
  ];
  const roomOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'Phòng 2 người', label: 'Phòng 2 người' },
    { value: 'Phòng 4 người', label: 'Phòng 4 người' },
    { value: 'Phòng 6 người', label: 'Phòng 6 người' },
    { value: 'Phòng VIP 2 người', label: 'Phòng VIP 2 người' }
  ];
  const priceOptions = [
    { value: '', label: 'Tất cả' },
    { value: '1500000', label: 'Dưới 1.5 triệu' },
    { value: '2500000', label: 'Dưới 2.5 triệu' },
    { value: '5000000', label: 'Dưới 5 triệu' }
  ];

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.area) params.set('khuVuc', search.area);
    if (search.hinhThuc) params.set('hinhThucThue', search.hinhThuc);
    if (search.type) params.set('loaiPhong', search.type);
    if (search.price) params.set('mucGiaToiDa', search.price);
    navigate(`/kham-pha-phong${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <section className="tc-hero" id="trang-chu">
      <div className="tc-hero-overlay" />
      <div className="tc-hero-content">
        <h1 className="tc-hero-title">
          Tìm phòng vừa ý,<br />chi phí hợp lý
        </h1>
        <p className="tc-hero-subtitle">
          Homestay ấm cúng và ký túc xá hiện đại — được chọn lọc kỹ lưỡng cho sinh viên và người đi làm tại TP.HCM.
        </p>

        <form className="tc-search-bar" onSubmit={handleSearch}>
          <SearchDropdown
            icon="area"
            label="Khu vực"
            value={search.area}
            options={areaOptions}
            onChange={(area) => setSearch((current) => ({ ...current, area }))}
          />
          <div className="tc-search-divider" />
          <SearchDropdown
            icon="rent"
            label="Hình thức thuê"
            value={search.hinhThuc}
            options={rentOptions}
            onChange={(hinhThuc) => setSearch((current) => ({ ...current, hinhThuc }))}
          />
          <div className="tc-search-divider" />
          <SearchDropdown
            icon="room"
            label="Loại phòng"
            value={search.type}
            options={roomOptions}
            onChange={(type) => setSearch((current) => ({ ...current, type }))}
          />
          <div className="tc-search-divider" />
          <SearchDropdown
            icon="price"
            label="Mức giá"
            value={search.price}
            options={priceOptions}
            onChange={(price) => setSearch((current) => ({ ...current, price }))}
          />
          <div className="tc-search-divider tc-search-divider--native" />
          <div className="tc-search-field tc-search-field--native">
            <SearchFieldIcon name="area" />
            <div className="tc-search-field-inner">
              <label className="tc-search-label">Khu vực</label>
              <select className="tc-search-select" value={search.area}
                onChange={e => setSearch(s => ({ ...s, area: e.target.value }))}>
                <option value="">Tất cả</option>
                <option>Quận 1</option>
                <option>Bình Thạnh</option>
                <option>Thủ Đức</option>
              </select>
            </div>
          </div>
          <div className="tc-search-divider" />
          <div className="tc-search-field tc-search-field--native">
            <SearchFieldIcon name="rent" />
            <div className="tc-search-field-inner">
              <label className="tc-search-label">Hình thức thuê</label>
              <select className="tc-search-select" value={search.hinhThuc}
                onChange={e => setSearch(s => ({ ...s, hinhThuc: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="Ghép nam">Ghép nam</option>
                <option value="Ghép nữ">Ghép nữ</option>
                <option value="Nguyên căn">Nguyên căn</option>
              </select>
            </div>
          </div>
          <div className="tc-search-divider" />
          <div className="tc-search-field tc-search-field--native">
            <SearchFieldIcon name="room" />
            <div className="tc-search-field-inner">
              <label className="tc-search-label">Loại phòng</label>
              <select className="tc-search-select" value={search.type}
                onChange={e => setSearch(s => ({ ...s, type: e.target.value }))}>
                <option value="">Tất cả</option>
                <option>Phòng 2 người</option>
                <option>Phòng 4 người</option>
                <option>Phòng 6 người</option>
                <option>Phòng VIP 2 người</option>
              </select>
            </div>
          </div>
          <div className="tc-search-divider" />
          <div className="tc-search-field tc-search-field--native">
            <SearchFieldIcon name="price" />
            <div className="tc-search-field-inner">
              <label className="tc-search-label">Mức giá</label>
              <select className="tc-search-select" value={search.price}
                onChange={e => setSearch(s => ({ ...s, price: e.target.value }))}>
                <option value="">Tất cả</option>
                <option value="1500000">Dưới 1.5 triệu</option>
                <option value="2500000">Dưới 2.5 triệu</option>
                <option value="5000000">Dưới 5 triệu</option>
              </select>
            </div>
          </div>
          <button className="tc-search-btn" type="submit" aria-label="Tìm kiếm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Room Card — dữ liệu từ DB
// ────────────────────────────────────────────────────────────
function RoomCard({ room, onOpenAuth }) {
  const img = room.UrlImg || ROOM_IMAGES[room.MaLoaiPhong] || ROOM_IMAGES.LP0001;
  const amenities = ROOM_AMENITIES[room.MaLoaiPhong] || ['Wifi', 'Điều hòa'];
  const gia = room.GiaThueTheoGiuong
    ? room.GiaThueTheoGiuong.toLocaleString('vi-VN')
    : room.GiaThueNguyenPhong?.toLocaleString('vi-VN') ?? '—';

  return (
    <div className="tc-card-outer">
      <article className="tc-room-card tc-card-inner">
        <div className="tc-room-img-wrap">
          <img className="tc-room-img" src={img} alt={room.TenPhong} loading="lazy" />
          <span className="tc-room-price-badge">{gia}đ/<span>giường/tháng</span></span>
        </div>
        <div className="tc-room-body">
          <div className="tc-room-meta">
            <span className="tc-room-type">{room.TenLoaiPhong}</span>
            <span className="tc-room-capacity">👥 {room.SucChuaToiDa} người</span>
          </div>
          <h3 className="tc-room-name">{room.TenPhong}</h3>
          <p className="tc-room-area">📍 {room.TenChiNhanh}</p>
          {room.MoTa && <p className="tc-room-desc">{room.MoTa}</p>}
          <div className="tc-room-tags">
            {amenities.map(a => <span key={a} className="tc-tag">{a}</span>)}
          </div>
          <div className="tc-room-footer">
            <button className="tc-room-cta" type="button" onClick={() => onOpenAuth('register')}>
              Xem chi tiết <span className="tc-arrow-circle">→</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Testimonials
// ────────────────────────────────────────────────────────────
function TestimonialSection() {
  return (
    <section className="tc-section tc-testimonials-section" id="danh-gia">
      <div className="tc-container">
        <div className="tc-section-head tc-section-head--center">
          <span className="tc-eyebrow">Khách hàng nói gì</span>
          <h2 className="tc-section-title">Hàng trăm khách thuê hài lòng</h2>
          <p className="tc-section-sub">Trải nghiệm thực tế từ người đã thuê qua hệ thống HomestayDorm.</p>
        </div>
        <div className="tc-testimonials-grid">
          {TESTIMONIALS.map(t => (
            <div key={t.id} className="tc-card-outer">
              <div className="tc-testimonial-card tc-card-inner">
                <div className="tc-stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                <p className="tc-testimonial-text">"{t.text}"</p>
                <div className="tc-testimonial-author">
                  <div className="tc-avatar">{t.avatar}</div>
                  <div>
                    <div className="tc-author-name">{t.name}</div>
                    <div className="tc-author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Process
// ────────────────────────────────────────────────────────────
function ProcessSection({ onOpenAuth }) {
  return (
    <section className="tc-section tc-process-section" id="quy-trinh">
      <div className="tc-container">
        <div className="tc-section-head tc-section-head--center">
          <span className="tc-eyebrow">Quy trình thuê phòng</span>
          <h2 className="tc-section-title">4 bước đơn giản để có chỗ ở</h2>
          <p className="tc-section-sub">Quy trình minh bạch, thường hoàn thành trong 1–2 ngày làm việc.</p>
        </div>
        <div className="tc-process-grid">
          {PROCESS_STEPS.map((s, idx) => (
            <div key={s.step} className="tc-card-outer">
              <div className="tc-step-card tc-card-inner">
                <div className="tc-step-number">{s.step}</div>
                <div className="tc-step-icon">
                  <ProcessIcon name={s.icon} />
                </div>
                <h3 className="tc-step-title">{s.title}</h3>
                <p className="tc-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="tc-process-cta">
          <button className="tc-btn-primary tc-btn-large" type="button" onClick={() => onOpenAuth('register')}>
            Bắt đầu ngay — Miễn phí
          </button>
          <button className="tc-btn-outline tc-btn-large" type="button" onClick={() => onOpenAuth('login')}>
            Đã có tài khoản
          </button>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────
function FooterPublic({ onOpenAuth }) {
  return (
    <footer className="tc-footer" id="lien-he">
      <div className="tc-container">
        <div className="tc-footer-grid">
          <div className="tc-footer-brand">
            <a href="#trang-chu" className="tc-logo tc-logo--light">
              <svg className="tc-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
              </svg>
              Homestay<strong>Dorm</strong>
            </a>
            <p className="tc-footer-tagline">
              Hệ thống quản lý phòng trọ, homestay và ký túc xá — TP.HCM.
            </p>
          </div>
          <div>
            <h4 className="tc-footer-heading">Điều hướng</h4>
            <ul className="tc-footer-links">
              <li><a href="#trang-chu">Trang chủ</a></li>
              <li><a href="#phong-noi-bat">Phòng nổi bật</a></li>
              <li><a href="#quy-trinh">Quy trình thuê</a></li>
              <li><a href="#danh-gia">Đánh giá</a></li>
            </ul>
          </div>
          <div>
            <h4 className="tc-footer-heading">Tài khoản</h4>
            <ul className="tc-footer-links">
              <li><button type="button" onClick={() => onOpenAuth('login')}>Đăng nhập</button></li>
              <li><button type="button" onClick={() => onOpenAuth('register')}>Đăng ký</button></li>
            </ul>
          </div>
          <div>
            <h4 className="tc-footer-heading">Liên hệ</h4>
            <ul className="tc-footer-contact">
              <li>📍 12 Nguyễn Trãi, Quận 1, TP.HCM</li>
              <li>☎ 028 1111 0001</li>
              <li>✉ q1@homedorm.vn</li>
            </ul>
          </div>
        </div>
        <div className="tc-footer-bottom">
          <span>© 2026 HomestayDorm. Đồ án môn học.</span>
          <span>Homestay &amp; Dorm Management System</span>
        </div>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
export default function TrangChu() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'

  const openAuth = useCallback((mode) => setAuthModal(mode), []);
  const closeAuth = useCallback(() => setAuthModal(null), []);
  const switchMode = useCallback((mode) => setAuthModal(mode), []);

  useEffect(() => {
    httpClient.get('/trang-chu/phong-noi-bat')
      .then(res => setRooms(res.data.data || []))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  return (
    <div className={`tc-page ${authModal ? 'tc-page--blurred' : ''}`}>
      <HeaderPublic onOpenAuth={openAuth} />

      <main>
        <HeroSection onOpenAuth={openAuth} />

        {/* Phòng nổi bật */}
        <section className="tc-section tc-rooms-section" id="phong-noi-bat">
          <div className="tc-container">
            <div className="tc-section-head">
              <span className="tc-eyebrow">Phòng nổi bật</span>
              <h2 className="tc-section-title">Các lựa chọn đang được quan tâm</h2>
              <p className="tc-section-sub">Phòng được chọn lọc kỹ lưỡng về chất lượng, vị trí và mức giá hợp lý.</p>
            </div>

            {loadingRooms ? (
              <div className="tc-rooms-loading">
                <div className="tc-spinner" />
                <p>Đang tải danh sách phòng...</p>
              </div>
            ) : rooms.length > 0 ? (
              <div className="tc-rooms-grid">
                {rooms.map(room => <RoomCard key={room.MaPhong} room={room} onOpenAuth={openAuth} />)}
              </div>
            ) : (
              <div className="tc-rooms-empty">Hiện chưa có phòng nào để hiển thị.</div>
            )}

            <div className="tc-rooms-more">
              <button className="tc-btn-outline" type="button" onClick={() => navigate('/kham-pha-phong')}>
                Khám phá thêm phòng →
              </button>
            </div>
          </div>
        </section>

        <TestimonialSection />
        <ProcessSection onOpenAuth={openAuth} />
      </main>

      <FooterPublic onOpenAuth={openAuth} />

      {/* Auth Modal */}
      {authModal && (
        <AuthModal mode={authModal} onClose={closeAuth} onSwitchMode={switchMode} />
      )}
    </div>
  );
}
