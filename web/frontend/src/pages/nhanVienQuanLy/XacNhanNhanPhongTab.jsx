import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';

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

  // Tìm kiếm + chip trạng thái (client-side). Bỏ lọc ngày & bộ chọn sắp xếp:
  // luồng đặt cọc xử lý theo hàng đợi, không cần người dùng tự sắp xếp.
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  // Lọc theo tìm kiếm (chưa áp chip) — dùng để đếm chip
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) => (it.hoTen || '').toLowerCase().includes(q)
      || String(it.soDienThoai || '').toLowerCase().includes(q)
      || (it.maDangKy || '').toLowerCase().includes(q));
  }, [list, search]);

  const counts = useMemo(() => {
    const c = { all: baseFiltered.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    baseFiltered.forEach((it) => { if (c[it.trangThai] != null) c[it.trangThai] += 1; });
    return c;
  }, [baseFiltered]);

  // Thứ tự CỐ ĐỊNH (người dùng không đổi được nữa):
  // "Chờ duyệt" -> cũ nhất trước (FIFO, hồ sơ chờ lâu xử lý trước); các nhóm khác -> mới nhất trước.
  const filteredList = useMemo(() => {
    const arr = statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThai === statusFilter);
    const fifo = statusFilter === 'Chờ xác nhận cọc';
    return [...arr].sort((a, b) => {
      const da = a.ngayDangKy ? new Date(a.ngayDangKy).getTime() : 0;
      const db = b.ngayDangKy ? new Date(b.ngayDangKy).getTime() : 0;
      return fifo ? da - db : db - da;
    });
  }, [baseFiltered, statusFilter]);

  const chonChip = (key) => setStatusFilter(key);

  // Phân trang (client-side)
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [statusFilter, search]);
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
    if (item.trangThai === 'Chờ xác nhận cọc' && !item.coTheNhanCoc) {
      setDecision('tu-choi');
      setLyDo(item.lyDoKhongKhaDung || '');
    } else {
      setDecision('xac-nhan');
      setLyDo('');
    }
  };
  const readOnly = !!(selected && selected.trangThai && selected.trangThai !== 'Chờ xác nhận cọc');

  const handleSubmit = async () => {
    if (!selected) return;
    const duocNhanCoc = decision === 'xac-nhan';
    if (!duocNhanCoc && !lyDo.trim()) {
      setResult({ type: 'error', title: 'Chưa nhập lý do từ chối.' });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await datCocApi.xacNhanKhaNang(selected.maDangKy, {
        maQuanLy: user?.maNguoiDung,
        duocNhanCoc,
        lyDo: duocNhanCoc ? null : lyDo.trim()
      });
      setSelected(null);
      await loadDanhSach();

      // Từ chối KHÔNG đóng hồ sơ: phòng bị loại, hồ sơ quay lại DC01 để Sale chọn phòng khác
      // trong các phòng khách đã xem còn lại. Chỉ khi hết phòng thì hồ sơ mới bị từ chối hẳn.
      const conPhongKhac = data?.conPhongKhac === 1 || data?.conPhongKhac === true;
      setResult({
        type: 'success',
        title: duocNhanCoc
          ? 'Đã chấp nhận.'
          : (conPhongKhac ? 'Đã trả hồ sơ về Sale chọn phòng khác.' : 'Đã từ chối hồ sơ.')
      });
    } catch {
      setResult({ type: 'error', title: 'Thao tác thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ktp-container">
      {/* Table Section */}
      <section className="ktp-table-section">
        {/* Thanh tìm kiếm (đã bỏ lọc ngày & sắp xếp — xử lý theo hàng đợi) */}
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên khách hàng, SĐT hoặc mã phiếu..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
          </div>
          {search && (
            <button type="button" onClick={() => setSearch('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        {/* Segmented control: lọc theo trạng thái + số đếm (căn thẳng lề trái với ô tìm kiếm) */}
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

            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none', padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '18px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Chi tiết phiếu đăng ký #{selected.maDangKy}</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Dòng tóm tắt */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: '#6f797a', borderBottom: '1px solid #e1e3e4', paddingBottom: '16px' }}>
                  <span>Ngày đăng ký: <strong style={{ color: '#191c1d' }}>{formatNgay(selected.ngayDangKy)}</strong></span>
                  <span>Sale phụ trách: <strong style={{ color: '#191c1d' }}>{selected.tenNhanVienSale || selected.maNhanVienSale || '—'}</strong>{selected.tenNhanVienSale && selected.maNhanVienSale ? ` (${selected.maNhanVienSale})` : ''}</span>
                </div>

                {/* 2 Cột thông tin */}
                <div className="ktp-grid-2" style={{ gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e9696', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Thông tin khách hàng</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div><p className="ktp-mini-label" style={{ color: '#6f797a', margin: '0 0 4px 0' }}>Họ và tên</p><p className="ktp-mini-value" style={{ fontWeight: '600', margin: 0 }}>{selected.hoTen}</p></div>
                      <div><p className="ktp-mini-label" style={{ color: '#6f797a', margin: '0 0 4px 0' }}>Số điện thoại</p><p className="ktp-mini-value" style={{ fontWeight: '600', margin: 0 }}>{selected.soDienThoai || '—'}</p></div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#8e9696', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Yêu cầu thuê</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div><p className="ktp-mini-label" style={{ color: '#6f797a', margin: '0 0 4px 0' }}>Nhóm khách</p><p className="ktp-mini-value" style={{ fontWeight: '600', margin: 0 }}>{selected.soNam} Nam, {selected.soNu} Nữ</p></div>
                      <div><p className="ktp-mini-label" style={{ color: '#6f797a', margin: '0 0 4px 0' }}>Ngày đăng ký</p><p className="ktp-mini-value" style={{ fontWeight: '600', margin: 0 }}>{formatNgay(selected.ngayDangKy)}</p></div>
                    </div>
                  </div>
                </div>

                {/* Phân tích PHÒNG KHÁCH CHỐT: Sale đã chốt phòng ở DC01, nên Quản lý duyệt
                    đúng phòng đó (sức chứa, giới tính, tình trạng thật). */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ flex: 1, borderTop: '1px solid #e1e3e4' }}></div>
                    <span style={{ padding: '0 16px', fontSize: '14px', fontWeight: '700', color: '#191c1d' }}>Phòng khách chốt thuê</span>
                    <div style={{ flex: 1, borderTop: '1px solid #e1e3e4' }}></div>
                  </div>

                  <div style={{ borderRadius: '8px', border: `2px solid ${selected.coTheNhanCoc === true ? '#86d3da' : (selected.coTheNhanCoc === false ? '#f1b0b0' : '#e1e3e4')}`, backgroundColor: selected.coTheNhanCoc === true ? '#f5feff' : (selected.coTheNhanCoc === false ? '#fdecec' : '#f8f9fa'), padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Icon name="meeting_room" style={{ color: '#6f797a' }} />
                          <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '16px' }}>
                            {moTaPhong(selected)} {selected.tenLoaiPhong ? `(${selected.tenLoaiPhong})` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#6f797a', flexWrap: 'wrap' }}>
                          {/* 'Không phân biệt' là mặc định -> chỉ nêu khi phòng ĐÃ BỊ KHÓA giới */}
                          {(selected.gioiTinhChoPhep === 'Nam' || selected.gioiTinhChoPhep === 'Nữ') && (
                            <span>Giới tính: <strong style={{ color: '#191c1d' }}>{selected.gioiTinhChoPhep}</strong></span>
                          )}
                          <span>Sức chứa: <strong style={{ color: '#191c1d' }}>{selected.sucChuaToiDa ?? 0}</strong></span>
                          <span>Trống: <strong style={{ color: '#191c1d' }}>{selected.soChoTrong ?? 0}</strong> giường</span>
                        </div>
                      </div>

                      {/* Không dùng icon: màu viền + chữ đã đủ phân biệt */}
                      {selected.coTheNhanCoc != null && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', borderRadius: '8px', backgroundColor: '#ffffff', border: `1px solid ${selected.coTheNhanCoc === true ? '#86d3da' : '#f1b0b0'}`, color: selected.coTheNhanCoc === true ? '#00666d' : '#b3261e' }}>
                          <span style={{ fontWeight: '700', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {selected.coTheNhanCoc === true ? 'ĐỦ ĐIỀU KIỆN NHẬN CỌC' : 'KHÔNG ĐỦ ĐIỀU KIỆN'}
                          </span>
                        </div>
                      )}
                    </div>

                    {selected.coTheNhanCoc === false && selected.trangThai === 'Chờ xác nhận cọc' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b3261e', fontSize: '13px', marginTop: '16px', backgroundColor: 'rgba(179, 38, 30, 0.1)', padding: '12px', borderRadius: '4px' }}>
                        <Icon name="warning" style={{ fontSize: '18px' }} />
                        <span><strong>Lý do:</strong> {selected.lyDoKhongKhaDung}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phiếu đã xử lý */}
                {readOnly && (
                  <div style={{ borderTop: '1px solid #e1e3e4', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#191c1d', fontSize: '15px' }}>Trạng thái:</span>
                      <StatusBadge trangThai={selected.trangThai} />
                    </div>
                    {selected.trangThai === 'Từ chối' && (
                      <div style={{ background: '#fdecec', border: '1px solid #f5c2c2', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>Lý do từ chối trước đó</div>
                        <div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>{selected.ghiChuSale || 'Không có ghi chú.'}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quyết định của quản lý */}
                {!readOnly && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ flex: 1, borderTop: '1px solid #e1e3e4' }}></div>
                      <span style={{ padding: '0 16px', fontSize: '14px', fontWeight: '700', color: '#191c1d' }}>Quyết định của quản lý</span>
                      <div style={{ flex: 1, borderTop: '1px solid #e1e3e4' }}></div>
                    </div>

                    <div className="ktp-grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
                      <div
                        onClick={() => { if (selected.coTheNhanCoc !== false) setDecision('xac-nhan'); }}
                        style={{ padding: '16px', borderRadius: '8px', border: decision === 'xac-nhan' ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: selected.coTheNhanCoc === false ? 'not-allowed' : 'pointer', backgroundColor: decision === 'xac-nhan' ? '#f5feff' : (selected.coTheNhanCoc === false ? '#f4f7f7' : '#ffffff'), opacity: selected.coTheNhanCoc === false ? 0.6 : 1 }}
                      >
                        {/* boxSizing tường minh: không có nó, 20px + border 6px cho ra kích thước
                            khác nhau tùy ngữ cảnh CSS -> hai màn hình ra hai kiểu radio khác nhau. */}
                        <div style={{ width: '20px', height: '20px', boxSizing: 'border-box', borderRadius: '50%', border: decision === 'xac-nhan' ? '2px solid #00666d' : '2px solid #bec8c9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {decision === 'xac-nhan' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00666d' }}></div>}
                        </div>
                        <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '14px' }}>Xác nhận nhận cọc</span>
                      </div>
                      <div
                        onClick={() => setDecision('tu-choi')}
                        style={{ padding: '16px', borderRadius: '8px', border: decision === 'tu-choi' ? '2px solid #00666d' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'tu-choi' ? '#f5feff' : '#ffffff' }}
                      >
                        <div style={{ width: '20px', height: '20px', boxSizing: 'border-box', borderRadius: '50%', border: decision === 'tu-choi' ? '2px solid #00666d' : '2px solid #bec8c9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {decision === 'tu-choi' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00666d' }}></div>}
                        </div>
                        <span style={{ fontWeight: '700', color: '#191c1d', fontSize: '14px' }}>Từ chối phòng này</span>
                      </div>
                    </div>

                    {decision === 'tu-choi' && (
                      <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                        <label style={{ display: 'block', fontWeight: '700', color: '#191c1d', marginBottom: '8px', fontSize: '13px' }}>Lý do từ chối <span style={{ color: '#ba1a1a' }}>*</span></label>
                        <textarea
                          value={lyDo}
                          onChange={(e) => setLyDo(e.target.value)}
                          style={{ width: '100%', border: '1px solid #bec8c9', borderRadius: '8px', padding: '12px', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                          placeholder="Ví dụ: Phòng đã được khách khác cọc trước đó."
                        ></textarea>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6f797a', fontSize: '12px', marginTop: '8px' }}>
                          <Icon name="info" style={{ fontSize: '16px' }} />
                          <span>Lý do từ chối sẽ được gửi cho nhân viên sale để thông báo lại cho khách hàng.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#f8f9fa', padding: '16px 24px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setSelected(null)} disabled={submitting} style={{ border: '1px solid #bec8c9', padding: '10px 24px', backgroundColor: '#ffffff', borderRadius: '8px', fontWeight: '600' }}>Đóng</button>
              {!readOnly && (
                <button className="ktp-btn-submit" onClick={handleSubmit} disabled={submitting || (decision === 'tu-choi' && !lyDo.trim())} style={{ padding: '10px 24px', backgroundColor: '#3b8280', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', opacity: (submitting || (decision === 'tu-choi' && !lyDo.trim())) ? 0.6 : 1, cursor: (submitting || (decision === 'tu-choi' && !lyDo.trim())) ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Đang xử lý...' : 'Xác nhận'}
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
