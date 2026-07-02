import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { xacNhanPhanHoiApi } from './xacnhanphanhoi.api.js';
import '../nhanVienSale/dangKyTraPhongTab.css';
import '../nhanVienKeToan/nhanVienKeToanPortal.css';

function fmtMoney(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN') + 'đ';
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

function TrangThaiBadge({ trangThai }) {
  const map = {
    'Chờ phản hồi':        { bg: '#fff3cd', color: '#856404', border: '#ffeeba' },
    'Cần điều chỉnh':      { bg: '#fde8e8', color: '#ba1a1a', border: '#f8c4c4' },
    'Chờ hoàn cọc':        { bg: '#e8f4fd', color: '#0d6efd', border: '#b8dcf8' },
    'Chờ thanh toán thêm': { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
    'Đã quyết toán':       { bg: '#e6f4ea', color: '#137333', border: '#a8d5b5' },
  };
  const s = map[trangThai] || { bg: '#f3f4f5', color: '#6f797a', border: '#e1e3e4' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {trangThai}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #e1e3e4', fontSize: 13 }}>
      <span style={{ color: '#6f797a' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{children}</span>
    </div>
  );
}

function SummaryRow({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e1e3e4', fontSize: 13 }}>
      <span style={{ color: '#6f797a' }}>{label}</span>
      <strong style={{ color: color || '#191c1d', fontWeight: bold ? 700 : 500 }}>{value}</strong>
    </div>
  );
}

function DeductCard({ title, val, note }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #d5dddd', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e1e3e4', paddingBottom: 8, marginBottom: 8 }}>
        <h5 style={{ margin: 0, color: '#00666d', fontSize: 13, fontWeight: 800 }}>{title}</h5>
        <strong style={{ color: '#ba1a1a', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtMoney(val)}</strong>
      </div>
      <p style={{ margin: 0, color: '#6f797a', fontSize: 12, fontStyle: 'italic' }}>{note}</p>
    </div>
  );
}

function SectionLabel({ icon, text }) {
  return (
    <p style={{ margin: '0 0 10px 0', fontSize: 12, fontWeight: 700, color: '#3b8280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} style={{ fontSize: 14 }} /> {text}
    </p>
  );
}

export default function XacNhanPhanHoi() {
  const [ds, setDs]               = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchQ, setSearchQ]     = useState('');
  const [activeSearch, setActive] = useState('');
  const [toast, setToast]         = useState({ msg: '', type: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [chiTiet, setChiTiet]     = useState(null);
  const [chiTietKhauTru, setChiTietKhauTru] = useState(null);
  const [dsPhong, setDsPhong]     = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [isSubmitted, setIsSubmitted]     = useState(false);
  const [resultMsg, setResultMsg]         = useState('');

  useEffect(() => {
    if (!toast.msg) return;
    const t = setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
    return () => clearTimeout(t);
  }, [toast.msg]);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await xacNhanPhanHoiApi.getDanhSachChoXuLy();
      setDs(res.data.danhSach || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Lỗi tải danh sách.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = async (row) => {
    setSelected(row); setModalOpen(true); setLoadingDetail(true);
    setIsSubmitted(false); setChiTiet(null); setDsPhong([]); setChiTietKhauTru(null);
    try {
      const res = await xacNhanPhanHoiApi.getChiTietPhanHoi(row.maDoiSoat);
      setChiTiet(res.data.chiTiet);
      setChiTietKhauTru(res.data.chiTietKhauTru || null);
      setDsPhong(res.data.danhSachPhong || []);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Không thể tải chi tiết.', 'error');
      setModalOpen(false);
    } finally { setLoadingDetail(false); }
  };

  const handleXuLy = async (hanhDong) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await xacNhanPhanHoiApi.xuLyPhanHoi({ maDoiSoat: selected.maDoiSoat, hanhDong });
      load();
      setResultMsg(hanhDong === 'XacNhanDieuChinh'
        ? 'Yêu cầu điều chỉnh đã chuyển cho nhân viên kế toán.'
        : 'Đã giữ nguyên kết quả đối soát và chuyển sang bước tiếp theo.');
      setIsSubmitted(true);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Lỗi xử lý phản hồi.', 'error');
    } finally { setSubmitting(false); }
  };

  const filtered = ds.filter(r =>
    r.hoTenKhach?.toLowerCase().includes(activeSearch.toLowerCase()) ||
    r.maDoiSoat?.toLowerCase().includes(activeSearch.toLowerCase()) ||
    r.maPhieuTra?.toLowerCase().includes(activeSearch.toLowerCase()) ||
    r.maHoSo?.toLowerCase().includes(activeSearch.toLowerCase())
  );

  // ─── kết quả tài chính ───────────────────────────────────────────
  const hoan    = chiTiet ? Number(chiTiet.soTienHoanThucTe) : 0;
  const thuThem = chiTiet ? Number(chiTiet.soTienKhachPhaiTT) : 0;
  const ketQuaColor  = hoan > 0 ? '#00666d' : thuThem > 0 ? '#ba1a1a' : '#3f494a';
  const ketQuaBg     = hoan > 0 ? '#f0f9f9'  : thuThem > 0 ? '#f9e8e3'  : '#eef3f3';
  const ketQuaTitle  = hoan > 0 ? 'Khách được hoàn cọc'
                      : thuThem > 0 ? 'Khách phải thanh toán thêm'
                      : 'Không hoàn cọc và không thu thêm';
  const ketQuaAmount = hoan > 0 ? fmtMoney(hoan) : thuThem > 0 ? fmtMoney(thuThem) : null;
  const ketQuaIcon   = hoan > 0 ? 'check_circle' : thuThem > 0 ? 'payments' : 'task_alt';

  return (
    <div>
      {/* Search */}
      <div className="tp-search-container">
        <form className="tp-search-row" onSubmit={e => { e.preventDefault(); setActive(searchQ); }}>
          <div className="tp-search-col">
            <div className="tp-search-label">TÌM KIẾM</div>
            <div className="tp-search-wrap">
              <input className="ktp-input tp-search-input-no-icon" type="text"
                placeholder="Tìm theo tên khách, mã đối soát, mã phiếu trả..."
                value={searchQ} onChange={e => setSearchQ(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="tp-btn-search">Tìm kiếm</button>
          <button type="button" className="tp-btn-search"
            style={{ backgroundColor: 'transparent', color: '#3b8280', border: '1px solid #3b8280' }}
            onClick={load}>
            <Icon name="refresh" /> Làm mới
          </button>
        </form>
      </div>

      {/* Table */}
      <section className="tp-list-panel">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6f797a' }}>Đang tải...</div>
        ) : (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã đối soát</th><th>Khách hàng</th><th>Hồ sơ</th>
                <th>Phòng</th><th>Ngày lập</th>
                <th className="text-center">Trạng thái</th><th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: '#6f797a' }}>
                  Không có phiếu đối soát nào đang chờ xử lý phản hồi.
                </td></tr>
              ) : filtered.map(row => (
                <tr key={row.maDoiSoat}>
                  <td style={{ fontWeight: 700, color: '#2f6765' }}>{row.maDoiSoat}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div>
                    <div style={{ fontSize: 12, color: '#6f797a' }}>{row.sdtKhach}</div>
                  </td>
                  <td>
                    <span className={`tp-loai-badge ${row.maHopDong ? 'hd' : 'dc'}`} style={{ fontSize: 11 }}>
                      {row.maHopDong ? 'Hợp đồng' : 'Đặt cọc'}
                    </span>
                    <div style={{ fontSize: 12, color: '#6f797a', marginTop: 2 }}>{row.maHoSo}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.tenPhong}</div>
                    {row.maGiuong && <div style={{ fontSize: 12, color: '#6f797a' }}>Giường {row.maGiuong}</div>}
                  </td>
                  <td>{fmtDate(row.ngayLap)}</td>
                  <td className="text-center"><TrangThaiBadge trangThai={row.trangThaiDoiSoat} /></td>
                  <td className="text-center">
                    <button className="ktp-btn-action-fill" onClick={() => openModal(row)}>Xử lý</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && <div style={{ padding: '8px 16px', fontSize: 13, color: '#6f797a' }}>{filtered.length} phiếu chờ xử lý</div>}
      </section>

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div className="ktp-modal qt-modal" style={{ maxWidth: 'min(1020px,96vw)', padding: 0, backgroundColor: '#fff', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 700 }}>Xử lý phản hồi đối soát</h3>
                {selected && <p className="ktp-modal-header-sub" style={{ color: 'rgba(255,255,255,0.8)', margin: '2px 0 0' }}>
                  Mã đối soát: <span style={{ color: '#fff' }}>{selected.maDoiSoat}</span>
                </p>}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <Icon name="close" />
              </button>
            </div>

            {/* Body */}
            <div className="ktp-modal-body qt-modal-body" style={{ maxHeight: '74vh', overflowY: 'auto' }}>
              {loadingDetail ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#6f797a' }}>Đang tải dữ liệu...</div>
              ) : chiTiet ? (
                <>
                  {/* Cột trái: thông tin + khấu trừ + phản hồi */}
                  <div className="qt-main-column">
                    {/* --- Row: 2 card info --- */}
                    <div className="ktp-grid-2">
                      <div className="ktp-section ktp-info-box-outline">
                        <SectionLabel icon="person" text="1. Thông tin khách hàng" />
                        <InfoRow label="Họ tên">{chiTiet.hoTenKhach}</InfoRow>
                        <InfoRow label="Số điện thoại">{chiTiet.sdtKhach || '—'}</InfoRow>
                        <InfoRow label="Email">{chiTiet.emailKhach || '—'}</InfoRow>
                        <InfoRow label="CCCD">{chiTiet.cccd}</InfoRow>
                      </div>
                      <div className="ktp-section ktp-info-box-outline">
                        <SectionLabel icon="description" text={`2. THÔNG TIN ${chiTiet.maHopDong ? 'HỢP ĐỒNG' : 'PHIẾU ĐẶT CỌC'}`} />
                        <InfoRow label="Mã hồ sơ"><strong>{chiTiet.maHoSo}</strong></InfoRow>
                        <InfoRow label="Tiền cọc ban đầu"><strong style={{ color: '#00666d' }}>{fmtMoney(chiTiet.tienCocBanDau)}</strong></InfoRow>
                        <InfoRow label="Phòng/Giường">
                          {dsPhong.map(p => `${p.tenPhong}${p.maGiuong ? ` - ${p.maGiuong}` : ''}`).join(', ') || '—'}
                        </InfoRow>
                        {chiTiet.maHopDong ? (
                          <>
                            <InfoRow label="Thời hạn">{`${fmtDate(chiTiet.ngayBatDau)} - ${fmtDate(chiTiet.ngayKetThuc)}`}</InfoRow>
                            <InfoRow label="Kỳ thanh toán">{chiTiet.kyThanhToan || '—'}</InfoRow>
                          </>
                        ) : (
                          <InfoRow label="Ngày đặt cọc">{fmtDate(chiTiet.thoiDiemDatCoc)}</InfoRow>
                        )}
                        <InfoRow label="Ngày trả phòng">{fmtDate(chiTiet.ngayTraThucTe)}</InfoRow>
                      </div>
                    </div>

                    {/* --- Các khoản khấu trừ (Chỉ hiện cho hợp đồng) --- */}
                    {chiTiet.maHopDong && (
                      <div>
                        <p className="ktp-section-title" style={{ marginBottom: 10 }}>
                          <Icon name="remove_circle_outline" style={{ fontSize: 16 }} /> 3. Các khoản khấu trừ
                        </p>
                      <div className="qt-deduction-grid">
                        {/* Thue no */}
                        <div style={{ background: '#fff', border: '1px solid #d5dddd', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e1e3e4', paddingBottom: 8, marginBottom: 8 }}>
                            <h5 style={{ margin: 0, color: '#00666d', fontSize: 13, fontWeight: 800 }}>Tiền thuê còn nợ</h5>
                            <strong style={{ color: '#ba1a1a', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtMoney(chiTiet.tienThueConNo)}</strong>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(!chiTietKhauTru?.hoaDonConNo || chiTietKhauTru.hoaDonConNo.length === 0) ? (
                              <p style={{ margin: 0, color: '#6f797a', fontSize: 12, fontStyle: 'italic' }}>Không có hóa đơn còn nợ.</p>
                            ) : chiTietKhauTru.hoaDonConNo.map(hd => (
                              <div key={hd.maHoaDon} style={{ borderBottom: '1px dashed #e1e3e4', paddingBottom: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#191c1d' }}>Hóa đơn {hd.maHoaDon}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ba1a1a' }}>{fmtMoney(hd.tongTienNo)}</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#6f797a' }}>Ngày lập: {fmtDate(hd.ngayLap)}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sua chua */}
                        <div style={{ background: '#fff', border: '1px solid #d5dddd', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e1e3e4', paddingBottom: 8, marginBottom: 8 }}>
                            <h5 style={{ margin: 0, color: '#00666d', fontSize: 13, fontWeight: 800 }}>Chi phí sửa chữa</h5>
                            <strong style={{ color: '#ba1a1a', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtMoney(chiTiet.tongChiPhiSuaChua)}</strong>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(!chiTietKhauTru?.bienBanKiemTra || chiTietKhauTru.bienBanKiemTra.length === 0) ? (
                              <p style={{ margin: 0, color: '#6f797a', fontSize: 12, fontStyle: 'italic' }}>Chưa có biên bản kiểm tra phòng.</p>
                            ) : chiTietKhauTru.bienBanKiemTra.map(bb => {
                              const huHongs = chiTietKhauTru.chiTietHuHong?.filter(h => h.maBienBanKT === bb.maBienBanKT) || [];
                              return (
                                <div key={bb.maBienBanKT}>
                                  <div style={{ borderBottom: '1px dashed #e1e3e4', paddingBottom: 6, marginBottom: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#191c1d' }}>Biên bản {bb.maBienBanKT}</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ba1a1a' }}>{fmtMoney(bb.tongChiPhiSuaChua)}</span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#6f797a' }}>Ngày kiểm tra: {fmtDate(bb.ngayKiemTra)}</div>
                                  </div>
                                  {huHongs.map(hh => (
                                    <div key={hh.maChiTietHH} style={{ borderBottom: '1px dashed #e1e3e4', paddingBottom: 4, marginBottom: 4 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#191c1d' }}>{hh.tenTaiSan} - {hh.maPhong}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#ba1a1a' }}>{fmtMoney(hh.chiPhiSuaChua)}</span>
                                      </div>
                                      <div style={{ fontSize: 11, color: '#6f797a' }}>{hh.moTaHuHong || 'Chưa có mô tả hư hỏng'}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tien phat */}
                        <div style={{ background: '#fff', border: '1px solid #d5dddd', borderRadius: 8, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e1e3e4', paddingBottom: 8, marginBottom: 8 }}>
                            <h5 style={{ margin: 0, color: '#00666d', fontSize: 13, fontWeight: 800 }}>Tiền phạt</h5>
                            <strong style={{ color: '#ba1a1a', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtMoney(chiTiet.tienPhat)}</strong>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(!chiTietKhauTru?.bienBanViPham || chiTietKhauTru.bienBanViPham.length === 0) ? (
                              <p style={{ margin: 0, color: '#6f797a', fontSize: 12, fontStyle: 'italic' }}>Không có biên bản vi phạm.</p>
                            ) : chiTietKhauTru.bienBanViPham.map(vp => (
                              <div key={vp.maBBViPham} style={{ borderBottom: '1px dashed #e1e3e4', paddingBottom: 6, marginBottom: 4 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#191c1d', maxWidth: '65%' }}>
                                    Biên bản {vp.maBBViPham} - {vp.tenDieuKhoan}
                                  </span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ba1a1a' }}>{fmtMoney(vp.soTienPhat)}</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#6f797a' }}>
                                  Ngày vi phạm: {fmtDate(vp.ngayViPham)}<br/>
                                  {vp.moTaViPham}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      </div>
                    )}

                    {/* --- Phản hồi khách --- */}
                    <div style={{ backgroundColor: '#fff8f0', border: '1px solid #f8c4c4', borderRadius: 8, padding: '14px 16px' }}>
                      <p className="ktp-section-title" style={{ marginBottom: 8, color: '#ba1a1a' }}>
                        <Icon name="feedback" style={{ fontSize: 16, color: '#ba1a1a' }} /> Yêu cầu điều chỉnh của khách hàng
                      </p>
                      <p style={{ margin: 0, fontSize: 14, color: '#3f494a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {chiTiet.ghiChuPhanHoiKhach || '(Khách hàng chưa nhập nội dung phản hồi)'}
                      </p>
                    </div>
                  </div>

                  {/* Cột phải: Summary panel */}
                  <div className="qt-summary-panel" style={{ background: '#fff', border: '1px solid #d5dddd', borderRadius: 8, padding: 16, alignSelf: 'start', position: 'sticky', top: 0 }}>
                    <p className="ktp-section-title" style={{ marginBottom: 14 }}>
                      <Icon name="receipt_long" style={{ fontSize: 16 }} /> Tóm tắt đối soát
                    </p>
                    <SummaryRow label="Tiền cọc ban đầu"   value={fmtMoney(chiTiet.tienCocBanDau)} />
                    {chiTiet.maHopDong && <SummaryRow label="Số tháng lưu trú"   value={chiTiet.soThangLuuTru ?? 0} />}
                    <SummaryRow label="Tỷ lệ hoàn cọc"     value={`${Number(chiTiet.tyLeHoanCocHienTai || 0).toFixed(0)}%`} />
                    <SummaryRow label="Cọc được hoàn"       value={fmtMoney(chiTiet.tienCocDuocHoan)} color="#00666d" />
                    {chiTiet.maHopDong && <SummaryRow label="Tổng khấu trừ"       value={fmtMoney(chiTiet.tongKhauTru)} color="#ba1a1a" bold />}
                    <SummaryRow label="Số tiền hoàn thực tế" value={fmtMoney(chiTiet.soTienHoanThucTe)} color="#137333" bold />
                    {chiTiet.maHopDong && <SummaryRow label="Khách thanh toán thêm"  value={fmtMoney(chiTiet.soTienKhachPhaiTT)} color="#ba1a1a" bold />}

                    <div style={{ marginTop: 14, borderRadius: 8, padding: '12px 14px', backgroundColor: ketQuaBg, display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${ketQuaColor}40` }}>
                      <Icon name={ketQuaIcon} style={{ fontSize: 32, color: ketQuaColor }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: ketQuaColor }}>Kết quả: {ketQuaTitle}</div>
                        {ketQuaAmount && <div style={{ fontSize: 24, fontWeight: 800, color: ketQuaColor, marginTop: 2 }}>{ketQuaAmount}</div>}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            {!isSubmitted && chiTiet && !loadingDetail && (
              <div className="ktp-modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#6f797a', maxWidth: '42%' }}>
                  {/* Kiểm tra nội dung phản hồi và đối chiếu với biên bản trả phòng trước khi quyết định. */}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModalOpen(false)} className="ktp-btn-cancel">Đóng</button>
                  <button disabled={submitting} onClick={() => handleXuLy('XacNhanDieuChinh')}
                    style={{ backgroundColor: '#ba1a1a', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                    <Icon name="edit" style={{ fontSize: 16 }} /> Xác nhận điều chỉnh
                  </button>
                  <button disabled={submitting} onClick={() => handleXuLy('GiuNguyen')}
                    className="ktp-btn-submit"
                    style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    <Icon name="check_circle" style={{ fontSize: 16 }} /> Giữ nguyên đối soát
                  </button>
                </div>
              </div>
            )}
            {isSubmitted && (
              <div className="ktp-modal-footer" style={{ justifyContent: 'flex-end' }}>
                <button onClick={() => setModalOpen(false)} className="ktp-btn-submit">Đóng</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success modal */}
      {isSubmitted && (
        <div className="ktp-modal-overlay" style={{ zIndex: 1100 }} onClick={() => { setIsSubmitted(false); setModalOpen(false); }}>
          <div className="ktp-modal" style={{ maxWidth: 420, width: '90%', padding: 32, borderRadius: 12, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#191c1d', margin: '0 0 10px 0' }}>Xử lý thành công!</h3>
            <p style={{ fontSize: 14, color: '#3f494a', margin: '0 0 24px 0', lineHeight: 1.6 }}>{resultMsg}</p>
            <button onClick={() => { setIsSubmitted(false); setModalOpen(false); }} className="ktp-btn-submit" style={{ width: '100%', justifyContent: 'center' }}>Đóng</button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`tp-toast ${toast.msg ? 'show' : ''}`} style={{ backgroundColor: toast.type === 'error' ? '#ba1a1a' : undefined }}>
        {toast.msg}
      </div>
    </div>
  );
}
