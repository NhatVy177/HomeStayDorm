import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './LapPhieuDatCocTab.jsx';
import { doiSoatApi } from './doiSoat.api.js';

const LOAI_HO_SO = {
  HOP_DONG_THUE: 'HOP_DONG_THUE',
  DAT_COC_CHUA_KY_HOP_DONG: 'DAT_COC_CHUA_KY_HOP_DONG'
};

const QUYET_TOAN_TABS = [
  { id: 'lap-doi-soat', label: 'Lập phiếu đối soát' },
  { id: 'ghi-nhan-thu-them', label: 'Ghi nhận thu thêm' },
  { id: 'ghi-nhan-hoan-coc', label: 'Ghi nhận hoàn cọc' },
  { id: 'ket-qua-doi-soat', label: 'Kết quả đối soát' }
];

function safeNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replaceAll(',', '');
  const number = Number(normalized);
  return Number.isNaN(number) ? 0 : number;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return '--';
  return date.toLocaleDateString('vi-VN');
}

function formatMoney(value) {
  return `${Math.round(safeNumber(value)).toLocaleString('vi-VN')}đ`;
}

function evidenceHref(value) {
  if (!value) return '';
  const text = String(value);
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${apiBase.replace(/\/api\/?$/, '')}${text}`;
  }
  return text;
}

function makeLineKey(prefix, ...parts) {
  return [prefix, ...parts.map((part) => part ?? '')].join(':');
}

function hasLineValues(values) {
  return values && Object.keys(values).length > 0;
}

function sumLineValues(values) {
  return Object.values(values || {}).reduce((total, value) => total + safeNumber(value), 0);
}

function getLineAmount(values, key, fallback) {
  return values?.[key] ?? safeNumber(fallback);
}

function buildInitialDeductionValues(data) {
  const chiTietKhauTru = data?.chiTietKhauTru || {};
  const hoaDonConNo = chiTietKhauTru.hoaDonConNo || chiTietKhauTru.tienThueConNo || [];
  const chiTietHoaDon = chiTietKhauTru.chiTietHoaDon || [];
  const bienBanKiemTra = chiTietKhauTru.bienBanKiemTra || [];
  const chiTietHuHong = chiTietKhauTru.chiTietHuHong || [];
  const bienBanViPham = chiTietKhauTru.bienBanViPham || [];

  const rentLines = {};
  const serviceLines = {};
  const repairLines = {};
  const penaltyLines = {};

  hoaDonConNo.forEach((hoaDon) => {
    const key = makeLineKey('rent', hoaDon.maHoaDon, hoaDon.maHopDong, hoaDon.kyThanhToan);
    rentLines[key] = safeNumber(hoaDon.thanhTien);
  });

  chiTietHoaDon.forEach((line) => {
    const key = makeLineKey('service', line.maChiTietHD, line.maHoaDon);
    serviceLines[key] = safeNumber(line.thanhTien);
  });

  bienBanKiemTra.forEach((bienBan) => {
    const damages = chiTietHuHong.filter((item) => item.maBienBanKT === bienBan.maBienBanKT);
    if (damages.length === 0) {
      const key = makeLineKey('repair-report', bienBan.maBienBanKT);
      repairLines[key] = safeNumber(bienBan.tongChiPhiSuaChua);
    }
  });

  chiTietHuHong.forEach((damage) => {
    const key = makeLineKey('repair', damage.maChiTietHH, damage.maBienBanKT);
    repairLines[key] = safeNumber(damage.chiPhiSuaChua);
  });

  bienBanViPham.forEach((viPham) => {
    const key = makeLineKey('penalty', viPham.maBBViPham);
    penaltyLines[key] = safeNumber(viPham.soTienPhat);
  });

  return {
    rentLines,
    serviceLines,
    repairLines,
    penaltyLines
  };
}

function buildFormFromDeductionValues(defaults, deductionValues) {
  return {
    tienThueConNo: hasLineValues(deductionValues.rentLines)
      ? sumLineValues(deductionValues.rentLines)
      : safeNumber(defaults?.tienThueConNo),
    tienDichVuConNo: hasLineValues(deductionValues.serviceLines)
      ? sumLineValues(deductionValues.serviceLines)
      : safeNumber(defaults?.tienDichVuConNo),
    tongChiPhiSuaChua: hasLineValues(deductionValues.repairLines)
      ? sumLineValues(deductionValues.repairLines)
      : safeNumber(defaults?.tongChiPhiSuaChua),
    tienPhat: hasLineValues(deductionValues.penaltyLines)
      ? sumLineValues(deductionValues.penaltyLines)
      : safeNumber(defaults?.tienPhat),
    ghiChuPhanHoiKhach: ''
  };
}

function calculateStayMonths(startDateValue, returnDateValue) {
  const startDate = toDate(startDateValue);
  const returnDate = toDate(returnDateValue);
  if (!startDate || !returnDate) return 0;

  let months =
    (returnDate.getFullYear() - startDate.getFullYear()) * 12 +
    (returnDate.getMonth() - startDate.getMonth());

  if (returnDate.getDate() > startDate.getDate()) {
    months += 1;
  }

  return months <= 0 ? 1 : months;
}

function calculatePreview(detail, form) {
  if (!detail) return null;

  const tienCocBanDau = safeNumber(detail.hopDong?.soTienCoc ?? detail.phieuDatCoc?.soTienCoc);
  const tienThueConNo = safeNumber(form.tienThueConNo);
  const tienDichVuConNo = safeNumber(form.tienDichVuConNo);
  const tongChiPhiSuaChua = safeNumber(form.tongChiPhiSuaChua);
  const tienPhat = safeNumber(form.tienPhat);
  let soThangLuuTru = 0;
  let tyLeHoanCocHienTai = 80;

  if (detail.loaiHoSo === LOAI_HO_SO.HOP_DONG_THUE) {
    soThangLuuTru = calculateStayMonths(
      detail.hopDong?.ngayBatDau,
      detail.phieuTraPhong?.ngayTraThucTe
    );
    const ngayTraThucTe = toDate(detail.phieuTraPhong?.ngayTraThucTe);
    const ngayKetThuc = toDate(detail.hopDong?.ngayKetThuc);

    if (ngayTraThucTe && ngayKetThuc && ngayTraThucTe >= ngayKetThuc) {
      tyLeHoanCocHienTai = 100;
    } else if (soThangLuuTru < 6) {
      tyLeHoanCocHienTai = 50;
    } else {
      tyLeHoanCocHienTai = 70;
    }
  }

  const tienCocDuocHoan = Math.round(tienCocBanDau * tyLeHoanCocHienTai / 100);
  const tongKhauTru = Math.round(tienThueConNo + tienDichVuConNo + tongChiPhiSuaChua + tienPhat);
  const chenhLech = tienCocDuocHoan - tongKhauTru;

  return {
    tienCocBanDau,
    soThangLuuTru,
    tyLeHoanCocHienTai,
    tienCocDuocHoan,
    tienThueConNo,
    tienDichVuConNo,
    tongChiPhiSuaChua,
    tienPhat,
    tongKhauTru,
    soTienHoanThucTe: chenhLech > 0 ? chenhLech : 0,
    soTienKhachPhaiTT: chenhLech < 0 ? Math.abs(chenhLech) : 0
  };
}

function resultText(result) {
  if (!result) return '--';
  if (result.soTienHoanThucTe > 0) return 'Khách được hoàn cọc';
  if (result.soTienKhachPhaiTT > 0) return 'Khách phải thanh toán thêm';
  return 'Không hoàn cọc và không thu thêm';
}



function InfoRow({ label, value, strong = false }) {
  return (
    <div className="ktp-info-row">
      <span className="ktp-info-label">{label}</span>
      <span className="ktp-info-value" style={strong ? { fontWeight: 800, color: '#00666d' } : undefined}>
        {value ?? '--'}
      </span>
    </div>
  );
}

function SourceLine({ title, meta, amount, tone = 'normal', editing = false, editValue, onAmountChange, autoFocus = false }) {
  const canEdit = editing && typeof onAmountChange === 'function';

  return (
    <div className={`qt-source-line${canEdit ? ' is-editing' : ''}`}>
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: '#191c1d', fontSize: '13px' }}>{title}</p>
        {meta && <p style={{ margin: '3px 0 0', color: '#6f797a', fontSize: '12px', lineHeight: 1.45 }}>{meta}</p>}
      </div>
      {canEdit ? (
        <input
          className="ktp-input qt-line-amount-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeNumber(editValue ?? amount)}
          onChange={(event) => onAmountChange(event.target.value)}
          autoFocus={autoFocus}
        />
      ) : (
        <strong style={{ color: tone === 'danger' ? '#ba1a1a' : '#00666d', whiteSpace: 'nowrap', fontSize: '13px' }}>
          {formatMoney(amount)}
        </strong>
      )}
    </div>
  );
}

function EmptySource({ children }) {
  return (
    <p style={{ margin: '8px 0 0', color: '#6f797a', fontSize: '13px', fontStyle: 'italic' }}>
      {children}
    </p>
  );
}

function SummaryLine({ label, value, tone = 'normal' }) {
  const color = tone === 'danger' ? '#ba1a1a' : tone === 'primary' ? '#00666d' : '#191c1d';
  return (
    <div className="qt-summary-line">
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

function KhauTruPanel({ title, value, children, editing, onEdit, onDone }) {
  return (
    <div className="qt-deduction-card">
      <div className="qt-deduction-head">
        <div>
          <h5>{title}</h5>
          <strong>{formatMoney(value)}</strong>
        </div>
        <button
          className={`qt-icon-btn${editing ? ' is-active' : ''}`}
          type="button"
          onClick={editing ? onDone : onEdit}
          title={editing ? 'Xong' : 'Sửa khoản này'}
          aria-label={editing ? 'Xong' : `Sửa ${title}`}
        >
          <Icon name={editing ? 'check' : 'edit_note'} />
        </button>
      </div>
      <div className="qt-deduction-lines">
        {children}
      </div>
    </div>
  );
}

function EvidenceValue({ value }) {
  if (!value) return '--';
  const href = evidenceHref(value);
  return (
    <a className="qt-evidence-link" href={href} target="_blank" rel="noreferrer">
      <Icon name="visibility" />
      <span>Xem chứng từ</span>
    </a>
  );
}

function ketQuaMeta(row) {
  if (row?.ketQuaDoiSoat === 'hoan-coc' || row?.trangThaiDoiSoat === 'Đã hoàn cọc') {
    return {
      label: 'Hoàn cọc',
      badgeClass: 'is-refund',
      amount: row.soTienHoanThucTe,
      amountTone: '#137333'
    };
  }

  if (row?.ketQuaDoiSoat === 'thu-them' || safeNumber(row?.soTienKhachPhaiTT) > 0) {
    return {
      label: 'Thu thêm',
      badgeClass: 'is-collect',
      amount: row.soTienKhachPhaiTT,
      amountTone: '#ba1a1a'
    };
  }

  return {
    label: 'Không phát sinh',
    badgeClass: 'is-neutral',
    amount: 0,
    amountTone: '#3f494a'
  };
}

function formatFileSize(bytes) {
  const size = safeNumber(bytes);
  if (size <= 0) return '';
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',').pop() : result);
    };
    reader.onerror = () => reject(new Error('Không đọc được file chứng từ.'));
    reader.readAsDataURL(file);
  });
}

function ChungTuUpload({ evidence, onFileSelect, onRemove }) {
  const inputId = 'qt-chung-tu-upload';
  const hasFile = Boolean(evidence?.name);
  const isImage = Boolean(evidence?.type?.startsWith('image/') && evidence?.previewUrl);

  function handleFiles(files) {
    const file = files?.[0];
    if (file) onFileSelect(file);
  }

  return (
    <div
      className={`qt-proof-upload${hasFile ? ' has-file' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        id={inputId}
        className="qt-proof-input"
        type="file"
        accept="image/*,.pdf"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {hasFile ? (
        <div className="qt-proof-file">
          <div className="qt-proof-preview">
            {isImage ? (
              <img src={evidence.previewUrl} alt="Minh chứng thanh toán" />
            ) : (
              <Icon name="description" />
            )}
          </div>
          <div className="qt-proof-meta">
            <strong>{evidence.name}</strong>
            <span>{evidence.type || 'Tệp chứng từ'}{evidence.size ? ` · ${formatFileSize(evidence.size)}` : ''}</span>
          </div>
          <button type="button" className="qt-proof-remove" onClick={onRemove} aria-label="Bỏ chứng từ">
            <Icon name="close" />
          </button>
        </div>
      ) : (
        <label className="qt-proof-empty" htmlFor={inputId}>
          <span className="qt-proof-icon"><Icon name="upload_file" /></span>
          <span>
            <strong>Tải ảnh chứng từ lên</strong>
            <small>Chọn ảnh/PDF hoặc kéo thả vào đây</small>
          </span>
        </label>
      )}
    </div>
  );
}

function GhiNhanThanhToanPanel({ type }) {
  const isThuThem = type === 'thu-them';
  const title = isThuThem ? 'Ghi nhận thu thêm' : 'Ghi nhận hoàn cọc';
  const amountLabel = isThuThem ? 'Số tiền thu thêm' : 'Số tiền hoàn cọc';
  const actionTitle = isThuThem ? 'Ghi nhận thu thêm' : 'Ghi nhận hoàn cọc';
  const amountField = isThuThem ? 'soTienKhachPhaiTT' : 'soTienHoanThucTe';
  const submitLabel = isThuThem ? 'Xác nhận thu thêm' : 'Xác nhận hoàn cọc';
  const emptyText = isThuThem
    ? 'Chưa có phiếu cần ghi nhận thu thêm.'
    : 'Chưa có phiếu cần ghi nhận hoàn cọc.';
  const [pendingRows, setPendingRows] = useState([]);
  const [completedRows, setCompletedRows] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingRows, setLoadingRows] = useState(false);
  const [localMessage, setLocalMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundDetail, setRefundDetail] = useState(null);
  const [refundRooms, setRefundRooms] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundForm, setRefundForm] = useState({
    phuongThucThanhToan: '',
    ngayThanhToan: new Date().toISOString().slice(0, 10),
    chungTuThanhToan: ''
  });
  const [refundEvidence, setRefundEvidence] = useState(null);

  async function loadRows() {
    setLoadingRows(true);
    setLocalError('');
    try {
      const [pendingResponse, completedResponse] = isThuThem
        ? await Promise.all([doiSoatApi.getDanhSachChoThuThem(), doiSoatApi.getDanhSachDaThuThem()])
        : await Promise.all([doiSoatApi.getDanhSachChoHoanCoc(), doiSoatApi.getDanhSachDaHoanCoc()]);
      setPendingRows(pendingResponse.data.danhSach || []);
      setCompletedRows(completedResponse.data.danhSach || []);
    } catch (err) {
      setLocalError(err.response?.data?.message || `Không tải được danh sách phiếu ${isThuThem ? 'thu thêm' : 'hoàn cọc'}.`);
    } finally {
      setLoadingRows(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [isThuThem]);

  useEffect(() => {
    return () => {
      if (refundEvidence?.previewUrl) {
        URL.revokeObjectURL(refundEvidence.previewUrl);
      }
    };
  }, [refundEvidence?.previewUrl]);

  function filterRows(sourceRows) {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return sourceRows;

    return sourceRows.filter((row) =>
      row.maDoiSoat?.toLowerCase().includes(keyword) ||
      row.maPhieuTra?.toLowerCase().includes(keyword) ||
      row.maHoSo?.toLowerCase().includes(keyword) ||
      row.hoTenKhachHang?.toLowerCase().includes(keyword) ||
      row.sdtKhachHang?.toLowerCase().includes(keyword)
    );
  }

  const filteredPendingRows = useMemo(() => filterRows(pendingRows), [pendingRows, searchText]);
  const filteredCompletedRows = useMemo(() => filterRows(completedRows), [completedRows, searchText]);
  const displayedRows = useMemo(() => {
    const pending = filteredPendingRows.map((row) => ({ ...row, _settlementMode: 'pending' }));
    const completed = filteredCompletedRows.map((row) => ({ ...row, _settlementMode: 'completed' }));

    if (statusFilter === 'pending') return pending;
    if (statusFilter === 'completed') return completed;
    return [...pending, ...completed];
  }, [filteredPendingRows, filteredCompletedRows, statusFilter]);
  const statusFilters = [
    { key: 'all', label: 'Tất cả', count: pendingRows.length + completedRows.length },
    { key: 'pending', label: 'Chờ ghi nhận', count: pendingRows.length },
    { key: 'completed', label: 'Đã ghi nhận', count: completedRows.length }
  ];

  async function openRefundModal(row, mode = 'pending') {
    const isCompleted = mode === 'completed';
    setSelectedRefund({ ...row, _viewMode: mode });
    setRefundDetail(null);
    setRefundRooms([]);
    setLocalError('');
    setLocalMessage('');
    setRefundForm({
      phuongThucThanhToan: row.phuongThucThanhToan || '',
      ngayThanhToan: isCompleted && row.ngayThanhToan
        ? new Date(row.ngayThanhToan).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      chungTuThanhToan: row.chungTuThanhToan || ''
    });
    setRefundEvidence(null);
    setLoadingDetail(true);

    try {
      const response = isThuThem
        ? await doiSoatApi.getChiTietThuThem(row.maDoiSoat)
        : await doiSoatApi.getChiTietHoanCoc(row.maDoiSoat);
      setRefundDetail(response.data.chiTiet);
      setRefundRooms(response.data.danhSachPhong || []);
      setRefundForm((prev) => ({
        ...prev,
        phuongThucThanhToan: response.data.chiTiet?.phuongThucThanhToan || row.phuongThucThanhToan || '',
        ngayThanhToan: response.data.chiTiet?.ngayThanhToan
          ? new Date(response.data.chiTiet.ngayThanhToan).toISOString().slice(0, 10)
          : prev.ngayThanhToan,
        chungTuThanhToan: response.data.chiTiet?.chungTuThanhToan || row.chungTuThanhToan || prev.chungTuThanhToan
      }));
    } catch (err) {
      setLocalError(err.response?.data?.message || `Không tải được chi tiết ${isThuThem ? 'thu thêm' : 'hoàn cọc'}.`);
      setSelectedRefund(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function submitRefund() {
    if (!selectedRefund) return;
    if (!refundForm.phuongThucThanhToan) {
      setLocalError('Vui lòng chọn phương thức thanh toán.');
      return;
    }
    if (!refundForm.ngayThanhToan) {
      setLocalError('Vui lòng chọn ngày thanh toán.');
      return;
    }

    setSubmittingRefund(true);
    setLocalError('');
    setLocalMessage('');
    try {
      let chungTuThanhToan = refundForm.chungTuThanhToan;
      if (refundEvidence?.file) {
        const dataBase64 = await readFileAsBase64(refundEvidence.file);
        const uploadResponse = await doiSoatApi.uploadChungTu({
          maDoiSoat: selectedRefund.maDoiSoat,
          fileName: refundEvidence.name,
          contentType: refundEvidence.type,
          dataBase64
        });
        chungTuThanhToan = uploadResponse.data.url;
      }

      const payload = {
        maDoiSoat: selectedRefund.maDoiSoat,
        phuongThucThanhToan: refundForm.phuongThucThanhToan,
        ngayThanhToan: refundForm.ngayThanhToan,
        chungTuThanhToan
      };
      if (isThuThem) {
        await doiSoatApi.xacNhanThuThem(payload);
      } else {
        await doiSoatApi.xacNhanHoanCoc(payload);
      }
      setLocalMessage(`Đã ghi nhận ${isThuThem ? 'thu thêm' : 'hoàn cọc'} cho phiếu ${selectedRefund.maDoiSoat}.`);
      setSelectedRefund(null);
      await loadRows();
    } catch (err) {
      setLocalError(err.response?.data?.message || `Không ghi nhận được ${isThuThem ? 'thu thêm' : 'hoàn cọc'}.`);
    } finally {
      setSubmittingRefund(false);
    }
  }

  function handleEvidenceSelect(file) {
    setRefundEvidence((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      };
    });
    setRefundForm((prev) => ({
      ...prev,
      chungTuThanhToan: file.name
    }));
  }

  function removeEvidence() {
    setRefundEvidence((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setRefundForm((prev) => ({ ...prev, chungTuThanhToan: '' }));
  }

  function renderSettlementTable(tableRows) {
    const settlementName = isThuThem ? 'thu thêm' : 'hoàn cọc';
    const sectionMeta = {
      all: {
        title: `Tất cả phiếu ${settlementName}`,
        subtitle: `Bao gồm phiếu chờ ghi nhận và phiếu đã ghi nhận ${settlementName}.`,
        empty: `Chưa có phiếu ${settlementName}.`,
        icon: 'receipt_long'
      },
      pending: {
        title: `Chờ ghi nhận ${settlementName}`,
        subtitle: `Các phiếu đang chờ kế toán ${settlementName}.`,
        empty: emptyText,
        icon: isThuThem ? 'payments' : 'account_balance_wallet'
      },
      completed: {
        title: `Đã ghi nhận ${settlementName}`,
        subtitle: `Các phiếu ${settlementName} đã được kế toán xử lý.`,
        empty: `Chưa có phiếu ${settlementName} đã ghi nhận.`,
        icon: 'task_alt'
      }
    };
    const currentSection = sectionMeta[statusFilter] || sectionMeta.all;

    return (
      <section className="ktp-table-section qt-settlement-section">
        <div className="qt-settlement-section-head">
          <div>
            <h4>{currentSection.title}</h4>
            <p>{currentSection.subtitle}</p>
          </div>
          <span>{tableRows.length} phiếu</span>
        </div>
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã đối soát</th>
              <th>Khách hàng</th>
              <th>Hồ sơ</th>
              <th>{amountLabel}</th>
              <th>Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loadingRows ? (
              <tr>
                <td colSpan="6" className="text-center">Đang tải danh sách...</td>
              </tr>
            ) : tableRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  <div className="qt-empty-workflow">
                    <Icon name={currentSection.icon} />
                    <strong>{currentSection.title}</strong>
                    <span>{currentSection.empty}</span>
                  </div>
                </td>
              </tr>
            ) : tableRows.map((row) => {
              const rowMode = row._settlementMode || 'pending';
              const isCompletedRow = rowMode === 'completed';

              return (
                <tr key={`${rowMode}-${row.maDoiSoat}`}>
                  <td style={{ fontWeight: 700, color: '#00666d' }}>{row.maDoiSoat}</td>
                  <td>
                    <p style={{ margin: 0, fontWeight: 600 }}>{row.hoTenKhachHang || '--'}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>{row.sdtKhachHang || '--'}</p>
                  </td>
                  <td>
                    <span className="ktp-badge ktp-badge-outline">{row.maHoSo || '--'}</span>
                    <p style={{ margin: '4px 0 0', color: '#6f797a', fontSize: '12px' }}>
                      {row.tenPhong || '--'}{row.maGiuong ? ` - ${row.maGiuong}` : ''}
                      {safeNumber(row.soLuongPhongGiuong) > 1 ? ` và ${safeNumber(row.soLuongPhongGiuong) - 1} mục khác` : ''}
                    </p>
                  </td>
                  <td style={{ color: isThuThem ? '#ba1a1a' : '#137333', fontWeight: 800 }}>
                    {formatMoney(row[amountField])}
                  </td>
                  <td><span className="ktp-badge ktp-badge-secondary">{row.trangThaiDoiSoat}</span></td>
                  <td className="text-center">
                    <button className="ktp-btn-action-fill" type="button" onClick={() => openRefundModal(row, rowMode)}>
                      {isCompletedRow ? 'Chi tiết' : 'Ghi nhận'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <>
      <section className="qt-settlement-toolbar">
        <div className="qt-status-filters" aria-label="Bộ lọc trạng thái">
          {statusFilters.map((filter) => (
            <button
              key={filter.key}
              className={statusFilter === filter.key ? 'is-active' : ''}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
        <div className="qt-toolbar-actions">
          <div className="ktp-input-icon-wrap qt-compact-search">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input
              className="ktp-input ktp-input-with-icon"
              type="text"
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
          <button className="ktp-btn-submit" type="button" onClick={loadRows} disabled={loadingRows}>
            <Icon name="refresh" />
            {loadingRows ? 'Đang tải' : 'Làm mới'}
          </button>
        </div>
      </section>

      {localMessage && (
        <div className="ktp-warning-box" style={{ backgroundColor: '#dbe4e5', color: '#004f55', marginBottom: '16px' }}>
          <Icon name="check_circle" />
          <span>{localMessage}</span>
        </div>
      )}

      {localError && (
        <div className="ktp-warning-box" style={{ backgroundColor: '#ffdad6', color: '#410002', marginBottom: '16px' }}>
          <Icon name="error_outline" />
          <span>{localError}</span>
        </div>
      )}

      {renderSettlementTable(displayedRows)}

      {selectedRefund && (
        <div className="ktp-modal-overlay" onClick={() => setSelectedRefund(null)}>
          <div className="ktp-modal qt-refund-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff' }}>
              <div>
                <h3 style={{ color: '#ffffff' }}>{selectedRefund._viewMode === 'completed' ? `Chi tiết ${isThuThem ? 'thu thêm' : 'hoàn cọc'}` : actionTitle}</h3>
                <p className="ktp-modal-header-sub" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Mã đối soát: <span style={{ color: '#ffffff' }}>{selectedRefund.maDoiSoat}</span>
                </p>
              </div>
              <button className="ktp-modal-close" type="button" onClick={() => setSelectedRefund(null)} style={{ color: '#ffffff' }}>
                <Icon name="close" />
              </button>
            </div>

            <div className="ktp-modal-body qt-refund-body">
              {loadingDetail ? (
                <div className="text-center">Đang tải chi tiết...</div>
              ) : refundDetail ? (
                <>
                  <section className="ktp-section ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="person" /> Thông tin hồ sơ</h4>
                    <InfoRow label="Khách hàng" value={refundDetail.hoTenKhachHang} />
                    <InfoRow label="Số điện thoại" value={refundDetail.sdtKhachHang} />
                    <InfoRow label="Hồ sơ" value={refundDetail.maHoSo} />
                    <InfoRow label="Phiếu trả phòng" value={refundDetail.maPhieuTra} />
                    <InfoRow
                      label="Phòng/Giường"
                      value={refundRooms.map((room) => `${room.tenPhong || room.maPhong}${room.maGiuong ? ` - ${room.maGiuong}` : ''}`).join(', ') || '--'}
                    />
                  </section>

                  <section className="ktp-section ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="account_balance_wallet" /> Kết quả đối soát</h4>
                    <InfoRow label="Trạng thái đối soát" value={refundDetail.trangThaiDoiSoat} />
                    <InfoRow label="Trạng thái trả phòng" value={refundDetail.trangThaiPhieuTra} />
                    <InfoRow label="Tiền cọc ban đầu" value={formatMoney(refundDetail.tienCocBanDau)} />
                    <InfoRow label="Tỷ lệ hoàn cọc" value={`${safeNumber(refundDetail.tyLeHoanCocHienTai)}%`} />
                    <InfoRow label="Tổng khấu trừ" value={formatMoney(refundDetail.tongKhauTru)} />
                    <InfoRow
                      label={isThuThem ? 'Số tiền khách phải thanh toán thêm' : 'Số tiền hoàn thực tế'}
                      value={formatMoney(refundDetail[amountField])}
                      strong
                    />
                  </section>

                  {selectedRefund._viewMode === 'completed' ? (
                    <section className="ktp-section ktp-info-box-outline">
                      <h4 className="ktp-section-title"><Icon name="task_alt" /> {isThuThem ? 'Thông tin đã thu thêm' : 'Thông tin đã hoàn cọc'}</h4>
                      <InfoRow label="Phương thức thanh toán" value={refundDetail.phuongThucThanhToan} />
                      <InfoRow label="Ngày thanh toán" value={formatDate(refundDetail.ngayThanhToan)} />
                      <InfoRow label="Chứng từ thanh toán" value={<EvidenceValue value={refundDetail.chungTuThanhToan} />} />
                    </section>
                  ) : (
                    <section className="ktp-section ktp-info-box-outline qt-refund-form">
                      <h4 className="ktp-section-title"><Icon name="payments" /> {isThuThem ? 'Thông tin thu thêm' : 'Thông tin hoàn cọc'}</h4>
                      <label className="ktp-filter-group">
                        <span className="ktp-filter-label">Phương thức thanh toán</span>
                        <select
                          className="ktp-input"
                          value={refundForm.phuongThucThanhToan}
                          onChange={(event) => setRefundForm((prev) => ({ ...prev, phuongThucThanhToan: event.target.value }))}
                        >
                          <option value="">Chọn phương thức</option>
                          <option value="Tiền mặt">Tiền mặt</option>
                          <option value="Chuyển khoản">Chuyển khoản</option>
                        </select>
                      </label>
                      <label className="ktp-filter-group">
                        <span className="ktp-filter-label">Ngày thanh toán</span>
                        <input
                          className="ktp-input"
                          type="date"
                          value={refundForm.ngayThanhToan}
                          onChange={(event) => setRefundForm((prev) => ({ ...prev, ngayThanhToan: event.target.value }))}
                        />
                      </label>
                      <div className="ktp-filter-group">
                        <span className="ktp-filter-label">Chứng từ thanh toán</span>
                        <ChungTuUpload
                          evidence={refundEvidence}
                          onFileSelect={handleEvidenceSelect}
                          onRemove={removeEvidence}
                        />
                      </div>
                    </section>
                  )}
                </>
              ) : null}
            </div>

            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" type="button" onClick={() => setSelectedRefund(null)}>
                {selectedRefund._viewMode === 'completed' ? 'Đóng' : 'Hủy'}
              </button>
              {selectedRefund._viewMode !== 'completed' && (
                <button className="ktp-btn-submit" type="button" onClick={submitRefund} disabled={submittingRefund || loadingDetail}>
                  <Icon name="check_circle" />
                  {submittingRefund ? 'Đang ghi nhận' : submitLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KetQuaDoiSoatPanel() {
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadRows() {
    setLoading(true);
    setError('');
    try {
      const response = await doiSoatApi.getKetQuaDoiSoat();
      setRows(response.data.danhSach || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách kết quả đối soát.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) =>
      row.maDoiSoat?.toLowerCase().includes(keyword) ||
      row.maPhieuTra?.toLowerCase().includes(keyword) ||
      row.maHoSo?.toLowerCase().includes(keyword) ||
      row.hoTenKhachHang?.toLowerCase().includes(keyword) ||
      row.sdtKhachHang?.toLowerCase().includes(keyword) ||
      row.trangThaiDoiSoat?.toLowerCase().includes(keyword)
    );
  }, [rows, searchText]);

  async function openDetail(row) {
    setSelected(row);
    setDetail(null);
    setRooms([]);
    setError('');
    setLoadingDetail(true);

    try {
      const response = row.ketQuaDoiSoat === 'hoan-coc'
        ? await doiSoatApi.getChiTietHoanCoc(row.maDoiSoat)
        : await doiSoatApi.getChiTietThuThem(row.maDoiSoat);
      setDetail(response.data.chiTiet);
      setRooms(response.data.danhSachPhong || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được chi tiết kết quả đối soát.');
      setSelected(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <>
      <section className="qt-settlement-toolbar">
        <div className="qt-status-filters" aria-label="Tổng kết kết quả đối soát">
          <button className="is-active" type="button">Kết quả đối soát ({rows.length})</button>
        </div>
        <div className="qt-toolbar-actions">
          <div className="ktp-input-icon-wrap qt-compact-search">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input
              className="ktp-input ktp-input-with-icon"
              type="text"
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
          <button className="ktp-btn-submit" type="button" onClick={loadRows} disabled={loading}>
            <Icon name="refresh" />
            {loading ? 'Đang tải' : 'Làm mới'}
          </button>
        </div>
      </section>

      {error && (
        <div className="ktp-warning-box" style={{ backgroundColor: '#ffdad6', color: '#410002', marginBottom: '16px' }}>
          <Icon name="error_outline" />
          <span>{error}</span>
        </div>
      )}

      <section className="ktp-table-section qt-settlement-section">
        <div className="qt-settlement-section-head">
          <div>
            <h4>Kết quả đối soát</h4>
            <p>Danh sách phiếu đã quyết toán hoặc đã hoàn cọc.</p>
          </div>
          <span>{filteredRows.length} phiếu</span>
        </div>
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã đối soát</th>
              <th>Khách hàng</th>
              <th>Hồ sơ</th>
              <th>Kết quả</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Ngày xử lý</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center">Đang tải danh sách...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  <div className="qt-empty-workflow">
                    <Icon name="task_alt" />
                    <strong>Kết quả đối soát</strong>
                    <span>Chưa có phiếu đã quyết toán hoặc đã hoàn cọc.</span>
                  </div>
                </td>
              </tr>
            ) : filteredRows.map((row) => {
              const meta = ketQuaMeta(row);

              return (
                <tr key={row.maDoiSoat}>
                  <td style={{ fontWeight: 700, color: '#00666d' }}>{row.maDoiSoat}</td>
                  <td>
                    <p style={{ margin: 0, fontWeight: 600 }}>{row.hoTenKhachHang || '--'}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>{row.sdtKhachHang || '--'}</p>
                  </td>
                  <td>
                    <span className="ktp-badge ktp-badge-outline">{row.maHoSo || '--'}</span>
                    <p style={{ margin: '4px 0 0', color: '#6f797a', fontSize: '12px' }}>
                      {row.tenPhong || '--'}{row.maGiuong ? ` - ${row.maGiuong}` : ''}
                      {safeNumber(row.soLuongPhongGiuong) > 1 ? ` và ${safeNumber(row.soLuongPhongGiuong) - 1} mục khác` : ''}
                    </p>
                  </td>
                  <td><span className={`ktp-badge qt-result-badge ${meta.badgeClass}`}>{meta.label}</span></td>
                  <td style={{ color: meta.amountTone, fontWeight: 800 }}>{formatMoney(meta.amount)}</td>
                  <td><span className="ktp-badge ktp-badge-secondary">{row.trangThaiDoiSoat}</span></td>
                  <td>{formatDate(row.ngayThanhToan || row.ngayLap)}</td>
                  <td className="text-center">
                    <button className="ktp-btn-action-fill" type="button" onClick={() => openDetail(row)}>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {selected && (
        <div className="ktp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ktp-modal qt-refund-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff' }}>
              <div>
                <h3 style={{ color: '#ffffff' }}>Chi tiết kết quả đối soát</h3>
                <p className="ktp-modal-header-sub" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Mã đối soát: <span style={{ color: '#ffffff' }}>{selected.maDoiSoat}</span>
                </p>
              </div>
              <button className="ktp-modal-close" type="button" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}>
                <Icon name="close" />
              </button>
            </div>

            <div className="ktp-modal-body qt-refund-body">
              {loadingDetail ? (
                <div className="text-center" style={{ padding: '28px' }}>Đang tải chi tiết...</div>
              ) : detail ? (
                <>
                  <section className="ktp-section ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="person" /> Thông tin hồ sơ</h4>
                    <InfoRow label="Khách hàng" value={detail.hoTenKhachHang} />
                    <InfoRow label="Số điện thoại" value={detail.sdtKhachHang} />
                    <InfoRow label="Mã hồ sơ" value={detail.maHoSo} />
                    <InfoRow label="Phòng/Giường" value={rooms.map((room) => `${room.tenPhong || room.maPhong}${room.maGiuong ? ` - ${room.maGiuong}` : ''}`).join(', ') || '--'} />
                  </section>

                  <section className="ktp-section ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="task_alt" /> Kết quả đối soát</h4>
                    <InfoRow label="Trạng thái đối soát" value={detail.trangThaiDoiSoat} />
                    <InfoRow label="Trạng thái trả phòng" value={detail.trangThaiPhieuTra} />
                    <InfoRow label="Tiền cọc ban đầu" value={formatMoney(detail.tienCocBanDau)} />
                    <InfoRow label="Tổng khấu trừ" value={formatMoney(detail.tongKhauTru)} />
                    <InfoRow label="Số tiền hoàn thực tế" value={formatMoney(detail.soTienHoanThucTe)} strong />
                    <InfoRow label="Số tiền khách thanh toán thêm" value={formatMoney(detail.soTienKhachPhaiTT)} strong />
                  </section>

                  <section className="ktp-section ktp-info-box-outline">
                    <h4 className="ktp-section-title"><Icon name="payments" /> Thông tin thanh toán</h4>
                    <InfoRow label="Phương thức thanh toán" value={detail.phuongThucThanhToan} />
                    <InfoRow label="Ngày thanh toán" value={formatDate(detail.ngayThanhToan)} />
                    <InfoRow label="Chứng từ thanh toán" value={<EvidenceValue value={detail.chungTuThanhToan} />} />
                  </section>
                </>
              ) : null}
            </div>

            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" type="button" onClick={() => setSelected(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function QuyetToanTraPhongTab() {
  const [activeQuyetToanTab, setActiveQuyetToanTab] = useState('lap-doi-soat');
  const [danhSach, setDanhSach] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingKhoan, setEditingKhoan] = useState(null);
  const [form, setForm] = useState({
    tienThueConNo: 0,
    tienDichVuConNo: 0,
    tongChiPhiSuaChua: 0,
    tienPhat: 0,
    ghiChuPhanHoiKhach: ''
  });
  const [deductionValues, setDeductionValues] = useState({
    rentLines: {},
    serviceLines: {},
    repairLines: {},
    penaltyLines: {}
  });

  async function loadDanhSach() {
    setLoading(true);
    setError('');
    try {
      const response = await doiSoatApi.getDanhSachChoDoiSoat();
      setDanhSach(response.data.danhSach || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách phiếu trả phòng.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDanhSach();
  }, []);

  const filteredDanhSach = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return danhSach;
    return danhSach.filter((item) =>
      item.maPhieuTra?.toLowerCase().includes(keyword) ||
      item.maHopDong?.toLowerCase().includes(keyword) ||
      item.maPhieuDatCoc?.toLowerCase().includes(keyword) ||
      item.hoTenKhachHang?.toLowerCase().includes(keyword) ||
      item.sdtKhachHang?.toLowerCase().includes(keyword)
    );
  }, [danhSach, search]);

  const preview = useMemo(() => calculatePreview(selected, form), [selected, form]);

  async function openDetail(maPhieuTra) {
    setDetailLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await doiSoatApi.getChiTietPhieuTraPhong(maPhieuTra);
      const data = response.data;
      const initialDeductionValues = buildInitialDeductionValues(data);
      setSelected(data);
      setEditingKhoan(null);
      setDeductionValues(initialDeductionValues);
      setForm(buildFormFromDeductionValues(data.macDinhKhauTru, initialDeductionValues));
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được chi tiết phiếu trả phòng.');
    } finally {
      setDetailLoading(false);
    }
  }


  function updateDeductionLine(group, key, value) {
    const nextDeductionValues = {
      ...deductionValues,
      [group]: {
        ...deductionValues[group],
        [key]: safeNumber(value)
      }
    };

    setDeductionValues(nextDeductionValues);
    setForm((prev) => ({
      ...prev,
      tienThueConNo: hasLineValues(nextDeductionValues.rentLines)
        ? sumLineValues(nextDeductionValues.rentLines)
        : prev.tienThueConNo,
      tienDichVuConNo: hasLineValues(nextDeductionValues.serviceLines)
        ? sumLineValues(nextDeductionValues.serviceLines)
        : prev.tienDichVuConNo,
      tongChiPhiSuaChua: hasLineValues(nextDeductionValues.repairLines)
        ? sumLineValues(nextDeductionValues.repairLines)
        : prev.tongChiPhiSuaChua,
      tienPhat: hasLineValues(nextDeductionValues.penaltyLines)
        ? sumLineValues(nextDeductionValues.penaltyLines)
        : prev.tienPhat
    }));
  }


  async function handleSubmit() {
    if (!selected) return;

    const moneyValues = [
      form.tienThueConNo,
      form.tienDichVuConNo,
      form.tongChiPhiSuaChua,
      form.tienPhat
    ];

    if (moneyValues.some((value) => safeNumber(value) < 0)) {
      setError('Các khoản tiền không được âm.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await doiSoatApi.taoDoiSoat({
        maPhieuTra: selected.phieuTraPhong.maPhieuTra,
        tienThueConNo: safeNumber(form.tienThueConNo),
        tienDichVuConNo: safeNumber(form.tienDichVuConNo),
        tongChiPhiSuaChua: safeNumber(form.tongChiPhiSuaChua),
        tienPhat: safeNumber(form.tienPhat),
        ghiChuPhanHoiKhach: form.ghiChuPhanHoiKhach
      });
      setMessage(`Đã lập phiếu đối soát ${response.data.doiSoat?.maDoiSoat || ''}.`);
      setSelected(null);
      await loadDanhSach();
    } catch (err) {
      setError(err.response?.data?.message || 'Không lập được phiếu đối soát.');
    } finally {
      setSubmitting(false);
    }
  }

  const hoSoChinh = selected?.hopDong || selected?.phieuDatCoc;
  const chiTietKhauTru = selected?.chiTietKhauTru || {};
  const hoaDonConNo = chiTietKhauTru.hoaDonConNo || chiTietKhauTru.tienThueConNo || [];
  const chiTietHoaDon = chiTietKhauTru.chiTietHoaDon || [];
  const bienBanKiemTra = chiTietKhauTru.bienBanKiemTra || [];
  const chiTietHuHong = chiTietKhauTru.chiTietHuHong || [];
  const bienBanViPham = chiTietKhauTru.bienBanViPham || [];

  return (
    <div className="ktp-container">
      <nav className="qt-subtab-bar" aria-label="Nghiệp vụ quyết toán trả phòng">
        {QUYET_TOAN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`qt-subtab-btn${activeQuyetToanTab === tab.id ? ' is-active' : ''}`}
            onClick={() => {
              setActiveQuyetToanTab(tab.id);
              setSelected(null);
              setEditingKhoan(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeQuyetToanTab === 'lap-doi-soat' && (
        <>
      <section className="ktp-filter-section" style={{ gridTemplateColumns: 'minmax(220px, 1fr) auto' }}>
        <div className="ktp-filter-group">
          <label className="ktp-filter-label">Tìm kiếm</label>
          <div className="ktp-input-icon-wrap">
            <span className="ktp-input-icon"><Icon name="search" /></span>
            <input
              className="ktp-input ktp-input-with-icon"
              type="text"
              placeholder="Mã phiếu, khách hàng, hợp đồng..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="ktp-filter-group" style={{ justifyContent: 'flex-end' }}>
          <button className="ktp-btn-submit" type="button" onClick={loadDanhSach} disabled={loading}>
            <Icon name="refresh" />
            {loading ? 'Đang tải' : 'Làm mới'}
          </button>
        </div>
      </section>

      {message && (
        <div className="ktp-warning-box" style={{ backgroundColor: '#dbe4e5', color: '#004f55', marginBottom: '16px' }}>
          <Icon name="check_circle" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="ktp-warning-box" style={{ backgroundColor: '#ffdad6', color: '#410002', marginBottom: '16px' }}>
          <Icon name="error_outline" />
          <span>{error}</span>
        </div>
      )}

      <section className="ktp-table-section">
        <table className="ktp-table">
          <thead>
            <tr>
              <th>Mã phiếu trả</th>
              <th>Khách hàng</th>
              <th>Hồ sơ</th>
              <th>Ngày trả thực tế</th>
              <th>Trạng thái</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">Đang tải danh sách...</td>
              </tr>
            ) : filteredDanhSach.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">Không có phiếu trả phòng chờ đối soát.</td>
              </tr>
            ) : filteredDanhSach.map((row) => (
              <tr key={row.maPhieuTra}>
                <td style={{ fontWeight: 700, color: '#00666d' }}>{row.maPhieuTra}</td>
                <td>
                  <p style={{ margin: 0, fontWeight: 600 }}>{row.hoTenKhachHang || '--'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#414753' }}>{row.sdtKhachHang || row.emailKhachHang || '--'}</p>
                </td>
                <td>
                  <span className="ktp-badge ktp-badge-outline">
                    {row.maHopDong || row.maPhieuDatCoc || '--'}
                  </span>
                </td>
                <td>{formatDate(row.ngayTraThucTe)}</td>
                <td><span className="ktp-badge ktp-badge-secondary">{row.trangThai}</span></td>
                <td className="text-center">
                  <button
                    className="ktp-btn-action-fill"
                    type="button"
                    onClick={() => openDetail(row.maPhieuTra)}
                    disabled={detailLoading}
                  >
                    Lập đối soát
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ktp-pagination">
          <span style={{ fontSize: '14px', color: '#414753', marginRight: 'auto', fontWeight: 500 }}>
            {filteredDanhSach.length} phiếu chờ xử lý
          </span>
        </div>
      </section>
        </>
      )}

      {activeQuyetToanTab === 'ghi-nhan-thu-them' && (
        <GhiNhanThanhToanPanel type="thu-them" />
      )}

      {activeQuyetToanTab === 'ghi-nhan-hoan-coc' && (
        <GhiNhanThanhToanPanel type="hoan-coc" />
      )}

      {activeQuyetToanTab === 'ket-qua-doi-soat' && (
        <KetQuaDoiSoatPanel />
      )}

      {activeQuyetToanTab === 'lap-doi-soat' && selected && (
        <div className="ktp-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ktp-modal qt-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ktp-modal-header" style={{ alignItems: 'center', backgroundColor: '#3b8280', color: '#ffffff' }}>
              <div>
                <h3 style={{ color: '#ffffff' }}>Lập phiếu đối soát trả phòng</h3>
                <p className="ktp-modal-header-sub" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Mã phiếu trả: <span style={{ color: '#ffffff' }}>{selected.phieuTraPhong.maPhieuTra}</span>
                </p>
              </div>
              <button className="ktp-modal-close" type="button" onClick={() => setSelected(null)} style={{ color: '#ffffff' }}>
                <Icon name="close" />
              </button>
            </div>

            <div className="ktp-modal-body qt-modal-body">
              <div className="qt-main-column">
              <div className="ktp-grid-2">
                <section className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title"><Icon name="person" /> 1. Thông tin khách hàng</h4>
                  <InfoRow label="Họ tên" value={selected.khachHang?.hoTen} />
                  <InfoRow label="Số điện thoại" value={selected.khachHang?.sdt} />
                  <InfoRow label="Email" value={selected.khachHang?.email} />
                  <InfoRow label="CCCD" value={selected.khachHang?.cccd} />
                </section>

                <section className="ktp-section ktp-info-box-outline">
                  <h4 className="ktp-section-title">
                    <Icon name={selected.loaiHoSo === LOAI_HO_SO.HOP_DONG_THUE ? 'receipt_long' : 'account_balance'} />
                    {selected.loaiHoSo === LOAI_HO_SO.HOP_DONG_THUE ? '2. Thông tin hợp đồng' : '2. Thông tin phiếu đặt cọc'}
                  </h4>
                  <InfoRow label="Mã hồ sơ" value={hoSoChinh?.maHopDong || hoSoChinh?.maPhieuDatCoc} />
                  <InfoRow label="Tiền cọc ban đầu" value={formatMoney(preview?.tienCocBanDau)} strong />
                  <InfoRow label="Phòng/Giường" value={(selected.danhSachPhong || []).map((p) => `${p.tenPhong || p.maPhong}${p.maGiuong ? ` - ${p.maGiuong}` : ''}`).join(', ') || '--'} />
                  {selected.hopDong && (
                    <>
                      <InfoRow label="Ngày bắt đầu" value={formatDate(selected.hopDong.ngayBatDau)} />
                      <InfoRow label="Ngày kết thúc" value={formatDate(selected.hopDong.ngayKetThuc)} />
                      <InfoRow label="Kỳ thanh toán" value={selected.hopDong.kyThanhToan} />
                    </>
                  )}
                  {selected.phieuDatCoc && (
                    <>
                      <InfoRow label="Thanh toán cọc" value={selected.phieuDatCoc.trangThaiThanhToan} />
                      <InfoRow label="Trạng thái cọc" value={selected.phieuDatCoc.trangThaiCoc} />
                      <InfoRow label="Loại hồ sơ" value="Đặt cọc chưa ký hợp đồng" />
                    </>
                  )}
                </section>
              </div>

              <section className="ktp-section ktp-info-box-outline">
                <h4 className="ktp-section-title"><Icon name="money_off" /> 3. Các khoản khấu trừ</h4>
                <div className="qt-deduction-grid">
                  <KhauTruPanel
                    title="Tiền thuê còn nợ"
                    value={safeNumber(form.tienThueConNo) + safeNumber(form.tienDichVuConNo)}
                    editing={editingKhoan === 'hoaDonConNo'}
                    onEdit={() => setEditingKhoan('hoaDonConNo')}
                    onDone={() => setEditingKhoan(null)}
                  >
                    {hoaDonConNo.length === 0 ? (
                      <EmptySource>Không có hóa đơn còn nợ.</EmptySource>
                    ) : hoaDonConNo.map((hoaDon) => {
                      const details = chiTietHoaDon.filter((item) => item.maHoaDon === hoaDon.maHoaDon);
                      const rentKey = makeLineKey('rent', hoaDon.maHoaDon, hoaDon.maHopDong, hoaDon.kyThanhToan);
                      const rentAmount = getLineAmount(deductionValues.rentLines, rentKey, hoaDon.thanhTien);
                      const serviceTotal = details.reduce((total, line) => {
                        const detailKey = makeLineKey('service', line.maChiTietHD, line.maHoaDon);
                        return total + getLineAmount(deductionValues.serviceLines, detailKey, line.thanhTien);
                      }, 0);

                      return (
                        <div key={hoaDon.maHoaDon || `${hoaDon.maHopDong}-${hoaDon.kyThanhToan}`} className="qt-debt-group">
                          <SourceLine
                            title={`Hóa đơn ${hoaDon.maHoaDon || '--'} - kỳ ${hoaDon.kyThanhToan || '--'}`}
                            meta={`Hạn TT: ${formatDate(hoaDon.ngayHanTT)} · Trạng thái: ${hoaDon.trangThai || '--'}`}
                            amount={rentAmount + serviceTotal}
                            tone="danger"
                          />
                          <SourceLine
                            title="Tiền thuê"
                            meta={`Hợp đồng: ${hoaDon.maHopDong || selected.hopDong?.maHopDong || '--'} · Giá thuê HĐ: ${formatMoney(hoaDon.giaThueHopDong)}`}
                            amount={rentAmount}
                            tone="danger"
                            editing={editingKhoan === 'hoaDonConNo'}
                            editValue={rentAmount}
                            onAmountChange={(value) => updateDeductionLine('rentLines', rentKey, value)}
                          />
                          {details.length === 0 ? (
                            <EmptySource>Hóa đơn chưa có dòng dịch vụ.</EmptySource>
                          ) : details.map((line) => (
                            <SourceLine
                              key={line.maChiTietHD}
                              title={line.tenDichVu || line.maChiTietHD}
                              meta={`Loại: ${line.loaiKhoanNo || 'Dịch vụ'} · SL: ${safeNumber(line.soLuong)} ${line.donViTinh || ''} · Đơn giá: ${formatMoney(line.donGia)}${line.maPhieuGhi ? ` · Phiếu ghi: ${line.maPhieuGhi}` : ''}`}
                              amount={getLineAmount(deductionValues.serviceLines, makeLineKey('service', line.maChiTietHD, line.maHoaDon), line.thanhTien)}
                              tone="danger"
                              editing={editingKhoan === 'hoaDonConNo'}
                              editValue={getLineAmount(deductionValues.serviceLines, makeLineKey('service', line.maChiTietHD, line.maHoaDon), line.thanhTien)}
                              onAmountChange={(value) => updateDeductionLine('serviceLines', makeLineKey('service', line.maChiTietHD, line.maHoaDon), value)}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </KhauTruPanel>

                  <KhauTruPanel
                    title="Chi phí sửa chữa"
                    value={form.tongChiPhiSuaChua}
                    editing={editingKhoan === 'tongChiPhiSuaChua'}
                    onEdit={() => setEditingKhoan('tongChiPhiSuaChua')}
                    onDone={() => setEditingKhoan(null)}
                  >
                    {bienBanKiemTra.length === 0 ? (
                      <EmptySource>Chưa có biên bản kiểm tra phòng.</EmptySource>
                    ) : bienBanKiemTra.map((bienBan) => {
                      const damages = chiTietHuHong.filter((item) => item.maBienBanKT === bienBan.maBienBanKT);
                      const reportKey = makeLineKey('repair-report', bienBan.maBienBanKT);
                      const reportAmount = damages.length === 0
                        ? getLineAmount(deductionValues.repairLines, reportKey, bienBan.tongChiPhiSuaChua)
                        : damages.reduce((total, damage) => {
                            const damageKey = makeLineKey('repair', damage.maChiTietHH, damage.maBienBanKT);
                            return total + getLineAmount(deductionValues.repairLines, damageKey, damage.chiPhiSuaChua);
                          }, 0);

                      return (
                        <div key={bienBan.maBienBanKT} style={{ borderTop: '1px solid #e1e3e4', paddingTop: '10px', marginTop: '10px' }}>
                          <SourceLine
                            title={`Biên bản ${bienBan.maBienBanKT}`}
                            meta={`Ngày kiểm tra: ${formatDate(bienBan.ngayKiemTra)}${bienBan.tinhTrangPhong ? ` · ${bienBan.tinhTrangPhong}` : ''}`}
                            amount={reportAmount}
                            tone="danger"
                            editing={editingKhoan === 'tongChiPhiSuaChua' && damages.length === 0}
                            editValue={reportAmount}
                            onAmountChange={damages.length === 0 ? (value) => updateDeductionLine('repairLines', reportKey, value) : undefined}
                          />
                          {damages.length === 0 ? (
                            <EmptySource>Biên bản không có chi tiết hư hỏng.</EmptySource>
                          ) : damages.map((damage) => (
                            <SourceLine
                              key={damage.maChiTietHH}
                              title={`${damage.tenTaiSan || damage.maTaiSan || 'Tài sản'} - ${damage.maPhong || '--'}`}
                              meta={damage.moTaHuHong || 'Chưa có mô tả hư hỏng'}
                              amount={getLineAmount(deductionValues.repairLines, makeLineKey('repair', damage.maChiTietHH, damage.maBienBanKT), damage.chiPhiSuaChua)}
                              tone="danger"
                              editing={editingKhoan === 'tongChiPhiSuaChua'}
                              editValue={getLineAmount(deductionValues.repairLines, makeLineKey('repair', damage.maChiTietHH, damage.maBienBanKT), damage.chiPhiSuaChua)}
                              onAmountChange={(value) => updateDeductionLine('repairLines', makeLineKey('repair', damage.maChiTietHH, damage.maBienBanKT), value)}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </KhauTruPanel>

                  <KhauTruPanel
                    title="Tiền phạt"
                    value={form.tienPhat}
                    editing={editingKhoan === 'tienPhat'}
                    onEdit={() => setEditingKhoan('tienPhat')}
                    onDone={() => setEditingKhoan(null)}
                  >
                    {bienBanViPham.length === 0 ? (
                      <EmptySource>Không có biên bản vi phạm đang Chờ xử lý.</EmptySource>
                    ) : bienBanViPham.map((viPham) => (
                      <SourceLine
                        key={viPham.maBBViPham}
                        title={`Biên bản ${viPham.maBBViPham}${viPham.tenDieuKhoan ? ` - ${viPham.tenDieuKhoan}` : ''}`}
                        meta={`Ngày vi phạm: ${formatDate(viPham.ngayViPham)}${viPham.moTaViPham ? ` · ${viPham.moTaViPham}` : ''}`}
                        amount={getLineAmount(deductionValues.penaltyLines, makeLineKey('penalty', viPham.maBBViPham), viPham.soTienPhat)}
                        tone="danger"
                        editing={editingKhoan === 'tienPhat'}
                        editValue={getLineAmount(deductionValues.penaltyLines, makeLineKey('penalty', viPham.maBBViPham), viPham.soTienPhat)}
                        onAmountChange={(value) => updateDeductionLine('penaltyLines', makeLineKey('penalty', viPham.maBBViPham), value)}
                      />
                    ))}
                  </KhauTruPanel>
                </div>
              </section>

              </div>

              <aside className="qt-summary-panel">
                <h4 className="ktp-section-title"><Icon name="calculate" /> Tóm tắt đối soát</h4>
                <div className="qt-summary-card">
                  <SummaryLine label="Tiền cọc ban đầu" value={formatMoney(preview?.tienCocBanDau)} tone="primary" />
                  <SummaryLine label="Số tháng lưu trú" value={preview?.soThangLuuTru ?? 0} />
                  <SummaryLine label="Tỷ lệ hoàn cọc" value={`${preview?.tyLeHoanCocHienTai ?? 0}%`} />
                  <SummaryLine label="Cọc được hoàn" value={formatMoney(preview?.tienCocDuocHoan)} tone="primary" />
                  <SummaryLine label="Tổng khấu trừ" value={formatMoney(preview?.tongKhauTru)} tone="danger" />
                  <SummaryLine label="Số tiền hoàn thực tế" value={formatMoney(preview?.soTienHoanThucTe)} tone={preview?.soTienHoanThucTe > 0 ? 'primary' : 'danger'} />
                  <SummaryLine label="Số tiền khách phải thanh toán thêm" value={formatMoney(preview?.soTienKhachPhaiTT)} tone="danger" />
                </div>

                <div className={`qt-result-box${preview?.soTienKhachPhaiTT > 0 ? ' is-danger' : ' is-primary'}`}>
                  <Icon name={preview?.soTienKhachPhaiTT > 0 ? 'warning' : 'check_circle'} />
                  <div>
                    <span>Kết quả: {resultText(preview)}</span>
                    <strong>{formatMoney(preview?.soTienKhachPhaiTT > 0 ? preview?.soTienKhachPhaiTT : preview?.soTienHoanThucTe)}</strong>
                  </div>
                </div>

                <div className="qt-info-note">
                  <Icon name="info" />
                  <span>Sau khi lập phiếu, phiếu đối soát sẽ chuyển sang trạng thái Chờ xác nhận.</span>
                </div>
              </aside>
            </div>

            <div className="ktp-modal-footer">
              <button className="ktp-btn-cancel" type="button" onClick={() => setSelected(null)}>
                Hủy
              </button>
              <button className="ktp-btn-submit" type="button" onClick={handleSubmit} disabled={submitting}>
                <Icon name="check_circle" />
                {submitting ? 'Đang lập phiếu' : 'Xác nhận lập phiếu đối soát'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
