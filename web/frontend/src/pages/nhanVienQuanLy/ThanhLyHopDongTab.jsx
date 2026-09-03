import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

export default function ThanhLyHopDongTab() {
  const [modalType, setModalType] = useState(null);

  const tableData = [
    { maPhieu: 'PTP001', maHD: 'HDT001', khachHang: 'Nguyễn Minh Anh', phongGiuong: 'P.203 - G1, G2', ngayTra: '20/06/2026' },
    { maPhieu: 'PTP002', maHD: 'HDT002', khachHang: 'Lê Gia Hân', phongGiuong: 'P.105 - G2', ngayTra: '20/06/2026' },
    { maPhieu: 'PTP003', maHD: 'HDT003', khachHang: 'Võ Quốc Bảo', phongGiuong: 'P.301 - G1', ngayTra: '20/06/2026' },
    { maPhieu: 'PTP004', maHD: 'HDT004', khachHang: 'Trần Mai Phương', phongGiuong: 'P.402', ngayTra: '20/06/2026' }
  ];

  return (
    <div className="ktp-container">
      {/* Filter Section */}
      <div className="ktp-filter" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        <div className="ktp-filter-group" style={{ flex: 1, maxWidth: '500px' }}>
          <label className="ktp-filter-label" style={{ fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px', display: 'block' }}>Tìm kiếm</label>
          <div className="ktp-input-icon-wrap" style={{ position: 'relative' }}>
            <span className="ktp-input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6f797a', display: 'flex' }}><Icon name="search" /></span>
            <input type="text" className="ktp-input ktp-input-with-icon" placeholder="Tìm theo mã phiếu trả phòng, mã hợp đồng hoặc tên khách hàng..." style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1px solid #e1e3e4', borderRadius: '8px', outline: 'none', color: '#191c1d', fontSize: '15px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="ktp-btn-cancel" style={{ padding: '10px 16px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', color: '#3f494a', cursor: 'pointer' }} title="Làm mới">
            <Icon name="refresh" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="ktp-table-container" style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '12px', overflow: 'hidden' }}>
        <table className="ktp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f3f4f5', borderBottom: '1px solid #e1e3e4' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#3f494a', whiteSpace: 'nowrap' }}>Mã phiếu trả phòng</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#3f494a', whiteSpace: 'nowrap' }}>Mã hợp đồng</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#3f494a', whiteSpace: 'nowrap' }}>Khách hàng</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#3f494a', whiteSpace: 'nowrap' }}>Phòng/Giường</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#3f494a', whiteSpace: 'nowrap' }}>Ngày trả thực tế</th>
              <th style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#3f494a', whiteSpace: 'nowrap', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e1e3e4', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '16px 24px', fontSize: '15px', color: '#191c1d', fontWeight: '600' }}>{row.maPhieu}</td>
                <td style={{ padding: '16px 24px', fontSize: '15px', color: '#3f494a' }}>{row.maHD}</td>
                <td style={{ padding: '16px 24px', fontSize: '15px', color: '#191c1d' }}>{row.khachHang}</td>
                <td style={{ padding: '16px 24px', fontSize: '15px', color: '#3f494a' }}>{row.phongGiuong}</td>
                <td style={{ padding: '16px 24px', fontSize: '15px', color: '#3f494a' }}>{row.ngayTra}</td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <button className="ktp-btn-action-fill" onClick={() => setModalType('thanh-ly')} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    Thanh lý hợp đồng
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', backgroundColor: '#f3f4f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#3f494a' }}>Hiển thị 1-4 trong 5 kết quả</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={{ padding: '4px', borderRadius: '4px', color: '#6f797a', background: 'transparent', border: 'none', cursor: 'not-allowed', display: 'flex' }} disabled>
              <Icon name="chevron_left" />
            </button>
            <button style={{ padding: '4px 12px', borderRadius: '4px', backgroundColor: '#ffffff', border: '1px solid #e1e3e4', color: '#191c1d', fontSize: '14px', fontWeight: '600' }}>1</button>
            <button style={{ padding: '4px 12px', borderRadius: '4px', backgroundColor: 'transparent', border: 'none', color: '#3f494a', fontSize: '14px', cursor: 'pointer' }}>2</button>
            <button style={{ padding: '4px', borderRadius: '4px', color: '#3f494a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Thanh Ly Hop Dong */}
      {modalType === 'thanh-ly' && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" style={{ maxWidth: '1000px', width: '95%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Thanh lý hợp đồng thuê</h3>
                <span style={{ backgroundColor: '#ffffff', color: '#a43c12', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: '600' }}>Chờ thanh lý</span>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* 3 Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {/* Card 1 */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#3b8280', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="person" /> Khách thuê</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Họ tên:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>Nguyễn Minh Anh</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>SĐT:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>0901234567</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Hình thức:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>Thuê nguyên phòng</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Tình trạng:</span><span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#f3f4f5', color: '#6f797a', padding: '2px 8px', borderRadius: '4px' }}>Đang cư trú</span></div>
                  </div>
                </div>
                {/* Card 2 */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#3b8280', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="description" /> Hợp đồng</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Mã HĐ:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>HDT001</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Thời hạn:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>10/01/26 - 10/07/26</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Trạng thái HĐ:</span><span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#e6f4ea', color: '#137333', padding: '2px 8px', borderRadius: '4px' }}>Hiệu lực</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Phiếu đối soát:</span><span style={{ fontSize: '14px', fontWeight: '600', color: '#3b8280' }}>Đã hoàn tất</span></div>
                  </div>
                </div>
                {/* Card 3 */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#3b8280', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="bed" /> Phòng/Giường</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Khu vực:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>Bình Thạnh</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Mã phòng:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>P.203</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Giường:</span><span style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>G1, G2</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', color: '#6f797a' }}>Trạng thái phòng:</span><span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: '#f3f4f5', color: '#6f797a', padding: '2px 8px', borderRadius: '4px' }}>Đang thuê</span></div>
                  </div>
                </div>
              </div>

              {/* Biên bản bàn giao ra */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f3f4f5', padding: '12px 16px', borderBottom: '1px solid #e1e3e4' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: 0 }}>Biên bản bàn giao ra</h4>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6f797a', marginBottom: '8px' }}>Loại bàn giao</label>
                      <input type="text" readOnly defaultValue="Bàn giao ra" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', color: '#3f494a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6f797a', marginBottom: '8px' }}>Ngày bàn giao</label>
                      <input type="text" readOnly defaultValue="20/06/2026" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', color: '#3f494a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6f797a', marginBottom: '8px' }}>Người lập</label>
                      <input type="text" readOnly defaultValue="Trần Văn Quản Lý" style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f3f4f5', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', color: '#3f494a' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6f797a', marginBottom: '8px' }}>Ghi chú chung</label>
                    <textarea rows="3" placeholder="Nhập ghi chú chung cho đợt bàn giao..." style={{ width: '100%', padding: '12px', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block', boxSizing: 'border-box' }}></textarea>
                  </div>
                </div>
              </div>

              {/* Danh mục tài sản thu hồi */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f3f4f5', padding: '12px 16px', borderBottom: '1px solid #e1e3e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: 0 }}>Danh mục tài sản thu hồi</h4>
                  <span style={{ fontSize: '13px', color: '#6f797a' }}>Tổng: 3 loại tài sản</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ borderBottom: '1px solid #e1e3e4' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a' }}>Mã TS</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a' }}>Tên tài sản</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', textAlign: 'center' }}>SL Ban đầu</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', textAlign: 'center' }}>SL Thu hồi</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a' }}>Tình trạng</th>
                      <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#6f797a', width: '30%' }}>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e1e3e4' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a' }}>TS001</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>Chìa khóa phòng</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>2</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="number" defaultValue="2" style={{ width: '60px', padding: '6px', border: '1px solid #e1e3e4', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select style={{ padding: '6px 8px', border: '1px solid #e1e3e4', borderRadius: '4px', fontSize: '14px', color: '#3f494a', outline: 'none', backgroundColor: 'transparent' }}>
                          <option>Đủ</option>
                          <option>Thiếu</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input type="text" placeholder="Ghi chú..." style={{ width: '100%', padding: '6px 12px', border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#3f494a', outline: 'none' }} />
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e1e3e4', backgroundColor: '#fffbfa' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a' }}>TS002</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>Thẻ từ</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>2</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="number" defaultValue="1" style={{ width: '60px', padding: '6px', border: '1px solid #ba1a1a', borderRadius: '4px', textAlign: 'center', fontSize: '14px', color: '#ba1a1a', fontWeight: '600' }} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select style={{ padding: '6px 8px', border: '1px solid #ba1a1a', borderRadius: '4px', fontSize: '14px', color: '#ba1a1a', outline: 'none', backgroundColor: 'transparent' }}>
                          <option>Thiếu</option>
                          <option>Đủ</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input type="text" defaultValue="Khách làm mất 1 thẻ" style={{ width: '100%', padding: '6px 12px', border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#191c1d', outline: 'none', fontWeight: '500' }} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a' }}>TS003</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>Remote máy lạnh</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="number" defaultValue="1" style={{ width: '60px', padding: '6px', border: '1px solid #e1e3e4', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select style={{ padding: '6px 8px', border: '1px solid #e1e3e4', borderRadius: '4px', fontSize: '14px', color: '#3f494a', outline: 'none', backgroundColor: 'transparent' }}>
                          <option>Đủ</option>
                          <option>Thiếu</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input type="text" placeholder="Ghi chú..." style={{ width: '100%', padding: '6px 12px', border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#3f494a', outline: 'none' }} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </div>
            </div>
            
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => setModalType(null)} style={{ background: 'none', border: 'none', color: '#3f494a', padding: '10px 16px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                <button onClick={() => setModalType(null)} style={{ backgroundColor: '#ffffff', border: '1px solid #3b8280', color: '#3b8280', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Lưu nháp</button>
                <button className="ktp-btn-action-fill" onClick={() => setModalType(null)} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b8280' }}>
                  <Icon name="check_circle" /> Xác nhận hoàn tất thanh lý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
