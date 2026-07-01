import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';

// DC02 - Xác nhận khả năng nhận cọc (tác nhân: Nhân viên quản lý).
// GUI: HienThi() = loadDanhSach() -> getDanhSachChoXacNhan() -> SP_DanhSachChoXacNhanCoc.
// GUI: btnXacNhan_Click() -> xacNhanKhaNangNhanCoc() -> SP_XacNhanKhaNangNhanCoc.

const moTaPhong = (item) => {
  const phong = item.tenPhong || item.maPhong;
  if (!phong) return '—';
  return item.maGiuong ? `${phong} - ${item.maGiuong}` : phong;
};

const formatNgay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

// Nguồn cấu hình DUY NHẤT cho trạng thái phiếu ở màn Quản lý duyệt.
const STATUS_CONFIG = {
  'Chờ xác nhận cọc': { chip: 'Chờ duyệt',  badgeLabel: 'Chờ duyệt',  badge: { bg: '#fff4e5', fg: '#b45309' }, action: 'xu-ly' },
  'Xác nhận cọc':     { chip: 'Đã duyệt',   badgeLabel: 'Đã duyệt',   badge: { bg: '#e6f6ec', fg: '#15803d' }, action: 'chi-tiet' },
  'Từ chối':          { chip: 'Bị từ chối', badgeLabel: 'Bị từ chối', badge: { bg: '#fdecec', fg: '#b91c1c' }, action: 'ly-do' },
};
const STATUS_ORDER = ['Chờ xác nhận cọc', 'Xác nhận cọc', 'Từ chối'];

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
  border: active ? '1px solid #00666d' : '1px solid #d7dcdc',
  background: active ? '#00666d' : '#fff',
  color: active ? '#fff' : (disabled ? '#c4c7c8' : '#3f494a'),
  fontSize: '13px', fontWeight: 600
});

export default function XacNhanNhanPhongTab() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState(null);      // hồ sơ đang xử lý / xem
  const [decision, setDecision] = useState('xac-nhan'); // 'xac-nhan' | 'tu-choi'
  const [lyDo, setLyDo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Lọc / tìm kiếm / sắp xếp (client-side)
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getDanhSachChoXacNhan();
      setList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách chờ xác nhận');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDanhSach(); }, [loadDanhSach]);

  // Lọc theo tìm kiếm + khoảng ngày (chưa áp chip) — dùng để đếm chip
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tuMs = tuNgay ? new Date(tuNgay).setHours(0, 0, 0, 0) : null;
    const denMs = denNgay ? new Date(denNgay).setHours(23, 59, 59, 999) : null;
    return list.filter((it) => {
      const okSearch = !q
        || (it.hoTen || '').toLowerCase().includes(q)
        || String(it.soDienThoai || '').toLowerCase().includes(q)
        || (it.maDangKy || '').toLowerCase().includes(q);
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
  // "Chờ duyệt" -> cũ nhất (FIFO); nhóm khác -> mới nhất.
  const defaultSortFor = (key) => (key === 'Chờ xác nhận cọc' ? 'asc' : 'desc');
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

  const openXuLy = (item) => {
    setSelected(item);
    setDecision('xac-nhan');
    setLyDo('');
  };
  const readOnly = !!(selected && selected.trangThai && selected.trangThai !== 'Chờ xác nhận cọc');

  const handleSubmit = async () => {
    if (!selected) return;
    const duocNhanCoc = decision === 'xac-nhan';
    if (!duocNhanCoc && !lyDo.trim()) {
      setResult({ type: 'error', title: 'Thiếu lý do.', message: 'Vui lòng nhập lý do từ chối nhận cọc.' });
      return;
    }
    setSubmitting(true);
    try {
      await datCocApi.xacNhanKhaNang(selected.maDangKy, {
        maQuanLy: user?.maNguoiDung,
        duocNhanCoc,
        lyDo: duocNhanCoc ? null : lyDo.trim()
      });
      setSelected(null);
      await loadDanhSach();
      setResult({
        type: 'success',
        title: duocNhanCoc ? 'Đã chấp nhận!' : 'Đã từ chối.',
        message: duocNhanCoc
          ? 'Hồ sơ đã chuyển sang bộ phận Kế toán để lập phiếu đặt cọc.'
          : 'Đã gửi thông báo từ chối kèm lý do đến nhân viên Sale.'
      });
    } catch (err) {
      setResult({ type: 'error', title: 'Thao tác thất bại.', message: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const phongKhaDung = (item) => {
    const phongOk = !item.tinhTrangPhong || ['Trống', 'Còn chỗ'].includes(item.tinhTrangPhong);
    const giuongOk = !item.maGiuong || item.tinhTrangGiuong === 'Trống';
    return phongOk && giuongOk;
  };

  return (
    <div className="ktp-container">
      {/* Table Section */}
      <section className="ktp-table-section">
        {/* Thanh tìm kiếm + lọc ngày + sắp xếp */}
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên khách hàng, SĐT hoặc mã phiếu..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
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

        {/* Segmented control: lọc theo trạng thái + số đếm (căn thẳng lề trái với ô tìm kiếm) */}
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
                  border: active ? '1px solid #00666d' : '1px solid #d7dcdc',
                  background: active ? '#00666d' : '#fff',
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
              <th>Mã phiếu</th>
              <th>Khách hàng</th>
              <th>SĐT</th>
              <th>Phòng/Giường</th>
              <th>Ngày đăng ký</th>
              <th className="text-center">Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải...</td></tr>
            ) : loadError ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#b3261e' }}>{loadError}</td></tr>
            ) : filteredList.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có phiếu nào ở nhóm này</td></tr>
            ) : pagedList.map((item) => {
              const action = STATUS_CONFIG[item.trangThai]?.action;
              return (
                <tr key={item.maDangKy}>
                  <td><span style={{ fontWeight: '700', color: '#00666d' }}>{item.maDangKy}</span></td>
                  <td><p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{item.hoTen}</p></td>
                  <td style={{ fontSize: '14px', color: '#414753' }}>{item.soDienThoai || '—'}</td>
                  <td style={{ fontSize: '14px', color: '#414753' }}>{moTaPhong(item)}</td>
                  <td style={{ fontSize: '14px', color: '#414753' }}>{formatNgay(item.ngayDangKy)}</td>
                  <td className="text-center"><StatusBadge trangThai={item.trangThai} /></td>
                  <td className="text-center">
                    {action === 'xu-ly' ? (
                      <button className="ktp-btn-action-fill" onClick={() => openXuLy(item)}>Xử lý</button>
                    ) : action === 'ly-do' ? (
                      <button className="ktp-btn-action" style={{ border: '1px solid #f0c0c0', backgroundColor: '#fff', color: '#b91c1c', padding: '6px 12px', fontSize: '13px' }} onClick={() => openXuLy(item)}>Xem lý do</button>
                    ) : (
                      <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#00666d', padding: '6px 12px', fontSize: '13px' }} onClick={() => openXuLy(item)}>Xem chi tiết</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="ktp-pagination" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>
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

      {/* Modal xử lý */}
      {selected && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setSelected(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Chi tiết phiếu đăng ký</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                  <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name="person" /> THÔNG TIN KHÁCH HÀNG</h4>
                  <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Họ và tên</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{selected.hoTen}</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Số điện thoại</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{selected.soDienThoai || '—'}</p></div>
                  </div>
                </div>

                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                  <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name="description" /> THÔNG TIN ĐĂNG KÝ</h4>
                  <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Mã phiếu</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{selected.maDangKy}</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Ngày đăng ký</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{formatNgay(selected.ngayDangKy)}</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Hình thức thuê</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{selected.hinhThucThue || '—'}</p></div>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Sale phụ trách</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{selected.maNhanVienSale || '—'}</p></div>
                  </div>
                </div>

                <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#f8f9fa', border: 'none', padding: '24px', marginBottom: 0 }}>
                  <h4 className="ktp-section-title" style={{ marginBottom: '16px', color: '#3b8280' }}><Icon name="home" /> THÔNG TIN PHÒNG</h4>
                  <div className="ktp-grid-2" style={{ rowGap: '16px' }}>
                    <div><p className="ktp-mini-label" style={{ color: '#6f797a' }}>Phòng/Giường</p><p className="ktp-mini-value" style={{ fontWeight: '600' }}>{moTaPhong(selected)}</p></div>
                    <div>
                      <p className="ktp-mini-label" style={{ color: '#6f797a' }}>Trạng thái phòng/giường hiện tại</p>
                      <span style={{ display: 'inline-block', border: `1px solid ${phongKhaDung(selected) ? '#86d3da' : '#f1b0b0'}`, color: phongKhaDung(selected) ? '#00666d' : '#b3261e', backgroundColor: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>
                        {phongKhaDung(selected) ? 'Còn trống' : 'Không khả dụng'}
                      </span>
                    </div>
                  </div>
                  {!phongKhaDung(selected) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b3261e', fontSize: '12px', marginTop: '12px' }}>
                      <Icon name="warning" /><span>Phòng/giường không còn khả dụng — không thể chấp nhận nhận cọc.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Phiếu đã xử lý: chỉ xem trạng thái + lý do (nếu từ chối) */}
              {readOnly && (
                <div style={{ borderTop: '1px solid #e1e3e4', marginTop: '16px', paddingTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: selected.trangThai === 'Từ chối' ? '16px' : 0 }}>
                    <span style={{ fontWeight: 700, color: '#191c1d', fontSize: '15px' }}>Trạng thái:</span>
                    <StatusBadge trangThai={selected.trangThai} />
                  </div>
                  {selected.trangThai === 'Từ chối' && (
                    <div style={{ background: '#fdecec', border: '1px solid #f5c2c2', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>Lý do từ chối</div>
                      <div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>{selected.ghiChuSale || 'Không có ghi chú.'}</div>
                    </div>
                  )}
                </div>
              )}

              {!readOnly && (
              <div style={{ borderTop: '1px solid #e1e3e4', marginTop: '16px', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#191c1d', marginBottom: '24px' }}>Quyết định của quản lý</h3>

                <div className="ktp-grid-2" style={{ marginBottom: '24px' }}>
                  <div
                    onClick={() => setDecision('xac-nhan')}
                    style={{ padding: '20px', borderRadius: '8px', border: decision === 'xac-nhan' ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'xac-nhan' ? '#f5feff' : '#ffffff' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'xac-nhan' ? '6px solid #00666d' : '2px solid #bec8c9' }}></div>
                    <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '15px' }}>Xác nhận nhận cọc</span>
                  </div>
                  <div
                    onClick={() => setDecision('tu-choi')}
                    style={{ padding: '20px', borderRadius: '8px', border: decision === 'tu-choi' ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'tu-choi' ? '#f5feff' : '#ffffff' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'tu-choi' ? '6px solid #00666d' : '2px solid #bec8c9' }}></div>
                    <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '15px' }}>Từ chối nhận cọc</span>
                  </div>
                </div>

                {decision === 'tu-choi' && (
                  <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '24px' }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#191c1d', marginBottom: '12px', fontSize: '14px' }}>Lý do từ chối <span style={{ color: '#ba1a1a' }}>*</span></label>
                    <textarea
                      value={lyDo}
                      onChange={(e) => setLyDo(e.target.value)}
                      style={{ width: '100%', border: '1px solid #bec8c9', borderRadius: '8px', padding: '16px', fontSize: '14px', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
                      placeholder="Ví dụ: Phòng đã được khách khác cọc trước đó."
                    ></textarea>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6f797a', fontSize: '12px', marginTop: '12px' }}>
                      <Icon name="info" />
                      <span>Lý do từ chối sẽ được gửi cho nhân viên sale để thông báo lại cho khách hàng.</span>
                    </div>
                  </div>
                )}
              </div>
              )}

            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#ffffff', padding: '16px 32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="ktp-btn-cancel" onClick={() => setSelected(null)} disabled={submitting} style={{ border: '1px solid #bec8c9' }}>Đóng</button>
              {!readOnly && (
                <button className="ktp-btn-submit" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Đang xử lý...' : 'Xác nhận'}</button>
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
