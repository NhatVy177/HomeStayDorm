import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';
import SoNguoiBadge from '../../components/common/SoNguoiBadge.jsx';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';

// Hiển thị phòng/giường gọn theo dữ liệu trả về từ SP_DanhSachDatCocSale.
const moTaPhong = (item) => {
  const phong = item.tenPhong || item.maPhong;
  if (!phong) return '—';
  return item.maGiuong ? `${phong} - ${item.maGiuong}` : phong;
};

const formatTien = (v) => (v == null || v === '' || isNaN(Number(v)) ? '' : Number(v).toLocaleString('vi-VN'));
const formatHan = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
};
const formatNgay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

// Nguồn cấu hình DUY NHẤT cho từng trạng thái phiếu đăng ký: nhãn chip, nhãn badge,
// màu badge và loại nút thao tác. Thêm/sửa trạng thái chỉ cần đụng ở đây.
const STATUS_CONFIG = {
  'Chờ tiếp nhận':    { chip: 'Chờ gửi',    badgeLabel: 'Chờ gửi',           badge: { bg: '#fff4e5', fg: '#b45309' }, action: 'gui' },
  'Chờ xác nhận cọc': { chip: 'Chờ duyệt',  badgeLabel: 'Chờ quản lý duyệt', badge: { bg: '#e8f1ff', fg: '#1d4ed8' }, action: 'chi-tiet' },
  'Xác nhận cọc':     { chip: 'Đã duyệt',   badgeLabel: 'Đã duyệt',          badge: { bg: '#e6f6ec', fg: '#15803d' }, action: 'chi-tiet' },
  'Từ chối':          { chip: 'Bị từ chối', badgeLabel: 'Bị từ chối',        badge: { bg: '#fdecec', fg: '#b91c1c' }, action: 'ly-do' },
};
// Thứ tự ưu tiên xử lý (việc cần làm trước lên đầu) — dùng cho chip lọc.
const STATUS_ORDER = ['Chờ tiếp nhận', 'Chờ xác nhận cọc', 'Xác nhận cọc', 'Từ chối'];

const StatusBadge = ({ trangThai }) => {
  const cfg = STATUS_CONFIG[trangThai];
  const s = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg ? cfg.badgeLabel : trangThai}
    </span>
  );
};

const khacGioiOf = (item) => (Number(item.soNam) || 0) > 0 && (Number(item.soNu) || 0) > 0;

// Cấu hình trạng thái thanh toán (DC04 - ghi nhận chứng từ)
const CT_STATUS_CONFIG = {
  'Chờ TT':  { chip: 'Chờ thanh toán', badgeLabel: 'Chờ TT',  badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Đã TT':   { chip: 'Đã thanh toán',  badgeLabel: 'Đã TT',   badge: { bg: '#e6f6ec', fg: '#15803d' } },
  'Hết hạn': { chip: 'Hết hạn',        badgeLabel: 'Hết hạn', badge: { bg: '#fdecec', fg: '#b91c1c' } },
};
const CT_STATUS_ORDER = ['Chờ TT', 'Đã TT', 'Hết hạn'];
const CtBadge = ({ trangThai }) => {
  const cfg = CT_STATUS_CONFIG[trangThai];
  const s = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg ? cfg.badgeLabel : (trangThai || '—')}
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

export default function DatCocTab() {
  const [activeSubTab, setActiveSubTab] = useState('gui-yeu-cau');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // Lọc theo trạng thái (segmented control) + modal xem chi tiết / lý do từ chối.
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailItem, setDetailItem] = useState(null);
  // Bộ lọc/tìm kiếm/sắp xếp (áp dụng client-side trên danh sách đã tải).
  const [search, setSearch] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [sortDir, setSortDir] = useState('desc'); // 'desc' = mới nhất trước, 'asc' = cũ nhất trước

  // Tầng GUI - HienThi(): tải danh sách hồ sơ "Chờ tiếp nhận" cần gửi yêu cầu đặt cọc.
  const [yeuCauList, setYeuCauList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Popup thông báo kết quả (thành công/thất bại) thay cho alert()
  const [result, setResult] = useState(null); // { type, title, message }

  // DC04 - Ghi nhận chứng từ thanh toán cọc
  const [chungTuList, setChungTuList] = useState([]);
  const [loadingCT, setLoadingCT] = useState(false);
  const [ctError, setCtError] = useState('');
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [ctForm, setCtForm] = useState({ ghiChu: '' });
  const [ctFile, setCtFile] = useState(null); // file chứng từ (chỉ lưu tên - chưa có storage backend)
  const fileInputRef = useRef(null);

  // Lọc / tìm kiếm / sắp xếp / phân trang cho tab chứng từ (DC04)
  const [ctStatus, setCtStatus] = useState('Chờ TT'); // mặc định nhóm cần xử lý
  const [ctSearch, setCtSearch] = useState('');
  const [ctSortDir, setCtSortDir] = useState('asc');   // theo hạn TT: gần nhất trước
  const [ctPage, setCtPage] = useState(1);
  const [ctDetail, setCtDetail] = useState(null);

  const loadChungTu = useCallback(async () => {
    setLoadingCT(true);
    setCtError('');
    try {
      const { data } = await datCocApi.getDanhSachChoGhiNhanChungTu();
      setChungTuList(data || []);
    } catch (err) {
      setCtError(err.response?.data?.message || 'Không tải được danh sách phiếu cọc');
    } finally {
      setLoadingCT(false);
    }
  }, []);

  // DC04 - btnGhiNhan_Click(): gửi minh chứng -> capNhatMinhChung -> SP_CapNhatMinhChungThanhToanCoc.
  const handleGhiNhanChungTu = async () => {
    if (!selectedPhieu) return;
    if (!ctFile) {
      setResult({ type: 'error', title: 'Thiếu chứng từ.', message: 'Vui lòng tải lên ảnh/PDF chứng từ thanh toán.' });
      return;
    }
    setSubmitting(true);
    try {
      // Gửi multipart: file chứng từ (ảnh/PDF) + ghi chú. Chỉ lưu ĐƯỜNG DẪN file vào DB.
      const fd = new FormData();
      fd.append('file', ctFile);
      if (ctForm.ghiChu.trim()) fd.append('ghiChu', ctForm.ghiChu.trim());
      await datCocApi.capNhatMinhChung(selectedPhieu.maPhieuDatCoc, fd);
      setShowUploadModal(false);
      setSelectedPhieu(null);
      await loadChungTu();
      setResult({ type: 'success', title: 'Đã ghi nhận!', message: 'Chứng từ thanh toán đã gửi đến Quản lý để xác nhận.' });
    } catch (err) {
      setResult({ type: 'error', title: 'Ghi nhận thất bại.', message: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const loadYeuCau = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getAll();
      // Giữ toàn bộ trạng thái SP trả về (đã sắp theo ưu tiên xử lý); lọc ở client bằng chip.
      setYeuCauList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách phiếu đăng ký');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadYeuCau(); }, [loadYeuCau]);
  useEffect(() => { if (activeSubTab === 'ghi-nhan-chung-tu') loadChungTu(); }, [activeSubTab, loadChungTu]);

  // Lọc theo tìm kiếm + khoảng ngày (chưa áp chip trạng thái) — dùng để đếm cho chip.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tuMs = tuNgay ? new Date(tuNgay).setHours(0, 0, 0, 0) : null;
    const denMs = denNgay ? new Date(denNgay).setHours(23, 59, 59, 999) : null;
    return yeuCauList.filter((it) => {
      const okSearch = !q
        || (it.hoTen || '').toLowerCase().includes(q)
        || String(it.soDienThoai || '').toLowerCase().includes(q)
        || (it.maDangKy || '').toLowerCase().includes(q);
      const t = it.ngayDangKy ? new Date(it.ngayDangKy).getTime() : null;
      const okTu = tuMs == null || (t != null && t >= tuMs);
      const okDen = denMs == null || (t != null && t <= denMs);
      return okSearch && okTu && okDen;
    });
  }, [yeuCauList, search, tuNgay, denNgay]);

  // Số đếm cho từng chip (phản ánh cả tìm kiếm/lọc ngày đang áp)
  const counts = useMemo(() => {
    const c = { all: baseFiltered.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    baseFiltered.forEach((it) => { if (c[it.trangThaiDangKy] != null) c[it.trangThaiDangKy] += 1; });
    return c;
  }, [baseFiltered]);

  // Áp chip trạng thái + sắp xếp theo ngày (chiều tùy chọn)
  const filteredList = useMemo(() => {
    const arr = statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThaiDangKy === statusFilter);
    return [...arr].sort((a, b) => {
      const da = a.ngayDangKy ? new Date(a.ngayDangKy).getTime() : 0;
      const db = b.ngayDangKy ? new Date(b.ngayDangKy).getTime() : 0;
      return sortDir === 'asc' ? da - db : db - da;
    });
  }, [baseFiltered, statusFilter, sortDir]);

  const coLoc = !!(search || tuNgay || denNgay);
  const xoaLoc = () => { setSearch(''); setTuNgay(''); setDenNgay(''); };

  // Chiều sắp xếp mặc định theo nhóm: "Chờ gửi" -> cũ nhất (FIFO, xử lý khách chờ lâu trước);
  // các nhóm còn lại -> mới nhất. Bấm chip sẽ tự áp mặc định này (vẫn đổi tay được sau đó).
  const defaultSortFor = (key) => (key === 'Chờ tiếp nhận' ? 'asc' : 'desc');
  const chonChip = (key) => { setStatusFilter(key); setSortDir(defaultSortFor(key)); };

  // Phân trang (client-side)
  const [page, setPage] = useState(1);
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

  const openDetail = (item) => setDetailItem(item);

  // ---- DC04: lọc/đếm/sort/phân trang cho danh sách chứng từ ----
  const ctBase = useMemo(() => {
    const q = ctSearch.trim().toLowerCase();
    return chungTuList.filter((it) => !q
      || (it.hoTen || '').toLowerCase().includes(q)
      || String(it.soDienThoai || '').toLowerCase().includes(q)
      || (it.maPhieuDatCoc || '').toLowerCase().includes(q));
  }, [chungTuList, ctSearch]);

  const ctCounts = useMemo(() => {
    const c = { all: ctBase.length };
    CT_STATUS_ORDER.forEach((s) => { c[s] = 0; });
    ctBase.forEach((it) => { if (c[it.trangThaiThanhToan] != null) c[it.trangThaiThanhToan] += 1; });
    return c;
  }, [ctBase]);

  const ctFiltered = useMemo(() => {
    const arr = ctStatus === 'all' ? ctBase : ctBase.filter((it) => it.trangThaiThanhToan === ctStatus);
    return [...arr].sort((a, b) => {
      const da = a.thoiHanThanhToan ? new Date(a.thoiHanThanhToan).getTime() : 0;
      const db = b.thoiHanThanhToan ? new Date(b.thoiHanThanhToan).getTime() : 0;
      return ctSortDir === 'asc' ? da - db : db - da;
    });
  }, [ctBase, ctStatus, ctSortDir]);

  const ctChonChip = (key) => { setCtStatus(key); setCtSortDir(key === 'Chờ TT' ? 'asc' : 'desc'); };

  useEffect(() => { setCtPage(1); }, [ctStatus, ctSearch, ctSortDir]);
  const ctTotalPages = Math.max(1, Math.ceil(ctFiltered.length / PAGE_SIZE));
  const ctPageSafe = Math.min(ctPage, ctTotalPages);
  const ctPaged = useMemo(
    () => ctFiltered.slice((ctPageSafe - 1) * PAGE_SIZE, ctPageSafe * PAGE_SIZE),
    [ctFiltered, ctPageSafe]
  );
  const ctPageNumbers = useMemo(() => {
    const arr = [];
    let start = Math.max(1, ctPageSafe - 2);
    const end = Math.min(ctTotalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i += 1) arr.push(i);
    return arr;
  }, [ctPageSafe, ctTotalPages]);

  // Chỉ phiếu 'Chờ TT' còn hạn mới cho ghi nhận chứng từ
  const canGhiNhan = (it) => it.trangThaiThanhToan === 'Chờ TT'
    && (!it.thoiHanThanhToan || new Date(it.thoiHanThanhToan).getTime() >= Date.now());

  const openGhiNhan = (item) => {
    setSelectedPhieu(item);
    setCtForm({ ghiChu: '' });
    setCtFile(null);
    setShowUploadModal(true);
  };

  // Tầng GUI - btnGui_Click(): gọi service guiYeuCauDatCoc qua API.
  const handleGuiYeuCau = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await datCocApi.guiYeuCauDatCoc({ maDangKy: selectedItem.maDangKy });
      setShowSendModal(false);
      setSelectedItem(null);
      await loadYeuCau();
      setResult({
        type: 'success',
        title: 'Gửi thành công!',
        message: 'Yêu cầu đặt cọc đã được chuyển đến bộ phận Quản lý để xử lý.'
      });
    } catch (err) {
      setResult({
        type: 'error',
        title: 'Gửi thất bại.',
        message: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ktp-container">
      {/* Title removed per request */}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e0e3e3', marginBottom: '24px' }}>
        <div 
          onClick={() => setActiveSubTab('gui-yeu-cau')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'gui-yeu-cau' ? '600' : '500', color: activeSubTab === 'gui-yeu-cau' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'gui-yeu-cau' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Gửi yêu cầu đặt cọc
        </div>
        <div 
          onClick={() => setActiveSubTab('ghi-nhan-chung-tu')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'ghi-nhan-chung-tu' ? '600' : '500', color: activeSubTab === 'ghi-nhan-chung-tu' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'ghi-nhan-chung-tu' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Ghi nhận chứng từ thanh toán
        </div>
      </div>

      {activeSubTab === 'gui-yeu-cau' && (
        <section>
          {/* Thanh tìm kiếm + lọc ngày + sắp xếp */}
          <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên khách hàng, SĐT hoặc mã phiếu..."
                className="ktp-input"
                style={{ width: '100%', backgroundColor: '#fff' }}
              />
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
              <button
                type="button"
                onClick={xoaLoc}
                className="ktp-btn-action"
                style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Segmented control: lọc theo trạng thái, kèm số đếm (căn thẳng lề trái với ô tìm kiếm) */}
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
                <th>SĐT</th>
                <th>Phòng dự kiến</th>
                <th>Số người</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải...</td></tr>
              ) : loadError ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#b3261e' }}>{loadError}</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có phiếu nào ở nhóm này</td></tr>
              ) : pagedList.map(item => {
                const action = STATUS_CONFIG[item.trangThaiDangKy]?.action;
                return (
                  <tr key={item.maDangKy}>
                    <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maDangKy}</td>
                    <td style={{ color: '#191c1d' }}>{item.hoTen}</td>
                    <td style={{ color: '#191c1d' }}>{item.soDienThoai}</td>
                    <td style={{ color: '#191c1d' }}>{moTaPhong(item)}</td>
                    <td>
                      <SoNguoiBadge
                        soNguoi={item.soNguoiDuKienO}
                        soNam={item.soNam}
                        soNu={item.soNu}
                        khacGioi={khacGioiOf(item)}
                      />
                    </td>
                    <td className="text-center">
                      <StatusBadge trangThai={item.trangThaiDangKy} />
                    </td>
                    <td className="text-center">
                      {action === 'gui' && (
                        <button className="ktp-btn-action-fill" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => { setSelectedItem(item); setShowSendModal(true); }}>
                          Gửi yêu cầu
                        </button>
                      )}
                      {action === 'chi-tiet' && (
                        <button className="ktp-btn-action" style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765' }} onClick={() => openDetail(item)}>
                          Xem chi tiết
                        </button>
                      )}
                      {action === 'ly-do' && (
                        <button className="ktp-btn-action" style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #f0c0c0', backgroundColor: '#fff', color: '#b91c1c' }} onClick={() => openDetail(item)}>
                          Xem lý do
                        </button>
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
      )}

      {activeSubTab === 'ghi-nhan-chung-tu' && (
        <section>
          {/* Thanh tìm kiếm + sắp xếp */}
          <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: '2 1 260px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
              <input type="text" value={ctSearch} onChange={(e) => setCtSearch(e.target.value)} placeholder="Tên khách hàng, SĐT hoặc mã phiếu cọc..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Sắp xếp</label>
              <select value={ctSortDir} onChange={(e) => setCtSortDir(e.target.value)} className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }}>
                <option value="asc">Hạn thanh toán: gần nhất</option>
                <option value="desc">Hạn thanh toán: xa nhất</option>
              </select>
            </div>
            {ctSearch && (
              <button type="button" onClick={() => setCtSearch('')} className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
            )}
          </div>

          {/* Segmented control theo trạng thái thanh toán */}
          <StatusFilterTabs
            className="status-pill-tabs-offset"
            items={[{ key: 'all', label: 'Tất cả' }, ...CT_STATUS_ORDER.map((s) => ({ key: s, label: CT_STATUS_CONFIG[s].chip }))]}
            activeKey={ctStatus}
            counts={ctCounts}
            onChange={ctChonChip}
          />

          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu cọc</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Cần thanh toán</th>
                <th>Hạn thanh toán</th>
                <th className="text-center">Trạng thái</th>
                <th>Chứng từ</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingCT ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải...</td></tr>
              ) : ctError ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#b3261e' }}>{ctError}</td></tr>
              ) : ctFiltered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có phiếu cọc nào ở nhóm này</td></tr>
              ) : ctPaged.map(item => {
                const daCoChungTu = !!(item.chungTuThanhToan && String(item.chungTuThanhToan).trim());
                return (
                  <tr key={item.maPhieuDatCoc}>
                    <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maPhieuDatCoc}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#191c1d' }}>{item.hoTen}</div>
                      <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.soDienThoai || ''}</div>
                    </td>
                    <td>
                      <div style={{ backgroundColor: '#e0e3e3', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '12px', fontWeight: '600' }}>{moTaPhong(item)}</div>
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#191c1d' }}>{formatTien(item.soTienCoc)}đ</td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#3f494a' }}>{formatHan(item.thoiHanThanhToan)}</div>
                    </td>
                    <td className="text-center">
                      <CtBadge trangThai={item.trangThaiThanhToan} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: daCoChungTu ? '#2f6765' : '#6f797a' }}>
                        <Icon name={daCoChungTu ? 'check_circle' : 'description'} style={{ fontSize: '16px' }} />
                        {daCoChungTu ? 'Đã có' : 'Chưa có'}
                      </div>
                    </td>
                    <td className="text-center">
                      {canGhiNhan(item) ? (
                        <button className="ktp-btn-action-fill" style={{ backgroundColor: '#2f6765', padding: '6px 12px', fontSize: '12px' }} onClick={() => openGhiNhan(item)}>
                          {daCoChungTu ? 'Cập nhật lại' : 'Ghi nhận chứng từ'}
                        </button>
                      ) : (
                        <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765', padding: '6px 12px', fontSize: '12px' }} onClick={() => setCtDetail(item)}>
                          Xem chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#6f797a', marginRight: 'auto' }}>
              {ctFiltered.length === 0
                ? 'Không có phiếu'
                : `Hiển thị ${(ctPageSafe - 1) * PAGE_SIZE + 1}–${Math.min(ctPageSafe * PAGE_SIZE, ctFiltered.length)} / ${ctFiltered.length} phiếu`}
            </span>
            {ctTotalPages > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button type="button" disabled={ctPageSafe <= 1} onClick={() => setCtPage(ctPageSafe - 1)} style={pageBtnStyle(false, ctPageSafe <= 1)}>‹</button>
                {ctPageNumbers.map((n) => (
                  <button key={n} type="button" onClick={() => setCtPage(n)} style={pageBtnStyle(n === ctPageSafe, false)}>{n}</button>
                ))}
                <button type="button" disabled={ctPageSafe >= ctTotalPages} onClick={() => setCtPage(ctPageSafe + 1)} style={pageBtnStyle(false, ctPageSafe >= ctTotalPages)}>›</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modal xem chi tiết phiếu chứng từ (đã TT / hết hạn) */}
      {ctDetail && (
        <div className="ktp-modal-overlay" onClick={() => setCtDetail(null)}>
          <div className="ktp-modal" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header">
              <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Chi tiết phiếu cọc</h3>
              <button className="ktp-btn-close" onClick={() => setCtDetail(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: '#2f6765', fontSize: '18px' }}>{ctDetail.maPhieuDatCoc}</span>
                <CtBadge trangThai={ctDetail.trangThaiThanhToan} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Khách hàng', ctDetail.hoTen],
                  ['Số điện thoại', ctDetail.soDienThoai || '—'],
                  ['Phòng/Giường', moTaPhong(ctDetail)],
                  ['Cần thanh toán', `${formatTien(ctDetail.soTienCoc)}đ`],
                  ['Hạn thanh toán', formatHan(ctDetail.thoiHanThanhToan)]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                    <span style={{ color: '#6f797a', fontSize: '14px' }}>{k}</span>
                    <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              {ctDetail.chungTuThanhToan && String(ctDetail.chungTuThanhToan).trim() && (
                <p style={{ marginTop: '12px', fontSize: '13px' }}>
                  Chứng từ:{' '}
                  <a href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${ctDetail.chungTuThanhToan}`} target="_blank" rel="noreferrer">Xem file</a>
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="ktp-btn-action" onClick={() => setCtDetail(null)} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '8px 24px' }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận gửi yêu cầu đặt cọc */}
      {showSendModal && selectedItem && (
        <div className="ktp-modal-overlay">
          <div className="ktp-modal" style={{ maxWidth: '450px' }}>
            <div className="ktp-modal-header" style={{ borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Xác nhận gửi yêu cầu đặt cọc</h3>
              </div>
              <button className="ktp-btn-close" onClick={() => setShowSendModal(false)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#3f494a', lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn gửi yêu cầu đặt cọc cho hồ sơ này không? Thông tin sẽ được chuyển đến bộ phận Quản lý để xử lý.
              </p>
              
              <div style={{ backgroundColor: '#f4f7f7', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Mã hồ sơ:</span>
                  <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{selectedItem.maDangKy}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Khách hàng:</span>
                  <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{selectedItem.hoTen}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Phòng/Giường:</span>
                  <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{moTaPhong(selectedItem)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <button className="ktp-btn-action" onClick={() => setShowSendModal(false)} disabled={submitting} style={{ flex: 1, justifyContent: 'center', border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a' }}>Hủy</button>
                <button className="ktp-btn-action-fill" onClick={handleGuiYeuCau} disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? 'Đang gửi...' : 'Xác nhận gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ghi nhận chứng từ thanh toán (DC04) */}
      {showUploadModal && selectedPhieu && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setShowUploadModal(false)}>
          <div className="ktp-modal" style={{ maxWidth: '860px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="verified_user" style={{ color: '#2f6765' }} />
                <h3 style={{ margin: 0, color: '#2f6765', fontSize: '18px' }}>Ghi nhận chứng từ thanh toán</h3>
              </div>
              <button className="ktp-btn-close" onClick={() => setShowUploadModal(false)}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ paddingTop: '16px' }}>
              {/* 2 cột: trái = upload, phải = thông tin phiếu + ghi chú */}
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
                {/* Cột trái - Upload */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#3f494a', marginBottom: '10px' }}>Chứng từ thanh toán (Hình ảnh/PDF)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => setCtFile(e.target.files?.[0] || null)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); setCtFile(e.dataTransfer.files?.[0] || null); }}
                    style={{ border: '2px dashed #c4c7c8', borderRadius: '12px', minHeight: '230px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcfdfd', cursor: 'pointer' }}
                  >
                    <div style={{ backgroundColor: '#d7ebec', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                      <Icon name="cloud_upload" style={{ color: '#2f6765', fontSize: '30px' }} />
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#2f6765', fontSize: '15px', marginBottom: '4px' }}>Kéo thả file vào đây</div>
                    <div style={{ color: '#6f797a', fontSize: '13px' }}>Hoặc nhấp để chọn từ máy tính</div>
                  </div>
                  {ctFile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#edeeef', padding: '12px 16px', borderRadius: '8px', marginTop: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#191c1d', overflow: 'hidden' }}>
                        <Icon name="image" style={{ color: '#2f6765' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctFile.name}</span>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCtFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b3261e', display: 'flex' }}>
                        <Icon name="delete" style={{ fontSize: '18px' }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Cột phải - Thông tin phiếu + Ghi chú */}
                <div style={{ flex: 1.15, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f4f7f7', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Mã phiếu cọc:</span>
                      <span style={{ fontWeight: '600', color: '#2f6765', fontSize: '14px' }}>{selectedPhieu.maPhieuDatCoc}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Khách hàng:</span>
                      <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>{selectedPhieu.hoTen}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Số tiền cần nộp:</span>
                      <span style={{ fontWeight: '700', color: '#b3261e', fontSize: '15px' }}>{formatTien(selectedPhieu.soTienCoc)}đ</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '14px', color: '#3f494a' }}>Ghi chú</label>
                      <span style={{ fontSize: '12px', color: ctForm.ghiChu.length >= 100 ? '#e2575b' : '#6f797a' }}>{ctForm.ghiChu.length}/100</span>
                    </div>
                    <textarea className="ktp-input" maxLength={100} value={ctForm.ghiChu} onChange={(e) => setCtForm({ ...ctForm, ghiChu: e.target.value })} placeholder="Ghi chú thêm cho quản lý đối chiếu (nếu có)..." style={{ width: '100%', flex: 1, minHeight: '120px', resize: 'none' }}></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #eceeef', paddingTop: '16px', paddingBottom: '20px', paddingRight: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="ktp-btn-action" onClick={() => setShowUploadModal(false)} disabled={submitting} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '10px 28px' }}>Hủy</button>
              <button className="ktp-btn-action-fill" onClick={handleGhiNhanChungTu} disabled={submitting} style={{ padding: '10px 28px' }}>
                {submitting ? 'Đang gửi...' : 'Gửi chứng từ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết / Xem lý do từ chối */}
      {detailItem && (
        <div className="ktp-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="ktp-modal" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header">
              <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Chi tiết phiếu đăng ký</h3>
              <button className="ktp-btn-close" onClick={() => setDetailItem(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: '#2f6765', fontSize: '18px' }}>{detailItem.maDangKy}</span>
                <StatusBadge trangThai={detailItem.trangThaiDangKy} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Khách hàng', detailItem.hoTen],
                  ['Số điện thoại', detailItem.soDienThoai || '—'],
                  ['Phòng dự kiến', moTaPhong(detailItem)],
                  ['Ngày đăng ký', formatNgay(detailItem.ngayDangKy)]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                    <span style={{ color: '#6f797a', fontSize: '14px' }}>{k}</span>
                    <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Số người</span>
                  <SoNguoiBadge soNguoi={detailItem.soNguoiDuKienO} soNam={detailItem.soNam} soNu={detailItem.soNu} khacGioi={khacGioiOf(detailItem)} />
                </div>
                {detailItem.maPhieuDatCoc && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Mã phiếu cọc</span>
                      <span style={{ color: '#2f6765', fontSize: '14px', fontWeight: 600 }}>{detailItem.maPhieuDatCoc}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Số tiền cọc</span>
                      <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600 }}>{formatTien(detailItem.soTienCoc)}đ</span>
                    </div>
                  </>
                )}
              </div>

              {detailItem.trangThaiDangKy === 'Từ chối' && (
                <div style={{ marginTop: '16px', background: '#fdecec', border: '1px solid #f5c2c2', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>Lý do từ chối</div>
                  <div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>{detailItem.ghiChuSale || 'Quản lý không để lại ghi chú.'}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="ktp-btn-action" onClick={() => setDetailItem(null)} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '8px 24px' }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup thông báo kết quả */}
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
