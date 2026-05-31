import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import { nhanPhongApi } from '../nhanPhong/nhanPhong.api.js';
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

function Button({ primary = false, type = 'button', onClick, disabled = false, children }) {
  return <button className={`ql-btn ${primary ? 'primary' : 'secondary'}`} type={type} onClick={onClick} disabled={disabled}>{children}</button>;
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery('');
  }, [activeView]);

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
                <input
                  type="search"
                  placeholder="Tìm hóa đơn, phiếu cọc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
            </div>}
          </section>

          {activeView === 'account' && <EmployeeAccountView user={user} positionLabel="Nhân viên kế toán" />}
          {activeView === 'overview' && <Overview />}
          {activeView === 'deposits' && <DepositPayments searchQuery={searchQuery} />}
          {activeView === 'movein' && <MoveinCollections searchQuery={searchQuery} />}
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

function DepositPayments({ searchQuery }) {
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

  const filteredList = useMemo(() => {
    if (!searchQuery?.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(row => 
      (row.maDangKy && row.maDangKy.toLowerCase().includes(q)) ||
      (row.hoTen && row.hoTen.toLowerCase().includes(q)) ||
      (row.maPhong && row.maPhong.toLowerCase().includes(q)) ||
      (row.maGiuong && row.maGiuong.toLowerCase().includes(q)) ||
      (row.soDienThoai && row.soDienThoai.toLowerCase().includes(q))
    );
  }, [list, searchQuery]);

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
        ) : filteredList.length === 0 ? (
          <div className="kt-empty-state">
            <PortalIcon name="deposit" />
            <p>{searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Không có hồ sơ nào đang chờ lập phiếu.'}</p>
            <small>{searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Hồ sơ được quản lý chấp nhận sẽ xuất hiện tại đây.'}</small>
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
                {filteredList.map((row) => (
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

function MoveinCollections({ searchQuery }) {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null); // row from list
  const [form, setForm] = useState({ soTienThucNop: '', phuongThucTT: 'Chuyển khoản' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null); // hóa đơn vừa tạo
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    setLoading(true);
    nhanPhongApi.getDanhSachChoThuDauKy()
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredList = useMemo(() => {
    if (!searchQuery?.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(row => 
      (row.maHopDong && row.maHopDong.toLowerCase().includes(q)) ||
      (row.hoTen && row.hoTen.toLowerCase().includes(q)) ||
      (row.maPhong && row.maPhong.toLowerCase().includes(q)) ||
      (row.maGiuong && row.maGiuong.toLowerCase().includes(q)) ||
      (row.soDienThoai && row.soDienThoai.toLowerCase().includes(q))
    );
  }, [list, searchQuery]);

  function calcBilling(row) {
    if (!row) return { soThang: 1, tienThue: 0, tongDichVu: 0, tongTien: 0 };
    const soThang = row.soThangKyDau || 1;
    const tienThue = (row.giaThue || 0) * soThang;
    const tongDichVu = (row.tongDonGiaDichVuThang || 0) * soThang;
    return { soThang, tienThue, tongDichVu, tongTien: tienThue + tongDichVu };
  }

  function handleSelectContract(row) {
    const { tongTien } = calcBilling(row);
    setSelectedContract(row);
    setForm({ soTienThucNop: String(tongTien), phuongThucTT: 'Chuyển khoản' });
    setError('');
    setReceipt(null);
  }

  function handleCancel(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }
    setConfirmCancel(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedContract) return;
    const soTien = Number(form.soTienThucNop);
    if (soTien === null || isNaN(soTien) || soTien <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data } = await nhanPhongApi.ghiNhanThuDauKy({
        maHopDong: selectedContract.maHopDong,
        soTienThucNop: soTien,
        phuongThucTT: form.phuongThucTT,
      });
      setReceipt(data);
      // Reload list - remove the contract that now has Đã TT
      const { data: fresh } = await nhanPhongApi.getDanhSachChoThuDauKy();
      setList(Array.isArray(fresh) ? fresh : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  const billing = calcBilling(selectedContract);
  const paid = Number(form.soTienThucNop) || 0;
  const isSufficient = paid >= billing.tongTien && billing.tongTien > 0;

  // Parse services list from JSON string returned by procedure
  let activeServices = [];
  if (selectedContract && selectedContract.danhSachDichVuStr) {
    try {
      activeServices = JSON.parse(selectedContract.danhSachDichVuStr);
    } catch (e) {
      console.error("Failed to parse services list:", e);
    }
  }

  // ── Receipt overlay (after success) ──────────────────────────────────────
  if (receipt) {
    return (
      <section className="ql-stack">
        <article className="ql-card" style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center', padding: '40px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: '#eaf7f5', border: '1px solid rgba(47,183,164,.25)', margin: '0 auto 1.25rem',
              display: 'grid', placeItems: 'center', color: 'var(--ql-green-dark, #16796f)'
            }}>
              <PortalIcon name="contract" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ql-heading, #1a1a1a)', marginBottom: '0.35rem' }}>
              Ghi nhận khoản thu thành công!
            </h2>
            <p style={{ color: 'var(--ql-muted, #555)', fontSize: '0.92rem' }}>
              Hóa đơn kỳ đầu đã được lưu và cập nhật trạng thái.{' '}
              <Status tone={receipt.trangThai === 'Đã TT' ? 'good' : 'wait'}>{receipt.trangThai}</Status>
            </p>
          </div>

          <div className="ql-modal-info" style={{ textAlign: 'left', marginBottom: '1.5rem', background: '#f8f9fa', padding: '20px', borderRadius: '16px', border: '1px solid var(--ql-line, #e9ecef)' }}>
            <div><span>Mã hóa đơn</span><strong>{receipt.maHoaDon}</strong></div>
            <div><span>Hợp đồng</span><strong>{receipt.maHopDong}</strong></div>
            <div><span>Tổng tiền</span><strong className="kt-amount">{formatVND(receipt.tongTien)}</strong></div>
            <div><span>Phương thức</span><strong>{receipt.phuongThucThanhToan}</strong></div>
            <div><span>Ngày lập</span><strong>{receipt.ngayLap ? new Date(receipt.ngayLap).toLocaleDateString('vi-VN') : '—'}</strong></div>
            {receipt.trangThai === 'Đã TT' && (
              <div style={{ gridColumn: '1/-1', background: '#eaf7f5', border: '1px solid rgba(47,183,164,.2)', borderRadius: 12, padding: '1rem', color: '#16796f', fontSize: '0.875rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <div>Hóa đơn đủ tiền — Quản lý có thể tiến hành <strong>lập biên bản bàn giao phòng</strong>.</div>
              </div>
            )}
            {receipt.trangThai !== 'Đã TT' && (
              <div style={{ gridColumn: '1/-1', background: '#fff6df', border: '1px solid rgba(245,159,0,.22)', borderRadius: 12, padding: '1rem', color: '#9c5900', fontSize: '0.875rem', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠</span>
                <div>Chưa đủ tiền — Quyền bàn giao phòng bị <strong>khóa</strong> cho đến khi bổ sung đầy đủ.</div>
              </div>
            )}
          </div>

          <div className="ql-modal-actions">
            <Button primary onClick={() => { setReceipt(null); setSelectedContract(null); }}>
              Quay về danh sách
            </Button>
          </div>
        </article>
      </section>
    );
  }

  // ── Payment form (after selecting a contract) ─────────────────────────────
  if (selectedContract) {
    return (
      <section className="ql-stack">
        {/* Back breadcrumb */}
        <button
          type="button"
          onClick={handleCancel}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ql-green-dark, #16796f)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Quay lại danh sách
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.75rem', alignItems: 'start' }}>

          {/* LEFT — form */}
          <article className="ql-card">
            <div className="ql-card-head" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2>Hóa đơn và Quyết toán thu đầu kỳ</h2>
                <p>Hợp đồng <strong>{selectedContract.maHopDong}</strong> · {selectedContract.hoTen}</p>
              </div>
            </div>

            {/* Contract info row */}
            <div className="ql-modal-info" style={{ marginBottom: '1.25rem' }}>
              <div><span>Mã Hợp Đồng</span><strong>{selectedContract.maHopDong}</strong></div>
              <div><span>Khách hàng chính</span><strong>{selectedContract.hoTen}</strong></div>
              <div>
                <span>Phòng / Giường</span>
                <strong>
                  <span className="ql-room-pill">
                    {selectedContract.maGiuong
                      ? `${selectedContract.maPhong} · ${selectedContract.maGiuong}`
                      : (selectedContract.maPhong || '—')}
                  </span>
                </strong>
              </div>
              <div><span>Kỳ thanh toán</span><strong>{selectedContract.kyThanhToan}</strong></div>
            </div>

            {/* Billing preview */}
            <div style={{ border: '1px solid var(--ql-line, #e9ecef)', borderRadius: 18, padding: '1.5rem', background: '#f9fafb', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', marginBottom: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--ql-line, #e9ecef)' }}>
                Chi tiết hóa đơn kỳ đầu (Số tháng tính: <span style={{ color: 'var(--ql-green-dark, #16796f)', fontWeight: 800 }}>{billing.soThang}</span> tháng)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--ql-line, #e9ecef)' }}>
                    <td style={{ padding: '8px 0', fontSize: 14 }}><strong>Tiền thuê phòng</strong></td>
                    <td style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>× {billing.soThang} tháng</td>
                    <td style={{ fontSize: 13, color: '#555' }}>{formatVND(selectedContract.giaThue)}/tháng</td>
                    <td style={{ fontWeight: 700, textAlign: 'right', fontSize: 14 }}>{formatVND(billing.tienThue)}</td>
                  </tr>

                  {activeServices.length > 0 ? (
                    activeServices.map((svc, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--ql-line, #e9ecef)' }}>
                        <td style={{ padding: '8px 0', fontSize: 14 }}><strong>Dịch vụ: {svc.name}</strong></td>
                        <td style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>× {billing.soThang} tháng</td>
                        <td style={{ fontSize: 13, color: '#555' }}>{formatVND(svc.price)}/tháng</td>
                        <td style={{ fontWeight: 700, textAlign: 'right', fontSize: 14 }}>{formatVND(svc.price * billing.soThang)}</td>
                      </tr>
                    ))
                  ) : billing.tongDichVu > 0 ? (
                    <tr style={{ borderBottom: '1px solid var(--ql-line, #e9ecef)' }}>
                      <td style={{ padding: '8px 0', fontSize: 14 }}><strong>Tổng phí dịch vụ</strong></td>
                      <td style={{ fontSize: 13, color: '#555', textAlign: 'center' }}>× {billing.soThang} tháng</td>
                      <td style={{ fontSize: 13, color: '#555' }}>{formatVND(selectedContract.tongDonGiaDichVuThang)}/tháng</td>
                      <td style={{ fontWeight: 700, textAlign: 'right', fontSize: 14 }}>{formatVND(billing.tongDichVu)}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <div style={{ borderTop: '2px solid var(--ql-line, #e9ecef)', paddingTop: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontWeight: 700, color: '#555', fontSize: '15px' }}>TỔNG TIỀN PHẢI NỘP</span>
                <strong style={{ fontSize: '1.45rem', color: '#bf4c32', fontWeight: 800, letterSpacing: '-0.02em' }}>{formatVND(billing.tongTien)}</strong>
              </div>
            </div>

            {/* Payment form */}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
              <div className="ql-two-col" style={{ gap: '1.25rem' }}>
                <div className="kt-form-group">
                  <label>Số tiền khách thực nộp (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    className="kt-input"
                    type="number"
                    min="1"
                    required
                    placeholder="Nhập số tiền thực tế..."
                    value={form.soTienThucNop}
                    onChange={(e) => setForm((f) => ({ ...f, soTienThucNop: e.target.value }))}
                  />
                </div>
                <div className="kt-form-group">
                  <label>Phương thức thanh toán <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    className="kt-input"
                    value={form.phuongThucTT}
                    onChange={(e) => setForm((f) => ({ ...f, phuongThucTT: e.target.value }))}
                  >
                    <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                  </select>
                </div>
              </div>

              {/* Sufficiency alert (matching mockup alert-warning and alert-success) */}
              {form.soTienThucNop && (
                <div style={{
                  borderRadius: 18, padding: '18px 24px',
                  display: 'flex', gap: 14, alignItems: 'flex-start', fontSize: '14.5px',
                  lineHeight: '1.5',
                  background: isSufficient ? '#eaf7f5' : '#fff6df',
                  border: isSufficient ? '1px solid rgba(47,183,164,.2)' : '1px solid rgba(245,159,0,.22)',
                  color: isSufficient ? 'var(--ql-green-dark, #16796f)' : '#9c5900',
                }}>
                  {isSufficient ? (
                    <>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="m22 4-10 10.01-3-3" />
                      </svg>
                      <div>
                        <strong>Đã thu đủ tiền!</strong><br />
                        Hóa đơn sẽ được lưu ở trạng thái <strong>[Đã TT]</strong>.
                        Cấp phép <strong>MỞ KHÓA</strong> bàn giao phòng ở màn hình của Quản lý.
                      </div>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                      </svg>
                      <div>
                        <strong>Số tiền đóng chưa đủ!</strong> Thừa thiếu: -{formatVND(billing.tongTien - paid)}<br />
                        Hóa đơn sẽ được ghi nhận ở trạng thái <strong>[Chưa TT]</strong>.
                        Hệ thống sẽ <strong>KHÓA</strong>, không cho phép Quản lý bàn giao phòng đối với hợp đồng này.
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && <p className="ql-modal-error">{error}</p>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'center' }}>
                <Button type="button" onClick={handleCancel}>Hủy thao tác</Button>
                <Button primary type="submit" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Xác nhận nộp tiền'}
                </Button>
              </div>
            </form>
          </article>

          {/* RIGHT — business rules panel */}
          <article className="ql-card" style={{ background: '#f9fafb', border: '1px solid var(--ql-line, #e9ecef)', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ql-heading, #1a1a1a)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ql-green-dark, #16796f)" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 9v4" />
                <path d="M12 15h.01" />
              </svg>
              Quy chế thu tiền kỳ đầu
            </h3>
            <ul style={{ fontSize: '13px', color: 'var(--ql-muted, #555)', paddingLeft: '16px', display: 'grid', gap: '8px', lineHeight: '1.5' }}>
              <li>Tiền phòng được nhân theo chu kỳ thanh toán hợp đồng (1 tháng hoặc 3 tháng).</li>
              <li>Các dịch vụ đi kèm cũng tính cào bằng theo tháng nhân với chu kỳ thanh toán kỳ đầu.</li>
              <li><strong>Dịch vụ Điện &amp; Nước không thu kỳ đầu</strong>, sẽ được ghi nhận chỉ số và thu riêng hàng tháng dựa trên lượng tiêu thụ thực tế.</li>
              <li>Nếu nộp đủ: Mở khóa quyền <strong>bàn giao phòng</strong> ở màn hình Quản lý.</li>
              <li>Nếu nộp thiếu: Trạng thái hóa đơn là <strong>Chưa TT</strong> và <strong>KHÓA</strong> quyền bàn giao phòng cho đến khi bổ sung đủ tiền.</li>
            </ul>
          </article>
        </div>

        {confirmCancel && (
          <div className="ql-modal-overlay" style={{ zIndex: 1000 }} onClick={() => setConfirmCancel(false)}>
            <div className="ql-modal" style={{ maxWidth: 420, padding: '28px', borderRadius: 24, textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button className="kt-modal-close" type="button" onClick={() => setConfirmCancel(false)} aria-label="Đóng">&#x2715;</button>
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: '#fff1f1', border: '1px solid rgba(239, 68, 68, 0.25)', margin: '0 auto 16px',
                display: 'grid', placeItems: 'center', color: '#ef4444'
              }}>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ql-heading, #1a1a1a)', marginBottom: '8px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
                Hủy bỏ thao tác?
              </h3>
              <p style={{ color: 'var(--ql-muted, #555)', fontSize: '0.92rem', marginBottom: '22px', lineHeight: 1.55 }}>
                Mọi dữ liệu thu tiền đang nhập sẽ bị hủy bỏ. Bạn có chắc chắn muốn quay lại danh sách hợp đồng?
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Button onClick={() => setConfirmCancel(false)}>Quay lại</Button>
                <Button primary type="button" onClick={() => {
                  setConfirmCancel(false);
                  setSelectedContract(null);
                  setReceipt(null);
                  setError('');
                }} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)' }}>
                  Xác nhận hủy
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ── Contract list (default view) ──────────────────────────────────────────
  return (
    <section className="ql-stack">
      <article className="ql-table-card">
        <div className="ql-table-head">
          <div>
            <h2>Hợp đồng chờ ghi nhận thu đầu kỳ</h2>
            <p>Hợp đồng Hiệu lực chưa có hóa đơn kỳ đầu thanh toán đầy đủ. Chọn để thực hiện ghi nhận thu.</p>
          </div>
        </div>
        {loading ? (
          <div className="kt-empty-state">
            <PortalIcon name="payment" />
            <p>Đang tải danh sách...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="kt-empty-state">
            <PortalIcon name="contract" />
            <p>{searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Không có hợp đồng nào chờ thu tiền kỳ đầu.'}</p>
            <small>{searchQuery ? 'Thử tìm kiếm với từ khóa khác.' : 'Các hợp đồng Hiệu lực chưa ghi nhận thu sẽ xuất hiện tại đây.'}</small>
          </div>
        ) : (
          <div className="ql-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Khách hàng</th>
                  <th>Phòng / Giường</th>
                  <th>Ngày bắt đầu</th>
                  <th>Giá thuê / tháng</th>
                  <th>Kỳ thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row) => (
                  <tr key={row.maHopDong}>
                    <td><strong>{row.maHopDong}</strong></td>
                    <td>
                      <div className="ql-person">
                        <span>{initials(row.hoTen)}</span>
                        <div><strong>{row.hoTen}</strong><small>{row.soDienThoai}</small></div>
                      </div>
                    </td>
                    <td>
                      <span className="ql-room-pill">
                        {row.maGiuong ? `${row.maPhong} · ${row.maGiuong}` : (row.maPhong || '—')}
                      </span>
                    </td>
                    <td>{row.ngayBatDau ? new Date(row.ngayBatDau).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="kt-amount">{formatVND(row.giaThue)}</td>
                    <td>{row.kyThanhToan} ({row.soThangKyDau || 1} tháng)</td>
                    <td>
                      <Button primary onClick={() => handleSelectContract(row)}>Ghi nhận thu</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
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
