import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { authApi } from './auth.api.js';

const initialForm = {
  tenDangNhap: '',
  hoTen: '',
  ngaySinh: '',
  gioiTinh: '',
  email: '',
  soDienThoai: '',
  matKhau: '',
  xacNhanMatKhau: ''
};

export default function DangKyPage() {
  const { dangKy } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneCheck, setPhoneCheck] = useState(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  useEffect(() => {
    const sdt = formData.soDienThoai;
    setPhoneCheck(null);
    if (sdt.length !== 10) return undefined;

    let alive = true;
    setIsCheckingPhone(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await authApi.kiemTraSoDienThoai(sdt);
        if (alive) setPhoneCheck(data);
      } catch (requestError) {
        if (alive) setPhoneCheck({ error: requestError.response?.data?.message || 'Không thể kiểm tra SĐT lúc này.' });
      } finally {
        if (alive) setIsCheckingPhone(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [formData.soDienThoai]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: name === 'soDienThoai' ? value.replace(/\D/g, '').slice(0, 10) : value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (formData.matKhau !== formData.xacNhanMatKhau) {
      setError('Mat khau xac nhan khong khop');
      return;
    }

    if (!/^\d{10}$/.test(formData.soDienThoai)) {
      setError('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }

    if (phoneCheck?.daCoTaiKhoan) {
      setError('Số điện thoại này đã được liên kết với một tài khoản. Vui lòng đăng nhập.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dangKy(formData);
      navigate('/khach-hang', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the dang ky luc nay');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page-split">
      {/* Left panel: Art Showcase */}
      <div className="auth-showcase-panel">
        <div className="auth-glow-sphere"></div>
        <div className="auth-showcase-brand">
          <Link className="auth-showcase-logo" to="/">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="auth-showcase-logo-icon">
              <path d="M3 9.5L12 3l9 6.5V21H3V9.5z"/><path d="M9 21V12h6v9"/>
            </svg>
            Homestay <strong>Dorm</strong>
          </Link>
        </div>
        
        <div className="auth-showcase-center">
          <h1 className="auth-showcase-title">Tìm kiếm một không gian sống lý tưởng</h1>
          <p className="auth-showcase-subtitle">Hệ thống phòng trọ, homestay và ký túc xá thông minh, đầy đủ tiện nghi cho thế hệ mới.</p>
          
          <div className="showcase-glass-card">
            <div className="showcase-glass-stars">★★★★★</div>
            <p className="showcase-glass-text">"Phòng ốc vô cùng sạch sẽ, trang bị đầy đủ tủ lạnh, điều hòa và máy giặt. Bộ phận quản lý cực kỳ nhiệt tình và hỗ trợ sự cố nhanh chóng."</p>
            <div className="showcase-glass-author">
              <div className="showcase-glass-avatar">HM</div>
              <div>
                <div className="showcase-glass-name">Hoàng Minh</div>
                <div className="showcase-glass-role">Thành viên HappyRoom từ 2025</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="auth-showcase-footer">
          <span>© 2026 HappyRoom HomestayDorm. All rights reserved.</span>
        </div>
      </div>

      {/* Right panel: Workspace Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-card-outer">
            <form className="auth-card auth-card-inner" onSubmit={handleSubmit}>
              <h2>Đăng ký</h2>
              <p className="auth-subtitle">Tạo tài khoản khách hàng mới để bắt đầu.</p>
              {error && <p className="form-message error">{error}</p>}
              <FormInput
                label="Họ và tên"
                name="hoTen"
                value={formData.hoTen}
                onChange={updateField}
                placeholder="Nguyễn Văn An"
                required
              />
              <FormInput
                label="Tên đăng nhập"
                name="tenDangNhap"
                value={formData.tenDangNhap}
                onChange={updateField}
                placeholder="nguyenvanan"
                maxLength={50}
                required
              />
              <div className="auth-row">
                <label className="form-control">
                  <span>
                    Giới tính<strong className="required-mark"> *</strong>
                  </span>
                  <select
                    name="gioiTinh"
                    value={formData.gioiTinh}
                    onChange={updateField}
                    required
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </label>
                <FormInput
                  label="Ngày sinh"
                  type="date"
                  name="ngaySinh"
                  value={formData.ngaySinh}
                  onChange={updateField}
                  required
                />
              </div>
              <div className="auth-row">
                <FormInput
                  label="Email (tùy chọn)"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={updateField}
                  placeholder="ban@example.com"
                />
                <FormInput
                  label="Số điện thoại"
                  type="tel"
                  name="soDienThoai"
                  value={formData.soDienThoai}
                  onChange={updateField}
                  placeholder="0901234567"
                  inputMode="numeric"
                  maxLength={10}
                  required
                />
              </div>
              {(isCheckingPhone || phoneCheck?.thongBao || phoneCheck?.error) && (
                <p
                  className={`auth-phone-check ${phoneCheck?.daCoTaiKhoan || phoneCheck?.error ? 'is-error' : 'is-linked'}`}
                  role="status"
                >
                  {isCheckingPhone ? 'Đang kiểm tra số điện thoại...' : (phoneCheck?.error || phoneCheck?.thongBao)}
                </p>
              )}
              <div className="auth-row">
                <FormInput
                  label="Mật khẩu"
                  type="password"
                  name="matKhau"
                  value={formData.matKhau}
                  onChange={updateField}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <FormInput
                  label="Xác nhận mật khẩu"
                  type="password"
                  name="xacNhanMatKhau"
                  value={formData.xacNhanMatKhau}
                  onChange={updateField}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
              <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>
              <p className="auth-switch">
                Đã có tài khoản? <Link to="/dang-nhap">Đăng nhập</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
