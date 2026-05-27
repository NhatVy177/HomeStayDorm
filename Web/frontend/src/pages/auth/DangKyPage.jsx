import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';

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

  function updateField(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (formData.matKhau !== formData.xacNhanMatKhau) {
      setError('Mat khau xac nhan khong khop');
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
    <div className="auth-page">
      <div className="auth-panel registration">
        <div className="auth-brand">
          <Link className="auth-logo" to="/">Homestay <strong>Dorm</strong></Link>
          <h1>Tìm chỗ ở phù hợp</h1>
          <p>Tạo tài khoản để đăng ký nhu cầu thuê, xem phòng và quản lý hợp đồng.</p>
        </div>
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Đăng ký</h2>
          <p className="auth-subtitle">Tạo tài khoản khách hàng mới.</p>
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
              required
            />
          </div>
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
  );
}
