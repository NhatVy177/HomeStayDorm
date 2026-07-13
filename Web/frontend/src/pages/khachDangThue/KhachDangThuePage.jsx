import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import PortalIcon from '../../components/common/PortalIcon.jsx';
import YeuCauTraPhong from '../traPhong/YeuCauTraPhong.jsx';
import './khachDangThue.css';

const navigationGroups = [
  {
    title: 'Menu chính',
    items: [
      { id: 'tong-quan', icon: 'home', title: 'Tổng quan', note: 'Việc cần chú ý hôm nay' },
      { id: 'hop-dong', icon: 'contract', title: 'Phòng / Hợp đồng', note: 'Thông tin lưu trú hiện tại' }
    ]
  },
  {
    title: 'Hỗ trợ',
    items: [
      { id: 'tra-phong', icon: 'checkout', title: 'Trả phòng', note: 'Lịch trả phòng, quyết toán' }
    ]
  }
];

// UI demo sourced from data.sql records belonging to KH0001 / HD0001.
const seededRental = {
  customerId: 'KH0001',
  contractId: 'HD0001',
  depositId: 'PC0001',
  room: 'Phòng P101',
  bed: 'Giường G01',
  roomType: 'Phòng 2 người',
  branch: 'HomeDorm Quận 1',
  address: '12 Nguyễn Trãi, Quận 1, TP.HCM',
  contractStart: '01/03/2025',
  contractEnd: '28/02/2026',
  signedDate: '01/02/2025',
  rent: '2.200.000đ',
  paymentCycle: 'Hàng tháng',
  contractStatus: 'Hiệu lực',
  handoverId: 'BB0001',
  handoverDate: '01/03/2025'
};

const invoices = [
  { id: 'HDN001', period: '02/2025', dueDate: '28/02/2025', total: '540.000đ', status: 'Chưa TT' },
  { id: 'HDN013', period: '02/2025', dueDate: '28/02/2025', total: '540.000đ', status: 'Chưa TT' }
];

const assets = ['Giường', 'Nệm', 'Tủ cá nhân', 'Chìa khóa/thẻ từ'];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'KH';
}

function Brand() {
  return (
    <span className="rt-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
      </svg>
      <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '19px', fontFamily: '"Montserrat", "Inter", sans-serif', fontWeight: '700', letterSpacing: '0', lineHeight: '1.2' }}>
          <span style={{ color: '#00666d' }}>Homestay</span><span style={{ color: '#a43c12' }}>Dorm</span>
        </span>
        <small style={{ fontSize: '12px', color: '#6f797a', fontWeight: '600' }}>Cổng khách hàng</small>
      </span>
    </span>
  );
}

function Badge({ tone = 'done', children }) {
  return <span className={`rt-badge ${tone}`}>{children}</span>;
}

function PageHead({ eyebrow, title, children, action }) {
  return (
    <div className="rt-page-head">
      <div>
        <span className="rt-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      {action}
    </div>
  );
}

function InfoList({ rows }) {
  return (
    <div className="rt-info-list">
      {rows.map(([label, value]) => (
        <div className="rt-info-row" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function KhachDangThuePage() {
  const { user, dangXuat } = useAuth();
  const [activeTab, setActiveTab] = useState('tong-quan');
  const [accountOpen, setAccountOpen] = useState(false);

  function goTo(tab) {
    setActiveTab(tab);
    setAccountOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="renter-page">
      <header className="rt-header">
        <div className="rt-frame rt-topbar">
          <button className="rt-brand-button" type="button" onClick={() => goTo('tong-quan')}>
            <Brand />
          </button>
          <div className="rt-context">
            <span>Cổng khách hàng</span>
            <strong>Quản lý thuê phòng</strong>
          </div>
          <div className="rt-account">
            <button className="rt-account-btn" type="button" onClick={() => setAccountOpen(!accountOpen)}>
              <span className="rt-avatar">{initials(user?.hoTen)}</span>
              <span className="rt-account-copy">
                <strong>{user?.hoTen || 'Khách hàng'}</strong>
                <span>Đang thuê</span>
              </span>
              <span className="rt-chevron">⌄</span>
            </button>
            {accountOpen && (
              <div className="rt-account-menu">
                <strong>{user?.hoTen}</strong>
                <span>{user?.email || user?.tenDangNhap}</span>
                <button className="account-info" type="button" onClick={() => goTo('tai-khoan')}>Thông tin tài khoản</button>
                <button className="logout" type="button" onClick={dangXuat}>Đăng xuất</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="rt-frame rt-shell">
        <aside className="rt-sidebar" aria-label="Menu khách đang thuê">
          {navigationGroups.map((group) => (
            <div className="rt-side-group" key={group.title}>
              <p className="rt-side-label">{group.title}</p>
              {group.items.map((item) => (
                <button
                  className={`rt-side-link ${activeTab === item.id ? 'active' : ''}`}
                  type="button"
                  key={item.id}
                  onClick={() => goTo(item.id)}
                >
                  <span><PortalIcon name={item.icon} /></span>
                  <div><strong>{item.title}</strong><small>{item.note}</small></div>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="rt-main">
          {activeTab === 'tong-quan' && (
            <section>
              <PageHead
                eyebrow="Tổng quan khách hàng"
                title={`Chào ${user?.hoTen || 'bạn'}, đây là thông tin thuê phòng hiện tại`}
              >
                Giao diện trình bày dữ liệu mẫu của khách hàng KH0001 đang gắn với hợp đồng HD0001 trong dữ liệu hệ thống.
              </PageHead>

              <div className="rt-metrics">
                <article className="rt-card rt-metric">
                  <span><PortalIcon name="home" /></span><div><strong>{seededRental.room}</strong><p>{seededRental.bed} · Đang thuê</p></div>
                </article>
                <article className="rt-card rt-metric">
                  <span><PortalIcon name="contract" /></span><div><strong>{seededRental.contractId}</strong><p>Hợp đồng {seededRental.contractStatus.toLowerCase()}</p></div>
                </article>
                <article className="rt-card rt-metric">
                  <span><PortalIcon name="payment" /></span><div><strong>2 hóa đơn</strong><p>Trạng thái chưa thanh toán</p></div>
                </article>
                <article className="rt-card rt-metric">
                  <span><PortalIcon name="repair" /></span><div><strong>SC0001</strong><p>Yêu cầu đã hoàn tất</p></div>
                </article>
              </div>

              <div className="rt-columns">
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Thông tin lưu trú hiện tại</h3><p>Bản ghi hợp đồng và phòng thuê.</p></div>
                    <Badge>{seededRental.contractStatus}</Badge>
                  </div>
                  <InfoList rows={[
                    ['Phòng / giường', `${seededRental.room} · ${seededRental.bed}`],
                    ['Chi nhánh', seededRental.branch],
                    ['Thời hạn hợp đồng', `${seededRental.contractStart} - ${seededRental.contractEnd}`],
                    ['Tiền thuê', `${seededRental.rent} / tháng`]
                  ]} />
                </article>
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Cần chú ý</h3><p>Các bản ghi gần nhất liên quan đến hợp đồng.</p></div>
                  </div>
                  <div className="rt-notices">
                    <div><i /><p><strong>HDN001 và HDN013</strong> đang ở trạng thái chưa thanh toán.<small>Kỳ thanh toán 02/2025</small></p></div>
                    <div><i /><p><strong>SC0001</strong> sửa chữa máy lạnh đã hoàn tất.<small>Hoàn tất ngày 02/12/2025</small></p></div>
                    <div><i /><p><strong>BV0001</strong> vi phạm vệ sinh chung đã xử lý.<small>Tiền phạt 100.000đ</small></p></div>
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeTab === 'hop-dong' && (
            <section>
              <PageHead eyebrow="Phòng / Hợp đồng" title="Thông tin hợp đồng và bàn giao phòng">
                Xem thông tin thuê, phiếu cọc và danh sách tài sản đã được bàn giao theo dữ liệu mẫu.
              </PageHead>
              <div className="rt-columns">
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Hợp đồng {seededRental.contractId}</h3><p>Ký ngày {seededRental.signedDate}</p></div>
                    <Badge>{seededRental.contractStatus}</Badge>
                  </div>
                  <InfoList rows={[
                    ['Khách hàng', `${user?.hoTen || 'Nguyễn Văn An'} (${seededRental.customerId})`],
                    ['Phòng / giường thuê', `${seededRental.room} · ${seededRental.bed}`],
                    ['Loại phòng', seededRental.roomType],
                    ['Thời hạn thuê', `${seededRental.contractStart} - ${seededRental.contractEnd}`],
                    ['Giá thuê', seededRental.rent],
                    ['Kỳ thanh toán', seededRental.paymentCycle]
                  ]} />
                </article>
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Tài sản bàn giao</h3><p>{seededRental.handoverId} · {seededRental.handoverDate}</p></div>
                    <Badge>Đã bàn giao</Badge>
                  </div>
                  <div className="rt-assets">
                    {assets.map((asset) => (
                      <div key={asset}><strong>{asset}</strong><span>01 · Bàn giao lúc nhận phòng</span></div>
                    ))}
                  </div>
                </article>
              </div>
              <article className="rt-card rt-top-gap">
                <div className="rt-card-head">
                  <div><h3>Phiếu đặt cọc {seededRental.depositId}</h3><p>Liên kết hợp đồng {seededRental.contractId}</p></div>
                  <Badge>Đã lập HĐ</Badge>
                </div>
                <InfoList rows={[
                  ['Hình thức thuê', 'Ghép giường'],
                  ['Phương thức thanh toán', 'Chuyển khoản'],
                  ['Trạng thái thanh toán', 'Đã TT'],
                  ['Phòng / giường giữ chỗ', `${seededRental.room} · ${seededRental.bed}`]
                ]} />
              </article>
            </section>
          )}

          {activeTab === 'hoa-don' && (
            <section>
              <PageHead eyebrow="Hóa đơn / Thanh toán" title="Danh sách hóa đơn của khách">
                Các dòng hiển thị đang được lấy theo bộ dữ liệu mẫu của hợp đồng HD0001.
              </PageHead>
              <article className="rt-card">
                <div className="rt-card-head">
                  <div><h3>Hóa đơn gần đây</h3><p>Chi tiết phí điện, nước, wifi và gửi xe.</p></div>
                </div>
                <div className="rt-invoices">
                  {invoices.map((invoice) => (
                    <div className="rt-invoice" key={invoice.id}>
                      <div><strong>{invoice.id}</strong><small>Kỳ {invoice.period}</small></div>
                      <div><small>Hạn thanh toán</small><strong>{invoice.dueDate}</strong></div>
                      <div><small>Tổng chi tiết</small><strong>{invoice.total}</strong></div>
                      <Badge tone="danger">{invoice.status}</Badge>
                      <button className="rt-btn secondary" type="button">Xem chi tiết</button>
                    </div>
                  ))}
                </div>
              </article>
              <article className="rt-card rt-top-gap">
                <div className="rt-card-head">
                  <div><h3>Cấu thành hóa đơn HDN001</h3><p>Tổng tiền tính từ các dòng ChiTietHoaDon trong dữ liệu seed.</p></div>
                </div>
                <div className="rt-charges">
                  <div><span>Điện · 50 kWh x 4.000đ</span><strong>200.000đ</strong></div>
                  <div><span>Nước · 5 m3 x 18.000đ</span><strong>90.000đ</strong></div>
                  <div><span>Wifi · 1 tháng</span><strong>100.000đ</strong></div>
                  <div><span>Gửi xe · 1 tháng</span><strong>150.000đ</strong></div>
                  <div className="total"><span>Tổng cộng</span><strong>540.000đ</strong></div>
                </div>
              </article>
            </section>
          )}

          {activeTab === 'bao-tri' && (
            <section>
              <PageHead
                eyebrow="Bảo trì / Sửa chữa"
                title="Yêu cầu sửa chữa của khách"
                action={<button className="rt-btn primary" type="button">Gửi yêu cầu sửa chữa</button>}
              >
                Theo dõi mô tả hư hỏng, trạng thái xử lý và chi phí phát sinh của phòng đang thuê.
              </PageHead>
              <div className="rt-columns">
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>SC0001 · Máy lạnh không lạnh</h3><p>Ngày yêu cầu: 01/12/2025</p></div>
                    <Badge>Hoàn tất</Badge>
                  </div>
                  <InfoList rows={[
                    ['Phòng', seededRental.room],
                    ['Ngày tiếp nhận', '01/12/2025'],
                    ['Ngày hoàn tất', '02/12/2025'],
                    ['Ghi chú xử lý', 'Vệ sinh máy lạnh và nạp gas'],
                    ['Chi phí sửa chữa', '350.000đ'],
                    ['Lỗi do khách gây ra', 'Không']
                  ]} />
                </article>
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Biên bản vi phạm BV0001</h3><p>Ngày vi phạm: 12/02/2025</p></div>
                    <Badge>Đã xử lý</Badge>
                  </div>
                  <InfoList rows={[
                    ['Điều khoản', 'Không giữ vệ sinh chung'],
                    ['Mô tả', 'Để rác sai nơi quy định tại khu vực chung'],
                    ['Hình thức xử lý', 'Phạt tiền'],
                    ['Số tiền phạt', '100.000đ']
                  ]} />
                </article>
              </div>
            </section>
          )}

          {activeTab === 'tra-phong' && (
            <YeuCauTraPhong onBack={() => goTo('tong-quan')} />
          )}

          {activeTab === 'tai-khoan' && (
            <section>
              <PageHead eyebrow="Tài khoản" title="Thông tin tài khoản">
                Thông tin đăng nhập và hồ sơ cá nhân của khách hàng đang sử dụng cổng thuê phòng.
              </PageHead>
              <div className="rt-columns">
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Thông tin đăng nhập</h3><p>Tài khoản liên kết hồ sơ khách hàng.</p></div>
                    <Badge>{user?.trangThai || 'Hoạt động'}</Badge>
                  </div>
                  <InfoList rows={[
                    ['Mã khách hàng', user?.maNguoiDung || seededRental.customerId],
                    ['Tên đăng nhập', user?.tenDangNhap || 'kh0001'],
                    ['Vai trò', 'Khách hàng'],
                    ['Trạng thái cư trú', 'Đang thuê']
                  ]} />
                </article>
                <article className="rt-card">
                  <div className="rt-card-head">
                    <div><h3>Thông tin cá nhân</h3><p>Dữ liệu trả về từ phiên đăng nhập.</p></div>
                  </div>
                  <InfoList rows={[
                    ['Họ và tên', user?.hoTen || 'Nguyễn Văn An'],
                    ['Ngày sinh', user?.ngaySinh ? new Date(user.ngaySinh).toLocaleDateString('vi-VN') : '02/02/1996'],
                    ['Giới tính', user?.gioiTinh || 'Nam'],
                    ['Số điện thoại', user?.soDienThoai || '091200001'],
                    ['Email', user?.email || 'kh0001@mail.com']
                  ]} />
                </article>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="rt-footer">
        <div className="rt-frame rt-footer-grid">
          <div>
            <Brand />
            <p>Cổng khách hàng giúp người đang thuê theo dõi phòng, hợp đồng và trả phòng.</p>
          </div>
          <div>
            <h3>Chi nhánh đang thuê</h3>
            <p>{seededRental.branch}</p>
            <p>{seededRental.address}</p>
            <p>02811110001</p>
          </div>
          <div>
            <h3>Hỗ trợ khách hàng</h3>
            <button type="button" onClick={() => goTo('tong-quan')}>Tổng quan</button>
          </div>
        </div>
        <div className="rt-frame rt-copyright">© 2026 Homestay Dorm. Giao diện khách đang thuê.</div>
      </footer>
    </div>
  );
}
