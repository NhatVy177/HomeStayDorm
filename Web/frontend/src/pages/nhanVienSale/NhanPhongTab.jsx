import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { cuTruApi } from '../nhanPhong/cuTru.api.js';
import '../nhanPhong/cuTru.css';

const demoPhieuCocs = [
  {
    maPhieuDatCoc: 'DC0018',
    hoTenKhachHang: 'Tô Khánh Linh',
    sdt: '091200015',
    hinhThucThue: 'Ghép giường',
    viTriThue: 'Phòng P102, Giường G02',
    thoiGianNhanPhong: '2026-07-02',
    trangThaiThanhToan: 'Đã TT',
    trangThaiHoSo: 'Chưa cập nhật',
    gioiTinhChoPhep: 'Nữ',
    sucChuaToiDa: 4,
    soGiuongDaCoc: 1,
    soNguoiDuKienO: 1,
    soNam: 0,
    soNu: 1,
    thoiHanThue: 6,
    ngaySinh: '2005-03-12',
    gioiTinhKhachHang: 'Nữ',
    email: 'linh@example.com',
    cccd: '079205000001',
    quocTich: 'Việt Nam',
    khuVucMongMuon: 'Khu nữ',
    loaiPhongYeuCau: 'Giường đơn'
  },
  {
    maPhieuDatCoc: 'DC0019',
    hoTenKhachHang: 'Cao Minh Tú',
    sdt: '091200016',
    hinhThucThue: 'Nguyên phòng',
    viTriThue: 'Phòng P202',
    thoiGianNhanPhong: '2026-07-02',
    trangThaiThanhToan: 'Đã TT',
    trangThaiHoSo: 'Từ chối cư trú',
    gioiTinhChoPhep: 'Không phân biệt',
    sucChuaToiDa: 3,
    soGiuongDaCoc: 3,
    soNguoiDuKienO: 3,
    soNam: 3,
    soNu: 0,
    thoiHanThue: 6,
    ngaySinh: '2004-02-14',
    gioiTinhKhachHang: 'Nam',
    email: 'tu@example.com',
    cccd: '079204000002',
    quocTich: 'Việt Nam',
    khuVucMongMuon: 'Khu nam',
    loaiPhongYeuCau: 'Nguyên phòng'
  }
];

const emptyMember = {
  hoTen: '',
  ngaySinh: '',
  gioiTinh: 'Nam',
  cccd: '',
  sdt: '',
  email: '',
  quocTich: 'Việt Nam'
};

function pick(row, camel, pascal, fallback = '') {
  return row?.[camel] ?? row?.[pascal] ?? fallback;
}

function formatDate(value) {
  if (!value) return 'Chưa định ngày';
  return new Date(value).toLocaleDateString('vi-VN');
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getGenderFromRegistration(phieu) {
  if (phieu.gioiTinhKhachHang === 'Nam' || phieu.gioiTinhKhachHang === 'Nữ') {
    return phieu.gioiTinhKhachHang;
  }
  if (Number(phieu.soNu) === 1 && Number(phieu.soNam) === 0) return 'Nữ';
  return 'Nam';
}

function isIndividualRental(phieu) {
  return Number(phieu?.soNguoiDuKienO || 1) <= 1;
}

function displayRentalType(value) {
  return value === 'Nguyên phòng' ? 'Nguyên căn' : value;
}

function canEditResidenceProfile(status) {
  return !['Chờ duyệt cư trú', 'Đã duyệt cư trú'].includes(status);
}

function canViewResidenceProfile(status) {
  return status === 'Đã duyệt cư trú';
}

function createPrimaryMember(phieu) {
  return {
    hoTen: phieu.hoTenKhachHang || '',
    ngaySinh: toDateInput(phieu.ngaySinh),
    gioiTinh: getGenderFromRegistration(phieu),
    cccd: phieu.cccd || '',
    sdt: phieu.sdt || '',
    email: phieu.email || '',
    quocTich: phieu.quocTich || 'Việt Nam'
  };
}

function normalizeMember(row = {}) {
  const maTV = pick(row, 'maThanhVien', 'MaThanhVien', 'maThanhVienCuTru', 'MaThanhVienCuTru', null);
  const status = pick(row, 'trangThai', 'TrangThai', 'trangThaiDuyet', 'TrangThaiDuyet', '');
  return {
    maThanhVien: maTV,
    maThanhVienCuTru: maTV,
    hoTen: pick(row, 'hoTen', 'HoTen'),
    ngaySinh: toDateInput(pick(row, 'ngaySinh', 'NgaySinh')),
    gioiTinh: pick(row, 'gioiTinh', 'GioiTinh', 'Nam'),
    cccd: pick(row, 'cccd', 'CCCD'),
    sdt: pick(row, 'sdt', 'SDT'),
    email: pick(row, 'email', 'Email'),
    quocTich: pick(row, 'quocTich', 'QuocTich', 'Việt Nam'),
    trangThai: status,
    trangThaiDuyet: status,
    lyDoTuChoi: pick(row, 'lyDoTuChoi', 'LyDoTuChoi', '')
  };
}

function normalizePhieu(row = {}) {
  return {
    maPhieuDatCoc: pick(row, 'maPhieuDatCoc', 'MaPhieuDatCoc'),
    maHoSoCuTru: pick(row, 'maHoSoCuTru', 'MaHoSoCuTru', null),
    maPhieuYeuCauDangKy: pick(row, 'maPhieuYeuCauDangKy', 'MaPhieuYeuCauDangKy'),
    hoTenKhachHang: pick(row, 'hoTenKhachHang', 'HoTenKhachHang'),
    ngaySinh: pick(row, 'ngaySinh', 'NgaySinh'),
    gioiTinhKhachHang: pick(row, 'gioiTinhKhachHang', 'GioiTinhKhachHang'),
    sdt: pick(row, 'sdt', 'SDT'),
    email: pick(row, 'email', 'Email'),
    cccd: pick(row, 'cccd', 'CCCD'),
    quocTich: pick(row, 'quocTich', 'QuocTich', 'Việt Nam'),
    hinhThucThue: pick(row, 'hinhThucThue', 'HinhThucThue'),
    viTriThue: pick(row, 'viTriThue', 'ViTriThue'),
    thoiGianNhanPhong: pick(row, 'thoiGianNhanPhong', 'ThoiGianNhanPhong'),
    trangThaiThanhToan: pick(row, 'trangThaiThanhToan', 'TrangThaiThanhToan'),
    trangThaiHoSo: pick(row, 'trangThaiHoSo', 'TrangThaiHoSo', 'Chưa cập nhật'),
    gioiTinhChoPhep: pick(row, 'gioiTinhChoPhep', 'GioiTinhChoPhep', 'Không phân biệt'),
    sucChuaToiDa: Number(pick(row, 'sucChuaToiDa', 'SucChuaToiDa', 1)),
    soGiuongDaCoc: Number(pick(row, 'soGiuongDaCoc', 'SoGiuongDaCoc', 1)),
    soNguoiDuKienO: Number(pick(row, 'soNguoiDuKienO', 'SoNguoiDuKienO', 1)),
    soNam: Number(pick(row, 'soNam', 'SoNam', 0)),
    soNu: Number(pick(row, 'soNu', 'SoNu', 0)),
    thoiHanThue: pick(row, 'thoiHanThue', 'ThoiHanThue'),
    khuVucMongMuon: pick(row, 'khuVucMongMuon', 'KhuVucMongMuon'),
    loaiPhongYeuCau: pick(row, 'loaiPhongYeuCau', 'LoaiPhongYeuCau')
  };
}

// Cấu hình trạng thái hồ sơ cư trú: nhãn chip, nhãn badge, màu badge (giống DatCocTab).
const RESIDENCE_STATUS_CONFIG = {
  'Chưa cập nhật':     { chip: 'Chờ gửi',      badgeLabel: 'Chờ gửi',          badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Chờ duyệt cư trú': { chip: 'Chờ duyệt',    badgeLabel: 'Chờ quản lý duyệt', badge: { bg: '#e8f1ff', fg: '#1d4ed8' } },
  'Đã duyệt cư trú':  { chip: 'Đã duyệt',     badgeLabel: 'Đã duyệt',          badge: { bg: '#e6f6ec', fg: '#15803d' } },
  'Từ chối cư trú':   { chip: 'Bị từ chối',   badgeLabel: 'Bị từ chối',        badge: { bg: '#fdecec', fg: '#b91c1c' } },
};
const RESIDENCE_STATUS_ORDER = ['Chưa cập nhật', 'Chờ duyệt cư trú', 'Đã duyệt cư trú', 'Từ chối cư trú'];

function StatusBadge({ value }) {
  const label = value || 'Chưa cập nhật';
  const cfg = RESIDENCE_STATUS_CONFIG[label];
  const s = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block', textAlign: 'center' }}>
      {cfg ? cfg.badgeLabel : label}
    </span>
  );
}

export default function NhanPhongTab() {
  const [searchText, setSearchText] = useState('');
  const [phieuCocs, setPhieuCocs] = useState([]);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [members, setMembers] = useState([{ ...emptyMember }]);
  const [checkedDocs, setCheckedDocs] = useState(false);
  const [note, setNote] = useState('');
  const [reviewInfo, setReviewInfo] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const errorTimerRef = React.useRef(null);

  function showError(msg) {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(''), 4000);
  }
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [successInfo, setSuccessInfo] = useState(null);

  const normalizedList = useMemo(() => phieuCocs.map(normalizePhieu), [phieuCocs]);
  const pendingCount = normalizedList.filter((item) => item.trangThaiHoSo !== 'Đã duyệt cư trú').length;

  // Đếm số lượng theo từng trạng thái (cho chip filter)
  const statusCounts = useMemo(() => {
    const c = { all: normalizedList.length };
    RESIDENCE_STATUS_ORDER.forEach((s) => { c[s] = 0; });
    normalizedList.forEach((item) => {
      const key = item.trangThaiHoSo || 'Chưa cập nhật';
      if (c[key] != null) c[key] += 1;
    });
    return c;
  }, [normalizedList]);

  // Danh sách đã lọc theo chip trạng thái
  const filteredList = useMemo(() => {
    if (statusFilter === 'all') return normalizedList;
    return normalizedList.filter((item) => (item.trangThaiHoSo || 'Chưa cập nhật') === statusFilter);
  }, [normalizedList, statusFilter]);

  async function loadData(keyword = '') {
    try {
      setLoading(true);
      setError('');
      const res = await cuTruApi.traCuuPhieuCoc(keyword);
      setPhieuCocs(res.data || []);
    } catch (err) {
      setPhieuCocs(demoPhieuCocs);
      setNotice('Đang dùng dữ liệu demo vì API hoặc stored procedure cư trú chưa sẵn sàng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function buildDefaultMembers(phieu) {
    const primaryMember = createPrimaryMember(phieu);
    if (isIndividualRental(phieu)) {
      return [primaryMember];
    }

    const expectedCount = Math.max(1, phieu.soNguoiDuKienO || phieu.soGiuongDaCoc || 1);
    return Array.from({ length: expectedCount }, (_, index) => (
      index === 0 ? primaryMember : { ...emptyMember }
    ));
  }

  async function openForm(phieu) {
    setSelectedPhieu(phieu);
    setCheckedDocs(false);
    setNote('');
    setReviewInfo(null);
    setError('');
    setMembers(buildDefaultMembers(phieu));

    if (!phieu.maHoSoCuTru) return;

    try {
      setLoading(true);
      const res = await cuTruApi.layChiTietHoSo(phieu.maHoSoCuTru);
      const hoSo = res.data?.hoSo || {};
      const detailMembers = (res.data?.thanhVien || []).map(normalizeMember);
      setCheckedDocs(Boolean(pick(hoSo, 'daDoiChieuGiayTo', 'DaDoiChieuGiayTo', false)));
      setNote(pick(hoSo, 'ghiChuSale', 'GhiChuSale', ''));
      setReviewInfo({
        trangThaiHoSo: pick(hoSo, 'trangThaiHoSo', 'TrangThaiHoSo', phieu.trangThaiHoSo),
        ghiChuQuanLy: pick(hoSo, 'ghiChuQuanLy', 'GhiChuQuanLy', ''),
        ngayDuyet: pick(hoSo, 'ngayDuyet', 'NgayDuyet', '')
      });
      if (detailMembers.length) {
        setMembers(detailMembers);
      }
    } catch (err) {
      showError('Không tải được hồ sơ cư trú đã nhập trước đó. Bạn thử đóng form rồi mở lại nha.');
    } finally {
      setLoading(false);
    }
  }

  function updateMember(index, field, value) {
    setMembers((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addMember() {
    if (isIndividualRental(selectedPhieu)) return;
    
    const maxCapacity = selectedPhieu.hinhThucThue === 'Ghép giường' 
      ? selectedPhieu.soGiuongDaCoc 
      : selectedPhieu.sucChuaToiDa;
      
    if (members.length >= maxCapacity) {
      const typeLabel = selectedPhieu.hinhThucThue === 'Ghép giường' ? 'số giường đã đặt cọc' : 'sức chứa tối đa của phòng';
      showError(`Không thể thêm người. Số người cư trú không được vượt quá ${typeLabel} (${maxCapacity} người).`);
      return;
    }
    setError('');
    setMembers((prev) => [...prev, { ...emptyMember }]);
  }

  function removeMember(index) {
    if (isIndividualRental(selectedPhieu)) return;
    setError('');
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function validateForm() {
    if (!selectedPhieu) return 'Vui lòng chọn phiếu đặt cọc.';
    if (!checkedDocs) return 'Cần xác nhận đã đối chiếu giấy tờ tùy thân.';
    if (members.some((item) => !item.hoTen || !item.cccd || !item.gioiTinh || !item.sdt)) {
      return 'Mỗi người cư trú cần có họ tên, CCCD, giới tính và SĐT.';
    }
    if (members.some((item) => item.sdt.length !== 10)) {
      return 'Số điện thoại của người cư trú phải có đúng 10 chữ số.';
    }
    if (members.some((item) => item.cccd.length !== 12)) {
      return 'CCCD của người cư trú phải có đúng 12 chữ số.';
    }
    return '';
  }

  async function handleSubmit() {
    const message = validateForm();
    if (message) {
      showError(message);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const saveRes = await cuTruApi.luuHoSoCuTru({
        maPhieuDatCoc: selectedPhieu.maPhieuDatCoc,
        daDoiChieuGiayTo: checkedDocs,
        ghiChu: note,
        danhSachThanhVien: members
      });
      const maHoSo = saveRes.data?.hoSo?.maHoSoCuTru || saveRes.data?.hoSo?.MaHoSoCuTru || selectedPhieu.maHoSoCuTru;
      if (maHoSo) {
        await cuTruApi.guiDuyetHoSoCuTru(maHoSo);
      }
      setSuccessInfo({
        maPhieuDatCoc: selectedPhieu.maPhieuDatCoc,
        hoTenKhachHang: selectedPhieu.hoTenKhachHang,
        viTriThue: selectedPhieu.viTriThue,
        soNguoi: members.length
      });
      setSelectedPhieu(null);
      loadData(searchText);
    } catch (err) {
      showError(err.response?.data?.message || 'Không thể lưu hồ sơ cư trú. Bạn kiểm tra lại dữ liệu hoặc chạy script SQL mới nha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ktp-container residence-page tnp-page">
      {error && (
        <div className="residence-error-overlay" onClick={() => setError('')}>
          <div className="residence-error-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="residence-error-icon">
              <Icon name="error" />
            </div>
            <h4>Có lỗi xảy ra</h4>
            <p>{error}</p>
            <button type="button" className="residence-error-ok" onClick={() => setError('')}>Đã hiểu</button>
          </div>
        </div>
      )}

      {notice && (
        <div className="residence-notice">
          <Icon name="info" />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>Đóng</button>
        </div>
      )}



      <section className="residence-filter" style={{ display: 'block', maxWidth: '480px' }}>
        <div className="ktp-filter-group" style={{ margin: 0 }}>
          <label className="ktp-filter-label">Tìm kiếm phiếu cọc</label>
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
              placeholder="Nhập mã phiếu, tên khách hàng, SĐT"
            />
          </div>
        </div>
      </section>

      {/* Bộ lọc trạng thái dạng chip (giống DatCocTab) */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[{ key: 'all', label: 'Tất cả' }, ...RESIDENCE_STATUS_ORDER.map((s) => ({ key: s, label: RESIDENCE_STATUS_CONFIG[s].chip }))].map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, transition: 'all .15s',
                border: active ? '1px solid #2f6765' : '1px solid #d7dcdc',
                background: active ? '#2f6765' : '#fff',
                color: active ? '#fff' : '#3f494a'
              }}
            >
              {tab.label}
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : '#eef2f3',
                color: active ? '#fff' : '#6f797a',
                borderRadius: '999px', padding: '1px 8px', fontSize: '12px', fontWeight: 700, minWidth: '20px', textAlign: 'center'
              }}>
                {statusCounts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <section className="ktp-table-section">
        <div className="residence-table-head">
          <div>
            <h3>Phiếu cọc chờ ghi nhận cư trú</h3>
            <p>Chỉ các hồ sơ được quản lý duyệt mới chuyển sang bước lập hợp đồng.</p>
          </div>
        </div>
        <div className="residence-table-scroll">
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Phòng / giường</th>
                <th>Ngày nhận</th>
                <th>Hồ sơ cư trú</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6" className="text-center">Đang tải dữ liệu...</td></tr>
              )}
              {!loading && filteredList.length === 0 && (
                <tr><td colSpan="6" className="text-center">Không có phiếu cọc cần ghi nhận cư trú.</td></tr>
              )}
              {!loading && filteredList.map((item) => {
                const editable = canEditResidenceProfile(item.trangThaiHoSo);
                const viewOnly = canViewResidenceProfile(item.trangThaiHoSo);
                return (
                  <tr key={item.maPhieuDatCoc}>
                    <td><strong className="residence-code">{item.maPhieuDatCoc}</strong></td>
                    <td>
                      <strong>{item.hoTenKhachHang}</strong>
                      <span className="residence-subtext">{item.sdt}</span>
                    </td>
                    <td>
                      <strong>{item.viTriThue}</strong>
                      <span className="residence-subtext">{displayRentalType(item.hinhThucThue)}</span>
                    </td>
                    <td>{formatDate(item.thoiGianNhanPhong)}</td>
                    <td><StatusBadge value={item.trangThaiHoSo} /></td>
                    <td className="text-center">
                      {editable ? (
                        <button
                          className="tnp-row-action"
                          type="button"
                          onClick={() => openForm(item)}
                          title="Ghi nhận thông tin cư trú"
                        >
                          Ghi nhận
                        </button>
                      ) : viewOnly ? (
                        <button
                          className="tnp-row-action is-muted"
                          type="button"
                          onClick={() => openForm(item)}
                          title="Xem hồ sơ cư trú đã duyệt"
                        >
                          Xem hồ sơ
                        </button>
                      ) : (
                        <button
                          className="tnp-row-action is-muted"
                          type="button"
                          disabled
                          title="Hồ sơ đang chờ quản lý xử lý"
                        >
                          Chờ duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPhieu && (
        <div className="ktp-modal-overlay" onClick={() => setSelectedPhieu(null)}>
          <div className="ktp-modal residence-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ktp-modal-header-primary">
              <div>
                <h3>Hồ sơ cư trú {selectedPhieu.maPhieuDatCoc}</h3>
                <p className="ktp-modal-header-sub" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Kiểm tra giấy tờ và danh sách người ở trước khi gửi duyệt.</p>
              </div>
              <button className="ktp-modal-close" type="button" onClick={() => setSelectedPhieu(null)}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body">
              {/* isViewOnly: chế độ chỉ xem khi hồ sơ đã được duyệt */}
              {(() => {
                const isViewOnly = selectedPhieu.trangThaiHoSo === 'Đã duyệt cư trú';
                return (
                  <>

              {reviewInfo && reviewInfo.trangThaiHoSo !== 'Chờ duyệt cư trú' && (
                <section className={`residence-feedback-panel ${reviewInfo.trangThaiHoSo === 'Từ chối cư trú' ? 'is-danger' : 'is-warning'}`}>
                  <div>
                    <span>Phản hồi của quản lý</span>
                    <strong>{reviewInfo.trangThaiHoSo}</strong>
                  </div>
                  <p>{reviewInfo.ghiChuQuanLy || 'Quản lý chưa nhập ghi chú chi tiết.'}</p>
                  {reviewInfo.ngayDuyet && <small>Duyệt lúc {formatDate(reviewInfo.ngayDuyet)}</small>}
                </section>
              )}

              <div className="residence-summary" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                <div><span>Khách hàng</span><strong>{selectedPhieu.hoTenKhachHang}</strong></div>
                <div><span>Mã phiếu đăng ký</span><strong>{selectedPhieu.maPhieuYeuCauDangKy || 'Chưa có'}</strong></div>
                <div><span>Vị trí thuê</span><strong>{selectedPhieu.viTriThue}</strong></div>
                <div><span>Ngày nhận phòng</span><strong>{formatDate(selectedPhieu.thoiGianNhanPhong)}</strong></div>
                <div><span>Giới tính phòng</span><strong>{selectedPhieu.gioiTinhChoPhep}</strong></div>
                <div><span>Sức chứa</span><strong>{selectedPhieu.sucChuaToiDa} người</strong></div>
                <div><span>Số người dự kiến</span><strong>{selectedPhieu.soNguoiDuKienO || 1} người</strong></div>
                <div><span>Cơ cấu giới tính</span><strong>{selectedPhieu.soNam || 0} nam, {selectedPhieu.soNu || 0} nữ</strong></div>
                <div><span>Thời hạn thuê</span><strong>{selectedPhieu.thoiHanThue ? `${selectedPhieu.thoiHanThue} tháng` : 'Chưa có'}</strong></div>
                <div><span>Khu vực mong muốn</span><strong>{selectedPhieu.khuVucMongMuon || 'Không ghi nhận'}</strong></div>
              </div>

              <div className="residence-member-head">
                <div>
                  <h4>{isIndividualRental(selectedPhieu) ? 'Người thuê chính' : 'Danh sách người cư trú'}</h4>
                  {isIndividualRental(selectedPhieu) && (
                    <p className="residence-subtext">Đi đơn nên hệ thống tự nạp thông tin khách hàng từ phiếu đăng ký.</p>
                  )}
                </div>
                {!isIndividualRental(selectedPhieu) && !isViewOnly && (
                  <button className="ktp-btn-action" type="button" onClick={addMember}>Thêm người</button>
                )}
              </div>

              <div className="residence-member-list">
                {members.map((member, index) => (
                  <article className="residence-member-card" key={`member-${index}`}>
                    <div className="residence-member-title">
                      <strong>{isIndividualRental(selectedPhieu) ? 'Người thuê chính' : `Người cư trú ${index + 1}`}</strong>
                      {!isIndividualRental(selectedPhieu) && members.length > 1 && !isViewOnly && (
                        <button type="button" onClick={() => removeMember(index)}>Xóa</button>
                      )}
                    </div>
                    {(member.trangThaiDuyet || member.lyDoTuChoi) && (
                      <div className="residence-member-review-note">
                        {member.trangThaiDuyet && (
                          <span className={`residence-member-status ${member.trangThaiDuyet === 'Bị từ chối' ? 'is-danger' : 'is-success'}`}>
                            {member.trangThaiDuyet}
                          </span>
                        )}
                        {member.lyDoTuChoi && (
                          <span className="residence-member-reason">
                            <Icon name="info" />
                            {member.lyDoTuChoi}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="residence-form-grid">
                      <label style={{ gridColumn: 'span 2' }}>
                        <div>Họ tên <span style={{ color: '#dc2626', marginLeft: '4px' }}>(*)</span></div>
                        <input className="ktp-input" value={member.hoTen} readOnly={isViewOnly} onChange={(event) => !isViewOnly && updateMember(index, 'hoTen', event.target.value)} />
                      </label>
                      <label>
                        <div>CCCD <span style={{ color: '#dc2626', marginLeft: '4px' }}>(*)</span></div>
                        <input
                          className="ktp-input"
                          value={member.cccd}
                          maxLength={12}
                          readOnly={isViewOnly}
                          onChange={(event) => {
                            if (isViewOnly) return;
                            const val = event.target.value.replace(/\D/g, '');
                            updateMember(index, 'cccd', val);
                          }}
                        />
                      </label>
                      <label>
                        Ngày sinh
                        <input className="ktp-input" type="date" value={member.ngaySinh} readOnly={isViewOnly} onChange={(event) => !isViewOnly && updateMember(index, 'ngaySinh', event.target.value)} />
                      </label>
                      <label>
                        <div>Giới tính <span style={{ color: '#dc2626', marginLeft: '4px' }}>(*)</span></div>
                        <select className="ktp-input" value={member.gioiTinh} disabled={isViewOnly} onChange={(event) => !isViewOnly && updateMember(index, 'gioiTinh', event.target.value)}>
                          <option>Nam</option>
                          <option>Nữ</option>
                        </select>
                      </label>
                      <label>
                        <div>SĐT <span style={{ color: '#dc2626', marginLeft: '4px' }}>(*)</span></div>
                        <input
                          className="ktp-input"
                          value={member.sdt}
                          maxLength={10}
                          readOnly={isViewOnly}
                          onChange={(event) => {
                            if (isViewOnly) return;
                            const val = event.target.value.replace(/\D/g, '');
                            updateMember(index, 'sdt', val);
                          }}
                        />
                      </label>
                      <label style={{ gridColumn: 'span 2' }}>
                        Email
                        <input className="ktp-input" value={member.email} readOnly={isViewOnly} onChange={(event) => !isViewOnly && updateMember(index, 'email', event.target.value)} />
                      </label>
                      <label>
                        Quốc tịch
                        <input className="ktp-input" value={member.quocTich} readOnly={isViewOnly} onChange={(event) => !isViewOnly && updateMember(index, 'quocTich', event.target.value)} />
                      </label>
                    </div>
                  </article>
                ))}
              </div>

              {!isViewOnly && (
                <>
                  <label className="residence-note">
                    Ghi chú cho quản lý
                    <textarea className="ktp-input" value={note} onChange={(event) => setNote(event.target.value)} rows="3" />
                  </label>

                  <div className="residence-checkline residence-checkline-final">
                    <input
                      id="checkedDocs"
                      type="checkbox"
                      checked={checkedDocs}
                      onChange={(event) => setCheckedDocs(event.target.checked)}
                    />
                    <label htmlFor="checkedDocs">Đã đối chiếu giấy tờ tùy thân bản gốc và thông tin đặt cọc.</label>
                  </div>
                </>
              )}
              </>
            );})()
            }
            </div>

            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" type="button" onClick={() => setSelectedPhieu(null)}>Đóng</button>
              {selectedPhieu.trangThaiHoSo !== 'Đã duyệt cư trú' && (
                <button className="ktp-btn-submit" type="button" onClick={handleSubmit} disabled={loading}>
                  Gửi quản lý duyệt
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
            <h3 className="residence-success-title">Ghi nhận cư trú thành công</h3>
            <p className="residence-success-text">Hệ thống đã lập và gửi hồ sơ cư trú của khách hàng cho quản lý duyệt.</p>
            
            <div className="residence-success-details">
              <div className="residence-success-row">
                <span className="residence-success-label">Mã phiếu cọc</span>
                <span className="residence-success-value">{successInfo.maPhieuDatCoc}</span>
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
                <span className="residence-success-label">Số người ở</span>
                <span className="residence-success-value">{successInfo.soNguoi} người</span>
              </div>
              <div className="residence-success-row">
                <span className="residence-success-label">Trạng thái duyệt</span>
                <span className="residence-success-value">
                  <StatusBadge value="Chờ duyệt cư trú" />
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
