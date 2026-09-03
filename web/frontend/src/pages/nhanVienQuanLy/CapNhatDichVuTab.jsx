import React, { useState } from 'react';

export default function CapNhatDichVuTab() {
  const rooms = [
    { id: 'P.203', startDien: 1250, endDien: 1320, startNuoc: 340, endNuoc: 358 },
    { id: 'P.105', startDien: 860, endDien: 910, startNuoc: 220, endNuoc: 236 },
    { id: 'P.402', startDien: 1500, endDien: 1560, startNuoc: 410, endNuoc: 425 },
  ];

  return (
    <div className="ktp-container">

      <div className="ktp-content">
        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
          
          {/* Top Control Card */}
          <div style={{ width: '400px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e3e4', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Kỳ ghi</label>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#ffffff', cursor: 'pointer' }}>
                  <option value="06-2026">Tháng Sáu 2026</option>
                  <option value="05-2026">Tháng Năm 2026</option>
                  <option value="04-2026">Tháng Tư 2026</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ngày ghi</label>
              <div style={{ position: 'relative' }}>
                <input type="date" defaultValue="2026-06-30" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
              <button style={{ backgroundColor: '#ffffff', color: '#3f494a', border: '1px solid #e1e3e4', padding: '8px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Hủy</button>
              <button className="ktp-btn-action-fill" style={{ backgroundColor: '#00666d', color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Tải danh sách phòng</button>
            </div>
          </div>

          {/* Table Section */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e1e3e4', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#191c1d', margin: '0 0 16px 0' }}>Danh sách phòng cần ghi chỉ số</h3>
            
            <div style={{ border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e3e4' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase' }}>Mã phòng</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Chỉ số điện đầu</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Chỉ số điện cuối</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Chỉ số nước đầu</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Chỉ số nước cuối</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#6f797a', textTransform: 'uppercase', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room, index) => (
                    <tr key={room.id} style={{ borderBottom: index === rooms.length - 1 ? 'none' : '1px solid #e1e3e4' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#191c1d' }}>{room.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>{room.startDien}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="text" defaultValue={room.endDien} style={{ width: '100px', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '6px', textAlign: 'right', fontSize: '14px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>{room.startNuoc}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="text" defaultValue={room.endNuoc} style={{ width: '100px', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '6px', textAlign: 'right', fontSize: '14px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button style={{ backgroundColor: '#ffffff', color: '#00666d', border: '1px solid #00666d', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Lưu</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={{ backgroundColor: '#ffffff', color: '#3f494a', border: '1px solid #e1e3e4', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}>Hủy</button>
              <button className="ktp-btn-action-fill" style={{ backgroundColor: '#00666d', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '14px' }}>
                Lưu tất cả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
