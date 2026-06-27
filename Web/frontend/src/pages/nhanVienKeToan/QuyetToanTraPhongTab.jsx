import React, { useState } from 'react';
import { Icon } from './LapPhieuDatCocTab.jsx';

export default function QuyetToanTraPhongTab() {
  const [modalType, setModalType] = useState(null); // 'hoan-coc', 'thu-them', 'khong-doi', null

  return (
    <div className="ktp-container">
      {/* Filter Section */}
      <section className="ktp-filter-section ktp-info-box-outline" style={{ marginBottom: '24px', backgroundColor: '#ffffff', padding: '16px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
        <div className="ktp-filter-group" style={{ flex: 1, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Kỳ thanh toán</label>
          <select className="ktp-input" style={{ width: '100%' }}>
            <option>Tháng 10/2023</option>
            <option selected>Tháng 11/2023</option>
            <option>Tháng 12/2023</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ flex: 1, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Trạng thái</label>
          <select className="ktp-input" style={{ width: '100%' }}>
            <option selected>Tất cả trạng thái</option>
            <option>Chờ đối soát</option>
            <option>Đã quyết toán</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ flex: 2, margin: 0 }}>
          <label className="ktp-filter-label" style={{ marginBottom: '8px', display: 'block' }}>Tìm kiếm</label>
          <div className="ktp-input-icon-wrap">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input className="ktp-input ktp-input-with-icon" type="text" placeholder="Tìm mã phiếu, khách hàng..." style={{ width: '100%' }} />
          </div>
        </div>
        <div className="ktp-filter-group" style={{ margin: 0 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#00666d', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', height: '42px' }}>
            <Icon name="filter_list" />
            Lọc kết quả
          </button>
        </div>
      </section>

      {/* Table Section */}
      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Khách hàng</th>
              <th>Phòng</th>
              <th>Ngày trả thực tế</th>
              <th>Trạng thái</th>
              <th className="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#191c1d' }}>CO-202310-045</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Nguyễn Văn A</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>0901234567</p>
              </td>
              <td><span style={{ backgroundColor: '#edeeef', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>P.302 - Cơ sở 1</span></td>
              <td style={{ fontSize: '14px', color: '#414753' }}>24/10/2023</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(164, 60, 18, 0.1)', color: '#a43c12', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase', border: '1px solid rgba(164, 60, 18, 0.2)' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#a43c12', borderRadius: '50%' }}></span>
                  Chờ đối soát
                </span>
              </td>
              <td className="text-right">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('hoan-coc')}>
                  Xử lý
                </button>
              </td>
            </tr>
            <tr>
              <td><span style={{ fontWeight: '700', color: '#191c1d' }}>CO-202310-052</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Lê Văn C</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>0987654321</p>
              </td>
              <td><span style={{ backgroundColor: '#edeeef', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>P.405 - Cơ sở 1</span></td>
              <td style={{ fontSize: '14px', color: '#414753' }}>25/10/2023</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(164, 60, 18, 0.1)', color: '#a43c12', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase', border: '1px solid rgba(164, 60, 18, 0.2)' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#a43c12', borderRadius: '50%' }}></span>
                  Chờ đối soát
                </span>
              </td>
              <td className="text-right">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('thu-them')}>
                  Xử lý
                </button>
              </td>
            </tr>
            <tr style={{ opacity: 0.8 }}>
              <td><span style={{ fontWeight: '700', color: '#191c1d' }}>CO-202310-050</span></td>
              <td>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>Phạm Thị D</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>0987654321</p>
              </td>
              <td><span style={{ backgroundColor: '#edeeef', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>P.205 - Cơ sở 1</span></td>
              <td style={{ fontSize: '14px', color: '#414753' }}>20/10/2023</td>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'rgba(0, 102, 109, 0.1)', color: '#00666d', fontSize: '11px', fontWeight: '700', borderRadius: '999px', textTransform: 'uppercase', border: '1px solid rgba(0, 102, 109, 0.2)' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#00666d', borderRadius: '50%' }}></span>
                  Đã quyết toán
                </span>
              </td>
              <td className="text-right">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('khong-doi')}>Xem chi tiết</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="ktp-pagination">
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>Đang hiển thị 1-10 trên 42 kết quả</span>
          <button className="ktp-page-btn"><Icon name="chevron_left" /></button>
          <button className="ktp-page-btn is-active">1</button>
          <button className="ktp-page-btn">2</button>
          <button className="ktp-page-btn"><Icon name="chevron_right" /></button>
        </div>
      </section>

      {/* Modal Overlay - Center Modal */}
      {modalType && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Vẫn giữ tiêu đề màu xanh như user yêu cầu */}
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none' }}>
              <div>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>
                  {modalType === 'hoan-coc' ? 'Chi tiết quyết toán hoàn cọc' : modalType === 'thu-them' ? 'Chi tiết quyết toán - Thu thêm' : 'Chi tiết quyết toán'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  Mã phiếu: {modalType === 'hoan-coc' ? 'CO-202310-045' : modalType === 'thu-them' ? 'CO-202310-052' : 'CO-202310-050'}
                </p>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff' }}>
                <Icon name="close" />
              </button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '24px', backgroundColor: '#f8f9fa' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {modalType === 'khong-doi' && (
                  <div style={{ backgroundColor: '#dbe4e5', color: '#004f55', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                    <Icon name="info" /> Kết quả: Không hoàn cọc, không thu thêm
                  </div>
                )}

                {/* Customer Info */}
                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#ffffff' }}>
                  <h4 className="ktp-section-title" style={{ borderBottom: '1px solid #e1e3e4', paddingBottom: '12px', marginBottom: '16px' }}><Icon name="person" className="ktp-text-primary" /> Thông tin khách thuê & Hợp đồng</h4>
                  <div className="ktp-grid-2">
                    <div>
                      <p style={{ fontSize: '12px', color: '#6f797a', margin: '0 0 4px 0' }}>Khách hàng</p>
                      <p style={{ fontWeight: '600', color: '#191c1d', margin: 0 }}>
                        {modalType === 'hoan-coc' ? 'Nguyễn Văn A' : modalType === 'thu-them' ? 'Lê Văn C' : 'Phạm Thị D'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6f797a', margin: '0 0 4px 0' }}>Số điện thoại</p>
                      <p style={{ fontWeight: '600', color: '#191c1d', margin: 0 }}>
                        {modalType === 'hoan-coc' ? '0901234567' : '0987654321'}
                      </p>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#6f797a', margin: '0 0 4px 0' }}>Phòng</p>
                      <p style={{ fontWeight: '600', color: '#191c1d', margin: 0 }}>
                        {modalType === 'hoan-coc' ? 'P.302 - Cơ sở 1' : modalType === 'thu-them' ? 'P.405 - Cơ sở 1' : 'P.205 - Cơ sở 1'}
                      </p>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#6f797a', margin: '0 0 4px 0' }}>Hợp đồng</p>
                      <p style={{ fontWeight: '600', color: '#00666d', margin: 0 }}>
                        {modalType === 'hoan-coc' ? 'HD-202301-089' : 'HD-202305-112'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financials: Deposit */}
                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#ffffff' }}>
                  <h4 className="ktp-section-title" style={{ borderBottom: '1px solid #e1e3e4', paddingBottom: '12px', marginBottom: '16px' }}><Icon name="account_balance" className="ktp-text-primary" /> Thông tin cọc</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: '#414753' }}>Tiền cọc ban đầu</span>
                      <span style={{ fontWeight: '600', color: '#191c1d' }}>
                        {modalType === 'hoan-coc' ? '5.000.000đ' : modalType === 'thu-them' ? '3.000.000đ' : '2.000.000đ'}
                      </span>
                    </div>
                    {modalType !== 'khong-doi' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#414753' }}>Tỷ lệ hoàn cọc {modalType === 'thu-them' && '(Vi phạm HĐ)'}</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{modalType === 'hoan-coc' ? '100%' : '0%'}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed #e1e3e4', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#191c1d' }}>Số tiền cọc được hoàn</span>
                      <span style={{ fontWeight: '700', color: '#00666d', fontSize: '16px' }}>
                        {modalType === 'hoan-coc' ? '5.000.000đ' : modalType === 'thu-them' ? '0đ' : '2.000.000đ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="ktp-section" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(186, 26, 26, 0.3)', borderRadius: '12px', padding: '20px' }}>
                  <h4 className="ktp-section-title" style={{ color: '#ba1a1a', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px', marginBottom: '16px' }}><Icon name="money_off" /> Các khoản khấu trừ</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {modalType === 'hoan-coc' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#414753' }}>Tiền nhà còn nợ</span>
                          <span style={{ fontWeight: '600', color: '#191c1d' }}>- 0đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#414753' }}>Dịch vụ còn nợ (Điện, Nước)</span>
                          <span style={{ fontWeight: '600', color: '#ba1a1a' }}>- 350.000đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#414753' }}>Chi phí sửa chữa/mất mát</span>
                          <span style={{ fontWeight: '600', color: '#ba1a1a' }}>- 400.000đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed rgba(186, 26, 26, 0.2)', paddingTop: '12px', marginTop: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#191c1d' }}>Tổng khấu trừ</span>
                          <span style={{ fontWeight: '700', color: '#ba1a1a', fontSize: '16px' }}>750.000đ</span>
                        </div>
                      </>
                    )}

                    {modalType === 'thu-them' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#414753' }}>Tiền nhà còn nợ</span>
                          <span style={{ fontWeight: '600', color: '#ba1a1a' }}>- 1.200.000đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#414753' }}>Dịch vụ còn nợ (Điện, Nước)</span>
                          <span style={{ fontWeight: '600', color: '#ba1a1a' }}>- 300.000đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed rgba(186, 26, 26, 0.2)', paddingTop: '12px', marginTop: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#191c1d' }}>Tổng khấu trừ</span>
                          <span style={{ fontWeight: '700', color: '#ba1a1a', fontSize: '16px' }}>1.500.000đ</span>
                        </div>
                      </>
                    )}

                    {modalType === 'khong-doi' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                          <span style={{ color: '#414753' }}>Tổng các khoản nợ & vi phạm</span>
                          <span style={{ fontWeight: '600', color: '#ba1a1a' }}>- 2.000.000đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px dashed rgba(186, 26, 26, 0.2)', paddingTop: '12px', marginTop: '4px' }}>
                          <span style={{ fontWeight: '600', color: '#191c1d' }}>Tổng khấu trừ</span>
                          <span style={{ fontWeight: '700', color: '#ba1a1a', fontSize: '16px' }}>2.000.000đ</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Result Box */}
                {modalType === 'hoan-coc' && (
                  <div style={{ backgroundColor: '#dbe4e5', border: '1px solid #bfc8c9', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#151d1e', fontSize: '16px' }}>Số tiền hoàn thực tế</span>
                    <span style={{ fontWeight: '800', color: '#00666d', fontSize: '24px' }}>4.250.000đ</span>
                  </div>
                )}

                {modalType === 'thu-them' && (
                  <div style={{ backgroundColor: '#ffdad6', border: '1px solid rgba(186, 26, 26, 0.3)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#410002', fontSize: '16px' }}>Số tiền khách phải thanh toán thêm</span>
                    <span style={{ fontWeight: '800', color: '#ba1a1a', fontSize: '24px' }}>1.500.000đ</span>
                  </div>
                )}

                {modalType === 'khong-doi' && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, backgroundColor: '#edeeef', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#414753', fontWeight: '600' }}>HOÀN THỰC TẾ</p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#191c1d' }}>0đ</p>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#edeeef', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#414753', fontWeight: '600' }}>THU THÊM</p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#191c1d' }}>0đ</p>
                    </div>
                  </div>
                )}

              </div>

            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#ffffff', padding: '20px 24px', display: 'flex', gap: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setModalType(null)} style={{ flex: 1, border: '1px solid #c1c6d5' }}>
                {modalType === 'thu-them' ? 'Hủy bỏ' : 'In phiếu'}
              </button>
              
              {modalType === 'hoan-coc' && (
                <button className="ktp-btn-submit" onClick={() => setModalType(null)} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name="check_circle" /> Xác nhận hoàn cọc
                </button>
              )}

              {modalType === 'thu-them' && (
                <button className="ktp-btn-submit" onClick={() => setModalType(null)} style={{ flex: 2, backgroundColor: '#822800', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name="receipt_long" /> Xác nhận thu thêm
                </button>
              )}

              {modalType === 'khong-doi' && (
                <button className="ktp-btn-submit" onClick={() => setModalType(null)} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Icon name="check_circle" /> Xác nhận quyết toán
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
