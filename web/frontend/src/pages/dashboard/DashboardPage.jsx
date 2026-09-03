import React from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';

const modules = [
  'Đăng ký nhu cầu thuê + xem phòng',
  'Đặt cọc + thanh toán cọc',
  'Nhận phòng + hợp đồng + bàn giao',
  'Trả phòng + quyết toán + thanh lý',
  'Sửa chữa / bảo trì'
];

export default function DashboardPage() {
  return (
    <section>
      <PageHeader
        title="Tổng quan hệ thống thuê phòng"
        description="Trang này để kiểm tra layout chung và điều hướng giữa các module."
      />
      <div className="card-grid">
        {modules.map((item) => (
          <div className="card" key={item}>
            <h3>{item}</h3>
            <p>Mỗi nhóm code đúng module, không sửa chéo lung tung.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
