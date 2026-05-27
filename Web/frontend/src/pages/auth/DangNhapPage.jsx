import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { getAuthenticatedHomePath } from '../../auth/auth.routes.js';

export default function DangNhapPage() {
  const { dangNhap } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ tenDangNhap: '', matKhau: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await dangNhap(formData);
      navigate(location.state?.from?.pathname || getAuthenticatedHomePath(user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the dang nhap luc nay');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <Link className="auth-logo" to="/">Homestay <strong>Dorm</strong></Link>
          <h1>Chào mừng trở lại</h1>
          <p>Đăng nhập để quản lý thuê phòng và theo dõi các yêu cầu của bạn.</p>
        </div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Đăng nhập</h2>
          <p className="auth-subtitle">Nhập tài khoản HappyRoom của bạn.</p>
          {error && <p className="form-message error">{error}</p>}
          <FormInput
            label="Tên đăng nhập"
            name="tenDangNhap"
            value={formData.tenDangNhap}
            onChange={updateField}
            placeholder="khachhang_demo"
            required
          />
          <FormInput
            label="Mật khẩu"
            type="password"
            name="matKhau"
            value={formData.matKhau}
            onChange={updateField}
            placeholder="Nhập mật khẩu"
            required
          />
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/dang-ky">Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
