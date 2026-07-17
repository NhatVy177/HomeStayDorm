import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import ResultModal from '../../components/common/ResultModal.jsx';
import SoNguoiBadge from '../../components/common/SoNguoiBadge.jsx';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';

// DC02B - SALE lập phiếu đặt cọc.
//
// Hình thức thuê (nguyên phòng / ghép giường) và giường cụ thể là thứ phải TRAO ĐỔI VỚI KHÁCH,
// mà người tiếp xúc khách là Sale -> Sale lập phiếu, không phải kế toán.
//
// SALE KHÔNG THẤY TIỀN: màn này tuyệt đối không hiển thị giá thuê hay tiền cọc.
// Kế toán tính tiền và chốt phiếu ở DC03.
//
// GUI: HienThi()      -> getDanhSachChoLapPhieu() -> SP_DanhSachChoLapPhieuDatCoc
// GUI: btnLapPhieu()  -> datCocApi.create()       -> SP_LapPhieuDatCoc

const STATUS_CONFIG = {
  'Chờ lập':          { chip: 'Chờ lập',          badge: { bg: '#fff4e5', fg: '#b45309' }, action: 'lap' },
  'Chờ kế toán chốt': { chip: 'Chờ kế toán chốt', badge: { bg: '#eef2f3', fg: '#3f494a' }, action: 'chi-tiet' },
  'Đã chốt':          { chip: 'Đã chốt',          badge: { bg: '#e6f6ec', fg: '#15803d' }, action: 'chi-tiet' },
};
const STATUS_ORDER = ['Chờ lập', 'Chờ kế toán chốt', 'Đã chốt'];

const StatusBadge = ({ trangThai }) => {
  const s = STATUS_CONFIG[trangThai]?.badge || { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {trangThai}
    </span>
  );
};

const formatNgay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
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

// SUY HÌNH THỨC THUÊ từ hồ sơ + phòng. Trả { hinhThuc, lyDo } khi chỉ có MỘT hình thức
// hợp lệ (Sale không phải chọn), hoặc { hinhThuc: null } khi cả hai đều được.
//   Nguyên phòng: phòng phải TRỐNG HOÀN TOÀN.
//   Ghép giường : nhóm cùng giới, đủ giường trống, phòng không khóa sang giới khác.
const suyHinhThuc = (it) => {
  if (!it) return { hinhThuc: null, lyDo: '' };
  const soNguoi = Number(it.soNguoiDuKienO || 0);
  const sucChuaP = Number(it.sucChuaToiDa || 0);
  const trong = Number(it.soChoTrong || 0);
  const khac = it.khacGioi === 1 || it.khacGioi === true;
  const gioiNhom = Number(it.soNu || 0) === 0 ? 'Nam' : (Number(it.soNam || 0) === 0 ? 'Nữ' : null);
  const gioiPhong = it.gioiTinhChoPhep;

  const trongHoanToan = sucChuaP > 0 && trong === sucChuaP;
  const duocNguyen = trongHoanToan && soNguoi <= sucChuaP;
  const duocGhep = !khac && trong >= soNguoi
    && (gioiPhong === 'Không phân biệt' || gioiPhong === gioiNhom);

  if (khac && duocNguyen) return { hinhThuc: 'Nguyen', lyDo: 'Nhóm có cả nam và nữ nên không ghép giường chung phòng được.' };
  if (duocNguyen && !duocGhep) return { hinhThuc: 'Nguyen', lyDo: 'Không ghép giường được (nhóm khác giới hoặc phòng đã giữ cho giới khác).' };
  if (duocGhep && !duocNguyen) return { hinhThuc: 'Ghep', lyDo: 'Phòng đang có người ở nên chỉ ghép giường được.' };
  // Cả hai đều hợp lệ: nhóm LẤP ĐẦY phòng thì đương nhiên là thuê trọn.
  if (duocNguyen && duocGhep && soNguoi === sucChuaP) {
    return { hinhThuc: 'Nguyen', lyDo: `${soNguoi} người lấp đầy phòng ${sucChuaP} chỗ nên là thuê nguyên phòng.` };
  }
  return { hinhThuc: null, lyDo: '' };   // còn dư chỗ -> Sale hỏi khách rồi quyết
};

export default function LapPhieuCocTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState(null);
  const [hinhThuc, setHinhThuc] = useState('Ghep');       // 'Ghep' | 'Nguyen'
  const [giuongTrong, setGiuongTrong] = useState([]);
  const [giuongChon, setGiuongChon] = useState([]);
  const [loadingGiuong, setLoadingGiuong] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detailItem, setDetailItem] = useState(null);
  const [page, setPage] = useState(1);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getDanhSachChoLapPhieu();
      setList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDanhSach(); }, [loadDanhSach]);

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
    baseFiltered.forEach((it) => { if (c[it.trangThai] != null) c[it.trangThai] += 1; });
    return c;
  }, [baseFiltered]);

  // "Chờ lập" -> cũ nhất trước (FIFO); các nhóm khác -> mới nhất trước.
  const filteredList = useMemo(() => {
    const arr = statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThai === statusFilter);
    const fifo = statusFilter === 'Chờ lập';
    return [...arr].sort((a, b) => {
      const da = a.ngayDangKy ? new Date(a.ngayDangKy).getTime() : 0;
      const db = b.ngayDangKy ? new Date(b.ngayDangKy).getTime() : 0;
      return fifo ? da - db : db - da;
    });
  }, [baseFiltered, statusFilter]);

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

  // Mở modal lập phiếu. PHÒNG ĐÃ CỐ ĐỊNH (Sale chốt ở DC01, Quản lý duyệt ở DC02).
  const openCreate = async (item) => {
    setSelected(item);
    setGiuongChon([]);
    setGiuongTrong([]);
    setHinhThuc(suyHinhThuc(item).hinhThuc || 'Ghep');
    if (!item.maPhong) return;

    setLoadingGiuong(true);
    try {
      const { data } = await datCocApi.getGiuongTrong(item.maPhong);
      setGiuongTrong(data || []);
    } catch {
      setGiuongTrong([]);
    } finally {
      setLoadingGiuong(false);
    }
  };

  const toggleGiuong = (maGiuong) => {
    setGiuongChon((prev) => (prev.includes(maGiuong)
      ? prev.filter((g) => g !== maGiuong)
      : [...prev, maGiuong]));
  };

  const doiHinhThuc = (ht) => {
    setHinhThuc(ht);
    setGiuongChon([]);   // đổi hình thức thì bỏ giường đã chọn
  };

  const khacGioi = selected ? (selected.khacGioi === 1 || selected.khacGioi === true) : false;
  const isGhep = !khacGioi && hinhThuc === 'Ghep';
  const soNguoiCan = Number(selected?.soNguoiDuKienO || 0);
  const sucChua = Number(selected?.sucChuaToiDa || 0);

  const { hinhThuc: hinhThucTuSuy } = suyHinhThuc(selected);
  const khoaHinhThuc = !!hinhThucTuSuy;

  //   Ghép giường  -> số giường chọn = số người dự kiến ở
  //   Nguyên phòng -> sức chứa đủ (phòng trống hoàn toàn đã được suyHinhThuc bảo đảm)
  const dukienHopLe = isGhep
    ? giuongChon.length === soNguoiCan && soNguoiCan > 0
    : sucChua >= soNguoiCan;

  const handleLapPhieu = async () => {
    if (!selected || !dukienHopLe) {
      setResult({ type: 'error', title: 'Lập phiếu thất bại.' });
      return;
    }
    setSubmitting(true);
    try {
      await datCocApi.create({
        maDangKy: selected.maDangKy,
        hinhThucThue: isGhep ? 'Ghép giường' : 'Nguyên phòng',
        // KHÔNG gửi maPhong: SP tự lấy phòng khách đã chốt ở DC01.
        giuongs: isGhep ? giuongChon : []
      });
      setSelected(null);
      await loadDanhSach();
      setResult({ type: 'success', title: 'Đã gửi phiếu cho kế toán.' });
    } catch {
      setResult({ type: 'error', title: 'Lập phiếu thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ flex: '2 1 240px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên khách hàng, SĐT, mã hồ sơ/phiếu cọc..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
        </div>
        {search && (
          <button type="button" onClick={() => setSearch('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
        )}
      </div>

      <StatusFilterTabs
        className="status-pill-tabs-offset"
        items={[{ key: 'all', label: 'Tất cả' }, ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_CONFIG[s].chip }))]}
        activeKey={statusFilter}
        counts={counts}
        onChange={setStatusFilter}
      />

      <table className="ktp-table">
        <thead>
          <tr>
            <th>Mã hồ sơ</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Phòng</th>
            <th>Số người</th>
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
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có hồ sơ nào ở nhóm này</td></tr>
          ) : pagedList.map((item) => (
            <tr key={item.maDangKy}>
              <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maDangKy}</td>
              <td>{item.hoTen}</td>
              <td>{item.soDienThoai}</td>
              <td>{item.tenPhong || item.maPhong || '—'}</td>
              <td>
                <SoNguoiBadge
                  soNguoi={item.soNguoiDuKienO}
                  soNam={item.soNam}
                  soNu={item.soNu}
                  khacGioi={item.khacGioi === 1 || item.khacGioi === true}
                />
              </td>
              <td className="text-center"><StatusBadge trangThai={item.trangThai} /></td>
              <td className="text-center">
                {STATUS_CONFIG[item.trangThai]?.action === 'lap' ? (
                  <button className="ktp-btn-action-fill" onClick={() => openCreate(item)}>Lập phiếu</button>
                ) : (
                  <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765', padding: '6px 12px', fontSize: '13px' }} onClick={() => setDetailItem(item)}>Xem chi tiết</button>
                )}
              </td>
            </tr>
          ))}
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

      {/* Modal lập phiếu — KHÔNG có bất kỳ con số tiền nào */}
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
                    <div className="ktp-info-row"><span className="ktp-info-label">Mã phiếu đăng ký:</span> <span className="ktp-info-value">{selected.maDangKy}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Số người:</span> <span className="ktp-info-value">{selected.soNguoiDuKienO} ({selected.soNam ?? 0} nam, {selected.soNu ?? 0} nữ){khacGioi ? ' · khác giới' : ''}</span></div>
                    <div className="ktp-info-row"><span className="ktp-info-label">Ngày đăng ký:</span> <span className="ktp-info-value">{formatNgay(selected.ngayDangKy)}</span></div>
                  </div>
                </div>
              </div>

              <div className="ktp-section ktp-info-box-outline">
                <h4 className="ktp-section-title"><Icon name="apartment" /> 3. Phòng & hình thức thuê</h4>

                {/* PHÒNG CỐ ĐỊNH — Sale chốt ở DC01, Quản lý đã duyệt ở DC02 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid #3b8280', background: '#eaf4f3', marginBottom: 14 }}>
                  <Icon name="meeting_room" style={{ color: '#2f6765' }} />
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>{selected.tenPhong || selected.maPhong || '—'}</span>
                  <span style={{ fontSize: 12, color: '#6f797a', marginLeft: 'auto', textAlign: 'right' }}>
                    {/* Chỉ nêu giới khi phòng ĐÃ BỊ KHÓA giới; 'Không phân biệt' là mặc định */}
                    {(selected.gioiTinhChoPhep === 'Nam' || selected.gioiTinhChoPhep === 'Nữ')
                      && `giới tính: ${selected.gioiTinhChoPhep} · `}
                    sức chứa {selected.sucChuaToiDa} · trống {selected.soChoTrong} giường
                  </span>
                </div>

                {/* HÌNH THỨC THUÊ — chỉ cho chọn khi CẢ HAI đều hợp lệ; xác định được thì khóa */}
                <label className="ktp-mini-label" style={{ display: 'block', marginBottom: 8 }}>Hình thức thuê</label>
                {khoaHinhThuc ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid #e1e6e6', background: '#f4f7f7' }}>
                    <Icon name={hinhThucTuSuy === 'Ghep' ? 'bed' : 'meeting_room'} style={{ color: '#2f6765' }} />
                    <span style={{ fontWeight: 700, color: '#191c1d' }}>
                      {hinhThucTuSuy === 'Ghep' ? 'Ghép giường' : 'Nguyên phòng'}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label><input type="radio" name="hinhThuc" checked={hinhThuc === 'Ghep'} onChange={() => doiHinhThuc('Ghep')} /> Ghép giường</label>
                    <label><input type="radio" name="hinhThuc" checked={hinhThuc === 'Nguyen'} onChange={() => doiHinhThuc('Nguyen')} /> Nguyên phòng</label>
                  </div>
                )}

                {/* GHÉP GIƯỜNG -> chọn giường trong phòng đã chốt */}
                {isGhep && (
                  <div style={{ marginTop: 14 }}>
                    <p className="ktp-mini-label" style={{ marginBottom: 8 }}>
                      Chọn đúng <strong>{soNguoiCan}</strong> giường trong phòng
                    </p>
                    {loadingGiuong ? (
                      <p style={{ color: '#6f797a', fontSize: 13 }}>Đang tải giường trống...</p>
                    ) : giuongTrong.length === 0 ? (
                      <p style={{ color: '#b3261e', fontSize: 13 }}>Phòng không còn giường trống.</p>
                    ) : (
                      <div className="kp-bed-grid">
                        {giuongTrong.map((g) => {
                          const sel = giuongChon.includes(g.maGiuong);
                          const dis = !sel && giuongChon.length >= soNguoiCan;
                          return (
                            <label key={g.maGiuong} className={`kp-bed-card ${sel ? 'is-selected' : ''} ${dis ? 'is-disabled' : ''}`}>
                              <input type="checkbox" checked={sel} disabled={dis} className="kp-bed-input-hidden"
                                onChange={() => !dis && toggleGiuong(g.maGiuong)} />
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
                  </div>
                )}

                <p style={{ fontSize: 13, marginTop: 12, fontWeight: 600, color: dukienHopLe ? '#2f6765' : '#a43c12' }}>
                  {isGhep
                    ? `Đã chọn ${giuongChon.length}/${soNguoiCan} giường`
                    : `Thuê trọn ${sucChua} chỗ · nhóm ${soNguoiCan} người`}
                  {dukienHopLe ? ' · Hợp lệ' : ' · Chưa hợp lệ'}
                </p>
              </div>
            </div>
            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" onClick={() => setSelected(null)} disabled={submitting}>Hủy</button>
              <button className="ktp-btn-submit" onClick={handleLapPhieu} disabled={submitting || !dukienHopLe}>{submitting ? 'Đang lập...' : 'Lập phiếu đặt cọc'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết phiếu đã lập (read-only) — vẫn KHÔNG có tiền */}
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
                  ['Phòng', detailItem.tenPhong || detailItem.maPhong || '—'],
                  ['Giường', detailItem.danhSachGiuong || 'Trọn phòng'],
                  ['Hình thức thuê', detailItem.hinhThucThuePhieu || '—'],
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
    </section>
  );
}
