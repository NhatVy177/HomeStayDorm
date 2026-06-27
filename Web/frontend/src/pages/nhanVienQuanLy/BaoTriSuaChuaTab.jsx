import React, { useState } from 'react';
import '../nhanVienKeToan/nhanVienKeToanPortal.css'; // Use existing styles
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

export default function BaoTriSuaChuaTab() {
  const [activeSubTab, setActiveSubTab] = useState('cho-tiep-nhan');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [resultType, setResultType] = useState('bao-tri-thong-thuong');
  
  // Danh sách hư hỏng động
  const [dsHuHong, setDsHuHong] = useState([
    { id: 1, taiSan: '', moTa: '', chiPhi: '', loiDoKhach: false }
  ]);

  const subTabs = [
    { id: 'cho-tiep-nhan', label: 'Chờ tiếp nhận' },
    { id: 'dang-xu-ly', label: 'Đang xử lý' },
    { id: 'hoan-tat', label: 'Hoàn tất' },
    { id: 'tu-choi', label: 'Từ chối / Lịch sử' }
  ];

  const mockData = [
    { id: 'YC001', khachHang: 'Lê Gia Hân', phong: 'P.102 - G2', sdt: '0988776655', hopDong: 'HDT012', loai: 'Hỏng ổ khóa', ngayGui: '20/06/2026', mucDo: 'Bình thường', trangThai: 'Chờ tiếp nhận', noiDung: 'Ổ khóa tủ bị hỏng, không khóa được.' },
    { id: 'YC002', khachHang: 'Nguyễn Văn A', phong: 'P.205 - G1', sdt: '0977665544', hopDong: 'HDT015', loai: 'Mất nước', ngayGui: '21/06/2026', mucDo: 'Khẩn cấp', trangThai: 'Đang xử lý', noiDung: 'Phòng không có nước sinh hoạt từ sáng.' },
    { id: 'YC003', khachHang: 'Trần Thị B', phong: 'P.301 - G4', sdt: '0966554433', hopDong: 'HDT020', loai: 'Hỏng đèn', ngayGui: '18/06/2026', mucDo: 'Bình thường', trangThai: 'Hoàn tất', noiDung: 'Bóng đèn nhà vệ sinh bị cháy đen.' },
    { id: 'YC004', khachHang: 'Lê Hữu C', phong: 'P.105 - G1', sdt: '0955443322', hopDong: 'HDT005', loai: 'Khác', ngayGui: '15/06/2026', mucDo: 'Bình thường', trangThai: 'Từ chối', noiDung: 'Xin thêm một cái gối và mền mới.' },
  ];

  const getFilteredData = () => {
    switch(activeSubTab) {
      case 'cho-tiep-nhan': return mockData.filter(i => i.trangThai === 'Chờ tiếp nhận');
      case 'dang-xu-ly': return mockData.filter(i => i.trangThai === 'Đang xử lý');
      case 'hoan-tat': return mockData.filter(i => i.trangThai === 'Hoàn tất');
      case 'tu-choi': return mockData.filter(i => i.trangThai === 'Từ chối');
      default: return [];
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Chờ tiếp nhận': return <span style={{ backgroundColor: '#fff8e1', color: '#ff8f00', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>CHỜ TIẾP NHẬN</span>;
      case 'Đang xử lý': return <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>ĐANG XỬ LÝ</span>;
      case 'Hoàn tất': return <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>HOÀN TẤT</span>;
      case 'Từ chối': return <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>TỪ CHỐI</span>;
      default: return null;
    }
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setResultType('bao-tri-thong-thuong');
    setDsHuHong([{ id: 1, taiSan: '', moTa: '', chiPhi: '', loiDoKhach: false }]);
    setShowDetailModal(true);
  };

  const themHuHong = () => {
    setDsHuHong([...dsHuHong, { id: Date.now(), taiSan: '', moTa: '', chiPhi: '', loiDoKhach: false }]);
  };

  return (
    <div className="ktp-container">

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e1e3e4', marginBottom: '40px', marginTop: '16px' }}>
        {subTabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{ 
              padding: '12px 16px', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeSubTab === tab.id ? '2px solid #3b8280' : '2px solid transparent', 
              color: activeSubTab === tab.id ? '#3b8280' : '#6f797a', 
              fontWeight: '600', 
              fontSize: '15px', 
              cursor: 'pointer', 
              transition: 'all 0.2s' 
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ktp-content">
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e3e4', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '0', overflow: 'hidden', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase' }}>Mã YC</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase' }}>Khách hàng</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase' }}>Phòng/Giường</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase' }}>Loại yêu cầu</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Ngày gửi</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredData().length > 0 ? getFilteredData().map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: idx === getFilteredData().length - 1 ? 'none' : '1px solid #e1e3e4' }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#191c1d' }}>{item.id}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#3f494a' }}>{item.khachHang}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#3f494a' }}>{item.phong}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#3f494a' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px', color: item.mucDo === 'Khẩn cấp' ? '#c62828' : '#6f797a', display: 'flex' }}>
                          <Icon name={item.mucDo === 'Khẩn cấp' ? 'warning' : 'build'} />
                        </span>
                        {item.loai}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>{item.ngayGui}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>{getStatusBadge(item.trangThai)}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button 
                        className="ktp-btn-action-fill"
                        onClick={() => handleOpenDetail(item)}
                        style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#528581', color: '#ffffff', border: 'none' }}
                      >
                        Xử lý
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#6f797a' }}>Không có yêu cầu nào ở trạng thái này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL CENTERED */}
      {showDetailModal && selectedItem && (
        <div className="ktp-modal-overlay" onClick={() => setShowDetailModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="ktp-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '900px', maxWidth: '95%', maxHeight: '90vh', backgroundColor: '#f8f9fa', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRadius: '12px', animation: 'fadeIn 0.2s forwards' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', backgroundColor: '#3b8280', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Chi tiết yêu cầu bảo trì: {selectedItem.id}</h3>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>Mức độ: {selectedItem.mucDo}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex' }}>
                <span style={{ display: 'flex', fontSize: '28px' }}><Icon name="close" /></span>
              </button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
              
              {/* 1. Thông tin yêu cầu & 2. Thông tin khách thuê */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Yêu cầu */}
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e1e3e4' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#191c1d', borderBottom: '1px solid #e1e3e4', paddingBottom: '8px' }}>1. Thông tin yêu cầu</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
                    <span style={{ color: '#6f797a' }}>Mã yêu cầu:</span> <strong>{selectedItem.id}</strong>
                    <span style={{ color: '#6f797a' }}>Ngày gửi:</span> <strong>{selectedItem.ngayGui}</strong>
                    <span style={{ color: '#6f797a' }}>Trạng thái:</span> <div>{getStatusBadge(selectedItem.trangThai)}</div>
                    <span style={{ color: '#6f797a' }}>Loại yêu cầu:</span> <strong>{selectedItem.loai}</strong>
                    <span style={{ color: '#6f797a' }}>Mức độ:</span> <strong style={{ color: selectedItem.mucDo === 'Khẩn cấp' ? '#c62828' : 'inherit' }}>{selectedItem.mucDo}</strong>
                  </div>
                </div>

                {/* Khách hàng */}
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e1e3e4' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#191c1d', borderBottom: '1px solid #e1e3e4', paddingBottom: '8px' }}>2. Thông tin khách thuê</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
                    <span style={{ color: '#6f797a' }}>Khách hàng:</span> <strong>{selectedItem.khachHang}</strong>
                    <span style={{ color: '#6f797a' }}>SĐT:</span> <strong>{selectedItem.sdt}</strong>
                    <span style={{ color: '#6f797a' }}>Mã hợp đồng:</span> <strong>{selectedItem.hopDong}</strong>
                    <span style={{ color: '#6f797a' }}>Phòng/Giường:</span> <strong>{selectedItem.phong}</strong>
                  </div>
                </div>
              </div>

              {/* 3. Nội dung khách báo */}
              <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e1e3e4' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#191c1d' }}>3. Nội dung khách báo</h4>
                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e1e3e4' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#3f494a', lineHeight: '1.5' }}>"{selectedItem.noiDung}"</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#e1e3e4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f797a', cursor: 'pointer', fontSize: '24px' }}>
                      <Icon name="image" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Thông tin tiếp nhận (Nếu đang xử lý hoặc hoàn tất) */}
              {(selectedItem.trangThai === 'Đang xử lý' || selectedItem.trangThai === 'Hoàn tất') && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e1e3e4' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#191c1d' }}>4. Thông tin tiếp nhận</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
                    <span style={{ color: '#6f797a' }}>Người tiếp nhận:</span> <strong>Đặng Song Toàn (NV Quản lý)</strong>
                    <span style={{ color: '#6f797a' }}>Ngày tiếp nhận:</span> <strong>21/06/2026 08:30</strong>
                  </div>
                </div>
              )}

              {/* 5. Kết quả xử lý (Cho phép chỉnh sửa nếu Đang xử lý, chỉ xem nếu Hoàn tất) */}
              {selectedItem.trangThai === 'Đang xử lý' && (
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e1e3e4', borderLeft: '4px solid #00666d' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#00666d' }}>5. Cập nhật kết quả xử lý</h4>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Loại kết quả *</label>
                    <select 
                      value={resultType}
                      onChange={(e) => setResultType(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #bec8c9', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}
                    >
                      <option value="bao-tri-thong-thuong">Bảo trì thông thường (Không phí)</option>
                      <option value="hu-hong-tinh-phi">Có hư hỏng cần tính phí / đền bù</option>
                      <option value="tu-choi">Từ chối xử lý</option>
                    </select>
                  </div>

                  {/* Form Bảo trì thông thường */}
                  {resultType === 'bao-tri-thong-thuong' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ghi chú xử lý</label>
                        <textarea rows="3" placeholder="Ví dụ: Đã thay pin cửa, thay bóng đèn..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #bec8c9', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ngày hoàn tất</label>
                          <input type="date" defaultValue="2026-06-21" style={{ width: '100%', padding: '10px 12px', border: '1px solid #bec8c9', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ảnh sau xử lý (Nếu có)</label>
                          <button style={{ padding: '10px 16px', backgroundColor: '#edeeef', border: '1px dashed #bec8c9', borderRadius: '6px', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#3f494a', fontWeight: '600' }}>
                            <span style={{ display: 'flex', fontSize: '20px' }}><Icon name="upload" /></span> Tải ảnh lên
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Có hư hỏng tính phí */}
                  {resultType === 'hu-hong-tinh-phi' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px', border: '1px solid #ffcc80' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h5 style={{ margin: 0, fontSize: '15px', color: '#ff8f00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'flex', fontSize: '20px' }}><Icon name="warning" /></span> 6. Chi tiết hư hỏng cần đền bù
                        </h5>
                        <button onClick={themHuHong} style={{ background: 'none', border: 'none', color: '#00666d', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ display: 'flex', fontSize: '18px' }}><Icon name="add_circle" /></span> Thêm tài sản
                        </button>
                      </div>

                      {dsHuHong.map((hh, index) => (
                        <div key={hh.id} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '6px', border: '1px solid #e1e3e4', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '14px' }}>Mục hư hỏng #{index + 1}</strong>
                            {index > 0 && <span style={{ color: '#c62828', cursor: 'pointer', display: 'flex', fontSize: '20px' }} onClick={() => setDsHuHong(dsHuHong.filter(item => item.id !== hh.id))}><Icon name="delete" /></span>}
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Tài sản / Khu vực</label>
                              <input type="text" placeholder="VD: Ổ khóa tủ" style={{ width: '100%', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '4px', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Chi phí bồi thường (VNĐ)</label>
                              <input type="text" placeholder="VD: 150,000" style={{ width: '100%', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '4px', boxSizing: 'border-box', textAlign: 'right' }} />
                            </div>
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Mô tả thiệt hại</label>
                            <input type="text" placeholder="VD: Bị bẻ cong, gãy chìa bên trong..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '4px', boxSizing: 'border-box' }} />
                          </div>

                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={hh.loiDoKhach} 
                                onChange={(e) => {
                                  const newList = [...dsHuHong];
                                  newList[index].loiDoKhach = e.target.checked;
                                  setDsHuHong(newList);
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                              />
                              <strong>Lỗi do khách hàng gây ra</strong>
                            </label>

                            {hh.loiDoKhach ? (
                              <span style={{ fontSize: '12px', backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Sẽ khấu trừ vào tiền cọc</span>
                            ) : (
                              <span style={{ fontSize: '12px', backgroundColor: '#edeeef', color: '#6f797a', padding: '4px 8px', borderRadius: '4px' }}>Bảo trì nội bộ</span>
                            )}
                          </div>
                        </div>
                      ))}

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Tổng kết ghi chú</label>
                        <textarea rows="2" style={{ width: '100%', padding: '10px 12px', border: '1px solid #bec8c9', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                      </div>
                    </div>
                  )}

                  {/* Form Từ chối */}
                  {resultType === 'tu-choi' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#c62828', marginBottom: '8px' }}>Lý do từ chối xử lý *</label>
                      <textarea rows="3" placeholder="Nhập lý do từ chối (bắt buộc)..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #ffcdd2', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: '#fff5f5' }}></textarea>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Footer / Buttons */}
            <div style={{ padding: '24px 32px', backgroundColor: '#ffffff', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', gap: '16px', position: 'sticky', bottom: 0 }}>
              
              {selectedItem.trangThai === 'Chờ tiếp nhận' && (
                <>
                  <button onClick={() => setShowDetailModal(false)} style={{ backgroundColor: '#ffffff', color: '#c62828', border: '1px solid #c62828', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Từ chối</button>
                  <button onClick={() => { alert('Đã tiếp nhận yêu cầu!'); setShowDetailModal(false); }} className="ktp-btn-action-fill" style={{ backgroundColor: '#3b8280', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', fontSize: '20px' }}><Icon name="assignment_turned_in" /></span> Tiếp nhận xử lý
                  </button>
                </>
              )}

              {selectedItem.trangThai === 'Đang xử lý' && (
                <>
                  <button onClick={() => setShowDetailModal(false)} style={{ backgroundColor: '#ffffff', color: '#3f494a', border: '1px solid #e1e3e4', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                  <button 
                    onClick={() => { alert('Đã cập nhật kết quả xử lý!'); setShowDetailModal(false); }} 
                    className="ktp-btn-action-fill" 
                    style={{ backgroundColor: resultType === 'tu-choi' ? '#c62828' : '#3b8280', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span style={{ display: 'flex', fontSize: '20px' }}><Icon name={resultType === 'tu-choi' ? 'cancel' : 'check_circle'} /></span> 
                    {resultType === 'tu-choi' ? 'Lưu Từ chối' : 'Hoàn tất bảo trì'}
                  </button>
                </>
              )}

              {(selectedItem.trangThai === 'Hoàn tất' || selectedItem.trangThai === 'Từ chối') && (
                <button onClick={() => setShowDetailModal(false)} style={{ backgroundColor: '#edeeef', color: '#191c1d', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Adding animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

    </div>
  );
}
