import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';

// Cấu hình trạng thái thanh toán (DC05)
const STATUS_CONFIG = {
  'Chờ TT':  { chip: 'Chờ xác nhận', badgeLabel: 'Chờ xác nhận', badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Đã TT':   { chip: 'Đã xác nhận',  badgeLabel: 'Đã xác nhận',  badge: { bg: '#e6f6ec', fg: '#15803d' } },
  'Hết hạn': { chip: 'Hết hạn',      badgeLabel: 'Hết hạn',      badge: { bg: '#fdecec', fg: '#b91c1c' } },
};
const STATUS_ORDER = ['Chờ TT', 'Đã TT', 'Hết hạn'];
const StatusBadge = ({ trangThai }) => {
  const cfg = STATUS_CONFIG[trangThai];
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
  border: active ? '1px solid #00666d' : '1px solid #d7dcdc',
  background: active ? '#00666d' : '#fff',
  color: active ? '#fff' : (disabled ? '#c4c7c8' : '#3f494a'),
  fontSize: '13px', fontWeight: 600
});

// DC05 - Xác nhận thanh toán cọc (tác nhân: Nhân viên quản lý).
// GUI: HienThi() = loadDanhSach() -> getDanhSachChoXacNhanThanhToan() -> SP_DanhSachChoXacNhanThanhToan.
// GUI: btnXacNhan_Click() -> xacNhanThanhToan() -> SP_XacNhanThanhToanCoc.

const formatTien = (v) => (v == null || v === '' || isNaN(Number(v)) ? '0' : Number(v).toLocaleString('vi-VN'));
const formatHan = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
};
const moTaPhong = (item) => {
  const phong = item.tenPhong || item.maPhong;
  if (!phong) return '—';
  return item.maGiuong ? `${phong} - ${item.maGiuong}` : phong;
};
// ChungTuThanhToan giờ chỉ là ĐƯỜNG DẪN file (ảnh/PDF). Gốc backend để tải file:
const FILE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const anhUrl = (path) => (path ? `${FILE_BASE}${path}` : null);

export default function XacNhanThanhToanTab() {
  const { user } = useAuth();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('xac-nhan'); // 'xac-nhan' | 'tu-choi'
  const [lyDo, setLyDo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Lọc / tìm kiếm / sắp xếp / phân trang
  const [statusFilter, setStatusFilter] = useState('Chờ TT'); // mặc định nhóm cần xử lý
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('asc'); // theo hạn TT: gần nhất trước
  const [page, setPage] = useState(1);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getDanhSachChoXacNhanThanhToan();
      setList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách chờ xác nhận thanh toán');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDanhSach(); }, [loadDanhSach]);

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((it) => !q
      || (it.hoTen || '').toLowerCase().includes(q)
      || String(it.soDienThoai || '').toLowerCase().includes(q)
      || (it.maPhieuDatCoc || '').toLowerCase().includes(q));
  }, [list, search]);

  const counts = useMemo(() => {
    const c = { all: baseFiltered.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    baseFiltered.forEach((it) => { if (c[it.trangThaiThanhToan] != null) c[it.trangThaiThanhToan] += 1; });
    return c;
  }, [baseFiltered]);

  const filteredList = useMemo(() => {
    const arr = statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThaiThanhToan === statusFilter);
    return [...arr].sort((a, b) => {
      const da = a.thoiHanThanhToan ? new Date(a.thoiHanThanhToan).getTime() : 0;
      const db = b.thoiHanThanhToan ? new Date(b.thoiHanThanhToan).getTime() : 0;
      return sortDir === 'asc' ? da - db : db - da;
    });
  }, [baseFiltered, statusFilter, sortDir]);

  const chonChip = (key) => { setStatusFilter(key); setSortDir(key === 'Chờ TT' ? 'asc' : 'desc'); };

  useEffect(() => { setPage(1); }, [statusFilter, search, sortDir]);
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

  // Chỉ phiếu 'Chờ TT' còn hạn mới cho xác nhận
  const canXuLy = (it) => it.trangThaiThanhToan === 'Chờ TT'
    && (!it.thoiHanThanhToan || new Date(it.thoiHanThanhToan).getTime() >= Date.now());

  const openXuLy = (item) => {
    setSelected(item);
    setDecision('xac-nhan');
    setLyDo('');
  };
  const readOnly = !!(selected && !canXuLy(selected));

  const handleSubmit = async () => {
    if (!selected) return;
    const hopLe = decision === 'xac-nhan';
    if (!hopLe && !lyDo.trim()) {
      setResult({ type: 'error', title: 'Thiếu lý do.', message: 'Vui lòng nhập lý do từ chối xác nhận.' });
      return;
    }
    setSubmitting(true);
    try {
      await datCocApi.xacNhanThanhToan(selected.maPhieuDatCoc, {
        hopLe,
        ghiChu: hopLe ? null : lyDo.trim(),
        quanLyXacNhanThanhToanId: user?.maNguoiDung
      });
      setSelected(null);
      await loadDanhSach();
      setResult({
        type: 'success',
        title: hopLe ? 'Đã xác nhận!' : 'Đã từ chối.',
        message: hopLe
          ? 'Thanh toán cọc hợp lệ. Phòng/giường đã chuyển trạng thái "Đã đặt cọc".'
          : 'Đã gửi thông báo từ chối kèm lý do đến khách hàng và Sale (phiếu giữ trạng thái "Chờ TT").'
      });
    } catch (err) {
      setResult({ type: 'error', title: 'Thao tác thất bại.', message: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const imgUrl = anhUrl(selected?.chungTuThanhToan);
  const isPdf = selected?.chungTuThanhToan && /\.pdf$/i.test(selected.chungTuThanhToan);

  return (
    <div className="ktp-container">
      {/* Table Section */}
      <section className="ktp-table-section">
        {/* Thanh tìm kiếm + sắp xếp */}
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 260px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên khách hàng, SĐT hoặc mã phiếu cọc..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Sắp xếp</label>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }}>
              <option value="asc">Hạn thanh toán: gần nhất</option>
              <option value="desc">Hạn thanh toán: xa nhất</option>
            </select>
          </div>
          {search && (
            <button type="button" onClick={() => setSearch('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        {/* Segmented control theo trạng thái */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', paddingLeft: '16px' }}>
          {[{ key: 'all', label: 'Tất cả' }, ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_CONFIG[s].chip }))].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => chonChip(tab.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, transition: 'all .15s',
                  border: active ? '1px solid #00666d' : '1px solid #d7dcdc',
                  background: active ? '#00666d' : '#fff', color: active ? '#fff' : '#3f494a'
                }}>
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
              <th>Phòng/Giường</th>
              <th className="text-right">Số tiền đặt cọc</th>
              <th>Hạn thanh toán</th>
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
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có chứng từ nào ở nhóm này</td></tr>
            ) : pagedList.map((item) => (
              <tr key={item.maPhieuDatCoc}>
                <td><span style={{ fontWeight: '700', color: '#00666d' }}>{item.maPhieuDatCoc}</span></td>
                <td><p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{item.hoTen}</p></td>
                <td style={{ fontSize: '14px', color: '#414753' }}>{moTaPhong(item)}</td>
                <td className="text-right" style={{ fontSize: '14px', fontWeight: '500', color: '#191c1d' }}>{formatTien(item.soTienCoc)}đ</td>
                <td style={{ fontSize: '13px', color: '#414753' }}>{formatHan(item.thoiHanThanhToan)}</td>
                <td className="text-center"><StatusBadge trangThai={item.trangThaiThanhToan} /></td>
                <td className="text-center">
                  {canXuLy(item) ? (
                    <button className="ktp-btn-action-fill" onClick={() => openXuLy(item)}>Xử lý</button>
                  ) : (
                    <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#00666d', padding: '6px 12px', fontSize: '13px' }} onClick={() => openXuLy(item)}>Xem chi tiết</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ktp-pagination" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: '500' }}>
            {filteredList.length === 0
              ? 'Không có chứng từ'
              : `Hiển thị ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filteredList.length)} / ${filteredList.length} chứng từ`}
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
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '12px' }}>

            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff', borderBottom: 'none', padding: '24px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Chi tiết thanh toán cọc</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="person" /> Thông tin khách hàng
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Họ tên:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{selected.hoTen}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>SĐT:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{selected.soDienThoai || '—'}</span></div>
                    </div>
                  </div>

                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="receipt_long" /> Thông tin phiếu đặt cọc
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Mã phiếu:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{selected.maPhieuDatCoc}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Phòng/Giường:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{moTaPhong(selected)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Số tiền cọc:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#fe7e50' }}>{formatTien(selected.soTienCoc)}đ</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a', fontSize: '14px' }}>Hạn thanh toán:</span> <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d' }}>{formatHan(selected.thoiHanThanhToan)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0, border: '1px solid #86d3da', backgroundColor: '#f5feff' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="image" /> Chứng từ thanh toán khách đã gửi
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {imgUrl ? (
                        isPdf ? (
                          <a href={imgUrl} target="_blank" rel="noreferrer" style={{ color: '#2f6765', fontWeight: 600, fontSize: '14px' }}>📄 Mở file PDF chứng từ</a>
                        ) : (
                          <a href={imgUrl} target="_blank" rel="noreferrer">
                            <img src={imgUrl} alt="Chứng từ thanh toán" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #cce4e4', backgroundColor: '#fff' }} />
                          </a>
                        )
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9b4922' }}>Khách chưa đính kèm chứng từ.</span>
                      )}
                    </div>
                  </div>

                  {readOnly && (
                    <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 12px 0' }}>
                        <Icon name="fact_check" /> Kết quả xử lý
                      </h4>
                      <StatusBadge trangThai={selected.trangThaiThanhToan} />
                    </div>
                  )}
                  {!readOnly && (
                  <div className="ktp-section" style={{ padding: '20px', marginBottom: 0 }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#3b8280', margin: '0 0 16px 0' }}>
                      <Icon name="fact_check" /> Kết quả đối chiếu & Quyết định
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div
                        onClick={() => setDecision('xac-nhan')}
                        style={{ padding: '16px', borderRadius: '8px', border: decision === 'xac-nhan' ? '1px solid #3b8280' : '1px solid #bec8c9', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'xac-nhan' ? '#eefafb' : '#ffffff' }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'xac-nhan' ? '6px solid #14595b' : '2px solid #bec8c9', flexShrink: 0 }}></div>
                        <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px' }}>Xác nhận thanh toán hợp lệ</span>
                      </div>

                      <div
                        onClick={() => setDecision('tu-choi')}
                        style={{ padding: '16px', borderRadius: '8px', border: decision === 'tu-choi' ? '1px solid #3b8280' : '1px solid #bec8c9', display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', backgroundColor: decision === 'tu-choi' ? '#eefafb' : '#ffffff' }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: decision === 'tu-choi' ? '6px solid #14595b' : '2px solid #bec8c9', flexShrink: 0, marginTop: '2px' }}></div>
                        <div>
                          <span style={{ fontWeight: '600', color: '#191c1d', fontSize: '14px', display: 'block', marginBottom: '2px' }}>Từ chối xác nhận</span>
                          <span style={{ fontSize: '12px', color: '#6f797a' }}>Yêu cầu khách hàng kiểm tra lại hoặc cung cấp chứng từ khác.</span>
                        </div>
                      </div>

                      {decision === 'tu-choi' && (
                        <div>
                          <label style={{ display: 'block', fontWeight: '700', color: '#191c1d', marginBottom: '8px', fontSize: '13px' }}>Lý do từ chối <span style={{ color: '#ba1a1a' }}>*</span></label>
                          <textarea
                            value={lyDo}
                            onChange={(e) => setLyDo(e.target.value)}
                            style={{ width: '100%', border: '1px solid #bec8c9', borderRadius: '8px', padding: '12px', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
                            placeholder="VD: Số tiền chuyển không khớp, chứng từ không rõ ràng..."
                          ></textarea>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #e1e3e4', backgroundColor: '#ffffff', padding: '16px 32px', display: 'flex', gap: '16px', justifyContent: 'flex-end', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button className="ktp-btn-cancel" onClick={() => setSelected(null)} disabled={submitting} style={{ border: '1px solid #bec8c9', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#ffffff', color: '#191c1d', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
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
