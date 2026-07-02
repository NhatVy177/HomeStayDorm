import React, { useState, useEffect } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { hopDongApi } from './hopDong.api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import './lapHopDongTab.css';

const STEPS = [
  { id: 1, label: 'Tra cứu phiếu cọc' },
  { id: 2, label: 'Kiểm tra điều kiện' },
  { id: 3, label: 'Thành viên hợp đồng' },
  { id: 4, label: 'Thông tin & Dịch vụ' },
  { id: 5, label: 'Xác nhận' },
];

function StepIndicator({ current }) {
  return (
    <div className="lhd-stepper">
      {STEPS.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <React.Fragment key={step.id}>
            <div className={`lhd-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <div className="lhd-step-number">
                {done ? <span className="lhd-step-check">✓</span> : step.id}
              </div>
              <span className="lhd-step-label">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`lhd-stepper-line ${done ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function LapHopDongTab() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [ngayTaoFilter, setNgayTaoFilter] = useState('');
  
  // Data lists from API
  const [phieuCocs, setPhieuCocs] = useState([]);
  const [services, setServices] = useState([]);
  const [thanhVien, setThanhVien] = useState([]);
  const [thanhVienValidationResult, setThanhVienValidationResult] = useState([]);
  const [memberSummary, setMemberSummary] = useState(null);
  const [cuTruReview, setCuTruReview] = useState(null);

  // Selection states
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [selectedServices, setSelectedServices] = useState({}); // mapped by MaDichVu -> boolean

  // Form inputs
  const [ngayKy, setNgayKy] = useState(new Date().toISOString().split('T')[0]);
  const [ngayBatDau, setNgayBatDau] = useState('');
  const [ngayKetThuc, setNgayKetThuc] = useState('');
  const [kyTT, setKyTT] = useState('Hàng tháng');
  const [ghiChu, setGhiChu] = useState('');
  const [confirmKH, setConfirmKH] = useState(false);
  const [confirmNV, setConfirmNV] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ ten: '', ngaySinh: '', gioiTinh: 'Nam', cccd: '', sdt: '', email: '', quocTich: 'Việt Nam' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showChiTiet, setShowChiTiet] = useState(false);
  const [savedHD, setSavedHD] = useState(null);

  // Condition check state (Step 2)
  const [dieukienCheck, setDieukienCheck] = useState({ loading: false, hopLe: false, thongBao: '' });

  // Fetch deposit slips on mount & search
  const loadPhieuCocs = async (keyword = '', date = '') => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await hopDongApi.traCuuPhieuCoc(keyword, null, date || null);
      setPhieuCocs(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách phiếu cọc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhieuCocs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadPhieuCocs(searchText, ngayTaoFilter);
  };

  // Load services
  const loadServices = async () => {
    try {
      const res = await hopDongApi.layDanhSachDichVu();
      const data = res.data || [];
      setServices(data);
      // Auto select compulsory services (Điện and Nước)
      const compulsory = {};
      data.forEach(dv => {
        if (dv.batBuoc) {
          compulsory[dv.maDichVu] = true;
        }
      });
      setSelectedServices(prev => ({ ...prev, ...compulsory }));
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Step transitions
  const handleSelectPhieu = async (phieu) => {
    try {
      setLoading(true);
      setErrorMsg('');
      // Fetch full details of selected deposit slip
      const res = await hopDongApi.layChiTietPhieuCoc(phieu.maPhieuDatCoc);
      const details = res.data;
      setSelectedPhieu(details);
      setThanhVien([]);
      setThanhVienValidationResult([]);
      setMemberSummary(null);
      setCuTruReview(null);

      try {
        const cuTruRes = await hopDongApi.layHoSoCuTruDaDuyet(phieu.maPhieuDatCoc);
        const approvedResidence = cuTruRes.data || null;
        const approvedMembers = (approvedResidence?.thanhVien || [])
          .filter((item) => item.trangThaiDuyet === 'Đủ điều kiện')
          .map((item) => ({
            ten: item.ten || item.hoTen,
            hoTen: item.hoTen || item.ten,
            ngaySinh: item.ngaySinh,
            gioiTinh: item.gioiTinh,
            cccd: item.cccd,
            sdt: item.sdt,
            email: item.email,
            quocTich: item.quocTich || 'Việt Nam'
          }));
        setCuTruReview(approvedResidence);
        setThanhVien(approvedMembers);
        setThanhVienValidationResult((approvedResidence?.thanhVien || []).map((item) => ({
          hoTen: item.hoTen || item.ten,
          ngaySinh: item.ngaySinh,
          gioiTinh: item.gioiTinh,
          cccd: item.cccd,
          sdt: item.sdt,
          email: item.email,
          quocTich: item.quocTich,
          trangThaiKiemTra: item.trangThaiDuyet === 'Bị từ chối' ? 'Bị từ chối' : 'Đang ở',
          lyDo: item.lyDoTuChoi
        })));
        setMemberSummary({
          TongThanhVien: approvedResidence?.summary?.tongThanhVien || 0,
          ThanhVienHopLe: approvedResidence?.summary?.soDuDieuKien || 0,
          ThanhVienBiTuChoi: approvedResidence?.summary?.soBiTuChoi || 0,
          KetLuan: approvedResidence?.summary?.coTheTiepTucLapHopDong ? 'Có thể tiếp tục' : 'Không có thành viên hợp lệ'
        });
      } catch {
        // Hồ sơ cư trú chưa duyệt: giữ luồng nhập thành viên thủ công hiện có.
      }
      
      // Auto-set estimated dates based on ThoiGianNhanPhong
      if (details?.thoiGianNhanPhong) {
        const start = new Date(details.thoiGianNhanPhong);
        setNgayBatDau(start.toISOString().split('T')[0]);
        // Set end date to 1 year later by default
        const end = new Date(start);
        end.setFullYear(end.getFullYear() + 1);
        setNgayKetThuc(end.toISOString().split('T')[0]);
      }

      setStep(2);
      // Immediately run conditions check
      setDieukienCheck({ loading: true, hopLe: false, thongBao: '' });
      const checkRes = await hopDongApi.kiemTraDieuKienLapHopDong(phieu.maPhieuDatCoc);
      setDieukienCheck({ loading: false, hopLe: checkRes.data.hopLe, thongBao: checkRes.data.thongBao });
    } catch (err) {
      setDieukienCheck({ loading: false, hopLe: false, thongBao: err.response?.data?.message || 'Lỗi kiểm tra điều kiện.' });
      setErrorMsg(err.response?.data?.message || 'Lỗi lấy chi tiết phiếu cọc.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (maPhieuDatCoc) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await hopDongApi.layChiTietHopDongTheoPhieuCoc(maPhieuDatCoc);
      setSavedHD(res.data);
      setShowChiTiet(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể tải chi tiết hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Continue = async () => {
    if (cuTruReview) {
      const rejectedCount = cuTruReview.summary?.soBiTuChoi || 0;
      if (thanhVien.length === 0) {
        alert('Không còn thành viên đủ điều kiện để lập hợp đồng. Vui lòng dừng thủ tục hoặc yêu cầu cập nhật lại hồ sơ cư trú.');
        return;
      }
      if (rejectedCount > 0) {
        const confirmProceed = window.confirm(
          `Hồ sơ cư trú có ${rejectedCount} thành viên bị từ chối. ` +
          'Bạn có muốn tiếp tục lập hợp đồng với các thành viên còn lại đủ điều kiện không?'
        );
        if (!confirmProceed) {
          handleReset();
          return;
        }
      }
      setStep(4);
      return;
    }

    if (selectedPhieu?.hinhThucThue === 'Nguyên phòng' && thanhVien.length === 0) {
      alert('Thuê nguyên phòng yêu cầu nhập ít nhất 1 thành viên cư trú.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      
      // Check members list using database SP validation logic
      const res = await hopDongApi.kiemTraThanhVienHopDongTam(selectedPhieu.maPhieuDatCoc, thanhVien);
      const result = res.data;
      setThanhVienValidationResult(result.thanhVienValidation || []);
      setMemberSummary(result.summary || null);

      // Verify validation criteria
      if (result.summary) {
        if (result.summary.KetLuan === 'Vượt sức chứa' || result.summary.KetLuan === 'Vượt số giường') {
          alert(`Số thành viên vượt quá giới hạn tối đa (${result.summary.SucChuaToiDa} người/giường). Vui lòng điều chỉnh.`);
          return;
        }
        if (result.summary.KetLuan === 'Không có thành viên hợp lệ' && selectedPhieu?.hinhThucThue === 'Nguyên phòng') {
          alert('Không tìm thấy thành viên cư trú nào hợp lệ. Vui lòng kiểm tra lại thông tin (CCCD, SĐT, Giới tính).');
          return;
        }
      }

      // Check if there are any rejected members
      const hasRejected = result.thanhVienValidation?.some(tv => tv.trangThaiKiemTra === 'Bị từ chối');
      if (hasRejected) {
        const confirmProceed = window.confirm(
          "Phát hiện có thành viên không đủ điều kiện lưu trú (bị từ chối). " +
          "Bạn có muốn tiếp tục lập hợp đồng với các thành viên còn lại đáp ứng điều kiện không?"
        );
        if (!confirmProceed) {
          handleReset();
          return;
        }
      }

      // If validation looks good, proceed to step 4
      setStep(4);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra danh sách thành viên.');
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedPhieu(null);
    setThanhVien([]);
    setThanhVienValidationResult([]);
    setMemberSummary(null);
    setCuTruReview(null);
    setConfirmKH(false);
    setConfirmNV(false);
    setShowSuccessModal(false);
    setSavedHD(null);
    setShowChiTiet(false);
    setGhiChu('');
    // re-fetch fresh list
    loadPhieuCocs(searchText, ngayTaoFilter);
  };

  const handleLuu = async () => {
    if (!confirmKH || !confirmNV) {
      alert('Vui lòng tích chọn xác nhận hợp đồng trước khi lưu.');
      return;
    }

    // Prepare payload
    const selectedDVs = services
      .filter(dv => selectedServices[dv.maDichVu])
      .map(dv => ({ maDichVu: dv.maDichVu, ghiChu: dv.batBuoc ? 'Bắt buộc' : 'Dịch vụ chọn thêm' }));

    const payload = {
      maPhieuDatCoc: selectedPhieu.maPhieuDatCoc,
      ngayBatDau: ngayBatDau,
      ngayKetThuc: ngayKetThuc,
      kyThanhToan: kyTT,
      khachHangDaXacNhan: confirmKH,
      nhanVienDaXacNhan: confirmNV,
      danhSachThanhVien: thanhVien,
      danhSachDichVu: selectedDVs
    };

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await hopDongApi.lapHopDongThue(payload);
      setSavedHD(res.data);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Gặp lỗi khi tạo hợp đồng thuê phòng.');
      alert(err.response?.data?.message || 'Gặp lỗi khi tạo hợp đồng thuê phòng.');
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (name = '') => {
    if (name.includes('Điện')) return 'bolt';
    if (name.includes('Nước')) return 'water_drop';
    if (name.includes('Wifi') || name.includes('Internet')) return 'wifi';
    if (name.includes('Xe')) return 'directions_bike';
    return 'room_service';
  };

  const getCuTruStatusStyle = (status = '') => {
    if (status === 'Đã duyệt cư trú') {
      return { class: 'lhd-badge-success', label: status };
    }
    if (status === 'Chờ duyệt cư trú') {
      return { class: 'lhd-badge-warning', label: 'Chờ quản lý duyệt' };
    }
    if (status === 'Từ chối cư trú') {
      return { class: 'lhd-badge-danger', label: status };
    }
    return { class: 'lhd-badge-muted', label: 'Chưa ghi nhận cư trú' };
  };

  const getContractMembers = () => {
    if (cuTruReview) {
      return thanhVien.map((tv, index) => ({
        ...tv,
        ten: tv.ten || tv.hoTen,
        vaiTro: index === 0 ? 'Chủ hợp đồng' : 'Thành viên'
      }));
    }

    const list = [{ ten: selectedPhieu?.hoTenKhachHang, vaiTro: 'Chủ hợp đồng' }];
    if (selectedPhieu?.hinhThucThue !== 'Ghép giường') {
      thanhVien.forEach(tv => list.push({ ...tv, ten: tv.ten || tv.hoTen, vaiTro: 'Thành viên' }));
    }
    return list;
  };

  // Base price and cost calculation
  const basePrice = selectedPhieu ? selectedPhieu.giaThue : 0;
  const dichVuCost = services
    .filter(dv => selectedServices[dv.maDichVu])
    .reduce((sum, dv) => sum + dv.donGia, 0);
  const totalPrice = basePrice + dichVuCost;

  const formatRentPerMonth = (value) => (
    Number(value || 0) > 0 ? `${Number(value).toLocaleString('vi-VN')}đ/tháng` : '-'
  );

  const renderChiTietModal = () => {
    if (!showChiTiet || !savedHD) return null;

    const closeModal = () => { setShowChiTiet(false); handleReset(); };
    const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '...../...../..........';
    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đồng`;
    const signedDate = savedHD.ngayKyHD ? new Date(savedHD.ngayKyHD) : null;
    const signedDay = signedDate ? signedDate.getDate() : '.....';
    const signedMonth = signedDate ? signedDate.getMonth() + 1 : '.....';
    const signedYear = signedDate ? signedDate.getFullYear() : '..........';
    const daiDienBenA = user?.hoTen || savedHD.daiDienChoThue || '........................';
    const hinhThucThue = savedHD.hinhThucThue || (savedHD.tenPhongDayDu?.includes('Giường') ? 'Ghép giường' : 'Nguyên phòng');
    const soGiuongThue = Number(savedHD.soGiuongThue || savedHD.thanhVien?.length || 1);
    const phamViThue = hinhThucThue === 'Nguyên phòng' ? 'Thuê cả phòng' : `${soGiuongThue} giường`;
    const giaTheoHinhThuc = hinhThucThue === 'Nguyên phòng' ? 'Giá thuê theo phòng' : 'Giá thuê theo giường';
    const kyThanhToan = savedHD.kyThanhToan || 'Hàng tháng';
    const quyDinhHoanCoc = savedHD.quyDinhHoanCoc || [];
    const noiQuyMacDinh = (savedHD.dieuKhoan || []).length > 0 ? savedHD.dieuKhoan : [
      { tieuDeNoiQuy: 'Thanh toán', noiDung: 'Bên thuê thanh toán tiền thuê, tiền dịch vụ đúng kỳ hạn và chịu trách nhiệm với các khoản phát sinh trong thời gian lưu trú.' },
      { tieuDeNoiQuy: 'Bảo quản tài sản', noiDung: 'Bên thuê giữ gìn tài sản, thiết bị, khu vực chung và bồi thường các hư hỏng phát sinh do lỗi sử dụng.' },
      { tieuDeNoiQuy: 'Trật tự lưu trú', noiDung: 'Bên thuê tuân thủ nội quy ký túc xá, không tự ý chuyển nhượng chỗ ở hoặc đưa người chưa đăng ký vào lưu trú.' }
    ];
    const contractRow = (label, value) => (
      <div className="contract-row-item">
        <span>{label}:</span>
        <strong>{value || '........................................'}</strong>
      </div>
    );
    const articleTitle = (index, title) => (
      <h4 style={{ textTransform: 'uppercase' }}>
        ĐIỀU {index}. {title}
      </h4>
    );
    const legalBase = (text) => (
      <p className="contract-legal-base">- {text}</p>
    );

    return (
      <div className="ktp-modal-overlay" onClick={closeModal}>
        <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '980px', maxWidth: '96vw', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>
          <div className="lhd-modal-topbar">
            <div className="lhd-modal-topbar-icon"><Icon name="description" /></div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#191c1d' }}>Bản xem hợp đồng thuê</h3>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6f797a' }}>Mã hợp đồng: {savedHD.maHopDong}</p>
            </div>
            <button 
              onClick={() => window.print()}
              className="lhd-btn lhd-btn-outline" 
              style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}
            >
              <Icon name="print" style={{ fontSize: '18px' }} /> In hợp đồng
            </button>
            <button onClick={closeModal} className="lhd-modal-close-btn"><Icon name="close" style={{ fontSize: '22px' }} /></button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }} className="lhd-print-overlay">
            <article id="print-area-wrapper" className="contract-paper-a4">
              <header style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.01em' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontWeight: '800', display: 'inline-block', borderBottom: '1px solid #111819', padding: '0 14px 3px' }}>Độc lập - Tự do - Hạnh phúc</div>
                <h2 style={{ margin: '42px 0 0', fontSize: '25px', fontWeight: '900', textTransform: 'uppercase', lineHeight: 1.12 }}>HỢP ĐỒNG THUÊ CHỖ Ở NỘI TRÚ</h2>
                <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px' }}>HOMESTAYDORM</div>
                <div style={{ fontSize: '18px', fontStyle: 'italic' }}>Số: {savedHD.maHopDong || '.....'}/HĐ-HSD</div>
              </header>

              <section style={{ marginBottom: '10px' }}>
                {legalBase('Căn cứ Bộ Luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;')}
                {legalBase('Căn cứ nhu cầu thuê chỗ ở của Bên B và khả năng cung cấp chỗ ở của HomeStayDorm;')}
                {legalBase('Căn cứ thông tin đặt cọc, hồ sơ cư trú đã được đối chiếu và kết quả thỏa thuận giữa hai bên.')}
              </section>

              <p>
                Hôm nay, ngày <strong>{signedDay}</strong> tháng <strong>{signedMonth}</strong> năm <strong>{signedYear}</strong>, tại <strong>{savedHD.diaChiChiNhanh || 'HomeStayDorm'}</strong>, hai bên gồm:
              </p>

              <section style={{ marginTop: '8px', marginBottom: '8px' }}>
                <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>BÊN CHO THUÊ (Bên A): {savedHD.benChoThue || 'HomeStayDorm'}</div>
                {contractRow('Tên đơn vị', savedHD.benChoThue)}
                {contractRow('Đại diện', daiDienBenA)}
                {contractRow('Chức vụ', 'Nhân viên sale')}
                {contractRow('Địa chỉ chi nhánh', savedHD.diaChiChiNhanh)}
              </section>
              <section style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>BÊN THUÊ CHỖ Ở (Bên B):</div>
                {contractRow('Họ tên', savedHD.benThue)}
                {contractRow('CCCD/Hộ chiếu', savedHD.cccdBenThue)}
                {contractRow('Mã khách hàng', savedHD.maKhachHang)}
              </section>

              {articleTitle(1, 'Đối tượng và thời hạn thuê')}
              {contractRow('Phòng/giường thuê', savedHD.tenPhongDayDu || savedHD.tenPhong)}
              {contractRow('Hình thức thuê', hinhThucThue)}
              {contractRow('Số giường/phạm vi thuê', phamViThue)}
              {contractRow('Địa chỉ', savedHD.diaChiChiNhanh)}
              {contractRow('Thời hạn thuê', `${savedHD.thoiHanThue || 0} tháng`)}
              {contractRow('Trạng thái ký', savedHD.trangThaiKy)}

              {articleTitle(2, 'Giá thuê, tiền cọc và kỳ thanh toán')}
              <table>
                <tbody>
                  <tr>
                    <td style={{ width: '44%', fontWeight: '700' }}>{giaTheoHinhThuc}</td>
                    <td style={{ fontWeight: '800', color: '#a43c12' }}>{formatMoney(savedHD.giaThueThang)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700' }}>Kỳ thanh toán</td>
                    <td style={{ fontWeight: '800' }}>{kyThanhToan}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: '700' }}>Tiền đặt cọc đã nhận</td>
                    <td style={{ fontWeight: '800', color: '#a43c12' }}>{formatMoney(savedHD.soTienCoc)}</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Bên thuê thanh toán tiền thuê theo kỳ đã thỏa thuận và thực hiện đầy đủ các khoản phí dịch vụ phát sinh trong quá trình lưu trú.
              </p>

              {articleTitle(3, 'Quy định hoàn hoặc khấu trừ tiền cọc')}
              <p>
                Tiền cọc được đối soát theo bảng quy định hoàn cọc đang có hiệu lực, sau đó khấu trừ các khoản còn nợ, chi phí sửa chữa, tiền phạt hoặc nghĩa vụ phát sinh nếu có.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Mã quy định</th>
                    <th>Trường hợp áp dụng</th>
                    <th>Tỷ lệ hoàn cọc</th>
                  </tr>
                </thead>
                <tbody>
                  {quyDinhHoanCoc.length > 0 ? (
                    quyDinhHoanCoc.map((qd) => (
                      <tr key={qd.maQuyDinhHoanCoc}>
                        <td style={{ width: '100px', fontWeight: '700' }}>{qd.maQuyDinhHoanCoc}</td>
                        <td>{qd.tenQuyDinh}</td>
                        <td style={{ width: '130px', fontWeight: '800', color: '#1b6f6d' }}>{Number(qd.tyLeHoanCoc || 0).toLocaleString('vi-VN')}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>
                        Áp dụng theo quy định hoàn cọc hiện hành của ký túc xá tại thời điểm đối soát.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {articleTitle(4, 'Các khoản phí dịch vụ áp dụng')}
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Khoản phí</th>
                    <th>Đơn giá</th>
                    <th>Đơn vị tính</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {(savedHD.dichVu || []).map((dv, i) => (
                    <tr key={i}>
                      <td style={{ width: '54px' }}>{i + 1}</td>
                      <td style={{ fontWeight: '700' }}>{dv.tenDichVu}</td>
                      <td>{formatMoney(dv.donGia)}</td>
                      <td>{dv.donViTinh}</td>
                      <td>Tính theo mức sử dụng hoặc chính sách dịch vụ tại thời điểm thanh toán.</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {articleTitle(5, 'Thành viên cư trú')}
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ tên</th>
                    <th>Vai trò</th>
                    <th>Số điện thoại</th>
                  </tr>
                </thead>
                <tbody>
                  {(savedHD.thanhVien || []).map((tv, i) => (
                    <tr key={i}>
                      <td style={{ width: '54px' }}>{i + 1}</td>
                      <td style={{ fontWeight: '700' }}>{tv.hoTen}</td>
                      <td>{tv.quanHe || 'Thành viên'}</td>
                      <td>{tv.sdt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {articleTitle(6, 'Nội quy lưu trú')}
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                {noiQuyMacDinh.map((dk, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>
                    <strong>{dk.tieuDeNoiQuy}:</strong> {dk.noiDung}
                  </li>
                ))}
              </ol>

              {articleTitle(7, 'Điều khoản xử lý vi phạm')}
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Nếu bên B chậm thanh toán, bên A có quyền nhắc nợ, tạm ngưng dịch vụ không thiết yếu và áp dụng biện pháp xử lý theo quy định của ký túc xá.</li>
                <li style={{ marginBottom: '8px' }}>Nếu bên B tự ý đưa người chưa đăng ký vào ở, chuyển nhượng chỗ ở, gây mất trật tự hoặc vi phạm quy định giới tính/khu vực, bên A có quyền lập biên bản, yêu cầu khắc phục hoặc chấm dứt hợp đồng.</li>
                <li style={{ marginBottom: '8px' }}>Các hư hỏng, mất mát tài sản do lỗi của bên B được bồi thường hoặc khấu trừ vào tiền cọc theo biên bản kiểm kê, bàn giao.</li>
              </ol>

              {articleTitle(8, 'Cam kết chung')}
              <p>
                Hai bên cam kết thực hiện đúng các nội dung đã thỏa thuận trong hợp đồng. Hợp đồng có hiệu lực kể từ ngày ký và là căn cứ để thực hiện các bước thu tiền nhận phòng, bàn giao phòng/giường và quản lý lưu trú.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '42px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', textTransform: 'uppercase' }}>Đại diện bên A</div>
                  <div style={{ color: '#5f6b6c', fontSize: '13px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '74px' }} />
                  <div style={{ fontWeight: '700' }}>{daiDienBenA}</div>
                  <div style={{ color: '#5f6b6c', fontSize: '13px' }}>Nhân viên sale</div>
                </div>
                <div>
                  <div style={{ fontWeight: '800', textTransform: 'uppercase' }}>Bên thuê</div>
                  <div style={{ color: '#5f6b6c', fontSize: '13px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ height: '74px' }} />
                  <div style={{ fontWeight: '700' }}>{savedHD.benThue || '........................'}</div>
                </div>
              </div>
            </article>
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid #d9e2e3', backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={closeModal} className="lhd-btn lhd-btn-primary">Đóng</button>
          </div>
        </div>
      </div>
    );
  };

  /* ─── STEP 1 ─── */
  if (step === 1) return (
    <div className="lhd-container">
      <StepIndicator current={1} />
      
      {errorMsg && (
        <div className="lhd-alert lhd-alert-danger">
          <div className="lhd-alert-icon"><Icon name="error" /></div>
          <div>{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSearch} className="lhd-card" style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '12px', alignItems: 'flex-end', marginBottom: '20px', padding: '16px 20px' }}>
        <div className="lhd-form-group">
          <label className="lhd-label">Tìm kiếm</label>
          <input 
            className="lhd-input" 
            placeholder="Tra cứu theo mã phiếu, tên khách hàng, số điện thoại..." 
            value={searchText} 
            onChange={e => setSearchText(e.target.value)} 
          />
        </div>
        <div className="lhd-form-group">
          <label className="lhd-label">Ngày tạo</label>
          <input 
            type="date" 
            className="lhd-input" 
            value={ngayTaoFilter} 
            onChange={e => setNgayTaoFilter(e.target.value)} 
          />
        </div>
        <button 
          type="submit"
          className="lhd-btn lhd-btn-primary"
          style={{ height: '40px' }}
        >
          {loading ? 'Đang tải...' : 'Áp dụng'}
        </button>
      </form>

      <div className="lhd-table-wrapper">
        <table className="lhd-table">
          <thead>
            <tr>
              <th>PHIẾU CỌC</th>
              <th>KHÁCH HÀNG</th>
              <th>VỊ TRÍ</th>
              <th>THÔNG TIN THUÊ</th>
              <th className="text-center">TRẠNG THÁI</th>
              <th className="text-center">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {phieuCocs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>
                  Không tìm thấy phiếu đặt cọc nào chờ lập hợp đồng.
                </td>
              </tr>
            ) : (
              phieuCocs.map(p => {
                const cuTruStatus = getCuTruStatusStyle(p.trangThaiHoSoCuTru);
                const waitingForResidence = p.trangThaiHoSoCuTru !== 'Đã duyệt cư trú';
                return (
                <tr key={p.maPhieuDatCoc}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--lhd-primary)' }}>{p.maPhieuDatCoc}</div>
                    <div style={{ fontSize: '12px', color: 'var(--lhd-text-muted)' }}>
                      {p.thoiDiemDatCoc ? new Date(p.thoiDiemDatCoc).toLocaleDateString('vi-VN') : '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'var(--lhd-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                        {p.hoTenKhachHang?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--lhd-text)' }}>{p.hoTenKhachHang}</div>
                        <div style={{ fontSize: '12px', color: 'var(--lhd-text-muted)' }}>{p.sdt}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--lhd-text)' }}>{p.viTriThue}</div>
                    <div style={{ fontSize: '12px', color: 'var(--lhd-text-muted)' }}>{p.hinhThucThue}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--lhd-text)' }}>{formatRentPerMonth(p.tongGiaThue ?? p.giaThue)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--lhd-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon name="calendar_today" style={{ fontSize: '12px' }} /> 
                      {p.thoiGianNhanPhong ? new Date(p.thoiGianNhanPhong).toLocaleDateString('vi-VN') : 'Chưa định ngày'}
                    </div>
                  </td>
                  <td className="text-center">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span className={`lhd-badge ${p.coTheLapHopDong ? 'lhd-badge-success' : 'lhd-badge-danger'}`}>
                        {p.trangThaiCoc} ({p.trangThaiThanhToan})
                      </span>
                      <span className={`lhd-badge ${cuTruStatus.class}`}>
                        {cuTruStatus.label}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    {p.coTheLapHopDong ? (
                      <button 
                        className="lhd-btn lhd-btn-primary" 
                        style={{ padding: '7px 16px', fontSize: '13px' }}
                        onClick={() => handleSelectPhieu(p)}
                      >
                        Lập hợp đồng
                      </button>
                    ) : waitingForResidence ? (
                      <button
                        className="lhd-btn"
                        disabled
                        title="Phiếu này phải được quản lý duyệt cư trú trước khi lập hợp đồng."
                        style={{ backgroundColor: '#bec8c9', color: '#fff', padding: '7px 16px', fontSize: '13px', cursor: 'not-allowed' }}
                      >
                        Chờ duyệt cư trú
                      </button>
                    ) : (
                      <button 
                        className="lhd-btn lhd-btn-outline" 
                        style={{ padding: '7px 16px', fontSize: '13px' }}
                        onClick={() => handleViewContract(p.maPhieuDatCoc)}
                      >
                        Xem hợp đồng
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {renderChiTietModal()}
    </div>
  );

  /* ─── STEP 2 ─── */
  if (step === 2) {
    const dieuKienItems = [
      { label: 'Trạng thái phiếu đặt cọc: Hiệu lực', met: selectedPhieu?.trangThaiCoc === 'Hiệu lực' },
      { label: 'Tiền cọc: Đã thanh toán', met: selectedPhieu?.trangThaiThanhToan === 'Đã TT' },
      { label: 'Liên kết dữ liệu: Chưa có hợp đồng liên kết', met: dieukienCheck.hopLe },
      { label: 'Dữ liệu khách hàng: Đủ thông tin (CCCD, SĐT)', met: !!(selectedPhieu?.cccd && selectedPhieu?.sdt) },
      { label: 'Chính sách thương mại: Giá thuê hợp lệ', met: selectedPhieu?.giaThue > 0 }
    ];

    return (
      <div className="lhd-container">
        <StepIndicator current={2} />
        
        {dieukienCheck.loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Đang kiểm tra các điều kiện lập hợp đồng...</p>
          </div>
        ) : (
          <div className="lhd-grid-2">
            <div className="lhd-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--lhd-text)' }}>Thông tin phiếu đặt cọc</h4>
                <span className="lhd-badge lhd-badge-warning">{selectedPhieu?.maPhieuDatCoc}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid var(--lhd-border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lhd-text-muted)' }}>Khách hàng:</span>
                <span style={{ fontWeight: '700', color: 'var(--lhd-text)' }}>{selectedPhieu?.hoTenKhachHang}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid var(--lhd-border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lhd-text-muted)' }}>Phòng thuê:</span>
                <span style={{ fontWeight: '700', color: 'var(--lhd-text)' }}>{selectedPhieu?.viTriThue}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid var(--lhd-border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lhd-text-muted)' }}>Giá thuê:</span>
                <span style={{ fontWeight: '700', color: 'var(--lhd-secondary)' }}>{selectedPhieu?.giaThue?.toLocaleString('vi-VN')}đ/tháng</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid var(--lhd-border-light)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--lhd-text-muted)' }}>Trạng thái cọc:</span>
                <span className={`lhd-badge ${selectedPhieu?.trangThaiCoc === 'Hiệu lực' ? 'lhd-badge-success' : 'lhd-badge-danger'}`}>
                  {selectedPhieu?.trangThaiCoc}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--lhd-text-muted)' }}>Thanh toán cọc:</span>
                <span style={{ fontWeight: '700', color: selectedPhieu?.trangThaiThanhToan === 'Đã TT' ? 'var(--lhd-success)' : 'var(--lhd-secondary)' }}>
                  {selectedPhieu?.trangThaiThanhToan === 'Đã TT' ? 'ĐÃ THANH TOÁN CỌC' : 'CHƯA THANH TOÁN CỌC'}
                </span>
              </div>

              {dieukienCheck.hopLe ? (
                <div className="lhd-alert lhd-alert-success" style={{ marginTop: '4px' }}>
                  <div className="lhd-alert-icon"><Icon name="check" /></div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Đủ điều kiện lập hợp đồng</div>
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{dieukienCheck.thongBao}</div>
                  </div>
                </div>
              ) : (
                <div className="lhd-alert lhd-alert-danger" style={{ marginTop: '4px' }}>
                  <div className="lhd-alert-icon"><Icon name="close" /></div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>Không đủ điều kiện</div>
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>{dieukienCheck.thongBao || 'Vui lòng kiểm tra các mục bên phải.'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="lhd-card">
              <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: 'var(--lhd-text)' }}>Điều kiện lập hợp đồng</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dieuKienItems.map((dk, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f5f7f8', borderRadius: '10px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--lhd-text)' }}>{dk.label}</span>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: dk.met ? 'var(--lhd-success)' : 'var(--lhd-danger)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon name={dk.met ? "check" : "close"} style={{ fontSize: '14px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button className="lhd-btn lhd-btn-outline" onClick={() => setStep(1)}><Icon name="arrow_back" /> Quay lại</button>
          <button
            disabled={!dieukienCheck.hopLe}
            onClick={() => setStep(3)}
            className="lhd-btn lhd-btn-primary"
          >
            Tiếp tục lập hợp đồng <Icon name="arrow_forward" />
          </button>
        </div>
      </div>
    );
  }

  /* ─── STEP 3 ─── */
  if (step === 3) {
    const sucChua = selectedPhieu?.sucChuaToiDa || 1;
    const hinhThucThue = selectedPhieu?.hinhThucThue || 'Ghép giường';
    const rejectedResidenceMembers = (cuTruReview?.thanhVien || []).filter((item) => item.trangThaiDuyet === 'Bị từ chối');
    const totalCount = cuTruReview ? thanhVien.length : 1 + thanhVien.length;
    const residencePrimary = cuTruReview && thanhVien.length > 0
      ? thanhVien[0]
      : {
          ten: selectedPhieu?.hoTenKhachHang,
          hoTen: selectedPhieu?.hoTenKhachHang,
          sdt: selectedPhieu?.sdt,
          cccd: selectedPhieu?.cccd,
          gioiTinh: selectedPhieu?.gioiTinh,
          ngaySinh: selectedPhieu?.ngaySinh,
          quocTich: selectedPhieu?.quocTich
        };
    const formatMemberDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '-';

    return (
      <div className="lhd-container">
        <StepIndicator current={3} />
        
        {hinhThucThue === 'Ghép giường' ? (
          <div className="lhd-card" style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '16px', color: 'var(--lhd-primary)' }}>Xử lý khách đi đơn</h4>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--lhd-text-muted)', lineHeight: '1.6' }}>
              Đối với hình thức thuê <strong>Ghép giường (Khách đi đơn)</strong>, hệ thống lập hợp đồng cho một thành viên cư trú đã đủ điều kiện.
            </p>
            <div style={{ marginTop: '18px', border: '1px solid var(--lhd-border-light)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
              <div style={{ padding: '14px 16px', backgroundColor: '#f5f7f8', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--lhd-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                    {(residencePrimary?.ten || residencePrimary?.hoTen || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--lhd-text)' }}>{residencePrimary?.ten || residencePrimary?.hoTen || '-'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--lhd-text-muted)' }}>Thành viên hợp đồng</div>
                  </div>
                </div>
                <span className="lhd-badge lhd-badge-success">
                  Đủ điều kiện
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', backgroundColor: '#fff' }}>
                {[
                  { label: 'Ngày sinh', value: formatMemberDate(residencePrimary?.ngaySinh) },
                  { label: 'Giới tính', value: residencePrimary?.gioiTinh || '-' },
                  { label: 'Quốc tịch', value: residencePrimary?.quocTich || 'Việt Nam' },
                  { label: 'CCCD/Hộ chiếu', value: residencePrimary?.cccd || 'Chưa cập nhật' },
                  { label: 'Số điện thoại', value: residencePrimary?.sdt || '-' },
                  { label: 'Email', value: residencePrimary?.email || '-' }
                ].map((item) => (
                  <div key={item.label} className="lhd-card" style={{ padding: '12px 14px', boxShadow: 'none', backgroundColor: '#f5f7f8', border: '1px solid var(--lhd-border-light)' }}>
                    <div className="lhd-label" style={{ fontSize: '10px', color: 'var(--lhd-text-muted)', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '14px', color: 'var(--lhd-text)', fontWeight: '700' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: '13px', color: 'var(--lhd-text-muted)' }}>
              * Bạn có thể bấm tiếp tục vì thành viên hợp đồng đã đủ điều kiện ở bước kiểm tra cư trú.
            </p>
          </div>
        ) : (
          <div className="lhd-grid-2" style={{ gridTemplateColumns: '1fr 300px' }}>
            <div className="lhd-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: 'var(--lhd-text)' }}>Danh sách thành viên (Thuê nhóm)</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--lhd-text-muted)' }}>
                    {cuTruReview ? 'Danh sách được lấy từ hồ sơ cư trú đã được quản lý duyệt.' : 'Nhập đầy đủ danh sách các thành viên sẽ lưu trú cùng căn hộ/phòng.'}
                  </p>
                </div>
                {!cuTruReview && (
                  <button 
                    onClick={() => setShowAddMember(true)} 
                    className="lhd-btn lhd-btn-outline"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    <Icon name="person_add" /> Thêm thành viên
                  </button>
                )}
              </div>

              {cuTruReview && (
                <div className="lhd-alert lhd-alert-success" style={{ marginBottom: '16px' }}>
                  <Icon name="fact_check" style={{ fontSize: '20px', marginTop: '1px' }} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Đã duyệt cư trú trước khi lập hợp đồng</div>
                    <div style={{ fontSize: '13px', lineHeight: '1.45' }}>
                      {thanhVien.length} thành viên đủ điều kiện sẽ được đưa vào hợp đồng.
                      {rejectedResidenceMembers.length > 0 ? ` ${rejectedResidenceMembers.length} thành viên bị từ chối sẽ không được ký và không được sắp xếp vào ở.` : ''}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="lhd-table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                <table className="lhd-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Ngày sinh</th>
                      <th>Giới tính</th>
                      <th>CCCD/Hộ chiếu</th>
                      <th>Số điện thoại</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!cuTruReview && (
                      <tr>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--lhd-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="person" style={{ fontSize: '13px' }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--lhd-text)', fontSize: '13px' }}>{selectedPhieu?.hoTenKhachHang}</div>
                              <div style={{ fontSize: '10px', color: 'var(--lhd-primary)', fontWeight: '600' }}>Chủ hợp đồng</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>
                          {selectedPhieu?.ngaySinh ? new Date(selectedPhieu.ngaySinh).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>{selectedPhieu?.gioiTinh}</td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>{selectedPhieu?.cccd}</td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>{selectedPhieu?.sdt}</td>
                        <td className="text-center"><span style={{ fontSize: '11px', color: '#9eaaab' }}>-</span></td>
                      </tr>
                    )}
                    {thanhVien.map((tv, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e0e3e3', color: '#3f494a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="person" style={{ fontSize: '13px' }} />
                            </div>
                            <span style={{ fontWeight: '600', color: 'var(--lhd-text)', fontSize: '13px' }}>{tv.ten}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>
                          {tv.ngaySinh ? new Date(tv.ngaySinh).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>{tv.gioiTinh}</td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>{tv.cccd}</td>
                        <td style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>{tv.sdt}</td>
                        <td className="text-center">
                          {cuTruReview ? (
                            <span className="lhd-badge lhd-badge-success">Đủ điều kiện</span>
                          ) : (
                            <button 
                              onClick={() => setThanhVien(thanhVien.filter((_, idx) => idx !== i))} 
                              className="lhd-btn-text-danger"
                            >
                              <Icon name="delete" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rejectedResidenceMembers.length > 0 && (
                <div style={{ marginTop: '16px', border: '1px solid #efb8b1', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 12px', backgroundColor: '#fff3f1', color: '#9b1c1c', fontSize: '13px', fontWeight: '800' }}>
                    Thành viên không được tham gia ký hợp đồng
                  </div>
                  {rejectedResidenceMembers.map((tv, index) => (
                    <div key={tv.maThanhVienCuTru || index} style={{ padding: '10px 12px', borderTop: '1px solid #f3d0ca', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--lhd-text)', fontSize: '13px' }}>{tv.hoTen || tv.ten}</span>
                      <span style={{ color: '#9b1c1c', fontSize: '13px', textAlign: 'right' }}>{tv.lyDoTuChoi || 'Không đáp ứng điều kiện cư trú'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="lhd-capacity-card">
                <div className="lhd-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginBottom: '12px' }}>TÓM TẮT THÀNH VIÊN</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', opacity: 0.9 }}>Số người ở:</span>
                  <span style={{ fontSize: '28px', fontWeight: '800' }}>{totalCount}<span style={{ fontSize: '16px', opacity: 0.7 }}>/{sucChua}</span></span>
                </div>
                <div className="lhd-progress-track">
                  <div 
                    className={`lhd-progress-bar ${totalCount > sucChua ? 'error' : ''}`}
                    style={{ width: `${Math.min((totalCount / sucChua) * 100, 100)}%` }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px' }}>
                  <span style={{ opacity: 0.85 }}>Sức chứa tối đa:</span>
                  <span style={{ fontWeight: '700' }}>{sucChua} người</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '8px', alignItems: 'center' }}>
                  <span style={{ opacity: 0.85 }}>Giới tính cho phép:</span>
                  <span style={{ backgroundColor: 'var(--lhd-white)', color: 'var(--lhd-primary)', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{selectedPhieu?.gioiTinhChoPhep}</span>
                </div>
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', opacity: 0.85, lineHeight: '1.5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Icon name="info" style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }} />
                  Giới tính các thành viên phải tuân thủ giới tính cho phép của phòng.
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button className="lhd-btn lhd-btn-outline" onClick={() => setStep(2)}><Icon name="arrow_back" /> Quay lại</button>
          <button
            onClick={hinhThucThue === 'Ghép giường' && !cuTruReview ? () => setStep(4) : handleStep3Continue}
            className="lhd-btn lhd-btn-primary"
          >
            Tiếp tục <Icon name="arrow_forward" />
          </button>
        </div>

        {showAddMember && (
          <div className="ktp-modal-overlay" onClick={() => setShowAddMember(false)}>
            <div className="ktp-modal" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
              <div className="ktp-modal-header">
                <h3 style={{ margin: 0, fontSize: '16px', color: '#191c1d' }}>Thêm thành viên</h3>
                <button className="ktp-modal-close" onClick={() => setShowAddMember(false)}><Icon name="close" /></button>
              </div>
              <div className="ktp-modal-body" style={{ padding: '20px', display: 'block' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="lhd-form-group">
                    <label className="lhd-label">Họ và tên *</label>
                    <input className="lhd-input" type="text" placeholder="Nguyễn Văn A" value={newMember.ten} onChange={e => setNewMember({ ...newMember, ten: e.target.value })} />
                  </div>
                  <div className="lhd-form-group">
                    <label className="lhd-label">Ngày sinh</label>
                    <input className="lhd-input" type="date" value={newMember.ngaySinh} onChange={e => setNewMember({ ...newMember, ngaySinh: e.target.value })} />
                  </div>
                  <div className="lhd-form-group">
                    <label className="lhd-label">CCCD/Hộ chiếu *</label>
                    <input className="lhd-input" type="text" placeholder="Số CCCD" value={newMember.cccd} onChange={e => setNewMember({ ...newMember, cccd: e.target.value })} />
                  </div>
                  <div className="lhd-form-group">
                    <label className="lhd-label">Số điện thoại *</label>
                    <input className="lhd-input" type="text" placeholder="Số điện thoại" value={newMember.sdt} onChange={e => setNewMember({ ...newMember, sdt: e.target.value })} />
                  </div>
                  <div className="lhd-form-group">
                    <label className="lhd-label">Email</label>
                    <input className="lhd-input" type="email" placeholder="Email (nếu có)" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
                  </div>
                  <div className="lhd-form-group">
                    <label className="lhd-label">Giới tính</label>
                    <select className="lhd-input" value={newMember.gioiTinh} onChange={e => setNewMember({ ...newMember, gioiTinh: e.target.value })}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="ktp-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="lhd-btn lhd-btn-outline" onClick={() => setShowAddMember(false)}>Hủy</button>
                <button 
                  className="lhd-btn lhd-btn-primary" 
                  onClick={() => { 
                    if (newMember.ten && newMember.cccd && newMember.sdt) { 
                      setThanhVien([...thanhVien, newMember]); 
                      setNewMember({ ten: '', ngaySinh: '', gioiTinh: 'Nam', cccd: '', sdt: '', email: '', quocTich: 'Việt Nam' }); 
                      setShowAddMember(false); 
                    } else {
                      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
                    }
                  }}
                >
                  <Icon name="person_add" /> Thêm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── STEP 4 ─── */
  if (step === 4) return (
    <div className="lhd-container">
      <StepIndicator current={4} />
      <div className="lhd-grid-2" style={{ gridTemplateColumns: '1fr 320px' }}>
        <div className="lhd-card">
          <h4 className="lhd-card-title">
            <Icon name="description" /> Thông tin hợp đồng
          </h4>
          <div className="lhd-grid-form" style={{ marginTop: '20px' }}>
            <div className="lhd-form-group"><label className="lhd-label">Mã phiếu cọc</label><input className="lhd-input" value={selectedPhieu?.maPhieuDatCoc || ''} readOnly /></div>
            <div className="lhd-form-group"><label className="lhd-label">Khách hàng</label><input className="lhd-input" value={selectedPhieu?.hoTenKhachHang || ''} readOnly /></div>
            <div className="lhd-form-group"><label className="lhd-label">Phòng/Giường</label><input className="lhd-input" value={selectedPhieu?.viTriThue || ''} readOnly /></div>
            <div className="lhd-form-group">
              <label className="lhd-label">Kỳ thanh toán</label>
              <select className="lhd-input" value={kyTT} onChange={e => setKyTT(e.target.value)}>
                <option value="Hàng tháng">Hàng tháng</option>
                <option value="Hàng quý">Hàng quý</option>
              </select>
            </div>
            <div className="lhd-form-group"><label className="lhd-label">Ngày ký</label><input type="date" className="lhd-input" value={ngayKy} onChange={e => setNgayKy(e.target.value)} /></div>
            <div className="lhd-form-group"><label className="lhd-label">Giá thuê niêm yết</label><div style={{ position: 'relative' }}><input className="lhd-input" value={basePrice?.toLocaleString('vi-VN') || 0} readOnly style={{ paddingRight: '50px' }} /><span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--lhd-text-muted)', fontWeight: '600' }}>VND</span></div></div>
            <div className="lhd-form-group"><label className="lhd-label">Ngày bắt đầu</label><input type="date" className="lhd-input" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} /></div>
            <div className="lhd-form-group"><label className="lhd-label">Ngày kết thúc (Dự kiến)</label><input type="date" className="lhd-input" value={ngayKetThuc} onChange={e => setNgayKetThuc(e.target.value)} /></div>
            <div className="lhd-form-group" style={{ gridColumn: '1/-1' }}><label className="lhd-label">Ghi chú hợp đồng</label><textarea className="lhd-input" rows={3} placeholder="Nhập các thỏa thuận riêng hoặc yêu cầu đặc biệt..." value={ghiChu} onChange={e => setGhiChu(e.target.value)} style={{ resize: 'vertical' }} /></div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="lhd-card">
            <h4 className="lhd-card-title">
              <Icon name="electric_bolt" /> Dịch vụ đăng ký
            </h4>
            <div className="service-select-grid" style={{ marginTop: '16px' }}>
              {services.map(dv => (
                <label key={dv.maDichVu} className={`service-select-card ${selectedServices[dv.maDichVu] ? 'selected' : ''} ${dv.batBuoc ? 'compulsory' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={!!selectedServices[dv.maDichVu]} 
                    disabled={dv.batBuoc} // Cannot uncheck compulsory
                    onChange={e => setSelectedServices({ ...selectedServices, [dv.maDichVu]: e.target.checked })} 
                  />
                  <div className="service-card-info">
                    <div className="service-card-title">
                      {dv.tenDichVu} {dv.batBuoc && <span className="service-card-tag">Bắt buộc</span>}
                    </div>
                    <div className="service-card-desc">Áp dụng hợp đồng</div>
                  </div>
                  <div className="service-card-price">
                    <div className="service-price-value">{dv.donGia?.toLocaleString('vi-VN')}đ</div>
                    <div className="service-price-unit">/ {dv.donViTinh}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="lhd-card" style={{ padding: '16px' }}>
            <div className="lhd-label" style={{ marginBottom: '10px' }}>THÀNH VIÊN CƯ TRÚ ({getContractMembers().length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {getContractMembers().map((tv, i) => (
                <div key={i} style={{ fontSize: '13px', color: i === 0 ? 'var(--lhd-text)' : 'var(--lhd-text-muted)' }}>{i + 1}. {tv.ten}</div>
              ))}
            </div>
          </div>
          
          <div className="lhd-capacity-card">
            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, marginBottom: '6px' }}>DỰ TÍNH PHÍ HÀNG THÁNG</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>{totalPrice?.toLocaleString('vi-VN') || 0} VND</div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '4px' }}>* Đã bao gồm các dịch vụ đăng ký cố định</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
        <button className="lhd-btn lhd-btn-outline" onClick={() => setStep(3)}><Icon name="arrow_back" /> Quay lại</button>
        <button className="lhd-btn lhd-btn-primary" onClick={() => setStep(5)}>Tiếp tục <Icon name="arrow_forward" /></button>
      </div>
    </div>
  );

  /* ─── STEP 5 ─── */
  if (step === 5) {
    const activeServices = services.filter(dv => selectedServices[dv.maDichVu]);
    const allTV = getContractMembers();

    return (
      <div className="lhd-container">
        <StepIndicator current={5} />
        
        {loading && <div style={{ textAlign: 'center', padding: '20px', fontWeight: '600' }}>Đang lưu hợp đồng... Vui lòng đợi.</div>}

        <div className="lhd-grid-2" style={{ gridTemplateColumns: '1fr 300px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="lhd-card">
              <h4 className="lhd-card-title">
                <Icon name="description" /> Thông tin hợp đồng
              </h4>
              <div className="lhd-grid-form" style={{ marginTop: '20px' }}>
                {[{ l: 'Mã hợp đồng (Dự kiến)', v: 'Tự động sinh' }, 
                  { l: 'Ngày lập', v: new Date(ngayKy).toLocaleDateString('vi-VN') }, 
                  { l: 'Chủ hợp đồng', v: selectedPhieu?.hoTenKhachHang, s: 'lg' }, 
                  { l: 'Căn hộ / Phòng', v: 'Phòng ' + selectedPhieu?.viTriThue, s: 'lg' }, 
                  { l: 'Thời hạn thuê', v: `${new Date(ngayBatDau).toLocaleDateString('vi-VN')} - ${new Date(ngayKetThuc).toLocaleDateString('vi-VN')}` }, 
                  { l: 'Giá thuê hàng tháng', v: basePrice?.toLocaleString('vi-VN') + ' VND', c: 'var(--lhd-secondary)', s: 'lg' }
                ].map((f, i) => (
                  <div key={i} className="lhd-form-group">
                    <div className="lhd-label" style={{ marginBottom: '4px' }}>{f.l}</div>
                    <div style={{ fontWeight: '750', fontSize: f.s === 'lg' ? '15px' : '14px', color: f.c || 'var(--lhd-text)' }}>{f.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: '#f5f7f8', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--lhd-text-muted)' }}>Khoản tiền cọc đã nhận:</span>
                <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--lhd-text)' }}>{selectedPhieu?.soTienCoc?.toLocaleString('vi-VN')} VND</span>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <span className="lhd-badge lhd-badge-success">Đã thanh toán cọc</span>
              </div>
            </div>

            <div className="lhd-card">
              <h4 className="lhd-card-title">
                <Icon name="description" /> Thành viên & Dịch vụ
              </h4>
              <div style={{ marginBottom: '20px', marginTop: '16px' }}>
                <div className="lhd-label" style={{ marginBottom: '10px' }}>DỊCH VỤ ĐĂNG KÝ</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activeServices.map(dv => (
                    <span key={dv.maDichVu} className="lhd-badge lhd-badge-success" style={{ borderRadius: '20px' }}>
                      <Icon name={getServiceIcon(dv.tenDichVu)} style={{ fontSize: '14px' }} /> 
                      {dv.tenDichVu} ({dv.donGia?.toLocaleString('vi-VN')}đ)
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="lhd-label" style={{ marginBottom: '10px' }}>THÀNH VIÊN CƯ TRÚ ({allTV.length})</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                  {allTV.map((tv, i) => (
                    <div key={i} style={{ backgroundColor: '#f5f7f8', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--lhd-border-light)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: i === 0 ? 'var(--lhd-primary)' : 'var(--lhd-secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                        {tv.ten?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--lhd-text)' }}>{tv.ten}</div>
                        <div style={{ fontSize: '11px', color: 'var(--lhd-text-muted)' }}>{tv.vaiTro}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ position: 'sticky', top: '20px', alignSelf: 'start' }}>
            <div className="lhd-card">
              <h4 className="lhd-card-title">
                <Icon name="fact_check" /> Xác nhận hợp đồng
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
                <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={confirmKH} onChange={e => setConfirmKH(e.target.checked)} style={{ accentColor: 'var(--lhd-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--lhd-text-muted)', lineHeight: '1.5' }}>Khách hàng đã kiểm tra thông tin và đồng ý ký hợp đồng</span>
                </label>
                <label style={{ display: 'flex', gap: '10px', cursor: 'pointer', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={confirmNV} onChange={e => setConfirmNV(e.target.checked)} style={{ accentColor: 'var(--lhd-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--lhd-text-muted)', lineHeight: '1.5' }}>Nhân viên Sale xác nhận thông tin hợp đồng là chính xác</span>
                </label>
              </div>
              <button 
                onClick={handleLuu} 
                disabled={!confirmKH || !confirmNV || loading} 
                className="lhd-btn lhd-btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '10px' }}
              >
                <Icon name="save" /> {loading ? 'Đang xử lý...' : 'Lập hợp đồng thuê'}
              </button>
              <button onClick={() => setStep(4)} className="lhd-btn lhd-btn-outline" style={{ width: '100%', marginBottom: '10px' }}><Icon name="arrow_back" /> Quay lại</button>
              <button onClick={handleReset} className="lhd-btn-text-danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Icon name="delete" /> Hủy lập hợp đồng</button>
              <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'var(--lhd-primary-soft)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--lhd-primary)', fontWeight: '600' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--lhd-primary)', flexShrink: 0, display: 'inline-block' }}></span>
                Dữ liệu đã được kiểm chứng trên hệ thống
              </div>
            </div>
          </div>
        </div>

        {/* Modal thanh cong */}
        {showSuccessModal && savedHD && (
          <div className="ktp-modal-overlay">
            <div className="lhd-success-modal">
              <div className="lhd-success-icon-wrap"><Icon name="check" style={{ fontSize: '32px' }} /></div>
              <h3 className="lhd-success-title">Lập hợp đồng thuê thành công</h3>
              <p className="lhd-success-text">Hệ thống đã ghi nhận và lưu trữ thông tin hợp đồng vào cơ sở dữ liệu.</p>
              <div style={{ backgroundColor: '#f5f7f8', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--lhd-border-light)' }}>
                {[{ label: 'MÃ HỢP ĐỒNG', value: savedHD.maHopDong, bold: true }, { label: 'KHÁCH HÀNG', value: savedHD.benThue }, { label: 'PHÒNG', value: savedHD.tenPhongDayDu }, { label: 'TRẠNG THÁI', badge: savedHD.trangThaiKy }].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span className="lhd-label" style={{ fontSize: '11px' }}>{row.label}</span>
                    {row.badge ? <span className="lhd-badge lhd-badge-success">{row.badge}</span> : <span style={{ fontWeight: row.bold ? '700' : '600', color: 'var(--lhd-text)' }}>{row.value}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="lhd-btn lhd-btn-secondary"
                  style={{ width: '100%', padding: '12px' }} 
                  onClick={handleReset}
                >
                  <Icon name="list" /> Quay lại trang quản lý
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setShowSuccessModal(false); setShowChiTiet(true); }} className="lhd-btn lhd-btn-outline" style={{ flex: 1, padding: '10px' }}><Icon name="description" /> Xem hợp đồng</button>
                  <button onClick={handleReset} className="lhd-btn lhd-btn-outline" style={{ flex: 1, padding: '10px' }}><Icon name="list" /> Danh sách phiếu</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderChiTietModal()}
      </div>
    );
  }

  return null;
}
