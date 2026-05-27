import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
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

function Button({ primary = false, children }) {
  return <button className={`ql-btn ${primary ? 'primary' : 'secondary'}`} type="button">{children}</button>;
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
  return (
    <section className="ql-stack">
      <FilterBar search="Mã phiếu, khách hàng, phòng/giường..." labels={['Trạng thái thanh toán', 'Phương thức', 'Trạng thái cọc']} />
      <article className="ql-table-card">
        <div className="ql-table-head"><div><h2>Danh sách thanh toán cọc</h2><p>Sườn thao tác ghi nhận thanh toán và theo dõi phiếu cọc.</p></div><Button primary>Phát hành yêu cầu</Button></div>
        <DepositTable />
      </article>
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
