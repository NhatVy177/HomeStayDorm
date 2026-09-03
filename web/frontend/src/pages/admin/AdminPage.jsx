import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { getLockedRoomIds, setRoomLocked } from '../../utils/lockedRooms.js';
import { adminApi } from './admin.api.js';
import './admin.css';

const ROOM_STATUS_EMPTY = 'Trống';
const ROOM_STATUS_MAINTENANCE = 'Bảo trì';
const BRANCH_STATUS_ACTIVE = 'Hoạt động';
const BRANCH_STATUS_INACTIVE = 'Ngừng hoạt động';

const navItems = [
  { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'employees', label: 'Tài khoản nhân viên', icon: 'person_add' },
  { id: 'property', label: 'Chi nhánh & phòng', icon: 'apartment' },
  { id: 'services', label: 'Dịch vụ & nội quy', icon: 'bolt' },
  { id: 'settings', label: 'Cấu hình hệ thống', icon: 'build' },
  { id: 'backup', label: 'Sao lưu dữ liệu', icon: 'download' },
  { id: 'logs', label: 'Nhật ký hệ thống', icon: 'list' }
];

const adminStats = [
  { label: 'Nhân viên đang hoạt động', value: '24', note: '+3 tài khoản trong tháng', icon: 'person', tone: 'primary' },
  { label: 'Chi nhánh vận hành', value: '4', note: '128 phòng / 426 giường', icon: 'apartment', tone: 'secondary' },
  { label: 'Cấu hình cần duyệt', value: '7', note: 'Dịch vụ, nội quy, hoàn cọc', icon: 'warning', tone: 'warning' },
  { label: 'Sao lưu gần nhất', value: '02:00', note: 'Hôm nay, incremental', icon: 'save', tone: 'success' }
];

const employeeRows = [
  { id: 'NV0013', name: 'Nguyễn Minh Admin', role: 'Admin', branch: 'Hệ thống', status: 'Đang hoạt động' },
  { id: 'NV0008', name: 'Trần Hoài Nam', role: 'Quản lý', branch: 'CN0001', status: 'Đang hoạt động' },
  { id: 'NV0010', name: 'Lý Gia Hân', role: 'Kế toán', branch: 'CN0002', status: 'Tạm khóa' },
  { id: 'NV0012', name: 'Phạm Quốc Bảo', role: 'Sale', branch: 'CN0003', status: 'Đang hoạt động' }
];

const propertyRows = [
  { branch: 'CN0001', area: 'Quận 1', rooms: 36, beds: 126, status: 'Đang vận hành' },
  { branch: 'CN0002', area: 'Bình Thạnh', rooms: 28, beds: 94, status: 'Đang vận hành' },
  { branch: 'CN0003', area: 'Thủ Đức', rooms: 42, beds: 148, status: 'Bảo trì một phần' }
];


const backupRows = [
  { id: 'BK-1042', type: 'Incremental', time: '2026-06-29 02:00', size: '184 MB', status: 'Thành công' },
  { id: 'BK-1041', type: 'Full', time: '2026-06-28 23:30', size: '1.8 GB', status: 'Thành công' },
  { id: 'BK-1040', type: 'Incremental', time: '2026-06-28 02:00', size: '176 MB', status: 'Thành công' }
];

const logRows = [
  { time: '09:42', actor: 'NV0013', action: 'Khóa tài khoản', object: 'TaiKhoan NV0010' },
  { time: '09:15', actor: 'NV0013', action: 'Cập nhật tham số', object: 'THOI_HAN_THANH_TOAN_COC_GIO' },
  { time: '08:58', actor: 'NV0008', action: 'Cập nhật phòng', object: 'P203 / G03' },
  { time: '08:21', actor: 'Hệ thống', action: 'Sao lưu tự động', object: 'BK-1042' }
];

function createEmptyEmployeeForm() {
  return {
    maNhanVien: '',
    tenDangNhap: '',
    matKhau: '',
    hoTen: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    soDienThoai: '',
    email: '',
    diaChi: '',
    chucVu: 'Sale',
    maChiNhanh: '',
    ngayVaoLam: new Date().toISOString().slice(0, 10)
  };
}

function createEmployeeEditForm(employee = {}) {
  return {
    hoTen: employee.hoTen || '',
    ngaySinh: employee.ngaySinh ? new Date(employee.ngaySinh).toISOString().slice(0, 10) : '',
    gioiTinh: employee.gioiTinh || 'Nam',
    soDienThoai: employee.soDienThoai || '',
    email: employee.email || '',
    diaChi: employee.diaChi || '',
    chucVu: employee.chucVu || 'Sale',
    maChiNhanh: employee.maChiNhanh || '',
    ngayVaoLam: employee.ngayVaoLam ? new Date(employee.ngayVaoLam).toISOString().slice(0, 10) : ''
  };
}

function createEmptyBranchForm() {
  return {
    tenChiNhanh: '',
    diaChi: '',
    soDienThoai: '',
    email: '',
    trangThai: 'Hoạt động'
  };
}

function createBranchEditForm(branch = {}) {
  return {
    tenChiNhanh: branch.tenChiNhanh || '',
    diaChi: branch.diaChi || '',
    soDienThoai: branch.soDienThoai || '',
    email: branch.email || '',
    trangThai: branch.trangThai || 'Hoạt động'
  };
}

const createEmptyRoomBedForm = () => ({
    tenPhong: '',
    gioiTinhChoPhep: 'Không phân biệt',
    maChiNhanh: '',
    maLoaiPhong: '',
    tinhTrang: 'Trống',
    urlImg: '',
    anhPhong: null,
    tenAnhPhong: '',
    soGiuong: 1
  });

function createRoomEditForm(room = {}) {
  return {
    tenPhong: room.tenPhong || '',
    gioiTinhChoPhep: room.gioiTinhChoPhep || 'Không phân biệt',
    maChiNhanh: room.maChiNhanh || '',
    maLoaiPhong: room.maLoaiPhong || '',
    tinhTrang: room.tinhTrang || room.trangThai || 'Trống',
    urlImg: room.urlImg || '',
    anhPhong: null,
    tenAnhPhong: ''
  };
}

function firstName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || 'bạn';
}

function initials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase() || 'AD';
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function getLatestBirthDateValue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - 1);
  return toDateInputValue(today);
}

function isPastDate(value) {
  if (!value) return false;
  const inputDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(inputDate.getTime()) && inputDate < today;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const datePart = new Intl.DateTimeFormat('en-CA').format(date);
  const timePart = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
  return `${datePart} ${timePart}`;
}

function formatBackupSize(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}

function formatBackupCode(row) {
  return `BK-${String(row?.maSaoLuu || 0).padStart(4, '0')}`;
}

function formatLogTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);

  return isToday ? time : `${new Intl.DateTimeFormat('vi-VN').format(date)} ${time}`;
}

function formatLogObject(row) {
  return [row.doiTuong, row.maDoiTuong].filter(Boolean).join(' ') || row.noiDung || '-';
}

function getRoomStatus(room) {
  return room?.trangThai || room?.tinhTrang || room?.tinhTrangPhong || ROOM_STATUS_EMPTY;
}

function getRoomBedCount(room) {
  return Number(room?.soGiuong || room?.tongSoGiuong || 0);
}

function sanitizePhoneNumber(value = '') {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
}

function isValidPhoneNumber(value = '') {
  const normalized = String(value ?? '').trim();
  return /^0\d{9}$/.test(normalized);
}

function readImageFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function RequiredLabel({ children }) {
  return (
    <span>
      {children} <b className="admin-required">*</b>
    </span>
  );
}

function AdminBrand() {
  return (
    <Link className="admin-brand" to="/">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 9.5 12 3l9 6.5V21H3V9.5Z" />
        <path d="M9 21v-9h6v9" />
      </svg>
      <span><strong>Homestay</strong>Dorm</span>
    </Link>
  );
}

function StatusPill({ children }) {
  const text = String(children);
  let tone = 'done';
  if (text.includes(BRANCH_STATUS_INACTIVE) || text.includes('Ngừng hoạt động') || text.includes('Vô hiệu hóa') || text.includes('Hủy')) {
    tone = 'danger';
  } else if (text.includes(ROOM_STATUS_MAINTENANCE) || text.includes('Tạm khóa') || text.includes('Bảo trì') || text.includes('Chờ')) {
    tone = 'warn';
  }
  return <span className={`admin-status ${tone}`}>{children}</span>;
}

function BackupDetailModal({ backup, onClose, onRestore }) {
  if (!backup) return null;

  const fields = [
    ['Mã bản sao', formatBackupCode(backup)],
    ['Loại sao lưu', backup.loaiSaoLuu || '-'],
    ['Trạng thái', backup.trangThai || '-'],
    ['Bắt đầu', formatDateTime(backup.thoiGianBatDau)],
    ['Kết thúc', formatDateTime(backup.thoiGianKetThuc)],
    ['Người thao tác', backup.maNguoiDung || backup.hoTenNguoiDung || 'Hệ thống'],
    ['Đường dẫn file', backup.duongDanFile || '-'],
    ['Thông báo', backup.thongBao || '-']
  ];

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="backup-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-title">
            <span className="admin-modal-avatar"><Icon name="save" /></span>
            <div>
              <span className="admin-eyebrow">Chi tiết sao lưu</span>
              <h3 id="backup-detail-title">{formatBackupCode(backup)}</h3>
              <StatusPill>{backup.trangThai || '-'}</StatusPill>
            </div>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <div className="admin-detail-grid">
          {fields.map(([label, value]) => (
            <div className="admin-detail-item" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <footer className="admin-modal-actions">
          <button className="admin-btn secondary" type="button" onClick={onClose}>Đóng</button>
          <button className="admin-btn danger" type="button" disabled={backup.trangThai !== 'Thành công'} onClick={() => onRestore(backup)}>
            <Icon name="restore" />
            Tạo lệnh phục hồi
          </button>
        </footer>
      </section>
    </div>
  );
}

function RestoreCommandModal({ backup, command, error, isSubmitting, onClose, onConfirm }) {
  if (!backup) return null;

  const hasCommand = Boolean(command);

  return (
    <div className="admin-modal-backdrop" role="presentation" style={{ zIndex: 1300 }} onMouseDown={isSubmitting ? undefined : onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="restore-command-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-title">
            <span className="admin-modal-avatar" style={{ background: hasCommand ? 'rgba(0, 102, 109, 0.1)' : 'rgba(164, 60, 18, 0.12)', color: hasCommand ? 'var(--admin-primary)' : 'var(--admin-secondary-dark)' }}>
              <Icon name={hasCommand ? 'check_circle' : 'restore'} />
            </span>
            <div>
              <span className="admin-eyebrow">{hasCommand ? 'Lệnh phục hồi' : 'Xác nhận thao tác'}</span>
              <h3 id="restore-command-title">{hasCommand ? 'Đã tạo lệnh phục hồi' : 'Tạo lệnh phục hồi dữ liệu'}</h3>
            </div>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} disabled={isSubmitting} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <div className="admin-restore-body">
          {error && <div className="admin-form-error">{error}</div>}
          {hasCommand ? (
            <>
              <p>Lệnh phục hồi từ bản sao <strong>{formatBackupCode(backup)}</strong> đã được tạo. Kiểm tra kỹ trước khi chạy trong SQL Server.</p>
              <pre className="admin-restore-command">{command}</pre>
            </>
          ) : (
            <>
              <p>Bạn muốn tạo lệnh phục hồi từ bản sao <strong>{formatBackupCode(backup)}</strong>?</p>
              <div className="admin-form-note">
                Lệnh này chỉ tạo script phục hồi, không tự ghi đè dữ liệu hiện tại.
              </div>
            </>
          )}
        </div>

        <footer className="admin-modal-actions">
          <button className="admin-btn secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            {hasCommand ? 'Đóng' : 'Hủy'}
          </button>
          {!hasCommand && (
            <button className="admin-btn danger" type="button" onClick={onConfirm} disabled={isSubmitting}>
              <Icon name="restore" />
              {isSubmitting ? 'Đang tạo...' : 'Tạo lệnh phục hồi'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function EmployeeDetailModal({ employee, isBusy, onClose, onToggleLock, onEdit }) {
  if (!employee) return null;
  const isLocked = employee.trangThaiTaiKhoan === 'Vô hiệu hóa';

  const fields = [
    ['Mã nhân viên', employee.maNhanVien],
    ['Tài khoản', employee.tenDangNhap || 'Chưa có'],
    ['Họ tên', employee.hoTen],
    ['Chức vụ', employee.chucVu],
    ['Chi nhánh', employee.tenChiNhanh || employee.maChiNhanh || 'Hệ thống'],
    ['Ngày vào làm', formatDate(employee.ngayVaoLam)],
    ['Ngày sinh', formatDate(employee.ngaySinh)],
    ['Giới tính', employee.gioiTinh || 'Chưa cập nhật'],
    ['Số điện thoại', employee.soDienThoai || 'Chưa cập nhật'],
    ['Email', employee.email || 'Chưa cập nhật'],
    ['Địa chỉ', employee.diaChi || 'Chưa cập nhật']
  ];

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="employee-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-title">
            <span className="admin-modal-avatar">{initials(employee.hoTen)}</span>
            <div>
              <span className="admin-eyebrow">Chi tiết nhân viên</span>
              <h3 id="employee-detail-title">{employee.hoTen}</h3>
              <StatusPill>{employee.trangThaiTaiKhoan || 'Chưa có TK'}</StatusPill>
            </div>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <div className="admin-detail-grid">
          {fields.map(([label, value]) => (
            <div className="admin-detail-item" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <footer className="admin-modal-actions">
          <button className="admin-btn secondary" type="button" onClick={onClose}>Đóng</button>
          <button className="admin-btn secondary" type="button" onClick={() => onEdit(employee)}>
            <Icon name="mode_edit" />
            Cập nhật
          </button>
          {employee.tenDangNhap && (
            <button className={`admin-btn ${isLocked ? 'primary' : 'danger'}`} type="button" disabled={isBusy} onClick={() => onToggleLock(employee)}>
              <Icon name={isLocked ? 'lock_open' : 'lock'} />
              {isBusy ? 'Đang xử lý...' : isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function CreateEmployeeModal({ form, branches, error, isSubmitting, onChange, onClose, onSubmit }) {
  const maxBirthDate = getLatestBirthDateValue();

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="create-employee-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Tài khoản nhân viên</span>
            <h3 id="create-employee-title">Tạo tài khoản mới</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={onSubmit}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Mã NV</RequiredLabel>
              <input className="admin-readonly-field" value={form.maNhanVien} readOnly placeholder="Đang lấy mã..." />
            </label>
            <label>
              <RequiredLabel>Tên đăng nhập</RequiredLabel>
              <input value={form.tenDangNhap} onChange={(event) => onChange('tenDangNhap', event.target.value)} required placeholder="nv0014" />
            </label>
            <label>
              <RequiredLabel>Mật khẩu</RequiredLabel>
              <input value={form.matKhau} onChange={(event) => onChange('matKhau', event.target.value)} required minLength={6} type="password" placeholder="Tối thiểu 3 ký tự" />
            </label>
            <label>
              <RequiredLabel>Họ tên</RequiredLabel>
              <input value={form.hoTen} onChange={(event) => onChange('hoTen', event.target.value)} required placeholder="Nguyễn Văn A" />
            </label>
            <label>
              <RequiredLabel>Ngày sinh</RequiredLabel>
              <input
                value={form.ngaySinh}
                onChange={(event) => onChange('ngaySinh', event.target.value)}
                required
                type="date"
                max={maxBirthDate}
              />
            </label>
            <label>
              <RequiredLabel>Giới tính</RequiredLabel>
              <select value={form.gioiTinh} onChange={(event) => onChange('gioiTinh', event.target.value)} required>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Số điện thoại</RequiredLabel>
              <input
                value={form.soDienThoai}
                onChange={(event) => onChange('soDienThoai', sanitizePhoneNumber(event.target.value))}
                required
                placeholder="0901234567"
                inputMode="numeric"
                maxLength={10}
              />
            </label>
            <label>
              <RequiredLabel>Email</RequiredLabel>
              <input value={form.email} onChange={(event) => onChange('email', event.target.value)} required type="email" placeholder="email@domain.com" />
            </label>
            <label>
              <RequiredLabel>Chức vụ</RequiredLabel>
              <select value={form.chucVu} onChange={(event) => onChange('chucVu', event.target.value)} required>
                <option>Sale</option>
                <option>Quản lý</option>
                <option>Kế toán</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Chi nhánh</RequiredLabel>
              <select value={form.maChiNhanh} onChange={(event) => onChange('maChiNhanh', event.target.value)} required>
                <option value="">Chọn chi nhánh</option>
                {branches.map((branch) => (
                  <option value={branch.maChiNhanh} key={branch.maChiNhanh}>
                    {branch.tenChiNhanh} ({branch.maChiNhanh})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>Ngày vào làm</RequiredLabel>
              <input value={form.ngayVaoLam} onChange={(event) => onChange('ngayVaoLam', event.target.value)} required type="date" />
            </label>
            <label className="admin-form-full">
              <RequiredLabel>Địa chỉ</RequiredLabel>
              <input value={form.diaChi} onChange={(event) => onChange('diaChi', event.target.value)} required placeholder="Địa chỉ liên hệ" />
            </label>
          </div>

          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit" disabled={isSubmitting}>
              <Icon name="person_add" />
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function UpdateEmployeeModal({ employee, form, branches, error, isSubmitting, onChange, onClose, onSubmit }) {
  if (!employee) return null;
  const maxBirthDate = getLatestBirthDateValue();

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="update-employee-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Tài khoản nhân viên</span>
            <h3 id="update-employee-title">Cập nhật {employee.maNhanVien}</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={onSubmit}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Họ tên</RequiredLabel>
              <input value={form.hoTen} onChange={(event) => onChange('hoTen', event.target.value)} required />
            </label>
            <label>
              <RequiredLabel>Ngày sinh</RequiredLabel>
              <input value={form.ngaySinh} onChange={(event) => onChange('ngaySinh', event.target.value)} required type="date" max={maxBirthDate} />
            </label>
            <label>
              <RequiredLabel>Giới tính</RequiredLabel>
              <select value={form.gioiTinh} onChange={(event) => onChange('gioiTinh', event.target.value)} required>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Số điện thoại</RequiredLabel>
              <input value={form.soDienThoai} onChange={(event) => onChange('soDienThoai', sanitizePhoneNumber(event.target.value))} required inputMode="numeric" maxLength={10} />
            </label>
            <label>
              <RequiredLabel>Email</RequiredLabel>
              <input value={form.email} onChange={(event) => onChange('email', event.target.value)} required type="email" />
            </label>
            <label>
              <RequiredLabel>Chức vụ</RequiredLabel>
              <select value={form.chucVu} onChange={(event) => onChange('chucVu', event.target.value)} required>
                <option>Sale</option>
                <option>Quản lý</option>
                <option>Kế toán</option>
                <option>Admin</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Chi nhánh</RequiredLabel>
              <select value={form.maChiNhanh} onChange={(event) => onChange('maChiNhanh', event.target.value)} required={form.chucVu !== 'Admin'}>
                <option value="">Hệ thống</option>
                {branches.map((branch) => (
                  <option value={branch.maChiNhanh} key={branch.maChiNhanh}>
                    {branch.tenChiNhanh} ({branch.maChiNhanh})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>Ngày vào làm</RequiredLabel>
              <input value={form.ngayVaoLam} onChange={(event) => onChange('ngayVaoLam', event.target.value)} required type="date" />
            </label>
            <label className="admin-form-full">
              <RequiredLabel>Địa chỉ</RequiredLabel>
              <input value={form.diaChi} onChange={(event) => onChange('diaChi', event.target.value)} required />
            </label>
          </div>

          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit" disabled={isSubmitting}>
              <Icon name="save" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}


function OverviewView({ setActiveTab }) {
  const [stats, setStats] = useState(adminStats);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    lockedEmployees: 0,
    totalBranches: 0,
    activeBranches: 0,
    inactiveBranches: 0,
    totalRooms: 0,
    activeRooms: 0,
    maintenanceRooms: 0,
    totalBeds: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [overviewError, setOverviewError] = useState('');

  const fetchOverviewData = async () => {
    setOverviewError('');
    try {
      const [empResult, branchResult, roomResult, backupResult, logResult] = await Promise.allSettled([
        adminApi.getEmployees(),
        adminApi.getBranches(),
        adminApi.getRooms(),
        adminApi.getBackups({ soDong: 1 }),
        adminApi.getLogs({ soDong: 4 })
      ]);

      const employees = empResult.status === 'fulfilled' ? (empResult.value.data || []) : [];
      const branches = branchResult.status === 'fulfilled' ? (branchResult.value.data || []) : [];
      const rooms = roomResult.status === 'fulfilled' ? (roomResult.value.data || []) : [];
      const backups = backupResult.status === 'fulfilled' ? (backupResult.value.data || []) : [];
      const logs = logResult.status === 'fulfilled' ? (logResult.value.data || []) : [];
      const lockedRoomIds = new Set(getLockedRoomIds());
      const activeEmployees = employees.filter((employee) => employee.trangThaiTaiKhoan !== 'Vô hiệu hóa');
      const lockedEmployees = employees.filter((employee) => employee.trangThaiTaiKhoan === 'Vô hiệu hóa');
      const activeBranches = branches.filter((branch) => branch.trangThai === BRANCH_STATUS_ACTIVE);
      const inactiveBranches = branches.filter((branch) => branch.trangThai !== BRANCH_STATUS_ACTIVE);
      const activeBranchIds = new Set(activeBranches.map((branch) => branch.maChiNhanh));
      const activeBranchRooms = rooms.filter((room) => activeBranchIds.has(room.maChiNhanh));
      const totalBeds = activeBranchRooms.reduce((sum, room) => sum + getRoomBedCount(room), 0);
      const maintenanceRooms = rooms.filter((room) => (
        getRoomStatus(room) === ROOM_STATUS_MAINTENANCE || lockedRoomIds.has(String(room.maPhong || '').trim())
      ));
      const lastBackup = backups[0] || null;
      const lastBackupTime = lastBackup ? formatLogTime(lastBackup.thoiGianBatDau) : 'Chưa có';
      const attentionCount = lockedEmployees.length + maintenanceRooms.length + inactiveBranches.length;

      setSummary({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        lockedEmployees: lockedEmployees.length,
        totalBranches: branches.length,
        activeBranches: activeBranches.length,
        inactiveBranches: inactiveBranches.length,
        totalRooms: rooms.length,
        activeRooms: activeBranchRooms.length,
        maintenanceRooms: maintenanceRooms.length,
        totalBeds
      });
      setRecentLogs(logs);

      setStats([
        {
          label: 'Nhân viên hoạt động',
          value: String(activeEmployees.length),
          note: `Tổng cộng ${employees.length} tài khoản`,
          icon: 'person',
          tone: 'primary'
        },
        {
          label: 'Phòng vận hành',
          value: String(activeBranchRooms.length),
          note: `${activeBranches.length}/${branches.length} chi nhánh hoạt động`,
          icon: 'apartment',
          tone: 'secondary'
        },
        {
          label: 'Cần chú ý',
          value: String(attentionCount),
          note: `${lockedEmployees.length} khóa / ${maintenanceRooms.length} bảo trì`,
          icon: 'warning',
          tone: 'warning'
        },
        {
          label: 'Sao lưu gần nhất',
          value: lastBackupTime,
          note: lastBackup ? `${lastBackup.loaiSaoLuu} · ${lastBackup.trangThai}` : 'Chưa có bản sao lưu',
          icon: 'save',
          tone: 'success'
        }
      ]);
      if (empResult.status === 'rejected' || branchResult.status === 'rejected' || roomResult.status === 'rejected') {
        setOverviewError('Một phần dữ liệu tổng quan chưa tải được.');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
      setOverviewError('Một phần dữ liệu tổng quan chưa tải được.');
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const quickActions = [
    { label: 'Tạo nhân viên', icon: 'person_add', tab: 'employees', tone: 'primary' },
    { label: 'Quản lý phòng', icon: 'bed', tab: 'property' },
    { label: 'Dịch vụ & nội quy', icon: 'bolt', tab: 'services' },
    { label: 'Sao lưu dữ liệu', icon: 'save', tab: 'backup' }
  ];

  const healthItems = [
    { label: 'Tài khoản khóa', value: summary.lockedEmployees, note: `${summary.totalEmployees} tổng tài khoản`, icon: 'person_add' },
    { label: 'Phòng bảo trì', value: summary.maintenanceRooms, note: `${summary.totalRooms} tổng phòng`, icon: 'warning' },
    { label: 'Chi nhánh ngừng', value: summary.inactiveBranches, note: `${summary.totalBranches} tổng chi nhánh`, icon: 'apartment' },
    { label: 'Tổng giường', value: summary.totalBeds, note: `${summary.activeRooms} phòng vận hành`, icon: 'bed' }
  ];

  return (
    <>
      <section className="admin-hero admin-overview-hero">
        <div>
          <span className="admin-eyebrow">Bảng điều khiển Admin</span>
          <h2>Tổng quan vận hành HomeStayDorm</h2>
          <p>Theo dõi nhanh nhân sự, chi nhánh, phòng giường, sao lưu và nhật ký quản trị trong cùng một màn hình.</p>
        </div>
        <div className="admin-hero-actions">
          <button className="admin-btn secondary" type="button" onClick={fetchOverviewData}>
            <Icon name="refresh" /> Làm mới
          </button>
        </div>
      </section>

      <section className="admin-stat-grid">
        {stats.map((stat) => (
          <article className={`admin-stat-card ${stat.tone}`} key={stat.label}>
            <span className="admin-stat-icon"><Icon name={stat.icon} /></span>
            <div>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </article>
        ))}
      </section>

      {overviewError && <div className="admin-error-banner admin-overview-error">{overviewError}</div>}

      <section className="admin-overview-layout">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-eyebrow">Lối tắt</span>
              <h3>Thao tác nhanh</h3>
            </div>
          </div>
          <div className="admin-quick-grid">
            {quickActions.map((action) => (
              <button
                className={`admin-quick-action ${action.tone || ''}`}
                type="button"
                key={action.label}
                onClick={() => setActiveTab(action.tab)}
              >
                <span><Icon name={action.icon} /></span>
                <strong>{action.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-eyebrow">Vận hành</span>
              <h3>Tình hình hệ thống</h3>
            </div>
          </div>
          <div className="admin-health-grid">
            {healthItems.map((item) => (
              <article className="admin-health-item" key={item.label}>
                <span><Icon name={item.icon} /></span>
                <div>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                  <em>{item.note}</em>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-panel admin-recent-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-eyebrow">Nhật ký</span>
              <h3>Hoạt động gần đây</h3>
            </div>
            <button className="admin-link-btn" type="button" onClick={() => setActiveTab('logs')}>Xem tất cả</button>
          </div>
          <div className="admin-recent-list">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <article className="admin-recent-row" key={log.maNhatKy}>
                <span><Icon name="list" /></span>
                <div>
                  <strong>{log.hanhDong}</strong>
                  <small>{formatLogObject(log)} · {formatLogTime(log.thoiGian)}</small>
                </div>
              </article>
            )) : (
              <div className="admin-empty-state">Chưa có hoạt động gần đây.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function EmployeesView() {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ tuKhoa: '', chucVu: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailBusy, setIsDetailBusy] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(createEmptyEmployeeForm);
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState(createEmployeeEditForm);
  const [editError, setEditError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchEmployees = async (nextFilters = filters) => {
    try {
      const { data } = await adminApi.getEmployees(nextFilters);
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data } = await adminApi.getBranches({ trangThai: 'Hoạt động' });
      setBranches(data);
      setCreateForm((current) => (
        current.maChiNhanh || data.length === 0
          ? current
          : { ...current, maChiNhanh: data[0].maChiNhanh }
      ));
      return data;
    } catch (error) {
      console.error('Failed to load branches:', error);
      return [];
    }
  };

  const openDetail = async (employee) => {
    setIsDetailBusy(true);
    setSelectedEmployee(employee);
    try {
      const { data } = await adminApi.getEmployee(employee.maNhanVien);
      setSelectedEmployee(data);
    } catch (error) {
      console.error('Failed to load employee detail:', error);
    } finally {
      setIsDetailBusy(false);
    }
  };

  const handleToggleLock = async (employee) => {
    setIsDetailBusy(true);
    try {
      const isLocked = employee.trangThaiTaiKhoan !== 'Vô hiệu hóa';
      const { data } = await adminApi.lockUnlockEmployee(employee.maNhanVien, isLocked);
      setSelectedEmployee((current) => ({ ...current, ...data }));
      await fetchEmployees();
    } catch (error) {
      console.error('Failed to toggle employee account:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setIsDetailBusy(false);
    }
  };

  const handleCreateChange = (field, value) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditChange = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const openEditModal = async (employee) => {
    setEditingEmployee(employee);
    setEditForm(createEmployeeEditForm(employee));
    setEditError('');
    if (branches.length === 0) {
      await fetchBranches();
    }
  };

  const openCreateModal = async () => {
    const initialForm = createEmptyEmployeeForm();
    const defaultBranch = branches[0]?.maChiNhanh || '';
    setCreateForm({ ...initialForm, maChiNhanh: defaultBranch });
    setCreateError('');
    setShowCreateModal(true);

    try {
      const [{ data }, loadedBranches] = await Promise.all([
        adminApi.getNextEmployeeId(),
        branches.length > 0 ? Promise.resolve(branches) : fetchBranches()
      ]);
      const maNhanVien = data?.maNhanVien || '';
      setCreateForm((current) => ({
        ...current,
        maNhanVien,
        tenDangNhap: current.tenDangNhap || maNhanVien.toLowerCase(),
        maChiNhanh: current.maChiNhanh || loadedBranches[0]?.maChiNhanh || ''
      }));
    } catch (error) {
      console.error('Failed to load next employee id:', error);
      setCreateError('Không lấy được mã nhân viên kế tiếp từ DB.');
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!isValidPhoneNumber(createForm.soDienThoai)) {
      setCreateError('Số điện thoại phải có đúng 10 số và bắt đầu bằng 0.');
      return;
    }

    if (!isPastDate(createForm.ngaySinh)) {
      setCreateError('Ngày sinh phải nhỏ hơn ngày hiện tại.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...createForm,
        ngaySinh: createForm.ngaySinh,
        ngayVaoLam: createForm.ngayVaoLam,
        email: createForm.email,
        diaChi: createForm.diaChi,
        soDienThoai: createForm.soDienThoai
      };
      const { data } = await adminApi.createEmployee(payload);
      setShowCreateModal(false);
      setCreateForm(createEmptyEmployeeForm());
      await fetchEmployees();
      setSelectedEmployee(data);
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Không thể tạo tài khoản nhân viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditError('');

    if (!isValidPhoneNumber(editForm.soDienThoai)) {
      setEditError('Số điện thoại phải có đúng 10 số và bắt đầu bằng 0.');
      return;
    }

    if (!isPastDate(editForm.ngaySinh)) {
      setEditError('Ngày sinh phải nhỏ hơn ngày hiện tại.');
      return;
    }

    setIsEditing(true);
    try {
      const payload = {
        ...editForm,
        soDienThoai: editForm.soDienThoai,
        maChiNhanh: editForm.chucVu === 'Admin' ? null : editForm.maChiNhanh
      };

      await adminApi.updateEmployee(editingEmployee.maNhanVien, payload);
      if (editForm.chucVu !== editingEmployee.chucVu) {
        await adminApi.assignRole(editingEmployee.maNhanVien, { chucVu: editForm.chucVu });
      }

      const { data } = await adminApi.getEmployee(editingEmployee.maNhanVien);
      setSelectedEmployee(data);
      setEditingEmployee(null);
      await fetchEmployees();
    } catch (error) {
      setEditError(error.response?.data?.message || 'Không thể cập nhật nhân viên.');
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      fetchEmployees(filters);
    }, 250);

    return () => window.clearTimeout(debounceId);
  }, [filters]);

  return (
    <section className="admin-workspace">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Nhân viên</span>
            <h3>Quản lý tài khoản và chức vụ</h3>
          </div>
          <button className="admin-btn primary" type="button" onClick={openCreateModal}><Icon name="person_add" /> Tạo tài khoản</button>
        </div>

        <div className="admin-filter-row">
          <label>
            <span>Tìm kiếm</span>
            <input 
              placeholder="Tên, mã nhân viên, tài khoản..." 
              value={filters.tuKhoa}
              onChange={(e) => setFilters((current) => ({ ...current, tuKhoa: e.target.value }))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  fetchEmployees(filters);
                }
              }}
            />
          </label>
          <label>
            <span>Chức vụ</span>
            <select 
              value={filters.chucVu}
              onChange={(e) => setFilters((current) => ({ ...current, chucVu: e.target.value }))}
            >
              <option value="">Tất cả</option>
              <option>Sale</option>
              <option>Quản lý</option>
              <option>Kế toán</option>
              <option>Admin</option>
            </select>
          </label>
          <button className="admin-btn secondary" type="button" onClick={() => fetchEmployees(filters)}><Icon name="filter_list" /> Lọc</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Tài khoản</th>
                <th>Họ tên</th>
                <th>Chức vụ</th>
                <th>Chi nhánh</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? employees.map((row) => (
                <tr key={row.maNhanVien}>
                  <td><strong>{row.maNhanVien}</strong></td>
                  <td>{row.tenDangNhap || '-'}</td>
                  <td>{row.hoTen}</td>
                  <td>{row.chucVu}</td>
                  <td>{row.maChiNhanh || 'Hệ thống'}</td>
                  <td><StatusPill>{row.trangThaiTaiKhoan || 'Chưa có TK'}</StatusPill></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="admin-icon-btn" type="button" title="Xem chi tiết" aria-label="Xem chi tiết nhân viên" onClick={() => openDetail(row)}>
                      <Icon name="visibility" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Không tìm thấy nhân viên nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeDetailModal
        employee={selectedEmployee}
        isBusy={isDetailBusy}
        onClose={() => setSelectedEmployee(null)}
        onToggleLock={handleToggleLock}
        onEdit={openEditModal}
      />

      {showCreateModal && (
        <CreateEmployeeModal
          form={createForm}
          branches={branches}
          error={createError}
          isSubmitting={isSubmitting}
          onChange={handleCreateChange}
          onClose={() => {
            setShowCreateModal(false);
            setCreateError('');
          }}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editingEmployee && (
        <UpdateEmployeeModal
          employee={editingEmployee}
          form={editForm}
          branches={branches}
          error={editError}
          isSubmitting={isEditing}
          onChange={handleEditChange}
          onClose={() => {
            setEditingEmployee(null);
            setEditError('');
          }}
          onSubmit={handleEditSubmit}
        />
      )}
    </section>
  );
}

function CreateBranchModal({ form, error, isSubmitting, onChange, onClose, onSubmit }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="create-branch-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Chi nhánh</span>
            <h3 id="create-branch-title">Thêm chi nhánh mới</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={onSubmit}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Tên chi nhánh</RequiredLabel>
              <input value={form.tenChiNhanh} onChange={(event) => onChange('tenChiNhanh', event.target.value)} required placeholder="HomeStayDorm Quận 1" />
            </label>
            <label>
              <RequiredLabel>Trạng thái</RequiredLabel>
              <select value={form.trangThai} onChange={(event) => onChange('trangThai', event.target.value)} required>
                <option>Hoạt động</option>
                <option>Ngừng hoạt động</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Số điện thoại</RequiredLabel>
              <input
                value={form.soDienThoai}
                onChange={(event) => onChange('soDienThoai', sanitizePhoneNumber(event.target.value))}
                required
                placeholder="0901234567"
                inputMode="numeric"
                maxLength={10}
              />
            </label>
            <label>
              <RequiredLabel>Email</RequiredLabel>
              <input value={form.email} onChange={(event) => onChange('email', event.target.value)} required type="email" placeholder="chinhanh@homedorm.vn" />
            </label>
            <label className="admin-form-full">
              <RequiredLabel>Địa chỉ</RequiredLabel>
              <input value={form.diaChi} onChange={(event) => onChange('diaChi', event.target.value)} required placeholder="Địa chỉ chi nhánh" />
            </label>
          </div>

          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit" disabled={isSubmitting}>
              <Icon name="apartment" />
              {isSubmitting ? 'Đang thêm...' : 'Thêm chi nhánh'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function BranchDetailModal({ branch, isBusy, onClose, onToggleStatus, onEdit, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!branch) return null;
  const isInactive = branch.trangThai === 'Ngừng hoạt động';

  const fields = [
    ['Mã chi nhánh', branch.maChiNhanh],
    ['Tên chi nhánh', branch.tenChiNhanh],
    ['Số phòng', branch.soPhong || 0],
    ['Số nhân viên', branch.soNhanVien || 0],
    ['Số điện thoại', branch.soDienThoai || 'Chưa cập nhật'],
    ['Email', branch.email || 'Chưa cập nhật'],
    ['Địa chỉ', branch.diaChi || 'Chưa cập nhật']
  ];

  const handleToggleClick = () => {
    setShowConfirm(true);
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="branch-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-modal-title">
            <span className="admin-modal-avatar"><Icon name="apartment" /></span>
            <div>
              <span className="admin-eyebrow">Chi tiết chi nhánh</span>
              <h3 id="branch-detail-title">{branch.tenChiNhanh}</h3>
              <StatusPill>{branch.trangThai}</StatusPill>
            </div>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <div className="admin-detail-grid">
          {fields.map(([label, value]) => (
            <div className="admin-detail-item" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <footer className="admin-modal-actions">
          <button className="admin-btn secondary" type="button" onClick={onClose}>Đóng</button>
          <button className="admin-btn secondary" type="button" onClick={() => onEdit(branch)}>
            <Icon name="mode_edit" />
            Cập nhật
          </button>
          <button className="admin-btn danger" type="button" disabled={isBusy} onClick={() => onDelete(branch)}>
            <Icon name="delete" />
            Xóa
          </button>
          <button className={`admin-btn ${isInactive ? 'primary' : 'danger'}`} type="button" disabled={isBusy} onClick={handleToggleClick}>
            <Icon name={isInactive ? 'check_circle' : 'cancel'} />
            {isBusy ? 'Đang xử lý...' : isInactive ? 'Mở hoạt động lại' : 'Ngừng hoạt động'}
          </button>
        </footer>
      </section>

      {showConfirm && (
        <div className="admin-modal-backdrop" role="presentation" style={{ zIndex: 1100 }} onMouseDown={() => setShowConfirm(false)}>
          <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header className="admin-modal-head">
              <div className="admin-modal-title">
                <span className="admin-modal-avatar" style={{ background: isInactive ? 'rgba(0, 102, 109, 0.1)' : '#fef2f2', color: isInactive ? 'var(--admin-primary)' : '#dc2626' }}><Icon name={isInactive ? 'check_circle' : 'warning'} /></span>
                <div>
                  <span className="admin-eyebrow">Xác nhận thao tác</span>
                  <h3>{isInactive ? 'Mở hoạt động lại chi nhánh' : 'Ngừng hoạt động chi nhánh'}</h3>
                </div>
              </div>
              <button className="admin-icon-btn" type="button" onClick={() => setShowConfirm(false)} aria-label="Đóng">
                <Icon name="close" />
              </button>
            </header>
            <div style={{ padding: '0 24px 24px 24px', color: '#6f797a' }}>
              <p>Bạn có chắc chắn muốn {isInactive ? 'mở hoạt động lại' : 'ngừng hoạt động'} chi nhánh <strong>{branch.tenChiNhanh}</strong> không?</p>
              {!isInactive && <p style={{ marginTop: '8px', fontSize: '13px' }}>Sau khi ngừng hoạt động, chi nhánh có thể sẽ không xuất hiện trong các danh sách chọn phòng mới. Bạn có thể mở lại bất kỳ lúc nào.</p>}
            </div>
            <footer className="admin-modal-actions">
              <button className="admin-btn secondary" type="button" onClick={() => setShowConfirm(false)}>Hủy bỏ</button>
              <button className={`admin-btn ${isInactive ? 'primary' : 'danger'}`} type="button" disabled={isBusy} onClick={() => { setShowConfirm(false); onToggleStatus(branch); }}>
                <Icon name={isInactive ? 'check_circle' : 'cancel'} />
                {isBusy ? 'Đang xử lý...' : (isInactive ? 'Xác nhận mở lại' : 'Xác nhận ngừng')}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

function UpdateBranchModal({ branch, form, error, isSubmitting, onChange, onClose, onSubmit }) {
  if (!branch) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="update-branch-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Chi nhánh</span>
            <h3 id="update-branch-title">Cập nhật {branch.maChiNhanh}</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={onSubmit}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Tên chi nhánh</RequiredLabel>
              <input value={form.tenChiNhanh} onChange={(event) => onChange('tenChiNhanh', event.target.value)} required />
            </label>
            <label>
              <RequiredLabel>Trạng thái</RequiredLabel>
              <select value={form.trangThai} onChange={(event) => onChange('trangThai', event.target.value)} required>
                <option>Hoạt động</option>
                <option>Ngừng hoạt động</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Số điện thoại</RequiredLabel>
              <input value={form.soDienThoai} onChange={(event) => onChange('soDienThoai', sanitizePhoneNumber(event.target.value))} required inputMode="numeric" maxLength={10} />
            </label>
            <label>
              <RequiredLabel>Email</RequiredLabel>
              <input value={form.email} onChange={(event) => onChange('email', event.target.value)} required type="email" />
            </label>
            <label className="admin-form-full">
              <RequiredLabel>Địa chỉ</RequiredLabel>
              <input value={form.diaChi} onChange={(event) => onChange('diaChi', event.target.value)} required />
            </label>
          </div>

          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit" disabled={isSubmitting}>
              <Icon name="save" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function CreateRoomBedModal({ form, branches, roomTypes, error, isSubmitting, onChange, onImageChange, onClose, onSubmit }) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="create-room-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Phòng và giường</span>
            <h3 id="create-room-title">Tạo phòng/giường mới</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={onSubmit}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Tên phòng</RequiredLabel>
              <input value={form.tenPhong} onChange={(event) => onChange('tenPhong', event.target.value)} required placeholder="Phòng 4 người A101" />
            </label>
            <label>
              <RequiredLabel>Chi nhánh</RequiredLabel>
              <select value={form.maChiNhanh} onChange={(event) => onChange('maChiNhanh', event.target.value)} required>
                <option value="">Chọn chi nhánh</option>
                {branches.map((branch) => (
                  <option value={branch.maChiNhanh} key={branch.maChiNhanh}>
                    {branch.tenChiNhanh} ({branch.maChiNhanh})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>Loại phòng</RequiredLabel>
              <select value={form.maLoaiPhong} onChange={(event) => onChange('maLoaiPhong', event.target.value)} required>
                <option value="">Chọn loại phòng</option>
                {roomTypes.map((roomType) => (
                  <option value={roomType.maLoaiPhong} key={roomType.maLoaiPhong}>
                    {roomType.tenLoaiPhong} - tối đa {roomType.sucChuaToiDa}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>Số giường</RequiredLabel>
              <input value={form.soGiuong} onChange={(event) => onChange('soGiuong', event.target.value)} required min="1" max="99" type="number" />
            </label>
            <label>
              <RequiredLabel>Giới tính cho phép</RequiredLabel>
              <select value={form.gioiTinhChoPhep} onChange={(event) => onChange('gioiTinhChoPhep', event.target.value)} required>
                <option>Không phân biệt</option>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Tình trạng</RequiredLabel>
              <select value={form.tinhTrang} onChange={(event) => onChange('tinhTrang', event.target.value)} required>
                <option>Trống</option>
                <option>Còn chỗ</option>
                <option>Đầy</option>
                <option>Giữ chỗ</option>
                <option>Đã đặt cọc</option>
              </select>
            </label>
            <label className="admin-form-full">
              <span>Ảnh phòng</span>
              <input accept="image/*" onChange={(event) => onImageChange(event.target.files?.[0] || null)} type="file" />
              <small className="admin-form-hint">
                {form.tenAnhPhong ? `Đã chọn: ${form.tenAnhPhong}` : 'Chọn ảnh JPG, PNG, WEBP hoặc GIF. Tối đa 5MB.'}
              </small>
            </label>
            <div className="admin-form-full admin-form-note">
              Hệ thống sẽ tự tạo {Number(form.soGiuong) || 0} giường cho phòng này theo mã G01, G02...
              dựa trên số lượng giường bạn nhập.
            </div>
            {form.anhPhong?.base64 && (
              <div className="admin-form-full admin-upload-preview">
                <img src={form.anhPhong.base64} alt="Xem trước ảnh phòng" />
              </div>
            )}
          </div>

          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit" disabled={isSubmitting}>
              <Icon name="bed" />
              {isSubmitting ? 'Đang tạo...' : 'Tạo phòng/giường'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function UpdateRoomModal({ room, form, branches, roomTypes, error, isSubmitting, onChange, onImageChange, onClose, onSubmit }) {
  if (!room) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="update-room-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Phòng</span>
            <h3 id="update-room-title">Cập nhật {room.maPhong}</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={onSubmit}>
          {error && <div className="admin-form-error">{error}</div>}
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Tên phòng</RequiredLabel>
              <input value={form.tenPhong} onChange={(event) => onChange('tenPhong', event.target.value)} required />
            </label>
            <label>
              <RequiredLabel>Chi nhánh</RequiredLabel>
              <select value={form.maChiNhanh} onChange={(event) => onChange('maChiNhanh', event.target.value)} required>
                {branches.map((branch) => (
                  <option value={branch.maChiNhanh} key={branch.maChiNhanh}>{branch.tenChiNhanh} ({branch.maChiNhanh})</option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>Loại phòng</RequiredLabel>
              <select value={form.maLoaiPhong} onChange={(event) => onChange('maLoaiPhong', event.target.value)} required>
                {roomTypes.map((roomType) => (
                  <option value={roomType.maLoaiPhong} key={roomType.maLoaiPhong}>{roomType.tenLoaiPhong}</option>
                ))}
              </select>
            </label>
            <label>
              <RequiredLabel>Giới tính cho phép</RequiredLabel>
              <select value={form.gioiTinhChoPhep} onChange={(event) => onChange('gioiTinhChoPhep', event.target.value)} required>
                <option>Không phân biệt</option>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Tình trạng</RequiredLabel>
              <select value={form.tinhTrang} onChange={(event) => onChange('tinhTrang', event.target.value)} required>
                <option>Trống</option>
                <option>Bảo trì</option>
                <option>Đang thuê</option>
                <option>Đã đặt cọc</option>
              </select>
            </label>
            <label>
              <span>URL ảnh hiện tại</span>
              <input value={form.urlImg} onChange={(event) => onChange('urlImg', event.target.value)} placeholder="/uploads/phong/..." />
            </label>
            <label className="admin-form-full">
              <span>Thay ảnh phòng</span>
              <input type="file" accept="image/*" onChange={(event) => onImageChange(event.target.files?.[0])} />
              {form.tenAnhPhong && <small>Đã chọn: {form.tenAnhPhong}</small>}
            </label>
            {form.anhPhong?.base64 && (
              <div className="admin-form-full admin-upload-preview">
                <img src={form.anhPhong.base64} alt="Xem trước ảnh phòng" />
              </div>
            )}
          </div>

          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit" disabled={isSubmitting}>
              <Icon name="save" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function BedModal({ room, item, onClose, onRefresh }) {
  const isEdit = !!item;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (isEdit) {
        await adminApi.updateRoomBed(room.maPhong, item.maGiuong, { ...data, maGiuong: item.maGiuong });
      } else {
        await adminApi.createRoomBed(room.maPhong, data);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" style={{ zIndex: 1200 }} onMouseDown={onClose}>
      <section className="admin-modal" onMouseDown={e => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Quản lý giường</span>
            <h3>{isEdit ? 'Cập nhật giường' : 'Thêm giường mới'}</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose}><Icon name="close" /></button>
        </header>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label>
              <RequiredLabel>Số thứ tự giường</RequiredLabel>
              <input name="soGiuong" type="number" required defaultValue={item?.soGiuong || ''} min="1" max={room?.soGiuong || 99} />
            </label>
            <label className="admin-form-full">
              <RequiredLabel>Tình trạng</RequiredLabel>
              <select name="tinhTrang" defaultValue={item?.tinhTrang || 'Trống'} required>
                <option value="Trống">Trống</option>
                <option value="Đã đặt cọc">Đã đặt cọc</option>
                <option value="Đang thuê">Đang thuê</option>
              </select>
            </label>
          </div>
          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit"><Icon name="save" /> Lưu lại</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function AssetModal({ room, beds, item, onClose, onRefresh }) {
  const isEdit = !!item;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (isEdit) {
        await adminApi.updateRoomAsset(room.maPhong, item.maTaiSan, { ...data, maTaiSan: item.maTaiSan });
      } else {
        await adminApi.createRoomAsset(room.maPhong, data);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" style={{ zIndex: 1200 }} onMouseDown={onClose}>
      <section className="admin-modal" onMouseDown={e => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Tài sản phòng</span>
            <h3>{isEdit ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose}><Icon name="close" /></button>
        </header>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-full">
              <RequiredLabel>Tên tài sản</RequiredLabel>
              <input name="tenTaiSan" required defaultValue={item?.tenTaiSan || ''} placeholder="Tủ lạnh, Điều hòa..." />
            </label>
            <label>
              <RequiredLabel>Số lượng</RequiredLabel>
              <input name="soLuong" type="number" required defaultValue={item?.soLuong || 1} min="1" />
            </label>
            <label>
              <span>Đơn giá (nếu có)</span>
              <input name="donGia" type="number" defaultValue={item?.donGia || ''} min="0" step="1000" />
            </label>
            <label>
              <RequiredLabel>Phân loại</RequiredLabel>
              <select name="loaiTaiSan" defaultValue={item?.loaiTaiSan || 'Chung'} required>
                <option value="Chung">Tài sản chung (Phòng)</option>
                <option value="Riêng">Tài sản riêng (Giường)</option>
              </select>
            </label>
            <label>
              <span>Gắn với giường (nếu là ts riêng)</span>
              <select name="maGiuong" defaultValue={item?.maGiuong || ''}>
                <option value="">-- Chọn giường --</option>
                {beds.map(b => (
                  <option key={b.maGiuong} value={b.maGiuong}>Giường số {b.soGiuong} ({b.maGiuong})</option>
                ))}
              </select>
            </label>
          </div>
          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit"><Icon name="save" /> Lưu lại</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function RoomDetailModal({ room, branch, roomType, onClose }) {
  const [activeTab, setActiveTab] = useState('info'); // info, beds, assets
  const [beds, setBeds] = useState([]);
  const [assets, setAssets] = useState([]);
  const [showBedModal, setShowBedModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchBeds = async () => {
    if (!room) return;
    try {
      const res = await adminApi.getRoomBeds(room.maPhong);
      setBeds(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchAssets = async () => {
    if (!room) return;
    try {
      const res = await adminApi.getRoomAssets(room.maPhong);
      setAssets(res.data.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!room) return;
    if (activeTab === 'beds') fetchBeds();
    if (activeTab === 'assets') fetchAssets();
  }, [room, activeTab]);

  const handleDeleteBed = async (id) => {
    if (confirm('Xác nhận xóa giường này?')) {
      try {
        await adminApi.deleteRoomBed(room.maPhong, id);
        fetchBeds();
      } catch (err) { alert(err.response?.data?.message || err.message); }
    }
  };

  const handleDeleteAsset = async (id) => {
    if (confirm('Xác nhận xóa tài sản này?')) {
      try {
        await adminApi.deleteRoomAsset(room.maPhong, id);
        fetchAssets();
      } catch (err) { alert(err.response?.data?.message || err.message); }
    }
  };

  if (!room) return null;

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal admin-modal-wide" role="dialog" style={{ width: '800px', maxWidth: '95vw', height: '80vh', display: 'flex', flexDirection: 'column' }} onMouseDown={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Quản lý chi tiết</span>
            <h3>{room.tenPhong} ({room.maPhong})</h3>
          </div>
          <button className="admin-icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </header>
        
        <div className="admin-tabs">
          <button type="button" className={`admin-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Thông tin chung</button>
          <button type="button" className={`admin-tab ${activeTab === 'beds' ? 'active' : ''}`} onClick={() => setActiveTab('beds')}>Quản lý giường</button>
          <button type="button" className={`admin-tab ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>Tài sản phòng</button>
        </div>

        <div className="admin-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'info' && (
            <div className="admin-form-grid">
              <label><span>Tên phòng:</span> <input value={room.tenPhong} disabled /></label>
              <label><span>Chi nhánh:</span> <input value={branch?.tenChiNhanh || ''} disabled /></label>
              <label><span>Loại phòng:</span> <input value={roomType?.tenLoaiPhong || ''} disabled /></label>
              <label><span>Giới tính:</span> <input value={room.gioiTinhChoPhep} disabled /></label>
              <label><span>Số giường:</span> <input value={room.soGiuong} disabled /></label>
              <label><span>Tình trạng:</span> <input value={room.trangThai || room.tinhTrang || 'Trống'} disabled /></label>
            </div>
          )}

          {activeTab === 'beds' && (
            <div className="admin-table-wrap">
              <div style={{ padding: '0 0 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn primary" type="button" onClick={() => { setEditItem(null); setShowBedModal(true); }}>
                  <Icon name="add" /> Thêm giường
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã giường</th>
                    <th>Số giường</th>
                    <th>Tình trạng</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {beds.map(bed => (
                    <tr key={bed.maGiuong}>
                      <td>{bed.maGiuong}</td>
                      <td>Giường số {bed.soGiuong}</td>
                      <td><StatusPill>{bed.tinhTrang}</StatusPill></td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="admin-icon-btn" title="Chỉnh sửa" onClick={() => { setEditItem(bed); setShowBedModal(true); }}><Icon name="mode_edit" /></button>
                        <button className="admin-icon-btn danger" title="Xóa" onClick={() => handleDeleteBed(bed.maGiuong)}><Icon name="delete" /></button>
                      </td>
                    </tr>
                  ))}
                  {beds.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Chưa có giường nào</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="admin-table-wrap">
              <div style={{ padding: '0 0 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="admin-btn primary" type="button" onClick={() => { setEditItem(null); setShowAssetModal(true); }}>
                  <Icon name="add" /> Thêm tài sản
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã tài sản</th>
                    <th>Tên tài sản</th>
                    <th>Loại</th>
                    <th>Số lượng</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.maTaiSan}>
                      <td>{asset.maTaiSan}</td>
                      <td>{asset.tenTaiSan}</td>
                      <td>{asset.loaiTaiSan}</td>
                      <td>{asset.soLuong}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="admin-icon-btn" title="Chỉnh sửa" onClick={() => { setEditItem(asset); setShowAssetModal(true); }}><Icon name="mode_edit" /></button>
                        <button className="admin-icon-btn danger" title="Xóa" onClick={() => handleDeleteAsset(asset.maTaiSan)}><Icon name="delete" /></button>
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Chưa có tài sản nào</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showBedModal && <BedModal room={room} item={editItem} onClose={() => setShowBedModal(false)} onRefresh={fetchBeds} />}
      {showAssetModal && <AssetModal room={room} beds={beds} item={editItem} onClose={() => setShowAssetModal(false)} onRefresh={fetchAssets} />}
    </div>
  );
}

function PropertyView() {
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [branchForm, setBranchForm] = useState(createEmptyBranchForm);
  const [roomForm, setRoomForm] = useState(createEmptyRoomBedForm);
  const [branchError, setBranchError] = useState('');
  const [roomError, setRoomError] = useState('');
  const [isBranchSubmitting, setIsBranchSubmitting] = useState(false);
  const [isRoomSubmitting, setIsRoomSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isBranchDetailBusy, setIsBranchDetailBusy] = useState(false);
  const [roomToConfirm, setRoomToConfirm] = useState(null);
  const [isRoomActionBusy, setIsRoomActionBusy] = useState(false);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchEditForm, setBranchEditForm] = useState(createBranchEditForm);
  const [branchEditError, setBranchEditError] = useState('');
  const [isBranchEditing, setIsBranchEditing] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomEditForm, setRoomEditForm] = useState(createRoomEditForm);
  const [roomEditError, setRoomEditError] = useState('');
  const [isRoomEditing, setIsRoomEditing] = useState(false);

  const propertyRows = useMemo(() => {
    const roomsByBranch = rooms.reduce((map, room) => {
      const current = map.get(room.maChiNhanh) || { roomCount: 0, bedCount: 0 };
      current.roomCount += 1;
      current.bedCount += Number(room.soGiuong || 0);
      map.set(room.maChiNhanh, current);
      return map;
    }, new Map());

    return branches.map((branch) => {
      const summary = roomsByBranch.get(branch.maChiNhanh) || {};
      return {
        branch: branch.maChiNhanh,
        area: branch.tenChiNhanh,
        rooms: Number(branch.soPhong ?? summary.roomCount ?? 0),
        beds: Number(summary.bedCount ?? 0),
        status: branch.trangThai === 'Hoạt động' ? 'Đang vận hành' : branch.trangThai,
        originalBranch: branch
      };
    });
  }, [branches, rooms]);

  const fetchPropertyData = async () => {
    try {
      const [branchResponse, roomTypeResponse, roomResponse] = await Promise.all([
        adminApi.getBranches(),
        adminApi.getRoomTypes(),
        adminApi.getRooms()
      ]);
      const lockedRoomIds = new Set(getLockedRoomIds());
      setBranches(branchResponse.data);
      setRoomTypes(roomTypeResponse.data);
      setRooms(roomResponse.data.map((room) => {
        const roomId = String(room.maPhong || room.MaPhong || '').trim();
        const isLocked = lockedRoomIds.has(roomId);
        const roomStatus = isLocked
          ? ROOM_STATUS_MAINTENANCE
          : (room.trangThai || room.tinhTrang || room.tinhTrangPhong || ROOM_STATUS_EMPTY);

        return {
          ...room,
          trangThai: roomStatus,
          tinhTrang: roomStatus
        };
      }));

      setRoomForm((current) => ({
        ...current,
        maChiNhanh: current.maChiNhanh || branchResponse.data[0]?.maChiNhanh || '',
        maLoaiPhong: current.maLoaiPhong || roomTypeResponse.data[0]?.maLoaiPhong || '',
        soGiuong: current.soGiuong || roomTypeResponse.data[0]?.sucChuaToiDa || 1
      }));
    } catch (error) {
      console.error('Failed to load property data:', error);
    }
  };

  const handleBranchChange = (field, value) => {
    setBranchForm((current) => ({ ...current, [field]: value }));
  };

  const handleBranchEditChange = (field, value) => {
    setBranchEditForm((current) => ({ ...current, [field]: value }));
  };

  const handleRoomChange = (field, value) => {
    setRoomForm((current) => {
      if (field === 'maLoaiPhong') {
        const roomType = roomTypes.find((item) => item.maLoaiPhong === value);
        return {
          ...current,
          maLoaiPhong: value,
          soGiuong: roomType?.sucChuaToiDa || current.soGiuong
        };
      }

      return { ...current, [field]: value };
    });
  };

  const handleRoomEditChange = (field, value) => {
    setRoomEditForm((current) => ({ ...current, [field]: value }));
  };

  const handleRoomImageChange = async (file) => {
    setRoomError('');

    if (!file) {
      setRoomForm((current) => ({ ...current, anhPhong: null, tenAnhPhong: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setRoomError('Vui lòng chọn đúng file ảnh.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setRoomError('Ảnh phòng tối đa 5MB.');
      return;
    }

    try {
      const base64 = await readImageFileAsBase64(file);
      setRoomForm((current) => ({
        ...current,
        anhPhong: {
          base64,
          mimeType: file.type,
          fileName: file.name
        },
        tenAnhPhong: file.name
      }));
    } catch (error) {
      console.error('Failed to read room image:', error);
      setRoomError('Không đọc được file ảnh đã chọn.');
    }
  };

  const handleRoomEditImageChange = async (file) => {
    setRoomEditError('');

    if (!file) {
      setRoomEditForm((current) => ({ ...current, anhPhong: null, tenAnhPhong: '' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setRoomEditError('Vui lòng chọn đúng file ảnh.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setRoomEditError('Ảnh phòng tối đa 5MB.');
      return;
    }

    try {
      const base64 = await readImageFileAsBase64(file);
      setRoomEditForm((current) => ({
        ...current,
        anhPhong: {
          base64,
          mimeType: file.type,
          fileName: file.name
        },
        tenAnhPhong: file.name
      }));
    } catch (error) {
      console.error('Failed to read room image:', error);
      setRoomEditError('Không đọc được file ảnh đã chọn.');
    }
  };

  const openBranchModal = () => {
    setBranchForm(createEmptyBranchForm());
    setBranchError('');
    setShowBranchModal(true);
  };

  const openRoomModal = () => {
    const firstRoomType = roomTypes[0];
    setRoomForm({
      ...createEmptyRoomBedForm(),
      maChiNhanh: branches[0]?.maChiNhanh || '',
      maLoaiPhong: firstRoomType?.maLoaiPhong || '',
      soGiuong: firstRoomType?.sucChuaToiDa || 1
    });
    setRoomError('');
    setShowRoomModal(true);
  };

  const openBranchEditModal = (branch) => {
    setEditingBranch(branch);
    setBranchEditForm(createBranchEditForm(branch));
    setBranchEditError('');
  };

  const openRoomEditModal = (room) => {
    setEditingRoom(room);
    setRoomEditForm(createRoomEditForm(room));
    setRoomEditError('');
  };

  const handleBranchSubmit = async (event) => {
    event.preventDefault();
    setBranchError('');

    if (!isValidPhoneNumber(branchForm.soDienThoai)) {
      setBranchError('Số điện thoại phải có đúng 10 số và bắt đầu bằng 0.');
      return;
    }

    setIsBranchSubmitting(true);
    try {
      await adminApi.createBranch(branchForm);
      setShowBranchModal(false);
      setBranchForm(createEmptyBranchForm());
      await fetchPropertyData();
    } catch (error) {
      setBranchError(error.response?.data?.message || 'Không thể thêm chi nhánh.');
    } finally {
      setIsBranchSubmitting(false);
    }
  };

  const handleToggleBranchStatus = async (branch) => {
    setIsBranchDetailBusy(true);
    try {
      const newStatus = branch.trangThai === 'Ngừng hoạt động' ? 'Hoạt động' : 'Ngừng hoạt động';
      await adminApi.updateBranch(branch.maChiNhanh, { ...branch, trangThai: newStatus });
      setSelectedBranch((current) => ({ ...current, trangThai: newStatus }));
      await fetchPropertyData();
    } catch (error) {
      console.error('Failed to toggle branch status:', error);
    } finally {
      setIsBranchDetailBusy(false);
    }
  };

  const confirmToggleRoomStatus = async () => {
    if (!roomToConfirm) return;
    setIsRoomActionBusy(true);
    const isMaintenance = roomToConfirm.trangThai === ROOM_STATUS_MAINTENANCE;
    const newStatus = isMaintenance ? ROOM_STATUS_EMPTY : ROOM_STATUS_MAINTENANCE;
    try {
      await adminApi.updateRoomStatus(roomToConfirm.maPhong, newStatus);
      setRoomLocked(roomToConfirm.maPhong, !isMaintenance);
      setRooms((current) => current.map((room) => (
        room.maPhong === roomToConfirm.maPhong
          ? { ...room, trangThai: newStatus, tinhTrang: newStatus }
          : room
      )));
      setRoomToConfirm(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái phòng.');
    } finally {
      setIsRoomActionBusy(false);
    }
  };

  const handleRoomSubmit = async (event) => {
    event.preventDefault();
    setRoomError('');
    setIsRoomSubmitting(true);
    try {
      await adminApi.createRoomBeds({
        ...roomForm,
        soGiuong: Number(roomForm.soGiuong)
      });
      setShowRoomModal(false);
      setRoomForm(createEmptyRoomBedForm());
      await fetchPropertyData();
    } catch (error) {
      setRoomError(error.response?.data?.message || 'Không thể tạo phòng/giường.');
    } finally {
      setIsRoomSubmitting(false);
    }
  };

  const handleBranchEditSubmit = async (event) => {
    event.preventDefault();
    setBranchEditError('');

    if (!isValidPhoneNumber(branchEditForm.soDienThoai)) {
      setBranchEditError('Số điện thoại phải có đúng 10 số và bắt đầu bằng 0.');
      return;
    }

    setIsBranchEditing(true);
    try {
      const { data } = await adminApi.updateBranch(editingBranch.maChiNhanh, branchEditForm);
      setEditingBranch(null);
      setSelectedBranch(data || { ...editingBranch, ...branchEditForm });
      await fetchPropertyData();
    } catch (error) {
      setBranchEditError(error.response?.data?.message || 'Không thể cập nhật chi nhánh.');
    } finally {
      setIsBranchEditing(false);
    }
  };

  const handleDeleteBranch = async (branch) => {
    if (!confirm(`Xác nhận xóa chi nhánh ${branch.maChiNhanh}?`)) return;

    setIsBranchDetailBusy(true);
    try {
      await adminApi.deleteBranch(branch.maChiNhanh);
      setSelectedBranch(null);
      await fetchPropertyData();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa chi nhánh.');
    } finally {
      setIsBranchDetailBusy(false);
    }
  };

  const handleRoomEditSubmit = async (event) => {
    event.preventDefault();
    setRoomEditError('');
    setIsRoomEditing(true);
    try {
      await adminApi.updateRoom(editingRoom.maPhong, roomEditForm);
      setEditingRoom(null);
      await fetchPropertyData();
    } catch (error) {
      setRoomEditError(error.response?.data?.message || 'Không thể cập nhật phòng.');
    } finally {
      setIsRoomEditing(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!confirm(`Xác nhận xóa phòng ${room.maPhong}?`)) return;

    setIsRoomActionBusy(true);
    try {
      await adminApi.deleteRoom(room.maPhong);
      setSelectedRoomDetail((current) => (current?.maPhong === room.maPhong ? null : current));
      await fetchPropertyData();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa phòng.');
    } finally {
      setIsRoomActionBusy(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, []);

  return (
    <section className="admin-workspace">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Cơ sở lưu trú</span>
            <h3>Chi nhánh, loại phòng, phòng và giường</h3>
          </div>
          <div className="admin-button-group">
            <button className="admin-btn secondary" type="button" onClick={openBranchModal}><Icon name="apartment" /> Thêm chi nhánh</button>
          </div>
        </div>
        <div className="admin-property-grid">
          {propertyRows.length > 0 ? propertyRows.map((row) => (
            <article className="admin-property-card" key={row.branch} onClick={() => setSelectedBranch(row.originalBranch)} style={{ cursor: 'pointer' }}>
              <div className="admin-property-head">
                <span><Icon name="apartment" /></span>
                <StatusPill>{row.status}</StatusPill>
              </div>
              <h4>{row.branch}</h4>
              <p>{row.area}</p>
              <div className="admin-property-metrics">
                <strong>{row.rooms}<small>phòng</small></strong>
                <strong>{row.beds}<small>giường</small></strong>
              </div>
              <button className="admin-icon-btn" type="button" title="Xem chi tiết" aria-label="Xem chi tiết chi nhánh" onClick={(e) => { e.stopPropagation(); setSelectedBranch(row.originalBranch); }}>
                <Icon name="visibility" />
              </button>
            </article>
          )) : (
            <div className="admin-empty-state">Chưa có chi nhánh nào</div>
          )}
        </div>
      </div>

      <div className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Phòng & Giường</span>
            <h3>Danh sách chi tiết phòng</h3>
          </div>
          <button className="admin-btn primary" type="button" onClick={openRoomModal}><Icon name="bed" /> Tạo phòng/giường</button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã phòng</th>
                <th>Tên phòng</th>
                <th>Chi nhánh</th>
                <th>Loại phòng</th>
                <th>Giới tính</th>
                <th>Số giường</th>
                <th>Trạng thái</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length > 0 ? rooms.map((room) => {
                const branch = branches.find(b => b.maChiNhanh === room.maChiNhanh);
                const roomType = roomTypes.find(t => t.maLoaiPhong === room.maLoaiPhong);
                const isBranchInactive = branch?.trangThai === BRANCH_STATUS_INACTIVE;
                const isRoomLocked = room.trangThai === ROOM_STATUS_MAINTENANCE;
                
                return (
                  <tr
                    key={room.maPhong}
                    className={isRoomLocked ? 'admin-room-locked-row' : ''}
                    style={{ opacity: isBranchInactive ? 0.6 : 1, background: isBranchInactive ? '#f9fafb' : 'transparent' }}
                  >
                    <td><strong>{room.maPhong}</strong></td>
                    <td>{room.tenPhong}</td>
                    <td>{branch ? branch.tenChiNhanh : room.maChiNhanh}</td>
                    <td>{roomType ? roomType.tenLoaiPhong : room.maLoaiPhong}</td>
                    <td>{room.gioiTinhChoPhep}</td>
                    <td>{room.soGiuong}</td>
                    <td><StatusPill>{isBranchInactive ? BRANCH_STATUS_INACTIVE : (room.trangThai || BRANCH_STATUS_ACTIVE)}</StatusPill></td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="admin-icon-btn" 
                        type="button" 
                        title="Chi tiết phòng"
                        onClick={() => setSelectedRoomDetail(room)}
                      >
                        <Icon name="visibility" />
                      </button>
                      <button
                        className="admin-icon-btn"
                        type="button"
                        disabled={isBranchInactive}
                        title={isBranchInactive ? 'Chi nhánh đang ngừng hoạt động' : 'Cập nhật phòng'}
                        onClick={() => openRoomEditModal(room)}
                      >
                        <Icon name="mode_edit" />
                      </button>
                      <button 
                        className={`admin-icon-btn ${!isRoomLocked ? 'danger' : ''}`}
                        type="button" 
                        disabled={isBranchInactive}
                        title={isBranchInactive ? 'Chi nhánh đang ngừng hoạt động' : (isRoomLocked ? 'Mở khóa phòng' : 'Khóa phòng (Bảo trì)')}
                        onClick={() => setRoomToConfirm(room)}
                      >
                        <Icon name={isRoomLocked ? 'lock_open' : 'lock'} />
                      </button>
                      <button
                        className="admin-icon-btn danger"
                        type="button"
                        disabled={isBranchInactive || isRoomActionBusy}
                        title={isBranchInactive ? 'Chi nhánh đang ngừng hoạt động' : 'Xóa phòng'}
                        onClick={() => handleDeleteRoom(room)}
                      >
                        <Icon name="delete" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-subtle)' }}>
                    Chưa có phòng nào trong hệ thống
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BranchDetailModal
        branch={selectedBranch}
        isBusy={isBranchDetailBusy}
        onClose={() => setSelectedBranch(null)}
        onToggleStatus={handleToggleBranchStatus}
        onEdit={openBranchEditModal}
        onDelete={handleDeleteBranch}
      />

      {showBranchModal && (
        <CreateBranchModal
          form={branchForm}
          error={branchError}
          isSubmitting={isBranchSubmitting}
          onChange={handleBranchChange}
          onClose={() => {
            setShowBranchModal(false);
            setBranchError('');
          }}
          onSubmit={handleBranchSubmit}
        />
      )}

      {showRoomModal && (
        <CreateRoomBedModal
          form={roomForm}
          branches={branches.filter((branch) => branch.trangThai === 'Hoạt động')}
          roomTypes={roomTypes}
          error={roomError}
          isSubmitting={isRoomSubmitting}
          onChange={handleRoomChange}
          onImageChange={handleRoomImageChange}
          onClose={() => {
            setShowRoomModal(false);
            setRoomError('');
          }}
          onSubmit={handleRoomSubmit}
        />
      )}

      {editingBranch && (
        <UpdateBranchModal
          branch={editingBranch}
          form={branchEditForm}
          error={branchEditError}
          isSubmitting={isBranchEditing}
          onChange={handleBranchEditChange}
          onClose={() => {
            setEditingBranch(null);
            setBranchEditError('');
          }}
          onSubmit={handleBranchEditSubmit}
        />
      )}

      {editingRoom && (
        <UpdateRoomModal
          room={editingRoom}
          form={roomEditForm}
          branches={branches.filter((branch) => branch.trangThai === 'Hoạt động' || branch.maChiNhanh === editingRoom.maChiNhanh)}
          roomTypes={roomTypes}
          error={roomEditError}
          isSubmitting={isRoomEditing}
          onChange={handleRoomEditChange}
          onImageChange={handleRoomEditImageChange}
          onClose={() => {
            setEditingRoom(null);
            setRoomEditError('');
          }}
          onSubmit={handleRoomEditSubmit}
        />
      )}

      {roomToConfirm && (() => {
        const isMaintenance = roomToConfirm.trangThai === ROOM_STATUS_MAINTENANCE;
        return (
          <div className="admin-modal-backdrop" role="presentation" style={{ zIndex: 1100 }} onMouseDown={() => setRoomToConfirm(null)}>
            <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
              <header className="admin-modal-head">
                <div className="admin-modal-title">
                  <span className="admin-modal-avatar" style={{ background: isMaintenance ? 'rgba(0, 102, 109, 0.1)' : '#fef2f2', color: isMaintenance ? 'var(--admin-primary)' : '#dc2626' }}>
                    <Icon name={isMaintenance ? 'lock_open' : 'lock'} />
                  </span>
                  <div>
                    <span className="admin-eyebrow">Xác nhận thao tác</span>
                    <h3>{isMaintenance ? 'Mở khóa phòng' : 'Khóa phòng (Bảo trì)'}</h3>
                  </div>
                </div>
                <button className="admin-icon-btn" type="button" onClick={() => setRoomToConfirm(null)} aria-label="Đóng">
                  <Icon name="close" />
                </button>
              </header>
              <div style={{ padding: '0 24px 24px 24px', color: '#6f797a' }}>
                <p>Bạn có chắc chắn muốn {isMaintenance ? 'mở khóa' : 'khóa (bảo trì)'} phòng <strong>{roomToConfirm.tenPhong}</strong> không?</p>
                {!isMaintenance && <p style={{ marginTop: '8px', fontSize: '13px' }}>Khi khóa, phòng sẽ chuyển sang trạng thái Bảo trì và không thể phân bổ thêm khách.</p>}
              </div>
              <footer className="admin-modal-actions">
                <button className="admin-btn secondary" type="button" onClick={() => setRoomToConfirm(null)}>Hủy bỏ</button>
                <button className={`admin-btn ${isMaintenance ? 'primary' : 'danger'}`} type="button" disabled={isRoomActionBusy} onClick={confirmToggleRoomStatus}>
                  <Icon name={isMaintenance ? 'lock_open' : 'lock'} />
                  {isRoomActionBusy ? 'Đang xử lý...' : (isMaintenance ? 'Xác nhận mở khóa' : 'Xác nhận khóa')}
                </button>
              </footer>
            </section>
          </div>
        );
      })()}

      {selectedRoomDetail && (
        <RoomDetailModal 
          room={selectedRoomDetail} 
          branch={branches.find(b => b.maChiNhanh === selectedRoomDetail.maChiNhanh)}
          roomType={roomTypes.find(t => t.maLoaiPhong === selectedRoomDetail.maLoaiPhong)}
          onClose={() => setSelectedRoomDetail(null)} 
        />
      )}
    </section>
  );
}

function ServiceModal({ item, onClose, onRefresh }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (item) {
        await adminApi.updateService(item.maDichVu, data);
      } else {
        await adminApi.createService(data);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Dịch vụ</span>
            <h3>{item ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h3>
          </div>
          <button className="admin-icon-btn" onClick={onClose} type="button" aria-label="Đóng"><Icon name="close" /></button>
        </header>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-full">
              <RequiredLabel>Tên dịch vụ</RequiredLabel>
              <input name="tenDichVu" defaultValue={item?.tenDichVu} required />
            </label>
            <label>
              <RequiredLabel>Đơn vị tính</RequiredLabel>
              <input name="donViTinh" defaultValue={item?.donViTinh} required />
            </label>
            <label>
              <RequiredLabel>Đơn giá</RequiredLabel>
              <input type="number" name="donGia" defaultValue={item?.donGia} required />
            </label>
          </div>
          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit">Lưu</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function RefundRuleModal({ item, onClose, onRefresh }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (item) {
        await adminApi.updateRefundRule(item.maQuyDinhHoanCoc, data);
      } else {
        await adminApi.createRefundRule(data);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Quy định hoàn cọc</span>
            <h3>{item ? 'Cập nhật quy định' : 'Thêm quy định mới'}</h3>
          </div>
          <button className="admin-icon-btn" onClick={onClose} type="button" aria-label="Đóng"><Icon name="close" /></button>
        </header>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-full">
              <RequiredLabel>Tên quy định</RequiredLabel>
              <input name="tenQuyDinh" defaultValue={item?.tenQuyDinh} required />
            </label>
            <label>
              <RequiredLabel>Tỷ lệ hoàn cọc (%)</RequiredLabel>
              <input type="number" name="tyLeHoanCoc" defaultValue={item?.tyLeHoanCoc} required min="0" max="100" step="0.01" />
            </label>
          </div>
          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit">Lưu</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function RuleModal({ item, onClose, onRefresh }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (item) {
        await adminApi.updateRule(item.maQuyDinh, data);
      } else {
        await adminApi.createRule(data);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Nội quy</span>
            <h3>{item ? 'Cập nhật nội quy' : 'Thêm nội quy mới'}</h3>
          </div>
          <button className="admin-icon-btn" onClick={onClose} type="button" aria-label="Đóng"><Icon name="close" /></button>
        </header>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-full">
              <RequiredLabel>Tiêu đề nội quy</RequiredLabel>
              <input name="tieuDeNoiQuy" defaultValue={item?.tieuDeNoiQuy} required />
            </label>
            <label className="admin-form-full">
              <RequiredLabel>Nội dung</RequiredLabel>
              <textarea name="noiDung" defaultValue={item?.noiDung} rows={4} required></textarea>
            </label>
            {item && (
              <label className="admin-form-full">
                <RequiredLabel>Trạng thái</RequiredLabel>
                <select name="trangThai" defaultValue={item?.trangThai}>
                  <option value="Hiệu lực">Hiệu lực</option>
                  <option value="Hết hiệu lực">Hết hiệu lực</option>
                </select>
              </label>
            )}
          </div>
          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit">Lưu</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ViolationModal({ item, onClose, onRefresh }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      if (item) {
        await adminApi.updateViolation(item.maDieuKhoan, data);
      } else {
        await adminApi.createViolation(data);
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="admin-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <span className="admin-eyebrow">Điều khoản vi phạm</span>
            <h3>{item ? 'Cập nhật điều khoản' : 'Thêm điều khoản mới'}</h3>
          </div>
          <button className="admin-icon-btn" onClick={onClose} type="button" aria-label="Đóng"><Icon name="close" /></button>
        </header>
        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-full">
              <RequiredLabel>Tên điều khoản</RequiredLabel>
              <input name="tenDieuKhoan" defaultValue={item?.tenDieuKhoan} required />
            </label>
            <label>
              <RequiredLabel>Hình thức xử phạt</RequiredLabel>
              <select name="hinhThucXuPhat" defaultValue={item?.hinhThucXuPhat || 'Phạt tiền'}>
                <option value="Phạt tiền">Phạt tiền</option>
                <option value="Cảnh cáo">Cảnh cáo</option>
                <option value="Đuổi khỏi phòng">Đuổi khỏi phòng</option>
              </select>
            </label>
            <label>
              <RequiredLabel>Mức phạt (VNĐ)</RequiredLabel>
              <input type="number" name="mucPhat" defaultValue={item?.mucPhat} />
            </label>
            {item && (
              <label className="admin-form-full">
                <RequiredLabel>Trạng thái</RequiredLabel>
                <select name="trangThai" defaultValue={item?.trangThai}>
                  <option value="Đang áp dụng">Đang áp dụng</option>
                  <option value="Ngừng áp dụng">Ngừng áp dụng</option>
                </select>
              </label>
            )}
          </div>
          <footer className="admin-modal-actions">
            <button className="admin-btn secondary" type="button" onClick={onClose}>Hủy</button>
            <button className="admin-btn primary" type="submit">Lưu</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ServicesView() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [refundRules, setRefundRules] = useState([]);
  const [rules, setRules] = useState([]);
  const [violations, setViolations] = useState([]);
  
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showRefundRuleModal, setShowRefundRuleModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);

  const [editItem, setEditItem] = useState(null);

  const fetchServices = async () => {
    try {
      const res = await adminApi.getServices();
      setServices(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRefundRules = async () => {
    try {
      const res = await adminApi.getRefundRules();
      setRefundRules(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await adminApi.getRules();
      setRules(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchViolations = async () => {
    try {
      const res = await adminApi.getViolations();
      setViolations(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === 'services') fetchServices();
    if (activeTab === 'refundRules') fetchRefundRules();
    if (activeTab === 'rules') fetchRules();
    if (activeTab === 'violations') fetchViolations();
  }, [activeTab]);

  const handleDeleteService = async (id) => {
    if (confirm('Xác nhận xóa dịch vụ này?')) {
      try {
        await adminApi.deleteService(id);
        fetchServices();
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteRefundRule = async (id) => {
    if (confirm('Xác nhận xóa quy định hoàn cọc này?')) {
      try {
        await adminApi.deleteRefundRule(id);
        fetchRefundRules();
      } catch (err) { alert(err.response?.data?.message || err.message); }
    }
  };

  const handleDeleteRule = async (id) => {
    if (confirm('Xác nhận vô hiệu hóa nội quy này?')) {
      try {
        await adminApi.deleteRule(id);
        fetchRules();
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteViolation = async (id) => {
    if (confirm('Xác nhận vô hiệu hóa điều khoản vi phạm này?')) {
      try {
        await adminApi.deleteViolation(id);
        fetchViolations();
      } catch (err) { alert(err.message); }
    }
  };

  return (
    <section className="admin-workspace">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Quy định vận hành</span>
            <h3>Dịch vụ, nội quy và điều khoản vi phạm</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className={`admin-btn ${activeTab === 'services' ? 'primary' : ''}`} onClick={() => setActiveTab('services')}>Dịch vụ</button>
              <button className={`admin-btn ${activeTab === 'refundRules' ? 'primary' : ''}`} onClick={() => setActiveTab('refundRules')}>Hoàn cọc</button>
              <button className={`admin-btn ${activeTab === 'rules' ? 'primary' : ''}`} onClick={() => setActiveTab('rules')}>Nội quy</button>
              <button className={`admin-btn ${activeTab === 'violations' ? 'primary' : ''}`} onClick={() => setActiveTab('violations')}>Điều khoản vi phạm</button>
            </div>
          </div>
          <button className="admin-btn primary" type="button" onClick={() => {
            setEditItem(null);
            if (activeTab === 'services') setShowServiceModal(true);
            if (activeTab === 'refundRules') setShowRefundRuleModal(true);
            if (activeTab === 'rules') setShowRuleModal(true);
            if (activeTab === 'violations') setShowViolationModal(true);
          }}>
            <Icon name="add_circle" /> Thêm mới
          </button>
        </div>
        
        {activeTab === 'services' && (
          <div className="admin-service-list">
            {services.map((item) => (
              <article className="admin-service-row" key={item.maDichVu}>
                <span><Icon name={item.tenDichVu?.includes('Điện') ? 'electric_bolt' : item.tenDichVu?.includes('Nước') ? 'water_drop' : item.tenDichVu?.includes('Wifi') ? 'wifi' : item.tenDichVu?.includes('Vệ sinh') ? 'cleaning_services' : 'directions_bike'} /></span>
                <div>
                  <strong>{item.tenDichVu}</strong>
                  <small>{item.donViTinh}</small>
                </div>
                <b>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.donGia)}</b>
                <aside style={{ display: 'flex', gap: '0.5rem', flex: 'none', marginLeft: '1rem' }}>
                  <button className="admin-icon-btn" onClick={() => { setEditItem(item); setShowServiceModal(true); }}><Icon name="mode_edit" /></button>
                  <button className="admin-icon-btn danger" onClick={() => handleDeleteService(item.maDichVu)}><Icon name="delete" /></button>
                </aside>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'refundRules' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead><tr><th>Mã</th><th>Tên quy định</th><th>Tỷ lệ hoàn cọc</th><th>Số lần áp dụng</th><th>Thao tác</th></tr></thead>
              <tbody>
                {refundRules.map(rule => (
                  <tr key={rule.maQuyDinhHoanCoc}>
                    <td>{rule.maQuyDinhHoanCoc}</td>
                    <td>{rule.tenQuyDinh}</td>
                    <td><strong>{Number(rule.tyLeHoanCoc || 0)}%</strong></td>
                    <td>{rule.soLanApDung || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="admin-icon-btn" title="Chỉnh sửa" onClick={() => { setEditItem(rule); setShowRefundRuleModal(true); }}><Icon name="mode_edit" /></button>
                        <button className="admin-icon-btn danger" title="Xóa" onClick={() => handleDeleteRefundRule(rule.maQuyDinhHoanCoc)}><Icon name="delete" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {refundRules.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Chưa có quy định hoàn cọc</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead><tr><th>Mã</th><th>Tiêu đề</th><th>Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.maQuyDinh}>
                    <td>{rule.maQuyDinh}</td>
                    <td>{rule.tieuDeNoiQuy}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rule.noiDung}
                    </td>
                    <td><StatusPill>{rule.trangThai}</StatusPill></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="admin-icon-btn" title="Chỉnh sửa" onClick={() => { setEditItem(rule); setShowRuleModal(true); }}><Icon name="mode_edit" /></button>
                        <button className="admin-icon-btn danger" title="Vô hiệu hóa" onClick={() => handleDeleteRule(rule.maQuyDinh)}><Icon name="delete" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead><tr><th>Mã</th><th>Tên điều khoản</th><th>Hình thức</th><th>Mức phạt</th><th>Thao tác</th></tr></thead>
              <tbody>
                {violations.map(v => (
                  <tr key={v.maDieuKhoan}>
                    <td>{v.maDieuKhoan}</td>
                    <td>{v.tenDieuKhoan}</td>
                    <td><StatusPill>{v.hinhThucXuPhat}</StatusPill></td>
                    <td>{v.mucPhat ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.mucPhat) : ''}</td>
                    <td>
                      <button className="admin-icon-btn" onClick={() => { setEditItem(v); setShowViolationModal(true); }}><Icon name="mode_edit" /></button>
                      <button className="admin-icon-btn danger" title="Vô hiệu hóa" onClick={() => handleDeleteViolation(v.maDieuKhoan)}><Icon name="delete" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showServiceModal && <ServiceModal item={editItem} onClose={() => setShowServiceModal(false)} onRefresh={fetchServices} />}
      {showRefundRuleModal && <RefundRuleModal item={editItem} onClose={() => setShowRefundRuleModal(false)} onRefresh={fetchRefundRules} />}
      {showRuleModal && <RuleModal item={editItem} onClose={() => setShowRuleModal(false)} onRefresh={fetchRules} />}
      {showViolationModal && <ViolationModal item={editItem} onClose={() => setShowViolationModal(false)} onRefresh={fetchViolations} />}
    </section>
  );
}

function SettingsView() {
  const [form, setForm] = useState({
    chuKyFull: 'Hàng tuần',
    chuKyIncremental: 'Hàng ngày',
    thuMucLuuTru: 'C:\\SQLBackups'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await adminApi.getSettings();
        const data = res.data;
        
        setForm({
          chuKyFull: data.backup?.chuKyFull || 'Hàng tuần',
          chuKyIncremental: data.backup?.chuKyIncremental || 'Hàng ngày',
          thuMucLuuTru: data.backup?.thuMucLuuTru || 'C:\\SQLBackups'
        });
      } catch (err) {
        console.error(err);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await adminApi.updateSettings(form);
      alert('Lưu thay đổi thành công!');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-workspace">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Tham số hệ thống</span>
            <h3>Cấu hình nghiệp vụ và hoàn cọc</h3>
          </div>
          <button className="admin-btn primary" type="button" onClick={handleSave} disabled={isSubmitting}>
            <Icon name="save" /> {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
        <div className="admin-form-grid">
          <label>
            <RequiredLabel>Chu kỳ sao lưu full</RequiredLabel>
            <select 
              value={form.chuKyFull}
              onChange={e => handleChange('chuKyFull', e.target.value)}
            >
              <option>Hàng tuần</option>
              <option>Hàng tháng</option>
            </select>
          </label>
          <label>
            <RequiredLabel>Chu kỳ sao lưu incremental</RequiredLabel>
            <select
              value={form.chuKyIncremental}
              onChange={e => handleChange('chuKyIncremental', e.target.value)}
            >
              <option>Hàng ngày</option>
              <option>Hàng tuần</option>
            </select>
          </label>
          <label>
            <RequiredLabel>Thư mục lưu trữ</RequiredLabel>
            <input 
              value={form.thuMucLuuTru}
              onChange={e => handleChange('thuMucLuuTru', e.target.value)}
            />
          </label>
        </div>
        <div className="admin-note">
          <Icon name="info" />
          <span>Các thay đổi cấu hình nên được ghi nhật ký để truy vết người cập nhật và thời điểm cập nhật.</span>
        </div>
      </div>
    </section>
  );
}

const adminTabMeta = {
  overview: { label: 'Tổng quan', eyebrow: 'Admin · Tổng quan' },
  employees: { label: 'Tài khoản nhân viên', eyebrow: 'Admin · Tài khoản nhân viên' },
  property: { label: 'Chi nhánh & phòng', eyebrow: 'Admin · Chi nhánh & phòng' },
  services: { label: 'Dịch vụ & nội quy', eyebrow: 'Admin · Dịch vụ & nội quy' },
  settings: { label: 'Cấu hình hệ thống', eyebrow: 'Admin · Cấu hình hệ thống' },
  backup: { label: 'Sao lưu dữ liệu', eyebrow: 'Admin · Sao lưu dữ liệu' },
  logs: { label: 'Nhật ký hệ thống', eyebrow: 'Admin · Nhật ký hệ thống' }
};

function getUserInitials(user) {
  const name = user?.hoTen || user?.tenDangNhap || 'Admin';
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'AD';
}

function BackupView() {
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupType, setBackupType] = useState('Full');
  const [error, setError] = useState('');
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreCommand, setRestoreCommand] = useState('');
  const [restoreError, setRestoreError] = useState('');

  const fetchBackups = async () => {
    setError('');
    try {
      const { data } = await adminApi.getBackups({ soDong: 100 });
      setBackups(data || []);
    } catch (requestError) {
      setBackups([]);
      setError(requestError.response?.data?.message || 'Không thể tải lịch sử sao lưu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setError('');
    try {
      await adminApi.createBackup({ loaiSaoLuu: backupType });
      await fetchBackups();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể sao lưu dữ liệu lúc này.');
      await fetchBackups();
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!backup) return;
    setRestoreTarget(backup);
    setRestoreCommand('');
    setRestoreError('');
  };

  const confirmCreateRestoreCommand = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    setError('');
    setRestoreError('');
    try {
      const { data } = await adminApi.restoreBackup(restoreTarget.maSaoLuu, { chiTaoLenh: true });
      setRestoreCommand(data?.lenhPhucHoi || 'Đã tạo lệnh phục hồi dữ liệu.');
    } catch (requestError) {
      setRestoreError(requestError.response?.data?.message || 'Không thể tạo lệnh phục hồi dữ liệu.');
    } finally {
      setIsRestoring(false);
    }
  };

  const closeRestoreModal = () => {
    if (isRestoring) return;
    setRestoreTarget(null);
    setRestoreCommand('');
    setRestoreError('');
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return (
    <section className="admin-workspace">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Sao lưu dữ liệu</span>
            <h3>Lịch sử sao lưu gần đây</h3>
          </div>
          <div className="admin-button-group">
            <select className="admin-action-select" value={backupType} onChange={(event) => setBackupType(event.target.value)} disabled={isBackingUp} aria-label="Loại sao lưu">
              <option value="Full">Sao lưu toàn bộ</option>
              <option value="Incremental">Sao lưu thay đổi</option>
            </select>
            <button className="admin-btn primary" type="button" onClick={handleCreateBackup} disabled={isBackingUp}>
              <Icon name="save" /> {isBackingUp ? 'Đang sao lưu...' : 'Sao lưu ngay'}
            </button>
          </div>
        </div>
        {error && <div className="admin-error-banner">{error}</div>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã bản sao</th>
                <th>Loại</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th style={{ width: '92px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--admin-subtle)' }}>
                    Đang tải lịch sử sao lưu...
                  </td>
                </tr>
              ) : backups.length > 0 ? backups.map((row) => (
                <tr key={row.maSaoLuu}>
                  <td><strong>{formatBackupCode(row)}</strong></td>
                  <td>{row.loaiSaoLuu}</td>
                  <td>{formatDateTime(row.thoiGianBatDau)}</td>
                  <td><StatusPill>{row.trangThai}</StatusPill></td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="admin-icon-btn"
                      type="button"
                      title="Xem chi tiết sao lưu"
                      onClick={() => setSelectedBackup(row)}
                    >
                      <Icon name="visibility" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '28px', color: 'var(--admin-subtle)' }}>
                    Chưa có bản sao lưu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <BackupDetailModal backup={selectedBackup} onClose={() => setSelectedBackup(null)} onRestore={isRestoring ? () => {} : handleRestoreBackup} />
      <RestoreCommandModal
        backup={restoreTarget}
        command={restoreCommand}
        error={restoreError}
        isSubmitting={isRestoring}
        onClose={closeRestoreModal}
        onConfirm={confirmCreateRestoreCommand}
      />
    </section>
  );
}

function LogsView() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setError('');
    try {
      const { data } = await adminApi.getLogs({ soDong: 200 });
      setLogs(data || []);
    } catch (requestError) {
      setLogs([]);
      setError(requestError.response?.data?.message || 'Không thể tải nhật ký hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <section className="admin-workspace">
      <div className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-eyebrow">Nhật ký hệ thống</span>
            <h3>Các thao tác gần đây</h3>
          </div>
        </div>
        {error && <div className="admin-error-banner">{error}</div>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thao tác</th>
                <th>Vai trò</th>
                <th>Chức năng</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--admin-subtle)' }}>
                    Đang tải nhật ký hệ thống...
                  </td>
                </tr>
              ) : logs.length > 0 ? logs.map((row) => (
                <tr key={row.maNhatKy}>
                  <td><strong>{formatLogTime(row.thoiGian)}</strong></td>
                  <td>{row.maNguoiDung || row.hoTenNguoiDung || 'Hệ thống'}</td>
                  <td>{row.vaiTro || '-'}</td>
                  <td>{row.chucNang || '-'}</td>
                  <td>{row.hanhDong}</td>
                  <td>{formatLogObject(row)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '28px', color: 'var(--admin-subtle)' }}>
                    Chưa có nhật ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const { user, dangXuat } = useAuth() || {};
  const [activeTab, setActiveTab] = useState('overview');
  const activeMeta = adminTabMeta[activeTab] || adminTabMeta.overview;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeesView />;
      case 'property':
        return <PropertyView />;
      case 'services':
        return <ServicesView />;
      case 'settings':
        return <SettingsView />;
      case 'backup':
        return <BackupView />;
      case 'logs':
        return <LogsView />;
      case 'overview':
      default:
        return <OverviewView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <AdminBrand />
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {navItems.map((item) => (
            <button
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
            >
              <Icon name={item.icon} />
              <span>{adminTabMeta[item.id]?.label || item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-app">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">{activeMeta.eyebrow}</span>
            <h1>Chào {user?.hoTen?.split(' ').slice(-1)[0] || 'Admin'},</h1>
            <p>Quản trị dữ liệu lõi và cấu hình vận hành HomeStayDorm.</p>
          </div>

          <div className="admin-account">
            <span className="admin-avatar">{getUserInitials(user)}</span>
            <div>
              <strong>{user?.hoTen || 'Admin'}</strong>
              <small>@{user?.maNhanVien || user?.tenDangNhap || 'admin'}</small>
            </div>
            <button className="admin-icon-btn" type="button" aria-label="Đăng xuất" onClick={dangXuat}>
              <Icon name="logout" />
            </button>
          </div>
        </header>

        <main className="admin-main">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
