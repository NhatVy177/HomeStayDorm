import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { dangKyThueApi } from './dangKyThue.api.js';

const HINH_THUC_OPTIONS = ['Ghép nam', 'Ghép nữ', 'Nguyên căn'];

const INITIAL_FORM = {
  soNguoiO: '',
  hinhThucThue: '',
  khuVucMongMuon: '',
  loaiPhongYeuCau: '',
  mucGia: '',
  ngayDuKienVaoO: '',
  thoiHanThue: '',
  ghiChu: ''
};

export default function DangKyThuePage() {
  const { user } = useAuth();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(null); // lưu hồ sơ vừa tạo

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  }

  function handleCancel() {
    // A2: Hủy gửi → reset form
    setForm(INITIAL_FORM);
    setError('');
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // A4: Kiểm tra phía client trước khi gửi
    if (!form.hinhThucThue) return setError('Vui lòng chọn hình thức thuê.');
    if (!form.soNguoiO || Number(form.soNguoiO) < 1) return setError('Vui lòng nhập số người dự kiến ở.');
    if (!form.ngayDuKienVaoO) return setError('Vui lòng nhập thời gian dự kiến vào ở.');

    setLoading(true);
    setError('');

    try {
      const result = await dangKyThueApi.create({
        hinhThucThue:    form.hinhThucThue,
        soNguoiO:        Number(form.soNguoiO),
        khuVucMongMuon:  form.khuVucMongMuon  || undefined,
        loaiPhongYeuCau: form.loaiPhongYeuCau || undefined,
        mucGia:          form.mucGia           ? Number(form.mucGia) : undefined,
        ngayDuKienVaoO:  form.ngayDuKienVaoO,
        thoiHanThue:     form.thoiHanThue      ? Number(form.thoiHanThue) : undefined,
        ghiChu:          [
          form.ghiChu,
          form.hinhThucThue && form.hinhThucThue !== 'Nguyên căn'
            ? `Hình thức mong muốn: ${form.hinhThucThue}`
            : ''
        ].filter(Boolean).join('\n') || undefined
      });

      // Bước 7 UC: Thông báo thành công
      setSuccess(result);
      setForm(INITIAL_FORM);
    } catch (err) {
      // E8: Lỗi tạo phiếu
      setError(err?.response?.data?.message || 'Không thể gửi thông tin đăng ký thuê. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  // Nếu vừa gửi thành công → hiện thông báo
  if (success) {
    return (
      <section>
        <div className="card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 8px', color: '#16a34a' }}>Gửi đăng ký thành công!</h2>
          <p style={{ color: '#6b7280', margin: '0 0 20px' }}>
            Hồ sơ <strong>{success.maDangKy}</strong> đã được ghi nhận.
            Nhân viên sale sẽ liên hệ với bạn sớm nhất có thể.
          </p>
          <div className="card" style={{ textAlign: 'left', background: '#f9fafb', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '4px 0' }}><strong>Hình thức thuê:</strong> {success.hinhThucThue}</p>
            <p style={{ margin: '4px 0' }}><strong>Số người dự kiến:</strong> {success.soNguoiO}</p>
            <p style={{ margin: '4px 0' }}><strong>Ngày dự kiến vào ở:</strong> {new Date(success.ngayDuKienVaoO).toLocaleDateString('vi-VN')}</p>
            <p style={{ margin: '4px 0' }}><strong>Trạng thái:</strong> <span className="status-badge">{success.trangThai}</span></p>
          </div>
          <button className="primary-button" style={{ marginTop: 20, width: '100%' }} onClick={() => setSuccess(null)}>
            Gửi hồ sơ mới
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header">
        <h1>Đăng ký nhu cầu thuê phòng</h1>
        <p>Điền thông tin bên dưới để gửi yêu cầu thuê. Nhân viên sale sẽ tiếp nhận và liên hệ lại.</p>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <h3 style={{ marginTop: 0 }}>Thông tin đăng ký</h3>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: -8 }}>
          Đăng ký cho: <strong>{user?.hoTen}</strong>
        </p>

        {error && (
          <div className="form-message error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Hàng 1: Hình thức thuê + Số người */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-control">
              <label htmlFor="dkt-hinhThucThue">
                Hình thức thuê <span className="required-mark">*</span>
              </label>
              <select
                id="dkt-hinhThucThue"
                name="hinhThucThue"
                value={form.hinhThucThue}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn --</option>
                {HINH_THUC_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label htmlFor="dkt-soNguoiO">
                Số người dự kiến ở <span className="required-mark">*</span>
              </label>
              <input
                id="dkt-soNguoiO"
                type="number"
                name="soNguoiO"
                min="1"
                placeholder="VD: 2"
                value={form.soNguoiO}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Hàng 2: Ngày dự kiến vào ở + Thời hạn thuê */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-control">
              <label htmlFor="dkt-ngayDuKienVaoO">
                Thời gian dự kiến vào ở <span className="required-mark">*</span>
              </label>
              <input
                id="dkt-ngayDuKienVaoO"
                type="date"
                name="ngayDuKienVaoO"
                min={new Date().toISOString().split('T')[0]}
                value={form.ngayDuKienVaoO}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label htmlFor="dkt-thoiHanThue">Thời hạn thuê (tháng)</label>
              <input
                id="dkt-thoiHanThue"
                type="number"
                name="thoiHanThue"
                min="1"
                placeholder="VD: 6"
                value={form.thoiHanThue}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Hàng 3: Khu vực + Loại phòng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-control">
              <label htmlFor="dkt-khuVucMongMuon">Khu vực mong muốn</label>
              <input
                id="dkt-khuVucMongMuon"
                type="text"
                name="khuVucMongMuon"
                placeholder="VD: Quận Hải Châu, Đà Nẵng"
                value={form.khuVucMongMuon}
                onChange={handleChange}
              />
            </div>

            <div className="form-control">
              <label htmlFor="dkt-loaiPhongYeuCau">Loại phòng yêu cầu</label>
              <input
                id="dkt-loaiPhongYeuCau"
                type="text"
                name="loaiPhongYeuCau"
                placeholder="VD: Phòng đôi, Dorm 4 người"
                value={form.loaiPhongYeuCau}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Mức giá */}
          <div className="form-control">
            <label htmlFor="dkt-mucGia">Mức giá mong muốn (VNĐ/tháng)</label>
            <input
              id="dkt-mucGia"
              type="number"
              name="mucGia"
              min="0"
              step="100000"
              placeholder="VD: 3000000"
              value={form.mucGia}
              onChange={handleChange}
            />
          </div>

          {/* Yêu cầu khác */}
          <div className="form-control">
            <label htmlFor="dkt-ghiChu">Yêu cầu khác</label>
            <textarea
              id="dkt-ghiChu"
              name="ghiChu"
              rows={3}
              placeholder="Nhập các yêu cầu khác nếu có..."
              value={form.ghiChu}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}
            />
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              id="dkt-btn-gui"
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Đang gửi...' : 'Gửi đăng ký thuê'}
            </button>
            <button
              id="dkt-btn-huy"
              type="button"
              className="secondary-button"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </button>
          </div>

        </form>
      </div>
    </section>
  );
}
