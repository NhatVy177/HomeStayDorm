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

function evidenceHref(value) {
  if (!value) return '';
  const text = String(value);
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${apiBase.replace(/\/api\/?$/, '')}${text}`;
  }
  return text;
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

function ChungTuLink({ value, emptyText = 'Chưa có chứng từ' }) {
  const href = evidenceHref(value);
  if (!href) {
    return <span style={{ color: '#b06000', fontStyle: 'italic', fontWeight: 600 }}>{emptyText}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ color: '#0d6efd', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
      Xem chứng từ
    </a>
  );
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
  const [successToast, setSuccessToast] = useState('');
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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(''), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

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
      await loadDanhSach();
      setModalOpen(false);
      setSuccessToast(res.data?.message || 'Thanh lý trả phòng thành công.');
    } catch (err) {
      console.error(err);
      setToast(err.response?.data?.message || 'Lỗi khi thanh lý trả phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="ktp-table-section">
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tên khách hàng, SĐT hoặc mã phiếu..."
              className="ktp-input"
              style={{ width: '100%', backgroundColor: '#fff' }}
              spellCheck={false}
            />
          </div>
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        <StatusFilterTabs
          className="status-pill-tabs-offset"
          items={[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ ký biên bản' },
            { key: 'SIGNED', label: 'Đã ký biên bản' }
          ]}
          activeKey={filterStatus}
          counts={{ ALL: countAll, PENDING: countPending, SIGNED: countSigned }}
          onChange={setFilterStatus}
        />

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
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>
                  {chiTiet?.trangThaiPhieuTra === 'Chờ ký biên bản' ? 'Thanh lý hồ sơ' : 'Chi tiết thanh lý hồ sơ'}
                </h3>
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
                    </section>

                    <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0'}}>
                        <Icon name="assignment" /> Hồ sơ
                      </h4>
                      <InfoRow label="Loại hồ sơ">{chiTiet.hasHopDong ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}</InfoRow>
                      <InfoRow label="Mã hồ sơ">{chiTiet.hasHopDong ? chiTiet.maHopDong : chiTiet.maPhieuDatCoc}</InfoRow>
                      <InfoRow label="Trạng thái hồ sơ">
                        <StatusBadge tone={(chiTiet.hasHopDong ? chiTiet.trangThaiHopDong : chiTiet.trangThaiCoc)?.includes('Đã') ? 'neutral' : 'success'}>
                          {chiTiet.hasHopDong ? chiTiet.trangThaiHopDong : chiTiet.trangThaiCoc}
                        </StatusBadge>
                      </InfoRow>
                    </section>

                    <section style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
                        <Icon name="bed" /> Phòng/Giường
                      </h4>
                      <InfoRow label="Khu vực">{chiTiet.khuVuc || chiTiet.tenChiNhanh}</InfoRow>
                      <InfoRow label="Phòng/Giường">
                        {chiTiet.hinhThucThue === 'Nguyên phòng' 
                          ? chiTiet.tenPhong 
                          : (chiTiet.maGiuong 
                              ? `${chiTiet.tenPhong}-G${String(chiTiet.maGiuong).replace(/giường/i, '').trim().replace(/^G/i, '').padStart(2, '0')}` 
                              : chiTiet.tenPhong)}
                      </InfoRow>
                      <InfoRow label="Hình thức thuê">{chiTiet.hinhThucThue || (chiTiet.maGiuong ? 'Ghép giường' : 'Nguyên phòng')}</InfoRow>
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
                <button onClick={() => setModalOpen(false)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                {selectedPhieu?.trangThai === 'Chờ ký biên bản' && (
                  <button className="ktp-btn-action-fill" disabled={submitting} onClick={submitXacNhan} style={{ padding: '10px 24px', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Đang xử lý...' : 'Xác nhận thanh lý hồ sơ'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`tp-toast ${toast ? 'show' : ''}`}>{toast}</div>
      <div className={`dktp-toast ${successToast ? 'dktp-toast-show' : ''}`}>
        <Icon name="check_circle" style={{ fontSize: '18px' }} />
        {successToast}
      </div>
    </div>
  );
}
