import React, { useState } from 'react';
import { Icon } from './LapPhieuDatCocTab.jsx';

export default function HoaDonDinhKyTab() {
  const [modalType, setModalType] = useState(null); // 'chua-lap', 'da-lap', null

  return (
    <div className="ktp-container">
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: '#ffffff', border: '1px solid #bec8c9', borderRadius: '8px', padding: '4px' }}>
            <button style={{ padding: '8px 16px', backgroundColor: 'rgba(0, 102, 109, 0.05)', color: '#00666d', borderRadius: '6px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Theo phòng</button>
            <button style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#414753', border: 'none', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>Theo khách hàng</button>
          </div>
          <button style={{ backgroundColor: '#00666d', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0, 102, 109, 0.2)' }}>
            <Icon name="receipt_long" />
            Lập hóa đơn tất cả
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <section className="ktp-filter-section" style={{ marginBottom: '24px' }}>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Kỳ thanh toán</label>
          <select className="ktp-input">
            <option>Tháng 10/2023</option>
            <option selected>Tháng 11/2023</option>
            <option>Tháng 12/2023</option>
          </select>
        </div>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Trạng thái</label>
          <select className="ktp-input">
            <option>Tất cả</option>
            <option selected>Chưa lập hóa đơn</option>
            <option>Đã lập hóa đơn</option>
          </select>
        </div>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Chi nhánh / Tòa nhà</label>
          <select className="ktp-input">
            <option>Tất cả chi nhánh</option>
            <option>Cơ sở Quận 1</option>
            <option>Cơ sở Quận 7</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ justifyContent: 'flex-end' }}>
          <div className="ktp-input-icon-wrap">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input className="ktp-input ktp-input-with-icon" type="text" placeholder="Tìm kiếm mã hóa đơn..." />
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Phòng/Giường</th>
              <th>Khách hàng</th>
              <th>Kỳ thanh toán</th>
              <th>Tiền thuê</th>
              <th>Điện/Nước</th>
              <th>Dịch vụ khác</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {/* LƯU Ý MOCK DATA */}
            <tr>
              <td><span style={{ fontWeight: '700', color: '#191c1d' }}>P.302-A</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Trần Minh Tâm</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>0912345678</p>
              </td>
              <td style={{ fontSize: '14px' }}>10/2023</td>
              <td style={{ fontSize: '14px', fontWeight: '500' }}>2.500.000đ</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px dotted #717785', width: 'fit-content', cursor: 'help', fontSize: '14px' }} title="Điện (75kWh): 262.500đ | Nước (3m3): 45.000đ">
                  307.500đ
                  <Icon name="info" />
                </div>
              </td>
              <td style={{ fontSize: '14px' }}>300.000đ</td>
              <td style={{ fontSize: '14px', fontWeight: '700', color: '#00666d' }}>3.450.000đ</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#e1e3e4', color: '#414753', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#717785', borderRadius: '50%' }}></span>
                  Chưa lập
                </span>
              </td>
              <td className="text-right">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('chua-lap')}>Lập hóa đơn</button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#191c1d' }}>P.205-C</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Trần Thị Thu</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>0988776655</p>
              </td>
              <td style={{ fontSize: '14px' }}>11/2023</td>
              <td style={{ fontSize: '14px', fontWeight: '500' }}>5.200.000đ</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px dotted #717785', width: 'fit-content', cursor: 'help', fontSize: '14px' }}>
                  890.000đ
                  <Icon name="info" />
                </div>
              </td>
              <td style={{ fontSize: '14px' }}>250.000đ</td>
              <td style={{ fontSize: '14px', fontWeight: '700', color: '#00666d' }}>6.340.000đ</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(147, 246, 170, 0.3)', color: '#0f5223', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#0f5223', borderRadius: '50%' }}></span>
                  Đã lập
                </span>
              </td>
              <td className="text-right">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('da-lap')}>Xem chi tiết</button>
              </td>
            </tr>
            <tr style={{ opacity: 0.8 }}>
              <td><span style={{ fontWeight: '700', color: '#191c1d' }}>P.101-B</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Lê Hoàng Nam</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>0911223344</p>
              </td>
              <td style={{ fontSize: '14px' }}>11/2023</td>
              <td style={{ fontSize: '14px', fontWeight: '500' }}>3.200.000đ</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ba1a1a', fontSize: '14px' }}>
                  <Icon name="warning" />
                  Chưa có số
                </div>
              </td>
              <td style={{ fontSize: '14px' }}>50.000đ</td>
              <td style={{ fontSize: '14px', fontWeight: '700', color: '#414753', fontStyle: 'italic' }}>N/A</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(255, 218, 214, 0.5)', color: '#ba1a1a', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase' }}>
                  Thiếu dữ liệu
                </span>
              </td>
              <td className="text-right">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('da-lap')}>Xem chi tiết</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="ktp-pagination">
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>Đang hiển thị 1-10 trên 42 kết quả</span>
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
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>{modalType === 'chua-lap' ? 'Lập hóa đơn dịch vụ' : 'Chi tiết hóa đơn dịch vụ'}</h3>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}>
                <Icon name="close" />
              </button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '32px' }}>
              {/* Header Info Layout (2 cols) */}
              <div className="ktp-grid-2">
                <div className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="person" /> Thông tin khách hàng</h4>
                  <div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Họ tên:</span> <span className="ktp-info-value">Trần Minh Tâm</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">SĐT:</span> <span className="ktp-info-value">0912 345 678</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Email:</span> <span className="ktp-info-value">minhtam.t@gmail.com</span></div>
                  </div>
                </div>
                <div className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="description" /> Thông tin hợp đồng</h4>
                  <div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Phòng/Giường:</span> <span className="ktp-info-value" style={{ fontWeight: '700' }}>Phòng 402 - Giường A</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Kỳ thanh toán:</span> <span className="ktp-info-value" style={{ fontWeight: '700' }}>Tháng 10/2023</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Thời gian:</span> <span className="ktp-info-value" style={{ fontWeight: '700' }}>01/10 - 31/10/2023</span></div>
                  </div>
                </div>
              </div>
              
              <div className="ktp-section ktp-info-box-outline" style={{ marginTop: '16px' }}>
                <h4 className="ktp-section-title"><Icon name="calculate" /> Chi tiết tài chính</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Tiền thuê */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e1e3e4', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3f494a' }}>
                      <Icon name="home" />
                      <span style={{ fontWeight: '600', color: '#191c1d' }}>Tiền thuê phòng cố định</span>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#191c1d' }}>2.500.000đ</div>
                  </div>

                  {/* Tiền điện */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #e1e3e4', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#3f494a' }}>
                      <Icon name="bolt" />
                      <div>
                        <div style={{ fontWeight: '600', color: '#191c1d', marginBottom: '4px' }}>Tiền điện</div>
                        <div style={{ fontSize: '12px', color: '#6f797a' }}>Chỉ số: 1240 &rarr; 1315 (75 kWh @ 3.500đ)</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#191c1d' }}>262.500đ</div>
                  </div>

                  {/* Tiền nước */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #e1e3e4', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#3f494a' }}>
                      <Icon name="water_drop" />
                      <div>
                        <div style={{ fontWeight: '600', color: '#191c1d', marginBottom: '4px' }}>Tiền nước</div>
                        <div style={{ fontSize: '12px', color: '#6f797a' }}>Chỉ số: 45 &rarr; 48 (3 m³ @ 15.000đ)</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '16px', color: '#191c1d' }}>45.000đ</div>
                  </div>

                  {/* Dịch vụ khác */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#3f494a', flex: 1 }}>
                      <Icon name="bellhop_bell" />
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: '600', color: '#191c1d', marginBottom: '12px' }}>Dịch vụ khác</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#6f797a', width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Wifi (Cáp quang tốc độ cao)</span>
                            <span style={{ fontWeight: '600', color: '#191c1d' }}>100.000đ</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Gửi xe (B2-402)</span>
                            <span style={{ fontWeight: '600', color: '#191c1d' }}>150.000đ</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Vệ sinh chung</span>
                            <span style={{ fontWeight: '600', color: '#191c1d' }}>50.000đ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Total Box */}
              <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: '#191c1d', marginBottom: '4px' }}>Tổng số tiền cần thu</div>
                  <div style={{ fontSize: '12px', color: '#6f797a', fontStyle: 'italic' }}>Bằng chữ: Ba triệu bốn trăm năm mươi nghìn đồng chẵn.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#00666d', marginBottom: '8px' }}>3.450.000đ</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#ba1a1a' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#ba1a1a', borderRadius: '50%' }}></span>
                    {modalType === 'chua-lap' ? 'ĐANG CHỜ XỬ LÝ' : 'CHỜ THANH TOÁN'}
                  </div>
                </div>
              </div>

            </div>

            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" onClick={() => setModalType(null)}>Đóng</button>
              {modalType === 'chua-lap' && (
                <button className="ktp-btn-submit" onClick={() => setModalType(null)}>Xác nhận lập hóa đơn</button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
