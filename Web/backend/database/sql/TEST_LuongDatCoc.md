# Kịch bản test luồng đặt cọc (DC02 → DC05) + khóa giới tính phòng

Chạy trong SSMS trên DB `HOMEDORM4`. Mỗi khối `sql` là **một batch** — copy nguyên khối rồi chạy.

**Tiên quyết:** đã chạy `app.sql` (schema chuẩn `Database/CreateDB/app.sql`) + `data.sql` + `auth.sql` + `dat-coc.sql` (bản mới nhất).

Thứ tự: **Bước 0 → 1 → 2 → chọn kịch bản A…F → Kiểm tra → Reset (làm lại) hoặc Cleanup (xóa sạch)**.

`PhieuDangKy` dùng `SoNam`/`SoNu`/`SoNguoiDuKienO`, **không có** `GioiTinh`/`HinhThucThue`. Hình thức thuê do `SP_LapPhieuDatCoc` tự quyết ở DC03: **khác giới** (`SoNam>0` và `SoNu>0`) → chỉ nguyên phòng; **cùng giới** → ghép theo số giường chọn.

---

## Bước 0 — Tạo bảng cấu hình test

`__TestCfg` lưu phòng/giường/nhân viên đã chọn để dùng xuyên các batch.

```sql
USE HOMEDORM4;
SET NOCOUNT ON;

IF OBJECT_ID('dbo.__TestCfg', 'U') IS NULL
    CREATE TABLE dbo.__TestCfg (k VARCHAR(30) PRIMARY KEY, v NVARCHAR(200));

PRINT N'Bước 0 xong: __TestCfg sẵn sàng.';
```

---

## Bước 1 — Xem phòng để chọn (khảo sát dữ liệu)

Tổng quan phòng KPB còn chỗ, sức chứa, giá, số giường trống:

```sql
USE HOMEDORM4;

SELECT
    p.MaPhong, p.TenPhong,
    p.GioiTinhChoPhep,
    p.TinhTrang                                   AS tinhTrangPhong,
    lp.TenLoaiPhong, lp.SucChuaToiDa,
    lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong,
    COUNT(g.MaGiuong)                             AS tongGiuong,
    SUM(CASE WHEN g.TinhTrang = N'Trống' THEN 1 ELSE 0 END) AS giuongTrong
FROM dbo.Phong p
JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
LEFT JOIN dbo.Giuong g ON g.MaPhong = p.MaPhong
GROUP BY p.MaPhong, p.TenPhong, p.GioiTinhChoPhep, p.TinhTrang,
         lp.TenLoaiPhong, lp.SucChuaToiDa, lp.GiaThueTheoGiuong, lp.GiaThueNguyenPhong
ORDER BY giuongTrong DESC, p.MaPhong;
```

Kiểm tra đủ nhân viên 3 vai trò:

```sql
SELECT ChucVu, MIN(MaNhanVien) AS maMau, COUNT(*) AS soLuong
FROM dbo.NhanVien
WHERE ChucVu IN (N'Sale', N'Quản lý', N'Kế toán')
GROUP BY ChucVu;
```

---

## Bước 2 — Dựng dữ liệu test (tự chọn phòng + tạo khách + hồ sơ)

Tự chọn 1 phòng KPB còn ≥ 2 giường trống (test ghép) và 1 phòng KPB trống hoàn toàn, sức chứa ≥ 2 (test nguyên phòng); tạo 4 khách + 4 hồ sơ `Chờ tiếp nhận`.

```sql
USE HOMEDORM4;
SET NOCOUNT ON;

DELETE FROM dbo.__TestCfg;

-- (1) Phòng KPB để test GHÉP: còn >= 2 giường trống
DECLARE @phongGhep VARCHAR(4);
SELECT TOP 1 @phongGhep = p.MaPhong
FROM dbo.Phong p
JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
WHERE p.GioiTinhChoPhep = N'Không phân biệt'
  AND lp.SucChuaToiDa >= 2
  AND (SELECT COUNT(*) FROM dbo.Giuong g WHERE g.MaPhong = p.MaPhong AND g.TinhTrang = N'Trống') >= 2
ORDER BY p.MaPhong;

-- (2) Phòng KPB để test NGUYÊN PHÒNG: tất cả giường Trống, sức chứa >= 2, khác phòng ghép
DECLARE @phongNguyen VARCHAR(4);
SELECT TOP 1 @phongNguyen = p.MaPhong
FROM dbo.Phong p
JOIN dbo.LoaiPhong lp ON lp.MaLoaiPhong = p.MaLoaiPhong
WHERE p.GioiTinhChoPhep = N'Không phân biệt'
  AND p.MaPhong <> @phongGhep
  AND lp.SucChuaToiDa >= 2
  AND NOT EXISTS (SELECT 1 FROM dbo.Giuong g WHERE g.MaPhong = p.MaPhong AND g.TinhTrang <> N'Trống')
ORDER BY p.MaPhong;

IF @phongGhep IS NULL OR @phongNguyen IS NULL
BEGIN
    RAISERROR(N'Không tìm đủ phòng KPB phù hợp. Xem Bước 1 và giải phóng thêm phòng/giường.', 16, 1);
    RETURN;
END;

-- Lấy 2 giường trống của phòng ghép
DECLARE @g1 VARCHAR(3), @g2 VARCHAR(3);
;WITH b AS (
    SELECT MaGiuong, ROW_NUMBER() OVER (ORDER BY SoGiuong) rn
    FROM dbo.Giuong WHERE MaPhong = @phongGhep AND TinhTrang = N'Trống'
)
SELECT @g1 = MAX(CASE WHEN rn = 1 THEN MaGiuong END),
       @g2 = MAX(CASE WHEN rn = 2 THEN MaGiuong END)
FROM b;

-- Nhân viên mẫu theo vai trò
DECLARE @nvSale VARCHAR(6) = (SELECT MIN(MaNhanVien) FROM dbo.NhanVien WHERE ChucVu = N'Sale');
DECLARE @nvQL   VARCHAR(6) = (SELECT MIN(MaNhanVien) FROM dbo.NhanVien WHERE ChucVu = N'Quản lý');
DECLARE @nvKT   VARCHAR(6) = (SELECT MIN(MaNhanVien) FROM dbo.NhanVien WHERE ChucVu = N'Kế toán');

INSERT INTO dbo.__TestCfg (k, v) VALUES
    ('phongGhep', @phongGhep), ('phongNguyen', @phongNguyen),
    ('giuong1', @g1), ('giuong2', @g2),
    ('nvSale', @nvSale), ('nvQL', @nvQL), ('nvKT', @nvKT);

-- Khách test (prefix KHT để dễ dọn)
IF NOT EXISTS (SELECT 1 FROM dbo.NguoiDung WHERE MaNguoiDung = 'KHT001')
INSERT INTO dbo.NguoiDung (MaNguoiDung, HoTen, GioiTinh, LoaiNguoiDung) VALUES
    ('KHT001', N'Test Nam A',   N'Nam', 'KhachHang'),
    ('KHT002', N'Test Nữ B',    N'Nữ',  'KhachHang'),
    ('KHT003', N'Test Nam C',   N'Nam', 'KhachHang'),
    ('KHT004', N'Test Nhóm D',  N'Nam', 'KhachHang');
IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = 'KHT001')
INSERT INTO dbo.KhachHang (MaKhachHang) VALUES ('KHT001'),('KHT002'),('KHT003'),('KHT004');

-- Hồ sơ đăng ký (bắt đầu 'Chờ tiếp nhận')
DELETE FROM dbo.ChiTietXemPhong WHERE MaDangKy IN ('DKT001','DKT002','DKT003','DKT004');
DELETE FROM dbo.PhieuDangKy     WHERE MaDangKy IN ('DKT001','DKT002','DKT003','DKT004');

INSERT INTO dbo.PhieuDangKy
    (MaDangKy, NgayDangKy, SoNguoiDuKienO, SoNam, SoNu, TrangThai, MaKhachHang)
VALUES
    ('DKT001', CAST(GETDATE() AS DATE), 1, 1, 0, N'Chờ tiếp nhận', 'KHT001'), -- nhóm Nam (ghép)
    ('DKT002', CAST(GETDATE() AS DATE), 1, 0, 1, N'Chờ tiếp nhận', 'KHT002'), -- nhóm Nữ (ghép)
    ('DKT003', CAST(GETDATE() AS DATE), 1, 1, 0, N'Chờ tiếp nhận', 'KHT003'), -- nhóm Nam (ghép)
    ('DKT004', CAST(GETDATE() AS DATE), 2, 1, 1, N'Chờ tiếp nhận', 'KHT004'); -- khác giới -> nguyên phòng

-- Gắn phòng khách đã xem (LichXemPhong cha trước, ChiTietXemPhong con sau)
INSERT INTO dbo.LichXemPhong (MaDangKy, STTLich, ThoiGianHen, TrangThai) VALUES
    ('DKT001', 1, DATEADD(DAY,1,GETDATE()), N'Đã xem'),
    ('DKT002', 1, DATEADD(DAY,1,GETDATE()), N'Đã xem'),
    ('DKT003', 1, DATEADD(DAY,1,GETDATE()), N'Đã xem'),
    ('DKT004', 1, DATEADD(DAY,1,GETDATE()), N'Đã xem');
INSERT INTO dbo.ChiTietXemPhong (MaDangKy, MaPhong, STTLich) VALUES
    ('DKT001', @phongGhep,   1),
    ('DKT002', @phongGhep,   1),
    ('DKT003', @phongGhep,   1),
    ('DKT004', @phongNguyen, 1);

SELECT * FROM dbo.__TestCfg ORDER BY k;
PRINT N'Bước 2 xong. Phòng ghép = ' + @phongGhep + N', phòng nguyên = ' + @phongNguyen;
```

---

## Tùy chỉnh số Nam / Nữ cho hồ sơ

Sửa `@MaDangKy`, `@SoNam`, `@SoNu` rồi chạy (tự đồng bộ `SoNguoiDuKienO = SoNam + SoNu`):

```sql
USE HOMEDORM4;
DECLARE @MaDangKy VARCHAR(6) = 'DKT001';
DECLARE @SoNam    INT        = 2;
DECLARE @SoNu     INT        = 1;

IF @SoNam < 0 OR @SoNu < 0 OR (@SoNam + @SoNu) < 1
BEGIN
    RAISERROR(N'Số nam/nữ không hợp lệ (tổng phải >= 1).', 16, 1);
    RETURN;
END;

UPDATE dbo.PhieuDangKy
SET SoNam          = @SoNam,
    SoNu           = @SoNu,
    SoNguoiDuKienO = @SoNam + @SoNu
WHERE MaDangKy = @MaDangKy;

SELECT MaDangKy, SoNam, SoNu, SoNguoiDuKienO, TrangThai
FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy;
```

**Khi lập phiếu (DC03) sau khi đổi:**
- **Ghép giường**: số giường truyền vào `@DanhSachGiuong` phải **đúng bằng** `SoNam + SoNu` (lệch → lỗi 50217), phòng phải còn đủ giường trống.
- **Nhóm khác giới** (`SoNam > 0` và `SoNu > 0`): chỉ **nguyên phòng** — `@DanhSachGiuong = NULL`; cố ghép → lỗi 50216.
- Đổi số người xong nên chạy **Reset** trước khi test lại.

---

> **Cách chạy các kịch bản:** mỗi kịch bản chia thành **từng bước** — chạy 1 bước, đối chiếu **Kỳ vọng**, rồi mới sang bước sau. Mỗi kịch bản có **Reset kịch bản** ở cuối để đưa hồ sơ/phiếu/phòng về đúng trạng thái **ngay trước** kịch bản đó → chạy lại bao nhiêu lần cũng được.
>
> **Thứ tự phụ thuộc:** A khóa phòng ghép thành Nam; B, C, D, E dựa trên trạng thái do A (và C) tạo ra. Nếu chạy riêng lẻ, đọc mục **Tiền đề** của từng kịch bản.

---

## Kịch bản A — Ghép nhóm Nam vào phòng KPB → **khóa phòng thành Nam**

**Tiền đề:** đã chạy Bước 2. Phòng ghép đang `Không phân biệt`, giường `@g1` `Trống`.

### Bước A.1 — Sale gửi yêu cầu (DC02a)

```sql
USE HOMEDORM4;
DECLARE @nvSale VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvSale');
EXEC dbo.SP_GuiYeuCauDatCoc @MaDangKy='DKT001', @MaNhanVienSale=@nvSale;

SELECT MaDangKy, TrangThai, MaNhanVienSale FROM dbo.PhieuDangKy WHERE MaDangKy='DKT001';
```

✅ **Kỳ vọng:** `TrangThai = 'Chờ xác nhận cọc'`, `MaNhanVienSale` = mã nhân viên Sale.

### Bước A.2 — Quản lý xác nhận khả năng nhận cọc (DC02b)

```sql
USE HOMEDORM4;
DECLARE @nvQL VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvQL');
EXEC dbo.SP_XacNhanKhaNangNhanCoc @MaDangKy='DKT001', @MaQuanLy=@nvQL, @DuocNhanCoc=1;

SELECT MaDangKy, TrangThai FROM dbo.PhieuDangKy WHERE MaDangKy='DKT001';
```

✅ **Kỳ vọng:** `TrangThai = 'Xác nhận cọc'`.

### Bước A.3 — Kế toán lập phiếu đặt cọc, ghép 1 giường (DC03)

```sql
USE HOMEDORM4;
DECLARE @nvKT VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvKT');
DECLARE @g1   VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong1');
EXEC dbo.SP_LapPhieuDatCoc @MaDangKy='DKT001', @MaNhanVienKeToan=@nvKT,
                           @SoTienCoc=0, @PhuongThucThanhToan=N'Chuyển khoản', @DanhSachGiuong=@g1;

DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
SELECT MaPhieuDatCoc, HinhThucThue, TrangThaiThanhToan, TrangThaiCoc
FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT001';
SELECT MaPhong, GioiTinhChoPhep, TinhTrang FROM dbo.Phong WHERE MaPhong=@phongGhep;
SELECT MaGiuong, TinhTrang FROM dbo.Giuong WHERE MaPhong=@phongGhep ORDER BY SoGiuong;
```

✅ **Kỳ vọng:** có 1 `PhieuDatCoc` `TrangThaiThanhToan='Chờ TT'`, `TrangThaiCoc='Hiệu lực'`, `HinhThucThue='Ghép'`; **phòng ghép `GioiTinhChoPhep='Nam'`**; giường `@g1` = `Giữ chỗ`.

### Reset kịch bản A

```sql
USE HOMEDORM4;
SET NOCOUNT ON;
DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
DECLARE @g1 VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong1');

DELETE ct FROM dbo.ChiTietDatCoc ct
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc=ct.MaPhieuDatCoc
WHERE pdc.MaPhieuYeuCauDangKy='DKT001';
DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT001';

UPDATE dbo.Giuong SET TinhTrang=N'Trống' WHERE MaPhong=@phongGhep AND MaGiuong=@g1;
UPDATE dbo.PhieuDangKy SET TrangThai=N'Chờ tiếp nhận', MaNhanVienSale=NULL WHERE MaDangKy='DKT001';

-- Mở khóa phòng về KPB nếu không còn giường bị giữ/thuê
UPDATE dbo.Phong SET GioiTinhChoPhep=N'Không phân biệt', TinhTrang=N'Trống'
WHERE MaPhong=@phongGhep
  AND NOT EXISTS (SELECT 1 FROM dbo.Giuong g WHERE g.MaPhong=@phongGhep AND g.TinhTrang<>N'Trống');

PRINT N'Đã reset kịch bản A (DKT001).';
```

---

## Kịch bản B — Nhóm Nữ vào phòng đã khóa Nam → **bị chặn**

**Tiền đề:** kịch bản A đã chạy xong (phòng ghép đang khóa `Nam`).

### Bước B.1 — Chặn sớm ở DC02 (khuyến nghị)

```sql
USE HOMEDORM4;
DECLARE @nvSale VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvSale');
DECLARE @nvQL   VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvQL');

EXEC dbo.SP_GuiYeuCauDatCoc       @MaDangKy='DKT002', @MaNhanVienSale=@nvSale;   -- OK
EXEC dbo.SP_XacNhanKhaNangNhanCoc @MaDangKy='DKT002', @MaQuanLy=@nvQL, @DuocNhanCoc=1;  -- lỗi
```

✅ **Kỳ vọng:** dòng `SP_XacNhanKhaNangNhanCoc` **THROW lỗi 50209** ("Phòng đã được giữ cho giới tính khác…"). Hồ sơ DKT002 dừng ở `Chờ xác nhận cọc`, không tạo phiếu.

### Bước B.2 — Chặn ở DC03 (khi bỏ qua bước duyệt)

```sql
USE HOMEDORM4;
DECLARE @nvKT VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvKT');
DECLARE @g2   VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong2');

UPDATE dbo.PhieuDangKy SET TrangThai=N'Xác nhận cọc' WHERE MaDangKy='DKT002';  -- ép qua DC02
EXEC dbo.SP_LapPhieuDatCoc @MaDangKy='DKT002', @MaNhanVienKeToan=@nvKT,
                           @SoTienCoc=0, @PhuongThucThanhToan=N'Tiền mặt', @DanhSachGiuong=@g2;  -- lỗi
```

✅ **Kỳ vọng:** **THROW lỗi 50218** ("…không thể ghép…"). Không tạo phiếu, giường `@g2` vẫn nguyên trạng.

### Reset kịch bản B

```sql
USE HOMEDORM4;
DELETE ct FROM dbo.ChiTietDatCoc ct
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc=ct.MaPhieuDatCoc
WHERE pdc.MaPhieuYeuCauDangKy='DKT002';
DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT002';
UPDATE dbo.PhieuDangKy SET TrangThai=N'Chờ tiếp nhận', MaNhanVienSale=NULL WHERE MaDangKy='DKT002';
PRINT N'Đã reset kịch bản B (DKT002).';
```

---

## Kịch bản C — Nhóm Nam khác vào phòng đã khóa Nam → **cho phép (cùng giới)**

**Tiền đề:** kịch bản A đã chạy xong (phòng ghép khóa `Nam`), giường `@g2` còn `Trống`.

### Bước C.1 — Sale gửi yêu cầu + QL duyệt (DC02)

```sql
USE HOMEDORM4;
DECLARE @nvSale VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvSale');
DECLARE @nvQL   VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvQL');
EXEC dbo.SP_GuiYeuCauDatCoc       @MaDangKy='DKT003', @MaNhanVienSale=@nvSale;
EXEC dbo.SP_XacNhanKhaNangNhanCoc @MaDangKy='DKT003', @MaQuanLy=@nvQL, @DuocNhanCoc=1;

SELECT MaDangKy, TrangThai FROM dbo.PhieuDangKy WHERE MaDangKy='DKT003';
```

✅ **Kỳ vọng:** `TrangThai = 'Xác nhận cọc'` — **cùng giới Nam nên KHÔNG bị chặn** (khác với B).

### Bước C.2 — Kế toán lập phiếu, ghép giường `@g2` (DC03)

```sql
USE HOMEDORM4;
DECLARE @nvKT VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvKT');
DECLARE @g2   VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong2');
EXEC dbo.SP_LapPhieuDatCoc @MaDangKy='DKT003', @MaNhanVienKeToan=@nvKT,
                           @SoTienCoc=0, @PhuongThucThanhToan=N'Chuyển khoản', @DanhSachGiuong=@g2;

DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
SELECT MaPhong, GioiTinhChoPhep FROM dbo.Phong WHERE MaPhong=@phongGhep;
SELECT MaGiuong, TinhTrang FROM dbo.Giuong WHERE MaPhong=@phongGhep ORDER BY SoGiuong;
```

✅ **Kỳ vọng:** tạo phiếu thành công; giường `@g2` = `Giữ chỗ`; phòng vẫn `Nam`.

### Reset kịch bản C

```sql
USE HOMEDORM4;
SET NOCOUNT ON;
DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
DECLARE @g2 VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong2');

DELETE ct FROM dbo.ChiTietDatCoc ct
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc=ct.MaPhieuDatCoc
WHERE pdc.MaPhieuYeuCauDangKy='DKT003';
DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT003';

UPDATE dbo.Giuong SET TinhTrang=N'Trống' WHERE MaPhong=@phongGhep AND MaGiuong=@g2;
UPDATE dbo.PhieuDangKy SET TrangThai=N'Chờ tiếp nhận', MaNhanVienSale=NULL WHERE MaDangKy='DKT003';

UPDATE dbo.Phong SET GioiTinhChoPhep=N'Không phân biệt', TinhTrang=N'Trống'
WHERE MaPhong=@phongGhep
  AND NOT EXISTS (SELECT 1 FROM dbo.Giuong g WHERE g.MaPhong=@phongGhep AND g.TinhTrang<>N'Trống');

PRINT N'Đã reset kịch bản C (DKT003).';
```

---

## Kịch bản D — DC04 (ghi nhận chứng từ) + DC05 (xác nhận thanh toán)

**Tiền đề:** kịch bản A đã chạy xong → phiếu của DKT001 đang `Chờ TT`, giường `@g1` `Giữ chỗ`.

### Bước D.1 — DC04: ghi nhận chứng từ thanh toán

```sql
USE HOMEDORM4;
DECLARE @maPhieu VARCHAR(6) = (SELECT MaPhieuDatCoc FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT001');
EXEC dbo.SP_CapNhatMinhChungThanhToanCoc
    @PhieuId=@maPhieu, @ChungTuThanhToan=N'/uploads/chung-tu/test-DKT001.png', @GhiChu=N'Test CK';

SELECT MaPhieuDatCoc, TrangThaiThanhToan, ChungTuThanhToan
FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc=@maPhieu;
```

✅ **Kỳ vọng:** `ChungTuThanhToan` = đường dẫn file; `TrangThaiThanhToan` **vẫn** `Chờ TT` (chờ QL duyệt). Phiếu hiện ở tab DC05 (chip **Chờ xác nhận**).

### Bước D.2 — DC05: quản lý xác nhận hợp lệ

```sql
USE HOMEDORM4;
DECLARE @maPhieu   VARCHAR(6) = (SELECT MaPhieuDatCoc FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT001');
DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
EXEC dbo.SP_XacNhanThanhToanCoc @PhieuId=@maPhieu, @HopLe=1;

SELECT MaPhieuDatCoc, TrangThaiThanhToan, ThoiGianXacNhanTT
FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc=@maPhieu;
SELECT MaGiuong, TinhTrang FROM dbo.Giuong WHERE MaPhong=@phongGhep ORDER BY SoGiuong;
```

✅ **Kỳ vọng:** phiếu `TrangThaiThanhToan='Đã TT'`, có `ThoiGianXacNhanTT`; giường `@g1` chuyển sang `Đã đặt cọc`. Phiếu vẫn hiển thị ở tab DC04/DC05 với chip **Đã TT / Đã xác nhận** (không mất phiếu).

### Reset kịch bản D (về lại trạng thái ngay sau A)

```sql
USE HOMEDORM4;
DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
DECLARE @g1 VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong1');
DECLARE @maPhieu VARCHAR(6) = (SELECT MaPhieuDatCoc FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT001');

UPDATE dbo.PhieuDatCoc
SET TrangThaiThanhToan=N'Chờ TT', TrangThaiCoc=N'Hiệu lực',
    ChungTuThanhToan=NULL, ThoiGianXacNhanTT=NULL,
    ThoiHanThanhToan=DATEADD(DAY,1,GETDATE())
WHERE MaPhieuDatCoc=@maPhieu;
UPDATE dbo.Giuong SET TinhTrang=N'Giữ chỗ' WHERE MaPhong=@phongGhep AND MaGiuong=@g1;
PRINT N'Đã reset kịch bản D (phiếu DKT001 về "Chờ TT").';
```

> Muốn xóa hẳn phiếu DKT001, dùng **Reset kịch bản A**.

---

## Kịch bản E — Cọc hết hạn → nhả chỗ + **mở khóa phòng về KPB**

**Tiền đề:** kịch bản C đã chạy xong → phiếu DKT003 đang `Chờ TT`, giường `@g2` `Giữ chỗ`.

### Bước E.1 — Ép phiếu quá hạn 24h

```sql
USE HOMEDORM4;
DECLARE @maPhieu VARCHAR(6) = (SELECT MaPhieuDatCoc FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT003');
UPDATE dbo.PhieuDatCoc SET ThoiHanThanhToan=DATEADD(DAY,-1,GETDATE()) WHERE MaPhieuDatCoc=@maPhieu;

SELECT MaPhieuDatCoc, ThoiHanThanhToan, TrangThaiThanhToan FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc=@maPhieu;
```

✅ **Kỳ vọng:** `ThoiHanThanhToan` < hiện tại; `TrangThaiThanhToan` vẫn `Chờ TT` (chưa dọn).

### Bước E.2 — Chạy SP dọn cọc hết hạn

```sql
USE HOMEDORM4;
DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
EXEC dbo.SP_NhaChoCocHetHan;

SELECT MaPhieuDatCoc, TrangThaiThanhToan, TrangThaiCoc
FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT003';
SELECT MaPhong, GioiTinhChoPhep FROM dbo.Phong WHERE MaPhong=@phongGhep;
SELECT MaGiuong, TinhTrang FROM dbo.Giuong WHERE MaPhong=@phongGhep ORDER BY SoGiuong;
```

✅ **Kỳ vọng:** phiếu DKT003 → `TrangThaiThanhToan='Hết hạn'`, `TrangThaiCoc='Đã hủy'`; giường `@g2` về `Trống`.
Phòng chỉ về `Không phân biệt` **khi mọi giường đã Trống**: nếu A vẫn giữ `@g1` (`Đã đặt cọc`/`Giữ chỗ`) thì phòng còn `Nam` — đúng. Muốn thấy mở khóa hẳn: chạy **Reset kịch bản A** rồi lặp lại E.

### Reset kịch bản E (về lại trạng thái ngay sau C)

```sql
USE HOMEDORM4;
DECLARE @phongGhep VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
DECLARE @g2 VARCHAR(3) = (SELECT v FROM dbo.__TestCfg WHERE k='giuong2');
DECLARE @maPhieu VARCHAR(6) = (SELECT MaPhieuDatCoc FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT003');

UPDATE dbo.PhieuDatCoc
SET TrangThaiThanhToan=N'Chờ TT', TrangThaiCoc=N'Hiệu lực',
    ThoiHanThanhToan=DATEADD(DAY,1,GETDATE())
WHERE MaPhieuDatCoc=@maPhieu;
UPDATE dbo.Giuong SET TinhTrang=N'Giữ chỗ' WHERE MaPhong=@phongGhep AND MaGiuong=@g2;
UPDATE dbo.Phong SET GioiTinhChoPhep=N'Nam' WHERE MaPhong=@phongGhep;  -- khóa lại vì đang có giường giữ
PRINT N'Đã reset kịch bản E (phiếu DKT003 về "Chờ TT").';
```

> Muốn xóa hẳn phiếu DKT003, dùng **Reset kịch bản C**.

---

## Kịch bản F — Nhóm khác giới (Nam + Nữ) → nguyên phòng

**Tiền đề:** đã chạy Bước 2. Phòng nguyên đang `Trống` + `Không phân biệt`. Độc lập với A–E.

### Bước F.1 — Sale gửi yêu cầu + QL duyệt (DC02)

```sql
USE HOMEDORM4;
DECLARE @nvSale VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvSale');
DECLARE @nvQL   VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvQL');
EXEC dbo.SP_GuiYeuCauDatCoc       @MaDangKy='DKT004', @MaNhanVienSale=@nvSale;
EXEC dbo.SP_XacNhanKhaNangNhanCoc @MaDangKy='DKT004', @MaQuanLy=@nvQL, @DuocNhanCoc=1;

SELECT MaDangKy, SoNam, SoNu, TrangThai FROM dbo.PhieuDangKy WHERE MaDangKy='DKT004';
```

✅ **Kỳ vọng:** `TrangThai='Xác nhận cọc'` (`SoNam>0` và `SoNu>0`).

### Bước F.2 — Kế toán lập phiếu nguyên phòng (KHÔNG truyền giường)

```sql
USE HOMEDORM4;
DECLARE @nvKT VARCHAR(6) = (SELECT v FROM dbo.__TestCfg WHERE k='nvKT');
EXEC dbo.SP_LapPhieuDatCoc @MaDangKy='DKT004', @MaNhanVienKeToan=@nvKT,
                           @SoTienCoc=0, @PhuongThucThanhToan=N'Tiền mặt', @DanhSachGiuong=NULL;

DECLARE @phongNguyen VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongNguyen');
SELECT HinhThucThue, TrangThaiThanhToan, SoTienCoc FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT004';
SELECT MaPhong, TinhTrang, GioiTinhChoPhep FROM dbo.Phong WHERE MaPhong=@phongNguyen;
SELECT MaGiuong, TinhTrang FROM dbo.Giuong WHERE MaPhong=@phongNguyen ORDER BY SoGiuong;
```

✅ **Kỳ vọng:** phiếu `HinhThucThue='Nguyên phòng'`; phòng nguyên `TinhTrang='Giữ chỗ'`, `GioiTinhChoPhep` vẫn `Không phân biệt`; **toàn bộ giường** → `Giữ chỗ`.

### Reset kịch bản F

```sql
USE HOMEDORM4;
SET NOCOUNT ON;
DECLARE @phongNguyen VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongNguyen');

DELETE ct FROM dbo.ChiTietDatCoc ct
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc=ct.MaPhieuDatCoc
WHERE pdc.MaPhieuYeuCauDangKy='DKT004';
DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy='DKT004';

UPDATE dbo.Giuong SET TinhTrang=N'Trống' WHERE MaPhong=@phongNguyen;
UPDATE dbo.Phong  SET TinhTrang=N'Trống', GioiTinhChoPhep=N'Không phân biệt' WHERE MaPhong=@phongNguyen;
UPDATE dbo.PhieuDangKy SET TrangThai=N'Chờ tiếp nhận', MaNhanVienSale=NULL WHERE MaDangKy='DKT004';
PRINT N'Đã reset kịch bản F (DKT004).';
```

---

## Kiểm tra tổng hợp (chạy bất cứ lúc nào)

```sql
USE HOMEDORM4;

SELECT MaDangKy, SoNam, SoNu, SoNguoiDuKienO, TrangThai, MaKhachHang
FROM dbo.PhieuDangKy WHERE MaDangKy LIKE 'DKT%' ORDER BY MaDangKy;

SELECT pdc.MaPhieuDatCoc, pdc.MaPhieuYeuCauDangKy, pdc.HinhThucThue,
       pdc.TrangThaiThanhToan, pdc.TrangThaiCoc, pdc.SoTienCoc, pdc.ChungTuThanhToan
FROM dbo.PhieuDatCoc pdc
WHERE pdc.MaPhieuYeuCauDangKy LIKE 'DKT%' ORDER BY pdc.MaPhieuDatCoc;

SELECT p.MaPhong, p.GioiTinhChoPhep, p.TinhTrang,
       g.MaGiuong, g.TinhTrang AS tinhTrangGiuong
FROM dbo.Phong p JOIN dbo.Giuong g ON g.MaPhong=p.MaPhong
WHERE p.MaPhong IN (SELECT v FROM dbo.__TestCfg WHERE k IN ('phongGhep','phongNguyen'))
ORDER BY p.MaPhong, g.SoGiuong;
```

---

## Reset — làm lại từ đầu (giữ khách + hồ sơ, xóa phiếu, trả phòng về trống)

```sql
USE HOMEDORM4;
SET NOCOUNT ON;

DECLARE @phongGhep   VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
DECLARE @phongNguyen VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongNguyen');

DELETE ct FROM dbo.ChiTietDatCoc ct
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ct.MaPhieuDatCoc
WHERE pdc.MaPhieuYeuCauDangKy LIKE 'DKT%';
DELETE FROM dbo.PhieuDatCoc WHERE MaPhieuYeuCauDangKy LIKE 'DKT%';

UPDATE dbo.Giuong SET TinhTrang=N'Trống' WHERE MaPhong IN (@phongGhep, @phongNguyen);
UPDATE dbo.Phong  SET TinhTrang=N'Trống', GioiTinhChoPhep=N'Không phân biệt'
WHERE MaPhong IN (@phongGhep, @phongNguyen);

UPDATE dbo.PhieuDangKy SET TrangThai=N'Chờ tiếp nhận', MaNhanVienSale=NULL
WHERE MaDangKy LIKE 'DKT%';

PRINT N'Reset xong. Chạy lại từ Kịch bản A.';
```

> Nhảy thẳng DC03 (bỏ DC02) cho hồ sơ nào: `UPDATE dbo.PhieuDangKy SET TrangThai=N'Xác nhận cọc' WHERE MaDangKy='DKT00x';`

---

## Cleanup — xóa sạch toàn bộ dữ liệu test

```sql
USE HOMEDORM4;
SET NOCOUNT ON;

DECLARE @phongGhep   VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongGhep');
DECLARE @phongNguyen VARCHAR(4) = (SELECT v FROM dbo.__TestCfg WHERE k='phongNguyen');

DELETE ct FROM dbo.ChiTietDatCoc ct
JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = ct.MaPhieuDatCoc
WHERE pdc.MaPhieuYeuCauDangKy LIKE 'DKT%';
DELETE FROM dbo.PhieuDatCoc     WHERE MaPhieuYeuCauDangKy LIKE 'DKT%';
DELETE FROM dbo.ChiTietXemPhong WHERE MaDangKy LIKE 'DKT%';
DELETE FROM dbo.LichXemPhong    WHERE MaDangKy LIKE 'DKT%';
DELETE FROM dbo.PhieuDangKy     WHERE MaDangKy LIKE 'DKT%';
DELETE FROM dbo.KhachHang       WHERE MaKhachHang LIKE 'KHT%';
DELETE FROM dbo.NguoiDung       WHERE MaNguoiDung LIKE 'KHT%';

UPDATE dbo.Giuong SET TinhTrang=N'Trống' WHERE MaPhong IN (@phongGhep, @phongNguyen);
UPDATE dbo.Phong  SET TinhTrang=N'Trống', GioiTinhChoPhep=N'Không phân biệt'
WHERE MaPhong IN (@phongGhep, @phongNguyen);

DROP TABLE IF EXISTS dbo.__TestCfg;
PRINT N'Đã xóa sạch dữ liệu test.';
```

---

```sql
--sửa số nam/nữ theo ý muốn
USE HOMEDORM4;
DECLARE @MaDangKy VARCHAR(6) = 'DK0303';   -- hồ sơ cần sửa
DECLARE @SoNam    INT        = 1;          -- số nam mong muốn
DECLARE @SoNu     INT        = 0;          -- số nữ mong muốn

IF @SoNam < 0 OR @SoNu < 0 OR (@SoNam + @SoNu) < 1
BEGIN
    RAISERROR(N'Số nam/nữ không hợp lệ (tổng phải >= 1).', 16, 1);
    RETURN;
END;

UPDATE dbo.PhieuDangKy
SET SoNam          = @SoNam,
    SoNu           = @SoNu,
    SoNguoiDuKienO = @SoNam + @SoNu
WHERE MaDangKy = @MaDangKy;

SELECT MaDangKy, SoNam, SoNu, SoNguoiDuKienO, TrangThai
FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy;

select *
from Phong


go

--Gán 1 phòng cho 1 phiếu
USE HOMEDORM4;
DECLARE @MaDangKy VARCHAR(6) = 'DK0303';   -- phiếu cần gán
DECLARE @MaPhong  VARCHAR(4) = 'P412';     -- phòng đã chọn

DECLARE @STT INT = ISNULL((SELECT MAX(STTLich) FROM dbo.LichXemPhong WHERE MaDangKy = @MaDangKy), 0) + 1;

-- 1) Tạo lịch xem phòng (bảng cha)
INSERT INTO dbo.LichXemPhong (MaDangKy, STTLich, ThoiGianHen, TrangThai)
VALUES (@MaDangKy, @STT, DATEADD(DAY, 1, GETDATE()), N'Đã xem');

-- 2) Gán phòng vào lịch đó (bảng con)
INSERT INTO dbo.ChiTietXemPhong (MaDangKy, MaPhong, STTLich)
VALUES (@MaDangKy, @MaPhong, @STT);

```
