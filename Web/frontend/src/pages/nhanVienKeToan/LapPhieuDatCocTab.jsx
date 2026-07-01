import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';
import SoNguoiBadge from '../../components/common/SoNguoiBadge.jsx';

export function Icon({ name, className = '' }) {
  const shapes = {
    dashboard: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
    payments: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M6 12h.01M18 12h.01" /></>,
    meeting_room: <><path d="M14 19V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14" /><path d="M22 19H2" /><path d="M10 12h2" /></>,
    receipt_long: <><path d="M14 2H6a2 2 0 0 0-2 2v16l2-2 2 2 2-2 2 2 2-2 2 2V4a2 2 0 0 0-2-2Z" /><path d="M8 6h4M8 10h8M8 14h8" /></>,
    account_balance_wallet: <><path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10.4V20h13v-9.6" /><path d="M9.5 20v-5.8h5V20" /></>,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    person: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    group: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    description: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
    apartment: <><path d="M22 20V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16" /><path d="M9 20V9h6v11" /><path d="M22 20H2" /></>,
    bed: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></>,
    account_circle: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    warning: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    pending_actions: <><path d="M19 14v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" /><path d="M12 4v4" /><path d="M8 2h8" /><path d="M19 22v-6l2 2" /><path d="M21 16l-2 2" /></>,
    calculate: <><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></>,
    check_circle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    chevron_left: <><path d="m15 18-6-6 6-6"/></>,
    chevron_right: <><path d="m9 18 6-6-6-6"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></>,
    bolt: <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></>,
    water_drop: <><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></>,
    bellhop_bell: <><path d="M10 2h4"/><path d="M12 2v3"/><path d="M19 18a7 7 0 0 0-14 0"/><path d="M2 18h20"/></>,
    filter_list: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    arrow_forward: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    account_balance: <><path d="M3 21h18"/><path d="M3 10h18"/><path d="M5 6l7-3 7 3"/><path d="M4 10v11"/><path d="M20 10v11"/><path d="M8 14v3"/><path d="M12 14v3"/><path d="M16 14v3"/></>,
    money_off: <><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.5L3 3l18 18-5.3-5.3c-.6.3-1.2.5-1.8.6v2c0 .6-.4 1-1 1s-1-.4-1-1v-2h-2"/><path d="M9 7v-2c0-.6.4-1 1-1s1 .4 1 1v2h2a2 2 0 0 1 2 2v2l-6-6z"/></>,
    refresh: <><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></>,
    build: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    cloud_upload: <><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></>,
    verified_user: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
    add_circle: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>,
    delete: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></>,
    assignment_turned_in: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><polyline points="9 14 11 16 15 12" /></>,
    cancel: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
    arrow_back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    electric_bolt: <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></>,
    fact_check: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><polyline points="9 14 11 16 15 12" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    person_add: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
    directions_bike: <><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><polyline points="12 17.5 12 14 16 14 16 11 10.5 11 8.5 18"/><polyline points="16 11 12 6 9 6"/><polyline points="12 6 12.5 3.5 14.5 3.5"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    print: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    error_outline: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    hourglass_empty: <><path d="M6 2h12M6 22h12M6 2v6l6 6-6 6v6M18 2v6l-6 6 6 6v6" /></>,
    meeting_room: <><path d="M14 2H6a2 2 0 0 0-2 2v16h16V4a2 2 0 0 0-2-2h-4z" /><path d="M14 2v20" /><path d="M10 12h2" /></>,
    edit_note: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
    apartment: <><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>
  };

  return (
    <svg className={`kp-line-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '1em', height: '1em' }}>
      {shapes[name] || shapes.home}
    </svg>
  );
}

const formatTien = (v) => (v == null || v === '' || isNaN(Number(v)) ? '' : Number(v).toLocaleString('vi-VN'));
const moTaPhong = (item) => item.tenPhong || item.maPhong || '—';
const formatNgay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

// Cấu hình trạng thái xử lý phía kế toán
const STATUS_CONFIG = {
  'Chờ lập': { chip: 'Chờ lập', badgeLabel: 'Chờ lập', badge: { bg: '#fff4e5', fg: '#b45309' }, action: 'lap' },
  'Đã lập':  { chip: 'Đã lập',  badgeLabel: 'Đã lập',  badge: { bg: '#e6f6ec', fg: '#15803d' }, action: 'chi-tiet' },
};
const STATUS_ORDER = ['Chờ lập', 'Đã lập'];

const StatusBadge = ({ trangThai }) => {
  const cfg = STATUS_CONFIG[trangThai];
  const s = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg ? cfg.badgeLabel : trangThai}
    </span>
  );
};

const PAGE_SIZE = 10;
const pageBtnStyle = (active, disabled) => ({
  minWidth: '34px', height: '34px', padding: '0 10px', borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  border: active ? '1px solid #2f6765' : '1px solid #d7dcdc',
  background: active ? '#2f6765' : '#fff',
  color: active ? '#fff' : (disabled ? '#c4c7c8' : '#3f494a'),
  fontSize: '13px', fontWeight: 600
});

// DC03 - Lập phiếu đặt cọc (tác nhân: Nhân viên kế toán).
// GUI: HienThi() = loadDanhSach() -> getDanhSachChoLapPhieu() -> SP_DanhSachChoLapPhieuDatCoc.
// GUI: btnLapPhieu_Click() -> createPhieuDatCoc() -> SP_LapPhieuDatCoc.
export default function LapPhieuDatCocTab() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // hồ sơ đang lập phiếu + dữ liệu form
  const [selected, setSelected] = useState(null);
  const [phuongThuc, setPhuongThuc] = useState('Tiền mặt');
  const [hinhThuc, setHinhThuc] = useState('Ghep');       // 'Ghep' | 'Nguyen' (chỉ áp dụng nhóm cùng giới)
  const [giuongTrong, setGiuongTrong] = useState([]);
  const [chonGiuong, setChonGiuong] = useState([]);
  const [loadingGiuong, setLoadingGiuong] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Lọc / tìm kiếm / sắp xếp / phân trang + modal xem chi tiết (phiếu đã lập)
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [detailItem, setDetailItem] = useState(null);
  const [page, setPage] = useState(1);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getDanhSachChoLapPhieu();
      setList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách chờ lập phiếu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDanhSach(); }, [loadDanhSach]);

  // Lọc theo tìm kiếm + khoảng ngày (chưa áp chip) — để đếm chip
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tuMs = tuNgay ? new Date(tuNgay).setHours(0, 0, 0, 0) : null;
    const denMs = denNgay ? new Date(denNgay).setHours(23, 59, 59, 999) : null;
    return list.filter((it) => {
      const okSearch = !q
        || (it.hoTen || '').toLowerCase().includes(q)
        || String(it.soDienThoai || '').toLowerCase().includes(q)
        || (it.maDangKy || '').toLowerCase().includes(q)
        || (it.maPhieuDatCoc || '').toLowerCase().includes(q);
      const t = it.ngayDangKy ? new Date(it.ngayDangKy).getTime() : null;
      const okTu = tuMs == null || (t != null && t >= tuMs);
      const okDen = denMs == null || (t != null && t <= denMs);
      return okSearch && okTu && okDen;
    });
  }, [list, search, tuNgay, denNgay]);

  const counts = useMemo(() => {
    const c = { all: baseFiltered.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    baseFiltered.forEach((it) => { if (c[it.trangThai] != null) c[it.trangThai] += 1; });
    return c;
  }, [baseFiltered]);

  const filteredList = useMemo(() => {
    const arr = statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThai === statusFilter);
    return [...arr].sort((a, b) => {
      const da = a.ngayDangKy ? new Date(a.ngayDangKy).getTime() : 0;
      const db = b.ngayDangKy ? new Date(b.ngayDangKy).getTime() : 0;
      return sortDir === 'asc' ? da - db : db - da;
    });
  }, [baseFiltered, statusFilter, sortDir]);

  const coLoc = !!(search || tuNgay || denNgay);
  const xoaLoc = () => { setSearch(''); setTuNgay(''); setDenNgay(''); };
  const defaultSortFor = (key) => (key === 'Chờ lập' ? 'asc' : 'desc');
  const chonChip = (key) => { setStatusFilter(key); setSortDir(defaultSortFor(key)); };

  useEffect(() => { setPage(1); }, [statusFilter, search, tuNgay, denNgay, sortDir]);
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedList = useMemo(
    () => filteredList.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filteredList, pageSafe]
  );
  const pageNumbers = useMemo(() => {
    const arr = [];
    let start = Math.max(1, pageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i += 1) arr.push(i);
    return arr;
  }, [pageSafe, totalPages]);

  const openCreate = async (item) => {
    setSelected(item);
    setPhuongThuc('Tiền mặt');
    setChonGiuong([]);
    const khac = item.khacGioi === 1 || item.khacGioi === true;
    setHinhThuc(khac ? 'Nguyen' : 'Ghep');   // khác giới → buộc nguyên phòng
    setGiuongTrong([]);
    if (item.maPhong) {
      setLoadingGiuong(true);
      try {
        const { data } = await datCocApi.getGiuongTrong(item.maPhong);
        setGiuongTrong(data || []);
      } catch {
        setGiuongTrong([]);
      } finally {
        setLoadingGiuong(false);
      }
    }
  };

  const toggleGiuong = (maGiuong) => {
    setChonGiuong((prev) => prev.includes(maGiuong)
      ? prev.filter((g) => g !== maGiuong)
      : [...prev, maGiuong]);
  };

  const handleLapPhieu = async () => {
    if (!selected) return;
    const khac = selected.khacGioi === 1 || selected.khacGioi === true;
    const ghep = !khac && hinhThuc === 'Ghep';
    if (ghep && chonGiuong.length !== selected.soNguoiDuKienO) {
      setResult({ type: 'error', title: 'Chọn giường chưa đúng.',
        message: `Cần chọn đúng ${selected.soNguoiDuKienO} giường (bằng số người dự kiến ở).` });
      return;
    }
    setSubmitting(true);
    try {
      await datCocApi.create({
        maDangKy: selected.maDangKy,
        maNhanVienKeToan: user?.maNguoiDung,
        phuongThucThanhToan: phuongThuc,
        danhSachGiuong: ghep ? chonGiuong : []   // [] = thuê nguyên phòng
      });
      setSelected(null);
      await loadDanhSach();
      setResult({
        type: 'success',
        title: 'Lập phiếu thành công!',
        message: 'Đã tạo phiếu đặt cọc (hạn thanh toán 24h). Tiền cọc = 2 tháng tiền thuê.'
      });
    } catch (err) {
      setResult({ type: 'error', title: 'Lập phiếu thất bại.', message: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Giá trị suy diễn cho form (an toàn khi selected = null)
  const khacGioi = selected ? (selected.khacGioi === 1 || selected.khacGioi === true) : false;
  const isGhep = !khacGioi && hinhThuc === 'Ghep';
  const donGiaThue = isGhep ? Number(selected?.giaThueTheoGiuong || 0) : Number(selected?.giaThueNguyenPhong || 0);
  const soGiuongHienTai = isGhep ? chonGiuong.length : 1;
  const soTienCocTinh = donGiaThue * soGiuongHienTai * 2;

  return (
    <div className="ktp-container">
      <section className="ktp-table-section">
        {/* Thanh tìm kiếm + lọc ngày + sắp xếp */}
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên khách hàng, SĐT, mã hồ sơ/phiếu cọc..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Từ ngày</label>
            <input type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Đến ngày</label>
            <input type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 170px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Sắp xếp</label>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }}>
              <option value="desc">Ngày đăng ký: mới nhất</option>
              <option value="asc">Ngày đăng ký: cũ nhất</option>
            </select>
          </div>
          {coLoc && (
            <button type="button" onClick={xoaLoc} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        {/* Segmented control: lọc theo trạng thái + số đếm */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', paddingLeft: '16px' }}>
          {[{ key: 'all', label: 'Tất cả' }, ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_CONFIG[s].chip }))].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => chonChip(tab.key)}
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
                <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#eef2f3', color: active ? '#fff' : '#6f797a', borderRadius: '999px', padding: '1px 8px', fontSize: '12px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã hồ sơ</th>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Phòng</th>
              <th>Số người</th>
              <th>Giá thuê/giường</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải...</td></tr>
            ) : loadError ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#b3261e' }}>{loadError}</td></tr>
            ) : filteredList.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có hồ sơ nào ở nhóm này</td></tr>
            ) : pagedList.map((item) => {
              const action = STATUS_CONFIG[item.trangThai]?.action;
              return (
                <tr key={item.maDangKy}>
                  <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maDangKy}</td>
                  <td>{item.hoTen}</td>
                  <td>{item.soDienThoai}</td>
                  <td>{moTaPhong(item)}</td>
                  <td>
                    <SoNguoiBadge
                      soNguoi={item.soNguoiDuKienO}
                      soNam={item.soNam}
                      soNu={item.soNu}
                      khacGioi={item.khacGioi === 1 || item.khacGioi === true}
                    />
                  </td>
                  <td className="ktp-text-primary" style={{ fontWeight: 600 }}>{item.giaThueTheoGiuong != null ? `${formatTien(item.giaThueTheoGiuong)}đ` : '—'}</td>
                  <td className="text-center"><StatusBadge trangThai={item.trangThai} /></td>
                  <td className="text-center">
                    {action === 'lap' ? (
                      <button className="ktp-btn-action-fill" onClick={() => openCreate(item)}>Lập phiếu</button>
                    ) : (
                      <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765', padding: '6px 12px', fontSize: '13px' }} onClick={() => setDetailItem(item)}>Xem chi tiết</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#6f797a', marginRight: 'auto' }}>
            {filteredList.length === 0
              ? 'Không có hồ sơ'
              : `Hiển thị ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filteredList.length)} / ${filteredList.length} hồ sơ`}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button type="button" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)} style={pageBtnStyle(false, pageSafe <= 1)}>‹</button>
              {pageNumbers.map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)} style={pageBtnStyle(n === pageSafe, false)}>{n}</button>
              ))}
              <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)} style={pageBtnStyle(false, pageSafe >= totalPages)}>›</button>
            </div>
          )}
        </div>
      </section>

      {/* Modal Lập phiếu đặt cọc */}
      {selected && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setSelected(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>Lập phiếu đặt cọc</h3>
              <button className="ktp-modal-close" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body">
              <div className="ktp-grid-2">
                <div className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="person" /> 1. Thông tin khách hàng</h4>
                  <div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Họ tên:</span> <span className="ktp-info-value">{selected.hoTen}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">SĐT:</span> <span className="ktp-info-value">{selected.soDienThoai || '—'}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Mã khách hàng:</span> <span className="ktp-info-value">{selected.maKhachHang || '—'}</span></div>
                  </div>
                </div>
                <div className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="description" /> 2. Thông tin hồ sơ</h4>
                  <div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Mã hồ sơ:</span> <span className="ktp-info-value">{selected.maDangKy}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Số người:</span> <span className="ktp-info-value">{selected.soNguoiDuKienO} ({selected.soNam ?? 0} nam, {selected.soNu ?? 0} nữ){khacGioi ? ' · khác giới' : ''}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Trạng thái:</span> <span className="ktp-info-value ktp-text-success">Xác nhận cọc</span></div>
                  </div>
                </div>
              </div>
              <div className="ktp-section ktp-info-box-outline">
                <h4 className="ktp-section-title"><Icon name="apartment" /> 3. Phòng & hình thức thuê</h4>
                <div className="ktp-grid-3" style={{ marginBottom: 12 }}>
                  <div><p className="ktp-mini-label">Phòng</p><p className="ktp-mini-value">{moTaPhong(selected)} ({selected.gioiTinhChoPhep})</p></div>
                  <div><p className="ktp-mini-label">Sức chứa</p><p className="ktp-mini-value">{selected.sucChuaToiDa}</p></div>
                  <div><p className="ktp-mini-label">Còn trống</p><p className="ktp-mini-value">{selected.soChoTrong}</p></div>
                </div>

                {khacGioi ? (
                  <div className="ktp-warning-box"><Icon name="warning" /><span>Nhóm có cả nam và nữ → bắt buộc thuê <strong>nguyên phòng</strong> (phòng phải trống hoàn toàn).</span></div>
                ) : (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <label><input type="radio" name="hinhThuc" checked={hinhThuc === 'Ghep'} onChange={() => setHinhThuc('Ghep')} /> Ghép giường</label>
                    <label><input type="radio" name="hinhThuc" checked={hinhThuc === 'Nguyen'} onChange={() => setHinhThuc('Nguyen')} /> Nguyên phòng</label>
                  </div>
                )}

                {isGhep && (
                  <div>
                    <p className="ktp-mini-label">Chọn giường — cần đúng {selected.soNguoiDuKienO} giường (phòng dành cho {selected.gioiTinhChoPhep})</p>
                    {loadingGiuong ? (
                      <p style={{ color: '#6f797a' }}>Đang tải giường trống...</p>
                    ) : giuongTrong.length === 0 ? (
                      <p style={{ color: '#b3261e' }}>Phòng không còn giường trống.</p>
                    ) : (
                      <div className="kp-bed-grid">
                        {giuongTrong.map((g) => {
                          const isSelected = chonGiuong.includes(g.maGiuong);
                          const isFull = chonGiuong.length >= selected.soNguoiDuKienO;
                          const isDisabled = !isSelected && isFull;
                          return (
                            <label key={g.maGiuong} className={`kp-bed-card ${isSelected ? 'is-selected' : ''} ${isDisabled ? 'is-disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => {
                                  if (!isDisabled) toggleGiuong(g.maGiuong);
                                }}
                                className="kp-bed-input-hidden"
                              />
                              <div className="kp-bed-card-inner">
                                <span className="kp-bed-icon"><Icon name="bed" /></span>
                                <span className="kp-bed-label">{g.maGiuong}</span>
                              </div>
                              <span className="kp-bed-check"><Icon name="check" /></span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p style={{ fontSize: 12, marginTop: 6, fontWeight: chonGiuong.length === selected.soNguoiDuKienO ? '600' : 'normal', color: chonGiuong.length === selected.soNguoiDuKienO ? '#2f6765' : '#a43c12' }}>
                      Đã chọn {chonGiuong.length}/{selected.soNguoiDuKienO} giường {chonGiuong.length === selected.soNguoiDuKienO ? '· Đã đủ giường' : ''}
                    </p>
                  </div>
                )}
              </div>
              <div className="ktp-section ktp-section-primary">
                <h4 className="ktp-section-title"><Icon name="calculate" /> 4. Điều khoản & Cọc</h4>
                <div className="ktp-grid-2">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="ktp-flex-between"><span style={{ color: '#6f797a' }}>Hình thức:</span><strong>{khacGioi ? 'Nguyên phòng (khác giới)' : (isGhep ? 'Ghép giường' : 'Nguyên phòng')}</strong></div>
                    <div className="ktp-flex-between"><span style={{ color: '#6f797a' }}>Đơn giá thuê:</span><strong>{formatTien(donGiaThue)}đ{isGhep ? '/giường' : ''}</strong></div>
                    <div className="ktp-flex-between"><span style={{ color: '#6f797a' }}>Tiền cọc (2 tháng):</span><strong className="ktp-text-primary" style={{ fontSize: '18px' }}>{formatTien(soTienCocTinh)}đ</strong></div>
                    <div className="ktp-warning-box"><Icon name="warning" /><span>Tiền cọc tự tính = đơn giá × số giường × 2, không chỉnh tay.</span></div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="ktp-mini-label" style={{ marginBottom: '8px', display: 'block' }}>Phương thức thanh toán</label>
                      <div className="kp-radio-card-group">
                        <label className={`kp-radio-card ${phuongThuc === 'Tiền mặt' ? 'is-selected' : ''}`}>
                          <input
                            type="radio"
                            name="phuongThuc"
                            value="Tiền mặt"
                            checked={phuongThuc === 'Tiền mặt'}
                            onChange={(e) => setPhuongThuc(e.target.value)}
                            className="kp-radio-input-hidden"
                          />
                          <div className="kp-radio-card-content">
                            <div className="kp-radio-card-icon">
                              <Icon name="account_balance_wallet" />
                            </div>
                            <div className="kp-radio-card-text">
                              <div className="kp-radio-card-title">Tiền mặt</div>
                              <div className="kp-radio-card-desc">Thanh toán trực tiếp</div>
                            </div>
                          </div>
                          <div className="kp-radio-card-check">
                            <Icon name="check" />
                          </div>
                        </label>

                        <label className={`kp-radio-card ${phuongThuc === 'Chuyển khoản' ? 'is-selected' : ''}`}>
                          <input
                            type="radio"
                            name="phuongThuc"
                            value="Chuyển khoản"
                            checked={phuongThuc === 'Chuyển khoản'}
                            onChange={(e) => setPhuongThuc(e.target.value)}
                            className="kp-radio-input-hidden"
                          />
                          <div className="kp-radio-card-content">
                            <div className="kp-radio-card-icon">
                              <Icon name="account_balance" />
                            </div>
                            <div className="kp-radio-card-text">
                              <div className="kp-radio-card-title">Chuyển khoản</div>
                              <div className="kp-radio-card-desc">Qua thẻ ngân hàng</div>
                            </div>
                          </div>
                          <div className="kp-radio-card-check">
                            <Icon name="check" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '2px dashed #bec8c9', paddingTop: '16px' }}>
                <div className="ktp-summary-box ktp-grid-3">
                  <div><p className="ktp-mini-label">Mã phiếu</p><p style={{ fontSize: '14px', fontStyle: 'italic', color: '#6f797a', margin: 0 }}>Tự động sinh sau khi lập</p></div>
                  <div><p className="ktp-mini-label">Hạn thanh toán</p><p className="ktp-text-error" style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>24h kể từ khi lập</p></div>
                  <div><p className="ktp-mini-label">Trạng thái sau lập</p><p style={{ fontSize: '14px', fontWeight: '700', color: '#a43c12', textTransform: 'uppercase', margin: 0 }}>Chờ TT</p></div>
                </div>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#6f797a', marginTop: '12px' }}>
                  Thông báo sẽ được gửi tự động đến: <strong>Khách hàng</strong> & <strong>Nhân viên Sale</strong>
                </p>
              </div>
            </div>
            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" onClick={() => setSelected(null)} disabled={submitting}>Hủy</button>
              <button className="ktp-btn-submit" onClick={handleLapPhieu} disabled={submitting}>{submitting ? 'Đang lập...' : 'Lập phiếu đặt cọc'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết phiếu đã lập (read-only) */}
      {detailItem && (
        <div className="ktp-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="ktp-modal" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header">
              <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Chi tiết phiếu đặt cọc</h3>
              <button className="ktp-btn-close" onClick={() => setDetailItem(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: '#2f6765', fontSize: '18px' }}>{detailItem.maPhieuDatCoc || detailItem.maDangKy}</span>
                <StatusBadge trangThai={detailItem.trangThai} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Mã hồ sơ', detailItem.maDangKy],
                  ['Khách hàng', detailItem.hoTen],
                  ['Số điện thoại', detailItem.soDienThoai || '—'],
                  ['Phòng', moTaPhong(detailItem)],
                  ['Hình thức thuê', detailItem.hinhThucThuePhieu || '—'],
                  ['Số tiền cọc', detailItem.soTienCocPhieu != null ? `${formatTien(detailItem.soTienCocPhieu)}đ` : '—'],
                  ['Trạng thái thanh toán', detailItem.trangThaiThanhToan || '—'],
                  ['Ngày lập phiếu', formatNgay(detailItem.thoiDiemDatCoc)]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                    <span style={{ color: '#6f797a', fontSize: '14px' }}>{k}</span>
                    <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="ktp-btn-cancel" onClick={() => setDetailItem(null)} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '8px 24px' }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResultModal
        open={!!result}
        type={result?.type}
        title={result?.title}
        message={result?.message}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
