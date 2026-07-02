import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { khachMoiApi } from '../khachMoi/khachMoi.api.js';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';
import '../khamPhaPhong/khamPhaPhong.css';
import './khachHangPortal.css';
import LichXemPhongPage from '../lichXemPhong/LichXemPhongPage.jsx';

// Gốc backend để mở lại file chứng từ đã upload (DB lưu đường dẫn /uploads/chung-tu/..).
const FILE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const filtersInitial = { tuKhoa: '', khuVuc: '', hinhThucThue: '', loaiPhong: '', mucGiaToiDa: '' };
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
  gioiTinhThue: 'Nam',
  soNam: 0,
  soNu: 0,
  ngayDuKienVaoO: '',
  thoiHanThue: '',
  ghiChu: ''
};

const filterOptions = {
  hinhThucThue: ['', 'Ghép nam', 'Ghép nữ', 'Nguyên căn'],
  khuVuc: ['', 'Quận 1', 'Bình Thạnh', 'Thủ Đức'],
  loaiPhong: ['', 'Phòng 2 người', 'Phòng 4 người', 'Phòng 6 người', 'Phòng VIP 2 người'],
  mucGiaToiDa: [
    { value: '', label: 'Tất cả mức giá' },
    { value: '2500000', label: 'Dưới 2,5 triệu' },
    { value: '3000000', label: 'Dưới 3 triệu' },
    { value: '5000000', label: 'Dưới 5 triệu' }
  ]
};

const branchContacts = [
  {
    name: 'Chi nhánh Quận 1',
    area: '12 Nguyễn Trãi, Quận 1',
    phone: '02811110001'
  },
  {
    name: 'Chi nhánh Bình Thạnh',
    area: '45 Điện Biên Phủ, Bình Thạnh',
    phone: '02811110002'
  },
  {
    name: 'Chi nhánh Thủ Đức',
    area: '88 Võ Văn Ngân, Thủ Đức',
    phone: '02811110003'
  }
];

const ALLOWED_RENT_AREAS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 9', 'Quận 10',
  'Bình Thạnh', 'Phú Nhuận', 'Gò Vấp', 'Tân Bình', 'Thủ Đức'
];

function normalizeAreaInput(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

function getAreaAliases(area) {
  const normalized = normalizeAreaInput(area);
  const aliases = [normalized];

  if (!normalized.startsWith('quan ') && normalized !== 'thu duc') {
    aliases.push(`quan ${normalized}`);
  }
  if (normalized === 'thu duc') {
    aliases.push('quan thu duc', 'thanh pho thu duc', 'tp thu duc');
  }

  return aliases;
}

function resolveAllowedArea(value) {
  const normalized = normalizeAreaInput(value);
  return ALLOWED_RENT_AREAS.find((area) => getAreaAliases(area).includes(normalized)) || '';
}

function getPhoneError(value) {
  if (!value) return '';
  return /^\d{10}$/.test(value) ? '' : 'Số điện thoại phải có đúng 10 chữ số.';
}

function getCccdError(value) {
  if (!value) return '';
  return /^\d{12}$/.test(value) ? '' : 'CCCD phải có đúng 12 chữ số.';
}

function getAreaError(value) {
  if (!value) return '';
  return resolveAllowedArea(value) ? '' : 'Khu vực không hợp lệ. Vui lòng chọn một quận trong danh sách.';
}

function toLocalDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMaxBirthDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toLocalDateInputValue(yesterday);
}

function getBirthDateError(value) {
  if (!value) return '';
  return value <= getMaxBirthDate() ? '' : 'Ngày sinh phải trước ngày hiện tại.';
}

function validateContactAndArea(form) {
  if (!form.ngaySinh || getBirthDateError(form.ngaySinh)) return 'Ngày sinh phải trước ngày hiện tại.';
  if (!/^\d{10}$/.test(form.soDienThoai || '')) return 'Số điện thoại phải có đúng 10 chữ số.';
  if (!/^\d{12}$/.test(form.cccd || '')) return 'CCCD phải có đúng 12 chữ số.';
  if (!resolveAllowedArea(form.khuVucMongMuon)) return 'Khu vực mong muốn không hợp lệ.';
  return '';
}

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
    payment: <><rect x="3.5" y="6.5" width="17" height="11" rx="2" /><path d="M3.5 10h17M15.5 14h2" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8 12 3 7 8" /><path d="M12 3v12" /></>,
    bank: <><path d="M4 10h16" /><path d="m12 4 8 4H4z" /><path d="M6 10v7M10 10v7M14 10v7M18 10v7" /><path d="M4 20h16" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></>,
    repair: <path d="M14.5 6.2a4.2 4.2 0 0 0-5.2 5.2L4 16.7 7.3 20l5.3-5.3a4.2 4.2 0 0 0 5.2-5.2l-2.9 2.9-2.3-2.3z" />,
    support: <><path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,
    phone: <path d="M7.1 3.5 9.7 7.8 7.9 9.6c1.3 2.6 3.4 4.7 6 6l1.8-1.8 4.3 2.6v2.8c0 1-0.8 1.8-1.8 1.8C9.8 20.5 3.5 14.2 3 5.8 3 4.8 3.8 4 4.8 4h2.3Z" />,
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

function formatMoney(value) {
  const amount = Number(value);
  if (value == null || value === '' || !Number.isFinite(amount) || amount <= 0) return 'Chưa cập nhật';
  return amount.toLocaleString('vi-VN') + 'đ/tháng';
}

function formatSettlementMoney(value) {
  const amount = Number(value);
  if (value == null || value === '' || !Number.isFinite(amount)) return '0đ';
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

function formatPercent(value) {
  const amount = Number(value);
  if (value == null || value === '' || !Number.isFinite(amount)) return '0%';
  return `${amount.toLocaleString('vi-VN')}%`;
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();
  if (!raw) return null;

  const numericText = raw.replace(/[^\d,.-]/g, '');
  const commaAsDecimal = numericText.includes(',') && numericText.lastIndexOf(',') > numericText.lastIndexOf('.');
  const cleaned = commaAsDecimal
    ? numericText.replace(/\./g, '').replace(',', '.')
    : numericText.replace(/,/g, '');
  const compact = (cleaned.match(/\./g) || []).length > 1
    ? cleaned.replace(/\./g, '')
    : cleaned;
  const amount = Number(compact);

  return Number.isFinite(amount) ? amount : null;
}

function normalizeMoneyVnd(value) {
  const amount = parseMoney(value);
  if (amount == null || amount <= 0) return null;
  return Math.round(amount);
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

function getTraPhongActiveStep(yeuCauTraPhong) {
  if (!yeuCauTraPhong) return 1;

  const trangThai = yeuCauTraPhong.trangThai || '';
  const trangThaiDoiSoat = yeuCauTraPhong.doiSoat?.trangThai || '';
  const daGuiPhuongThucThanhToan = Boolean(yeuCauTraPhong.doiSoat?.phuongThucThanhToan);

  if (trangThai === 'Hoàn tất' || trangThai === 'Chờ hoàn tất') return 4;
  if (['Chờ hoàn cọc', 'Chờ thanh toán thêm'].includes(trangThaiDoiSoat) && daGuiPhuongThucThanhToan) return 4;
  if (['Chờ hoàn cọc', 'Chờ thanh toán thêm'].includes(trangThai) || ['Chờ hoàn cọc', 'Chờ thanh toán thêm'].includes(trangThaiDoiSoat)) return 3;
  if (trangThai === 'Chờ đối soát' || trangThai === 'Chờ ký biên bản' || yeuCauTraPhong.doiSoat) return 2;
  return 1;
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
  if (['Xác nhận cọc', 'Đã xem', 'Đã lên lịch', 'Đã TT', 'Hiệu lực', 'Đã tiếp nhận', 'Chờ xác nhận cọc'].includes(status)) return 'done';
  if (['Từ chối', 'Hủy', 'Đã hủy', 'Yêu cầu hủy', 'Hết hạn'].includes(status)) return 'danger';
  return 'warn';
}

function statusIcon(status = '') {
  if (['Xác nhận cọc', 'Đã xem', 'Đã tiếp nhận', 'Chờ xác nhận cọc'].includes(status)) return '✅';
  if (['Từ chối', 'Hủy', 'Đã hủy'].includes(status)) return '❌';
  if (status === 'Chờ tiếp nhận') return '⏳';
  if (status === 'Đã tiếp nhận') return '📥';
  return '⏳';
}

function getProfileDisplayStatus(profile = {}) {
  if (profile?.biHuyDoTatCaLich) return 'Hủy';
  return profile?.trangThaiHienThi || profile?.trangThai || '';
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
                <strong>{phong.hinhThucThue}</strong>
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
              <span>Giá thuê hàng tháng</span>
              <strong>{formatMoney(phong.giaThue)}</strong>
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
            {phong.giaThueTheoGiuong && (
              <div><span>Giá/giường</span><strong>{Number(phong.giaThueTheoGiuong).toLocaleString('vi-VN')}đ</strong></div>
            )}
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
  const [traPhongSubmitting, setTraPhongSubmitting] = useState(false);
  const [doiSoatSubmitting, setDoiSoatSubmitting] = useState(false);
  const [showDoiSoatReject, setShowDoiSoatReject] = useState(false);
  const [doiSoatRejectReason, setDoiSoatRejectReason] = useState('');
  const [doiSoatPaymentMethod, setDoiSoatPaymentMethod] = useState('Chuyển khoản');
  const [doiSoatPaymentFile, setDoiSoatPaymentFile] = useState(null);
  const [doiSoatPaymentSubmitting, setDoiSoatPaymentSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState(null);
  const [supportModal, setSupportModal] = useState(false);
  const [registrationNoticeOpen, setRegistrationNoticeOpen] = useState(false);

  const locks = getNavLocks(overview?.trangThai || {});
  const registrationLocked = Boolean(overview?.trangThai?.coQuyTrinhThueDangHoatDong);
  const registrationLockedMessage = overview?.trangThai?.thongBaoKhoaDangKy
    || 'Bạn đang có phiếu đăng ký/đặt cọc/hợp đồng chưa kết thúc. Chỉ được tạo phiếu đăng ký mới khi luồng thuê hiện tại kết thúc.';

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

  useEffect(() => {
    if (!registrationNoticeOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setRegistrationNoticeOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [registrationNoticeOpen]);

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
      cccd: user?.cccd || user?.CCCD || user?.soCCCD || user?.cmnd || ''
    };
  }

  function firstFilled(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '') ?? '';
  }

  function toDateInput(value) {
    return value ? String(value).slice(0, 10) : '';
  }

  function getProfilePrice(profile = {}) {
    const rawPrice = firstFilled(profile.mucGiaToiDa, profile.MucGiaToiDa, profile.mucGia, profile.MucGia);
    return normalizeMoneyVnd(rawPrice) || rawPrice || '';
  }

  function getTenantGender(profile = {}) {
    const soNam = Number(firstFilled(profile.soNam, profile.SoNam, 0)) || 0;
    const soNu = Number(firstFilled(profile.soNu, profile.SoNu, 0)) || 0;
    const rawGender = firstFilled(profile.gioiTinhThue, profile.GioiTinhThue, profile.GioiTinh);

    if (rawGender === 'Nam' || rawGender === 'Nữ' || rawGender === 'Khác') return rawGender;
    if (soNam > 0 && soNu === 0) return 'Nam';
    if (soNu > 0 && soNam === 0) return 'Nữ';
    return 'Khác';
  }

  function buildEditFormFromProfile(profile = {}) {
    return {
      hoTen: firstFilled(profile.hoTen, profile.HoTen, user?.hoTen),
      ngaySinh: toDateInput(firstFilled(profile.ngaySinh, profile.NgaySinh, user?.ngaySinh)),
      gioiTinh: firstFilled(profile.gioiTinhKhach, profile.GioiTinhKhach, user?.gioiTinh, profile.gioiTinh),
      soDienThoai: firstFilled(profile.soDienThoai, profile.SDT, profile.Sdt, user?.soDienThoai),
      email: firstFilled(profile.email, profile.Email, user?.email),
      quocTich: firstFilled(profile.quocTich, profile.QuocTich, user?.quocTich, 'Việt Nam'),
      cccd: firstFilled(profile.cccd, profile.CCCD, profile.soCCCD, user?.cccd, user?.CCCD, user?.soCCCD, user?.cmnd),
      khuVucMongMuon: firstFilled(profile.khuVucMongMuon, profile.KhuVucMongMuon),
      loaiPhongYeuCau: firstFilled(profile.loaiPhongYeuCau, profile.LoaiPhongYeuCau),
      mucGiaToiDa: getProfilePrice(profile),
      soNguoiO: firstFilled(profile.soNguoiO, profile.SoNguoiO, 1),
      gioiTinhThue: getTenantGender(profile),
      soNam: firstFilled(profile.soNam, profile.SoNam, 0),
      soNu: firstFilled(profile.soNu, profile.SoNu, 0),
      ngayDuKienVaoO: toDateInput(firstFilled(profile.ngayDuKienVaoO, profile.NgayDuKienVaoO, profile.ThoiGianDuKienVaoO)),
      thoiHanThue: firstFilled(profile.thoiHanThue, profile.ThoiHanThue),
      ghiChu: firstFilled(profile.ghiChu, profile.GhiChu, profile.YeuCauKhac)
    };
  }

  function canOpenRentForm() {
    if (!registrationLocked) return true;
    setRegistrationNoticeOpen(true);
    return false;
  }

  function openRentForm(room) {
    if (!canOpenRentForm()) return;

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
      mucGiaToiDa: firstRoom.giaThue ? String(normalizeMoneyVnd(firstRoom.giaThue) || firstRoom.giaThue) : '',
      gioiTinhThue: firstRoom.gioiTinhChoPhep || rentInitial.gioiTinhThue
    });
    setRentModal(true);
  }

  function openReRegisterForm(profile) {
    if (!canOpenRentForm()) return;

    setSelectedRooms([]);
    setRentForm({
      ...getRentDefaultsFromUser(),
      khuVucMongMuon: profile.khuVucMongMuon || '',
      loaiPhongYeuCau: profile.loaiPhongYeuCau || '',
      mucGiaToiDa: getProfilePrice(profile),
      soNguoiO: profile.soNguoiO || '1',
      gioiTinhThue: getTenantGender(profile),
      soNam: profile.soNam || 0,
      soNu: profile.soNu || 0,
      ngayDuKienVaoO: profile.ngayDuKienVaoO ? profile.ngayDuKienVaoO.slice(0, 10) : '',
      thoiHanThue: profile.thoiHanThue || '',
      ghiChu: profile.ghiChu || ''
    });
    setRentModal(true);
  }

  function openGeneralRentForm() {
    if (!canOpenRentForm()) return;

    setSelectedRooms([]);
    setRentForm(getRentDefaultsFromUser());
    setRentModal(true);
  }

  async function submitRent(event) {
    event.preventDefault();

    const validationError = validateContactAndArea(rentForm);
    if (validationError) {
      setToast(validationError);
      return;
    }

    if (rentForm.gioiTinhThue === 'Khác') {
      const soNguoiO = Number(rentForm.soNguoiO) || 0;
      const soNam = Number(rentForm.soNam) || 0;
      const soNu = Number(rentForm.soNu) || 0;
      if (soNam + soNu !== soNguoiO) {
        setToast('Tổng số lượng nam và nữ không khớp với số người dự kiến ở.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await khachMoiApi.createHoSo({
        ...rentForm,
        khuVucMongMuon: resolveAllowedArea(rentForm.khuVucMongMuon),
        phongQuanTam: selectedRooms.map((room) => room.tenPhong).join(', '),
        mucGiaToiDa: normalizeMoneyVnd(rentForm.mucGiaToiDa) || '',
        gioiTinhThue: rentForm.gioiTinhThue,
        soNam: rentForm.soNam || 0,
        soNu: rentForm.soNu || 0,
        ghiChu: rentForm.ghiChu || ''
      });
      setRentModal(false);
      setSelectedRooms([]);
      await loadPortal(filters);
      setActiveTab('ho-so');
      setToast('Đã gửi hồ sơ nhu cầu thuê.');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || requestError.message || 'Không thể gửi hồ sơ lúc này.');
    } finally {
      setSubmitting(false);
    }
  }

  async function openEditModal(profile) {
    setEditForm(buildEditFormFromProfile(profile));
    setEditModal(profile);

    if (!profile?.maDangKy) return;

    try {
      const { data } = await khachMoiApi.getHoSoDetail(profile.maDangKy);
      const detail = unwrapApiPayload(data);
      const mergedProfile = { ...profile, ...detail };
      setEditModal(mergedProfile);
      setEditForm(buildEditFormFromProfile(mergedProfile));
    } catch {
      setToast('Đang hiển thị thông tin hiện có của hồ sơ.');
    }
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
        soNguoiO: detail.soNguoiO ?? detail.SoNguoiO ?? profile.soNguoiO,
        ngayDuKienVaoO: detail.ngayDuKienVaoO || detail.NgayDuKienVaoO || profile.ngayDuKienVaoO,
        thoiHanThue: detail.thoiHanThue ?? detail.ThoiHanThue ?? profile.thoiHanThue,
        ghiChu: detail.ghiChu || detail.GhiChu || profile.ghiChu,
        trangThai: detail.trangThai || detail.TrangThai || profile.trangThai,
        trangThaiHienThi: detail.trangThaiHienThi || profile.trangThaiHienThi,
        biHuyDoTatCaLich: detail.biHuyDoTatCaLich ?? profile.biHuyDoTatCaLich
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

    const validationError = validateContactAndArea(editForm);
    if (validationError) {
      setToast(validationError);
      return;
    }

    if (editForm.gioiTinhThue === 'Khác') {
      const soNguoiO = Number(editForm.soNguoiO) || 0;
      const soNam = Number(editForm.soNam) || 0;
      const soNu = Number(editForm.soNu) || 0;
      if (soNam + soNu !== soNguoiO) {
        setToast('Tổng số lượng nam và nữ không khớp với số người dự kiến ở.');
        return;
      }
    }

    setEditSaving(true);
    try {
      let finalForm = {
        ...editForm,
        khuVucMongMuon: resolveAllowedArea(editForm.khuVucMongMuon),
        mucGiaToiDa: normalizeMoneyVnd(editForm.mucGiaToiDa) || ''
      };

      await khachMoiApi.updateHoSo(editModal.maDangKy, finalForm);
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
                <SelectField label="Hình thức thuê" value={filters.hinhThucThue} options={filterOptions.hinhThucThue} onChange={(value) => setFilters({ ...filters, hinhThucThue: value })} />
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
                      <div><h3>{room.tenPhong}</h3><strong>{formatMoney(room.giaThue)}</strong></div>
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
                <button className="kp-btn kp-btn-light kp-full" type="button" onClick={() => setSupportModal(true)}>
                  <Icon name="support" />Liên hệ ngay
                </button>
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
      : allProfiles.filter(p => getProfileDisplayStatus(p) === profileFilter);
      
    return (
      <section>
        <div className="kh-section-actions">
          <button className="kp-btn kp-btn-primary" type="button" onClick={openGeneralRentForm}>
            <Icon name="profile" /> Tạo nhu cầu thuê mới
          </button>
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
        
        {allProfiles.length > 0 && (
          <div className="lxp-chips-bar" style={{ marginBottom: 16 }}>
            <div className="lxp-chips">
              {[
                { key: 'Tất cả', label: 'Tất cả' },
                { key: 'Chờ tiếp nhận', label: 'Chờ tiếp nhận' },
                { key: 'Chờ xác nhận cọc', label: 'Chờ xác nhận cọc' },
                { key: 'Xác nhận cọc', label: 'Xác nhận cọc' },
                { key: 'Từ chối', label: 'Từ chối' },
                { key: 'Hủy', label: 'Hủy' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={`lxp-chip ${profileFilter === f.key ? 'lxp-chip-primary is-active' : 'lxp-chip-neutral'}`}
                  onClick={() => setProfileFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="kh-list">
          {profiles.map((profile) => (
            <article className="kh-profile-card" key={profile.maDangKy}>
              <div className="kh-profile-header">
                <div className="kh-profile-title-row">
                  <h3>Hồ sơ đăng ký #{profile.maDangKy}</h3>
                  <span className={`kh-status-chip kh-status-chip--${statusTone(getProfileDisplayStatus(profile))}`}>
                    {statusIcon(getProfileDisplayStatus(profile))} {getProfileDisplayStatus(profile)}
                  </span>
                </div>
                <span className="kh-profile-date">Ngày tạo: {formatDate(profile.ngayDangKy)}</span>
              </div>

              <div className="kh-profile-meta-grid">
                <div className="kh-meta-item">
                  <Icon name="people" />
                  <span>{profile.hinhThucThue} · {profile.soNguoiO || 1} người</span>
                </div>
                {profile.khuVucMongMuon && (
                  <div className="kh-meta-item">
                    <Icon name="map" />
                    <span>Khu vực: {profile.khuVucMongMuon}</span>
                  </div>
                )}
                {profile.mucGia && (
                  <div className="kh-meta-item">
                    <Icon name="payment" />
                    <span>Mức giá: {Number(profile.mucGia).toLocaleString('vi-VN')}đ/tháng</span>
                  </div>
                )}
                {profile.ngayDuKienVaoO && (
                  <div className="kh-meta-item">
                    <Icon name="calendar" />
                    <span>Ngày vào ở: {formatDate(profile.ngayDuKienVaoO)}</span>
                  </div>
                )}
              </div>

              {getProfileDisplayStatus(profile) === 'Từ chối' && profile.ghiChu && (
                <div className="kh-profile-reject-reason">
                  <Icon name="lock" />
                  <span>Lý do: {profile.ghiChu}</span>
                </div>
              )}

              <div className="kh-profile-footer">
                <div />
                <div className="kh-profile-actions">
                  {profile.trangThai === 'Chờ tiếp nhận' && (
                    <button className="kp-btn kp-btn-primary" type="button" onClick={() => openEditModal(profile)}>
                      Cập nhật hồ sơ
                    </button>
                  )}
                  <button className="kp-btn kp-btn-soft" type="button" onClick={() => openProfileDetail(profile)}>
                    Xem chi tiết
                  </button>
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
    return (
      <LichXemPhongPage
        schedules={overview?.lichXem || []}
        onViewRoomDetail={(schedule) => openScheduleDetail(schedule)}
        onReschedule={async (appointment, form) => {
          const schedule = appointment.rawSchedule || {};
          await khachMoiApi.yeuCauDieuChinhLich(schedule.id || appointment.id, {
            thaoTac: 'Đổi lịch',
            thoiGianMoi: form.timeText,
            lyDo: form.reason
          });

          const { data: summary } = await khachMoiApi.getTongQuan();
          setOverview(summary);
          setToast('Đã gửi yêu cầu đổi lịch. Vui lòng chờ nhân viên xác nhận.');
        }}
        onCancel={async (appointment, form) => {
          const schedule = appointment.rawSchedule || {};
          await khachMoiApi.yeuCauDieuChinhLich(schedule.id || appointment.id, {
            thaoTac: 'Hủy',
            lyDo: form.reason
          });

          const { data: summary } = await khachMoiApi.getTongQuan();
          setOverview(summary);
          setToast('Đã gửi yêu cầu hủy hẹn. Vui lòng chờ nhân viên xác nhận.');
        }}
      />
    );
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

  async function guiYeuCauTraPhong(hd) {
    setTraPhongSubmitting(true);
    try {
      const { data } = await khachMoiApi.guiYeuCauTraPhong({ maHopDong: hd.MaHopDong });
      setHopDongDashboard((current) => ({
        ...current,
        yeuCauTraPhong: data?.data || data || null
      }));
      setResultModal({
        type: 'success',
        title: 'Đã gửi yêu cầu trả phòng',
        message: 'Yêu cầu của bạn đã được ghi nhận. Nhân viên sẽ kiểm tra và liên hệ khi cần.',
        confirmText: 'Đã hiểu'
      });
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể gửi yêu cầu trả phòng lúc này.');
    } finally {
      setTraPhongSubmitting(false);
    }
  }

  async function huyYeuCauTraPhong(yeuCau) {
    if (!yeuCau?.maPhieuTra) return;
    setTraPhongSubmitting(true);
    try {
      await khachMoiApi.huyYeuCauTraPhong(yeuCau.maPhieuTra);
      setHopDongDashboard((current) => ({
        ...current,
        yeuCauTraPhong: null
      }));
      setResultModal({
        type: 'success',
        title: 'Đã hủy yêu cầu trả phòng',
        message: 'Yêu cầu trả phòng đã được hủy. Bạn có thể gửi lại khi cần.',
        confirmText: 'Đóng'
      });
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể hủy yêu cầu trả phòng lúc này.');
    } finally {
      setTraPhongSubmitting(false);
    }
  }

  async function phanHoiDoiSoat(doiSoat, dongY) {
    if (!doiSoat?.maDoiSoat) return;
    if (!dongY && !doiSoatRejectReason.trim()) {
      setToast('Vui lòng nhập lý do không đồng ý.');
      return;
    }

    setDoiSoatSubmitting(true);
    try {
      await khachMoiApi.phanHoiDoiSoatTraPhong(doiSoat.maDoiSoat, {
        dongY,
        lyDoKhongDongY: dongY ? null : doiSoatRejectReason.trim()
      });
      setShowDoiSoatReject(false);
      setDoiSoatRejectReason('');
      await loadHopDongDashboard();
      setResultModal({
        type: 'success',
        title: dongY ? 'Đã đồng ý kết quả đối soát' : 'Đã gửi yêu cầu điều chỉnh',
        message: dongY
          ? 'Kết quả đối soát đã được ghi nhận. Hệ thống sẽ chuyển sang bước xử lý khoản tiền phù hợp.'
          : 'Lý do không đồng ý đã được gửi cho quản lý để kiểm tra lại.',
        confirmText: 'Đóng'
      });
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể gửi phản hồi đối soát lúc này.');
    } finally {
      setDoiSoatSubmitting(false);
    }
  }

  async function ghiNhanThanhToanDoiSoat(doiSoat) {
    if (!doiSoat?.maDoiSoat) return;
    const trangThaiDoiSoat = String(doiSoat.trangThai || '').toLowerCase();
    const loaiQuyetToan = String(doiSoat.loaiQuyetToan || '').toLowerCase();
    const laHoanCoc = loaiQuyetToan.includes('hoàn cọc')
      || trangThaiDoiSoat.includes('hoàn cọc')
      || Number(doiSoat.soTienHoanThucTe || 0) > 0;
    if (!laHoanCoc && doiSoatPaymentMethod === 'Chuyển khoản' && !doiSoatPaymentFile) {
      setToast('Vui lòng chọn file minh chứng khi thanh toán chuyển khoản.');
      return;
    }

    setDoiSoatPaymentSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('phuongThucThanhToan', doiSoatPaymentMethod);
      if (laHoanCoc) formData.append('loaiGhiNhan', 'hoan-coc');
      if (!laHoanCoc && doiSoatPaymentFile) formData.append('file', doiSoatPaymentFile);
      await khachMoiApi.ghiNhanThanhToanDoiSoatTraPhong(doiSoat.maDoiSoat, formData);
      setDoiSoatPaymentFile(null);
      await loadHopDongDashboard();
      const officeAddress = hopDongDashboard?.DiaChi || hopDongDashboard?.TenChiNhanh || 'văn phòng HomestayDorm';
      setResultModal({
        type: 'success',
        title: laHoanCoc ? 'Đã ghi nhận phương thức hoàn tiền' : 'Đã ghi nhận thông tin thanh toán',
        message: laHoanCoc
          ? 'Phương thức bạn muốn nhận hoàn tiền đã được ghi nhận. Vui lòng liên hệ quản lý để tiếp tục trả phòng.'
          : doiSoatPaymentMethod === 'Chuyển khoản'
            ? 'Đã thanh toán thành công. Vui lòng liên hệ với quản lý để tiếp tục trả phòng sau.'
            : `Vui lòng đến văn phòng tại ${officeAddress} để thanh toán tiền mặt và tiếp tục thủ tục trả phòng.`,
        confirmText: 'Đóng'
      });
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể ghi nhận thanh toán lúc này.');
    } finally {
      setDoiSoatPaymentSubmitting(false);
    }
  }

  async function copyPaymentText(text) {
    try {
      await navigator.clipboard.writeText(String(text || ''));
      setToast('Đã sao chép.');
    } catch {
      setToast('Không thể sao chép tự động.');
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
    const taiSan = hd.taiSan || [];
    const quyDinh = hd.quyDinh || [];
    const hinhThucThue = hd.HinhThucThue || (hd.MaGiuong ? 'Ghép giường' : 'Nguyên phòng');
    const yeuCauTraPhong = hd.yeuCauTraPhong || null;
    const coYeuCauChoXuLy = yeuCauTraPhong?.trangThai === 'Chờ xử lý';
    const coYeuCauTraPhong = Boolean(yeuCauTraPhong);
    const coYeuCauDaTiepNhan = coYeuCauTraPhong && !coYeuCauChoXuLy;
    const doiSoatTraPhong = yeuCauTraPhong?.doiSoat || null;
    const traPhongActiveStep = getTraPhongActiveStep(yeuCauTraPhong);
    const doiSoatInfoRows = doiSoatTraPhong
      ? [
          ['Ngày lập đối soát', formatDate(doiSoatTraPhong.ngayLap, true)],
          ['Ngày trả thực tế', formatDate(yeuCauTraPhong.ngayTraThucTe)],
          ['Trạng thái đối soát', doiSoatTraPhong.trangThai]
        ]
      : [];
    const doiSoatMoneyGroups = doiSoatTraPhong
      ? [
          {
            title: 'Tiền cọc và tỷ lệ hoàn',
            rows: [
              ['Tiền cọc ban đầu', formatSettlementMoney(doiSoatTraPhong.tienCocBanDau)],
              ['Số tháng lưu trú', `${Number(doiSoatTraPhong.soThangLuuTru || 0).toLocaleString('vi-VN')} tháng`],
              ['Tỷ lệ hoàn cọc hiện tại', formatPercent(doiSoatTraPhong.tyLeHoanCocHienTai)],
              ['Tiền cọc được hoàn theo quy định', formatSettlementMoney(doiSoatTraPhong.tienCocDuocHoan)]
            ]
          },
          {
            title: 'Các khoản khấu trừ',
            rows: [
              ['Tiền thuê còn nợ', formatSettlementMoney(doiSoatTraPhong.tienThueConNo)],
              ['Tiền dịch vụ còn nợ', formatSettlementMoney(doiSoatTraPhong.tienDichVuConNo)],
              ['Chi phí sửa chữa', formatSettlementMoney(doiSoatTraPhong.tongChiPhiSuaChua)],
              ['Tiền phạt vi phạm', formatSettlementMoney(doiSoatTraPhong.tienPhat)],
              ['Tổng khấu trừ', formatSettlementMoney(doiSoatTraPhong.tongKhauTru)]
            ]
          },
          {
            title: 'Kết quả quyết toán',
            rows: [
              ['Số tiền hoàn thực tế', formatSettlementMoney(doiSoatTraPhong.soTienHoanThucTe)],
              ['Số tiền khách phải thanh toán', formatSettlementMoney(doiSoatTraPhong.soTienKhachPhaiTT)]
            ]
          }
        ]
      : [];
    const doiSoatKetQuaText = doiSoatTraPhong
      ? Number(doiSoatTraPhong.soTienKhachPhaiTT || 0) > 0
        ? `Bạn cần thanh toán thêm ${formatSettlementMoney(doiSoatTraPhong.soTienKhachPhaiTT)}.`
        : Number(doiSoatTraPhong.soTienHoanThucTe || 0) > 0
          ? `Bạn được hoàn ${formatSettlementMoney(doiSoatTraPhong.soTienHoanThucTe)}.`
          : 'Phiếu này không phát sinh thu thêm hoặc hoàn cọc.'
      : '';
    const doiSoatCanRespond = ['Chờ phản hồi', 'Chờ xác nhận'].includes(doiSoatTraPhong?.trangThai || '') && !doiSoatTraPhong?.ghiChuPhanHoiKhach;
    const doiSoatFinalLabel = Number(doiSoatTraPhong?.soTienKhachPhaiTT || 0) > 0
      ? 'Khách cần thanh toán'
      : Number(doiSoatTraPhong?.soTienHoanThucTe || 0) > 0
        ? 'Khách được hoàn'
        : 'Kết quả quyết toán';
    const doiSoatFinalAmount = Number(doiSoatTraPhong?.soTienKhachPhaiTT || 0) > 0
      ? doiSoatTraPhong.soTienKhachPhaiTT
      : Number(doiSoatTraPhong?.soTienHoanThucTe || 0) > 0
        ? doiSoatTraPhong.soTienHoanThucTe
        : 0;
    const taiKhoanThanhToan = hd.taiKhoanThanhToan || {};
    const noiDungChuyenKhoan = doiSoatTraPhong
      ? `${doiSoatTraPhong.maDoiSoat || ''} ${hd.MaKhachHang || ''}`.trim()
      : '';
    const laHoanCocDoiSoat = doiSoatTraPhong?.trangThai === 'Chờ hoàn cọc' && Number(doiSoatTraPhong?.soTienHoanThucTe || 0) > 0;
    const laThuThemDoiSoat = doiSoatTraPhong?.trangThai === 'Chờ thanh toán thêm' && Number(doiSoatTraPhong?.soTienKhachPhaiTT || 0) > 0;
    const daGuiPhuongThucDoiSoat = Boolean(doiSoatTraPhong?.phuongThucThanhToan);
    const showDoiSoatPayment = (laThuThemDoiSoat || laHoanCocDoiSoat) && !daGuiPhuongThucDoiSoat;
    const diaChiVanPhong = hd.DiaChi || hd.TenChiNhanh || 'văn phòng HomestayDorm';
    const doiSoatCompletionTitle = laHoanCocDoiSoat
      ? 'Đã ghi nhận phương thức hoàn tiền'
      : doiSoatTraPhong?.phuongThucThanhToan === 'Chuyển khoản'
        ? 'Đã thanh toán thành công'
        : 'Thanh toán tại văn phòng';
    const doiSoatCompletionMessage = laHoanCocDoiSoat
      ? 'Phương thức bạn muốn nhận hoàn tiền đã được ghi nhận. Vui lòng liên hệ quản lý để tiếp tục trả phòng.'
      : doiSoatTraPhong?.phuongThucThanhToan === 'Chuyển khoản'
        ? 'Đã thanh toán thành công. Vui lòng liên hệ với quản lý để tiếp tục trả phòng sau.'
        : `Vui lòng đến văn phòng tại ${diaChiVanPhong} để thanh toán tiền mặt và tiếp tục thủ tục trả phòng.`;
    const doiSoatChungTu = doiSoatTraPhong?.chungTuThanhToan
      ? {
          fileName: String(doiSoatTraPhong.chungTuThanhToan).split('/').pop(),
          fileUrl: String(doiSoatTraPhong.chungTuThanhToan).startsWith('http')
            ? doiSoatTraPhong.chungTuThanhToan
            : `${FILE_BASE}${doiSoatTraPhong.chungTuThanhToan}`
        }
      : null;
    const chiTietKhauTruTraPhong = doiSoatTraPhong?.chiTietKhauTru || {};
    const hoaDonConNo = chiTietKhauTruTraPhong.hoaDonConNo || [];
    const chiTietHoaDon = chiTietKhauTruTraPhong.chiTietHoaDon || [];
    const chiTietHuHong = chiTietKhauTruTraPhong.chiTietHuHong || [];
    const bienBanKiemTra = chiTietKhauTruTraPhong.bienBanKiemTra || [];
    const bienBanViPham = chiTietKhauTruTraPhong.bienBanViPham || [];
    
    return (
      <section className="hd-dashboard">
        <div className="hd-process">
          {[
            { number: 1, title: 'Yêu cầu trả phòng', note: 'Đăng ký ngày trả' },
            { number: 2, title: 'Kết quả đối soát', note: 'Xem và phản hồi' },
            { number: 3, title: 'Thanh toán', note: 'Xử lý khoản tiền' },
            { number: 4, title: 'Hoàn tất', note: 'Kết thúc hợp đồng' }
          ].map((step) => (
            <div className={`hd-process-step ${step.number === traPhongActiveStep ? 'is-active' : ''}`} key={step.number}>
              <span className="hd-process-circle">{step.number}</span>
              <strong>{step.title}</strong>
              <small>{step.note}</small>
            </div>
          ))}
        </div>

        {!doiSoatTraPhong && (
        <div className="hd-overview-top">
          <div className="hd-banner" style={{ backgroundImage: `url(${hd.UrlImg || getDemoRoomImage(hd.MaPhong, 0)})` }}>
            <div className="hd-banner-overlay" />
            <div className="hd-banner-content">
              <span className={`hd-badge ${hd.TrangThai === 'Hiệu lực' ? 'is-active' : ''}`}>{hd.TrangThai || 'Hợp đồng'}</span>
              <h2>{hd.TenPhong || 'Phòng đang thuê'} - {hd.TenLoaiPhong || 'Loại phòng'}</h2>
              <p>{hd.TenChiNhanh || 'HomestayDorm'} • Tầng {getRoomFloor(hd.MaPhong) || 1} • {hd.MaGiuong ? `Giường ${hd.MaGiuong}` : 'Nguyên phòng'}</p>
            </div>
          </div>

          <div className="hd-card hd-contract-summary">
            <h3>Hợp đồng của bạn</h3>
            <div className="hd-summary-row"><span>Mã hợp đồng</span><strong>{hd.MaHopDong}</strong></div>
            <div className="hd-summary-row"><span>Ngày bắt đầu</span><strong>{formatDate(hd.NgayBatDau)}</strong></div>
            <div className="hd-summary-row"><span>Ngày hết hạn</span><strong>{formatDate(hd.NgayKetThuc)}</strong></div>
            <span className="hd-success-badge"><Icon name="check" />Hợp đồng chính chủ</span>
          </div>
        </div>
        )}

        {doiSoatTraPhong && traPhongActiveStep === 4 && (
          <section className="hd-completion-view">
            <div className="hd-card hd-completion-card">
              <div className="hd-completion-icon">
                <Icon name={doiSoatTraPhong.phuongThucThanhToan === 'Chuyển khoản' ? 'check' : 'map'} />
              </div>
              <h3>{doiSoatCompletionTitle}</h3>
              <p>{doiSoatCompletionMessage}</p>
            </div>
          </section>
        )}

        {doiSoatTraPhong && traPhongActiveStep !== 4 && (
          <section className="hd-settlement-review">
            <div className="hd-settlement-info">
              {doiSoatInfoRows.map(([label, value]) => (
                <div key={label}>
                  <Icon name={label.includes('Ngày') ? 'calendar' : label.includes('Trạng thái') ? 'info' : 'invoice'} />
                  <span>{label}</span>
                  <strong>{value || 'Chưa cập nhật'}</strong>
                </div>
              ))}
            </div>

            <div className="hd-settlement-review-grid">
              <div className="hd-card hd-settlement-card">
                <div className="hd-card-header">
                  <Icon name="invoice" />
                  <h3>Chi tiết đối soát</h3>
                </div>
                <div className="hd-settlement-money">
                  {doiSoatMoneyGroups.slice(0, 2).map((group) => (
                    <section key={group.title}>
                      <h4>{group.title}</h4>
                      {group.rows.map(([label, value]) => (
                        <React.Fragment key={label}>
                          <div className="hd-money-row">
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                          {group.title === 'Các khoản khấu trừ' && label === 'Tiền thuê còn nợ' && hoaDonConNo.length > 0 && (
                            <div className="hd-deduction-detail-list">
                              {hoaDonConNo.map((hoaDon) => (
                                <div className="hd-deduction-detail" key={hoaDon.maHoaDon || `${hoaDon.maHopDong}-${hoaDon.kyThanhToan}`}>
                                  <span>{hoaDon.tenKhoanThue || `Tiền thuê kỳ ${hoaDon.kyThanhToan || '--'}`}</span>
                                  <small>Hạn TT: {formatDate(hoaDon.ngayHanTT)} · Trạng thái: {hoaDon.trangThai || '--'}</small>
                                  <strong>{formatSettlementMoney(hoaDon.thanhTien)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                          {group.title === 'Các khoản khấu trừ' && label === 'Tiền dịch vụ còn nợ' && chiTietHoaDon.length > 0 && (
                            <div className="hd-deduction-detail-list">
                              {chiTietHoaDon.map((line) => (
                                <div className="hd-deduction-detail" key={line.maChiTietHD || `${line.maHoaDon}-${line.tenDichVu}`}>
                                  <span>{line.tenDichVu || 'Dịch vụ'}</span>
                                  <small>
                                    SL: {Number(line.soLuong || 0).toLocaleString('vi-VN')} {line.donViTinh || ''}
                                    {' '}· Đơn giá: {formatSettlementMoney(line.donGia)}
                                  </small>
                                  <strong>{formatSettlementMoney(line.thanhTien)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                          {group.title === 'Các khoản khấu trừ' && label === 'Chi phí sửa chữa' && (chiTietHuHong.length > 0 || bienBanKiemTra.length > 0) && (
                            <div className="hd-deduction-detail-list">
                              {chiTietHuHong.length > 0 ? chiTietHuHong.map((item) => (
                                <div className="hd-deduction-detail" key={item.maChiTietHH || `${item.maBienBanKT}-${item.maTaiSan}`}>
                                  <span>{item.tenTaiSan || item.maTaiSan || 'Hư hỏng phòng'}</span>
                                  <small>{item.moTaHuHong || 'Chưa có mô tả'}</small>
                                  <strong>{formatSettlementMoney(item.chiPhiSuaChua)}</strong>
                                </div>
                              )) : bienBanKiemTra.map((item) => (
                                <div className="hd-deduction-detail" key={item.maBienBanKT}>
                                  <span>Kiểm tra phòng</span>
                                  <small>Ngày kiểm tra: {formatDate(item.ngayKiemTra)} · {item.tinhTrangPhong || '--'}</small>
                                  <strong>{formatSettlementMoney(item.tongChiPhiSuaChua)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                          {group.title === 'Các khoản khấu trừ' && label === 'Tiền phạt vi phạm' && bienBanViPham.length > 0 && (
                            <div className="hd-deduction-detail-list">
                              {bienBanViPham.map((item) => (
                                <div className="hd-deduction-detail" key={item.maBBViPham}>
                                  <span>{item.tenDieuKhoan || 'Vi phạm'}</span>
                                  <small>Ngày vi phạm: {formatDate(item.ngayViPham)} · {item.moTaViPham || item.hinhThucXuPhat || '--'}</small>
                                  <strong>{formatSettlementMoney(item.soTienPhat)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </section>
                  ))}
                </div>
              </div>

              <div className="hd-card hd-settlement-summary-card">
                <div className="hd-card-header">
                  <Icon name="payment" />
                  <h3>Tóm tắt quyết toán</h3>
                </div>
                <div className="hd-summary-money-row">
                  <span>Tiền cọc được hoàn</span>
                  <strong>{formatSettlementMoney(doiSoatTraPhong.tienCocDuocHoan)}</strong>
                </div>
                <div className="hd-summary-money-row is-deduct">
                  <span>Tổng khấu trừ</span>
                  <strong>{formatSettlementMoney(doiSoatTraPhong.tongKhauTru)}</strong>
                </div>
                <div className="hd-settlement-result">
                  <span>{doiSoatFinalLabel}</span>
                  <strong>{formatSettlementMoney(doiSoatFinalAmount)}</strong>
                </div>

                {doiSoatCanRespond ? (
                  <>
                    <div className="hd-settlement-actions">
                      <button
                        className="kp-btn hd-btn-teal"
                        type="button"
                        disabled={doiSoatSubmitting}
                        onClick={() => phanHoiDoiSoat(doiSoatTraPhong, true)}
                      >
                        <Icon name="check" />
                        Đồng ý kết quả
                      </button>
                      <button
                        className="kp-btn hd-btn-orange"
                        type="button"
                        disabled={doiSoatSubmitting}
                        onClick={() => setShowDoiSoatReject((current) => !current)}
                      >
                        × Không đồng ý
                      </button>
                    </div>
                    {showDoiSoatReject && (
                      <div className="hd-reject-box">
                        <label>
                          <span>Lý do không đồng ý</span>
                          <textarea
                            value={doiSoatRejectReason}
                            onChange={(event) => setDoiSoatRejectReason(event.target.value)}
                            placeholder="Nhập lý do cần điều chỉnh..."
                            rows={3}
                          />
                        </label>
                        <button
                          className="kp-btn hd-btn-orange is-solid"
                          type="button"
                          disabled={doiSoatSubmitting}
                          onClick={() => phanHoiDoiSoat(doiSoatTraPhong, false)}
                        >
                          {doiSoatSubmitting ? 'Đang gửi...' : 'Gửi lý do từ chối'}
                        </button>
                      </div>
                    )}
                    <div className="hd-settlement-note">
                      <Icon name="info" />
                      <p>Nếu bạn không đồng ý với kết quả, hãy gửi yêu cầu điều chỉnh cho quản lý.</p>
                    </div>
                  </>
                ) : (
                  <div className="hd-settlement-note">
                    <Icon name="info" />
                    <p>Trạng thái hiện tại: {doiSoatTraPhong.trangThai}. {doiSoatTraPhong.ghiChuPhanHoiKhach ? `Ghi chú: ${doiSoatTraPhong.ghiChuPhanHoiKhach}` : ''}</p>
                  </div>
                )}

                {showDoiSoatPayment && (
                  <div className="hd-payment-panel">
                    <div className="hd-card-header">
                      <Icon name="payment" />
                      <h3>{laHoanCocDoiSoat ? 'Thông tin hoàn cọc' : 'Thông tin thanh toán'}</h3>
                    </div>

                    <div className="hd-payment-section-title">
                      1. {laHoanCocDoiSoat ? 'Chọn phương thức bạn muốn nhận hoàn tiền' : 'Chọn phương thức thanh toán'}
                    </div>
                    <div className="hd-payment-methods">
                      {['Chuyển khoản', 'Tiền mặt'].map((method) => (
                        <button
                          type="button"
                          key={method}
                          className={`hd-payment-method ${doiSoatPaymentMethod === method ? 'is-selected' : ''}`}
                          onClick={() => {
                            setDoiSoatPaymentMethod(method);
                            if (method === 'Tiền mặt') setDoiSoatPaymentFile(null);
                          }}
                        >
                          <Icon name={method === 'Chuyển khoản' ? 'bank' : 'payment'} />
                          <span>{method}</span>
                          <strong>{doiSoatPaymentMethod === method ? '✓' : ''}</strong>
                        </button>
                      ))}
                    </div>

                    {!laHoanCocDoiSoat && doiSoatPaymentMethod === 'Chuyển khoản' && (
                      <>
                        <div className="hd-payment-section-title">2. Thông tin chuyển khoản</div>
                        <div className="hd-bank-box">
                          <div><span>Ngân hàng:</span><strong>{taiKhoanThanhToan.nganHang || 'Vietcombank'}</strong></div>
                          <div>
                            <span>Số tài khoản:</span>
                            <strong>{taiKhoanThanhToan.soTaiKhoan || '1234567890'}</strong>
                            <button type="button" onClick={() => copyPaymentText(taiKhoanThanhToan.soTaiKhoan || '1234567890')}><Icon name="copy" /></button>
                          </div>
                          <div><span>Chủ tài khoản:</span><strong>{taiKhoanThanhToan.chuTaiKhoan || 'CONG TY HOMESTAY DORM'}</strong></div>
                          <div>
                            <span>Nội dung CK:</span>
                            <strong>{noiDungChuyenKhoan}</strong>
                            <button type="button" onClick={() => copyPaymentText(noiDungChuyenKhoan)}><Icon name="copy" /></button>
                          </div>
                        </div>

                        <div className="hd-payment-section-title">3. Tải minh chứng thanh toán</div>
                        <label className="hd-payment-upload">
                          <Icon name="upload" />
                          <span>{doiSoatPaymentFile ? doiSoatPaymentFile.name : 'Kéo thả file vào đây hoặc chọn file'}</span>
                          <strong>Chọn file</strong>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) => setDoiSoatPaymentFile(event.target.files?.[0] || null)}
                          />
                        </label>
                        {doiSoatChungTu && (
                          <a className="hd-payment-proof" href={doiSoatChungTu.fileUrl} target="_blank" rel="noreferrer">
                            <Icon name="profile" />
                            <span>Minh chứng đã gửi: {doiSoatChungTu.fileName}</span>
                          </a>
                        )}
                      </>
                    )}

                    {!laHoanCocDoiSoat && doiSoatPaymentMethod === 'Tiền mặt' && (
                      <div className="hd-settlement-note">
                        <Icon name="info" />
                        <p>Vui lòng đến văn phòng tại {hd.DiaChi || hd.TenChiNhanh || 'HomestayDorm'} để thanh toán tiền mặt. Không cần tải minh chứng khi chọn tiền mặt.</p>
                      </div>
                    )}

                    {laHoanCocDoiSoat && (
                      <div className="hd-settlement-note">
                        <Icon name="info" />
                        <p>Hệ thống sẽ ghi nhận phương thức bạn muốn nhận hoàn tiền. Quản lý sẽ liên hệ để tiếp tục thủ tục trả phòng.</p>
                      </div>
                    )}

                    <button
                      className="kp-btn hd-btn-teal hd-payment-submit"
                      type="button"
                      disabled={doiSoatPaymentSubmitting}
                      onClick={() => ghiNhanThanhToanDoiSoat(doiSoatTraPhong)}
                    >
                      <Icon name="check" />
                      {doiSoatPaymentSubmitting ? 'Đang xác nhận...' : laHoanCocDoiSoat ? 'Xác nhận phương thức hoàn tiền' : 'Xác nhận đã thanh toán'}
                    </button>
                  </div>
                )}

                {!showDoiSoatPayment && daGuiPhuongThucDoiSoat && (laThuThemDoiSoat || laHoanCocDoiSoat) && (
                  <div className="hd-settlement-note">
                    <Icon name="info" />
                    <p>{doiSoatCompletionMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {!doiSoatTraPhong && (
        <>
        <div className="hd-overview-middle">
          <div className="hd-card hd-rent-details">
            <div className="hd-card-header">
              <Icon name="payment" />
              <h3>Chi tiết thuê</h3>
            </div>
            <div className="hd-detail-row">
              <span>Giá thuê hàng tháng</span>
              <strong className="hd-price">{formatMoney(hd.GiaThue)}</strong>
            </div>
            <div className="hd-detail-row">
              <span>Loại phòng</span>
              <span className="hd-chip-gray">{hd.TenLoaiPhong}</span>
            </div>
            <div className="hd-detail-row">
              <span>Hình thức thuê</span>
              <strong>{hinhThucThue}{hd.MaGiuong ? ` • ${hd.MaGiuong}` : ''}</strong>
            </div>
            <div className="hd-detail-row">
              <span>Kỳ thanh toán</span>
              <strong>{hd.KyThanhToan || 'Chưa cập nhật'}</strong>
            </div>
            <div className="hd-action-buttons">
              <button
                className={`kp-btn ${coYeuCauChoXuLy ? 'hd-btn-danger' : coYeuCauDaTiepNhan ? 'hd-btn-outline' : 'hd-btn-teal'}`}
                type="button"
                disabled={traPhongSubmitting || coYeuCauDaTiepNhan}
                onClick={() => coYeuCauChoXuLy ? huyYeuCauTraPhong(yeuCauTraPhong) : guiYeuCauTraPhong(hd)}
              >
                <Icon name={coYeuCauTraPhong ? 'lock' : 'contract'} />
                {traPhongSubmitting ? 'Đang xử lý...' : coYeuCauChoXuLy ? 'Hủy yêu cầu' : coYeuCauDaTiepNhan ? 'Đang xử lý trả phòng' : 'Gửi yêu cầu trả phòng'}
              </button>
              <a className="kp-btn hd-btn-outline" href="tel:19006789"><Icon name="support" />Liên hệ quản lý</a>
            </div>
            {coYeuCauTraPhong && (
              <p className="hd-request-note">
                Đã gửi yêu cầu trả phòng. Trạng thái: {yeuCauTraPhong.trangThai}.
              </p>
            )}
          </div>

          <div className="hd-card hd-amenities">
            <div className="hd-card-header">
              <Icon name="room" />
              <h3>Tiện ích phòng</h3>
            </div>
            {taiSan.length ? (
              <div className="hd-amenity-chips">
                {taiSan.slice(0, 8).map(ts => (
                <span key={ts.MaTaiSan} className="hd-chip-gray"><Icon name="check" /> {ts.TenTaiSan}</span>
                ))}
              </div>
            ) : <p className="hd-muted">Chưa có tài sản được ghi nhận.</p>}
          </div>

          <div className="hd-card hd-rules">
            <div className="hd-card-header">
              <Icon name="info" />
              <h3>Quy định phòng</h3>
            </div>
            {quyDinh.length ? (
              <div className="hd-rule-list">
                {quyDinh.map(qd => (
                  <div key={qd.MaQuyDinh} className="hd-rule-item">
                    <Icon name="check" />
                    <div>
                      <strong>{qd.TieuDeNoiQuy}</strong>
                      <p>{qd.NoiDung}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="hd-muted">Chưa có quy định đang áp dụng.</p>}
          </div>
        </div>

        <div className="hd-overview-bottom">
          <div className="hd-card hd-assets">
            <h3>Danh sách tài sản</h3>
            {taiSan.length ? (
              <table className="hd-table">
                <thead>
                  <tr>
                    <th>Tên tài sản</th>
                    <th>Số lượng</th>
                    <th>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {taiSan.map(ts => (
                    <tr key={ts.MaTaiSan}>
                      <td><Icon name="layers" />{ts.TenTaiSan}</td>
                      <td>{String(ts.SoLuong || 1).padStart(2, '0')}</td>
                      <td className="hd-status-good">Tốt</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="hd-muted">Chưa có danh sách tài sản cho phòng này.</p>}
          </div>
        </div>
        </>
        )}
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
    // Giữ File thật để gửi multipart (không còn dùng base64).
    setUploadForm((prev) => ({ ...prev, file, fileName: file.name }));
  }

  async function submitMinhChung(e) {
    e.preventDefault();
    if (!datCocSelected) return;
    if (!uploadForm.file) {
      setToast('Vui lòng chọn ảnh hoặc PDF chứng từ thanh toán.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);

      // Endpoint khách: gửi file thật + qua SP_CapNhatMinhChungThanhToanCoc (check hạn 24h + sở hữu).
      await datCocApi.capNhatMinhChungKhach(datCocSelected.maPhieuCoc, fd);
      setToast('Đã gửi chứng từ thành công. Vui lòng chờ nhân viên kiểm tra.');
      const updated = { ...datCocSelected, trangThai: 'Chờ xác nhận', minhChungThanhToan: uploadForm.fileName };
      setDatCocSelected(updated);
      setDatCocList((prev) => prev.map((p) => p.maPhieuCoc === updated.maPhieuCoc ? updated : p));
    } catch (err) {
      setToast(err.response?.data?.message || 'Không thể gửi chứng từ.');
    } finally {
      setUploading(false);
    }
  }

  // DC04 - khách chọn phương thức thanh toán (Chuyển khoản / Tiền mặt) cho phiếu "Chờ TT".
  async function chonPhuongThucCoc(method) {
    if (!datCocSelected) return;
    try {
      await datCocApi.chonPhuongThucKhach(datCocSelected.maPhieuCoc, { phuongThucThanhToan: method });
      const updated = { ...datCocSelected, phuongThucThanhToan: method };
      setDatCocSelected(updated);
      setDatCocList((prev) => prev.map((p) => p.maPhieuCoc === updated.maPhieuCoc ? updated : p));
      setToast(method === 'Tiền mặt'
        ? 'Đã chọn thanh toán tiền mặt. Vui lòng đến quầy để nộp tiền cọc.'
        : 'Đã chọn chuyển khoản. Vui lòng chuyển khoản rồi gửi chứng từ.');
    } catch (err) {
      setToast(err.response?.data?.message || 'Không thể chọn phương thức thanh toán.');
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
    // minhChungThanhToan giờ là ĐƯỜNG DẪN file (vd /uploads/chung-tu/..); vẫn đỡ được dữ liệu JSON cũ.
    const minhChung = (() => {
      const raw = phieu.minhChungThanhToan;
      if (!raw) return null;
      if (raw.startsWith('/') || raw.startsWith('http')) {
        return { fileName: raw.split('/').pop(), fileUrl: raw.startsWith('http') ? raw : `${FILE_BASE}${raw}` };
      }
      try { return JSON.parse(raw); } catch { return { fileName: raw }; }
    })();
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

            {/* Case 1a: Chờ thanh toán, CHƯA chọn phương thức → cho khách chọn */}
            {isWaiting && !phieu.phuongThucThanhToan && (
              <div className="dc-section-card">
                <h3 className="dc-section-title"><Icon name="invoice" />Chọn phương thức thanh toán</h3>
                <p className="dc-bank-note">Vui lòng chọn cách bạn muốn thanh toán tiền cọc.</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button type="button" className="kp-btn kp-btn-primary kp-full" onClick={() => chonPhuongThucCoc('Chuyển khoản')}>
                    <Icon name="invoice" /> Chuyển khoản
                  </button>
                  <button type="button" className="kp-btn kp-btn-primary kp-full" onClick={() => chonPhuongThucCoc('Tiền mặt')}>
                    <Icon name="profile" /> Tiền mặt tại quầy
                  </button>
                </div>
              </div>
            )}

            {/* Case 1b: Chờ thanh toán + Chuyển khoản → Form upload + Thông tin CK */}
            {isWaiting && phieu.phuongThucThanhToan === 'Chuyển khoản' && (
              <>
                <div className="dc-section-card">
                  <h3 className="dc-section-title"><Icon name="profile" />Gửi chứng từ thanh toán</h3>
                  <form onSubmit={submitMinhChung} className="dc-upload-form">
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

            {/* Case 1c: Chờ thanh toán + Tiền mặt → hướng dẫn ra quầy, KHÔNG upload */}
            {isWaiting && phieu.phuongThucThanhToan === 'Tiền mặt' && (
              <div className="dc-section-card">
                <h3 className="dc-section-title"><Icon name="profile" />Thanh toán tiền mặt tại quầy</h3>
                <p className="dc-bank-note">
                  Bạn đã chọn thanh toán bằng tiền mặt. Vui lòng đến văn phòng nộp tiền cọc trước hạn.
                  Nhân viên sẽ lập biên nhận đặt cọc để hai bên ký và ghi nhận chứng từ giúp bạn — bạn không cần tự tải lên chứng từ.
                </p>
                <div className="dc-info-grid" style={{ marginTop: 12 }}>
                  <div><span>Cơ sở</span><strong>{phieu.tenChiNhanh || 'Chưa cập nhật'}</strong></div>
                  <div><span>Địa chỉ</span><strong>{phieu.diaChi || 'Liên hệ nhân viên phụ trách'}</strong></div>
                  <div><span>Số tiền cần nộp</span><strong style={{ color: 'var(--dc-primary)' }}>{Number(phieu.soTienCoc).toLocaleString('vi-VN')} VNĐ</strong></div>
                  {phieu.thoiHanThanhToan && <div><span>Hạn thanh toán</span><strong>{formatDate(phieu.thoiHanThanhToan, true)}</strong></div>}
                </div>
              </div>
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
                    minhChung.fileUrl
                      ? <a className="dc-receipt-file" href={minhChung.fileUrl} target="_blank" rel="noreferrer"><Icon name="profile" /><span>{minhChung.fileName}</span></a>
                      : <div className="dc-receipt-file"><Icon name="profile" /><span>{minhChung.fileName}</span></div>
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
    if (detailPhong && activeTab === 'kham-pha') {
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

      {registrationNoticeOpen && (
        <div className="kp-modal-backdrop" onMouseDown={() => setRegistrationNoticeOpen(false)}>
          <section
            className="kp-modal kh-registration-notice"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="kh-registration-notice-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="kh-registration-notice-head">
              <span className="kh-registration-notice-icon" aria-hidden="true">
                <Icon name="info" />
              </span>
              <div>
                <span>Thông báo đăng ký</span>
                <h2 id="kh-registration-notice-title">Chưa thể tạo phiếu đăng ký mới</h2>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setRegistrationNoticeOpen(false)}>×</button>
            </div>
            <div className="kh-registration-notice-body">
              <p>{registrationLockedMessage}</p>
              <div className="kh-registration-notice-note">
                Bạn có thể tạo phiếu mới sau khi quy trình thuê hiện tại kết thúc.
              </div>
            </div>
            <div className="kh-registration-notice-actions">
              <button className="kp-btn kp-btn-primary" type="button" onClick={() => setRegistrationNoticeOpen(false)}>
                Đã hiểu
              </button>
            </div>
          </section>
        </div>
      )}

      {supportModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setSupportModal(false)}>
          <section className="kp-modal kh-contact-modal" role="dialog" aria-modal="true" aria-labelledby="kh-contact-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="kp-modal-head kh-contact-head">
              <div>
                <span>Liên hệ tư vấn</span>
                <h2 id="kh-contact-title">Liên hệ chi nhánh</h2>
                <p>Chọn chi nhánh gần bạn để được hỗ trợ nhanh chóng.</p>
              </div>
              <button type="button" aria-label="Đóng" onClick={() => setSupportModal(false)}>×</button>
            </div>

            <div className="kh-contact-list">
              {branchContacts.map((branch) => (
                <article className="kh-contact-item" key={branch.phone}>
                  <span className="kh-contact-location" aria-hidden="true">
                    <Icon name="map" />
                  </span>
                  <div className="kh-contact-info">
                    <strong>{branch.name}</strong>
                    <span>{branch.area}</span>
                  </div>
                  <a className="kp-btn kp-btn-primary" href={`tel:${branch.phone}`}>
                    <Icon name="phone" />{branch.phone}
                  </a>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

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
                <div className="kh-register-grid kh-balanced-grid">
                  <label className="is-half"><span>Họ và tên*</span><input value={rentForm.hoTen} onChange={(event) => setRentForm({ ...rentForm, hoTen: event.target.value })} placeholder="Nguyễn Văn A" required /></label>
                  <label>
                    <span>Ngày sinh*</span>
                    <input
                      className={getBirthDateError(rentForm.ngaySinh) ? 'is-invalid' : ''}
                      type="date"
                      max={getMaxBirthDate()}
                      value={rentForm.ngaySinh}
                      onChange={(event) => setRentForm({ ...rentForm, ngaySinh: event.target.value })}
                      required
                    />
                    {getBirthDateError(rentForm.ngaySinh) && <small className="kh-field-error">{getBirthDateError(rentForm.ngaySinh)}</small>}
                  </label>
                  <label><span>Giới tính*</span><select value={rentForm.gioiTinh} onChange={(event) => setRentForm({ ...rentForm, gioiTinh: event.target.value })} required><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>
                  <label className="is-half">
                    <span>Số điện thoại*</span>
                    <input
                      className={getPhoneError(rentForm.soDienThoai) ? 'is-invalid' : ''}
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={rentForm.soDienThoai}
                      onChange={(event) => setRentForm({ ...rentForm, soDienThoai: event.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="Nhập 10 chữ số"
                      required
                    />
                    {getPhoneError(rentForm.soDienThoai) && <small className="kh-field-error">{getPhoneError(rentForm.soDienThoai)}</small>}
                  </label>
                  <label className="is-half"><span>Email</span><input type="email" value={rentForm.email} onChange={(event) => setRentForm({ ...rentForm, email: event.target.value })} placeholder="example@gmail.com" /></label>
                  <label className="is-half"><span>Quốc tịch*</span><input value={rentForm.quocTich} onChange={(event) => setRentForm({ ...rentForm, quocTich: event.target.value })} placeholder="Ví dụ: Việt Nam" required /></label>
                  <label className="is-half">
                    <span>CCCD*</span>
                    <input
                      className={getCccdError(rentForm.cccd) ? 'is-invalid' : ''}
                      inputMode="numeric"
                      maxLength={12}
                      pattern="[0-9]{12}"
                      value={rentForm.cccd}
                      onChange={(event) => setRentForm({ ...rentForm, cccd: event.target.value.replace(/\D/g, '').slice(0, 12) })}
                      placeholder="Nhập 12 chữ số"
                      required
                    />
                    {getCccdError(rentForm.cccd) && <small className="kh-field-error">{getCccdError(rentForm.cccd)}</small>}
                  </label>
                </div>
              </section>

              <section className="kh-register-section">
                <h3><Icon name="home" />Nhu cầu thuê phòng</h3>
                <div className="kh-register-grid kh-balanced-grid">
                  <label><span>Số lượng người ở*</span><input type="number" min="1" value={rentForm.soNguoiO} onChange={(event) => setRentForm({ ...rentForm, soNguoiO: event.target.value })} required /></label>
                  <label><span>Giới tính thuê*</span><select value={rentForm.gioiTinhThue} onChange={(event) => setRentForm({ ...rentForm, gioiTinhThue: event.target.value })} required><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></label>
                  {rentForm.gioiTinhThue === 'Khác' && (
                    <div className="is-half" style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ margin: 0, flex: 1 }}><span>Số lượng nam*</span><input type="number" min="0" value={rentForm.soNam ?? ''} onChange={(event) => setRentForm({ ...rentForm, soNam: event.target.value })} required /></label>
                      <label style={{ margin: 0, flex: 1 }}><span>Số lượng nữ*</span><input type="number" min="0" value={rentForm.soNu ?? ''} onChange={(event) => setRentForm({ ...rentForm, soNu: event.target.value })} required /></label>
                    </div>
                  )}
                  <label className="is-half">
                    <span>Khu vực mong muốn*</span>
                    <input
                      className={getAreaError(rentForm.khuVucMongMuon) ? 'is-invalid' : ''}
                      type="text"
                      list="kh-rent-area-options"
                      value={rentForm.khuVucMongMuon}
                      onChange={(event) => {
                        const value = event.target.value;
                        event.target.setCustomValidity(getAreaError(value));
                        setRentForm({ ...rentForm, khuVucMongMuon: value });
                      }}
                      placeholder="VD: Quận 1, quan 3, Thu Duc..."
                      required
                    />
                    <datalist id="kh-rent-area-options">
                      {ALLOWED_RENT_AREAS.map((area) => <option key={area} value={area} />)}
                    </datalist>
                    {getAreaError(rentForm.khuVucMongMuon) && <small className="kh-field-error">{getAreaError(rentForm.khuVucMongMuon)}</small>}
                  </label>
                  <div className="is-half kh-room-type-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'flex-start' }}>
                    <span className="kh-register-field-title">Loại phòng mong muốn*</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {filterOptions.loaiPhong.filter(Boolean).map((option) => {
                        const isChecked = rentForm.loaiPhongYeuCau ? rentForm.loaiPhongYeuCau.split(', ').includes(option) : false;
                        return (
                          <label key={option} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', fontSize: '14px', color: '#191c1d', padding: 0, background: 'none', border: 'none' }}>
                            <input
                              type="checkbox"
                              style={{ width: '16px', height: '16px', margin: 0 }}
                              checked={isChecked}
                              onChange={(e) => {
                                let currentArr = rentForm.loaiPhongYeuCau ? rentForm.loaiPhongYeuCau.split(', ').filter(Boolean) : [];
                                if (e.target.checked) {
                                  currentArr.push(option);
                                } else {
                                  currentArr = currentArr.filter(v => v !== option);
                                }
                                setRentForm({ ...rentForm, loaiPhongYeuCau: currentArr.join(', ') });
                              }}
                            />
                            {option}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <label><span>Mức giá tối đa (đ/tháng)*</span><input type="number" min="0" value={rentForm.mucGiaToiDa} onChange={(event) => setRentForm({ ...rentForm, mucGiaToiDa: event.target.value })} placeholder="VD: 3.000.000" required /></label>
                  <label className="is-half"><span>Thời gian dự kiến dọn vào*</span><input type="date" value={rentForm.ngayDuKienVaoO} onChange={(event) => setRentForm({ ...rentForm, ngayDuKienVaoO: event.target.value })} required /></label>
                  <label className="is-half"><span>Thời hạn thuê (tháng)*</span><input type="number" min="1" value={rentForm.thoiHanThue} onChange={(event) => setRentForm({ ...rentForm, thoiHanThue: event.target.value })} placeholder="Ví dụ: 6" required /></label>
                  <div className="is-wide" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="kh-register-field-title">Yêu cầu khác</span>
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
      <ResultModal
        open={Boolean(resultModal)}
        type={resultModal?.type || 'success'}
        title={resultModal?.title}
        message={resultModal?.message}
        confirmText={resultModal?.confirmText}
        onClose={() => setResultModal(null)}
      />

      {profileDetailModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setProfileDetailModal(null)}>
          <div className="kp-modal kh-rent-modal kh-profile-detail-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="kp-modal-head">
              <div>
                <span className="kp-eyebrow">Chi tiết hồ sơ</span>
                <h2>Hồ sơ #{profileDetailModal.maDangKy}</h2>
              </div>
              <button type="button" onClick={() => setProfileDetailModal(null)}>×</button>
            </div>

            {profileDetailLoading && (
              <div className="kh-profile-detail-loading">Đang tải chi tiết hồ sơ...</div>
            )}

            <div className="kh-profile-detail-summary">
              <span className={`kh-status-chip kh-status-chip--${statusTone(getProfileDisplayStatus(profileDetailModal))}`}>
                {statusIcon(getProfileDisplayStatus(profileDetailModal))} {getProfileDisplayStatus(profileDetailModal)}
              </span>
              <p>Ngày tạo: {formatDate(profileDetailModal.ngayDangKy)}</p>
            </div>

            <div className="kh-profile-detail-grid">
              <div><span>Hình thức thuê</span><strong>{displayValue(profileDetailModal.hinhThucThue)}</strong></div>
              <div><span>Số người ở</span><strong>{displayValue(profileDetailModal.soNguoiO, 1)} người</strong></div>
              <div><span>Khu vực mong muốn</span><strong>{displayValue(profileDetailModal.khuVucMongMuon)}</strong></div>
              <div><span>Loại phòng yêu cầu</span><strong>{displayValue(profileDetailModal.loaiPhongYeuCau)}</strong></div>
              <div><span>Mức giá</span><strong>{formatMoney(profileDetailModal.mucGia)}</strong></div>
              <div><span>Ngày dự kiến vào ở</span><strong>{formatDate(profileDetailModal.ngayDuKienVaoO)}</strong></div>
              <div><span>Thời hạn thuê</span><strong>{profileDetailModal.thoiHanThue ? `${profileDetailModal.thoiHanThue} tháng` : 'Chưa cập nhật'}</strong></div>
              <div><span>Lịch xem gần nhất</span><strong>{profileDetailModal.thoiGianHen ? formatDate(profileDetailModal.thoiGianHen, true) : 'Chưa có'}</strong></div>
              <div><span>Phòng xem</span><strong>{displayValue(profileDetailModal.phongXem || profileDetailModal.phongQuanTam, 'Chưa có')}</strong></div>
              <div><span>Nhân viên sale</span><strong>{displayValue(profileDetailModal.tenNhanVienSale || profileDetailModal.maNhanVienSale)}</strong></div>
            </div>

            <div className="kh-profile-detail-note">
              <span>Ghi chú / yêu cầu khác</span>
              <p>{profileDetailModal.ghiChu || 'Không có ghi chú.'}</p>
            </div>

            {Array.isArray(profileDetailModal.phongXemDanhSach) && profileDetailModal.phongXemDanhSach.length > 0 && (
              <div className="kh-profile-detail-rooms">
                <h3>Phòng / giường đã gắn lịch xem</h3>
                {profileDetailModal.phongXemDanhSach.map((room) => (
                  <div className="kh-profile-room-row" key={`${room.sttLich}-${room.maPhong}-${room.maGiuong || 'room'}`}>
                    <strong>{room.tenPhong || room.maPhong}</strong>
                    <span>{room.maGiuong ? `Giường ${room.maGiuong}` : 'Nguyên phòng'} · {formatMoney(room.giaThue)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="kp-modal-actions">
              {profileDetailModal.trangThai === 'Chờ tiếp nhận' && (
                <button className="kp-btn kp-btn-primary" type="button" onClick={() => {
                  const currentProfile = profileDetailModal;
                  setProfileDetailModal(null);
                  openEditModal(currentProfile);
                }}>
                  Cập nhật hồ sơ
                </button>
              )}
              <button className="kp-btn kp-btn-soft" type="button" onClick={() => setProfileDetailModal(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {scheduleDetailModal && (
        <div className="kp-modal-backdrop" onMouseDown={() => setScheduleDetailModal(null)}>
          <div className="kp-modal kh-rent-modal kh-profile-detail-modal kh-schedule-detail-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="kp-modal-head">
              <div>
                <span className="kp-eyebrow">Chi tiết lịch hẹn</span>
                <h2>Lịch xem #{scheduleDetailModal.maDangKy}</h2>
              </div>
              <div className="kh-schedule-head-actions">
                <span className={`kh-status-chip kh-status-chip--${statusTone(scheduleDetailModal.trangThai)}`}>
                  {statusIcon(scheduleDetailModal.trangThai)} {scheduleDetailModal.trangThai}
                </span>
                <button type="button" onClick={() => setScheduleDetailModal(null)}>×</button>
              </div>
            </div>

            {scheduleDetailLoading && (
              <div className="kh-profile-detail-loading">Đang tải chi tiết lịch xem...</div>
            )}

            <div className="kh-schedule-info-panel">
              <div className="kh-profile-detail-grid kh-schedule-detail-grid">
                <div className="kh-schedule-time">
                  <Icon name="calendar" />
                  <span>Thời gian hẹn</span>
                  <strong>{formatDate(scheduleDetailModal.thoiGianHen, true)}</strong>
                </div>
                <div><span>Nhân viên hỗ trợ</span><strong>{displayValue(scheduleDetailModal.tenNhanVienSale || scheduleDetailModal.maNhanVienSale)}</strong></div>
                <div>
                  <span>SĐT nhân viên hướng dẫn</span>
                  <strong>
                    {scheduleDetailModal.sdtNhanVienSale
                      ? <a href={`tel:${scheduleDetailModal.sdtNhanVienSale}`}>{scheduleDetailModal.sdtNhanVienSale}</a>
                      : displayValue(null)}
                  </strong>
                </div>
              </div>
            </div>

            {Array.isArray(scheduleDetailModal.phongXem) && scheduleDetailModal.phongXem.length > 0 ? (
              <div className="kh-profile-detail-rooms">
                <h3>Danh sách phòng sẽ xem</h3>
                {scheduleDetailModal.phongXem.map((room) => (
                  <button
                    className="kh-profile-room-row kh-profile-room-row-button"
                    key={`${room.maPhong}-${room.maGiuong || 'room'}`}
                    type="button"
                    onClick={() => openScheduledRoomDetail(room)}
                  >
                    <span className="kh-profile-room-main">
                      <strong>{room.tenPhong || room.maPhong}</strong>
                      <small className="kh-profile-room-branch">{room.tenChiNhanh || room.chiNhanh || room.loaiPhong || 'Chi tiết phòng'}</small>
                      <small className="kh-profile-room-address">
                        <Icon name="map" />
                        {room.diaChi || 'Địa chỉ đang được cập nhật'}
                      </small>
                    </span>
                    <span className="kh-profile-room-action">
                      {room.maGiuong ? `Giường ${room.maGiuong}` : 'Xem phòng'}
                    </span>
                  </button>
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
          <form className="kp-modal kh-rent-modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={submitEditModal}>
            <div className="kp-modal-head">
              <div><span className="kp-eyebrow">Cập nhật hồ sơ</span><h2>Hồ sơ #{editModal.maDangKy}</h2></div>
              <button type="button" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div className="kh-register-scroll">
              <section className="kh-register-section">
                <h3><Icon name="profile" />Thông tin cá nhân</h3>
                <div className="kh-register-grid kh-balanced-grid">
                  <label className="is-half"><span>Họ và tên*</span><input value={editForm.hoTen} onChange={(event) => setEditForm({ ...editForm, hoTen: event.target.value })} placeholder="Nguyễn Văn A" required /></label>
                  <label>
                    <span>Ngày sinh*</span>
                    <input
                      className={getBirthDateError(editForm.ngaySinh) ? 'is-invalid' : ''}
                      type="date"
                      max={getMaxBirthDate()}
                      value={editForm.ngaySinh || ''}
                      onChange={(event) => setEditForm({ ...editForm, ngaySinh: event.target.value })}
                      required
                    />
                    {getBirthDateError(editForm.ngaySinh) && <small className="kh-field-error">{getBirthDateError(editForm.ngaySinh)}</small>}
                  </label>
                  <label><span>Giới tính*</span><select value={editForm.gioiTinh} onChange={(event) => setEditForm({ ...editForm, gioiTinh: event.target.value })} required><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>
                  <label className="is-half">
                    <span>Số điện thoại*</span>
                    <input
                      className={getPhoneError(editForm.soDienThoai) ? 'is-invalid' : ''}
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={editForm.soDienThoai || ''}
                      onChange={(event) => setEditForm({ ...editForm, soDienThoai: event.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="Nhập 10 chữ số"
                      required
                    />
                    {getPhoneError(editForm.soDienThoai) && <small className="kh-field-error">{getPhoneError(editForm.soDienThoai)}</small>}
                  </label>
                  <label className="is-half"><span>Email</span><input type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} placeholder="example@gmail.com" /></label>
                  <label className="is-half"><span>Quốc tịch*</span><input value={editForm.quocTich} onChange={(event) => setEditForm({ ...editForm, quocTich: event.target.value })} placeholder="Ví dụ: Việt Nam" required /></label>
                  <label className="is-half">
                    <span>CCCD*</span>
                    <input
                      className={getCccdError(editForm.cccd) ? 'is-invalid' : ''}
                      inputMode="numeric"
                      maxLength={12}
                      pattern="[0-9]{12}"
                      value={editForm.cccd || ''}
                      onChange={(event) => setEditForm({ ...editForm, cccd: event.target.value.replace(/\D/g, '').slice(0, 12) })}
                      placeholder="Nhập 12 chữ số"
                      required
                    />
                    {getCccdError(editForm.cccd) && <small className="kh-field-error">{getCccdError(editForm.cccd)}</small>}
                  </label>
                </div>
              </section>

              <section className="kh-register-section">
                <h3><Icon name="home" />Nhu cầu thuê phòng</h3>
                <div className="kh-register-grid kh-balanced-grid">
                  <label><span>Số lượng người ở*</span><input type="number" min="1" value={editForm.soNguoiO} onChange={(e) => setEditForm({ ...editForm, soNguoiO: e.target.value })} required /></label>
                  <label><span>Giới tính thuê*</span><select value={editForm.gioiTinhThue} onChange={(e) => setEditForm({ ...editForm, gioiTinhThue: e.target.value })} required><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></label>
                  {editForm.gioiTinhThue === 'Khác' && (
                    <div className="is-half" style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ margin: 0, flex: 1 }}><span>Số lượng nam*</span><input type="number" min="0" value={editForm.soNam ?? ''} onChange={(e) => setEditForm({ ...editForm, soNam: e.target.value })} required /></label>
                      <label style={{ margin: 0, flex: 1 }}><span>Số lượng nữ*</span><input type="number" min="0" value={editForm.soNu ?? ''} onChange={(e) => setEditForm({ ...editForm, soNu: e.target.value })} required /></label>
                    </div>
                  )}
                  <label className="is-half">
                    <span>Khu vực mong muốn*</span>
                    <input
                      className={getAreaError(editForm.khuVucMongMuon) ? 'is-invalid' : ''}
                      type="text"
                      list="kh-edit-area-options"
                      value={editForm.khuVucMongMuon || ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        event.target.setCustomValidity(getAreaError(value));
                        setEditForm({ ...editForm, khuVucMongMuon: value });
                      }}
                      placeholder="VD: Quận 1, quan 3, Thu Duc..."
                      required
                    />
                    <datalist id="kh-edit-area-options">
                      {ALLOWED_RENT_AREAS.map((area) => <option key={area} value={area} />)}
                    </datalist>
                    {getAreaError(editForm.khuVucMongMuon) && <small className="kh-field-error">{getAreaError(editForm.khuVucMongMuon)}</small>}
                  </label>
                  <div className="is-half kh-room-type-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'flex-start' }}>
                    <span className="kh-register-field-title">Loại phòng mong muốn*</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {filterOptions.loaiPhong.filter(Boolean).map((option) => {
                        const isChecked = editForm.loaiPhongYeuCau ? editForm.loaiPhongYeuCau.split(', ').includes(option) : false;
                        return (
                          <label key={option} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', fontSize: '14px', color: '#191c1d', padding: 0, background: 'none', border: 'none' }}>
                            <input
                              type="checkbox"
                              style={{ width: '16px', height: '16px', margin: 0 }}
                              checked={isChecked}
                              onChange={(e) => {
                                let currentArr = editForm.loaiPhongYeuCau ? editForm.loaiPhongYeuCau.split(', ').filter(Boolean) : [];
                                if (e.target.checked) {
                                  currentArr.push(option);
                                } else {
                                  currentArr = currentArr.filter(v => v !== option);
                                }
                                setEditForm({ ...editForm, loaiPhongYeuCau: currentArr.join(', ') });
                              }}
                            />
                            {option}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <label><span>Mức giá tối đa (đ/tháng)*</span><input type="number" min="0" value={editForm.mucGiaToiDa} onChange={(e) => setEditForm({ ...editForm, mucGiaToiDa: e.target.value })} placeholder="VD: 3.000.000" required /></label>
                  <label className="is-half"><span>Thời gian dự kiến dọn vào*</span><input type="date" value={editForm.ngayDuKienVaoO} onChange={(e) => setEditForm({ ...editForm, ngayDuKienVaoO: e.target.value })} required /></label>
                  <label className="is-half"><span>Thời hạn thuê (tháng)*</span><input type="number" min="1" value={editForm.thoiHanThue} onChange={(e) => setEditForm({ ...editForm, thoiHanThue: e.target.value })} placeholder="Ví dụ: 6" required /></label>
                  <label className="is-wide"><span>Yêu cầu khác</span><textarea value={editForm.ghiChu} onChange={(e) => setEditForm({ ...editForm, ghiChu: e.target.value })} placeholder="Giờ giấc sinh hoạt, yêu cầu yên tĩnh, gửi xe..." /></label>
                </div>
              </section>
            </div>
            <div className="kp-modal-actions">
              <button className="kp-btn kp-btn-soft" type="button" onClick={() => setEditModal(null)}>Đóng</button>
              <button className="kp-btn kp-btn-primary" type="submit" disabled={editSaving}>{editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
