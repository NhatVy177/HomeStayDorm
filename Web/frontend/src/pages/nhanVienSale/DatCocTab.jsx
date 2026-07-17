import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icon } from '../nhanVienKeToan/LapPhieuDatCocTab.jsx';
import { datCocApi } from '../datCoc/datCoc.api.js';
import { dangKyThueApi } from '../dangKyThue/dangKyThue.api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import ResultModal from '../../components/common/ResultModal.jsx';
import SoNguoiBadge from '../../components/common/SoNguoiBadge.jsx';
import StatusFilterTabs from '../../components/common/StatusFilterTabs.jsx';
import LapPhieuCocTab from './LapPhieuCocTab.jsx';

// Hiển thị phòng/giường gọn theo dữ liệu trả về từ SP_DanhSachDatCocSale.
// 1 phiếu = 1 phòng -> bảng chỉ cần tên phòng; mã giường là chi tiết, xem trong modal.
const moTaPhong = (item) => item.tenPhong || item.maPhong || '—';

const formatTien = (v) => (v == null || v === '' || isNaN(Number(v)) ? '' : Number(v).toLocaleString('vi-VN'));
const formatHan = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
};
const formatNgay = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};
// Đường dẫn công khai tới file chứng từ (DB chỉ lưu path dạng /uploads/...).
const fileChungTuUrl = (path) =>
  `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${path}`;

// dd/mm/yyyy không kèm giờ, dùng cho bản in biên nhận (— nếu rỗng).
const ngayDMY = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const namSinhOf = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : String(d.getFullYear());
};
// Đọc số tiền VND ra chữ (đủ dùng cho mức tiền cọc hàng triệu/tỷ).
const docSoTienVN = (so) => {
  so = Math.round(Number(so) || 0);
  if (so === 0) return 'Không';
  const cs = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const dv = ['', 'nghìn', 'triệu', 'tỷ'];
  const doc3 = (n, full) => {
    const tram = Math.floor(n / 100), chuc = Math.floor((n % 100) / 10), donv = n % 10;
    let s = '';
    if (full || tram > 0) s += cs[tram] + ' trăm';
    if (chuc > 1) {
      s += ' ' + cs[chuc] + ' mươi';
      if (donv === 1) s += ' mốt'; else if (donv === 5) s += ' lăm'; else if (donv > 0) s += ' ' + cs[donv];
    } else if (chuc === 1) {
      s += ' mười';
      if (donv === 5) s += ' lăm'; else if (donv > 0) s += ' ' + cs[donv];
    } else if (donv > 0) {
      if (full || tram > 0) s += ' lẻ';
      s += ' ' + cs[donv];
    }
    return s.trim();
  };
  const nhom = [];
  while (so > 0) { nhom.unshift(so % 1000); so = Math.floor(so / 1000); }
  const len = nhom.length;
  let s = '';
  for (let i = 0; i < len; i++) {
    if (nhom[i] === 0) continue;
    s += (s ? ' ' : '') + doc3(nhom[i], i > 0 && s !== '') + (dv[len - 1 - i] ? ' ' + dv[len - 1 - i] : '');
  }
  s = s.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Nguồn cấu hình DUY NHẤT cho từng trạng thái phiếu đăng ký: nhãn chip, nhãn badge,
// màu badge và loại nút thao tác. Thêm/sửa trạng thái chỉ cần đụng ở đây.
const STATUS_CONFIG = {
  'Đã tiếp nhận':     { chip: 'Chờ gửi',    badgeLabel: 'Chờ gửi',           badge: { bg: '#fff4e5', fg: '#b45309' }, action: 'gui' },
  'Chờ xác nhận cọc': { chip: 'Chờ duyệt',  badgeLabel: 'Chờ quản lý duyệt', badge: { bg: '#e8f1ff', fg: '#1d4ed8' }, action: 'chi-tiet' },
  'Xác nhận cọc':     { chip: 'Đã duyệt',   badgeLabel: 'Đã duyệt',          badge: { bg: '#e6f6ec', fg: '#15803d' }, action: 'chi-tiet' },
  'Từ chối':          { chip: 'Bị từ chối', badgeLabel: 'Bị từ chối',        badge: { bg: '#fdecec', fg: '#b91c1c' }, action: 'ly-do' },
};
// Thứ tự ưu tiên xử lý (việc cần làm trước lên đầu) — dùng cho chip lọc.
const STATUS_ORDER = ['Đã tiếp nhận', 'Chờ xác nhận cọc', 'Xác nhận cọc', 'Từ chối'];

const StatusBadge = ({ trangThai }) => {
  const cfg = STATUS_CONFIG[trangThai];
  const s = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg ? cfg.badgeLabel : trangThai}
    </span>
  );
};

const khacGioiOf = (item) => (Number(item.soNam) || 0) > 0 && (Number(item.soNu) || 0) > 0;

// Cấu hình trạng thái thanh toán (DC04 - ghi nhận chứng từ)
const CT_STATUS_CONFIG = {
  'Chờ TT':  { chip: 'Chờ thanh toán', badgeLabel: 'Chờ TT',  badge: { bg: '#fff4e5', fg: '#b45309' } },
  'Đã TT':   { chip: 'Đã thanh toán',  badgeLabel: 'Đã TT',   badge: { bg: '#e6f6ec', fg: '#15803d' } },
  'Hết hạn': { chip: 'Hết hạn',        badgeLabel: 'Hết hạn', badge: { bg: '#fdecec', fg: '#b91c1c' } },
};
const CT_STATUS_ORDER = ['Chờ TT', 'Đã TT', 'Hết hạn'];
const CtBadge = ({ trangThai }) => {
  const cfg = CT_STATUS_CONFIG[trangThai];
  const s = cfg ? cfg.badge : { bg: '#eef2f3', fg: '#3f494a' };
  return (
    <span style={{ background: s.bg, color: s.fg, padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg ? cfg.badgeLabel : (trangThai || '—')}
    </span>
  );
};

const PAGE_SIZE = 10;
const pageBtnStyle = (active, disabled) => ({
  minWidth: '34px', height: '34px', padding: '0 10px', borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  border: active ? '1px solid #2f6765' : '1px solid #d7dcdc',
  background: active ? '#2f6765' : '#fff',
  color: active ? '#fff' : (disabled ? '#c4c7c8' : '#3f494a'),
  fontSize: '13px', fontWeight: 600
});

export default function DatCocTab() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('gui-yeu-cau');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  // A4 - chỉnh sửa thông tin cá nhân/liên hệ/giấy tờ khách hàng trước khi gửi yêu cầu.
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ hoTen: '', ngaySinh: '', gioiTinh: '', soDienThoai: '', email: '', cccd: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  // E4 - từ chối hồ sơ khi khách yêu cầu thay đổi vượt phạm vi (đổi phòng/hình thức thuê...).
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [lyDoTuChoi, setLyDoTuChoi] = useState('');
  const [rejecting, setRejecting] = useState(false);
  // Lọc theo trạng thái (segmented control) + modal xem chi tiết / lý do từ chối.
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailItem, setDetailItem] = useState(null);
  // Tìm kiếm (client-side). Không còn lọc theo ngày: danh sách chỉ gồm phiếu TRONG NGÀY
  // (SP_DanhSachDatCocSale đã lọc), nên cũng không cần bộ chọn sắp xếp.
  const [search, setSearch] = useState('');

  // DC01 - Sale chốt phòng khách muốn thuê (trong các phòng khách đã xem)
  const [phongDaXem, setPhongDaXem] = useState([]);
  const [loadingPhong, setLoadingPhong] = useState(false);
  const [phongChot, setPhongChot] = useState('');   // maPhong đang chốt
  const [savingPhong, setSavingPhong] = useState(false);

  // Tầng GUI - HienThi(): tải danh sách hồ sơ "Đã tiếp nhận" cần gửi yêu cầu đặt cọc.
  const [yeuCauList, setYeuCauList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Popup thông báo kết quả (thành công/thất bại) thay cho alert()
  const [result, setResult] = useState(null); // { type, title, message }

  // DC04 - Ghi nhận chứng từ thanh toán cọc
  const [chungTuList, setChungTuList] = useState([]);
  const [loadingCT, setLoadingCT] = useState(false);
  const [ctError, setCtError] = useState('');
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [ctFile, setCtFile] = useState(null); // File object mới chọn để upload
  const [ctExistingFileName, setCtExistingFileName] = useState(''); // Tên file chứng từ đã có trước đó
  const fileInputRef = useRef(null);
  const [ctPhuongThuc, setCtPhuongThuc] = useState('');
  const [initialPhuongThuc, setInitialPhuongThuc] = useState('');

  // Tìm kiếm + chip trạng thái + phân trang cho tab chứng từ (DC04) — đã bỏ bộ chọn sắp xếp
  const [ctStatus, setCtStatus] = useState('Chờ TT'); // mặc định nhóm cần xử lý
  const [ctSearch, setCtSearch] = useState('');
  const [ctPage, setCtPage] = useState(1);
  const [ctDetail, setCtDetail] = useState(null);

  const loadChungTu = useCallback(async () => {
    setLoadingCT(true);
    setCtError('');
    try {
      const { data } = await datCocApi.getDanhSachChoGhiNhanChungTu();
      setChungTuList(data || []);
    } catch (err) {
      setCtError(err.response?.data?.message || 'Không tải được danh sách phiếu cọc');
    } finally {
      setLoadingCT(false);
    }
  }, []);

  const handleChonPhuongThuc = async (phuongThuc) => {
    if (!selectedPhieu) return;
    setSubmitting(true);
    try {
      await datCocApi.chonPhuongThuc(selectedPhieu.maPhieuDatCoc, { phuongThucThanhToan: phuongThuc });
      setCtPhuongThuc(phuongThuc);
      setSelectedPhieu((prev) => ({ ...prev, phuongThucThanhToan: phuongThuc }));
      await loadChungTu();
    } catch {
      setResult({ type: 'error', title: 'Không chọn được phương thức thanh toán.' });
    } finally {
      setSubmitting(false);
    }
  };

  // DC04 (A4) - In "Giấy biên nhận đặt cọc thuê nhà" để khách & Sale ký (dùng khi thu tiền mặt).
  // Điền tự động từ dữ liệu phiếu (chữ đen); trường chưa có trong CSDL để trống điền tay.
  const handleInPhieuDatCoc = () => {
    if (!selectedPhieu) return;
    const p = selectedPhieu;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const soTien = formatTien(p.soTienCoc) || '0';
    const bangChu = docSoTienVN(p.soTienCoc);
    const diaChiNha = [p.diaChiChiNhanh, p.tenChiNhanh].filter(Boolean).join(' - ');
    const phong = moTaPhong(p);
    const now = new Date();
    const pp = (n) => String(n).padStart(2, '0');
    const blank = (val, w = 60) => (val ? `<span class="fill">${val}</span>` : `<span class="blank" style="min-width:${w}px"></span>`);
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
      <title>Giấy biên nhận đặt cọc - ${p.maPhieuDatCoc}</title>
      <style>
        /* Lề trang = 0 để trình duyệt không vẽ header/footer mặc định (ngày, tiêu đề, URL, số trang)
           trong vùng lề; lề thật của văn bản chuyển vào padding của body. */
        @page { size: A4; margin: 0; }
        body { font-family: 'Times New Roman', serif; color: #000; font-size: 14px; line-height: 1.55; margin: 0; padding: 18mm; }
        .center { text-align: center; }
        .nation { font-weight: 700; } .motto { font-weight: 700; font-size: 13px; }
        .rule { width: 150px; height: 1px; background: #000; margin: 5px auto 14px; }
        h3 { text-align: center; font-size: 19px; margin: 6px 0 2px; }
        .co { text-align: center; font-weight: 700; margin-bottom: 14px; }
        .sec { font-weight: 700; text-decoration: underline; margin-top: 12px; }
        .frow { margin: 3px 0; }
        .lab { display: inline-block; min-width: 160px; }
        .fill { font-weight: 400; }
        .money { font-weight: 700; color: #000; }
        .blank { display: inline-block; border-bottom: 1px dotted #555; }
        .signs { display: flex; justify-content: space-around; margin-top: 30px; text-align: center; }
        .signs .col b { display: block; } .signs .col i { font-size: 12px; }
        .signs .col .space { height: 70px; }
      </style></head><body>
      <div class="center nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
      <div class="center motto">Độc lập – Tự do – Hạnh phúc</div>
      <div class="rule"></div>
      <h3>GIẤY BIÊN NHẬN ĐẶT CỌC THUÊ NHÀ</h3>
      <div class="co">HOMESTAYDORM · Số: ${p.maPhieuDatCoc}/BN-HSD</div>
      <div class="frow">Hôm nay, ngày ${pp(now.getDate())}/${pp(now.getMonth() + 1)}/${now.getFullYear()}, tại: ${blank(diaChiNha, 240)}</div>
      <div class="frow">Chúng tôi gồm:</div>
      <div class="sec">BÊN ĐẶT CỌC (BÊN A):</div>
      <div class="frow"><span class="lab">Họ và tên</span>: ${blank(p.hoTen, 180)} — Sinh năm: ${blank(namSinhOf(p.ngaySinh), 60)}</div>
      <div class="frow"><span class="lab">CMND/CCCD số</span>: ${blank(p.cccd, 130)} do <span class="blank" style="min-width:150px"></span> cấp ngày <span class="blank" style="min-width:90px"></span></div>
      <div class="frow"><span class="lab">Địa chỉ thường trú</span>: <span class="blank" style="min-width:300px"></span></div>
      <div class="frow"><span class="lab">Số điện thoại</span>: ${blank(p.soDienThoai, 130)}</div>
      <div class="sec">BÊN NHẬN CỌC (BÊN B):</div>
      <div class="frow"><span class="lab">Đơn vị</span>: <span class="fill">CÔNG TY TNHH HOMESTAYDORM</span></div>
      <div class="frow"><span class="lab">Đại diện</span>: ${blank(user?.hoTen, 180)}</div>
      <div class="frow"><span class="lab">Số điện thoại</span>: ${blank(p.sdtChiNhanh, 130)}</div>
      <div class="frow" style="margin-top:12px">Bên B nhận của bên A số tiền đặt cọc: <span class="money">${soTien}</span> đồng (bằng chữ: <span class="fill">${bangChu}</span> đồng) để thuê ${blank(phong, 150)} tại: ${blank(diaChiNha, 220)}.</div>
      <div class="frow">Bên B giữ chỗ cho bên A đến ngày ${blank(ngayDMY(p.thoiHanThanhToan), 100)}; trong thời gian đó hai bên tiến hành ký hợp đồng thuê.</div>
      <div class="frow">Ngày dự kiến ký hợp đồng / nhận phòng: ${blank(ngayDMY(p.thoiGianNhanPhong), 100)}.</div>
      <div class="frow" style="margin-top:8px;font-size:13px">Hai bên cam kết minh mẫn, tự nguyện; bên B đã nhận đủ số tiền trên. Biên bản lập thành 02 bản có giá trị pháp lý như nhau.</div>
      <div class="signs">
        <div class="col"><b>BÊN A</b><i>(ký, ghi rõ họ tên)</i><div class="space"></div>${p.hoTen || ''}</div>
        <div class="col"><b>BÊN B</b><i>(ký, ghi rõ họ tên)</i><div class="space"></div>${user?.hoTen || ''}</div>
      </div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // DC04 - btnGhiNhan_Click(): gửi minh chứng -> capNhatMinhChung -> SP_CapNhatMinhChungThanhToanCoc.
  const handleGhiNhanChungTu = async () => {
    if (!selectedPhieu) return;
    if (!ctPhuongThuc) {
      setResult({ type: 'error', title: 'Chưa chọn phương thức thanh toán.' });
      return;
    }
    if (ctExistingFileName && !ctFile) {
      setResult({ type: 'error', title: 'Chưa tải lên chứng từ mới.' });
      return;
    }
    if (!ctFile) {
      setResult({ type: 'error', title: 'Chưa có chứng từ.' });
      return;
    }
    setSubmitting(true);
    try {
      // Gửi multipart: chỉ file chứng từ (ảnh/PDF). DB chỉ lưu ĐƯỜNG DẪN file.
      const fd = new FormData();
      fd.append('file', ctFile);
      await datCocApi.capNhatMinhChung(selectedPhieu.maPhieuDatCoc, fd);
      setShowUploadModal(false);
      setSelectedPhieu(null);
      await loadChungTu();
      setResult({ type: 'success', title: 'Gửi thành công!', message: 'Chứng từ đã gửi đến Quản lý.' });
    } catch {
      setResult({ type: 'error', title: 'Gửi thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const loadYeuCau = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await datCocApi.getAll();
      // Giữ toàn bộ trạng thái SP trả về (đã sắp theo ưu tiên xử lý); lọc ở client bằng chip.
      setYeuCauList(data || []);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Không tải được danh sách phiếu đăng ký');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadYeuCau(); }, [loadYeuCau]);
  useEffect(() => { if (activeSubTab === 'ghi-nhan-chung-tu') loadChungTu(); }, [activeSubTab, loadChungTu]);

  // Lọc theo tìm kiếm (chưa áp chip trạng thái) — dùng để đếm cho chip.
  // Danh sách chỉ gồm phiếu TRONG NGÀY (SP đã lọc), nên không còn lọc theo khoảng ngày.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return yeuCauList;
    return yeuCauList.filter((it) => (it.hoTen || '').toLowerCase().includes(q)
      || String(it.soDienThoai || '').toLowerCase().includes(q)
      || (it.maDangKy || '').toLowerCase().includes(q));
  }, [yeuCauList, search]);

  // Số đếm cho từng chip (phản ánh cả tìm kiếm đang áp)
  const counts = useMemo(() => {
    const c = { all: baseFiltered.length };
    STATUS_ORDER.forEach((s) => { c[s] = 0; });
    baseFiltered.forEach((it) => { if (c[it.trangThaiDangKy] != null) c[it.trangThaiDangKy] += 1; });
    return c;
  }, [baseFiltered]);

  // Áp chip trạng thái. Cùng trong một ngày nên không cần sắp xếp theo ngày;
  // giữ thứ tự mã phiếu giảm dần (hồ sơ mới nhất lên đầu) cho ổn định.
  const filteredList = useMemo(
    () => (statusFilter === 'all' ? baseFiltered : baseFiltered.filter((it) => it.trangThaiDangKy === statusFilter)),
    [baseFiltered, statusFilter]
  );

  const chonChip = (key) => setStatusFilter(key);

  // Phân trang (client-side)
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [statusFilter, search]);
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedList = useMemo(
    () => filteredList.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filteredList, pageSafe]
  );
  const pageNumbers = useMemo(() => {
    const arr = [];
    let start = Math.max(1, pageSafe - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i += 1) arr.push(i);
    return arr;
  }, [pageSafe, totalPages]);

  const openDetail = (item) => setDetailItem(item);

  // ---- DC04: lọc/đếm/sort/phân trang cho danh sách chứng từ ----
  const ctBase = useMemo(() => {
    const q = ctSearch.trim().toLowerCase();
    return chungTuList.filter((it) => !q
      || (it.hoTen || '').toLowerCase().includes(q)
      || String(it.soDienThoai || '').toLowerCase().includes(q)
      || (it.maPhieuDatCoc || '').toLowerCase().includes(q));
  }, [chungTuList, ctSearch]);

  const ctCounts = useMemo(() => {
    const c = { all: ctBase.length };
    CT_STATUS_ORDER.forEach((s) => { c[s] = 0; });
    ctBase.forEach((it) => { if (c[it.trangThaiThanhToan] != null) c[it.trangThaiThanhToan] += 1; });
    return c;
  }, [ctBase]);

  // Thứ tự CỐ ĐỊNH: "Chờ TT" -> hạn gần nhất trước (sắp hết hạn xử lý trước);
  // các nhóm khác -> hạn xa nhất trước.
  const ctFiltered = useMemo(() => {
    const arr = ctStatus === 'all' ? ctBase : ctBase.filter((it) => it.trangThaiThanhToan === ctStatus);
    const gapNhatTruoc = ctStatus === 'Chờ TT';
    return [...arr].sort((a, b) => {
      const da = a.thoiHanThanhToan ? new Date(a.thoiHanThanhToan).getTime() : 0;
      const db = b.thoiHanThanhToan ? new Date(b.thoiHanThanhToan).getTime() : 0;
      return gapNhatTruoc ? da - db : db - da;
    });
  }, [ctBase, ctStatus]);

  const ctChonChip = (key) => setCtStatus(key);

  useEffect(() => { setCtPage(1); }, [ctStatus, ctSearch]);
  const ctTotalPages = Math.max(1, Math.ceil(ctFiltered.length / PAGE_SIZE));
  const ctPageSafe = Math.min(ctPage, ctTotalPages);
  const ctPaged = useMemo(
    () => ctFiltered.slice((ctPageSafe - 1) * PAGE_SIZE, ctPageSafe * PAGE_SIZE),
    [ctFiltered, ctPageSafe]
  );
  const ctPageNumbers = useMemo(() => {
    const arr = [];
    let start = Math.max(1, ctPageSafe - 2);
    const end = Math.min(ctTotalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i += 1) arr.push(i);
    return arr;
  }, [ctPageSafe, ctTotalPages]);

  // Chỉ phiếu 'Chờ TT' còn hạn mới cho ghi nhận chứng từ
  const canGhiNhan = (it) => it.trangThaiThanhToan === 'Chờ TT'
    && (!it.thoiHanThanhToan || new Date(it.thoiHanThanhToan).getTime() >= Date.now());

  const openGhiNhan = (item) => {
    setSelectedPhieu(item);
    setCtFile(null);
    // Nếu đã có chứng từ cũ, hiển thị tên file đó để user xóa rồi mới upload mới
    const existingPath = item.chungTuThanhToan ? String(item.chungTuThanhToan).trim() : '';
    if (existingPath) {
      const parts = existingPath.replace(/\\/g, '/').split('/');
      setCtExistingFileName(parts[parts.length - 1] || existingPath);
    } else {
      setCtExistingFileName('');
    }
    setCtPhuongThuc(item.phuongThucThanhToan || '');
    setInitialPhuongThuc(item.phuongThucThanhToan || '');
    setShowUploadModal(true);
  };

  // DC01 - nạp các phòng khách đã xem để Sale chọn phòng chốt.
  const loadPhongDaXem = async (maDangKy) => {
    setLoadingPhong(true);
    setPhongDaXem([]);
    setPhongChot('');
    try {
      const { data } = await datCocApi.getPhongDaXem(maDangKy);
      const ds = data || [];
      setPhongDaXem(ds);
      setPhongChot(ds.find((p) => p.khachChon)?.maPhong || '');
    } catch {
      setPhongDaXem([]);
    } finally {
      setLoadingPhong(false);
    }
  };

  // DC01 - Sale chốt/đổi phòng khách muốn thuê. Ghi xuống DB ngay để Quản lý duyệt đúng phòng này.
  const handleChonPhong = async (maPhong) => {
    if (!selectedItem || savingPhong) return;
    const truoc = phongChot;
    setSavingPhong(true);
    setPhongChot(maPhong);           // phản hồi ngay, hoàn tác nếu API lỗi
    try {
      await datCocApi.chonPhongChot(selectedItem.maDangKy, { maPhong });
      setPhongDaXem((prev) => prev.map((p) => ({ ...p, khachChon: p.maPhong === maPhong ? 1 : 0 })));
    } catch {
      setPhongChot(truoc);
      setResult({ type: 'error', title: 'Không chốt được phòng.' });
    } finally {
      setSavingPhong(false);
    }
  };

  // Tầng GUI - btnGui_Click(): gọi service guiYeuCauDatCoc qua API.
  const handleGuiYeuCau = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await datCocApi.guiYeuCauDatCoc({ maDangKy: selectedItem.maDangKy });
      setShowSendModal(false);
      setSelectedItem(null);
      await loadYeuCau();
      setResult({ type: 'success', title: 'Gửi thành công!', message: 'Yêu cầu đã gửi đến Quản lý.' });
    } catch {
      setResult({ type: 'error', title: 'Gửi thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Đóng modal Gửi yêu cầu đặt cọc, đưa modal về trạng thái sạch cho lần mở kế tiếp.
  const closeSendModal = () => {
    setShowSendModal(false);
    setEditingInfo(false);
    setShowRejectPanel(false);
    setLyDoTuChoi('');
  };

  // A4 - mở form chỉnh sửa, nạp sẵn thông tin hiện tại của khách hàng trong phiếu đang chọn.
  const openEditInfo = () => {
    if (!selectedItem) return;
    setInfoForm({
      hoTen: selectedItem.hoTen || '',
      ngaySinh: selectedItem.ngaySinh ? String(selectedItem.ngaySinh).slice(0, 10) : '',
      gioiTinh: selectedItem.gioiTinh || '',
      soDienThoai: selectedItem.soDienThoai || '',
      email: selectedItem.email || '',
      cccd: selectedItem.cccd || ''
    });
    setEditingInfo(true);
  };

  // A4 - btnLuuThongTin_Click(): gọi SP_CapNhatThongTinCaNhanKhachHang qua API.
  const handleCapNhatThongTin = async () => {
    if (!selectedItem) return;
    setSavingInfo(true);
    try {
      await datCocApi.capNhatThongTinCaNhan(selectedItem.maDangKy, infoForm);
      setSelectedItem((cur) => (cur ? { ...cur, ...infoForm } : cur));
      setEditingInfo(false);
      await loadYeuCau();
      setResult({ type: 'success', title: 'Cập nhật thành công!' });
    } catch {
      setResult({ type: 'error', title: 'Cập nhật thất bại.' });
    } finally {
      setSavingInfo(false);
    }
  };

  // E4 - btnTuChoi_Click(): thay đổi khách yêu cầu vượt phạm vi cập nhật -> từ chối hồ sơ,
  // tái sử dụng SP_CapNhatKetQuaXuLyHoSo (đã có sẵn cho luồng xử lý hồ sơ đăng ký).
  const handleTuChoiHoSo = async () => {
    if (!selectedItem || !lyDoTuChoi.trim()) return;
    setRejecting(true);
    try {
      await dangKyThueApi.capNhatKetQuaXuLy(selectedItem.maDangKy, {
        trangThai: 'Từ chối',
        ghiChuXuLy: lyDoTuChoi.trim(),
        nhanVienSaleId: user?.maNguoiDung
      });
      setShowSendModal(false);
      setShowRejectPanel(false);
      setSelectedItem(null);
      setLyDoTuChoi('');
      await loadYeuCau();
      setResult({ type: 'success', title: 'Đã từ chối hồ sơ.' });
    } catch {
      setResult({ type: 'error', title: 'Từ chối thất bại.' });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="ktp-container">
      {/* Title removed per request */}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #e0e3e3', marginBottom: '24px' }}>
        <div 
          onClick={() => setActiveSubTab('gui-yeu-cau')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'gui-yeu-cau' ? '600' : '500', color: activeSubTab === 'gui-yeu-cau' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'gui-yeu-cau' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Gửi yêu cầu đặt cọc
        </div>
        {/* DC02B - Sale lập phiếu cọc (hình thức thuê + giường là thứ phải trao đổi với khách,
            mà người gặp khách là Sale). Sale KHÔNG thấy tiền — kế toán chốt tiền ở DC03. */}
        <div
          onClick={() => setActiveSubTab('lap-phieu')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'lap-phieu' ? '600' : '500', color: activeSubTab === 'lap-phieu' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'lap-phieu' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Lập phiếu đặt cọc
        </div>
        <div
          onClick={() => setActiveSubTab('ghi-nhan-chung-tu')}
          style={{ paddingBottom: '12px', cursor: 'pointer', fontWeight: activeSubTab === 'ghi-nhan-chung-tu' ? '600' : '500', color: activeSubTab === 'ghi-nhan-chung-tu' ? '#2f6765' : '#6f797a', borderBottom: activeSubTab === 'ghi-nhan-chung-tu' ? '2px solid #2f6765' : '2px solid transparent' }}
        >
          Ghi nhận chứng từ thanh toán
        </div>
      </div>

      {activeSubTab === 'lap-phieu' && <LapPhieuCocTab />}

      {activeSubTab === 'gui-yeu-cau' && (
        <section>
          {/* Thanh tìm kiếm — chỉ hiển thị yêu cầu TRONG NGÀY nên không cần lọc ngày/sắp xếp */}
          <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên khách hàng, SĐT hoặc mã phiếu..."
                className="ktp-input"
                style={{ width: '100%', backgroundColor: '#fff' }}
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="ktp-btn-action"
                style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Segmented control: lọc theo trạng thái, kèm số đếm (căn thẳng lề trái với ô tìm kiếm) */}
          <StatusFilterTabs
            className="status-pill-tabs-offset"
            items={[{ key: 'all', label: 'Tất cả' }, ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_CONFIG[s].chip }))]}
            activeKey={statusFilter}
            counts={counts}
            onChange={chonChip}
          />

          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Số người</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải...</td></tr>
              ) : loadError ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#b3261e' }}>{loadError}</td></tr>
              ) : filteredList.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có phiếu nào ở nhóm này</td></tr>
              ) : pagedList.map(item => {
                const action = STATUS_CONFIG[item.trangThaiDangKy]?.action;
                return (
                  <tr key={item.maDangKy}>
                    <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maDangKy}</td>
                    <td style={{ color: '#191c1d' }}>{item.hoTen}</td>
                    <td style={{ color: '#191c1d' }}>{item.soDienThoai}</td>
                    <td>
                      <SoNguoiBadge
                        soNguoi={item.soNguoiDuKienO}
                        soNam={item.soNam}
                        soNu={item.soNu}
                        khacGioi={khacGioiOf(item)}
                      />
                    </td>
                    <td className="text-center">
                      <StatusBadge trangThai={item.trangThaiDangKy} />
                    </td>
                    <td className="text-center">
                      {action === 'gui' && (
                        <button className="ktp-btn-action-fill" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => { setSelectedItem(item); setEditingInfo(false); setShowRejectPanel(false); setLyDoTuChoi(''); setShowSendModal(true); loadPhongDaXem(item.maDangKy); }}>
                          Gửi yêu cầu
                        </button>
                      )}
                      {action === 'chi-tiet' && (
                        <button className="ktp-btn-action" style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765' }} onClick={() => openDetail(item)}>
                          Xem chi tiết
                        </button>
                      )}
                      {action === 'ly-do' && (
                        <button className="ktp-btn-action" style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #f0c0c0', backgroundColor: '#fff', color: '#b91c1c' }} onClick={() => openDetail(item)}>
                          Xem lý do
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#6f797a', marginRight: 'auto' }}>
              {filteredList.length === 0
                ? 'Không có phiếu'
                : `Hiển thị ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, filteredList.length)} / ${filteredList.length} phiếu`}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button type="button" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)} style={pageBtnStyle(false, pageSafe <= 1)}>‹</button>
                {pageNumbers.map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)} style={pageBtnStyle(n === pageSafe, false)}>{n}</button>
                ))}
                <button type="button" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)} style={pageBtnStyle(false, pageSafe >= totalPages)}>›</button>
              </div>
            )}
          </div>
        </section>
      )}

      {activeSubTab === 'ghi-nhan-chung-tu' && (
        <section>
          {/* Thanh tìm kiếm (đã bỏ bộ chọn sắp xếp — phiếu sắp hết hạn luôn lên đầu) */}
          <div style={{ backgroundColor: '#f4f7f7', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ flex: '2 1 260px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#191c1d', marginBottom: '8px' }}>Tìm kiếm</label>
              <input type="text" value={ctSearch} onChange={(e) => setCtSearch(e.target.value)} placeholder="Tên khách hàng, SĐT hoặc mã phiếu cọc..." className="ktp-input" style={{ width: '100%', backgroundColor: '#fff' }} />
            </div>
            {ctSearch && (
              <button type="button" onClick={() => setCtSearch('')} className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '9px 16px', fontSize: '13px' }}>Xóa lọc</button>
            )}
          </div>

          {/* Segmented control theo trạng thái thanh toán */}
          <StatusFilterTabs
            className="status-pill-tabs-offset"
            items={[{ key: 'all', label: 'Tất cả' }, ...CT_STATUS_ORDER.map((s) => ({ key: s, label: CT_STATUS_CONFIG[s].chip }))]}
            activeKey={ctStatus}
            counts={ctCounts}
            onChange={ctChonChip}
          />

          <table className="ktp-table">
            <thead>
              <tr>
                <th>Mã phiếu cọc</th>
                <th>Khách hàng</th>
                <th>Phòng</th>
                <th>Cần thanh toán</th>
                <th>Hạn thanh toán</th>
                <th className="text-center">Trạng thái</th>
                <th>Chứng từ</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingCT ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Đang tải...</td></tr>
              ) : ctError ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#b3261e' }}>{ctError}</td></tr>
              ) : ctFiltered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#6f797a' }}>Không có phiếu cọc nào ở nhóm này</td></tr>
              ) : ctPaged.map(item => {
                const daCoChungTu = !!(item.chungTuThanhToan && String(item.chungTuThanhToan).trim());
                // DC05: bị từ chối = vẫn còn chứng từ cũ NHƯNG quản lý đã ghi lý do từ chối.
                const biTuChoi = daCoChungTu && !!(item.lyDoTuChoi && String(item.lyDoTuChoi).trim());
                return (
                  <tr key={item.maPhieuDatCoc}>
                    <td style={{ fontWeight: '600', color: '#2f6765' }}>{item.maPhieuDatCoc}</td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#191c1d' }}>{item.hoTen}</div>
                      <div style={{ fontSize: '12px', color: '#6f797a' }}>{item.soDienThoai || ''}</div>
                    </td>
                    <td>
                      <div style={{ backgroundColor: '#e0e3e3', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '12px', fontWeight: '600' }}>{moTaPhong(item)}</div>
                    </td>
                    <td style={{ fontWeight: 'bold', color: '#191c1d' }}>{formatTien(item.soTienCoc)}đ</td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#3f494a' }}>{formatHan(item.thoiHanThanhToan)}</div>
                    </td>
                    <td className="text-center">
                      <CtBadge trangThai={item.trangThaiThanhToan} />
                    </td>
                    <td className="text-center">
                      {/* Chứng từ 3 trạng thái: Bị từ chối (đỏ) / Đã có (xanh) / Chưa có (vàng) — bấm được.
                          Không dùng icon: màu + chữ đã đủ phân biệt, giống các chip trạng thái khác. */}
                      {(() => {
                        const cfg = biTuChoi
                          ? { bg: '#fdecec', fg: '#b91c1c', label: 'Bị từ chối', title: 'Xem lý do từ chối và chứng từ cũ' }
                          : daCoChungTu
                            ? { bg: '#e6f6ec', fg: '#15803d', label: 'Đã có', title: 'Xem chứng từ đã gửi' }
                            : { bg: '#fff4e5', fg: '#b45309', label: 'Chưa có', title: 'Ghi nhận chứng từ' };
                        const onClick = () => {
                          if (biTuChoi) { canGhiNhan(item) ? openGhiNhan(item) : setCtDetail(item); }
                          else if (daCoChungTu) { window.open(fileChungTuUrl(item.chungTuThanhToan), '_blank', 'noopener'); }
                          else if (canGhiNhan(item)) { openGhiNhan(item); }
                          else { setCtDetail(item); }
                        };
                        return (
                          <button type="button" title={cfg.title} onClick={onClick}
                            style={{ background: cfg.bg, color: cfg.fg, border: 'none', padding: '4px 12px', borderRadius: '999px',
                              fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center' }}>
                            {cfg.label}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="text-center">
                      {canGhiNhan(item) ? (
                        <button className="ktp-btn-action-fill" style={{ backgroundColor: '#3b8280', padding: '6px 12px', fontSize: '12px' }} onClick={() => openGhiNhan(item)}>
                          {daCoChungTu ? 'Cập nhật lại' : 'Ghi nhận chứng từ'}
                        </button>
                      ) : (
                        <button className="ktp-btn-action" style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#2f6765', padding: '6px 12px', fontSize: '12px' }} onClick={() => setCtDetail(item)}>
                          Xem chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#6f797a', marginRight: 'auto' }}>
              {ctFiltered.length === 0
                ? 'Không có phiếu'
                : `Hiển thị ${(ctPageSafe - 1) * PAGE_SIZE + 1}–${Math.min(ctPageSafe * PAGE_SIZE, ctFiltered.length)} / ${ctFiltered.length} phiếu`}
            </span>
            {ctTotalPages > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button type="button" disabled={ctPageSafe <= 1} onClick={() => setCtPage(ctPageSafe - 1)} style={pageBtnStyle(false, ctPageSafe <= 1)}>‹</button>
                {ctPageNumbers.map((n) => (
                  <button key={n} type="button" onClick={() => setCtPage(n)} style={pageBtnStyle(n === ctPageSafe, false)}>{n}</button>
                ))}
                <button type="button" disabled={ctPageSafe >= ctTotalPages} onClick={() => setCtPage(ctPageSafe + 1)} style={pageBtnStyle(false, ctPageSafe >= ctTotalPages)}>›</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Modal xem chi tiết phiếu chứng từ (đã TT / hết hạn) */}
      {ctDetail && (
        <div className="ktp-modal-overlay" onClick={() => setCtDetail(null)}>
          <div className="ktp-modal" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header">
              <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Chi tiết phiếu cọc</h3>
              <button className="ktp-btn-close" onClick={() => setCtDetail(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: '#2f6765', fontSize: '18px' }}>{ctDetail.maPhieuDatCoc}</span>
                <CtBadge trangThai={ctDetail.trangThaiThanhToan} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Khách hàng', ctDetail.hoTen],
                  ['Số điện thoại', ctDetail.soDienThoai || '—'],
                  ['Phòng', moTaPhong(ctDetail)],
                  ['Giường', ctDetail.danhSachGiuong || 'Trọn phòng'],
                  ['Cần thanh toán', `${formatTien(ctDetail.soTienCoc)}đ`],
                  ['Hạn thanh toán', formatHan(ctDetail.thoiHanThanhToan)]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                    <span style={{ color: '#6f797a', fontSize: '14px' }}>{k}</span>
                    <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              {ctDetail.chungTuThanhToan && String(ctDetail.chungTuThanhToan).trim() && (
                <p style={{ marginTop: '12px', fontSize: '13px' }}>
                  Chứng từ:{' '}
                  <a href={fileChungTuUrl(ctDetail.chungTuThanhToan)} target="_blank" rel="noreferrer">Xem file</a>
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="ktp-btn-action" onClick={() => setCtDetail(null)} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '8px 24px' }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận gửi yêu cầu đặt cọc (DC01) - gồm 3 nhánh: gửi / A4 sửa thông tin / E4 từ chối */}
      {showSendModal && selectedItem && (
        <div className="ktp-modal-overlay">
          <div className="ktp-modal" style={{ maxWidth: '760px', width: '100%' }}>
            <div style={{ background: '#2f6765', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px 12px 0 0' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Gửi yêu cầu đặt cọc</h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>Mã phiếu đăng ký: <strong style={{ color: '#fff' }}>{selectedItem.maDangKy}</strong></p>
              </div>
              <button onClick={closeSendModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: '4px' }}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body">
              {showRejectPanel ? (
                <div className="ktp-section">
                  <p style={{ margin: 0, fontSize: '14px', color: '#3f494a', lineHeight: '1.5' }}>
                    Dùng khi khách hàng muốn thay đổi thông tin ngoài phạm vi cho phép ở bước này (đổi phòng/giường, hình thức thuê, số người ở, khu vực/loại phòng/mức giá...). Hồ sơ sẽ chuyển sang trạng thái "Từ chối"; khách hàng cần quay lại bước xem phòng/đăng ký.
                  </p>
                  <label style={{ fontSize: '13px', color: '#3f494a', fontWeight: 600 }}>Lý do từ chối
                    <textarea className="ktp-input" style={{ width: '100%', marginTop: '6px', minHeight: '80px' }} value={lyDoTuChoi} onChange={(e) => setLyDoTuChoi(e.target.value)} placeholder="Ví dụ: Khách muốn đổi sang phòng khác, ngoài phạm vi gửi yêu cầu đặt cọc." />
                  </label>
                </div>
              ) : (
                <div className="ktp-grid-2">
                  {/* Cột trái - Khách hàng (xem / A4 chỉnh sửa) */}
                  <div className="ktp-info-box-outline">
                    <h4 className="ktp-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="person" /> Khách hàng</span>
                      {!editingInfo && (
                        <button onClick={openEditInfo} disabled={submitting} title="Chỉnh sửa thông tin khách hàng"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2f6765', display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: '4px' }}>
                          <Icon name="edit" style={{ fontSize: '16px' }} />
                        </button>
                      )}
                    </h4>
                    {editingInfo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ fontSize: '12px', color: '#6f797a', fontWeight: 600 }}>Họ tên
                          <input type="text" className="ktp-input" style={{ width: '100%', marginTop: '4px' }} value={infoForm.hoTen} onChange={(e) => setInfoForm((f) => ({ ...f, hoTen: e.target.value }))} />
                        </label>
                        <label style={{ fontSize: '12px', color: '#6f797a', fontWeight: 600 }}>Ngày sinh
                          <input type="date" className="ktp-input" style={{ width: '100%', marginTop: '4px' }} value={infoForm.ngaySinh} onChange={(e) => setInfoForm((f) => ({ ...f, ngaySinh: e.target.value }))} />
                        </label>
                        <label style={{ fontSize: '12px', color: '#6f797a', fontWeight: 600 }}>Giới tính
                          <select className="ktp-input" style={{ width: '100%', marginTop: '4px' }} value={infoForm.gioiTinh} onChange={(e) => setInfoForm((f) => ({ ...f, gioiTinh: e.target.value }))}>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </label>
                        <label style={{ fontSize: '12px', color: '#6f797a', fontWeight: 600 }}>Số điện thoại
                          <input type="text" className="ktp-input" style={{ width: '100%', marginTop: '4px' }} value={infoForm.soDienThoai} onChange={(e) => setInfoForm((f) => ({ ...f, soDienThoai: e.target.value }))} />
                        </label>
                        <label style={{ fontSize: '12px', color: '#6f797a', fontWeight: 600 }}>Email
                          <input type="email" className="ktp-input" style={{ width: '100%', marginTop: '4px' }} value={infoForm.email} onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))} />
                        </label>
                        <label style={{ fontSize: '12px', color: '#6f797a', fontWeight: 600 }}>Giấy tờ tùy thân (CCCD)
                          <input type="text" className="ktp-input" style={{ width: '100%', marginTop: '4px' }} value={infoForm.cccd} onChange={(e) => setInfoForm((f) => ({ ...f, cccd: e.target.value }))} />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Họ tên</span><span className="ktp-info-value">{selectedItem.hoTen}</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Ngày sinh</span><span className="ktp-info-value">{formatNgay(selectedItem.ngaySinh)}</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Giới tính</span><span className="ktp-info-value">{selectedItem.gioiTinh || '—'}</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Số điện thoại</span><span className="ktp-info-value">{selectedItem.soDienThoai || '—'}</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">Email</span><span className="ktp-info-value">{selectedItem.email || '—'}</span></div>
                        <div className="ktp-info-row"><span className="ktp-info-label">CCCD</span><span className="ktp-info-value">{selectedItem.cccd || '—'}</span></div>
                      </div>
                    )}
                  </div>

                  {/* Cột phải - Yêu cầu thuê + PHÒNG KHÁCH CHỐT (Sale chọn) */}
                  <div className="ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="description" /> Yêu cầu thuê</h4>
                    <div>
                      <div className="ktp-info-row"><span className="ktp-info-label">Số người dự kiến</span><span className="ktp-info-value">{selectedItem.soNguoiDuKienO} ({selectedItem.soNam ?? 0} nam, {selectedItem.soNu ?? 0} nữ){khacGioiOf(selectedItem) ? ' · khác giới' : ''}</span></div>
                      <div className="ktp-info-row"><span className="ktp-info-label">Ngày đăng ký</span><span className="ktp-info-value">{formatNgay(selectedItem.ngayDangKy)}</span></div>
                      <div className="ktp-info-row"><span className="ktp-info-label">Trạng thái</span><span className="ktp-info-value"><StatusBadge trangThai={selectedItem.trangThaiDangKy} /></span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHÒNG KHÁCH CHỐT THUÊ — Sale chọn trong các phòng khách đã xem.
                  Phòng này sẽ được Quản lý duyệt (DC02) và Kế toán lập phiếu (DC03). */}
              {!showRejectPanel && !editingInfo && (
                <div className="ktp-info-box-outline" style={{ marginTop: '16px' }}>
                  <h4 className="ktp-section-title"><Icon name="apartment" /> Phòng khách chốt thuê</h4>

                  {loadingPhong ? (
                    <p style={{ color: '#6f797a', fontSize: 13, margin: 0 }}>Đang tải danh sách phòng...</p>
                  ) : phongDaXem.length === 0 ? (
                    <p style={{ color: '#b3261e', fontSize: 13, margin: 0 }}>Hồ sơ chưa có phòng nào được xem. Cần đặt lịch xem phòng trước.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {phongDaXem.map((p) => {
                        const chon = phongChot === p.maPhong;
                        const khoa = !p.daXem;   // lịch chưa 'Đã xem' -> chưa chốt được
                        return (
                          <label key={p.maPhong}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px',
                              border: `1.5px solid ${chon ? '#3b8280' : '#e1e6e6'}`,
                              background: chon ? '#eaf4f3' : (khoa ? '#f7f8f8' : '#fff'),
                              opacity: khoa ? 0.6 : 1, cursor: khoa || savingPhong ? 'not-allowed' : 'pointer' }}>
                            <input type="radio" name="phongChot" checked={chon} disabled={khoa || savingPhong}
                              onChange={() => !khoa && handleChonPhong(p.maPhong)} />
                            <span style={{ fontWeight: 700, color: '#191c1d' }}>{p.tenPhong}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {phongDaXem.some((p) => !p.daXem) && (
                    <p style={{ fontSize: 11, color: '#b45309', marginTop: '8px', marginBottom: 0 }}>
                      Phòng mờ là phòng khách chưa xem (lịch chưa ở trạng thái &quot;Đã xem&quot;) — không chốt được.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="ktp-modal-footer" style={{ justifyContent: 'space-between' }}>
              {showRejectPanel ? (
                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                  <button className="ktp-btn-cancel" onClick={() => { setShowRejectPanel(false); setLyDoTuChoi(''); }} disabled={rejecting}>Quay lại</button>
                  <button className="ktp-btn-submit" onClick={handleTuChoiHoSo} disabled={rejecting || !lyDoTuChoi.trim()} style={{ backgroundColor: '#b91c1c' }}>
                    {rejecting ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
              ) : editingInfo ? (
                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                  <button className="ktp-btn-cancel" onClick={() => setEditingInfo(false)} disabled={savingInfo}>Hủy</button>
                  <button className="ktp-btn-submit" onClick={handleCapNhatThongTin} disabled={savingInfo}>
                    {savingInfo ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                  <button className="ktp-btn-action" onClick={() => setShowRejectPanel(true)} disabled={submitting}
                    style={{ border: '1px solid #b91c1c', borderRadius: '8px', padding: '10px 20px', color: '#b91c1c', backgroundColor: '#fff' }}>Từ chối</button>
                  {/* Chưa chốt phòng thì không gửi được: Quản lý (DC02) cần biết duyệt phòng nào. */}
                  <button className="ktp-btn-submit" onClick={handleGuiYeuCau}
                    disabled={submitting || savingPhong || !phongChot}
                    title={!phongChot ? 'Cần chọn phòng khách chốt thuê trước khi gửi' : ''}>
                    {submitting ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ghi nhận chứng từ thanh toán (DC04) */}
      {showUploadModal && selectedPhieu && (
        <div className="ktp-modal-overlay" onClick={() => !submitting && setShowUploadModal(false)}>
          <div className="ktp-modal" style={{ maxWidth: '860px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: '#2f6765', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '12px 12px 0 0' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700 }}>Ghi nhận chứng từ thanh toán</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', padding: '4px' }}><Icon name="close" /></button>
            </div>

            <div className="ktp-modal-body" style={{ paddingTop: '16px' }}>
              {/* Dải thông tin phiếu (ngang) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', border: '1px solid #e1e6e6', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f4f7f7', marginBottom: '18px' }}>
                {[
                  ['receipt_long', 'Phiếu', selectedPhieu.maPhieuDatCoc],
                  ['person', 'Khách', selectedPhieu.hoTen],
                  ['bed', 'Phòng', moTaPhong(selectedPhieu)],
                  ['hourglass_empty', 'Hạn TT', formatHan(selectedPhieu.thoiHanThanhToan)],
                ].map(([ic, k, v]) => (
                  <div key={k} style={{ padding: '10px 14px', borderRight: '1px solid #e1e6e6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6f797a', marginBottom: '3px' }}><Icon name={ic} style={{ fontSize: '14px' }} />{k}</div>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#191c1d' }}>{v}</div>
                  </div>
                ))}
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6f797a', marginBottom: '3px' }}><Icon name="payments" style={{ fontSize: '14px' }} />Cần nộp</div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#b3261e' }}>{formatTien(selectedPhieu.soTienCoc)}đ</div>
                </div>
              </div>

              {/* Hai cột cân bằng chiều cao (cân cột): ô chứng từ cao bằng cột trái, khóa kích thước khi đổi phương thức */}
              <div style={{ display: 'flex', gap: '18px', alignItems: 'stretch' }}>
                {/* Cột trái: phương thức + khe cố định */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '11.5px', letterSpacing: '.04em', color: '#6f797a', fontWeight: 700, textTransform: 'uppercase' }}>① Phương thức thanh toán</label>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {[
                      { pt: 'Chuyển khoản', ic: 'account_balance', sub: 'Tải ảnh giao dịch' },
                      { pt: 'Tiền mặt', ic: 'account_balance_wallet', sub: 'In phiếu, hai bên ký tay' },
                    ].map(({ pt, ic, sub }) => {
                      const on = ctPhuongThuc === pt;
                      return (
                        <button key={pt} type="button" disabled={submitting || !!initialPhuongThuc} onClick={() => handleChonPhuongThuc(pt)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', padding: '12px', borderRadius: '11px', cursor: submitting ? 'wait' : (initialPhuongThuc ? 'not-allowed' : 'pointer'),
                            border: on ? '1.5px solid #3b8280' : '1.5px solid #e1e6e6', background: on ? '#eaf4f3' : '#fff', opacity: (!on && initialPhuongThuc) ? 0.5 : 1 }}>
                          <Icon name={ic} style={{ fontSize: '21px', color: on ? '#2f6765' : '#8a9596' }} />
                          <span style={{ lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: on ? '#2f6765' : '#191c1d' }}>{pt}</span>
                            <small style={{ display: 'block', fontSize: '11px', color: '#6f797a' }}>{sub}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Khe cố định: thông tin CK (chuyển khoản) hoặc nút in (tiền mặt) */}
                  <div style={{ minHeight: '98px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {ctPhuongThuc === 'Chuyển khoản' && (
                      <div style={{ background: '#f4f7f7', border: '1px solid #e1e6e6', borderRadius: '12px', padding: '12px 14px', display: 'grid', gap: '7px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Ngân hàng</span><b>Vietcombank (VCB)</b></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#6f797a' }}>Số tài khoản</span><b>1012345678</b></div>
                      </div>
                    )}
                    {ctPhuongThuc === 'Tiền mặt' && (
                      <button type="button" onClick={handleInPhieuDatCoc}
                        style={{ width: '100%', border: '1.5px solid #3b8280', color: '#2f6765', background: '#fff', borderRadius: '10px', padding: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                        <Icon name="print" style={{ fontSize: '18px' }} /> In phiếu đặt cọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Cột phải: chứng từ (cao bằng cột trái) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ fontSize: '11.5px', letterSpacing: '.04em', color: '#6f797a', fontWeight: 700, textTransform: 'uppercase' }}>② Chứng từ thanh toán</label>
                  <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => setCtFile(e.target.files?.[0] || null)} />
                  <div
                    onClick={() => ctPhuongThuc && fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (ctPhuongThuc) setCtFile(e.dataTransfer.files?.[0] || null); }}
                    style={{ flex: 1, minHeight: '150px', border: '1.6px dashed ' + (ctPhuongThuc ? '#3b8280' : '#d7dcdc'), borderRadius: '12px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '18px',
                      background: ctPhuongThuc ? '#eaf4f3' : '#f7f8f8', cursor: ctPhuongThuc ? 'pointer' : 'not-allowed' }}
                  >
                    <Icon name="cloud_upload" style={{ fontSize: '30px', color: ctPhuongThuc ? '#3b8280' : '#b0b7b8' }} />
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: ctPhuongThuc ? '#2f6765' : '#8a9596', marginTop: '6px' }}>
                      {!ctPhuongThuc ? 'Chọn phương thức thanh toán trước'
                        : ctPhuongThuc === 'Tiền mặt' ? 'Kéo thả hoặc chọn phiếu đặt cọc đã ký' : 'Kéo thả hoặc chọn ảnh giao dịch'}
                    </div>
                    <small style={{ color: '#6f797a', fontSize: '11.5px', marginTop: '3px' }}>JPG, PNG, PDF · tối đa 5MB</small>
                  </div>
                  {/* Hiển thị file cũ (khi Cập nhật lại) — phải xóa rồi mới upload mới */}
                  {ctExistingFileName && !ctFile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff8e1', border: '1px solid #f0c040', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#5a4000', overflow: 'hidden' }}>
                        <Icon name="image" style={{ color: '#b45309' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctExistingFileName}</span>
                        <span style={{ fontSize: '11px', color: '#b45309', whiteSpace: 'nowrap' }}>(chứng từ cũ)</span>
                      </div>
                      <button type="button" onClick={() => setCtExistingFileName('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b3261e', display: 'flex' }} title="Xóa để tải lên chứng từ mới">
                        <Icon name="delete" style={{ fontSize: '18px' }} />
                      </button>
                    </div>
                  )}
                  {ctFile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#edeeef', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#191c1d', overflow: 'hidden' }}>
                        <Icon name="image" style={{ color: '#2f6765' }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ctFile.name}</span>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setCtFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b3261e', display: 'flex' }}>
                        <Icon name="delete" style={{ fontSize: '18px' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú (toàn hàng) */}
              {/* DC05 - chứng từ bị quản lý từ chối: giữ nguyên file cũ, hiện lý do để Sale sửa đúng chỗ */}
              {selectedPhieu.lyDoTuChoi && String(selectedPhieu.lyDoTuChoi).trim() && (
                <div style={{ marginTop: '16px', background: '#fdecec', border: '1px solid #f1b0b0', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Icon name="warning" style={{ color: '#b3261e', fontSize: '18px', flex: 'none', marginTop: '1px' }} />
                  <div style={{ fontSize: '13px', color: '#191c1d' }}>
                    <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '3px' }}>Chứng từ đã bị quản lý từ chối</div>
                    <div style={{ marginBottom: '5px' }}>Lý do: {selectedPhieu.lyDoTuChoi}</div>
                    {selectedPhieu.chungTuThanhToan && (
                      <a href={fileChungTuUrl(selectedPhieu.chungTuThanhToan)} target="_blank" rel="noreferrer" style={{ color: '#2f6765', fontWeight: 600 }}>
                        Xem lại chứng từ đã gửi
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ktp-modal-footer" style={{ borderTop: '1px solid #eceeef', paddingTop: '16px', paddingBottom: '20px', paddingRight: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="ktp-btn-action" onClick={() => setShowUploadModal(false)} disabled={submitting} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '10px 28px' }}>Hủy</button>
              <button className="ktp-btn-action-fill" onClick={handleGhiNhanChungTu} disabled={submitting} style={{ padding: '10px 28px' }}>
                {submitting ? 'Đang gửi...' : 'Gửi chứng từ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết / Xem lý do từ chối */}
      {detailItem && (
        <div className="ktp-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="ktp-modal" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="ktp-modal-header">
              <h3 style={{ margin: 0, color: '#191c1d', fontSize: '16px' }}>Chi tiết phiếu đăng ký</h3>
              <button className="ktp-btn-close" onClick={() => setDetailItem(null)}><Icon name="close" /></button>
            </div>
            <div className="ktp-modal-body" style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: '#2f6765', fontSize: '18px' }}>{detailItem.maDangKy}</span>
                <StatusBadge trangThai={detailItem.trangThaiDangKy} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  ['Khách hàng', detailItem.hoTen],
                  ['Số điện thoại', detailItem.soDienThoai || '—'],
                  ['Phòng dự kiến', moTaPhong(detailItem)],
                  ['Ngày đăng ký', formatNgay(detailItem.ngayDangKy)]
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                    <span style={{ color: '#6f797a', fontSize: '14px' }}>{k}</span>
                    <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                  <span style={{ color: '#6f797a', fontSize: '14px' }}>Số người</span>
                  <SoNguoiBadge soNguoi={detailItem.soNguoiDuKienO} soNam={detailItem.soNam} soNu={detailItem.soNu} khacGioi={khacGioiOf(detailItem)} />
                </div>
                {detailItem.maPhieuDatCoc && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Mã phiếu cọc</span>
                      <span style={{ color: '#2f6765', fontSize: '14px', fontWeight: 600 }}>{detailItem.maPhieuDatCoc}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f2f2' }}>
                      <span style={{ color: '#6f797a', fontSize: '14px' }}>Số tiền cọc</span>
                      <span style={{ color: '#191c1d', fontSize: '14px', fontWeight: 600 }}>{formatTien(detailItem.soTienCoc)}đ</span>
                    </div>
                  </>
                )}
              </div>

              {detailItem.trangThaiDangKy === 'Từ chối' && (
                <div style={{ marginTop: '16px', background: '#fdecec', border: '1px solid #f5c2c2', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>Lý do từ chối</div>
                  <div style={{ fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>{detailItem.ghiChuSale || 'Quản lý không để lại ghi chú.'}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="ktp-btn-action" onClick={() => setDetailItem(null)} style={{ border: '1px solid #c4c7c8', backgroundColor: '#fff', color: '#3f494a', padding: '8px 24px' }}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup thông báo kết quả */}
      <ResultModal
        open={!!result}
        type={result?.type}
        title={result?.title}
        message={result?.message}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
