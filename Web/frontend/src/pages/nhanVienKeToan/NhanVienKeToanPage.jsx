import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import { EmployeeAccountMenu, EmployeeAccountView } from '../../components/common/EmployeeAccount.jsx';
import PortalIcon from '../../components/common/PortalIcon.jsx';
import '../nhanVienQuanLy/nhanVienQuanLy.css';
import './nhanVienKeToan.css';

const views = [
  {
    id: 'overview',
    icon: 'dashboard',
    label: 'Tổng quan',
    title: 'Tổng quan kế toán',
    subtitle: 'Theo dõi tiền cọc, thu nhận phòng, hóa đơn, quyết toán trả phòng và hoàn cọc.'
  },
  {
    id: 'deposits',
    icon: 'deposit',
    label: 'Thanh toán cọc',
    title: 'Thanh toán cọc',
    subtitle: 'Theo dõi phiếu cọc, phương thức thanh toán và trạng thái ghi nhận tiền cọc.'
  },
  {
    id: 'movein',
    icon: 'contract',
    label: 'Thu nhận phòng',
    title: 'Thu nhận phòng',
    subtitle: 'Ghi nhận các khoản cần thu khi khách chuẩn bị nhận phòng.'
  },
  {
    id: 'invoices',
    icon: 'payment',
    label: 'Hóa đơn',
    title: 'Hóa đơn',
    subtitle: 'Quản lý hóa đơn tiền phòng, dịch vụ và trạng thái thanh toán của khách.'
  },
  {
    id: 'settlements',
    icon: 'checkout',
    label: 'Quyết toán trả phòng',
    title: 'Quyết toán trả phòng',
    subtitle: 'Tổng hợp hồ sơ trả phòng và khoản khấu trừ hoặc cần hoàn sau kiểm tra.'
  },
  {
    id: 'refunds',
    icon: 'payment',
    label: 'Hoàn cọc',
    title: 'Hoàn cọc',
    subtitle: 'Theo dõi các phiếu hoàn cọc sau quyết toán trả phòng.'
  }
];

// UI seed drawn from financial records assigned to accountant NV0004 in database/sql/data.sql.
const deposits = [
  { id: 'PC0003', customer: 'Lê Quốc Cường', room: 'P103', method: 'Chuyển khoản', status: 'Đã lập HĐ', tone: 'good' },
  { id: 'PC0006', customer: 'Võ Gia Hân', room: 'P202 · G02', method: 'Tiền mặt', status: 'Đã lập HĐ', tone: 'good' },
  { id: 'PC0009', customer: 'Huỳnh Nhật Nam', room: 'P201 · G01', method: 'Chuyển khoản', status: 'Đã lập HĐ', tone: 'good' },
  { id: 'PC0012', customer: 'Đinh Đức Quang', room: 'P301 · G01', method: 'Tiền mặt', status: 'Đã lập HĐ', tone: 'good' },
  { id: 'PC0015', customer: 'Tô Khánh Linh', room: 'P302 · G01', method: 'Chuyển khoản', status: 'Đã hủy', tone: 'danger' }
];

const invoices = [
  { id: 'HDN003', contract: 'HD0003', customer: 'Lê Quốc Cường', cycle: '2025-04', method: 'Chuyển khoản', status: 'Đã TT', tone: 'good' },
  { id: 'HDN006', contract: 'HD0006', customer: 'Võ Gia Hân', cycle: '2025-01', method: 'Chuyển khoản', status: 'Đã TT', tone: 'good' },
  { id: 'HDN009', contract: 'HD0009', customer: 'Huỳnh Nhật Nam', cycle: '2025-04', method: 'Chuyển khoản', status: 'Đã TT', tone: 'good' },
  { id: 'HDN012', contract: 'HD0012', customer: 'Đinh Đức Quang', cycle: '2025-01', method: 'Chuyển khoản', status: 'Đã TT', tone: 'good' },
  { id: 'HDN024', contract: 'HD0012', customer: 'Đinh Đức Quang', cycle: '2025-01', method: 'Chuyển khoản', status: 'Đã TT', tone: 'good' }
];

const collections = [
  { id: 'TH0003', customer: 'Lê Quốc Cường', room: 'P103', item: 'Tiền phòng đầu kỳ', amount: '7.200.000đ', status: 'Đã thu', tone: 'good' },
  { id: 'TH0006', customer: 'Võ Gia Hân', room: 'P202 · G02', item: 'Tiền phòng đầu kỳ', amount: '2.200.000đ', status: 'Đã thu', tone: 'good' },
  { id: 'TH0012', customer: 'Đinh Đức Quang', room: 'P301 · G01', item: 'Tiền phòng đầu kỳ', amount: '2.200.000đ', status: 'Đã thu', tone: 'good' }
];

const settlements = [
  { id: 'DS0001', request: 'PT0003', customer: 'Võ Gia Hân', contract: 'HD0006', method: 'Chuyển khoản', status: 'Đã hoàn cọc', tone: 'good' }
];

function formatVND(amount) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function defaultDeadline() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'KT';
}

function Brand() {
  return (
    <span className="ql-brand">
      <span className="ql-brand-icon"><PortalIcon name="home" /></span>
      <span className="ql-brand-name">Homestay <strong>Dorm</strong></span>
    </span>
  );
}

function Status({ tone = 'neutral', children }) {
  return <span className={`ql-status ${tone}`}>{children}</span>;
}

function Button({ primary = false, onClick, disabled = false, children }) {
  return <button className={`ql-btn ${primary ? 'primary' : 'secondary'}`} type="button" onClick={onClick} disabled={disabled}>{children}</button>;
}

function Person({ name, detail }) {
  return (
    <div className="ql-person">
      <span>{initials(name)}</span>
      <div><strong>{name}</strong><small>{detail}</small></div>
    </div>
  );
}

export default function NhanVienKeToanPage() {
  const { user, dangXuat } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const currentView = activeView === 'account'
    ? { title: 'Thông tin tài khoản', subtitle: 'Xem thông tin tài khoản nhân viên đang đăng nhập.' }
    : views.find((view) => view.id === activeView) || views[0];

  return (
    <div className="ql-page kt-page">
      <header className="ql-header">
        <div className="ql-frame ql-header-row">
          <button className="ql-brand-button" type="button" onClick={() => setActiveView('overview')}>
            <Brand />
          </button>
          <div className="ql-header-right">
            <div className="ql-context">
              <span>Cổng nhân viên</span>
              <strong>Kế toán thuê phòng</strong>
            </div>
            <EmployeeAccountMenu
              user={user}
              positionLabel="Nhân viên kế toán"
              onShowAccount={() => setActiveView('account')}
              onLogout={dangXuat}
            />
          </div>
        </div>
      </header>

      <div className="ql-frame ql-shell">
        <aside className="ql-sidebar">
          <p className="ql-side-label">Menu chính</p>
          <nav className="ql-nav">
            {views.map((view) => (
              <button
                className={`ql-nav-item ${activeView === view.id ? 'active' : ''}`}
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
              >
                <span><PortalIcon name={view.icon} /></span>
                {view.label}
              </button>
            ))}
          </nav>
          <div className="ql-side-note">
            <strong>Đối soát hôm nay</strong>
            <p>Ưu tiên ghi nhận thanh toán, hóa đơn và hồ sơ hoàn cọc đã đủ điều kiện.</p>
            <div><span /></div>
          </div>
        </aside>

        <main className="ql-main">
          <section className="ql-page-head">
            <div>
              <h1>{currentView.title}</h1>
              <p>{currentView.subtitle}</p>
            </div>
            {activeView !== 'account' && <div className="ql-actions">
              <label className="ql-search">
                <PortalIcon name="search" />
                <input type="search" placeholder="Tìm hóa đơn, phiếu cọc..." />
              </label>
            </div>}
          </section>

          {activeView === 'account' && <EmployeeAccountView user={user} positionLabel="Nhân viên kế toán" />}
          {activeView === 'overview' && <Overview />}
          {activeView === 'deposits' && <DepositPayments />}
          {activeView === 'movein' && <MoveinCollections />}
          {activeView === 'invoices' && <Invoices />}
          {activeView === 'settlements' && <Settlements />}
          {activeView === 'refunds' && <Refunds />}
        </main>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <section className="ql-stack">
      <div className="ql-stats">
        <article className="ql-stat"><span><PortalIcon name="deposit" /></span><div><strong>05</strong><p>Phiếu cọc phụ trách</p><small>04 đã lập hợp đồng</small></div></article>
        <article className="ql-stat"><span><PortalIcon name="contract" /></span><div><strong>03</strong><p>Khoản thu nhận phòng</p><small>Hồ sơ tài chính mẫu</small></div></article>
        <article className="ql-stat"><span><PortalIcon name="payment" /></span><div><strong>08</strong><p>Hóa đơn đã ghi nhận</p><small>Đã thanh toán</small></div></article>
        <article className="ql-stat"><span><PortalIcon name="checkout" /></span><div><strong>01</strong><p>Đối soát hoàn cọc</p><small>DS0001</small></div></article>
      </div>
      <article className="ql-card">
        <div className="ql-card-head">
          <div><h2>Luồng tiền kế toán cần theo dõi</h2><p>Phiếu cọc, khoản thu, hóa đơn và quyết toán sau trả phòng.</p></div>
          <Button primary>Xem giao dịch</Button>
        </div>
        <div className="ql-pipeline">
          <div><strong>01</strong><span>Phiếu cọc được duyệt</span></div>
          <div><strong>02</strong><span>Ghi nhận thanh toán</span></div>
          <div><strong>03</strong><span>Phát hành hóa đơn</span></div>
          <div><strong>04</strong><span>Đối soát và hoàn cọc</span></div>
        </div>
      </article>
      <div className="ql-two-col">
        <article className="ql-table-card">
          <div className="ql-table-head"><div><h2>Phiếu cọc kế toán phụ trách</h2><p>Các phiếu cọc được phân công cho nhân viên kế toán.</p></div></div>
          <DepositTable compact />
        </article>
        <article className="ql-card">
          <div className="ql-card-head"><div><h2>Cần theo dõi</h2><p>Các khoản tài chính nổi bật.</p></div></div>
          <div className="ql-todos">
            <div><Status tone="danger">Hết hạn</Status><strong>PC0015 · Tô Khánh Linh</strong><p>Phiếu cọc đã hủy sau khi hết hạn thanh toán.</p></div>
            <div><Status tone="good">Đã thu</Status><strong>HDN024 · HD0012</strong><p>Hóa đơn đã thanh toán qua chuyển khoản.</p></div>
            <div><Status tone="good">Hoàn cọc</Status><strong>DS0001 · PT0003</strong><p>Đối soát của Võ Gia Hân đã hoàn cọc.</p></div>
          </div>
        </article>
      </div>
    </section>
  );
}

function DepositPayments() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // row
  const [form, setForm] = useState({ soTienCoc: '', phuongThucThanhToan: 'Chuyển khoản' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // created phieu

  useEffect(() => {
    setLoading(true);
    datCocApi.getDanhSachChoLapPhieu()
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  function openModal(row) {
    setModal(row);
    setForm({
      soTienCoc: row.giaThue != null ? String(row.giaThue) : '',
      phuongThucThanhToan: 'Chuyển khoản'
    });
    setError('');
    setSuccess(null);
  }

  function closeModal() {
    setModal(null);
    setSuccess(null);
  }

  async function handleSubmit() {
    if (!modal) return;
    const amount = Number(form.soTienCoc);
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền cọc hợp lệ.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data: created } = await datCocApi.create({
        maDangKy: modal.maDangKy,
        maNhanVienKeToan: user.maNguoiDung,
        soTienCoc: amount,
        phuongThucThanhToan: form.phuongThucThanhToan,
        thoiHanThanhToan: null
      });
      setSuccess(created);
      const { data } = await datCocApi.getDanhSachChoLapPhieu();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ql-stack">
      <article className="ql-table-card">
        <div className="ql-table-head">
          <div>
            <h2>Hồ sơ chờ lập phiếu đặt cọc</h2>
            <p>Danh sách hồ sơ đã được quản lý chấp nhận, kế toán lập phiếu và xác nhận số tiền cọc.</p>
          </div>
        </div>
        {loading ? (
          <div className="ql-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hồ sơ</th><th>Khách hàng</th><th>Hình thức</th>
                  <th>Phòng / Giường</th><th>Giá thuê</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td><div className="kt-skel" style={{ width: 62 }} /></td>
                    <td>
                      <div className="ql-person">
                        <div className="kt-skel" style={{ borderRadius: '50%', width: 35, height: 35, flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'grid', gap: 5 }}>
                          <div className="kt-skel" />
                          <div className="kt-skel" style={{ width: '65%' }} />
                        </div>
                      </div>
                    </td>
                    <td><div className="kt-skel" style={{ width: 82 }} /></td>
                    <td><div className="kt-skel" style={{ width: 96, borderRadius: 999 }} /></td>
                    <td><div className="kt-skel" style={{ width: 80 }} /></td>
                    <td><div className="kt-skel kt-skel--btn" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : list.length === 0 ? (
          <div className="kt-empty-state">
            <PortalIcon name="deposit" />
            <p>Không có hồ sơ nào đang chờ lập phiếu.</p>
            <small>Hồ sơ được quản lý chấp nhận sẽ xuất hiện tại đây.</small>
          </div>
        ) : (
          <div className="ql-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hồ sơ</th><th>Khách hàng</th><th>Hình thức</th>
                  <th>Phòng / Giường</th><th>Giá thuê</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.maDangKy}>
                    <td><strong>{row.maDangKy}</strong></td>
                    <td>
                      <div className="ql-person">
                        <span>{initials(row.hoTen)}</span>
                        <div><strong>{row.hoTen}</strong><small>{row.soDienThoai}</small></div>
                      </div>
                    </td>
                    <td>{row.hinhThucThue}</td>
                    <td>
                      {row.maPhong
                        ? <span className="ql-room-pill">{row.maGiuong ? `${row.maPhong} · ${row.maGiuong}` : row.maPhong}</span>
                        : <span className="ql-muted">—</span>}
                    </td>
                    <td className="kt-amount">{formatVND(row.giaThue)}</td>
                    <td>
                      <Button primary onClick={() => openModal(row)}>Lập phiếu</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {modal && (
        <div
          className="ql-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="ql-modal kt-deposit-modal">
            <button className="kt-modal-close" type="button" onClick={closeModal} aria-label="Đóng">&#x2715;</button>
            {success ? (
              <>
                <div className="kt-receipt-header">
                  <div className="kt-receipt-icon"><PortalIcon name="deposit" /></div>
                  <div>
                    <h3>Lập phiếu thành công</h3>
                    <p className="kt-receipt-id">{success.maPhieuDatCoc}</p>
                  </div>
                </div>
                <div className="ql-modal-info">
                  <div><span>Khách hàng</span><strong>{success.hoTen}</strong></div>
                  <div><span>Số tiền cọc</span><strong className="kt-amount">{formatVND(success.soTienCoc)}</strong></div>
                  <div><span>Phương thức</span><strong>{success.phuongThucThanhToan}</strong></div>
                  <div><span>Hạn thanh toán</span><strong>{new Date(success.thoiHanThanhToan).toLocaleString('vi-VN')}</strong></div>
                  <div><span>Trạng thái</span><strong><Status tone="wait">{success.trangThaiThanhToan}</Status></strong></div>
                </div>
                <div className="ql-modal-actions">
                  <Button primary onClick={closeModal}>Đóng</Button>
                </div>
              </>
            ) : (
              <>
                <div className="kt-form-header">
                  <h3>Lập phiếu đặt cọc</h3>
                  <p>Xác nhận thông tin và điền số tiền cọc, phương thức thanh toán.</p>
                </div>
                <div className="ql-modal-info">
                  <div><span>Hồ sơ</span><strong>{modal.maDangKy}</strong></div>
                  <div><span>Khách hàng</span><strong>{modal.hoTen}</strong></div>
                  <div>
                    <span>Phòng / Giường</span>
                    <strong>{modal.maGiuong ? `${modal.maPhong} · ${modal.maGiuong}` : (modal.maPhong || '—')}</strong>
                  </div>
                  <div><span>Hình thức thuê</span><strong>{modal.hinhThucThue}</strong></div>
                  <div><span>Giá thuê tham khảo</span><strong>{formatVND(modal.giaThue)}</strong></div>
                  <div><span>Hạn thanh toán</span><strong>24 giờ kể từ khi lập phiếu</strong></div>
                </div>
                <div className="kt-form-group">
                  <label>Số tiền cọc (VNĐ)</label>
                  <input
                    className="kt-input"
                    type="number"
                    min="1"
                    step="100000"
                    value={form.soTienCoc}
                    onChange={(e) => setForm((f) => ({ ...f, soTienCoc: e.target.value }))}
                  />
                </div>
                <div className="kt-form-group">
                  <label>Phương thức thanh toán</label>
                  <select
                    className="kt-input"
                    value={form.phuongThucThanhToan}
                    onChange={(e) => setForm((f) => ({ ...f, phuongThucThanhToan: e.target.value }))}
                  >
                    <option>Chuyển khoản</option>
                    <option>Tiền mặt</option>
                  </select>
                </div>
                {error && <p className="ql-modal-error">{error}</p>}
                <div className="ql-modal-actions">
                  <Button onClick={closeModal}>Hủy</Button>
                  <Button primary onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Đang xử lý...' : 'Xác nhận lập phiếu'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function MoveinCollections() {
  return (
    <article className="ql-table-card">
      <div className="ql-table-head"><div><h2>Khoản thu khi nhận phòng</h2><p>Theo dõi tiền phòng đầu kỳ và biên nhận của khách.</p></div><Button primary>Tạo phiếu thu</Button></div>
      <div className="ql-table-wrap">
        <table>
          <thead><tr><th>Mã thu</th><th>Khách hàng</th><th>Phòng/Giường</th><th>Khoản cần thu</th><th>Số tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody>
            {collections.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.id}</strong></td>
                <td>{item.customer}</td>
                <td><span className="ql-room-pill">{item.room}</span></td>
                <td>{item.item}</td>
                <td className="kt-amount">{item.amount}</td>
                <td><Status tone={item.tone}>{item.status}</Status></td>
                <td><Button>Xem biên nhận</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function Invoices() {
  return (
    <section className="ql-stack">
      <FilterBar search="Mã hóa đơn, hợp đồng, khách hàng..." labels={['Kỳ thanh toán', 'Trạng thái', 'Phương thức']} />
      <article className="ql-table-card">
        <div className="ql-table-head"><div><h2>Danh sách hóa đơn</h2><p>Hóa đơn được phân công cho nhân viên kế toán.</p></div><Button primary>Tạo hóa đơn tháng</Button></div>
        <div className="ql-table-wrap">
          <table>
            <thead><tr><th>Mã hóa đơn</th><th>Khách hàng</th><th>Hợp đồng</th><th>Kỳ</th><th>Thanh toán</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.id}</strong></td>
                  <td><Person name={invoice.customer} detail={invoice.contract} /></td>
                  <td>{invoice.contract}</td>
                  <td>{invoice.cycle}</td>
                  <td>{invoice.method}</td>
                  <td><Status tone={invoice.tone}>{invoice.status}</Status></td>
                  <td><Button>Xem hóa đơn</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function Settlements() {
  return (
    <section className="ql-stack">
      <div className="kt-money-grid">
        <article className="kt-money-card"><PortalIcon name="payment" /><div><h2>Hồ sơ đối soát</h2><strong>01</strong><p>Được phân công xử lý</p></div></article>
        <article className="kt-money-card"><PortalIcon name="checkout" /><div><h2>Trạng thái</h2><strong>Đã hoàn cọc</strong><p>Giao dịch DS0001</p></div></article>
      </div>
      <article className="ql-table-card">
        <div className="ql-table-head"><div><h2>Quyết toán trả phòng</h2><p>Hồ sơ đối soát phát sinh sau khi khách hoàn tất kiểm tra trả phòng.</p></div><Button primary>Lập phiếu quyết toán</Button></div>
        <SettlementTable />
      </article>
    </section>
  );
}

function Refunds() {
  return (
    <article className="ql-table-card">
      <div className="ql-table-head"><div><h2>Danh sách hoàn cọc</h2><p>Kế toán ghi nhận hoàn cọc theo hồ sơ đối soát đã lập.</p></div><Button primary>Tạo lệnh hoàn cọc</Button></div>
      <SettlementTable refund />
    </article>
  );
}

function DepositTable({ compact = false }) {
  return (
    <div className="ql-table-wrap">
      <table>
        <thead><tr><th>Phiếu cọc</th><th>Khách hàng</th><th>Phòng/Giường</th><th>Phương thức</th><th>Trạng thái</th>{!compact && <th>Thao tác</th>}</tr></thead>
        <tbody>
          {deposits.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.id}</strong></td>
              <td><Person name={item.customer} detail={item.method} /></td>
              <td><span className="ql-room-pill">{item.room}</span></td>
              <td>{item.method}</td>
              <td><Status tone={item.tone}>{item.status}</Status></td>
              {!compact && <td><Button>{item.tone === 'danger' ? 'Xem lý do' : 'Xem phiếu'}</Button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettlementTable({ refund = false }) {
  return (
    <div className="ql-table-wrap">
      <table>
        <thead><tr><th>Đối soát</th><th>Khách hàng</th><th>Phiếu trả</th><th>Hợp đồng</th><th>Phương thức</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          {settlements.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.id}</strong></td>
              <td>{item.customer}</td>
              <td>{item.request}</td>
              <td>{item.contract}</td>
              <td>{item.method}</td>
              <td><Status tone={item.tone}>{item.status}</Status></td>
              <td><Button>{refund ? 'Xem hoàn cọc' : 'Xem quyết toán'}</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterBar({ search, labels }) {
  return (
    <div className="ql-filters">
      <label>Tìm kiếm<input placeholder={search} /></label>
      {labels.map((label) => (
        <label key={label}>{label}<select><option>Tất cả</option><option>Đã thanh toán</option><option>Chờ xử lý</option></select></label>
      ))}
    </div>
  );
}
