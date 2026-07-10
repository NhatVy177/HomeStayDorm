import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { xacNhanKetQuaApi } from './xacnhanketqua.api.js';
import '../nhanVienSale/dangKyTraPhongTab.css';

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('vi-VN');
}

export default function XacNhanKetQua() {
  const [dsDoiSoat, setDsDoiSoat] = useState([]);
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

  // Form state
  const [isDongY, setIsDongY] = useState(true);
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState('');
  const [lyDoKhongDongY, setLyDoKhongDongY] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await xacNhanKetQuaApi.getDanhSachChoXacNhan();
      setDsDoiSoat(res.data.danhSach || []);
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi tải danh sách');
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
    setIsDongY(true);
    setPhuongThucThanhToan('');
    setLyDoKhongDongY('');

    try {
      const res = await xacNhanKetQuaApi.getChiTietDoiSoat(row.maDoiSoat);
      setChiTiet(res.data.chiTiet);
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu');
      setModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const submitXacNhan = async () => {
    if (isDongY && chiTiet?.soTienHoanThucTe > 0 && !phuongThucThanhToan) {
      setToast('Vui lòng chọn phương thức hoàn tiền');
      return;
    }
    if (!isDongY && !lyDoKhongDongY.trim()) {
      setToast('Vui lòng nhập nội dung cần điều chỉnh');
      return;
    }

    try {
      await xacNhanKetQuaApi.xacNhanDoiSoat({
        maDoiSoat: selectedPhieu.maDoiSoat,
        dongY: isDongY,
        phuongThucThanhToan: isDongY ? phuongThucThanhToan : null,
        lyDoKhongDongY: !isDongY ? lyDoKhongDongY : null
      });
      loadDanhSach();
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setToast(err.response?.data?.message || 'Lỗi khi xác nhận kết quả đối soát.');
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
                <th>Mã đối soát</th>
                <th>Khách hàng</th>
                <th>Phòng/Giường</th>
                <th>Mã phiếu trả</th>
                <th>Ngày lập</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dsDoiSoat.filter(p => 
                p.hoTenKhach?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                p.maDoiSoat?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                p.maPhieuTra?.toLowerCase().includes(activeSearch.toLowerCase())
              ).length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không có phiếu đối soát nào chờ xác nhận.</td></tr>
              ) : dsDoiSoat.filter(p => 
                p.hoTenKhach?.toLowerCase().includes(activeSearch.toLowerCase()) || 
                p.maDoiSoat?.toLowerCase().includes(activeSearch.toLowerCase()) ||
                p.maPhieuTra?.toLowerCase().includes(activeSearch.toLowerCase())
              ).map((row) => (
                <tr key={row.maDoiSoat}>
                  <td style={{ fontWeight: 600, color: '#2f6765' }}>{row.maDoiSoat}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.tenPhong}</div>
                    {row.maGiuong && <div style={{ fontSize: 12, color: '#6f797a' }}>Giường {row.maGiuong.replace(/giường/i, '').trim()}</div>}
                  </td>
                  <td>
                    <span className={`tp-loai-badge ${row.loaiNguon === 'HopDong' ? 'hd' : 'dc'}`} style={{ fontSize: 11 }}>
                      {row.maPhieuTra}
                    </span>
                  </td>
                  <td>{fmtDate(row.ngayLap)}</td>
                  <td className="text-center">
                    <span className="ktp-badge ktp-badge-warning" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>Chờ xác nhận</span>
                  </td>
                  <td className="text-center">
                    <button 
                      className="ktp-btn-action-fill" 
                      onClick={() => openModal(row)}
                    >
                      Xác nhận
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
          <div className="ktp-modal" style={{ maxWidth: '700px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Xác nhận kết quả đối soát</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalOpen(false)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '16px 24px', maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
              ) : chiTiet ? (
                <>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#6f797a' }}>Khách hàng: </strong><span style={{ fontWeight: 500 }}>{chiTiet.hoTenKhach}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#6f797a' }}>Hồ sơ: </strong><span style={{ fontWeight: 500 }}>{chiTiet.maHopDong ? `Hợp đồng` : `Phiếu đặt cọc`}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#6f797a' }}>Phòng: </strong><span style={{ fontWeight: 500 }}>{chiTiet.tenPhong}</span></div>
                    {chiTiet.maGiuong && <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#6f797a' }}>Giường: </strong><span style={{ fontWeight: 500 }}>{chiTiet.maGiuong.replace(/giường/i, '').trim()}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: '#6f797a' }}>Ngày trả phòng thực tế: </strong><span style={{ fontWeight: 500, color: '#2f6765' }}>{fmtDate(chiTiet.ngayTraThucTe)}</span></div>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 12px 0' }}>Chi tiết đối soát</h4>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px', marginBottom: '16px', fontSize: '14px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4' }}>Tiền cọc ban đầu</td><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', textAlign: 'right', fontWeight: '500' }}>{Number(chiTiet.tienCocBanDau).toLocaleString()}đ</td></tr>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4' }}>Tỷ lệ hoàn cọc</td><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', textAlign: 'right', fontWeight: '500' }}>{Number(chiTiet.tyLeHoanCocHienTai).toFixed(0)}%</td></tr>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px solid #e1e3e4', color: '#137333', fontWeight: '600' }}>Tiền cọc được hoàn</td><td style={{ padding: '8px 0', borderBottom: '1px solid #e1e3e4', textAlign: 'right', color: '#137333', fontWeight: '600' }}>{Number(chiTiet.tienCocDuocHoan).toLocaleString()}đ</td></tr>
                        
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', paddingTop: '16px' }}>Tiền thuê còn nợ</td><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', textAlign: 'right', paddingTop: '16px', fontWeight: '500' }}>{Number(chiTiet.tienThueConNo).toLocaleString()}đ</td></tr>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4' }}>Tiền dịch vụ còn nợ</td><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', textAlign: 'right', fontWeight: '500' }}>{Number(chiTiet.tienDichVuConNo).toLocaleString()}đ</td></tr>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4' }}>Chi phí sửa chữa hư hỏng</td><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', textAlign: 'right', fontWeight: '500' }}>{Number(chiTiet.tongChiPhiSuaChua).toLocaleString()}đ</td></tr>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4' }}>Tiền phạt vi phạm</td><td style={{ padding: '8px 0', borderBottom: '1px dashed #e1e3e4', textAlign: 'right', fontWeight: '500' }}>{Number(chiTiet.tienPhat).toLocaleString()}đ</td></tr>
                        <tr><td style={{ padding: '8px 0', borderBottom: '1px solid #e1e3e4', color: '#ba1a1a', fontWeight: '600' }}>Tổng các khoản khấu trừ</td><td style={{ padding: '8px 0', borderBottom: '1px solid #e1e3e4', textAlign: 'right', color: '#ba1a1a', fontWeight: '600' }}>{Number(chiTiet.tongKhauTru).toLocaleString()}đ</td></tr>

                        {chiTiet.soTienHoanThucTe > 0 && (
                          <tr><td style={{ padding: '16px 0 8px 0', color: '#137333', fontWeight: '700', fontSize: '16px' }}>Khách được hoàn lại</td><td style={{ padding: '16px 0 8px 0', textAlign: 'right', color: '#137333', fontWeight: '700', fontSize: '16px' }}>{Number(chiTiet.soTienHoanThucTe).toLocaleString()}đ</td></tr>
                        )}
                        {chiTiet.soTienKhachPhaiTT > 0 && (
                          <tr><td style={{ padding: '16px 0 8px 0', color: '#ba1a1a', fontWeight: '700', fontSize: '16px' }}>Khách phải thanh toán thêm</td><td style={{ padding: '16px 0 8px 0', textAlign: 'right', color: '#ba1a1a', fontWeight: '700', fontSize: '16px' }}>{Number(chiTiet.soTienKhachPhaiTT).toLocaleString()}đ</td></tr>
                        )}
                        {chiTiet.soTienHoanThucTe === 0 && chiTiet.soTienKhachPhaiTT === 0 && (
                          <tr><td colSpan="2" style={{ padding: '16px 0 8px 0', textAlign: 'center', color: '#2f6765', fontWeight: '700', fontSize: '16px' }}>Đã quyết toán (Không phát sinh dư nợ)</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 12px 0' }}>Ghi nhận phản hồi của khách hàng</h4>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                        <input type="radio" name="phanHoi" checked={isDongY} onChange={() => setIsDongY(true)} />
                        Khách hàng đồng ý
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', color: '#ba1a1a' }}>
                        <input type="radio" name="phanHoi" checked={!isDongY} onChange={() => setIsDongY(false)} />
                        Yêu cầu điều chỉnh
                      </label>
                    </div>

                    {isDongY && chiTiet.soTienHoanThucTe > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Phương thức hoàn tiền cho khách <span style={{ color: 'red' }}>*</span></label>
                        <select 
                          value={phuongThucThanhToan} 
                          onChange={(e) => setPhuongThucThanhToan(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e1e3e4', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                        >
                          <option value="">-- Chọn phương thức --</option>
                          <option value="Tiền mặt">Tiền mặt</option>
                          <option value="Chuyển khoản">Chuyển khoản</option>
                        </select>
                      </div>
                    )}

                    {!isDongY && (
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#3f494a', marginBottom: '8px' }}>Nội dung cần điều chỉnh <span style={{ color: 'red' }}>*</span></label>
                        <textarea 
                          rows="3" 
                          value={lyDoKhongDongY} 
                          onChange={(e) => setLyDoKhongDongY(e.target.value)} 
                          placeholder="Khách hàng thắc mắc về tiền phạt, chi phí điện nước, v.v..." 
                          style={{ width: '100%', padding: '12px', border: '1px solid #ba1a1a', borderRadius: '6px', fontSize: '14px', resize: 'vertical', display: 'block', outline: 'none' }}
                        ></textarea>
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
                  isDongY ? (
                    <button className="ktp-btn-action-fill" onClick={submitXacNhan} style={{ padding: '10px 24px' }}>Xác nhận đồng ý</button>
                  ) : (
                    <button className="ktp-btn-action-fill" onClick={submitXacNhan} style={{ padding: '10px 24px', backgroundColor: '#ba1a1a', border: 'none' }}>Gửi điều chỉnh</button>
                  )
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
              {isDongY ? 'Xác nhận kết quả đối soát thành công. Hệ thống đã cập nhật trạng thái.' : 'Đã gửi yêu cầu điều chỉnh phiếu đối soát cho bộ phận kế toán.'}
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
