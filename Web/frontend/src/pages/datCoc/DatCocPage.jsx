import PageHeader from '../../components/common/PageHeader.jsx';

export default function DatCocPage() {
  return (
    <section>
      <PageHeader
        title="Quản lý đặt cọc"
        description="Sale lập phiếu cọc, quản lý xác nhận, kế toán phát hành thanh toán, khách cập nhật minh chứng."
      />

      <div className="card">
        <h3>Việc cần code trong module này</h3>
        <ul>
          <li>Lập phiếu yêu cầu đặt cọc.</li>
          <li>Quản lý xác nhận khả năng nhận cọc.</li>
          <li>Kế toán phát hành yêu cầu thanh toán cọc.</li>
          <li>Cập nhật minh chứng và xác nhận thanh toán cọc.</li>
        </ul>
      </div>
      <div className="card muted">
        <p>
          Đây là sườn trang. Bạn phụ trách module này sẽ thêm form, bảng dữ liệu,
          nút xử lý và gọi API trong file <code>datCoc.api.js</code>.
        </p>
      </div>
    </section>
  );
}
