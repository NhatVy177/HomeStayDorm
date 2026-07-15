# Thiết kế chi tiết 3 lớp (3-Layer) & Sơ đồ tuần tự - Use Case: Đăng ký lịch trả phòng

Tài liệu này đặc tả cấu trúc thiết kế 3 lớp (Giao diện, Nghiệp vụ, Truy cập dữ liệu) và Sơ đồ tuần tự chi tiết cho chức năng **Đăng ký lịch trả phòng** dành cho tác nhân **Nhân viên Sale** của hệ thống HomeStayDorm. Toàn bộ giao diện wizard 4 bước (tra cứu khách hàng, chọn hồ sơ, xác nhận đăng ký, hiển thị kết quả) đều được gộp chung vào lớp Giao diện `MHDangKyLichTraPhong` để khớp 100% với thực tế lập trình.

---

## 1. Thiết kế các Lớp chi tiết (Class Design)

### 1.1. Tầng Giao Diện (GUI Layer)
Lớp đại diện cho màn hình thực hiện chức năng theo dạng wizard 4 bước, chứa tất cả các control giao diện (bảng tìm kiếm, danh sách card hợp đồng, form xác nhận và màn hình kết quả).

*   **Tên lớp**: `MHDangKyLichTraPhong`
*   **Thuộc tính (UI Controls)**:
    *   **Thanh tiến trình Wizard (dùng chung)**:
        *   `- lblBuoc1: Label` (Nhãn "Tra cứu khách")
        *   `- lblBuoc2: Label` (Nhãn "Chọn hồ sơ")
        *   `- lblBuoc3: Label` (Nhãn "Xác nhận")
        *   `- lblBuoc4: Label` (Nhãn "Hoàn tất")
    *   **Bước 1 – Tra cứu khách hàng**:
        *   `- txtTuKhoa: TextBox` (Tìm theo tên, số điện thoại hoặc CCCD)
        *   `- btnTimKiem: Button` (Nút bấm thực hiện tìm kiếm)
        *   `- dgvDanhSachKhachHang: GridView` (Lưới hiển thị kết quả tra cứu: mã KH, họ tên, giới tính, ngày sinh, SĐT, CCCD)
        *   `- btnRowChon: Button` (Nút "Chọn" trên mỗi dòng khách hàng)
    *   **Bước 2 – Chọn hồ sơ (Hợp đồng / Đặt cọc)**:
        *   `- lblThongTinKhach: Label` (Hiển thị tóm tắt thông tin khách đã chọn: họ tên, SĐT/CCCD)
        *   `- btnDoiKhach: Button` (Nút "Đổi khách" để quay lại Bước 1)
        *   `- cardDanhSachHoSo: CardList` (Danh sách card hiển thị các hợp đồng thuê và phiếu đặt cọc hợp lệ; mỗi card hiển thị: loại badge HĐ/ĐC, mã hồ sơ, tên chi nhánh, tên phòng, hình thức thuê, thời hạn, cảnh báo đang xử lý)
        *   `- lblDangCoYeuCau: Label` (Badge cảnh báo "Đang có yêu cầu xử lý" trên card bị vô hiệu hóa)
        *   `- btnQuayLaiB1: Button` (Nút "Quay lại" về Bước 1)
        *   `- btnTiepTheo: Button` (Nút "Tiếp theo", chỉ kích hoạt khi đã chọn 1 hồ sơ)
    *   **Bước 3 – Xác nhận đăng ký**:
        *   `- pnlThongTinKhach: Panel` (Card hiển thị: Mã KH, Họ tên, SĐT, CCCD)
        *   `- pnlThongTinHoSo: Panel` (Card hiển thị: Mã HĐ/PĐC, Thời hạn/Ngày đặt cọc, Tiền cọc, Trạng thái)
        *   `- pnlThongTinPhong: Panel` (Card hiển thị: Chi nhánh, Phòng, Giường, Giá thuê)
        *   `- dtpNgayDuKienTra: DatePicker` (Chọn ngày dự kiến trả phòng; mặc định là ngày hiện tại, không cho chọn ngày quá khứ)
        *   `- btnQuayLaiB2: Button` (Nút "Quay lại" về Bước 2)
        *   `- btnXacNhanDangKy: Button` (Nút "Xác nhận đăng ký")
        *   `- lblLoi: Label` (Hiển thị thông báo lỗi validate phía client)
    *   **Bước 4 – Kết quả thành công**:
        *   `- lblThanhCong: Label` (Tiêu đề "Đăng ký lịch trả phòng thành công!")
        *   `- pnlKetQuaKhach: Panel` (Card hiển thị lại thông tin khách hàng)
        *   `- pnlKetQuaHoSo: Panel` (Card hiển thị loại hồ sơ, mã hồ sơ, chi nhánh, phòng/giường)
        *   `- pnlKetQuaPhieu: Panel` (Card hiển thị mã phiếu, ngày đăng ký, ngày dự kiến trả, trạng thái "Chờ xử lý")
        *   `- btnDangKyMoi: Button` (Nút "Đăng ký lịch trả phòng mới" để bắt đầu luồng mới)

*   **Phương thức (Events & Helpers)**:
    *   `+ HienThi(): void` (Nạp màn hình ban đầu, hiển thị Bước 1)
    *   `+ btnTimKiem_Click(tuKhoa: String): void` (Gọi `KhachHang::TimKhachHangTraPhong`, hiển thị kết quả lên `dgvDanhSachKhachHang`)
    *   `+ btnRowChon_Click(maKhachHang: String): void` (Lưu khách đã chọn, chuyển sang Bước 2, gọi `PhieuTraPhong::LayDanhSachHoSoHopLe`)
    *   `+ HienThiDanhSachHoSo(danhSach: List<HoSoHopLe>): void` (Render card list lên Bước 2, vô hiệu hóa card có cờ `dangCoYeuCau = true`)
    *   `+ btnTiepTheo_Click(hoSo: HoSoHopLe): void` (Lưu hồ sơ đã chọn, chuyển sang Bước 3)
    *   `+ HienThiXacNhan(khach: KhachHang, hoSo: HoSoHopLe): void` (Render 3 card thông tin tóm tắt ở Bước 3, đặt giá trị mặc định `dtpNgayDuKienTra` = hôm nay)
    *   `+ KiemTraNgayHopLe(ngay: Date): Boolean` (Validate client-side: ngày không được nhỏ hơn hôm nay)
    *   `+ btnXacNhanDangKy_Click(): void` (Kiểm tra ràng buộc giao diện rồi gọi `PhieuTraPhong::DangKyLichTraPhong`)
    *   `+ HienThiKetQua(phieu: PhieuTraPhong): void` (Chuyển sang Bước 4, render thông tin phiếu vừa tạo)
    *   `+ btnDangKyMoi_Click(): void` (Reset wizard về Bước 1)

---

### 1.2. Tầng Nghiệp Vụ (BUS Layer)

#### Lớp: `KhachHang` (Thực thể Khách hàng)
*   **Thuộc tính**:
    *   `- MaKhachHang: String`
    *   `- HoTen: String`
    *   `- SDT: String`
    *   `- Email: String`
    *   `- CCCD: String`
    *   `- QuocTich: String`
    *   `- GioiTinh: String`
    *   `- NgaySinh: Date`
*   **Phương thức**:
    *   `+ <<static>> TimKhachHangTraPhong(tuKhoa: String): List<KhachHang>`
        > Gọi `KhachHangDB::TimKiemTheoTuKhoa`. Trả về tối đa 50 khách hàng khớp với từ khóa (tên, SĐT hoặc CCCD).

#### Lớp: `HopDongThue` (Thực thể Hợp đồng thuê)
*   **Thuộc tính**:
    *   `- MaHopDong: String`
    *   `- MaKhachHang: String`
    *   `- NgayBatDau: Date`
    *   `- NgayKetThuc: Date`
    *   `- GiaThue: Decimal`
    *   `- HinhThucThue: String`
    *   `- TrangThai: String`

#### Lớp: `PhieuDatCoc` (Thực thể Phiếu đặt cọc)
*   **Thuộc tính**:
    *   `- MaPhieuDatCoc: String`
    *   `- MaKhachHang: String`
    *   `- NgayDatCoc: Date`
    *   `- TienCoc: Decimal`
    *   `- TrangThaiCoc: String`
    *   `- TrangThaiThanhToan: String`

#### Lớp: `PhieuTraPhong` (Thực thể Phiếu trả phòng)
*   **Thuộc tính**:
    *   `- MaPhieuTra: String`
    *   `- NgayDangKyTra: Date` (Hệ thống tự ghi nhận = ngày hiện tại)
    *   `- NgayDuKienTra: Date`
    *   `- NgayTraThucTe: Date`
    *   `- TrangThai: String` ("Chờ xử lý" / "Hủy" / "Hoàn tất" / ...)
    *   `- MaHopDong: String` (null nếu đăng ký theo phiếu đặt cọc)
    *   `- MaPhieuDatCoc: String` (null nếu đăng ký theo hợp đồng thuê)
*   **Phương thức**:
    *   `+ <<static>> LayDanhSachHoSoHopLe(maKhachHang: String, maNhanVien: String): List<HoSoHopLe>`
        > Gọi `PhieuTraPhongDB::LayDanhSachHoSoHopLe`. Trả về danh sách hợp đồng thuê và phiếu đặt cọc còn hiệu lực của khách thuộc chi nhánh của nhân viên, kèm cờ `dangCoYeuCau`.
    *   `+ <<static>> DangKyLichTraPhong(maKhachHang: String, maHopDong: String, maPhieuDatCoc: String, ngayDuKienTra: Date, maNhanVienSale: String): PhieuTraPhong`
        > **Kiểm tra ràng buộc nghiệp vụ (Business Rules)**:
        > 1. Mã khách hàng, mã hồ sơ (HĐ hoặc PĐC), ngày dự kiến trả phòng và mã nhân viên sale không được để trống.
        > 2. Chỉ được truyền một trong hai: `maHopDong` hoặc `maPhieuDatCoc` (không được truyền cả hai hoặc cả hai đều null).
        > 3. Khách hàng phải tồn tại trong hệ thống.
        > 4. Ngày dự kiến trả phòng phải >= ngày hiện tại.
        > 5. Nếu đăng ký theo hợp đồng thuê: HĐ phải đang ở trạng thái `'Hiệu lực'` hoặc `'Hết hạn'`, thuộc về khách hàng này, và chưa có phiếu trả phòng nào đang ở trạng thái `'Chờ xử lý'`.
        > 6. Nếu đăng ký theo phiếu đặt cọc: PĐC phải có `TrangThaiCoc = 'Hiệu lực'`, `TrangThaiThanhToan = 'Đã TT'`, chưa được chuyển thành hợp đồng thuê, và chưa có phiếu trả phòng nào đang ở trạng thái `'Chờ xử lý'`.

        > Sau khi vượt qua kiểm tra, gọi `PhieuTraPhongDB::TaoPhieuTraPhong` để tạo bản ghi mới.

#### Lớp: `HoSoHopLe` (Data Transfer Object - kết quả tra cứu hồ sơ)
*   **Thuộc tính**:
    *   `- MaHoSo: String` (Mã HĐ nếu là hợp đồng, hoặc Mã PĐC nếu là phiếu đặt cọc)
    *   `- MaHopDong: String` (null nếu hồ sơ là phiếu đặt cọc)
    *   `- MaPhieuDatCoc: String` (null nếu hồ sơ là hợp đồng thuê)
    *   `- Loai: String` (`"HopDong"` | `"DatCoc"`)
    *   `- TenPhong: String`
    *   `- TenChiNhanh: String`
    *   `- HinhThucThue: String`
    *   `- GiaThu: Decimal`
    *   `- NgayBatDau: Date`
    *   `- NgayKetThuc: Date` (null nếu là phiếu đặt cọc)
    *   `- TrangThai: String`
    *   `- TienCoc: Decimal` (null nếu là hợp đồng thuê)
    *   `- DangCoYeuCau: Boolean` (True nếu đang có phiếu trả phòng chưa hoàn tất)

---

### 1.3. Tầng Truy Cập Dữ Liệu (DB Layer / DAL)

#### Lớp: `KhachHangDB`
*   **Phương thức**:
    *   `+ <<static>> TimKiemTheoTuKhoa(tuKhoa: String): DataTable` ➔ Gọi stored procedure `dbo.SP_TraPhong_Sale_TimKhachHang`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@TuKhoa` | NVARCHAR(100) | Từ khóa tra cứu (tên, SĐT, CCCD) |

        Trả về: `maKhachHang`, `hoTen`, `sdt`, `email`, `cccd`, `quocTich`, `gioiTinh`, `ngaySinh` (TOP 50, sắp xếp theo tên).

#### Lớp: `HopDongThueDB`
*   Đại diện cho các thao tác truy xuất dữ liệu trên bảng `HopDongThue`.
*   Trong Use-Case này, lớp tham gia vào việc cung cấp dữ liệu hợp đồng thuê (thông qua JOIN/UNION trong Stored Procedure chung) để tổng hợp danh sách hồ sơ hợp lệ.

#### Lớp: `PhieuDatCocDB`
*   Đại diện cho các thao tác truy xuất dữ liệu trên bảng `PhieuDatCoc`.
*   Tham gia cung cấp dữ liệu phiếu đặt cọc chưa lập hợp đồng để tổng hợp lên danh sách hồ sơ hợp lệ ở Bước 2.

#### Lớp: `PhieuTraPhongDB`
*   **Phương thức**:
    *   `+ <<static>> LayDanhSachHoSoHopLe(maKhachHang: String, maNhanVien: String): DataTable` ➔ Gọi stored procedure `dbo.SP_TraPhong_Sale_DanhSachHopDong`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaKhachHang` | VARCHAR(6) | Mã khách hàng cần tra cứu |
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên sale (dùng để lọc theo chi nhánh) |

        Trả về: UNION ALL của 2 tập kết quả — (1) Hợp đồng thuê `TrangThai IN ('Hiệu lực', 'Hết hạn')` và (2) Phiếu đặt cọc `TrangThaiCoc = 'Hiệu lực'`, `TrangThaiThanhToan = 'Đã TT'`, chưa lập hợp đồng. Mỗi dòng kèm cờ `dangCoYeuCau` (BIT).

    *   `+ <<static>> TaoPhieuTraPhong(maKhachHang: String, maHopDong: String, maPhieuDatCoc: String, ngayDuKienTra: Date, maNhanVienSale: String): DataTable` ➔ Gọi stored procedure `dbo.SP_TraPhong_Sale_DangKyLichTraPhong`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaKhachHang` | VARCHAR(6) | Mã khách hàng |
        | `@MaHopDong` | VARCHAR(6) | Mã hợp đồng thuê (NULL nếu dùng PĐC) |
        | `@MaPhieuDatCoc` | VARCHAR(6) | Mã phiếu đặt cọc (NULL nếu dùng HĐ) |
        | `@NgayDuKienTra` | DATE | Ngày dự kiến trả phòng |
        | `@MaNhanVienSale` | VARCHAR(6) | Mã nhân viên sale tạo phiếu (ghi nhận người đăng ký) |

        **Logic SP**:
        1. Validate toàn bộ ràng buộc nghiệp vụ (xem mục 1.2 lớp `PhieuTraPhong`), ném `THROW 50011` nếu vi phạm.
        2. Tự động sinh mã phiếu theo format `TP####` tăng dần (dùng `UPDLOCK, HOLDLOCK` chống race condition).
        3. INSERT vào `dbo.PhieuTraPhong` với `NgayDangKyTra = CAST(GETDATE() AS DATE)`, `TrangThai = N'Chờ xử lý'`, `NgayTraThucTe = NULL`, `MaNhanVienSale = @MaNhanVienSale`.
        4. Trả về bản ghi vừa tạo: `maPhieuTra`, `ngayDangKyTra`, `ngayDuKienTra`, `trangThai`, `maHopDong`, `maPhieuDatCoc`, `hoTenKhach`, `sdtKhach`, `maNhanVienSale`.

---

## 2. Sơ đồ tuần tự (Sequence Diagram) - Luồng Đăng ký lịch trả phòng

```mermaid
sequenceDiagram
    autonumber
    actor NV as :NhanVienSale

    %% Tầng Giao Diện (1 lifeline duy nhất)
    participant GUI as :MHDangKyLichTraPhong

    %% Tầng Nghiệp Vụ (BUS)
    participant BUS_KH as :KhachHang
    participant BUS_PT as :PhieuTraPhong

    %% Tầng Dữ Liệu (DB)
    participant DB_KH as :KhachHangDB
    participant DB_PT as :PhieuTraPhongDB

    %% Database Tables
    participant T_KH as dbo.KhachHang
    participant T_ND as dbo.NguoiDung
    participant T_HD as dbo.HopDongThue
    participant T_PDC as dbo.PhieuDatCoc
    participant T_PT as dbo.PhieuTraPhong

    %% ========================================================
    %% PHẦN 1: TRA CỨU KHÁCH HÀNG (BƯỚC 1)
    %% ========================================================
    Note over NV, T_PT: PHẦN 1: TRA CỨU KHÁCH HÀNG
    NV->>GUI: Nhập từ khóa & click Tìm kiếm (btnTimKiem_Click)
    activate GUI
    GUI->>BUS_KH: TimKhachHangTraPhong(tuKhoa)
    activate BUS_KH
    BUS_KH->>DB_KH: TimKiemTheoTuKhoa(tuKhoa)
    activate DB_KH
    DB_KH->>T_KH: EXEC SP_TraPhong_Sale_TimKhachHang @TuKhoa
    activate T_KH
    T_KH->>T_ND: JOIN NguoiDung ON MaNguoiDung = MaKhachHang
    activate T_ND
    T_ND-->>T_KH: DataTable khách hàng (TOP 50)
    deactivate T_ND
    T_KH-->>DB_KH: DataTable kết quả
    deactivate T_KH
    DB_KH-->>BUS_KH: DataTable
    deactivate DB_KH
    BUS_KH-->>GUI: List<KhachHang>
    deactivate BUS_KH

    alt [Tìm thấy khách hàng phù hợp (A3: ngược lại)]
        GUI->>GUI: HienThi() (Render kết quả lên dgvDanhSachKhachHang)
        NV->>GUI: Click nút "Chọn" tại dòng khách hàng (btnRowChon_Click)
    else [Không tìm thấy khách hàng]
        GUI-->>NV: Hiển thị thông báo "Không tìm thấy khách hàng phù hợp"
        Note over NV, GUI: Quay lại nhập từ khóa mới
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 2: LẤY DANH SÁCH HỒ SƠ HỢP LỆ (BƯỚC 2)
    %% ========================================================
    Note over NV, T_PT: PHẦN 2: HIỂN THỊ HỒ SƠ HỢP LỆ CỦA KHÁCH
    activate GUI
    GUI->>BUS_PT: LayDanhSachHoSoHopLe(maKhachHang, maNhanVienSale)
    activate BUS_PT
    BUS_PT->>DB_PT: LayDanhSachHoSoHopLe(maKhachHang, maNhanVien)
    activate DB_PT
    DB_PT->>T_HD: EXEC SP_TraPhong_Sale_DanhSachHopDong @MaKhachHang, @MaNhanVien
    activate T_HD
    T_HD->>T_PDC: JOIN PhieuDatCoc, ChiTietDatCoc, Phong, ChiNhanh
    activate T_PDC
    T_PDC-->>T_HD: UNION: HĐ thuê (Hiệu lực/Hết hạn) + PĐC (Hiệu lực, Đã TT, chưa lập HĐ)
    deactivate T_PDC
    T_HD-->>DB_PT: DataTable kèm cờ dangCoYeuCau
    deactivate T_HD
    DB_PT-->>BUS_PT: DataTable
    deactivate DB_PT
    BUS_PT-->>GUI: List<HoSoHopLe>
    deactivate BUS_PT

    alt [Có ít nhất 1 hồ sơ hợp lệ (A5: ngược lại)]
        GUI->>GUI: HienThiDanhSachHoSo() (Render card list; vô hiệu hóa card có dangCoYeuCau = true)
        Note over GUI: [A5.1] Card có yêu cầu đang xử lý: hiển thị badge cảnh báo, disabled
        NV->>GUI: Chọn 1 hồ sơ hợp lệ & click Tiếp theo (btnTiepTheo_Click)
        GUI->>GUI: HienThiXacNhan(khach, hoSo) (Chuyển sang Bước 3, set dtpNgayDuKienTra = hôm nay)
    else [Không có hồ sơ nào hợp lệ]
        GUI-->>NV: Hiển thị thông báo "Khách hàng không có hợp đồng thuê hoặc phiếu đặt cọc hợp lệ"
        Note over NV, GUI: Kết thúc Use-Case
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 3: XÁC NHẬN VÀ TẠO PHIẾU TRẢ PHÒNG (BƯỚC 3)
    %% ========================================================
    Note over NV, T_PT: PHẦN 3: XÁC NHẬN VÀ TẠO PHIẾU TRẢ PHÒNG
    NV->>GUI: Nhập ngày dự kiến trả phòng & click "Xác nhận đăng ký" (btnXacNhanDangKy_Click)
    activate GUI

    GUI->>GUI: KiemTraNgayHopLe(ngayDuKienTra) (Validate client: ngày >= hôm nay)

    alt [Ngày hợp lệ (A10: ngược lại)]
        GUI->>BUS_PT: DangKyLichTraPhong(maKhachHang, maHopDong, maPhieuDatCoc, ngayDuKienTra, maNhanVienSale)
        activate BUS_PT

        BUS_PT->>BUS_PT: Kiểm tra ràng buộc nghiệp vụ (BR 1-6)

        alt [Hợp lệ: Thỏa mãn tất cả ràng buộc]
            BUS_PT->>DB_PT: TaoPhieuTraPhong(maKhachHang, maHopDong, maPhieuDatCoc, ngayDuKienTra, maNhanVienSale)
            activate DB_PT
            DB_PT->>T_PT: EXEC SP_TraPhong_Sale_DangKyLichTraPhong @MaKhachHang, @MaHopDong, @MaPhieuDatCoc, @NgayDuKienTra, @MaNhanVienSale
            activate T_PT
            Note over T_PT: Sinh mã TP#### (UPDLOCK)<br/>INSERT PhieuTraPhong<br/>NgayDangKyTra = GETDATE()<br/>TrangThai = N'Chờ xử lý'<br/>MaNhanVienSale = @MaNhanVienSale<br/>NgayTraThucTe = NULL
            T_PT-->>DB_PT: DataTable phiếu vừa tạo (maPhieuTra, ngayDangKyTra, ngayDuKienTra, trangThai, ...)
            deactivate T_PT
            DB_PT-->>BUS_PT: DataTable
            deactivate DB_PT
            BUS_PT-->>GUI: PhieuTraPhong (Thành công)
            deactivate BUS_PT
            GUI->>GUI: HienThiKetQua(phieu) (Chuyển sang Bước 4, hiển thị thông tin phiếu vừa tạo)
        else [Không hợp lệ: Vi phạm ràng buộc nghiệp vụ]
            BUS_PT-->>GUI: Exception / Thông báo lỗi
            deactivate BUS_PT
            GUI-->>NV: Hiển thị thông báo lỗi (lblLoi)
            Note over NV, GUI: Quay lại nhập ngày dự kiến trả phòng
        end
    else [Ngày không hợp lệ (A10)]
        GUI-->>NV: Hiển thị lỗi "Ngày dự kiến trả phòng không hợp lệ (phải từ hôm nay trở đi)"
        Note over NV, GUI: Quay lại nhập ngày dự kiến trả phòng
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 4: HOÀN TẤT VÀ ĐẶT LẠI (BƯỚC 4)
    %% ========================================================
    Note over NV, T_PT: PHẦN 4: HIỂN THỊ KẾT QUẢ VÀ TÙY CHỌN TIẾP THEO
    NV->>GUI: Click nút "Đăng ký lịch trả phòng mới" (btnDangKyMoi_Click)
    activate GUI
    GUI->>GUI: HienThi() (Reset wizard về Bước 1, xóa trạng thái khách/hồ sơ/phiếu)
    deactivate GUI
```
