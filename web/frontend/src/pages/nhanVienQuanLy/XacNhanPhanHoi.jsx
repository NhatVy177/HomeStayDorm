import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { xacNhanPhanHoiApi } from './xacnhanphanhoi.api.js';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import '../nhanVienSale/dangKyTraPhongTab.css';
import '../nhanVienKeToan/nhanVienKeToanPortal.css';

function moneyValue(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(val) {
  if (val == null) return '—';
  return moneyValue(val).toLocaleString('vi-VN') + 'đ';
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

function containsAny(text, keywords) {
  const normalized = String(text || '').toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function isElectric(row) {
  return containsAny(row?.tenDichVu, ['điện', 'dien']);
}

function isWater(row) {
  return containsAny(row?.tenDichVu, ['nước', 'nuoc']);
}

function formatRoom(dsPhong) {
  return dsPhong?.map((p) => `${p.tenPhong || p.maPhong || 'Phòng'}${p.maGiuong ? ` - ${p.maGiuong}` : ''}`).join(', ') || '—';
}

function TrangThaiBadge({ trangThai }) {
  const map = {
    'Chờ phản hồi': { bg: '#fff3cd', color: '#856404', border: '#ffeeba' },
    'Cần điều chỉnh': { bg: '#fde8e8', color: '#ba1a1a', border: '#f8c4c4' },
    'Chờ hoàn cọc': { bg: '#e8f4fd', color: '#0d6efd', border: '#b8dcf8' },
    'Chờ thanh toán thêm': { bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
    'Đã quyết toán': { bg: '#e6f4ea', color: '#137333', border: '#a8d5b5' },
  };
  const s = map[trangThai] || { bg: '#f3f4f5', color: '#6f797a', border: '#e1e3e4' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {trangThai || '—'}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px dashed #e1e3e4', fontSize: 13 }}>
      <span style={{ color: '#6f797a' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#191c1d', textAlign: 'right', minWidth: 0 }}>{children ?? '—'}</span>
    </div>
  );
}

function SummaryRow({ label, value, tone, strong }) {
  const color = tone === 'danger' ? '#ba1a1a' : tone === 'success' ? '#137333' : tone === 'primary' ? '#00666d' : '#191c1d';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px dashed #e1e3e4', fontSize: 13 }}>
      <span style={{ color: '#6f797a' }}>{label}</span>
      <strong style={{ color, fontWeight: strong ? 800 : 600, textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function SectionTitle({ icon, children, danger }) {
  return (
    <h4 className="ktp-section-title" style={{ margin: '0 0 12px 0', color: danger ? '#ba1a1a' : '#3b8280' }}>
      <Icon name={icon} style={{ fontSize: 16 }} /> {children}
    </h4>
  );
}

function EmptyLine({ children }) {
  return <p style={{ margin: 0, color: '#6f797a', fontSize: 12, fontStyle: 'italic' }}>{children}</p>;
}

function FinanceGroup({ group }) {
  const [open, setOpen] = useState(false);
  return (
    <section style={{
      background: '#fff',
      border: '1px solid #d5dddd',
      borderRadius: 8,
      padding: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #e1e3e4', paddingBottom: 8, marginBottom: 8 }}>
        <div>
          <h5 style={{ margin: 0, color: '#00666d', fontSize: 13, fontWeight: 800 }}>{group.title}</h5>
        </div>
        <strong style={{ color: group.total > 0 ? '#ba1a1a' : '#3f494a', fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtMoney(group.total)}</strong>
      </div>

      {group.details.length === 0 ? (
        <EmptyLine>{group.emptyText}</EmptyLine>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ border: 'none', background: 'transparent', color: '#00666d', cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Icon name={open ? 'expand_less' : 'expand_more'} style={{ fontSize: 16 }} />
            {open ? 'Ẩn chi tiết' : 'Xem chi tiết'}
          </button>
          {open && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.details.map((item, idx) => (
                <div key={`${group.id}-${idx}`} style={{ border: '1px solid #edf0f0', borderRadius: 6, padding: '8px 10px', backgroundColor: '#fbfcfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: 12, color: '#191c1d' }}>{item.title}</strong>
                    <strong style={{ fontSize: 12, color: '#ba1a1a', whiteSpace: 'nowrap' }}>{fmtMoney(item.amount)}</strong>
                  </div>
                  {item.meta?.filter(Boolean).map((line, lineIdx) => (
                    <div key={lineIdx} style={{ fontSize: 11, color: '#6f797a', marginTop: 3 }}>{line}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function buildFinanceGroups(chiTiet, chiTietKhauTru) {
  const invoices = chiTietKhauTru?.hoaDonConNo || [];
  const detailRows = chiTietKhauTru?.chiTietHoaDon || [];
  const damages = chiTietKhauTru?.chiTietHuHong || [];
  const violations = chiTietKhauTru?.bienBanViPham || [];

  const electricDetails = detailRows.filter(isElectric);
  const waterDetails = detailRows.filter(isWater);
  const serviceDetails = detailRows.filter((row) => !isElectric(row) && !isWater(row));
  const electricTotal = electricDetails.reduce((s, row) => s + moneyValue(row.thanhTien), 0);
  const waterTotal = waterDetails.reduce((s, row) => s + moneyValue(row.thanhTien), 0);
  const serviceDetailTotal = serviceDetails.reduce((s, row) => s + moneyValue(row.thanhTien), 0);
  const serviceTotalFromSummary = moneyValue(chiTiet?.tienDichVuConNo);
  const otherServiceTotal = Math.max(serviceTotalFromSummary - electricTotal - waterTotal - serviceDetailTotal, 0);

  const mapInvoice = (row) => ({
    title: row.maHoaDon || 'Hóa đơn',
    amount: row.thanhTien,
    meta: [
      row.tenKhoanThue || 'Tiền thuê',
      `Trạng thái: ${row.trangThai || '—'}`,
      `Ngày lập: ${fmtDate(row.ngayLap)}`,
    ],
  });

  const mapService = (row, isOther) => ({
    title: isOther ? `${row.maHoaDon || 'Hóa đơn'} - ${row.tenDichVu || 'Dịch vụ'}` : (row.maHoaDon || 'Hóa đơn'),
    amount: row.thanhTien,
    meta: [
      `Số lượng: ${row.soLuong ?? '—'} ${row.donViTinh || ''}`.trim(),
      `Đơn giá: ${fmtMoney(row.donGia)}`,
      row.maPhieuGhi ? `Phiếu ghi: ${row.maPhieuGhi}` : null,
    ],
  });

  return [
    {
      id: 'rent',
      title: 'Tiền thuê còn nợ',
      total: moneyValue(chiTiet?.tienThueConNo),
      details: invoices.map(mapInvoice),
      emptyText: 'Không có tiền thuê còn nợ.',
    },
    {
      id: 'electric',
      title: 'Tiền điện còn nợ',
      total: electricTotal,
      details: electricDetails.map(r => mapService(r, false)),
      emptyText: 'Không có tiền điện còn nợ.',
    },
    {
      id: 'water',
      title: 'Tiền nước còn nợ',
      total: waterTotal,
      details: waterDetails.map(r => mapService(r, false)),
      emptyText: 'Không có tiền nước còn nợ.',
    },
    {
      id: 'service',
      title: 'Tiền dịch vụ còn nợ',
      total: serviceDetailTotal + otherServiceTotal,
      details: [
        ...serviceDetails.map(r => mapService(r, true)),
        ...(otherServiceTotal > 0 ? [{ title: 'Dịch vụ khác', amount: otherServiceTotal, meta: ['Tổng dịch vụ còn nợ theo phiếu đối soát'] }] : []),
      ],
      emptyText: 'Không có tiền dịch vụ còn nợ.',
    },
    {
      id: 'repair',
      title: 'Chi phí sửa chữa hoặc bồi thường',
      total: moneyValue(chiTiet?.tongChiPhiSuaChua),
      details: damages.map((hh) => ({
        title: `${hh.tenTaiSan || hh.maTaiSan || 'Tài sản'}${hh.mucDoHuHong ? ` - ${hh.mucDoHuHong}` : ''}`,
        amount: hh.chiPhiSuaChua,
        meta: [hh.moTaHuHong || 'Chưa có mô tả hư hỏng'],
      })),
      emptyText: 'Không có chi phí sửa chữa hoặc bồi thường.',
    },
    {
      id: 'penalty',
      title: 'Tiền phạt',
      total: moneyValue(chiTiet?.tienPhat),
      details: violations.map((vp) => ({
        title: `${vp.maBBViPham || 'Biên bản'} - ${vp.tenDieuKhoan || 'Vi phạm'}`,
        amount: vp.soTienPhat,
        meta: [`Ngày vi phạm: ${fmtDate(vp.ngayViPham)}`, vp.moTaViPham],
      })),
      emptyText: 'Không có tiền phạt.',
    },
  ];
}



export default function XacNhanPhanHoi() {
  const [ds, setDs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [chiTietKhauTru, setChiTietKhauTru] = useState(null);
  const [dsPhong, setDsPhong] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
      const rawDs = res.data.danhSach || [];
      // Lọc bỏ những phiếu khách "Đồng ý" (không có phản hồi) đi thẳng qua trạng thái khác.
      // Đồng thời phân biệt với ghi chú lưu thông tin tài khoản ngân hàng (có chữ "Chủ tài khoản:").
      const validDs = rawDs.filter(r => {
        if (r.trangThaiDoiSoat === 'Chờ phản hồi') return true;
        if (r.ghiChuPhanHoiKhach && !r.ghiChuPhanHoiKhach.includes('Chủ tài khoản:')) return true;
        return false;
      });
      setDs(validDs);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Lỗi tải danh sách.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = async (row) => {
    setSelected(row);
    setModalOpen(true);
    setLoadingDetail(true);
    setDetailError('');
    setChiTiet(null);
    setDsPhong([]);
    setChiTietKhauTru(null);
    setSuccessMsg('');
    try {
      const res = await xacNhanPhanHoiApi.getChiTietPhanHoi(row.maDoiSoat);
      setChiTiet(res.data.chiTiet);
      setChiTietKhauTru(res.data.chiTietKhauTru || null);
      setDsPhong(res.data.danhSachPhong || []);
    } catch (err) {
      setDetailError(err?.response?.data?.message || 'Không thể tải chi tiết phiếu đối soát.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleXuLy = async (hanhDong) => {
    if (submitting || !selected?.maDoiSoat) return;
    setSubmitting(true);
    try {
      await xacNhanPhanHoiApi.xuLyPhanHoi({ maDoiSoat: selected.maDoiSoat, hanhDong });
      const msg = hanhDong === 'XacNhanDieuChinh'
        ? 'Đã chuyển phiếu đối soát để nhân viên kế toán điều chỉnh lại.'
        : 'Đã ghi nhận giữ nguyên kết quả đối soát.';
      showToast(msg, 'success');
      setModalOpen(false);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Không xử lý được phản hồi. Vui lòng thử lại.';
      showToast(msg, 'error');
      if (msg.includes('đã thay đổi trạng thái') || msg.includes('đã được xử lý')) load();
    } finally {
      setSubmitting(false);
    }
  };

  const countTatCa = ds.length;
  const countChoPhanHoi = ds.filter((r) => r.trangThaiDoiSoat === 'Chờ phản hồi').length;
  const countDaPhanHoi = ds.filter((r) => r.trangThaiDoiSoat !== 'Chờ phản hồi').length;

  const filtered = ds.filter((r) => {
    if (filterStatus === 'Chờ phản hồi') return r.trangThaiDoiSoat === 'Chờ phản hồi';
    if (filterStatus === 'Đã phản hồi') return r.trangThaiDoiSoat !== 'Chờ phản hồi';
    return true;
  }).filter((r) => {
    const q = searchQ.toLowerCase();
    return !q ||
      r.hoTenKhach?.toLowerCase().includes(q) ||
      r.maDoiSoat?.toLowerCase().includes(q) ||
      r.maPhieuTra?.toLowerCase().includes(q) ||
      r.maHoSo?.toLowerCase().includes(q);
  });

  const financeGroups = useMemo(
    () => buildFinanceGroups(chiTiet, chiTietKhauTru),
    [chiTiet, chiTietKhauTru]
  );

  const hoan = moneyValue(chiTiet?.soTienHoanThucTe);
  const thuThem = moneyValue(chiTiet?.soTienKhachPhaiTT);
  const ketQuaColor = hoan > 0 ? '#00666d' : thuThem > 0 ? '#ba1a1a' : '#3f494a';
  const ketQuaBg = hoan > 0 ? '#f0f9f9' : thuThem > 0 ? '#f9e8e3' : '#eef3f3';
  const ketQuaTitle = hoan > 0 ? 'Khách được hoàn cọc' : thuThem > 0 ? 'Khách phải thanh toán thêm' : 'Không phát sinh thanh toán';
  const ketQuaAmount = hoan > 0 ? fmtMoney(hoan) : thuThem > 0 ? fmtMoney(thuThem) : '';
  const isHopDong = Boolean(chiTiet?.maHopDong);
  const canAct = chiTiet?.trangThaiDoiSoat === 'Chờ phản hồi';

  return (
    <div>
      <style>{`
        .xph-modal-grid {
          align-items: start;
          display: grid;
          gap: 18px;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
        }
        .xph-info-grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .xph-deduction-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: 900px) {
          .xph-modal-grid,
          .xph-info-grid,
          .xph-deduction-grid {
            grid-template-columns: 1fr;
          }
          .xph-summary-panel {
            position: static !important;
          }
        }
      `}</style>
      <section className="ktp-table-section">
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tên khách, mã đối soát hoặc mã phiếu trả..."
              className="ktp-input"
              style={{ width: '100%', backgroundColor: '#fff' }}
              spellCheck={false}
            />
          </div>
          {searchQ && (
            <button type="button" onClick={() => setSearchQ('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        <StatusFilterTabs
          className="status-pill-tabs-offset"
          items={[
            { key: 'Tất cả', label: 'Tất cả' },
            { key: 'Chờ phản hồi', label: 'Chờ phản hồi' },
            { key: 'Đã phản hồi', label: 'Đã phản hồi' }
          ]}
          activeKey={filterStatus}
          counts={{ 'Tất cả': countTatCa, 'Chờ phản hồi': countChoPhanHoi, 'Đã phản hồi': countDaPhanHoi }}
          onChange={setFilterStatus}
        />

        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#6f797a' }}>Đang tải...</div>
        ) : (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã đối soát</th><th>Khách hàng</th><th>Hồ sơ</th><th>Phòng</th><th>Ngày lập</th><th className="text-center">Trạng thái</th><th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: '#6f797a' }}>Không có phiếu đối soát nào đang chờ xử lý phản hồi.</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.maDoiSoat}>
                  <td style={{ fontWeight: 700, color: '#2f6765' }}>{row.maDoiSoat}</td>
                  <td><div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div><div style={{ fontSize: 12, color: '#6f797a' }}>{row.sdtKhach}</div></td>
                  <td>
                    <span className={`tp-loai-badge ${row.maHopDong ? 'hd' : 'dc'}`} style={{ fontSize: 11 }}>{row.maHopDong ? 'Hợp đồng' : 'Đặt cọc'}</span>
                    <div style={{ fontSize: 12, color: '#6f797a', marginTop: 2 }}>{row.maHoSo}</div>
                  </td>
                  <td><div style={{ fontWeight: 500 }}>{row.tenPhong}</div></td>
                  <td>{fmtDate(row.ngayLap)}</td>
                  <td className="text-center"><TrangThaiBadge trangThai={row.trangThaiDoiSoat} /></td>
                  <td className="text-center">
                    <button
                      className={row.trangThaiDoiSoat === 'Chờ phản hồi' ? 'ktp-btn-action-fill' : 'tp-btn-detail-outline'}
                      onClick={() => openModal(row)}
                    >
                      {row.trangThaiDoiSoat === 'Chờ phản hồi' ? 'Xử lý' : 'Xem chi tiết'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && <div style={{ padding: '8px 16px', fontSize: 13, color: '#6f797a' }}>{filtered.length} phiếu chờ xử lý</div>}
      </section>

      {modalOpen && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setModalOpen(false)}>
          <div
            className="ktp-modal"
            style={{ width: 'calc(100vw - 64px)', maxWidth: 1200, maxHeight: '88vh', padding: 0, backgroundColor: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ktp-modal-header" style={{ flex: '0 0 auto', padding: '16px 24px', backgroundColor: '#3b8280', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 700 }}>
                  {selected?.trangThaiDoiSoat === 'Chờ phản hồi' ? 'Xử lý phản hồi đối soát' : 'Chi tiết phản hồi đối soát'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, color: 'rgba(255,255,255,0.86)', fontSize: 13 }}>
                  <span>Mã đối soát: <strong style={{ color: '#fff' }}>{selected?.maDoiSoat || '—'}</strong></span>
                  <TrangThaiBadge trangThai={chiTiet?.trangThaiDoiSoat || selected?.trangThaiDoiSoat || 'Chờ phản hồi'} />
                </div>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                <Icon name="close" />
              </button>
            </div>

            <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', padding: '18px 22px', backgroundColor: '#f8f9fa' }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#6f797a' }}>Đang tải dữ liệu...</div>
              ) : detailError ? (
                <div style={{ background: '#fff', border: '1px solid #f8c4c4', color: '#ba1a1a', borderRadius: 8, padding: 18 }}>{detailError}</div>
              ) : chiTiet ? (
                <div className="xph-modal-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                    <div className="xph-info-grid">
                      <section className="ktp-info-box-outline" style={{ backgroundColor: '#fff', borderRadius: 8, padding: 14 }}>
                        <SectionTitle icon="person">Thông tin khách hàng</SectionTitle>
                        <InfoRow label="Họ tên">{chiTiet.hoTenKhach}</InfoRow>
                        <InfoRow label="Số điện thoại">{chiTiet.sdtKhach}</InfoRow>
                        <InfoRow label="Email">{chiTiet.emailKhach}</InfoRow>
                        <InfoRow label="CCCD">{chiTiet.cccd}</InfoRow>
                      </section>
                      <section className="ktp-info-box-outline" style={{ backgroundColor: '#fff', borderRadius: 8, padding: 14 }}>
                        <SectionTitle icon={isHopDong ? 'description' : 'account_balance_wallet'}>{isHopDong ? 'Thông tin hợp đồng' : 'Thông tin phiếu đặt cọc'}</SectionTitle>
                        {isHopDong ? (
                          <>
                            <InfoRow label="Mã hợp đồng"><strong>{chiTiet.maHopDong}</strong></InfoRow>
                            <InfoRow label="Tiền cọc ban đầu">{fmtMoney(chiTiet.tienCocBanDau)}</InfoRow>
                            <InfoRow label="Phòng/giường">{formatRoom(dsPhong)}</InfoRow>
                            <InfoRow label="Thời hạn hợp đồng">{`${fmtDate(chiTiet.ngayBatDau)} - ${fmtDate(chiTiet.ngayKetThuc)}`}</InfoRow>
                            <InfoRow label="Kỳ thanh toán">{chiTiet.kyThanhToan}</InfoRow>
                            <InfoRow label="Ngày trả phòng thực tế">{fmtDate(chiTiet.ngayTraThucTe)}</InfoRow>
                          </>
                        ) : (
                          <>
                            <InfoRow label="Mã phiếu đặt cọc"><strong>{chiTiet.maPhieuDatCoc}</strong></InfoRow>
                            <InfoRow label="Số tiền cọc">{fmtMoney(chiTiet.tienCocBanDau)}</InfoRow>
                            <InfoRow label="Phòng/giường đã giữ chỗ">{formatRoom(dsPhong)}</InfoRow>
                            <InfoRow label="Ngày yêu cầu hủy cọc">{fmtDate(chiTiet.ngayTraThucTe)}</InfoRow>
                          </>
                        )}
                      </section>
                    </div>

                    <section style={{ backgroundColor: '#fff8f0', border: '1px solid #fdba74', borderRadius: 8, padding: '14px 16px' }}>
                      <SectionTitle icon="feedback" danger>Yêu cầu điều chỉnh của khách hàng</SectionTitle>
                      <p style={{ margin: 0, fontSize: 14, color: '#3f494a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{chiTiet.ghiChuPhanHoiKhach || '(Khách hàng chưa nhập nội dung phản hồi)'}</p>
                    </section>

                    {isHopDong ? (
                      <section>
                        <SectionTitle icon="remove_circle_outline">Chi tiết các khoản khấu trừ</SectionTitle>
                        <div className="xph-deduction-grid">
                          {financeGroups.map((group) => <FinanceGroup key={group.id} group={group} />)}
                        </div>
                      </section>
                    ) : (
                      <section className="ktp-info-box-outline" style={{ backgroundColor: '#fff', borderRadius: 8, padding: 14 }}>
                        <SectionTitle icon="remove_circle_outline">Chi tiết các khoản khấu trừ</SectionTitle>
                        <EmptyLine>Phiếu đặt cọc chưa phát sinh lưu trú nên không có hóa đơn, chi phí sửa chữa hoặc tiền phạt lưu trú.</EmptyLine>
                      </section>
                    )}
                  </div>

                  <aside className="xph-summary-panel" style={{ background: '#fff', border: '1px solid #d5dddd', borderRadius: 8, padding: 16, position: 'sticky', top: 0 }}>
                    <SectionTitle icon="receipt_long">Tóm tắt đối soát</SectionTitle>
                    <SummaryRow label="Tiền cọc ban đầu" value={fmtMoney(chiTiet.tienCocBanDau)} />
                    {isHopDong && <SummaryRow label="Số tháng lưu trú" value={chiTiet.soThangLuuTru ?? 0} />}
                    <SummaryRow label="Tỷ lệ hoàn cọc" value={`${Number(chiTiet.tyLeHoanCocHienTai || 0).toFixed(0)}%`} />
                    <SummaryRow label="Tiền cọc được hoàn" value={fmtMoney(chiTiet.tienCocDuocHoan)} tone="primary" />
                    <SummaryRow label="Tổng khấu trừ" value={fmtMoney(chiTiet.tongKhauTru)} tone="danger" strong />
                    <SummaryRow label="Số tiền hoàn thực tế" value={fmtMoney(chiTiet.soTienHoanThucTe)} tone="success" strong />
                    <SummaryRow label="Số tiền khách phải thanh toán thêm" value={fmtMoney(chiTiet.soTienKhachPhaiTT)} tone="danger" strong />
                    <div style={{ marginTop: 14, borderRadius: 8, padding: '12px 14px', backgroundColor: ketQuaBg, border: `1px solid ${ketQuaColor}40` }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ketQuaColor }}>Kết quả: {ketQuaTitle}</div>
                      {ketQuaAmount && <div style={{ fontSize: 24, fontWeight: 800, color: ketQuaColor, marginTop: 4 }}>{ketQuaAmount}</div>}
                    </div>
                  </aside>
                </div>
              ) : null}
            </div>

            <div className="ktp-modal-footer" style={{ flex: '0 0 auto', padding: '14px 22px', borderTop: '1px solid #e1e3e4', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: canAct ? '#6f797a' : '#ba1a1a' }}>
                {!loadingDetail && chiTiet && !canAct ? 'Phiếu không còn ở trạng thái Chờ phản hồi.' : ''}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModalOpen(false)} className="ktp-btn-cancel" disabled={submitting}>Hủy</button>
                {chiTiet && (
                  <>
                    <button disabled={!canAct || submitting} onClick={() => handleXuLy('XacNhanDieuChinh')} style={{ backgroundColor: '#d05a2a', border: 'none', color: '#fff', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: !canAct || submitting ? 'not-allowed' : 'pointer', opacity: !canAct || submitting ? 0.65 : 1 }}>
                      {submitting ? 'Đang xử lý...' : 'Xác nhận điều chỉnh'}
                    </button>
                    <button disabled={!canAct || submitting} onClick={() => handleXuLy('GiuNguyen')} className="ktp-btn-submit" style={{ cursor: !canAct || submitting ? 'not-allowed' : 'pointer', opacity: !canAct || submitting ? 0.65 : 1 }}>
                      {submitting ? 'Đang xử lý...' : 'Giữ nguyên đối soát'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`tp-toast ${toast.msg ? 'show' : ''}`} style={{ 
        backgroundColor: toast.type === 'error' ? '#ba1a1a' : '#1a6e60',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {toast.type === 'success' && <Icon name="check_circle" style={{ fontSize: '18px' }} />}
        {toast.type === 'error' && <Icon name="error_outline" style={{ fontSize: '18px' }} />}
        {toast.msg}
      </div>
    </div>
  );
}
