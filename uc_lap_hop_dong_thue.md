# UC: Lập Hợp Đồng Thuê

## Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Tác nhân** | Nhân viên sale |
| **Kích hoạt** | Chọn "Lập hợp đồng thuê" từ chi tiết phiếu đặt cọc |
| **Use-case liên quan** | UC Xác nhận thanh toán cọc (tiền điều kiện) |

---

## Điều kiện

### Tiền điều kiện (phải đủ TẤT CẢ)
- Nhân viên sale đã đăng nhập hệ thống
- `PhieuDatCoc.TrangThaiCoc = 'Hiệu lực'`
- `PhieuDatCoc.TrangThaiThanhToan = 'Đã TT'`
- Chưa có `HopDongThue` nào liên kết với phiếu cọc này

### Hậu điều kiện (sau khi thành công)
- `HopDongThue.TrangThai = 'Hiệu lực'` được tạo
- Các bản ghi `ThanhVienHopDong` với `TrangThai = 'Đang ở'` hoặc `'Bị từ chối'`
- `PhieuDatCoc.TrangThaiCoc = 'Đã lập HĐ'`
- Các bản ghi `DichVuHopDong` được tạo (đơn giá lấy từ `DichVu.DonGia` tại thời điểm lập)

---

## Luồng chính (Happy Path)

```
B1  → Nhân viên nhập mã phiếu đặt cọc
B2  → Hệ thống hiển thị: mã cọc, tên khách, phòng/giường, ngày dự kiến nhận phòng
B3  → Nhân viên chọn "Lập hợp đồng thuê"
B4  → Hệ thống validate: TrangThaiCoc='Hiệu lực', TrangThaiThanhToan='Đã TT', chưa có HĐ
B5  → Hệ thống hiển thị form, tự điền thông tin từ phiếu cọc
B6  → Hệ thống kiểm tra HinhThucThue:
         - Thuê nhóm  → [A6a]
         - Đi đơn     → Tự tạo 1 ThanhVienHopDong từ KhachHang → B7
B7  → Nhân viên nhập: NgayBatDau, NgayKetThuc, KyThanhToan, xác nhận GiaThue
B8  → Hệ thống validate: NgayBatDau hợp lệ, NgayKetThuc > NgayBatDau, GiaThue > 0,
       phòng/giường chưa có HĐ hiệu lực khác
B9  → Hệ thống hiển thị danh sách dịch vụ (Điện, Nước, Gửi xe,…)
B10 → Nhân viên chọn dịch vụ áp dụng
B11 → Nhân viên xác nhận khách đã ký và lưu
B12 → Hệ thống tạo HopDongThue (TrangThai='Hiệu lực')
B13 → Hệ thống cập nhật PhieuDatCoc.TrangThaiCoc = 'Đã lập HĐ'
B14 → Hệ thống tạo các bản ghi DichVuHopDong
B15 → Kết thúc
```

---

## Luồng phụ & Ngoại lệ

### A2 – Mã phiếu không tồn tại *(rẽ nhánh tại B2)*
1. Thông báo không tìm thấy → quay lại B1

---

### A6a – Thuê nhóm *(rẽ nhánh tại B6)*
1. Nhân viên nhập thông tin từng thành viên: `HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich`
2. Hệ thống kiểm tra từng thành viên:
   - Giới tính phù hợp `Phong.GioiTinhChoPhep`
   - Số người ≤ `LoaiPhong.SucChuaToiDa`
3. Đủ điều kiện → `TrangThai = 'Đang ở'`
4. Không đủ → `TrangThai = 'Bị từ chối'`
5. Số người còn lại phù hợp số giường đã cọc → tiếp tục B7
6. Không phù hợp → **[E6b]**

---

### A10 – Chưa chọn đủ dịch vụ bắt buộc *(rẽ nhánh tại B10)*
1. Cảnh báo bắt buộc phải có **Điện** và **Nước**
2. Quay lại B9

---

### E4 – Phiếu không đủ điều kiện *(rẽ nhánh tại B4)*
1. Thông báo lý do cụ thể → không cho lập HĐ → Kết thúc

---

### E6b – Số người còn lại không phù hợp *(rẽ nhánh từ A6a)*
1. Nhân viên hủy thủ tục
2. Hệ thống **giữ nguyên** `PhieuDatCoc.TrangThaiCoc = 'Hiệu lực'` để xử lý thủ công
3. Kết thúc

---

### E8 – Phòng/giường đã có HĐ hiệu lực khác *(rẽ nhánh tại B8)*
1. Thông báo xung đột → không cho lưu
2. Nhân viên liên hệ quản lý → Kết thúc

---

### E11 – Khách từ chối ký *(rẽ nhánh tại B11)*
1. Không lưu, không tạo `HopDongThue` → Kết thúc

---

## Entities & Fields liên quan

| Entity | Fields chính | Ghi chú |
|---|---|---|
| `PhieuDatCoc` | `TrangThaiCoc`, `TrangThaiThanhToan`, `HinhThucThue`, `ThoiGianNhanPhong` | Nguồn dữ liệu đầu vào |
| `HopDongThue` | `NgayBatDau`, `NgayKetThuc`, `KyThanhToan`, `GiaThue`, `TrangThai` | Tạo mới khi thành công |
| `ThanhVienHopDong` | `HoTen`, `NgaySinh`, `GioiTinh`, `CCCD`, `SDT`, `Email`, `QuocTich`, `TrangThai` | 1 bản ghi/thành viên |
| `DichVuHopDong` | `DonGia` (lấy từ `DichVu.DonGia` tại thời điểm lập) | Điện & Nước là bắt buộc |
| `DichVu` | `DonGia` | Nguồn giá dịch vụ |
| `Phong` | `GioiTinhChoPhep` | Dùng validate thành viên nhóm |
| `LoaiPhong` | `SucChuaToiDa` | Dùng validate số người nhóm |

---

## Business Rules tóm tắt

| # | Rule |
|---|---|
| BR-1 | Chỉ lập HĐ khi phiếu cọc `Hiệu lực` + `Đã TT` + chưa có HĐ liên kết |
| BR-2 | Điện và Nước là dịch vụ **bắt buộc** trong mọi hợp đồng |
| BR-3 | `NgayKetThuc` phải lớn hơn `NgayBatDau` |
| BR-4 | `GiaThue` phải > 0 |
| BR-5 | Phòng/giường không được có HĐ hiệu lực khác cùng thời điểm |
| BR-6 | Thành viên nhóm bị từ chối vẫn cho phép ký HĐ nếu số người còn lại phù hợp số giường cọc |
| BR-7 | Đơn giá dịch vụ được **snapshot** tại thời điểm lập HĐ (không thay đổi theo sau) |
| BR-8 | Khi E6b: `TrangThaiCoc` **không** bị thay đổi (giữ `Hiệu lực`) để xử lý thủ công |
