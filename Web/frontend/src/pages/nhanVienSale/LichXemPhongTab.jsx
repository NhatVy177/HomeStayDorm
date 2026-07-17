import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { lichXemPhongApi } from '../lichXemPhong/lichXemPhong.api.js';

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value) {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  return {
    date: date.toLocaleDateString('vi-VN'),
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };
}

function statusStyle(status = '') {
  if (status === 'Đã hủy' || status === 'Yêu cầu hủy') {
    return { className: 'ktp-badge-danger', style: { backgroundColor: '#ffebee', color: '#c62828' } };
  }
  if (status === 'Đã xem') {
    return { className: 'ktp-badge-success', style: { backgroundColor: '#e8f5e9', color: '#2e7d32' } };
  }
  if (status === 'Yêu cầu đổi lịch') {
    return { className: 'ktp-badge-info', style: { backgroundColor: '#e3f2fd', color: '#1565c0' } };
  }
  return { className: 'ktp-badge-warning', style: {} };
}

export default function LichXemPhongTab() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ keyword: '', status: '', fromDate: '', toDate: '' });

  const filteredSchedules = useMemo(() => {
    const keyword = filters.keyword.trim().toLocaleLowerCase('vi-VN');

    return schedules.filter((schedule) => {
      const searchableText = [
        schedule.id,
        schedule.maDangKy,
        schedule.hoTenKhach,
        schedule.sdtKhach,
        schedule.danhSachPhong,
        schedule.maPhong
      ].filter(Boolean).join(' ').toLocaleLowerCase('vi-VN');
      const scheduleDate = toDateInput(schedule.thoiGianHen);

      if (keyword && !searchableText.includes(keyword)) return false;
      if (filters.status && schedule.trangThai !== filters.status) return false;
      if (filters.fromDate && (!scheduleDate || scheduleDate < filters.fromDate)) return false;
      if (filters.toDate && (!scheduleDate || scheduleDate > filters.toDate)) return false;
      return true;
    });
  }, [filters, schedules]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const clearFilters = () => {
    setFilters({ keyword: '', status: '', fromDate: '', toDate: '' });
  };

  const fetchSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await lichXemPhongApi.getAll();
      setSchedules(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const openReschedule = (schedule) => {
    setSelectedSchedule(schedule);
    setNewDate(toDateInput(schedule.thoiGianHen));
    setNewTime(toTimeInput(schedule.thoiGianHen));
    setNote('');
    setModalType('reschedule');
  };

  const openCancel = (schedule) => {
    setSelectedSchedule(schedule);
    setNote('');
    setModalType('cancel');
  };

  const handleReschedule = async () => {
    if (!selectedSchedule || !newDate || !newTime) return;

    setSaving(true);
    try {
      await lichXemPhongApi.capNhat(selectedSchedule.id, {
        thaoTac: 'doi-lich',
        thoiGianXem: `${newDate}T${newTime}:00`,
        ghiChuXuLy: note || null
      });
      setModalType(null);
      await fetchSchedules();
    } catch (err) {
      alert('Lỗi khi đổi lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedSchedule) return;

    setSaving(true);
    try {
      await lichXemPhongApi.capNhat(selectedSchedule.id, {
        thaoTac: 'huy',
        ghiChuXuLy: note || null
      });
      setModalType(null);
      await fetchSchedules();
    } catch (err) {
      alert('Lỗi khi hủy lịch: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ktp-container">
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#191c1d', fontSize: '24px' }}>Lịch xem phòng</h2>
          <p style={{ margin: '6px 0 0', color: '#6f797a' }}>Theo dõi lịch đã hẹn, đổi lịch hoặc hủy lịch khi cần.</p>
        </div>
        <button className="ktp-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={fetchSchedules}>
          <Icon name="refresh" /> Làm mới
        </button>
      </section>

      <section className="sale-schedule-filters" aria-label="Bộ lọc lịch xem phòng">
        <div className="sale-schedule-filter sale-schedule-filter-search">
          <label className="ktp-filter-label" htmlFor="schedule-search">Tìm kiếm</label>
          <div className="ktp-input-icon-wrap">
            <Icon name="search" className="ktp-input-icon" />
            <input
              id="schedule-search"
              className="ktp-input ktp-input-with-icon"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              placeholder="Mã lịch, khách hàng, SĐT hoặc phòng..."
            />
          </div>
        </div>
        <div className="sale-schedule-filter">
          <label className="ktp-filter-label" htmlFor="schedule-status">Trạng thái</label>
          <select
            id="schedule-status"
            className="ktp-input"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Chờ xem">Chờ xem</option>
            <option value="Yêu cầu đổi lịch">Yêu cầu đổi lịch</option>
            <option value="Yêu cầu hủy">Yêu cầu hủy</option>
            <option value="Đã xem">Đã xem</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
        </div>
        <div className="sale-schedule-filter">
          <label className="ktp-filter-label" htmlFor="schedule-from-date">Từ ngày</label>
          <input
            id="schedule-from-date"
            className="ktp-input"
            type="date"
            value={filters.fromDate}
            max={filters.toDate || undefined}
            onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
          />
        </div>
        <div className="sale-schedule-filter">
          <label className="ktp-filter-label" htmlFor="schedule-to-date">Đến ngày</label>
          <input
            id="schedule-to-date"
            className="ktp-input"
            type="date"
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
          />
        </div>
        <div className="sale-schedule-filter-actions">
          <span>{filteredSchedules.length}/{schedules.length} lịch</span>
          <button className="ktp-btn-outline" type="button" disabled={!hasActiveFilters} onClick={clearFilters}>
            <Icon name="filter_list" /> Xóa lọc
          </button>
        </div>
      </section>

      <section className="ktp-table-section">
        {loading && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6f797a' }}>
            <div className="ktp-spinner" style={{ marginBottom: '12px' }} />
            <div>Đang tải danh sách lịch hẹn...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '24px', color: '#ba1a1a', backgroundColor: '#ffebee', borderRadius: '6px' }}>{error}</div>
        )}

        {!loading && !error && schedules.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ color: '#bec8c9', marginBottom: '16px' }}><Icon name="event" /></div>
            <h3 style={{ color: '#3f494a', marginBottom: '8px' }}>Chưa có lịch xem phòng</h3>
            <p style={{ color: '#6f797a' }}>Lịch mới sẽ xuất hiện sau khi sale lập lịch từ hồ sơ đăng ký.</p>
          </div>
        )}

        {!loading && !error && schedules.length > 0 && filteredSchedules.length === 0 && (
          <div className="sale-schedule-empty-filter">
            <Icon name="search" />
            <h3>Không tìm thấy lịch phù hợp</h3>
            <p>Thử thay đổi tiêu chí hoặc xóa bộ lọc để xem toàn bộ lịch.</p>
            <button className="ktp-btn-outline" type="button" onClick={clearFilters}>Xóa bộ lọc</button>
          </div>
        )}

        {!loading && !error && filteredSchedules.length > 0 && (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã lịch</th>
                <th>Khách hàng</th>
                <th>Phòng xem</th>
                <th>Thời gian</th>
                <th className="text-center">Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule) => {
                const time = formatDateTime(schedule.thoiGianHen);
                const badge = statusStyle(schedule.trangThai);
                const isRescheduleDisabled = ['Đã hủy', 'Đã xem'].includes(schedule.trangThai);
                const isCancelDisabled = !schedule.coTheHuy;
                return (
                  <tr key={schedule.id}>
                    <td>
                      <strong className="ktp-text-primary">{schedule.id}</strong>
                      <div style={{ fontSize: '12px', color: '#6f797a' }}>{schedule.maDangKy}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#191c1d' }}>{schedule.hoTenKhach}</div>
                      <div style={{ fontSize: '12px', color: '#6f797a' }}>{schedule.sdtKhach}</div>
                    </td>
                    <td>{schedule.danhSachPhong || schedule.maPhong || 'Chưa có phòng'}</td>
                    <td>
                      <div style={{ color: '#191c1d', marginBottom: '4px' }}>{time.date}</div>
                      <div style={{ color: '#6f797a', fontSize: '13px' }}>{time.time}</div>
                    </td>
                    <td className="text-center">
                      <span className={`ktp-badge ${badge.className}`} style={badge.style}>{schedule.trangThai}</span>
                      {schedule.ghiChu && (
                        <div style={{ marginTop: '6px', color: '#6f797a', fontSize: '12px', lineHeight: 1.35, textAlign: 'left' }}>
                          {schedule.ghiChu}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="sale-schedule-action-btn sale-schedule-action-btn-reschedule"
                          disabled={isRescheduleDisabled}
                          onClick={() => openReschedule(schedule)}
                        >
                          <Icon name="event_note" style={{ fontSize: '16px' }} /> Đổi lịch
                        </button>
                        <button
                          className="sale-schedule-action-btn sale-schedule-action-btn-cancel"
                          disabled={isCancelDisabled}
                          onClick={() => openCancel(schedule)}
                        >
                          <Icon name="cancel" style={{ fontSize: '16px' }} /> Hủy
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {modalType === 'reschedule' && selectedSchedule && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(event) => event.stopPropagation()} style={{ width: '480px', maxWidth: '90vw' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#2f6765', color: '#ffffff', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '18px', margin: 0, color: '#ffffff' }}>Đổi lịch xem phòng</h3>
              <button className="ktp-modal-close" style={{ color: '#ffffff' }} onClick={() => setModalType(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', display: 'block' }}>
              <div style={{ padding: '14px', borderRadius: '6px', backgroundColor: '#f4f6f6', marginBottom: '18px', color: '#3f494a' }}>
                <strong style={{ color: '#191c1d' }}>{selectedSchedule.hoTenKhach}</strong>
                <div style={{ marginTop: '4px', fontSize: '13px' }}>{selectedSchedule.danhSachPhong}</div>
              </div>
              <div className="ktp-grid-2" style={{ gap: '16px' }}>
                <div>
                  <label className="ktp-filter-label">Ngày xem mới</label>
                  <input className="ktp-input" type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
                </div>
                <div>
                  <label className="ktp-filter-label">Giờ xem mới</label>
                  <input className="ktp-input" type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="ktp-filter-label">Ghi chú xử lý</label>
                  <textarea className="ktp-textarea" rows="3" value={note} onChange={(event) => setNote(event.target.value)} />
                </div>
              </div>
            </div>
            <div className="ktp-modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
              <button className="ktp-btn-submit" disabled={!newDate || !newTime || saving} onClick={handleReschedule}>
                {saving ? 'Đang lưu...' : 'Xác nhận đổi lịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'cancel' && selectedSchedule && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" onClick={(event) => event.stopPropagation()} style={{ width: '420px', maxWidth: '90vw' }}>
            <div className="ktp-modal-body" style={{ padding: '28px 24px', display: 'block', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', backgroundColor: '#ffebee', color: '#ba1a1a', marginBottom: '16px' }}>
                <Icon name="warning" />
              </div>
              <h3 style={{ margin: '0 0 8px', color: '#191c1d' }}>Hủy lịch xem phòng?</h3>
              <p style={{ margin: '0 0 18px', color: '#6f797a', lineHeight: 1.5 }}>
                Lịch {selectedSchedule.id} của {selectedSchedule.hoTenKhach} sẽ chuyển sang trạng thái đã hủy.
              </p>
              <textarea
                className="ktp-textarea"
                rows="3"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ghi chú lý do hủy..."
                style={{ textAlign: 'left', marginBottom: '18px' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="ktp-btn-cancel" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModalType(null)}>Quay lại</button>
                <button className="ktp-btn-submit" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#ba1a1a' }} disabled={saving || !selectedSchedule.coTheHuy} onClick={handleCancel}>
                  {saving ? 'Đang hủy...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
