import PageHeader from '../../components/common/PageHeader.jsx';

export default function TraPhongPage() {
  return (
    <section>
      <PageHeader
        title="Quản lý trả phòng"
        description="Đăng ký lịch trả phòng, kiểm tra hiện trạng, quyết toán, hoàn cọc hoặc thu thêm, thanh lý hợp đồng."
      />

      <div className="card">
        <h3>Việc cần code trong module này</h3>
        <ul>
          <li>Đăng ký/lập lịch trả phòng.</li>
          <li>Lập biên bản kiểm tra hiện trạng phòng/giường.</li>
          <li>Xử lý quyết toán trả phòng.</li>
          <li>Ghi nhận thanh lý hợp đồng và cập nhật phòng/giường trống.</li>
        </ul>
      </div>
      <div className="card muted">
        <p>
          Đây là sườn trang. Bạn phụ trách module này sẽ thêm form, bảng dữ liệu,
          nút xử lý và gọi API trong file <code>traPhong.api.js</code>.
        </p>
      </div>
    </section>
  );
}
