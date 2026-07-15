# Thiết kế chi tiết 3 lớp (3-Layer) & Sơ đồ tuần tự - Use Case: Kiểm tra trả phòng

Tài liệu này đặc tả cấu trúc thiết kế 3 lớp (Giao diện, Nghiệp vụ, Truy cập dữ liệu) và Sơ đồ tuần tự chi tiết cho chức năng **Kiểm tra trả phòng** dành cho tác nhân **Nhân viên Quản lý** của hệ thống HomeStayDorm. Toàn bộ giao diện chính và các modal popup (lập biên bản kiểm tra hợp đồng, xác nhận hồ sơ đặt cọc, thông báo thành công) đều được gộp chung vào lớp Giao diện `MHKiemTraTraPhong` để khớp 100% với thực tế lập trình.

---

## 1. Thiết kế các Lớp chi tiết (Class Design)

### 1.1. Tầng Giao Diện (GUI Layer)
Lớp đại diện cho màn hình thực hiện chức năng, chứa tất cả các control giao diện (bảng danh sách phiếu, modal lập biên bản kiểm tra hợp đồng, modal xác nhận đặt cọc, và popup thành công).

*   **Tên lớp**: `MHKiemTraTraPhong`
*   **Thuộc tính (UI Controls)**:
    *   **Phần danh sách và bộ lọc (Trang chính)**:
        *   `- txtTimKiem: TextBox` (Tra cứu theo tên khách hàng, SĐT hoặc mã phiếu trả phòng)
        *   `- btnFilterTatCa: Button`, `- btnFilterChoXuLy: Button`, `- btnFilterDaXuLy: Button` (Các chip nút lọc trạng thái)
        *   `- dgvDanhSachPhieu: GridView` (Lưới hiển thị danh sách phiếu trả phòng: mã phiếu, khách hàng, phòng/giường, loại hồ sơ, ngày dự kiến trả, trạng thái)
        *   `- btnRowLapBienBan: Button` (Nút "Lập biên bản" trên dòng phiếu liên kết hợp đồng thuê, chỉ hiện khi `TrangThai = 'Chờ xử lý'`)
        *   `- btnRowXacNhan: Button` (Nút "Xác nhận" trên dòng phiếu liên kết phiếu đặt cọc, chỉ hiện khi `TrangThai = 'Chờ xử lý'`)
        *   `- btnRowXemChiTiet: Button` (Nút "Xem chi tiết" trên dòng phiếu đã xử lý)
    *   **Modal Lập biên bản kiểm tra (loại `kiem-tra-hd`)**:
        *   `- lblModalTitle: Label` (Tiêu đề "Lập biên bản kiểm tra trả phòng" hoặc "Chi tiết biên bản kiểm tra trả phòng")
        *   `- btnDongModal: Button` (Nút X để đóng modal)
        *   **Card Thông tin phiếu**: `- lblMaPhieuTra: Label`, `- lblNgayDangKy: Label`, `- lblNgayDuKienTra: Label`, `- lblTrangThaiPhieu: Label`
        *   **Card Khách hàng**: `- lblHoTenKhach: Label`, `- lblSdtKhach: Label`, `- lblCccdKhach: Label`, `- lblEmailKhach: Label`
        *   **Card Hợp đồng**: `- lblMaHopDong: Label`, `- lblNgayBatDau: Label`, `- lblNgayKetThuc: Label`, `- lblTrangThaiHD: Label`
        *   **Card Phòng/Giường**: `- lblTenChiNhanh: Label`, `- lblTenPhong: Label`, `- lblMaGiuong: Label`, `- lblLoaiPhong: Label`
        *   **Bảng nghĩa vụ liên quan** (chỉ hiện khi có dữ liệu):
            *   `- tblHoaDonNo: Table` (Hóa đơn chưa thanh toán/nợ: kỳ hóa đơn, trạng thái, số tiền)
            *   `- tblViPham: Table` (Biên bản vi phạm nội quy: nội dung, thời gian, mức phạt)
        *   `- dtpNgayTraThucTe: DatePicker` (Ngày trả phòng thực tế, bắt buộc; mặc định = ngày hiện tại)
        *   `- txtTinhTrangPhong: TextArea` (Mô tả tình trạng phòng thực tế, bắt buộc)
        *   **Bảng danh mục tài sản kiểm tra** (`tblTaiSan: Table`) — mỗi dòng là `AssetRow`:
            *   `- cboHienTrang: ComboBox` (Bình thường / Hư hỏng nhẹ / Hư hỏng nặng / Mất mát)
            *   `- txtSoLuongHuMat: TextBox` (Số lượng hư/mất, disabled khi "Bình thường")
            *   `- lblTyLe: Label` (Tỷ lệ hư hỏng: 0% / 20% / 60% / 100% — tự động theo trạng thái)
            *   `- lblPhiTamTinh: Label` (Phí bồi thường tạm tính — tự động tính = SL × ĐơnGiá × TỷLệ)
            *   `- txtMoTaHuMat: TextBox` (Mô tả chi tiết hư hỏng/mất mát)
        *   `- btnXacNhanLuuBienBan: Button` (Nút "Xác nhận lưu biên bản"; chỉ hiện khi phiếu còn "Chờ xử lý")
        *   `- btnDong: Button` (Nút "Đóng")
    *   **Modal Xác nhận hồ sơ đặt cọc (loại `xac-nhan-pdc`)**:
        *   `- lblModalTitlePDC: Label` (Tiêu đề "Xác nhận hồ sơ trả phòng")
        *   **Card Thông tin phiếu, khách hàng, phòng/giường**: (tương tự modal lập biên bản, không có phần tài sản và nghĩa vụ)
        *   **Card Phiếu đặt cọc**: `- lblMaPhieuDatCoc: Label`, `- lblNgayDatCoc: Label`, `- lblTienCoc: Label`, `- lblTrangThaiCoc: Label`, `- lblTrangThaiThanhToan: Label`, `- lblTinhTrangLapHD: Label`
        *   `- btnXacNhanHoSo: Button` (Nút "Xác nhận hồ sơ"; chỉ hiện khi phiếu còn "Chờ xử lý")
        *   `- btnDongPDC: Button` (Nút "Đóng")
    *   **Popup Thành công (Success Modal)**:
        *   `- lblSuccessTitle: Label` ("Thành công!")
        *   `- lblSuccessMessage: Label` ("Biên bản kiểm tra trả phòng đã được lưu vào hệ thống." hoặc "Hồ sơ đặt cọc đã được xác nhận thành công.")
        *   `- btnSuccessDong: Button`

*   **Phương thức (Events & Helpers)**:
    *   `+ HienThi(): void` (Nạp dữ liệu từ API vào `dgvDanhSachPhieu` với bộ lọc mặc định "Tất cả")
    *   `+ btnFilter_Click(trangThaiLoc: String): void` (Lọc danh sách client-side theo trạng thái)
    *   `+ txtTimKiem_Change(tuKhoa: String): void` (Lọc danh sách client-side theo từ khóa)
    *   `+ btnRow_Click(phieu: PhieuTraPhong): void` (Mở modal phù hợp dựa vào `loaiNguon`: gọi `KiemTraTraPhong::LayChiTietPhieu`)
    *   `+ HienThiChiTietModal(chiTiet: ChiTietPhieu): void` (Render toàn bộ thông tin vào modal; vô hiệu hóa form nếu phiếu không còn "Chờ xử lý")
    *   `+ handleAssetChange(assetData: Object): void` (Cập nhật `dsHuHong` state khi nhân viên thay đổi tình trạng tài sản; tự động tính phí tạm tính client-side)
    *   `+ KiemTraHopLeGiaoDien(): Boolean` (Validate client: `ngayTraThucTe` không trống, `tinhTrangPhong` không trống)
    *   `+ btnXacNhanLuuBienBan_Click(): void` (Validate, tổng hợp `dsHuHong`, gọi `KiemTraTraPhong::LapBienBanKiemTra`)
    *   `+ btnXacNhanHoSo_Click(): void` (Gọi `KiemTraTraPhong::XacNhanHuyCoc`)
    *   `+ HienThiThongBaoSuccess(): void` (Hiển thị popup thành công, sau đó tải lại danh sách)
    *   `+ btnSuccessDong_Click(): void` (Đóng popup thành công và đóng modal chính)

---

### 1.2. Tầng Nghiệp Vụ (BUS Layer)

#### Lớp: `PhieuTraPhong` (Thực thể Phiếu trả phòng)
*   **Thuộc tính**:
    *   `- MaPhieuTra: String`
    *   `- NgayDangKyTra: Date`
    *   `- NgayDuKienTra: Date`
    *   `- NgayTraThucTe: Date`
    *   `- TrangThai: String` (`'Chờ xử lý'` / `'Chờ đối soát'` / ...)
    *   `- MaHopDong: String` (null nếu liên kết phiếu đặt cọc)
    *   `- MaPhieuDatCoc: String` (null nếu liên kết hợp đồng)
    *   `- LoaiNguon: String` (`'HopDong'` | `'DatCoc'`)
*   **Phương thức**:
    *   `+ <<static>> LayDanhSachChoXuLy(maNhanVien: String, trangThaiLoc: String): List<PhieuTraPhong>`
        > Gọi `PhieuTraPhongDB::LayDanhSachChoXuLy`. Trả về danh sách phiếu trả phòng thuộc chi nhánh của quản lý, lọc theo trạng thái.

#### Lớp: `KiemTraTraPhong` (Thực thể nghiệp vụ kiểm tra)
*   **Thuộc tính**:
    *   `- MaBienBanKT: String`
    *   `- MaPhieuTra: String`
    *   `- MaNhanVienQL: String`
    *   `- NgayKiemTra: DateTime`
    *   `- TinhTrangPhong: String`
    *   `- TongChiPhiSuaChua: Decimal`
*   **Phương thức**:
    *   `+ <<static>> LayChiTietPhieu(maPhieuTra: String, maNhanVien: String): ChiTietPhieu`
        > Gọi `KiemTraTraPhongDB::LayChiTietPhieu`. Trả về object tổng hợp gồm: thông tin phiếu, khách hàng, hợp đồng/đặt cọc, phòng/giường, danh sách nghĩa vụ (`nghiaVu`), danh sách tài sản cần kiểm tra (`taiSan`).

    *   `+ <<static>> XacNhanHuyCoc(maPhieuTra: String, maNhanVien: String): Boolean`
        > **Kiểm tra ràng buộc nghiệp vụ (Business Rules)**:
        > 1. Phiếu trả phòng phải tồn tại và đang ở trạng thái `'Chờ xử lý'` (E10).
        > 2. Phiếu phải liên kết với phiếu đặt cọc (không phải hợp đồng thuê).
        >
        > Sau khi vượt qua kiểm tra, gọi `KiemTraTraPhongDB::XacNhanHuyCoc` để cập nhật `PhieuTraPhong.TrangThai = 'Chờ đối soát'` và `NgayTraThucTe = NgayDuKienTra`.

    *   `+ <<static>> LapBienBanKiemTra(maPhieuTra: String, maNhanVien: String, ngayTraThucTe: Date, tinhTrangPhong: String, dsHuHong: List<ChiTietHuHong>): Boolean`
        > **Kiểm tra ràng buộc nghiệp vụ (Business Rules)**:
        > 1. `ngayTraThucTe` và `tinhTrangPhong` không được để trống (A10).
        > 2. Phiếu trả phòng phải đang ở trạng thái `'Chờ xử lý'` — kiểm tra lại tại server (E10).
        > 3. Phiếu phải liên kết với hợp đồng thuê (`MaHopDong IS NOT NULL`).
        > 4. Hợp đồng thuê không được ở trạng thái `'Đã thanh lý'`.
        >
        > Sau khi vượt qua kiểm tra, thực hiện trong **1 transaction**:
        > - Gọi `KiemTraTraPhongDB::LapBienBanKiemTra` để tạo biên bản và cập nhật phiếu.
        > - Với mỗi item trong `dsHuHong` (chỉ những item có `mucDoHuHong != 'Bình thường'`): gọi `KiemTraTraPhongDB::ThemChiTietHuHong`.

#### Lớp: `ChiTietPhieu` (Data Transfer Object — kết quả chi tiết phiếu)
*   **Thuộc tính**:
    *   `- MaPhieuTra: String`
    *   `- TrangThai: String`
    *   `- NgayDangKyTra: Date`, `- NgayDuKienTra: Date`, `- NgayTraThucTe: Date`
    *   `- LoaiNguon: String` (`'HopDong'` | `'DatCoc'`)
    *   `- MaHopDong: String` (null nếu là đặt cọc)
    *   `- MaPhieuDatCoc: String` (null nếu là hợp đồng)
    *   `- HoTenKhach: String`, `- SdtKhach: String`, `- CccdKhach: String`, `- EmailKhach: String`
    *   `- TenPhong: String`, `- MaGiuong: String`, `- LoaiPhong: String`, `- TenChiNhanh: String`
    *   `- NgayBatDauThue: Date`, `- NgayKetThucThue: Date`, `- TrangThaiHopDong: String`
    *   `- NgayDatCoc: Date`, `- TienCocPDC: Decimal`, `- TrangThaiCoc: String`, `- TrangThaiThanhToanPDC: String`
    *   `- TinhTrangPhongThucTe: String` (null nếu biên bản chưa được lập)
    *   `- NgayLapBBKT: DateTime` (null nếu biên bản chưa được lập)
    *   `- NghiaVu: List<NghiaVuItem>` (danh sách hóa đơn nợ và vi phạm — chỉ có khi là hợp đồng)
    *   `- TaiSan: List<TaiSanItem>` (danh sách tài sản cần kiểm tra — chỉ có khi là hợp đồng)

#### Lớp: `ChiTietHuHong` (Value Object — một khoản hư hỏng/mất mát)
*   **Thuộc tính**:
    *   `- MaTaiSan: String`
    *   `- MucDoHuHong: String` (`'Hư hỏng nhẹ'` / `'Hư hỏng nặng'` / `'Mất mát'`)
    *   `- SoLuong: Int`
    *   `- TyLeHuHong: Decimal` (0.2 / 0.6 / 1.0 tương ứng mức độ)
    *   `- ChiPhi: Decimal` (= SoLuong × DonGiaBoiThuong × TyLeHuHong)
    *   `- MoTa: String`
    *   `- MaQuyDinhTruTien: String` (`'QD001'` / `'QD002'` / `'QD003'`)

---

### 1.3. Tầng Truy Cập Dữ Liệu (DB Layer / DAL)

#### Lớp: `PhieuTraPhongDB`
*   **Phương thức**:
    *   `+ <<static>> LayDanhSachChoXuLy(maNhanVien: String, trangThaiLoc: String): DataTable` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_DanhSachChoXuLy`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên quản lý (dùng để lọc theo chi nhánh) |
        | `@TrangThaiLoc` | NVARCHAR(50) | `'Chờ xử lý'` / `'Đã xử lý'` / `'Tất cả'` |

        Trả về: `maPhieuTra`, `ngayDangKyTra`, `ngayDuKienTra`, `maHopDong`, `maPhieuDatCoc`, `loaiNguon`, `maNguon`, `hoTenKhach`, `sdtKhach`, `tenPhong`, `maGiuong`, `trangThai`. Sắp xếp theo `NgayDuKienTra ASC`.

#### Lớp: `KiemTraTraPhongDB`
*   **Phương thức**:
    *   `+ <<static>> LayChiTietPhieu(maPhieuTra: String, maNhanVien: String): DataSet` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_ChiTietPhieu`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaPhieuTra` | VARCHAR(6) | Mã phiếu trả phòng cần xem chi tiết |
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên quản lý (kiểm tra quyền theo chi nhánh) |

        Trả về **3 recordset**:
        - `recordsets[0]`: Thông tin tổng hợp phiếu (1 dòng).
        - `recordsets[1]`: Danh sách nghĩa vụ (`UNION ALL` hóa đơn nợ + biên bản vi phạm) — rỗng nếu là phiếu đặt cọc.
        - `recordsets[2]`: Danh sách tài sản cần kiểm tra (JOIN với `BienBanBanGiao` bàn giao vào, `ChiTietHuHong` nếu đã lập biên bản) — rỗng nếu là phiếu đặt cọc.

        Ném `THROW 50010` nếu phiếu không tồn tại hoặc không thuộc chi nhánh của quản lý.

    *   `+ <<static>> XacNhanHuyCoc(maPhieuTra: String, maNhanVien: String): Boolean` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_XacNhanHuyCoc`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaPhieuTra` | VARCHAR(6) | Mã phiếu trả phòng (liên kết phiếu đặt cọc) |
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên quản lý |

        **Logic SP**:
        1. Kiểm tra `PhieuTraPhong.TrangThai = 'Chờ xử lý'`, ném `THROW 50010` nếu không thỏa (E10).
        2. `UPDATE PhieuTraPhong SET TrangThai = N'Chờ đối soát', NgayTraThucTe = NgayDuKienTra WHERE MaPhieuTra = @MaPhieuTra`.

    *   `+ <<static>> LapBienBanKiemTra(maPhieuTra: String, maNhanVien: String, ngayTraThucTe: Date, tinhTrangPhong: String, tongChiPhi: Decimal): String` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_LapBienBanKiemTra`, trả về `@MaBienBanKT` (OUTPUT)

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaPhieuTra` | VARCHAR(6) | Mã phiếu trả phòng |
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên quản lý lập biên bản |
        | `@NgayTraThucTe` | DATE | Ngày trả phòng thực tế |
        | `@TinhTrangPhong` | NVARCHAR(MAX) | Mô tả tình trạng phòng tổng quan |
        | `@TongChiPhi` | DECIMAL(15,2) | Tổng phí bồi thường hư hỏng (tính từ backend) |
        | `@MaBienBanKT` | VARCHAR(6) OUTPUT | Mã biên bản vừa tạo, trả về cho backend |

        **Logic SP** (trong 1 transaction):
        1. Kiểm tra `PhieuTraPhong.TrangThai = 'Chờ xử lý'` và `MaHopDong IS NOT NULL`, ném `THROW 50010` nếu vi phạm (E10).
        2. Kiểm tra hợp đồng không ở trạng thái `'Đã thanh lý'`, ném `THROW 50011` nếu vi phạm.
        3. Sinh mã `KT####` tăng dần.
        4. `INSERT INTO BienBanKiemTraPhong` với `NgayKiemTra = GETDATE()`.
        5. `UPDATE PhieuTraPhong SET TrangThai = N'Chờ đối soát', NgayTraThucTe = @NgayTraThucTe WHERE MaPhieuTra = @MaPhieuTra`.
        6. Trả `@MaBienBanKT` qua OUTPUT parameter.

    *   `+ <<static>> ThemChiTietHuHong(maBienBanKT: String, maPhieuTra: String, maTaiSan: String, moTaHuHong: String, chiPhiSuaChua: Decimal, soLuong: Int, mucDoHuHong: String, tyLeHuHong: Decimal, maQuyDinhTruTien: String): Boolean` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_ThemChiTietHuHong`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaBienBanKT` | VARCHAR(6) | Mã biên bản kiểm tra (vừa tạo ở trên) |
        | `@MaPhieuTra` | VARCHAR(6) | Dùng để tra mã phòng |
        | `@MaTaiSan` | VARCHAR(6) | Mã tài sản hư hỏng/mất mát |
        | `@MoTaHuHong` | NVARCHAR(MAX) | Mô tả chi tiết |
        | `@ChiPhiSuaChua` | DECIMAL(15,2) | Phí bồi thường đã tính |
        | `@SoLuong` | INT | Số lượng hư/mất |
        | `@MucDoHuHong` | NVARCHAR(100) | `'Hư hỏng nhẹ'` / `'Hư hỏng nặng'` / `'Mất mát'` |
        | `@TyLeHuHong` | DECIMAL(5,2) | 0.20 / 0.60 / 1.00 |
        | `@MaQuyDinhTruTien` | VARCHAR(6) | `'QD001'` / `'QD002'` / `'QD003'` |

        **Logic SP** (trong 1 transaction):
        1. Tra `@MaPhong` từ `PhieuTraPhong → HopDongThue → PhieuDatCoc → ChiTietDatCoc → Phong`.
        2. Sinh mã `HH####` tăng dần.
        3. `INSERT INTO ChiTietHuHong`.

---

## 2. Sơ đồ tuần tự (Sequence Diagram) - Luồng Kiểm tra trả phòng

```mermaid
sequenceDiagram
    autonumber
    actor QL as :NhanVienQuanLy

    %% Tầng Giao Diện (1 lifeline duy nhất)
    participant GUI as :MHKiemTraTraPhong

    %% Tầng Nghiệp Vụ (BUS)
    participant BUS_PT as :PhieuTraPhong
    participant BUS_KT as :KiemTraTraPhong
    participant hh as hh:ChiTietHuHong

    %% Tầng Dữ Liệu (DB)
    participant DB_PT as :PhieuTraPhongDB
    participant DB_KT as :KiemTraTraPhongDB

    %% Database Tables
    participant T_PT as dbo.PhieuTraPhong
    participant T_NV as dbo.NhanVien
    participant T_BBKT as dbo.BienBanKiemTraPhong
    participant T_CTHH as dbo.ChiTietHuHong

    %% ========================================================
    %% PHẦN 1: TẢI DANH SÁCH PHIẾU TRẢ PHÒNG
    %% ========================================================
    Note over QL, T_CTHH: PHẦN 1: TẢI DANH SÁCH PHIẾU TRẢ PHÒNG
    QL->>GUI: Truy cập chức năng "Kiểm tra trả phòng" (HienThi)
    activate GUI
    GUI->>BUS_PT: LayDanhSachChoXuLy(maNhanVien, 'Tất cả')
    activate BUS_PT
    BUS_PT->>DB_PT: LayDanhSachChoXuLy(maNhanVien, 'Tất cả')
    activate DB_PT
    DB_PT->>T_PT: EXEC SP_TraPhong_QuanLy_DanhSachChoXuLy @MaNhanVien, @TrangThaiLoc
    activate T_PT
    T_PT->>T_NV: Lấy @MaChiNhanh của quản lý
    activate T_NV
    T_NV-->>T_PT: @MaChiNhanh
    deactivate T_NV
    T_PT-->>DB_PT: DataTable danh sách phiếu (lọc theo chi nhánh & trạng thái)
    deactivate T_PT
    DB_PT-->>BUS_PT: DataTable
    deactivate DB_PT
    BUS_PT-->>GUI: List<PhieuTraPhong>
    deactivate BUS_PT
    GUI->>GUI: HienThi() (Render lên dgvDanhSachPhieu; hiển thị nút "Lập biên bản" hoặc "Xác nhận" tùy loaiNguon)
    deactivate GUI

    %% ========================================================
    %% PHẦN 2: LẤY CHI TIẾT PHIẾU & MỞ MODAL
    %% ========================================================
    Note over QL, T_CTHH: PHẦN 2: MỞ MODAL VÀ TẢI CHI TIẾT PHIẾU

    alt [Phiếu liên kết hợp đồng thuê → Click "Lập biên bản"]
        QL->>GUI: Click "Lập biên bản" (btnRow_Click, loaiNguon='HopDong')
    else [Phiếu liên kết phiếu đặt cọc → Click "Xác nhận"]
        QL->>GUI: Click "Xác nhận" (btnRow_Click, loaiNguon='DatCoc')
    else [Phiếu đã xử lý → Click "Xem chi tiết"]
        QL->>GUI: Click "Xem chi tiết" (btnRow_Click)
    end

    activate GUI
    GUI->>BUS_KT: LayChiTietPhieu(maPhieuTra, maNhanVien)
    activate BUS_KT
    BUS_KT->>DB_KT: LayChiTietPhieu(maPhieuTra, maNhanVien)
    activate DB_KT
    DB_KT->>T_PT: EXEC SP_TraPhong_QuanLy_ChiTietPhieu @MaPhieuTra, @MaNhanVien
    activate T_PT
    Note over T_PT: recordsets[0]: Thông tin phiếu, khách, hồ sơ, phòng<br/>recordsets[1]: Nghĩa vụ (HoaDon nợ + ViPham) — rỗng nếu PĐC<br/>recordsets[2]: Tài sản cần kiểm tra — rỗng nếu PĐC
    T_PT-->>DB_KT: DataSet (3 recordsets)
    deactivate T_PT
    DB_KT-->>BUS_KT: DataSet
    deactivate DB_KT
    BUS_KT-->>GUI: ChiTietPhieu (thongTinChung + nghiaVu[] + taiSan[])
    deactivate BUS_KT
    GUI->>GUI: HienThiChiTietModal(chiTiet) (Mở modal phù hợp, render 3 card thông tin, bảng nghĩa vụ và bảng tài sản)
    deactivate GUI

    %% ========================================================
    %% PHẦN 3A: LẬP BIÊN BẢN KIỂM TRA (Luồng Hợp đồng thuê)
    %% ========================================================
    Note over QL, T_CTHH: PHẦN 3A: LẬP BIÊN BẢN KIỂM TRA (Hợp đồng thuê)
    QL->>GUI: Nhập ngày trả thực tế, tình trạng phòng, kiểm tra tài sản & click "Xác nhận lưu biên bản" (btnXacNhanLuuBienBan_Click)
    activate GUI

    GUI->>GUI: KiemTraHopLeGiaoDien() (Validate: ngayTraThucTe & tinhTrangPhong không trống)

    alt [Hợp lệ (A10: ngược lại)]
        GUI->>BUS_KT: LapBienBanKiemTra(maPhieuTra, maNhanVien, ngayTraThucTe, tinhTrangPhong, dsHuHong)
        activate BUS_KT

        BUS_KT->>BUS_KT: Tính tongChiPhi = sum(hh.chiPhi for hh in dsHuHong)
        BUS_KT->>BUS_KT: Kiểm tra ràng buộc nghiệp vụ (BR 1-4)

        alt [Hợp lệ: Thỏa mãn tất cả ràng buộc]
            BUS_KT->>DB_KT: LapBienBanKiemTra(maPhieuTra, maNhanVien, ngayTraThucTe, tinhTrangPhong, tongChiPhi)
            activate DB_KT
            DB_KT->>T_BBKT: EXEC SP_TraPhong_QuanLy_LapBienBanKiemTra @MaPhieuTra, @MaNhanVien, @NgayTraThucTe, @TinhTrangPhong, @TongChiPhi OUTPUT @MaBienBanKT
            activate T_BBKT
            Note over T_BBKT: Kiểm tra TrangThai='Chờ xử lý' & HĐ không Đã thanh lý (E10)<br/>Sinh mã KT####<br/>INSERT BienBanKiemTraPhong<br/>UPDATE PhieuTraPhong.TrangThai = 'Chờ đối soát'<br/>OUTPUT @MaBienBanKT
            T_BBKT-->>DB_KT: @MaBienBanKT
            deactivate T_BBKT
            DB_KT-->>BUS_KT: maBienBanKT: String
            deactivate DB_KT

            loop [Với mỗi item hư hỏng trong dsHuHong (mucDoHuHong != 'Bình thường')]
                BUS_KT->>hh: ThemChiTietHuHong(maBienBanKT, maTaiSan, ...)
                activate hh
                hh->>DB_KT: ThemChiTietHuHong(maBienBanKT, maPhieuTra, maTaiSan, moTa, chiPhi, soLuong, mucDo, tyLe, maQuyDinh)
                activate DB_KT
                DB_KT->>T_CTHH: EXEC SP_TraPhong_QuanLy_ThemChiTietHuHong (các tham số)
                activate T_CTHH
                Note over T_CTHH: Tra @MaPhong từ phiếu<br/>Sinh mã HH####<br/>INSERT ChiTietHuHong
                T_CTHH-->>DB_KT: Thành công
                deactivate T_CTHH
                DB_KT-->>hh: True
                deactivate DB_KT
                hh-->>BUS_KT: True
                deactivate hh
            end

            BUS_KT-->>GUI: True (Thành công)
            deactivate BUS_KT
            GUI->>GUI: HienThiThongBaoSuccess() (Hiển thị popup "Biên bản kiểm tra đã được lưu")

        else [Không hợp lệ: Vi phạm ràng buộc nghiệp vụ (E10)]
            BUS_KT-->>GUI: Exception (THROW 50010 hoặc 50011)
            deactivate BUS_KT
            GUI-->>QL: Hiển thị thông báo lỗi ("Phiếu trả phòng đã thay đổi trạng thái...")
        end

    else [Không hợp lệ (A10): Thiếu thông tin bắt buộc]
        GUI-->>QL: Hiển thị toast lỗi validate
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 3B: XÁC NHẬN HỒ SƠ ĐẶT CỌC (Biến thể A3)
    %% ========================================================
    Note over QL, T_CTHH: PHẦN 3B: XÁC NHẬN HỒ SƠ ĐẶT CỌC (Biến thể A3)
    QL->>GUI: Kiểm tra thông tin hồ sơ & click "Xác nhận hồ sơ" (btnXacNhanHoSo_Click)
    activate GUI
    GUI->>BUS_KT: XacNhanHuyCoc(maPhieuTra, maNhanVien)
    activate BUS_KT
    BUS_KT->>BUS_KT: Kiểm tra ràng buộc nghiệp vụ (BR 1-2)

    alt [Hợp lệ]
        BUS_KT->>DB_KT: XacNhanHuyCoc(maPhieuTra, maNhanVien)
        activate DB_KT
        DB_KT->>T_PT: EXEC SP_TraPhong_QuanLy_XacNhanHuyCoc @MaPhieuTra, @MaNhanVien
        activate T_PT
        Note over T_PT: Kiểm tra TrangThai='Chờ xử lý' (E10)<br/>UPDATE PhieuTraPhong<br/>TrangThai = 'Chờ đối soát'<br/>NgayTraThucTe = NgayDuKienTra
        T_PT-->>DB_KT: Thành công
        deactivate T_PT
        DB_KT-->>BUS_KT: True
        deactivate DB_KT
        BUS_KT-->>GUI: True (Thành công)
        deactivate BUS_KT
        GUI->>GUI: HienThiThongBaoSuccess() (Hiển thị popup "Hồ sơ đặt cọc đã được xác nhận")
    else [Không hợp lệ (E10): Phiếu đã thay đổi trạng thái]
        BUS_KT-->>GUI: Exception (THROW 50010)
        deactivate BUS_KT
        GUI-->>QL: Hiển thị thông báo lỗi
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 4: ĐÓNG POPUP THÀNH CÔNG VÀ LÀM MỚI DANH SÁCH
    %% ========================================================
    Note over QL, T_CTHH: PHẦN 4: ĐÓNG POPUP VÀ CẬP NHẬT DANH SÁCH
    QL->>GUI: Click nút "Đóng" trên popup thành công (btnSuccessDong_Click)
    activate GUI
    GUI->>GUI: Đóng popup thành công & đóng modal chính
    GUI->>BUS_PT: LayDanhSachChoXuLy(maNhanVien, 'Tất cả')
    activate BUS_PT
    Note over BUS_PT, T_PT: (Luồng giống Phần 1 — tải lại danh sách để cập nhật trạng thái mới nhất)
    BUS_PT-->>GUI: List<PhieuTraPhong> (đã cập nhật)
    deactivate BUS_PT
    GUI->>GUI: HienThi() (Re-render dgvDanhSachPhieu)
    deactivate GUI
```
