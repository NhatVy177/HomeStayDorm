import React, { useState } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';

const mockPhieuCoc = [
  { id: 'DC-2024-045', ngay: '24/10/2024', customer: 'Lê Minh Tuấn', phone: '0912 345 678', avatar: 'LT', vitri: 'P.402-G.01', loai: 'Ghép Nam', giaThue: '1.85tr', ngayVao: '01/11/2024', trangThaiPhieu: 'HIỆU LỰC', trangThaiTT: 'ĐÃ TT', cccd: '079098012345', diaChi: 'Quận 7, TP.HCM', gioiTinh: 'Nam' },
  { id: 'DC-2024-042', ngay: '18/10/2024', customer: 'Hoàng Thu Nga', phone: '0987 650 321', avatar: 'HN', vitri: 'P.201', loai: 'Phòng Đơn', giaThue: '4.20tr', ngayVao: '28/10/2024', trangThaiPhieu: 'HIỆU LỰC', trangThaiTT: 'ĐÃ TT', cccd: '079000334455', diaChi: 'Bình Thạnh, TP.HCM', gioiTinh: 'Nữ' },
  { id: 'DC-2024-039', ngay: '15/10/2024', customer: 'Trần Văn Bình', phone: '0900 111 222', avatar: 'TB', vitri: 'P.305-G.02', loai: 'Ghép Nam', giaThue: '2.10tr', ngayVao: '01/11/2024', trangThaiPhieu: 'HIỆU LỰC', trangThaiTT: 'ĐÃ TT', cccd: '079001122334', diaChi: 'Thủ Đức, TP.HCM', gioiTinh: 'Nam' },
];

const dichVuOptions = [
  { id: 'dien', label: 'Tiền điện', sub: 'Theo chỉ số đồng hồ', price: '3.500đ', unit: '/ kWh', icon: 'bolt' },
  { id: 'nuoc', label: 'Tiền nước', sub: 'Định mức người/tháng', price: '100.000đ', unit: '/ người', icon: 'water_drop' },
  { id: 'wifi', label: 'Wifi tốc độ cao', sub: 'Trọn gói theo phòng', price: '50.000đ', unit: '/ tháng', icon: 'wifi' },
  { id: 'xe', label: 'Phí gửi xe', sub: 'Xe máy/xe đạp điện', price: '120.000đ', unit: '/ chiếc', icon: 'directions_bike' },
];

const dieuKhoanList = [
  { title: 'Điều 1: Thanh toán', content: 'Bên B thanh toán tiền thuê phòng định kỳ vào ngày 01 đến ngày 05 hàng tháng. Hình thức chuyển khoản hoặc tiền mặt tại quầy lễ tân.' },
  { title: 'Điều 2: Bảo trì tài sản', content: 'Bên B có trách nhiệm bảo quản các trang thiết bị trong phòng. Mọi hư hỏng do lỗi chủ quan sẽ phải bồi thường theo giá trị thị trường.' },
  { title: 'Điều 3: Trả phòng & Cọc', content: 'Bên B cần thông báo trước ít nhất 30 ngày khi có ý định chấm dứt hợp đồng. Tiền cọc sẽ được hoàn trả sau khi trừ các chi phí vệ sinh và hư hỏng (nếu có).' },
];

const STEPS = [
  { id: 1, label: 'Tra cứu phiếu cọc' },
  { id: 2, label: 'Kiểm tra điều kiện' },
  { id: 3, label: 'Thành viên hợp đồng' },
  { id: 4, label: 'Thông tin & Dịch vụ' },
  { id: 5, label: 'Xác nhận' },
];


function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
      {STEPS.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <React.Fragment key={step.id}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: done || active ? '#1b6f6d' : '#e0e3e3', color: done || active ? '#fff' : '#6f797a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', border: active ? '3px solid #1b6f6d' : 'none', boxSizing: 'border-box' }}>
                {step.id}
              </div>
              <span style={{ fontSize: '11px', fontWeight: active ? '700' : '500', color: active ? '#1b6f6d' : done ? '#3f494a' : '#9eaaab', textAlign: 'center', lineHeight: '1.3' }}>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', marginBottom: '20px', backgroundColor: done ? '#1b6f6d' : '#e0e3e3' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function LapHopDongTab() {
  const [step, setStep] = useState(1);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [thanhVien, setThanhVien] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ ten: '', ngaySinh: '', gioiTinh: 'Nam', cccd: '', sdt: '' });
  const [dichVuChon, setDichVuChon] = useState({ dien: true, nuoc: true, wifi: true, xe: false });
  const [ngayKy, setNgayKy] = useState('2024-05-20');
  const [ngayBatDau, setNgayBatDau] = useState('2024-06-01');
  const [ngayKetThuc, setNgayKetThuc] = useState('2025-06-01');
  const [kyTT, setKyTT] = useState('Hàng tháng');
  const [ghiChu, setGhiChu] = useState('');
  const [confirmKH, setConfirmKH] = useState(false);
  const [confirmNV, setConfirmNV] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showChiTiet, setShowChiTiet] = useState(false);
  const [savedHD, setSavedHD] = useState(null);

  const filteredPhieu = mockPhieuCoc.filter(p =>
    searchText === '' || p.customer.toLowerCase().includes(searchText.toLowerCase()) || p.id.toLowerCase().includes(searchText.toLowerCase())
  );

  const basePrice = selectedPhieu ? parseFloat(selectedPhieu.giaThue.replace('tr', '')) * 1000000 : 0;
  const dichVuCost = (dichVuChon.nuoc ? 100000 : 0) + (dichVuChon.wifi ? 50000 : 0) + (dichVuChon.xe ? 120000 : 0);
  const totalPrice = basePrice + dichVuCost;

  const handleReset = () => {
    setStep(1); setSelectedPhieu(null); setThanhVien([]); setConfirmKH(false); setConfirmNV(false);
    setShowSuccessModal(false); setSavedHD(null); setShowChiTiet(false);
  };

  const handleLuu = () => {
    setSavedHD({
      maHD: 'HD-2024-' + Math.floor(Math.random() * 900 + 100),
      chuHD: selectedPhieu?.customer,
      phong: selectedPhieu?.vitri,
      cccd: selectedPhieu?.cccd,
      ngayLap: new Date().toLocaleDateString('vi-VN'),
      thoiHan: '12 Tháng',
      trangThai: 'Đã xác nhận',
      tenPhong: 'Luxury Studio ' + selectedPhieu?.vitri,
      diaChi: (selectedPhieu?.diaChi || '') + ', TP. HCM',
      giaThuePT: totalPrice.toLocaleString('vi-VN') + 'đ',
      tienCoc: (basePrice * 2).toLocaleString('vi-VN') + 'đ',
      thanhVien: [{ ten: selectedPhieu?.customer, quanHe: 'Chủ hợp đồng', sdt: selectedPhieu?.phone }, ...thanhVien.map(tv => ({ ten: tv.ten, quanHe: 'Thành viên', sdt: tv.sdt }))],
      dichVu: dichVuOptions.filter(dv => dichVuChon[dv.id]).map(dv => ({ icon: dv.icon, label: dv.label, sub: dv.price + ' ' + dv.unit }))
    });
    setShowSuccessModal(true);
  };

  const navBtn = (label, onClick, variant = 'back') => (
    <button onClick={onClick} style={{ padding: '10px 24px', borderRadius: '8px', border: variant === 'back' ? '1px solid #bec8c9' : 'none', backgroundColor: variant === 'back' ? '#fff' : '#1b6f6d', color: variant === 'back' ? '#3f494a' : '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
      {variant === 'back' && <Icon name="arrow_back" />}{label}{variant === 'next' && <Icon name="arrow_forward" />}
    </button>
  );

  /* ─── STEP 1 ─── */
  if (step === 1) return (
    <div className="ktp-container">
      <StepIndicator current={1} />
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e3e3', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '12px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#9eaaab', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Tìm kiếm</label>
          <div style={{ position: 'relative' }}>
            <input className="ktp-input" placeholder="Tra cứu theo mã phiếu, tên khách hàng..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '11px', fontWeight: '700', color: '#9eaaab', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Ngày tạo</label>
          <input type="date" className="ktp-input" />
        </div>
        <button style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#1b6f6d', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Áp dụng
        </button>
      </div>
      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e3e3', borderRadius: '10px', overflow: 'hidden' }}>
        <table className="ktp-table" style={{ margin: 0 }}>
          <thead><tr><th>PHIẼU CHC</th><th>KHÁCH HÀNG</th><th>Vị TRÍ</th><th>THÔNG TIN THUÊ</th><th className="text-center">TRẠNG THÁI</th><th className="text-center">THAO TÁC</th></tr></thead>
          <tbody>
            {filteredPhieu.map(p => (
              <tr key={p.id}>
                <td><div style={{ fontWeight: '700', color: '#1b6f6d' }}>{p.id}</div><div style={{ fontSize: '12px', color: '#9eaaab' }}>{p.ngay}</div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#1b6f6d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{p.avatar}</div>
                    <div><div style={{ fontWeight: '600', color: '#191c1d' }}>{p.customer}</div><div style={{ fontSize: '12px', color: '#9eaaab' }}>{p.phone}</div></div>
                  </div>
                </td>
                <td><div style={{ fontWeight: '600', color: '#191c1d' }}>{p.vitri}</div><div style={{ fontSize: '12px', color: '#6f797a' }}>{p.loai}</div></td>
                <td><div style={{ fontWeight: '600', color: '#191c1d' }}>{p.giaThue}/tháng</div><div style={{ fontSize: '12px', color: '#6f797a', display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="calendar_today" style={{ fontSize: '12px' }} /> {p.ngayVao}</div></td>
                <td className="text-center">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#e8f4f4', color: '#1b6f6d', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1b6f6d', display: 'inline-block' }}></span>
                    {p.trangThaiPhieu}
                  </span>
                </td>
                <td className="text-center"><button className="ktp-btn-action-fill" style={{ backgroundColor: '#1b6f6d', borderRadius: '6px', padding: '7px 16px', fontSize: '13px' }} onClick={() => { setSelectedPhieu(p); setStep(2); }}>Lập hợp đồng</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#6f797a' }}>
          <span>Hiển thị 1-{filteredPhieu.length} trong {filteredPhieu.length} kết quả</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(n => <button key={n} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid', borderColor: n === 1 ? '#1b6f6d' : '#e0e3e3', backgroundColor: n === 1 ? '#1b6f6d' : '#fff', color: n === 1 ? '#fff' : '#3f494a', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{n}</button>)}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── STEP 2 ─── */
  const dieuKien = ['Trạng thái phiếu đặt cọc: Hiệu lực', 'Nghĩa vụ tài chính: Đã thanh toán đủ', 'Liên kết dữ liệu: Chưa có hợp đồng liên kết', 'Trạng thái thực tế: Phòng đang trống', 'Dữ liệu khách hàng: Đủ thông tin (CCCD, SĐT)', 'Dữ liệu phòng: Đủ thông tin diện tích & trang thiết bị', 'Chính sách thương mại: Giá thuê hợp lệ'];

  if (step === 2) return (
    <div className="ktp-container">
      <StepIndicator current={2} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#191c1d' }}>Thông tin phiếu đặt cọc</h4>
            <span style={{ backgroundColor: '#fff5f0', color: '#a43c12', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>{selectedPhieu?.id}</span>
          </div>
          {[{ l: 'Khách hàng:', v: selectedPhieu?.customer }, { l: 'Phòng thuê:', v: selectedPhieu?.vitri }, { l: 'Giá thuê:', v: selectedPhieu?.giaThue + '/tháng', c: '#a43c12' }].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #f4f7f7', paddingBottom: '12px' }}>
              <span style={{ color: '#6f797a' }}>{r.l}</span>
              <span style={{ fontWeight: '700', color: r.c || '#191c1d' }}>{r.v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #f4f7f7', paddingBottom: '12px' }}>
            <span style={{ color: '#6f797a' }}>Trạng thái cọc:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#e8f4f4', color: '#1b6f6d', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1b6f6d', display: 'inline-block' }}></span>Hiệu lực
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#6f797a' }}>Thanh toán:</span>
            <span style={{ fontWeight: '700', color: '#a43c12' }}>ĐÃ THANH TOÁN</span>
          </div>
          <div style={{ backgroundColor: '#e8f4f4', borderRadius: '10px', padding: '16px', display: 'flex', gap: '12px', marginTop: '4px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#28a745', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" /></div>
            <div><div style={{ fontWeight: '700', color: '#1b6f6d', fontSize: '14px', marginBottom: '4px' }}>Đủ điều kiện lập hợp đồng</div><div style={{ fontSize: '12px', color: '#3f7375', lineHeight: '1.5' }}>Mọi thông tin đã được kiểm chứng và sẵn sàng để tiến hành soạn thảo hợp đồng chính thức.</div></div>
          </div>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#191c1d' }}>Điều kiện lập hợp đồng</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dieuKien.map((dk, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f4f7f7', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', color: '#3f494a' }}>{dk}</span>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#28a745', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" style={{ fontSize: '14px' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
        {navBtn('Quay lại', () => setStep(1))}
        {navBtn('Tiếp tục lập hợp đồng', () => setStep(3), 'next')}
      </div>
    </div>
  );

  /* ─── STEP 3 ─── */
  if (step === 3) {
    const sucChua = 4;
    const tongSo = 1 + thanhVien.length;
    return (
      <div className="ktp-container">
        <StepIndicator current={3} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div><h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#191c1d' }}>Danh sách thành viên</h4><p style={{ margin: 0, fontSize: '13px', color: '#6f797a' }}>Danh sách khách hàng lưu trú cùng trong hợp đồng thuê nhóm.</p></div>
              <button onClick={() => setShowAddMember(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#e8f4f4', color: '#1b6f6d', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="person_add" /> Thêm thành viên</button>
            </div>
            <table className="ktp-table" style={{ margin: 0 }}>
              <thead><tr><th>Họ tên</th><th>Ngày sinh</th><th>Giới tính</th><th>CCCD/Hộ chiếu</th><th>Số điện thoại</th><th className="text-center">Thao tác</th></tr></thead>
              <tbody>
                <tr>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1b6f6d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="person" style={{ fontSize: '13px' }} /></div><div><div style={{ fontWeight: '600', color: '#191c1d', fontSize: '13px' }}>{selectedPhieu?.customer}</div><div style={{ fontSize: '10px', color: '#1b6f6d', fontWeight: '600' }}>Chủ hợp đồng</div></div></div></td>
                  <td style={{ fontSize: '13px', color: '#6f797a' }}>-</td>
                  <td style={{ fontSize: '13px', color: '#6f797a' }}>{selectedPhieu?.gioiTinh}</td>
                  <td style={{ fontSize: '13px', color: '#6f797a' }}>{selectedPhieu?.cccd}</td>
                  <td style={{ fontSize: '13px', color: '#6f797a' }}>{selectedPhieu?.phone}</td>
                  <td className="text-center"><span style={{ fontSize: '11px', color: '#9eaaab' }}>-</span></td>
                </tr>
                {thanhVien.map((tv, i) => (
                  <tr key={i}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0e3e3', color: '#3f494a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="person" style={{ fontSize: '13px' }} /></div><span style={{ fontWeight: '600', color: '#191c1d', fontSize: '13px' }}>{tv.ten}</span></div></td>
                    <td style={{ fontSize: '13px', color: '#6f797a' }}>{tv.ngaySinh}</td>
                    <td style={{ fontSize: '13px', color: '#6f797a' }}>{tv.gioiTinh}</td>
                    <td style={{ fontSize: '13px', color: '#6f797a' }}>{tv.cccd}</td>
                    <td style={{ fontSize: '13px', color: '#6f797a' }}>{tv.sdt}</td>
                    <td className="text-center"><button onClick={() => setThanhVien(thanhVien.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b3261e' }}><Icon name="delete" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#1b6f6d', borderRadius: '12px', padding: '20px', color: '#fff' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '16px', opacity: 0.8 }}>TÓM TẮt THÀNH VIÊN</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', opacity: 0.8 }}>Số người đã nhập:</span>
                <span style={{ fontSize: '28px', fontWeight: '800' }}>{tongSo}<span style={{ fontSize: '16px', opacity: 0.7 }}>/{sucChua}</span></span>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', height: '6px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${(tongSo / sucChua) * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ opacity: 0.8 }}>Sức chứa tối đa:</span><span style={{ fontWeight: '700' }}>{sucChua} người</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px', alignItems: 'center' }}><span style={{ opacity: 0.8 }}>Kết luận:</span><span style={{ backgroundColor: '#fff', color: '#1b6f6d', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>Phù hợp</span></div>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', opacity: 0.85, lineHeight: '1.5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}><Icon name="info" style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }} />Hợp đồng yêu cầu ít nhất 1 thành viên là chủ hộ có CCCD hợp lệ để tiến hành ký kết điện tử.</div>
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e0e3e3' }}>
              <div style={{ height: '80px', backgroundColor: '#1b6f6d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="apartment" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.4)' }} /></div>
              <div style={{ padding: '12px' }}><div style={{ fontWeight: '700', color: '#191c1d', fontSize: '14px' }}>Dorm Standard {selectedPhieu?.vitri}</div><div style={{ fontSize: '12px', color: '#6f797a' }}>{selectedPhieu?.loai}</div></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          {navBtn('Quay lại', () => setStep(2))}
          {navBtn('Tiếp tục', () => setStep(4), 'next')}
        </div>
        {showAddMember && (
          <div className="ktp-modal-overlay" onClick={() => setShowAddMember(false)}>
            <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
              <div className="ktp-modal-header"><h3 style={{ margin: 0, fontSize: '16px', color: '#191c1d' }}>Thêm thành viên</h3><button className="ktp-modal-close" onClick={() => setShowAddMember(false)}><Icon name="close" /></button></div>
              <div className="ktp-modal-body" style={{ padding: '20px', display: 'block' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[{ label: 'Họ và tên *', key: 'ten', type: 'text', ph: 'Nguyễn Văn A' }, { label: 'Ngày sinh', key: 'ngaySinh', type: 'date', ph: '' }, { label: 'CCCD/Hộ chiếu', key: 'cccd', type: 'text', ph: '12 chữ số' }, { label: 'Số điện thoại', key: 'sdt', type: 'text', ph: '0900 000 000' }].map(f => (
                    <div key={f.key}><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>{f.label}</label><input className="ktp-input" type={f.type} placeholder={f.ph} value={newMember[f.key]} onChange={e => setNewMember({ ...newMember, [f.key]: e.target.value })} /></div>
                  ))}
                  <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Giới tính</label><select className="ktp-input" value={newMember.gioiTinh} onChange={e => setNewMember({ ...newMember, gioiTinh: e.target.value })}><option>Nam</option><option>Nữ</option></select></div>
                </div>
              </div>
              <div className="ktp-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="ktp-btn-cancel" onClick={() => setShowAddMember(false)}>Hủy</button>
                <button className="ktp-btn-submit" style={{ backgroundColor: '#1b6f6d' }} onClick={() => { if (newMember.ten) { setThanhVien([...thanhVien, newMember]); setNewMember({ ten: '', ngaySinh: '', gioiTinh: 'Nam', cccd: '', sdt: '' }); setShowAddMember(false); } }}><Icon name="person_add" /> Thêm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── STEP 4 ─── */
  if (step === 4) return (
    <div className="ktp-container">
      <StepIndicator current={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="description" style={{ color: '#1b6f6d' }} /> Thông tin hợp đồng</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Mã phiếu cọc</label><input className="ktp-input" value={selectedPhieu?.id || ''} readOnly style={{ backgroundColor: '#f4f7f7' }} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Khách hàng</label><input className="ktp-input" value={selectedPhieu?.customer || ''} readOnly style={{ backgroundColor: '#f4f7f7' }} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Phòng/Giường</label><input className="ktp-input" value={selectedPhieu?.vitri || ''} readOnly style={{ backgroundColor: '#f4f7f7' }} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Kỳ thanh toán</label><select className="ktp-input" value={kyTT} onChange={e => setKyTT(e.target.value)}><option>Hàng tháng</option><option>3 tháng</option><option>6 tháng</option></select></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Ngày ký</label><input type="date" className="ktp-input" value={ngayKy} onChange={e => setNgayKy(e.target.value)} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Giá thuê niêm yết</label><div style={{ position: 'relative' }}><input className="ktp-input" value={basePrice.toLocaleString('vi-VN')} readOnly style={{ backgroundColor: '#f4f7f7', paddingRight: '50px' }} /><span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#6f797a', fontWeight: '600' }}>VND</span></div></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Ngày bắt đầu</label><input type="date" className="ktp-input" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Ngày kết thúc (Dự kiến)</label><input type="date" className="ktp-input" value={ngayKetThuc} onChange={e => setNgayKetThuc(e.target.value)} /></div>
            <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: '12px', fontWeight: '700', color: '#3f494a', display: 'block', marginBottom: '6px' }}>Ghi chú hợp đồng</label><textarea className="ktp-input" rows={3} placeholder="Nhập các thỏa thuận riêng hoặc yêu cầu đặc biệt..." value={ghiChu} onChange={e => setGhiChu(e.target.value)} style={{ resize: 'vertical' }} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e0e3e3' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="electric_bolt" style={{ color: '#1b6f6d' }} /> Dịch vụ đăng ký</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dichVuOptions.map(dv => (
                <label key={dv.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${dichVuChon[dv.id] ? '#1b6f6d' : '#e0e3e3'}`, backgroundColor: dichVuChon[dv.id] ? '#e8f4f4' : '#fff', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!dichVuChon[dv.id]} onChange={e => setDichVuChon({ ...dichVuChon, [dv.id]: e.target.checked })} style={{ accentColor: '#1b6f6d', width: '16px', height: '16px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}><div style={{ fontWeight: '600', fontSize: '13px', color: '#191c1d' }}>{dv.label}</div><div style={{ fontSize: '11px', color: '#6f797a' }}>{dv.sub}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontWeight: '700', fontSize: '13px', color: '#1b6f6d' }}>{dv.price}</div><div style={{ fontSize: '11px', color: '#9eaaab' }}>{dv.unit}</div></div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e0e3e3' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9eaaab', marginBottom: '10px' }}>THÀNH VIÊN CƯ TRÚ ({1 + thanhVien.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '13px', color: '#191c1d' }}>1. {selectedPhieu?.customer}</div>
              {thanhVien.map((tv, i) => <div key={i} style={{ fontSize: '13px', color: '#3f494a' }}>{i + 2}. {tv.ten}</div>)}
            </div>
          </div>
          <div style={{ backgroundColor: '#1b6f6d', borderRadius: '12px', padding: '16px', color: '#fff' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', opacity: 0.8, marginBottom: '6px' }}>DỰ TÍNH PHÍ HÀNG THÁNG</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>{totalPrice.toLocaleString('vi-VN')} VND</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>* Chưa bao gồm tiền điện tiêu dùng thực tế</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
        {navBtn('Quay lại', () => setStep(3))}
        {navBtn('Tiếp tục', () => setStep(5), 'next')}
      </div>
    </div>
  );

  /* ─── STEP 5 ─── */
  if (step === 5) {
    const dichVuDangKy = dichVuOptions.filter(dv => dichVuChon[dv.id]);
    const allTV = [{ ten: selectedPhieu?.customer, vaiTro: 'Chủ hợp đồng' }, ...thanhVien.map(tv => ({ ten: tv.ten, vaiTro: 'Thành viên' }))];
    return (
      <div className="ktp-container">
        <StepIndicator current={5} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3' }}>
              <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="description" style={{ color: '#1b6f6d' }} /> Thông tin hợp đồng</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                {[{ l: 'Mã hợp đồng (Dự kiến)', v: 'HD-2024-0892' }, { l: 'Ngày lập', v: new Date().toLocaleDateString('vi-VN') }, { l: 'Chủ hợp đồng', v: selectedPhieu?.customer, s: 'lg' }, { l: 'Căn hộ / Phòng', v: 'Phòng ' + selectedPhieu?.vitri, s: 'lg' }, { l: 'Thời hạn thuê', v: '12 tháng (01/06/2024 - 01/06/2025)' }, { l: 'Giá thuê hàng tháng', v: basePrice.toLocaleString('vi-VN') + ' VND', c: '#a43c12', s: 'lg' }].map((f, i) => (
                  <div key={i}><div style={{ fontSize: '11px', color: '#9eaaab', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.l}</div><div style={{ fontWeight: '600', fontSize: f.s === 'lg' ? '15px' : '14px', color: f.c || '#191c1d' }}>{f.v}</div></div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#f4f7f7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#3f494a' }}>Khoản tiền cọc đã nhận:</span>
                <span style={{ fontWeight: '700', fontSize: '16px', color: '#191c1d' }}>{(basePrice * 2).toLocaleString('vi-VN')} VND</span>
              </div>
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}><span style={{ fontSize: '12px', fontWeight: '700', color: '#1b6f6d' }}>Đã thanh toán</span></div>
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e0e3e3' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '8px' }}><Icon name="description" style={{ color: '#1b6f6d' }} /> Thành viên & Dịch vụ</h4>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9eaaab', marginBottom: '10px', textTransform: 'uppercase' }}>DỊCH VỤ ĐĂNG KÝ</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {dichVuDangKy.map(dv => <span key={dv.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#e8f4f4', color: '#1b6f6d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}><Icon name={dv.icon} style={{ fontSize: '14px' }} /> {dv.label} ({dv.price})</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9eaaab', marginBottom: '10px', textTransform: 'uppercase' }}>THÀNH VIÊN CƯ TRÚ ({allTV.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {allTV.map((tv, i) => <div key={i} style={{ backgroundColor: '#f4f7f7', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: i === 0 ? '#1b6f6d' : '#a43c12', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{tv.ten?.slice(-1)}</div><div><div style={{ fontWeight: '600', fontSize: '13px', color: '#191c1d' }}>{tv.ten}</div><div style={{ fontSize: '11px', color: '#9eaaab' }}>{tv.vaiTro}</div></div></div>)}
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: 'sticky', top: '20px', alignSelf: 'start' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e0e3e3' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#191c1d', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="fact_check" style={{ color: '#1b6f6d' }} /> Xác nhận hợp đồng</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}><input type="checkbox" checked={confirmKH} onChange={e => setConfirmKH(e.target.checked)} style={{ accentColor: '#1b6f6d', marginTop: '2px', flexShrink: 0 }} /><span style={{ fontSize: '13px', color: '#3f494a', lineHeight: '1.5' }}>Khách hàng đã kiểm tra thông tin và đồng ý ký hợp đồng</span></label>
                <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}><input type="checkbox" checked={confirmNV} onChange={e => setConfirmNV(e.target.checked)} style={{ accentColor: '#1b6f6d', marginTop: '2px', flexShrink: 0 }} /><span style={{ fontSize: '13px', color: '#3f494a', lineHeight: '1.5' }}>Nhân viên Sale xác nhận thông tin hợp đồng là chính xác</span></label>
              </div>
              <button onClick={handleLuu} disabled={!confirmKH || !confirmNV} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: confirmKH && confirmNV ? '#1b6f6d' : '#bec8c9', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: confirmKH && confirmNV ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}><Icon name="save" /> Lưu hợp đồng thuê</button>
              <button onClick={() => setStep(4)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3f494a', marginBottom: '10px' }}><Icon name="arrow_back" /> Quay lại</button>
              <button onClick={handleReset} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: '#b3261e', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Icon name="delete" /> Hủy lập hợp đồng</button>
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f4f7f7', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1b6f6d' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1b6f6d', flexShrink: 0, display: 'inline-block' }}></span>Dữ liệu đã được kiểm tra tính hợp lệ hệ thống</div>
            </div>
          </div>
        </div>

        {/* Modal thanh cong */}
        {showSuccessModal && savedHD && (
          <div className="ktp-modal-overlay">
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px 32px', width: '420px', maxWidth: '95vw', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1b6f6d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Icon name="check" style={{ fontSize: '32px' }} /></div>
              <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#191c1d' }}>Lập hợp đồng thuê thành công</h3>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6f797a', lineHeight: '1.5' }}>Hệ thống đã ghi nhận và lưu trữ thông tin hợp đồng vào cơ sở dữ liệu.</p>
              <div style={{ backgroundColor: '#f4f7f7', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[{ label: 'MÃ HỢP ĐỒNG', value: savedHD.maHD, bold: true }, { label: 'KHÁCH HÀNG', value: savedHD.chuHD }, { label: 'PHÒNG', value: savedHD.phong }, { label: 'TRẠNG THÁI', badge: 'Hiệu lực' }].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: '#9eaaab', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                    {row.badge ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#e8f4f4', color: '#1b6f6d', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1b6f6d', display: 'inline-block' }}></span>{row.badge}</span> : <span style={{ fontWeight: row.bold ? '700' : '600', color: '#191c1d' }}>{row.value}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#a43c12', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleReset}><Icon name="login" /> Chuyển sang nhận phòng</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setShowSuccessModal(false); setShowChiTiet(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3f494a' }}><Icon name="description" /> Xem hợp đồng</button>
                  <button onClick={handleReset} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #bec8c9', backgroundColor: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#3f494a' }}><Icon name="list" /> Quay lại danh sách</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal chi tiet hop dong */}
        {showChiTiet && savedHD && (
          <div className="ktp-modal-overlay" onClick={() => { setShowChiTiet(false); handleReset(); }}>
            <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e3e3', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fff' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#e8f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1b6f6d' }}><Icon name="description" /></div>
                <div style={{ flex: 1 }}><h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#191c1d' }}>Chi tiết Hợp đồng thuê phòng</h3><p style={{ margin: 0, fontSize: '13px', color: '#6f797a' }}>Mã hợp đồng: {savedHD.maHD}</p></div>
                <button onClick={() => { setShowChiTiet(false); handleReset(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6f797a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="close" style={{ fontSize: '22px' }} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Row cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.9fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e0e3e3' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#9eaaab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THÔNG TIN CHUNG</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div><div style={{ fontSize: '11px', color: '#9eaaab' }}>Ngày lập hợp đồng</div><div style={{ fontWeight: '600', color: '#191c1d' }}>{savedHD.ngayLap}</div></div>
                      <div><div style={{ fontSize: '11px', color: '#9eaaab' }}>Thời hạn thuê</div><div style={{ fontWeight: '700', color: '#1b6f6d', fontSize: '15px' }}>{savedHD.thoiHan}</div></div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e8f4f4', color: '#1b6f6d', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', width: 'fit-content' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1b6f6d', display: 'inline-block' }}></span>Đã xác nhận</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#e8f4f4', borderRadius: '10px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#1b6f6d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PHÒNG & ĐỊA CHỆ</p>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#191c1d', marginBottom: '6px' }}>{savedHD.tenPhong}</div>
                    <div style={{ fontSize: '12px', color: '#3f494a', lineHeight: '1.5' }}>{savedHD.diaChi}</div>
                    <div style={{ position: 'absolute', bottom: '8px', right: '12px' }}><Icon name="apartment" style={{ fontSize: '48px', color: '#b2d8d8', opacity: 0.4 }} /></div>
                  </div>
                  <div style={{ backgroundColor: '#fff5f0', borderRadius: '10px', padding: '16px', border: '1px solid #f5c6b4' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#a43c12', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TÀI CHÍNH</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div><div style={{ fontSize: '11px', color: '#a43c12', opacity: 0.7 }}>Giá thuê tháng</div><div style={{ fontSize: '18px', fontWeight: '800', color: '#a43c12' }}>{savedHD.giaThuePT}</div></div>
                      <div><div style={{ fontSize: '11px', color: '#a43c12', opacity: 0.7 }}>Tiền đặt cọc</div><div style={{ fontSize: '18px', fontWeight: '800', color: '#a43c12' }}>{savedHD.tienCoc}</div></div>
                    </div>
                  </div>
                </div>
                {/* Cac ben lien quan */}
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e0e3e3' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#9eaaab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CÁC BÊN LIÊN QUAN</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ borderLeft: '3px solid #1b6f6d', paddingLeft: '12px' }}><div style={{ fontSize: '11px', color: '#9eaaab', fontWeight: '600', marginBottom: '4px' }}>BÊN CHO THUÊ (A)</div><div style={{ fontWeight: '700', fontSize: '15px', color: '#1b6f6d' }}>HomeStayDorm</div><div style={{ fontSize: '12px', color: '#6f797a' }}>Đại diện: Quản lý chi nhánh</div></div>
                    <div style={{ borderLeft: '3px solid #a43c12', paddingLeft: '12px' }}><div style={{ fontSize: '11px', color: '#9eaaab', fontWeight: '600', marginBottom: '4px' }}>BÊN THUÊ (B)</div><div style={{ fontWeight: '700', fontSize: '15px', color: '#a43c12' }}>{savedHD.chuHD}</div><div style={{ fontSize: '12px', color: '#6f797a' }}>CCCD: {savedHD.cccd}</div></div>
                  </div>
                </div>
                {/* Thanh vien */}
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e0e3e3' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#9eaaab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THÀNH VIÊN CƯ TRÚ</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr style={{ backgroundColor: '#f4f7f7' }}><th style={{ padding: '8px 12px', textAlign: 'left', color: '#6f797a', fontWeight: '600' }}>Họ tên</th><th style={{ padding: '8px 12px', textAlign: 'left', color: '#6f797a', fontWeight: '600' }}>Quan hệ</th><th style={{ padding: '8px 12px', textAlign: 'left', color: '#6f797a', fontWeight: '600' }}>Số điện thoại</th></tr></thead>
                    <tbody>{savedHD.thanhVien?.map((tv, i) => <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}><td style={{ padding: '10px 12px', fontWeight: '600', color: '#191c1d' }}>{tv.ten}</td><td style={{ padding: '10px 12px', color: '#3f494a' }}>{tv.quanHe}</td><td style={{ padding: '10px 12px', color: '#3f494a' }}>{tv.sdt}</td></tr>)}</tbody>
                  </table>
                </div>
                {/* Dich vu */}
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e0e3e3' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#9eaaab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DỊch vỤ ĐĂNG KÝ</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {savedHD.dichVu?.map((dv, i) => <div key={i} style={{ border: '1px solid #e0e3e3', borderRadius: '8px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}><Icon name={dv.icon} style={{ fontSize: '22px', color: '#1b6f6d' }} /><div style={{ fontWeight: '600', fontSize: '13px', color: '#191c1d' }}>{dv.label}</div><div style={{ fontSize: '11px', color: '#6f797a' }}>{dv.sub}</div></div>)}
                  </div>
                </div>
                {/* Dieu khoan */}
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e0e3e3' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#9eaaab', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ĐIỀU KHOẢN HỢP ĐỒNG</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dieuKhoanList.map((dk, i) => <div key={i}><div style={{ fontWeight: '700', fontSize: '13px', color: '#191c1d', marginBottom: '4px' }}>{dk.title}</div><div style={{ fontSize: '13px', color: '#6f797a', lineHeight: '1.6' }}>{dk.content}</div></div>)}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e3e3', backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowChiTiet(false); handleReset(); }} style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#a43c12', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}