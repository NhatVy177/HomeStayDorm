import React, { useState } from 'react';

export function Icon({ name, className = '' }) {
  const shapes = {
    dashboard: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
    payments: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M6 12h.01M18 12h.01" /></>,
    meeting_room: <><path d="M14 19V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14" /><path d="M22 19H2" /><path d="M10 12h2" /></>,
    receipt_long: <><path d="M14 2H6a2 2 0 0 0-2 2v16l2-2 2 2 2-2 2 2 2-2 2 2V4a2 2 0 0 0-2-2Z" /><path d="M8 6h4M8 10h8M8 14h8" /></>,
    account_balance_wallet: <><path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10.4V20h13v-9.6" /><path d="M9.5 20v-5.8h5V20" /></>,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    person: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    description: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
    apartment: <><path d="M22 20V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16" /><path d="M9 20V9h6v11" /><path d="M22 20H2" /></>,
    bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></>,
    account_circle: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    warning: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    pending_actions: <><path d="M19 14v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" /><path d="M12 4v4" /><path d="M8 2h8" /><path d="M19 22v-6l2 2" /><path d="M21 16l-2 2" /></>,
    calculate: <><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></>,
    check_circle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    chevron_left: <><path d="m15 18-6-6 6-6"/></>,
    chevron_right: <><path d="m9 18 6-6-6-6"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></>,
    bolt: <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></>,
    water_drop: <><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></>,
    bellhop_bell: <><path d="M10 2h4"/><path d="M12 2v3"/><path d="M19 18a7 7 0 0 0-14 0"/><path d="M2 18h20"/></>,
    filter_list: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    arrow_forward: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    account_balance: <><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></>,
    money_off: <><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.5L3 3l18 18-5.3-5.3c-.6.3-1.2.5-1.8.6v2c0 .6-.4 1-1 1s-1-.4-1-1v-2h-2"/><path d="M9 7v-2c0-.6.4-1 1-1s1 .4 1 1v2h2a2 2 0 0 1 2 2v2l-6-6z"/></>,
    refresh: <><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></>,
    build: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    add_circle: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
    delete: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
    assignment_turned_in: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><polyline points="9 14 11 16 15 12" /></>,
    cancel: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
    arrow_back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    electric_bolt: <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></>,
    fact_check: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><polyline points="9 14 11 16 15 12" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    person_add: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
    directions_bike: <><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><polyline points="12 17.5 12 14 16 14 16 11 10.5 11 8.5 18"/><polyline points="16 11 12 6 9 6"/><polyline points="12 6 12.5 3.5 14.5 3.5"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    print: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    error_outline: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    hourglass_empty: <><path d="M6 2h12M6 22h12M6 2v6l6 6-6 6v6M18 2v6l-6 6 6 6v6" /></>,
    edit_note: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,

  };

  return (
    <svg className={`kp-line-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '1em', height: '1em' }}>
      {shapes[name] || shapes.home}
    </svg>
  );
}

export default function LapPhieuDatCocTab() {
  const [modalType, setModalType] = useState(null);

  return (
    <div className="ktp-container">
      {/* Filter Section */}
      <section className="ktp-filter-section">
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Trạng thái lập phiếu</label>
          <select className="ktp-input">
            <option>Tất cả</option>
            <option>Chờ lập phiếu</option>
            <option>Đã lập phiếu</option>
            <option>Đã hủy</option>
            <option>Thiếu thông tin</option>
          </select>
        </div>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Khách hàng</label>
          <input className="ktp-input" type="text" placeholder="Tên khách hàng..." />
        </div>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Phòng/Giường</label>
          <input className="ktp-input" type="text" placeholder="Mã phòng..." />
        </div>
        <div className="ktp-filter-group" style={{ justifyContent: 'flex-end' }}>
          <div className="ktp-input-icon-wrap">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input className="ktp-input ktp-input-with-icon" type="text" placeholder="Mã hồ sơ/Tên KH" />
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã hồ sơ</th>
              <th>Khách hàng</th>
              <th>Phòng/Giường</th>
              <th>Thời điểm đặt cọc</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HS-88321</td>
              <td>Lê Hoàng Nam</td>
              <td>P.402 - B1</td>
              <td style={{ fontStyle: 'italic', color: '#6f797a' }}>--</td>
              <td className="text-center">
                <span className="ktp-badge ktp-badge-primary">Chờ lập phiếu</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('create')}>Lập phiếu</button>
              </td>
            </tr>
            <tr style={{ backgroundColor: 'rgba(46, 125, 50, 0.05)' }}>
              <td>HS-88322</td>
              <td>Nguyễn Thùy Linh</td>
              <td>P.301 - A</td>
              <td>10:30 25/10/2023</td>
              <td className="text-center">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span className="ktp-badge ktp-badge-secondary">Chờ thanh toán</span>
                  <span className="ktp-text-error" style={{ fontSize: '12px', fontWeight: '500' }}>Còn lại: 23:45:12</span>
                </div>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('detail')}>Chi tiết</button>
              </td>
            </tr>
            <tr style={{ opacity: 0.7 }}>
              <td>HS-88400</td>
              <td>Vũ Minh Tuấn</td>
              <td>P.505 - B</td>
              <td>15:45 22/10/2023</td>
              <td className="text-center">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span className="ktp-badge ktp-badge-outline">Đã hủy</span>
                  <span className="ktp-text-error" style={{ fontSize: '10px' }}>Hết hạn thanh toán</span>
                </div>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('detail')}>Chi tiết</button>
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

      {/* Modal Overlay */}
      {modalType && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()}>
            {modalType === 'detail' ? (
              <>
                <div className="ktp-modal-header">
                  <div>
                    <h3>Chi tiết phiếu đặt cọc</h3>
                    <p className="ktp-modal-header-sub">Mã chứng từ: <span>DCT-2023-88322</span></p>
                  </div>
                  <div className="ktp-badge-warning">Chờ thanh toán</div>
                </div>
                <div className="ktp-modal-body">
                  <div className="ktp-detail-section">
                    <h4 className="ktp-detail-title"><Icon name="person" /> THÔNG TIN KHÁCH HÀNG</h4>
                    <div className="ktp-detail-card ktp-detail-grid">
                      <div className="ktp-detail-item"><span className="ktp-detail-label">HỌ VÀ TÊN</span><span className="ktp-detail-value">Nguyễn Thùy Linh</span></div>
                      <div className="ktp-detail-item"><span className="ktp-detail-label">SỐ ĐIỆN THOẠI</span><span className="ktp-detail-value">0901234567</span></div>
                      <div className="ktp-detail-item"><span className="ktp-detail-label">SỐ CCCD</span><span className="ktp-detail-value">034098001234</span></div>
                      <div className="ktp-detail-item"><span className="ktp-detail-label">EMAIL</span><span className="ktp-detail-value">thuylinh.ng@gmail.com</span></div>
                    </div>
                  </div>
                  <div className="ktp-detail-section">
                    <h4 className="ktp-detail-title"><Icon name="description" /> THÔNG TIN HỒ SƠ</h4>
                    <div className="ktp-detail-card ktp-detail-grid">
                      <div className="ktp-detail-item"><span className="ktp-detail-label">MÃ HỒ SƠ</span><span className="ktp-detail-value">HS-88322</span></div>
                      <div className="ktp-detail-item"><span className="ktp-detail-label">NGÀY LẬP PHIẾU</span><span className="ktp-detail-value">25/10/2023</span></div>
                      <div className="ktp-detail-item" style={{ gridColumn: '1 / -1' }}><span className="ktp-detail-label">CHI TIẾT YÊU CẦU</span><span className="ktp-detail-value" style={{ fontStyle: 'italic' }}>Khách hàng yêu cầu lắp thêm rèm cửa và thanh toán cọc giữ chỗ trong vòng 24h.</span></div>
                    </div>
                  </div>
                  <div className="ktp-detail-section">
                    <h4 className="ktp-detail-title"><Icon name="apartment" /> THÔNG TIN PHÒNG & GIÁ</h4>
                    <div className="ktp-room-card">
                      <div className="ktp-room-card-top">
                        <div className="ktp-room-info"><div className="ktp-room-icon"><Icon name="bed" /></div><div className="ktp-room-text"><p>PHÒNG ĐÃ CHỌN</p><h4>P.301 - A</h4></div></div>
                        <div className="ktp-room-price"><p>GIÁ THUÊ CƠ BẢN</p><h4>9.000.000đ<span>/tháng</span></h4></div>
                      </div>
                      <div className="ktp-room-card-bottom"><span>Số tiền đặt cọc (50%)</span><strong>4.500.000đ</strong></div>
                    </div>
                  </div>
                </div>
                <div className="ktp-modal-footer">
                  <button className="ktp-btn-submit" onClick={() => setModalType(null)}><Icon name="close" /> Đóng</button>
                </div>
              </>
            ) : (
              <>
                <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none' }}>
                  <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>Lập phiếu đặt cọc</h3>
                  <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
                </div>
                <div className="ktp-modal-body">
                  <div className="ktp-grid-2">
                    <div className="ktp-section ktp-info-box-outline">
                      <h4 className="ktp-section-title"><Icon name="person" /> 1. Thông tin khách hàng</h4>
                      <div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Họ tên:</span> <span className="ktp-info-value">Lê Hoàng Nam</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">SĐT:</span> <span className="ktp-info-value">0987 654 321</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Email:</span> <span className="ktp-info-value">hoangnam.le@gmail.com</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">CCCD:</span> <span className="ktp-info-value">001201009876</span></div>
                      </div>
                    </div>
                    <div className="ktp-section ktp-info-box-outline">
                      <h4 className="ktp-section-title"><Icon name="description" /> 2. Thông tin hồ sơ</h4>
                      <div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Mã hồ sơ:</span> <span className="ktp-info-value">HS-88321</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Mã yêu cầu:</span> <span className="ktp-info-value ktp-text-primary">REQ-2024-001</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Trạng thái:</span> <span className="ktp-info-value ktp-text-success">Chấp nhận</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Sale phụ trách:</span> <span className="ktp-info-value">Phạm Minh Anh</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="ktp-section ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="apartment" /> 3. Thông tin phòng</h4>
                    <div className="ktp-grid-5">
                      <div><p className="ktp-mini-label">Phòng</p><p className="ktp-mini-value">P.402 - B1</p></div>
                      <div><p className="ktp-mini-label">Loại phòng</p><p className="ktp-mini-value">Phòng đơn Cao cấp</p></div>
                      <div><p className="ktp-mini-label">Giá thuê</p><p className="ktp-mini-value ktp-text-primary">5,500,000đ</p></div>
                      <div><p className="ktp-mini-label">Ngày vào ở</p><p className="ktp-mini-value">01/11/2023</p></div>
                      <div><p className="ktp-mini-label">Thời hạn</p><p className="ktp-mini-value">12 tháng</p></div>
                    </div>
                  </div>
                  <div className="ktp-section ktp-section-primary">
                    <h4 className="ktp-section-title"><Icon name="calculate" /> 4. Điều khoản & Cọc</h4>
                    <div className="ktp-grid-2">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="ktp-flex-between"><span style={{ color: '#6f797a' }}>Số tháng cọc:</span><strong>02 tháng</strong></div>
                        <div className="ktp-flex-between"><span style={{ color: '#6f797a' }}>Tổng cọc hệ thống:</span><strong className="ktp-text-primary" style={{ fontSize: '18px' }}>11,000,000đ</strong></div>
                        <div className="ktp-warning-box"><Icon name="warning" /><span>Chỉ điều chỉnh khi có thỏa thuận đã được phê duyệt</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div><label className="ktp-mini-label ktp-text-primary">Số tiền xác nhận</label><input className="ktp-input-large" type="text" defaultValue="11,000,000" /></div>
                        <div><label className="ktp-mini-label">Ghi chú</label><textarea className="ktp-textarea" rows="2"></textarea></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '2px dashed #bec8c9', paddingTop: '16px' }}>
                    <div className="ktp-summary-box ktp-grid-3">
                      <div><p className="ktp-mini-label">Mã phiếu</p><p style={{ fontSize: '14px', fontStyle: 'italic', color: '#6f797a', margin: 0 }}>Tự động sinh sau khi lập</p></div>
                      <div><p className="ktp-mini-label">Hạn thanh toán</p><p className="ktp-text-error" style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>24h kể từ khi lập</p></div>
                      <div><p className="ktp-mini-label">Trạng thái sau lập</p><p style={{ fontSize: '14px', fontWeight: '700', color: '#a43c12', textTransform: 'uppercase', margin: 0 }}>Chờ thanh toán</p></div>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '11px', color: '#6f797a', marginTop: '12px' }}>
                      Thông báo sẽ được gửi tự động đến: <strong>Khách hàng</strong> & <strong>Nhân viên Sale</strong>
                    </p>
                  </div>
                </div>
                <div className="ktp-modal-footer">
                  <button className="ktp-btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                  <button className="ktp-btn-submit" onClick={() => setModalType(null)}>Lập phiếu đặt cọc</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
