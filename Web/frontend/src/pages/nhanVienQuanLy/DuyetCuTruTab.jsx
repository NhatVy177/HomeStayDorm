import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { cuTruApi } from '../nhanPhong/cuTru.api.js';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import '../nhanPhong/cuTru.css';

const demoHoSo = [
  {
    maHoSoCuTru: 'CT0001',
    maPhieuDatCoc: 'DC0018',
    hoTenKhachHang: 'Tô Khánh Linh',
    sdt: '091200015',
    hinhThucThue: 'Ghép giường',
    viTriThue: 'Phòng P102, Giường G02',
    gioiTinhChoPhep: 'Nữ',
    sucChuaToiDa: 4,
    soGiuongDaCoc: 1,
    trangThaiHoSo: 'Chờ duyệt cư trú',
    ngayCapNhat: '2026-07-01',
    thanhVien: [
      { maThanhVienCuTru: 'TV0001', hoTen: 'Tô Khánh Linh', ngaySinh: '2005-03-12', gioiTinh: 'Nữ', cccd: '079205000001', sdt: '091200015', email: 'linh@example.com', quocTich: 'Việt Nam', trangThaiDuyet: 'Chờ duyệt' }
    ]
  },
  {
    maHoSoCuTru: 'CT0002',
    maPhieuDatCoc: 'DC0019',
    hoTenKhachHang: 'Cao Minh Tú',
    sdt: '091200016',
    hinhThucThue: 'Nguyên phòng',
    viTriThue: 'Phòng P202',
    gioiTinhChoPhep: 'Không phân biệt',
    sucChuaToiDa: 3,
    soGiuongDaCoc: 3,
    trangThaiHoSo: 'Chờ duyệt cư trú',
    ngayCapNhat: '2026-07-01',
    thanhVien: [
      { maThanhVienCuTru: 'TV0002', hoTen: 'Cao Minh Tú', ngaySinh: '2004-02-14', gioiTinh: 'Nam', cccd: '079204000002', sdt: '091200016', email: 'tu@example.com', quocTich: 'Việt Nam', trangThaiDuyet: 'Chờ duyệt' },
      { maThanhVienCuTru: 'TV0003', hoTen: 'Trần Minh Khoa', ngaySinh: '2004-06-21', gioiTinh: 'Nam', cccd: '079204000003', sdt: '091200017', email: 'khoa@example.com', quocTich: 'Việt Nam', trangThaiDuyet: 'Chờ duyệt' }
    ]
  }
];

function pick(row, camel, pascal, fallback = '') {
  return row?.[camel] ?? row?.[pascal] ?? fallback;
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleDateString('vi-VN');
}

function normalizeMember(row = {}) {
  const maTV = pick(row, 'maThanhVien', 'MaThanhVien', 'maThanhVienCuTru', 'MaThanhVienCuTru', null);
  const status = pick(row, 'trangThai', 'TrangThai', 'trangThaiDuyet', 'TrangThaiDuyet', 'Chờ duyệt');
  return {
    maThanhVien: maTV,
    maThanhVienCuTru: maTV,
    hoTen: pick(row, 'hoTen', 'HoTen'),
    ngaySinh: pick(row, 'ngaySinh', 'NgaySinh'),
    gioiTinh: pick(row, 'gioiTinh', 'GioiTinh'),
    cccd: pick(row, 'cccd', 'CCCD'),
    sdt: pick(row, 'sdt', 'SDT'),
    email: pick(row, 'email', 'Email'),
    quocTich: pick(row, 'quocTich', 'QuocTich', 'Việt Nam'),
    trangThai: status,
    trangThaiDuyet: status,
    lyDoTuChoi: pick(row, 'lyDoTuChoi', 'LyDoTuChoi', '')
  };
}

function normalizeHoSo(row = {}) {
  return {
    maHoSoCuTru: pick(row, 'maHoSoCuTru', 'MaHoSoCuTru'),
    maPhieuDatCoc: pick(row, 'maPhieuDatCoc', 'MaPhieuDatCoc'),
    hoTenKhachHang: pick(row, 'hoTenKhachHang', 'HoTenKhachHang'),
    sdt: pick(row, 'sdt', 'SDT'),
    hinhThucThue: pick(row, 'hinhThucThue', 'HinhThucThue'),
    viTriThue: pick(row, 'viTriThue', 'ViTriThue'),
    gioiTinhChoPhep: pick(row, 'gioiTinhChoPhep', 'GioiTinhChoPhep', 'Không phân biệt'),
    sucChuaToiDa: Number(pick(row, 'sucChuaToiDa', 'SucChuaToiDa', 1)),
    soGiuongDaCoc: Number(pick(row, 'soGiuongDaCoc', 'SoGiuongDaCoc', 1)),
    trangThaiHoSo: pick(row, 'trangThaiHoSo', 'TrangThaiHoSo', 'Chờ duyệt cư trú'),
    ngayCapNhat: pick(row, 'ngayCapNhat', 'NgayCapNhat'),
    ghiChuSale: pick(row, 'ghiChuSale', 'GhiChuSale', ''),
    ghiChuQuanLy: pick(row, 'ghiChuQuanLy', 'GhiChuQuanLy', ''),
    coNguoiDangO: Boolean(pick(row, 'coNguoiDangO', 'CoNguoiDangO', false)),
    thanhVien: Array.isArray(row.thanhVien) ? row.thanhVien.map(normalizeMember) : []
  };
}

const RESIDENCE_STATUS_CONFIG = {
  'Chờ duyệt cư trú': { chip: 'Chờ duyệt',    badgeLabel: 'Chờ duyệt',    badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Đã duyệt cư trú':   { chip: 'Đã duyệt',     badgeLabel: 'Đã duyệt',     badge: { bg: '#e6f6ec', fg: '#15803d' } },
  'Từ chối cư trú':    { chip: 'Từ chối',      badgeLabel: 'Từ chối',      badge: { bg: '#fee2e2', fg: '#b91c1c' } }
};
const RESIDENCE_STATUS_ORDER = ['Chờ duyệt cư trú', 'Đã duyệt cư trú', 'Từ chối cư trú'];

function StatusBadge({ value }) {
  const cfg = RESIDENCE_STATUS_CONFIG[value];
  const badgeStyle = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#6f797a' };
  const label = cfg ? cfg.badgeLabel : value;
  
  return (
    <span style={{
      background: badgeStyle.bg,
      color: badgeStyle.fg,
      padding: '4px 12px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      display: 'inline-block',
      textAlign: 'center'
    }}>
      {label}
    </span>
  );
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'CT';
}

/**
 * Kiểm tra giới tính thành viên có phù hợp với quy định phòng không.
 * Điều kiện Bỏ QUA (luôn pass):
 *   - Phòng chưa có ai đang ở (coNguoiDangO = false)
 *   - Hoặc đang thuê nguyên căn (người thuê tự chọn ai ở trong phòng của họ)
 *   - Hoặc phòng không phân biệt giới tính
 */
function genderFits(roomGender = '', memberGender = '', coNguoiDangO = false, hinhThucThue = '') {
  if (!coNguoiDangO) return true;             // Phòng trống → không áp dụng
  if (hinhThucThue === 'Nguyên phòng') return true; // Thuê nguyên căn → tự quản
  return !roomGender
    || roomGender === 'Không phân biệt'
    || roomGender === memberGender;
}

export default function DuyetCuTruTab() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('Chờ duyệt cư trú');
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [decision, setDecision] = useState('Đã duyệt cư trú');
  const [managerNote, setManagerNote] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const normalizedList = useMemo(() => records.map(normalizeHoSo), [records]);
  const waitingCount = normalizedList.filter((item) => item.trangThaiHoSo === 'Chờ duyệt cư trú').length;
  const acceptedMembers = members.filter((item) => item.trangThaiDuyet === 'Đủ điều kiện');
  const rejectedMembers = members.filter((item) => item.trangThaiDuyet === 'Bị từ chối');
  const capacityLimit = selected
    ? (selected.hinhThucThue === 'Ghép giường' ? selected.soGiuongDaCoc : selected.sucChuaToiDa)
    : 0;
  const genderMismatchCount = selected
    ? members.filter((item) => !genderFits(selected.gioiTinhChoPhep, item.gioiTinh, selected.coNguoiDangO, selected.hinhThucThue)).length
    : 0;
  // Phải kiểm tra giới tính khi phòng có người đang ở và là ghép giường
  const isGenderCheckRequired = selected && selected.coNguoiDangO && selected.hinhThucThue !== 'Nguyên phòng';
  const capacityWarning = Boolean(selected && acceptedMembers.length > capacityLimit);
  const reviewReady = Boolean(selected && acceptedMembers.length > 0 && !capacityWarning && genderMismatchCount === 0);

  // Đếm số lượng theo từng trạng thái cho các chip bộ lọc
  const statusCounts = useMemo(() => {
    const counts = { all: normalizedList.length };
    RESIDENCE_STATUS_ORDER.forEach((s) => {
      counts[s] = 0;
    });
    normalizedList.forEach((item) => {
      const status = item.trangThaiHoSo;
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });
    return counts;
  }, [normalizedList]);

  // Lọc danh sách hiển thị theo chip trạng thái
  const filteredList = useMemo(() => {
    if (statusFilter === 'all') return normalizedList;
    return normalizedList.filter((item) => item.trangThaiHoSo === statusFilter);
  }, [normalizedList, statusFilter]);

  async function loadData(keyword = searchText) {
    try {
      setLoading(true);
      setError('');
      // Luôn lấy tất cả trạng thái từ API để hiển thị số lượng chính xác trên từng chip
      const res = await cuTruApi.layDanhSachChoDuyet({ tuKhoa: keyword, trangThai: '' });
      setRecords(res.data || []);
    } catch (err) {
      setRecords(demoHoSo);
      setNotice('Đang dùng dữ liệu demo vì API hoặc stored procedure cư trú chưa sẵn sàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function openDetail(row) {
    const base = normalizeHoSo(row);
    setError('');
    setDecision(base.trangThaiHoSo === 'Từ chối cư trú' ? 'Từ chối cư trú' : 'Đã duyệt cư trú');
    setManagerNote(base.ghiChuQuanLy || '');

    try {
      const res = await cuTruApi.layChiTietHoSo(base.maHoSoCuTru);
      const detail = normalizeHoSo(res.data?.hoSo || base);
      const detailMembers = (res.data?.thanhVien || []).map(normalizeMember);
      setSelected({ ...base, ...detail });
      setDecision(detail.trangThaiHoSo === 'Từ chối cư trú' ? 'Từ chối cư trú' : 'Đã duyệt cư trú');
      setManagerNote(detail.ghiChuQuanLy || '');
      setMembers((detailMembers.length ? detailMembers : base.thanhVien).map((item) => ({
        ...item,
        trangThaiDuyet: item.trangThaiDuyet === 'Bị từ chối' ? 'Bị từ chối' : 'Đủ điều kiện'
      })));
    } catch {
      setSelected(base);
      setMembers(base.thanhVien.map((item) => ({ ...item, trangThaiDuyet: 'Đủ điều kiện' })));
    }
  }

  function updateMember(index, field, value) {
    setMembers((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function getDecisionValidation() {
    if (decision === 'Từ chối cư trú' && !managerNote.trim()) {
      return 'Vui lòng nhập ghi chú khi từ chối hồ sơ.';
    }
    if (decision === 'Đã duyệt cư trú') {
      const acceptedCount = members.filter((item) => item.trangThaiDuyet === 'Đủ điều kiện').length;
      if (acceptedCount === 0) return 'Cần có ít nhất một thành viên đủ điều kiện.';
      if (selected.hinhThucThue === 'Ghép giường' && acceptedCount > selected.soGiuongDaCoc) {
        return 'Số thành viên đủ điều kiện vượt số giường đã đặt cọc.';
      }
      if (selected.hinhThucThue === 'Nguyên phòng' && acceptedCount > selected.sucChuaToiDa) {
        return 'Số thành viên đủ điều kiện vượt sức chứa tối đa của phòng.';
      }
    }
    return '';
  }

  async function submitDecision() {
    const message = getDecisionValidation();
    if (message) {
      setError(message);
      return;
    }

    try {
      setLoading(true);
      await cuTruApi.duyetHoSoCuTru(selected.maHoSoCuTru, {
        ketQua: decision,
        ghiChuQuanLy: managerNote,
        danhSachKetQuaThanhVien: members.map((item) => ({
          maThanhVienCuTru: item.maThanhVienCuTru,
          trangThaiDuyet: item.trangThaiDuyet,
          lyDoTuChoi: item.lyDoTuChoi
        }))
      });
      setSuccessInfo({
        maHoSoCuTru: selected.maHoSoCuTru,
        hoTenKhachHang: selected.hoTenKhachHang,
        viTriThue: selected.viTriThue,
        ketQua: decision === 'Từ chối cư trú' ? 'Từ chối cư trú' : 'Đã duyệt cư trú'
      });
      setSelected(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật kết quả duyệt cư trú.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ktp-container residence-page">
      {notice && (
        <div className="residence-notice">
          <Icon name="info" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>Đóng</button>
        </div>
      )}



      <div
        className="residence-filter"
        style={{ display: 'grid', gridTemplateColumns: '1fr', marginBottom: '20px' }}
      >
        <div className="ktp-filter-group" style={{ margin: 0 }}>
          <label className="ktp-filter-label">Tìm kiếm</label>
          <div className="ktp-input-icon-wrap">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input
              className="ktp-input ktp-input-with-icon"
              value={searchText}
              onChange={(event) => {
                const val = event.target.value;
                setSearchText(val);
                loadData(val);
              }}
              placeholder="Nhập mã hồ sơ, mã phiếu, tên khách"
            />
          </div>
        </div>
      </div>

      {/* Bộ lọc trạng thái dạng chip */}
      <StatusFilterTabs
        className="status-pill-tabs-offset"
        items={[
          { key: 'all', label: 'Tất cả' },
          { key: 'Chờ duyệt cư trú', label: 'Chờ duyệt' },
          { key: 'Đã duyệt cư trú', label: 'Đã duyệt' },
          { key: 'Từ chối cư trú', label: 'Từ chối' }
        ]}
        activeKey={statusFilter}
        counts={statusCounts}
        onChange={setStatusFilter}
      />

      <section className="ktp-table-section">
        <div className="residence-table-head">
          <div>
            <h3>Hồ sơ cư trú cần duyệt</h3>
            <p>Kết quả duyệt sẽ quyết định hồ sơ nào được chuyển sang bước lập hợp đồng.</p>
          </div>
        </div>
        <div className="residence-table-scroll">
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã hồ sơ</th>
                <th>Phiếu cọc</th>
                <th>Khách hàng</th>
                <th>Phòng / giường</th>
                <th>Ngày cập nhật</th>
                <th>Trạng thái</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="text-center">Đang tải dữ liệu...</td></tr>}
              {!loading && filteredList.length === 0 && <tr><td colSpan="7" className="text-center">Không có hồ sơ cần duyệt.</td></tr>}
              {!loading && filteredList.map((item) => (
                <tr key={item.maHoSoCuTru}>
                  <td><strong className="residence-code">{item.maHoSoCuTru}</strong></td>
                  <td>{item.maPhieuDatCoc}</td>
                  <td>
                    <strong>{item.hoTenKhachHang}</strong>
                    <span className="residence-subtext">{item.sdt}</span>
                  </td>
                  <td>
                    <strong>{item.viTriThue}</strong>
                    <span className="residence-subtext">{item.hinhThucThue}</span>
                  </td>
                  <td>{formatDate(item.ngayCapNhat)}</td>
                  <td><StatusBadge value={item.trangThaiHoSo} /></td>
                  <td className="text-center">
                    {item.trangThaiHoSo === 'Chờ duyệt cư trú' ? (
                      <button className="ktp-btn-action-fill" type="button" style={{ width: '96px' }} onClick={() => openDetail(item)}>
                        Duyệt
                      </button>
                    ) : (
                      <button
                        className="ktp-btn-action-fill"
                        type="button"
                        style={{ backgroundColor: '#2f6765', borderColor: '#2f6765', width: '96px' }}
                        onClick={() => openDetail(item)}
                      >
                        Chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="ktp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ktp-modal residence-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ktp-modal-header-primary">
              <div>
                <h3>Duyệt hồ sơ {selected.maHoSoCuTru}</h3>
                <p className="ktp-modal-header-sub" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Kiểm tra danh sách cư trú và chọn kết quả xử lý.</p>
              </div>
              <button className="ktp-modal-close" type="button" onClick={() => setSelected(null)}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body">
              {error && <div className="residence-error"><Icon name="error" /> {error}</div>}

              <div className="residence-summary">
                <div><span>Phiếu cọc</span><strong>{selected.maPhieuDatCoc}</strong></div>
                <div><span>Vị trí thuê</span><strong>{selected.viTriThue}</strong></div>
                <div><span>Giới tính phòng</span><strong>{selected.gioiTinhChoPhep}</strong></div>
                <div><span>Sức chứa</span><strong>{selected.sucChuaToiDa} người</strong></div>
              </div>

              {selected.ghiChuSale?.trim() && (
                <section className="residence-sale-note">
                  <span className="residence-sale-note-icon"><Icon name="sticky_note_2" /></span>
                  <div>
                    <strong>Ghi chú từ sale</strong>
                    <p>{selected.ghiChuSale}</p>
                  </div>
                </section>
              )}

              <div className="residence-approval-strip">
                <div>
                  <span>Đủ điều kiện</span>
                  <strong>{acceptedMembers.length}</strong>
                </div>
                <div>
                  <span>Bị từ chối</span>
                  <strong>{rejectedMembers.length}</strong>
                </div>
                <div>
                  <span>Giới hạn duyệt</span>
                  <strong>{capacityLimit} người</strong>
                </div>
              </div>

              <section className="residence-condition-panel">
                <div>
                  <h4>Điều kiện cần kiểm</h4>
                  <p>Quản lý đối chiếu nhanh trước khi chốt kết quả cư trú.</p>
                </div>
                <div className="residence-condition-grid">
                  <div className="residence-condition-card is-ok">
                    <Icon name="assignment_turned_in" />
                    <div>
                      <strong>Hồ sơ đã gửi duyệt</strong>
                      <span>Sale đã hoàn tất bước ghi nhận thông tin cư trú.</span>
                    </div>
                  </div>
                  <div className={`residence-condition-card ${isGenderCheckRequired && genderMismatchCount ? 'is-danger' : 'is-ok'}`}>
                    <Icon name={isGenderCheckRequired && genderMismatchCount ? 'warning' : 'verified'} />
                    <div>
                      <strong>Giới tính phù hợp</strong>
                      <span>
                        {!isGenderCheckRequired
                          ? (selected.hinhThucThue === 'Nguyên phòng'
                              ? 'Thuê nguyên căn – không giới hạn giới tính.'
                              : 'Phòng chưa có ai ở – không áp dụng quy định giới tính.')
                          : genderMismatchCount
                            ? `${genderMismatchCount} người chưa khớp quy định phòng.`
                            : `Phòng cho phép: ${selected.gioiTinhChoPhep}.`
                        }
                      </span>
                    </div>
                  </div>
                  <div className={`residence-condition-card ${capacityWarning ? 'is-danger' : 'is-ok'}`}>
                    <Icon name={capacityWarning ? 'group_off' : 'groups'} />
                    <div>
                      <strong>Số người hợp lệ</strong>
                      <span>{acceptedMembers.length}/{capacityLimit} người được duyệt.</span>
                    </div>
                  </div>
                  <div className={`residence-condition-card ${reviewReady ? 'is-ok' : 'is-warning'}`}>
                    <Icon name={reviewReady ? 'task_alt' : 'rule'} />
                    <div>
                      <strong>Kết luận đề xuất</strong>
                      <span>{reviewReady ? 'Có thể duyệt cư trú nếu giấy tờ hợp lệ.' : 'Cần rà soát trước khi duyệt.'}</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="residence-member-head">
                <h4>Đánh giá từng người cư trú</h4>
                <StatusBadge value={selected.trangThaiHoSo} />
              </div>

              <div className="residence-review-list">
                {members.map((member, index) => (
                  <article
                    className={`residence-review-card ${member.trangThaiDuyet === 'Bị từ chối' ? 'is-rejected' : 'is-accepted'}`}
                    key={member.maThanhVienCuTru || index}
                  >
                    <div className="residence-review-person">
                      <span className="residence-review-avatar">{getInitials(member.hoTen)}</span>
                      <div>
                        <strong>{member.hoTen || `Người cư trú ${index + 1}`}</strong>
                        <div className="residence-review-meta">
                          <span>CCCD: {member.cccd || 'Chưa có'}</span>
                          <span>{member.gioiTinh || 'Chưa rõ giới tính'}</span>
                          <span>{member.quocTich || 'Việt Nam'}</span>
                          {member.sdt && <span>{member.sdt}</span>}
                        </div>
                        {isGenderCheckRequired && !genderFits(selected.gioiTinhChoPhep, member.gioiTinh, selected.coNguoiDangO, selected.hinhThucThue) && (
                          <small className="residence-review-warning">Không khớp giới tính phòng</small>
                        )}
                      </div>
                    </div>
                    <select
                      className="ktp-input"
                      value={member.trangThaiDuyet}
                      onChange={(event) => updateMember(index, 'trangThaiDuyet', event.target.value)}
                      disabled={selected.trangThaiHoSo !== 'Chờ duyệt cư trú'}
                    >
                      <option>Đủ điều kiện</option>
                      <option>Bị từ chối</option>
                    </select>
                    {member.trangThaiDuyet === 'Bị từ chối' && (
                      <input
                        className="ktp-input residence-review-reason"
                        value={member.lyDoTuChoi || ''}
                        onChange={(event) => updateMember(index, 'lyDoTuChoi', event.target.value)}
                        placeholder="Lý do từ chối thành viên"
                        disabled={selected.trangThaiHoSo !== 'Chờ duyệt cư trú'}
                      />
                    )}
                  </article>
                ))}
              </div>
 
              <section className="residence-decision-panel">
                <div className="residence-decision-copy">
                  <strong>Kết luận hồ sơ</strong>
                  <span>Chọn kết quả cuối cùng sau khi kiểm từng thành viên và điều kiện phòng.</span>
                </div>
                <div className="residence-decision-grid">
                  {['Đã duyệt cư trú', 'Từ chối cư trú'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={decision === item ? 'is-active' : ''}
                      onClick={() => {
                        if (selected.trangThaiHoSo === 'Chờ duyệt cư trú') {
                          setDecision(item);
                        }
                      }}
                      style={{
                        cursor: selected.trangThaiHoSo === 'Chờ duyệt cư trú' ? 'pointer' : 'default',
                        opacity: (selected.trangThaiHoSo !== 'Chờ duyệt cư trú' && decision !== item) ? 0.5 : 1
                      }}
                    >
                      {item === 'Đã duyệt cư trú' ? 'Duyệt cư trú' : item}
                    </button>
                  ))}
                </div>
              </section>
 
              <label className="residence-note">
                Ghi chú quản lý
                <textarea
                  className="ktp-input"
                  value={managerNote}
                  onChange={(event) => setManagerNote(event.target.value)}
                  rows="3"
                  disabled={selected.trangThaiHoSo !== 'Chờ duyệt cư trú'}
                />
              </label>
            </div>
 
            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" type="button" onClick={() => setSelected(null)}>Đóng</button>
              {selected.trangThaiHoSo === 'Chờ duyệt cư trú' && (
                <button className="ktp-btn-submit" type="button" onClick={submitDecision} disabled={loading}>
                  Lưu kết quả duyệt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {successInfo && (
        <div className="ktp-modal-overlay" onClick={() => setSuccessInfo(null)}>
          <div className="residence-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="residence-success-icon-wrap">
              <Icon name="check" style={{ fontSize: '32px' }} />
            </div>
            <h3 className="residence-success-title">Duyệt cư trú thành công</h3>
            <p className="residence-success-text">Hệ thống đã cập nhật kết quả duyệt hồ sơ cư trú vào cơ sở dữ liệu.</p>
            
            <div className="residence-success-details">
              <div className="residence-success-row">
                <span className="residence-success-label">Mã hồ sơ</span>
                <span className="residence-success-value">{successInfo.maHoSoCuTru}</span>
              </div>
              <div className="residence-success-row">
                <span className="residence-success-label">Khách hàng</span>
                <span className="residence-success-value">{successInfo.hoTenKhachHang}</span>
              </div>
              <div className="residence-success-row">
                <span className="residence-success-label">Vị trí thuê</span>
                <span className="residence-success-value">{successInfo.viTriThue}</span>
              </div>
              <div className="residence-success-row">
                <span className="residence-success-label">Kết quả duyệt</span>
                <span className="residence-success-value">
                  <StatusBadge value={successInfo.ketQua} />
                </span>
              </div>
            </div>

            <button type="button" className="residence-success-btn" onClick={() => setSuccessInfo(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
