import React, { useState, useEffect, useCallback } from 'react';
import { traPhongApi } from './traPhong.api.js';
import './yeuCauTraPhong.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trangThaiClass(ts) {
  if (ts === 'Chờ xử lý')  return 'warn';
  if (ts === 'Hoàn tất')   return 'done';
  if (ts === 'Hủy')        return 'cancel';
  return '';
}

function formatMoney(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + ' ₫';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContractCard({ item, selected, onClick }) {
  const isHopDong = item.loai === 'HopDong';
  return (
    <button
      type="button"
      className={`yct-contract-card${selected ? ' selected' : ''}${item.dangCoYeuCau ? ' has-request' : ''}`}
      onClick={onClick}
    >
      {selected && (
        <span className="yct-check" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="currentColor" />
            <path d="M4.5 8.3l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className="yct-cc-top">
        <strong className="yct-cc-room">{item.tenPhong}</strong>
        <span className="yct-cc-id">
          {isHopDong ? 'Hợp đồng' : 'Đặt cọc'} · {item.maHopDong}
        </span>
      </div>
      <p className="yct-cc-branch">
        <svg viewBox="0 0 16 16" fill="none" className="yct-pin-icon">
          <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3-4.5 8.5-4.5 8.5S3.5 9 3.5 6A4.5 4.5 0 0 1 8 1.5Z" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        {item.tenChiNhanh}
      </p>
      <div className="yct-cc-pills">
        <span className="yct-pill">{item.hinhThucThue}</span>
        <span className="yct-pill price">{formatMoney(item.giaThu)}/tháng</span>
      </div>
      <div className="yct-cc-status">
        {item.dangCoYeuCau ? (
          <span className="yct-status warn-inline">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <circle cx="8" cy="11" r=".9" fill="currentColor"/>
            </svg>
            Đang có yêu cầu
          </span>
        ) : (
          <span className="yct-status ok-inline">{item.trangThai}</span>
        )}
        {item.ngayBatDau && (
          <span className="yct-date-range">Từ {item.ngayBatDau} →</span>
        )}
      </div>
    </button>
  );
}

function DetailPanel({ item, onSuccess }) {
  const [ngayDuKien, setNgayDuKien]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [phieuMoi, setPhieuMoi]         = useState(null);

  const today    = new Date().toLocaleDateString('vi-VN');
  const todayISO = new Date().toISOString().split('T')[0];
  const isHopDong = item.loai === 'HopDong';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!ngayDuKien) {
      setError('Vui lòng nhập ngày dự kiến trả phòng.');
      return;
    }
    if (ngayDuKien < todayISO) {
      setError('Ngày dự kiến trả phòng không hợp lệ (phải từ hôm nay trở đi).');
      return;
    }
    if (item.dangCoYeuCau) {
      setError('Hợp đồng/Phiếu cọc này đã có một yêu cầu trả phòng đang được xử lý.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ngayDuKienTra: ngayDuKien,
        ...(isHopDong ? { maHopDong: item.maHopDong } : { maPhieuDatCoc: item.maHopDong })
      };
      const { data } = await traPhongApi.taoYeuCau(payload);
      setPhieuMoi(data.phieu);
      setSuccess(true);
      if (onSuccess) onSuccess(data.phieu);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="yct-detail">
      {success ? (
        <div className="yct-success-box">
          <span className="yct-success-icon" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="2" />
              <path d="M12 20.5l5.5 5.5 10.5-10.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <strong>Gửi yêu cầu thành công!</strong>
          <p>
            Phiếu <em>{phieuMoi?.MaPhieuTra || phieuMoi?.maPhieuTra || ''}</em> đã được tạo với trạng thái{' '}
            <em>Chờ xử lý</em>. Ngày đăng ký trả tự động ghi nhận là {today}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="yct-detail-label">
            {isHopDong ? `HỢP ĐỒNG THUÊ · ${item.maHopDong}` : `PHIẾU ĐẶT CỌC · ${item.maHopDong}`}
          </div>
          <h2 className="yct-detail-room">{item.tenPhong}</h2>
          <p className="yct-detail-addr">{item.diaChiChiNhanh}</p>

          <div className="yct-detail-grid">
            <div className="yct-detail-cell">
              <span>Hình thức</span>
              <strong>{item.hinhThucThue}</strong>
            </div>
            {item.soGiuong && (
              <div className="yct-detail-cell">
                <span>Số giường</span>
                <strong>{item.soGiuong} giường</strong>
              </div>
            )}
            <div className="yct-detail-cell">
              <span>Giá thuê</span>
              <strong>{formatMoney(item.giaThu)}/th</strong>
            </div>
            {item.tienCoc && (
              <div className="yct-detail-cell">
                <span>Tiền cọc</span>
                <strong>{formatMoney(item.tienCoc)}</strong>
              </div>
            )}
            {item.ngayBatDau && (
              <div className="yct-detail-cell">
                <span>Bắt đầu</span>
                <strong>{item.ngayBatDau}</strong>
              </div>
            )}
            {item.ngayKetThuc && (
              <div className="yct-detail-cell">
                <span>Kết thúc HĐ</span>
                <strong>{item.ngayKetThuc}</strong>
              </div>
            )}
          </div>

          <div className="yct-date-field">
            <label htmlFor="ngay-du-kien">Ngày dự kiến trả phòng</label>
            <div className="yct-date-input-wrap">
              <svg viewBox="0 0 18 18" fill="none" className="yct-cal-icon">
                <rect x="1.5" y="2.5" width="15" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M1.5 7h15M6 1v3M12 1v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                id="ngay-du-kien"
                type="date"
                value={ngayDuKien}
                min={todayISO}
                onChange={(e) => { setNgayDuKien(e.target.value); setError(''); }}
              />
            </div>
            <p className="yct-date-hint">
              Ngày đăng ký trả ({today}) sẽ được hệ thống tự động ghi nhận.
            </p>
          </div>

          {error && <p className="yct-error">{error}</p>}

          <button
            id="btn-gui-yeu-cau-tra-phong"
            type="submit"
            className="yct-submit-btn"
            disabled={submitting || item.dangCoYeuCau}
          >
            {submitting ? (
              <>
                <span className="yct-spinner" aria-hidden="true" />
                Đang gửi…
              </>
            ) : (
              <>
                <svg viewBox="0 0 18 18" fill="none" className="yct-send-icon">
                  <path d="M16.5 1.5l-9 9M16.5 1.5l-5 14-4-5-5-4 14-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Gửi yêu cầu
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function EmptyDetail() {
  return (
    <div className="yct-empty-detail">
      <span className="yct-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M20 12v9M20 23v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <p>Chưa chọn mục nào</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function YeuCauTraPhong() {
  const [contracts, setContracts]   = useState([]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [apiError, setApiError]     = useState('');

  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('TatCa');
  const [historySearch, setHistorySearch] = useState('');

  // Load dữ liệu từ API
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const [hdRes, lsRes] = await Promise.all([
        traPhongApi.layDanhSachHopDong(),
        traPhongApi.layLichSu(),
      ]);
      setContracts(hdRes.data?.danhSach || []);
      setHistory(lsRes.data?.lichSu || []);
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleSelect(item) {
    setSelected((prev) => (prev?.maHopDong === item.maHopDong ? null : item));
  }

  // Sau khi gửi thành công: reload lịch sử + cập nhật trạng thái card
  function handleSuccess(phieuMoi) {
    loadData();   // reload toàn bộ từ API
  }

  // Filter + search
  const q = search.trim().toLowerCase();
  const visible = contracts.filter((c) => {
    if (filter === 'HopDong' && c.loai !== 'HopDong') return false;
    if (filter === 'DatCoc'  && c.loai !== 'DatCoc')  return false;
    if (q) {
      return (
        c.tenPhong?.toLowerCase().includes(q) ||
        (c.soGiuong && String(c.soGiuong).toLowerCase().includes(q)) ||
        (c.maGiuong && String(c.maGiuong).toLowerCase().includes(q))
      );
    }
    return true;
  });

  const historyQuery = historySearch.trim().toLowerCase();
  const visibleHistory = history.filter((row) => {
    if (!historyQuery) return true;

    return [
      row.maPhieuTra,
      row.tenPhong,
      row.maGiuong,
      row.maNguon,
      row.loaiNguon,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(historyQuery));
  });

  return (
    <section className="yct-section">
      {/* Page title */}
      <div className="yct-page-title">
        <h1>Yêu cầu trả phòng</h1>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="yct-error" style={{ marginBottom: 0 }}>{apiError}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="yct-empty-detail" style={{ minHeight: 200, background: 'rgba(255,255,255,0.98)', border: '1px solid var(--rt-line)', borderRadius: 22 }}>
          <span className="yct-spinner" style={{ borderColor: 'rgba(47,183,164,0.3)', borderTopColor: 'var(--rt-green)' }} />
          <p>Đang tải dữ liệu…</p>
        </div>
      ) : (
        <>
          {/* Main two-column layout */}
          <div className="yct-layout">
            {/* Left: contract/deposit list */}
            <div className="yct-left">
              <div className="yct-panel">
                <div className="yct-panel-head">
                  <h3>Hợp đồng / Phiếu đặt cọc của bạn</h3>
                  <span className="yct-count">{visible.length} mục</span>
                </div>

                <div className="yct-search-row">
                  <div className="yct-search-wrap">
                    <svg viewBox="0 0 18 18" fill="none" className="yct-search-icon">
                      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M11.5 11.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    <input
                      id="yct-search"
                      type="text"
                      placeholder="Tra cứu theo phòng, giường"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="yct-search-input"
                    />
                  </div>
                  <div className="yct-filter-tabs">
                    {[
                      { key: 'TatCa',   label: 'Tất cả' },
                      { key: 'HopDong', label: 'Hợp đồng' },
                      { key: 'DatCoc',  label: 'Đặt cọc' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        className={`yct-tab${filter === key ? ' active' : ''}`}
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="yct-card-list">
                  {visible.length === 0 ? (
                    <p className="yct-no-result">
                      {contracts.length === 0
                        ? 'Bạn chưa có hợp đồng hoặc phiếu đặt cọc hợp lệ.'
                        : 'Không tìm thấy kết quả phù hợp.'}
                    </p>
                  ) : (
                    visible.map((item) => (
                      <ContractCard
                        key={item.maHopDong}
                        item={item}
                        selected={selected?.maHopDong === item.maHopDong}
                        onClick={() => handleSelect(item)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: detail / form */}
            <div className="yct-right">
              <div className="yct-panel yct-panel-detail">
                {selected ? (
                  <DetailPanel
                    key={selected.maHopDong}
                    item={selected}
                    onSuccess={handleSuccess}
                  />
                ) : (
                  <EmptyDetail />
                )}
              </div>
            </div>
          </div>

          {/* History table */}
          <div className="yct-history-panel">
            <div className="yct-history-head">
              <span className="yct-history-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 5.5V9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <h3>Lịch sử yêu cầu trả phòng</h3>
            </div>
            <div className="yct-history-toolbar">
              <div className="yct-search-wrap yct-history-search-wrap">
                <svg viewBox="0 0 18 18" fill="none" className="yct-search-icon">
                  <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M11.5 11.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  id="yct-history-search"
                  type="text"
                  placeholder="Tra cứu theo phòng, giường"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="yct-search-input"
                />
              </div>
            </div>
            <div className="yct-history-table-wrap">
              <table className="yct-history-table">
                <thead>
                  <tr>
                    <th>Mã phiếu</th>
                    <th>Phòng / Giường</th>
                    <th>Ngày đăng ký</th>
                    <th>Dự kiến trả</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="yct-empty-row">
                        Chưa có lịch sử yêu cầu trả phòng.
                      </td>
                    </tr>
                  ) : visibleHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="yct-empty-row">
                        Không tìm thấy lịch sử phù hợp.
                      </td>
                    </tr>
                  ) : (
                    visibleHistory.map((row) => (
                      <tr key={row.maPhieuTra}>
                        <td className="yct-maphieu">{row.maPhieuTra}</td>
                        <td>
                          <strong className="yct-row-phong">{row.tenPhong}</strong>
                          {row.maGiuong && row.maGiuong !== '—' && (
                            <span className="yct-row-nguon">
                              Giường {row.maGiuong}
                            </span>
                          )}
                        </td>
                        <td>{row.ngayDangKy}</td>
                        <td>{row.ngayDuKienTra}</td>
                        <td>
                          <span className={`yct-badge ${trangThaiClass(row.trangThai)}`}>
                            {row.trangThai}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
