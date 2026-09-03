import React, { useState, useCallback, useRef, useEffect } from 'react';
import { dangKyTraPhongApi } from './dangKyTraPhong.api.js';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import './dangKyTraPhongTab.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtMoney(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + ' đ';
}
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}
function getInitials(name) {
  if (!name) return 'KH';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Badge trạng thái ────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'Hiệu lực': { cls: 'dktp-badge-success', icon: 'check_circle' },
    'Hết hạn': { cls: 'dktp-badge-warning', icon: 'schedule' },
    'Chờ xử lý': { cls: 'dktp-badge-pending', icon: 'pending' },
    'Hủy': { cls: 'dktp-badge-danger', icon: 'cancel' },
    'Hoàn tất': { cls: 'dktp-badge-done', icon: 'task_alt' },
  };
  const { cls = 'dktp-badge-info', icon = 'info' } = map[status] || {};
  return (
    <span className={`dktp-badge ${cls}`}>
      <Icon name={icon} style={{ fontSize: 12 }} /> {status}
    </span>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────
function InfoRow({ label, value, children }) {
  return (
    <div className="dktp-info-row">
      <span className="dktp-info-label">{label}</span>
      <span className="dktp-info-value">{children ?? value ?? '—'}</span>
    </div>
  );
}

// ─── Modal: Đăng ký lịch trả phòng ──────────────────────────────────────────
function ModalDangKy({ khach, hoSo, onClose, onSuccess }) {
  const [ngay, setNgay] = useState(todayISO());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const today = todayISO();
  const isHD = hoSo?.loai === 'HopDong';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!ngay) {
      setError('Ngày dự kiến trả phòng không hợp lệ. Vui lòng chọn ngày từ ngày hiện tại trở đi.');
      return;
    }
    if (ngay < today) {
      setError('Ngày dự kiến trả phòng không hợp lệ. Vui lòng chọn ngày từ ngày hiện tại trở đi.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        maKhachHang: khach.maKhachHang,
        ngayDuKienTra: ngay,
        ...(isHD
          ? { maHopDong: hoSo.maHopDong }
          : { maPhieuDatCoc: hoSo.maPhieuDatCoc })
      };
      const { data } = await dangKyTraPhongApi.saleDangKyLichTraPhong(payload);
      onSuccess(data.phieu);
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dktp-modal-overlay" onClick={onClose}>
      <div className="dktp-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="dktp-modal-header">
          <div className="dktp-modal-title-row">
            <span className="dktp-modal-icon-wrap">
              <Icon name="event_available" />
            </span>
            <h2 className="dktp-modal-title">Đăng ký lịch trả phòng</h2>
          </div>
          <button id="dktp-btn-close-modal" className="dktp-close-btn" onClick={onClose} disabled={submitting}>
            <Icon name="close" />
          </button>
        </div>

        <div className="dktp-modal-body">
          {/* Thông tin khách hàng */}
          <div className="dktp-section-label">
            <Icon name="person" /> Khách hàng
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <InfoRow label="Họ tên" value={khach.hoTen} />
            <InfoRow label="SĐT" value={khach.sdt || '—'} />
          </div>

          <div className="dktp-divider" />

          {/* Thông tin hồ sơ */}
          <div className="dktp-section-label">
            <Icon name="description" /> {isHD ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <InfoRow label={isHD ? 'Mã hợp đồng' : 'Mã phiếu đặt cọc'} value={hoSo.maHoSo} />
            <InfoRow label="Trạng thái">
              <StatusBadge status={hoSo.trangThaiHoSo} />
            </InfoRow>
            {isHD ? (
              <>
                <InfoRow label="Ngày bắt đầu" value={fmtDate(hoSo.ngayBatDau)} />
                <InfoRow label="Ngày kết thúc" value={fmtDate(hoSo.ngayKetThuc)} />
                <InfoRow label="Giá thuê" value={fmtMoney(hoSo.giaThu)} />
                <InfoRow label="Tiền cọc" value={fmtMoney(hoSo.tienCoc)} />
              </>
            ) : (
              <>
                <InfoRow label="Ngày đặt cọc" value={fmtDate(hoSo.ngayDatCoc)} />
                <InfoRow label="Tiền cọc" value={fmtMoney(hoSo.tienCoc)} />
              </>
            )}
          </div>

          <div className="dktp-divider" />

          {/* Thông tin phòng/giường */}
          <div className="dktp-section-label">
            <Icon name="bed" /> Phòng / Giường
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <InfoRow label="Phòng/Giường" value={hoSo.hinhThucThue === 'Ghép giường' && hoSo.maGiuong ? `${hoSo.tenPhong} - ${hoSo.maGiuong}` : hoSo.tenPhong} />
            <InfoRow label="Hình thức" value={hoSo.hinhThucThue} />
          </div>

          <div className="dktp-divider" />

          {/* Ngày dự kiến trả */}
          <form id="dktp-form-dang-ky" onSubmit={handleSubmit} noValidate>
            <div className="dktp-section-label">
              <Icon name="calendar_today" /> Ngày dự kiến trả phòng
            </div>
            <div className="dktp-date-row">
              <input
                id="dktp-input-ngay-du-kien"
                type="date"
                className="dktp-date-input"
                value={ngay}
                min={today}
                onChange={e => { setNgay(e.target.value); setError(''); }}
              />
            </div>
            {error && (
              <p className="dktp-error-msg">
                <Icon name="error_outline" /> {error}
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="dktp-modal-footer">
          <button
            id="dktp-btn-huy-dang-ky"
            type="button"
            className="dktp-btn-outline"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            id="dktp-btn-xac-nhan-dang-ky"
            type="submit"
            form="dktp-form-dang-ky"
            className="dktp-btn-primary"
            disabled={submitting}
          >
            {submitting
              ? <><span className="dktp-spinner" /> Đang xử lý…</>
              : <><Icon name="check_circle" /> Đăng ký</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Xem phiếu trả phòng (chỉ đọc) ───────────────────────────────────
function ModalXemPhieu({ khach, hoSo, onClose }) {
  const isHD = hoSo?.loai === 'HopDong';
  return (
    <div className="dktp-modal-overlay" onClick={onClose}>
      <div className="dktp-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="dktp-modal-header dktp-modal-header-view">
          <div className="dktp-modal-title-row">
            <span className="dktp-modal-icon-wrap dktp-icon-view">
              <Icon name="receipt_long" />
            </span>
            <h2 className="dktp-modal-title">Xem phiếu trả phòng</h2>
          </div>
          <button id="dktp-btn-close-xem-phieu" className="dktp-close-btn" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="dktp-modal-body">
          {/* Thông tin khách hàng */}
          <div className="dktp-section-label">
            <Icon name="person" /> Khách hàng
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <InfoRow label="Họ tên" value={khach.hoTen} />
            <InfoRow label="SĐT" value={khach.sdt || '—'} />
          </div>

          <div className="dktp-divider" />

          {/* Thông tin hồ sơ */}
          <div className="dktp-section-label">
            <Icon name="description" /> {isHD ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <InfoRow label={isHD ? 'Mã hợp đồng' : 'Mã phiếu đặt cọc'} value={hoSo.maHoSo} />
            <InfoRow label="Trạng thái">
              <StatusBadge status={hoSo.trangThaiHoSo} />
            </InfoRow>
            {isHD ? (
              <>
                <InfoRow label="Ngày bắt đầu" value={fmtDate(hoSo.ngayBatDau)} />
                <InfoRow label="Ngày kết thúc" value={fmtDate(hoSo.ngayKetThuc)} />
                <InfoRow label="Giá thuê" value={fmtMoney(hoSo.giaThu)} />
                <InfoRow label="Tiền cọc" value={fmtMoney(hoSo.tienCoc)} />
              </>
            ) : (
              <>
                <InfoRow label="Ngày đặt cọc" value={fmtDate(hoSo.ngayDatCoc)} />
                <InfoRow label="Tiền cọc" value={fmtMoney(hoSo.tienCoc)} />
              </>
            )}
          </div>

          <div className="dktp-divider" />

          {/* Thông tin phòng/giường */}
          <div className="dktp-section-label">
            <Icon name="bed" /> Phòng / Giường
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <InfoRow label="Phòng/Giường" value={hoSo.hinhThucThue === 'Ghép giường' && hoSo.maGiuong ? `${hoSo.tenPhong} - ${hoSo.maGiuong}` : hoSo.tenPhong} />
            <InfoRow label="Hình thức" value={hoSo.hinhThucThue} />
          </div>

          <div className="dktp-divider" />

          {/* Ngày dự kiến trả */}
          <div className="dktp-section-label">
            <Icon name="home" /> Ngày dự kiến trả phòng
          </div>
          <div className="dktp-info-grid dktp-info-grid-2">
            <div className="dktp-info-row">
              <span className="dktp-info-label">Ngày dự kiến trả</span>
              <span className="dktp-info-value" style={{ fontSize: '15px' }}>{fmtDate(hoSo.ngayDuKienTra)}</span>
            </div>
            <div className="dktp-info-row">
              <span className="dktp-info-label">Trạng thái phiếu</span>
              <div>
                <StatusBadge status={hoSo.trangThaiPhieu} />
              </div>
            </div>
          </div>
        </div>

        <div className="dktp-modal-footer">
          <button
            id="dktp-btn-dong-xem-phieu"
            type="button"
            className="dktp-btn-primary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast thông báo ─────────────────────────────────────────────────────────
function Toast({ message, show }) {
  return (
    <div className={`dktp-toast ${show ? 'dktp-toast-show' : ''}`}>
      <Icon name="check_circle" style={{ fontSize: 18 }} />
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DangKyTraPhongTab() {
  const [tuKhoa, setTuKhoa] = useState('');
  const [danhSach, setDanhSach] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locDaTiepNhan, setLocDaTiepNhan] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState(null); // null | 'dangky' | 'xemphieu'
  const [selectedKhach, setSelectedKhach] = useState(null);
  const [selectedHoSo, setSelectedHoSo] = useState(null);
  const [loadingHoSo, setLoadingHoSo] = useState(false);
  const [hoSoError, setHoSoError] = useState('');

  // Toast
  const [toast, setToast] = useState({ show: false, msg: '' });
  const debounceRef = useRef(null);

  // ── Tải danh sách khách hàng ────────────────────────────────────────────
  const fetchDanhSach = useCallback(async (keyword) => {
    setLoading(true);
    setSearchError('');
    try {
      const { data } = await dangKyTraPhongApi.saleTimKhachHang(keyword ?? tuKhoa);
      setDanhSach(data.danhSach || []);
    } catch (err) {
      setSearchError(err?.response?.data?.message || 'Lỗi tra cứu, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [tuKhoa]);

  useEffect(() => { fetchDanhSach(''); }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setTuKhoa(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchDanhSach(val), 300);
  }

  // ── Nhấn nút "Chọn" – mở modal đăng ký ────────────────────────────────
  async function handleChon(kh) {
    setSelectedKhach(kh);
    setSelectedHoSo(null);
    setHoSoError('');
    setLoadingHoSo(true);
    setModalMode('dangky');
    try {
      const { data } = await dangKyTraPhongApi.saleLayHoSoHienHanh(kh.maKhachHang);
      if (!data.hoSo) {
        setHoSoError('Khách hàng không có hợp đồng thuê hoặc phiếu đặt cọc hợp lệ tại chi nhánh này.');
      } else {
        setSelectedHoSo(data.hoSo);
      }
    } catch (err) {
      setHoSoError(err?.response?.data?.message || 'Không tìm thấy hồ sơ lưu trú hợp lệ.');
    } finally {
      setLoadingHoSo(false);
    }
  }

  // ── Nhấn nút "Xem phiếu" – mở modal chỉ đọc ──────────────────────────
  async function handleXemPhieu(kh) {
    setSelectedKhach(kh);
    setSelectedHoSo(null);
    setHoSoError('');
    setLoadingHoSo(true);
    setModalMode('xemphieu');
    try {
      const { data } = await dangKyTraPhongApi.saleLayHoSoHienHanh(kh.maKhachHang);
      setSelectedHoSo(data.hoSo);
    } catch (err) {
      setHoSoError(err?.response?.data?.message || 'Không tải được thông tin phiếu trả phòng.');
    } finally {
      setLoadingHoSo(false);
    }
  }

  // ── Đóng modal ──────────────────────────────────────────────────────────
  function handleCloseModal() {
    setModalMode(null);
    setSelectedKhach(null);
    setSelectedHoSo(null);
    setHoSoError('');
  }

  // ── Đăng ký thành công ──────────────────────────────────────────────────
  function handleSuccess() {
    handleCloseModal();
    // Toast thông báo
    setToast({ show: true, msg: 'Đăng ký lịch trả phòng thành công.' });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    // Làm mới danh sách
    fetchDanhSach(tuKhoa);
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  const displayList = locDaTiepNhan ? danhSach.filter(kh => kh.coPhieuTraHienHanh) : danhSach;

  return (
    <div className="dktp-root">
      {/* Header */}
      <div className="dktp-page-header">
        <div>
          <h2 className="dktp-page-title">Đăng ký lịch trả phòng</h2>
          <p className="dktp-page-subtitle">Tra cứu khách hàng và đăng ký ngày dự kiến trả phòng</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="dktp-search-card">
        <div className="dktp-search-label">TÌM KIẾM KHÁCH HÀNG</div>
        <div className="dktp-search-row">
          <div className="dktp-search-input-wrap">
            <Icon name="search" className="dktp-search-icon" />
            <input
              id="dktp-input-tim-khach"
              type="text"
              className="dktp-search-input"
              placeholder="Tên khách hàng, số điện thoại hoặc CCCD..."
              value={tuKhoa}
              onChange={handleInputChange}
              spellCheck={false}
            />
          </div>
        </div>
        <div className="dktp-filter-row" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="dktp-cb-da-tiep-nhan"
            checked={locDaTiepNhan}
            onChange={(e) => setLocDaTiepNhan(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1a6e60' }}
          />
          <label htmlFor="dktp-cb-da-tiep-nhan" style={{ fontSize: 13, color: '#3f494a', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}>
            Chỉ hiện khách hàng đã tiếp nhận đăng ký trả phòng
          </label>
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <div className="dktp-table-card">
        {loading && (
          <div className="dktp-loading-row">
            <span className="dktp-spinner-dark" />
            <span>Đang tải...</span>
          </div>
        )}
        {searchError && !loading && (
          <div className="dktp-error-row">
            <Icon name="error_outline" /> {searchError}
          </div>
        )}
        {!loading && !searchError && displayList.length === 0 && (
          <div className="dktp-empty-row">
            <Icon name="person_search" style={{ fontSize: 40, color: '#ccc' }} />
            <p>Không tìm thấy khách hàng phù hợp.</p>
          </div>
        )}
        {!loading && displayList.length > 0 && (
          <>
            <table className="dktp-table">
              <thead>
                <tr>
                  <th>KHÁCH HÀNG</th>
                  <th>GIỚI TÍNH</th>
                  <th>NGÀY SINH</th>
                  <th>SỐ ĐIỆN THOẠI</th>
                  <th>CCCD</th>
                  <th className="dktp-th-center">THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(kh => (
                  <tr key={kh.maKhachHang}>
                    <td>
                      <div className="dktp-kh-name">{kh.hoTen}</div>
                    </td>
                    <td>{kh.gioiTinh || '—'}</td>
                    <td>{fmtDate(kh.ngaySinh)}</td>
                    <td>{kh.sdt || '—'}</td>
                    <td>{kh.cccd || '—'}</td>
                    <td className="dktp-td-center">
                      {kh.coPhieuTraHienHanh ? (
                        <button
                          id={`dktp-btn-xem-phieu-${kh.maKhachHang}`}
                          className="dktp-btn-view"
                          onClick={() => handleXemPhieu(kh)}
                          title="Xem phiếu trả phòng đang xử lý"
                        >
                          <Icon name="receipt_long" /> Xem phiếu
                        </button>
                      ) : (
                        <button
                          id={`dktp-btn-chon-${kh.maKhachHang}`}
                          className="dktp-btn-select"
                          onClick={() => handleChon(kh)}
                        >
                          Chọn
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="dktp-table-footer">
              Hiển thị {displayList.length} kết quả
            </div>
          </>
        )}
      </div>

      {/* Modal đăng ký */}
      {modalMode === 'dangky' && selectedKhach && (
        loadingHoSo ? (
          <div className="dktp-modal-overlay">
            <div className="dktp-modal dktp-modal-loading">
              <span className="dktp-spinner-dark" style={{ width: 28, height: 28 }} />
              <p>Đang tải hồ sơ lưu trú...</p>
            </div>
          </div>
        ) : hoSoError ? (
          <div className="dktp-modal-overlay" onClick={handleCloseModal}>
            <div className="dktp-modal dktp-modal-error-state" onClick={e => e.stopPropagation()}>
              <div className="dktp-modal-header">
                <div className="dktp-modal-title-row">
                  <span className="dktp-modal-icon-wrap dktp-icon-warn">
                    <Icon name="warning" />
                  </span>
                  <h2 className="dktp-modal-title">Không thể đăng ký</h2>
                </div>
                <button className="dktp-close-btn" onClick={handleCloseModal}>
                  <Icon name="close" />
                </button>
              </div>
              <div className="dktp-modal-body">
                <div className="dktp-no-hoso-msg">
                  <Icon name="info" style={{ fontSize: 32, color: '#e65100' }} />
                  <p>{hoSoError}</p>
                </div>
              </div>
              <div className="dktp-modal-footer">
                <button className="dktp-btn-primary" onClick={handleCloseModal}>
                  <Icon name="close" /> Đóng
                </button>
              </div>
            </div>
          </div>
        ) : selectedHoSo ? (
          <ModalDangKy
            khach={selectedKhach}
            hoSo={selectedHoSo}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
          />
        ) : null
      )}

      {/* Modal xem phiếu (chỉ đọc) */}
      {modalMode === 'xemphieu' && selectedKhach && (
        loadingHoSo ? (
          <div className="dktp-modal-overlay">
            <div className="dktp-modal dktp-modal-loading">
              <span className="dktp-spinner-dark" style={{ width: 28, height: 28 }} />
              <p>Đang tải thông tin phiếu...</p>
            </div>
          </div>
        ) : selectedHoSo ? (
          <ModalXemPhieu
            khach={selectedKhach}
            hoSo={selectedHoSo}
            onClose={handleCloseModal}
          />
        ) : null
      )}

      {/* Toast */}
      <Toast message={toast.msg} show={toast.show} />
    </div>
  );
}
