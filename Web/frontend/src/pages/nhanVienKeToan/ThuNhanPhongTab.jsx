import React, { useState, useEffect } from 'react';
import { Icon } from './LapPhieuDatCocTab';
import { thuNhanPhongApi } from './thuNhanPhong.api.js';

export default function ThuNhanPhongTab() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState(null);
  const [paymentSuccessDialog, setPaymentSuccessDialog] = useState(null);

  // Filters
  const [trangThai, setTrangThai] = useState('Chưa thanh toán');
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

  // Load contracts from API
  const loadContracts = async (override = {}) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const nextTrangThai = Object.prototype.hasOwnProperty.call(override, 'trangThai')
        ? override.trangThai
        : trangThai;
      const nextTuKhoa = Object.prototype.hasOwnProperty.call(override, 'tuKhoa')
        ? override.tuKhoa
        : tuKhoa;
      const res = await thuNhanPhongApi.getDanhSachHDChoThuDauKy({
        trangThaiThuTien: nextTrangThai || null,
        tuKhoa: nextTuKhoa || null
      });
      setContracts(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [trangThai]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadContracts();
  };

  // Open Record Payment Modal
  const handleOpenCreateModal = async (maHopDong) => {
    try {
      setLoading(true);
      setNotice(null);
      const res = await thuNhanPhongApi.tinhKhoanThuNhanPhong(maHopDong);
      setActiveCalculation(res.data);
      setSoTienThucNop(res.data.summary?.TongCongCanThu || 0);
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
      setTrangThai(nextTrangThai);
      loadContracts({ trangThai: nextTrangThai });
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

      <section className="tnp-hero">
        <div className="tnp-hero-copy">
          <span>Thu nhận phòng</span>
          <h2>Ghi nhận khoản thu kỳ đầu</h2>
        </div>
        <article className="tnp-summary-card is-primary" aria-label="Hợp đồng cần thu tiền">
          <span><Icon name="pending_actions" /></span>
          <div>
            <p>Hợp đồng cần thu tiền</p>
            <strong>{choThuCount}</strong>
            <small>Cần xử lý</small>
          </div>
        </article>
      </section>

      <form className="tnp-filter-card" onSubmit={handleSearch}>
        <label className="tnp-search-field">
          <span>Tìm kiếm</span>
          <div>
            <Icon name="search" />
            <input
              type="text"
              value={tuKhoa}
              onChange={e => setTuKhoa(e.target.value)}
              placeholder="Tìm mã hợp đồng, tên khách hàng, SĐT..."
            />
          </div>
        </label>
        <label className="tnp-select-field">
          <span>Trạng thái thu tiền</span>
          <select value={trangThai} onChange={e => setTrangThai(e.target.value)}>
            <option value="Chưa thanh toán">Chờ thu tiền</option>
            <option value="Đã thanh toán">Đã thanh toán</option>
          </select>
        </label>
        <button type="submit" className="tnp-filter-submit">
          <Icon name="search" />
          Tìm kiếm
        </button>
      </form>

      {/* Table */}
      <section className="ktp-table-section tnp-table-card">
        <div className="tnp-table-head">
          <div>
            <h3>Danh sách hợp đồng</h3>
            <p>Chọn hợp đồng để ghi nhận thu tiền hoặc xem chi tiết khoản thu đã xử lý.</p>
          </div>
        </div>
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
                {contracts.length === 0 ? (
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
                  contracts.map(contract => (
                    <tr key={contract.MaHopDong}>
                      <td><span className="tnp-contract-code">{contract.MaHopDong}</span></td>
                      <td>
                        <div className="tnp-customer-cell">
                          <div className="ktp-avatar-sm ktp-avatar-secondary">{getInitials(contract.HoTenKhachHang)}</div>
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
                        <span className={contract.TrangThaiThuTien === 'Đã thanh toán' ? 'ktp-badge-da-thanh-toan' : 'ktp-badge-chua-thanh-toan'}>
                          {contract.TrangThaiThuTien}
                        </span>
                      </td>
                      <td className="text-center">
                        {contract.TrangThaiThuTien === 'Đã thanh toán' ? (
                          <button className="tnp-row-action is-muted" onClick={() => handleOpenDetailModal(contract.MaHopDong)}>Chi tiết</button>
                        ) : (
                          <button className="tnp-row-action" onClick={() => handleOpenCreateModal(contract.MaHopDong)}>Ghi nhận thu tiền</button>
                        )}
                      </td>
                    </tr>
                  ))
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
                              {item.NoiDung} ({item.SoLuong} {item.DonViTinh})
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
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#3f494a' }}>Số tiền khách thanh toán (đ) *</label>
                        <input 
                          type="number" 
                          className="ktp-input-large" 
                          value={soTienThucNop} 
                          onChange={e => setSoTienThucNop(e.target.value)} 
                          style={{ color: '#191c1d', width: '100%', padding: '10px', boxSizing: 'border-box' }}
                          required 
                        />
                      </div>
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
            {modalType === 'tnp-detail' && activeDetail && (
              <>
                <div className="ktp-modal-header-primary">
                  <div>
                    <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>Chi tiết thu nhận phòng</h3>
                    <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.9 }}>Thông tin chi tiết về hợp đồng và thanh toán</p>
                  </div>
                  <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}>
                    <Icon name="close" />
                  </button>
                </div>
                
                <div className="ktp-modal-body">
                  {activeDetail.summary?.TrangThaiThuTien === 'Đã thanh toán' && (
                    <div
                      className="ktp-inline-notice ktp-inline-notice-success"
                      style={{ marginBottom: '18px' }}
                    >
                      <div>
                        <strong>Thu tiền kỳ đầu thành công</strong>
                        <p>Hợp đồng {activeDetail.summary?.MaHopDong} đã thu tiền kỳ đầu thành công.</p>
                      </div>
                    </div>
                  )}

                  <div className="ktp-flex-between" style={{ marginBottom: '20px' }}>
                    <span className={activeDetail.summary?.TrangThaiThuTien === 'Đã thanh toán' ? 'ktp-badge-da-thanh-toan' : 'ktp-badge-chua-thanh-toan'}>
                      {activeDetail.summary?.TrangThaiThuTien}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <p className="ktp-mini-label" style={{ margin: 0 }}>Mã hợp đồng</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#00666d' }}>{activeDetail.summary?.MaHopDong}</p>
                    </div>
                  </div>

                  <div className="ktp-grid-2" style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Thông tin khách hàng</h4>
                        <div className="ktp-info-box" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{activeDetail.summary?.HoTenKhachHang}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#414753' }}>{activeDetail.summary?.SDT}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#414753' }}>{activeDetail.summary?.Email}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Thông tin phòng</h4>
                        <div className="ktp-info-box" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{activeDetail.summary?.PhongGiuong}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#414753' }}>Ngày bắt đầu: {formatDate(activeDetail.summary?.NgayBatDau)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Chi tiết tài chính</h4>
                      <div className="ktp-info-box-outline" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '13px' }}>Tổng khoản thu</span><strong style={{ fontSize: '13px' }}>{formatCurrency(activeDetail.summary?.TongKhoanThu)}</strong></div>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '13px' }}>Đã thanh toán</span><strong style={{ fontSize: '13px', color: '#00666d' }}>{formatCurrency(activeDetail.summary?.DaThanhToan)}</strong></div>
                        <div style={{ height: '1px', backgroundColor: '#c1c6d5', margin: '4px 0' }}></div>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '13px' }}>Phương thức</span><span style={{ fontSize: '13px', fontWeight: '500' }}>{activeDetail.summary?.PhuongThucThanhToan || 'N/A'}</span></div>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '13px' }}>Ngày thanh toán</span><span style={{ fontSize: '13px', fontWeight: '500' }}>{activeDetail.summary?.NgayThanhToan ? formatDate(activeDetail.summary?.NgayThanhToan) : 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Chi tiết các khoản phí đã thanh toán</h4>
                    <div className="ktp-info-box-outline" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
                      {(activeDetail.details || []).length === 0 ? (
                        <p style={{ margin: 0, fontSize: '13px', color: '#6f797a', fontStyle: 'italic' }}>Không có chi tiết dịch vụ đi kèm hóa đơn.</p>
                      ) : (
                        (activeDetail.details || []).map((item, idx) => (
                          <div key={idx} className="ktp-flex-between">
                            <span style={{ color: '#414753', fontSize: '13px' }}>{item.NoiDung} ({item.SoLuong} {item.DonViTinh})</span>
                            <strong style={{ fontSize: '13px' }}>{formatCurrency(item.ThanhTien)}</strong>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="ktp-modal-footer">
                  <button type="button" className="ktp-btn-cancel" onClick={() => setModalType(null)} style={{ backgroundColor: '#e1e3e4', border: 'none', cursor: 'pointer' }}>Đóng</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
