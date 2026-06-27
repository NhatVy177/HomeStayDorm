import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

const AssetRow = ({ asset }) => {
  const [status, setStatus] = useState(asset.currentStatus);
  const isNormal = status === 'Bình thường';
  
  const selectBorder = isNormal ? '#137333' : '#ba1a1a';
  const selectColor = isNormal ? '#137333' : '#ba1a1a';
  const inputBorder = isNormal ? '#e1e3e4' : '#ba1a1a';
  const inputColor = isNormal ? '#3f494a' : '#ba1a1a';
  
  return (
    <tr style={{ borderBottom: '1px solid #e1e3e4', backgroundColor: isNormal ? 'transparent' : '#fffbfa' }}>
      <td style={{ padding: '12px 8px', fontSize: '14px', color: '#3f494a' }}>{asset.id}</td>
      <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#191c1d' }}>{asset.name}</td>
      <td style={{ padding: '12px 8px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>{asset.qty}</td>
      <td style={{ padding: '12px 8px' }}>
        <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Bình thường</span>
      </td>
      <td style={{ padding: '12px 8px' }}>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '8px', border: `1px solid ${selectBorder}`, borderRadius: '4px', fontSize: '14px', color: selectColor, width: '100%', outline: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
        >
          <option>Bình thường</option>
          <option>Hư hỏng nhẹ</option>
          <option>Hư hỏng nặng</option>
        </select>
      </td>
      <td style={{ padding: '12px 8px' }}>
        <input type="text" defaultValue={asset.note} placeholder="Nhập ghi chú..." style={{ width: '100%', padding: '8px', border: `1px solid ${inputBorder}`, borderRadius: '4px', fontSize: '14px', outline: 'none', color: inputColor, backgroundColor: 'transparent' }} />
      </td>
      <td style={{ padding: '12px 8px' }}>
        <input type="text" defaultValue={asset.cost} style={{ width: '100%', padding: '8px', border: `1px solid ${inputBorder}`, borderRadius: '4px', fontSize: '14px', color: inputColor, outline: 'none', backgroundColor: 'transparent', fontWeight: isNormal ? 'normal' : '600' }} />
      </td>
    </tr>
  );
};

export default function LapBienBanKiemTraPhongTab() {
  const [modalType, setModalType] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('cho-lap-bien-ban');
  const [showDetailModal, setShowDetailModal] = useState(false);

  const initialAssets = [
    { id: 'TS001', name: 'Giường tầng', qty: 1, currentStatus: 'Bình thường', note: '', cost: '0đ' },
    { id: 'TS004', name: 'Máy lạnh', qty: 1, currentStatus: 'Hư hỏng nặng', note: 'Bể vỏ nhựa, không lên', cost: '800.000đ' },
    { id: 'TS005', name: 'Bàn học', qty: 2, currentStatus: 'Hư hỏng nhẹ', note: 'Gãy 1 chân bàn, trầy xước', cost: '500.000đ' },
  ];

  return (
    <div className="ktp-container">
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e1e3e4', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveSubTab('cho-lap-bien-ban')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeSubTab === 'cho-lap-bien-ban' ? '2px solid #3b8280' : '2px solid transparent', color: activeSubTab === 'cho-lap-bien-ban' ? '#3b8280' : '#6f797a', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          Chờ lập biên bản
        </button>
        <button 
          onClick={() => setActiveSubTab('cho-xac-nhan-quyet-toan')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeSubTab === 'cho-xac-nhan-quyet-toan' ? '2px solid #3b8280' : '2px solid transparent', color: activeSubTab === 'cho-xac-nhan-quyet-toan' ? '#3b8280' : '#6f797a', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          Chờ xác nhận quyết toán
        </button>
        <button 
          onClick={() => setActiveSubTab('lich-su')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeSubTab === 'lich-su' ? '2px solid #3b8280' : '2px solid transparent', color: activeSubTab === 'lich-su' ? '#3b8280' : '#6f797a', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          Đã xử lý / Lịch sử
        </button>
      </div>

      {activeSubTab === 'cho-lap-bien-ban' && (
        <>
          {/* Filter Section */}
      <section className="ktp-filter-section">
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Trạng thái</label>
          <select className="ktp-input">
            <option>Tất cả</option>
            <option>Chờ xử lý</option>
            <option>Đã xử lý</option>
          </select>
        </div>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Khu vực</label>
          <select className="ktp-input">
            <option>Tất cả khu vực</option>
            <option>Chi nhánh Q1</option>
            <option>Chi nhánh Q7</option>
          </select>
        </div>
        <div className="ktp-filter-group" style={{ justifyContent: 'flex-end', flexGrow: 1 }}>
          <div className="ktp-input-icon-wrap" style={{ width: '100%', maxWidth: '350px' }}>
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input className="ktp-input ktp-input-with-icon" type="text" placeholder="Tìm mã phiếu, khách..." style={{ width: '100%' }} />
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Mã HĐ</th>
              <th>Khách hàng</th>
              <th>Phòng/Giường</th>
              <th>Ngày yêu cầu</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PTP001</td>
              <td>HDT001</td>
              <td>Nguyễn Minh Anh</td>
              <td>P.203 - G1, G2</td>
              <td>20/06/2026</td>
              <td className="text-center">
                <span className="ktp-badge ktp-badge-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>Chờ xử lý</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('create')}>Lập biên bản</button>
              </td>
            </tr>
            <tr style={{ backgroundColor: 'rgba(46, 125, 50, 0.05)' }}>
              <td>PTP002</td>
              <td>HDT045</td>
              <td>Trần Văn Cường</td>
              <td>P.105 - G4</td>
              <td>21/06/2026</td>
              <td className="text-center">
                <span className="ktp-badge ktp-badge-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>Chờ xử lý</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" onClick={() => setModalType('create')}>Lập biên bản</button>
              </td>
            </tr>
            <tr style={{ opacity: 0.7 }}>
              <td>PTP003</td>
              <td>HDT089</td>
              <td>Lê Thị Thảo</td>
              <td>P.304 - G1</td>
              <td>19/06/2026</td>
              <td className="text-center">
                <span className="ktp-badge ktp-badge-outline" style={{ backgroundColor: '#e2e3e5', color: '#383d41', borderColor: '#d6d8db' }}>Đã xử lý</span>
              </td>
              <td className="text-center">
                <button className="ktp-btn-action-fill" style={{ backgroundColor: '#mint-mist', color: '#004c52', border: '1px solid #004c52' }} onClick={() => setModalType('detail')}>Chi tiết</button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="ktp-pagination">
          <button className="ktp-page-btn"><Icon name="chevron_left" /></button>
          <button className="ktp-page-btn is-active">1</button>
          <button className="ktp-page-btn">2</button>
          <button className="ktp-page-btn"><Icon name="chevron_right" /></button>
        </div>
      </section>
        </>
      )}

      {activeSubTab === 'cho-xac-nhan-quyet-toan' && (
        <section className="ktp-table-section">
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu trả phòng</th>
                <th>Mã hợp đồng</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Tổng tiền khấu trừ</th>
                <th>Số tiền hoàn/thu thêm</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PTP004</td>
                <td>HDT012</td>
                <td>Lê Gia Hân</td>
                <td>P.102 - G2</td>
                <td style={{ color: '#ba1a1a', fontWeight: '500' }}>800.000đ</td>
                <td style={{ color: '#137333', fontWeight: '500' }}>Hoàn: 2.200.000đ</td>
                <td className="text-center">
                  <span className="ktp-badge ktp-badge-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>Chờ xác nhận</span>
                </td>
                <td className="text-center" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button className="ktp-btn-action-fill" style={{ backgroundColor: '#00666d', color: '#ffffff' }} onClick={() => setModalType('quyet-toan')}>Xử lý</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {activeSubTab === 'lich-su' && (
        <section className="ktp-table-section">
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu trả phòng</th>
                <th>Mã hợp đồng</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Tổng tiền khấu trừ</th>
                <th>Số tiền hoàn/thu thêm</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PTP005</td>
                <td>HDT022</td>
                <td>Trần Mai Phương</td>
                <td>P.402</td>
                <td style={{ color: '#ba1a1a', fontWeight: '500' }}>0đ</td>
                <td style={{ color: '#137333', fontWeight: '500' }}>Hoàn: 3.000.000đ</td>
                <td className="text-center">
                  <span className="ktp-badge ktp-badge-outline" style={{ backgroundColor: '#e2e3e5', color: '#383d41', borderColor: '#d6d8db' }}>Đã xử lý</span>
                </td>
                <td className="text-center">
                  <button className="ktp-btn-action-fill" onClick={() => setModalType('detail-quyet-toan')} style={{ backgroundColor: '#00666d', color: '#ffffff', border: 'none' }}>Xem chi tiết</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Modal Overlay */}
      {modalType && modalType !== 'quyet-toan' && modalType !== 'detail-quyet-toan' && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" style={{ maxWidth: '900px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>
                  {modalType === 'create' ? 'Lập biên bản kiểm tra trả phòng' : 'Chi tiết biên bản kiểm tra'}
                </h3>
                <span style={{ backgroundColor: '#ffffff', color: '#93000a', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>Chờ xử lý</span>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
              
              {/* Form Info Section */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ngày kiểm tra</label>
                  <input type="text" defaultValue="21/06/2024" readOnly style={{ width: '250px', padding: '10px 12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', color: '#3f494a', fontSize: '14px' }} />
                </div>
                <div style={{ marginBottom: '0' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Tình trạng phòng thực tế (Mô tả chung)</label>
                  <textarea rows="3" placeholder="Nhập đánh giá tổng quan về vệ sinh, mùi, hư hỏng kết cấu chung..." style={{ width: '100%', padding: '12px', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block' }}></textarea>
                </div>
              </div>

              {/* Asset List Section */}
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 12px 0' }}>Danh mục tài sản kiểm tra</h4>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f3f4f5', borderBottom: '1px solid #e1e3e4' }}>
                      <tr>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a' }}>Mã TS</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '120px' }}>Tên tài sản</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', textAlign: 'center' }}>SL</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '100px' }}>TT Bàn giao</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '140px' }}>TT Hiện tại</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a' }}>Ghi chú chi tiết</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '120px' }}>Chi phí bồi thường</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialAssets.map((asset) => (
                        <AssetRow key={asset.id} asset={asset} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setModalType(null)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Lưu nháp</button>
                {modalType === 'create' && <button className="ktp-btn-action-fill" onClick={() => setModalType(null)} style={{ padding: '10px 24px' }}>Xác nhận lưu biên bản</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quyết Toán */}
      {(modalType === 'quyet-toan' || modalType === 'detail-quyet-toan') && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" style={{ maxWidth: '900px', width: '95%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>
                  {modalType === 'quyet-toan' ? 'Xử lý quyết toán trả phòng' : 'Chi tiết quyết toán trả phòng'}
                </h3>
                {modalType === 'quyet-toan' ? (
                  <span style={{ backgroundColor: '#ffffff', color: '#856404', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>Chờ NVQL xác nhận</span>
                ) : (
                  <span style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600', border: '1px solid #d6d8db' }}>Đã xử lý</span>
                )}
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* 1. Thông tin phiếu trả phòng */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: '0 0 16px 0', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px' }}>1. Thông tin phiếu trả phòng</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Mã phiếu trả phòng:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>PTP004</span></div>
                      <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Khách hàng:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>Lê Gia Hân</span></div>
                      <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Phòng/Giường:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>P.102 - G2</span></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '120px' }}>Mã hợp đồng:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>HDT012</span></div>
                      <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '120px' }}>SĐT:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>09xxxx</span></div>
                      <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '120px' }}>Ngày trả phòng:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>20/06/2026</span></div>
                    </div>
                  </div>
                </div>

                {/* 2. Thông tin biên bản kiểm tra phòng */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 16px 0', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: 0 }}>2. Thông tin biên bản kiểm tra phòng</h4>
                    <button onClick={() => setShowDetailModal(true)} style={{ backgroundColor: '#00666d', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Xem biên bản kiểm tra</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '160px' }}>Mã biên bản kiểm tra:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>BBKT004</span></div>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '160px' }}>Ngày kiểm tra:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>20/06/2026</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Người kiểm tra:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>Đặng Song Toàn</span></div>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Tình trạng phòng:</span><span style={{ fontWeight: '600', color: '#ba1a1a', fontSize: '14px' }}>Có hư hỏng nhẹ</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '160px' }}>Ghi chú bàn giao:</span><span style={{ fontWeight: '500', color: '#191c1d', fontSize: '14px' }}>Hỏng ổ khóa tủ, cần vệ sinh lại</span></div>
                    <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '160px' }}>Ảnh minh chứng:</span><a href="#" style={{ fontWeight: '600', color: '#00666d', fontSize: '14px', textDecoration: 'underline' }}>Xem ảnh</a></div>
                  </div>
                </div>

                {/* 3. Thông tin đối soát của kế toán */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: '0 0 16px 0', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px' }}>3. Thông tin đối soát của kế toán</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '150px' }}>Mã phiếu quyết toán:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>QT004</span></div>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '150px' }}>Ngày lập đối soát:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>21/06/2026</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Kế toán đối soát:</span><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>Nguyễn Thị Mai</span></div>
                        <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '140px' }}>Trạng thái:</span><span style={{ fontWeight: '600', color: '#856404', fontSize: '14px' }}>Chờ NVQL xác nhận</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex' }}><span style={{ color: '#6f797a', fontSize: '14px', width: '150px' }}>Ghi chú kế toán:</span><span style={{ fontWeight: '500', color: '#191c1d', fontSize: '14px' }}>Đã đối chiếu tiền cọc và các khoản khấu trừ từ biên bản kiểm tra.</span></div>
                  </div>
                </div>

                {/* 4. Bảng khoản khấu trừ */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e4', backgroundColor: '#f8f9fa' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: 0 }}>4. Bảng khoản khấu trừ</h4>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f3f4f5', borderBottom: '1px solid #e1e3e4' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', textAlign: 'left' }}>Khoản khấu trừ</th>
                        <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', textAlign: 'left' }}>Nguồn</th>
                        <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', textAlign: 'left' }}>Số tiền</th>
                        <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', textAlign: 'left' }}>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e1e3e4' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#191c1d', fontWeight: '500' }}>Sửa ổ khóa tủ</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6f797a' }}>Biên bản kiểm tra</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ba1a1a', fontWeight: '600', textAlign: 'left' }}>500.000đ</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a' }}>Hư ổ khóa</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e1e3e4' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#191c1d', fontWeight: '500' }}>Phí vệ sinh</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6f797a' }}>Biên bản kiểm tra</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ba1a1a', fontWeight: '600', textAlign: 'left' }}>100.000đ</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a' }}>Phòng chưa sạch</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#191c1d', fontWeight: '500' }}>Điện nước còn lại</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6f797a' }}>Hệ thống/Kế toán</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ba1a1a', fontWeight: '600', textAlign: 'left' }}>200.000đ</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a' }}>Theo chỉ số cuối</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ padding: '16px', borderTop: '1px solid #e1e3e4', backgroundColor: '#fffbfa', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#191c1d' }}>Tổng tiền khấu trừ:</span>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#ba1a1a' }}>800.000đ</span>
                  </div>
                </div>

                {/* 5. Kết quả quyết toán */}
                <div style={{ backgroundColor: '#e6f4ea', border: '1px solid #ceead6', borderRadius: '8px', padding: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#137333', margin: '0 0 16px 0' }}>5. Kết quả quyết toán</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: '#191c1d' }}>Tiền cọc ban đầu:</span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#191c1d' }}>3.000.000đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', color: '#191c1d' }}>Tổng tiền khấu trừ:</span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#ba1a1a' }}>800.000đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ceead6', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#137333' }}>Số tiền hoàn cho khách:</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#137333' }}>2.200.000đ</span>
                    </div>
                  </div>
                </div>

                {/* 6. Ghi chú xác nhận của NVQL */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: '0 0 16px 0' }}>{modalType === 'quyet-toan' ? '6. Ghi chú / Yêu cầu điều chỉnh' : '6. Ghi chú xác nhận'}</h4>
                  <div style={{ marginBottom: '16px' }}>
                    {modalType === 'quyet-toan' ? (
                      <>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ghi chú xác nhận (nếu đồng ý) hoặc Lý do yêu cầu điều chỉnh (bắt buộc nếu từ chối)</label>
                        <textarea rows="3" placeholder="Ví dụ: Đã kiểm tra, khoản khấu trừ đúng với biên bản kiểm tra phòng. HOẶC Phí sửa ổ khóa chưa đúng với chi phí thực tế..." style={{ width: '100%', padding: '12px', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block', boxSizing: 'border-box' }}></textarea>
                      </>
                    ) : (
                      <>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Nội dung ghi chú</label>
                        <textarea rows="3" value="Đã kiểm tra, khoản khấu trừ đúng với biên bản." readOnly style={{ width: '100%', padding: '12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block', boxSizing: 'border-box', outline: 'none' }}></textarea>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
            
            {/* 7. Footer */}
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', color: '#3f494a', padding: '10px 16px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                {modalType === 'quyet-toan' && (
                  <>
                    <button onClick={() => setModalType(null)} style={{ backgroundColor: '#ffffff', border: '1px solid #ba1a1a', color: '#ba1a1a', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Yêu cầu điều chỉnh</button>
                    <button className="ktp-btn-action-fill" onClick={() => setModalType(null)} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b8280' }}>
                      <Icon name="check_circle" /> Xác nhận quyết toán
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested Detail Modal Overlay */}
      {showDetailModal && (
        <div className="ktp-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowDetailModal(false)}>
          <div className="ktp-modal" style={{ maxWidth: '900px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>
                  Chi tiết biên bản kiểm tra phòng
                </h3>
                <span style={{ backgroundColor: '#ffffff', color: '#137333', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>Đã kiểm tra</span>
              </div>
              <button className="ktp-modal-close" onClick={() => setShowDetailModal(false)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
              
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ngày kiểm tra</label>
                  <input type="text" value="20/06/2026" readOnly style={{ width: '250px', padding: '10px 12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', color: '#3f494a', fontSize: '14px', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: '0' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Tình trạng phòng thực tế (Mô tả chung)</label>
                  <textarea rows="3" value="Hỏng ổ khóa tủ, cần vệ sinh lại." readOnly style={{ width: '100%', padding: '12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block', boxSizing: 'border-box', outline: 'none' }}></textarea>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 12px 0' }}>Danh mục tài sản kiểm tra</h4>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f3f4f5', borderBottom: '1px solid #e1e3e4' }}>
                      <tr>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a' }}>Mã TS</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '120px' }}>Tên tài sản</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', textAlign: 'center' }}>SL</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '100px' }}>TT Bàn giao</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '140px' }}>TT Hiện tại</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a' }}>Ghi chú chi tiết</th>
                        <th style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '600', color: '#3f494a', width: '120px' }}>Chi phí bồi thường</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialAssets.map((asset) => (
                        <tr key={asset.id} style={{ borderBottom: '1px solid #e1e3e4', backgroundColor: asset.currentStatus === 'Bình thường' ? 'transparent' : '#fffbfa' }}>
                          <td style={{ padding: '12px 8px', fontSize: '14px', color: '#3f494a' }}>{asset.id}</td>
                          <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '600', color: '#191c1d' }}>{asset.name}</td>
                          <td style={{ padding: '12px 8px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>{asset.qty}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ backgroundColor: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>Bình thường</span>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', backgroundColor: asset.currentStatus === 'Bình thường' ? '#e6f4ea' : '#fce8e6', color: asset.currentStatus === 'Bình thường' ? '#137333' : '#c5221f' }}>{asset.currentStatus}</span>
                          </td>
                          <td style={{ padding: '12px 8px', fontSize: '14px', color: '#3f494a' }}>{asset.note || '-'}</td>
                          <td style={{ padding: '12px 8px', fontSize: '14px', color: asset.cost === '0đ' ? '#3f494a' : '#c5221f', fontWeight: asset.cost === '0đ' ? 'normal' : '600' }}>{asset.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <button onClick={() => setShowDetailModal(false)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
