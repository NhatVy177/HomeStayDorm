import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { banGiaoPhongApi } from './banGiaoPhong.api.js';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

function isFutureDate(value) {
  if (!value) return false;
  const inputDate = new Date(value);
  const today = new Date();
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
}

function getFutureStartMessage(value) {
  return `Chưa tới ngày hẹn bàn giao. Ngày bắt đầu hợp đồng là ${formatDate(value)}.`;
}

function isWholeRoomValue(value) {
  return !value || String(value).toLowerCase().includes('nguyên');
}

function getScopeLabel(value) {
  return isWholeRoomValue(value) ? 'Bàn giao nguyên phòng' : 'Bàn giao theo giường';
}

function formatRoomBedLabel(room, bed, wholeRoomText = 'Toàn phòng') {
  const roomLabel = room || '-';
  return isWholeRoomValue(bed) ? `${roomLabel} / ${wholeRoomText}` : `${roomLabel} / ${bed}`;
}

function InfoRow({ label, value, badge }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
      <span style={{ color: '#6f797a', fontSize: '13px' }}>{label}</span>
      {badge ? (
        <span style={{
          backgroundColor: badge === 'success' ? '#f6feff' : '#fff8e1',
          color: badge === 'success' ? '#004c52' : '#6b4f00',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '700',
          border: badge === 'success' ? '1px solid #86d3da' : '1px solid #f2d47c',
          whiteSpace: 'nowrap'
        }}>
          {value || '-'}
        </span>
      ) : (
        <span style={{ fontWeight: '600', fontSize: '14px', color: '#191c1d', textAlign: 'right' }}>{value || '-'}</span>
      )}
    </div>
  );
}

function SummaryCard({ icon, title, children, accentColor = '#00666d' }) {
  return (
    <div className="ktp-section handover-summary-card" style={{ '--handover-accent': accentColor }}>
      <h4 style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#191c1d',
        borderBottom: '1px solid #e1e3e4',
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <Icon name={icon} /> {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

export default function BanGiaoPhongTab() {
  const [maHopDong, setMaHopDong] = useState('');
  const [hopDong, setHopDong] = useState(null);
  const [dieuKien, setDieuKien] = useState(null);
  const [danhSachTaiSan, setDanhSachTaiSan] = useState([]);
  const [quanLyXacNhan, setQuanLyXacNhan] = useState(true);
  const [khachCoMat, setKhachCoMat] = useState(true);
  const [daKyBienBan, setDaKyBienBan] = useState(true);
  const [ghiChuChung, setGhiChuChung] = useState('');
  const [notice, setNotice] = useState(null);
  const [successDialog, setSuccessDialog] = useState(null);
  const [danhSachChoBanGiao, setDanhSachChoBanGiao] = useState([]);
  const [loadingDanhSach, setLoadingDanhSach] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isReadOnlyHandover = Boolean(hopDong?.daCoBienBanBanGiaoVao || Number(dieuKien?.maLoi) === -5);

  const canSubmit = useMemo(() => {
    return Boolean(
      hopDong
      && !isReadOnlyHandover
      && dieuKien?.hopLe
      && danhSachTaiSan.length > 0
      && quanLyXacNhan
      && khachCoMat
      && daKyBienBan
      && !saving
    );
  }, [daKyBienBan, dieuKien, danhSachTaiSan.length, hopDong, isReadOnlyHandover, khachCoMat, quanLyXacNhan, saving]);

  const assetNoteCount = useMemo(() => {
    return danhSachTaiSan.filter((item) => (
      Number(item.soLuongThucTe) !== Number(item.soLuongHeThong)
    )).length;
  }, [danhSachTaiSan]);

  const fetchDanhSachChoBanGiao = async () => {
    setLoadingDanhSach(true);
    try {
      const res = await banGiaoPhongApi.getDanhSachChoBanGiao();
      setDanhSachChoBanGiao((res.data || []).filter((item) => (
        Boolean(item.daDongTienDauKy) && Boolean(item.tinhTrangGiuongHopLe) && !isFutureDate(item.ngayBatDau)
      )));
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Không tải được danh sách',
        message: getErrorMessage(error, 'Không thể tải danh sách hợp đồng có thể bàn giao.')
      });
    } finally {
      setLoadingDanhSach(false);
    }
  };

  useEffect(() => {
    fetchDanhSachChoBanGiao();
  }, []);

  const handleSearch = async (selectedMaHopDong) => {
    const cleanMaHopDong = String(selectedMaHopDong || maHopDong).trim();
    if (!cleanMaHopDong) {
      setNotice({ type: 'error', title: 'Thiếu mã hợp đồng', message: 'Vui lòng nhập mã hợp đồng cần bàn giao.' });
      return;
    }

    setMaHopDong(cleanMaHopDong);
    setLoading(true);
    setNotice(null);
    setHopDong(null);
    setDanhSachTaiSan([]);

    try {
      const res = await banGiaoPhongApi.traCuuHopDongBanGiao(cleanMaHopDong);
      const futureStartMessage = isFutureDate(res.data.hopDong?.ngayBatDau)
        ? getFutureStartMessage(res.data.hopDong.ngayBatDau)
        : null;
      setHopDong(res.data.hopDong);
      setDieuKien(futureStartMessage
        ? { ...(res.data.dieuKien || {}), hopLe: false, maLoi: -16, thongBao: futureStartMessage }
        : res.data.dieuKien);
      setDanhSachTaiSan((res.data.danhSachTaiSan || []).map((item) => ({
        ...item,
        soLuongThucTe: item.soLuongThucTe ?? item.soLuongHeThong ?? 0,
        ghiChu: item.ghiChu || ''
      })));
      setNotice({
        type: !futureStartMessage && res.data.dieuKien?.hopLe ? 'success' : 'warning',
        title: !futureStartMessage && res.data.dieuKien?.hopLe ? 'Hợp đồng đủ điều kiện' : 'Chưa thể bàn giao',
        message: futureStartMessage || res.data.dieuKien?.thongBao || 'Đã tải thông tin hợp đồng.'
      });
    } catch (error) {
      setNotice({ type: 'error', title: 'Không tra cứu được', message: getErrorMessage(error, 'Không tìm thấy hợp đồng cần bàn giao.') });
    } finally {
      setLoading(false);
    }
  };

  const updateAsset = (index, field, value) => {
    setDanhSachTaiSan((items) => items.map((item, currentIndex) => (
      currentIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const validateBeforeSubmit = () => {
    if (isFutureDate(hopDong?.ngayBatDau)) return getFutureStartMessage(hopDong.ngayBatDau);
    if (!quanLyXacNhan) return 'Quản lý cần xác nhận đã kiểm kê tài sản bàn giao.';
    if (!khachCoMat) return 'Khách hàng không có mặt tại thời điểm bàn giao.';
    if (!daKyBienBan) return 'Khách hàng chưa ký xác nhận biên bản.';

    for (const item of danhSachTaiSan) {
      const actual = item.soLuongThucTe === '' ? null : Number(item.soLuongThucTe);
      const expected = Number(item.soLuongHeThong);
      if (actual == null || !Number.isFinite(actual) || actual < 0) {
        return `Vui lòng nhập số lượng thực tế hợp lệ cho tài sản ${item.tenTaiSan}.`;
      }
      if (Number.isFinite(expected) && actual !== expected && !String(item.ghiChu || '').trim()) {
        return `Tài sản ${item.tenTaiSan} chênh lệch số lượng, vui lòng nhập ghi chú.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationMessage = validateBeforeSubmit();
    if (validationMessage) {
      setNotice({ type: 'error', title: 'Chưa thể lưu biên bản', message: validationMessage });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const res = await banGiaoPhongApi.lapBienBanBanGiao({
        maHopDong: hopDong.maHopDong,
        khachCoMat,
        daKyBienBan,
        ghiChuChung,
        danhSachTaiSan
      });
      const ketQua = res.data.ketQua;
      setSuccessDialog({
        title: 'Lập biên bản thành công',
        message: `${res.data.thongBao || 'Đã lập biên bản bàn giao.'}${ketQua?.maBienBan ? ` Mã biên bản: ${ketQua.maBienBan}.` : ''}`,
        maBienBan: ketQua?.maBienBan || res.data.maBienBan
      });
      setDanhSachChoBanGiao((items) => items.filter((item) => item.maHopDong !== hopDong.maHopDong));
      setMaHopDong('');
      setHopDong(null);
      setDieuKien(null);
      setDanhSachTaiSan([]);
      setGhiChuChung('');
      setQuanLyXacNhan(true);
      setKhachCoMat(true);
      setDaKyBienBan(true);
    } catch (error) {
      setNotice({ type: 'error', title: 'Không lưu được biên bản', message: getErrorMessage(error, 'Có lỗi khi lập biên bản bàn giao.') });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMaHopDong('');
    setHopDong(null);
    setDieuKien(null);
    setDanhSachTaiSan([]);
    setGhiChuChung('');
    setQuanLyXacNhan(true);
    setKhachCoMat(true);
    setDaKyBienBan(true);
    setNotice(null);
    setSuccessDialog(null);
  };

  return (
    <div className="ktp-container handover-tab">
      {notice && (
        <div className={`ktp-inline-notice ktp-inline-notice-${notice.type}`} style={{ marginBottom: '16px' }}>
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.message}</p>
          </div>
          <button type="button" onClick={() => setNotice(null)}>Đóng</button>
        </div>
      )}

      {successDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(25, 28, 29, 0.42)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            width: 'min(520px, 100%)',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 18px 48px rgba(0, 0, 0, 0.22)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '22px 24px', backgroundColor: '#00666d', color: '#ffffff' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{successDialog.title}</h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: 0, color: '#191c1d', fontSize: '15px', lineHeight: 1.6 }}>{successDialog.message}</p>
              {successDialog.maBienBan && (
                <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: '#f6feff', border: '1px solid #86d3da', borderRadius: '6px', color: '#00666d', fontWeight: 700 }}>
                  Mã biên bản: {successDialog.maBienBan}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ktp-btn-submit"
                style={{ padding: '10px 24px' }}
                onClick={() => setSuccessDialog(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ktp-section handover-search-card">
        <div className="handover-search-copy">
          <span>Lập biên bản bàn giao</span>
          <h2>Chọn hợp đồng đã sẵn sàng nhận phòng</h2>
          <p>Tra cứu nhanh theo mã hợp đồng hoặc chọn trực tiếp từ danh sách đủ điều kiện bên dưới.</p>
        </div>
        <div className="handover-search-row">
          <div className="handover-search-field">
            <label className="ktp-label">Mã hợp đồng cần bàn giao</label>
            <input
              type="text"
              className="ktp-input"
              value={maHopDong}
              placeholder="Nhập mã hợp đồng tại đây..."
              onChange={(event) => setMaHopDong(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
            />
          </div>
          <button
            type="button"
            className="ktp-btn-submit"
            style={{ padding: '10px 24px', whiteSpace: 'nowrap' }}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? 'Đang kiểm tra...' : 'Kiểm tra hợp đồng'}
          </button>
        </div>
      </div>

      {!hopDong && (
        <section className="ktp-table-section handover-queue-card">
          <div className="handover-queue-head">
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#191c1d' }}>Hợp đồng có thể bàn giao</h3>
              <p style={{ margin: '6px 0 0 0', color: '#6f797a', fontSize: '13px' }}>Đã thu tiền kỳ đầu, chưa lập biên bản bàn giao vào và phòng/giường đang chờ bàn giao.</p>
            </div>
            <button
              type="button"
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#ffffff', color: '#00666d', fontWeight: 700, cursor: 'pointer' }}
              onClick={fetchDanhSachChoBanGiao}
              disabled={loadingDanhSach}
            >
              {loadingDanhSach ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
          <div className="handover-table-scroll">
            <table className="ktp-table">
              <thead>
                <tr>
                  <th>Mã hợp đồng</th>
                  <th>Khách thuê</th>
                  <th>Phòng / Giường</th>
                  <th>Ngày bắt đầu</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-center" style={{ width: '150px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loadingDanhSach ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#6f797a', padding: '28px' }}>Đang tải danh sách hợp đồng...</td>
                  </tr>
                ) : danhSachChoBanGiao.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#6f797a', padding: '28px' }}>Chưa có hợp đồng nào đủ điều kiện bàn giao.</td>
                  </tr>
                ) : danhSachChoBanGiao.map((item) => (
                  <tr key={`${item.maHopDong}-${item.maPhong}-${item.maGiuong || 'phong'}`}>
                    <td style={{ fontWeight: 700, color: '#00666d' }}>{item.maHopDong}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#191c1d' }}>{item.hoTen}</div>
                      <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.soDienThoai || item.cccd || '-'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#191c1d' }}>{item.tenPhong || item.maPhong}</div>
                      <div style={{ fontSize: '12px', color: isWholeRoomValue(item.maGiuong) ? '#00666d' : '#6f797a', fontWeight: isWholeRoomValue(item.maGiuong) ? 700 : 500 }}>
                        {isWholeRoomValue(item.maGiuong) ? 'Nguyên phòng' : `Giường ${item.maGiuong}`}
                      </div>
                    </td>
                    <td>{formatDate(item.ngayBatDau)}</td>
                    <td className="text-center">
                      <span style={{ backgroundColor: '#f6feff', color: '#004c52', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #86d3da' }}>
                        Sẵn sàng
                      </span>
                    </td>
                    <td className="text-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="ktp-btn-submit"
                        style={{ padding: '8px 14px', minWidth: '92px' }}
                        onClick={() => handleSearch(item.maHopDong)}
                        disabled={loading}
                      >
                        Bàn giao
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hopDong && (
        <>
          <div className="handover-current-banner">
            <div style={{ color: '#00666d', fontWeight: 700 }}>
              {isReadOnlyHandover ? 'Hợp đồng đã lập biên bản bàn giao' : 'Đang lập biên bản cho hợp đồng'} {hopDong.maHopDong}
            </div>
            <button
              type="button"
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#ffffff', color: '#00666d', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => {
                setHopDong(null);
                setDieuKien(null);
                setDanhSachTaiSan([]);
                setGhiChuChung('');
                setNotice(null);
              }}
            >
              Chọn hợp đồng khác
            </button>
          </div>

          <div className="ktp-grid-3 handover-summary-grid">
            <SummaryCard icon="description" title="Thông tin hợp đồng" accentColor="#00666d">
              <InfoRow label="Mã HĐ:" value={hopDong.maHopDong} />
              <InfoRow label="Trạng thái:" value={hopDong.trangThaiHopDong} badge={hopDong.trangThaiHopDong === 'Hiệu lực' ? 'success' : 'warning'} />
              <InfoRow label="Ngày bắt đầu:" value={formatDate(hopDong.ngayBatDau)} />
              <InfoRow label="Thời hạn:" value={`${hopDong.thoiHanThue || 0} tháng`} />
            </SummaryCard>

            <SummaryCard icon="person" title="Thông tin khách thuê" accentColor="#2f6765">
              <InfoRow label="Họ tên:" value={hopDong.hoTenKhachHang} />
              <InfoRow label="SĐT:" value={hopDong.sdt} />
              <InfoRow label="Số người ở:" value={`${Math.max(Number(hopDong.soNguoiO) || 0, 1)} người`} />
              <InfoRow label="Hóa đơn kỳ đầu:" value={hopDong.trangThaiHoaDonKyDau} badge={hopDong.trangThaiHoaDonKyDau === 'Đã TT' ? 'success' : 'warning'} />
            </SummaryCard>

            <SummaryCard icon="bed" title="Thông tin phòng/giường" accentColor="#4d777c">
              <InfoRow label="Chi nhánh:" value={hopDong.tenChiNhanh} />
              <InfoRow label="Hình thức:" value={getScopeLabel(hopDong.danhSachGiuong)} badge="success" />
              <InfoRow label="Phòng:" value={hopDong.tenPhong || hopDong.maPhong} />
              <InfoRow label="Phạm vi:" value={isWholeRoomValue(hopDong.danhSachGiuong) ? 'Toàn bộ phòng' : `Giường ${hopDong.danhSachGiuong}`} />
              <InfoRow label="Trạng thái:" value="Đã lập HĐ" badge={hopDong.coTheBanGiao ? 'success' : 'warning'} />
            </SummaryCard>
          </div>

          <div className="ktp-section handover-workspace">
            <div className="handover-form-head">
              <div className="handover-form-head-row">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#191c1d', margin: 0 }}>
                    {isReadOnlyHandover ? 'Thông tin biên bản bàn giao' : 'Lập biên bản bàn giao'}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6f797a', margin: '6px 0 0 0' }}>
                    {isReadOnlyHandover
                      ? 'Hợp đồng đã có biên bản bàn giao vào nên thông tin chỉ được xem lại.'
                      : isWholeRoomValue(hopDong.danhSachGiuong)
                      ? 'Kiểm kê toàn bộ tài sản thuộc phòng khi khách thuê nguyên căn.'
                      : 'Kiểm kê tài sản cá nhân theo giường và tài sản chung của phòng.'}
                  </p>
                </div>
                <div className="handover-pills">
                  <span className="handover-pill">
                    <Icon name={isWholeRoomValue(hopDong.danhSachGiuong) ? 'home' : 'bed'} />
                    {getScopeLabel(hopDong.danhSachGiuong)}
                  </span>
                  <span className={`handover-pill ${assetNoteCount > 0 ? 'is-warning' : ''}`}>
                    <Icon name="edit_note" />
                    {assetNoteCount > 0 ? `${assetNoteCount} tài sản cần ghi chú` : 'Chưa có chênh lệch'}
                  </span>
                  <span className={`handover-pill ${dieuKien?.hopLe ? '' : 'is-warning'}`}>
                  <Icon name={dieuKien?.hopLe ? 'check_circle' : 'error_outline'} />
                  {dieuKien?.hopLe ? 'Đủ điều kiện bàn giao' : 'Cần kiểm tra điều kiện'}
                  </span>
                </div>
              </div>
            </div>

            <div className="handover-table-scroll">
              <table className="ktp-table" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>Mã tài sản</th>
                    <th style={{ width: '240px' }}>Tên tài sản</th>
                    <th style={{ width: '170px' }}>Phạm vi</th>
                    <th style={{ width: '210px' }}>Kiểm kê</th>
                    <th style={{ width: '320px' }}>Ghi chú khi chênh lệch</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachTaiSan.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#6f797a', padding: '28px' }}>
                        Chưa có tài sản bàn giao cho hợp đồng này.
                      </td>
                    </tr>
                  ) : danhSachTaiSan.map((item, index) => {
                    const hasDifference = Number(item.soLuongThucTe) !== Number(item.soLuongHeThong);
                    const missingNote = hasDifference && !String(item.ghiChu || '').trim();
                    return (
                      <tr key={`${item.maPhong}-${item.maTaiSan}-${index}`} style={{ backgroundColor: hasDifference ? '#fffaf3' : '#ffffff' }}>
                        <td style={{ fontWeight: 700, color: '#00666d', verticalAlign: 'middle' }}>{item.maTaiSan}</td>
                        <td>
                          <div style={{ fontWeight: '700', color: '#191c1d' }}>{item.tenTaiSan}</div>
                          {hasDifference && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#9b4922', fontSize: '12px', fontWeight: 700 }}>
                              <Icon name="warning" />
                              {missingNote ? 'Cần nhập ghi chú chênh lệch' : 'Đã ghi nhận chênh lệch'}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#191c1d' }}>{item.tenPhong || item.maPhong}</div>
                          {!isWholeRoomValue(item.maGiuong) && (
                            <div style={{ fontSize: '12px', color: '#6f797a', fontWeight: 500 }}>
                              Giường {item.maGiuong}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(44px, auto) 16px 74px', alignItems: 'center', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#6f797a', fontWeight: 600, marginBottom: '3px' }}>Hệ thống</div>
                              <div style={{ fontWeight: 800, color: '#191c1d' }}>{item.soLuongHeThong}</div>
                            </div>
                            <span style={{ color: '#8a9495', fontWeight: 700, textAlign: 'center' }}>→</span>
                            <input
                              type="number"
                              min="0"
                              value={item.soLuongThucTe}
                              disabled={isReadOnlyHandover}
                              onChange={(event) => updateAsset(index, 'soLuongThucTe', event.target.value)}
                              style={{
                                width: '74px',
                                textAlign: 'center',
                                padding: '8px 6px',
                                border: hasDifference ? '1px solid #9b4922' : '1px solid #bec8c9',
                                borderRadius: '6px',
                                outline: 'none',
                                fontWeight: 700,
                                color: hasDifference ? '#9b4922' : '#191c1d',
                                backgroundColor: isReadOnlyHandover ? '#f1f3f4' : '#ffffff',
                                cursor: isReadOnlyHandover ? 'not-allowed' : 'text'
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.ghiChu}
                            disabled={isReadOnlyHandover}
                            onChange={(event) => updateAsset(index, 'ghiChu', event.target.value)}
                            placeholder={hasDifference ? 'Bắt buộc nhập lý do chênh lệch' : 'Không bắt buộc'}
                            style={{
                              width: '100%',
                              maxWidth: '320px',
                              padding: '8px',
                              border: missingNote ? '1px solid #ba1a1a' : '1px solid #bec8c9',
                              borderRadius: '6px',
                              outline: 'none',
                              boxSizing: 'border-box',
                              backgroundColor: isReadOnlyHandover ? '#f1f3f4' : (missingNote ? '#fff8f7' : '#ffffff'),
                              cursor: isReadOnlyHandover ? 'not-allowed' : 'text'
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '22px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e1e3e4' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#191c1d', margin: '0 0 16px 0' }}>Xác nhận bàn giao</h3>
              <div className="ktp-grid-2" style={{ gap: '16px', marginBottom: '18px' }}>
                <div style={{ border: '1px solid #d7e5e7', backgroundColor: '#f6feff', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00666d', fontWeight: 700 }}>
                    <Icon name="check_circle" /> Quản lý xác nhận
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={quanLyXacNhan}
                        disabled={isReadOnlyHandover}
                        onChange={(event) => setQuanLyXacNhan(event.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#00666d' }}
                    />
                    <span style={{ fontSize: '14px', color: '#191c1d' }}>Đã kiểm kê tài sản và thông tin bàn giao</span>
                  </label>
                </div>

                <div style={{ border: '1px solid #e1e3e4', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#3f494a', fontWeight: 700 }}>
                    <Icon name="person" /> Khách hàng xác nhận
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={khachCoMat}
                        disabled={isReadOnlyHandover}
                        onChange={(event) => setKhachCoMat(event.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#00666d' }}
                      />
                      <span style={{ fontSize: '14px', color: '#191c1d' }}>Khách hàng có mặt tại thời điểm bàn giao</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={daKyBienBan}
                        disabled={isReadOnlyHandover}
                        onChange={(event) => setDaKyBienBan(event.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#00666d' }}
                      />
                      <span style={{ fontSize: '14px', color: '#191c1d' }}>Khách hàng đã ký xác nhận biên bản</span>
                    </label>
                  </div>
                </div>
              </div>

              <label className="ktp-label">Ghi chú chung</label>
              <textarea
                className="ktp-input"
                value={ghiChuChung}
                placeholder="Nhập ghi chú chung cho biên bản..."
                disabled={isReadOnlyHandover}
                style={{ minHeight: '92px', resize: 'vertical' }}
                onChange={(event) => setGhiChuChung(event.target.value)}
              />
            </div>

            {!isReadOnlyHandover && (
              <div style={{ padding: '16px 24px', backgroundColor: '#f8f9fa', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: 'transparent', color: '#3f494a', fontWeight: '600', cursor: 'pointer' }}
                  onClick={resetForm}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="ktp-btn-submit"
                  style={{ padding: '10px 24px' }}
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {saving ? 'Đang lưu...' : 'Lưu biên bản'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
