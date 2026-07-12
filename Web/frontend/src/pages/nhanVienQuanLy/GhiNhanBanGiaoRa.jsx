import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { banGiaoRaApi } from './GhiNhanBanGiaoRa.api.js';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import '../nhanVienSale/dangKyTraPhongTab.css';

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export default function GhiNhanBanGiaoRa() {
  const [dsBanGiaoRa, setDsBanGiaoRa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Chờ bàn giao');
  const [toast, setToast] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [dsTaiSan, setDsTaiSan] = useState([]);
  const [dsThanhVien, setDsThanhVien] = useState([]);
  const [xacNhanRoi, setXacNhanRoi] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadDanhSach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await banGiaoRaApi.getDanhSachBanGiaoRa('Tất cả');
      setDsBanGiaoRa(res.data.danhSach || []);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Lỗi tải danh sách bàn giao ra');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDanhSach();
  }, [loadDanhSach]);

  const handleRefresh = () => {
    setSearchQuery('');
    setActiveSearch('');
    setFilterStatus('Chờ bàn giao');
    loadDanhSach();
  };

  const openModal = async (row) => {
    setSelectedPhieu(row);
    setModalOpen(true);
    setLoadingDetail(true);
    setIsSubmitted(false);
    setXacNhanRoi(row.trangThaiBanGiao === 'Đã bàn giao');
    setErrorMsg('');

    try {
      const res = await banGiaoRaApi.getChiTietBanGiaoRa(row.maPhieuTra);
      setChiTiet(res.data.data.chiTiet);
      setDsThanhVien(res.data.data.danhSachThanhVien || []);

      // Khởi tạo state cho danh sách tài sản (thêm trường thu hồi và ghi chú)
      const ds = res.data.data.danhSachTaiSanBanGiao || [];
      const dsWithInput = ds.map(ts => ({
        ...ts,
        soLuongThuHoi: ts.soLuongThuHoi !== undefined && ts.soLuongThuHoi !== null ? ts.soLuongThuHoi : ts.soLuongBanGiaoVao, // Dùng số lượng cũ nếu có
        ghiChu: ts.ghiChu || ts.moTaHuHong || ''
      }));
      setDsTaiSan(dsWithInput);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể tải chi tiết phiếu');
      setModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTaiSanChange = (index, field, value) => {
    const newDs = [...dsTaiSan];
    if (field === 'soLuongThuHoi') {
      if (value === '') {
        newDs[index][field] = '';
      } else {
        const val = parseInt(value, 10);
        newDs[index][field] = isNaN(val) ? 0 : val;
      }
    } else {
      newDs[index][field] = value;
    }
    setDsTaiSan(newDs);
  };

  const submitXacNhan = async () => {
    if (!xacNhanRoi) {
      setErrorMsg('Vui lòng xác nhận khách hàng đã kết thúc lưu trú.');
      return;
    }

    try {
      const payload = {
        maPhieuTra: selectedPhieu.maPhieuTra,
        danhSachBanGiao: dsTaiSan.map(ts => ({
          ...ts,
          soLuongThuHoi: ts.soLuongThuHoi === '' ? 0 : Number(ts.soLuongThuHoi)
        }))
      };

      await banGiaoRaApi.ghiNhanBanGiaoRa(payload);
      loadDanhSach();
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Lỗi khi ghi nhận bàn giao ra.');
    }
  };

  const statusCounts = useMemo(() => ({
    'Tất cả': dsBanGiaoRa.length,
    'Chờ bàn giao': dsBanGiaoRa.filter(p => p.trangThaiBanGiao === 'Chờ bàn giao').length,
    'Đã bàn giao': dsBanGiaoRa.filter(p => p.trangThaiBanGiao === 'Đã bàn giao').length
  }), [dsBanGiaoRa]);

  const filteredRows = useMemo(() => {
    const keyword = activeSearch.trim().toLowerCase();
    return dsBanGiaoRa.filter((p) => {
      const matchStatus = filterStatus === 'Tất cả' || p.trangThaiBanGiao === filterStatus;
      const matchSearch = !keyword
        || p.hoTenKhach?.toLowerCase().includes(keyword)
        || p.maDoiSoat?.toLowerCase().includes(keyword)
        || p.maPhieuTra?.toLowerCase().includes(keyword);
      return matchStatus && matchSearch;
    });
  }, [activeSearch, dsBanGiaoRa, filterStatus]);

  return (
    <div>
      <div className="tp-search-container">
        <form
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(searchQuery);
          }}
        >
          <div className="tp-search-row">
            <div className="tp-search-col" style={{ flex: 1 }}>
              <div className="tp-search-label">TÌM KIẾM</div>
              <div className="tp-search-wrap">
                <input
                  className="ktp-input tp-search-input-no-icon"
                  type="text"
                  placeholder="Tra cứu theo tên, mã phiếu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="tp-btn-search" style={{ alignSelf: 'flex-end', height: '42px' }}>
              Tìm kiếm
            </button>
            <button
              type="button"
              className="tp-btn-search"
              style={{ alignSelf: 'flex-end', height: '42px', backgroundColor: 'transparent', color: '#3b8280', border: '1px solid #3b8280', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={handleRefresh}
            >
              <Icon name="refresh" /> Làm mới
            </button>
          </div>
          <div>
            <StatusFilterTabs
              className="tp-search-status-tabs"
              items={[
                { key: 'Tất cả', label: 'Tất cả', count: statusCounts['Tất cả'] },
                { key: 'Chờ bàn giao', label: 'Chờ bàn giao', count: statusCounts['Chờ bàn giao'] },
                { key: 'Đã bàn giao', label: 'Đã bàn giao', count: statusCounts['Đã bàn giao'] }
              ]}
              activeKey={filterStatus}
              onChange={setFilterStatus}
            />
          </div>
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
              {filteredRows.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không có hồ sơ bàn giao ra phù hợp.</td></tr>
              ) : filteredRows.map((row) => (
                <tr key={row.maPhieuTra}>
                  <td style={{ fontWeight: 600, color: '#2f6765' }}>{row.maPhieuTra}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.hoTenKhach}</div>
                    <div style={{ fontSize: 12, color: '#6f797a' }}>Hợp đồng thuê</div>
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
                    <span
                      className="ktp-badge"
                      style={{
                        backgroundColor: row.trangThaiBanGiao === 'Chờ bàn giao' ? '#cce5ff' : '#e5f3eb',
                        color: row.trangThaiBanGiao === 'Chờ bàn giao' ? '#004085' : '#137333',
                        borderColor: row.trangThaiBanGiao === 'Chờ bàn giao' ? '#b8daff' : '#c3e6cb'
                      }}
                    >
                      {row.trangThaiBanGiao}
                    </span>
                  </td>
                  <td className="text-center">
                    {row.trangThaiBanGiao === 'Chờ bàn giao' ? (
                      <button
                        className="ktp-btn-action-fill"
                        onClick={() => openModal(row)}
                      >
                        Bàn giao
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
      {modalOpen && (
        <div className="ktp-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="ktp-modal" style={{ maxWidth: '950px', width: '90%', padding: '0', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header" style={{ padding: '16px 24px', backgroundColor: '#3b8280', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff', fontWeight: '700' }}>Ghi nhận bàn giao ra</h3>
              </div>
              <button className="ktp-modal-close" onClick={() => setModalOpen(false)} style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ padding: '16px 24px', overflowY: 'auto', backgroundColor: '#f8f9fa', flex: 1 }}>
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</div>
              ) : chiTiet ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: 0 }}>
                    {/* Card 1: Khách thuê */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '14px', fontSize: '14px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 10px 0' }}>
                        <Icon name="person" /> Khách hàng
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Họ tên:</span><span style={{ fontWeight: 500 }}>{chiTiet.hoTenKhach}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>SĐT:</span><span style={{ fontWeight: 500 }}>{chiTiet.soDienThoai}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>CCCD:</span><span style={{ fontWeight: 500 }}>{chiTiet.cccdKhach || '—'}</span></div>
                      </div>
                    </div>

                    {/* Card 2: Hợp đồng */}
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '14px', fontSize: '14px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 10px 0' }}>
                        <Icon name="description" /> {chiTiet.hasHopDong ? 'Hợp đồng' : 'Phiếu đặt cọc'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '14px', fontSize: '14px' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00666d', fontSize: '15px', fontWeight: '600', margin: '0 0 10px 0' }}>
                        <Icon name="bed" /> Phòng/Giường
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Khu vực:</span><span style={{ fontWeight: 500 }}>{chiTiet.khuVuc?.replace('HomeDorm ', '') || ''}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Phòng:</span><span style={{ fontWeight: 500 }}>{chiTiet.tenPhong}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Giường:</span><span style={{ fontWeight: 500 }}>{chiTiet.maGiuong ? `G${chiTiet.maGiuong.replace(/giường/i, '').replace('G', '').trim()}` : 'Tất cả'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '14px', margin: 0 }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 8px 0' }}>Ghi nhận bàn giao tài sản</h4>
                      {dsTaiSan.length > 0 ? (
                        <table className="ktp-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ width: '20%', whiteSpace: 'nowrap' }}>Tên tài sản</th>
                              <th className="text-center" style={{ width: '8%', whiteSpace: 'nowrap' }}>Đã giao</th>
                              <th className="text-center" style={{ width: '8%', whiteSpace: 'nowrap' }}>Thu hồi</th>
                              <th style={{ width: '64%' }}>Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dsTaiSan.map((ts, idx) => (
                              <tr key={ts.maTaiSan}>
                                <td>{ts.tenTaiSan}</td>
                                <td className="text-center">{ts.soLuongBanGiaoVao}</td>
                                <td className="text-center">
                                  <input
                                    type="number"
                                    className="ktp-input no-spin"
                                    style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                                    min="0"
                                    max={ts.soLuongBanGiaoVao}
                                    value={ts.soLuongThuHoi}
                                    onChange={(e) => handleTaiSanChange(idx, 'soLuongThuHoi', e.target.value)}
                                    disabled={selectedPhieu?.trangThaiBanGiao !== 'Chờ bàn giao'}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="ktp-input"
                                    style={{ width: '100%', padding: '4px 8px' }}
                                    // placeholder="Ghi chú (Tốt, Mất...)"
                                    value={ts.ghiChu}
                                    title={ts.ghiChu}
                                    onChange={(e) => handleTaiSanChange(idx, 'ghiChu', e.target.value)}
                                    disabled={selectedPhieu?.trangThaiBanGiao !== 'Chờ bàn giao'}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ color: '#6f797a', fontStyle: 'italic', padding: '10px 0' }}>Không có tài sản bàn giao trước đó.</div>
                      )}
                  </div>

                  <div style={{ margin: 0 }}>
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e1e3e4', borderRadius: '8px', padding: '14px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', margin: '0 0 8px 0' }}>Thành viên hợp đồng</h4>
                      {dsThanhVien.length > 0 ? (
                        <table className="ktp-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th className="text-center" style={{ width: '7%', whiteSpace: 'nowrap' }}>STT</th>
                              <th style={{ width: '28%' }}>Họ tên</th>
                              <th style={{ width: '12%', whiteSpace: 'nowrap' }}>Giới tính</th>
                              <th style={{ width: '18%', whiteSpace: 'nowrap' }}>SĐT</th>
                              <th style={{ width: '17%', whiteSpace: 'nowrap' }}>Ngày sinh</th>
                              <th style={{ width: '18%', whiteSpace: 'nowrap' }}>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dsThanhVien.map((tv, idx) => (
                              <tr key={tv.maThanhVien || idx}>
                                <td className="text-center">{idx + 1}</td>
                                <td style={{ fontWeight: 600 }}>{tv.hoTen || '—'}</td>
                                <td>{tv.gioiTinh || '—'}</td>
                                <td>{tv.sdt || '—'}</td>
                                <td>{fmtDate(tv.ngaySinh) || '—'}</td>
                                <td>
                                  <span style={{ color: tv.trangThai === 'Đã rời' ? '#137333' : '#856404', fontWeight: 700 }}>
                                    {tv.trangThai || '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ color: '#6f797a', fontStyle: 'italic' }}>Không có thành viên hợp đồng.</div>
                      )}
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e1e3e4', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="chkXacNhanRoi"
                          checked={xacNhanRoi}
                          onChange={(e) => setXacNhanRoi(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: selectedPhieu?.trangThaiBanGiao !== 'Chờ bàn giao' ? 'not-allowed' : 'pointer' }}
                          disabled={selectedPhieu?.trangThaiBanGiao !== 'Chờ bàn giao'}
                        />
                        <label htmlFor="chkXacNhanRoi" style={{ fontWeight: 600, color: '#191c1d', cursor: selectedPhieu?.trangThaiBanGiao !== 'Chờ bàn giao' ? 'not-allowed' : 'pointer', fontSize: '15px' }}>
                          Xác nhận khách hàng đã kết thúc lưu trú.
                        </label>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div style={{ backgroundColor: '#fce8e6', color: '#c5221f', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
                      {errorMsg}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="ktp-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e1e3e4', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setModalOpen(false)} style={{ backgroundColor: '#ffffff', border: '1px solid #004c52', color: '#004c52', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                {!isSubmitted && selectedPhieu?.trangThaiBanGiao === 'Chờ bàn giao' && (
                  <button className="ktp-btn-action-fill" onClick={submitXacNhan} style={{ padding: '10px 24px', opacity: (chiTiet?.hasHopDong && !xacNhanRoi) ? 0.6 : 1, cursor: (chiTiet?.hasHopDong && !xacNhanRoi) ? 'not-allowed' : 'pointer' }}>
                    Lập biên bản bàn giao ra
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
              Ghi nhận bàn giao ra thành công.
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
