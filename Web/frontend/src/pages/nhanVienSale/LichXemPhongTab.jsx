import React, { useState, useEffect } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { lichXemPhongApi } from '../lichXemPhong/lichXemPhong.api.js';
import { dangKyThueApi } from '../dangKyThue/dangKyThue.api.js';

// Dữ liệu mock
const mockProfiles = [
  { id: 'DK00027', customerName: 'Nguyễn Văn An', phone: '0912 345 678', date: '15/10/2023' },
  { id: 'DK00028', customerName: 'Trần Thị Lan Anh', phone: '0987 654 321', date: '16/10/2023' },
  { id: 'DK00029', customerName: 'Lê Văn Hùng', phone: '0933 222 111', date: '16/10/2023' },
];

const mockRooms = [
  { id: 'P.B204', name: 'Phòng Tập Thể B.204', type: 'Dorm Nam (4 người)', price: '1.800.000 đ/tháng', area: '25m²', address: 'Bình Thạnh, TP.HCM', availableDate: '15/10/2023', img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80' },
  { id: 'A.101', name: 'Studio A.101', type: 'Studio riêng', price: '4.500.000 đ/tháng', area: '30m²', address: 'Quận 7, TP.HCM', availableDate: '16/10/2023', img: 'https://images.unsplash.com/photo-1502672260266-1c1ea2819792?auto=format&fit=crop&w=400&q=80' },
  { id: 'B.405', name: 'Deluxe B.405', type: 'Phòng đơn lớn', price: '3.200.000 đ/tháng', area: '22m²', address: 'Bình Thạnh, TP.HCM', availableDate: '20/10/2023', img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=400&q=80' },
  { id: 'D.110', name: 'Basic D.110', type: 'Phòng đơn tiêu chuẩn', price: '2.500.000 đ/tháng', area: '18m²', address: 'Thủ Đức, TP.HCM', availableDate: '21/10/2023', img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80' },
];

const mockAppointments = [
  { id: 'A1', customerName: 'Nguyễn Văn An', phone: '090 123 4567', room: 'Phòng B.204', datetime: '20/10/2023 14:30 - 15:30', status: 'CHỜ XEM' },
  { id: 'A2', customerName: 'Phạm Gia Bảo', phone: '0912 888 999', room: 'Studio A.101', datetime: '21/10/2023 09:00 - 10:00', status: 'CHỜ XEM' },
  { id: 'A3', customerName: 'Trần Thị Mai', phone: '0945 123 456', room: 'Deluxe B.405', datetime: '21/10/2023 15:30 - 16:30', status: 'CHỜ XEM' },
  { id: 'A4', customerName: 'Nguyễn Hoàng Nam', phone: '0966 777 888', room: 'Basic D.110', datetime: '22/10/2023 10:15 - 11:15', status: 'CHỜ XEM' },
];

export default function LichXemPhongTab() {
  const [activeTab, setActiveTab] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null); // For rescheduling/canceling
  const [modalType, setModalType] = useState(null); // 'room-detail', 'cancel-appt', 'reschedule-appt', 'reschedule-success'
  const [roomToView, setRoomToView] = useState(null);

  const [realRooms, setRealRooms] = useState([]);

  // Form states
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStaff, setFormStaff] = useState('Hoàng Anh (Sales Expert)');
  const [formNote, setFormNote] = useState('');

  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    dangKyThueApi.getAll().then(res => {
      const all = res.data || [];
      const accepted = all.filter(x => x.trangThai === 'Đã tiếp nhận' || x.trangThai === 'Chấp nhận');
      setProfiles(accepted);
    }).catch(console.error);
  }, []);

  const renderTabs = () => {
    const tabs = [
      { id: 1, label: 'Hồ sơ đã tiếp nhận', icon: 'assignment' },
      { id: 2, label: 'Danh sách phòng/giường khả dụng', icon: 'bed' },
      { id: 3, label: 'Thông tin lịch hẹn', icon: 'event' },
      { id: 4, label: 'Danh sách lịch hẹn', icon: 'list_alt' }
    ];

    return (
      <div style={{ display: 'flex', borderBottom: '2px solid #e9ecef', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: '12px 24px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              color: activeTab === tab.id ? '#14595b' : '#6f797a',
              borderBottom: activeTab === tab.id ? '3px solid #14595b' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            <Icon name={tab.icon} />
            {tab.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ktp-container">
      {/* Header (Removed) */}

      {renderTabs()}

      {/* Tabs Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 1 && (
          <div className="ktp-table-section">
            <table className="ktp-table">
              <thead>
                <tr>
                  <th>MÃ PHIẾU</th>
                  <th>KHÁCH HÀNG</th>
                  <th>SĐT</th>
                  <th>NGÀY ĐĂNG KÝ</th>
                  <th style={{ textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.maDangKy}>
                    <td><strong className="ktp-text-primary">{p.maDangKy}</strong></td>
                    <td>{p.hoTenKhach}</td>
                    <td>{p.sdtKhach}</td>
                    <td>{p.ngayDangKy ? new Date(p.ngayDangKy).toLocaleDateString('en-GB') : ''}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="ktp-btn-action-fill" 
                        style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '16px', backgroundColor: '#14595b' }}
                        onClick={() => {
                          setSelectedProfile(p);
                          setActiveTab(2);
                          // Fetch rooms based on selected profile
                          lichXemPhongApi.getPhongPhuHop(p.maDangKy).then(res => {
                            setRealRooms(res.data || []);
                          }).catch(console.error);
                        }}
                      >
                        Lập lịch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bec8c9', color: '#191c1d', fontWeight: '600' }}>
                <Icon name="person" /> 
                Đang chọn cho: {selectedProfile ? `${selectedProfile.maDangKy || selectedProfile.id} (${(selectedProfile.hoTenKhach || selectedProfile.customerName || '').split(' ').slice(-2).join(' ')})` : 'Chưa chọn'}
              </div>
              <button className="ktp-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#fff' }}>
                <Icon name="filter_list" /> Bộ lọc
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              {realRooms.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: '#6f797a' }}>
                  Không tìm thấy phòng phù hợp với yêu cầu của hồ sơ này.
                </div>
              ) : realRooms.map(r => (
                <div key={r.id} className="ktp-detail-card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setRoomToView(r); setModalType('room-detail'); }}>
                  <img src={r.img || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80'} alt={r.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px', color: '#191c1d' }}>{r.name}</h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6f797a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon name="location_on" style={{ fontSize: '16px' }} /> {r.address}
                    </p>
                    <button 
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        borderRadius: '6px', 
                        border: 'none', 
                        backgroundColor: selectedRoom?.id === r.id ? '#14595b' : '#f3f4f5', 
                        color: selectedRoom?.id === r.id ? '#fff' : '#191c1d',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedRoom(r); }}
                    >
                      {selectedRoom?.id === r.id ? <><Icon name="check_circle" /> Đã chọn</> : 'Chọn'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'right' }}>
              <button 
                className="ktp-btn-submit" 
                style={{ padding: '12px 32px', backgroundColor: '#14595b', fontSize: '15px' }}
                disabled={!selectedRoom}
                onClick={() => setActiveTab(3)}
              >
                Tiếp tục &rarr;
              </button>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Left Form */}
            <div className="ktp-detail-card" style={{ padding: '32px' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '20px', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="event" /> Chi tiết lịch hẹn
              </h3>
              
              <div className="ktp-grid-2" style={{ gap: '24px' }}>
                <div>
                  <label className="ktp-filter-label">Ngày xem phòng</label>
                  <input className="ktp-input" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div>
                  <label className="ktp-filter-label">Giờ hẹn dự kiến</label>
                  <input className="ktp-input" type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
                </div>
                <div>
                  <label className="ktp-filter-label">Địa điểm</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#6f797a' }}><Icon name="location_on" /></span>
                    <input className="ktp-input" style={{ paddingLeft: '40px' }} type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Phòng B.204, Chi nhánh Quận 7" />
                  </div>
                </div>
                <div>
                  <label className="ktp-filter-label">Nhân viên phụ trách</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#6f797a' }}><Icon name="person" /></span>
                    <select className="ktp-input" style={{ paddingLeft: '40px' }} value={formStaff} onChange={e => setFormStaff(e.target.value)}>
                      <option>Hoàng Anh (Sales Expert)</option>
                      <option>Nhật Vy (Sales Associate)</option>
                    </select>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="ktp-filter-label">Ghi chú cho khách hàng</label>
                  <textarea className="ktp-textarea" rows="3" placeholder="Nhập ghi chú hoặc nhắc nhở cho khách..." value={formNote} onChange={e => setFormNote(e.target.value)}></textarea>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e1e3e4' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#3f494a' }}>
                  <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#14595b' }} />
                  Gửi thông báo SMS & Email xác nhận cho khách hàng
                </label>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button className="ktp-btn-cancel" style={{ width: '140px', justifyContent: 'center' }} onClick={() => setActiveTab(2)}>Hủy bỏ</button>
                <button 
                  className="ktp-btn-submit" 
                  style={{ width: '180px', justifyContent: 'center', gap: '8px', backgroundColor: '#14595b' }}
                  onClick={() => setActiveTab(4)}
                >
                  <Icon name="save" /> Lưu lịch hẹn
                </button>
              </div>
            </div>

            {/* Right Summary Panel */}
            <div>
              <div className="ktp-detail-card" style={{ padding: '20px', backgroundColor: '#eef1f1', border: 'none', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#14595b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TÓM TẮT LỰA CHỌN</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#191c1d' }}>
                      <Icon name="person" style={{ color: '#14595b' }} /> {selectedProfile ? (selectedProfile.hoTenKhach || selectedProfile.customerName) : 'Chưa chọn'}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#6f797a' }}>KHÁCH</span>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#191c1d' }}>
                      <Icon name="apartment" style={{ color: '#14595b' }} /> {selectedRoom ? selectedRoom.name : 'Chưa chọn'}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#6f797a' }}>PHÒNG</span>
                  </div>
                </div>
              </div>
              <div className="ktp-detail-card" style={{ padding: '20px', backgroundColor: '#e0f2f1', border: 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#14595b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="headset_mic" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#004d40' }}>Hotline hỗ trợ</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#004d40' }}>0901.234.567</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', color: '#191c1d', margin: 0 }}>Lịch hẹn đã sắp xếp</h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', backgroundColor: '#e1e3e4', color: '#3f494a', fontWeight: '600', fontSize: '14px' }}>
                <Icon name="calendar_today" style={{ fontSize: '18px' }} /> Tháng 10, 2023
              </div>
            </div>

            <div className="ktp-table-section">
              <table className="ktp-table">
                <thead>
                  <tr>
                    <th>KHÁCH HÀNG</th>
                    <th>PHÒNG/GIƯỜNG</th>
                    <th>THỜI GIAN</th>
                    <th className="text-center">TRẠNG THÁI</th>
                    <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAppointments.map(a => (
                    <tr key={a.id}>
                      <td>
                        <strong style={{ color: '#191c1d', display: 'block', marginBottom: '4px' }}>{a.customerName}</strong>
                        <span style={{ color: '#6f797a', fontSize: '13px' }}>{a.phone}</span>
                      </td>
                      <td>{a.room}</td>
                      <td>
                        <div style={{ color: '#191c1d', marginBottom: '4px' }}>{a.datetime.split(' ')[0]}</div>
                        <div style={{ color: '#6f797a', fontSize: '13px' }}>{a.datetime.split(' ').slice(1).join(' ')}</div>
                      </td>
                      <td className="text-center">
                        <span className={`ktp-badge ${a.status === 'ĐÃ HỦY' ? 'ktp-badge-danger' : 'ktp-badge-warning'}`} style={a.status === 'ĐÃ HỦY' ? { backgroundColor: '#ffebee', color: '#c62828' } : {}}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="ktp-btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => { setSelectedAppt(a); setModalType('reschedule-appt'); }}
                          >
                            <Icon name="event_note" style={{ fontSize: '16px' }} /> Đổi lịch
                          </button>
                          <button 
                            className="ktp-btn-outline" 
                            style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ba1a1a', borderColor: '#ba1a1a' }}
                            onClick={() => { setSelectedAppt(a); setModalType('cancel-appt'); }}
                          >
                            <Icon name="cancel" style={{ fontSize: '16px' }} /> Hủy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Đổi Lịch */}
      {modalType === 'reschedule-appt' && selectedAppt && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
            <div className="ktp-modal-header">
              <h3 style={{ fontSize: '18px', margin: 0, color: '#191c1d' }}>Đổi lịch xem phòng</h3>
              <button className="ktp-modal-close" onClick={() => setModalType(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', display: 'block' }}>
              <div style={{ backgroundColor: '#f3f4f5', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                <div style={{ color: '#14595b' }}><Icon name="event" /></div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '8px', fontWeight: 'bold' }}>THÔNG TIN HIỆN TẠI</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#191c1d' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="person" style={{ fontSize: '16px', color: '#6f797a' }} /> {selectedAppt.customerName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="apartment" style={{ fontSize: '16px', color: '#6f797a' }} /> {selectedAppt.room}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="schedule" style={{ fontSize: '16px', color: '#6f797a' }} /> {selectedAppt.datetime}</div>
                  </div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#3f494a' }}>Chọn lịch mới</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="ktp-filter-label">Ngày xem mới</label>
                  <input className="ktp-input" type="date" defaultValue="2023-10-25" />
                </div>
                <div>
                  <label className="ktp-filter-label">Giờ xem mới</label>
                  <input className="ktp-input" type="time" defaultValue="10:00" />
                </div>
              </div>
              <div style={{ backgroundColor: '#f3f4f5', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#3f494a' }}>
                <Icon name="info" style={{ color: '#14595b', fontSize: '16px', marginTop: '2px' }} />
                <span>Hệ thống sẽ tự động thông báo cho khách hàng qua email và Zalo sau khi bạn xác nhận.</span>
              </div>
            </div>
            <div className="ktp-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
              <button className="ktp-btn-submit" style={{ backgroundColor: '#14595b', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setModalType('reschedule-success')}>
                <Icon name="check_circle" /> Xác nhận đổi lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Hủy Lịch */}
      {modalType === 'cancel-appt' && selectedAppt && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '400px', textAlign: 'center' }}>
            <div className="ktp-modal-body" style={{ padding: '32px 24px', display: 'block' }}>
              <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: '#fbe2e0', color: '#ba1a1a', borderRadius: '50%', marginBottom: '24px' }}>
                <Icon name="warning" style={{ fontSize: '32px' }} />
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 12px', color: '#191c1d' }}>Xác nhận hủy lịch hẹn</h3>
              <p style={{ margin: '0 0 24px', color: '#6f797a', fontSize: '14px', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn hủy lịch xem phòng này không? <span style={{ color: '#e65100' }}>Hành động này không thể hoàn tác.</span>
              </p>
              
              <div style={{ backgroundColor: '#f3f4f5', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', fontSize: '14px' }}>
                  <div style={{ color: '#6f797a' }}>Khách hàng:</div>
                  <div style={{ color: '#191c1d', fontWeight: '500' }}>{selectedAppt.customerName}</div>
                  
                  <div style={{ color: '#6f797a' }}>Phòng:</div>
                  <div style={{ color: '#191c1d', fontWeight: '500' }}>{selectedAppt.room}</div>
                  
                  <div style={{ color: '#6f797a' }}>Thời gian:</div>
                  <div style={{ color: '#191c1d', fontWeight: '500' }}>{selectedAppt.datetime}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="ktp-btn-cancel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalType(null)}>Quay lại</button>
                <button className="ktp-btn-submit" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#ba1a1a', borderColor: '#ba1a1a' }} onClick={() => setModalType(null)}>Xác nhận hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đổi Lịch Thành Công */}
      {modalType === 'reschedule-success' && selectedAppt && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '400px', textAlign: 'center' }}>
            <div className="ktp-modal-body" style={{ padding: '32px 24px', display: 'block' }}>
              <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: '#e0f2f1', color: '#14595b', borderRadius: '50%', marginBottom: '24px' }}>
                <Icon name="check_circle" style={{ fontSize: '32px' }} />
              </div>
              <h3 style={{ fontSize: '20px', margin: '0 0 12px', color: '#191c1d' }}>Đổi lịch xem phòng thành công</h3>
              <p style={{ margin: '0 0 24px', color: '#6f797a', fontSize: '13px', lineHeight: '1.5' }}>
                Hệ thống đã ghi nhận lịch hẹn mới và tự động gửi thông báo qua Email/Zalo cho khách hàng.
              </p>
              
              <div style={{ backgroundColor: '#f3f4f5', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '13px' }}>
                  <div style={{ color: '#6f797a' }}>Khách hàng:</div>
                  <div style={{ color: '#191c1d', fontWeight: '600', textAlign: 'right' }}>{selectedAppt.customerName}</div>
                  
                  <div style={{ color: '#6f797a' }}>Phòng/Giường:</div>
                  <div style={{ color: '#191c1d', fontWeight: '600', textAlign: 'right' }}>{selectedAppt.room.replace('Phòng ', '')}</div>
                  
                  <div style={{ color: '#6f797a' }}>Lịch hẹn mới:</div>
                  <div style={{ color: '#14595b', fontWeight: '700', textAlign: 'right' }}>
                    10:00 AM<br/>
                    25/10/2023
                  </div>
                </div>
              </div>

              <button className="ktp-btn-submit" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#14595b' }} onClick={() => setModalType(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Phòng */}
      {modalType === 'room-detail' && roomToView && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '700px', maxWidth: '95vw' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="bed" /> Chi tiết Phòng {roomToView.id}
                </h3>
                <span style={{ fontSize: '13px', color: '#6f797a' }}>{roomToView.type}</span>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '24px', display: 'block' }}>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#14595b', margin: '0 0 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="info" /> THÔNG TIN CHUNG</h4>
                <div style={{ border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Mã phòng</div>
                    <div style={{ fontWeight: '600', color: '#191c1d' }}>{roomToView.id}-01 (Giường tầng 1)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Loại hình</div>
                    <div style={{ fontWeight: '600', color: '#191c1d' }}>{roomToView.type}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Giá thuê</div>
                    <div style={{ fontWeight: '700', color: '#ba1a1a' }}>{roomToView.price}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Diện tích</div>
                    <div style={{ fontWeight: '600', color: '#191c1d' }}>{roomToView.area}</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#14595b', margin: '0 0 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="check_circle" /> TIỆN ÍCH & MÔ TẢ</h4>
                <p style={{ fontSize: '14px', color: '#3f494a', marginBottom: '16px', lineHeight: '1.5' }}>
                  Phòng Dorm cao cấp tại cơ sở Quận 1 với đầy đủ ánh sáng tự nhiên. Giường tầng được thiết kế riêng tư với rèm che, đèn đọc sách và ổ cắm điện riêng biệt.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f5', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="wifi" /> Wifi 5G</div>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f5', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="ac_unit" /> Máy lạnh</div>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f5', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="wc" /> WC riêng</div>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f5', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="local_laundry_service" /> Máy giặt</div>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f5', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="lock" /> Locker</div>
                  <div style={{ padding: '8px 12px', backgroundColor: '#f3f4f5', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="cleaning_services" /> Dọn dẹp</div>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#14595b', margin: '0 0 12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="calendar_today" /> TÌNH TRẠNG PHÒNG</h4>
                <div style={{ backgroundColor: '#e0f2f1', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#b2dfdb', color: '#00695c', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>{roomToView.status.toUpperCase()}</span>
                    <div style={{ fontWeight: '600', color: '#004d40' }}>{roomToView.status === 'Trống' ? 'Khả dụng ngay lập tức' : 'Đang xử lý'}</div>
                  </div>
                  {roomToView.availableDate && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#00695c' }}>Ngày trống dự kiến</div>
                      <div style={{ fontWeight: '700', color: '#004d40' }}>{roomToView.availableDate}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ktp-modal-footer" style={{ display: 'flex', gap: '16px' }}>
              <button className="ktp-btn-outline" style={{ flex: 1 }} onClick={() => { setSelectedRoom(roomToView); setModalType(null); setActiveTab(3); }}>
                <Icon name="event" /> Lên lịch xem
              </button>
              <button className="ktp-btn-cancel" style={{ flex: 1 }} onClick={() => setModalType(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
