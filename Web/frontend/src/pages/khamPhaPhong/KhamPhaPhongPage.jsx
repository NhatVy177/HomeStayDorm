import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { httpClient } from '../../api/httpClient.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import './khamPhaPhong.css';

const DEFAULT_FILTERS = {
  tuKhoa: '',
  khuVuc: '',
  loaiPhong: '',
  mucGiaToiDa: ''
};


const PRICE_OPTIONS = [
  { value: '', label: 'Tất cả mức giá' },
  { value: '1500000', label: 'Dưới 1,5 triệu' },
  { value: '2000000', label: 'Dưới 2 triệu' },
  { value: '3000000', label: 'Dưới 3 triệu' },
  { value: '3500000', label: 'Dưới 3,5 triệu' }
];

function getFiltersFromSearch(search) {
  const params = new URLSearchParams(search);
  return {
    tuKhoa: params.get('tuKhoa') || '',
    khuVuc: params.get('khuVuc') || '',
    loaiPhong: params.get('loaiPhong') || '',
    mucGiaToiDa: params.get('mucGiaToiDa') || ''
  };
}

function compactParams(filters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value != null)
  );
}

function formatMoney(value) {
  if (value == null || value === '') return 'Liên hệ';
  return Number(value).toLocaleString('vi-VN') + 'đ';
}

function getAreaLabel(address = '', fallback = '') {
  const parts = String(address)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) return parts[parts.length - 2];
  if (parts.length >= 2) return parts[parts.length - 1];
  return fallback || 'Chưa cập nhật';
}

function initials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase() || 'KH';
}

function LineIcon({ name, className = '' }) {
  const icons = {
    logo: (
      <>
        <path d="M3.5 11.2 12 4l8.5 7.2" />
        <path d="M5.5 10.4V20h13v-9.6" />
        <path d="M9.5 20v-5.8h5V20" />
      </>
    ),
    explore: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.4 5.1-5.1 2.4 2.4-5.1 5.1-2.4Z" />
      </>
    ),
    profile: (
      <>
        <path d="M7 4h7l3 3v17H7z" />
        <path d="M14 4v4h4M10 13h4M10 17h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5.5" width="16" height="14" rx="2" />
        <path d="M8 3.5v4M16 3.5v4M4 10h16" />
      </>
    ),
    payment: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17M7 14h4" />
      </>
    ),
    bed: (
      <>
        <path d="M4 19V9M20 19v-6a3 3 0 0 0-3-3H4v9" />
        <path d="M4 14h16M8 10V7h4v3" />
      </>
    ),
    contract: (
      <>
        <path d="M6 3.8h8l4 4V20H6z" />
        <path d="M14 4v5h5M9 13h6M9 17h6" />
      </>
    ),
    invoice: (
      <>
        <path d="M7 4h10v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2z" />
        <path d="M10 9h4M10 13h4M10 17h2" />
      </>
    ),
    repair: (
      <>
        <path d="M14.5 6.2a4.2 4.2 0 0 0-5.2 5.2L4 16.7 7.3 20l5.3-5.3a4.2 4.2 0 0 0 5.2-5.2l-2.9 2.9-2.3-2.3z" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.2a16 16 0 0 0 6.8 6.8l.9-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" />
      </>
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    map: (
      <>
        <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    room: (
      <>
        <path d="M4 20V8.5L12 4l8 4.5V20" />
        <path d="M8 20v-7h8v7M9 9.5h.01M15 9.5h.01" />
      </>
    )
  };

  return (
    <svg className={`kp-line-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[name] || icons.room}
    </svg>
  );
}

function Brand() {
  return (
    <Link className="kp-brand" to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
      <span style={{ fontSize: '19px', fontFamily: '"Montserrat", "Inter", sans-serif', fontWeight: '700', letterSpacing: '0' }}>
        <span style={{ color: '#00666d' }}>Homestay</span><span style={{ color: '#a43c12' }}>Dorm</span>
      </span>
    </Link>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!ref.current || ref.current.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <label className="kp-filter-select" ref={ref}>
      <span>{label}</span>
      <button
        className={`kp-select-trigger ${open ? 'is-open' : ''}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <strong>{selected?.label || 'Tất cả'}</strong>
        <LineIcon name="chevron" />
      </button>
      {open && (
        <div className="kp-select-menu" role="listbox">
          {options.map((option) => (
            <button
              className={option.value === value ? 'is-selected' : ''}
              key={option.value || option.label}
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
    </label>
  );
}

function getImageCandidates(url = '') {
  const trimmed = String(url || '').trim();
  if (!trimmed) return [];

  const match = trimmed.match(/^(.*?)(\.(jpg|jpeg|png|webp|gif))$/i);
  if (!match) return [trimmed];

  const [, base, , ext] = match;
  const normalizedExt = String(ext || '').toLowerCase();
  const candidates = [trimmed];

  if (['jpg', 'jpeg', 'png'].includes(normalizedExt)) {
    const fallbackExt = normalizedExt === 'png' ? 'jpg' : 'png';
    candidates.push(`${base}.${fallbackExt}`);
  }

  return [...new Set(candidates)];
}

function RoomVisual({ room }) {
  const [imageSrc, setImageSrc] = useState(room.urlImg || '');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const imageCandidates = useMemo(() => getImageCandidates(room.urlImg), [room.urlImg]);

  useEffect(() => {
    setImageSrc(room.urlImg || '');
    setCandidateIndex(0);
    setFailed(false);
  }, [room.urlImg]);

  if (!imageSrc || failed) {
    return (
      <div className="kp-room-placeholder">
        <LineIcon name="room" />
        <span>{room.maPhong}</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={room.tenPhong}
      loading="lazy"
      onError={() => {
        const nextIndex = candidateIndex + 1;
        if (nextIndex < imageCandidates.length) {
          setCandidateIndex(nextIndex);
          setImageSrc(imageCandidates[nextIndex]);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

function RoomCard({ room, onViewDetail, onRegister }) {
  const area = getAreaLabel(room.diaChi, room.chiNhanh);

  return (
    <article className="kp-room-card">
      <div className="kp-room-media">
        <RoomVisual room={room} />
      </div>
      <div className="kp-room-body">
        <div className="kp-room-title-row" style={{ alignItems: 'flex-start' }}>
          <h3>{room.tenPhong}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {room.giaTheoGiuong != null && <strong className="kp-room-price">{formatMoney(room.giaTheoGiuong)}<span>/giường</span></strong>}
            {room.giaNguyenPhong != null && <strong className="kp-room-price">{formatMoney(room.giaNguyenPhong)}<span>/căn</span></strong>}
          </div>
        </div>
        <p className="kp-room-location"><LineIcon name="map" />{area}</p>
        <div className="kp-room-tags">
          <span>{room.loaiPhong}</span>
          <span>{room.sucChua} người</span>
        </div>
        {room.moTa && <p className="kp-room-desc">{room.moTa}</p>}
        <div className="kp-room-facts">
          <span><LineIcon name="people" />Còn {room.soChoTrong} chỗ</span>
          <span><LineIcon name="room" />{room.gioiTinhChoPhep}</span>
        </div>
        <div className="kp-room-actions">
          <button className="kp-btn kp-btn-primary kp-full" type="button" onClick={() => onViewDetail(room)}>Xem chi tiết</button>
        </div>
      </div>
    </article>
  );
}

function Sidebar({ user, onAuthRequired }) {
  const navigate = useNavigate();
  const lockedItems = [
    { icon: 'payment', label: 'Đặt cọc' },
    { icon: 'bed', label: 'Phòng/Giường của tôi' },
    { icon: 'contract', label: 'Hợp đồng' },
    { icon: 'invoice', label: 'Hóa đơn' },
    { icon: 'repair', label: 'Bảo trì' }
  ];

  return (
    <aside className="kp-sidebar">
      <div className="kp-sidebar-brand"><Brand /></div>
      <nav className="kp-sidebar-nav" aria-label="Điều hướng khám phá phòng">
        <button className="kp-side-item is-active" type="button">
          <LineIcon name="explore" />
          <span>Khám phá phòng</span>
        </button>
        <button className="kp-side-item" type="button" onClick={() => user ? navigate('/khach-hang') : onAuthRequired()}>
          <LineIcon name="profile" />
          <span>Hồ sơ đăng ký</span>
        </button>
        <button className="kp-side-item" type="button" onClick={() => user ? navigate('/khach-hang') : onAuthRequired()}>
          <LineIcon name="calendar" />
          <span>Lịch xem phòng</span>
        </button>
        {lockedItems.map((item) => (
          <button className="kp-side-item is-locked" type="button" disabled key={item.label}>
            <LineIcon name={item.icon} />
            <span>{item.label}</span>
            <LineIcon name="lock" className="kp-lock-icon" />
          </button>
        ))}
      </nav>
      <div className="kp-support-mini">
        <span>Hỗ trợ 24/7</span>
        <strong>1900 6789</strong>
      </div>
    </aside>
  );
}

function DetailModal({ room, onClose, onRegister }) {
  if (!room) return null;

  return (
    <div className="kp-modal-backdrop" onMouseDown={onClose}>
      <div className="kp-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="kp-modal-head">
          <div>
            <h2>{room.tenPhong}</h2>
          </div>
          <button type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <div className="kp-modal-grid">
          <div className="kp-modal-media"><RoomVisual room={room} /></div>
          <div className="kp-modal-info">
            <div><span>Mã phòng</span><strong>{room.maPhong}</strong></div>
            <div><span>Loại phòng</span><strong>{room.loaiPhong}</strong></div>
            <div className="is-wide">
              <span>Giá thuê</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {room.giaTheoGiuong != null && <strong className="kp-accent">{formatMoney(room.giaTheoGiuong)}<span>/giường</span></strong>}
                {room.giaNguyenPhong != null && <strong className="kp-accent">{formatMoney(room.giaNguyenPhong)}<span>/căn</span></strong>}
              </div>
            </div>
            <div><span>Sức chứa</span><strong>{room.sucChua} người</strong></div>
            <div><span>Chỗ trống</span><strong>{room.soChoTrong} chỗ</strong></div>
            <div><span>Giới tính cho phép</span><strong>{room.gioiTinhChoPhep}</strong></div>
            <div className="is-wide"><span>Chi nhánh</span><strong>{room.chiNhanh}</strong></div>
            <div className="is-wide"><span>Địa chỉ</span><strong>{room.diaChi}</strong></div>
            {room.moTa && <div className="is-wide"><span>Mô tả</span><p>{room.moTa}</p></div>}
          </div>
        </div>
        <div className="kp-modal-actions">
          <button className="kp-btn kp-btn-soft" type="button" onClick={onClose}>Đóng</button>
          <button className="kp-btn kp-btn-primary" type="button" onClick={onRegister}>Đăng ký nhu cầu thuê</button>
        </div>
      </div>
    </div>
  );
}

export default function KhamPhaPhongPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, dangXuat } = useAuth();
  const initialFilters = useMemo(() => getFiltersFromSearch(location.search), [location.search]);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [rooms, setRooms] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ loaiPhong: [], khuVuc: [] });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setDraftFilters(initialFilters);
    setActiveFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    httpClient.get('/trang-chu/kham-pha-phong/bo-loc')
      .then(({ data }) => setFilterOptions(data.data || { loaiPhong: [], khuVuc: [] }))
      .catch(() => setFilterOptions({ loaiPhong: [], khuVuc: [] }));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    httpClient.get('/trang-chu/kham-pha-phong', { params: compactParams(activeFilters) })
      .then(({ data }) => {
        setRooms(data.data || []);
        setCurrentPage(1);
      })
      .catch((requestError) => {
        setRooms([]);
        setError(requestError.response?.data?.message || 'Không thể tải danh sách phòng lúc này.');
      })
      .finally(() => setLoading(false));
  }, [activeFilters]);

  const areaOptions = useMemo(() => {
    const map = new Map();
    for (const item of filterOptions.khuVuc || []) {
      const label = getAreaLabel(item.diaChi, item.tenChiNhanh);
      if (!map.has(label)) map.set(label, { value: label, label });
    }
    return [{ value: '', label: 'Tất cả khu vực' }, ...Array.from(map.values())];
  }, [filterOptions.khuVuc]);

  const roomTypeOptions = useMemo(() => ([
    { value: '', label: 'Tất cả loại phòng' },
    ...(filterOptions.loaiPhong || []).map((item) => ({
      value: item.tenLoaiPhong,
      label: item.tenLoaiPhong
    }))
  ]), [filterOptions.loaiPhong]);

  const stats = useMemo(() => {
    const prices = rooms.map((room) => Number(room.giaThue)).filter(Number.isFinite);
    const totalSlots = rooms.reduce((sum, room) => sum + Number(room.soChoTrong || 0), 0);
    return {
      totalRooms: rooms.length,
      totalSlots,
      cheapest: prices.length ? Math.min(...prices) : null
    };
  }, [rooms]);

  function updateFilter(name, value) {
    setDraftFilters((current) => ({ ...current, [name]: value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setActiveFilters(draftFilters);
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
  }

  function goRegister() {
    setSelectedRoom(null);
    navigate(user ? '/khach-hang' : '/dang-ky');
  }

  function goLogin() {
    navigate('/dang-nhap', { state: { from: location } });
  }

  return (
    <div className="kp-page">
      <Sidebar user={user} onAuthRequired={goLogin} />
      <div className="kp-app">
        <header className="kp-topbar">
          <div>
            <span className="kp-eyebrow">Khám phá phòng</span>
            <h1>Chào {user?.hoTen || 'bạn'},</h1>
            <p>Tìm không gian sống phù hợp theo khu vực, giá thuê và hình thức ở.</p>
          </div>
          <div className="kp-top-actions">
            {user ? (
              <div className="kp-user-box">
                <span className="kp-avatar">{initials(user.hoTen)}</span>
                <div>
                  <strong>{user.hoTen}</strong>
                  <small>Khách hàng</small>
                </div>
                <button type="button" onClick={dangXuat}>Đăng xuất</button>
              </div>
            ) : (
              <div className="kp-auth-actions">
                <button className="kp-btn kp-btn-ghost" type="button" onClick={goLogin}>Đăng nhập</button>
                <button className="kp-btn kp-btn-primary" type="button" onClick={() => navigate('/dang-ky')}>Đăng ký</button>
              </div>
            )}
          </div>
        </header>

        <main className="kp-main">
          <div className="kp-grid">
            <section className="kp-content" aria-label="Danh sách phòng khám phá">
              <form className="kp-filter-panel" onSubmit={applyFilters}>
                <label className="kp-keyword">
                  <LineIcon name="search" />
                  <input
                    type="search"
                    placeholder="Tìm theo tên phòng, chi nhánh, khu vực..."
                    value={draftFilters.tuKhoa}
                    onChange={(event) => updateFilter('tuKhoa', event.target.value)}
                  />
                </label>
                <div className="kp-filter-grid">
                  <FilterSelect
                    label="Khu vực"
                    value={draftFilters.khuVuc}
                    options={areaOptions}
                    onChange={(value) => updateFilter('khuVuc', value)}
                  />
                  <FilterSelect
                    label="Loại phòng"
                    value={draftFilters.loaiPhong}
                    options={roomTypeOptions}
                    onChange={(value) => updateFilter('loaiPhong', value)}
                  />
                  <FilterSelect
                    label="Mức giá"
                    value={draftFilters.mucGiaToiDa}
                    options={PRICE_OPTIONS}
                    onChange={(value) => updateFilter('mucGiaToiDa', value)}
                  />
                  <div className="kp-filter-actions">
                    <button className="kp-btn kp-btn-primary" type="submit"><LineIcon name="search" />Tìm</button>
                    <button className="kp-btn kp-btn-soft" type="button" onClick={resetFilters}>Xóa lọc</button>
                  </div>
                </div>
              </form>

              <div className="kp-result-head">
                <div>
                  <span className="kp-eyebrow">Phòng khả dụng</span>
                  <h2>{loading ? 'Đang tải phòng' : `${rooms.length} phòng phù hợp`}</h2>
                </div>
                <p>Dữ liệu lọc trực tiếp từ bảng phòng, loại phòng, chi nhánh và giường.</p>
              </div>

              {error && <div className="kp-message error">{error}</div>}
              {loading && (
                <div className="kp-loading">
                  <span />
                  <p>Đang tải danh sách phòng...</p>
                </div>
              )}
              {!loading && !error && rooms.length > 0 && (() => {
                const totalPages = Math.ceil(rooms.length / ITEMS_PER_PAGE);
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const currentRooms = rooms.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                
                return (
                  <>
                    <div className="kp-room-grid">
                      {currentRooms.map((room) => (
                        <RoomCard
                          key={room.maPhong}
                          room={room}
                          onViewDetail={setSelectedRoom}
                          onRegister={goRegister}
                        />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="kp-pagination">
                        <button 
                          className="kp-btn kp-btn-ghost" 
                          disabled={currentPage === 1}
                          onClick={() => {
                            setCurrentPage(p => Math.max(1, p - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Trước
                        </button>
                        <span className="kp-page-info">Trang {currentPage} / {totalPages}</span>
                        <button 
                          className="kp-btn kp-btn-ghost" 
                          disabled={currentPage === totalPages}
                          onClick={() => {
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
              {!loading && !error && !rooms.length && (
                <div className="kp-empty">
                  <LineIcon name="search" />
                  <strong>Không có phòng phù hợp</strong>
                  <p>Đổi khu vực, hình thức thuê hoặc mức giá để tìm thêm lựa chọn từ dữ liệu hiện có.</p>
                </div>
              )}
            </section>

            <aside className="kp-rightbar" aria-label="Thông tin hỗ trợ">
              <div className="kp-info-panel">
                <h3>Tổng quan kết quả</h3>
                <div className="kp-stat-list">
                  <div><span>Phòng đang hiển thị</span><strong>{stats.totalRooms}</strong></div>
                  <div><span>Chỗ trống</span><strong>{stats.totalSlots}</strong></div>
                  <div><span>Giá thấp nhất</span><strong>{stats.cheapest ? formatMoney(stats.cheapest) : 'Liên hệ'}</strong></div>
                </div>
              </div>
              <div className="kp-info-panel">
                <h3><LineIcon name="profile" />Bạn muốn thuê phòng?</h3>
                <p>Gửi nhu cầu thuê để nhân viên sale tư vấn phòng phù hợp nhất với lựa chọn của bạn.</p>
                <button className="kp-btn kp-btn-primary kp-full" type="button" onClick={goRegister}>Đăng ký nhu cầu thuê</button>
              </div>
              <div className="kp-support-panel">
                <div>
                  <h3>Cần tư vấn thêm?</h3>
                  <p>Chuyên viên HomestayDorm sẽ hỗ trợ chọn phòng theo nhu cầu.</p>
                  <button className="kp-btn kp-btn-light kp-full" type="button"><LineIcon name="phone" />Liên hệ ngay</button>
                </div>
                <LineIcon name="phone" className="kp-support-watermark" />
              </div>
            </aside>
          </div>
        </main>

        <footer className="kp-footer">
          <Brand />
          <div>
            <Link to="/">Trang chủ</Link>
            <button type="button" onClick={goRegister}>Đăng ký thuê</button>
            <button type="button" onClick={goLogin}>Hồ sơ</button>
          </div>
        </footer>
      </div>

      <nav className="kp-mobile-nav" aria-label="Điều hướng mobile">
        <button className="is-active" type="button"><LineIcon name="explore" /><span>Khám phá</span></button>
        <button type="button" onClick={goRegister}><LineIcon name="profile" /><span>Hồ sơ</span></button>
        <button type="button" onClick={goRegister}><LineIcon name="calendar" /><span>Lịch xem</span></button>
        <button type="button" onClick={goLogin}><LineIcon name="logo" /><span>Tài khoản</span></button>
      </nav>

      <DetailModal room={selectedRoom} onClose={() => setSelectedRoom(null)} onRegister={goRegister} />
    </div>
  );
}
