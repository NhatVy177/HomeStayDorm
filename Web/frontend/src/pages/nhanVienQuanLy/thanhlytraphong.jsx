import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { thanhLyTraPhongApi } from './thanhlytraphong.api.js';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import '../nhanVienSale/dangKyTraPhongTab.css';

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function fmtMoney(value) {
  const n = Number(value || 0);
  return `${Number.isFinite(n) ? n.toLocaleString('vi-VN') : '0'}đ`;
}

function InfoRow({ label, children }) {
  const displayLabel = /[:：]$/.test(label) ? label : `${label}:`;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '5px 0', fontSize: 14 }}>
      <span style={{ color: '#6f797a' }}>{displayLabel}</span>
      <span style={{ fontWeight: 700, color: '#191c1d', textAlign: 'right' }}>{children || '—'}</span>
    </div>
  );
}

function StatusBadge({ children, tone = 'info' }) {
  const styles = {
    info: { bg: '#e8f4fd', color: '#0d6efd', border: '#b8dcf8' },
    warn: { bg: '#fff3cd', color: '#856404', border: '#ffeeba' },
    success: { bg: '#e6f4ea', color: '#137333', border: '#c3e6cb' },
    neutral: { bg: '#f1f3f4', color: '#5f6368', border: '#e1e3e4' },
  };
  const s = styles[tone] || styles.info;
  return <span style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{children || '—'}</span>;
}

function getDoiSoatResult(chiTiet) {
  const soTienHoan = Number(chiTiet?.soTienHoanThucTe || 0);
  const soTienThuThem = Number(chiTiet?.soTienKhachPhaiTT || 0);

  if (soTienHoan > 0) {
    return {
      label: 'Số tiền được hoàn',
      value: fmtMoney(soTienHoan),
      color: '#137333',
    };
  }

  if (soTienThuThem > 0) {
    return {
      label: 'Số tiền thu thêm',
      value: fmtMoney(soTienThuThem),
      color: '#ba1a1a',
    };
  }

  return {
    label: 'Kết quả',
    value: 'Không phát sinh',
    color: '#3f494a',
  };
}

export default function ThanhLyTraPhong() {
  const [dsThanhLy, setDsThanhLy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toast, setToast] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredData = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return dsThanhLy.filter(p => {
      const matchSearch = !q ||
        p.hoTenKhach?.toLowerCase().includes(q) ||
        p.sdtKhach?.toLowerCase().includes(q) ||
        p.maDoiSoat?.toLowerCase().includes(q) ||
        p.maPhieuTra?.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterStatus === 'PENDING') return p.trangThai === 'Chờ ký biên bản';
      if (filterStatus === 'SIGNED') return p.trangThai !== 'Chờ ký biên bản';
      return true;
    });
  }, [dsThanhLy, searchQuery, filterStatus]);

  const countAll = dsThanhLy.length;
  const countPending = dsThanhLy.filter(p => p.trangThai === 'Chờ ký biên bản').length;
  const countSigned = dsThanhLy.filter(p => p.trangThai !== 'Chờ ký biên bản').length;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await thanhLyTraPhongApi.getDanhSachThanhLy();
      setDsThanhLy(res.data.danhSach || []);
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi tải danh sách thanh lý');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDanhSach();
  }, [loadDanhSach]);



  const openModal = async (row) => {
    setSelectedPhieu(row);
    setModalOpen(true);
    setLoadingDetail(true);
    setIsSubmitted(false);

    try {
      const res = await thanhLyTraPhongApi.getChiTietThanhLy(row.maPhieuTra);
      setChiTiet(res.data.chiTiet);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu');
      setModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const submitXacNhan = async () => {
    if (submitting || !selectedPhieu?.maPhieuTra) return;
    setSubmitting(true);
    try {
      const res = await thanhLyTraPhongApi.xacNhanThanhLy({
        maPhieuTra: selectedPhieu.maPhieuTra
      });
      setSuccessMessage(res.data?.message || 'Thanh lý trả phòng thành công.');
      await loadDanhSach();
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setToast(err.response?.data?.message || 'Lỗi khi thanh lý trả phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="tp-search-container">
        <div className="tp-search-row">
          <div className="tp-search-col" style={{ flex: 1 }}>
            <div className="tp-search-label">TÌM KIẾM</div>
            <div className="tp-search-wrap">
              <Icon name="search" className="tp-search-icon" />
              <input
                className="ktp-input tp-search-input"
                type="text"
                placeholder="Tra cứu theo tên khách hàng, mã phiếu trả phòng"
                value={searchQuery}
                spellCheck={false}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="tp-list-panel">
        <div className="tp-list-head">
          <div>
            <h3>Danh sách phiếu trả phòng chờ ký biên bản</h3>
          </div>
        </div>

        <div className="tp-list-status-row">
          <StatusFilterTabs
            className="tp-search-status-tabs"
            items={[
              { key: 'ALL', label: 'Tất cả', count: countAll },
              { key: 'PENDING', label: 'Chờ ký biên bản', count: countPending },
              { key: 'SIGNED', label: 'Đã ký biên bản', count: countSigned },
            ]}
            activeKey={filterStatus}
            onChange={setFilterStatus}
          />
        </div>

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu trả</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Mã đối soát</th>
                <th>Ngày đăng ký trả</th>
                <th className="text-center">Trạng thái (PT)</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không có phiếu nào.</td></tr>
              ) : filteredData.map((row) => (
                <tr key={row.maPhieuTra}>
                  <td style={{ fontWeight: 600, color: '#2f6765' }}>{row.maPhieuTra}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div>
                    <div style={{ fontSize: 12, color: '#6f797a' }}>{row.loaiNguon === 'HopDong' ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.tenPhong}</div>
                    {row.maGiuong && <div style={{ fontSize: 12, color: '#6f797a' }}>Giường {row.maGiuong.replace(/giường/i, '').trim()}</div>}
                  </td>
                  <td>
                    <span className="tp-loai-badge hd" style={{ fontSize: 11 }}>
                      {row.maDoiSoat}
                    </span>
                  </td>
                  <td>{fmtDate(row.ngayDangKyTra)}</td>
                  <td className="text-center">
                    {row.trangThai === 'Chờ ký biên bản' ? (
                      <span className="ktp-badge ktp-badge-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>Chờ ký biên bản</span>
                    ) : (
                      <span className="ktp-badge ktp-badge-success" style={{ backgroundColor: '#e6f4ea', color: '#137333', borderColor: '#c3e6cb' }}>Đã ký biên bản</span>
                    )}
                  </td>
                  <td className="text-center">
                    {row.trangThai === 'Chờ ký biên bản' ? (
                      <button
                        className="ktp-btn-action-fill"
                        onClick={() => openModal(row)}
                      >
                        Thanh lý
                      </button>
                    ) : (
                      <button
                        className="tp-btn-detail-outline"
                        onClick={() => openModal(row)}
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="ktp-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="ktp-modal" style={{ maxWidth: '900px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Thanh lý hồ sơ</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalOpen(false)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa', gap: 0 }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
              ) : chiTiet ? (
                <>
                  <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0' }}>
                      <Icon name="info" /> Thông tin phiếu trả phòng
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '24px' }}>
                      <div>
                        <div style={{ color: '#6f797a', fontSize: 14, marginBottom: 4 }}>Mã phiếu trả phòng</div>
                        <strong style={{ color: '#191c1d', fontSize: 15 }}>{chiTiet.maPhieuTra}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#6f797a', fontSize: 14, marginBottom: 4 }}>Ngày đăng ký</div>
                        <strong style={{ color: '#191c1d', fontSize: 15 }}>{fmtDate(chiTiet.ngayDangKyTra)}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#6f797a', fontSize: 14, marginBottom: 4 }}>Ngày trả thực tế</div>
                        <strong style={{ color: '#191c1d', fontSize: 15 }}>{fmtDate(chiTiet.ngayTraThucTe)}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#6f797a', fontSize: 14, marginBottom: 4 }}>Trạng thái hiện tại</div>
                        <StatusBadge tone={chiTiet.trangThaiPhieuTra === 'Chờ ký biên bản' ? 'warn' : 'success'}>{chiTiet.trangThaiPhieuTra}</StatusBadge>
                      </div>
                    </div>
                  </section>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                    <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
                        <Icon name="person" /> Khách hàng
                      </h4>
                      <InfoRow label="Họ tên">{chiTiet.hoTenKhach}</InfoRow>
                      <InfoRow label="SĐT">{chiTiet.soDienThoai}</InfoRow>
                      <InfoRow label="CMND/CCCD">{chiTiet.cccdKhach}</InfoRow>
                      <InfoRow label="Email">{chiTiet.emailKhach}</InfoRow>
                    </section>

                    <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
                        <Icon name={chiTiet.hasHopDong ? 'description' : 'account_balance_wallet'} /> {chiTiet.hasHopDong ? 'Hợp đồng' : 'Phiếu đặt cọc'}
                      </h4>
                      <InfoRow label={`Mã ${chiTiet.hasHopDong ? 'hợp đồng' : 'phiếu cọc'}`}>{chiTiet.hasHopDong ? chiTiet.maHopDong : chiTiet.maPhieuDatCoc}</InfoRow>
                      {chiTiet.hasHopDong ? (
                        <>
                          <InfoRow label="Ngày bắt đầu">{fmtDate(chiTiet.ngayBatDauHopDong)}</InfoRow>
                          <InfoRow label="Ngày kết thúc">{fmtDate(chiTiet.ngayKetThucHopDong)}</InfoRow>
                          <InfoRow label="Trạng thái hợp đồng"><StatusBadge tone={chiTiet.trangThaiHopDong?.includes('Đã') ? 'neutral' : 'success'}>{chiTiet.trangThaiHopDong}</StatusBadge></InfoRow>
                        </>
                      ) : (
                        <>
                          <InfoRow label="Ngày đặt cọc">{fmtDate(chiTiet.ngayDatCoc)}</InfoRow>
                          <InfoRow label="Trạng thái cọc"><StatusBadge tone={chiTiet.trangThaiCoc?.includes('Đã') ? 'neutral' : 'success'}>{chiTiet.trangThaiCoc}</StatusBadge></InfoRow>
                        </>
                      )}
                    </section>

                    <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
                        <Icon name="bed" /> Phòng/Giường
                      </h4>
                      <InfoRow label="Khu vực">{chiTiet.khuVuc}</InfoRow>
                      <InfoRow label="Phòng">{chiTiet.tenPhong}</InfoRow>
                      <InfoRow label="Giường">{chiTiet.maGiuong ? `G${chiTiet.maGiuong.replace(/giường/i, '').replace('G', '').trim()}` : 'Tất cả'}</InfoRow>
                      <InfoRow label="Loại phòng">{chiTiet.sucChuaToiDa ? `Phòng ${chiTiet.sucChuaToiDa} người` : chiTiet.trangThaiPhong}</InfoRow>
                    </section>
                  </div>

                  <div style={{ marginBottom: '0' }}>
                    <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
                        <Icon name="receipt_long" /> Kết quả đối soát
                      </h4>
                      {(() => {
                        const ketQua = getDoiSoatResult(chiTiet);
                        return (
                          <>
                            <InfoRow label="Mã đối soát">{chiTiet.maDoiSoat}</InfoRow>
                            <InfoRow label={ketQua.label}><span style={{ color: ketQua.color, fontWeight: 800 }}>{ketQua.value}</span></InfoRow>
                            <InfoRow label="Trạng thái đối soát"><StatusBadge tone={chiTiet.trangThaiDoiSoat === 'Chờ hoàn cọc' ? 'success' : 'info'}>{chiTiet.trangThaiDoiSoat}</StatusBadge></InfoRow>
                          </>
                        );
                      })()}
                    </section>
                  </div>

                </>
              ) : null}
            </div>

            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setModalOpen(false)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                {!isSubmitted && selectedPhieu?.trangThai === 'Chờ ký biên bản' && (
                  <button className="ktp-btn-action-fill" disabled={submitting} onClick={submitXacNhan} style={{ padding: '10px 24px', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Đang xử lý...' : chiTiet?.hasHopDong ? 'Xác nhận đã ký và thanh lý hợp đồng' : 'Xác nhận đã ký biên bản'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSubmitted && (
        <div className="ktp-modal-overlay" style={{ zIndex: 1100 }} onClick={() => { setIsSubmitted(false); setModalOpen(false); }}>
          <div className="ktp-modal" style={{ maxWidth: '400px', width: '90%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#191c1d', margin: '0 0 8px 0' }}>Thành công!</h3>
            <p style={{ fontSize: '15px', color: '#3f494a', margin: '0 0 24px 0' }}>
              {successMessage || 'Đã thanh lý trả phòng.'}
            </p>
            <button
              onClick={() => { setIsSubmitted(false); setModalOpen(false); }}
              style={{ backgroundColor: '#004c52', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none', width: '100%', fontSize: '15px' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`tp-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
