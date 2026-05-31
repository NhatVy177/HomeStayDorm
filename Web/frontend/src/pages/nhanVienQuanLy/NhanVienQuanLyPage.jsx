import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import { nhanPhongApi } from '../nhanPhong/nhanPhong.api.js';
import { EmployeeAccountMenu, EmployeeAccountView } from '../../components/common/EmployeeAccount.jsx';
import PortalIcon from '../../components/common/PortalIcon.jsx';
import './nhanVienQuanLy.css';

const views = [
  {
    id: 'overview',
    icon: 'dashboard',
    label: 'Tổng quan',
    title: 'Tổng quan nhân viên quản lý',
    subtitle: 'Theo dõi xác nhận cọc, bàn giao phòng, bảo trì và kiểm tra trả phòng trong một màn hình.'
  },
  {
    id: 'deposits',
    icon: 'deposit',
    label: 'Xác nhận cọc',
    title: 'Xác nhận cọc',
    subtitle: 'Kiểm tra phiếu cọc, phòng/giường liên quan, trạng thái hiện tại và minh chứng thanh toán.'
  },
  {
    id: 'handover',
    icon: 'contract',
    label: 'Bàn giao phòng',
    title: 'Bàn giao phòng',
    subtitle: 'Kiểm tra thực tế phòng/giường, tài sản đi kèm và xác nhận khách nhận phòng.'
  },
  {
    id: 'maintenance',
    icon: 'repair',
    label: 'Bảo trì / Sửa chữa',
    title: 'Bảo trì / Sửa chữa',
    subtitle: 'Tiếp nhận yêu cầu sửa chữa từ khách, cập nhật xử lý và ghi nhận chi phí nếu có.'
  },
  {
    id: 'returns',
    icon: 'checkout',
    label: 'Kiểm tra trả phòng',
    title: 'Kiểm tra trả phòng',
    subtitle: 'Đối chiếu tài sản khi khách trả phòng và ghi nhận chi phí phát sinh.'
  },
  {
    id: 'rooms',
    icon: 'building',
    label: 'Phòng/Giường',
    title: 'Phòng/Giường',
    subtitle: 'Theo dõi trạng thái phòng/giường phục vụ bàn giao, bảo trì và trả phòng.'
  },
  {
    id: 'assets',
    icon: 'asset',
    label: 'Tài sản',
    title: 'Tài sản',
    subtitle: 'Quản lý tài sản theo phòng/giường, tình trạng hiện tại và lịch sử hư hỏng.'
  }
];

// UI seed drawn from records assigned to manager NV0003 in database/sql/data.sql.
const contracts = [
  { id: 'HD0003', customer: 'Lê Quốc Cường', room: 'P103', deposit: 'PC0003', status: 'Hiệu lực', tone: 'good' },
  { id: 'HD0006', customer: 'Võ Gia Hân', room: 'P202 · G02', deposit: 'PC0006', status: 'Hiệu lực', tone: 'good' },
  { id: 'HD0009', customer: 'Huỳnh Nhật Nam', room: 'P201 · G01', deposit: 'PC0009', status: 'Đã thanh lý', tone: 'neutral' },
  { id: 'HD0012', customer: 'Đinh Đức Quang', room: 'P301 · G01', deposit: 'PC0012', status: 'Hiệu lực', tone: 'good' }
];

const handovers = [
  { id: 'BB0003', customer: 'Lê Quốc Cường', room: 'P103', date: '01/05/2025', type: 'Bàn giao vào', tone: 'good' },
  { id: 'BB0006', customer: 'Võ Gia Hân', room: 'P202 · G02', date: '01/08/2025', type: 'Bàn giao vào', tone: 'good' },
  { id: 'BB0013', customer: 'Huỳnh Nhật Nam', room: 'P201 · G01', date: '31/12/2024', type: 'Bàn giao ra', tone: 'neutral' },
  { id: 'BB0014', customer: 'Võ Gia Hân', room: 'P202 · G02', date: '01/02/2026', type: 'Bàn giao ra', tone: 'wait' }
];

const maintenance = [
  { id: 'SC0001', room: 'P101', asset: 'Máy lạnh', issue: 'Máy lạnh không lạnh', status: 'Hoàn tất', cost: '350.000đ', tone: 'good' },
  { id: 'SC0002', room: 'P102', asset: 'Tủ cá nhân', issue: 'Ổ khóa tủ bị kẹt', status: 'Đang xử lý', cost: '0đ', tone: 'wait' },
  { id: 'SC0003', room: 'P202', asset: 'Nệm', issue: 'Nệm bị rách', status: 'Hoàn tất', cost: '200.000đ', tone: 'good' },
  { id: 'SC0007', room: 'P105', asset: 'Tủ cá nhân', issue: 'Hỏng bản lề', status: 'Hoàn tất', cost: '250.000đ', tone: 'good' }
];

const returnChecks = [
  { id: 'KT0001', request: 'PT0002', room: 'P102', date: '15/01/2026', condition: 'Mất 1 thẻ từ', cost: '100.000đ' },
  { id: 'KT0002', request: 'PT0003', room: 'P202', date: '12/01/2026', condition: 'Nệm rách nhẹ', cost: '200.000đ' },
  { id: 'KT0005', request: 'PT0007', room: 'P105', date: '20/01/2026', condition: 'Hỏng tủ và mất thẻ', cost: '350.000đ' }
];

const rooms = [
  { id: 'P103', status: 'Đang thuê', type: 'Phòng 4 người', note: 'HD0003 · Lê Quốc Cường', tone: 'wait' },
  { id: 'P202', status: 'Chờ trả phòng', type: 'Phòng 2 người', note: 'HD0006 · Võ Gia Hân', tone: 'neutral' },
  { id: 'P201', status: 'Đã thu hồi', type: 'Phòng 2 người', note: 'BB0013 · Đã bàn giao ra', tone: 'good' },
  { id: 'P301', status: 'Đang thuê', type: 'Phòng 2 người', note: 'HD0012 · Đinh Đức Quang', tone: 'wait' }
];

const assets = [
  { id: 'TS0004', name: 'Chìa khóa/thẻ từ', room: 'P102', status: 'Thiếu 1 thẻ', note: 'KT0001 · 100.000đ', tone: 'danger' },
  { id: 'TS0002', name: 'Nệm', room: 'P202', status: 'Cần sửa', note: 'KT0002 · 200.000đ', tone: 'wait' },
  { id: 'TS0003', name: 'Tủ cá nhân', room: 'P105', status: 'Hỏng bản lề', note: 'KT0005 · 250.000đ', tone: 'danger' },
  { id: 'TS0004', name: 'Chìa khóa/thẻ từ', room: 'P301', status: 'Đã bàn giao', note: 'BB0012', tone: 'good' }
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'QL';
}

function Status({ tone = 'neutral', children }) {
  return <span className={`ql-status ${tone}`}>{children}</span>;
}

function Button({ primary = false, onClick, disabled = false, children }) {
  return <button className={`ql-btn ${primary ? 'primary' : 'secondary'}`} type="button" onClick={onClick} disabled={disabled}>{children}</button>;
}

function roomTone(tinh) {
  if (tinh === 'Trống' || tinh === 'Còn chỗ') return 'good';
  return 'danger';
}

function canAccept(row) {
  if (!row.maPhong) return false;
  if (row.maGiuong) return row.tinhTrangGiuong === 'Trống';
  return row.tinhTrangPhong === 'Trống' || row.tinhTrangPhong === 'Còn chỗ';
}

function Person({ name, detail }) {
  return (
    <div className="ql-person">
      <span>{initials(name)}</span>
      <div><strong>{name}</strong><small>{detail}</small></div>
    </div>
  );
}

function Brand() {
  return (
    <span className="ql-brand">
      <span className="ql-brand-icon"><PortalIcon name="home" /></span>
      <span className="ql-brand-name">Homestay <strong>Dorm</strong></span>
    </span>
  );
}

export default function NhanVienQuanLyPage() {
  const { user, dangXuat } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const currentView = activeView === 'account'
    ? { title: 'Thông tin tài khoản', subtitle: 'Xem thông tin tài khoản nhân viên đang đăng nhập.' }
    : views.find((view) => view.id === activeView) || views[0];

  return (
    <div className="ql-page">
      <header className="ql-header">
        <div className="ql-frame ql-header-row">
          <button className="ql-brand-button" type="button" onClick={() => setActiveView('overview')}>
            <Brand />
          </button>
          <div className="ql-header-right">
            <div className="ql-context">
              <span>Cổng nhân viên</span>
              <strong>Quản lý vận hành phòng</strong>
            </div>
            <EmployeeAccountMenu
              user={user}
              positionLabel="Nhân viên quản lý"
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
            <strong>Ca trực hôm nay</strong>
            <p>Ưu tiên bàn giao phòng, yêu cầu sửa chữa và kiểm tra trả phòng đang chờ xử lý.</p>
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
                <input type="search" placeholder="Tìm khách, phòng, yêu cầu..." />
              </label>
            </div>}
          </section>

          {activeView === 'account' && <EmployeeAccountView user={user} positionLabel="Nhân viên quản lý" />}
          {activeView === 'overview' && <Overview />}
          {activeView === 'deposits' && <Deposits />}
          {activeView === 'handover' && <Handovers />}
          {activeView === 'maintenance' && <Maintenance />}
          {activeView === 'returns' && <ReturnChecks />}
          {activeView === 'rooms' && <Rooms />}
          {activeView === 'assets' && <Assets />}
        </main>
      </div>
    </div>
  );
}

function Overview() {
  return (
    <section className="ql-stack">
      <div className="ql-stats">
        <article className="ql-stat"><span><PortalIcon name="deposit" /></span><div><strong>04</strong><p>Hợp đồng phụ trách</p><small>Hồ sơ vận hành mẫu</small></div></article>
        <article className="ql-stat"><span><PortalIcon name="contract" /></span><div><strong>06</strong><p>Biên bản bàn giao</p><small>Vào và ra phòng</small></div></article>
        <article className="ql-stat"><span><PortalIcon name="repair" /></span><div><strong>04</strong><p>Yêu cầu sửa chữa</p><small>01 đang xử lý</small></div></article>
        <article className="ql-stat"><span><PortalIcon name="checkout" /></span><div><strong>03</strong><p>Kiểm tra trả phòng</p><small>Có chi phí phát sinh</small></div></article>
      </div>
      <article className="ql-card">
        <div className="ql-card-head">
          <div><h2>Luồng công việc quản lý</h2><p>Xác nhận thông tin, bàn giao, xử lý bảo trì và kiểm tra trả phòng.</p></div>
          <Button primary>Xem lịch xử lý</Button>
        </div>
        <div className="ql-pipeline">
          <div><strong>04</strong><span>Hợp đồng quản lý</span></div>
          <div><strong>04</strong><span>Bàn giao vào</span></div>
          <div><strong>04</strong><span>Bảo trì / sửa chữa</span></div>
          <div><strong>03</strong><span>Kiểm tra trả phòng</span></div>
        </div>
      </article>
      <div className="ql-two-col">
        <article className="ql-table-card">
          <div className="ql-table-head"><div><h2>Hợp đồng đang phụ trách</h2><p>Các hợp đồng được phân công cho nhân viên quản lý.</p></div></div>
          <div className="ql-table-wrap">
            <table>
              <thead><tr><th>Hợp đồng</th><th>Khách hàng</th><th>Phòng/Giường</th><th>Phiếu cọc</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td><strong>{contract.id}</strong></td>
                    <td><Person name={contract.customer} detail={contract.deposit} /></td>
                    <td><span className="ql-room-pill">{contract.room}</span></td>
                    <td>{contract.deposit}</td>
                    <td><Status tone={contract.tone}>{contract.status}</Status></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="ql-card">
          <div className="ql-card-head"><div><h2>Việc cần theo dõi</h2><p>Các hồ sơ đang có bước xử lý tiếp.</p></div></div>
          <div className="ql-todos">
            <div><Status tone="wait">Đang xử lý</Status><strong>SC0002 · Ổ khóa tủ bị kẹt</strong><p>Phòng P102 đã có lịch thợ sửa.</p></div>
            <div><Status tone="danger">Chi phí</Status><strong>KT0005 · P105</strong><p>Hỏng tủ cá nhân và mất thẻ, tổng 350.000đ.</p></div>
            <div><Status tone="good">Hoàn tất</Status><strong>BB0013 · P201</strong><p>Đã bàn giao ra và thu hồi tài sản.</p></div>
          </div>
        </article>
      </div>
    </section>
  );
}

function Deposits() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // { row, action: 'chap-nhan' | 'tu-choi' }
  const [lyDo, setLyDo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    datCocApi.getDanhSachChoXacNhan()
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  function openModal(row, action) {
    setModal({ row, action });
    setLyDo('');
    setError('');
  }

  async function handleAction() {
    if (!modal) return;
    const { row, action } = modal;
    if (action === 'tu-choi' && !lyDo.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await datCocApi.xacNhanKhaNang(row.maDangKy, {
        maQuanLy: user.maNguoiDung,
        duocNhanCoc: action === 'chap-nhan',
        lyDo: action === 'tu-choi' ? lyDo.trim() : null
      });
      setModal(null);
      setLyDo('');
      const { data } = await datCocApi.getDanhSachChoXacNhan();
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
            <h2>Yêu cầu đặt cọc chờ xác nhận</h2>
            <p>Kiểm tra tình trạng phòng/giường thực tế rồi chấp nhận hoặc từ chối.</p>
          </div>
        </div>
        {loading ? (
          <div className="ql-empty">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="ql-empty">Không có yêu cầu nào đang chờ xác nhận.</div>
        ) : (
          <div className="ql-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hồ sơ</th><th>Khách hàng</th><th>Phòng / Giường</th>
                  <th>TT Phòng</th><th>TT Giường</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => {
                  const phong = row.maGiuong
                    ? `${row.maPhong} · ${row.maGiuong}`
                    : (row.maPhong || '—');
                  return (
                    <tr key={row.maDangKy}>
                      <td><strong>{row.maDangKy}</strong></td>
                      <td>
                        <div className="ql-person">
                          <span>{initials(row.hoTen)}</span>
                          <div><strong>{row.hoTen}</strong><small>{row.hinhThucThue}</small></div>
                        </div>
                      </td>
                      <td>{row.maPhong ? <span className="ql-room-pill">{phong}</span> : '—'}</td>
                      <td>
                        {row.tinhTrangPhong
                          ? <Status tone={roomTone(row.tinhTrangPhong)}>{row.tinhTrangPhong}</Status>
                          : <span className="ql-muted">—</span>}
                      </td>
                      <td>
                        {row.maGiuong
                          ? <Status tone={roomTone(row.tinhTrangGiuong)}>{row.tinhTrangGiuong || '—'}</Status>
                          : <span className="ql-muted">—</span>}
                      </td>
                      <td>
                        <div className="ql-row-actions">
                          <Button primary onClick={() => openModal(row, 'chap-nhan')} disabled={!canAccept(row)}>Chấp nhận</Button>
                          <Button onClick={() => openModal(row, 'tu-choi')}>Từ chối</Button>
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

      {modal && (
        <div
          className="ql-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="ql-modal">
            {modal.action === 'chap-nhan' ? (
              <>
                <h3>Xác nhận chấp nhận đặt cọc</h3>
                <p>Kiểm tra tình trạng phòng/giường trước khi xác nhận.</p>
              </>
            ) : (
              <>
                <h3>Từ chối yêu cầu đặt cọc</h3>
                <p>Nhập lý do để thông báo đến nhân viên sale phụ trách.</p>
              </>
            )}
            <div className="ql-modal-info">
              <div><span>Hồ sơ</span><strong>{modal.row.maDangKy}</strong></div>
              <div><span>Khách hàng</span><strong>{modal.row.hoTen}</strong></div>
              <div>
                <span>Phòng / Giường</span>
                <strong>
                  {modal.row.maGiuong
                    ? `${modal.row.maPhong} · ${modal.row.maGiuong}`
                    : (modal.row.maPhong || '—')}
                </strong>
              </div>
              <div>
                <span>Tình trạng phòng</span>
                {modal.row.tinhTrangPhong
                  ? <Status tone={roomTone(modal.row.tinhTrangPhong)}>{modal.row.tinhTrangPhong}</Status>
                  : <span className="ql-muted">—</span>}
              </div>
              {modal.row.maGiuong && (
                <div>
                  <span>Tình trạng giường</span>
                  {modal.row.tinhTrangGiuong
                    ? <Status tone={roomTone(modal.row.tinhTrangGiuong)}>{modal.row.tinhTrangGiuong}</Status>
                    : <span className="ql-muted">—</span>}
                </div>
              )}
            </div>
            {modal.action === 'tu-choi' && (
              <textarea
                className="ql-textarea"
                placeholder="Nhập lý do từ chối..."
                value={lyDo}
                onChange={(e) => setLyDo(e.target.value)}
                rows={3}
              />
            )}
            {error && <p className="ql-modal-error">{error}</p>}
            <div className="ql-modal-actions">
              <Button onClick={() => setModal(null)}>Hủy</Button>
              <Button primary onClick={handleAction} disabled={submitting}>
                {submitting
                  ? 'Đang xử lý...'
                  : modal.action === 'chap-nhan' ? 'Đồng ý nhận cọc' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Handovers() {
  const { user } = useAuth();

  // ── View state: 'list' | 'form' | 'success' ──────────────────────────────
  const [view, setView] = useState('list');

  // ── List state ────────────────────────────────────────────────────────────
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // ── Selected contract & assets ────────────────────────────────────────────
  const [selected, setSelected] = useState(null); // row from API
  const [assets, setAssets] = useState([]);        // [{ maTaiSan, tenTaiSan, soLuongChuan, donGiaBoiThuong, soLuongThucTe, ghiChu }]
  const [loadingAssets, setLoadingAssets] = useState(false);

  // ── Form validation ───────────────────────────────────────────────────────
  const [guestSigned, setGuestSigned] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // ── Confirm modal ─────────────────────────────────────────────────────────
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Cancel confirm modal ──────────────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ── Submission ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Success receipt ───────────────────────────────────────────────────────
  const [receipt, setReceipt] = useState(null);

  // ── Load pending-handover list on mount ───────────────────────────────────
  useEffect(() => {
    setLoadingList(true);
    nhanPhongApi.getDanhSachChoBanGiao()
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoadingList(false));
  }, []);

  // ── Select a contract → load its assets ───────────────────────────────────
  async function handleSelectContract(row) {
    setSelected(row);
    setGuestSigned(false);
    setShowValidationAlert(false);
    setSubmitError('');
    setLoadingAssets(true);
    setView('form');
    try {
      const { data } = await nhanPhongApi.getDanhSachTaiSanBanGiao(row.maPhong);
      const items = Array.isArray(data) ? data : [];
      setAssets(items.map((a) => ({
        ...a,
        soLuongThucTe: a.soLuongChuan, // default = standard
        ghiChu: ''
      })));
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }

  // ── Update actual quantity for one asset row ──────────────────────────────
  function handleQtyChange(maTaiSan, value) {
    setAssets((prev) =>
      prev.map((a) => a.maTaiSan === maTaiSan ? { ...a, soLuongThucTe: value } : a)
    );
  }

  // ── Update note for one asset row ─────────────────────────────────────────
  function handleNoteChange(maTaiSan, value) {
    setAssets((prev) =>
      prev.map((a) => a.maTaiSan === maTaiSan ? { ...a, ghiChu: value } : a)
    );
  }

  // ── Pre-submit validation ──────────────────────────────────────────────────
  function handleSubmitAttempt(e) {
    e.preventDefault();

    // All assets must have a numeric qty
    const missing = assets.some((a) => a.soLuongThucTe === '' || a.soLuongThucTe == null);
    if (missing) {
      setShowValidationAlert(true);
      return;
    }
    setShowValidationAlert(false);

    if (!guestSigned) {
      setSubmitError('Chưa xác nhận chữ ký khách hàng. Không thể lưu biên bản!');
      return;
    }

    setSubmitError('');
    setShowConfirmModal(true);
  }

  // ── Actual submit ─────────────────────────────────────────────────────────
  async function handleConfirmSubmit() {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        hopDongId: selected.maHopDong,
        phongGiuongId: selected.maGiuong
          ? `${selected.maPhong}-${selected.maGiuong}`
          : selected.maPhong,
        danhSachTaiSan: assets.map((a) => ({
          maTaiSan: a.maTaiSan,
          soLuongThucTe: Number(a.soLuongThucTe),
          ghiChu: a.ghiChu || null
        }))
      };
      const { data } = await nhanPhongApi.lapBienBanBanGiao(payload);
      setShowConfirmModal(false);
      setReceipt(data);
      setView('success');
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Reset back to list ────────────────────────────────────────────────────
  function handleBackToList() {
    setView('list');
    setSelected(null);
    setAssets([]);
    setReceipt(null);
    setSubmitError('');
    setShowValidationAlert(false);
    setGuestSigned(false);
    // Refresh list
    setLoadingList(true);
    nhanPhongApi.getDanhSachChoBanGiao()
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoadingList(false));
  }

  // ── Format currency ───────────────────────────────────────────────────────
  function formatVND(n) {
    return Number(n || 0).toLocaleString('vi-VN') + ' VNĐ';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: SUCCESS RECEIPT
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'success') {
    return (
      <section className="ql-stack">
        <article className="ql-card ql-handover-receipt">
          <div className="ql-receipt-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" />
            </svg>
          </div>
          <h2>Lập biên bản bàn giao thành công!</h2>
          {receipt && (
            <div className="ql-modal-info" style={{ marginTop: '1.25rem' }}>
              <div><span>Mã biên bản</span><strong>{receipt.maBienBan}</strong></div>
              <div><span>Hợp đồng</span><strong>{receipt.maHopDong}</strong></div>
              <div><span>Phòng</span><strong>{receipt.maPhong}</strong></div>
              <div><span>Loại bàn giao</span><strong>{receipt.loaiBanGiao}</strong></div>
              <div><span>Trạng thái phòng mới</span><strong><Status tone={receipt.tinhTrangPhongMoi === 'Đầy' ? 'danger' : 'good'}>{receipt.tinhTrangPhongMoi}</Status></strong></div>
            </div>
          )}
          <p style={{ color: 'var(--ql-muted)', fontSize: '13.5px', margin: '1rem 0' }}>
            Tất cả giường trong hợp đồng đã chuyển sang trạng thái <strong>Đang thuê</strong>. Phòng đã được cập nhật trạng thái.
          </p>
          <Button primary onClick={handleBackToList}>← Quay về danh sách</Button>
        </article>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: HANDOVER FORM
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'form' && selected) {
    const roomLabel = selected.maGiuong
      ? `${selected.maPhong} - Giường ${selected.maGiuong}`
      : selected.maPhong;

    return (
      <section className="ql-stack">
        {/* Contract summary banner */}
        <article className="ql-card">
          <div className="ql-card-head">
            <div>
              <h2>Chi tiết bàn giao vào phòng trọ</h2>
              <p>Kiểm tra số lượng tài sản thực tế rồi xác nhận bàn giao cho khách.</p>
            </div>
            <Button onClick={() => setShowCancelModal(true)}>Hủy bỏ</Button>
          </div>

          {/* Green info strip */}
          <div className="ql-handover-summary">
            <div className="ql-summary-item">
              <span>Mã Hợp Đồng</span>
              <strong>{selected.maHopDong}</strong>
            </div>
            <div className="ql-summary-item">
              <span>Khách hàng ký nhận</span>
              <strong>{selected.hoTen}</strong>
            </div>
            <div className="ql-summary-item">
              <span>Phòng bàn giao</span>
              <strong>{roomLabel}</strong>
            </div>
            <div className="ql-summary-item">
              <span>Tên phòng</span>
              <strong>{selected.tenPhong || '—'}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmitAttempt}>
            <h3 className="ql-section-label">Bảng kiểm đếm tài sản phòng trọ (So sánh thực tế)</h3>

            {/* Validation alert A7 */}
            {showValidationAlert && (
              <div className="ql-alert ql-alert-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" /><path d="M12 17h.01" />
                </svg>
                <div>
                  <strong>Lỗi kiểm đếm!</strong> Còn tài sản bắt buộc chưa nhập số lượng thực tế. Vui lòng hoàn thành trước khi ký nhận!
                </div>
              </div>
            )}

            {loadingAssets ? (
              <div className="ql-empty">Đang tải danh sách tài sản...</div>
            ) : assets.length === 0 ? (
              <div className="ql-empty">Không tìm thấy tài sản nào cho phòng này.</div>
            ) : (
              <div className="ql-table-wrap ql-asset-table-wrap">
                <table className="ql-asset-input-table">
                  <thead>
                    <tr>
                      <th>Mã tài sản</th>
                      <th>Tên trang thiết bị</th>
                      <th>Số lượng chuẩn (CSDL)</th>
                      <th>Đơn giá bồi thường</th>
                      <th>Số lượng thực tế <span style={{ color: 'var(--ql-danger)' }}>*</span></th>
                      <th>Ghi chú hiện trạng chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => {
                      const hasDiscrepancy =
                        asset.soLuongThucTe !== '' &&
                        asset.soLuongThucTe != null &&
                        Number(asset.soLuongThucTe) !== Number(asset.soLuongChuan);
                      return (
                        <tr key={asset.maTaiSan}>
                          <td><strong>{asset.maTaiSan}</strong></td>
                          <td>{asset.tenTaiSan}</td>
                          <td>
                            <strong style={{ color: 'var(--ql-green-dark)' }}>
                              {asset.soLuongChuan}
                            </strong>
                          </td>
                          <td>{formatVND(asset.donGiaBoiThuong)}</td>
                          <td>
                            <input
                              className={`ql-asset-qty-input${hasDiscrepancy ? ' discrepancy' : ''}`}
                              type="number"
                              min="0"
                              max="99"
                              value={asset.soLuongThucTe}
                              required
                              onChange={(e) => handleQtyChange(asset.maTaiSan, e.target.value)}
                            />
                          </td>
                          <td>
                            <textarea
                              className={`ql-asset-note-input${hasDiscrepancy ? ' required-note' : ''}`}
                              placeholder={
                                hasDiscrepancy
                                  ? `⚠️ BẮT BUỘC: Nhập lý do chênh lệch thực tế (${asset.soLuongThucTe}) khác tiêu chuẩn (${asset.soLuongChuan}) tại đây!`
                                  : 'Nhập ghi chú chi tiết nếu có chênh lệch hoặc hư hỏng...'
                              }
                              required={hasDiscrepancy}
                              value={asset.ghiChu}
                              onChange={(e) => handleNoteChange(asset.maTaiSan, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature section */}
            <div className="ql-sign-section">
              <input
                type="checkbox"
                id="chkGuestPresent"
                checked={guestSigned}
                onChange={(e) => setGuestSigned(e.target.checked)}
              />
              <label htmlFor="chkGuestPresent">
                Tôi xác nhận khách hàng (<strong>{selected.hoTen}</strong>) có mặt tại hiện trường phòng trọ, trực tiếp tham gia kiểm đếm, xác thực hiện trạng chênh lệch tài sản và đã ký nhận biên bản.
              </label>
            </div>

            {submitError && (
              <div className="ql-alert ql-alert-error" style={{ marginTop: '12px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
                </svg>
                <div>{submitError}</div>
              </div>
            )}

            <div className="ql-form-actions">
              <Button onClick={() => setShowCancelModal(true)}>Hủy bỏ</Button>
              <button className="ql-btn primary" type="submit">
                Xác nhận Lưu Biên Bản Bàn Giao
              </button>
            </div>
          </form>
        </article>

        {/* ── Cancel confirmation modal ── */}
        {showCancelModal && (
          <div className="ql-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCancelModal(false); }}>
            <div className="ql-modal">
              <h3>Hủy lập biên bản bàn giao?</h3>
              <p>Dữ liệu kiểm đếm sẽ bị xóa. Bạn có chắc muốn quay về danh sách?</p>
              <div className="ql-modal-actions">
                <Button onClick={() => setShowCancelModal(false)}>Tiếp tục điền</Button>
                <Button primary onClick={() => { setShowCancelModal(false); handleBackToList(); }}>
                  Đồng ý hủy
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Submit confirmation modal ── */}
        {showConfirmModal && (
          <div className="ql-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !submitting) setShowConfirmModal(false); }}>
            <div className="ql-modal">
              <h3>Xác nhận lưu biên bản bàn giao</h3>
              <p>Sau khi lưu, trạng thái giường sẽ chuyển sang <strong>Đang thuê</strong> và không thể hoàn tác.</p>
              <div className="ql-modal-info">
                <div><span>Hợp đồng</span><strong>{selected.maHopDong}</strong></div>
                <div><span>Khách hàng</span><strong>{selected.hoTen}</strong></div>
                <div><span>Phòng / Giường</span><strong>{roomLabel}</strong></div>
                <div><span>Số tài sản bàn giao</span><strong>{assets.length} mục</strong></div>
                <div>
                  <span>Chênh lệch tài sản</span>
                  <strong>
                    {assets.filter((a) => Number(a.soLuongThucTe) !== Number(a.soLuongChuan)).length} mục
                  </strong>
                </div>
              </div>
              {submitError && <p className="ql-modal-error">{submitError}</p>}
              <div className="ql-modal-actions">
                <Button onClick={() => { if (!submitting) setShowConfirmModal(false); }} disabled={submitting}>
                  Quay lại
                </Button>
                <Button primary onClick={handleConfirmSubmit} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Xác nhận lưu biên bản'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PENDING-HANDOVER LIST
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section className="ql-stack">
      <article className="ql-table-card">
        <div className="ql-table-head">
          <div>
            <h2>Hợp đồng đã đóng đủ tiền chờ bàn giao vào</h2>
            <p>Chọn hợp đồng để lập biên bản bàn giao phòng cho khách.</p>
          </div>
        </div>

        {loadingList ? (
          <div className="ql-empty">Đang tải danh sách...</div>
        ) : list.length === 0 ? (
          <div className="ql-empty">Không có hợp đồng nào đang chờ bàn giao.</div>
        ) : (
          <div className="ql-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Khách hàng</th>
                  <th>Phòng / Giường</th>
                  <th>Thu đầu kỳ</th>
                  <th>Giường (Đặt cọc)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => {
                  const paid = row.daDongTienDauKy === 1;
                  const bedOk = row.tinhTrangGiuongHopLe === 1;
                  const canHandover = paid && bedOk;
                  const roomLabel = row.maGiuong
                    ? `${row.maPhong} - Giường ${row.maGiuong} (${row.tenPhong || ''})`
                    : `${row.maPhong} (${row.tenPhong || ''})`;
                  return (
                    <tr key={row.maHopDong}>
                      <td><strong>{row.maHopDong}</strong></td>
                      <td>
                        <Person name={row.hoTen} detail={row.soDienThoai || row.cccd || ''} />
                      </td>
                      <td><span className="ql-room-pill">{roomLabel}</span></td>
                      <td>
                        {paid
                          ? <Status tone="good">Đã TT (Thu đầu kỳ)</Status>
                          : <Status tone="danger">Chưa TT (Bị Khóa)</Status>}
                      </td>
                      <td>
                        {bedOk
                          ? <Status tone="wait">Đã đặt cọc</Status>
                          : <Status tone="danger">Chưa hợp lệ</Status>}
                      </td>
                      <td>
                        <button
                          className={`ql-btn ${canHandover ? 'primary' : 'secondary'}`}
                          type="button"
                          disabled={!canHandover}
                          title={!paid ? 'Bị Khóa: Khách chưa hoàn tất thanh toán hóa đơn kỳ đầu!' : !bedOk ? 'Giường chưa ở trạng thái Đã đặt cọc!' : ''}
                          style={!canHandover ? { cursor: 'not-allowed' } : {}}
                          onClick={() => canHandover && handleSelectContract(row)}
                        >
                          {canHandover ? 'Lập bàn giao vào' : 'Bị Khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}

function Maintenance() {
  return (
    <section className="ql-stack">
      <FilterBar search="Mã yêu cầu, phòng, tài sản hư hỏng..." labels={['Trạng thái xử lý', 'Loại tài sản', 'Mức chi phí']} />
      <article className="ql-table-card">
        <div className="ql-table-head"><div><h2>Yêu cầu sửa chữa đang phụ trách</h2><p>Các yêu cầu được phân công cho nhân viên quản lý.</p></div><Button primary>Tạo yêu cầu nội bộ</Button></div>
        <div className="ql-table-wrap">
          <table>
            <thead><tr><th>Mã yêu cầu</th><th>Phòng</th><th>Tài sản</th><th>Mô tả</th><th>Chi phí</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {maintenance.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.id}</strong></td>
                  <td><span className="ql-room-pill">{item.room}</span></td>
                  <td>{item.asset}</td>
                  <td>{item.issue}</td>
                  <td>{item.cost}</td>
                  <td><Status tone={item.tone}>{item.status}</Status></td>
                  <td><Button>Cập nhật</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function ReturnChecks() {
  return (
    <section className="ql-stack">
      <article className="ql-table-card">
        <div className="ql-table-head"><div><h2>Danh sách kiểm tra trả phòng</h2><p>Biên bản kiểm tra đang được nhân viên quản lý xử lý.</p></div><Button primary>Lập lịch kiểm tra</Button></div>
        <div className="ql-table-wrap">
          <table>
            <thead><tr><th>Biên bản</th><th>Phiếu trả</th><th>Phòng</th><th>Ngày kiểm tra</th><th>Tình trạng</th><th>Chi phí</th><th>Thao tác</th></tr></thead>
            <tbody>
              {returnChecks.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.id}</strong></td>
                  <td>{item.request}</td>
                  <td><span className="ql-room-pill">{item.room}</span></td>
                  <td>{item.date}</td>
                  <td>{item.condition}</td>
                  <td><Status tone="danger">{item.cost}</Status></td>
                  <td><Button>Chi tiết</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <div className="ql-three-col">
        <article className="ql-card"><h2>Kiểm tra phòng</h2><p>Đối chiếu điện nước, vệ sinh, khóa cửa và nội thất cố định.</p></article>
        <article className="ql-card"><h2>Đối chiếu tài sản</h2><p>So với biên bản bàn giao để xác định thiếu hoặc hư hỏng.</p></article>
        <article className="ql-card"><h2>Ghi nhận chi phí</h2><p>Ghi chi phí sửa chữa phục vụ bước đối soát hoàn cọc.</p></article>
      </div>
    </section>
  );
}

function Rooms() {
  return (
    <section className="ql-room-grid">
      {rooms.map((room) => (
        <article className="ql-room-card" key={room.id}>
          <Status tone={room.tone}>{room.status}</Status>
          <h2>Phòng {room.id}</h2>
          <p>{room.note}</p>
          <div><span>Loại phòng<strong>{room.type}</strong></span><span>Mã phòng<strong>{room.id}</strong></span></div>
          <Button primary>Xem tài sản</Button>
        </article>
      ))}
    </section>
  );
}

function Assets() {
  return (
    <article className="ql-table-card">
      <div className="ql-table-head"><div><h2>Danh sách tài sản cần theo dõi</h2><p>Dữ liệu tài sản xuất hiện trong bàn giao và kiểm tra trả phòng.</p></div><Button primary>Thêm tài sản</Button></div>
      <div className="ql-table-wrap">
        <table>
          <thead><tr><th>Mã tài sản</th><th>Tên tài sản</th><th>Phòng</th><th>Tình trạng</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={`${asset.id}-${asset.room}-${index}`}>
                <td><strong>{asset.id}</strong></td>
                <td>{asset.name}</td>
                <td><span className="ql-room-pill">{asset.room}</span></td>
                <td><Status tone={asset.tone}>{asset.status}</Status></td>
                <td>{asset.note}</td>
                <td><Button>Cập nhật</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function FilterBar({ search, labels }) {
  return (
    <div className="ql-filters">
      <label>Tìm kiếm<input placeholder={search} /></label>
      {labels.map((label) => (
        <label key={label}>{label}<select><option>Tất cả</option><option>Đang xử lý</option><option>Hoàn tất</option></select></label>
      ))}
    </div>
  );
}
