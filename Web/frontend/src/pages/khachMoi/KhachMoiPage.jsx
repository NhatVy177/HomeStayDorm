import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import PortalIcon from '../../components/common/PortalIcon.jsx';
import { khachMoiApi } from './khachMoi.api.js';
import './khachMoi.css';

const tabs = [
  { id: 'tong-quan', icon: 'home', title: 'Tổng quan', note: 'Việc cần chú ý hôm nay' },
  { id: 'tim-phong', icon: 'search', title: 'Tìm phòng', note: 'Xem phòng/giường còn trống' },
  { id: 'ho-so', icon: 'profile', title: 'Hồ sơ', note: 'Trạng thái đăng ký thuê' },
  { id: 'lich-xem', icon: 'calendar', title: 'Lịch xem phòng', note: 'Thời gian và phòng sẽ xem' },
  { id: 'ho-tro', icon: 'support', title: 'Hỗ trợ', note: 'Liên hệ khi cần tư vấn' }
];

const initialFilters = { tuKhoa: '', khuVuc: '', loaiPhong: '', mucGiaToiDa: '' };
const initialRentForm = {
  hinhThucThue: 'Ghép',
  khuVucMongMuon: 'Quận 1',
  loaiPhongYeuCau: 'Giường dorm',
  mucGia: '3000000',
  soNguoiO: '1',
  ngayDuKienVaoO: '2026-06-01',
  thoiHanThue: '',
  ghiChu: ''
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ/tháng';
}

function formatDate(value, withTime = false) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return new Intl.DateTimeFormat('vi-VN', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' }).format(date);
}

function getRoomArea(room = {}) {
  const addressParts = String(room.diaChi || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (addressParts.length >= 3) return addressParts[addressParts.length - 2];
  if (addressParts.length >= 2) return addressParts[addressParts.length - 1];

  return String(room.chiNhanh || '')
    .replace(/^HomeDorm\s+/i, '')
    .replace(/^Homestay Dorm\s+/i, '')
    .trim() || 'Chưa cập nhật';
}

function initials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase() || 'KH';
}

function statusTone(status) {
  if (['Chấp nhận', 'Đã xem', 'Đã lên lịch'].includes(status)) return 'done';
  if (['Từ chối', 'Đã hủy', 'Yêu cầu hủy'].includes(status)) return 'danger';
  return 'warn';
}

function Brand() {
  return (
    <span className="km-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
      <span style={{ fontSize: '19px', fontFamily: '"Montserrat", "Inter", sans-serif', fontWeight: '700', letterSpacing: '0' }}>
        <span style={{ color: '#00666d' }}>Homestay</span><span style={{ color: '#a43c12' }}>Dorm</span>
      </span>
    </span>
  );
}

function EmptyPanel({ title, children }) {
  return (
    <div className="km-empty">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export default function KhachMoiPage() {
  const { user, dangXuat } = useAuth();
  const [activeTab, setActiveTab] = useState('tong-quan');
  const [overview, setOverview] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailModal, setDetailModal] = useState(null);
  const [rentForm, setRentForm] = useState(initialRentForm);
  const [rentModal, setRentModal] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [newScheduleTime, setNewScheduleTime] = useState('2026-05-29T14:00');
  const [accountOpen, setAccountOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadPortal() {
    setLoading(true);
    setError('');
    try {
      const [{ data: summary }, { data: availableRooms }] = await Promise.all([
        khachMoiApi.getTongQuan(),
        khachMoiApi.getPhongKhaDung(filters)
      ]);
      setOverview(summary);
      setRooms(availableRooms);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tải thông tin khách hàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortal();
    // Initial loading uses the default empty filter only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const selectedRooms = useMemo(
    () => rooms.filter((room) => selectedIds.includes(room.id)),
    [rooms, selectedIds]
  );
  const latestProfile = overview?.hoSo?.[0];
  const latestSchedule = overview?.lichXem?.[0];

  function goTo(tab) {
    setActiveTab(tab);
    setAccountOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleRoom(id) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
  }

  function openDetail(roomId) {
    const room = rooms.find((r) => r.id === roomId);
    if (room) setDetailModal(room);
  }

  function openRentForm() {
    if (!selectedRooms.length) {
      setToast('Chọn ít nhất một phòng trước khi gửi nhu cầu thuê.');
      return;
    }

    const firstRoom = selectedRooms[0];
    setRentForm((current) => ({
      ...current,
      loaiPhongYeuCau: firstRoom.loaiPhong,
      mucGia: String(firstRoom.giaThue)
    }));
    setRentModal(true);
  }

  async function applyFilters(event) {
    event.preventDefault();
    try {
      const { data } = await khachMoiApi.getPhongKhaDung(filters);
      setRooms(data);
      setSelectedIds([]);
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể lọc phòng lúc này.');
    }
  }

  async function submitProfile(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await khachMoiApi.createHoSo({
        ...rentForm,
        phongQuanTam: selectedRooms.map((room) => room.tenPhong).join(', ')
      });
      setRentModal(false);
      setSelectedIds([]);
      setActiveTab('ho-so');
      await loadPortal();           // load xong mới show toast để không bị che
      setToast('Gửi hồ sơ đăng ký thuê thành công!');
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể gửi hồ sơ lúc này.');
    } finally {
      setSubmitting(false);
    }
  }

  async function requestScheduleChange(event) {
    event.preventDefault();
    if (!scheduleModal) return;
    setSubmitting(true);
    try {
      await khachMoiApi.yeuCauDieuChinhLich(scheduleModal.id, {
        thaoTac: 'Đổi lịch',
        thoiGianMoi: newScheduleTime
      });
      setScheduleModal(null);
      setToast('Đã gửi yêu cầu đổi lịch xem phòng.');
      await loadPortal();
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể gửi yêu cầu đổi lịch.');
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelSchedule(schedule) {
    try {
      await khachMoiApi.yeuCauDieuChinhLich(schedule.id, { thaoTac: 'Hủy' });
      setToast('Đã gửi yêu cầu hủy lịch xem phòng.');
      await loadPortal();
    } catch (requestError) {
      setToast(requestError.response?.data?.message || 'Không thể hủy lịch lúc này.');
    }
  }

  return (
    <div className="customer-page">
      <header className="km-header">
        <div className="km-frame km-topbar">
          <button className="km-brand-button" type="button" onClick={() => goTo('tong-quan')}>
            <Brand />
          </button>
          <div className="km-context">
            <span>Cổng khách hàng</span>
            <strong>Quản lý thuê phòng</strong>
          </div>
          <div className="km-account">
            <button className="km-account-btn" type="button" onClick={() => setAccountOpen(!accountOpen)}>
              <span className="km-avatar">{initials(user?.hoTen)}</span>
              <span className="km-account-copy">
                <strong>{user?.hoTen}</strong>
                <span>Khách mới</span>
              </span>
              <span>⌄</span>
            </button>
            {accountOpen && (
              <div className="km-account-menu">
                <strong>{user?.hoTen}</strong>
                <span>{user?.email || user?.tenDangNhap}</span>
                <button className="km-account-info" type="button" onClick={() => goTo('tai-khoan')}>Thông tin tài khoản</button>
                <button className="km-account-logout" type="button" onClick={dangXuat}>Đăng xuất</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="km-frame km-shell">
        <aside className="km-sidebar" aria-label="Menu khách mới">
          <p className="km-side-label">Menu chính</p>
          {tabs.map((tab) => (
            <button
              className={`km-side-link ${activeTab === tab.id ? 'active' : ''}`}
              type="button"
              key={tab.id}
              onClick={() => goTo(tab.id)}
            >
              <span><PortalIcon name={tab.icon} /></span>
              <div><strong>{tab.title}</strong><small>{tab.note}</small></div>
            </button>
          ))}
        </aside>

        <main className="km-main">
          {activeTab !== 'tai-khoan' && loading && <div className="km-card">Đang tải thông tin khách hàng...</div>}
          {activeTab !== 'tai-khoan' && error && <div className="km-message error">{error}</div>}

          {!loading && !error && activeTab === 'tong-quan' && (
            <>
              <section className="km-onboarding">
                <span className="km-eyebrow">Khách mới</span>
                <h1>Chào {user?.hoTen}, bắt đầu bằng việc tìm phòng và gửi yêu cầu thuê</h1>
                <p>Bạn có thể tìm phòng, gửi yêu cầu thuê và theo dõi lịch xem phòng ngay trên dashboard.</p>
                <div className="km-buttons">
                  <button className="km-btn primary" type="button" onClick={() => goTo('tim-phong')}>Tìm phòng ngay</button>
                  <button className="km-btn secondary" type="button" onClick={() => goTo('ho-so')}>Xem hồ sơ đăng ký</button>
                </div>
              </section>

              <section className="km-stepper" aria-label="Tiến trình thuê phòng">
                <div className={`km-step ${!latestProfile ? 'current' : ''}`}>
                  <span>1</span><div><strong>Tìm phòng</strong><p>Chọn phòng còn trống và gửi nhu cầu thuê.</p></div>
                </div>
                <div className={`km-step ${latestProfile ? 'current' : 'next'}`}>
                  <span>2</span><div><strong>Duyệt hồ sơ</strong><p>Theo dõi hồ sơ và lịch xem phòng.</p></div>
                </div>
                <div className="km-step locked">
                  <span>3</span><div><strong>Đặt cọc</strong><p>Mở sau khi yêu cầu được duyệt.</p></div>
                </div>
                <div className="km-step locked">
                  <span>4</span><div><strong>Ký hợp đồng</strong><p>Mở sau khi cọc được xác nhận.</p></div>
                </div>
              </section>

              <section className="km-summary-grid">
                <div className="km-card">
                  <div className="km-card-head">
                    <div><h3>Hồ sơ đăng ký thuê</h3><p>Theo dõi yêu cầu mới nhất của bạn.</p></div>
                    {latestProfile && <span className={`km-status ${statusTone(latestProfile.trangThai)}`}>{latestProfile.trangThai}</span>}
                  </div>
                  {latestProfile ? (
                    <div className="km-info-list">
                      <div><span>Mã hồ sơ</span><strong>{latestProfile.maDangKy}</strong></div>
                      <div><span>Loại phòng</span><strong>{latestProfile.loaiPhongYeuCau || 'Chưa chọn'}</strong></div>
                      <div><span>Ngày muốn thuê</span><strong>{formatDate(latestProfile.ngayDuKienVaoO)}</strong></div>
                    </div>
                  ) : (
                    <EmptyPanel title="Bạn chưa có hồ sơ thuê">
                      Chọn phòng phù hợp và gửi nhu cầu để nhân viên tư vấn hỗ trợ bước tiếp theo.
                    </EmptyPanel>
                  )}
                </div>
                <div className="km-card">
                  <div className="km-card-head">
                    <div><h3>Lịch xem phòng</h3><p>Lịch do nhân viên sắp xếp sau khi tiếp nhận hồ sơ.</p></div>
                    {latestSchedule && <span className={`km-status ${statusTone(latestSchedule.trangThai)}`}>{latestSchedule.trangThai}</span>}
                  </div>
                  {latestSchedule ? (
                    <div className="km-info-list">
                      <div><span>Thời gian</span><strong>{formatDate(latestSchedule.thoiGianHen, true)}</strong></div>
                      <div><span>Phòng sẽ xem</span><strong>{latestSchedule.phongXem || 'Đang cập nhật'}</strong></div>
                    </div>
                  ) : (
                    <EmptyPanel title="Chưa có lịch xem phòng">
                      Lịch sẽ hiển thị ở đây khi hồ sơ của bạn được nhân viên lên lịch.
                    </EmptyPanel>
                  )}
                </div>
              </section>

              <section className="km-card km-suggestions">
                <div className="km-card-head">
                  <div><h3>Gợi ý phòng phù hợp cho bạn</h3><p>Một số lựa chọn đang còn chỗ để bắt đầu tìm kiếm.</p></div>
                  <button className="km-btn secondary" type="button" onClick={() => goTo('tim-phong')}>Xem tất cả phòng</button>
                </div>
                <div className="km-suggest-grid">
                  {overview.phongGoiY.map((room) => (
                    <article className="km-suggest-card" key={room.id}>
                      <img src={room.urlImg} alt={room.tenPhong} />
                      <div>
                        <h3>{room.tenPhong}</h3>
                        <p>{room.moTa}</p>
                        <footer><span>{room.soChoTrong} chỗ trống</span><strong>{formatMoney(room.giaThue)}</strong></footer>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {!loading && !error && activeTab === 'tim-phong' && (
            <section>
              <div className="km-page-head">
                <span className="km-eyebrow">Tìm phòng</span>
                <h1>Danh sách phòng / giường khả dụng</h1>
                <p>Nhập tiêu chí tra cứu để tìm phòng phù hợp. Chọn phòng quan tâm rồi gửi hồ sơ nhu cầu thuê.</p>
              </div>
              <div className="km-card">
                <form className="km-room-search" onSubmit={applyFilters}>
                  <label className="km-keyword-search">
                    <span className="km-filter-label">Tìm kiếm</span>
                    <span className="km-keyword-input">
                      <PortalIcon name="search" />
                      <input
                        type="search"
                        placeholder="Nhập tên phòng, chi nhánh, khu vực hoặc loại phòng..."
                        value={filters.tuKhoa}
                        onChange={(event) => setFilters({ ...filters, tuKhoa: event.target.value })}
                      />
                    </span>
                  </label>
                  <div className="km-filter">
                    <label>
                      <span className="km-filter-label">Khu vực</span>
                      <select value={filters.khuVuc} onChange={(event) => setFilters({ ...filters, khuVuc: event.target.value })}>
                        <option value="">Tất cả khu vực</option>
                        <option value="Quận 1">Quận 1, TP.HCM</option>
                        <option value="Bình Thạnh">Bình Thạnh, TP.HCM</option>
                        <option value="Thủ Đức">Thủ Đức, TP.HCM</option>
                      </select>
                    </label>
                    <label>
                      <span className="km-filter-label">Loại phòng</span>
                      <select value={filters.loaiPhong} onChange={(event) => setFilters({ ...filters, loaiPhong: event.target.value })}>
                        <option value="">Tất cả loại phòng</option>
                        <option value="Phòng 2 người">Phòng 2 người</option>
                        <option value="Phòng 4 người">Phòng 4 người</option>
                        <option value="Phòng 6 người">Phòng 6 người</option>
                        <option value="Phòng VIP 2 người">Phòng VIP 2 người</option>
                      </select>
                    </label>
                    <label>
                      <span className="km-filter-label">Mức giá tối đa</span>
                      <select value={filters.mucGiaToiDa} onChange={(event) => setFilters({ ...filters, mucGiaToiDa: event.target.value })}>
                        <option value="">Tất cả mức giá</option>
                        <option value="2500000">Dưới 2,5 triệu</option>
                        <option value="3000000">Dưới 3 triệu</option>
                        <option value="5000000">Dưới 5 triệu</option>
                      </select>
                    </label>
                    <button className="km-btn secondary km-search-btn" type="submit">Tra cứu</button>
                  </div>
                </form>
                <div className="km-room-grid">
                  {rooms.map((room) => (
                    <article className={`km-room ${selectedIds.includes(room.id) ? 'selected' : ''}`} key={room.id}>
                      <div className="km-room-photo">
                        <img src={room.urlImg} alt={room.tenPhong} />
                      </div>
                      <div className="km-room-body">
                        <div className="km-room-meta"><span>{room.loaiPhong}</span><strong>{formatMoney(room.giaThue)}</strong></div>
                        <h3>{room.tenPhong}</h3>
                        <p>{room.moTa}</p>
                        <div className="km-pills">
                          <span>Sức chứa {room.sucChua}</span>
                          <span>Còn {room.soChoTrong} chỗ</span>
                          <span className="brick">{getRoomArea(room)}</span>
                        </div>
                        <div className="km-room-actions">
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(room.id)}
                              onChange={() => toggleRoom(room.id)}
                            /> Chọn
                          </label>
                          <button className="km-detail-btn" type="button" onClick={() => openDetail(room.id)}>
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {!rooms.length && <EmptyPanel title="Không có phòng phù hợp">Vui lòng điều chỉnh tiêu chí (khu vực, giá...) để tìm được phòng phù hợp.</EmptyPanel>}
              </div>
              <div className="km-sticky-action">
                <span>{selectedRooms.length ? `Đã chọn ${selectedRooms.length} phòng` : 'Chưa chọn phòng nào'}</span>
                <button className="km-btn primary" type="button" onClick={openRentForm}>Đăng ký nhu cầu thuê</button>
              </div>
            </section>
          )}

          {!loading && !error && activeTab === 'ho-so' && (
            <section>
              <div className="km-page-head">
                <span className="km-eyebrow">Hồ sơ</span>
                <h1>Hồ sơ nhu cầu thuê của bạn</h1>
                <p>Khách mới chỉ theo dõi hồ sơ và lịch xem; cọc và hợp đồng chỉ xuất hiện sau khi được xử lý.</p>
              </div>
              {!overview.hoSo.length && (
                <div className="km-card">
                  <EmptyPanel title="Chưa gửi hồ sơ đăng ký thuê">
                    Hãy chọn phòng ở mục Tìm phòng để gửi nhu cầu đầu tiên.
                  </EmptyPanel>
                  <button className="km-btn primary km-top-gap" type="button" onClick={() => goTo('tim-phong')}>Tìm phòng ngay</button>
                </div>
              )}
              <div className="km-profile-list">
                {overview.hoSo.map((profile) => (
                  <article className="km-card" key={profile.id}>
                    <div className="km-card-head">
                      <div><h3>Hồ sơ {profile.maDangKy}</h3><p>Gửi ngày {formatDate(profile.ngayDangKy)}</p></div>
                      <span className={`km-status ${statusTone(profile.trangThai)}`}>{profile.trangThai}</span>
                    </div>
                    <div className="km-info-list">
                      <div><span>Hình thức thuê</span><strong>{profile.hinhThucThue === 'Ghép' && profile.gioiTinh ? `Ghép ${profile.gioiTinh.toLowerCase()}` : profile.hinhThucThue}</strong></div>
                      <div><span>Loại phòng mong muốn</span><strong>{profile.loaiPhongYeuCau || 'Chưa ghi rõ'}</strong></div>
                      <div><span>Số người</span><strong>{profile.soNguoiO} người{profile.hinhThucThue === 'Ghép' && profile.gioiTinh ? ` (${profile.gioiTinh})` : ''}</strong></div>
                      <div><span>Ngày dự kiến vào ở</span><strong>{formatDate(profile.ngayDuKienVaoO)}</strong></div>
                      {profile.thoiHanThue && <div><span>Thời hạn thuê</span><strong>{profile.thoiHanThue} tháng</strong></div>}
                      <div><span>Ghi chú</span><strong>{profile.ghiChu || 'Không có'}</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {!loading && !error && activeTab === 'lich-xem' && (
            <section>
              <div className="km-page-head">
                <span className="km-eyebrow">Lịch xem phòng</span>
                <h1>Theo dõi thời gian hẹn xem phòng</h1>
                <p>Lịch chỉ có sau khi nhân viên sale tiếp nhận hồ sơ và sắp xếp thời gian phù hợp.</p>
              </div>
              {!overview.lichXem.length && (
                <div className="km-card">
                  <EmptyPanel title="Chưa có lịch xem phòng">
                    Bạn vẫn đang ở trạng thái khách mới. Khi lịch được tạo, bạn có thể yêu cầu đổi hoặc hủy tại đây.
                  </EmptyPanel>
                </div>
              )}
              {overview.lichXem.map((schedule) => (
                <article className="km-card km-schedule" key={schedule.id}>
                  <div className="km-card-head">
                    <div><h3>Lịch hẹn {schedule.maDangKy}</h3><p>Do nhân viên tư vấn sắp xếp</p></div>
                    <span className={`km-status ${statusTone(schedule.trangThai)}`}>{schedule.trangThai}</span>
                  </div>
                  <div className="km-info-list">
                    <div><span>Thời gian</span><strong>{formatDate(schedule.thoiGianHen, true)}</strong></div>
                    <div><span>Phòng sẽ xem</span><strong>{schedule.phongXem || 'Đang cập nhật'}</strong></div>
                    <div><span>Địa điểm</span><strong>Theo chi nhánh phòng xem</strong></div>
                  </div>
                  <div className="km-buttons km-top-gap">
                    <button className="km-btn secondary" type="button" onClick={() => setScheduleModal(schedule)}>Yêu cầu đổi lịch</button>
                    <button className="km-btn danger" type="button" onClick={() => cancelSchedule(schedule)}>Hủy lịch xem</button>
                  </div>
                </article>
              ))}
            </section>
          )}

          {activeTab === 'tai-khoan' && (
            <section>
              <div className="km-page-head">
                <span className="km-eyebrow">Tài khoản</span>
                <h1>Thông tin tài khoản</h1>
                <p>Thông tin cá nhân và thông tin đăng nhập đang lưu trên hệ thống HappyRoom.</p>
              </div>
              <div className="km-summary-grid">
                <div className="km-card">
                  <div className="km-card-head">
                    <div><h3>Thông tin đăng nhập</h3><p>Tài khoản được liên kết với hồ sơ khách hàng.</p></div>
                    <span className={`km-status ${user?.trangThai === 'Hoạt động' ? 'done' : 'danger'}`}>
                      {user?.trangThai || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="km-info-list">
                    <div><span>Mã khách hàng</span><strong>{user?.maNguoiDung || 'Chưa cập nhật'}</strong></div>
                    <div><span>Tên đăng nhập</span><strong>{user?.tenDangNhap || 'Chưa cập nhật'}</strong></div>
                    <div><span>Vai trò</span><strong>{user?.vaiTro === 'KhachHang' ? 'Khách hàng' : user?.vaiTro || 'Chưa cập nhật'}</strong></div>
                  </div>
                </div>
                <div className="km-card">
                  <div className="km-card-head">
                    <div><h3>Thông tin cá nhân</h3><p>Thông tin được lấy từ hồ sơ người dùng của bạn.</p></div>
                  </div>
                  <div className="km-info-list">
                    <div><span>Họ và tên</span><strong>{user?.hoTen || 'Chưa cập nhật'}</strong></div>
                    <div><span>Ngày sinh</span><strong>{formatDate(user?.ngaySinh)}</strong></div>
                    <div><span>Giới tính</span><strong>{user?.gioiTinh || 'Chưa cập nhật'}</strong></div>
                    <div><span>Số điện thoại</span><strong>{user?.soDienThoai || 'Chưa cập nhật'}</strong></div>
                    <div><span>Email</span><strong>{user?.email || 'Chưa cập nhật'}</strong></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {!loading && !error && activeTab === 'ho-tro' && (
            <section>
              <div className="km-page-head">
                <span className="km-eyebrow">Hỗ trợ</span>
                <h1>Cần hỗ trợ trong quá trình tìm phòng?</h1>
                <p>Liên hệ tư vấn khi cần hỏi phòng trống, thủ tục hoặc lịch xem phòng.</p>
              </div>
              <div className="km-support-grid">
                <div className="km-card km-support">
                  <h3>Kênh liên hệ nhanh</h3>
                  <div><span>☎</span><p><strong>Gọi nhân viên tư vấn</strong>0905 123 456</p></div>
                  <div><span>✉</span><p><strong>Gửi email</strong>hello@homestaydorm.vn</p></div>
                  <div><span>📍</span><p><strong>Địa chỉ</strong>12 Nguyễn Trãi, Quận 1, TP.HCM</p></div>
                </div>
                <div className="km-card">
                  <h3>Thông tin dành cho khách mới</h3>
                  <div className="km-info-list km-top-gap">
                    <div><span>Có thể thanh toán chưa?</span><strong>Chỉ sau khi có yêu cầu cọc</strong></div>
                    <div><span>Có thể gửi bảo trì?</span><strong>Sau khi nhận phòng</strong></div>
                    <div><span>Bước tiếp theo</span><strong>Chọn phòng và gửi hồ sơ</strong></div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="km-footer">
        <div className="km-frame km-footer-grid">
          <div><Brand /><p>Cổng khách hàng giúp bạn tìm phòng, theo dõi hồ sơ và lịch xem trong một giao diện rõ ràng.</p></div>
          <div><h3>Liên hệ</h3><p>12 Nguyễn Trãi, Quận 1, TP.HCM</p><p>0905 123 456</p><p>hello@homestaydorm.vn</p></div>
          <div><h3>Hỗ trợ khách hàng</h3><button type="button" onClick={() => goTo('tong-quan')}>Tổng quan</button><button type="button" onClick={() => goTo('tim-phong')}>Tìm phòng</button><button type="button" onClick={() => goTo('lich-xem')}>Lịch xem phòng</button></div>
        </div>
        <div className="km-frame km-copyright">© 2026 Homestay Dorm. Cổng khách hàng mới.</div>
      </footer>

      {rentModal && (
        <div className="km-modal-backdrop" onMouseDown={() => setRentModal(false)}>
          <form className="km-modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={submitProfile}>
            <div className="km-modal-head">
              <div><h2>Phiếu đăng ký nhu cầu thuê</h2><p>Phòng quan tâm: {selectedRooms.map((room) => room.tenPhong).join(', ')}</p></div>
              <button type="button" onClick={() => setRentModal(false)}>×</button>
            </div>
            <div className="km-form-grid">
              <label>Hình thức thuê
                <select value={rentForm.hinhThucThue} onChange={(event) => setRentForm({ ...rentForm, hinhThucThue: event.target.value })}>
                  <option>Ghép</option><option>Nguyên căn</option>
                </select>
              </label>
              <label>Loại phòng mong muốn
                <select value={rentForm.loaiPhongYeuCau} onChange={(event) => setRentForm({ ...rentForm, loaiPhongYeuCau: event.target.value })}>
                  <option>Giường dorm</option><option>Phòng riêng</option><option>Phòng đôi</option>
                </select>
              </label>
              <label>Ngày muốn thuê
                <input type="date" value={rentForm.ngayDuKienVaoO} onChange={(event) => setRentForm({ ...rentForm, ngayDuKienVaoO: event.target.value })} required />
              </label>
              <label>Số người
                <input type="number" min="1" value={rentForm.soNguoiO} onChange={(event) => setRentForm({ ...rentForm, soNguoiO: event.target.value })} required />
              </label>
              <label>Khu vực mong muốn
                <input value={rentForm.khuVucMongMuon} onChange={(event) => setRentForm({ ...rentForm, khuVucMongMuon: event.target.value })} />
              </label>
              <label>Ngân sách tối đa
                <input type="number" min="0" value={rentForm.mucGia} onChange={(event) => setRentForm({ ...rentForm, mucGia: event.target.value })} />
              </label>
              <label>Thời hạn thuê (tháng)
                <input type="number" min="1" placeholder="VD: 6" value={rentForm.thoiHanThue} onChange={(event) => setRentForm({ ...rentForm, thoiHanThue: event.target.value })} />
              </label>
              <label className="full">Ghi chú nhu cầu
                <textarea value={rentForm.ghiChu} onChange={(event) => setRentForm({ ...rentForm, ghiChu: event.target.value })} placeholder="Ưu tiên vị trí, tiện ích hoặc thời gian liên hệ..." />
              </label>
            </div>
            <div className="km-buttons km-top-gap">
              <button className="km-btn primary" type="submit" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi hồ sơ'}</button>
              <button className="km-btn secondary" type="button" onClick={() => setRentModal(false)}>Đóng</button>
            </div>
          </form>
        </div>
      )}

      {scheduleModal && (
        <div className="km-modal-backdrop" onMouseDown={() => setScheduleModal(null)}>
          <form className="km-modal small" onMouseDown={(event) => event.stopPropagation()} onSubmit={requestScheduleChange}>
            <div className="km-modal-head">
              <div><h2>Yêu cầu đổi lịch xem phòng</h2><p>Chọn thời gian mong muốn mới để nhân viên xác nhận.</p></div>
              <button type="button" onClick={() => setScheduleModal(null)}>×</button>
            </div>
            <label className="km-modal-field">Thời gian mới
              <input type="datetime-local" value={newScheduleTime} onChange={(event) => setNewScheduleTime(event.target.value)} required />
            </label>
            <button className="km-btn primary km-top-gap" type="submit" disabled={submitting}>Gửi yêu cầu</button>
          </form>
        </div>
      )}

      {detailModal && (
        <div className="km-modal-backdrop" onMouseDown={() => setDetailModal(null)}>
          <div className="km-modal large" onMouseDown={(event) => event.stopPropagation()}>
            <div className="km-modal-head">
              <div><h2>{detailModal.tenPhong}</h2><p>{detailModal.moTa}</p></div>
              <button type="button" onClick={() => setDetailModal(null)}>×</button>
            </div>
            <div className="km-detail-content">
              <div className="km-detail-photo">
                <img src={detailModal.urlImg} alt={detailModal.tenPhong} />
              </div>
              <div className="km-detail-info">
                <div className="km-info-row">
                  <span>Loại phòng</span>
                  <strong>{detailModal.loaiPhong}</strong>
                </div>
                <div className="km-info-row">
                  <span>Giá thuê</span>
                  <strong className="brick">{formatMoney(detailModal.giaThue)}</strong>
                </div>
                <div className="km-info-row">
                  <span>Sức chứa</span>
                  <strong>{detailModal.sucChua} người</strong>
                </div>
                <div className="km-info-row">
                  <span>Chỗ trống</span>
                  <strong>{detailModal.soChoTrong} giường</strong>
                </div>
                <div className="km-info-row">
                  <span>Tình trạng</span>
                  <strong style={{ color: 'var(--success)' }}>Còn trống</strong>
                </div>
                <div className="km-info-row">
                  <span>Chi nhánh</span>
                  <strong>{detailModal.chiNhanh}</strong>
                </div>
                <div className="km-info-row">
                  <span>Tầng</span>
                  <strong>Tầng {detailModal.tenPhong.match(/\d/)?.[0] || '1'}</strong>
                </div>
                <div className="km-info-row full">
                  <span>Mô tả chi tiết</span>
                  <p>{detailModal.moTa}</p>
                </div>
                <div className="km-buttons km-top-gap">
                  <button className="km-btn primary" type="button" onClick={() => { toggleRoom(detailModal.id); setDetailModal(null); }}>
                    {selectedIds.includes(detailModal.id) ? 'Bỏ chọn phòng' : 'Chọn phòng này'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`km-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
