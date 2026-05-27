# Database layer

Module xác thực và các luồng nghiệp vụ chính đều dùng SQL Server:

- `connection.js`: mở connection pool và gửi lệnh `EXEC` stored procedure từ service. File này không tạo bảng hoặc procedure.
- `sql/app.sql`: tạo database `HOMEDORM4` và các bảng.
- `sql/auth.sql`: tạo hoặc cập nhật `dbo.SP_DangKy` và `dbo.SP_DangNhap`.

Thứ tự chạy trong SQL Server Management Studio:

1. Chạy `database/sql/app.sql` một lần khi tạo database mới.
2. Chạy `database/sql/auth.sql` để cài/cập nhật chức năng đăng ký, đăng nhập.
3. Chạy `database/sql/khach-moi.sql` để cài dữ liệu phòng khả dụng và procedure cho cổng khách hàng mới.
4. Khởi động backend. Code Node.js chỉ gọi procedure đã có trong SQL Server.

`khach-moi.sql` chạy lặp lại an toàn. Script chỉ seed danh mục chi nhánh/phòng/giường để khách có lựa chọn tìm phòng; không tự tạo phiếu cọc hoặc hợp đồng cho khách hàng.

Trong `.env`, dùng `DB_INSTANCE` cho named instance (ví dụ `SQLEXPRESS`) hoặc dùng `DB_PORT` cho kết nối TCP port; không điền đồng thời cả hai.
