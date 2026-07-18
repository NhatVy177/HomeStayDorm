import React, { useState, useEffect } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { dangKyThueApi } from '../dangKyThue/dangKyThue.api.js';

export default function TraCuuPhongTab() {
  const [viewRoom, setViewRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    khuVuc: 'Tất cả khu vực',
    loaiPhong: 'Tất cả loại phòng',
    hinhThucThue: 'Tất cả hình thức',
    mucGiaToiDa: 'Tất cả'
  });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const payload = {
        ...filters,
        mucGiaToiDa: filters.mucGiaToiDa === 'Tất cả' ? '' : filters.mucGiaToiDa.replace(/\D/g, '') + '000000'
      };
      const res = await dangKyThueApi.traCuuPhong(payload);
      setRooms(res.data.map(r => ({
        id: r.id,
        name: r.name,
        subName: r.subName,
        area: r.area,
        type: r.type,
        price: r.price ? r.price.toLocaleString('vi-VN') + 'đ' : '',
        occupied: r.type === 'Nguyên căn' ? (r.status === 'Trống' ? 0 : r.capacity) : (r.capacity - r.emptyBeds),
        capacity: r.capacity,
        status: r.status
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleClearFilters = () => {
    setFilters({
      khuVuc: 'Tất cả khu vực',
      loaiPhong: 'Tất cả loại phòng',
      hinhThucThue: 'Tất cả hình thức',
      mucGiaToiDa: 'Tất cả'
    });
    // fetchRooms will need to use the cleared filters
    setTimeout(fetchRooms, 0);
  };

  const filterCardStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #d6e0e0',
    marginBottom: '24px',
    boxShadow: '0 8px 20px rgba(31, 56, 57, 0.04)'
  };

  const filterHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  };

  const filterGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px'
  };

  const filterFieldStyle = {
    border: '1px solid #d4dddd',
    borderRadius: '8px',
    padding: '10px 12px 12px',
    backgroundColor: '#fbfdfd'
  };

  const filterLabelStyle = {
    fontSize: '12px',
    color: '#3f494a',
    display: 'block',
    marginBottom: '8px',
    fontWeight: '700'
  };

  const filterSelectStyle = {
    backgroundColor: '#fff',
    border: '1px solid #bec8c9',
    minHeight: '42px',
    borderRadius: '7px'
  };

  return (
    <div className="ktp-container">

      <div style={filterCardStyle}>
        <div style={filterHeaderStyle}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#191c1d', fontSize: '15px' }}>
              <Icon name="tune" style={{ color: '#2f6765', fontSize: '18px' }} /> Bộ lọc tìm kiếm
            </div>
            <div style={{ color: '#6f797a', fontSize: '12px', marginTop: '4px' }}>
              Lọc theo khu vực, loại phòng, hình thức thuê và mức giá.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={handleClearFilters} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd7d7', backgroundColor: '#fff', color: '#2f6765', fontSize: '13px', cursor: 'pointer', fontWeight: '700' }}>Xóa bộ lọc</button>
            <button type="button" onClick={fetchRooms} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#347a78', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Áp dụng bộ lọc</button>
          </div>
        </div>
        <div style={filterGridStyle}>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>Khu vực</label>
            <select className="ktp-input" value={filters.khuVuc} onChange={e => setFilters({...filters, khuVuc: e.target.value})} style={filterSelectStyle}>
              <option>Tất cả khu vực</option>
              <option>Quận 1</option>
              <option>Bình Thạnh</option>
              <option>Thủ Đức</option>
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>Loại phòng</label>
            <select className="ktp-input" value={filters.loaiPhong} onChange={e => setFilters({...filters, loaiPhong: e.target.value})} style={filterSelectStyle}>
              <option>Tất cả loại phòng</option>
              <option>Phòng 2 người</option>
              <option>Phòng 4 người</option>
              <option>Phòng 6 người</option>
              <option>Phòng VIP 2 người</option>
              <option>Dorm 8 người</option>
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>Hình thức thuê</label>
            <select className="ktp-input" value={filters.hinhThucThue} onChange={e => setFilters({...filters, hinhThucThue: e.target.value})} style={filterSelectStyle}>
              <option>Tất cả hình thức</option>
              <option>Nguyên căn</option>
              <option>Ghép nam</option>
              <option>Ghép nữ</option>
            </select>
          </div>
          <div style={filterFieldStyle}>
            <label style={filterLabelStyle}>Mức giá (Triệu VNĐ)</label>
            <select className="ktp-input" value={filters.mucGiaToiDa} onChange={e => setFilters({...filters, mucGiaToiDa: e.target.value})} style={filterSelectStyle}>
              <option>Tất cả</option>
              <option>Dưới 2 triệu</option>
              <option>Dưới 3 triệu</option>
              <option>Dưới 5 triệu</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0e3e3', overflow: 'hidden' }}>
        <table className="ktp-table" style={{ margin: 0 }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f7f7' }}>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Mã phòng</th>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Tên phòng/Dorm</th>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Khu vực</th>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Loại / Hình thức</th>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Giá thuê</th>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Trống / Sức chứa</th>
              <th style={{ color: '#3f494a', fontSize: '12px' }}>Tình trạng</th>
              <th className="text-center" style={{ color: '#3f494a', fontSize: '12px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải dữ liệu...</td></tr>
            ) : rooms.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không tìm thấy phòng phù hợp.</td></tr>
            ) : rooms.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: '800', color: '#2f6765', fontSize: '13px' }}>{r.id}</td>
                <td>
                  <div style={{ fontWeight: '600', color: '#3f494a', fontSize: '13px' }}>{r.name}</div>
                  <div style={{ color: '#6f797a', fontSize: '12px', marginTop: '4px' }}>{r.subName}</div>
                </td>
                <td style={{ color: '#6f797a', fontSize: '13px' }}>{(r.area||'').split(',').map((p,i)=><div key={i}>{p.trim()}</div>)}</td>
                <td style={{ color: '#3f494a', fontSize: '13px' }}>{r.type}</td>
                <td style={{ fontWeight: '700', color: '#a43c12', fontSize: '13px' }}>{r.price}</td>
                <td>
                  <span style={{ color: '#1b6f6d', fontWeight: '700' }}>{r.occupied}</span>
                  <span style={{ color: '#9eaaab' }}> / {r.capacity}</span>
                </td>
                <td>
                  <span style={{ backgroundColor: r.status==='Trống'?'#eaf6ed':(r.status==='Kín chỗ'||r.status==='Đã thuê'?'#ffebee':'#fff3cd'), color: r.status==='Trống'?'#188038':(r.status==='Kín chỗ'||r.status==='Đã thuê'?'#c62828':'#f57f17'), padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{r.status}</span>
                </td>
                <td className="text-center">
                  <button onClick={() => setViewRoom(r)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #bec8c9', backgroundColor: '#fff', color: '#1b6f6d', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Xem<br/>chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e0e3e3' }}>
          <span style={{ fontSize: '13px', color: '#6f797a' }}>Hiển thị 1 - 3 trên 30 kết quả</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button style={{ padding: '4px 8px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9eaaab' }}><Icon name="chevron_left" style={{ fontSize: '14px' }}/></button>
            <button style={{ padding: '4px 10px', border: 'none', backgroundColor: '#2f6765', color: '#fff', borderRadius: '4px', fontWeight: '700', fontSize: '12px' }}>1</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', color: '#3f494a', fontSize: '12px' }}>2</button>
            <button style={{ padding: '4px 10px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', color: '#3f494a', fontSize: '12px' }}>3</button>
            <button style={{ padding: '4px 8px', border: '1px solid #e0e3e3', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6f797a' }}><Icon name="chevron_right" style={{ fontSize: '14px' }}/></button>
          </div>
        </div>
      </div>

      {viewRoom && (
        <div className="ktp-modal-overlay" onClick={() => setViewRoom(null)}>
          <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '800px', padding: 0 }}>
            <div className="ktp-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e0e3e3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}><Icon name="apartment" style={{ color: '#1b6f6d' }} /> Chi tiết phòng / giường</h3>
              <button onClick={() => setViewRoom(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6f797a', display: 'flex', alignItems: 'center' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '8px', backgroundColor: '#e0e3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#1b6f6d', overflow: 'hidden' }}>
                  <Icon name="meeting_room" style={{ fontSize: '32px' }} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#191c1d' }}>{viewRoom.name}</h2>
                  <div style={{ fontSize: '12px', color: '#1b6f6d', fontWeight: '700' }}>MÃ PHÒNG: {viewRoom.id}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', borderTop: '1px solid #e0e3e3', borderBottom: '1px solid #e0e3e3', padding: '24px 0' }}>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Hình thức thuê</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewRoom.type}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Khu vực</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewRoom.area}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Sức chứa</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#191c1d' }}>{viewRoom.capacity} Người</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Giá thuê</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#a43c12' }}>{viewRoom.price}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Tình trạng</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#188038' }}>{viewRoom.status}</div></div>
                <div><div style={{ fontSize: '10px', color: '#6f797a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>Tòa nhà</div><div style={{ fontSize: '13px', fontWeight: '700', color: '#1b6f6d' }}>{viewRoom.subName}</div></div>
                
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ backgroundColor: '#f4f7f7', borderRadius: '8px', padding: '16px', display: 'flex', gap: '8px', border: '1px solid #e0e3e3' }}>
                    <Icon name="edit_note" style={{ color: '#6f797a', fontSize: '18px' }} />
                    <span style={{ fontSize: '13px', color: '#6f797a', fontWeight: '500' }}>Ghi chú: Phòng đầy đủ tiện nghi, có máy lạnh, máy nước nóng, dọn dẹp hàng tuần.</span>
                  </div>
                </div>
              </div>

            </div>
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e0e3e3', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f9fafa', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button onClick={() => setViewRoom(null)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#fff', color: '#191c1d', fontWeight: '700', cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
