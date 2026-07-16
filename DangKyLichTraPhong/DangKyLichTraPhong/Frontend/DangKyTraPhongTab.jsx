import React, { useState, useCallback, useRef } from 'react';
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
  const day = String(d.getDate()).padStart(2, '0');
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${day}/${mon}/${yr}`;
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
  const debounceRef = useRef(null);

  // Load ban đầu
  React.useEffect(() => {
    handleSearch('');
  }, []);

  async function handleSearch(keyword) {
    setLoading(true);
    setError('');
    try {
      const { data } = await dangKyTraPhongApi.saleTimKhachHang(keyword ?? tuKhoa);
      setDs(data.danhSach || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Lỗi tra cứu, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const val = e.target.value;
    setTuKhoa(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 300);
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
        <div className="tp-search-row">
          <div className="tp-search-col" style={{ flex: 1 }}>
            <div className="tp-search-label">TÌM KIẾM</div>
            <div className="tp-search-wrap">
              <input
                id="tp-tim-khach-input"
                className="ktp-input tp-search-input-no-icon"
                type="text"
                placeholder="Tra cứu theo tên khách hàng, số điện thoại hoặc CCCD..."
                value={tuKhoa}
                spellCheck={false}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
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
                  <p className="tp-cc-cn"><Icon name="location_on" /> {item.tenChiNhanh}</p>
                  <p className="tp-cc-cn" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="meeting_room" style={{ fontSize: '14px' }} /> {item.tenPhong}
                  </p>
                  <div className="tp-cc-meta">
                    <span>{item.hinhThucThue}</span>
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
  const d = new Date();
  const todayISO = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const [ngay, setNgay]           = useState(todayISO);
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
        <h3>Xác nhận đăng ký</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* Card 1: Khách thuê */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
            <Icon name="person" /> Khách thuê
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Mã khách hàng:</span><span style={{ fontWeight: 500 }}>{khach.maKhachHang}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Họ tên:</span><span style={{ fontWeight: 500 }}>{khach.hoTen}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Số điện thoại:</span><span style={{ fontWeight: 500 }}>{khach.sdt || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>CCCD:</span><span style={{ fontWeight: 500 }}>{khach.cccd || '—'}</span></div>
          </div>
        </div>

        {/* Card 2: Hợp đồng / Đặt cọc */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
            <Icon name="description" /> {isHD ? 'Hợp đồng' : 'Phiếu đặt cọc'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Mã {isHD ? 'hợp đồng' : 'phiếu đặt cọc'}:</span><span style={{ fontWeight: 500 }}>{hopDong.maHopDong}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>{isHD ? 'Thời hạn' : 'Thời gian đặt cọc'}:</span><span style={{ fontWeight: 500 }}>{isHD ? (hopDong.ngayBatDau ? `${fmtDate(hopDong.ngayBatDau)} - ${fmtDate(hopDong.ngayKetThuc)}` : '—') : (hopDong.ngayDatCoc ? fmtDate(hopDong.ngayDatCoc) : '—')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Số tiền cọc:</span><span style={{ fontWeight: 500 }}>{hopDong.tienCoc != null ? fmtMoney(hopDong.tienCoc) : '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#6f797a' }}>Trạng thái {isHD ? 'hợp đồng' : 'phiếu đặt cọc'}:</span><span style={{ padding: '2px 8px', backgroundColor: hopDong.trangThai === 'Hiệu lực' ? '#e6f4ea' : '#f3f4f5', color: hopDong.trangThai === 'Hiệu lực' ? '#137333' : '#6f797a', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{hopDong.trangThai || '—'}</span></div>
          </div>
        </div>

        {/* Card 3: Phòng/Giường */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
            <Icon name="bed" /> Phòng/Giường
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Chi nhánh:</span><span style={{ fontWeight: 500 }}>{hopDong.tenChiNhanh?.replace('HomeDorm ', '') || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Phòng:</span><span style={{ fontWeight: 500 }}>{hopDong.tenPhong || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Giường:</span><span style={{ fontWeight: 500 }}>{hopDong.hinhThucThue === 'Ghép giường' ? hopDong.maGiuong || '—' : 'Tất cả'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Giá thuê:</span><span style={{ fontWeight: 500 }}>{hopDong.giaThu != null ? `${fmtMoney(hopDong.giaThu)}/tháng` : '—'}</span></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tp-date-form">
        <label htmlFor="tp-ngay-du-kien" className="tp-date-label">
          Ngày dự kiến trả phòng
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
        {/* <p className="tp-date-hint">
          <Icon name="info" /> Ngày đăng ký trả sẽ được hệ thống tự động ghi nhận là hôm nay ({todayISO}).
        </p> */}

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
function BuocThanhCong({ phieu, khach, hopDong, onDangKyMoi }) {
  const isHD = hopDong?.loai === 'HopDong';

  return (
    <div className="tp-step-card tp-success-card">
      <div className="tp-success-icon-wrap">
        <span className="tp-success-circle">
          <Icon name="check_circle" style={{ fontSize: 48 }} />
        </span>
      </div>
      <h3>Đăng ký lịch trả phòng thành công!</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', margin: '24px 0', textAlign: 'left' }}>
        {/* Card 1: Khách hàng */}
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
          <h4 style={{ color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0' }}>Thông tin khách hàng</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Mã khách hàng:</span><span style={{ fontWeight: 500 }}>{khach?.maKhachHang || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Họ tên:</span><span style={{ fontWeight: 500 }}>{khach?.hoTen || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Số điện thoại:</span><span style={{ fontWeight: 500 }}>{khach?.sdt || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>CCCD:</span><span style={{ fontWeight: 500 }}>{khach?.cccd || '—'}</span></div>
          </div>
        </div>

        {/* Card 2: Hồ sơ */}
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
          <h4 style={{ color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0' }}>Hồ sơ đăng ký</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Loại hồ sơ:</span><span style={{ fontWeight: 500 }}>{isHD ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Mã hồ sơ:</span><span style={{ fontWeight: 500 }}>{hopDong?.maHopDong || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Chi nhánh:</span><span style={{ fontWeight: 500 }}>{hopDong?.tenChiNhanh || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Phòng/giường:</span><span style={{ fontWeight: 500, textAlign: 'right' }}>{hopDong?.tenPhong || '—'} {hopDong?.hinhThucThue === 'Ghép giường' && hopDong?.maGiuong ? `- ${hopDong.maGiuong}` : ''}</span></div>
            {/* {isHD && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Hình thức thuê:</span><span style={{ fontWeight: 500 }}>{hopDong?.hinhThucThue || '—'}</span></div>} */}
          </div>
        </div>

        {/* Card 3: Phiếu trả phòng */}
        <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
          <h4 style={{ color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0' }}>Thông tin phiếu trả phòng</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Mã phiếu:</span><span style={{ fontWeight: 500 }}>{phieu?.maPhieuTra || '—'}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Ngày đăng ký:</span><span style={{ fontWeight: 500 }}>{fmtDate(phieu?.ngayDangKyTra)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Ngày dự kiến trả:</span><span style={{ fontWeight: 500 }}>{fmtDate(phieu?.ngayDuKienTra)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#6f797a' }}>Trạng thái:</span><span className="ktp-badge ktp-badge-warning" style={{ fontSize: '12px' }}>Chờ xử lý</span></div>
          </div>
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
        {buoc === 4 && <BuocThanhCong phieu={phieuMoi} khach={khach} hopDong={hopDong} onDangKyMoi={handleDangKyMoi} />}
      </div>
    </div>
  );
}
