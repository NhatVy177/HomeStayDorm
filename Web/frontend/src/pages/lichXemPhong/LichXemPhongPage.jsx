import PageHeader from '../../components/common/PageHeader.jsx';

export default function LichXemPhongPage() {
  return (
    <section>
      <PageHeader
        title="Quản lý lịch xem phòng"
        description="Sale lập lịch xem phòng, khách yêu cầu đổi/hủy lịch, sale cập nhật lại lịch."
      />

      <div className="card">
        <h3>Việc cần code trong module này</h3>
        <ul>
          <li>Lập lịch xem phòng.</li>
          <li>Hiển thị trạng thái lịch xem phòng.</li>
          <li>Gửi yêu cầu đổi/hủy lịch.</li>
          <li>Sale xác nhận đổi hoặc hủy lịch.</li>
        </ul>
      </div>
      <div className="card muted">
        <p>
          Đây là sườn trang. Bạn phụ trách module này sẽ thêm form, bảng dữ liệu,
          nút xử lý và gọi API trong file <code>lichXemPhong.api.js</code>.
        </p>
      </div>
    </section>
  );
}
