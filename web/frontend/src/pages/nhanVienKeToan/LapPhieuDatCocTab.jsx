import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';

export function Icon({ name, className = '', style = {} }) {
  const shapes = {
    dashboard: <><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>,
    payments: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M6 12h.01M18 12h.01" /></>,
    meeting_room: <><path d="M14 19V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14" /><path d="M22 19H2" /><path d="M10 12h2" /></>,
    receipt_long: <><path d="M14 2H6a2 2 0 0 0-2 2v16l2-2 2 2 2-2 2 2 2-2 2 2V4a2 2 0 0 0-2-2Z" /><path d="M8 6h4M8 10h8M8 14h8" /></>,
    account_balance_wallet: <><path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
    home: <><path d="M3.5 11.2 12 4l8.5 7.2" /><path d="M5.5 10.4V20h13v-9.6" /><path d="M9.5 20v-5.8h5V20" /></>,
    badge: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M8 17a4 4 0 0 1 8 0" /></>,
    article: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="7" x2="17" y1="8" y2="8" /><line x1="7" x2="17" y1="12" y2="12" /><line x1="7" x2="13" y1="16" y2="16" /></>,
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
    event_note: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h8M8 18h5" /></>,
    event_repeat: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M17 14h-5a2 2 0 0 0-2 2v1" /><path d="m14 12 3 2-3 2M7 18h5a2 2 0 0 0 2-2v-1" /><path d="m10 20-3-2 3-2" /></>,
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
    fact_check: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    person_add: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></>,
    directions_bike: <><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><polyline points="12 17.5 12 14 16 14 16 11 10.5 11 8.5 18"/><polyline points="16 11 12 6 9 6"/><polyline points="12 6 12.5 3.5 14.5 3.5"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    print: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
    error_outline: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    hourglass_empty: <><path d="M6 2h12M6 22h12M6 2v6l6 6-6 6v6M18 2v6l-6 6 6 6v6" /></>,
    edit_note: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  };

  return (
    <svg className={`kp-line-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '1em', height: '1em', ...style }}>
      {shapes[name] || shapes.home}
    </svg>
  );
}

const formatTien = (v) => (v == null || v === '' || isNaN(Number(v)) ? '' : Number(v).toLocaleString('vi-VN'));
const formatNgay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};
const formatGio = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
};

// Danh sách gồm phiếu "chờ chốt" (luôn hiện, không giới hạn ngày lập) CỘNG phiếu
// "đã chốt"/"đã hủy" LẬP TRONG HÔM NAY (SP_DanhSachChoTinhTienCoc lọc theo ThoiDiemDatCoc),
// để kế toán xem lại được ngay phiếu vừa xử lý, giống cách Sale chỉ thấy yêu cầu trong ngày.
const STATUS_CONFIG = {
  'Chờ chốt': { chip: 'Chờ chốt', badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Đã chốt':  { chip: 'Đã chốt',  badge: { bg: '#e6f6ec', fg: '#15803d' } },
  'Đã hủy':   { chip: 'Đã hủy',   badge: { bg: '#fdecec', fg: '#b91c1c' } },
};
const STATUS_ORDER = ['Chờ chốt', 'Đã chốt', 'Đã hủy'];

// "Sắp hết hạn" chỉ áp dụng cho phiếu CÒN chờ chốt (quá hạn 24h thì SP_NhaChoCocHetHan tự hủy).
const StatusBadge = ({ trangThaiPhieu, hanChot }) => {
  const cfg = STATUS_CONFIG[trangThaiPhieu] || STATUS_CONFIG['Chờ chốt'];
  let label = cfg.chip;
  let s = cfg.badge;
  if (trangThaiPhieu === 'Chờ chốt' && hanChot) {
    const conLaiGio = (new Date(hanChot).getTime() - Date.now()) / 3600000;
    if (conLaiGio <= 3) {
      label = 'Sắp hết hạn';
      s = { bg: '#fdecec', fg: '#b91c1c' };
    }
  }
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
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

// DC03 - Tính tiền & chốt phiếu đặt cọc (tác nhân: Nhân viên kế toán).
//
// Kế toán KHÔNG còn chọn phòng / hình thức thuê / giường nữa — Sale đã làm ở DC02B,
// vì đó là những thứ phải trao đổi trực tiếp với khách.
//
// Việc của kế toán ở đây: ĐỐI SOÁT BẢNG TÍNH rồi CHỐT phiếu.
//   - Số tiền do trigger TRG_ChiTietDatCoc_TinhGiaThue_Va_SoTienCoc tính sẵn trong DB
//     (đơn giá x số giường x 2 tháng); kế toán không gõ số.
//   - Chốt xong phiếu mới tới tay khách và đồng hồ 24h thanh toán mới bắt đầu chạy.
//   - Không chốt được thì hủy phiếu (kèm lý do) -> nhả giường, Sale lập lại.
//
// GUI: HienThi()      -> getDanhSachChoTinhTien() -> SP_DanhSachChoTinhTienCoc
// GUI: btnChot_Click()-> chotPhieuDatCoc()        -> SP_ChotPhieuDatCoc
export default function LapPhieuDatCocTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState(null);      // phiếu đang đối soát
  const [quyetDinh, setQuyetDinh] = useState('chot');  // 'chot' | 'huy'
  const [lyDoHuy, setLyDoHuy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getDanhSachChoTinhTien();
      setList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách phiếu chờ chốt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDanhSach(); }, [loadDanhSach]);

  // Lọc theo tìm kiếm (chưa áp chip) — dùng để đếm chip
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => (it.hoTen || '').toLowerCase().includes(q)
      || String(it.soDienThoai || '').toLowerCase().includes(q)
      || (it.maDangKy || '').toLowerCase().includes(q)
      || (it.maPhieuDatCoc || '').toLowerCase().includes(q));
  }, [list, search]);

  const counts = useMemo(() => {
    const c = { all: baseFiltered.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    baseFiltered.forEach((it) => { if (c[it.trangThaiPhieu] != null) c[it.trangThaiPhieu] += 1; });
    return c;
  }, [baseFiltered]);

  const filteredList = useMemo(
    () => (statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThaiPhieu === statusFilter)),
    [baseFiltered, statusFilter]
  );

  const chonChip = (key) => setStatusFilter(key);

  useEffect(() => { setPage(1); }, [search, statusFilter]);
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

  const openDoiSoat = (item) => {
    setSelected(item);
    setQuyetDinh('chot');
    setLyDoHuy('');
  };

  const readOnly = !!(selected && selected.trangThaiPhieu !== 'Chờ chốt');
  const huy = quyetDinh === 'huy';
  const guiDuoc = !huy || lyDoHuy.trim().length > 0;

  const handleChot = async () => {
    if (!selected || !guiDuoc) return;
    setSubmitting(true);
    try {
      await datCocApi.chotPhieuDatCoc(selected.maPhieuDatCoc, {
        chot: !huy,
        lyDo: huy ? lyDoHuy.trim() : null
      });
      setSelected(null);
      await loadDanhSach();
      setResult({ type: 'success', title: huy ? 'Đã hủy phiếu đặt cọc.' : 'Đã chốt phiếu đặt cọc.' });
    } catch {
      setResult({ type: 'error', title: huy ? 'Hủy phiếu thất bại.' : 'Chốt phiếu thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ktp-container">
      <section className="ktp-table-section">
        <div style={{ padding: '16px 20px 0 20px' }}>
          <div style={{ marginBottom: '4px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6f797a', marginBottom: '6px' }}>Tìm kiếm</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên khách hàng, SĐT, mã hồ sơ/phiếu cọc..." className="ktp-input" style={{ flex: 1 }} />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>Xóa lọc</button>
              )}
            </div>
          </div>
        </div>

        <StatusFilterTabs
          className="status-pill-tabs-offset"
          items={[{ key: 'all', label: 'Tất cả' }, ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_CONFIG[s].chip }))]}
          activeKey={statusFilter}
          counts={counts}
          onChange={chonChip}
        />

        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã phiếu</th>
              <th>Khách hàng</th>
              <th>Phòng</th>
              <th>Hình thức</th>
              <th>Tiền cọc</th>
              <th>Hạn chốt</th>
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
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có phiếu nào</td></tr>
            ) : pagedList.map((item) => (
              <tr key={item.maPhieuDatCoc}>
                <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maPhieuDatCoc}</td>
                <td>{item.hoTen}</td>
                <td>{item.tenPhong || '—'}</td>
                <td>{item.hinhThucThue}</td>
                <td className="ktp-text-primary" style={{ fontWeight: 600 }}>{formatTien(item.soTienCoc)}đ</td>
                <td>{formatGio(item.hanChot)}</td>
                <td className="text-center"><StatusBadge trangThaiPhieu={item.trangThaiPhieu} hanChot={item.hanChot} /></td>
                <td className="text-center">
                  {item.trangThaiPhieu === 'Chờ chốt' ? (
                    <button className="ktp-btn-action-fill" onClick={() => openDoiSoat(item)}>Đối soát</button>
                  ) : (
                    <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765', padding: '6px 12px', fontSize: '13px' }} onClick={() => openDoiSoat(item)}>
                      Xem chi tiết
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#6f797a', marginRight: 'auto' }}>
            {filteredList.length === 0
              ? 'Không có phiếu'
              : `Hiển thị ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filteredList.length)} / ${filteredList.length} phiếu`}
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

      {/* Modal đối soát & chốt */}
      {selected && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setSelected(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none' }}>
              <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>Tính tiền & chốt phiếu đặt cọc</h3>
              <button className="ktp-modal-close" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body">
              <div className="ktp-grid-2">
                <div className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="person" /> 1. Khách hàng</h4>
                  <div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Họ tên:</span> <span className="ktp-info-value">{selected.hoTen}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">SĐT:</span> <span className="ktp-info-value">{selected.soDienThoai || '—'}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Số người:</span> <span className="ktp-info-value">{selected.soNguoiDuKienO}</span></div>
                  </div>
                </div>
                <div className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="description" /> 2. Phiếu Sale đã lập</h4>
                  <div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Mã phiếu:</span> <span className="ktp-info-value">{selected.maPhieuDatCoc}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Người lập:</span> <span className="ktp-info-value">{selected.nhanVienSaleLap || '—'}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Thời điểm:</span> <span className="ktp-info-value">{formatGio(selected.thoiDiemDatCoc)}</span></div>
                  </div>
                </div>
              </div>

              {/* Phòng/giường CHỈ ĐỌC — Sale chốt với khách, Quản lý đã duyệt */}
              <div className="ktp-section ktp-info-box-outline">
                <h4 className="ktp-section-title"><Icon name="apartment" /> 3. Phòng & hình thức thuê</h4>
                <div className="ktp-info-row"><span className="ktp-info-label">Phòng:</span> <span className="ktp-info-value">{selected.tenPhong || '—'}{selected.tenLoaiPhong ? ` · ${selected.tenLoaiPhong}` : ''}</span></div>
                <div className="ktp-info-row"><span className="ktp-info-label">Giường:</span> <span className="ktp-info-value">{selected.danhSachGiuong || 'Trọn phòng'}</span></div>
                <div className="ktp-info-row"><span className="ktp-info-label">Hình thức thuê:</span> <span className="ktp-info-value">{selected.hinhThucThue}</span></div>
              </div>

              {/* BẢNG TÍNH — việc chính của kế toán */}
              <div className="ktp-section ktp-section-primary">
                <h4 className="ktp-section-title"><Icon name="calculate" /> 4. Bảng tính tiền cọc</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="ktp-flex-between">
                    <span style={{ color: '#6f797a' }}>
                      Đơn giá {selected.hinhThucThue === 'Ghép giường' ? 'mỗi giường' : 'nguyên phòng'}
                    </span>
                    <strong>{formatTien(selected.donGia)}đ/tháng</strong>
                  </div>
                  <div className="ktp-flex-between">
                    <span style={{ color: '#6f797a' }}>
                      {selected.hinhThucThue === 'Ghép giường' ? `Số giường × ${selected.soDong}` : 'Trọn phòng × 1'}
                    </span>
                    <strong>{formatTien(selected.tienThueThang)}đ/tháng</strong>
                  </div>
                  <div className="ktp-flex-between" style={{ paddingTop: '10px', borderTop: '1px dashed #cdd5d6' }}>
                    <span style={{ color: '#6f797a' }}>Tiền cọc <span style={{ fontSize: 12 }}>({selected.soThangCoc} tháng)</span></span>
                    <strong className="ktp-text-primary" style={{ fontSize: '20px' }}>{formatTien(selected.soTienCoc)}đ</strong>
                  </div>
                </div>
              </div>

              {/* QUYẾT ĐỊNH — chỉ hiện khi phiếu còn chờ chốt; phiếu đã chốt/đã hủy chỉ xem lại */}
              {readOnly ? (
                <div className="ktp-section ktp-info-box-outline" style={{ gridColumn: '1 / -1' }}>
                  <h4 className="ktp-section-title"><Icon name="fact_check" /> 5. Trạng thái</h4>
                  <div className="ktp-info-row">
                    <span className="ktp-info-label">Kết quả:</span>
                    <span className="ktp-info-value"><StatusBadge trangThaiPhieu={selected.trangThaiPhieu} hanChot={selected.hanChot} /></span>
                  </div>
                </div>
              ) : (
              <div className="ktp-section ktp-info-box-outline" style={{ gridColumn: '1 / -1' }}>
                <h4 className="ktp-section-title"><Icon name="fact_check" /> 5. Quyết định</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label
                    onClick={() => setQuyetDinh('chot')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: quyetDinh === 'chot' ? '2px solid #00666d' : '1px solid #d7dcdc',
                      background: quyetDinh === 'chot' ? '#eaf4f3' : '#fff' }}
                  >
                    {/* boxSizing tường minh: không có nó, 20px + border cho ra kích thước
                        khác nhau tùy ngữ cảnh CSS -> mỗi màn hình ra một kiểu radio. */}
                    <div style={{ width: '20px', height: '20px', boxSizing: 'border-box', borderRadius: '50%',
                      border: quyetDinh === 'chot' ? '2px solid #00666d' : '2px solid #bec8c9',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {quyetDinh === 'chot' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00666d' }}></div>}
                    </div>
                    <span style={{ fontWeight: 600, color: '#191c1d' }}>Chốt phiếu</span>
                  </label>
                  <label
                    onClick={() => setQuyetDinh('huy')}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: quyetDinh === 'huy' ? '2px solid #00666d' : '1px solid #d7dcdc',
                      background: quyetDinh === 'huy' ? '#eaf4f3' : '#fff' }}
                  >
                    <div style={{ width: '20px', height: '20px', boxSizing: 'border-box', borderRadius: '50%',
                      border: quyetDinh === 'huy' ? '2px solid #00666d' : '2px solid #bec8c9',
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {quyetDinh === 'huy' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00666d' }}></div>}
                    </div>
                    <span style={{ fontWeight: 600, color: '#191c1d' }}>Hủy phiếu</span>
                  </label>
                </div>

                {huy && (
                  <div style={{ marginTop: 14 }}>
                    <label className="ktp-mini-label" style={{ display: 'block', marginBottom: 8 }}>Lý do hủy</label>
                    <textarea
                      className="ktp-input"
                      rows={3}
                      value={lyDoHuy}
                      onChange={(e) => setLyDoHuy(e.target.value)}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>
              )}
            </div>
            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" onClick={() => setSelected(null)} disabled={submitting}>Đóng</button>
              {!readOnly && (
                <button className="ktp-btn-submit" onClick={handleChot} disabled={submitting || !guiDuoc}>
                  {submitting ? 'Đang xử lý...' : (huy ? 'Hủy phiếu' : 'Chốt phiếu')}
                </button>
              )}
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
