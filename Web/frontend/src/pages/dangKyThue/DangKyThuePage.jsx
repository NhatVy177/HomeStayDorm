import PageHeader from '../../components/common/PageHeader.jsx';

export default function DangKyThuePage() {
  return (
    <section>
      <PageHeader
        title="Đăng ký nhu cầu thuê"
        description="Khách gửi thông tin, sale tra cứu phòng/giường khả dụng và kiểm tra điều kiện thuê."
      />

      <div className="card">
        <h3>Việc cần code trong module này</h3>
        <ul>
          <li>Form khách gửi thông tin đăng ký thuê.</li>
          <li>Danh sách hồ sơ chờ sale xử lý.</li>
          <li>Nút tra cứu phòng/giường khả dụng.</li>
          <li>Nút kiểm tra điều kiện thuê và cập nhật kết quả.</li>
        </ul>
      </div>
      <div className="card muted">
        <p>
          Đây là sườn trang. Bạn phụ trách module này sẽ thêm form, bảng dữ liệu,
          nút xử lý và gọi API trong file <code>dangKyThue.api.js</code>.
        </p>
      </div>
    </section>
  );
}
