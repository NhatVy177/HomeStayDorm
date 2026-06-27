import React, { useState } from 'react';
import { Icon } from './LapPhieuDatCocTab';

export default function ThuNhanPhongTab() {
  const [modalType, setModalType] = useState(null);

  return (
    <div className="ktp-container">
      {/* Stats & Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px', marginBottom: '32px' }}>
        <div className="ktp-stat-card">
          <div className="ktp-flex-between">
            <Icon name="pending_actions" style={{ color: '#00666d' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#00666d', backgroundColor: 'rgba(0, 102, 109, 0.1)', padding: '4px 8px', borderRadius: '999px' }}>Hôm nay</span>
          </div>
          <p className="ktp-stat-title">Chờ thu tiền</p>
          <h3 className="ktp-stat-value">12 Hợp đồng</h3>
        </div>
        
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #c1c6d5', borderRadius: '16px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label className="ktp-mini-label" style={{ display: 'block', marginBottom: '8px' }}>Trạng thái thu tiền</label>
            <select className="ktp-input-large" style={{ fontSize: '14px', padding: '10px', color: '#191c1d' }}>
              <option>Tất cả trạng thái</option>
              <option>Chờ thu tiền</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="ktp-mini-label" style={{ display: 'block', marginBottom: '8px' }}>Phòng / Giường</label>
            <select className="ktp-input-large" style={{ fontSize: '14px', padding: '10px', color: '#191c1d' }}>
              <option>Tất cả khu vực</option>
              <option>Tầng 1</option>
            </select>
          </div>
          <div style={{ marginTop: '24px' }}>
            <button className="ktp-btn-action" style={{ backgroundColor: '#00666d', color: '#fff', padding: '10px 24px', borderRadius: '8px' }}>Áp dụng bộ lọc</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã hợp đồng</th>
              <th>Khách hàng</th>
              <th>Phòng / Giường</th>
              <th>Ngày bắt đầu</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {/* LƯU Ý MOCK DATA */}
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>HD-88201</span></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="ktp-avatar-sm ktp-avatar-secondary">LT</div>
                  <span style={{ fontWeight: '500' }}>Lê Văn Tùng</span>
                </div>
              </td>
              <td>
                <p style={{ margin: 0, fontWeight: '600' }}>P.102</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>Giường A</p>
              </td>
              <td>01/11/2023</td>
              <td className="text-center">
                <span className="ktp-badge-chua-thanh-toan">Chưa thanh toán</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('tnp-create')}>Ghi nhận thu tiền</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>HD-88212</span></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="ktp-avatar-sm ktp-avatar-tertiary">QM</div>
                  <span style={{ fontWeight: '500' }}>Quách Mạnh Ninh</span>
                </div>
              </td>
              <td>
                <p style={{ margin: 0, fontWeight: '600' }}>P.104</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>Giường B</p>
              </td>
              <td>08/11/2023</td>
              <td className="text-center">
                <span className="ktp-badge-da-thanh-toan">Đã thanh toán</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('tnp-detail')}>Chi tiết</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="ktp-pagination">
          <button className="ktp-page-btn"><Icon name="chevron_left" /></button>
          <button className="ktp-page-btn is-active">1</button>
          <button className="ktp-page-btn">2</button>
          <button className="ktp-page-btn">3</button>
          <button className="ktp-page-btn"><Icon name="chevron_right" /></button>
        </div>
      </section>

      {/* Modal Overlay for Thu Nhận Phòng */}
      {modalType && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()}>
            {modalType === 'tnp-create' && (
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
                
                <div className="ktp-modal-body">
                  {/* LƯU Ý MOCK DATA */}
                  <div className="ktp-info-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div><p className="ktp-mini-label">Khách hàng</p><p style={{ margin: 0, fontWeight: '600' }}>Lê Văn Tùng</p></div>
                    <div><p className="ktp-mini-label">Phòng / Giường</p><p style={{ margin: 0, fontWeight: '600' }}>P.102 - Giường A</p></div>
                    <div style={{ gridColumn: '1 / -1' }}><p className="ktp-mini-label">Mã hợp đồng</p><p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#00666d' }}>HD-88201</p></div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="calculate" style={{ color: '#00666d' }} /> Chi tiết tính toán khoản thu
                    </h4>
                    <div className="ktp-info-box-outline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '14px' }}>Tiền thuê kỳ đầu (01/11 - 30/11)</span><strong style={{ fontSize: '14px' }}>3.000.000đ</strong></div>
                      <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '14px' }}>Phí dịch vụ (Điện, Nước, Quản lý, Internet)</span><strong style={{ fontSize: '14px' }}>500.000đ</strong></div>
                      <div style={{ height: '1px', backgroundColor: '#c1c6d5', margin: '4px 0' }}></div>
                      <div className="ktp-flex-between"><strong style={{ color: '#191c1d' }}>Tổng cộng cần thu</strong><span style={{ fontSize: '20px', fontWeight: '700', color: '#00666d' }}>3.500.000đ</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Số tiền khách thanh toán</label>
                      <input type="text" className="ktp-input-large" defaultValue="3500000" style={{ color: '#191c1d' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Phương thức thanh toán</label>
                      <select className="ktp-input-large" style={{ fontSize: '14px', padding: '12px', color: '#191c1d' }}>
                        <option>Chuyển khoản</option>
                        <option>Tiền mặt</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Ghi chú thanh toán</label>
                      <textarea className="ktp-textarea" rows="2" placeholder="Nhập ghi chú thanh toán..."></textarea>
                    </div>
                  </div>
                </div>

                <div className="ktp-modal-footer">
                  <button className="ktp-btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                  <button className="ktp-btn-submit" onClick={() => setModalType(null)} style={{ backgroundColor: '#00818a', color: '#fff', border: 'none' }}>
                    <Icon name="check_circle" /> Xác nhận & Hoàn tất
                  </button>
                </div>
              </>
            )}

            {modalType === 'tnp-detail' && (
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
                  {/* LƯU Ý MOCK DATA */}
                  <div className="ktp-flex-between" style={{ marginBottom: '24px' }}>
                    <span className="ktp-badge-da-thanh-toan">Đã thanh toán</span>
                    <div style={{ textAlign: 'right' }}>
                      <p className="ktp-mini-label">Mã hợp đồng</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#00666d' }}>HD-88212</p>
                    </div>
                  </div>

                  <div className="ktp-grid-2" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Thông tin khách hàng</h4>
                        <div className="ktp-info-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Quách Mạnh Ninh</p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#414753' }}>0901 234 567</p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#414753' }}>ninh.qm@email.com</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Thông tin phòng</h4>
                        <div className="ktp-info-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>P.104 - Giường B</p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#414753' }}>Ngày bắt đầu: 08/11/2023</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="ktp-mini-label" style={{ marginBottom: '8px' }}>Chi tiết tài chính</h4>
                      <div className="ktp-info-box-outline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '14px' }}>Tổng khoản thu</span><strong style={{ fontSize: '14px' }}>3.850.000đ</strong></div>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '14px' }}>Đã thanh toán</span><strong style={{ fontSize: '14px', color: '#00666d' }}>3.850.000đ</strong></div>
                        <div style={{ height: '1px', backgroundColor: '#c1c6d5', margin: '4px 0' }}></div>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '14px' }}>Phương thức</span><span style={{ fontSize: '14px', fontWeight: '500' }}>Chuyển khoản</span></div>
                        <div className="ktp-flex-between"><span style={{ color: '#414753', fontSize: '14px' }}>Ngày thanh toán</span><span style={{ fontSize: '14px', fontWeight: '500' }}>08/11/2023</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ktp-modal-footer">
                  <button className="ktp-btn-cancel" onClick={() => setModalType(null)} style={{ backgroundColor: '#e1e3e4', border: 'none' }}>Đóng</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
