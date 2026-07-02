import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

import KiemTraTraPhong from './KiemTraTraPhong.jsx';
import XacNhanPhanHoi from './XacNhanPhanHoi.jsx';
import ThanhLyTraPhong from './thanhlytraphong.jsx';
import CapNhatTraPhong from './capnhattraphong.jsx';

export default function XuLyTraPhongTab() {
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
          Kiểm tra trả phòng
        </button>
        <button 
          onClick={() => setActiveSubTab('xu-ly-phan-hoi')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeSubTab === 'xu-ly-phan-hoi' ? '2px solid #3b8280' : '2px solid transparent', color: activeSubTab === 'xu-ly-phan-hoi' ? '#3b8280' : '#6f797a', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          Xử lý phản hồi
        </button>
        <button 
          onClick={() => setActiveSubTab('thanh-ly-tra-phong')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeSubTab === 'thanh-ly-tra-phong' ? '2px solid #3b8280' : '2px solid transparent', color: activeSubTab === 'thanh-ly-tra-phong' ? '#3b8280' : '#6f797a', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          Thanh lý trả phòng
        </button>
        <button 
          onClick={() => setActiveSubTab('cap-nhat-hoan-tat')}
          style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeSubTab === 'cap-nhat-hoan-tat' ? '2px solid #3b8280' : '2px solid transparent', color: activeSubTab === 'cap-nhat-hoan-tat' ? '#3b8280' : '#6f797a', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>
          Cập nhật hoàn tất
        </button>
      </div>

      {activeSubTab === 'cho-lap-bien-ban' && <KiemTraTraPhong />}
      {activeSubTab === 'xu-ly-phan-hoi' && <XacNhanPhanHoi />}
      {activeSubTab === 'thanh-ly-tra-phong' && <ThanhLyTraPhong />}
      {activeSubTab === 'cap-nhat-hoan-tat' && <CapNhatTraPhong />}

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
