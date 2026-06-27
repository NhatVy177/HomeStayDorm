import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

export default function XacNhanThanhToanTab() {
  const [modalType, setModalType] = useState(null); // 'xu-ly' or null
  const [decision, setDecision] = useState('xac-nhan'); // 'xac-nhan' or 'tu-choi'

  return (
    <div className="ktp-container">

      {/* Filter Section */}
      <section className="ktp-filter-section ktp-info-box-outline" style={{ backgroundColor: '#ffffff', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
        <div className="ktp-filter-group" style={{ flex: 1, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Phương thức TT</label>
          <select className="ktp-input" style={{ width: '100%' }}>
            <option>Tất cả phương thức</option>
            <option>Chuyển khoản</option>
            <option>Tiền mặt</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ flex: 1, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Trạng thái</label>
          <select className="ktp-input" style={{ width: '100%' }}>
            <option selected>Chờ xác nhận</option>
            <option>Đã xác nhận</option>
            <option>Từ chối</option>
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
              <th className="text-right">Số tiền đặt cọc</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDC001</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Nguyễn Minh Anh</p>
              </td>
              <td className="text-right" style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>4.500.000đ</td>
              <td className="text-center">
                <span className="ktp-badge-warning">Chờ TT</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDC002</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Lê Gia Hân</p>
              </td>
              <td className="text-right" style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>1.800.000đ</td>
              <td className="text-center">
                <span className="ktp-badge-warning">Chờ TT</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDC003</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Võ Quốc Bảo</p>
              </td>
              <td className="text-right" style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>1.500.000đ</td>
              <td className="text-center">
                <span className="ktp-badge-warning">Chờ TT</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#00666d' }}>PDC004</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Trần Mai Phương</p>
              </td>
              <td className="text-right" style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>3.800.000đ</td>
              <td className="text-center">
                <span className="ktp-badge-warning">Chờ TT</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('xu-ly')}>Xử lý</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="ktp-pagination">
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>Hiển thị 1-4 trong 8 kết quả</span>
          <button className="ktp-page-btn" disabled><Icon name="chevron_left" /></button>
          <button className="ktp-page-btn is-active">1</button>
          <button className="ktp-page-btn">2</button>
          <button className="ktp-page-btn"><Icon name="chevron_right" /></button>
        </div>
      </section>

      {/* Modal Overlay */}
      {modalType === 'xu-ly' && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '12px' }}>
            
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Chi tiết thanh toán cọc</h3>
                <span style={{ backgroundColor: '#ffdbcf', color: '#a43c12', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>Chờ TT</span>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Thông tin khách hàng */}
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="person" /> Thông tin khách hàng
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Họ tên:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Nguyễn Minh Anh</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Mã KH:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>KH001</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>SĐT:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>0901234567</span></div>
                    </div>
                  </div>

                  {/* Thông tin phiếu đặt cọc */}
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="receipt_long" /> Thông tin phiếu đặt cọc
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Mã phiếu:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>PDC001</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Phòng/Giường:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>P.203</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Số tiền cọc:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#fe7e50' }}>4.500.000đ</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Hạn thanh toán:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>03/06/2026</span></div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Thông tin chứng từ thanh toán */}
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0, border: '1px solid #86d3da', backgroundColor: '#f5feff' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="image" /> Thông tin chứng từ thanh toán
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <p style={{ color: '#6f797a', fontSize: '13px', margin: '0 0 4px 0' }}>Hình thức:</p>
                          <p style={{ fontWeight: '600', fontSize: '15px', color: '#191c1d', margin: 0 }}>Chuyển khoản</p>
                        </div>
                        <div>
                          <p style={{ color: '#6f797a', fontSize: '13px', margin: '0 0 4px 0' }}>Số tiền thực chuyển:</p>
                          <p style={{ fontWeight: '600', fontSize: '16px', color: '#fe7e50', margin: 0 }}>4.500.000đ</p>
                        </div>
                        <div>
                          <p style={{ color: '#6f797a', fontSize: '13px', margin: '0 0 4px 0' }}>Mã Giao dịch (Ghi chú):</p>
                          <p style={{ fontSize: '12px', color: '#191c1d', margin: 0, backgroundColor: '#edeeef', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontFamily: 'monospace' }}>PDC001 NGUYEN MINH ANH</p>
                        </div>
                      </div>
                      
                      <div style={{ width: '160px', height: '160px', backgroundColor: '#d9dadb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundImage: 'linear-gradient(135deg, #e5e5e5 0%, #c1c1c1 100%)' }}>
                        <span style={{ color: '#6f797a', fontWeight: '600', fontSize: '18px', opacity: 0.8 }}>Bill Transfer</span>
                      </div>
                    </div>
                  </div>

                  {/* Kết quả đối chiếu & Quyết định */}
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="fact_check" /> Kết quả đối chiếu & Quyết định
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div 
                        onClick={() => setDecision('xac-nhan')}
                        style={{ padding: '16px', borderRadius: '8px', border: decision === 'xac-nhan' ? '1px solid #3b8280' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'xac-nhan' ? '#eefafb' : '#ffffff' }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'xac-nhan' ? '6px solid #14595b' : '2px solid #bec8c9', flexShrink: 0 }}></div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px', display: 'block' }}>Xác nhận thanh toán hợp lệ</span>
                        </div>
                      </div>
                      
                      <div 
                        onClick={() => setDecision('tu-choi')}
                        style={{ padding: '16px', borderRadius: '8px', border: decision === 'tu-choi' ? '1px solid #3b8280' : '1px solid #bec8c9', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'tu-choi' ? '#eefafb' : '#ffffff' }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'tu-choi' ? '6px solid #14595b' : '2px solid #bec8c9', flexShrink: 0, marginTop: '2px' }}></div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px', display: 'block', marginBottom: '2px' }}>Từ chối xác nhận</span>
                          <span style={{ fontSize: '12px', color: '#6f797a' }}>Yêu cầu khách hàng kiểm tra lại hoặc cung cấp chứng từ khác.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#ffffff', padding: '16px 32px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setModalType(null)} style={{ border: '1px solid #bec8c9', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#191c1d', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
              <button className="ktp-btn-submit" onClick={() => setModalType(null)}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
