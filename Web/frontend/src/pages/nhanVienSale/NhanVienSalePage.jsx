import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { EmployeeAccountMenu, EmployeeAccountView } from '../../components/common/EmployeeAccount.jsx';
import PortalIcon from '../../components/common/PortalIcon.jsx';
import './nhanVienSale.css';
import { datCocApi } from '../datCoc/datCoc.api.js';
import { nhanPhongApi } from '../nhanPhong/nhanPhong.api.js';

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
  const [handoverList, setHandoverList] = useState([]);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Clear search on active view switch
  useEffect(() => {
    setSearchQuery('');
  }, [activeView]);

  const filteredHandoverList = useMemo(() => {
    if (!searchQuery.trim()) return handoverList;
    const q = searchQuery.toLowerCase();
    return handoverList.filter(row => 
      (row.maPhieuDatCoc && row.maPhieuDatCoc.toLowerCase().includes(q)) ||
      (row.hoTen && row.hoTen.toLowerCase().includes(q)) ||
      (row.maPhong && row.maPhong.toLowerCase().includes(q)) ||
      (row.maGiuong && row.maGiuong.toLowerCase().includes(q))
    );
  }, [handoverList, searchQuery]);

  const filteredDepositList = useMemo(() => {
    if (!searchQuery.trim()) return depositList;
    const q = searchQuery.toLowerCase();
    return depositList.filter(row => 
      (row.maDangKy && row.maDangKy.toLowerCase().includes(q)) ||
      (row.hoTen && row.hoTen.toLowerCase().includes(q)) ||
      (row.maPhong && row.maPhong.toLowerCase().includes(q)) ||
      (row.maGiuong && row.maGiuong.toLowerCase().includes(q)) ||
      (row.maPhieuDatCoc && row.maPhieuDatCoc.toLowerCase().includes(q))
    );
  }, [depositList, searchQuery]);

  // States cho Lập hợp đồng thuê & Lưu trú
  const [selectedDepositForContract, setSelectedDepositForContract] = useState(null);
  const [contractForm, setContractForm] = useState({
    ngayBatDau: new Date().toISOString().split('T')[0],
    ngayKetThucDuKien: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    kyThanhToan: 'Hàng tháng',
    tienThue: '',
    tienCoc: '',
    cccd: '',
    quocTich: 'Việt Nam',
    danhSachDichVu: ['DV0001', 'DV0002'], // check sẵn Điện & Nước
    camKet: false,
    danhSachThanhVien: []
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const depositStats = useMemo(() => ({
    choXacNhan: depositList.filter((r) => r.trangThaiDangKy === 'Chờ xác nhận cọc').length,
    daTT: depositList.filter((r) => r.trangThaiThanhToan === 'Đã TT').length,
    daLapHD: depositList.filter((r) => r.trangThaiCoc === 'Đã lập HĐ').length,
  }), [depositList]);

  useEffect(() => {
    if (activeView === 'deposit') {
      setDepositLoading(true);
      datCocApi.getAll()
        .then(({ data }) => setDepositList(Array.isArray(data) ? data : []))
        .catch(() => setDepositList([]))
        .finally(() => setDepositLoading(false));
    } else if (activeView === 'handover') {
      setHandoverLoading(true);
      nhanPhongApi.getDanhSachChoNhanPhong()
        .then(({ data }) => setHandoverList(Array.isArray(data) ? data : []))
        .catch(() => setHandoverList([]))
        .finally(() => setHandoverLoading(false));
    }
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

  // Mở Form lập hợp đồng thuê cho 1 phiếu cọc
  function handleOpenContractForm(deposit) {
    const defaultEnd = new Date();
    defaultEnd.setMonth(defaultEnd.getMonth() + 6);

    const isNguyenPhong = deposit.hinhThucThue === 'Nguyên phòng' || deposit.hinhThucThue === 'Nguyên căn';
    
    // Nếu thuê nguyên phòng, tự động thêm khách đặt cọc chính làm thành viên đầu tiên
    const defaultMembers = [];
    if (isNguyenPhong) {
      defaultMembers.push({
        hoTen: deposit.hoTen || '',
        ngaySinh: deposit.ngaySinh ? new Date(deposit.ngaySinh).toISOString().split('T')[0] : '',
        gioiTinh: deposit.gioiTinh || 'Nam',
        cccd: deposit.cccd || '',
        sdt: deposit.soDienThoai || '',
        email: deposit.email || '',
        quocTich: deposit.quocTich || 'Việt Nam',
        isPrimary: true // Đánh dấu là thành viên chính đứng tên cọc
      });
    }

    setSelectedDepositForContract(deposit);
    setContractForm({
      ngayBatDau: new Date().toISOString().split('T')[0],
      ngayKetThucDuKien: defaultEnd.toISOString().split('T')[0],
      kyThanhToan: 'Hàng tháng',
      tienThue: deposit.giaThue ? deposit.giaThue.toString() : (deposit.soTienCoc ? (Number(deposit.soTienCoc) / 2).toString() : ''),
      tienCoc: deposit.soTienCoc ? deposit.soTienCoc.toString() : '',
      cccd: deposit.cccd || '',
      quocTich: deposit.quocTich || 'Việt Nam',
      danhSachDichVu: ['DV0001', 'DV0002'], // check sẵn Điện & Nước bắt buộc
      camKet: false,
      danhSachThanhVien: defaultMembers
    });
    setErrorMessage('');
    setSuccessMessage('');
  }

  // Xử lý nộp Form Lập hợp đồng
  async function handleSubmitContract(e) {
    e.preventDefault();
    if (!selectedDepositForContract) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Nếu đi đơn, cập nhật cư trú chính cho khách hàng trước
      if (selectedDepositForContract.hinhThucThue !== 'Nguyên phòng' && selectedDepositForContract.hinhThucThue !== 'Nguyên căn') {
        await nhanPhongApi.capNhatThongTinCuTru({
          khachHangId: selectedDepositForContract.maKhachHang || user.maNguoiDung,
          cccd: contractForm.cccd,
          quocTich: contractForm.quocTich
        });
      }

      // 2. Tạo Hợp đồng thuê
      const isNguyenPhong = selectedDepositForContract.hinhThucThue === 'Nguyên phòng' || selectedDepositForContract.hinhThucThue === 'Nguyên căn';
      const memberList = isNguyenPhong ? contractForm.danhSachThanhVien : null; 

      await nhanPhongApi.lapHopDong({
        khachHangId: selectedDepositForContract.maKhachHang || user.maNguoiDung,
        phongGiuongId: selectedDepositForContract.maGiuong 
          ? `${selectedDepositForContract.maPhong} · ${selectedDepositForContract.maGiuong}`
          : selectedDepositForContract.maPhong,
        ngayBatDau: contractForm.ngayBatDau,
        ngayKetThucDuKien: contractForm.ngayKetThucDuKien,
        tienThue: Number(contractForm.tienThue),
        tienCoc: Number(contractForm.tienCoc),
        kyThanhToan: contractForm.kyThanhToan,
        danhSachThanhVien: memberList,
        danhSachDichVu: contractForm.danhSachDichVu
      });

      setSuccessMessage('Lập hợp đồng thuê phòng thành công!');
      setTimeout(() => {
        setSelectedDepositForContract(null);
        // Load lại danh sách
        nhanPhongApi.getDanhSachChoNhanPhong()
          .then(({ data }) => setHandoverList(Array.isArray(data) ? data : []))
          .catch(() => {});
      }, 1500);

    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lập hợp đồng');
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
                <input
                  type="search"
                  placeholder="Tìm khách, phòng, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                ) : filteredDepositList.length === 0 ? (
                  <div className="sale-empty">
                    {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có hồ sơ nào ở giai đoạn đặt cọc.'}
                  </div>
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
                        {filteredDepositList.map((row) => {
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
            <section className="sale-stack">
              <div className="sale-two-col">
                <article className="sale-table-card">
                  <div className="sale-table-head">
                    <div>
                      <h2>Danh sách cọc chờ nhận phòng</h2>
                      <p>Khách hàng đã thanh toán cọc và đủ điều kiện lập hợp đồng thuê.</p>
                    </div>
                  </div>
                  {handoverLoading ? (
                    <div className="sale-empty">Đang tải...</div>
                  ) : filteredHandoverList.length === 0 ? (
                    <div className="sale-empty">
                      {searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Không có cọc chờ nhận phòng.'}
                    </div>
                  ) : (
                    <div className="sale-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Phiếu cọc</th><th>Khách hàng</th><th>Phòng / Giường</th>
                            <th>Tiền cọc</th><th>Hạn nhận phòng</th><th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHandoverList.map((row) => (
                            <tr key={row.maPhieuDatCoc}>
                              <td><strong>{row.maPhieuDatCoc}</strong></td>
                              <td>{row.hoTen}</td>
                              <td>
                                <span className="sale-room-pill">
                                  {row.maGiuong ? `${row.maPhong} · ${row.maGiuong}` : (row.maPhong || '—')}
                                </span>
                              </td>
                              <td>{row.soTienDatCoc?.toLocaleString('vi-VN')} VNĐ</td>
                              <td>{row.ngayNhanPhongDuKien ? new Date(row.ngayNhanPhongDuKien).toLocaleDateString('vi-VN') : '—'}</td>
                              <td>
                                <StaticButton primary onClick={() => handleOpenContractForm(row)}>
                                  Lập hợp đồng
                                </StaticButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>

                <article className="sale-card">
                  <div className="sale-card-head">
                    <div>
                      <h2>Checklist bàn giao</h2>
                      <p>Tiến độ phối hợp trước khi ở.</p>
                    </div>
                  </div>
                  <div className="sale-checklist">
                    <div><PortalIcon name="deposit" /><span><strong>Xác nhận cọc</strong><small>Kiểm tra tiền cọc đã vào</small></span><Status tone="good">OK</Status></div>
                    <div><PortalIcon name="profile" /><span><strong>Thông tin lưu trú</strong><small>Thông tin ThanhVienHopDong</small></span><Status tone="neutral">Yêu cầu nhập</Status></div>
                    <div><PortalIcon name="contract" /><span><strong>Hợp đồng thuê</strong><small>Ký kết và snapshot giá dịch vụ</small></span><Status tone="wait">Chờ lập</Status></div>
                  </div>
                </article>
              </div>

              {selectedDepositForContract && (
                <div className="sale-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedDepositForContract(null); }}>
                  <div className="sale-modal" style={{ maxWidth: '1040px', width: '96%', padding: '1.75rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lập Hợp Đồng Thuê & Lưu Trú</h3>
                      <button 
                        type="button" 
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        onClick={() => setSelectedDepositForContract(null)}
                      >
                        &times;
                      </button>
                    </div>

                    {errorMessage && <div className="sale-status wait" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px' }}>{errorMessage}</div>}
                    {successMessage && <div className="sale-status good" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px' }}>{successMessage}</div>}

                    <form onSubmit={handleSubmitContract} className="sale-stack" style={{ maxHeight: '78vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '0.5rem', gap: '1.25rem' }}>
                      
                      {/* Header Info Card */}
                      <div style={{ 
                        background: '#f4faf8', 
                        border: '1px dashed #cdece4', 
                        borderRadius: '12px', 
                        padding: '1.25rem', 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: '1rem', 
                        fontSize: '0.9rem' 
                      }}>
                        <div>
                          <span style={{ display: 'block', color: '#578f7e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Mã phiếu cọc</span>
                          <strong style={{ fontSize: '1rem', color: '#1f443b' }}>{selectedDepositForContract.maPhieuDatCoc}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#578f7e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Khách hàng</span>
                          <strong style={{ fontSize: '1rem', color: '#1f443b' }}>{selectedDepositForContract.hoTen}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#578f7e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phòng / Giường</span>
                          <strong style={{ fontSize: '1rem', color: '#1f443b' }}>
                            {selectedDepositForContract.maPhong} - Giường {selectedDepositForContract.maGiuong || '—'} ({selectedDepositForContract.tenPhong || 'Phòng Homestay'})
                          </strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: '#578f7e', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Hình thức thuê</span>
                          <strong style={{ fontSize: '1rem', color: '#1f443b' }}>
                            {selectedDepositForContract.hinhThucThue === 'Nguyên phòng' ? 'Nguyên căn' : 'Ghép giường'}
                          </strong>
                        </div>
                      </div>

                      {/* Date & Pricing Row */}
                      <div className="sale-two-col" style={{ gap: '1.25rem' }}>
                        <label style={{ fontWeight: 600 }}>
                          Ngày bắt đầu hợp đồng *
                          <input 
                            type="date" 
                            required
                            value={contractForm.ngayBatDau} 
                            onChange={(e) => setContractForm({ ...contractForm, ngayBatDau: e.target.value })} 
                            style={{ marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #dcdcdc' }}
                          />
                        </label>
                        <label style={{ fontWeight: 600 }}>
                          Ngày kết thúc hợp đồng *
                          <input 
                            type="date" 
                            required
                            value={contractForm.ngayKetThucDuKien} 
                            onChange={(e) => setContractForm({ ...contractForm, ngayKetThucDuKien: e.target.value })} 
                            style={{ marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #dcdcdc' }}
                          />
                        </label>
                      </div>

                      <div className="sale-two-col" style={{ gap: '1.25rem' }}>
                        <label style={{ fontWeight: 600 }}>
                          Kỳ hạn thanh toán *
                          <select 
                            value={contractForm.kyThanhToan} 
                            onChange={(e) => setContractForm({ ...contractForm, kyThanhToan: e.target.value })}
                            style={{ marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #dcdcdc' }}
                          >
                            <option value="Hàng tháng">Hàng tháng (1 tháng/kỳ)</option>
                            <option value="Hàng quý">Hàng quý (3 tháng/kỳ)</option>
                          </select>
                        </label>
                        <label style={{ fontWeight: 600 }}>
                          Đơn giá thuê (VNĐ/tháng) *
                          <input 
                            type="number" 
                            required
                            disabled
                            value={contractForm.tienThue} 
                            style={{ marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #dcdcdc', background: '#f5f5f5', color: '#555', cursor: 'not-allowed' }}
                          />
                        </label>
                      </div>

                      {/* Phân loại hình thức lưu trú */}
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Phân loại hình thức lưu trú</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <input 
                            type="radio" 
                            checked 
                            readOnly 
                            id="residencyType"
                          />
                          <label htmlFor="residencyType" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>
                            {selectedDepositForContract.hinhThucThue === 'Nguyên phòng' 
                              ? 'Thuê nhóm (Có thêm thành viên ở cùng)' 
                              : 'Đi đơn (Chi mình khách hàng đứng tên cọc)'
                            }
                          </label>
                        </div>
                      </div>

                      {/* Dynamic Residents Form */}
                      {selectedDepositForContract.hinhThucThue === 'Nguyên phòng' ? (
                        /* THUÊ NHÓM */
                        <div className="sale-stack" style={{ gap: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Danh sách thành viên hợp đồng</strong>
                            <button 
                              type="button" 
                              style={{ 
                                background: '#f4faf8', 
                                border: '1px solid #578f7e', 
                                color: '#1f443b', 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '6px', 
                                cursor: 'pointer', 
                                fontSize: '0.85rem',
                                fontWeight: 600
                              }}
                              onClick={() => {
                                const newMember = { hoTen: '', ngaySinh: '', gioiTinh: 'Nam', cccd: '', sdt: '', email: '', quocTich: 'Việt Nam', isPrimary: false };
                                setContractForm({
                                  ...contractForm,
                                  danhSachThanhVien: [...contractForm.danhSachThanhVien, newMember]
                                });
                              }}
                            >
                              + Thêm thành viên
                            </button>
                          </div>

                          {contractForm.danhSachThanhVien.map((member, index) => (
                            <div key={index} style={{ 
                              border: member.isPrimary ? '1px solid #cdece4' : '1px dashed var(--border-color)', 
                              background: member.isPrimary ? '#fafdfc' : 'none',
                              padding: '1rem', 
                              borderRadius: '10px', 
                              position: 'relative' 
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <strong style={{ color: member.isPrimary ? '#1f443b' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  Thành viên #{index + 1} {member.isPrimary && <span style={{ background: '#cdece4', color: '#1f443b', fontSize: '0.7 stamp', padding: '0.15rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 600 }}>Khách đứng tên cọc (Chính)</span>}
                                </strong>
                                {!member.isPrimary && (
                                  <button 
                                    type="button" 
                                    style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                                    onClick={() => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated.splice(index, 1);
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }}
                                  >
                                    Xóa thành viên
                                  </button>
                                )}
                              </div>
                              
                              {/* Unified 3-column grid for all 7 member fields */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                {/* Row 1: Họ và tên (span 2) | Ngày sinh */}
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
                                  Họ và tên *
                                  <input 
                                    type="text" 
                                    required 
                                    disabled={member.isPrimary}
                                    value={member.hoTen} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', background: member.isPrimary ? '#f0f0f0' : '#fff', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].hoTen = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }} 
                                  />
                                </label>
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                  Ngày sinh *
                                  <input 
                                    type="date" 
                                    required 
                                    value={member.ngaySinh} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].ngaySinh = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }} 
                                  />
                                </label>

                                {/* Row 2: Giới tính | CCCD | SĐT */}
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                  Giới tính *
                                  <select 
                                    value={member.gioiTinh} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', height: '2.25rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].gioiTinh = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }}
                                  >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                  </select>
                                </label>
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                  CCCD / Passport *
                                  <input 
                                    type="text" 
                                    required 
                                    disabled={member.isPrimary && selectedDepositForContract.cccd}
                                    value={member.cccd} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', background: (member.isPrimary && selectedDepositForContract.cccd) ? '#f0f0f0' : '#fff', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].cccd = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }} 
                                  />
                                </label>
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                  Số điện thoại *
                                  <input 
                                    type="text" 
                                    required 
                                    disabled={member.isPrimary}
                                    value={member.sdt} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', background: member.isPrimary ? '#f0f0f0' : '#fff', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].sdt = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }} 
                                  />
                                </label>

                                {/* Row 3: Email (span 2) | Quốc tịch */}
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
                                  Email
                                  <input 
                                    type="email" 
                                    disabled={member.isPrimary}
                                    value={member.email} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', background: member.isPrimary ? '#f0f0f0' : '#fff', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].email = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }} 
                                  />
                                </label>
                                <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', flexDirection: 'column' }}>
                                  Quốc tịch *
                                  <input 
                                    type="text" 
                                    required
                                    disabled={member.isPrimary && selectedDepositForContract.quocTich}
                                    value={member.quocTich} 
                                    style={{ marginTop: '0.25rem', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #ccc', background: (member.isPrimary && selectedDepositForContract.quocTich) ? '#f0f0f0' : '#fff', fontSize: '0.85rem' }}
                                    onChange={(e) => {
                                      const updated = [...contractForm.danhSachThanhVien];
                                      updated[index].quocTich = e.target.value;
                                      setContractForm({ ...contractForm, danhSachThanhVien: updated });
                                    }} 
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* ĐI ĐƠN */
                        <div className="sale-stack" style={{ gap: '0.85rem' }}>
                          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Thông tin cư trú khách chính</strong>
                          </div>
                          <div className="sale-two-col" style={{ gap: '1.25rem' }}>
                            <label style={{ fontWeight: 600 }}>
                              Số CCCD/Passport *
                              <input 
                                type="text" 
                                required
                                placeholder="Nhập số CCCD"
                                value={contractForm.cccd} 
                                onChange={(e) => setContractForm({ ...contractForm, cccd: e.target.value })} 
                                style={{ marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #dcdcdc' }}
                              />
                            </label>
                            <label style={{ fontWeight: 600 }}>
                              Quốc tịch *
                              <input 
                                type="text" 
                                required
                                placeholder="Nhập quốc tịch"
                                value={contractForm.quocTich} 
                                onChange={(e) => setContractForm({ ...contractForm, quocTich: e.target.value })} 
                                style={{ marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #dcdcdc' }}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Dịch vụ áp dụng */}
                      <div>
                        <h4 style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Dịch vụ áp dụng vào hợp đồng (Điện & Nước là bắt buộc) *
                        </h4>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(3, 1fr)', 
                          gap: '0.75rem' 
                        }}>
                          {/* Điện (Bắt buộc) */}
                          <div style={{ 
                            border: '1px solid #cdece4', 
                            background: '#fafdfc',
                            borderRadius: '10px', 
                            padding: '0.85rem 1rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem' 
                          }}>
                            <input type="checkbox" checked disabled style={{ width: '1.1rem', height: '1.1rem', accentColor: '#1f443b' }} />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1f443b' }}>Điện</strong>
                              <span style={{ fontSize: '0.75rem', color: '#578f7e' }}>4.000 VNĐ / kWh (Bắt buộc)</span>
                            </div>
                          </div>

                          {/* Nước (Bắt buộc) */}
                          <div style={{ 
                            border: '1px solid #cdece4', 
                            background: '#fafdfc',
                            borderRadius: '10px', 
                            padding: '0.85rem 1rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem' 
                          }}>
                            <input type="checkbox" checked disabled style={{ width: '1.1rem', height: '1.1rem', accentColor: '#1f443b' }} />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#1f443b' }}>Nước</strong>
                              <span style={{ fontSize: '0.75rem', color: '#578f7e' }}>18.000 VNĐ / m3 (Bắt buộc)</span>
                            </div>
                          </div>

                          {/* Internet / Wifi */}
                          <div 
                            style={{ 
                              border: contractForm.danhSachDichVu.includes('DV0003') ? '1px solid #1f443b' : '1px solid var(--border-color)', 
                              background: contractForm.danhSachDichVu.includes('DV0003') ? '#f4faf8' : 'none',
                              borderRadius: '10px', 
                              padding: '0.85rem 1rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.75rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const list = [...contractForm.danhSachDichVu];
                              const idx = list.indexOf('DV0003');
                              if (idx > -1) list.splice(idx, 1);
                              else list.push('DV0003');
                              setContractForm({ ...contractForm, danhSachDichVu: list });
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={contractForm.danhSachDichVu.includes('DV0003')} 
                              onChange={() => {}} // Handle click on container
                              style={{ width: '1.1rem', height: '1.1rem', accentColor: '#1f443b' }} 
                            />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Internet / Wifi</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>100.000 VNĐ / tháng</span>
                            </div>
                          </div>

                          {/* Gửi xe gắn máy */}
                          <div 
                            style={{ 
                              border: contractForm.danhSachDichVu.includes('DV0004') ? '1px solid #1f443b' : '1px solid var(--border-color)', 
                              background: contractForm.danhSachDichVu.includes('DV0004') ? '#f4faf8' : 'none',
                              borderRadius: '10px', 
                              padding: '0.85rem 1rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.75rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const list = [...contractForm.danhSachDichVu];
                              const idx = list.indexOf('DV0004');
                              if (idx > -1) list.splice(idx, 1);
                              else list.push('DV0004');
                              setContractForm({ ...contractForm, danhSachDichVu: list });
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={contractForm.danhSachDichVu.includes('DV0004')} 
                              onChange={() => {}}
                              style={{ width: '1.1rem', height: '1.1rem', accentColor: '#1f443b' }} 
                            />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Gửi xe gắn máy</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>150.000 VNĐ / xe / tháng</span>
                            </div>
                          </div>

                          {/* Vệ sinh & Rác */}
                          <div 
                            style={{ 
                              border: contractForm.danhSachDichVu.includes('DV0005') ? '1px solid #1f443b' : '1px solid var(--border-color)', 
                              background: contractForm.danhSachDichVu.includes('DV0005') ? '#f4faf8' : 'none',
                              borderRadius: '10px', 
                              padding: '0.85rem 1rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.75rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const list = [...contractForm.danhSachDichVu];
                              const idx = list.indexOf('DV0005');
                              if (idx > -1) list.splice(idx, 1);
                              else list.push('DV0005');
                              setContractForm({ ...contractForm, danhSachDichVu: list });
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={contractForm.danhSachDichVu.includes('DV0005')} 
                              onChange={() => {}}
                              style={{ width: '1.1rem', height: '1.1rem', accentColor: '#1f443b' }} 
                            />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Vệ sinh & Rác</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>80.000 VNĐ / tháng</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cam kết & Chữ ký */}
                      <div>
                        <h4 style={{ margin: '0.5rem 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cam kết và chữ ký</h4>
                        <div style={{ 
                          background: '#f9f9f9', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '10px', 
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => setContractForm({ ...contractForm, camKet: !contractForm.camKet })}
                        >
                          <input 
                            type="checkbox" 
                            checked={contractForm.camKet}
                            onChange={() => {}} // Handled by container onClick
                            style={{ width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: '#c2472d' }}
                          />
                          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#333', userSelect: 'none' }}>
                            Xác nhận khách hàng đã đọc toàn bộ các điều khoản nội quy phòng trọ và trực tiếp ký hợp đồng thuê.
                          </span>
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="sale-modal-actions" style={{ 
                        marginTop: '0.75rem', 
                        borderTop: '1px solid var(--border-color)', 
                        paddingTop: '1rem', 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        gap: '0.75rem' 
                      }}>
                        <button 
                          type="button" 
                          onClick={() => setSelectedDepositForContract(null)}
                          style={{
                            padding: '0.65rem 1.75rem',
                            border: '1px solid #dcdcdc',
                            background: '#ffffff',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#555'
                          }}
                        >
                          Hủy bỏ
                        </button>
                        <button 
                          type="submit" 
                          disabled={!contractForm.camKet || submitting}
                          style={{
                            padding: '0.65rem 2rem',
                            border: 'none',
                            background: contractForm.camKet ? '#c2472d' : '#cccccc',
                            color: '#ffffff',
                            borderRadius: '50px',
                            cursor: contractForm.camKet && !submitting ? 'pointer' : 'not-allowed',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            boxShadow: contractForm.camKet ? '0 4px 6px rgba(194, 71, 45, 0.2)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {submitting ? 'Đang xử lý...' : 'Lập & Ký Hợp Đồng'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
