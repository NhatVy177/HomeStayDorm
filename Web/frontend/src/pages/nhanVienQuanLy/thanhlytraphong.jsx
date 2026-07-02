import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { thanhLyTraPhongApi } from './thanhlytraphong.api.js';
import '../nhanVienSale/dangKyTraPhongTab.css';

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export default function ThanhLyTraPhong() {
  const [dsThanhLy, setDsThanhLy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [toast, setToast] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await thanhLyTraPhongApi.getDanhSachThanhLy();
      setDsThanhLy(res.data.danhSach || []);
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi tải danh sách thanh lý');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDanhSach();
  }, [loadDanhSach]);

  const openModal = async (row) => {
    setSelectedPhieu(row);
    setModalOpen(true);
    setLoadingDetail(true);
    setIsSubmitted(false);

    try {
      const res = await thanhLyTraPhongApi.getChiTietThanhLy(row.maPhieuTra);
      setChiTiet(res.data.chiTiet);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu');
      setModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const submitXacNhan = async () => {
    try {
      await thanhLyTraPhongApi.xacNhanThanhLy({
        maPhieuTra: selectedPhieu.maPhieuTra
      });
      loadDanhSach();
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setToast(err.response?.data?.message || 'Lỗi khi thanh lý trả phòng.');
    }
  };

  return (
    <div>
      <div className="tp-search-container">
        <form 
          className="tp-search-row" 
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(searchQuery);
          }}
        >
          <div className="tp-search-col">
            <div className="tp-search-label">TÌM KIẾM</div>
            <div className="tp-search-wrap">
              <input
                className="ktp-input tp-search-input-no-icon"
                type="text"
                placeholder="Tra cứu theo tên, số điện thoại hoặc mã phiếu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="tp-btn-search">
            Tìm kiếm
          </button>
        </form>
      </div>

      <section className="tp-list-panel">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu trả</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Mã đối soát</th>
                <th>Ngày đăng ký trả</th>
                <th className="text-center">Trạng thái (PT)</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dsThanhLy.filter(p => 
                p.hoTenKhach?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                p.maDoiSoat?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                p.maPhieuTra?.toLowerCase().includes(activeSearch.toLowerCase())
              ).length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không có phiếu nào chờ ký biên bản thanh lý.</td></tr>
              ) : dsThanhLy.filter(p => 
                p.hoTenKhach?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                p.maDoiSoat?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                p.maPhieuTra?.toLowerCase().includes(activeSearch.toLowerCase())
              ).map((row) => (
                <tr key={row.maPhieuTra}>
                  <td style={{ fontWeight: 600, color: '#2f6765' }}>{row.maPhieuTra}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div>
                    <div style={{ fontSize: 12, color: '#6f797a' }}>{row.loaiNguon === 'HopDong' ? 'Hợp đồng thuê' : 'Phiếu đặt cọc'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.tenPhong}</div>
                    {row.maGiuong && <div style={{ fontSize: 12, color: '#6f797a' }}>Giường {row.maGiuong.replace(/giường/i, '').trim()}</div>}
                  </td>
                  <td>
                    <span className="tp-loai-badge hd" style={{ fontSize: 11 }}>
                      {row.maDoiSoat}
                    </span>
                  </td>
                  <td>{fmtDate(row.ngayDangKyTra)}</td>
                  <td className="text-center">
                    <span className="ktp-badge ktp-badge-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>Chờ ký biên bản</span>
                  </td>
                  <td className="text-center">
                    <button 
                      className="ktp-btn-action-fill" 
                      onClick={() => openModal(row)}
                    >
                      Thanh lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal Overlay */}
      {modalOpen && (
        <div className="ktp-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="ktp-modal" style={{ maxWidth: '950px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Thanh lý hồ sơ</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalOpen(false)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
              ) : chiTiet ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    {/* Card 1: Khách thuê */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
                        <Icon name="person" /> Khách thuê
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Họ tên:</span><span style={{ fontWeight: 500 }}>{chiTiet.hoTenKhach}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>SĐT:</span><span style={{ fontWeight: 500 }}>{chiTiet.soDienThoai}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Hình thức:</span><span style={{ fontWeight: 500 }}>{chiTiet.maGiuong ? 'Thuê giường' : 'Thuê nguyên phòng'}</span></div>
                      </div>
                    </div>

                    {/* Card 2: Hợp đồng */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
                        <Icon name="description" /> {chiTiet.hasHopDong ? 'Hợp đồng' : 'Phiếu đặt cọc'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Mã {chiTiet.hasHopDong ? 'HĐ' : 'PĐC'}:</span><span style={{ fontWeight: 500 }}>{chiTiet.hasHopDong ? chiTiet.maHopDong : chiTiet.maPhieuDatCoc}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>{chiTiet.hasHopDong ? 'Thời hạn:' : 'Ngày đặt cọc:'}</span><span style={{ fontWeight: 500 }}>{chiTiet.hasHopDong ? `${fmtDate(chiTiet.ngayBatDauHopDong)} - ${fmtDate(chiTiet.ngayKetThucHopDong)}` : fmtDate(chiTiet.ngayDatCoc)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#6f797a' }}>Trạng thái {chiTiet.hasHopDong ? 'HĐ' : 'PĐC'}:</span>
                          <span style={{ 
                            padding: '2px 8px', 
                            backgroundColor: (chiTiet.hasHopDong ? chiTiet.trangThaiHopDong === 'Đã thanh lý' : chiTiet.trangThaiCoc === 'Đã hủy') ? '#f1f3f4' : '#e6f4ea', 
                            color: (chiTiet.hasHopDong ? chiTiet.trangThaiHopDong === 'Đã thanh lý' : chiTiet.trangThaiCoc === 'Đã hủy') ? '#5f6368' : '#137333', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: 500 
                          }}>
                            {chiTiet.hasHopDong ? chiTiet.trangThaiHopDong : chiTiet.trangThaiCoc}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Phòng/Giường */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', fontSize: '14px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 16px 0' }}>
                        <Icon name="bed" /> Phòng/Giường
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Khu vực:</span><span style={{ fontWeight: 500 }}>{chiTiet.khuVuc?.replace('HomeDorm ', '') || ''}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Phòng:</span><span style={{ fontWeight: 500 }}>{chiTiet.tenPhong}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Giường:</span><span style={{ fontWeight: 500 }}>{chiTiet.maGiuong ? `G${chiTiet.maGiuong.replace(/giường/i, '').replace('G', '').trim()}` : 'Tất cả'}</span></div>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 12px 0' }}>Kết quả đối soát (Mã: {chiTiet.maDoiSoat})</h4>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: '#6f797a' }}>Trạng thái đối soát: </strong>
                      <span style={{ fontWeight: 600, color: chiTiet.trangThaiDoiSoat === 'Chờ hoàn cọc' ? '#137333' : '#2f6765' }}>{chiTiet.trangThaiDoiSoat}</span>
                    </div>
                    {chiTiet.soTienHoanThucTe > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px dashed #e1e3e4', paddingTop: '12px' }}>
                        <strong style={{ color: '#137333', fontSize: '16px' }}>Khách được hoàn lại: </strong>
                        <span style={{ fontWeight: 700, color: '#137333', fontSize: '16px' }}>{Number(chiTiet.soTienHoanThucTe).toLocaleString()}đ</span>
                      </div>
                    )}
                    {chiTiet.soTienKhachPhaiTT > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px dashed #e1e3e4', paddingTop: '12px' }}>
                        <strong style={{ color: '#ba1a1a', fontSize: '16px' }}>Khách đã nộp thêm: </strong>
                        <span style={{ fontWeight: 700, color: '#ba1a1a', fontSize: '16px' }}>{Number(chiTiet.soTienKhachPhaiTT).toLocaleString()}đ</span>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
            
            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setModalOpen(false)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                {!isSubmitted && (
                  <button className="ktp-btn-action-fill" onClick={submitXacNhan} style={{ padding: '10px 24px' }}>
                    {chiTiet?.trangThaiDoiSoat === 'Chờ hoàn cọc' ? 'Xác nhận thanh lý' : 'Xác nhận hoàn tất hồ sơ'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSubmitted && (
        <div className="ktp-modal-overlay" style={{ zIndex: 1100 }} onClick={() => { setIsSubmitted(false); setModalOpen(false); }}>
          <div className="ktp-modal" style={{ maxWidth: '400px', width: '90%', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#191c1d', margin: '0 0 8px 0' }}>Thành công!</h3>
            <p style={{ fontSize: '15px', color: '#3f494a', margin: '0 0 24px 0' }}>
              Đã thanh lý trả phòng.
            </p>
            <button 
              onClick={() => { setIsSubmitted(false); setModalOpen(false); }} 
              style={{ backgroundColor: '#004c52', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none', width: '100%', fontSize: '15px' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`tp-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
