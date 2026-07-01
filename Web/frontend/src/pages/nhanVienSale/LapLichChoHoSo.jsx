import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { lichXemPhongApi } from '../lichXemPhong/lichXemPhong.api.js';

function formatMoney(value) {
  const number = Number(value || 0);
  if (!number) return '';
  const vnd = Math.round(number);
  const remainder = ((vnd % 1000) + 1000) % 1000;
  const normalized = remainder <= 10
    ? vnd - remainder
    : 1000 - remainder <= 10
      ? vnd + (1000 - remainder)
      : vnd;
  return normalized.toLocaleString('vi-VN') + 'đ';
}

function formatGender(profile = {}) {
  const soNam = Number(profile.soNam || 0);
  const soNu = Number(profile.soNu || 0);
  if (soNam > 0 && soNu > 0) return `Khác (Nam: ${soNam}, Nữ: ${soNu})`;
  if (soNu > 0) return 'Nữ';
  if (soNam > 0) return 'Nam';
  return profile.gioiTinh || 'Không xác định';
}

function normalizeRooms(payload) {
  const rows = Array.isArray(payload) ? payload : (payload?.rooms || []);
  const map = new Map();

  rows.forEach((room) => {
    const id = room.maPhong || room.id;
    if (!id) return;

    if (!map.has(id)) {
      map.set(id, {
        ...room,
        maPhong: id,
        tenPhong: room.tenPhong || room.name || id,
        loaiPhong: room.loaiPhong || room.type || room.loaiThue,
        giaThue: room.giaThue ?? room.price,
        diaChi: room.diaChi || room.address,
        urlImg: room.urlImg || room.img,
        tinhTrang: room.tinhTrang || room.status,
        danhSachGiuong: []
      });
    }

    if (room.maGiuong) {
      const current = map.get(id);
      current.danhSachGiuong.push(room.maGiuong);
    }
  });

  return [...map.values()];
}

export default function LapLichChoHoSo({ profile, onBack, onCreated }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [regionValid, setRegionValid] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [step, setStep] = useState('rooms');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdSchedule, setCreatedSchedule] = useState(null);

  useEffect(() => {
    if (!profile?.maDangKy) return;

    setLoadingRooms(true);
    setRoomError('');
    setRooms([]);
    setSelectedRoomIds([]);
    setStep('rooms');

    lichXemPhongApi.getPhongPhuHop(profile.maDangKy)
      .then((res) => {
        const payload = res.data;
        const list = normalizeRooms(payload);
        setRooms(list);
        setRegionValid(payload?.isRegionValid ?? !payload?.khongCoChiNhanhPhuHop);
      })
      .catch((err) => {
        setRoomError(err.response?.data?.message || err.message || 'Không thể tải danh sách phòng phù hợp.');
      })
      .finally(() => setLoadingRooms(false));
  }, [profile?.maDangKy]);

  const selectedRooms = useMemo(
    () => rooms.filter((room) => selectedRoomIds.includes(room.maPhong)),
    [rooms, selectedRoomIds]
  );
  const requiredSlots = useMemo(() => {
    const total = Number(profile?.soNguoiO || profile?.soNguoiDuKienO || 0);
    const byGender = Number(profile?.soNam || 0) + Number(profile?.soNu || 0);
    return total || byGender || 1;
  }, [profile]);

  const toggleRoom = (roomId) => {
    setSelectedRoomIds((current) => (
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId]
    ));
  };

  const handleCreateSchedule = async () => {
    if (!formDate || !formTime || selectedRooms.length === 0) return;

    setSaving(true);
    try {
      const res = await lichXemPhongApi.create({
        maDangKy: profile.maDangKy,
        khachHangId: profile.maKhachHang,
        rooms: selectedRooms.map((room) => ({ maPhong: room.maPhong })),
        thoiGianXem: `${formDate}T${formTime}:00`,
        ghiChu: formNote || null
      });
      setCreatedSchedule(res.data);
      if (onCreated) onCreated(res.data);
    } catch (err) {
      alert('Lỗi khi lập lịch xem phòng: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ktp-container">
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
        <div>
          <button
            type="button"
            className="ktp-btn-cancel"
            style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={onBack}
          >
            <Icon name="arrow_back" /> Quay lại hồ sơ
          </button>
          <h2 style={{ margin: 0, color: '#191c1d', fontSize: '24px' }}>Lập lịch xem phòng cho {profile?.maDangKy}</h2>
          <p style={{ margin: '6px 0 0', color: '#6f797a' }}>
            {profile?.hoTenKhach || profile?.customerName || 'Khách hàng'} · {profile?.sdtKhach || profile?.sdt || ''} · {formatGender(profile)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['rooms', 'time'].map((item, index) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: step === item ? '#2f6765' : '#eef2f2',
                color: step === item ? '#ffffff' : '#3f494a',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              <span>{index + 1}</span>
              <span>{item === 'rooms' ? 'Chọn phòng' : 'Thời gian hẹn'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ktp-detail-card" style={{ padding: '18px', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Khu vực</div>
          <strong style={{ color: '#191c1d' }}>{profile?.khuVucMongMuon || 'Chưa có'}</strong>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Loại phòng</div>
          <strong style={{ color: '#191c1d' }}>{profile?.loaiPhongYeuCau || 'Chưa có'}</strong>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Số người</div>
          <strong style={{ color: '#191c1d' }}>{profile?.soNguoiO || profile?.soNguoiDuKienO || 0} người</strong>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6f797a', marginBottom: '4px' }}>Mức giá tối đa</div>
          <strong style={{ color: '#191c1d' }}>{formatMoney(profile?.mucGia || profile?.mucGiaToiDa) || 'Chưa có'}</strong>
        </div>
      </section>

      {step === 'rooms' && (
        <section>
          {!regionValid && (
            <div style={{ padding: '14px 16px', borderRadius: '6px', backgroundColor: '#fff3cd', color: '#6f4f00', marginBottom: '16px', borderLeft: '4px solid #f4b400' }}>
              Khu vực mong muốn chưa khớp chi nhánh đang hoạt động. Cần liên hệ lại khách trước khi lập lịch.
            </div>
          )}

          {loadingRooms && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6f797a' }}>
              <div className="ktp-spinner" style={{ marginBottom: '12px' }} />
              <div>Đang tải danh sách phòng phù hợp...</div>
            </div>
          )}

          {!loadingRooms && roomError && (
            <div style={{ padding: '24px', color: '#ba1a1a', backgroundColor: '#ffebee', borderRadius: '6px' }}>{roomError}</div>
          )}

          {!loadingRooms && !roomError && rooms.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6f797a', backgroundColor: '#f8fafa', borderRadius: '6px' }}>
              Không có phòng/giường phù hợp để lập lịch cho phiếu này.
            </div>
          )}

          {!loadingRooms && rooms.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {rooms.map((room) => {
                const selected = selectedRoomIds.includes(room.maPhong);
                return (
                  <article
                    key={room.maPhong}
                    className="ktp-detail-card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      border: selected ? '2px solid #2f6765' : '1px solid #d7dddd',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff'
                    }}
                    onClick={() => toggleRoom(room.maPhong)}
                  >
                    <div style={{ height: '140px', backgroundColor: '#eef2f2', overflow: 'hidden' }}>
                      {room.urlImg ? (
                        <img src={room.urlImg} alt={room.tenPhong} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f797a' }}>
                          <Icon name="meeting_room" />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', color: '#191c1d' }}>{room.tenPhong}</h3>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6f797a' }}>{room.loaiPhong}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRoom(room.maPhong)}
                          onClick={(event) => event.stopPropagation()}
                          style={{ width: '18px', height: '18px', accentColor: '#2f6765' }}
                        />
                      </div>
                      <div style={{ marginTop: '12px', display: 'grid', gap: '6px', fontSize: '13px', color: '#3f494a' }}>
                        <div><strong>Chi nhánh:</strong> {room.tenChiNhanh || room.diaChi}</div>
                        <div><strong>Giới tính:</strong> {room.gioiTinhChoPhep || 'Không phân biệt'}</div>
                        <div><strong>Giường trống:</strong> {room.soGiuongTrong ?? room.soGiuongDuKienXep ?? 0}</div>
                        <div><strong>Số chỗ cần xếp:</strong> {room.soGiuongDuKienXep ?? requiredSlots} chỗ</div>
                        {room.danhSachGiuong?.length > 0 && <div><strong>Giường:</strong> {room.danhSachGiuong.join(', ')}</div>}
                      </div>
                      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="ktp-badge-success">{room.tinhTrang || 'Khả dụng'}</span>
                        <strong style={{ color: '#2f6765' }}>{formatMoney(room.giaThue)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="ktp-btn-cancel" onClick={onBack}>Hủy</button>
            <button
              className="ktp-btn-submit"
              disabled={selectedRooms.length === 0}
              style={{ opacity: selectedRooms.length === 0 ? 0.55 : 1 }}
              onClick={() => setStep('time')}
            >
              Tiếp tục
            </button>
          </div>
        </section>
      )}

      {step === 'time' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, 0.8fr)', gap: '20px' }}>
          <div className="ktp-detail-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="event" /> Thời gian xem phòng
            </h3>
            <div className="ktp-grid-2" style={{ gap: '18px' }}>
              <div>
                <label className="ktp-filter-label">Ngày xem phòng</label>
                <input className="ktp-input" type="date" value={formDate} onChange={(event) => setFormDate(event.target.value)} />
              </div>
              <div>
                <label className="ktp-filter-label">Giờ hẹn</label>
                <input className="ktp-input" type="time" value={formTime} onChange={(event) => setFormTime(event.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="ktp-filter-label">Ghi chú</label>
                <textarea className="ktp-textarea" rows="3" value={formNote} onChange={(event) => setFormNote(event.target.value)} placeholder="VD: Khách muốn xem phòng vào cổng chính..." />
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setStep('rooms')}>Quay lại chọn phòng</button>
              <button
                className="ktp-btn-submit"
                disabled={!formDate || !formTime || saving}
                style={{ opacity: (!formDate || !formTime || saving) ? 0.55 : 1 }}
                onClick={handleCreateSchedule}
              >
                {saving ? 'Đang lưu...' : 'Lưu lịch hẹn'}
              </button>
            </div>
          </div>

          <aside className="ktp-detail-card" style={{ padding: '20px', backgroundColor: '#f8fafa' }}>
            <h4 style={{ margin: '0 0 14px', color: '#2f6765', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0' }}>Phòng đã chọn</h4>
            <div style={{ display: 'grid', gap: '10px' }}>
              {selectedRooms.map((room) => (
                <div key={room.maPhong} style={{ padding: '12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #dde3e3' }}>
                  <strong style={{ display: 'block', color: '#191c1d' }}>{room.tenPhong}</strong>
                  <span style={{ display: 'block', marginTop: '4px', color: '#6f797a', fontSize: '13px' }}>{room.tenChiNhanh || room.diaChi}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      )}

      {createdSchedule && (
        <div className="ktp-modal-overlay">
          <div className="ktp-modal" style={{ width: '420px', maxWidth: '90vw' }}>
            <div className="ktp-modal-body" style={{ padding: '32px 24px', textAlign: 'center', display: 'block' }}>
              <div style={{ color: '#2f6765', fontSize: '48px', marginBottom: '14px' }}><Icon name="check_circle" /></div>
              <h3 style={{ margin: '0 0 8px', color: '#191c1d' }}>Đã lập lịch xem phòng</h3>
              <p style={{ margin: '0 0 22px', color: '#6f797a' }}>
                Lịch {createdSchedule.id || `${profile.maDangKy}`} đã được lưu cho phiếu {profile.maDangKy}.
              </p>
              <button className="ktp-btn-submit" style={{ width: '100%', justifyContent: 'center' }} onClick={onBack}>Quay lại hồ sơ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
