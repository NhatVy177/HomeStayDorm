import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

const customers = [
  { id: 'CUST-8821', name: 'Phạm Hoàng Nam', email: 'nam.pham@email.com', phone: '0901 234 567', cccd: '079192000214', room: 'P.302 - G.01', roomStatus: 'Phòng đôi', startDate: '15/10/2023', dob: '12/05/1998', gender: 'Nam', nationality: 'Việt Nam', avatar: null },
  { id: 'CUST-7742', name: 'Lê Thị Thu Thủy', email: 'thuy.le@email.com', phone: '0982 111 222', cccd: '012392005512', room: 'P.105 (Phòng đơn)', roomStatus: 'Phòng đơn', startDate: '01/11/2023', dob: '20/08/1999', gender: 'Nữ', nationality: 'Việt Nam', avatar: null },
  { id: 'CUST-6623', name: 'Trần Văn Bình', email: 'binh.tran@email.com', phone: '0912 333 444', cccd: '042194008123', room: 'Chưa có', roomStatus: 'Chưa có', startDate: '12/09/2023', dob: '05/02/1994', gender: 'Nam', nationality: 'Việt Nam', avatar: null },
  { id: 'CUST-8819', name: 'Đỗ Minh Hiếu', email: 'hieu.do@email.com', phone: '0372 999 000', cccd: '082195001122', room: 'P.504', roomStatus: 'Chờ nhận', startDate: '28/10/2023', dob: '18/11/1995', gender: 'Nam', nationality: 'Việt Nam', avatar: null }
];

export default function KhachHangTab() {
  const [viewCustomer, setViewCustomer] = useState(null);

  return (
    <div className="ktp-container">

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Trạng thái khách hàng</label>
            <select className="ktp-input"><option>Tất cả trạng thái</option></select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Khu vực</label>
            <select className="ktp-input"><option>Tất cả khu vực</option></select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Hình thức thuê</label>
            <select className="ktp-input"><option>Tất cả hình thức</option></select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Thời gian bắt đầu</label>
            <input type="date" className="ktp-input" style={{ color: '#9eaaab' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ width: '400px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Tìm kiếm theo định danh</label>
            <div style={{ position: 'relative' }}>
              <input className="ktp-input" placeholder="Họ tên, SĐT, CCCD, Mã khách hàng..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #1b6f6d', backgroundColor: '#fff', color: '#1b6f6d', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="refresh" /> Làm mới</button>
            <button style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#a43c12', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="filter_list" /> Lọc dữ liệu</button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0e3e3', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e0e3e3' }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#3f494a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Danh sách khách hàng (128)</h3>
          <div style={{ display: 'flex', gap: '16px', color: '#3f494a' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}><Icon name="download" /></button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}><Icon name="print" /></button>
          </div>
        </div>
        <table className="ktp-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Họ tên</th>
              <th>Liên hệ</th>
              <th>CCCD</th>
              <th>Phòng/Giường</th>
              <th>Ngày bắt đầu</th>
              <th className="text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: '700', color: '#1b6f6d' }}>{c.id}</td>
                <td>
                  <div style={{ fontWeight: '700', color: '#191c1d', fontSize: '13px' }}>{c.name}</div>
                </td>
                <td>
                  <div style={{ fontWeight: '700', color: '#191c1d', fontSize: '13px' }}>{c.phone}</div>
                  <div style={{ color: '#6f797a', fontSize: '11px' }}>{c.email}</div>
                </td>
                <td style={{ color: '#191c1d', fontWeight: '600' }}>{c.cccd}</td>
                <td>
                  {c.roomStatus === 'Chưa có' ? <span style={{ color: '#9eaaab', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><Icon name="error_outline" style={{ fontSize: '14px' }}/> {c.roomStatus}</span> :
                   c.roomStatus === 'Chờ nhận' ? <span style={{ color: '#a43c12', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><Icon name="hourglass_empty" style={{ fontSize: '14px' }}/> <span style={{ color: '#3f494a', fontWeight: '400' }}>Chờ nhận:</span> {c.room}</span> :
                   <span style={{ color: '#191c1d', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}><Icon name="meeting_room" style={{ fontSize: '14px', color: '#1b6f6d' }}/> {c.room}</span>
                  }
                </td>
                <td style={{ color: '#191c1d', fontWeight: '600' }}>{c.startDate}</td>
                <td className="text-center">
                  <button onClick={() => setViewCustomer(c)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #bec8c9', backgroundColor: '#fff', color: '#1b6f6d', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Xem<br/>chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e3e3' }}>
          <span style={{ fontSize: '12px', color: '#6f797a' }}>Hiển thị 1 - 4 trong tổng số 28 khách hàng</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button style={{ padding: '4px 8px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9eaaab' }}><Icon name="chevron_left" style={{ fontSize: '14px' }}/></button>
            <button style={{ padding: '4px 10px', border: 'none', backgroundColor: '#1b6f6d', color: '#fff', borderRadius: '4px', fontWeight: '700', fontSize: '12px' }}>1</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', color: '#3f494a', fontSize: '12px' }}>2</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', color: '#3f494a', fontSize: '12px' }}>3</button>
            <span style={{ padding: '4px 8px', color: '#6f797a', fontSize: '12px' }}>...</span>
            <button style={{ padding: '4px 10px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', color: '#3f494a', fontSize: '12px' }}>32</button>
            <button style={{ padding: '4px 8px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6f797a' }}><Icon name="chevron_right" style={{ fontSize: '14px' }}/></button>
          </div>
        </div>
      </div>

      {viewCustomer && (
        <div className="ktp-modal-overlay" onClick={() => setViewCustomer(null)}>
          <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '800px', padding: 0 }}>
            <div className="ktp-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e0e3e3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}><Icon name="person" style={{ color: '#1b6f6d' }} /> Chi tiết khách hàng</h3>
              <button onClick={() => setViewCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6f797a', display: 'flex', alignItems: 'center' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', backgroundColor: '#e0e3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#fff', overflow: 'hidden' }}>
                  {viewCustomer.avatar ? <img src={viewCustomer.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : viewCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#191c1d' }}>{viewCustomer.name}</h2>
                  <div style={{ fontSize: '12px', color: '#1b6f6d', fontWeight: '700' }}>MÃ KH: {viewCustomer.id}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', borderTop: '1px solid #e0e3e3', borderBottom: '1px solid #e0e3e3', padding: '24px 0' }}>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Ngày sinh</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewCustomer.dob}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Giới tính</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewCustomer.gender}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Quốc tịch</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewCustomer.nationality}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>CCCD</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewCustomer.cccd}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Số điện thoại</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#1b6f6d' }}>{viewCustomer.phone}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Email</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewCustomer.email}</div></div>
                
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ backgroundColor: '#f4f7f7', borderRadius: '8px', padding: '16px', display: 'flex', gap: '8px', border: '1px solid #e0e3e3' }}>
                    <Icon name="edit_note" style={{ color: '#6f797a', fontSize: '18px' }} />
                    <span style={{ fontSize: '13px', color: '#6f797a', fontWeight: '500' }}>GHI CHÚ</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '800', color: '#1b6f6d', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}><Icon name="apartment" /> DANH SÁCH PHÒNG LIÊN QUAN</h4>
                <div style={{ borderRadius: '8px', border: '1px solid #e0e3e3', overflow: 'hidden' }}>
                  <table className="ktp-table" style={{ margin: 0, border: 'none' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f4f7f7' }}>
                        <th style={{ fontSize: '11px', color: '#6f797a' }}>Mã hợp đồng</th>
                        <th style={{ fontSize: '11px', color: '#6f797a' }}>Tên phòng/Giường</th>
                        <th style={{ fontSize: '11px', color: '#6f797a' }}>Khu vực</th>
                        <th style={{ fontSize: '11px', color: '#6f797a' }}>Thời gian thuê</th>
                        <th style={{ fontSize: '11px', color: '#6f797a' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ color: '#1b6f6d', fontWeight: '700' }}>HD-4421</td>
                        <td style={{ color: '#3f494a', fontWeight: '500' }}>P.302 - Homestay Central</td>
                        <td style={{ color: '#6f797a', fontSize: '13px' }}>Quận 3, TP. HCM</td>
                        <td style={{ color: '#6f797a', fontSize: '13px' }}>01/01/24 - 01/01/25</td>
                        <td><span style={{ backgroundColor: '#e8f4f4', color: '#1b6f6d', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Hiệu lực</span></td>
                      </tr>
                      <tr>
                        <td style={{ color: '#6f797a', fontWeight: '700' }}>HD-2109</td>
                        <td style={{ color: '#6f797a', fontWeight: '500' }}>P.105 - Homestay Central</td>
                        <td style={{ color: '#6f797a', fontSize: '13px' }}>Quận 3, TP. HCM</td>
                        <td style={{ color: '#6f797a', fontSize: '13px' }}>01/01/23 - 01/01/24</td>
                        <td><span style={{ backgroundColor: '#f4f7f7', color: '#6f797a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Kết thúc</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e0e3e3', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f9fafa', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button onClick={() => setViewCustomer(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#fff', color: '#191c1d', fontWeight: '700', cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
