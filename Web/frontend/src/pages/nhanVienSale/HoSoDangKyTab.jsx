import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { dangKyThueApi } from '../dangKyThue/dangKyThue.api.js';

export default function HoSoDangKyTab({ onNavigate }) {
  const [filterStatus, setFilterStatus] = useState('Chờ tiếp nhận');
  const [list, setList] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [acceptedReg, setAcceptedReg] = useState(null);

  // Drawer States
  const [checkingRooms, setCheckingRooms] = useState(false);
  const [roomResults, setRoomResults] = useState(null);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showTuVanModal, setShowTuVanModal] = useState(false);
  const [tuVanNote, setTuVanNote] = useState('');
  // Modal States
  const [mismatchReason, setMismatchReason] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Không còn phòng/giường phù hợp');
  const [rejectNote, setRejectNote] = useState('');
  const [createStep, setCreateStep] = useState(1);
  const [createForm, setCreateForm] = useState({
    hoTen: '', ngaySinh: '', gioiTinh: 'Nam', quocTich: 'Việt Nam', cccd: '', sdt: '', email: '', diaChi: '',
    soNguoi: 1, gioiTinhO: 'Nam', hinhThuc: 'Ghép giường', khuVuc: '', loaiPhong: '', mucGia: '',
    ngayVao: '', thoiHan: '', yeuCau: ''
  });
  const [createErrors, setCreateErrors] = useState({});
  const [createChecking, setCreateChecking] = useState(false);
  const [createRoomResults, setCreateRoomResults] = useState(null);

  const stats = {
    choTiepNhan: list.filter(x => x.trangThai === 'Chờ tiếp nhận').length,
    daTiepNhan: list.filter(x => x.trangThai === 'Đã tiếp nhận' || x.trangThai === 'Chấp nhận').length,
    tuChoi: list.filter(x => x.trangThai === 'Từ chối').length
  };
  const filteredList = filterStatus === 'Tất cả' 
    ? list 
    : list.filter(item => {
        if (filterStatus === 'Đã tiếp nhận') return item.trangThai === 'Đã tiếp nhận' || item.trangThai === 'Chấp nhận';
        return item.trangThai === filterStatus;
      });

  const fetchData = async () => {
    try {
      const res = await dangKyThueApi.getAll();
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleAccept = async () => {
    if (!selectedReg) return;
    try {
      await dangKyThueApi.capNhatKetQuaXuLy(selectedReg.maDangKy, { trangThai: 'Đã tiếp nhận', ghiChuXuLy: '' });
      setAcceptedReg(selectedReg);
      // NOTE: Here you would normally store selectedRooms into ChiTietXemPhong. For now we pass them to the next step.
      setSelectedReg(null);
      setRoomResults(null);
      setSelectedRooms([]);
      fetchData();
    } catch (err) {
      alert('Lỗi khi tiếp nhận hồ sơ: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTuVan = async () => {
    if (!selectedReg) return;
    try {
      await dangKyThueApi.capNhatKetQuaXuLy(selectedReg.maDangKy, { trangThai: 'Đã tiếp nhận', ghiChuXuLy: tuVanNote });
      alert('Đã chuyển hồ sơ sang trạng thái Đã tiếp nhận để tư vấn lại.');
      setShowTuVanModal(false);
      setSelectedReg(null);
      setRoomResults(null);
      setSelectedRooms([]);
      fetchData();
    } catch (err) {
      alert('Lỗi khi tiếp nhận hồ sơ: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async () => {
    if (!selectedReg) return;
    try {
      let finalNote = rejectReason;
      if (rejectReason === 'Khác') {
          finalNote = rejectNote;
      } else if (rejectNote) {
          finalNote += ' - ' + rejectNote;
      }
      await dangKyThueApi.capNhatKetQuaXuLy(selectedReg.maDangKy, { trangThai: 'Từ chối', ghiChuXuLy: finalNote });
      alert('Đã từ chối phiếu đăng ký.');
      setShowRejectModal(false);
      setSelectedReg(null);
      setRoomResults(null);
      setSelectedRooms([]);
      setMismatchReason(null);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };


  const handleCheckRoom = async () => {
    setCheckingRooms(true);
    setRoomResults(null);
    setSelectedRooms([]);
    try {
      const res = await dangKyThueApi.getPhongGiuongKhaDung({
        hoSoId: selectedReg.maDangKy
      });
      let currentList = res.data || [];
      
      // Group beds by room
      const roomMap = {};
      currentList.forEach(r => {
        if (!roomMap[r.maPhong]) {
          roomMap[r.maPhong] = {
            maPhong: r.maPhong,
            tenPhong: r.tenPhong,
            loaiThue: r.loaiThue,
            loaiPhong: r.loaiPhong,
            giaThue: r.giaThue,
            gioiTinhChoPhep: r.gioiTinhChoPhep,
            tenChiNhanh: r.tenChiNhanh,
            soGiuongTrong: 0,
            danhSachGiuong: []
          };
        }
        if (r.maGiuong) {
          roomMap[r.maPhong].soGiuongTrong += 1;
          roomMap[r.maPhong].danhSachGiuong.push(r.maGiuong);
        } else {
          roomMap[r.maPhong].soGiuongTrong = r.sucChua;
        }
      });
      
      const groupedRooms = Object.values(roomMap);
      
      setCheckingRooms(false);
      setRoomResults(groupedRooms);
    } catch (err) {
      setCheckingRooms(false);
      setRoomResults([]);
    }
  };

  const validateStep1 = () => {
    const err = {};
    if (!createForm.hoTen) err.hoTen = 'Vui lòng nhập họ tên.';
    if (!createForm.sdt || createForm.sdt.length < 10) err.sdt = 'Vui lòng nhập số điện thoại hợp lệ.';
    if (!createForm.cccd || createForm.cccd.length !== 12) err.cccd = 'CCCD phải gồm 12 chữ số.';
    setCreateErrors(err);
    return Object.keys(err).length === 0;
  };

  const nextStep = () => {
    const errors = {};
    if (!createForm.hoTen) errors.hoTen = 'Vui lòng nhập họ tên';
    if (!createForm.sdt) errors.sdt = 'Vui lòng nhập SĐT';
    if (!createForm.cccd) errors.cccd = 'Vui lòng nhập CCCD';
    
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }
    setCreateErrors({});
    setCreateStep(2);
  };

  const handleCreateCheckRoom = () => {
    setCreateChecking(true);
    setCreateRoomResults(null);
    setTimeout(() => {
      setCreateChecking(false);
      setCreateRoomResults([{ id: 'P101', bed: 'G03', gender: 'Nữ', price: '1.800.000đ' }]);
    }, 1200);
  };

  const handleSaveCreate = async () => {
    try {
      await dangKyThueApi.taoHoSoKhachVangLai(createForm);
      setAcceptedReg({
        id: 'Hồ sơ mới',
        customerName: createForm.hoTen || 'Khách vãng lai'
      });
      setShowCreateModal(false);
      setCreateStep(1);
      setCreateForm({
        hoTen: '', ngaySinh: '', gioiTinh: 'Nam', quocTich: 'Việt Nam', cccd: '', sdt: '', email: '', diaChi: '',
        soNguoi: 1, gioiTinhO: 'Nam', hinhThuc: 'Ghép giường', khuVuc: '', loaiPhong: '', mucGia: '',
        ngayVao: '', thoiHan: '', yeuCau: ''
      });
      setCreateRoomResults(null);
      fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="ktp-container">
      {/* HEADER TABS & STATS */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'Chờ tiếp nhận', label: `Chờ tiếp nhận (${stats.choTiepNhan})` },
            { id: 'Đã tiếp nhận', label: `Đã tiếp nhận (${stats.daTiepNhan})` },
            { id: 'Từ chối', label: `Từ chối (${stats.tuChoi})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: filterStatus === tab.id ? '#2f6765' : '#edeeef',
                color: filterStatus === tab.id ? '#fff' : '#3f494a'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <button className="ktp-btn-action-fill" style={{ backgroundColor: '#2f6765', borderRadius: '6px', whiteSpace: 'nowrap' }} onClick={() => setShowCreateModal(true)}>
          <Icon name="add_circle" /> Tạo phiếu mới cho khách vãng lai
        </button>
      </section>

      {/* TABLE */}
      <section className="ktp-table-section">
        {filteredList.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ color: '#bec8c9', marginBottom: '16px' }}><Icon name="description" /></div>
            <h3 style={{ color: '#3f494a', marginBottom: '8px' }}>Không có phiếu đăng ký</h3>
            <p style={{ color: '#6f797a' }}>Hiện tại chưa có phiếu đăng ký nào ở trạng thái {filterStatus}.</p>
          </div>
        ) : (
          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Yêu cầu thuê</th>
                <th>Khu vực / Loại phòng</th>
                <th>Ngày gửi</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(item => (
                <tr key={item.maDangKy}>
                  <td style={{ fontWeight: '600' }}>{item.maDangKy}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#191c1d' }}>{item.hoTenKhach}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.sdtKhach}</div>
                  </td>
                  <td>
                    <div style={{ color: '#191c1d' }}>{item.gioiTinh || 'Không xác định'}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.soNguoiO} người</div>
                  </td>
                  <td>
                    <div style={{ color: '#191c1d' }}>{item.khuVucMongMuon}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.loaiPhongYeuCau}</div>
                  </td>
                  <td>{item.ngayDangKy ? new Date(item.ngayDangKy).toLocaleDateString('en-GB') : ''}</td>
                  <td className="text-center">
                    <span className={`ktp-badge ${item.trangThai === 'Chờ tiếp nhận' ? 'ktp-badge-warning' : ((item.trangThai === 'Đã tiếp nhận' || item.trangThai === 'Chấp nhận') ? 'ktp-badge-success' : (item.trangThai === 'Từ chối' ? 'ktp-badge-danger' : 'ktp-badge-info'))}`} style={{ backgroundColor: (item.trangThai === 'Đã tiếp nhận' || item.trangThai === 'Chấp nhận') ? '#e8f5e9' : (item.trangThai === 'Từ chối' ? '#ffebee' : undefined), color: (item.trangThai === 'Đã tiếp nhận' || item.trangThai === 'Chấp nhận') ? '#2e7d32' : (item.trangThai === 'Từ chối' ? '#c62828' : undefined) }}>{item.trangThai}</span>
                  </td>
                  <td className="text-center">
                    <button className="ktp-btn-action-fill" onClick={() => setSelectedReg(item)}>Xem & xử lý</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* MODAL CHI TIẾT */}
      {selectedReg && (
        <div className="ktp-modal-overlay" onClick={() => { setSelectedReg(null); setRoomResults(null); }}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'flex-start', borderBottom: '1px solid #bec8c9', backgroundColor: '#f4f6f6' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#191c1d' }}>Phiếu đăng ký {selectedReg.maDangKy}</h3>
                <p className="ktp-modal-header-sub">Ngày gửi: <span>{selectedReg.ngayDangKy ? new Date(selectedReg.ngayDangKy).toLocaleDateString('en-GB') : ''}</span></p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="ktp-badge-warning">{selectedReg.trangThai}</div>
                <button className="ktp-modal-close" onClick={() => { setSelectedReg(null); setRoomResults(null); }}><Icon name="close" /></button>
              </div>
            </div>

            <div className="ktp-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f4f6f6' }}>
              {/* Khối 1 */}
              <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#fff', marginBottom: '16px' }}>
                <h4 className="ktp-section-title"><Icon name="person" /> Khối 1: Thông tin khách hàng</h4>
                <div className="ktp-grid-2" style={{ gap: '16px' }}>
                  <div className="ktp-info-row"><span className="ktp-info-label">Họ tên:</span> <span className="ktp-info-value">{selectedReg.hoTenKhach}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Ngày sinh:</span> <span className="ktp-info-value">{selectedReg.ngaySinhKhach ? new Date(selectedReg.ngaySinhKhach).toLocaleDateString('en-GB') : ''}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Giới tính:</span> <span className="ktp-info-value">{selectedReg.gioiTinh}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Quốc tịch:</span> <span className="ktp-info-value">{selectedReg.quocTichKhach || selectedReg.quocTich}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">CCCD:</span> <span className="ktp-info-value">{selectedReg.cccdKhach || selectedReg.cccd}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">SĐT:</span> <span className="ktp-info-value">{selectedReg.sdtKhach}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Email:</span> <span className="ktp-info-value">{selectedReg.emailKhach}</span></div>
                  <div className="ktp-info-row" style={{ gridColumn: '1 / -1' }}><span className="ktp-info-label">Địa chỉ:</span> <span className="ktp-info-value">{selectedReg.diaChiKhach}</span></div>
                </div>
              </div>

              {/* Khối 2 */}
              <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#fff', marginBottom: '16px' }}>
                <h4 className="ktp-section-title"><Icon name="description" /> Khối 2: Thông tin nhu cầu thuê</h4>
                <div className="ktp-grid-2" style={{ gap: '16px' }}>
                  <div className="ktp-info-row"><span className="ktp-info-label">Số người ở:</span> <span className="ktp-info-value">{selectedReg.soNguoiO} người</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Giới tính:</span> <span className="ktp-info-value">{selectedReg.gioiTinh}</span></div>

                  <div className="ktp-info-row"><span className="ktp-info-label">Khu vực:</span> <span className="ktp-info-value ktp-text-primary">{selectedReg.khuVucMongMuon}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Loại phòng:</span> <span className="ktp-info-value">{selectedReg.loaiPhongYeuCau}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Mức giá:</span> <span className="ktp-info-value ktp-text-primary">{selectedReg.mucGia ? selectedReg.mucGia.toLocaleString('vi-VN') + 'đ' : ''}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">TG vào ở:</span> <span className="ktp-info-value">{selectedReg.ngayDuKienVaoO ? new Date(selectedReg.ngayDuKienVaoO).toLocaleDateString('en-GB') : ''}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Thời hạn:</span> <span className="ktp-info-value">{selectedReg.thoiHanThue} tháng</span></div>
                  <div className="ktp-info-row" style={{ gridColumn: '1 / -1' }}><span className="ktp-info-label">Yêu cầu khác:</span> <span className="ktp-info-value" style={{ fontStyle: 'italic' }}>{selectedReg.ghiChu || 'Không có'}</span></div>
                </div>
              </div>

              {/* Khối 3 */}
              <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#fff' }}>
                <h4 className="ktp-section-title"><Icon name="search" /> Khối 3: Đối chiếu & Kiểm tra phòng/giường</h4>
                
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eef2f2', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#3f494a', fontSize: '13px' }}>Tiêu chí từ phiếu đăng ký:</p>
                  <div className="ktp-grid-2" style={{ fontSize: '13px', color: '#6f797a', gap: '8px' }}>
                    <div>• Chi nhánh/khu vực mong muốn: <strong style={{ color: '#191c1d' }}>{selectedReg.khuVucMongMuon}</strong></div>
                    <div>• Giới tính khách hàng: <strong style={{ color: '#191c1d' }}>{selectedReg.gioiTinh}</strong></div>
                    <div>• Số người dự kiến ở: <strong style={{ color: '#191c1d' }}>{selectedReg.soNguoiO} người</strong></div>
                    <div>• Loại phòng mong muốn: <strong style={{ color: '#191c1d' }}>{selectedReg.loaiPhongYeuCau}</strong></div>
                    <div>• Mức giá tối đa/người/tháng: <strong style={{ color: '#191c1d' }}>{selectedReg.mucGia ? selectedReg.mucGia.toLocaleString('vi-VN') + 'đ' : ''}</strong></div>
                    <div>• Yêu cầu khác nếu có: <strong style={{ color: '#191c1d' }}>{selectedReg.ghiChu || 'Không có'}</strong></div>
                  </div>
                </div>

                {!checkingRooms && !roomResults && (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <button className="ktp-btn-action-fill" onClick={handleCheckRoom}>Hệ thống tự động tìm phòng/giường phù hợp</button>
                  </div>
                )}

                {checkingRooms && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6f797a' }}>
                    <div className="ktp-spinner" style={{ marginBottom: '12px' }}></div>
                    <p>Hệ thống đang đối chiếu các điều kiện cho thuê...</p>
                  </div>
                )}

                {roomResults && roomResults.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div className="ktp-badge-success" style={{ marginBottom: '12px', display: 'inline-block' }}>Tìm thấy phòng/giường phù hợp với nhu cầu đăng ký.</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {roomResults.map((r, i) => (
                        <label key={i} className="ktp-detail-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #4caf50', cursor: 'pointer', border: selectedRooms.includes(r.maPhong) ? '2px solid #4caf50' : '1px solid #bec8c9', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedRooms.includes(r.maPhong)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedRooms([...selectedRooms, r.maPhong]);
                                else setSelectedRooms(selectedRooms.filter(id => id !== r.maPhong));
                              }}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <div>
                              <strong style={{ fontSize: '16px' }}>{r.maPhong} - {r.tenChiNhanh}</strong>
                              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#3f494a' }}>
                                Loại phòng: {r.loaiPhong} | Giới tính cho phép: {r.gioiTinhChoPhep} | Số giường trống: {r.soGiuongTrong}
                              </p>
                              {r.danhSachGiuong && r.danhSachGiuong.length > 0 && (
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6f797a' }}>
                                  Danh sách giường trống: {r.danhSachGiuong.join(', ')}
                                </p>
                              )}
                              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#4caf50', fontWeight: '600' }}>Trạng thái: Có thể sắp lịch xem</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong className="ktp-text-primary" style={{ fontSize: '16px' }}>{r.giaThue ? r.giaThue.toLocaleString('vi-VN') + 'đ' : ''}</strong>
                            <div style={{ fontSize: '12px', color: '#6f797a', marginTop: '2px' }}>{r.loaiThue === 'Nguyên căn' ? 'Giá thuê nguyên phòng' : 'Giá thuê theo giường'}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {roomResults && roomResults.length === 0 && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', borderLeft: '4px solid #ff9800' }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Chưa tìm thấy phòng/giường phù hợp tại thời điểm hiện tại.</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                      Không có phòng/giường còn trống, chưa đặt cọc và đồng thời thỏa các tiêu chí về chi nhánh, giới tính, loại phòng, số người ở và mức giá.
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontStyle: 'italic' }}>
                      Nhân viên sale có thể tiếp nhận phiếu để liên hệ tư vấn lại với khách hàng, hoặc từ chối phiếu nếu không thể đáp ứng nhu cầu.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #bec8c9', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ktp-btn-cancel" style={{ backgroundColor: '#f4f6f6' }} onClick={() => { setSelectedReg(null); setRoomResults(null); }}>Hủy</button>
              
              {roomResults && roomResults.length === 0 ? (
                <>
                  <button className="ktp-btn-cancel" style={{ color: '#c62828', borderColor: '#ffcdd2', backgroundColor: '#ffebee' }} onClick={() => {
                    setRejectNote('');
                    setShowRejectModal(true);
                  }}>Từ chối phiếu</button>
                  <button 
                    className="ktp-btn-submit" 
                    onClick={() => setShowTuVanModal(true)}
                  >
                    Tiếp nhận để tư vấn lại
                  </button>
                </>
              ) : (
                <>
                  <button className="ktp-btn-cancel" style={{ color: '#c62828', borderColor: '#ffcdd2', backgroundColor: '#ffebee' }} onClick={() => {
                    setRejectNote('');
                    setShowRejectModal(true);
                  }}>Từ chối phiếu</button>
                  <button 
                    className="ktp-btn-submit" 
                    disabled={!roomResults || selectedRooms.length === 0}
                    style={{ opacity: (!roomResults || selectedRooms.length === 0) ? 0.5 : 1 }}
                    onClick={handleAccept}
                  >
                    Tiếp nhận & lập lịch xem phòng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TU VAN MODAL */}
      {showTuVanModal && (
        <div className="ktp-modal-overlay" onClick={() => setShowTuVanModal(false)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', borderBottom: '1px solid #bec8c9', backgroundColor: '#f4f6f6' }}>
              <h3 style={{ fontSize: '16px', margin: 0, color: '#191c1d' }}>Tiếp nhận để tư vấn lại</h3>
              <button className="ktp-modal-close" onClick={() => setShowTuVanModal(false)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', flex: 'none', display: 'block' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#3f494a' }}>Vui lòng nhập ghi chú sale để liên hệ tư vấn lại với khách hàng (Ví dụ: Chưa có phòng phù hợp, cần liên hệ khách tư vấn đổi loại phòng/khu vực/mức giá.)</p>
              <textarea 
                placeholder="Nhập ghi chú sale..." 
                value={tuVanNote} 
                onChange={e => setTuVanNote(e.target.value)} 
                style={{ width: '100%', height: '80px', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '4px', fontSize: '14px', outline: 'none', resize: 'vertical' }} 
                autoFocus 
              />
            </div>
            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #bec8c9', padding: '16px 24px', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ktp-btn-cancel" style={{ backgroundColor: '#f4f6f6' }} onClick={() => setShowTuVanModal(false)}>Hủy</button>
              <button className="ktp-btn-submit" onClick={handleTuVan}>Xác nhận tiếp nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="ktp-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ width: '400px', maxWidth: '90vw' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', borderBottom: '1px solid #bec8c9', backgroundColor: '#f4f6f6' }}>
              <h3 style={{ fontSize: '16px', margin: 0, color: '#191c1d' }}>Xác nhận từ chối phiếu?</h3>
              <button className="ktp-modal-close" onClick={() => setShowRejectModal(false)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', flex: 'none', display: 'block' }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', fontSize: '14px', color: '#3f494a' }}>Lý do từ chối <span style={{ color: '#d32f2f' }}>*</span></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Không còn phòng/giường phù hợp', 'Không liên lạc được khách', 'Thông tin không hợp lệ', 'Khách hủy yêu cầu', 'Khác'].map(reason => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#191c1d' }}>
                    <input type="radio" name="rejectReason" value={reason} checked={rejectReason === reason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    {reason}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '12px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#3f494a' }}>Ghi chú thêm cho khách hàng {rejectReason !== 'Khác' && '(Tùy chọn)'}</p>
                <input type="text" placeholder="Ghi chú chi tiết hoặc gợi ý chỉnh sửa..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #bec8c9', borderRadius: '4px', fontSize: '14px', outline: 'none' }} autoFocus={rejectReason === 'Khác'} />
              </div>
            </div>
            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #bec8c9', padding: '16px 24px', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="ktp-btn-cancel" style={{ backgroundColor: '#f4f6f6' }} onClick={() => setShowRejectModal(false)}>Hủy</button>
              <button className="ktp-btn-submit" style={{ backgroundColor: '#c62828' }} onClick={handleReject} disabled={rejectReason === 'Khác' && !rejectNote.trim()}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {acceptedReg && (
        <div className="ktp-modal-overlay" onClick={() => setAcceptedReg(null)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ width: '400px', maxWidth: '90vw' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#2f6765', color: '#ffffff' }}>
              <h3 style={{ fontSize: '18px', margin: 0, color: '#ffffff' }}>Tiếp nhận thành công</h3>
              <button className="ktp-modal-close" onClick={() => setAcceptedReg(null)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '24px', textAlign: 'center', flex: 'none', display: 'block' }}>
              <div style={{ color: '#2f6765', fontSize: '48px', marginBottom: '16px' }}>
                <Icon name="check_circle" />
              </div>
              <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#191c1d', fontSize: '16px' }}>
                Phiếu đăng ký {acceptedReg.id} đã được tiếp nhận.
              </p>
              <p style={{ margin: 0, color: '#6f797a', fontSize: '14px' }}>
                Khách hàng: {acceptedReg.customerName}
              </p>
            </div>
            <div className="ktp-modal-footer" style={{ justifyContent: 'center', gap: '16px' }}>
              <button className="ktp-btn-cancel" onClick={() => setAcceptedReg(null)}>Đóng</button>
              <button className="ktp-btn-submit" onClick={() => {
                setAcceptedReg(null);
                if (onNavigate) onNavigate('lich-xem');
              }}>Lập lịch tiếp</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO PHIẾU KHÁCH VÃNG LAI */}
      {showCreateModal && (
        <div className="ktp-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ktp-modal" onClick={(e) => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw' }}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#2f6765', color: '#ffffff' }}>
              <h3 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>Tạo phiếu mới cho khách vãng lai</h3>
              <button className="ktp-modal-close" onClick={() => setShowCreateModal(false)} style={{ color: '#ffffff' }}><Icon name="close" /></button>
            </div>
            
            <div className="ktp-modal-body" style={{ padding: '24px', flex: 'none', display: 'block' }}>
              {/* Stepper */}
              <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '2px solid #e9ecef', paddingBottom: '16px' }}>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: createStep === 1 ? 'bold' : 'normal', color: createStep === 1 ? '#2f6765' : '#6f797a' }}>
                  1. Thông tin khách hàng
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: createStep === 2 ? 'bold' : 'normal', color: createStep === 2 ? '#2f6765' : '#6f797a' }}>
                  2. Nhu cầu thuê
                </div>
              </div>

              {createStep === 1 && (
                <div className="ktp-grid-2" style={{ gap: '20px' }}>
                  <div>
                    <label className="ktp-filter-label">Họ tên *</label>
                    <input className="ktp-input" type="text" value={createForm.hoTen} onChange={e => setCreateForm({...createForm, hoTen: e.target.value})} />
                    {createErrors.hoTen && <span className="ktp-text-error" style={{ fontSize: '12px' }}>{createErrors.hoTen}</span>}
                  </div>
                  <div>
                    <label className="ktp-filter-label">SĐT *</label>
                    <input className="ktp-input" type="text" value={createForm.sdt} onChange={e => setCreateForm({...createForm, sdt: e.target.value})} />
                    {createErrors.sdt && <span className="ktp-text-error" style={{ fontSize: '12px' }}>{createErrors.sdt}</span>}
                  </div>
                  <div>
                    <label className="ktp-filter-label">CCCD *</label>
                    <input className="ktp-input" type="text" value={createForm.cccd} onChange={e => setCreateForm({...createForm, cccd: e.target.value})} />
                    {createErrors.cccd && <span className="ktp-text-error" style={{ fontSize: '12px' }}>{createErrors.cccd}</span>}
                  </div>
                  <div>
                    <label className="ktp-filter-label">Ngày sinh</label>
                    <input className="ktp-input" type="date" value={createForm.ngaySinh} onChange={e => setCreateForm({...createForm, ngaySinh: e.target.value})} />
                  </div>
                  <div>
                    <label className="ktp-filter-label">Giới tính</label>
                    <select className="ktp-input" value={createForm.gioiTinh} onChange={e => setCreateForm({...createForm, gioiTinh: e.target.value})}>
                      <option>Nam</option><option>Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="ktp-filter-label">Quốc tịch</label>
                    <input className="ktp-input" type="text" value={createForm.quocTich} onChange={e => setCreateForm({...createForm, quocTich: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="ktp-filter-label">Địa chỉ</label>
                    <input className="ktp-input" type="text" value={createForm.diaChi} onChange={e => setCreateForm({...createForm, diaChi: e.target.value})} />
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="ktp-grid-2" style={{ gap: '20px' }}>
                  <div>
                    <label className="ktp-filter-label">Giới tính thuê</label>
                    <select className="ktp-input" value={createForm.gioiTinhO} onChange={e => setCreateForm({...createForm, gioiTinhO: e.target.value})}>
                      <option>Nam</option><option>Nữ</option><option>Không xác định</option>
                    </select>
                  </div>
                  <div>
                    <label className="ktp-filter-label">Số người ở</label>
                    <input className="ktp-input" type="number" min="1" value={createForm.soNguoi} onChange={e => setCreateForm({...createForm, soNguoi: e.target.value})} />
                  </div>
                  <div>
                    <label className="ktp-filter-label">Khu vực</label>
                    <select className="ktp-input" value={createForm.khuVuc} onChange={e => setCreateForm({...createForm, khuVuc: e.target.value})}>
                      <option value="">-- Chọn khu vực --</option>
                      <option value="Thủ Đức">Thủ Đức</option>
                      <option value="Bình Thạnh">Bình Thạnh</option>
                    </select>
                  </div>
                  <div>
                    <label className="ktp-filter-label">Loại phòng</label>
                    <input className="ktp-input" type="text" value={createForm.loaiPhong} onChange={e => setCreateForm({...createForm, loaiPhong: e.target.value})} />
                  </div>
                  <div>
                    <label className="ktp-filter-label">Mức giá mong muốn</label>
                    <input className="ktp-input" type="text" value={createForm.mucGia} onChange={e => setCreateForm({...createForm, mucGia: e.target.value})} />
                  </div>
                  <div>
                    <label className="ktp-filter-label">Thời hạn</label>
                    <input className="ktp-input" type="text" value={createForm.thoiHan} onChange={e => setCreateForm({...createForm, thoiHan: e.target.value})} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="ktp-filter-label">Yêu cầu khác</label>
                    <textarea className="ktp-textarea" rows="2" value={createForm.yeuCau} onChange={e => setCreateForm({...createForm, yeuCau: e.target.value})}></textarea>
                  </div>

                  <div style={{ gridColumn: '1 / -1', marginTop: '16px', borderTop: '1px solid #e9ecef', paddingTop: '16px' }}>
                    <button className="ktp-btn-action-fill" onClick={handleCreateCheckRoom}>Kiểm tra phòng/giường phù hợp</button>
                    {createChecking && <span style={{ marginLeft: '12px', color: '#6f797a' }}>Đang tra cứu...</span>}
                    {createRoomResults && (
                      <div style={{ marginTop: '12px' }}>
                        <strong className="ktp-text-success">Tìm thấy {createRoomResults.length} kết quả:</strong>
                        <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: '#3f494a' }}>
                          {createRoomResults.map((r, i) => (
                            <li key={i}>{r.id} - {r.bed} - {r.price}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ktp-modal-footer">
              {createStep === 1 ? (
                <>
                  <button className="ktp-btn-cancel" onClick={() => setShowCreateModal(false)}>Hủy</button>
                  <button className="ktp-btn-submit" onClick={nextStep}>Tiếp tục</button>
                </>
              ) : (
                <>
                  <button className="ktp-btn-cancel" onClick={() => setCreateStep(1)}>Quay lại</button>
                  <button className="ktp-btn-submit" onClick={handleSaveCreate}>Lưu đơn đăng ký</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Styles inline for animations and spinner if missing */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .ktp-spinner {
          width: 30px; height: 30px;
          border: 3px solid rgba(47,103,101,0.2);
          border-top-color: #2f6765;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
