import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { getAuthenticatedHomePath } from '../../auth/auth.routes.js';
import './home.css';

const rooms = [
  {
    name: 'Dorm Studio 204',
    type: 'Giường dorm',
    price: '2.800.000đ/tháng',
    shortPrice: '2.8tr/tháng',
    status: 'Còn trống',
    statusClass: 'available',
    rating: '4.8',
    area: 'Hải Châu',
    description: 'Phù hợp sinh viên, có tủ cá nhân, wifi và khu sinh hoạt chung.',
    tags: ['Wifi', 'Máy lạnh', 'Giữ xe'],
    photoClass: 'photo-1'
  },
  {
    name: 'Phòng riêng Garden 101',
    type: 'Phòng riêng',
    price: '4.500.000đ/tháng',
    shortPrice: '4.5tr/tháng',
    status: 'Sắp trống',
    statusClass: 'soon',
    rating: '4.9',
    area: 'Thanh Khê',
    description: 'Có cửa sổ lớn, bàn học, khu bếp chung và lối đi riêng.',
    tags: ['WC riêng', 'Bếp chung', 'Cửa sổ'],
    photoClass: 'photo-2'
  },
  {
    name: 'Phòng đôi Cozy 302',
    type: 'Phòng đôi',
    price: '3.600.000đ/tháng',
    shortPrice: '3.6tr/tháng',
    status: 'Còn trống',
    statusClass: 'available',
    rating: '4.7',
    area: 'Ngũ Hành Sơn',
    description: 'Phòng dành cho 2 người, đầy đủ nội thất cơ bản và máy lạnh.',
    tags: ['Nội thất', 'Máy lạnh', 'Bảo trì'],
    photoClass: 'photo-3'
  }
];

const benefits = [
  ['🔎', 'Dễ tìm phòng', 'Lọc nhanh theo khu vực, loại phòng và khoảng giá phù hợp.'],
  ['💳', 'Chi phí minh bạch', 'Giá thuê, dịch vụ và trạng thái thanh toán được trình bày rõ ràng.'],
  ['🛠', 'Hỗ trợ sau thuê', 'Khách thuê có thể gửi yêu cầu bảo trì hoặc sửa chữa khi cần.']
];

const steps = [
  ['Đăng ký', 'Khách hàng tạo tài khoản và gửi nhu cầu thuê phòng.'],
  ['Xem phòng', 'Xem thông tin phòng, giá thuê, tiện ích và tình trạng còn trống.'],
  ['Đặt cọc', 'Nhân viên xác nhận thông tin và hướng dẫn khách hoàn tất đặt cọc.'],
  ['Nhận phòng', 'Khách được bàn giao phòng, giường và bắt đầu quá trình thuê.']
];

function Brand() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
      <span style={{ fontSize: '19px', fontFamily: '"Montserrat", "Inter", sans-serif', fontWeight: '700', letterSpacing: '0' }}>
        <span style={{ color: '#00666d' }}>Homestay</span><span style={{ color: '#a43c12' }}>Dorm</span>
      </span>
    </span>
  );
}

export default function HomePage() {
  const { user, dangXuat } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  function handleSearch(event) {
    event.preventDefault();
    setToast('Đang lọc phòng phù hợp...');
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-container-wide home-topbar">
          <a href="#home" aria-label="Homestay Dorm - Trang chủ"><Brand /></a>

          <nav className="home-nav">
            <a href="#home" className="active">Trang chủ</a>
            <a href="#rooms">Phòng trống</a>
            <a href="#process">Quy trình</a>
            <a href="#contact">Liên hệ</a>
          </nav>

          <div className="home-header-actions">
            {user ? (
              <>
                <Link className="home-account-pill" to={getAuthenticatedHomePath(user)}>
                  <span>{String(user.hoTen || user.tenDangNhap).charAt(0).toUpperCase()}</span>
                  {user.hoTen}
                </Link>
                <button className="home-logout" type="button" onClick={dangXuat}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link className="home-btn home-btn-secondary" to="/dang-nhap">Đăng nhập</Link>
                <Link className="home-btn home-btn-primary" to="/dang-ky">Đăng ký</Link>
              </>
            )}
            <button
              className="home-mobile-menu"
              type="button"
              aria-label="Mở menu"
              onClick={() => setToast('Vui lòng cuộn xuống để xem thông tin phòng.')}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero" id="home">
          <div className="home-container home-hero-grid">
            <div className="home-hero-copy">
              <span className="home-eyebrow">🏠 Homestay & Dorm tại Đà Nẵng</span>
              <h1>Tìm phòng sạch, tiện nghi và dễ quản lý chi phí</h1>
              <p className="home-subtext">
                Homestay Dorm giúp bạn xem phòng trống, tạo tài khoản, gửi đăng ký thuê
                và theo dõi thông tin thuê phòng trong một giao diện đơn giản, rõ ràng.
              </p>

              <div className="home-hero-actions">
                <a href="#rooms" className="home-btn home-btn-primary">Xem phòng trống</a>
                <Link to="/dang-ky" className="home-btn home-btn-secondary">Đăng ký thuê</Link>
              </div>

              <div className="home-hero-features">
                <span>✓ Giá minh bạch</span>
                <span>✓ Quy trình nhanh</span>
                <span>✓ Hỗ trợ bảo trì</span>
              </div>
            </div>

            <div className="home-hero-visual">
              <div className="home-hero-image" />
              <div className="home-hero-stat">
                <strong>12</strong>
                <span>phòng / giường đang còn trống</span>
              </div>
              <div className="home-floating-card">
                <div className="home-floating-head">
                  <div>
                    <h3>Dorm Studio 204</h3>
                    <p>Gần trung tâm, phù hợp sinh viên</p>
                  </div>
                  <span className="home-price-tag">2.8tr/tháng</span>
                </div>
                <div className="home-mini-tags">
                  <span>Wifi</span><span>Máy lạnh</span><span>Giữ xe</span><span>Còn trống</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-search-panel">
          <div className="home-container">
            <form className="home-search-box" onSubmit={handleSearch}>
              <label className="home-field">
                <span>Khu vực</span>
                <select>
                  <option value="">Tất cả khu vực</option>
                  <option>Hải Châu</option>
                  <option>Thanh Khê</option>
                  <option>Ngũ Hành Sơn</option>
                  <option>Gần trường đại học</option>
                </select>
              </label>
              <label className="home-field">
                <span>Loại phòng</span>
                <select>
                  <option value="">Tất cả loại phòng</option>
                  <option>Phòng riêng</option>
                  <option>Giường dorm</option>
                  <option>Phòng đôi</option>
                </select>
              </label>
              <label className="home-field">
                <span>Khoảng giá</span>
                <select>
                  <option value="">Tất cả mức giá</option>
                  <option>Dưới 2 triệu</option>
                  <option>2 - 3 triệu</option>
                  <option>3 - 5 triệu</option>
                  <option>Trên 5 triệu</option>
                </select>
              </label>
              <button className="home-btn home-btn-primary" type="submit">Tìm phòng</button>
            </form>
          </div>
        </section>

        <section className="home-section" id="rooms">
          <div className="home-container">
            <div className="home-section-title">
              <span className="home-eyebrow">Phòng nổi bật</span>
              <h2>Một số lựa chọn đang được quan tâm</h2>
              <p className="home-subtext">
                Trang chủ chỉ giữ lại vài phòng nổi bật để giao diện thoáng hơn và dễ nhìn hơn.
              </p>
            </div>
            <div className="home-rooms-grid">
              {rooms.map((room) => (
                <article className="home-room-card" key={room.name}>
                  <div className={`home-room-photo ${room.photoClass}`}>
                    <span className={`home-status ${room.statusClass}`}>{room.status}</span>
                    <span className="home-room-price">{room.shortPrice}</span>
                  </div>
                  <div className="home-room-content">
                    <div className="home-room-meta">
                      <span className="home-room-type">{room.type}</span>
                      <span className="home-rating">★ {room.rating}</span>
                    </div>
                    <h3>{room.name}</h3>
                    <p>{room.description}</p>
                    <div className="home-tags">
                      {room.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="home-room-footer">
                      <button className="home-room-link" type="button" onClick={() => setSelectedRoom(room)}>
                        Xem chi tiết →
                      </button>
                      <span>{room.area}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-benefits">
          <div className="home-container">
            <div className="home-section-title center">
              <span className="home-eyebrow">Lý do lựa chọn</span>
              <h2>Giao diện rõ ràng, tập trung vào nhu cầu thuê phòng</h2>
            </div>
            <div className="home-benefit-grid">
              {benefits.map(([icon, title, description]) => (
                <div className="home-benefit-card" key={title}>
                  <div className="home-benefit-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section" id="process">
          <div className="home-container">
            <div className="home-section-title center">
              <span className="home-eyebrow">Quy trình thuê</span>
              <h2>4 bước chính, ngắn gọn và dễ hiểu</h2>
            </div>
            <div className="home-process-grid">
              {steps.map(([title, description], index) => (
                <div className="home-step-card" key={title}>
                  <div className="home-step-number">{index + 1}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer" id="contact">
        <div className="home-container">
          <div className="home-footer-grid">
            <div>
              <Brand />
              <p>
                Website mẫu cho hệ thống quản lý homestay/dorm, tập trung vào tìm phòng,
                đăng ký thuê và quản lý thông tin khách thuê.
              </p>
            </div>
            <div>
              <h3>Liên hệ</h3>
              <div className="home-footer-links">
                <p>📍 123 Nguyễn Văn Linh, Đà Nẵng</p>
                <p>☎ 0905 123 456</p>
                <p>✉ hello@homestaydorm.vn</p>
              </div>
            </div>
            <div>
              <h3>Tài khoản</h3>
              <div className="home-footer-links">
                <Link to="/dang-nhap">Đăng nhập</Link>
                <Link to="/dang-ky">Đăng ký tài khoản</Link>
                <a href="#rooms">Xem phòng trống</a>
              </div>
            </div>
          </div>
          <div className="home-copyright">
            <span>© 2026 Homestay Dorm. Giao diện mẫu phục vụ đồ án.</span>
            <span>Homestay & Dorm Management System</span>
          </div>
        </div>
      </footer>

      {selectedRoom && (
        <div className="home-modal-backdrop show" onMouseDown={() => setSelectedRoom(null)}>
          <div className="home-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="home-modal-head">
              <div>
                <h2>{selectedRoom.name}</h2>
                <p>Thông tin mẫu để mô phỏng thao tác xem chi tiết phòng.</p>
              </div>
              <button className="home-modal-close" type="button" onClick={() => setSelectedRoom(null)}>×</button>
            </div>
            <div className="home-form-grid">
              <label className="home-field">
                <span>Loại phòng</span>
                <input value={selectedRoom.type} readOnly />
              </label>
              <label className="home-field">
                <span>Giá thuê</span>
                <input value={selectedRoom.price} readOnly />
              </label>
              <label className="home-field">
                <span>Trạng thái</span>
                <input value={selectedRoom.status} readOnly />
              </label>
              <Link className="home-btn home-btn-primary" to="/dang-ky">Đăng ký thuê phòng này</Link>
            </div>
          </div>
        </div>
      )}
      <div className={`home-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
