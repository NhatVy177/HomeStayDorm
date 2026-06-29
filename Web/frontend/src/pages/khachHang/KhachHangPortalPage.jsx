import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { khachMoiApi } from '../khachMoi/khachMoi.api.js';
import '../khamPhaPhong/khamPhaPhong.css';
import './khachHangPortal.css';
import LichXemPhongPage from '../lichXemPhong/LichXemPhongPage.jsx';

const filtersInitial = { tuKhoa: '', khuVuc: '', loaiPhong: '', mucGiaToiDa: '' };
const rentInitial = {
  hoTen: '',
  ngaySinh: '',
  gioiTinh: '',
  soDienThoai: '',
  email: '',
  quocTich: '',
  cccd: '',
  khuVucMongMuon: '',
  loaiPhongYeuCau: '',
  mucGiaToiDa: '',
  soNguoiO: '1',
  gioiTinhThue: 'Không xác định',
  ngayDuKienVaoO: '',
  thoiHanThue: '',
  ghiChu: ''
};

const filterOptions = {
  khuVuc: ['', 'Quận 1', 'Bình Thạnh', 'Thủ Đức'],
  loaiPhong: ['', 'Phòng 2 người', 'Phòng 4 người', 'Phòng 6 người', 'Phòng VIP 2 người'],
  mucGiaToiDa: [
    { value: '', label: 'Tất cả mức giá' },
    { value: '1500000', label: 'Dưới 1,5 triệu' },
    { value: '2000000', label: 'Dưới 2 triệu' },
    { value: '3000000', label: 'Dưới 3 triệu' },
    { value: '3500000', label: 'Dưới 3,5 triệu' }
  ]
};

const DEMO_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=85'
];

function Icon({ name, className = '' }) {
  const shapes = {
    home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10.4V20h13v-9.6" /><path d="M9.5 20v-5.8h5V20" /></>,
    explore: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.4 5.1-5.1 2.4 2.4-5.1 5.1-2.4Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    profile: <><path d="M7 4h7l3 3v13H7z" /><path d="M14 4v4h4M10 13h4M10 17h4" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></>,
    deposit: <><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M3.5 10h17M7 14h4" /></>,
    contract: <><path d="M6 3.8h8l4 4V20H6z" /><path d="M14 4v5h5M9 13h6M9 17h6" /></>,
    invoice: <><path d="M7 4h10v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2z" /><path d="M10 9h4M10 13h4M10 17h2" /></>,
    repair: <path d="M14.5 6.2a4.2 4.2 0 0 0-5.2 5.2L4 16.7 7.3 20l5.3-5.3a4.2 4.2 0 0 0 5.2-5.2l-2.9 2.9-2.3-2.3z" />,
    support: <><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    room: <><path d="M4 20V8.5L12 4l8 4.5V20" /><path d="M8 20v-7h8v7M9 9.5h.01M15 9.5h.01" /></>,
    layers: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 12 8 4.5 8-4.5" /><path d="m4 16.5 8 4.5 8-4.5" /></>,
    tile: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>,
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></>,
    map: (
      <>
        <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>
  };

  return (
    <svg className={`kp-line-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {shapes[name] || shapes.home}
    </svg>
  );
}

function initials(name = '') {
  return String(name).split(' ').filter(Boolean).slice(-2).map((word) => word.charAt(0)).join('').toUpperCase() || 'KH';
}

function formatMoney(value, unit = 'tháng') {
  const amount = Number(value);
  if (value == null || value === '' || !Number.isFinite(amount) || amount <= 0) return 'Chưa cập nhật';
  return amount.toLocaleString('vi-VN') + 'đ/' + unit;
}

function formatServiceMoney(value, unit) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Chưa cập nhật';
  return `${amount.toLocaleString('vi-VN')}đ${unit ? `/${unit}` : ''}`;
}

function formatDate(value, withTime = false) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(new Date(value));
}

function getArea(room = {}) {
  const parts = String(room.diaChi || '').split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 2];
  return room.chiNhanh || 'Chưa cập nhật';
}

function getRoomFloor(maPhong) {
  const numberPart = String(maPhong || '').match(/\d+/)?.[0];
  const roomNumber = Number(numberPart);
  if (!Number.isFinite(roomNumber) || roomNumber < 100) return null;
  return Math.floor(roomNumber / 100);
}

function getDemoRoomImage(maPhong, index = 0) {
  const numberPart = String(maPhong || '').match(/\d+/)?.[0];
  const offset = Number(numberPart || 0);
  return DEMO_ROOM_IMAGES[(offset + index) % DEMO_ROOM_IMAGES.length];
}

function unwrapApiPayload(payload) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.data && typeof payload.data === 'object') {
    return payload.data;
  }
  return payload || {};
}

function normalizeImageItems(source) {
  const rawImages = Array.isArray(source)
    ? source
    : (source?.hinhAnh || source?.hinhAnhs || source?.anh || source?.images || source?.danhSachAnh || []);
  const images = Array.isArray(rawImages) ? rawImages : [];

  return images
    .map((image, index) => {
      const urlAnh = image?.urlAnh || image?.urlImg || image?.UrlImg || image?.UrlAnh || image?.url || image?.duongDan;
      if (!urlAnh) return null;
      return {
        stt: image?.stt || image?.STTAnh || image?.sttAnh || image?.id || index + 1,
        urlAnh,
        moTa: image?.moTa || image?.MoTa || image?.alt || ''
      };
    })
    .filter(Boolean);
}

function normalizeRoomDetail(payload, fallback = {}) {
  const raw = unwrapApiPayload(payload);
  const merged = { ...fallback, ...raw };
  const images = normalizeImageItems(merged);
  const fallbackImage = merged.anhDai || merged.urlImg || merged.urlAnh || merged.UrlImg || merged.UrlAnh;

  const maPhong = merged.maPhong || merged.MaPhong || merged.id || fallback.maPhong || fallback.MaPhong || fallback.id || '';
  const tenPhong = merged.tenPhong || merged.TenPhong || fallback.tenPhong || fallback.TenPhong || maPhong;
  const giaThue = merged.giaThue ?? merged.GiaThue ?? merged.giaThueHangThang ?? merged.giaThueTheoGiuong ?? fallback.giaThue ?? fallback.GiaThue ?? null;
  const normalizedImages = images.map((image, index) => ({
    ...image,
    fallbackUrl: image.fallbackUrl || getDemoRoomImage(maPhong, index)
  }));
  const demoImages = DEMO_ROOM_IMAGES.map((_, index) => ({
    stt: index + 1,
    urlAnh: getDemoRoomImage(maPhong, index),
    moTa: `${tenPhong} - ảnh minh họa ${index + 1}`,
    laAnhDemo: true
  }));
  const fallbackImages = fallbackImage
    ? [
        { stt: 1, urlAnh: fallbackImage, moTa: tenPhong || '', fallbackUrl: getDemoRoomImage(maPhong, 0) },
        ...DEMO_ROOM_IMAGES.slice(1).map((_, index) => ({
          stt: index + 2,
          urlAnh: getDemoRoomImage(maPhong, index + 1),
          moTa: `${tenPhong} - ảnh minh họa ${index + 2}`,
          laAnhDemo: true
        }))
      ]
    : demoImages;
  const hinhAnh = normalizedImages.length ? normalizedImages : fallbackImages;
  const tienNghi = Array.isArray(merged.tienNghi)
    ? merged.tienNghi
    : (Array.isArray(merged.taiSan) ? merged.taiSan : []);
  const dichVuUocTinh = Array.isArray(merged.dichVuUocTinh) ? merged.dichVuUocTinh : [];

  return {
    ...merged,
    id: merged.id || maPhong,
    maPhong,
    tenPhong,
    gioiTinhChoPhep: merged.gioiTinhChoPhep || merged.GioiTinhChoPhep || fallback.gioiTinhChoPhep || '',
    hinhThucThue: merged.hinhThucThue || merged.HinhThucThue || fallback.hinhThucThue || '',
    loaiPhong: merged.loaiPhong || merged.TenLoaiPhong || merged.loaiPhongYeuCau || fallback.loaiPhong || '',
    moTa: merged.moTa || merged.MoTa || fallback.moTa || '',
    sucChua: merged.sucChua ?? merged.SucChuaToiDa ?? merged.toiDa ?? fallback.sucChua ?? '',
    tang: merged.tang ?? merged.Tang ?? fallback.tang ?? getRoomFloor(maPhong),
    giaThue,
    giaThueTheoGiuong: merged.giaThueTheoGiuong ?? merged.GiaThueTheoGiuong ?? fallback.giaThueTheoGiuong,
    chiNhanh: merged.chiNhanh || merged.TenChiNhanh || fallback.chiNhanh || '',
    diaChi: merged.diaChi || merged.DiaChi || fallback.diaChi || '',
    anhDai: merged.anhDai || hinhAnh[0]?.urlAnh || fallback.anhDai,
    hinhAnh,
    tienNghi,
    dichVuUocTinh
  };
}

function statusTone(status = '') {
  if (['Chấp nhận', 'Đã xem', 'Đã lên lịch', 'Đã TT', 'Hiệu lực', 'Đã tiếp nhận', 'Chờ xác nhận cọc'].includes(status)) return 'done';
  if (['Từ chối', 'Đã hủy', 'Yêu cầu hủy', 'Hết hạn'].includes(status)) return 'danger';
  return 'warn';
}

function statusIcon(status = '') {
  if (['Chấp nhận', 'Đã xem', 'Đã tiếp nhận', 'Chờ xác nhận cọc'].includes(status)) return '✅';
  if (['Từ chối', 'Đã hủy'].includes(status)) return '❌';
  if (status === 'Chờ tiếp nhận') return '⏳';
  if (status === 'Đã tiếp nhận') return '📥';
  return '⏳';
}

function getNavLocks(state = {}) {
  const hasProfile = Number(state.soHoSo || 0) > 0;
  const hasSchedule = Number(state.soLichXem || 0) > 0;
  const hasDeposit = Number(state.soPhieuCoc || 0) > 0;
  const hasContract = Number(state.soHopDong || 0) > 0;

  return {
    'kham-pha': false,
    'ho-so': false,
    'lich-xem': !hasSchedule,
    'dat-coc': !hasDeposit,
    'hop-dong': !hasContract,
    'hoa-don': !hasContract,
    'bao-tri': !hasContract,
    'tai-khoan': false,
    hasProfile,
    hasSchedule,
    hasDeposit,
    hasContract
  };
}

function getLockedMessage(tab) {
  const messages = {
    'lich-xem': 'Lịch xem phòng sẽ mở khi nhân viên tạo lịch xem cho hồ sơ của bạn.',
    'dat-coc': 'Đặt cọc sẽ mở khi hồ sơ được duyệt và có phiếu đặt cọc.',
    'hop-dong': 'Hợp đồng sẽ mở sau khi đặt cọc được xử lý và hợp đồng được lập.',
    'hoa-don': 'Hóa đơn sẽ mở sau khi bạn có hợp đồng thuê hiệu lực.',
    'bao-tri': 'Bảo trì chỉ mở khi bạn đã nhận phòng hoặc có hợp đồng thuê.'
  };
  return messages[tab] || 'Chức năng này chưa khả dụng ở bước hiện tại.';
}

function firstName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || 'bạn';
}

function displayValue(value, fallback = 'Chưa cập nhật') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

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

function Empty({ title, children, action }) {
  return (
    <div className="kh-empty">
      <Icon name="lock" />
      <strong>{title}</strong>
      <p>{children}</p>
      {action}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="kh-select-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const normalized = typeof option === 'string' ? { value: option, label: option || 'Tất cả' } : option;
          return <option key={normalized.value || normalized.label} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
    </label>
  );
}

function RoomPhoto({ room }) {
  const [failed, setFailed] = useState(false);
  const src = room.anhDai || room.urlImg || room.urlAnh || room.hinhAnh?.[0]?.urlAnh;
  const fallbackSrc = getDemoRoomImage(room.maPhong || room.id, 0);

  if (!src && !fallbackSrc) {
    return <div className="kh-room-placeholder"><Icon name="room" /><span>{room.maPhong}</span></div>;
  }

  return <img src={failed ? fallbackSrc : (src || fallbackSrc)} alt={room.tenPhong} onError={() => setFailed(true)} />;
}

function GalleryPhoto({ urlAnh, fallbackUrl, moTa, index }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? fallbackUrl : (urlAnh || fallbackUrl);

  if (!src) {
    return (
      <div className="kh-gallery-placeholder">
        <Icon name="room" />
      </div>
    );
  }

  return <img src={src} alt={moTa || `Ảnh ${index + 1}`} onError={() => setFailed(true)} loading="lazy" />;
}

function ChiTietPhongView({ phong, onBack, onRent }) {
  const [lightbox, setLightbox] = useState(null);
  const anh = phong.hinhAnh || [];
  const tienNghi = phong.tienNghi || [];
  const dichVuUocTinh = phong.dichVuUocTinh || [];
  const mainAnh = anh[0];
  const extraAnh = anh.slice(1, 5);

  return (
    <section className="kh-detail-view">
      <button className="kh-detail-back" type="button" onClick={onBack}>
        <Icon name="explore" />← Quay lại khám phá phòng
      </button>

      <div className="kh-detail-header">
        <h1 className="kh-detail-title">{phong.tenPhong}</h1>
        <p className="kh-detail-addr"><Icon name="map" />{phong.diaChi}</p>
      </div>

      {/* Gallery */}
      <div className="kh-gallery-grid">
        <div className="kh-gallery-main" onClick={() => mainAnh && setLightbox(0)}>
          {mainAnh
            ? <GalleryPhoto urlAnh={mainAnh.urlAnh} fallbackUrl={mainAnh.fallbackUrl} moTa={mainAnh.moTa || phong.tenPhong} index={0} />
            : <div className="kh-gallery-placeholder"><Icon name="room" /></div>}
        </div>
        <div className="kh-gallery-thumbs">
          {extraAnh.map((img, idx) => (
            <div key={img.stt} className="kh-gallery-thumb" onClick={() => setLightbox(idx + 1)}>
              <GalleryPhoto urlAnh={img.urlAnh} fallbackUrl={img.fallbackUrl} moTa={img.moTa} index={idx + 1} />
              {idx === 3 && anh.length > 5 && (
                <div className="kh-gallery-more">+{anh.length - 5} ảnh</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Body grid */}
      <div className="kh-detail-body">
        <div className="kh-detail-left">
          {/* Thông tin chung */}
          <div className="kh-detail-section">
            <h2>Thông tin chung</h2>
            <div className="kh-detail-stats">
              <div>
                <Icon name="people" />
                <span>Hình thức thuê</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  {phong.giaTheoGiuong != null && <strong>{formatMoney(phong.giaTheoGiuong, 'giường')}</strong>}
                  {phong.giaNguyenPhong != null && <strong>{formatMoney(phong.giaNguyenPhong, 'căn')}</strong>}
                </div>
              </div>
              <div>
                <Icon name="people" />
                <span>Tối đa</span>
                <strong>{phong.sucChua} Người</strong>
              </div>
              {phong.tang != null && (
                <div>
                  <Icon name="layers" />
                  <span>Tầng</span>
                  <strong>Tầng {phong.tang}</strong>
                </div>
              )}
              <div>
                <Icon name="people" />
                <span>Giới tính</span>
                <strong>{phong.gioiTinhChoPhep}</strong>
              </div>
            </div>
            {phong.moTa && <p className="kh-detail-mota">{phong.moTa}</p>}
          </div>

          {tienNghi.length > 0 && (
            <div className="kh-detail-section">
              <h2>Tiện nghi phòng</h2>
              <div className="kh-amenity-list">
                {tienNghi.map((item) => (
                  <div key={item.maTaiSan || item.tenTienNghi || item.tenTaiSan}>
                    <Icon name="check" />
                    <span>{item.tenTienNghi || item.tenTaiSan}</span>
                    {Number(item.soLuong) > 1 && <small>x{item.soLuong}</small>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tat ca anh */}
          {anh.length > 0 && (
            <div className="kh-detail-section">
              <h2>Tất cả hình ảnh ({anh.length})</h2>
              <div className="kh-all-photos">
                {anh.map((img, idx) => (
                  <div key={img.stt} className="kh-all-photo-item" onClick={() => setLightbox(idx)}>
                    <GalleryPhoto urlAnh={img.urlAnh} fallbackUrl={img.fallbackUrl} moTa={img.moTa} index={idx} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="kh-detail-sidebar">
          <div className="kh-detail-price-card">
            <div className="kh-detail-price-top">
              <span>Giá thuê</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {phong.giaTheoGiuong != null && <strong>{formatMoney(phong.giaTheoGiuong, 'giường')}</strong>}
                {phong.giaNguyenPhong != null && <strong>{formatMoney(phong.giaNguyenPhong, 'căn')}</strong>}
              </div>
            </div>
            {dichVuUocTinh.length > 0 && (
              <div className="kh-detail-service-list">
                <h3>Chi phí dịch vụ ước tính</h3>
                {dichVuUocTinh.map((item) => (
                  <div className="kh-detail-service-row" key={item.maDichVu || item.tenDichVu}>
                    <span>{item.tenDichVu}</span>
                    <strong>{formatServiceMoney(item.donGia, item.donViTinh)}</strong>
                  </div>
                ))}
              </div>
            )}
            <button className="kp-btn kp-btn-primary kp-full kh-detail-cta kh-detail-register" type="button" onClick={() => onRent(phong)}>
              Đăng ký thuê ngay
            </button>
            <a className="kp-btn kp-full kh-detail-cta kh-detail-contact" href="tel:19006789">
              <Icon name="support" />Liên hệ tư vấn
            </a>
            <div className="kh-detail-note">
              <Icon name="info" />
              <span>Có thể dọn vào ngày sau khi ký hợp đồng và đóng cọc.</span>
            </div>
          </div>

          <div className="kh-detail-info-card">
            <div><span>Chi nhánh</span><strong>{phong.chiNhanh || 'Chưa cập nhật'}</strong></div>
            <div><span>Mã phòng</span><strong>{phong.maPhong}</strong></div>
          </div>
        </aside>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="kh-lightbox" onClick={() => setLightbox(null)}>
          <button className="kh-lightbox-close" type="button" onClick={() => setLightbox(null)}>✕</button>
          <button className="kh-lightbox-prev" type="button" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + anh.length) % anh.length); }}>‹</button>
          <div className="kh-lightbox-img" onClick={(e) => e.stopPropagation()}>
            <img
              src={anh[lightbox]?.urlAnh || anh[lightbox]?.fallbackUrl}
              alt={anh[lightbox]?.moTa || ''}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = anh[lightbox]?.fallbackUrl || getDemoRoomImage(phong.maPhong, lightbox);
              }}
            />
            {anh[lightbox]?.moTa && <p>{anh[lightbox].moTa}</p>}
          </div>
          <button className="kh-lightbox-next" type="button" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % anh.length); }}>›</button>
        </div>
      )}
    </section>
  );
}

export default function KhachHangPortalPage() {
  const { user, dangXuat } = useAuth();
  const [activeTab, setActiveTab] = useState('kham-pha');
  const [detailPhong, setDetailPhong] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(filtersInitial);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [rentModal, setRentModal] = useState(false);
  const [rentForm, setRentForm] = useState(rentInitial);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editModal, setEditModal] = useState(null); // profile being edited
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [profileDetailModal, setProfileDetailModal] = useState(null);
  const [profileDetailLoading, setProfileDetailLoading] = useState(false);
  const [scheduleDetailModal, setScheduleDetailModal] = useState(null);
  const [scheduleDetailLoading, setScheduleDetailLoading] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [datCocList, setDatCocList] = useState(null);
  const [datCocLoading, setDatCocLoading] = useState(false);
  const [datCocSelected, setDatCocSelected] = useState(null);
  const [uploadForm, setUploadForm] = useState({ maGiaoDich: '', ngayGiaoDich: '', nganHang: '', ghiChu: '', fileBase64: '', fileName: '' });
  const [uploading, setUploading] = useState(false);
  const [profileFilter, setProfileFilter] = useState('Tất cả');
  const [datCocFilter, setDatCocFilter] = useState('Tất cả');
  const [hopDongDashboard, setHopDongDashboard] = useState(null);
  const [hopDongLoading, setHopDongLoading] = useState(false);

  const locks = getNavLocks(overview?.trangThai || {});

  const navItems = [
    { id: 'kham-pha', icon: 'explore', title: 'Khám phá phòng' },
    { id: 'ho-so', icon: 'profile', title: 'Hồ sơ đăng ký' },
    { id: 'lich-xem', icon: 'calendar', title: 'Lịch xem phòng' },
    { id: 'dat-coc', icon: 'deposit', title: 'Đặt cọc' },
    { id: 'hop-dong', icon: 'contract', title: 'Hợp đồng' },
    { id: 'hoa-don', icon: 'invoice', title: 'Hóa đơn' },
    { id: 'bao-tri', icon: 'repair', title: 'Bảo trì' }
  ];

  async function loadPortal(nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const [{ data: summary }, { data: availableRooms }] = await Promise.all([
        khachMoiApi.getTongQuan(),
        khachMoiApi.getPhongKhaDung(nextFilters)
      ]);
      setOverview(summary);
      setRooms(availableRooms || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải cổng khách hàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortal(filtersInitial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  function goTo(tab) {
    if (locks[tab]) {
      setToast(getLockedMessage(tab));
      return;
    }
    setDetailPhong(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openRoomDetail(room) {
    const fallbackRoom = normalizeRoomDetail(room);
    const maPhong = fallbackRoom.maPhong;

    if (!maPhong) {
      setDetailPhong(fallbackRoom);
      return;
    }

    setDetailLoading(true);
    setDetailPhong(fallbackRoom);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const { data } = await khachMoiApi.getChiTietPhong(maPhong);
      setDetailPhong(normalizeRoomDetail(data, fallbackRoom));
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể tải chi tiết phòng lúc này.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function logout() {
    await dangXuat();
  }

  async function applyFilters(event) {
    event.preventDefault();
    setSelectedRooms([]);
    await loadPortal(filters);
  }

  function toggleRoom(room) {
    setSelectedRooms((current) => (
      current.some((item) => item.id === room.id)
        ? current.filter((item) => item.id !== room.id)
        : [...current, room]
    ));
  }

  function getRentDefaultsFromUser() {
    return {
      ...rentInitial,
      hoTen: user?.hoTen || '',
      ngaySinh: user?.ngaySinh ? String(user.ngaySinh).slice(0, 10) : '',
      gioiTinh: user?.gioiTinh || '',
      soDienThoai: user?.soDienThoai || '',
      email: user?.email || '',
      quocTich: user?.quocTich || 'Việt Nam',
      cccd: user?.cccd || user?.soCCCD || user?.cmnd || ''
    };
  }

  function openRentForm(room) {
    const selected = room ? [room] : selectedRooms;
    if (!selected.length) {
      setToast('Chọn ít nhất một phòng trước khi gửi nhu cầu thuê.');
      return;
    }
    const firstRoom = selected[0];
    setSelectedRooms(selected);
    setRentForm({
      ...getRentDefaultsFromUser(),
      khuVucMongMuon: getArea(firstRoom),
      loaiPhongYeuCau: firstRoom.loaiPhong || '',
      mucGiaToiDa: firstRoom.giaThue ? String(firstRoom.giaThue) : '',
      gioiTinhThue: firstRoom.gioiTinhChoPhep || rentInitial.gioiTinhThue
    });
    setRentModal(true);
  }

  function openReRegisterForm(profile) {
    setSelectedRooms([]);
    setRentForm({
      ...getRentDefaultsFromUser(),
      khuVucMongMuon: profile.khuVucMongMuon || '',
      loaiPhongYeuCau: profile.loaiPhongYeuCau || '',
      mucGiaToiDa: profile.mucGiaToiDa || '',
      soNguoiO: profile.soNguoiO || '1',
      gioiTinhThue: profile.gioiTinh || 'Không xác định',
      ngayDuKienVaoO: profile.ngayDuKienVaoO ? profile.ngayDuKienVaoO.slice(0, 10) : '',
      thoiHanThue: profile.thoiHanThue || '',
      ghiChu: profile.ghiChu || ''
    });
    setRentModal(true);
  }

  function openGeneralRentForm() {
    setSelectedRooms([]);
    setRentForm(getRentDefaultsFromUser());
    setRentModal(true);
  }

  async function submitRent(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await khachMoiApi.createHoSo({
        ...rentForm,
        phongQuanTam: selectedRooms.map((room) => room.tenPhong).join(', '),
        mucGiaToiDa: rentForm.mucGiaToiDa || '',
        gioiTinhThue: rentForm.gioiTinhThue !== 'Không xác định' ? rentForm.gioiTinhThue : null,
        ghiChu: rentForm.ghiChu || ''
      });
      setRentModal(false);
      setSelectedRooms([]);
      await loadPortal(filters);
      setActiveTab('ho-so');
      setToast('Đã gửi hồ sơ nhu cầu thuê.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể gửi hồ sơ lúc này.');
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(profile) {
    setEditForm({
      hoTen: profile.hoTen || user?.hoTen || '',
      ngaySinh: profile.ngaySinh ? String(profile.ngaySinh).slice(0, 10) : (user?.ngaySinh ? String(user.ngaySinh).slice(0, 10) : ''),
      gioiTinh: profile.gioiTinh || user?.gioiTinh || '',
      soDienThoai: profile.soDienThoai || user?.soDienThoai || '',
      email: profile.email || user?.email || '',
      quocTich: profile.quocTich || user?.quocTich || 'Việt Nam',
      cccd: profile.cccd || profile.soCCCD || user?.cccd || user?.soCCCD || user?.cmnd || '',
      khuVucMongMuon: profile.khuVucMongMuon || '',
      loaiPhongYeuCau: profile.loaiPhongYeuCau || '',
      mucGiaToiDa: profile.mucGiaToiDa || '',
      soNguoiO: profile.soNguoiO || 1,
      ngayDuKienVaoO: profile.ngayDuKienVaoO ? profile.ngayDuKienVaoO.slice(0, 10) : '',
      thoiHanThue: profile.thoiHanThue || '',
      ghiChu: profile.ghiChu || ''
    });
    setEditModal(profile);
  }

  async function openProfileDetail(profile) {
    if (!profile?.maDangKy) return;

    setProfileDetailModal(profile);
    setProfileDetailLoading(true);
    try {
      const { data } = await khachMoiApi.getHoSoDetail(profile.maDangKy);
      const detail = unwrapApiPayload(data);
      setProfileDetailModal({
        ...profile,
        ...detail,
        maDangKy: detail.maDangKy || detail.MaDangKy || profile.maDangKy,
        ngayDangKy: detail.ngayDangKy || detail.NgayDangKy || profile.ngayDangKy,
        hinhThucThue: detail.hinhThucThue || detail.HinhThucThue || profile.hinhThucThue,
        khuVucMongMuon: detail.khuVucMongMuon || detail.KhuVucMongMuon || profile.khuVucMongMuon,
        loaiPhongYeuCau: detail.loaiPhongYeuCau || detail.LoaiPhongYeuCau || profile.loaiPhongYeuCau,
        mucGia: detail.mucGia ?? detail.MucGia ?? profile.mucGia,
        mucGiaDen: detail.mucGiaDen ?? detail.MucGiaDen ?? profile.mucGiaDen,
        soNguoiO: detail.soNguoiO ?? detail.SoNguoiO ?? profile.soNguoiO,
        ngayDuKienVaoO: detail.ngayDuKienVaoO || detail.NgayDuKienVaoO || profile.ngayDuKienVaoO,
        thoiHanThue: detail.thoiHanThue ?? detail.ThoiHanThue ?? profile.thoiHanThue,
        ghiChu: detail.ghiChu || detail.GhiChu || profile.ghiChu,
        trangThai: detail.trangThai || detail.TrangThai || profile.trangThai
      });
    } catch {
      setToast('Đang hiển thị thông tin hiện có của hồ sơ.');
    } finally {
      setProfileDetailLoading(false);
    }
  }

  async function openScheduleDetail(schedule) {
    if (!schedule?.id) return;
    setScheduleDetailModal(schedule);
    setScheduleDetailLoading(true);
    try {
      const { data } = await khachMoiApi.getLichXemDetail(schedule.id);
      const detail = unwrapApiPayload(data);
      setScheduleDetailModal({ ...schedule, ...detail });
    } catch {
      setToast('Đang hiển thị thông tin hiện có của lịch xem.');
    } finally {
      setScheduleDetailLoading(false);
    }
  }

  async function submitEditModal(event) {
    event.preventDefault();
    setEditSaving(true);
    try {
      await khachMoiApi.updateHoSo(editModal.maDangKy, {
        ...editForm,
        mucGia: editForm.mucGiaTu || '',
        mucGiaDen: editForm.mucGiaDen || '',
      });
      setEditModal(null);
      await loadPortal(filters);
      setToast('Đã cập nhật hồ sơ thành công.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể cập nhật hồ sơ lúc này.');
    } finally {
      setEditSaving(false);
    }
  }

  function renderLocked(tab) {
    return (
      <Empty title="Chức năng đang khóa" action={<button className="kp-btn kp-btn-primary" type="button" onClick={() => goTo('kham-pha')}>Khám phá phòng</button>}>
        {getLockedMessage(tab)}
      </Empty>
    );
  }

  function renderExplore() {
    return (
      <section className="kh-explore-view">
        <div className="kh-shell-grid">
          <div className="kh-left-content">
            <form className="kh-filter-panel" onSubmit={applyFilters}>
              <label className="kh-keyword">
                <Icon name="search" />
                <input value={filters.tuKhoa} onChange={(event) => setFilters({ ...filters, tuKhoa: event.target.value })} placeholder="Tìm theo khu vực, tên tòa nhà..." />
              </label>
              <div className="kh-filter-controls">
                <SelectField label="Khu vực" value={filters.khuVuc} options={filterOptions.khuVuc} onChange={(value) => setFilters({ ...filters, khuVuc: value })} />
                <SelectField label="Loại phòng" value={filters.loaiPhong} options={filterOptions.loaiPhong} onChange={(value) => setFilters({ ...filters, loaiPhong: value })} />
                <SelectField label="Mức giá" value={filters.mucGiaToiDa} options={filterOptions.mucGiaToiDa} onChange={(value) => setFilters({ ...filters, mucGiaToiDa: value })} />
                <button className="kp-btn kp-btn-primary kh-filter-submit" type="submit"><Icon name="search" />Tìm</button>
              </div>
            </form>

            <div className="kh-room-count">{rooms.length} phòng</div>
            <div className="kh-room-grid">
              {rooms.map((room) => {
                const checked = selectedRooms.some((item) => item.id === room.id);
                return (
                  <article className={`kh-room-card ${checked ? 'selected' : ''}`} key={room.id}>
                    <div className="kh-room-media">
                      <RoomPhoto room={room} />
                    </div>
                    <div className="kh-room-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{room.tenPhong}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          {room.giaTheoGiuong != null && <strong>{formatMoney(room.giaTheoGiuong, 'giường')}</strong>}
                          {room.giaNguyenPhong != null && <strong>{formatMoney(room.giaNguyenPhong, 'căn')}</strong>}
                        </div>
                      </div>
                      <p className="kh-room-location"><Icon name="explore" />{getArea(room)}</p>
                      <p>{room.moTa || 'Chưa có mô tả chi tiết.'}</p>
                      <div className="kh-pills"><span>{room.loaiPhong}</span><span>{room.hinhThucThue}</span></div>
                      <div className="kh-room-actions">
                        <button className="kp-btn kp-btn-soft kp-full" type="button" onClick={() => openRoomDetail(room)}>Xem chi tiết</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {!rooms.length && <Empty title="Không có phòng phù hợp">Thử đổi khu vực, hình thức thuê hoặc mức giá.</Empty>}
            {!!selectedRooms.length && (
              <div className="kh-sticky-action">
                <span>Đã chọn {selectedRooms.length} phòng</span>
                <button className="kp-btn kp-btn-primary" type="button" onClick={() => openRentForm()}>Gửi nhu cầu thuê</button>
              </div>
            )}
          </div>

          <aside className="kh-rightbar">
            <article className="kh-rent-help">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '16px' }}>
                <Icon name="support" />Bạn muốn thuê phòng?
              </h3>
              <div style={{ backgroundColor: 'var(--kp-accent-soft)', padding: '16px', borderRadius: '12px' }}>
                <p style={{ color: 'var(--kp-accent-dark)', fontSize: '12px', marginBottom: '16px', lineHeight: '1.5' }}>
                  Gửi nhu cầu thuê, nhân viên sale sẽ tư vấn phòng phù hợp nhất cho bạn.
                </p>
                <button className="kp-btn kp-btn-primary kp-full" type="button" onClick={openGeneralRentForm} style={{ backgroundColor: 'var(--kp-accent)' }}>
                  <Icon name="profile" />Đăng ký nhu cầu thuê
                </button>
              </div>
            </article>

            <article className="kh-support-card">
              <div>
                <h3>Cần tư vấn thêm?</h3>
                <p>Chuyên viên HomestayDorm sẽ giúp bạn chọn phòng phù hợp nhất với nhu cầu.</p>
                <a className="kp-btn kp-btn-light kp-full" href="tel:19006789"><Icon name="support" />Liên hệ ngay</a>
              </div>
              <Icon name="support" className="kh-support-watermark" />
            </article>
          </aside>
        </div>
      </section>
    );
  }

  function renderProfiles() {
    const allProfiles = overview?.hoSo || [];
    const profiles = profileFilter === 'Tất cả' 
      ? allProfiles 
      : allProfiles.filter(p => p.trangThai === profileFilter);
      
    return (
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
          <div className="lxp-chips-bar" style={{ marginBottom: 0 }}>
            <div className="lxp-chips">
              {[
                { key: 'Tất cả', label: 'Tất cả' },
                { key: 'Chờ tiếp nhận', label: 'Chờ tiếp nhận' },
                { key: 'Đã tiếp nhận', label: 'Đã tiếp nhận' },
                { key: 'Chấp nhận', label: 'Chấp nhận' },
                { key: 'Chờ xác nhận cọc', label: 'Chờ xác nhận cọc' },
                { key: 'Từ chối', label: 'Từ chối' }
              ].map(f => {
                const count = f.key === 'Tất cả' ? allProfiles.length : allProfiles.filter(p => p.trangThai === f.key).length;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={`lxp-chip ${profileFilter === f.key ? 'lxp-chip-primary is-active' : 'lxp-chip-neutral'}`}
                    onClick={() => setProfileFilter(f.key)}
                  >
                    {f.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="kh-section-actions" style={{ marginBottom: 0 }}>
            <button className="kp-btn kp-btn-primary" type="button" onClick={openGeneralRentForm}>
              <Icon name="profile" /> Tạo nhu cầu thuê mới
            </button>
          </div>
        </div>

        {!profiles.length && (
          <Empty title="Chưa có hồ sơ" action={
            <button className="kp-btn kp-btn-primary" type="button" onClick={openGeneralRentForm}>
              Tạo nhu cầu thuê
            </button>
          }>
            Bạn chưa có hồ sơ nào. Hãy tạo nhu cầu thuê để nhân viên tư vấn cho bạn.
          </Empty>
        )}

        <div className="kh-list">
          {profiles.map((profile) => (
            <article className="kh-profile-card" key={profile.maDangKy}>
              <div className="kh-profile-header">
                <div className="kh-profile-title-row">
                  <h3>Hồ sơ đăng ký #{profile.maDangKy}</h3>
                  <span className={`kh-status-chip kh-status-chip--${statusTone(profile.trangThai)}`}>
                    {statusIcon(profile.trangThai)} {profile.trangThai}
                  </span>
                </div>
                <span className="kh-profile-date">Ngày tạo: {formatDate(profile.ngayDangKy)}</span>
              </div>

              <div className="kh-profile-meta-grid">
                <div className="kh-meta-item">
                  <Icon name="people" />
                  <span>{profile.hinhThucThue} · {profile.soNguoiO || 1} người{profile.hinhThucThue === 'Ghép' && (profile.gioiTinhPhong || profile.gioiTinh) ? ` (${profile.gioiTinhPhong || profile.gioiTinh})` : ''}</span>
                </div>
                {profile.khuVucMongMuon && (
                  <div className="kh-meta-item">
                    <Icon name="map" />
                    <span>Khu vực: {profile.khuVucMongMuon}</span>
                  </div>
                )}
                {(profile.mucGia || profile.mucGiaDen) && (
                  <div className="kh-meta-item">
                    <Icon name="payment" />
                    <span>
                      Mức giá: {profile.mucGia && profile.mucGiaDen 
                        ? `Từ ${Number(profile.mucGia).toLocaleString('vi-VN')}đ - ${Number(profile.mucGiaDen).toLocaleString('vi-VN')}đ/tháng` 
                        : profile.mucGia 
                          ? `Từ ${Number(profile.mucGia).toLocaleString('vi-VN')}đ/tháng` 
                          : `Đến ${Number(profile.mucGiaDen).toLocaleString('vi-VN')}đ/tháng`}
                    </span>
                  </div>
                )}
                {profile.ngayDuKienVaoO && (
                  <div className="kh-meta-item">
                    <Icon name="calendar" />
                    <span>Ngày vào ở: {formatDate(profile.ngayDuKienVaoO)}</span>
                  </div>
                )}
              </div>

              {profile.trangThai === 'Từ chối' && profile.ghiChuSale && (
                <div className="kh-profile-reject-reason">
                  <Icon name="lock" />
                  <span>Lý do: {profile.ghiChuSale}</span>
                </div>
              )}

              <div className="kh-profile-footer">
                <div />
                <div className="kh-profile-actions">
                  {profile.trangThai === 'Chờ tiếp nhận' ? (
                    <button className="kp-btn kp-btn-primary" type="button" onClick={() => openEditModal(profile)}>
                      Cập nhật hồ sơ
                    </button>
                  ) : (
                    <>
                      {profile.trangThai === 'Từ chối' && (
                        <button className="kp-btn kp-btn-primary" type="button" onClick={() => openReRegisterForm(profile)}>
                          Đăng ký lại
                        </button>
                      )}
                      <button className="kp-btn kp-btn-soft" type="button" onClick={() => openProfileDetail(profile)}>
                        Xem chi tiết
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderSchedules() {
    if (locks['lich-xem']) return renderLocked('lich-xem');
    return <LichXemPhongPage schedules={overview?.lichXem || []} onViewRoomDetail={(schedule) => {
      openScheduleDetail(schedule);
    }} />;
  }

  function renderSimpleUnlocked(tab, title, icon) {
    if (locks[tab]) return renderLocked(tab);
    return (
      <section>
        <article className="kp-info-panel kh-unlocked-panel">
          <Icon name={icon} />
          <strong>Dữ liệu bước này đã tồn tại trong hệ thống</strong>
          <p>Trang này đang được mở theo tiến trình của khách hàng. Bạn có thể bổ sung bảng chi tiết ở bước tiếp theo nếu cần hiển thị sâu hơn.</p>
        </article>
      </section>
    );
  }

  function renderAccount() {
    return (
      <section>
        <article className="kp-info-panel">
          <div className="kh-info-list">
            <div><span>Mã khách hàng</span><strong>{user?.maNguoiDung || 'Chưa cập nhật'}</strong></div>
            <div><span>Tên đăng nhập</span><strong>{user?.tenDangNhap || 'Chưa cập nhật'}</strong></div>
            <div><span>Họ tên</span><strong>{user?.hoTen || 'Chưa cập nhật'}</strong></div>
            <div><span>Giới tính</span><strong>{user?.gioiTinh || 'Chưa cập nhật'}</strong></div>
            <div><span>Số điện thoại</span><strong>{user?.soDienThoai || 'Chưa cập nhật'}</strong></div>
            <div><span>Email</span><strong>{user?.email || 'Chưa cập nhật'}</strong></div>
          </div>
        </article>
      </section>
    );
  }

  // ─── Hợp đồng ────────────────────────────────────────────────────────────
  async function loadHopDongDashboard() {
    setHopDongLoading(true);
    try {
      const { data } = await khachMoiApi.getHopDongDashboard();
      setHopDongDashboard(data?.data || data || {});
    } catch {
      setHopDongDashboard({});
      setToast('Không thể tải thông tin hợp đồng.');
    } finally {
      setHopDongLoading(false);
    }
  }

  function renderHopDong() {
    if (locks['hop-dong']) return renderLocked('hop-dong');
    if (hopDongLoading) return <div className="kp-loading"><span /><p>Đang tải hợp đồng...</p></div>;
    if (!hopDongDashboard) { loadHopDongDashboard(); return <div className="kp-loading"><span /><p>Đang tải...</p></div>; }
    
    if (!hopDongDashboard.MaHopDong) {
      return (
        <Empty title="Chưa có hợp đồng">
          Hiện tại bạn chưa có hợp đồng thuê phòng nào đang hiệu lực.
        </Empty>
      );
    }

    const hd = hopDongDashboard;
    
    return (
      <section className="hd-dashboard">
        <div className="hd-grid">
          {/* Main Photo Banner */}
          <div className="hd-banner" style={{ backgroundImage: `url(${hd.UrlImg || getDemoRoomImage(hd.MaPhong, 0)})` }}>
            <div className="hd-banner-overlay" />
            <div className="hd-banner-content">
              <span className="hd-badge">ĐANG THUÊ</span>
              <h2>{hd.TenPhong} - {hd.TenLoaiPhong}</h2>
              <p>{hd.TenChiNhanh} • Tầng {getRoomFloor(hd.MaPhong) || 1} • {hd.MaGiuong ? `Giường ${hd.MaGiuong}` : 'Phòng nguyên căn'}</p>
            </div>
          </div>

          {/* Right Card: Hợp đồng của bạn */}
          <div className="hd-card hd-contract-summary">
            <h3>HỢP ĐỒNG CỦA BẠN</h3>
            <p>MS: {hd.MaHopDong}</p>
            <p>Ngày hết hạn: {formatDate(hd.NgayKetThuc)}</p>
            <div className="hd-success-badge">
              <Icon name="check" /> Hợp đồng chính chủ
            </div>
          </div>

          {/* Chi tiết thuê */}
          <div className="hd-card hd-rent-details">
            <div className="hd-card-header">
              <Icon name="payment" /> <h3>CHI TIẾT THUÊ</h3>
            </div>
            <div className="hd-detail-row">
              <span>Giá thuê hàng tháng:</span>
              <strong className="hd-price">{formatMoney(hd.GiaThue)}</strong>
            </div>
            <div className="hd-detail-row">
              <span>Loại phòng:</span>
              <span className="hd-chip-gray">{hd.TenLoaiPhong}</span>
            </div>
            <div className="hd-action-buttons">
              <button className="kp-btn hd-btn-teal" onClick={() => goTo('bao-tri')}><Icon name="repair" /> Bảo trì</button>
              <a className="kp-btn hd-btn-outline" href="tel:19006789"><Icon name="support" /> Liên hệ</a>
            </div>
          </div>

          {/* Tiện ích phòng */}
          <div className="hd-card hd-amenities">
            <div className="hd-card-header">
              <Icon name="room" /> <h3>TIỆN ÍCH PHÒNG</h3>
            </div>
            <div className="hd-amenity-chips">
              {(hd.taiSan || []).map(ts => (
                <span key={ts.MaTaiSan} className="hd-chip-gray"><Icon name="check" /> {ts.TenTaiSan}</span>
              ))}
            </div>
          </div>

          {/* Quy định phòng */}
          <div className="hd-card hd-rules">
            <div className="hd-card-header" style={{ justifyContent: 'space-between' }}>
              <h3>Quy định phòng</h3>
              <Icon name="info" />
            </div>
            <div className="hd-rule-list">
              {(hd.quyDinh || []).map(qd => (
                <div key={qd.MaQuyDinh} className="hd-rule-item">
                  <Icon name="check" />
                  <div>
                    <strong>{qd.TieuDeNoiQuy}</strong>
                    <p>{qd.NoiDung}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danh sách tài sản */}
          <div className="hd-card hd-assets">
            <h3>Danh sách tài sản</h3>
            <table className="hd-table">
              <thead>
                <tr>
                  <th>TÊN TÀI SẢN</th>
                  <th>SỐ LƯỢNG</th>
                  <th>TÌNH TRẠNG</th>
                </tr>
              </thead>
              <tbody>
                {(hd.taiSan || []).map(ts => (
                  <tr key={ts.MaTaiSan}>
                    <td><Icon name="layers" /> {ts.TenTaiSan}</td>
                    <td>{(ts.SoLuong || 1).toString().padStart(2, '0')}</td>
                    <td className="hd-status-good">Tốt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Địa chỉ cư trú */}
          <div className="hd-card hd-map-card">
            <div className="hd-map-placeholder">
              <iframe 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(hd.DiaChi)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy">
              </iframe>
            </div>
            <div className="hd-map-info">
              <h4>Địa chỉ cư trú</h4>
              <p>{hd.DiaChi}</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(hd.DiaChi)}`} target="_blank" rel="noreferrer" className="kp-btn hd-btn-outline">
                <Icon name="map" /> Chỉ đường đến đây
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────
  async function loadDatCoc() {
    setDatCocLoading(true);
    try {
      const { data } = await khachMoiApi.getDatCoc();
      setDatCocList(Array.isArray(data) ? data : []);
    } catch {
      setDatCocList([]);
      setToast('Không thể tải danh sách phiếu cọc.');
    } finally {
      setDatCocLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadForm((prev) => ({ ...prev, fileBase64: ev.target.result, fileName: file.name }));
    reader.readAsDataURL(file);
  }

  async function submitMinhChung(e) {
    e.preventDefault();
    if (!datCocSelected) return;
    setUploading(true);
    try {
      await khachMoiApi.uploadMinhChung(datCocSelected.maPhieuCoc, {
        minhChung: JSON.stringify({ maGiaoDich: uploadForm.maGiaoDich, ngayGiaoDich: uploadForm.ngayGiaoDich, nganHang: uploadForm.nganHang, ghiChu: uploadForm.ghiChu, file: uploadForm.fileBase64, fileName: uploadForm.fileName })
      });
      setToast('Đã gửi chứng từ thành công. Vui lòng chờ nhân viên kiểm tra.');
      const updated = { ...datCocSelected, trangThai: 'Chờ xác nhận', minhChungThanhToan: JSON.stringify({ maGiaoDich: uploadForm.maGiaoDich }) };
      setDatCocSelected(updated);
      setDatCocList((prev) => prev.map((p) => p.maPhieuCoc === updated.maPhieuCoc ? updated : p));
    } catch (err) {
      setToast(err.response?.data?.message || 'Không thể gửi chứng từ.');
    } finally {
      setUploading(false);
    }
  }

  function renderDatCocList() {
    if (locks['dat-coc']) return renderLocked('dat-coc');
    if (datCocLoading) return <div className="kp-loading"><span /><p>Đang tải phiếu cọc...</p></div>;
    if (!datCocList) { loadDatCoc(); return <div className="kp-loading"><span /><p>Đang tải...</p></div>; }

    const DC_STATUS = {
      'Chờ thanh toán': { cls: 'dc-chip-warn', label: '⏳ Chờ thanh toán' },
      'Chờ xác nhận': { cls: 'dc-chip-info', label: '⏳ Đã gửi chứng từ' },
      'Hoàn tất': { cls: 'dc-chip-done', label: '✅ Hoàn tất' },
      'Hết hạn': { cls: 'dc-chip-danger', label: '❌ Hết hạn' },
      'Đã hủy': { cls: 'dc-chip-danger', label: '❌ Đã hủy' },
    };

    const filteredDatCoc = datCocFilter === 'Tất cả' 
      ? datCocList 
      : datCocList.filter(p => {
          if (datCocFilter === 'Hết hạn/Hủy') return p.trangThai === 'Hết hạn' || p.trangThai === 'Đã hủy';
          return p.trangThai === datCocFilter;
        });

    if (!datCocList.length) {
      return (
        <Empty title="Chưa có phiếu đặt cọc">
          Khi hồ sơ được duyệt, nhân viên sẽ lập phiếu đặt cọc cho bạn.
        </Empty>
      );
    }

    return (
      <section>
        <div className="lxp-chips-bar" style={{ marginBottom: 16 }}>
          <div className="lxp-chips">
            {[
              { key: 'Tất cả', label: 'Tất cả' },
              { key: 'Chờ thanh toán', label: 'Chờ thanh toán' },
              { key: 'Chờ xác nhận', label: 'Chờ xác nhận' },
              { key: 'Hoàn tất', label: 'Hoàn tất' },
              { key: 'Hết hạn/Hủy', label: 'Đã hủy/Hết hạn' }
            ].map(f => (
              <button
                key={f.key}
                type="button"
                className={`lxp-chip ${datCocFilter === f.key ? 'lxp-chip-primary is-active' : 'lxp-chip-neutral'}`}
                onClick={() => setDatCocFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dc-list">
          {filteredDatCoc.map((phieu) => {
            const cfg = DC_STATUS[phieu.trangThai] || { cls: 'dc-chip-info', label: phieu.trangThai };
            return (
              <article
                className="dc-card"
                key={phieu.maPhieuCoc}
                onClick={() => { setDatCocSelected(phieu); setUploadForm({ maGiaoDich: '', ngayGiaoDich: '', nganHang: 'Vietcombank', ghiChu: '', fileBase64: '', fileName: '' }); }}
              >
                <div className="dc-card-head">
                  <div>
                    <span className="dc-ma-phieu">#{phieu.maPhieuCoc}</span>
                    <span className="dc-room-name">{phieu.tenPhong || 'Chưa xác định phòng'}</span>
                  </div>
                  <span className={`dc-chip ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <div className="dc-card-meta">
                  <span>Ngày lập: {formatDate(phieu.ngayLap)}</span>
                  <span>Tổng cọc: <strong>{Number(phieu.soTienCoc).toLocaleString('vi-VN')}đ</strong></span>
                  {phieu.thoiHanThanhToan && phieu.trangThai === 'Chờ thanh toán' && (
                    <span style={{ color: 'var(--dc-warn)' }}>Hạn TT: {formatDate(phieu.thoiHanThanhToan, true)}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderDatCocDetail(phieu) {
    const minhChung = (() => { try { return phieu.minhChungThanhToan ? JSON.parse(phieu.minhChungThanhToan) : null; } catch { return null; } })();
    const isExpired = phieu.trangThai === 'Hết hạn' || phieu.trangThai === 'Đã hủy';
    const isWaiting = phieu.trangThai === 'Chờ thanh toán';
    const isSent = phieu.trangThai === 'Chờ xác nhận';
    const isDone = phieu.trangThai === 'Hoàn tất';

    return (
      <section className="dc-detail">
        <button className="dc-back-btn" type="button" onClick={() => setDatCocSelected(null)}>
          <Icon name="explore" />← Danh sách phiếu
        </button>

        {/* Banners */}
        {isExpired && (
          <div className="dc-banner dc-banner-danger">
            <Icon name="lock" />
            <div>
              <strong>Phiếu đặt cọc đã hết hạn thanh toán.</strong>
              <p>Thời hạn giữ phòng đã kết thúc. Hệ thống đã tự động giải phóng vị trí này cho khách hàng khác.</p>
            </div>
          </div>
        )}
        {isSent && (
          <div className="dc-banner dc-banner-success">
            <Icon name="check" />
            <span>Gửi chứng từ thành công. Vui lòng chờ nhân viên kiểm tra.</span>
          </div>
        )}
        {isDone && (
          <div className="dc-banner dc-banner-success">
            <Icon name="check" />
            <span>Thanh toán đặt cọc đã được xác nhận thành công!</span>
          </div>
        )}

        <div className="dc-detail-grid">
          {/* LEFT: Thông tin phiếu */}
          <div className="dc-detail-main">
            <div className="dc-info-card">
              <div className="dc-info-row">
                <span className="dc-info-label">MÃ PHIẾU</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong className="dc-ma-phieu-lg">#{phieu.maPhieuCoc}</strong>
                  {isExpired && <span className="dc-chip dc-chip-danger" style={{ fontSize: 11 }}>Hết hạn</span>}
                  {isExpired && <span className="dc-chip dc-chip-danger" style={{ fontSize: 11 }}>Đã hủy</span>}
                  {isWaiting && <span className="dc-chip dc-chip-warn">Chờ TT</span>}
                  {isSent && <span className="dc-chip dc-chip-info">Chờ xác nhận</span>}
                  {isDone && <span className="dc-chip dc-chip-done">Hoàn tất</span>}
                </div>
              </div>
              <div className="dc-info-grid">
                <div><span>Loại phòng</span><strong>{phieu.loaiPhong || phieu.tenPhong || 'Chưa cập nhật'}</strong></div>
                <div><span>Cơ sở</span><strong>{phieu.tenChiNhanh || 'Chưa cập nhật'}</strong></div>
                <div><span>Số tiền cọc</span><strong style={{ color: 'var(--dc-primary)' }}>{Number(phieu.soTienCoc).toLocaleString('vi-VN')} VNĐ</strong></div>
                {phieu.thoiHanThanhToan && <div><span>Hạn thanh toán</span><strong style={{ color: isExpired ? 'var(--dc-danger)' : 'inherit' }}>{formatDate(phieu.thoiHanThanhToan, true)}</strong></div>}
                {phieu.tenNhanVienPhuTrach && <div><span>Nhân viên phụ trách</span><strong>{phieu.tenNhanVienPhuTrach}</strong></div>}
              </div>
            </div>

            {/* Case 1: Chờ thanh toán → Form upload + Thông tin CK */}
            {isWaiting && (
              <>
                <div className="dc-section-card">
                  <h3 className="dc-section-title"><Icon name="profile" />Gửi chứng từ thanh toán</h3>
                  <form onSubmit={submitMinhChung} className="dc-upload-form">
                    <div className="dc-form-row">
                      <label>
                        <span>Mã giao dịch (Nếu có)</span>
                        <input placeholder="VD: VCB12345678" value={uploadForm.maGiaoDich} onChange={(e) => setUploadForm((p) => ({ ...p, maGiaoDich: e.target.value }))} />
                      </label>
                      <label>
                        <span>Ngày giờ giao dịch</span>
                        <input type="datetime-local" value={uploadForm.ngayGiaoDich} onChange={(e) => setUploadForm((p) => ({ ...p, ngayGiaoDich: e.target.value }))} />
                      </label>
                    </div>
                    <div className="dc-form-row">
                      <label className="dc-form-full">
                        <span>Ngân hàng / Ví điện tử</span>
                        <select value={uploadForm.nganHang} onChange={(e) => setUploadForm((p) => ({ ...p, nganHang: e.target.value }))}>
                          {['Vietcombank','VietinBank','BIDV','Agribank','TPBank','MB Bank','Techcombank','MoMo','ZaloPay'].map((b) => <option key={b}>{b}</option>)}
                        </select>
                      </label>
                      <label className="dc-form-full">
                        <span>Ghi chú</span>
                        <textarea placeholder="Thêm ghi chú nếu cần..." value={uploadForm.ghiChu} onChange={(e) => setUploadForm((p) => ({ ...p, ghiChu: e.target.value }))} rows={2} />
                      </label>
                    </div>
                    <label className="dc-file-drop">
                      <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                      {uploadForm.fileName
                        ? <span className="dc-file-name">📎 {uploadForm.fileName}</span>
                        : <><Icon name="profile" /><span>Kéo thả file vào đây hoặc <u>Chọn từ máy tính</u></span><small>Định dạng hỗ trợ: JPG, PNG, PDF (Tối đa 5MB)</small></>}
                    </label>
                    <button className="kp-btn kp-btn-primary kp-full" type="submit" disabled={uploading}>
                      {uploading ? 'Đang gửi...' : 'Gửi chứng từ thanh toán'}
                    </button>
                  </form>
                </div>

                <div className="dc-section-card">
                  <h3 className="dc-section-title"><Icon name="invoice" />Thông tin chuyển khoản</h3>
                  <div className="dc-bank-info">
                    <div><span>Ngân hàng</span><strong>Vietcombank (VCB)</strong></div>
                    <div><span>Số tài khoản</span><strong>1012345678</strong></div>
                    <div><span>Chủ tài khoản</span><strong>CÔNG TY TNHH HOMESTAYDORM</strong></div>
                    <div><span>Nội dung chuyển khoản</span><strong style={{ color: 'var(--dc-primary)' }}>DATCOC_{phieu.maPhieuCoc?.toUpperCase()}</strong></div>
                  </div>
                  <p className="dc-bank-note">Vui lòng chuyển đúng nội dung để hệ thống tự động xác nhận nhanh hơn.</p>
                </div>
              </>
            )}

            {/* Case 2: Hết hạn */}
            {isExpired && (
              <div className="dc-expired-cards">
                <div className="dc-expired-img-card dc-expired-room"><Icon name="lock" /><span>Phòng đã được giải phóng</span></div>
                <div className="dc-expired-img-card dc-expired-phieu"><Icon name="lock" /><span>Phiếu đặt cọc vô hiệu</span></div>
              </div>
            )}

            {/* Case 3: Đã gửi chứng từ / Hoàn tất */}
            {(isSent || isDone) && minhChung && (
              <div className="dc-section-card">
                <h3 className="dc-section-title"><Icon name="invoice" />Thông tin chuyển khoản</h3>
                <div className="dc-bank-info">
                  <div><span>Ngân hàng</span><strong>Vietcombank (VCB)</strong></div>
                  <div><span>Số tài khoản</span><strong>1012345678</strong></div>
                  <div><span>Chủ tài khoản</span><strong>CÔNG TY TNHH HOMESTAYDORM</strong></div>
                  <div><span>Nội dung chuyển khoản</span><strong style={{ color: 'var(--dc-primary)' }}>DATCOC_{phieu.maPhieuCoc?.toUpperCase()}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: Chứng từ đã gửi / Hỗ trợ */}
          <aside className="dc-detail-side">
            {(isSent || isDone) && minhChung && (
              <div className="dc-section-card">
                <h3 className="dc-section-title"><Icon name="check" />Chứng từ đã gửi</h3>
                <div className="dc-receipt-box">
                  <span className="dc-chip dc-chip-info" style={{ fontSize: 11 }}>⏳ Chờ kiểm tra chứng từ</span>
                  {minhChung.fileName && (
                    <div className="dc-receipt-file"><Icon name="profile" /><span>{minhChung.fileName}</span></div>
                  )}
                  {minhChung.maGiaoDich && <p>Mã giao dịch: <strong>{minhChung.maGiaoDich}</strong></p>}
                  <p style={{ fontSize: 12, color: 'var(--kp-soft-text)' }}>Hệ thống sẽ ghi nhận số của bạn. Đội ngũ CSKH sẽ kiểm tra và cập nhật trạng thái trong vòng 2–4 giờ làm việc.</p>
                </div>
                <button className="kp-btn kp-btn-soft kp-full" type="button" style={{ marginTop: 12, fontSize: 13 }}
                  onClick={() => { setUploadForm({ maGiaoDich: '', ngayGiaoDich: '', nganHang: 'Vietcombank', ghiChu: '', fileBase64: '', fileName: '' }); setDatCocSelected({ ...phieu, trangThai: 'Chờ thanh toán' }); }}
                >
                  ✏️ Thay đổi chứng từ
                </button>
                <p style={{ fontSize: 12, color: 'var(--kp-soft-text)', marginTop: 8 }}>Nếu có sai sót trong thông tin đã gửi, vui lòng liên hệ bộ phận Hỗ trợ ngay.</p>
              </div>
            )}
            {isExpired && (
              <div className="dc-section-card dc-support-card">
                <Icon name="support" />
                <p>Vui lòng liên hệ nhân viên Sale để được hỗ trợ lập phiếu mới nếu vẫn có nhu cầu đặt phòng.</p>
                <a className="kp-btn kp-btn-primary kp-full" href="tel:19006789" style={{ marginTop: 12 }}>Liên hệ tư vấn ngay</a>
              </div>
            )}
            {isWaiting && (
              <div className="dc-section-card dc-support-card">
                <Icon name="support" />
                <p>Cần hỗ trợ? Liên hệ nhân viên ngay để được giải đáp thắc mắc về quy trình đặt cọc.</p>
                <a className="kp-btn kp-btn-soft kp-full" href="tel:19006789" style={{ marginTop: 12 }}>Liên hệ hỗ trợ</a>
              </div>
            )}
          </aside>
        </div>
      </section>
    );
  }

  function renderDatCoc() {
    if (datCocSelected) return renderDatCocDetail(datCocSelected);
    return renderDatCocList();
  }

  function renderCurrentTab() {
    if (detailPhong) {
      return (
        <ChiTietPhongView
          phong={detailPhong}
          onBack={() => setDetailPhong(null)}
          onRent={(room) => { setDetailPhong(null); openRentForm(room); }}
        />
      );
    }
    if (activeTab === 'kham-pha') return renderExplore();
    if (activeTab === 'ho-so') return renderProfiles();
    if (activeTab === 'lich-xem') return renderSchedules();
    if (activeTab === 'dat-coc') return renderDatCoc();
    if (activeTab === 'hop-dong') return renderHopDong();
    if (activeTab === 'phong-giuong') return renderSimpleUnlocked('phong-giuong', 'Phòng/Giường của tôi', 'room');
    if (activeTab === 'hoa-don') return renderSimpleUnlocked('hoa-don', 'Hóa đơn', 'invoice');
    if (activeTab === 'bao-tri') return renderSimpleUnlocked('bao-tri', 'Bảo trì', 'repair');
    if (activeTab === 'tai-khoan') return renderAccount();
    return renderExplore();
  }

  return (
    <div className="kp-page kh-page">
      <aside className="kp-sidebar">
        <div className="kp-sidebar-brand"><button type="button" className="kp-brand-btn" onClick={() => goTo('tai-khoan')}><Brand /></button></div>
        <nav className="kp-sidebar-nav" aria-label="Menu khách hàng">
          {navItems.map((item) => (
            <button
              className={`kp-side-item ${activeTab === item.id ? 'is-active' : ''} ${locks[item.id] ? 'is-locked' : ''}`}
              type="button"
              key={item.id}
              onClick={() => goTo(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.title}</span>
              {locks[item.id] && <Icon name="lock" className="kp-lock-icon" />}
            </button>
          ))}
        </nav>
        <div className="kp-support-mini"><span>Hỗ trợ 24/7</span><strong>1900 6789</strong></div>
      </aside>

      <div className="kp-app">
        <header className="kp-topbar">
          <div>
            <h1>Chào {firstName(user?.hoTen)},</h1>
            <p>Tìm kiếm không gian sống lý tưởng của bạn.</p>
          </div>
          <div className="kp-top-actions">
            <div className="kp-user-box" style={{ position: 'relative' }}>
              <button
                type="button"
                className="kp-user-box-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '10px', transition: 'background 0.18s' }}
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
              >
                <span className="kp-avatar">{initials(user?.hoTen)}</span>
                <div><strong>{user?.hoTen || 'Khách hàng'}</strong><small>Khách hàng</small></div>
                <svg style={{ marginLeft: '2px', opacity: 0.5, transition: 'transform 0.2s', transform: accountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {accountMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 59 }}
                    onClick={() => setAccountMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="kh-account-menu">
                    <button
                      type="button"
                      onClick={() => { setAccountMenuOpen(false); goTo('tai-khoan'); }}
                    >
                      <Icon name="profile" /> Thông tin tài khoản
                    </button>
                    <button
                      type="button"
                      style={{ color: '#e53e3e' }}
                      onClick={() => { setAccountMenuOpen(false); logout(); }}
                    >
                      <Icon name="lock" /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="kp-main kh-main">
          {loading && <div className="kp-loading"><span /><p>Đang tải cổng khách hàng...</p></div>}
          {!loading && error && <div className="kp-message error">{error}</div>}
          {!loading && !error && renderCurrentTab()}
          {detailLoading && <div className="kh-detail-overlay"><span className="kh-detail-spinner" /></div>}
        </main>
      </div>

      {rentModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setRentModal(false)}>
          <form className="kp-modal kh-rent-modal kh-register-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submitRent}>
            <div className="kp-modal-head kh-register-head">
              <div>
                <h2>Đăng ký thuê phòng</h2>
                <p>Vui lòng cung cấp thông tin cá nhân và nhu cầu thuê phòng để nhân viên Sale hỗ trợ kiểm tra và sắp lịch xem phòng.</p>
              </div>
              <button type="button" onClick={() => setRentModal(false)}>×</button>
            </div>

            <div className="kh-register-scroll">
              <section className="kh-register-section">
                <h3><Icon name="profile" />Thông tin cá nhân</h3>
                <div className="kh-register-grid">
                  <label className="is-half"><span>Họ và tên*</span><input value={rentForm.hoTen} onChange={(event) => setRentForm({ ...rentForm, hoTen: event.target.value })} placeholder="Nguyễn Văn A" required /></label>
                  <label><span>Ngày sinh*</span><input type="date" value={rentForm.ngaySinh} onChange={(event) => setRentForm({ ...rentForm, ngaySinh: event.target.value })} required /></label>
                  <label><span>Giới tính*</span><select value={rentForm.gioiTinh} onChange={(event) => setRentForm({ ...rentForm, gioiTinh: event.target.value })} required><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>
                  <label className="is-half"><span>Số điện thoại*</span><input value={rentForm.soDienThoai} onChange={(event) => setRentForm({ ...rentForm, soDienThoai: event.target.value })} placeholder="Nhập số điện thoại liên hệ" required /></label>
                  <label className="is-half"><span>Email</span><input type="email" value={rentForm.email} onChange={(event) => setRentForm({ ...rentForm, email: event.target.value })} placeholder="example@gmail.com" /></label>
                  <label className="is-half"><span>Quốc tịch*</span><input value={rentForm.quocTich} onChange={(event) => setRentForm({ ...rentForm, quocTich: event.target.value })} placeholder="Ví dụ: Việt Nam" required /></label>
                  <label className="is-half"><span>CCCD/Hộ chiếu*</span><input value={rentForm.cccd} onChange={(event) => setRentForm({ ...rentForm, cccd: event.target.value })} placeholder="Số căn cước công dân" required /></label>
                </div>
              </section>

              <section className="kh-register-section">
                <h3><Icon name="home" />Nhu cầu thuê phòng</h3>
                <div className="kh-register-grid">
                  <label><span>Số lượng người ở*</span><input type="number" min="1" value={rentForm.soNguoiO} onChange={(event) => setRentForm({ ...rentForm, soNguoiO: event.target.value })} required /></label>
                  <label><span>Giới tính thuê*</span><select value={rentForm.gioiTinhThue} onChange={(event) => setRentForm({ ...rentForm, gioiTinhThue: event.target.value })} required><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Không xác định">Không xác định</option></select></label>
                  <label className="is-half"><span>Khu vực mong muốn*</span><input value={rentForm.khuVucMongMuon} onChange={(event) => setRentForm({ ...rentForm, khuVucMongMuon: event.target.value })} placeholder="Ví dụ: Quận 3, gần trường học..." required /></label>
                  <label className="is-half"><span>Loại phòng mong muốn*</span><select value={rentForm.loaiPhongYeuCau} onChange={(event) => setRentForm({ ...rentForm, loaiPhongYeuCau: event.target.value })} required><option value="">Chọn loại phòng</option>{filterOptions.loaiPhong.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                  <label><span>Mức giá tối đa (đ/tháng)*</span><input type="number" min="0" value={rentForm.mucGiaToiDa} onChange={(event) => setRentForm({ ...rentForm, mucGiaToiDa: event.target.value })} placeholder="VD: 3.000.000" required /></label>
                  <label className="is-half"><span>Thời gian dự kiến dọn vào*</span><input type="date" value={rentForm.ngayDuKienVaoO} onChange={(event) => setRentForm({ ...rentForm, ngayDuKienVaoO: event.target.value })} required /></label>
                  <label className="is-half"><span>Thời hạn thuê (tháng)*</span><input type="number" min="1" value={rentForm.thoiHanThue} onChange={(event) => setRentForm({ ...rentForm, thoiHanThue: event.target.value })} placeholder="Ví dụ: 6" required /></label>
                  <div className="is-wide" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ color: 'var(--kp-soft-text)', fontSize: '10px', fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Yêu cầu khác</span>
                    <label style={{ margin: 0 }}>
                      <textarea value={rentForm.ghiChu} onChange={(event) => setRentForm({ ...rentForm, ghiChu: event.target.value })} placeholder="Giờ giấc sinh hoạt, yêu cầu yên tĩnh, gửi xe..." style={{ width: '100%', minHeight: '46px' }} />
                    </label>
                  </div>
                </div>
              </section>
            </div>

            <div className="kp-modal-actions kh-register-actions">
              <button className="kp-btn kp-btn-soft" type="button" onClick={() => setRentModal(false)}>Hủy</button>
              <button className="kp-btn kp-btn-primary" type="submit" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu đăng ký'}</button>
            </div>
          </form>
        </div>
      )}

      <div className={`kh-toast ${toast ? 'show' : ''}`}>{toast}</div>

      {profileDetailModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setProfileDetailModal(null)}>
          <div className="kp-modal kh-rent-modal kh-register-modal kh-profile-detail-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="kp-modal-head kh-register-head">
              <div>
                <h2>Chi tiết hồ sơ #{profileDetailModal.maDangKy}</h2>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span className={`kh-status-chip kh-status-chip--${statusTone(profileDetailModal.trangThai)}`} style={{ margin: 0, padding: '4px 8px', fontSize: '13px' }}>
                    {statusIcon(profileDetailModal.trangThai)} {profileDetailModal.trangThai}
                  </span>
                  <span style={{ color: 'var(--kp-soft-text)', fontSize: '13px' }}>· Ngày tạo: {formatDate(profileDetailModal.ngayDangKy)}</span>
                </p>
              </div>
              <button type="button" onClick={() => setProfileDetailModal(null)}>×</button>
            </div>

            {profileDetailLoading && (
              <div className="kh-profile-detail-loading">Đang tải chi tiết hồ sơ...</div>
            )}

            <div className="kh-register-scroll">
              <section className="kh-register-section">
                <h3><Icon name="profile" />Thông tin cá nhân</h3>
                <div className="kh-register-grid">
                  <label className="is-half"><span>Họ và tên</span><div className="kh-readonly-val">{displayValue(profileDetailModal.hoTen || user?.hoTen)}</div></label>
                  <label><span>Ngày sinh</span><div className="kh-readonly-val">{formatDate(profileDetailModal.ngaySinh || user?.ngaySinh)}</div></label>
                  <label><span>Giới tính</span><div className="kh-readonly-val">{displayValue(profileDetailModal.gioiTinh || user?.gioiTinh)}</div></label>
                  <label className="is-half"><span>Số điện thoại</span><div className="kh-readonly-val">{displayValue(profileDetailModal.soDienThoai || user?.soDienThoai)}</div></label>
                  <label className="is-half"><span>Email</span><div className="kh-readonly-val">{displayValue(profileDetailModal.email || user?.email)}</div></label>
                  <label className="is-half"><span>Quốc tịch</span><div className="kh-readonly-val">{displayValue(profileDetailModal.quocTich || user?.quocTich)}</div></label>
                  <label className="is-half"><span>CCCD/Hộ chiếu</span><div className="kh-readonly-val">{displayValue(profileDetailModal.cccd || profileDetailModal.soCCCD || user?.cccd || user?.soCCCD || user?.cmnd)}</div></label>
                </div>
              </section>

              <section className="kh-register-section">
                <h3><Icon name="home" />Nhu cầu thuê phòng</h3>
                <div className="kh-register-grid">
                  <label><span>Số lượng người ở</span><div className="kh-readonly-val">{displayValue(profileDetailModal.soNguoiO, 1)} người</div></label>
                  <label><span>Hình thức thuê</span><div className="kh-readonly-val">{displayValue(profileDetailModal.hinhThucThue === 'Ghép' && (profileDetailModal.gioiTinhPhong || profileDetailModal.gioiTinh) ? `Ghép ${(profileDetailModal.gioiTinhPhong || profileDetailModal.gioiTinh).toLowerCase()}` : profileDetailModal.hinhThucThue)}</div></label>
                  <label className="is-half"><span>Khu vực mong muốn</span><div className="kh-readonly-val">{displayValue(profileDetailModal.khuVucMongMuon)}</div></label>
                  <label className="is-half"><span>Loại phòng mong muốn</span><div className="kh-readonly-val">{displayValue(profileDetailModal.loaiPhongYeuCau)}</div></label>
                  <div className="kh-price-range is-half" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <label style={{ width: '100%', marginBottom: '-4px' }}><span>Giá từ (đ/tháng)</span></label>
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                      <div className="kh-readonly-val" style={{ flex: 1 }}>{profileDetailModal.mucGia ? formatMoney(profileDetailModal.mucGia) : 'Chưa cập nhật'}</div>
                      <span className="kh-price-sep" style={{ lineHeight: '38px' }}>—</span>
                      <div className="kh-readonly-val" style={{ flex: 1 }}>{profileDetailModal.mucGiaDen ? formatMoney(profileDetailModal.mucGiaDen) : 'Chưa cập nhật'}</div>
                    </div>
                  </div>
                  <label className="is-half"><span>Thời gian dự kiến dọn vào</span><div className="kh-readonly-val">{formatDate(profileDetailModal.ngayDuKienVaoO)}</div></label>
                  <label className="is-half"><span>Thời hạn thuê (tháng)</span><div className="kh-readonly-val">{profileDetailModal.thoiHanThue ? `${profileDetailModal.thoiHanThue} tháng` : 'Chưa cập nhật'}</div></label>
                  <label className="is-half"><span>Lịch xem gần nhất</span><div className="kh-readonly-val">{profileDetailModal.thoiGianHen ? formatDate(profileDetailModal.thoiGianHen, true) : 'Chưa có'}</div></label>
                  <label className="is-half"><span>Phòng xem</span><div className="kh-readonly-val">{displayValue(profileDetailModal.phongXem || profileDetailModal.phongQuanTam, 'Chưa có')}</div></label>
                  <label className="is-half"><span>Nhân viên sale</span><div className="kh-readonly-val">{displayValue(profileDetailModal.tenNhanVienSale || profileDetailModal.maNhanVienSale)}</div></label>
                  <label className="is-wide"><span>Yêu cầu khác</span><div className="kh-readonly-val">{profileDetailModal.ghiChu || 'Không có ghi chú.'}</div></label>
                </div>
              </section>

              {Array.isArray(profileDetailModal.phongXemDanhSach) && profileDetailModal.phongXemDanhSach.length > 0 && (
                <section className="kh-register-section">
                  <h3><Icon name="home" />Phòng / giường đã gắn lịch xem</h3>
                  <div className="kh-profile-detail-rooms" style={{ marginTop: 0 }}>
                    {profileDetailModal.phongXemDanhSach.map((room) => (
                      <div className="kh-profile-room-row" key={`${room.sttLich}-${room.maPhong}-${room.maGiuong || 'room'}`}>
                        <strong>{room.tenPhong || room.maPhong}</strong>
                        <span>{room.maGiuong ? `Giường ${room.maGiuong}` : 'Nguyên phòng'} · {formatMoney(room.giaThue)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="kp-modal-actions kh-register-actions">
              <button className="kp-btn kp-btn-soft" type="button" onClick={() => setProfileDetailModal(null)}>Đóng</button>
              {profileDetailModal.trangThai === 'Chờ tiếp nhận' && (
                <button className="kp-btn kp-btn-primary" type="button" onClick={() => {
                  const currentProfile = profileDetailModal;
                  setProfileDetailModal(null);
                  openEditModal(currentProfile);
                }}>
                  Cập nhật hồ sơ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {scheduleDetailModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setScheduleDetailModal(null)}>
          <div className="kp-modal kh-rent-modal kh-profile-detail-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="kp-modal-head">
              <div>
                <span className="kp-eyebrow">Chi tiết lịch hẹn</span>
                <h2>Lịch xem #{scheduleDetailModal.maDangKy}</h2>
              </div>
              <button type="button" onClick={() => setScheduleDetailModal(null)}>×</button>
            </div>

            {scheduleDetailLoading && (
              <div className="kh-profile-detail-loading">Đang tải chi tiết lịch xem...</div>
            )}

            <div className="kh-profile-detail-summary">
              <span className={`kh-status-chip kh-status-chip--${statusTone(scheduleDetailModal.trangThai)}`}>
                {statusIcon(scheduleDetailModal.trangThai)} {scheduleDetailModal.trangThai}
              </span>
              <p>Thời gian hẹn: {formatDate(scheduleDetailModal.thoiGianHen, true)}</p>
            </div>

            <div className="kh-profile-detail-grid">
              <div><span>Mã hồ sơ</span><strong>{displayValue(scheduleDetailModal.maDangKy)}</strong></div>
              <div><span>Nhân viên hỗ trợ</span><strong>{displayValue(scheduleDetailModal.tenNhanVienSale || scheduleDetailModal.maNhanVienSale)}</strong></div>
            </div>

            {Array.isArray(scheduleDetailModal.phongXem) && scheduleDetailModal.phongXem.length > 0 ? (
              <div className="kh-profile-detail-rooms">
                <h3>Danh sách phòng sẽ xem</h3>
                {scheduleDetailModal.phongXem.map((room) => (
                  <div className="kh-profile-room-row" key={`${room.maPhong}-${room.maGiuong || 'room'}`}>
                    <strong>{room.tenPhong || room.maPhong}</strong>
                    <span>{room.maGiuong ? `Giường ${room.maGiuong}` : 'Nguyên phòng'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kh-profile-detail-rooms">
                <h3>Danh sách phòng sẽ xem</h3>
                <p>Chưa có danh sách chi tiết.</p>
              </div>
            )}

            <div className="kp-modal-actions">
              <button className="kp-btn kp-btn-soft" type="button" onClick={() => setScheduleDetailModal(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setEditModal(null)}>
          <form className="kp-modal kh-rent-modal kh-register-modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submitEditModal}>
            <div className="kp-modal-head kh-register-head">
              <div>
                <h2>Cập nhật hồ sơ #{editModal.maDangKy}</h2>
                <p>Cập nhật lại các thông tin nhu cầu thuê của bạn.</p>
              </div>
              <button type="button" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div className="kh-register-scroll">
              <section className="kh-register-section">
                <h3><Icon name="profile" />Thông tin cá nhân</h3>
                <div className="kh-register-grid">
                  <label className="is-half"><span>Họ và tên*</span><input value={editForm.hoTen} onChange={(event) => setEditForm({ ...editForm, hoTen: event.target.value })} placeholder="Nguyễn Văn A" required /></label>
                  <label><span>Ngày sinh*</span><input type="date" value={editForm.ngaySinh} onChange={(event) => setEditForm({ ...editForm, ngaySinh: event.target.value })} required /></label>
                  <label><span>Giới tính*</span><select value={editForm.gioiTinh} onChange={(event) => setEditForm({ ...editForm, gioiTinh: event.target.value })} required><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>
                  <label className="is-half"><span>Số điện thoại*</span><input value={editForm.soDienThoai} onChange={(event) => setEditForm({ ...editForm, soDienThoai: event.target.value })} placeholder="Nhập số điện thoại liên hệ" required /></label>
                  <label className="is-half"><span>Email</span><input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="example@gmail.com" /></label>
                  <label className="is-half"><span>Quốc tịch*</span><input value={editForm.quocTich} onChange={(event) => setEditForm({ ...editForm, quocTich: event.target.value })} placeholder="Ví dụ: Việt Nam" required /></label>
                  <label className="is-half"><span>CCCD/Hộ chiếu*</span><input value={editForm.cccd} onChange={(event) => setEditForm({ ...editForm, cccd: event.target.value })} placeholder="Số căn cước công dân" required /></label>
                </div>
              </section>

              <section className="kh-register-section">
                <h3><Icon name="home" />Nhu cầu thuê phòng</h3>
                <div className="kh-register-grid">
                  <label><span>Số lượng người ở*</span><input type="number" min="1" value={editForm.soNguoiO} onChange={(e) => setEditForm({ ...editForm, soNguoiO: e.target.value })} required /></label>
                  <label><span>Hình thức thuê*</span><select value={editForm.hinhThucThue} onChange={(e) => setEditForm({ ...editForm, hinhThucThue: e.target.value })} required>{filterOptions.hinhThucThue.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                  <label className="is-half"><span>Khu vực mong muốn*</span><input value={editForm.khuVucMongMuon} onChange={(e) => setEditForm({ ...editForm, khuVucMongMuon: e.target.value })} placeholder="Ví dụ: Quận 3, gần trường học..." required /></label>
                  <label className="is-half"><span>Loại phòng mong muốn*</span><select value={editForm.loaiPhongYeuCau} onChange={(e) => setEditForm({ ...editForm, loaiPhongYeuCau: e.target.value })} required><option value="">Chọn loại phòng</option>{filterOptions.loaiPhong.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                  <div className="kh-price-range is-half">
                    <label><span>Giá từ (đ/tháng)</span><input type="number" min="0" value={editForm.mucGiaTu || editForm.mucGia || ''} onChange={(e) => setEditForm({ ...editForm, mucGiaTu: e.target.value, mucGia: e.target.value })} placeholder="VD: 2.000.000" /></label>
                    <span className="kh-price-sep">—</span>
                    <label><span>Giá đến (đ/tháng)</span><input type="number" min="0" value={editForm.mucGiaDen || ''} onChange={(e) => setEditForm({ ...editForm, mucGiaDen: e.target.value })} placeholder="VD: 3.000.000" /></label>
                  </div>
                  <label className="is-half"><span>Thời gian dự kiến dọn vào*</span><input type="date" value={editForm.ngayDuKienVaoO} onChange={(e) => setEditForm({ ...editForm, ngayDuKienVaoO: e.target.value })} required /></label>
                  <label className="is-half"><span>Thời hạn thuê (tháng)*</span><input type="number" min="1" value={editForm.thoiHanThue} onChange={(e) => setEditForm({ ...editForm, thoiHanThue: e.target.value })} placeholder="Ví dụ: 6" required /></label>
                  <label className="is-wide"><span>Yêu cầu khác</span><textarea value={editForm.ghiChu} onChange={(e) => setEditForm({ ...editForm, ghiChu: e.target.value })} placeholder="Giờ giấc sinh hoạt, yêu cầu yên tĩnh, gửi xe..." /></label>
                </div>
              </section>
            </div>
            <div className="kp-modal-actions kh-register-actions">
              <button className="kp-btn kp-btn-soft" type="button" onClick={() => setEditModal(null)}>Hủy</button>
              <button className="kp-btn kp-btn-primary" type="submit" disabled={editSaving}>{editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
