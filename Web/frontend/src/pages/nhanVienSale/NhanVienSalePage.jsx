import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { EmployeeAccountMenu, EmployeeAccountView } from '../../components/common/EmployeeAccount.jsx';
import PortalIcon from '../../components/common/PortalIcon.jsx';
import './nhanVienSale.css';
import { datCocApi } from '../datCoc/datCoc.api.js';

const views = [
  { id: 'overview', icon: 'dashboard', label: 'Tổng quan', title: 'Tổng quan nhân viên sale', subtitle: 'Theo dõi hồ sơ thuê, lịch xem phòng, đặt cọc và nhận phòng trong một màn hình.' },
  { id: 'registrations', icon: 'list', label: 'Đăng ký thuê', title: 'Đăng ký thuê', subtitle: 'Danh sách hồ sơ khách gửi, nhu cầu thuê, phòng phù hợp và trạng thái xử lý.' },
  { id: 'schedule', icon: 'calendar', label: 'Lịch xem phòng', title: 'Lịch xem phòng', subtitle: 'Theo dõi lịch hẹn xem phòng gắn với các hồ sơ sale đang phụ trách.' },
  { id: 'deposit', icon: 'deposit', label: 'Đặt cọc', title: 'Đặt cọc', subtitle: 'Theo dõi hồ sơ đến bước xác nhận cọc và khách đã hoàn tất cọc.' },
  { id: 'handover', icon: 'contract', label: 'Nhận phòng', title: 'Nhận phòng', subtitle: 'Danh sách khách đã hoàn tất hồ sơ và chuẩn bị hoặc đã nhận phòng.' },
  { id: 'customers', icon: 'users', label: 'Khách hàng', title: 'Khách hàng', subtitle: 'Các khách hàng đang được nhân viên sale theo dõi trong dữ liệu mẫu.' },
  { id: 'rooms', icon: 'building', label: 'Phòng/Giường', title: 'Phòng/Giường', subtitle: 'Tra cứu nhanh phòng còn trống để phục vụ tư vấn khách hàng.' }
];

// Data shown here mirrors seed records assigned to sale employee NV0001.
const registrations = [
  {
    id: 'DK0006',
    customer: 'Võ Gia Hân',
    phone: '091200006',
    demand: 'Ghép · Phòng 2 người · 1.800.000đ',
    room: 'P202 · G02',
    status: 'Chấp nhận',
    tone: 'good'
  },
  {
    id: 'DK0012',
    customer: 'Đinh Đức Quang',
    phone: '091200012',
    demand: 'Nguyên căn · Phòng 2 người · 2.100.000đ',
    room: 'P301 · G01',
    status: 'Chấp nhận',
    tone: 'good'
  },
  {
    id: 'DK0018',
    customer: 'Dương Anh Khoa',
    phone: '091200018',
    demand: 'Ghép · Phòng 2 người · 2.400.000đ',
    room: 'P304 · G02',
    status: 'Chờ xác nhận cọc',
    tone: 'wait'
  }
];

const schedules = [
  { id: 'DK0006-1', customer: 'Võ Gia Hân', room: 'P202 · G02', time: '10/09/2025 · 09:00', status: 'Đã xem', tone: 'good' },
  { id: 'DK0012-1', customer: 'Đinh Đức Quang', room: 'P301 · G01', time: '16/03/2025 · 09:00', status: 'Đã xem', tone: 'good' },
  { id: 'DK0018-1', customer: 'Dương Anh Khoa', room: 'P304 · G02', time: '22/09/2025 · 09:00', status: 'Chờ xem', tone: 'wait' }
];

const rooms = [
  { id: 'P203', name: 'Phòng P103', type: 'Phòng 4 người', branch: 'HomeDorm Bình Thạnh', price: '1.800.000đ', status: 'Còn chỗ' },
  { id: 'P301', name: 'Phòng P101', type: 'Phòng 2 người', branch: 'HomeDorm Thủ Đức', price: '2.200.000đ', status: 'Còn chỗ' },
  { id: 'P304', name: 'Phòng P201', type: 'Phòng 4 người', branch: 'HomeDorm Thủ Đức', price: '1.800.000đ', status: 'Trống' }
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'NV';
}

function Brand() {
  return (
    <span className="sale-brand">
      <span className="sale-brand-icon"><PortalIcon name="home" /></span>
      <span className="sale-brand-name">Homestay <strong>Dorm</strong></span>
    </span>
  );
}

function Status({ tone, children }) {
  return <span className={`sale-status ${tone}`}>{children}</span>;
}

function Person({ name, phone }) {
  return (
    <div className="sale-person">
      <span>{initials(name)}</span>
      <div><strong>{name}</strong><small>{phone}</small></div>
    </div>
  );
}

function StaticButton({ primary = false, onClick, disabled = false, children }) {
  return <button className={`sale-btn ${primary ? 'primary' : 'secondary'}`} type="button" onClick={onClick} disabled={disabled}>{children}</button>;
}

function getDepositRowStatus(row) {
  if (row.maPhieuDatCoc) {
    if (row.trangThaiCoc === 'Đã lập HĐ') return { label: 'Đã lập HĐ', tone: 'good' };
    if (row.trangThaiThanhToan === 'Đã TT') return { label: 'Đã thanh toán cọc', tone: 'good' };
    return { label: 'Chờ thanh toán', tone: 'wait' };
  }
  if (row.trangThaiDangKy === 'Chấp nhận') return { label: 'Chờ lập phiếu', tone: 'neutral' };
  if (row.trangThaiDangKy === 'Chờ xác nhận cọc') return { label: 'Chờ xác nhận cọc', tone: 'wait' };
  return { label: 'Chờ tiếp nhận', tone: 'neutral' };
}

export default function NhanVienSalePage() {
  const { user, dangXuat } = useAuth();
  const [activeView, setActiveView] = useState('overview');

  const [depositList, setDepositList] = useState([]);
  const [depositLoading, setDepositLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const depositStats = useMemo(() => ({
    choXacNhan: depositList.filter((r) => r.trangThaiDangKy === 'Chờ xác nhận cọc').length,
    daTT: depositList.filter((r) => r.trangThaiThanhToan === 'Đã TT').length,
    daLapHD: depositList.filter((r) => r.trangThaiCoc === 'Đã lập HĐ').length,
  }), [depositList]);

  useEffect(() => {
    if (activeView !== 'deposit') return;
    setDepositLoading(true);
    datCocApi.getAll()
      .then(({ data }) => setDepositList(Array.isArray(data) ? data : []))
      .catch(() => setDepositList([]))
      .finally(() => setDepositLoading(false));
  }, [activeView]);

  async function handleGuiYeuCau() {
    if (!confirmModal) return;
    setSubmitting(true);
    try {
      await datCocApi.guiYeuCauDatCoc({ maDangKy: confirmModal.maDangKy, maNhanVienSale: user.maNguoiDung });
      setConfirmModal(null);
      const { data } = await datCocApi.getAll();
      setDepositList(Array.isArray(data) ? data : []);
    } catch {
      // giữ modal mở để user thấy lỗi
    } finally {
      setSubmitting(false);
    }
  }

  const currentView = activeView === 'account'
    ? { title: 'Thông tin tài khoản', subtitle: 'Xem thông tin tài khoản nhân viên đang đăng nhập.' }
    : views.find((view) => view.id === activeView) || views[0];

  return (
    <div className="sale-page">
      <header className="sale-header">
        <div className="sale-frame sale-header-row">
          <button className="sale-brand-button" type="button" onClick={() => setActiveView('overview')}>
            <Brand />
          </button>
          <div className="sale-header-right">
            <div className="sale-context">
              <span>Cổng nhân viên</span>
              <strong>Quản lý tư vấn thuê phòng</strong>
            </div>
            <EmployeeAccountMenu
              user={user}
              positionLabel="Nhân viên sale"
              onShowAccount={() => setActiveView('account')}
              onLogout={dangXuat}
            />
          </div>
        </div>
      </header>

      <div className="sale-frame sale-shell">
        <aside className="sale-sidebar">
          <p className="sale-side-label">Menu chính</p>
          <nav className="sale-nav">
            {views.map((view) => (
              <button
                className={`sale-nav-item ${activeView === view.id ? 'active' : ''}`}
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
              >
                <span><PortalIcon name={view.icon} /></span>
                {view.label}
              </button>
            ))}
          </nav>
          <div className="sale-side-note">
            <strong>Tiến độ xử lý</strong>
            <p>Ưu tiên hồ sơ chờ xác nhận cọc và lịch xem phòng chưa hoàn tất.</p>
            <div><span /></div>
          </div>
        </aside>

        <main className="sale-main">
          <section className="sale-page-head">
            <div>
              <h1>{currentView.title}</h1>
              <p>{currentView.subtitle}</p>
            </div>
            {activeView !== 'account' && <div className="sale-actions">
              <label className="sale-search">
                <PortalIcon name="search" />
                <input type="search" placeholder="Tìm khách, phòng, SĐT..." />
              </label>
            </div>}
          </section>

          {activeView === 'account' && <EmployeeAccountView user={user} positionLabel="Nhân viên sale" />}
          {activeView === 'overview' && (
            <section className="sale-stack">
              <div className="sale-stats">
                <article className="sale-stat"><span><PortalIcon name="list" /></span><div><strong>03</strong><p>Hồ sơ phụ trách</p><small>Hồ sơ mẫu được phân công</small></div></article>
                <article className="sale-stat"><span><PortalIcon name="calendar" /></span><div><strong>01</strong><p>Lịch chờ xem</p><small>DK0018 · P304</small></div></article>
                <article className="sale-stat"><span><PortalIcon name="deposit" /></span><div><strong>01</strong><p>Chờ xác nhận cọc</p><small>Dương Anh Khoa</small></div></article>
                <article className="sale-stat"><span><PortalIcon name="building" /></span><div><strong>03</strong><p>Phòng gợi ý</p><small>Đang trống/còn chỗ</small></div></article>
              </div>
              <article className="sale-card">
                <div className="sale-card-head">
                  <div><h2>Luồng xử lý trước khi khách vào ở</h2><p>Đăng ký thuê, lịch xem phòng, đặt cọc và nhận phòng.</p></div>
                  <StaticButton primary>Xử lý hồ sơ</StaticButton>
                </div>
                <div className="sale-pipeline">
                  <div><strong>03</strong><span>Đăng ký thuê</span></div>
                  <div><strong>03</strong><span>Lịch xem phòng</span></div>
                  <div><strong>01</strong><span>Chờ đặt cọc</span></div>
                  <div><strong>02</strong><span>Đã nhận phòng</span></div>
                </div>
              </article>
              <div className="sale-two-col">
                <article className="sale-table-card">
                  <div className="sale-table-head">
                  <div><h2>Hồ sơ sale đang phụ trách</h2><p>Danh sách hồ sơ được phân công cho nhân viên sale.</p></div>
                  </div>
                  <RegistrationTable compact />
                </article>
                <article className="sale-card">
                  <div className="sale-card-head"><div><h2>Việc cần làm</h2><p>Các điểm nên theo dõi tiếp theo.</p></div></div>
                  <div className="sale-todos">
                    <div><Status tone="wait">Ưu tiên</Status><strong>Xác nhận cọc DK0018</strong><p>Dương Anh Khoa đang ở trạng thái chờ xác nhận cọc.</p></div>
                    <div><Status tone="neutral">Theo dõi</Status><strong>Lịch xem P304 · G02</strong><p>Lịch DK0018-1 vẫn ở trạng thái chờ xem.</p></div>
                    <div><Status tone="good">Hoàn tất</Status><strong>Hồ sơ DK0006, DK0012</strong><p>Hai hồ sơ đã chuyển sang hợp đồng thuê.</p></div>
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeView === 'registrations' && (
            <section className="sale-stack">
              <article className="sale-card">
                <div className="sale-card-head">
                  <div><h2>Bộ lọc hồ sơ</h2><p>Sườn lọc hồ sơ theo trạng thái và nhu cầu.</p></div>
                  <StaticButton primary>Tiếp nhận hồ sơ mới</StaticButton>
                </div>
                <div className="sale-filters">
                  <label>Tìm kiếm<input placeholder="Tên khách, số điện thoại..." /></label>
                  <label>Trạng thái<select><option>Tất cả</option><option>Chờ xác nhận cọc</option><option>Chấp nhận</option></select></label>
                  <label>Hình thức thuê<select><option>Tất cả</option><option>Ghép</option><option>Nguyên căn</option></select></label>
                  <label>Chi nhánh<select><option>Tất cả chi nhánh</option><option>HomeDorm Thủ Đức</option></select></label>
                </div>
              </article>
              <article className="sale-table-card">
                <div className="sale-table-head"><div><h2>Danh sách hồ sơ khách gửi</h2><p>Các nút thao tác mới là bố cục giao diện, chưa gắn nghiệp vụ.</p></div></div>
                <RegistrationTable />
              </article>
            </section>
          )}

          {activeView === 'schedule' && (
            <section className="sale-two-col">
              <article className="sale-table-card">
                <div className="sale-table-head">
                  <div><h2>Danh sách lịch xem phòng</h2><p>Lịch thuộc các hồ sơ được nhân viên sale phụ trách.</p></div>
                  <StaticButton primary>Lập lịch mới</StaticButton>
                </div>
                <div className="sale-table-wrap">
                  <table>
                    <thead><tr><th>Mã lịch</th><th>Khách hàng</th><th>Phòng / Giường</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                    <tbody>
                      {schedules.map((schedule) => (
                        <tr key={schedule.id}>
                          <td><strong>{schedule.id}</strong></td>
                          <td>{schedule.customer}</td>
                          <td><span className="sale-room-pill">{schedule.room}</span></td>
                          <td>{schedule.time}</td>
                          <td><Status tone={schedule.tone}>{schedule.status}</Status></td>
                          <td><div className="sale-row-actions"><StaticButton>Chi tiết</StaticButton></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="sale-card">
                <div className="sale-card-head"><div><h2>Lịch cần theo dõi</h2><p>Timeline gọn cho ca làm việc.</p></div></div>
                <div className="sale-timeline">
                  {schedules.map((schedule, index) => (
                    <div key={schedule.id}>
                      <span>{index + 1}</span>
                      <div><strong>{schedule.room}</strong><small>{schedule.customer} · {schedule.time}</small></div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activeView === 'deposit' && (
            <section className="sale-stack">
              <div className="sale-three-col">
                <article className="sale-stat">
                  <span><PortalIcon name="deposit" /></span>
                  <div>
                    <strong>{depositStats.choXacNhan}</strong>
                    <p>Chờ xác nhận cọc</p>
                  </div>
                </article>
                <article className="sale-stat">
                  <span><PortalIcon name="payment" /></span>
                  <div>
                    <strong>{depositStats.daTT}</strong>
                    <p>Đã thanh toán cọc</p>
                  </div>
                </article>
                <article className="sale-stat">
                  <span><PortalIcon name="contract" /></span>
                  <div>
                    <strong>{depositStats.daLapHD}</strong>
                    <p>Đã lập hợp đồng</p>
                  </div>
                </article>
              </div>
              <article className="sale-table-card">
                <div className="sale-table-head">
                  <div>
                    <h2>Danh sách đặt cọc</h2>
                    <p>Hồ sơ ở giai đoạn cọc. Nhấn "Gửi yêu cầu cọc" để chuyển hồ sơ sang bước xác nhận.</p>
                  </div>
                </div>
                {depositLoading ? (
                  <div className="sale-empty">Đang tải...</div>
                ) : depositList.length === 0 ? (
                  <div className="sale-empty">Chưa có hồ sơ nào ở giai đoạn đặt cọc.</div>
                ) : (
                  <div className="sale-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Hồ sơ</th><th>Khách hàng</th><th>Phòng / Giường</th>
                          <th>Phiếu cọc</th><th>Trạng thái</th><th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositList.map((row) => {
                          const status = getDepositRowStatus(row);
                          const phong = row.maGiuong
                            ? `${row.maPhong} · ${row.maGiuong}`
                            : (row.maPhong || '—');
                          const phieu = row.maPhieuDatCoc
                            || (row.trangThaiDangKy === 'Chấp nhận' ? 'Chưa lập' : '—');
                          return (
                            <tr key={row.maDangKy}>
                              <td><strong>{row.maDangKy}</strong></td>
                              <td>{row.hoTen}</td>
                              <td><span className="sale-room-pill">{phong}</span></td>
                              <td>{phieu}</td>
                              <td><Status tone={status.tone}>{status.label}</Status></td>
                              <td>
                                <div className="sale-row-actions">
                                  {row.trangThaiDangKy === 'Chờ tiếp nhận' && (
                                    <StaticButton primary onClick={() => setConfirmModal(row)}>
                                      Gửi yêu cầu cọc
                                    </StaticButton>
                                  )}
                                  {row.maPhieuDatCoc && (
                                    <StaticButton>Chi tiết</StaticButton>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              {confirmModal && (
                <div
                  className="sale-modal-overlay"
                  onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
                >
                  <div className="sale-modal">
                    <h3>Gửi yêu cầu đặt cọc</h3>
                    <p>Xác nhận gửi yêu cầu đặt cọc cho hồ sơ dưới đây đến nhân viên quản lý?</p>
                    <div className="sale-modal-info">
                      <div><span>Hồ sơ</span><strong>{confirmModal.maDangKy}</strong></div>
                      <div><span>Khách hàng</span><strong>{confirmModal.hoTen}</strong></div>
                      <div><span>Hình thức thuê</span><strong>{confirmModal.hinhThucThue}</strong></div>
                    </div>
                    <div className="sale-modal-actions">
                      <StaticButton onClick={() => setConfirmModal(null)}>Hủy</StaticButton>
                      <StaticButton primary onClick={handleGuiYeuCau} disabled={submitting}>
                        {submitting ? 'Đang gửi...' : 'Xác nhận gửi'}
                      </StaticButton>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeView === 'handover' && (
            <section className="sale-two-col">
              <article className="sale-table-card">
                <div className="sale-table-head"><div><h2>Khách đã chuyển nhận phòng</h2><p>Thông tin hợp đồng hình thành từ hồ sơ sale phụ trách.</p></div></div>
                <div className="sale-table-wrap">
                  <table>
                    <thead><tr><th>Khách hàng</th><th>Phòng/Giường</th><th>Hợp đồng</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                      <tr><td>Võ Gia Hân</td><td>P202 · G02</td><td>HD0006</td><td><Status tone="good">Hiệu lực</Status></td></tr>
                      <tr><td>Đinh Đức Quang</td><td>P301 · G01</td><td>HD0012</td><td><Status tone="good">Hiệu lực</Status></td></tr>
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="sale-card">
                <div className="sale-card-head"><div><h2>Checklist nhận phòng</h2><p>Sườn phối hợp bàn giao.</p></div></div>
                <div className="sale-checklist">
                  <div><PortalIcon name="deposit" /><span><strong>Xác nhận đặt cọc</strong><small>Biên nhận và trạng thái cọc</small></span><Status tone="good">OK</Status></div>
                  <div><PortalIcon name="profile" /><span><strong>Hồ sơ khách</strong><small>Thông tin cư trú, CCCD</small></span><Status tone="neutral">Kiểm tra</Status></div>
                  <div><PortalIcon name="building" /><span><strong>Phòng / Giường</strong><small>Phối hợp bàn giao tài sản</small></span><Status tone="wait">Chờ</Status></div>
                </div>
              </article>
            </section>
          )}

          {activeView === 'customers' && (
            <section className="sale-table-card">
                  <div className="sale-table-head"><div><h2>Khách hàng sale phụ trách</h2><p>Danh sách hồ sơ được phân công cho nhân viên sale.</p></div><StaticButton primary>Thêm khách</StaticButton></div>
              <div className="sale-table-wrap">
                <table>
                  <thead><tr><th>Khách hàng</th><th>Nhu cầu</th><th>Hồ sơ</th><th>Giai đoạn</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {registrations.map((item) => (
                      <tr key={item.id}>
                        <td><Person name={item.customer} phone={item.phone} /></td>
                        <td>{item.demand}</td>
                        <td>{item.id}</td>
                        <td><Status tone={item.tone}>{item.status}</Status></td>
                        <td><StaticButton>Xem hồ sơ</StaticButton></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeView === 'rooms' && (
            <section className="sale-stack">
              <article className="sale-card">
                <div className="sale-card-head"><div><h2>Tra cứu phòng/giường phù hợp</h2><p>Sườn lọc tình trạng phòng để tư vấn.</p></div><StaticButton>Đồng bộ dữ liệu phòng</StaticButton></div>
                <div className="sale-filters">
                  <label>Tìm phòng<input placeholder="Mã phòng, tên phòng..." /></label>
                  <label>Loại<select><option>Tất cả</option><option>Phòng 2 người</option><option>Phòng 4 người</option></select></label>
                  <label>Trạng thái<select><option>Trống / Còn chỗ</option></select></label>
                  <label>Chi nhánh<select><option>Tất cả</option><option>HomeDorm Thủ Đức</option></select></label>
                </div>
              </article>
              <div className="sale-room-grid">
                {rooms.map((room) => (
                  <article className="sale-room-card" key={room.id}>
                    <Status tone="good">{room.status}</Status>
                    <h2>{room.name}</h2>
                    <p>{room.id} · {room.branch}</p>
                    <div><span>Loại phòng<strong>{room.type}</strong></span><span>Giá thuê<strong>{room.price}</strong></span></div>
                    <StaticButton primary>Ghép với hồ sơ</StaticButton>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function RegistrationTable({ compact = false }) {
  return (
    <div className="sale-table-wrap">
      <table>
        <thead><tr><th>Mã hồ sơ</th><th>Khách hàng</th><th>Nhu cầu thuê</th><th>Phòng/Giường</th><th>Trạng thái</th>{!compact && <th>Thao tác</th>}</tr></thead>
        <tbody>
          {registrations.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.id}</strong></td>
              <td><Person name={item.customer} phone={item.phone} /></td>
              <td>{item.demand}</td>
              <td><span className="sale-room-pill">{item.room}</span></td>
              <td><Status tone={item.tone}>{item.status}</Status></td>
              {!compact && <td><div className="sale-row-actions"><StaticButton primary>Chi tiết</StaticButton><StaticButton>Lập lịch</StaticButton></div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
