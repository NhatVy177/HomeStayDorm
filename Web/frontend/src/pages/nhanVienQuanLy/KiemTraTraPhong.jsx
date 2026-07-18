import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { kiemTraTraPhongApi } from './kiemTraTraPhong.api.js';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import '../nhanVienSale/dangKyTraPhongTab.css';


function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

const AssetRow = ({ asset, onChange, readOnly }) => {
  const [status, setStatus] = useState(asset.mucDoHuHong || 'Bình thường');
  const [soLuongLoi, setSoLuongLoi] = useState(asset.soLuongHuMat || 0);
  const [note, setNote] = useState(asset.moTaHuHong || '');
  const [cost, setCost] = useState(asset.chiPhiSuaChua || 0);

  const isNormal = status === 'Bình thường';

  const getStatusStyle = () => {
    switch (status) {
      case 'Hư hỏng nhẹ': return { color: '#b06000', bg: '#fef7e0', border: '#fbbc04' };
      case 'Hư hỏng nặng': return { color: '#c5221f', bg: '#fce8e6', border: '#ea4335' };
      case 'Mất mát': return { color: '#ba1a1a', bg: '#fce8e6', border: '#ba1a1a' };
      default: return { color: '#137333', bg: 'transparent', border: '#137333' };
    }
  };

  const statusStyle = getStatusStyle();

  const inputStyle = {
    width: '100%',
    height: '42px',
    padding: '8px 12px',
    border: '1px solid #e1e3e4',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: isNormal ? '#f3f4f5' : '#ffffff',
    color: '#191c1d',
    boxSizing: 'border-box'
  };

  const updateCost = (newStatus, newSl) => {
    if (newStatus === 'Bình thường') {
      setCost(0);
      return;
    }
    let tyLe = 0;
    if (newStatus === 'Hư hỏng nhẹ') tyLe = 0.2;
    else if (newStatus === 'Hư hỏng nặng') tyLe = 0.6;
    else if (newStatus === 'Mất mát') tyLe = 1.0;

    setCost(newSl * (asset.donGiaBoiThuong || 0) * tyLe);
  };

  useEffect(() => {
    onChange({
      keyTaiSan: asset.maTaiSan,
      maTaiSan: asset.maTaiSanGoc || asset.maTaiSan,
      status,
      soLuongLoi: isNormal ? 0 : soLuongLoi,
      note,
      cost,
      donGiaBoiThuong: asset.donGiaBoiThuong
    });
  }, [status, soLuongLoi, note, cost]);

  let tyLeStr = '0%';
  if (status === 'Hư hỏng nhẹ') tyLeStr = '20%';
  else if (status === 'Hư hỏng nặng') tyLeStr = '60%';
  else if (status === 'Mất mát') tyLeStr = '100%';

  return (
    <tr style={{
      borderBottom: '1px solid #e1e3e4',
      backgroundColor: statusStyle.bg,
      borderLeft: isNormal ? 'none' : `3px solid ${statusStyle.border}`
    }}>
      <td style={{ padding: '12px 10px', fontSize: '14px', color: '#191c1d' }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{asset.tenTaiSan}</div>
        {asset.donGiaBoiThuong > 0 && (
          <div style={{ fontSize: '12px', color: '#6f797a' }}>Đơn giá: {Number(asset.donGiaBoiThuong).toLocaleString()}đ</div>
        )}
      </td>
      <td style={{ padding: '12px 10px', fontSize: '14px', color: '#3f494a', textAlign: 'center' }}>
        {asset.soLuongBanGiao}
      </td>
      <td style={{ padding: '12px 10px' }}>
        <select
          value={status}
          onChange={(e) => {
            const newStatus = e.target.value;
            setStatus(newStatus);
            if (newStatus === 'Bình thường') {
              setNote('');
              setSoLuongLoi(0);
              setCost(0);
            } else {
              const newSl = soLuongLoi === 0 ? 1 : soLuongLoi;
              setSoLuongLoi(newSl);
              updateCost(newStatus, newSl);
            }
          }}
          disabled={readOnly}
          style={{ ...inputStyle, border: `1px solid ${statusStyle.border}`, color: statusStyle.color, fontWeight: '500', cursor: 'pointer', textAlign: 'center' }}
        >
          <option value="Bình thường">Bình thường</option>
          <option value="Hư hỏng nhẹ">Hư hỏng nhẹ</option>
          <option value="Hư hỏng nặng">Hư hỏng nặng</option>
          <option value="Mất mát">Mất mát</option>
        </select>
      </td>
      <td style={{ padding: '12px 10px' }}>
        <input
          type="text"
          value={isNormal ? '-' : soLuongLoi}
          onChange={(e) => {
            const valStr = e.target.value.replace(/[^0-9]/g, '');
            if (valStr === '') {
              setSoLuongLoi('');
              updateCost(status, 0);
              return;
            }
            let val = parseInt(valStr);
            if (val > asset.soLuongBanGiao) val = asset.soLuongBanGiao;
            setSoLuongLoi(val);
            updateCost(status, val);
          }}
          disabled={isNormal || readOnly}
          style={{ ...inputStyle, textAlign: 'center', backgroundColor: isNormal ? '#f3f4f5' : '#ffffff' }}
        />
      </td>
      <td style={{ padding: '12px 10px', fontSize: '14px', color: statusStyle.color, textAlign: 'center', fontWeight: '600' }}>
        {tyLeStr}
      </td>
      <td style={{ padding: '12px 10px' }}>
        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f5', color: '#3f494a', fontWeight: '600' }}>
          {Number(cost).toLocaleString()}đ
        </div>
      </td>
      <td style={{ padding: '12px 10px' }}>
        <textarea
          rows="2"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={isNormal ? "Không có hư hỏng" : "Mô tả..."}
          style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: '1.4' }}
          disabled={isNormal}
          spellCheck={false}
        />
      </td>
    </tr>
  );
};

export default function KiemTraTraPhong() {
  const [dsPhieu, setDsPhieu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Chờ xử lý');
  const [toast, setToast] = useState('');
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(''), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Modal State
  const [modalType, setModalType] = useState(null); // 'kiem-tra-hd' or 'xac-nhan-pdc'
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [ngayTraThucTe, setNgayTraThucTe] = useState(new Date().toISOString().split('T')[0]);
  const [tinhTrangPhong, setTinhTrangPhong] = useState('');
  const [dsHuHong, setDsHuHong] = useState({});
  const [errors, setErrors] = useState({});

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kiemTraTraPhongApi.quanLyDanhSachChoXuLy('Tất cả');
      setDsPhieu(res.data.danhSach || []);
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDanhSach();
  }, [loadDanhSach]);



  const openModal = async (phieu) => {
    setSelectedPhieu(phieu);
    setModalType(phieu.loaiNguon === 'HopDong' ? 'kiem-tra-hd' : 'xac-nhan-pdc');
    setLoadingDetail(true);
    setTinhTrangPhong('');
    setDsHuHong({});
    setIsSubmitted(false);
    setErrors({});

    try {
      const res = await kiemTraTraPhongApi.quanLyChiTietPhieu(phieu.maPhieuTra);
      const data = res.data;
      setChiTiet(data);
      // Nếu phiếu đã có ngày trả thực tế (đã xử lý) thì hiển thị đúng ngày đó
      if (data.ngayTraThucTe) {
        setNgayTraThucTe(data.ngayTraThucTe.split('T')[0]);
      } else {
        setNgayTraThucTe(new Date().toISOString().split('T')[0]);
      }
      if (data.tinhTrangPhongThucTe) {
        setTinhTrangPhong(data.tinhTrangPhongThucTe);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu');
      setModalType(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAssetChange = (assetData) => {
    setDsHuHong(prev => ({
      ...prev,
      [assetData.keyTaiSan]: assetData
    }));
  };

  const submitXacNhanHuyCoc = async () => {
    try {
      await kiemTraTraPhongApi.quanLyXacNhanHuyCoc({ maPhieuTra: selectedPhieu.maPhieuTra });
      loadDanhSach();
      setModalType(null);
      setSuccessToast('Hồ sơ đặt cọc đã được xác nhận thành công.');
    } catch (err) {
      console.error(err);
      setToast(err.response?.data?.message || 'Lỗi khi xác nhận hồ sơ.');
    }
  };

  const submitKiemTra = async () => {
    setErrors({});

    const huHongArr = Object.values(dsHuHong)
      .filter(item => item.status !== 'Bình thường')
      .map(item => ({
        maTaiSan: item.maTaiSan,
        soLuong: item.soLuongLoi,
        mucDoHuHong: item.status,
        donGiaBoiThuong: item.donGiaBoiThuong,
        moTa: item.note
      }));

    try {
      await kiemTraTraPhongApi.quanLyLapBienBanKiemTra({
        maPhieuTra: selectedPhieu.maPhieuTra,
        ngayTraThucTe,
        tinhTrangPhong,
        dsHuHong: huHongArr
      });
      loadDanhSach();
      setModalType(null);
      setSuccessToast('Biên bản kiểm tra trả phòng đã được lưu vào hệ thống.');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message;
      if (msg) {
        if (msg.includes('Ngày trả thực tế') || msg.includes('chọn ngày')) {
          setErrors(prev => ({ ...prev, ngayTra: msg }));
        } else if (msg.includes('tình trạng phòng')) {
          setErrors(prev => ({ ...prev, tinhTrang: msg }));
        } else {
          setToast(msg);
        }
      } else {
        setToast('Lỗi khi lập biên bản.');
      }
    }
  };

  const countTatCa = dsPhieu.length;
  const countChoXuLy = dsPhieu.filter(p => p.trangThai === 'Chờ xử lý').length;
  const countDaXuLy = dsPhieu.filter(p => p.trangThai !== 'Chờ xử lý').length;

  const filteredItems = dsPhieu.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.hoTenKhach?.toLowerCase().includes(q) || p.sdtKhach?.includes(q) || p.maPhieuTra?.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (filterStatus === 'Chờ xử lý') return p.trangThai === 'Chờ xử lý';
    if (filterStatus === 'Đã xử lý') return p.trangThai !== 'Chờ xử lý';
    return true;
  });

  return (
    <div>
      <section className="ktp-table-section">
        {/* Thanh tìm kiếm */}
        <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tên khách hàng, SĐT hoặc mã phiếu..."
              className="ktp-input"
              style={{ width: '100%', backgroundColor: '#fff' }}
              spellCheck={false}
            />
          </div>
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="ktp-btn-cancel" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
          )}
        </div>

        <StatusFilterTabs
          className="status-pill-tabs-offset"
          items={[
            { key: 'Tất cả', label: 'Tất cả' },
            { key: 'Chờ xử lý', label: 'Chờ xử lý' },
            { key: 'Đã xử lý', label: 'Đã xử lý' }
          ]}
          activeKey={filterStatus}
          counts={{ 'Tất cả': countTatCa, 'Chờ xử lý': countChoXuLy, 'Đã xử lý': countDaXuLy }}
          onChange={setFilterStatus}
        />

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Hồ sơ</th>
                <th>Dự kiến trả</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không có phiếu trả phòng nào phù hợp.</td></tr>
              ) : filteredItems.map((row) => (
                <tr key={row.maPhieuTra}>
                  <td style={{ fontWeight: 600, color: '#2f6765' }}>{row.maPhieuTra}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div>
                    <div style={{ fontSize: 12, color: '#6f797a' }}>{row.sdtKhach}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.tenPhong}</div>
                  </td>
                  <td>
                    <span className={`tp-loai-badge ${row.loaiNguon === 'HopDong' ? 'hd' : 'dc'}`} style={{ fontSize: 11 }}>
                      {row.loaiNguon === 'HopDong' ? 'Hợp đồng' : 'Phiếu đặt cọc'}
                    </span>
                    <div style={{ fontSize: 12, marginTop: 2 }}>{row.maNguon}</div>
                  </td>
                  <td>{fmtDate(row.ngayDuKienTra)}</td>
                  <td className="text-center">
                    <span
                      className="ktp-badge"
                      style={{
                        backgroundColor: row.trangThai === 'Chờ xử lý' ? '#fff3cd' : '#e5f3eb',
                        color: row.trangThai === 'Chờ xử lý' ? '#856404' : '#137333',
                        borderColor: row.trangThai === 'Chờ xử lý' ? '#ffeeba' : '#c3e6cb'
                      }}
                    >
                      {row.trangThai || 'Chờ xử lý'}
                    </span>
                  </td>
                  <td className="text-center">
                    {row.trangThai === 'Chờ xử lý' ? (
                      <button
                        className="ktp-btn-action-fill"
                        onClick={() => openModal(row)}
                      >
                        {row.loaiNguon === 'HopDong' ? 'Lập biên bản' : 'Xác nhận'}
                      </button>
                    ) : (
                      <button
                        className="tp-btn-detail-outline"
                        onClick={() => openModal(row)}
                      >
                        Xem chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal Overlay */}
      {modalType && (
        <div className="ktp-modal-overlay" onClick={() => setModalType(null)}>
          <div className="ktp-modal" style={{ maxWidth: '900px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 className="ktp-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                  {modalType === 'kiem-tra-hd' ? (selectedPhieu?.trangThai === 'Chờ xử lý' ? 'Lập biên bản kiểm tra trả phòng' : 'Chi tiết biên bản kiểm tra trả phòng') : (selectedPhieu?.trangThai === 'Chờ xử lý' ? 'Xác nhận hồ sơ trả phòng' : 'Chi tiết xác nhận hồ sơ trả phòng')}
                </h2>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalType(null)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa', gap: '0' }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
              ) : chiTiet ? (
                <>
                  {/* Top Ticket Info */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontWeight: '700', fontSize: '14px' }}>
                      <Icon name="info" style={{ fontSize: '18px' }} /> Thông tin phiếu trả phòng
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '13px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#6f797a', whiteSpace: 'nowrap' }}>Mã phiếu trả phòng</span>
                        <strong style={{ color: '#191c1d' }}>{chiTiet.maPhieuTra}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#6f797a', whiteSpace: 'nowrap' }}>Ngày đăng ký</span>
                        <strong style={{ color: '#191c1d' }}>{fmtDate(chiTiet.ngayDangKyTra)}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#6f797a', whiteSpace: 'nowrap' }}>Ngày dự kiến trả</span>
                        <strong style={{ color: '#191c1d' }}>{fmtDate(chiTiet.ngayDuKienTra)}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ color: '#6f797a', whiteSpace: 'nowrap' }}>Trạng thái hiện tại</span>
                        <div>
                          <span style={{ backgroundColor: '#fef7e0', color: '#b06000', padding: '4px 12px', borderRadius: '4px', fontWeight: '600', whiteSpace: 'nowrap' }}>{chiTiet.trangThai}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Info Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    {/* Card 1: Khách hàng */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00666d', fontWeight: '700', fontSize: '14px' }}>
                        <Icon name="person" style={{ fontSize: '18px' }} /> Khách hàng
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Họ tên:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.hoTenKhach}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>SĐT:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.sdtKhach || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>CMND/CCCD:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.cccdKhach || '—'}</span>
                      </div>
                    </div>

                    {/* Card 2: Hồ sơ */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00666d', fontWeight: '700', fontSize: '14px'}}>
                        <Icon name="assignment" style={{ fontSize: '18px' }} /> Hồ sơ
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Loại hồ sơ:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.maHopDong ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Mã hồ sơ:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.maHopDong ? chiTiet.maHopDong : chiTiet.maPhieuDatCoc}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Trạng thái hồ sơ:</span>
                        <span style={{ fontWeight: '600', backgroundColor: (chiTiet.maHopDong ? chiTiet.trangThaiHopDong : chiTiet.trangThaiCoc)?.includes('Đã') ? '#f1f3f4' : '#e5f3eb', color: (chiTiet.maHopDong ? chiTiet.trangThaiHopDong : chiTiet.trangThaiCoc)?.includes('Đã') ? '#3f494a' : '#137333', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {chiTiet.maHopDong ? chiTiet.trangThaiHopDong : chiTiet.trangThaiCoc}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Phòng/Giường */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00666d', fontWeight: '700', fontSize: '14px' }}>
                        <Icon name="bed" style={{ fontSize: '18px' }} /> Phòng/Giường
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Khu vực:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.tenChiNhanh || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Phòng/Giường:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>
                          {chiTiet.hinhThucThue === 'Nguyên phòng' 
                            ? chiTiet.tenPhong 
                            : (chiTiet.maGiuong 
                                ? `${chiTiet.tenPhong}-G${String(chiTiet.maGiuong).replace(/giường/i, '').trim().replace(/^G/i, '').padStart(2, '0')}` 
                                : chiTiet.tenPhong)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#6f797a' }}>Hình thức thuê:</span>
                        <span style={{ fontWeight: '600', color: '#191c1d' }}>{chiTiet.hinhThucThue || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {modalType === 'kiem-tra-hd' && (
                    <>
                      {/* Nghĩa vụ liên quan */}
                      {chiTiet.nghiaVu?.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#191c1d', margin: '0 0 4px 0' }}>Nghĩa vụ liên quan</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Khung Hóa đơn nợ */}
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e3e4', backgroundColor: '#f8f9fa' }}>
                                <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#00666d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Icon name="receipt_long" style={{ fontSize: '18px' }} /> Hóa đơn chưa thanh toán/nợ
                                </h5>
                              </div>
                              {chiTiet.nghiaVu.filter(nv => nv.LoaiNghiaVu === 'HoaDon').length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                  <thead style={{ borderBottom: '1px solid #e1e3e4' }}>
                                    <tr>
                                      <th style={{ padding: '8px 16px', textAlign: 'left', color: '#3f494a', fontWeight: '600' }}>Kỳ hóa đơn</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'center', color: '#3f494a', fontWeight: '600' }}>Trạng thái</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'center', color: '#3f494a', fontWeight: '600' }}>Số tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {chiTiet.nghiaVu.filter(nv => nv.LoaiNghiaVu === 'HoaDon').map((nv, i) => (
                                      <tr key={i} style={{ borderBottom: '1px solid #f1f3f4' }}>
                                        <td style={{ padding: '8px 16px', color: '#191c1d' }}>{nv.Ten.replace('Hóa đơn kỳ ', '')}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'center', color: '#b06000', fontWeight: '500' }}>{nv.TrangThai}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'center', color: '#191c1d' }}>{nv.SoTien != null ? Number(nv.SoTien).toLocaleString() + 'đ' : '0đ'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={{ padding: '16px', color: '#6f797a', fontStyle: 'italic', fontSize: '13px', textAlign: 'center' }}>Không có hóa đơn nợ</div>
                              )}
                            </div>

                            {/* Khung Biên bản vi phạm */}
                            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e1e3e4', backgroundColor: '#f8f9fa' }}>
                                <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#00666d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Icon name="gavel" style={{ fontSize: '18px' }} /> Biên bản vi phạm
                                </h5>
                              </div>
                              {chiTiet.nghiaVu.filter(nv => nv.LoaiNghiaVu === 'ViPham').length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                  <thead style={{ borderBottom: '1px solid #e1e3e4' }}>
                                    <tr>
                                      <th style={{ padding: '8px 16px', textAlign: 'left', color: '#3f494a', fontWeight: '600' }}>Nội dung vi phạm</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'left', color: '#3f494a', fontWeight: '600' }}>Thời gian</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'right', color: '#3f494a', fontWeight: '600' }}>Mức phạt</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {chiTiet.nghiaVu.filter(nv => nv.LoaiNghiaVu === 'ViPham').map((nv, i) => (
                                      <tr key={i} style={{ borderBottom: '1px solid #f1f3f4' }}>
                                        <td style={{ padding: '8px 16px', color: '#191c1d' }}>{nv.Ten}</td>
                                        <td style={{ padding: '8px 16px', color: '#191c1d' }}>{nv.ThoiGian || '—'}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'right', color: '#191c1d' }}>{nv.SoTien != null ? Number(nv.SoTien).toLocaleString() + 'đ' : '0đ'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <div style={{ padding: '16px', color: '#6f797a', fontStyle: 'italic', fontSize: '13px', textAlign: 'center' }}>Không có lỗi vi phạm chưa xử lý</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Ngày kiểm tra</label>
                          <input type="date" value={ngayTraThucTe} onChange={(e) => setNgayTraThucTe(e.target.value)} disabled={selectedPhieu?.trangThai !== 'Chờ xử lý'} style={{ width: '250px', padding: '10px 12px', border: '1px solid #e1e3e4', borderRadius: '6px', color: '#191c1d', backgroundColor: selectedPhieu?.trangThai !== 'Chờ xử lý' ? '#f3f4f5' : '#f8f9fa', fontSize: '14px', outline: 'none', cursor: selectedPhieu?.trangThai !== 'Chờ xử lý' ? 'not-allowed' : 'text', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ marginBottom: '0' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Tình trạng thực tế của phòng/giường <span style={{ color: '#c5221f' }}>*</span></label>
                          <textarea rows="3" value={tinhTrangPhong} onChange={(e) => { setTinhTrangPhong(e.target.value); setErrors(prev => ({...prev, tinhTrang: null})); }} placeholder="Nhập đánh giá" style={{ width: '100%', padding: '12px', border: `1px solid ${errors.tinhTrang ? '#c5221f' : '#e1e3e4'}`, borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block' }} disabled={selectedPhieu?.trangThai !== 'Chờ xử lý'} spellCheck={false}></textarea>
                          {errors.tinhTrang && <div style={{ color: '#c5221f', fontSize: '13px', marginTop: '6px' }}>{errors.tinhTrang}</div>}
                        </div>
                      </div>

                      {/* Asset List Section */}
                      {chiTiet.taiSan?.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 12px 0' }}>Danh mục tài sản kiểm tra</h4>
                          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead style={{ backgroundColor: '#f3f4f5', borderBottom: '1px solid #e1e3e4' }}>
                                <tr>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', width: '150px' }}>Tài sản</th>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', textAlign: 'center', width: '90px', whiteSpace: 'nowrap' }}>SL bàn giao</th>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', textAlign: 'center', width: '150px' }}>Hiện trạng</th>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', textAlign: 'center', width: '80px', whiteSpace: 'nowrap' }}>SL hư/mất</th>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', textAlign: 'center', width: '70px' }}>Tỷ lệ</th>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', width: '120px' }}>Phí tạm tính</th>
                                  <th style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '600', color: '#3f494a', minWidth: '200px' }}>Mô tả hư/mất</th>
                                </tr>
                              </thead>
                              <tbody>
                                {chiTiet.taiSan.map((asset) => (
                                  <AssetRow
                                    key={asset.maTaiSan}
                                    asset={asset}
                                    onChange={handleAssetChange}
                                    readOnly={selectedPhieu?.trangThai !== 'Chờ xử lý'}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </>
              ) : null}
            </div>

            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: modalType === 'kiem-tra-hd' ? 'space-between' : 'flex-end', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              {modalType === 'kiem-tra-hd' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: '#fff8e1', padding: '8px 12px', borderRadius: '6px', flex: 1, marginRight: '16px' }}>
                  <Icon name="info" style={{ color: '#b06000', fontSize: '18px', marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#b06000', fontSize: '13px', display: 'block', marginBottom: '2px' }}>Lưu ý:</strong>
                    <span style={{ color: '#b06000', fontSize: '12px' }}>Vui lòng kiểm tra, đối chiếu đầy đủ thông tin với hồ sơ, chứng từ và tình trạng thực tế trước khi xác nhận lưu biên bản.</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setModalType(null)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                {!isSubmitted && modalType === 'kiem-tra-hd' && selectedPhieu?.trangThai === 'Chờ xử lý' && (
                  <button className="ktp-btn-action-fill" onClick={submitKiemTra} style={{ padding: '10px 24px' }}>Xác nhận lưu biên bản</button>
                )}
                {!isSubmitted && modalType === 'xac-nhan-pdc' && selectedPhieu?.trangThai === 'Chờ xử lý' && (
                  <button className="ktp-btn-action-fill" onClick={submitXacNhanHuyCoc} style={{ padding: '10px 24px' }}>Xác nhận hồ sơ</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`tp-toast ${toast ? 'show' : ''}`}>{toast}</div>
      <div className={`dktp-toast ${successToast ? 'dktp-toast-show' : ''}`}>
        <Icon name="check_circle" style={{ fontSize: '18px' }} />
        {successToast}
      </div>
    </div>
  );
}
