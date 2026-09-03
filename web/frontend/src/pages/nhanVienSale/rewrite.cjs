const fs = require('fs');
const file = 'd:/NAM3/HomeStayDorm/Web/frontend/src/pages/nhanVienSale/NhanVienSalePage.jsx';
let content = fs.readFileSync(file, 'utf8');

const registrationsSectionRegex = /\{activeView === 'registrations' && \([\s\S]*?\)\}\n\n\s*\{activeView === 'schedule' && \(/;

const newRegistrationsSection = `{activeView === 'registrations' && (
            <section className="sale-stack">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                <button className="sale-btn primary" onClick={() => setShowCreateModal(true)} style={{ background: '#16796f', borderRadius: '4px', padding: '10px 16px', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span> Tạo phiếu mới cho khách vãng lai
                </button>
              </div>

              <div className="sale-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <article className="sale-stat" style={{ background: '#fff', border: '1px solid #cce5ff', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ background: '#fff1ed', color: '#e86f51', border: 'none', borderRadius: '50%', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PortalIcon name="list" />
                  </span>
                  <div>
                    <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.4, margin: '0 0 4px 0' }}>Hồ sơ chờ<br/>tiếp nhận</p>
                    <strong style={{ fontSize: '24px', color: '#333' }}>{hosoDangKyList.filter(x => x.status === 'Chờ tiếp nhận').length}</strong>
                  </div>
                </article>
                <article className="sale-stat" style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ background: '#eaf7f5', color: '#2fb7a4', border: 'none', borderRadius: '50%', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PortalIcon name="profile" />
                  </span>
                  <div>
                    <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.4, margin: '0 0 4px 0' }}>Đã tiếp nhận<br/>hôm nay</p>
                    <strong style={{ fontSize: '24px', color: '#333' }}>5</strong>
                  </div>
                </article>
                <article className="sale-stat" style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ background: '#fff6df', color: '#a96b16', border: 'none', borderRadius: '50%', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PortalIcon name="building" />
                  </span>
                  <div>
                    <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.4, margin: '0 0 4px 0' }}>Không tìm thấy<br/>phù hợp</p>
                    <strong style={{ fontSize: '24px', color: '#333' }}>2</strong>
                  </div>
                </article>
                <article className="sale-stat" style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px', alignItems: 'center' }}>
                  <span style={{ background: '#fff1f1', color: '#c9504b', border: 'none', borderRadius: '50%', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PortalIcon name="close" />
                  </span>
                  <div>
                    <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 600, lineHeight: 1.4, margin: '0 0 4px 0' }}>Phiếu bị<br/>từ chối</p>
                    <strong style={{ fontSize: '24px', color: '#333' }}>1</strong>
                  </div>
                </article>
              </div>

              {hosoDangKyList.length === 0 ? (
                <div className="sale-empty-state" style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '8px', border: '1px dashed #cce5ff' }}>
                  <div style={{ color: '#5bc0de', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '48px', height: '48px' }}><PortalIcon name="list" /></div></div>
                  <h3 style={{ color: '#333', marginBottom: '8px' }}>Không có phiếu đăng ký cần tiếp nhận</h3>
                  <p style={{ color: '#7b8794' }}>Hiện tại chưa có phiếu đăng ký thuê phòng nào ở trạng thái Chờ tiếp nhận.</p>
                </div>
              ) : (
                <article className="sale-table-card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden' }}>
                  <div className="sale-table-wrap" style={{ border: '1px dashed #5bc0de', borderBottom: 'none', borderRadius: '8px 8px 0 0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px' }}>Mã phiếu</th>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px' }}>Khách hàng</th>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px' }}>Nhu cầu thuê</th>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px' }}>Khu vực / Loại phòng</th>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px' }}>Ngày gửi</th>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px' }}>Trạng thái</th>
                          <th style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#333', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hosoDangKyList.map((item) => (
                          <tr key={item.id}>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef' }}>
                              <strong style={{ color: '#16796f', fontSize: '14px', display: 'block' }}>{item.id}</strong>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: item.avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                                  {item.initials}
                                </div>
                                <div>
                                  <strong style={{ display: 'block', fontSize: '14px', color: '#333' }}>{item.customerName}</strong>
                                  <span style={{ color: '#7b8794', fontSize: '12px' }}>{item.customerPhone}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef' }}>
                              <span style={{ fontSize: '13px', color: '#333', fontWeight: 600 }}>{item.demandType}</span>
                              <div style={{ fontSize: '12px', color: '#7b8794' }}>{item.demandGender} · {item.demandCount} người</div>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef' }}>
                              <span style={{ fontSize: '13px', color: '#333', fontWeight: 600 }}>{item.demandArea}</span>
                              <div style={{ fontSize: '12px', color: '#7b8794' }}>{item.demandRoomType}</div>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', color: '#555', fontSize: '13px' }}>
                              {item.time}
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: item.statusBg, color: item.statusColor, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.statusColor }}></span>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px dashed #e9ecef', textAlign: 'center' }}>
                              <button 
                                  onClick={() => { setSelectedRegistration(item); setCheckRoomResult(null); }}
                                  style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #16796f', background: '#eaf7f5', color: '#16796f', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                Xem & xử lý
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}
            </section>
          )}

          {activeView === 'schedule' && (`;

content = content.replace(registrationsSectionRegex, newRegistrationsSection);

const functionsRegex = /(const currentView = activeView === 'account')/;
const newFunctions = `  // Functions for Registration Processing
  const handleCheckRoom = () => {
    setCheckingRooms(true);
    setCheckRoomResult(null);
    setTimeout(() => {
      setCheckingRooms(false);
      if (selectedRegistration && selectedRegistration.demandArea === 'Thủ Đức') {
        setCheckRoomResult([
          { id: 'P101', bed: 'G03', gender: 'Nữ', price: '1.800.000đ' },
          { id: 'P203', bed: 'G01', gender: 'Nữ', price: '2.000.000đ' }
        ]);
      } else {
        setCheckRoomResult([]); // Not found mock
      }
    }, 1000);
  };

  const handleCreateCheckRoom = () => {
    setCreateCheckingRooms(true);
    setCreateCheckRoomResult(null);
    setTimeout(() => {
      setCreateCheckingRooms(false);
      setCreateCheckRoomResult([{ id: 'P101', bed: 'G03', gender: 'Nữ', price: '1.800.000đ' }]);
    }, 1000);
  };

  const handleAcceptRegistration = () => {
    setAcceptingRegistration(true);
    setTimeout(() => {
      setAcceptingRegistration(false);
      alert('Tiếp nhận phiếu đăng ký thành công.');
      setSelectedRegistration(null);
    }, 1000);
  };

  const handleRejectRegistration = () => {
    setRejectingRegistration(true);
    setTimeout(() => {
      setRejectingRegistration(false);
      alert('Đã từ chối phiếu đăng ký.');
      setSelectedRegistration(null);
    }, 1000);
  };

  const handleSaveWalkInRegistration = () => {
    if (!createForm.hoTen || !createForm.sdt || !createForm.cccd) {
      alert('Vui lòng điền đủ thông tin bắt buộc.');
      return;
    }
    alert('Lưu đơn đăng ký thành công.');
    setShowCreateModal(false);
  };

  $1`;

content = content.replace(functionsRegex, newFunctions);

const modalsRegex = /(<\/main>\n      <\/div>\n    <\/div>\n  \);\n\})/;
const newModals = `{/* Detail Drawer */}
      {selectedRegistration && (
        <div className="sale-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedRegistration(null); }}>
          <div className="sale-drawer">
            <div className="sale-drawer-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#333' }}>Phiếu đăng ký {selectedRegistration.id}</h3>
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '13px' }}>
                  <span style={{ color: '#e86f51', background: '#fff1ed', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{selectedRegistration.status}</span>
                  <span style={{ color: '#7b8794' }}>Ngày gửi: {selectedRegistration.time}</span>
                </div>
              </div>
              <button onClick={() => setSelectedRegistration(null)} style={{ background: '#f8f9fa', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#555' }}>&times;</button>
            </div>
            
            <div className="sale-drawer-content">
              <div className="sale-drawer-block">
                <h4 style={{ color: '#16796f', marginBottom: '16px', fontSize: '1.1rem', borderBottom: '1px solid #e9ecef', paddingBottom: '8px' }}>Thông tin khách hàng</h4>
                <div className="sale-drawer-grid">
                  <div><label>Họ tên</label><strong>{selectedRegistration.customerName}</strong></div>
                  <div><label>Ngày sinh</label><strong>{new Date(selectedRegistration.customerDOB).toLocaleDateString('vi-VN')}</strong></div>
                  <div><label>Giới tính</label><strong>{selectedRegistration.customerGender}</strong></div>
                  <div><label>Quốc tịch</label><strong>{selectedRegistration.customerNationality}</strong></div>
                  <div><label>CCCD</label><strong>{selectedRegistration.customerCCCD}</strong></div>
                  <div><label>Số điện thoại</label><strong>{selectedRegistration.customerPhone}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><label>Email</label><strong>{selectedRegistration.customerEmail}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><label>Địa chỉ</label><strong>{selectedRegistration.customerAddress}</strong></div>
                </div>
              </div>

              <div className="sale-drawer-block">
                <h4 style={{ color: '#16796f', marginBottom: '16px', fontSize: '1.1rem', borderBottom: '1px solid #e9ecef', paddingBottom: '8px' }}>Thông tin nhu cầu thuê</h4>
                <div className="sale-drawer-grid">
                  <div><label>Hình thức thuê</label><strong>{selectedRegistration.demandType}</strong></div>
                  <div><label>Giới tính người ở</label><strong>{selectedRegistration.demandGender}</strong></div>
                  <div><label>Số người dự kiến ở</label><strong>{selectedRegistration.demandCount}</strong></div>
                  <div><label>Khu vực mong muốn</label><strong>{selectedRegistration.demandArea}</strong></div>
                  <div><label>Loại phòng yêu cầu</label><strong>{selectedRegistration.demandRoomType}</strong></div>
                  <div><label>Mức giá mong muốn</label><strong>{selectedRegistration.demandPrice}</strong></div>
                  <div><label>Thời gian dự kiến vào ở</label><strong>{selectedRegistration.demandMoveInDate}</strong></div>
                  <div><label>Thời hạn thuê</label><strong>{selectedRegistration.demandDuration}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><label>Yêu cầu khác</label><strong>{selectedRegistration.demandNote || 'Không có'}</strong></div>
                </div>
              </div>

              <div className="sale-drawer-block" style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <h4 style={{ color: '#333', marginBottom: '16px', fontSize: '1.1rem' }}>Kiểm tra tình trạng phòng / giường</h4>
                <button 
                  onClick={handleCheckRoom}
                  disabled={checkingRooms}
                  style={{ background: '#16796f', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', fontWeight: 600, cursor: checkingRooms ? 'not-allowed' : 'pointer', width: '100%', marginBottom: '16px' }}
                >
                  {checkingRooms ? 'Đang tra cứu...' : 'Kiểm tra tình trạng phòng giường'}
                </button>

                {checkRoomResult && (
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: checkRoomResult.length > 0 ? '1px solid #2fb7a4' : '1px solid #e86f51' }}>
                    {checkRoomResult.length > 0 ? (
                      <>
                        <h5 style={{ color: '#16796f', margin: '0 0 12px 0', fontSize: '1rem' }}>Tìm thấy {checkRoomResult.length} phòng / giường phù hợp</h5>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {checkRoomResult.map((r, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#eaf7f5', borderRadius: '4px', fontSize: '13px' }}>
                              <span><strong>{r.id}</strong> - Giường {r.bed} - {r.gender}</span>
                              <strong style={{ color: '#16796f' }}>{r.price}</strong>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <h5 style={{ color: '#c9504b', margin: 0, fontSize: '1rem' }}>Không tìm thấy phòng/giường phù hợp với nhu cầu thuê hiện tại.</h5>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sale-drawer-footer">
              <button className="sale-btn" onClick={() => setSelectedRegistration(null)} style={{ background: '#f8f9fa', border: '1px solid #e9ecef', color: '#555' }}>Hủy</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                {checkRoomResult && checkRoomResult.length === 0 && (
                  <button className="sale-btn" onClick={handleRejectRegistration} disabled={rejectingRegistration} style={{ background: '#fff1f1', border: '1px solid #fbc4c4', color: '#c9504b' }}>
                    {rejectingRegistration ? 'Đang từ chối...' : 'Từ chối phiếu'}
                  </button>
                )}
                <button 
                  className="sale-btn primary" 
                  disabled={!checkRoomResult || checkRoomResult.length === 0 || acceptingRegistration}
                  onClick={handleAcceptRegistration}
                  style={{ background: (!checkRoomResult || checkRoomResult.length === 0) ? '#ccc' : '#16796f', border: 'none', color: '#fff' }}
                >
                  {acceptingRegistration ? 'Đang xử lý...' : 'Tiếp nhận phiếu đăng ký'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal Form */}
      {showCreateModal && (
        <div className="sale-drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="sale-drawer" style={{ width: '800px', maxWidth: '90vw' }}>
            <div className="sale-drawer-header">
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#333' }}>Tạo phiếu mới cho khách vãng lai</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: '#f8f9fa', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#555' }}>&times;</button>
            </div>
            
            <div className="sale-drawer-content">
              <div className="sale-drawer-block">
                <h4 style={{ color: '#16796f', marginBottom: '16px', fontSize: '1.1rem', borderBottom: '1px solid #e9ecef', paddingBottom: '8px' }}>1. Thông tin khách hàng</h4>
                <div className="sale-form-grid">
                  <div className="sale-form-group">
                    <label>Họ tên *</label>
                    <input type="text" value={createForm.hoTen} onChange={e => setCreateForm({...createForm, hoTen: e.target.value})} placeholder="Nhập họ tên" />
                  </div>
                  <div className="sale-form-group">
                    <label>Ngày sinh</label>
                    <input type="date" value={createForm.ngaySinh} onChange={e => setCreateForm({...createForm, ngaySinh: e.target.value})} />
                  </div>
                  <div className="sale-form-group">
                    <label>Giới tính</label>
                    <select value={createForm.gioiTinh} onChange={e => setCreateForm({...createForm, gioiTinh: e.target.value})}>
                      <option>Nam</option><option>Nữ</option>
                    </select>
                  </div>
                  <div className="sale-form-group">
                    <label>Quốc tịch</label>
                    <input type="text" value={createForm.quocTich} onChange={e => setCreateForm({...createForm, quocTich: e.target.value})} />
                  </div>
                  <div className="sale-form-group">
                    <label>CCCD *</label>
                    <input type="text" value={createForm.cccd} onChange={e => setCreateForm({...createForm, cccd: e.target.value})} placeholder="12 chữ số" />
                  </div>
                  <div className="sale-form-group">
                    <label>Số điện thoại *</label>
                    <input type="text" value={createForm.sdt} onChange={e => setCreateForm({...createForm, sdt: e.target.value})} placeholder="Nhập SĐT" />
                  </div>
                  <div className="sale-form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Email</label>
                    <input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} placeholder="Nhập email" />
                  </div>
                  <div className="sale-form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Địa chỉ</label>
                    <input type="text" value={createForm.diaChi} onChange={e => setCreateForm({...createForm, diaChi: e.target.value})} placeholder="Nhập địa chỉ" />
                  </div>
                </div>
              </div>

              <div className="sale-drawer-block">
                <h4 style={{ color: '#16796f', marginBottom: '16px', fontSize: '1.1rem', borderBottom: '1px solid #e9ecef', paddingBottom: '8px' }}>2. Nhu cầu thuê</h4>
                <div className="sale-form-grid">
                  <div className="sale-form-group">
                    <label>Số người dự kiến ở</label>
                    <input type="number" min="1" value={createForm.soNguoi} onChange={e => setCreateForm({...createForm, soNguoi: e.target.value})} />
                  </div>
                  <div className="sale-form-group">
                    <label>Giới tính người ở</label>
                    <select value={createForm.gioiTinhNguoiO} onChange={e => setCreateForm({...createForm, gioiTinhNguoiO: e.target.value})}>
                      <option>Nam</option><option>Nữ</option>
                    </select>
                  </div>
                  <div className="sale-form-group">
                    <label>Hình thức thuê</label>
                    <select value={createForm.hinhThucThue} onChange={e => setCreateForm({...createForm, hinhThucThue: e.target.value})}>
                      <option>Ghép giường</option><option>Nguyên phòng</option>
                    </select>
                  </div>
                  <div className="sale-form-group">
                    <label>Khu vực mong muốn</label>
                    <select value={createForm.khuVuc} onChange={e => setCreateForm({...createForm, khuVuc: e.target.value})}>
                      <option value="">Chọn khu vực</option>
                      <option>Thủ Đức</option><option>Bình Thạnh</option><option>Quận 7</option>
                    </select>
                  </div>
                  <div className="sale-form-group">
                    <label>Loại phòng yêu cầu</label>
                    <select value={createForm.loaiPhong} onChange={e => setCreateForm({...createForm, loaiPhong: e.target.value})}>
                      <option value="">Chọn loại phòng</option>
                      <option>Phòng 2 người</option><option>Phòng 4 người</option><option>Phòng 6 người</option><option>Studio</option>
                    </select>
                  </div>
                  <div className="sale-form-group">
                    <label>Mức giá mong muốn</label>
                    <input type="text" value={createForm.mucGia} onChange={e => setCreateForm({...createForm, mucGia: e.target.value})} placeholder="VD: 2 triệu" />
                  </div>
                  <div className="sale-form-group">
                    <label>Thời gian dự kiến vào ở</label>
                    <input type="date" value={createForm.ngayVaoO} onChange={e => setCreateForm({...createForm, ngayVaoO: e.target.value})} />
                  </div>
                  <div className="sale-form-group">
                    <label>Thời hạn thuê</label>
                    <select value={createForm.thoiHanThue} onChange={e => setCreateForm({...createForm, thoiHanThue: e.target.value})}>
                      <option>3 tháng</option><option>6 tháng</option><option>12 tháng</option>
                    </select>
                  </div>
                  <div className="sale-form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Yêu cầu khác</label>
                    <input type="text" value={createForm.yeuCauKhac} onChange={e => setCreateForm({...createForm, yeuCauKhac: e.target.value})} placeholder="Ghi chú thêm..." />
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <button 
                    onClick={handleCreateCheckRoom}
                    disabled={createCheckingRooms}
                    style={{ background: '#f8f9fa', color: '#16796f', border: '1px solid #16796f', padding: '10px 16px', borderRadius: '4px', fontWeight: 600, cursor: createCheckingRooms ? 'not-allowed' : 'pointer', width: '100%', marginBottom: '16px' }}
                  >
                    {createCheckingRooms ? 'Đang tra cứu...' : 'Kiểm tra phòng/giường phù hợp'}
                  </button>

                  {createCheckRoomResult && (
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: createCheckRoomResult.length > 0 ? '1px solid #2fb7a4' : '1px solid #e86f51' }}>
                      {createCheckRoomResult.length > 0 ? (
                        <>
                          <h5 style={{ color: '#16796f', margin: '0 0 12px 0', fontSize: '1rem' }}>Tìm thấy {createCheckRoomResult.length} phòng / giường phù hợp</h5>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {createCheckRoomResult.map((r, i) => (
                              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#eaf7f5', borderRadius: '4px', fontSize: '13px' }}>
                                <span><strong>{r.id}</strong> - Giường {r.bed} - {r.gender}</span>
                                <strong style={{ color: '#16796f' }}>{r.price}</strong>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <h5 style={{ color: '#c9504b', margin: 0, fontSize: '1rem' }}>Không tìm thấy phòng/giường phù hợp với nhu cầu thuê hiện tại.</h5>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sale-drawer-footer">
              <button className="sale-btn" onClick={() => setShowCreateModal(false)} style={{ background: '#f8f9fa', border: '1px solid #e9ecef', color: '#555' }}>Hủy</button>
              <button className="sale-btn primary" onClick={handleSaveWalkInRegistration} style={{ background: '#16796f', border: 'none', color: '#fff' }}>
                Lưu đơn đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
$1`;

content = content.replace(modalsRegex, newModals);

fs.writeFileSync(file, content, 'utf8');
console.log("Rewrite complete.");
