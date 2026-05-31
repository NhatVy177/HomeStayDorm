# Tài liệu tham chiếu: Logic Tính Tiền

> Áp dụng cho: UC Lập hợp đồng thuê · UC Ghi nhận khoản thu nhận phòng · UC Lập biên bản bàn giao  
> Nguồn dữ liệu: Schema CSDL + Đặc tả nghiệp vụ HomeStay Dorm

---

## 1. Tổng quan các khoản tiền trong hệ thống

```
TIỀN CỌC          → Thu tại: UC Xác nhận thanh toán cọc (tiền điều kiện)
TIỀN THUÊ KỲ ĐẦU  → Thu tại: UC Ghi nhận khoản thu nhận phòng  ← TRONG PHẠM VI
PHÍ DỊCH VỤ KỲ ĐẦU → Thu tại: UC Ghi nhận khoản thu nhận phòng ← TRONG PHẠM VI
TIỀN THUÊ CÁC KỲ SAU → Thu tại: UC Thu tiền định kỳ (ngoài phạm vi)
HOÀN CỌC / QUYẾT TOÁN → Thu/Trả tại: UC Trả phòng (ngoài phạm vi)
```

---

## 2. Công thức tính tiền cọc

> ⚠️ Ghi nhận tại `PhieuDatCoc`, **không** tính lại trong 3 UC này.  
> Tài liệu hóa để AI hiểu ngữ cảnh và không nhầm lẫn khi đọc dữ liệu cọc.

```
SoTienCoc = GiaThue_1_Thang × 2 × SoGiuongThue
```

| Trường hợp | SoGiuongThue |
|---|---|
| Thuê ghép (từng giường) | Số giường thực tế đặt cọc |
| Thuê nguyên phòng | `LoaiPhong.SucChuaToiDa` (toàn bộ giường trong phòng) |

**Nguồn dữ liệu:**
- `PhieuDatCoc.SoTienCoc` — số tiền cọc đã xác nhận
- `ChiTietDatCoc.GiaThue` — giá thuê tại thời điểm cọc (snapshot, không thay đổi)
- `ChiTietDatCoc(MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)` — chi tiết từng giường cọc

---

## 3. Công thức tính tiền hóa đơn kỳ đầu

### 3.1. Xác định kỳ thanh toán

| `KyThanhToan` | Số tháng/kỳ | Ý nghĩa |
|---|---|---|
| `'Hàng tháng'` | 1 | Thanh toán mỗi tháng |
| `'Hàng quý'` | 3 | Thanh toán mỗi 3 tháng |

```
SoThangKyDau = 1  (nếu KyThanhToan = 'Hàng tháng')
SoThangKyDau = 3  (nếu KyThanhToan = 'Hàng quý')
```

### 3.2. Tiền thuê kỳ đầu

```
TienThue_KyDau = HopDongThue.GiaThue × SoThangKyDau
```

> `HopDongThue.GiaThue` = tổng giá thuê đã xác nhận trong hợp đồng (theo giường hoặc nguyên phòng).

### 3.3. Phí dịch vụ kỳ đầu

Với mỗi dịch vụ trong `DichVuHopDong`:

```
PhiDichVu_i = DichVu.DonGia × SoThangKyDau
```

> **Lưu ý:** Điện và Nước là **bắt buộc** (BR từ UC Lập hợp đồng thuê).  
> Các dịch vụ khác (Wifi, Gửi xe,...) tùy chọn khi lập hợp đồng.  
> Kỳ đầu tính theo **tháng** (không có chỉ số công-tơ thực tế), đơn vị = `'tháng'`.

### 3.4. Tổng hóa đơn kỳ đầu

```
HoaDon.TongTien = TienThue_KyDau + Σ(PhiDichVu_i × SoThangKyDau)
```

---

## 4. Cấu trúc bản ghi `ChiTietHoaDon` kỳ đầu

Mỗi khoản tạo **1 dòng** `ChiTietHoaDon`:

| Loại khoản | `MaChiTietDVHD` | `MaPhieuGhi` | `SoLuong` | `DonViTinh` | `DonGia` | `ThanhTien` |
|---|---|---|---|---|---|---|
| Tiền thuê | NULL | NULL | `SoThangKyDau` | `'tháng'` | `HopDongThue.GiaThue` | `GiaThue × SoThang` |
| Điện (kỳ đầu) | FK → DichVuHopDong | NULL | `SoThangKyDau` | `'tháng'` | `DichVu.DonGia` | `DonGia × SoThang` |
| Nước (kỳ đầu) | FK → DichVuHopDong | NULL | `SoThangKyDau` | `'tháng'` | `DichVu.DonGia` | `DonGia × SoThang` |
| Dịch vụ khác | FK → DichVuHopDong | NULL | `SoThangKyDau` | `'tháng'` | `DichVu.DonGia` | `DonGia × SoThang` |

> **`MaPhieuGhi = NULL` cho tất cả dòng kỳ đầu** — vì chưa có chỉ số công-tơ thực tế.  
> Chỉ số công-tơ thực tế chỉ bắt đầu từ kỳ thứ 2 trở đi (qua `PhieuGhiChiSo`).

---

## 5. Snapshot giá — Quy tắc quan trọng

| Thời điểm | Giá được snapshot | Lưu tại |
|---|---|---|
| Khi đặt cọc | Giá thuê tại thời điểm cọc | `ChiTietDatCoc.GiaThue` |
| Khi lập hợp đồng | Giá dịch vụ tại thời điểm lập | `DichVuHopDong` (lấy từ `DichVu.DonGia`) |
| Khi lập hóa đơn | Giá áp dụng tại thời điểm lập HĐ | `ChiTietHoaDon.DonGia` |

> ⚠️ **Không được lấy `DichVu.DonGia` trực tiếp khi lập hóa đơn** — phải lấy từ snapshot đã lưu trong `DichVuHopDong` hoặc `ChiTietHoaDon`.  
> Nếu giá dịch vụ thay đổi sau khi ký hợp đồng, hóa đơn vẫn dùng giá cũ.

---

## 6. Validate trước khi tính tiền

| Kiểm tra | Điều kiện hợp lệ | Nếu sai → |
|---|---|---|
| `HopDongThue.GiaThue` | > 0 và NOT NULL | E4: cảnh báo, yêu cầu chỉnh sửa |
| `DichVu.DonGia` (từng dịch vụ) | > 0 và NOT NULL | E4: cảnh báo, yêu cầu chỉnh sửa |
| `KyThanhToan` | `'Hàng tháng'` hoặc `'Hàng quý'` | Không cho tính |
| Dịch vụ bắt buộc | Điện + Nước phải có trong `DichVuHopDong` | A10 (UC lập HĐ): cảnh báo trước khi lưu |

---

## 7. Trạng thái hóa đơn & điều kiện mở khóa bàn giao

```
Số tiền thực nộp >= HoaDon.TongTien
    → HoaDon.TrangThai = 'Đã TT'
    → Cho phép lập biên bản bàn giao

Số tiền thực nộp < HoaDon.TongTien
    → HoaDon.TrangThai = 'Chưa TT'
    → KHÓA bàn giao phòng
    → Quay lại chờ khách bổ sung
```

---

## 8. Sơ đồ luồng dữ liệu tính tiền

```
PhieuDatCoc
  └─ ChiTietDatCoc.GiaThue (snapshot giá cọc)
        │
        ▼
HopDongThue
  ├─ GiaThue        ──────────────────────────┐
  ├─ KyThanhToan                              │
  └─ DichVuHopDong ─→ DichVu.DonGia (snapshot)│
        │                                      │
        ▼                                      ▼
HoaDon (kỳ đầu)                     ChiTietHoaDon
  ├─ TongTien = Σ ThanhTien          ├─ dòng tiền thuê    (MaPhieuGhi=NULL)
  ├─ TrangThai = 'Chưa TT'/'Đã TT'  ├─ dòng Điện         (MaPhieuGhi=NULL)
  └─ NgayThanhToan (khi Đã TT)       ├─ dòng Nước         (MaPhieuGhi=NULL)
                                     └─ dòng dịch vụ khác (MaPhieuGhi=NULL)
        │
        ▼ (chỉ khi TrangThai='Đã TT')
BienBanBanGiao (mở khóa)
```

---

## 9. Các kỳ thanh toán SAU kỳ đầu (ngoài phạm vi 3 UC, ghi để tham chiếu)

> Từ kỳ 2 trở đi, điện/nước được tính theo chỉ số công-tơ thực tế:

```
SoLuongDien = PhieuGhiChiSo.ChiSoDienCuoi - PhieuGhiChiSo.ChiSoDienDau
SoLuongNuoc = PhieuGhiChiSo.ChiSoNuocCuoi - PhieuGhiChiSo.ChiSoNuocDau
ThanhTienDien = SoLuongDien × DonGia_Dien
ThanhTienNuoc = SoLuongNuoc × DonGia_Nuoc
```

> `PhieuGhiChiSo.TrangThai`: `'ChuaLapHD'` → `'DaLapHD'` sau khi kế toán lập hóa đơn.  
> `ChiTietHoaDon.MaPhieuGhi` ≠ NULL cho các dòng điện/nước từ kỳ 2.
