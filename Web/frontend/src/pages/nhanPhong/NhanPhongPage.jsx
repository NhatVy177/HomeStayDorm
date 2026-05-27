import PageHeader from '../../components/common/PageHeader.jsx';

export default function NhanPhongPage() {
  return (
    <section>
      <PageHeader
        title="Quản lý nhận phòng"
        description="Cập nhật cư trú, lập hợp đồng thuê, ghi nhận thu đầu kỳ và bàn giao phòng/giường."
      />

      <div className="card">
        <h3>Việc cần code trong module này</h3>
        <ul>
          <li>Cập nhật thông tin cư trú.</li>
          <li>Lập hợp đồng thuê.</li>
          <li>Ghi nhận khoản thu nhận phòng.</li>
          <li>Lập biên bản bàn giao phòng/giường.</li>
        </ul>
      </div>
      <div className="card muted">
        <p>
          Đây là sườn trang. Bạn phụ trách module này sẽ thêm form, bảng dữ liệu,
          nút xử lý và gọi API trong file <code>nhanPhong.api.js</code>.
        </p>
      </div>
    </section>
  );
}
