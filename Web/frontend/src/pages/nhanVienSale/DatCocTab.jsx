import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

const mockYeuCau = [
  { id: 'DC-2024-045', customer: 'Lê Minh Tuấn', phone: '0912 345 678', room: 'P.402 - G.01', area: 'Quận 7', status: 'Chờ xác nhận cọc' },
  { id: 'DC-2024-042', customer: 'Trần Thị Hoa', phone: '0987 654 321', room: 'P.105 - G.03', area: 'Thủ Đức', status: 'Chờ xác nhận cọc' },
  { id: 'DC-2024-041', customer: 'Nguyễn An', phone: '0905 667 888', room: 'P.501', area: 'Quận 1', status: 'Chờ xác nhận cọc' }
];

const mockChungTu = [
  { id: '#PC240105', customer: 'Nguyễn Hoàng Nam', phone: '0987 654 321', room: 'P.402-G1', amount: '1.000.000đ', deadline: '20/10/2023 14:30', countdown: '05:42:08', status: 'CHỜ TT', docStatus: 'Chưa có' },
  { id: '#PC240106', customer: 'Lê Thị Minh Anh', phone: '0355 123 456', room: 'P.105-G4', amount: '1.200.000đ', deadline: '21/10/2023 09:00', countdown: '24:12:03', status: 'CHỜ TT', docStatus: 'Không hợp lệ' },
  { id: '#PC240107', customer: 'Trần Văn Đức', phone: '0765 888 999', room: 'P.301-G2', amount: '850.000đ', deadline: '19/10/2023 20:00', countdown: 'Quá hạn', status: 'QUÁ HẠN', docStatus: 'Chưa có' }
];

export default function DatCocTab() {
  const [activeSubTab, setActiveSubTab] = useState('gui-yeu-cau');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="ktp-container">
      {/* Title removed per request */}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e0e3e3', marginBottom: '24px' }}>
        <div 
          onClick={() => setActiveSubTab('gui-yeu-cau')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'gui-yeu-cau' ? '600' : '500', color: activeSubTab === 'gui-yeu-cau' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'gui-yeu-cau' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Gửi yêu cầu đặt cọc
        </div>
        <div 
          onClick={() => setActiveSubTab('ghi-nhan-chung-tu')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'ghi-nhan-chung-tu' ? '600' : '500', color: activeSubTab === 'ghi-nhan-chung-tu' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'ghi-nhan-chung-tu' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Ghi nhận chứng từ thanh toán
        </div>
      </div>

      {activeSubTab === 'gui-yeu-cau' && (
        <section>
          <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Ngày đăng ký</label>
              <input type="date" className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Khu vực</label>
              <select className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }}>
                <option>Tất cả khu vực</option>
              </select>
            </div>

          </div>

          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Phòng/Giường</th>
                <th>Khu vực</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockYeuCau.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.id}</td>
                  <td style={{ color: '#191c1d' }}>{item.customer}</td>
                  <td style={{ color: '#191c1d' }}>{item.phone}</td>
                  <td style={{ color: '#191c1d' }}>{item.room}</td>
                  <td style={{ color: '#191c1d' }}>{item.area}</td>
                  <td className="text-center">
                    <span className="ktp-badge ktp-badge-warning">{item.status}</span>
                  </td>
                  <td className="text-center">
                    <button className="ktp-btn-action-fill" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => { setSelectedItem(item); setShowSendModal(true); }}>
                      Gửi yêu cầu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#6f797a' }}>Hiển thị {mockYeuCau.length} trên {mockYeuCau.length} phiếu</div>
        </section>
      )}

      {activeSubTab === 'ghi-nhan-chung-tu' && (
        <section>
          <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>TRẠNG THÁI PHIẾU CỌC</label>
                <select className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }}>
                  <option>Tất cả</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>HẠN THANH TOÁN</label>
                <input type="date" className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>KHÁCH HÀNG / SĐT</label>
                <input type="text" placeholder="Tên hoặc SĐT..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>TRẠNG THÁI CHỨNG TỪ</label>
                <select className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }}>
                  <option>Tất cả</option>
                </select>
              </div>
            </div>
            <div>
              <button className="ktp-btn-action-fill" style={{ backgroundColor: '#2f6765', padding: '6px 16px', fontSize: '13px' }}>
                <Icon name="search" /> Tìm kiếm
              </button>
            </div>
          </div>

          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu cọc</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Cần thanh toán</th>
                <th>Hạn & Đếm ngược</th>
                <th className="text-center">Trạng thái</th>
                <th>Chứng từ</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {mockChungTu.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.id}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#191c1d' }}>{item.customer}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.phone}</div>
                  </td>
                  <td>
                    <div style={{ backgroundColor: '#e0e3e3', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '12px', fontWeight: '600' }}>{item.room}</div>
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#191c1d' }}>{item.amount}</td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#3f494a' }}>{item.deadline}</div>
                    <div style={{ fontSize: '12px', color: '#b3261e', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                      <Icon name="schedule" style={{ fontSize: '14px' }} /> {item.countdown}
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`ktp-badge ${item.status === 'QUÁ HẠN' ? 'ktp-badge-danger' : 'ktp-badge-warning'}`} style={item.status === 'QUÁ HẠN' ? { backgroundColor: '#ffebee', color: '#c62828' } : {}}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: item.docStatus === 'Không hợp lệ' ? '#b3261e' : '#6f797a' }}>
                      <Icon name={item.docStatus === 'Không hợp lệ' ? 'error_outline' : (item.docStatus === 'Chưa có' ? 'description' : 'check_circle')} style={{ fontSize: '16px' }} />
                      {item.docStatus}
                    </div>
                  </td>
                  <td className="text-center">
                    <button className="ktp-btn-action-fill" style={{ backgroundColor: '#9b4922', padding: '6px 12px', fontSize: '12px' }} onClick={() => { setSelectedItem(item); setShowUploadModal(true); }}>
                      Ghi nhận chứng từ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#6f797a' }}>Hiển thị {mockChungTu.length} trên {mockChungTu.length} kết quả</div>
        </section>
      )}

      {/* Modal Xác nhận gửi yêu cầu đặt cọc */}
      {showSendModal && selectedItem && (
        <div className="ktp-modal-overlay">
          <div className="ktp-modal" style={{ maxWidth: '450px' }}>
            <div className="ktp-modal-header" style={{ borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="forward_to_inbox" style={{ color: '#2f6765' }} />
                <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Xác nhận gửi yêu cầu đặt cọc</h3>
              </div>
              <button className="ktp-btn-close" onClick={() => setShowSendModal(false)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#3f494a', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn gửi yêu cầu đặt cọc cho hồ sơ này không? Thông tin sẽ được chuyển đến bộ phận Kế toán để xử lý.
              </p>
              
              <div style={{ backgroundColor: '#f4f7f7', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Mã hồ sơ:</span>
                  <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{selectedItem.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Khách hàng:</span>
                  <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{selectedItem.customer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Phòng/Giường:</span>
                  <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{selectedItem.room}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <button className="ktp-btn-action" onClick={() => setShowSendModal(false)} style={{ flex: 1, justifyContent: 'center', border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a' }}>Hủy</button>
                <button className="ktp-btn-action-fill" onClick={() => { setShowSendModal(false); alert('Đã gửi yêu cầu đặt cọc'); }} style={{ flex: 1, justifyContent: 'center' }}>
                  <Icon name="send" /> Xác nhận gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ghi nhận chứng từ thanh toán */}
      {showUploadModal && selectedItem && (
        <div className="ktp-modal-overlay">
          <div className="ktp-modal" style={{ maxWidth: '700px' }}>
            <div className="ktp-modal-header" style={{ paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="check_circle" style={{ color: '#2f6765' }} />
                <h3 style={{ margin: 0, color: '#2f6765', fontSize: '16px' }}>Ghi nhận chứng từ thanh toán</h3>
              </div>
              <button className="ktp-btn-close" onClick={() => setShowUploadModal(false)}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ paddingTop: '16px' }}>
              {/* Banner Info */}
              <div style={{ display: 'flex', backgroundColor: '#eaf4f4', borderRadius: '8px', padding: '16px', border: '1px solid #cce4e4', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#3f494a', fontSize: '13px', marginBottom: '4px' }}>Mã phiếu cọc</div>
                  <div style={{ fontWeight: 'bold', color: '#2f6765' }}>{selectedItem.id}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#3f494a', fontSize: '13px', marginBottom: '4px' }}>Khách hàng</div>
                  <div style={{ fontWeight: 'bold', color: '#2f6765' }}>{selectedItem.customer}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#3f494a', fontSize: '13px', marginBottom: '4px' }}>Số tiền cần nộp</div>
                  <div style={{ fontWeight: 'bold', color: '#b3261e' }}>{selectedItem.amount}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* Upload zone */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Chứng từ thanh toán (Hình ảnh/PDF)</label>
                  <div style={{ border: '2px dashed #c4c7c8', borderRadius: '8px', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfdfd', cursor: 'pointer' }}>
                    <div style={{ backgroundColor: '#eaf4f4', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                      <Icon name="cloud_upload" style={{ color: '#2f6765', fontSize: '28px' }} />
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#2f6765', fontSize: '14px', marginBottom: '4px' }}>Kéo thả file vào đây</div>
                    <div style={{ color: '#6f797a', fontSize: '12px' }}>Hoặc nhấp để chọn từ máy tính</div>
                  </div>
                  {/* File preview mock */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#edeeef', padding: '12px 16px', borderRadius: '6px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#191c1d' }}>
                      <Icon name="image" style={{ color: '#2f6765' }} />
                      chung_tu_bank.jpg
                    </div>
                    <Icon name="delete" style={{ color: '#b3261e', cursor: 'pointer', fontSize: '18px' }} />
                  </div>
                </div>
                
                {/* Form fields */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#3f494a', marginBottom: '6px' }}>Mã giao dịch</label>
                      <input type="text" className="ktp-input" defaultValue="FT2405012398" style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#3f494a', marginBottom: '6px' }}>Ngân hàng/Ví điện tử</label>
                      <select className="ktp-input" style={{ width: '100%' }}>
                        <option>Vietcombank</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#3f494a', marginBottom: '6px' }}>Ngày giờ thanh toán</label>
                      <input type="date" className="ktp-input" style={{ width: '100%', color: '#6f797a' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#3f494a', marginBottom: '6px' }}>Số tiền đã chuyển</label>
                      <input type="text" className="ktp-input" defaultValue="1.000.000" style={{ width: '100%', color: '#b3261e', fontWeight: 'bold' }} />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#3f494a', marginBottom: '6px' }}>Ghi chú</label>
                    <textarea className="ktp-input" placeholder="Nhập ghi chú thêm nếu có..." style={{ width: '100%', height: '80px', resize: 'none' }}></textarea>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ktp-modal-footer" style={{ borderTop: 'none', paddingTop: '8px', paddingBottom: '24px', paddingRight: '24px' }}>
              <button className="ktp-btn-action" onClick={() => setShowUploadModal(false)} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a' }}>Hủy</button>
              <button className="ktp-btn-action-fill" onClick={() => { setShowUploadModal(false); alert('Đã ghi nhận chứng từ thành công'); }}>
                <Icon name="send" /> Gửi chứng từ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
