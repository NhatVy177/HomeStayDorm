import React, { useState, useMemo } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

const mockRegistrations = [
  {
    id: 'HS-2024-001',
    time: '14/06/2026',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    customerDOB: '1998-05-12',
    customerGender: 'Nam',
    customerNationality: 'Việt Nam',
    customerCCCD: '079098012345',
    customerEmail: 'nguyenvanan@gmail.com',
    customerAddress: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    demandType: 'Ghép giường',
    demandGender: 'Nam',
    demandCount: 1,
    demandArea: 'Thủ Đức',
    demandRoomType: 'Phòng 4 người',
    demandPrice: '2.000.000đ',
    demandMoveInDate: '01/07/2026',
    demandDuration: '6 tháng',
    demandNote: 'Cần gần trạm xe buýt',
    status: 'Chờ tiếp nhận'
  },
  {
    id: 'HS-2024-002',
    time: '15/06/2026',
    customerName: 'Trần Minh Hoàng',
    customerPhone: '0987654321',
    customerDOB: '2000-08-22',
    customerGender: 'Nam',
    customerNationality: 'Việt Nam',
    customerCCCD: '079000111222',
    customerEmail: 'hoangtm@gmail.com',
    customerAddress: '456 Lê Lợi, Quận 1, TP.HCM',
    demandType: 'Nguyên phòng',
    demandGender: 'Nam',
    demandCount: 2,
    demandArea: 'Bình Thạnh',
    demandRoomType: 'Studio',
    demandPrice: '5.500.000đ',
    demandMoveInDate: '10/07/2026',
    demandDuration: '12 tháng',
    demandNote: 'Phòng có ban công',
    status: 'Chờ tiếp nhận'
  },
  {
    id: 'HS-2024-003',
    time: '16/06/2026',
    customerName: 'Trần Thị Thu',
    customerPhone: '0911223344',
    demandType: 'Nguyên phòng',
    demandGender: 'Nữ',
    demandCount: 1,
    demandArea: 'Quận 1',
    demandRoomType: 'Phòng VIP 2 người',
    status: 'Đã tiếp nhận'
  },
  {
    id: 'HS-2024-004',
    time: '12/06/2026',
    customerName: 'Lê Văn Luyện',
    customerPhone: '0900000000',
    demandType: 'Ghép giường',
    demandGender: 'Nam',
    demandCount: 1,
    demandArea: 'Bình Thạnh',
    demandRoomType: 'Phòng 6 người',
    status: 'Từ chối'
  }
];

export default function HoSoDangKyTab({ onNavigate }) {
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [list, setList] = useState(mockRegistrations);
  const [selectedReg, setSelectedReg] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [acceptedReg, setAcceptedReg] = useState(null);

  // Drawer States
  const [checkingRooms, setCheckingRooms] = useState(false);
  const [roomResults, setRoomResults] = useState(null);

  // Modal States
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
    choTiepNhan: list.filter(x => x.status === 'Chờ tiếp nhận').length,
    daTiepNhan: list.filter(x => x.status === 'Đã tiếp nhận').length,
    khongPhuHop: list.filter(x => x.status === 'Không tìm thấy phù hợp').length,
    tuChoi: list.filter(x => x.status === 'Từ chối').length
  };
  const filteredList = filterStatus === 'Tất cả' ? list : list.filter(item => item.status === filterStatus);

  // --- Handlers cho Drawer ---
  const handleCheckRoom = () => {
    setCheckingRooms(true);
    setRoomResults(null);
    setTimeout(() => {
      setCheckingRooms(false);
      if (selectedReg && selectedReg.demandArea === 'Thủ Đức') {
        setRoomResults([
          { id: 'P101', bed: 'G03', gender: 'Nữ', price: '1.800.000đ' },
          { id: 'P203', bed: 'G01', gender: 'Nữ', price: '2.000.000đ' }
        ]);
      } else {
        setRoomResults([]);
      }
    }, 1200);
  };

  const handleAccept = () => {
    setAcceptedReg(selectedReg);
    setList(list.map(x => x.id === selectedReg.id ? { ...x, status: 'Đã tiếp nhận' } : x));
    setSelectedReg(null);
    setRoomResults(null);
  };

  const handleReject = () => {
    alert('Đã từ chối phiếu đăng ký.');
    setList(list.map(x => x.id === selectedReg.id ? { ...x, status: 'Từ chối' } : x));
    setSelectedReg(null);
    setRoomResults(null);
  };

  // --- Handlers cho Modal Tạo phiếu ---
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

  const handleSaveCreate = () => {
    const newReg = {
      id: 'HS-2024-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      customerName: createForm.hoTen || 'Khách vãng lai',
      status: 'Đã tiếp nhận',
      demandType: createForm.hinhThuc,
      demandGender: createForm.gioiTinhO,
      demandCount: createForm.soNguoi,
      demandArea: createForm.khuVuc,
      demandRoomType: createForm.loaiPhong,
      time: new Date().toLocaleDateString('en-GB')
    };
    setList([newReg, ...list]);
    setAcceptedReg(newReg);
    setShowCreateModal(false);
    setCreateStep(1);
    setCreateForm({
      hoTen: '', ngaySinh: '', gioiTinh: 'Nam', quocTich: 'Việt Nam', cccd: '', sdt: '', email: '', diaChi: '',
      soNguoi: 1, gioiTinhO: 'Nam', hinhThuc: 'Ghép giường', khuVuc: '', loaiPhong: '', mucGia: '',
      ngayVao: '', thoiHan: '', yeuCau: ''
    });
    setCreateRoomResults(null);
  };

  return (
    <div className="ktp-container">
      {/* HEADER TABS & STATS */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'Tất cả', label: `Tất cả (${list.length})` },
            { id: 'Chờ tiếp nhận', label: `Chờ tiếp nhận (${stats.choTiepNhan})` },
            { id: 'Đã tiếp nhận', label: `Đã tiếp nhận (${stats.daTiepNhan})` },
            { id: 'Không tìm thấy phù hợp', label: `Không tìm thấy phù hợp (${stats.khongPhuHop})` },
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
                <th>Nhu cầu thuê</th>
                <th>Khu vực / Loại phòng</th>
                <th>Ngày gửi</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '600' }}>{item.id}</td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#191c1d' }}>{item.customerName}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.customerPhone}</div>
                  </td>
                  <td>
                    <div style={{ color: '#191c1d' }}>{item.demandType} · {item.demandGender}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.demandCount} người</div>
                  </td>
                  <td>
                    <div style={{ color: '#191c1d' }}>{item.demandArea}</div>
                    <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.demandRoomType}</div>
                  </td>
                  <td>{item.time}</td>
                  <td className="text-center">
                    <span className={`ktp-badge ${item.status === 'Chờ tiếp nhận' ? 'ktp-badge-warning' : (item.status === 'Đã tiếp nhận' ? 'ktp-badge-success' : (item.status === 'Từ chối' ? 'ktp-badge-danger' : 'ktp-badge-info'))}`} style={{ backgroundColor: item.status === 'Đã tiếp nhận' ? '#e8f5e9' : (item.status === 'Từ chối' ? '#ffebee' : undefined), color: item.status === 'Đã tiếp nhận' ? '#2e7d32' : (item.status === 'Từ chối' ? '#c62828' : undefined) }}>{item.status}</span>
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
                <h3 style={{ margin: '0 0 4px 0', color: '#191c1d' }}>Phiếu đăng ký {selectedReg.id}</h3>
                <p className="ktp-modal-header-sub">Ngày gửi: <span>{selectedReg.time}</span></p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="ktp-badge-warning">{selectedReg.status}</div>
                <button className="ktp-modal-close" onClick={() => { setSelectedReg(null); setRoomResults(null); }}><Icon name="close" /></button>
              </div>
            </div>

            <div className="ktp-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f4f6f6' }}>
              {/* Khối 1 */}
              <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#fff', marginBottom: '16px' }}>
                <h4 className="ktp-section-title"><Icon name="person" /> Khối 1: Thông tin khách hàng</h4>
                <div className="ktp-grid-2" style={{ gap: '16px' }}>
                  <div className="ktp-info-row"><span className="ktp-info-label">Họ tên:</span> <span className="ktp-info-value">{selectedReg.customerName}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Ngày sinh:</span> <span className="ktp-info-value">{selectedReg.customerDOB}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Giới tính:</span> <span className="ktp-info-value">{selectedReg.customerGender}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Quốc tịch:</span> <span className="ktp-info-value">{selectedReg.customerNationality}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">CCCD:</span> <span className="ktp-info-value">{selectedReg.customerCCCD}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">SĐT:</span> <span className="ktp-info-value">{selectedReg.customerPhone}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Email:</span> <span className="ktp-info-value">{selectedReg.customerEmail}</span></div>
                  <div className="ktp-info-row" style={{ gridColumn: '1 / -1' }}><span className="ktp-info-label">Địa chỉ:</span> <span className="ktp-info-value">{selectedReg.customerAddress}</span></div>
                </div>
              </div>

              {/* Khối 2 */}
              <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#fff', marginBottom: '16px' }}>
                <h4 className="ktp-section-title"><Icon name="description" /> Khối 2: Thông tin nhu cầu thuê</h4>
                <div className="ktp-grid-2" style={{ gap: '16px' }}>
                  <div className="ktp-info-row"><span className="ktp-info-label">Số người ở:</span> <span className="ktp-info-value">{selectedReg.demandCount} người</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Giới tính:</span> <span className="ktp-info-value">{selectedReg.demandGender}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Hình thức:</span> <span className="ktp-info-value">{selectedReg.demandType}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Khu vực:</span> <span className="ktp-info-value ktp-text-primary">{selectedReg.demandArea}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Loại phòng:</span> <span className="ktp-info-value">{selectedReg.demandRoomType}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Mức giá:</span> <span className="ktp-info-value ktp-text-primary">{selectedReg.demandPrice}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">TG vào ở:</span> <span className="ktp-info-value">{selectedReg.demandMoveInDate}</span></div>
                  <div className="ktp-info-row"><span className="ktp-info-label">Thời hạn:</span> <span className="ktp-info-value">{selectedReg.demandDuration}</span></div>
                  <div className="ktp-info-row" style={{ gridColumn: '1 / -1' }}><span className="ktp-info-label">Yêu cầu khác:</span> <span className="ktp-info-value" style={{ fontStyle: 'italic' }}>{selectedReg.demandNote || 'Không có'}</span></div>
                </div>
              </div>

              {/* Khối 3 */}
              <div className="ktp-section ktp-info-box-outline" style={{ backgroundColor: '#fff' }}>
                <h4 className="ktp-section-title"><Icon name="search" /> Khối 3: Đối chiếu & Kiểm tra phòng/giường</h4>
                
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#eef2f2', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#3f494a', fontSize: '13px' }}>Tiêu chí đối chiếu tự động:</p>
                  <div className="ktp-grid-2" style={{ fontSize: '13px', color: '#6f797a', gap: '8px' }}>
                    <div>• Khu vực: <strong style={{ color: '#191c1d' }}>{selectedReg.demandArea}</strong></div>
                    <div>• Giới tính: <strong style={{ color: '#191c1d' }}>{selectedReg.demandGender}</strong></div>
                    <div>• Sức chứa: <strong style={{ color: '#191c1d' }}>{selectedReg.demandCount} người</strong></div>
                    <div>• Mức giá: <strong style={{ color: '#191c1d' }}>{selectedReg.demandPrice}</strong></div>
                  </div>
                </div>

                {!checkingRooms && !roomResults && (
                  <div style={{ textAlign: 'center', padding: '10px' }}>
                    <button className="ktp-btn-action-fill" onClick={handleCheckRoom}>Bắt đầu đối chiếu & tìm phòng</button>
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
                    <div className="ktp-badge-success" style={{ marginBottom: '12px', display: 'inline-block' }}>Đạt điều kiện - Tìm thấy {roomResults.length} phòng/giường phù hợp</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {roomResults.map((r, i) => (
                        <div key={i} className="ktp-detail-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #4caf50' }}>
                          <div>
                            <strong style={{ fontSize: '16px' }}>{r.id} - {r.bed}</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6f797a' }}>Đã khớp giới tính ({r.gender}) & khu vực ({selectedReg.demandArea})</p>
                          </div>
                          <strong className="ktp-text-primary">{r.price}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {roomResults && roomResults.length === 0 && (
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', borderLeft: '4px solid #ff9800' }}>
                    <p style={{ margin: 0, fontWeight: '600' }}>Không đạt điều kiện: Không tìm thấy phòng/giường phù hợp với các tiêu chí trên.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #bec8c9', padding: '16px 24px' }}>
              <button className="ktp-btn-cancel" onClick={() => { setSelectedReg(null); setRoomResults(null); }}>Hủy</button>
              {roomResults && roomResults.length === 0 && (
                <button className="ktp-btn-cancel" style={{ color: '#d32f2f', borderColor: '#d32f2f' }} onClick={handleReject}>Từ chối phiếu</button>
              )}
              <button 
                className="ktp-btn-submit" 
                disabled={!roomResults || roomResults.length === 0}
                style={{ opacity: (!roomResults || roomResults.length === 0) ? 0.5 : 1 }}
                onClick={handleAccept}
              >
                Tiếp nhận phiếu đăng ký
              </button>
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
                    <label className="ktp-filter-label">Hình thức thuê</label>
                    <select className="ktp-input" value={createForm.hinhThuc} onChange={e => setCreateForm({...createForm, hinhThuc: e.target.value})}>
                      <option>Ghép giường</option><option>Nguyên phòng</option><option>Nguyên căn</option>
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
