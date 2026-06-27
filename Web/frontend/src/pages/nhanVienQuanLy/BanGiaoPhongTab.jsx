import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

export default function BanGiaoPhongTab() {
  const [isSearched, setIsSearched] = useState(false);

  return (
    <div className="ktp-container">

      <div className="ktp-section" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <label className="ktp-label">Mã hợp đồng cần bàn giao</label>
            <input type="text" className="ktp-input" placeholder="Nhập mã hợp đồng tại đây..." />
          </div>
          <button className="ktp-btn-submit" style={{ padding: '10px 24px', whiteSpace: 'nowrap' }} onClick={() => setIsSearched(true)}>Kiểm tra hợp đồng</button>
        </div>
        <p style={{ margin: '12px 0 0 0', color: '#6f797a', fontSize: '13px' }}>
          Hệ thống sẽ kiểm tra hợp đồng hiệu lực, hóa đơn kỳ đầu đã thanh toán và chưa có biên bản bàn giao vào.
        </p>
      </div>

      {isSearched && (
        <>
          <div className="ktp-grid-3" style={{ marginBottom: '24px' }}>
        <div className="ktp-section" style={{ marginBottom: 0, padding: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#191c1d', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px', marginBottom: '16px' }}>
            <Icon name="description" /> Thông tin hợp đồng
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Mã HĐ:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>HDT001</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6f797a', fontSize: '13px' }}>Trạng thái:</span> 
              <span style={{ backgroundColor: '#f6feff', color: '#004c52', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', border: '1px solid #86d3da' }}>Hiệu lực</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Ngày bắt đầu:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>10/06/2026</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Thời hạn:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>6 tháng</span></div>
          </div>
        </div>

        <div className="ktp-section" style={{ marginBottom: 0, padding: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#191c1d', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px', marginBottom: '16px' }}>
            <Icon name="person" /> Thông tin khách thuê
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Họ tên:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Nguyễn Minh Anh</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>SĐT:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>0901234567</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Số người ở:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>2 người</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6f797a', fontSize: '13px' }}>Trạng thái:</span> 
              <span style={{ backgroundColor: '#e7e8e9', color: '#3f494a', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>Chờ nhận phòng</span>
            </div>
          </div>
        </div>

        <div className="ktp-section" style={{ marginBottom: 0, padding: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#191c1d', borderBottom: '1px solid #e1e3e4', paddingBottom: '12px', marginBottom: '16px' }}>
            <Icon name="bed" /> Thông tin phòng/giường
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Chi nhánh:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>Bình Thạnh</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Phòng:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>P.203</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '13px' }}>Giường:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>G1, G2</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6f797a', fontSize: '13px' }}>Trạng thái:</span> 
              <span style={{ backgroundColor: '#f6feff', color: '#004c52', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', border: '1px solid #86d3da' }}>Đã đặt cọc</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ktp-section" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#191c1d', margin: '0 0 24px 0' }}>Lập biên bản bàn giao</h3>
          
          <div className="ktp-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#00666d' }} />
                <span style={{ fontSize: '15px', color: '#191c1d' }}>Khách hàng có mặt tại thời điểm bàn giao</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#00666d' }} />
                <span style={{ fontSize: '15px', color: '#191c1d' }}>Khách hàng đã ký xác nhận biên bản</span>
              </label>
            </div>
            
            <div>
              <label className="ktp-label">Ghi chú chung</label>
              <textarea 
                className="ktp-input" 
                placeholder="Nhập ghi chú chung cho biên bản..." 
                style={{ height: '80px', resize: 'none' }}
              ></textarea>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã tài sản</th>
                <th>Tên tài sản</th>
                <th>Phòng / Giường</th>
                <th style={{ textAlign: 'center' }}>Số lượng thực tế</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TS002</td>
                <td style={{ fontWeight: '600', color: '#191c1d' }}>Nệm</td>
                <td>G1</td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" defaultValue="1" style={{ width: '80px', textAlign: 'center', padding: '8px', border: '1px solid #bec8c9', borderRadius: '4px', outline: 'none' }} />
                </td>
              </tr>
              <tr>
                <td>TS003</td>
                <td style={{ fontWeight: '600', color: '#191c1d' }}>Tủ quần áo</td>
                <td>Phòng P.203</td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" defaultValue="1" style={{ width: '80px', textAlign: 'center', padding: '8px', border: '1px solid #bec8c9', borderRadius: '4px', outline: 'none' }} />
                </td>
              </tr>
              <tr>
                <td>TS004</td>
                <td style={{ fontWeight: '600', color: '#191c1d' }}>Máy lạnh</td>
                <td>Phòng P.203</td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" defaultValue="1" style={{ width: '80px', textAlign: 'center', padding: '8px', border: '1px solid #bec8c9', borderRadius: '4px', outline: 'none' }} />
                </td>
              </tr>
              <tr>
                <td>TS005</td>
                <td style={{ fontWeight: '600', color: '#191c1d' }}>Bàn học</td>
                <td>G2</td>
                <td style={{ textAlign: 'center' }}>
                  <input type="number" defaultValue="1" style={{ width: '80px', textAlign: 'center', padding: '8px', border: '1px solid #bec8c9', borderRadius: '4px', outline: 'none' }} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: 'transparent', color: '#3f494a', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
          <button style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #00666d', backgroundColor: 'transparent', color: '#00666d', fontWeight: '600', cursor: 'pointer' }}>Lưu nháp</button>
          <button className="ktp-btn-submit" style={{ padding: '10px 24px' }}>Lưu biên bản</button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
