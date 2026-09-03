import PageHeader from '../../components/common/PageHeader.jsx';

export default function SuaChuaBaoTriPage() {
  return (
    <section>
      <PageHeader
        title="Sửa chữa / bảo trì"
        description="Khách gửi yêu cầu sửa chữa, quản lý tiếp nhận, xử lý, từ chối hoặc hoàn tất."
      />

      <div className="card">
        <h3>Việc cần code trong module này</h3>
        <ul>
          <li>Khách gửi yêu cầu sửa chữa/bảo trì.</li>
          <li>Quản lý tiếp nhận yêu cầu.</li>
          <li>Cập nhật kết quả xử lý.</li>
          <li>Ghi nhận chi phí sửa chữa nếu có.</li>
        </ul>
      </div>
      <div className="card muted">
        <p>
          Đây là sườn trang. Bạn phụ trách module này sẽ thêm form, bảng dữ liệu,
          nút xử lý và gọi API trong file <code>suaChuaBaoTri.api.js</code>.
        </p>
      </div>
    </section>
  );
}
