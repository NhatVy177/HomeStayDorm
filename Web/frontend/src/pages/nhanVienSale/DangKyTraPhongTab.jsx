import React, { useState, useCallback } from 'react';
import { dangKyTraPhongApi } from './dangKyTraPhong.api.js';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import './dangKyTraPhongTab.css';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtMoney(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + ' ₫';
}
function fmtDate(s) {
  if (!s) return '—';
  return String(s).slice(0, 10);
}
function badgeClass(ts) {
  if (!ts) return 'ktp-badge';
  if (ts.includes('Chờ xử lý'))  return 'ktp-badge ktp-badge-warning';
  if (ts.includes('Hoàn tất'))   return 'ktp-badge ktp-badge-success';
  if (ts.includes('Hủy'))        return 'ktp-badge ktp-badge-danger';
  return 'ktp-badge ktp-badge-info';
}

// ─── Bước 1: Tìm khách hàng ─────────────────────────────────────────────────
function BuocTimKhach({ onChon }) {
  const [tuKhoa, setTuKhoa]   = useState('');
  const [ds, setDs]           = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Load ban đầu (danh sách rỗng)
  React.useEffect(() => {
    handleSearch('');
  }, []);

  async function handleSearch(keyword = tuKhoa) {
    setLoading(true);
    setError('');
    try {
      const { data } = await dangKyTraPhongApi.saleTimKhachHang(keyword);
      setDs(data.danhSach || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Lỗi tra cứu, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name) {
    if (!name) return 'KH';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="tp-step-card tp-card-transparent">
      <div className="tp-step-header tp-header-margin">
        <span className="tp-step-num">1</span>
        <h3>Tra cứu khách hàng</h3>
      </div>

      <div className="tp-search-container">
        <form 
          className="tp-search-row" 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        >
          <div className="tp-search-col">
            <div className="tp-search-label">TÌM KIẾM</div>
            <div className="tp-search-wrap">
              <input
                id="tp-tim-khach-input"
                className="ktp-input tp-search-input-no-icon"
                type="text"
                placeholder="Tra cứu theo tên, số điện thoại hoặc CCCD..."
                value={tuKhoa}
                onChange={e => setTuKhoa(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="tp-btn-search">
            Tìm kiếm
          </button>
        </form>
      </div>

      {loading && <div className="tp-loading"><span className="tp-spinner" /> Đang tải...</div>}
      {error && !loading && <p className="tp-error"><Icon name="error_outline" /> {error}</p>}

      {!loading && ds.length === 0 && !error && (
        <p className="tp-empty-msg">Không tìm thấy khách hàng phù hợp.</p>
      )}

      {!loading && ds.length > 0 && (
        <div className="tp-table-container">
          <table className="tp-custom-table">
            <thead>
              <tr>
                <th>MÃ KHÁCH HÀNG</th>
                <th>TÊN KHÁCH HÀNG</th>
                <th>GIỚI TÍNH</th>
                <th>NGÀY SINH</th>
                <th>SỐ ĐIỆN THOẠI</th>
                <th>CCCD</th>
                <th className="text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {ds.map(kh => (
                <tr key={kh.maKhachHang}>
                  <td>
                    <div className="tp-kh-val">{kh.maKhachHang}</div>
                  </td>
                  <td>
                    <div className="tp-kh-val">{kh.hoTen}</div>
                  </td>
                  <td>
                    <div className="tp-kh-val">{kh.gioiTinh || '—'}</div>
                  </td>
                  <td>
                    <div className="tp-kh-val">{fmtDate(kh.ngaySinh) || '—'}</div>
                  </td>
                  <td>
                    <div className="tp-kh-val">{kh.sdt || '—'}</div>
                  </td>
                  <td>
                    <div className="tp-kh-val">{kh.cccd || '—'}</div>
                  </td>
                  <td className="text-center">
                    <button
                      id={`tp-btn-chon-khach-${kh.maKhachHang}`}
                      className="tp-btn-chon"
                      onClick={() => onChon(kh)}
                    >
                      Chọn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tp-table-footer">
            Hiển thị {ds.length} kết quả
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bước 2: Chọn HĐ / Phiếu cọc ───────────────────────────────────────────
function BuocChonHopDong({ khach, onChon, onQuayLai }) {
  const [ds, setDs]           = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await dangKyTraPhongApi.saleDanhSachHopDong(khach.maKhachHang);
      setDs(data.danhSach || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Lỗi tải dữ liệu.');
    } finally { setLoading(false); }
  }, [khach.maKhachHang]);

  React.useEffect(() => { load(); }, [load]);

  function handleChon(item) {
    if (item.dangCoYeuCau) return;
    setSelected(item.maHopDong === selected?.maHopDong ? null : item);
  }

  return (
    <div className="tp-step-card">
      <div className="tp-step-header">
        <span className="tp-step-num">2</span>
        <h3>Chọn hồ sơ</h3>
      </div>

      {/* Thông tin khách đã chọn */}
      <div className="tp-khach-info">
        <Icon name="person" style={{ color: '#2f6765' }} />
        <div>
          <strong>{khach.hoTen}</strong>
          <span> · {khach.sdt || khach.cccd || khach.maKhachHang}</span>
        </div>
        <button className="tp-change-link" onClick={onQuayLai}>
          <Icon name="edit" /> Đổi khách
        </button>
      </div>

      {loading && <div className="tp-loading"><span className="tp-spinner" /> Đang tải...</div>}
      {error   && <p className="tp-error"><Icon name="error_outline" /> {error}</p>}

      {!loading && ds.length === 0 && !error && (
        <p className="tp-empty-msg">
          Khách hàng này không có hợp đồng thuê hoặc phiếu đặt cọc hợp lệ.
        </p>
      )}

      {!loading && ds.length > 0 && (
        <>
          <div className="tp-contract-grid">
            {ds.map(item => {
              const isHD  = item.loai === 'HopDong';
              const isSel = selected?.maHopDong === item.maHopDong;
              return (
                <button
                  key={item.maHopDong}
                  id={`tp-card-${item.maHopDong}`}
                  type="button"
                  className={`tp-contract-card${isSel ? ' selected' : ''}${item.dangCoYeuCau ? ' disabled' : ''}`}
                  onClick={() => handleChon(item)}
                  disabled={item.dangCoYeuCau}
                  title={item.dangCoYeuCau ? 'Đang có yêu cầu trả phòng chờ xử lý' : ''}
                >
                  {isSel && (
                    <span className="tp-check-icon">
                      <Icon name="check_circle" />
                    </span>
                  )}
                  <div className="tp-cc-row">
                    <span className={`tp-loai-badge ${isHD ? 'hd' : 'dc'}`}>
                      {isHD ? 'Hợp đồng' : 'Đặt cọc'}
                    </span>
                    <span className="tp-cc-ma">{item.maHopDong}</span>
                  </div>
                  <p className="tp-cc-phong">{item.tenPhong}</p>
                  <p className="tp-cc-cn"><Icon name="location_on" /> {item.tenChiNhanh}</p>
                  <div className="tp-cc-meta">
                    <span>{item.hinhThucThue}</span>
                    <span style={{ fontWeight: 600, color: '#2f6765' }}>{fmtMoney(item.giaThu)}/th</span>
                  </div>
                  {item.dangCoYeuCau && (
                    <div className="tp-cc-warn">
                      <Icon name="warning" /> Đang có yêu cầu xử lý
                    </div>
                  )}
                  {!item.dangCoYeuCau && item.ngayBatDau && (
                    <div className="tp-cc-date">
                      <Icon name="date_range" /> {fmtDate(item.ngayBatDau)} → {fmtDate(item.ngayKetThuc)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="tp-step-actions">
            <button className="ktp-btn-action" onClick={onQuayLai}>
              <Icon name="arrow_back" /> Quay lại
            </button>
            <button
              id="tp-btn-tiep-theo"
              className="tp-btn-action-fill"
              disabled={!selected}
              onClick={() => onChon(selected)}
            >
              Tiếp theo <Icon name="arrow_forward" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Bước 3: Nhập ngày và xác nhận ─────────────────────────────────────────
function BuocXacNhan({ khach, hopDong, onSuccess, onQuayLai }) {
  const todayISO = new Date().toISOString().split('T')[0];
  const [ngay, setNgay]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const isHD = hopDong.loai === 'HopDong';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!ngay) { setError('Vui lòng nhập ngày dự kiến trả phòng.'); return; }
    if (ngay < todayISO) { setError('Ngày dự kiến trả phòng không hợp lệ (phải từ hôm nay trở đi).'); return; }

    setSubmitting(true);
    try {
      const payload = {
        maKhachHang:    khach.maKhachHang,
        ngayDuKienTra:  ngay,
        ...(isHD
          ? { maHopDong:     hopDong.maHopDong }
          : { maPhieuDatCoc: hopDong.maHopDong })
      };
      const { data } = await dangKyTraPhongApi.saleDangKyLichTraPhong(payload);
      onSuccess(data.phieu);
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="tp-step-card">
      <div className="tp-step-header">
        <span className="tp-step-num">3</span>
        <h3>Nhập ngày & xác nhận đăng ký</h3>
      </div>

      {/* Summary */}
      <div className="tp-confirm-summary">
        <div className="tp-cs-row">
          <span>Mã khách hàng</span>
          <strong>{khach.maKhachHang}</strong>
        </div>
        <div className="tp-cs-row">
          <span>Tên khách hàng</span>
          <strong>{khach.hoTen}</strong>
        </div>
        <div className="tp-cs-row">
          <span>Hồ sơ</span>
          <strong>{isHD ? 'Hợp đồng' : 'Phiếu đặt cọc'} ({hopDong.maHopDong})</strong>
        </div>
        <div className="tp-cs-row">
          <span>Chi nhánh</span>
          <strong>{hopDong.tenChiNhanh}</strong>
        </div>
        <div className="tp-cs-row">
          <span>Phòng</span>
          <strong>{hopDong.tenPhong}</strong>
        </div>
        {hopDong.hinhThucThue === 'Ghép giường' && (
          <div className="tp-cs-row">
            <span>Giường</span>
            <strong>{hopDong.maGiuong || '—'}</strong>
          </div>
        )}
        <div className="tp-cs-row">
          <span>Hình thức thuê</span>
          <strong>{hopDong.hinhThucThue}</strong>
        </div>
        {hopDong.giaThu != null && (
          <div className="tp-cs-row">
            <span>Giá thuê</span>
            <strong style={{ color: '#2f6765' }}>{fmtMoney(hopDong.giaThu)}/tháng</strong>
          </div>
        )}
        {hopDong.tienCoc != null && (
          <div className="tp-cs-row">
            <span>Số tiền cọc</span>
            <strong style={{ color: '#2f6765' }}>{fmtMoney(hopDong.tienCoc)}</strong>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="tp-date-form">
        <label htmlFor="tp-ngay-du-kien" className="tp-date-label">
          Ngày dự kiến trả phòng <span style={{ color: '#b3261e' }}>*</span>
        </label>
        <div className="tp-date-input-wrap">
          <Icon name="calendar_today" className="tp-cal-icon" />
          <input
            id="tp-ngay-du-kien"
            type="date"
            className="ktp-input tp-date-input"
            value={ngay}
            min={todayISO}
            onChange={e => { setNgay(e.target.value); setError(''); }}
          />
        </div>
        <p className="tp-date-hint">
          <Icon name="info" /> Ngày đăng ký trả sẽ được hệ thống tự động ghi nhận là hôm nay ({todayISO}).
        </p>

        {error && <p className="tp-error"><Icon name="error_outline" /> {error}</p>}

        <div className="tp-step-actions">
          <button type="button" className="ktp-btn-action" onClick={onQuayLai} disabled={submitting}>
            <Icon name="arrow_back" /> Quay lại
          </button>
          <button id="tp-btn-xac-nhan-dang-ky" type="submit" className="tp-btn-action-fill" disabled={submitting}>
            {submitting ? <><span className="tp-spinner" /> Đang xử lý…</> : <><Icon name="check_circle" /> Xác nhận đăng ký</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Bước 4: Thành công ─────────────────────────────────────────────────────
function BuocThanhCong({ phieu, onDangKyMoi }) {
  return (
    <div className="tp-step-card tp-success-card">
      <div className="tp-success-icon-wrap">
        <span className="tp-success-circle">
          <Icon name="check_circle" style={{ fontSize: 48 }} />
        </span>
      </div>
      <h3>Đăng ký lịch trả phòng thành công!</h3>
      <p>Phiếu trả phòng đã được tạo với trạng thái <strong>Chờ xử lý</strong>.</p>

      <div className="tp-confirm-summary" style={{ maxWidth: 420, margin: '16px auto' }}>
        <div className="tp-cs-row">
          <span>Mã phiếu</span>
          <strong style={{ color: '#2f6765', fontSize: 15 }}>{phieu?.maPhieuTra || '—'}</strong>
        </div>
        <div className="tp-cs-row">
          <span>Ngày đăng ký</span>
          <strong>{fmtDate(phieu?.ngayDangKyTra)}</strong>
        </div>
        <div className="tp-cs-row">
          <span>Ngày dự kiến trả</span>
          <strong>{fmtDate(phieu?.ngayDuKienTra)}</strong>
        </div>
        <div className="tp-cs-row">
          <span>Trạng thái</span>
          <span className="ktp-badge ktp-badge-warning">Chờ xử lý</span>
        </div>
      </div>

      <button id="tp-btn-dang-ky-moi" className="tp-btn-action-fill" onClick={onDangKyMoi}>
        <Icon name="add_circle" /> Đăng ký lịch trả phòng mới
      </button>
    </div>
  );
}


// ─── Main Component ──────────────────────────────────────────────────────────
export default function DangKyTraPhongTab() {
  // Wizard state
  const [buoc, setBuoc]       = useState(1);
  const [khach, setKhach]     = useState(null);
  const [hopDong, setHopDong] = useState(null);
  const [phieuMoi, setPhieuMoi] = useState(null);

  function handleChonKhach(kh) { setKhach(kh); setBuoc(2); }
  function handleChonHD(hd)    { setHopDong(hd); setBuoc(3); }
  function handleSuccess(p)    { setPhieuMoi(p); setBuoc(4); }
  function handleDangKyMoi()   { setBuoc(1); setKhach(null); setHopDong(null); setPhieuMoi(null); }
  function handleQuayLaiB1()   { setBuoc(1); setKhach(null); setHopDong(null); }
  function handleQuayLaiB2()   { setBuoc(2); setHopDong(null); }

  return (
    <div className="ktp-container tp-tab-root">
      <div className="tp-wizard">
        {/* Progress bar */}
        <div className="tp-progress-bar">
          {['Tra cứu khách', 'Chọn hồ sơ', 'Xác nhận', 'Hoàn tất'].map((label, i) => (
            <div key={i} className={`tp-prog-step${buoc > i + 1 ? ' done' : ''}${buoc === i + 1 ? ' active' : ''}`}>
              <span className="tp-prog-dot">
                {buoc > i + 1 ? <Icon name="check" style={{ fontSize: 14 }} /> : i + 1}
              </span>
              <span className="tp-prog-label">{label}</span>
              {i < 3 && <span className="tp-prog-line" />}
            </div>
          ))}
        </div>

        {buoc === 1 && <BuocTimKhach onChon={handleChonKhach} />}
        {buoc === 2 && <BuocChonHopDong khach={khach} onChon={handleChonHD} onQuayLai={handleQuayLaiB1} />}
        {buoc === 3 && <BuocXacNhan khach={khach} hopDong={hopDong} onSuccess={handleSuccess} onQuayLai={handleQuayLaiB2} />}
        {buoc === 4 && <BuocThanhCong phieu={phieuMoi} onDangKyMoi={handleDangKyMoi} />}
      </div>
    </div>
  );
}
