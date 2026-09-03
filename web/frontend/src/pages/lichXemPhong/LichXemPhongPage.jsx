import React, { useState } from 'react';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import './lichXemPhong.css';

/* ─── SVG Icon helper ─── */
function Icon({ name, className = '' }) {
  const icons = {
    schedule: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    checkCircle: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
    cancel: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </>
    ),
    chat: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    refresh: (
      <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    ),
    map: (
      <>
        <path d="M12 21s-8-4.35-8-11.5a8 8 0 1 1 16 0C20 16.65 12 21 12 21z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    add: <path d="M12 5v14M5 12h14" />,
    filter: (
      <>
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
    location: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    starHalf: (
      <>
        <path d="M12 17.77L5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2v15.77z" />
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77" />
      </>
    ),
    close: <path d="M18 6 6 18M6 6l12 12" />,
    room: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    person: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    )
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.room}
    </svg>
  );
}

/* ─── Filled star SVG ─── */
function FilledStarIcon({ half = false }) {
  if (half) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
        <defs>
          <linearGradient id="half-grad">
            <stop offset="50%" stopColor="#a43c12" />
            <stop offset="50%" stopColor="#e1e3e4" />
          </linearGradient>
        </defs>
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          fill="url(#half-grad)"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16 }}>
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill="currentColor"
      />
    </svg>
  );
}

/* ─── Status badge ─── */
const STATUS_CONFIG = {
  upcoming: {
    label: 'Chờ xem',
    icon: 'schedule',
    cls: 'lxp-status-upcoming',
  },
  pending: {
    label: 'Chờ xác nhận',
    icon: 'pending',
    cls: 'lxp-status-pending',
  },
  cancelRequested: {
    label: 'Chờ xác nhận hủy',
    icon: 'pending',
    cls: 'lxp-status-cancel-requested',
  },
  done: {
    label: 'Đã hoàn thành',
    icon: 'checkCircle',
    cls: 'lxp-status-done',
  },
  cancelled: {
    label: 'Đã hủy',
    icon: 'cancel',
    cls: 'lxp-status-cancelled',
  },
};

const RESCHEDULE_MIN_LEAD_MS = 2 * 60 * 60 * 1000;

function getAppointmentDate(appt) {
  const rawDate = appt?.rawSchedule?.thoiGianHen || appt?.appointmentAt;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function canUseReschedule(appt) {
  const appointmentDate = getAppointmentDate(appt);
  if (!appointmentDate) return false;
  return appointmentDate.getTime() - Date.now() >= RESCHEDULE_MIN_LEAD_MS;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`lxp-status ${cfg.cls}`}>
      <Icon name={cfg.icon} />
      {cfg.label}
    </span>
  );
}

/* ─── Star rating display ─── */
function StarRating({ value = 4.5 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="lxp-stars">
      {Array.from({ length: full }).map((_, i) => (
        <FilledStarIcon key={`f${i}`} />
      ))}
      {half && <FilledStarIcon half />}
      {Array.from({ length: empty }).map((_, i) => (
        <Icon key={`e${i}`} name="star" style={{ width: 16, height: 16, color: '#e1e3e4' }} />
      ))}
    </div>
  );
}

/* ─── Room image ─── */
function RoomImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="lxp-room-img-placeholder">
        <Icon name="room" style={{ width: 32, height: 32 }} />
        <span>Ảnh phòng</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}

/* ─── Appointment Card ─── */
function AppointmentCard({ appt, onReschedule, onCancel, onViewDetail }) {
  const isPast = appt.status === 'done' || appt.status === 'cancelled';
  const canReschedule = canUseReschedule(appt);

  return (
    <div className={`lxp-card ${isPast ? 'is-past' : ''}`}>
      <div className="lxp-card-inner">
        {/* Room image */}
        <div className="lxp-room-img-wrap">
          <RoomImage src={appt.roomImg} alt={appt.roomName} />
        </div>

        {/* Body */}
        <div className="lxp-card-body">
          {/* Header row */}
          <div className="lxp-card-head">
            <div>
              <h3 className="lxp-card-title">{appt.roomName}</h3>
              <p className="lxp-card-location">
                <Icon name="location" />
                {appt.address}
              </p>
            </div>
            <StatusBadge status={appt.status} />
          </div>

          {/* Info grid */}
          <div className="lxp-info-grid">
            {/* Time */}
            <div className="lxp-info-item">
              <div className="lxp-info-icon">
                <Icon name="clock" />
              </div>
              <div>
                <div className="lxp-info-label">Thời gian</div>
                <div className="lxp-info-value">{appt.time}</div>
              </div>
            </div>

            {/* Staff */}
            <div className="lxp-info-item">
              <div className="lxp-info-icon">
                {appt.staffImg ? (
                  <img src={appt.staffImg} alt={appt.staffName} />
                ) : (
                  <Icon name="person" />
                )}
              </div>
              <div>
                <div className="lxp-info-label">Nhân viên hướng dẫn</div>
                <div className="lxp-info-value">{appt.staffName}</div>
                <div className="lxp-info-phone">
                  {appt.staffPhone ? (
                    <a href={`tel:${appt.staffPhone}`}>{appt.staffPhone}</a>
                  ) : (
                    'Chưa cập nhật SĐT'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Rating for completed */}
          {appt.status === 'done' && appt.rating != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--lxp-on-surface-var)', fontWeight: 600 }}>
                Đánh giá của bạn:
              </span>
              <StarRating value={appt.rating} />
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="lxp-card-footer">
        {appt.status === 'upcoming' && (
          <>
            <button
              className="lxp-card-btn lxp-card-btn-danger"
              type="button"
              onClick={() => onCancel?.(appt)}
            >
              <Icon name="cancel" />
              Yêu cầu hủy hẹn
            </button>
            <button
              className="lxp-card-btn lxp-card-btn-outline-primary"
              type="button"
              onClick={() => canReschedule && onReschedule?.(appt)}
              disabled={!canReschedule}
              title={canReschedule ? 'Yêu cầu đổi lịch' : 'Chỉ được đổi lịch trước giờ hẹn ít nhất 2 tiếng'}
            >
              <Icon name="refresh" />
              Yêu cầu đổi lịch
            </button>
            <button
              className="lxp-card-btn lxp-card-btn-outline"
              type="button"
              onClick={() => onViewDetail?.(appt)}
            >
              <Icon name="eye" />
              Xem chi tiết phòng
            </button>
          </>
        )}

        {appt.status === 'pending' && (
          <>
            <button
              className="lxp-card-btn lxp-card-btn-primary"
              type="button"
              onClick={() => onViewDetail?.(appt)}
            >
              <Icon name="eye" />
              Xem chi tiết phòng
            </button>
            <button
              className="lxp-card-btn lxp-card-btn-outline"
              type="button"
              onClick={() => onCancel?.(appt)}
            >
              <Icon name="cancel" />
              Yêu cầu hủy hẹn
            </button>
          </>
        )}

        {appt.status === 'done' && (
          <button
            className="lxp-card-btn lxp-card-btn-outline"
            type="button"
            onClick={() => onViewDetail?.(appt)}
          >
            <Icon name="eye" />
            Xem chi tiết lịch hẹn
          </button>
        )}

        {appt.status === 'cancelled' && (
          <span style={{ fontSize: 13, color: 'var(--lxp-error)', fontWeight: 600 }}>
            Lịch này đã bị hủy.
          </span>
        )}

        {appt.status === 'cancelRequested' && (
          <span className="lxp-cancel-requested-message">
            Lịch này đã gửi yêu cầu hủy và đang chờ nhân viên Sale xác nhận.
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Timeline node ─── */
const DOT_CLASS = {
  upcoming: 'lxp-dot-upcoming',
  pending: 'lxp-dot-pending',
  cancelRequested: 'lxp-dot-pending',
  done: 'lxp-dot-past',
  cancelled: 'lxp-dot-past',
};

const DAY_CLASS = {
  upcoming: '',
  pending: 'is-pending',
  cancelRequested: 'is-pending',
  done: 'is-past',
  cancelled: 'is-past',
};

function TimelineNode({ appt, ...handlers }) {
  return (
    <li className="lxp-node">
      {/* Date marker */}
      <div className="lxp-date-marker">
        <span className={`lxp-date-day ${DAY_CLASS[appt.status] || ''}`}>
          {appt.day}
        </span>
        <div className="lxp-date-meta">
          <span className="lxp-date-month">{appt.month}</span>
          <span className="lxp-date-weekday">{appt.weekday}</span>
        </div>
      </div>

      {/* Timeline dot — rendered via CSS absolute */}
      <span
        className={`lxp-dot-pos ${DOT_CLASS[appt.status] || 'lxp-dot-pending'}`}
        style={{
          background:
            appt.status === 'upcoming' ? 'var(--lxp-primary)' :
            appt.status === 'done' ? 'var(--kp-success, #10b981)' : 'var(--lxp-outline-var)',
          border: '3px solid var(--lxp-surface)',
          boxShadow:
            appt.status === 'upcoming'
              ? '0 0 0 4px rgba(0,102,109,0.12)'
              : appt.status === 'done'
              ? '0 0 0 4px rgba(16, 185, 129, 0.12)'
              : 'none',
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <AppointmentCard appt={appt} {...handlers} />
    </li>
  );
}

/* ─── New appointment modal ─── */
function NewAppointmentModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    roomCode: '',
    date: '',
    time: '',
    note: '',
  });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.(form);
    onClose?.();
  }

  return (
    <div className="lxp-modal-backdrop" onMouseDown={onClose}>
      <div className="lxp-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lxp-modal-head">
          <h3>Đặt lịch xem phòng mới</h3>
          <button className="lxp-modal-close" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="lxp-modal-body">
            <div className="lxp-modal-field">
              <label htmlFor="lxp-roomCode">Mã phòng / Tên phòng</label>
              <input
                id="lxp-roomCode"
                name="roomCode"
                type="text"
                placeholder="VD: Homestay Sunshine - Phòng 302"
                value={form.roomCode}
                onChange={handleChange}
                required
              />
            </div>
            <div className="lxp-modal-field">
              <label htmlFor="lxp-date">Ngày xem</label>
              <input
                id="lxp-date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="lxp-modal-field">
              <label htmlFor="lxp-time">Khung giờ</label>
              <select
                id="lxp-time"
                name="time"
                value={form.time}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn khung giờ --</option>
                <option value="08:00 - 09:00">08:00 - 09:00</option>
                <option value="09:00 - 10:00">09:00 - 10:00</option>
                <option value="10:00 - 11:00">10:00 - 11:00</option>
                <option value="14:00 - 15:00">14:00 - 15:00</option>
                <option value="15:00 - 16:00">15:00 - 16:00</option>
                <option value="16:00 - 17:00">16:00 - 17:00</option>
              </select>
            </div>
            <div className="lxp-modal-field">
              <label htmlFor="lxp-note">Ghi chú (tuỳ chọn)</label>
              <textarea
                id="lxp-note"
                name="note"
                placeholder="Thêm ghi chú cho nhân viên hướng dẫn..."
                value={form.note}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="lxp-modal-footer">
            <button className="lxp-btn lxp-btn-outline" type="button" onClick={onClose}>Hủy</button>
            <button className="lxp-btn lxp-btn-primary" type="submit">Xác nhận đặt lịch</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Reschedule modal ─── */
function toLocalDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSuggestedDateTime(dateValue, timeValue) {
  const [year, month, day] = String(dateValue || '').split('-');
  return `${day}/${month}/${year} ${timeValue}`;
}

function RescheduleModal({ appt, onClose, onSubmit }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = toLocalDateInputValue(tomorrow);
  const [suggestedSlots, setSuggestedSlots] = useState([{ date: '', time: '' }]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!appt) return null;

  function updateSuggestedSlot(index, field, value) {
    setSuggestedSlots((current) => current.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, [field]: value } : slot
    )));
  }

  function addSuggestedSlot() {
    setSuggestedSlots((current) => (
      current.length >= 3 ? current : [...current, { date: '', time: '' }]
    ));
  }

  function removeSuggestedSlot(index) {
    setSuggestedSlots((current) => (
      current.length === 1 ? current : current.filter((_, slotIndex) => slotIndex !== index)
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!canUseReschedule(appt)) {
      setError('Chỉ được sử dụng tính năng đổi lịch trước giờ hẹn ít nhất 2 tiếng.');
      return;
    }

    const normalizedSlots = suggestedSlots.map((slot) => ({
      date: slot.date,
      time: slot.time
    }));

    if (normalizedSlots.some((slot) => !slot.date || !slot.time)) {
      setError('Vui lòng chọn đầy đủ ngày và giờ cho từng thời gian đề xuất.');
      return;
    }
    if (normalizedSlots.some((slot) => slot.date < minDate)) {
      setError('Mỗi ngày xem phải sau ngày hiện tại.');
      return;
    }
    if (normalizedSlots.some((slot) => slot.time < '07:00' || slot.time > '17:00')) {
      setError('Mỗi giờ xem phòng chỉ được chọn từ 07:00 đến 17:00.');
      return;
    }

    const slotKeys = normalizedSlots.map((slot) => `${slot.date} ${slot.time}`);
    if (new Set(slotKeys).size !== slotKeys.length) {
      setError('Các thời gian đề xuất không được trùng nhau.');
      return;
    }

    const timeText = normalizedSlots
      .map((slot) => formatSuggestedDateTime(slot.date, slot.time))
      .join('; ');

    setSubmitting(true);
    try {
      await onSubmit?.(appt, {
        timeText,
        suggestedTimes: normalizedSlots,
        reason
      });
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể gửi yêu cầu đổi lịch.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lxp-modal-backdrop" onMouseDown={onClose}>
      <div className="lxp-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lxp-modal-head">
          <h3>Yêu cầu đổi lịch xem phòng</h3>
          <button className="lxp-modal-close" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="lxp-modal-body">
            <p style={{ fontSize: 14, color: 'var(--lxp-on-surface-var)', margin: 0 }}>
              Bạn đang đổi lịch cho <strong style={{ color: 'var(--lxp-on-surface)' }}>{appt.roomName}</strong>.
            </p>
            {error && <p style={{ color: 'var(--lxp-error)', fontSize: 13, margin: 0 }}>{error}</p>}
            <div className="lxp-modal-field">
              <label>Thời gian đề xuất</label>
              <div className="lxp-suggested-times">
                {suggestedSlots.map((slot, index) => (
                  <div className="lxp-date-time-row" key={index}>
                    <input
                      aria-label={`Ngày xem đề xuất ${index + 1}`}
                      type="date"
                      min={minDate}
                      value={slot.date}
                      onChange={(e) => updateSuggestedSlot(index, 'date', e.target.value)}
                      required
                    />
                    <input
                      aria-label={`Giờ xem đề xuất ${index + 1}`}
                      type="time"
                      min="07:00"
                      max="17:00"
                      step="900"
                      value={slot.time}
                      onChange={(e) => updateSuggestedSlot(index, 'time', e.target.value)}
                      required
                    />
                    {suggestedSlots.length > 1 && (
                      <button
                        className="lxp-time-remove"
                        type="button"
                        aria-label={`Xóa thời gian đề xuất ${index + 1}`}
                        onClick={() => removeSuggestedSlot(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="lxp-field-helper-row">
                <small className="lxp-field-hint">Tối đa 3 thời gian. Ngày xem phải sau hôm nay, giờ xem từ 07:00 đến 17:00.</small>
                {suggestedSlots.length < 3 && (
                  <button className="lxp-add-time-btn" type="button" onClick={addSuggestedSlot}>
                    + Thêm thời gian
                  </button>
                )}
              </div>
            </div>
            <div className="lxp-modal-field">
              <label htmlFor="lxp-reason">Lý do đổi lịch</label>
              <textarea
                id="lxp-reason"
                placeholder="VD: Bận công việc đột xuất..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="lxp-modal-footer">
            <button className="lxp-btn lxp-btn-outline" type="button" onClick={onClose} disabled={submitting}>Thoát</button>
            <button className="lxp-btn lxp-btn-primary" type="submit" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Cancel modal ─── */
function CancelModal({ appt, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!appt) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onSubmit?.(appt, { reason });
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể gửi yêu cầu hủy lịch.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lxp-modal-backdrop" onMouseDown={onClose}>
      <div className="lxp-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="lxp-modal-head">
          <h3>Yêu cầu hủy lịch xem phòng</h3>
          <button className="lxp-modal-close" type="button" aria-label="Đóng" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="lxp-modal-body">
            <p style={{ fontSize: 14, color: 'var(--lxp-on-surface-var)', margin: 0 }}>
              Bạn đang yêu cầu hủy lịch cho <strong style={{ color: 'var(--lxp-on-surface)' }}>{appt.roomName}</strong>.
            </p>
            {error && <p style={{ color: 'var(--lxp-error)', fontSize: 13, margin: 0 }}>{error}</p>}
            <div className="lxp-modal-field">
              <label htmlFor="lxp-cancel-reason">Lý do hủy</label>
              <textarea
                id="lxp-cancel-reason"
                placeholder="VD: Đã tìm được phòng khác..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="lxp-modal-footer">
            <button className="lxp-btn lxp-btn-outline" type="button" onClick={onClose} disabled={submitting}>Thoát</button>
            <button className="lxp-btn lxp-btn-danger" style={{ backgroundColor: '#e53e3e', color: 'white' }} type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Filter tabs ─── */
const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'done', label: 'Đã hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

/* ─── Main Page Component ─── */
export default function LichXemPhongPage({ schedules = [], onViewRoomDetail, onReschedule, onCancel }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancelAppt, setCancelAppt] = useState(null);

  /* Map backend data to UI data */
  const appointments = schedules.map((schedule) => {
    const d = new Date(schedule.thoiGianHen);
    const isValidDate = !isNaN(d.valueOf());
    
    // Status logic based on DB TrangThai
    let status = 'pending';
    if (schedule.trangThai === 'Chờ xem') status = 'upcoming';
    if (schedule.trangThai === 'Đã xem') status = 'done';
    if (schedule.trangThai === 'Yêu cầu hủy') status = 'cancelRequested';
    if (schedule.trangThai === 'Đã hủy') status = 'cancelled';
    if (schedule.trangThai === 'Yêu cầu đổi lịch') status = 'pending';

    const timeStr = isValidDate ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa cập nhật';
    
    return {
      id: schedule.id || schedule.maDangKy + '_' + (schedule.thoiGianHen || Date.now()),
      status: status,
      rawStatus: schedule.trangThai,
      day: isValidDate ? d.getDate().toString().padStart(2, '0') : '--',
      month: isValidDate ? `Tháng ${d.getMonth() + 1}` : '---',
      weekday: isValidDate ? ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][d.getDay()] : '---',
      roomName: schedule.phongXem || `Lịch xem #${schedule.maDangKy}`,
      address: 'Homestay Dorm',
      time: timeStr,
      staffName: schedule.tenNhanVienSale || 'Đang cập nhật',
      staffPhone: schedule.sdtNhanVienSale || schedule.soDienThoaiNhanVienSale || '',
      staffImg: null,
      roomImg: schedule.hinhAnhPhong || null, // the component will handle fallback if null
      rating: null,
      rawSchedule: schedule
    };
  });

  /* Counts */
  const filterCounts = {
    all: appointments.length,
    upcoming: appointments.filter((a) => a.status === 'upcoming').length,
    pending: appointments.filter((a) => a.status === 'pending' || a.status === 'cancelRequested').length,
    done: appointments.filter((a) => a.status === 'done').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length
  };

  /* Filtered list */
  const filtered = activeFilter === 'all'
    ? appointments
    : appointments.filter((appointment) => (
      activeFilter === 'pending'
        ? appointment.status === 'pending' || appointment.status === 'cancelRequested'
        : appointment.status === activeFilter
    ));

  /* Handlers */
  function handleNewSubmit(form) {
    const newAppt = {
      id: Date.now(),
      status: 'pending',
      day: new Date(form.date).getDate().toString().padStart(2, '0'),
      month: `Tháng ${new Date(form.date).getMonth() + 1}`,
      weekday: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][
        new Date(form.date).getDay()
      ],
      roomName: form.roomCode,
      address: 'TP. Hồ Chí Minh',
      time: form.time,
      staffName: 'Chưa phân công',
      staffImg: null,
      roomImg: null,
      rating: null,
    };
    setAppointments((prev) => [newAppt, ...prev]);
  }

  function handleRescheduleSubmit(data) {
    // In real app: call API
    console.log('Reschedule:', data);
  }

  function handleCancel(appt) {
    if (window.confirm(`Bạn có chắc muốn hủy lịch xem "${appt.roomName}"?`)) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: 'cancelled' } : a))
      );
    }
  }

  return (
    <div className="lxp-page">
      {/* ── Summary + Filter chips ── */}
      <div className="lxp-chips-bar">
        <StatusFilterTabs
          items={FILTERS}
          activeKey={activeFilter}
          counts={filterCounts}
          onChange={setActiveFilter}
        />
      </div>

      {/* ── Timeline ── */}
      {filtered.length === 0 ? (
        <div className="lxp-empty">
          <Icon name="schedule" />
          <h3>Không có lịch nào</h3>
          <p>Bạn chưa có lịch xem phòng nào trong mục này.</p>
        </div>
      ) : (
        <div className="lxp-timeline-wrap">
          {/* Vertical line */}
          <div className="lxp-timeline-line" aria-hidden="true" />

          <ul className="lxp-timeline-list">
            {filtered.map((appt) => (
              <TimelineNode
                key={appt.id}
                appt={appt}
                onViewDetail={(a) => onViewRoomDetail?.(a.rawSchedule)}
                onReschedule={setRescheduleAppt}
                onCancel={setCancelAppt}
              />
            ))}
          </ul>
        </div>
      )}

      {/* ── Tip box ── */}
      <div className="lxp-tip-box">
        <div className="lxp-tip-icon">
          <Icon name="info" />
        </div>
        <div className="lxp-tip-content">
          <h4>Mẹo nhỏ cho bạn</h4>
          <p>
            Vui lòng đến sớm trước 5–10 phút để được nhân viên hướng dẫn kỹ lưỡng hơn.
            Nếu bạn có thay đổi đột xuất, hãy sử dụng tính năng "Đổi lịch" trước ít nhất 2 tiếng.
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      {showNewModal && (
        <NewAppointmentModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleNewSubmit}
        />
      )}
      {rescheduleAppt && (
        <RescheduleModal
          appt={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSubmit={onReschedule}
        />
      )}
      {cancelAppt && (
        <CancelModal
          appt={cancelAppt}
          onClose={() => setCancelAppt(null)}
          onSubmit={onCancel}
        />
      )}
    </div>
  );
}
