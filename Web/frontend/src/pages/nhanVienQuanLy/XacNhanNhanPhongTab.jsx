import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

export default function XacNhanNhanPhongTab() {
  const [modalType, setModalType] = useState(null); // 'xu-ly' or null
  const [decision, setDecision] = useState('tu-choi'); // 'xac-nhan' or 'tu-choi'
  return (
    <div className="ktp-container">

      {/* Filter Section */}
      <section className="ktp-filter-section ktp-info-box-outline" style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '16px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
        <div className="ktp-filter-group" style={{ flex: 1, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Hình thức thuê</label>
          <select className="ktp-input" style={{ width: '100%' }}>
            <option>Tất cả hình thức</option>
            <option>Thuê nguyên phòng</option>
            <option>Thuê ghép/giường</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ flex: 1, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Trạng thái</label>
          <select className="ktp-input" style={{ width: '100%' }}>
            <option selected>Chờ xác nhận</option>
            <option>Đã chấp nhận</option>
            <option>Đã từ chối</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ flex: 2, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Tìm kiếm</label>
          <div className="ktp-input-icon-wrap">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input className="ktp-input ktp-input-with-icon" type="text" placeholder="Tìm mã phiếu, tên khách..." style={{ width: '100%' }} />
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Khách hàng</th>
              <th>Hình thức thuê</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDK001</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Nguyễn Minh Anh</p>
              </td>
              <td style={{ fontSize: '14px', color: '#414753' }}>Thuê nguyên phòng</td>
              <td className="text-center">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(0, 102, 109, 0.1)', color: '#00666d', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase' }}>
                  Chờ xác nhận
                </span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDK002</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Lê Gia Hân</p>
              </td>
              <td style={{ fontSize: '14px', color: '#414753' }}>Thuê ghép/thuê theo giường</td>
              <td className="text-center">
                <span className="ktp-badge-warning">Chờ xác nhận cọc</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDK003</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Trần Văn Cường</p>
              </td>
              <td style={{ fontSize: '14px', color: '#414753' }}>Thuê nguyên phòng</td>
              <td className="text-center">
                <span className="ktp-badge-warning">Chờ xác nhận cọc</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="ktp-pagination">
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>Hiển thị 1-3 của 12 yêu cầu</span>
          <button className="ktp-page-btn"><Icon name="chevron_left" /></button>
          <button className="ktp-page-btn is-active">1</button>
          <button className="ktp-page-btn"><Icon name="chevron_right" /></button>
        </div>
      </section>

      {/* Modal Overlay */}
      {modalType === 'xu-ly' && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Chi tiết phiếu đăng ký</h3>
                <span style={{ backgroundColor: '#ffdbcf', color: '#a43c12', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>Chờ xác nhận cọc</span>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                  <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name="person" /> THÔNG TIN KHÁCH HÀNG</h4>
                  <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Họ và tên</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>Nguyễn Minh Anh</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Số điện thoại</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>0901 234 567</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Số CMND/CCCD</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>012345678901</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Email</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>minhanh.nguyen@example.com</p></div>
                  </div>
                </div>
                
                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                  <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name="description" /> THÔNG TIN ĐĂNG KÝ</h4>
                  <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Mã phiếu</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>PDK001</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Ngày gửi yêu cầu</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>24/05/2024</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Thời hạn thuê dự kiến</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>06 tháng</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Hình thức thuê</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>Nguyên phòng</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Số người dự kiến ở</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>01</p></div>
                  </div>
                </div>
                
                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                  <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name="home" /> THÔNG TIN PHÒNG</h4>
                  <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Chi nhánh</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>CN Quận 7 - Đường số 4</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Mã phòng</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>P.203</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a', textTransform: 'none' }}>Hình thức thuê (Nguyên phòng/Ghép giường)</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>Nguyên phòng</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Tiện ích bao gồm</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>Máy lạnh, Tủ lạnh, WC riêng</p></div>
                    <div>
                      <p className="ktp-mini-label" style={{ color: '#6f797a' }}>Trạng thái phòng/giường hiện tại</p>
                      <span style={{ display: 'inline-block', border: '1px solid #86d3da', color: '#00666d', backgroundColor: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>Còn trống</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e1e3e4', marginTop: '16px', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#191c1d', marginBottom: '24px' }}>Quyết định của quản lý</h3>
                
                <div className="ktp-grid-2" style={{ marginBottom: '24px' }}>
                  <div 
                    onClick={() => setDecision('xac-nhan')}
                    style={{ padding: '20px', borderRadius: '8px', border: decision === 'xac-nhan' ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'xac-nhan' ? '#f5feff' : '#ffffff' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'xac-nhan' ? '6px solid #00666d' : '2px solid #bec8c9' }}></div>
                    <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '15px' }}>Xác nhận nhận cọc</span>
                  </div>
                  <div 
                    onClick={() => setDecision('tu-choi')}
                    style={{ padding: '20px', borderRadius: '8px', border: decision === 'tu-choi' ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'tu-choi' ? '#f5feff' : '#ffffff' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'tu-choi' ? '6px solid #00666d' : '2px solid #bec8c9' }}></div>
                    <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '15px' }}>Từ chối nhận cọc</span>
                  </div>
                </div>
                
                {decision === 'tu-choi' && (
                  <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '24px' }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#191c1d', marginBottom: '12px', fontSize: '14px' }}>Lý do từ chối <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <textarea 
                      style={{ width: '100%', border: '1px solid #bec8c9', borderRadius: '8px', padding: '16px', fontSize: '14px', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
                      placeholder="Hiện tại phòng P.203 đã được khách khác cọc trước đó 30 phút."
                    ></textarea>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6f797a', fontSize: '12px', marginTop: '12px' }}>
                      <Icon name="info" />
                      <span>Lý do từ chối sẽ được gửi cho nhân viên sale để thông báo lại cho khách hàng.</span>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
            
            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#ffffff', padding: '16px 32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="ktp-btn-cancel" onClick={() => setModalType(null)} style={{ border: '1px solid #bec8c9' }}>Đóng</button>
              <button className="ktp-btn-submit" onClick={() => setModalType(null)}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
