import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

export default function XacNhanNhanPhongTab() {
  const [modalType, setModalType] = useState(null);
  const [decision, setDecision] = useState('tu-choi');

  return (
    <div className="ktp-container">
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
          <select className="ktp-input" style={{ width: '100%' }} defaultValue="Chờ xác nhận">
            <option>Chờ xác nhận</option>
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
            {[
              ['PDK001', 'Nguyễn Minh Anh', 'Thuê nguyên phòng', 'Chờ xác nhận'],
              ['PDK002', 'Lê Gia Hân', 'Thuê ghép/thuê theo giường', 'Chờ xác nhận cọc'],
              ['PDK003', 'Trần Văn Cường', 'Thuê nguyên phòng', 'Chờ xác nhận cọc']
            ].map((row) => (
              <tr key={row[0]}>
                <td><span style={{ fontWeight: '700', color: '#00666d' }}>{row[0]}</span></td>
                <td><p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{row[1]}</p></td>
                <td style={{ fontSize: '14px', color: '#414753' }}>{row[2]}</td>
                <td className="text-center">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(0, 102, 109, 0.1)', color: '#00666d', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase' }}>
                    {row[3]}
                  </span>
                </td>
                <td className="text-center">
                  <button className="ktp-btn-action-fill" type="button" onClick={() => setModalType('xu-ly')}>Xử lý</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ktp-pagination">
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>Hiển thị 1-3 của 12 yêu cầu</span>
          <button className="ktp-page-btn" type="button"><Icon name="chevron_left" /></button>
          <button className="ktp-page-btn is-active" type="button">1</button>
          <button className="ktp-page-btn" type="button"><Icon name="chevron_right" /></button>
        </div>
      </section>

      {modalType === 'xu-ly' && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Chi tiết phiếu đăng ký</h3>
                <span style={{ backgroundColor: '#ffdbcf', color: '#a43c12', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>Chờ xác nhận cọc</span>
              </div>
              <button className="ktp-modal-close" type="button" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  ['person', 'THÔNG TIN KHÁCH HÀNG', [['Họ và tên', 'Nguyễn Minh Anh'], ['Số điện thoại', '0901 234 567'], ['Số CMND/CCCD', '012345678901'], ['Email', 'minhanh.nguyen@example.com']]],
                  ['description', 'THÔNG TIN ĐĂNG KÝ', [['Mã phiếu', 'PDK001'], ['Ngày gửi yêu cầu', '24/05/2024'], ['Thời hạn thuê dự kiến', '06 tháng'], ['Hình thức thuê', 'Nguyên phòng']]],
                  ['home', 'THÔNG TIN PHÒNG', [['Chi nhánh', 'CN Quận 7 - Đường số 4'], ['Mã phòng', 'P.203'], ['Hình thức thuê', 'Nguyên phòng'], ['Trạng thái phòng/giường hiện tại', 'Còn trống']]]
                ].map((section) => (
                  <div className="ktp-section ktp-info-box-outline" key={section[1]} style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                    <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name={section[0]} /> {section[1]}</h4>
                    <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                      {section[2].map((item) => (
                        <div key={item[0]}><p className="ktp-mini-label" style={{ color: '#6f797a' }}>{item[0]}</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{item[1]}</p></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #e1e3e4', marginTop: '16px', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#191c1d', marginBottom: '24px' }}>Quyết định của quản lý</h3>
                <div className="ktp-grid-2" style={{ marginBottom: '24px' }}>
                  {[
                    ['xac-nhan', 'Xác nhận nhận cọc'],
                    ['tu-choi', 'Từ chối nhận cọc']
                  ].map((item) => (
                    <div
                      key={item[0]}
                      onClick={() => setDecision(item[0])}
                      style={{ padding: '20px', borderRadius: '8px', border: decision === item[0] ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === item[0] ? '#f5feff' : '#ffffff' }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === item[0] ? '6px solid #00666d' : '2px solid #bec8c9' }} />
                      <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '15px' }}>{item[1]}</span>
                    </div>
                  ))}
                </div>
                {decision === 'tu-choi' && (
                  <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '24px' }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#191c1d', marginBottom: '12px', fontSize: '14px' }}>Lý do từ chối <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <textarea style={{ width: '100%', border: '1px solid #bec8c9', borderRadius: '8px', padding: '16px', fontSize: '14px', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }} placeholder="Hiện tại phòng P.203 đã được khách khác cọc trước đó 30 phút." />
                  </div>
                )}
              </div>
            </div>
            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#ffffff', padding: '16px 32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="ktp-btn-cancel" type="button" onClick={() => setModalType(null)} style={{ border: '1px solid #bec8c9' }}>Đóng</button>
              <button className="ktp-btn-submit" type="button" onClick={() => setModalType(null)}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
