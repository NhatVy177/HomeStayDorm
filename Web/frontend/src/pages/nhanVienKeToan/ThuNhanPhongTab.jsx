import React, { useState, useEffect } from 'react';
import { Icon } from './LapPhieuDatCocTab';
import { thuNhanPhongApi } from './thuNhanPhong.api.js';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';

// Cấu hình trạng thái thu tiền: chip label, badge label, màu badge (giống DatCocTab).
const TNP_STATUS_CONFIG = {
  'Chưa thanh toán': { chip: 'Chờ thu tiền',    badgeLabel: 'Chờ thu tiền',    badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Đã thanh toán':   { chip: 'Đã thanh toán',   badgeLabel: 'Đã thanh toán',   badge: { bg: '#e6f6ec', fg: '#15803d' } },
};
const TNP_STATUS_ORDER = ['Chưa thanh toán', 'Đã thanh toán'];

export default function ThuNhanPhongTab() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState(null);
  const [paymentSuccessDialog, setPaymentSuccessDialog] = useState(null);

  // Filters
  const [trangThai, setTrangThai] = useState('all');
  const [tuKhoa, setTuKhoa] = useState('');

  // Modals state
  const [modalType, setModalType] = useState(null); // 'tnp-create' | 'tnp-detail' | null
  const [activeCalculation, setActiveCalculation] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);

  // Form inputs for recording payment
  const [soTienThucNop, setSoTienThucNop] = useState('');
  const [phuongThucTT, setPhuongThucTT] = useState('Chuyển khoản');
  const [ghiChu, setGhiChu] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load contracts from API — SP mặc định lọc 'Chưa thanh toán' khi NULL,
  // nên cần gọi 2 lần rồi ghép để chip đếm đúng cả 2 trạng thái.
  const loadContracts = async (override = {}) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const nextTuKhoa = Object.prototype.hasOwnProperty.call(override, 'tuKhoa')
        ? override.tuKhoa
        : tuKhoa;
      const [resChua, resDa] = await Promise.all([
        thuNhanPhongApi.getDanhSachHDChoThuDauKy({ trangThaiThuTien: 'Chưa thanh toán', tuKhoa: nextTuKhoa || null }),
        thuNhanPhongApi.getDanhSachHDChoThuDauKy({ trangThaiThuTien: 'Đã thanh toán', tuKhoa: nextTuKhoa || null })
      ]);
      setContracts([...(resChua.data || []), ...(resDa.data || [])]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  // Open Record Payment Modal
  const handleOpenCreateModal = async (maHopDong) => {
    try {
      setLoading(true);
      setNotice(null);
      const res = await thuNhanPhongApi.tinhKhoanThuNhanPhong(maHopDong);
      setActiveCalculation(res.data);
      const netDiff = (res.data.summary?.TongCongCanThu || 0) - (res.data.summary?.TienHoanCoc || 0);
      setSoTienThucNop(Math.abs(netDiff));
      setPhuongThucTT('Chuyển khoản');
      setGhiChu('');
      setModalType('tnp-create');
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || '';
      if (errorMessage.includes('Đã TT') || errorMessage.includes('đã có hóa đơn kỳ đầu')) {
        setPaymentSuccessDialog({
          title: 'Thu tiền kỳ đầu thành công',
          message: `Hợp đồng ${maHopDong} đã thu tiền kỳ đầu thành công.`
        });
        await handleOpenDetailModal(maHopDong);
        return;
      }
      setNotice({
        type: 'error',
        title: 'Không thể tính khoản thu',
        message: err.response?.data?.message || 'Không thể tính toán khoản thu cho hợp đồng này.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open Details Modal
  const handleOpenDetailModal = async (maHopDong) => {
    try {
      setLoading(true);
      setNotice(null);
      const res = await thuNhanPhongApi.layChiTietThuNhanPhong(maHopDong);
      setActiveDetail(res.data);
      setModalType('tnp-detail');
    } catch (err) {
      console.error(err);
      setNotice({
        type: 'error',
        title: 'Không thể xem hóa đơn',
        message: err.response?.data?.message || 'Không thể lấy thông tin chi tiết hóa đơn.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (soTienThucNop === '' || Number(soTienThucNop) < 0) {
      setNotice({
        type: 'error',
        title: 'Dữ liệu chưa hợp lệ',
        message: 'Số tiền thanh toán phải được nhập và không được âm.'
      });
      return;
    }

    try {
      setSubmitting(true);
      const maHopDong = activeCalculation.summary.MaHopDong;
      
      const payload = {
        maHopDong,
        soTienThucNop: Number(soTienThucNop),
        phuongThucTT,
        ghiChu: ghiChu || null
      };

      const res = await thuNhanPhongApi.ghiNhanThuDauKy(payload);
      
      // Check handover condition
      await thuNhanPhongApi.kiemTraDieuKienBanGiaoSauThuTien(maHopDong);
      const daThuDu = Number(res.data?.maLoi ?? -1) === 0;
      const nextTrangThai = daThuDu ? 'Đã thanh toán' : 'Chưa thanh toán';

      if (daThuDu) {
        setPaymentSuccessDialog({
          title: 'Thu tiền kỳ đầu thành công',
          message: `Hợp đồng ${maHopDong} đã thu tiền kỳ đầu thành công.`
        });
      } else {
        setNotice({
          type: 'warning',
          title: 'Chưa thu đủ tiền kỳ đầu',
          message: res.data.thongBao || 'Số tiền khách thanh toán chưa đủ so với khoản thu kỳ đầu.'
        });
      }

      setModalType(null);
      setTrangThai('all');
      loadContracts();
    } catch (err) {
      console.error(err);
      setNotice({
        type: 'error',
        title: 'Ghi nhận thanh toán thất bại',
        message: err.response?.data?.message || 'Ghi nhận thanh toán thất bại.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return '0đ';
    return Number(val).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (val) => {
    if (!val) return '';
    return new Date(val).toLocaleDateString('vi-VN');
  };

  const getInitials = (name) => {
    if (!name) return 'KH';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Calculate dynamic stats
  const choThuCount = contracts.filter(c => c.TrangThaiThuTien === 'Chưa thanh toán').length;

  // Đếm số lượng theo từng trạng thái (cho chip filter)
  const statusCounts = (() => {
    const c = { all: contracts.length };
    TNP_STATUS_ORDER.forEach((s) => { c[s] = 0; });
    contracts.forEach((item) => {
      const key = item.TrangThaiThuTien;
      if (c[key] != null) c[key] += 1;
    });
    return c;
  })();

  // Danh sách đã lọc theo chip trạng thái (client-side trên data API trả về)
  const filteredContracts = trangThai === 'all'
    ? contracts
    : contracts.filter((c) => c.TrangThaiThuTien === trangThai);

  return (
    <div className="ktp-container tnp-page">
      {notice && (
        <div className={`ktp-inline-notice ktp-inline-notice-${notice.type}`}>
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.message}</p>
          </div>
          <button type="button" onClick={() => setNotice(null)} aria-label="Đóng thông báo">
            <Icon name="close" />
          </button>
        </div>
      )}

      {paymentSuccessDialog && (
        <div
          className="ktp-modal-overlay"
          onClick={() => setPaymentSuccessDialog(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="ktp-modal"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '520px', overflow: 'hidden' }}
          >
            <div className="ktp-modal-header-primary">
              <div>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>
                  {paymentSuccessDialog.title}
                </h3>
                <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.9 }}>
                  Hoàn tất ghi nhận khoản thu nhận phòng
                </p>
              </div>
              <button
                className="ktp-modal-close"
                onClick={() => setPaymentSuccessDialog(null)}
                style={{ color: '#ffffff' }}
                aria-label="Đóng thông báo"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="ktp-modal-body">
              <div
                style={{
                  border: '1px solid #86d3a3',
                  backgroundColor: '#e8f7ee',
                  color: '#0b5f2a',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <Icon name="check_circle" />
                <div>
                  <strong>{paymentSuccessDialog.title}</strong>
                  <p style={{ margin: '6px 0 0 0' }}>{paymentSuccessDialog.message}</p>
                </div>
              </div>
            </div>
            <div className="ktp-modal-footer">
              <button
                type="button"
                className="ktp-btn-submit"
                onClick={() => setPaymentSuccessDialog(null)}
                style={{ backgroundColor: '#00818a', color: '#fff', border: 'none' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Table */}
      <section className="ktp-table-section tnp-table-card">
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input
              type="text"
              value={tuKhoa}
              onChange={(e) => { setTuKhoa(e.target.value); loadContracts({ tuKhoa: e.target.value }); }}
              placeholder="Mã hợp đồng, tên khách hàng, SĐT..."
              className="ktp-input"
              style={{ width: '100%', backgroundColor: '#fff' }}
            />
          </div>
          {tuKhoa && (
            <button type="button" onClick={() => { setTuKhoa(''); loadContracts({ tuKhoa: '' }); }} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        <StatusFilterTabs
          className="status-pill-tabs-offset"
          items={[{ key: 'all', label: 'Tất cả' }, ...TNP_STATUS_ORDER.map((s) => ({ key: s, label: TNP_STATUS_CONFIG[s].chip }))]}
          activeKey={trangThai}
          counts={statusCounts}
          onChange={setTrangThai}
        />

        {loading && <div className="tnp-state tnp-state-loading">Đang tải dữ liệu...</div>}
        {errorMsg && <div className="tnp-state tnp-state-error">{errorMsg}</div>}
        
        {!loading && !errorMsg && (
          <div className="tnp-table-scroll">
            <table className="ktp-table">
              <thead>
                <tr>
                  <th>Mã hợp đồng</th>
                  <th>Khách hàng</th>
                  <th>Phòng / Giường</th>
                  <th>Ngày bắt đầu</th>
                  <th>Cần thu kỳ đầu</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="tnp-empty-state">
                        <Icon name="receipt_long" />
                        <strong>Không tìm thấy hợp đồng nào</strong>
                        <p>Thử đổi trạng thái thu tiền hoặc nhập từ khóa khác.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(contract => {
                    const cfg = TNP_STATUS_CONFIG[contract.TrangThaiThuTien];
                    const badgeStyle = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
                    return (
                      <tr key={contract.MaHopDong}>
                        <td><span className="tnp-contract-code">{contract.MaHopDong}</span></td>
                        <td>
                          <div className="tnp-customer-cell">
                            <div>
                              <p>{contract.HoTenKhachHang}</p>
                              <small>{contract.SDT}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="tnp-room-cell">{contract.PhongGiuong}</p>
                        </td>
                        <td>{formatDate(contract.NgayBatDau)}</td>
                        <td className="tnp-money-cell">{formatCurrency(contract.TongTien)}</td>
                        <td className="text-center">
                          <span style={{ background: badgeStyle.bg, color: badgeStyle.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', textAlign: 'center' }}>
                            {cfg ? cfg.badgeLabel : contract.TrangThaiThuTien}
                          </span>
                        </td>
                        <td className="text-center">
                          {contract.TrangThaiThuTien === 'Đã thanh toán' ? (
                            <button className="tnp-row-action is-muted" onClick={() => handleOpenDetailModal(contract.MaHopDong)}>Xem hóa đơn</button>
                          ) : (
                            <button className="tnp-row-action" onClick={() => handleOpenCreateModal(contract.MaHopDong)}>Ghi nhận thu tiền</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Overlay for Thu Nhận Phòng */}
      {modalType && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            
            {/* Create Payment Modal */}
            {modalType === 'tnp-create' && activeCalculation && (
              <>
                <div className="ktp-modal-header-primary-container">
                  <div>
                    <h3 style={{ fontSize: '20px', margin: 0, color: '#f5feff' }}>Ghi nhận khoản thu nhận phòng</h3>
                    <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.9 }}>Hoàn tất thu tiền để kích hoạt thẻ phòng cho khách</p>
                  </div>
                  <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#f5feff' }}>
                    <Icon name="close" />
                  </button>
                </div>
                
                <form className="ktp-thu-nhan-phong-form" onSubmit={handleSubmitPayment}>
                  <div className="ktp-modal-body">
                    <div className="ktp-info-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div><p className="ktp-mini-label">Khách hàng</p><p style={{ margin: 0, fontWeight: '600' }}>{activeCalculation.summary?.HoTenKhachHang}</p></div>
                      <div><p className="ktp-mini-label">Phòng / Giường</p><p style={{ margin: 0, fontWeight: '600' }}>{activeCalculation.summary?.PhongGiuong}</p></div>
                      <div style={{ gridColumn: '1 / -1' }}><p className="ktp-mini-label">Mã hợp đồng</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#00666d' }}>{activeCalculation.summary?.MaHopDong}</p></div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d' }}>
                        <Icon name="calculate" /> Chi tiết tính toán khoản thu kỳ đầu
                      </h4>
                      <div className="ktp-info-box-outline" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(activeCalculation.details || []).map((item, idx) => (
                          <div key={idx} className="ktp-flex-between">
                            <span style={{ color: '#414753', fontSize: '13px' }}>
                              {item.NoiDung?.toLowerCase().includes('xe') ? (
                                `${item.NoiDung} (${Math.round(Number(item.SoLuong))} xe / 1 ${item.DonViTinh})`
                              ) : (
                                `${item.NoiDung} (${item.SoLuong} ${item.DonViTinh})`
                              )}
                            </span>
                            <strong style={{ fontSize: '13px' }}>{formatCurrency(item.ThanhTien)}</strong>
                          </div>
                        ))}
                        <div style={{ height: '1px', backgroundColor: '#c1c6d5', margin: '4px 0' }}></div>
                        <div className="ktp-flex-between">
                          <strong style={{ color: '#191c1d', fontSize: '15px' }}>Tổng cộng cần thu</strong>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#00666d' }}>
                            {formatCurrency(activeCalculation.summary?.TongCongCanThu)}
                          </span>
                        </div>
                      </div>
                      
                      {activeCalculation.summary?.TienHoanCoc > 0 && (
                        <div style={{
                          marginTop: '16px',
                          border: '1px solid #fbbf24',
                          backgroundColor: '#fffbeb',
                          color: '#b45309',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}>
                          <Icon name="info" style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                          <div style={{ fontSize: '13px' }}>
                            <strong style={{ display: 'block', marginBottom: '2px' }}>Thông tin hoàn cọc (Thành viên không được duyệt)</strong>
                            <span>
                              Nhân viên kế toán cần trả lại cho khách hàng: 
                              <strong style={{ marginLeft: '4px', fontSize: '15px', color: '#b45309' }}>
                                {formatCurrency(activeCalculation.summary?.TienHoanCoc)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {(() => {
                        const netDiff = (activeCalculation.summary?.TongCongCanThu || 0) - (activeCalculation.summary?.TienHoanCoc || 0);
                        let inputLabel = "Số tiền khách thanh toán (đ) *";
                        if (activeCalculation.summary?.TienHoanCoc > 0) {
                          if (netDiff > 0) {
                            inputLabel = "Số tiền khách cần thanh toán chênh lệch (đ) *";
                          } else if (netDiff < 0) {
                            inputLabel = "Số tiền nhân viên cần thanh toán chênh lệch cho khách (đ) *";
                          } else {
                            inputLabel = "Số tiền thanh toán chênh lệch (đ) *";
                          }
                        }
                        return (
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3f494a' }}>{inputLabel}</label>
                            <input 
                              type="number" 
                              className="ktp-input-large" 
                              value={soTienThucNop} 
                              onChange={e => setSoTienThucNop(e.target.value)} 
                              style={{ color: '#191c1d', width: '100%', padding: '10px', boxSizing: 'border-box' }}
                              required 
                            />
                          </div>
                        );
                      })()}
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3f494a' }}>Phương thức thanh toán *</label>
                        <select 
                          className="ktp-input-large" 
                          value={phuongThucTT} 
                          onChange={e => setPhuongThucTT(e.target.value)} 
                          style={{ fontSize: '14px', padding: '10px', color: '#191c1d', width: '100%', boxSizing: 'border-box' }}
                        >
                          <option value="Chuyển khoản">Chuyển khoản</option>
                          <option value="Tiền mặt">Tiền mặt</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3f494a' }}>Ghi chú thanh toán</label>
                        <textarea 
                          className="ktp-textarea" 
                          rows="2" 
                          value={ghiChu}
                          onChange={e => setGhiChu(e.target.value)}
                          placeholder="Nhập ghi chú thanh toán (ví dụ: Số tài khoản chuyển, tên người chuyển...)"
                          style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="ktp-modal-footer">
                    <button type="button" className="ktp-btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                    <button 
                      type="submit" 
                      className="ktp-btn-submit" 
                      style={{ backgroundColor: '#00818a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      disabled={submitting}
                    >
                      <Icon name="check_circle" /> {submitting ? 'Đang xử lý...' : 'Xác nhận & Hoàn tất'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* View Details Modal */}
            {modalType === 'tnp-detail' && activeDetail && (() => {
              const s = activeDetail.summary || {};
              const isPaid = s.TrangThaiThuTien === 'Đã thanh toán';
              const badgeCfg = TNP_STATUS_CONFIG[s.TrangThaiThuTien] || { badgeLabel: s.TrangThaiThuTien, badge: { bg: '#eef2f3', fg: '#3f494a' } };
              return (
                <>
                  {/* ── Header ── */}
                  <div style={{ background: 'linear-gradient(135deg, #00666d 0%, #004d52 100%)', padding: '28px 28px 24px', color: '#fff', position: 'relative' }}>
                    <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#fff', position: 'absolute', top: 16, right: 16 }}>
                      <Icon name="close" />
                    </button>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.75 }}>Phiếu thu nhận phòng</p>
                    <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.01em' }}>{s.MaHopDong}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                      <span style={{ background: isPaid ? 'rgba(134,211,163,0.25)' : 'rgba(255,244,229,0.3)', color: '#fff', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isPaid ? '#86d3a3' : '#fbbf24', display: 'inline-block' }}></span>
                        {badgeCfg.badgeLabel}
                      </span>
                      {isPaid && s.NgayThanhToan && (
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>• Ngày TT: {formatDate(s.NgayThanhToan)}</span>
                      )}
                    </div>
                  </div>

                  <div className="ktp-modal-body" style={{ padding: '24px 28px', gap: 0, display: 'block' }}>
                    {/* ── Success banner ── */}
                    {isPaid && (
                      <div style={{ background: '#f0faf4', border: '1px solid #a7d7b8', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
                        <span style={{ background: '#d4eddf', borderRadius: '10px', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name="check_circle" style={{ color: '#15803d', fontSize: '20px' }} />
                        </span>
                        <div>
                          <strong style={{ color: '#15803d', fontSize: '14px', display: 'block', marginBottom: '2px' }}>Đã thu đủ kỳ đầu</strong>
                          <span style={{ color: '#3f6f54', fontSize: '13px' }}>Hợp đồng {s.MaHopDong} đã hoàn tất thanh toán khoản thu nhận phòng.</span>
                        </div>
                      </div>
                    )}

                    {/* ── Customer & Room info ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
                      {/* Customer card */}
                      <div style={{ background: '#f8fafb', border: '1px solid #e2e8ea', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                          <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'linear-gradient(135deg, #00666d, #008b8b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>
                            {getInitials(s.HoTenKhachHang)}
                          </div>
                          <div>
                            <strong style={{ color: '#111819', fontSize: '15px', display: 'block' }}>{s.HoTenKhachHang}</strong>
                            <span style={{ color: '#6f797a', fontSize: '12px' }}>Khách hàng</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="phone" style={{ fontSize: '16px', color: '#00666d' }} />
                            <span style={{ fontSize: '13px', color: '#3f494a' }}>{s.SDT || '—'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="mail" style={{ fontSize: '16px', color: '#00666d' }} />
                            <span style={{ fontSize: '13px', color: '#3f494a' }}>{s.Email || '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Room card */}
                      <div style={{ background: '#f8fafb', border: '1px solid #e2e8ea', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <span style={{ width: 42, height: 42, borderRadius: '12px', background: '#edf7f7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name="meeting_room" style={{ fontSize: '22px', color: '#00666d' }} />
                          </span>
                          <div>
                            <strong style={{ color: '#111819', fontSize: '15px', display: 'block' }}>{s.PhongGiuong}</strong>
                            <span style={{ color: '#6f797a', fontSize: '12px' }}>Vị trí thuê</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="calendar_today" style={{ fontSize: '16px', color: '#00666d' }} />
                            <span style={{ fontSize: '13px', color: '#3f494a' }}>Bắt đầu: <strong>{formatDate(s.NgayBatDau)}</strong></span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="payments" style={{ fontSize: '16px', color: '#00666d' }} />
                            <span style={{ fontSize: '13px', color: '#3f494a' }}>Thanh toán: <strong>{s.PhuongThucThanhToan || 'Chưa ghi nhận'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Financial summary ── */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8ea', borderRadius: '12px', overflow: 'hidden', marginBottom: '22px' }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8ea', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="receipt_long" style={{ fontSize: '18px', color: '#00666d' }} />
                        <strong style={{ fontSize: '14px', color: '#111819' }}>Tổng hợp tài chính</strong>
                      </div>
                      <div style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ color: '#6f797a', fontSize: '13px' }}>Tổng khoản thu kỳ đầu</span>
                          <strong style={{ fontSize: '15px', color: '#111819' }}>{formatCurrency(s.TongKhoanThu)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ color: '#6f797a', fontSize: '13px' }}>Đã thanh toán</span>
                          <strong style={{ fontSize: '15px', color: '#15803d' }}>{formatCurrency(s.DaThanhToan)}</strong>
                        </div>
                        <div style={{ height: '1px', background: '#e2e8ea', margin: '0 0 14px' }}></div>
                        <div style={{ background: isPaid ? '#f0faf4' : '#fff8ec', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: isPaid ? '#15803d' : '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {isPaid ? 'Đã hoàn tất' : 'Còn thiếu'}
                            </span>
                          </div>
                          <strong style={{ fontSize: '22px', fontWeight: 800, color: isPaid ? '#15803d' : '#b45309' }}>
                            {isPaid ? formatCurrency(s.DaThanhToan) : formatCurrency((s.TongKhoanThu || 0) - (s.DaThanhToan || 0))}
                          </strong>
                        </div>
                        
                        {s.TienHoanCoc > 0 && (
                          <>
                            <div style={{ height: '1px', background: '#e2e8ea', margin: '14px 0 12px' }}></div>
                            <div style={{ 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
                              background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '10px', padding: '12px 14px' 
                            }}>
                              <div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '2px' }}>
                                  Tiền cần hoàn cọc cho khách
                                </span>
                                <span style={{ fontSize: '11px', color: '#d97706' }}>
                                  (Hoàn 80% cọc cho {s.SoNguoiHuy} người k duyệt)
                                </span>
                              </div>
                              <strong style={{ fontSize: '18px', fontWeight: 800, color: '#b45309' }}>
                                {formatCurrency(s.TienHoanCoc)}
                              </strong>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Fee breakdown ── */}
                    {(activeDetail.details || []).length > 0 && (
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8ea', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8ea', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon name="list_alt" style={{ fontSize: '18px', color: '#00666d' }} />
                          <strong style={{ fontSize: '14px', color: '#111819' }}>Chi tiết các khoản phí</strong>
                        </div>
                        <div style={{ padding: '4px 0' }}>
                          {(activeDetail.details || []).map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 18px',
                                borderBottom: idx < (activeDetail.details || []).length - 1 ? '1px solid #f0f2f3' : 'none'
                              }}
                            >
                              <div>
                                <span style={{ fontSize: '13px', color: '#111819', fontWeight: 600 }}>{item.NoiDung}</span>
                                <span style={{ fontSize: '12px', color: '#6f797a', marginLeft: '6px' }}>
                                  {item.NoiDung?.toLowerCase().includes('xe') ? (
                                    `× ${Math.round(Number(item.SoLuong))} xe / 1 ${item.DonViTinh}`
                                  ) : (
                                    `× ${item.SoLuong} ${item.DonViTinh}`
                                  )}
                                </span>
                              </div>
                              <strong style={{ fontSize: '14px', color: '#111819' }}>{formatCurrency(item.ThanhTien)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ktp-modal-footer" style={{ padding: '16px 28px', borderTop: '1px solid #e2e8ea' }}>
                    <button
                      type="button"
                      onClick={() => setModalType(null)}
                      style={{ background: '#2f6765', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Icon name="close" style={{ fontSize: '18px' }} /> Đóng
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
