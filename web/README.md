# HappyRoom - Hệ thống quản lý thuê phòng

HappyRoom là đồ án web quản lý quy trình thuê phòng: khách hàng đăng ký nhu cầu, xem phòng, đặt cọc, nhận phòng, trả phòng và gửi yêu cầu sửa chữa; nhân viên thao tác theo đúng vai trò Sale, Quản lý hoặc Kế toán.

Project gồm:

- Frontend: React + Vite.
- Backend: Node.js + Express.
- Database: SQL Server, truy cập nghiệp vụ bằng stored procedure.
- Xác thực: token do backend cấp, frontend lưu phiên đăng nhập trong `localStorage`.

## 1. Trạng thái triển khai hiện tại

| Phần | Trạng thái | Nơi xem code chính |
| --- | --- | --- |
| Đăng ký, đăng nhập, lấy phiên đăng nhập | Đã nối frontend -> API -> SQL Server | [`auth.api.js`](happyroom-frontend/src/pages/auth/auth.api.js), [`auth.service.js`](happyroom-backend/services/auth.service.js), [`auth.sql`](happyroom-backend/database/sql/auth.sql) |
| Phân trang theo loại người dùng/chức vụ nhân viên | Đã dùng dữ liệu database, không hardcode tài khoản | [`auth.routes.js`](happyroom-frontend/src/auth/auth.routes.js), [`App.jsx`](happyroom-frontend/src/App.jsx), [`auth.sql`](happyroom-backend/database/sql/auth.sql#L114) |
| Cổng khách mới | Đã nối API và các procedure `SP_KhachMoi_*` | [`KhachMoiPage.jsx`](happyroom-frontend/src/pages/khachMoi/KhachMoiPage.jsx), [`khachMoi.service.js`](happyroom-backend/services/khachMoi.service.js), [`khach-moi.sql`](happyroom-backend/database/sql/khach-moi.sql) |
| Chọn khách mới / khách đang thuê | Đã kiểm tra bằng dữ liệu cọc hoặc hợp đồng | [`KhachHangPortalPage.jsx`](happyroom-frontend/src/pages/khachHang/KhachHangPortalPage.jsx#L6), [`khach-moi.sql`](happyroom-backend/database/sql/khach-moi.sql#L87) |
| Trang khách đang thuê | Giao diện mẫu, chưa nối nghiệp vụ backend riêng | [`KhachDangThuePage.jsx`](happyroom-frontend/src/pages/khachDangThue/KhachDangThuePage.jsx#L109) |
| Trang nhân viên Sale, Quản lý, Kế toán | Giao diện sườn theo vai trò; chưa xử lý nghiệp vụ thật trên trang | [`nhanVienSale`](happyroom-frontend/src/pages/nhanVienSale), [`nhanVienQuanLy`](happyroom-frontend/src/pages/nhanVienQuanLy), [`nhanVienKeToan`](happyroom-frontend/src/pages/nhanVienKeToan) |
| Các module đăng ký thuê, lịch xem, cọc, nhận phòng, trả phòng, sửa chữa | Đã có route/service/API làm hợp đồng tích hợp; các procedure nghiệp vụ tương ứng chưa có trong bộ SQL hiện tại | [`routes`](happyroom-backend/routes), [`services`](happyroom-backend/services), [`database/sql`](happyroom-backend/database/sql) |

Lưu ý quan trọng: trong `database/sql` hiện chỉ có procedure chạy thật cho xác thực (`SP_DangKy`, `SP_DangNhap`) và cổng khách mới (`SP_KhachMoi_*`). Các service còn lại đã gọi tên procedure dự kiến, nhưng nhóm phụ trách database phải bổ sung SQL trước khi các luồng đó có thể chạy end-to-end.

## 2. Cấu trúc thư mục

```text
.
|-- README.md                         # Tài liệu dự án và bản đồ luồng
|-- HuongDanChay.txt                  # Hướng dẫn chạy rút gọn cũ
|-- happyroom-backend/
|   |-- index.js                      # Khởi tạo Express, gắn route và middleware
|   |-- .env.example                  # Mẫu cấu hình backend/SQL Server
|   |-- controllers/                  # Nhận request, trả response
|   |-- services/                     # Validate nghiệp vụ, gọi stored procedure
|   |-- routes/                       # Khai báo endpoint theo module
|   |-- middleware/                   # Auth, not-found, error handler
|   |-- database/
|       |-- connection.js             # Pool SQL Server và executeProcedure()
|       |-- sql/
|           |-- app.sql               # Schema bảng và ràng buộc
|           |-- data.sql              # Dữ liệu mẫu
|           |-- auth.sql              # SP đăng ký/đăng nhập
|           |-- khach-moi.sql         # SP cổng khách mới
|-- happyroom-frontend/
    |-- src/
        |-- main.jsx                  # Entry point, bọc AuthProvider
        |-- App.jsx                   # Route và chặn quyền truy cập
        |-- api/httpClient.js         # Axios base URL + Bearer token
        |-- auth/                     # Session và điều hướng theo vai trò
        |-- components/common/        # Thành phần dùng chung, menu tài khoản
        |-- layouts/                  # Layout dashboard cũ
        |-- pages/                    # Trang theo từng vai trò/luồng
```

### Quy tắc tách lớp

Luồng đã nối dữ liệu phải đi theo thứ tự:

```text
React page
  -> file *.api.js
  -> src/api/httpClient.js
  -> Express route
  -> middleware requireAuth (nếu là route bảo vệ)
  -> controller
  -> service
  -> database/connection.js: executeProcedure()
  -> stored procedure SQL Server
  -> bảng dữ liệu
```

Các điểm vào chung:

| Thành phần | File / khúc code |
| --- | --- |
| Render ứng dụng frontend và cấp `AuthProvider` | [`src/main.jsx`](happyroom-frontend/src/main.jsx#L8) |
| Route frontend, `ProtectedRoute`, kiểm tra chức vụ nhân viên | [`src/App.jsx`](happyroom-frontend/src/App.jsx#L25) |
| Chọn trang mặc định sau đăng nhập | [`src/auth/auth.routes.js`](happyroom-frontend/src/auth/auth.routes.js#L1) |
| Base URL API và gắn token | [`src/api/httpClient.js`](happyroom-frontend/src/api/httpClient.js#L5) |
| Mount API backend | [`index.js`](happyroom-backend/index.js#L43) |
| Kiểm tra token ở backend | [`auth.middleware.js`](happyroom-backend/middleware/auth.middleware.js#L3) |
| Kết nối và thực thi procedure | [`connection.js`](happyroom-backend/database/connection.js#L25) |
| Trả lỗi tập trung | [`errorHandler.js`](happyroom-backend/middleware/errorHandler.js#L1) |

## 3. Cách chạy project

### Yêu cầu môi trường

- Node.js và npm.
- SQL Server đang chạy trên máy hoặc server truy cập được.
- SQL Server Management Studio (SSMS) hoặc công cụ tương đương để chạy file `.sql`.

### Bước 1: Tạo database và dữ liệu mẫu

Trong SSMS, kết nối SQL Server rồi chạy theo thứ tự:

1. [`happyroom-backend/database/sql/app.sql`](happyroom-backend/database/sql/app.sql): tạo database/schema bảng.
2. [`happyroom-backend/database/sql/data.sql`](happyroom-backend/database/sql/data.sql): nạp dữ liệu demo.
3. [`happyroom-backend/database/sql/auth.sql`](happyroom-backend/database/sql/auth.sql): tạo/cập nhật `SP_DangKy`, `SP_DangNhap`.
4. [`happyroom-backend/database/sql/khach-moi.sql`](happyroom-backend/database/sql/khach-moi.sql): tạo/cập nhật các `SP_KhachMoi_*`.

`data.sql` là dữ liệu seed dạng `INSERT`, nên chỉ nên chạy trên database mới hoặc database đã được dọn đúng cách. Chạy lại trên database đang có dữ liệu có thể trùng khóa chính.

### Bước 2: Chạy backend

```powershell
cd happyroom-backend
npm install
Copy-Item .env.example .env
```

Điền file `.env` theo SQL Server trên máy. Không commit file `.env`.

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
AUTH_SECRET=mot_chuoi_bi_mat_du_dai
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_PORT=
DB_USER=sa
DB_PASS=mat_khau_sql_server
DB_NAME=HOMEDORM4
```

Chỉ điền một trong hai giá trị `DB_INSTANCE` hoặc `DB_PORT`, tùy cách kết nối SQL Server.

```powershell
npm run dev
```

Backend mặc định: `http://localhost:5000`  
Kiểm tra nhanh: `http://localhost:5000/api/health`

### Bước 3: Chạy frontend

Mở terminal khác:

```powershell
cd happyroom-frontend
npm install
npm run dev
```

Frontend mặc định: `http://localhost:5173`  
Nếu backend chạy URL khác, tạo cấu hình frontend với `VITE_API_URL`, ví dụ `http://localhost:5000/api`.

### Tài khoản demo nhân viên

Khi đã nạp [`data.sql`](happyroom-backend/database/sql/data.sql), dữ liệu nhân viên được đối chiếu bằng bảng `NhanVien` và `TaiKhoan`, không phải bằng điều kiện hardcode ở giao diện.

| Tên đăng nhập | Mật khẩu seed | Chức vụ trong `NhanVien` | Trang sau đăng nhập |
| --- | --- | --- | --- |
| `nv0001` | `123` | `Sale` | `/nhan-vien-sale` |
| `nv0003` | `123` | `Quản lý` | `/nhan-vien-quan-ly` |
| `nv0004` | `123` | `Kế toán` | `/nhan-vien-ke-toan` |

Nguồn dữ liệu: [`data.sql`](happyroom-backend/database/sql/data.sql#L46) khai báo nhân viên và [`data.sql`](happyroom-backend/database/sql/data.sql#L127) khai báo tài khoản.

## 4. Quy tắc code chung

1. Mỗi luồng nằm trong đúng module của nó. Khi thêm chức năng, sửa đồng bộ `pages/<module>`, file `*.api.js`, `routes/<module>.routes.js`, `controllers/<module>.controller.js`, `services/<module>.service.js` và SQL liên quan.
2. Không quyết định vai trò bằng username. Loại người dùng lấy từ `NguoiDung.LoaiNguoiDung`; chức vụ nhân viên lấy từ `NhanVien.ChucVu`; trạng thái khách mới/đang thuê lấy từ dữ liệu cọc và hợp đồng.
3. `route` chỉ khai báo URL và middleware; `controller` chỉ lấy tham số/trả HTTP; `service` validate và điều phối nghiệp vụ; quy tắc dữ liệu quan trọng đặt trong stored procedure hoặc constraint database.
4. Frontend gọi API qua [`httpClient.js`](happyroom-frontend/src/api/httpClient.js), không tự viết URL backend hoặc tự gắn token ở từng trang.
5. API yêu cầu đăng nhập phải gắn `requireAuth` ở backend và phải có kiểm tra quyền nghiệp vụ trong service nếu chỉ một vai trò được thao tác.
6. Khi một trang mới chỉ là giao diện, ghi rõ là dữ liệu mẫu; không để người khác hiểu nhầm màn hình đã cập nhật database.
7. Khi thêm procedure, đưa câu lệnh `CREATE OR ALTER PROCEDURE` vào file SQL của module và cập nhật mục trạng thái/luồng trong README này.
8. Không commit `.env`, `node_modules`, `dist` hoặc thông tin kết nối thật.
9. Trước khi gộp code, tối thiểu chạy build frontend, khởi động backend, thử endpoint bị ảnh hưởng và chạy procedure mới trên database kiểm thử.

## 5. Phân quyền và điều hướng

### Sau khi đăng nhập

Luồng xử lý:

1. Trang đăng nhập gọi [`auth.api.js`](happyroom-frontend/src/pages/auth/auth.api.js#L3) -> `POST /api/auth/dang-nhap`.
2. Backend đi qua [`auth.routes.js`](happyroom-backend/routes/auth.routes.js#L7), controller, rồi [`auth.service.js`](happyroom-backend/services/auth.service.js#L126).
3. Service gọi `dbo.SP_DangNhap` trong [`auth.sql`](happyroom-backend/database/sql/auth.sql#L114).
4. Procedure join bảng `NhanVien` để trả `chucVu` và `maChiNhanh` nếu người đăng nhập là nhân viên.
5. Frontend lưu phiên trong [`AuthContext.jsx`](happyroom-frontend/src/auth/AuthContext.jsx#L11), sau đó [`getAuthenticatedHomePath()`](happyroom-frontend/src/auth/auth.routes.js#L1) chọn trang.

| Dữ liệu trả từ database | Route frontend |
| --- | --- |
| `vaiTro = KhachHang` | `/khach-hang` |
| `vaiTro = NhanVien`, `chucVu = Sale` | `/nhan-vien-sale` |
| `vaiTro = NhanVien`, `chucVu = Quản lý` | `/nhan-vien-quan-ly` |
| `vaiTro = NhanVien`, `chucVu = Kế toán` | `/nhan-vien-ke-toan` |
| Trường hợp khác/chưa được khai báo | `/dashboard` |

Các route nhân viên được khóa lại bằng `EmployeePositionRoute` tại [`App.jsx`](happyroom-frontend/src/App.jsx#L51), nên nhân viên không thể tự nhập URL trang của chức vụ khác để vào màn hình đó.

## 6. Bản đồ từng luồng hoạt động

### 6.1. Khách hàng: chọn khách mới hay đang thuê

Đường vào chung của khách hàng là `/khach-hang`, khai báo tại [`App.jsx`](happyroom-frontend/src/App.jsx#L82).

| Bước | File / khúc code | Nội dung |
| --- | --- | --- |
| Gọi trạng thái khách | [`KhachHangPortalPage.jsx`](happyroom-frontend/src/pages/khachHang/KhachHangPortalPage.jsx#L6) | Khi mở trang, gọi `khachMoiApi.getTrangThai()` |
| API frontend | [`khachMoi.api.js`](happyroom-frontend/src/pages/khachMoi/khachMoi.api.js#L3) | `GET /khach-moi/trang-thai` |
| Route backend | [`khachMoi.routes.js`](happyroom-backend/routes/khachMoi.routes.js#L6) | Nhận endpoint trạng thái |
| Service backend | [`khachMoi.service.js`](happyroom-backend/services/khachMoi.service.js#L42) | Gọi procedure trạng thái, không ép khách phải là khách mới |
| SQL quyết định | [`khach-moi.sql`](happyroom-backend/database/sql/khach-moi.sql#L87) | Nếu khách đã có `PhieuDatCoc` hoặc `HopDongThue` thì `laKhachMoi = false` |
| Hiển thị cuối | [`KhachHangPortalPage.jsx`](happyroom-frontend/src/pages/khachHang/KhachHangPortalPage.jsx#L6) | `true` -> `KhachMoiPage`; `false` -> `KhachDangThuePage` |

Vì vậy, lỗi `Tai khoan da co coc hoac hop dong, khong thuoc cong khach moi` chỉ đúng khi một tài khoản đã thuê/có cọc cố gọi endpoint dành riêng cho khách mới như tổng quan hoặc danh sách phòng khách mới. Trang cổng chung phải kiểm tra trạng thái trước để đưa người dùng sang trang đang thuê.

### 6.2. Khách mới: tra cứu phòng và tạo hồ sơ

Trang thực thi: [`KhachMoiPage.jsx`](happyroom-frontend/src/pages/khachMoi/KhachMoiPage.jsx#L78). Hàm `loadPortal()` tại dòng 95 tải tổng quan và phòng; các thao tác gửi hồ sơ/điều chỉnh lịch nằm trong cùng trang từ dòng 158 trở đi.

| Chức năng | API frontend | Route backend | Service / procedure SQL |
| --- | --- | --- | --- |
| Lấy tổng quan hồ sơ, lịch xem, phòng | `getTongQuan()` trong [`khachMoi.api.js`](happyroom-frontend/src/pages/khachMoi/khachMoi.api.js#L3) | `GET /api/khach-moi/tong-quan` tại [`khachMoi.routes.js`](happyroom-backend/routes/khachMoi.routes.js#L7) | [`getTongQuan()`](happyroom-backend/services/khachMoi.service.js#L75) gọi `SP_KhachMoi_DanhSachHoSo`, `SP_KhachMoi_DanhSachLichXem`, `SP_KhachMoi_DanhSachPhong` trong [`khach-moi.sql`](happyroom-backend/database/sql/khach-moi.sql#L115) |
| Lọc phòng khả dụng | `getPhongKhaDung()` | `GET /api/khach-moi/phong-kha-dung` tại dòng 8 route | [`getPhongKhaDung()`](happyroom-backend/services/khachMoi.service.js#L92) -> `SP_KhachMoi_DanhSachPhong` |
| Gửi hồ sơ đăng ký | `createHoSo()` | `POST /api/khach-moi/ho-so` tại dòng 9 route | [`createHoSo()`](happyroom-backend/services/khachMoi.service.js#L98) -> [`SP_KhachMoi_TaoHoSo`](happyroom-backend/database/sql/khach-moi.sql#L222) -> bảng `PhieuDangKy` |
| Yêu cầu đổi lịch xem | `yeuCauDieuChinhLich()` | `PUT /api/khach-moi/lich-xem/:id/yeu-cau-dieu-chinh` tại dòng 10 route | [`yeuCauDieuChinhLich()`](happyroom-backend/services/khachMoi.service.js#L130) -> [`SP_KhachMoi_YeuCauDieuChinhLich`](happyroom-backend/database/sql/khach-moi.sql#L306) |

### 6.3. Khách đang thuê

Trang: [`KhachDangThuePage.jsx`](happyroom-frontend/src/pages/khachDangThue/KhachDangThuePage.jsx#L109).

Trang này hiện phục vụ thiết kế giao diện cho khách đã có cọc/hợp đồng, gồm menu tài khoản và các khu vực thông tin thuê phòng. Nó được mở đúng theo kết quả `SP_KhachMoi_TrangThai`, nhưng bản thân các dữ liệu chi tiết trong trang chưa được tải qua API nghiệp vụ riêng.

Khi nhóm phụ trách nối chức năng, luồng dữ liệu nên dựa trên các bảng:

| Nội dung hiển thị | Bảng dữ liệu nguồn trong schema |
| --- | --- |
| Hợp đồng/phòng/giường đang thuê | `HopDongThue`, `Phong`, `Giuong` |
| Hóa đơn và dịch vụ | `HoaDon`, `ChiTietHoaDon`, `DichVuHopDong` |
| Trả phòng/quyết toán | `PhieuTraPhong`, `BienBanKiemTraPhong`, `DoiSoat` |
| Sửa chữa/bảo trì | `YeuCauSuaChua` |

Các bảng nằm trong [`app.sql`](happyroom-backend/database/sql/app.sql); dữ liệu minh họa tương ứng nằm trong [`data.sql`](happyroom-backend/database/sql/data.sql).

### 6.4. Nhân viên Sale

| Thành phần | File / khúc code |
| --- | --- |
| Route theo chức vụ `Sale` | [`App.jsx`](happyroom-frontend/src/App.jsx#L93) |
| Trang giao diện Sale | [`NhanVienSalePage.jsx`](happyroom-frontend/src/pages/nhanVienSale/NhanVienSalePage.jsx#L96) |
| Menu/thông tin tài khoản/đăng xuất dùng chung | [`EmployeeAccount.jsx`](happyroom-frontend/src/components/common/EmployeeAccount.jsx#L19) |
| Nguồn chức vụ khi đăng nhập | `SP_DangNhap` trong [`auth.sql`](happyroom-backend/database/sql/auth.sql#L114), join `NhanVien.ChucVu` |

Màn hình Sale hiện là sườn giao diện và dữ liệu trình bày theo nhân viên `NV0001`; thao tác xử lý hồ sơ/lịch xem chưa gọi API từ trang này. Các API dự kiến cho nghiệp vụ liên quan nằm tại module `dangKyThue` và `lichXemPhong` ở mục 6.7.

### 6.5. Nhân viên Quản lý

| Thành phần | File / khúc code |
| --- | --- |
| Route theo chức vụ `Quản lý` | [`App.jsx`](happyroom-frontend/src/App.jsx#L103) |
| Trang giao diện Quản lý | [`NhanVienQuanLyPage.jsx`](happyroom-frontend/src/pages/nhanVienQuanLy/NhanVienQuanLyPage.jsx#L137) |
| Khu tổng quan và các tab cọc/bàn giao/bảo trì/trả phòng/phòng/tài sản | Các component trong [`NhanVienQuanLyPage.jsx`](happyroom-frontend/src/pages/nhanVienQuanLy/NhanVienQuanLyPage.jsx#L217) |
| Menu tài khoản dùng chung | [`EmployeeAccount.jsx`](happyroom-frontend/src/components/common/EmployeeAccount.jsx#L19) |

Màn hình Quản lý hiện là giao diện sườn theo dữ liệu mẫu của `NV0003`; chưa gọi các endpoint cọc, nhận phòng, trả phòng hoặc sửa chữa.

### 6.6. Nhân viên Kế toán

| Thành phần | File / khúc code |
| --- | --- |
| Route theo chức vụ `Kế toán` | [`App.jsx`](happyroom-frontend/src/App.jsx#L113) |
| Trang giao diện Kế toán | [`NhanVienKeToanPage.jsx`](happyroom-frontend/src/pages/nhanVienKeToan/NhanVienKeToanPage.jsx#L116) |
| Các tab thu cọc/thu đầu kỳ/hóa đơn/quyết toán/hoàn cọc | Các component trong [`NhanVienKeToanPage.jsx`](happyroom-frontend/src/pages/nhanVienKeToan/NhanVienKeToanPage.jsx#L195) |
| Menu tài khoản dùng chung | [`EmployeeAccount.jsx`](happyroom-frontend/src/components/common/EmployeeAccount.jsx#L19) |

Màn hình Kế toán hiện là giao diện sườn theo dữ liệu mẫu của `NV0004`; phần thu tiền, hóa đơn, quyết toán và hoàn cọc chưa nối endpoint thao tác thật.

### 6.7. Các module nghiệp vụ đã tạo sườn API

Các trang dashboard cũ được gắn tại [`App.jsx`](happyroom-frontend/src/App.jsx#L123). File `*.api.js`, route backend và service đã định nghĩa hợp đồng gọi; tuy nhiên procedure của các module trong bảng dưới đây **chưa xuất hiện trong các file SQL hiện tại**.

| Luồng | Trang/API frontend | Route backend | Service và procedure dự kiến |
| --- | --- | --- | --- |
| Đăng ký nhu cầu thuê | [`dangKyThue.api.js`](happyroom-frontend/src/pages/dangKyThue/dangKyThue.api.js#L3) | [`dangKyThue.routes.js`](happyroom-backend/routes/dangKyThue.routes.js#L6) | [`dangKyThue.service.js`](happyroom-backend/services/dangKyThue.service.js#L11): `SP_TaoHoSoDangKy`, `SP_DanhSachHoSoDangKy`, `SP_DanhSachPhongGiuongKhaDung`, `SP_KiemTraDieuKienThue`, `SP_CapNhatKetQuaXuLyHoSo` |
| Lịch xem phòng | [`lichXemPhong.api.js`](happyroom-frontend/src/pages/lichXemPhong/lichXemPhong.api.js#L3) | [`lichXemPhong.routes.js`](happyroom-backend/routes/lichXemPhong.routes.js#L6) | [`lichXemPhong.service.js`](happyroom-backend/services/lichXemPhong.service.js#L10): `SP_TaoLichXemPhong`, `SP_DanhSachLichXemPhong`, `SP_YeuCauDieuChinhLich`, `SP_CapNhatLichXemPhong` |
| Đặt cọc/thanh toán cọc | [`datCoc.api.js`](happyroom-frontend/src/pages/datCoc/datCoc.api.js#L3) | [`datCoc.routes.js`](happyroom-backend/routes/datCoc.routes.js#L6) | [`datCoc.service.js`](happyroom-backend/services/datCoc.service.js#L18): `SP_TaoPhieuDatCoc`, `SP_DanhSachPhieuDatCoc`, `SP_XacNhanKhaNangNhanCoc`, `SP_PhatHanhYeuCauThanhToanCoc`, `SP_CapNhatMinhChungThanhToanCoc`, `SP_XacNhanThanhToanCoc` |
| Nhận phòng/hợp đồng/bàn giao | [`nhanPhong.api.js`](happyroom-frontend/src/pages/nhanPhong/nhanPhong.api.js#L3) | [`nhanPhong.routes.js`](happyroom-backend/routes/nhanPhong.routes.js#L6) | [`nhanPhong.service.js`](happyroom-backend/services/nhanPhong.service.js#L18): `SP_CapNhatThongTinCuTru`, `SP_LapHopDongThue`, `SP_GhiNhanKhoanThuNhanPhong`, `SP_LapBienBanBanGiao` |
| Trả phòng/quyết toán/thanh lý | [`traPhong.api.js`](happyroom-frontend/src/pages/traPhong/traPhong.api.js#L3) | [`traPhong.routes.js`](happyroom-backend/routes/traPhong.routes.js#L6) | [`traPhong.service.js`](happyroom-backend/services/traPhong.service.js#L18): `SP_DangKyLichTraPhong`, `SP_LapBienBanKiemTraTraPhong`, `SP_XuLyQuyetToanTraPhong`, `SP_GhiNhanThanhLyHopDong` |
| Sửa chữa/bảo trì | [`suaChuaBaoTri.api.js`](happyroom-frontend/src/pages/suaChuaBaoTri/suaChuaBaoTri.api.js#L3) | [`suaChuaBaoTri.routes.js`](happyroom-backend/routes/suaChuaBaoTri.routes.js#L6) | [`suaChuaBaoTri.service.js`](happyroom-backend/services/suaChuaBaoTri.service.js#L18): `SP_TaoYeuCauSuaChua`, `SP_DanhSachYeuCauSuaChua`, `SP_TiepNhanYeuCauSuaChua`, `SP_HoanTatYeuCauSuaChua`, `SP_TuChoiYeuCauSuaChua` |

### 6.8. Controller backend theo module

Controller là lớp nhận `req`, gọi service và trả `res`; khi debug endpoint, mở route trước rồi tới controller trong bảng này.

| Luồng | Controller / khúc hàm xử lý |
| --- | --- |
| Xác thực | [`auth.controller.js`](happyroom-backend/controllers/auth.controller.js#L8): `dangKy`, `dangNhap`, `getToi`, `dangXuat` |
| Cổng khách mới | [`khachMoi.controller.js`](happyroom-backend/controllers/khachMoi.controller.js#L3): trạng thái, tổng quan, phòng khả dụng, tạo hồ sơ, điều chỉnh lịch |
| Đăng ký nhu cầu thuê | [`dangKyThue.controller.js`](happyroom-backend/controllers/dangKyThue.controller.js#L3): tạo/lấy hồ sơ, phòng giường, điều kiện, kết quả xử lý |
| Lịch xem phòng | [`lichXemPhong.controller.js`](happyroom-backend/controllers/lichXemPhong.controller.js#L3): tạo/lấy/cập nhật/điều chỉnh lịch |
| Đặt cọc | [`datCoc.controller.js`](happyroom-backend/controllers/datCoc.controller.js#L3): tạo/lấy phiếu, xác nhận khả năng, thanh toán |
| Nhận phòng | [`nhanPhong.controller.js`](happyroom-backend/controllers/nhanPhong.controller.js#L3): cư trú, hợp đồng, thu đầu kỳ, bàn giao |
| Trả phòng | [`traPhong.controller.js`](happyroom-backend/controllers/traPhong.controller.js#L3): lịch trả, kiểm tra, quyết toán, thanh lý |
| Sửa chữa/bảo trì | [`suaChuaBaoTri.controller.js`](happyroom-backend/controllers/suaChuaBaoTri.controller.js#L3): tạo/lấy, tiếp nhận, hoàn tất, từ chối |

## 7. Bản đồ database theo nghiệp vụ

### Schema và dữ liệu mẫu

| Nhóm dữ liệu | Bảng trong `app.sql` | Vùng dữ liệu mẫu trong `data.sql` |
| --- | --- | --- |
| Người dùng/phân quyền | `NguoiDung`, `NhanVien`, `KhachHang`, `TaiKhoan` | Nhân viên từ [dòng 46](happyroom-backend/database/sql/data.sql#L46), tài khoản từ [dòng 127](happyroom-backend/database/sql/data.sql#L127) |
| Cơ sở vật chất | `ChiNhanh`, `LoaiPhong`, `Phong`, `Giuong`, `TaiSan` | Các phần đầu file seed |
| Đăng ký/xem phòng | `PhieuDangKy`, `LichXemPhong`, `ChiTietXemPhong` | `PhieuDangKy` từ [dòng 256](happyroom-backend/database/sql/data.sql#L256) |
| Đặt cọc | `PhieuDatCoc`, `ChiTietDatCoc` | Từ [dòng 325](happyroom-backend/database/sql/data.sql#L325) |
| Thuê và bàn giao | `HopDongThue`, `ThanhVienHopDong`, `BienBanBanGiao`, `ChiTietBanGiao` | `HopDongThue` từ [dòng 363](happyroom-backend/database/sql/data.sql#L363) |
| Thu tiền/hóa đơn | `PhieuGhiChiSo`, `HoaDon`, `ChiTietHoaDon` | `HoaDon` từ [dòng 639](happyroom-backend/database/sql/data.sql#L639) |
| Trả phòng/quyết toán | `PhieuTraPhong`, `BienBanKiemTraPhong`, `ChiTietHuHong`, `DoiSoat` | Từ [dòng 765](happyroom-backend/database/sql/data.sql#L765) |
| Sửa chữa | `YeuCauSuaChua` | Từ [dòng 836](happyroom-backend/database/sql/data.sql#L836) |

### Procedure đang có trong repo

| File SQL | Procedure |
| --- | --- |
| [`auth.sql`](happyroom-backend/database/sql/auth.sql#L18) | `SP_DangKy`, `SP_DangNhap` |
| [`khach-moi.sql`](happyroom-backend/database/sql/khach-moi.sql#L87) | `SP_KhachMoi_TrangThai`, `SP_KhachMoi_DanhSachPhong`, `SP_KhachMoi_DanhSachHoSo`, `SP_KhachMoi_DanhSachLichXem`, `SP_KhachMoi_TaoHoSo`, `SP_KhachMoi_YeuCauDieuChinhLich` |

## 8. Checklist khi thêm một chức năng

1. Xác định vai trò được phép thao tác và bảng dữ liệu chịu ảnh hưởng trong [`app.sql`](happyroom-backend/database/sql/app.sql).
2. Viết hoặc cập nhật stored procedure của module trong `happyroom-backend/database/sql/`.
3. Gọi procedure qua service; validate input và đổi lỗi database thành HTTP error có ý nghĩa.
4. Khai báo controller và route; gắn `requireAuth`/kiểm tra quyền phù hợp.
5. Tạo hàm API frontend qua `httpClient`, sau đó mới nối form, bảng hoặc nút thao tác trên trang.
6. Kiểm thử bằng dữ liệu seed hoặc dữ liệu kiểm thử riêng; xác nhận trang được điều hướng đúng theo vai trò/trạng thái database.
7. Cập nhật README này khi endpoint, procedure hoặc trạng thái hoàn thiện của module thay đổi.
