# Thiết kế chi tiết 3 lớp (3-Layer) & Sơ đồ tuần tự - Use Case: Xử lý phản hồi đối soát

Tài liệu này đặc tả cấu trúc thiết kế 3 lớp (Giao diện, Nghiệp vụ, Truy cập dữ liệu) và Sơ đồ tuần tự chi tiết cho chức năng **Xử lý phản hồi đối soát** dành cho tác nhân **Nhân viên Quản lý** của hệ thống HomeStayDorm. Toàn bộ giao diện chính và các modal popup (chi tiết phản hồi + kết quả đối soát, popup thành công) đều được gộp chung vào lớp Giao diện `MHXuLyPhanHoi` để khớp 100% với thực tế lập trình.

---

## 1. Thiết kế các Lớp chi tiết (Class Design)

### 1.1. Tầng Giao Diện (GUI Layer)
Lớp đại diện cho màn hình thực hiện chức năng, chứa bảng danh sách phiếu đối soát chờ phản hồi và modal xử lý hai chiều (xác nhận điều chỉnh / giữ nguyên đối soát).

*   **Tên lớp**: `MHXuLyPhanHoi`
*   **Thuộc tính (UI Controls)**:
    *   **Phần danh sách và bộ lọc (Trang chính)**:
        *   `- txtTimKiem: TextBox` (Tìm theo tên khách hàng, mã đối soát, mã phiếu trả phòng, mã hồ sơ)
        *   `- btnFilterTatCa: Button`, `- btnFilterChoPhanHoi: Button`, `- btnFilterDaPhanHoi: Button` (Chip lọc trạng thái phiếu đối soát)
        *   `- dgvDanhSachDoiSoat: GridView` (Lưới hiển thị: mã đối soát, khách hàng, hồ sơ, phòng/giường, ngày lập, trạng thái, thao tác)
        *   `- btnRowXuLy: Button` (Nút "Xử lý" — khi `trangThaiDoiSoat = 'Chờ phản hồi'`)
        *   `- btnRowXemChiTiet: Button` (Nút "Xem chi tiết" — khi đã xử lý xong)
    *   **Modal Xử lý phản hồi** (hiện khi click bất kỳ dòng nào):
        *   `- lblModalTitle: Label` (Tiêu đề "Xử lý phản hồi đối soát")
        *   `- lblMaDoiSoat: Label` + `- badgeTrangThaiDoiSoat: Badge` (Hiển thị trên header modal)
        *   `- btnDongModal: Button` (Nút X đóng modal)
        *   **Lưới 2 cột (xph-modal-grid)**:
            *   **Cột trái — Thông tin và phản hồi**:
                *   **Card Khách hàng**: `- lblHoTen: Label`, `- lblSdt: Label`, `- lblEmail: Label`, `- lblCccd: Label`
                *   **Card Hợp đồng / Đặt cọc** (hiển thị tương ứng theo `maHopDong`):
                    *   Nếu HĐ: `- lblMaHopDong`, `- lblTienCocBanDau`, `- lblPhongGiuong`, `- lblThoiHanHD`, `- lblKyThanhToan`, `- lblNgayTraThucTe`
                    *   Nếu PĐC: `- lblMaPhieuDatCoc`, `- lblNgayDatCoc`, `- lblSoTienCoc`, `- lblTrangThaiThanhToan`, `- lblPhongGiuongDatCoc`, `- lblNgayYeuCauHuyCoc`
                *   **Card Yêu cầu điều chỉnh của khách** (nền vàng-cam):
                    *   `- txtGhiChuPhanHoiKhach: Label` (Hiển thị nội dung phản hồi của khách, read-only)
                *   **Bảng Chi tiết các khoản khấu trừ** (chỉ hiện khi là HĐ thuê):
                    *   `- dgvFinanceGroups: AccordionList` (Danh sách 6 nhóm khấu trừ có thể mở/đóng: Tiền thuê nợ, Tiền điện, Tiền nước, Tiền dịch vụ, Chi phí sửa chữa, Tiền phạt)
                    *   Mỗi `FinanceGroup` hiển thị: tiêu đề nhóm, tổng tiền nhóm, nút "Xem chi tiết / Ẩn chi tiết", danh sách các dòng chi tiết khi mở
            *   **Cột phải — Tóm tắt đối soát (sticky panel)**:
                *   `- lblTienCocBanDau: Label`
                *   `- lblSoThangLuuTru: Label` (chỉ hiện khi là HĐ)
                *   `- lblTyLeHoanCoc: Label`
                *   `- lblTienCocDuocHoan: Label`
                *   `- lblTongKhauTru: Label` (màu đỏ, bold)
                *   `- lblSoTienHoanThucTe: Label` (màu xanh lá, bold)
                *   `- lblSoTienKhachPhaiTT: Label` (màu đỏ, bold)
                *   `- pnlKetQua: Panel` (Card tóm tắt kết quả: "Khách được hoàn cọc" / "Khách phải thanh toán thêm" / "Không phát sinh thanh toán" — màu sắc tương ứng)
        *   **Footer modal**:
            *   `- lblTrangThaiNote: Label` (Hiển thị ghi chú nếu phiếu không còn "Chờ phản hồi")
            *   `- btnDong: Button` (Nút "Đóng")
            *   `- btnXacNhanDieuChinh: Button` (Nút "Xác nhận điều chỉnh" — disabled khi `!canAct || submitting`)
            *   `- btnGiuNguyen: Button` (Nút "Giữ nguyên đối soát" — disabled khi `!canAct || submitting`)
    *   **Popup Thành công**:
        *   `- lblSuccessTitle: Label` ("Xử lý thành công!")
        *   `- lblSuccessMessage: Label` ("Đã chuyển phiếu đối soát để nhân viên kế toán điều chỉnh lại." hoặc "Đã ghi nhận giữ nguyên kết quả đối soát.")
        *   `- btnSuccessDong: Button`
    *   **Toast thông báo lỗi**: `- toastError: Toast` (Hiển thị lỗi từ server hoặc lỗi validate)

*   **Phương thức (Events & Helpers)**:
    *   `+ HienThi(): void` (Gọi `PhanHoiDoiSoat::LayDanhSachChoXuLyPhanHoi`, lọc client lấy `trangThaiDoiSoat = 'Chờ phản hồi'`, render lên `dgvDanhSachDoiSoat`)
    *   `+ btnFilter_Click(filterStatus: String): void` (Lọc client-side theo "Tất cả" / "Chờ phản hồi" / "Đã phản hồi")
    *   `+ txtTimKiem_Change(tuKhoa: String): void` (Lọc client-side theo tên khách / mã đối soát / mã phiếu / mã hồ sơ)
    *   `+ btnRow_Click(doiSoat: DoiSoat): void` (Mở modal, gọi `PhanHoiDoiSoat::LayChiTietPhanHoi`, xác định `canAct = trangThaiDoiSoat === 'Chờ phản hồi'`)
    *   `+ HienThiChiTietModal(chiTiet: ChiTietPhanHoi, dsPhong: List, chiTietKhauTru: KhauTruData): void` (Render toàn bộ nội dung modal; tính `financeGroups` từ `buildFinanceGroups`; vô hiệu hóa 2 nút hành động nếu `!canAct`)
    *   `+ buildFinanceGroups(chiTiet, chiTietKhauTru): List<FinanceGroup>` (Helper client-side — tổng hợp 6 nhóm khấu trừ từ `hoaDonConNo`, `chiTietHoaDon`, `chiTietHuHong`, `bienBanViPham`)
    *   `+ btnXacNhanDieuChinh_Click(): void` (Gọi `PhanHoiDoiSoat::XuLyPhanHoi` với `hanhDong = 'XacNhanDieuChinh'`)
    *   `+ btnGiuNguyen_Click(): void` (Gọi `PhanHoiDoiSoat::XuLyPhanHoi` với `hanhDong = 'GiuNguyen'`)
    *   `+ HienThiThongBaoSuccess(hanhDong: String): void` (Mở popup thành công với thông điệp tương ứng)
    *   `+ btnSuccessDong_Click(): void` (Đóng popup, đóng modal, reload danh sách)

---

### 1.2. Tầng Nghiệp Vụ (BUS Layer)

#### Lớp: `PhanHoiDoiSoat` (Thực thể nghiệp vụ xử lý phản hồi đối soát)
*   **Thuộc tính**:
    *   `- MaDoiSoat: String`
    *   `- MaPhieuTra: String`
    *   `- NgayLap: Date`
    *   `- TrangThai: String` (`'Chờ phản hồi'` / `'Cần điều chỉnh'` / `'Chờ hoàn cọc'` / `'Chờ thanh toán thêm'` / `'Đã quyết toán'`)
    *   `- GhiChuPhanHoiKhach: String`
    *   `- TienCocBanDau: Decimal`
    *   `- TyLeHoanCocHienTai: Decimal`
    *   `- TienCocDuocHoan: Decimal`
    *   `- TienThueConNo: Decimal`
    *   `- TienDichVuConNo: Decimal`
    *   `- TongChiPhiSuaChua: Decimal`
    *   `- TienPhat: Decimal`
    *   `- TongKhauTru: Decimal`
    *   `- SoTienHoanThucTe: Decimal`
    *   `- SoTienKhachPhaiTT: Decimal`
*   **Phương thức**:
    *   `+ <<static>> LayDanhSachChoXuLyPhanHoi(maNhanVien: String): List<DoiSoatSummary>`
        > Gọi `PhanHoiDoiSoatDB::LayDanhSachChoXuLyPhanHoi`. Trả về danh sách phiếu đối soát thuộc chi nhánh của nhân viên quản lý, gồm các trạng thái: `'Chờ phản hồi'`, `'Cần điều chỉnh'`, `'Chờ hoàn cọc'`, `'Chờ thanh toán thêm'`, `'Đã quyết toán'`. Sắp xếp theo `NgayLap DESC`.

    *   `+ <<static>> LayChiTietPhanHoi(maDoiSoat: String, maNhanVien: String): ChiTietPhanHoiResult`
        > Gọi `PhanHoiDoiSoatDB::LayChiTietPhanHoi` lấy 3 recordset, sau đó gọi thêm `KhauTruDoiSoatRepository::LayChiTietKhauTru` để lấy chi tiết hóa đơn, hư hỏng, vi phạm phục vụ hiển thị. Trả về object: `{ chiTiet, danhSachPhong, chiTietKhauTru }`.

    *   `+ <<static>> XuLyPhanHoi(maDoiSoat: String, hanhDong: String, maNhanVien: String): KetQuaXuLy`
        > **Kiểm tra ràng buộc nghiệp vụ (Business Rules)**:
        > 1. `maDoiSoat` và `hanhDong` không được để trống.
        > 2. `hanhDong` phải là `'XacNhanDieuChinh'` hoặc `'GiuNguyen'`.
        > 3. Phiếu đối soát phải tồn tại (`MaPhieuTra IS NOT NULL`).
        > 4. Phiếu đối soát phải đang ở trạng thái `'Chờ phản hồi'` — kiểm tra với `UPDLOCK, HOLDLOCK` để tránh race condition (E9).
        >
        > Sau khi vượt qua kiểm tra, gọi `PhanHoiDoiSoatDB::XuLyPhanHoi` để thực hiện cập nhật trong 1 transaction.

#### Lớp: `ChiTietPhanHoiResult` (Data Transfer Object — kết quả tổng hợp chi tiết phiếu)
*   **Thuộc tính**:
    *   `- ChiTiet: ChiTietPhanHoi` (Thông tin tổng quát + tài chính của phiếu đối soát)
    *   `- DanhSachPhong: List<PhongItem>` (Danh sách phòng/giường liên kết)
    *   `- ChiTietKhauTru: KhauTruData` (Chi tiết các khoản khấu trừ gồm `hoaDonConNo`, `chiTietHoaDon`, `chiTietHuHong`, `bienBanViPham`)

#### Lớp: `ChiTietPhanHoi` (Data Transfer Object — thông tin tổng quan phiếu đối soát)
*   **Thuộc tính**:
    *   `- MaDoiSoat: String`, `- NgayLap: Date`, `- TrangThaiDoiSoat: String`
    *   `- GhiChuPhanHoiKhach: String` (Nội dung yêu cầu điều chỉnh của khách)
    *   `- MaPhieuTra: String`, `- NgayTraThucTe: Date`, `- TrangThaiPhieuTra: String`
    *   `- MaHopDong: String` (null nếu là phiếu đặt cọc)
    *   `- MaPhieuDatCoc: String` (null nếu là hợp đồng thuê)
    *   `- HoTenKhach: String`, `- SdtKhach: String`, `- EmailKhach: String`, `- Cccd: String`, `- MaKhachHang: String`
    *   `- TrangThaiHopDong: String`, `- TrangThaiCoc: String`
    *   `- NgayBatDau: Date`, `- NgayKetThuc: Date`, `- KyThanhToan: String`
    *   `- ThoiDiemDatCoc: DateTime`
    *   `- TienCocBanDau: Decimal`, `- TyLeHoanCocHienTai: Decimal`, `- TienCocDuocHoan: Decimal`
    *   `- TienThueConNo: Decimal`, `- TienDichVuConNo: Decimal`
    *   `- TongChiPhiSuaChua: Decimal`, `- TienPhat: Decimal`
    *   `- TongKhauTru: Decimal`
    *   `- SoTienHoanThucTe: Decimal`, `- SoTienKhachPhaiTT: Decimal`
    *   `- SoThangLuuTru: Decimal`

---

### 1.3. Tầng Truy Cập Dữ Liệu (DB Layer / DAL)

#### Lớp: `PhanHoiDoiSoatDB`
*   **Phương thức**:
    *   `+ <<static>> LayDanhSachChoXuLyPhanHoi(maNhanVien: String): DataTable` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên quản lý (lọc theo chi nhánh) |

        **Logic SP**: Lấy `@MaChiNhanh` từ bảng `NhanVien`. Trả về danh sách phiếu đối soát có `TrangThai IN ('Chờ phản hồi', 'Cần điều chỉnh', 'Chờ hoàn cọc', 'Chờ thanh toán thêm', 'Đã quyết toán')` thuộc chi nhánh. JOIN qua `DoiSoat → PhieuTraPhong → HopDongThue/PhieuDatCoc → ChiTietDatCoc → Phong → KhachHang → NguoiDung`. `GROUP BY` để lấy `MIN(TenPhong)` và `MIN(MaGiuong)`. Sắp xếp `NgayLap DESC, MaDoiSoat DESC`.

    *   `+ <<static>> LayChiTietPhanHoi(maDoiSoat: String, maNhanVien: String): DataSet` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_ChiTietPhanHoi`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaDoiSoat` | VARCHAR(6) | Mã phiếu đối soát cần xem chi tiết |
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên (kiểm tra quyền theo chi nhánh) |

        Trả về **3 recordset**:
        - `recordsets[0]`: Thông tin tổng quát + toàn bộ số liệu tài chính của phiếu đối soát (1 dòng, `SELECT TOP 1`).
        - `recordsets[1]`: Danh sách phòng/giường liên kết (`maPhong`, `tenPhong`, `maGiuong`, `giaThue`).
        - `recordsets[2]`: Chi tiết hư hỏng/mất mát (`maBienBanKT`, `maChiTietHH`, `maPhong`, `maTaiSan`, `tenTaiSan`, `mucDoHuHong`, `moTaHuHong`, `chiPhiSuaChua`) — JOIN qua `BienBanKiemTraPhong → ChiTietHuHong → TaiSan`.

    *   `+ <<static>> XuLyPhanHoi(maDoiSoat: String, maNhanVien: String, hanhDong: String): DataTable` ➔ Gọi stored procedure `dbo.SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat`

        | Tham số SP | Kiểu | Mô tả |
        |---|---|---|
        | `@MaDoiSoat` | VARCHAR(6) | Mã phiếu đối soát cần xử lý |
        | `@MaNhanVien` | VARCHAR(6) | Mã nhân viên quản lý thực hiện |
        | `@HanhDong` | NVARCHAR(30) | `'XacNhanDieuChinh'` hoặc `'GiuNguyen'` |

        **Logic SP** (trong 1 transaction với `SET XACT_ABORT ON`):
        1. Validate `@HanhDong` ∈ {`'XacNhanDieuChinh'`, `'GiuNguyen'`}, ném `THROW 50800` nếu không hợp lệ.
        2. Khóa dòng với `UPDLOCK, HOLDLOCK` để đọc `TrangThai`, `MaPhieuTra`, `SoTienHoanThucTe`, `SoTienKhachPhaiTT`.
        3. Kiểm tra `MaPhieuTra IS NOT NULL`, ném `THROW 50801` nếu không tìm thấy phiếu.
        4. Kiểm tra `TrangThai = 'Chờ phản hồi'`, ném `THROW 50802` nếu đã thay đổi (E9).
        5. **Nhánh `XacNhanDieuChinh`**:
            - `UPDATE DoiSoat SET TrangThai = N'Cần điều chỉnh'` — giữ nguyên `PhieuTraPhong.TrangThai = 'Chờ đối soát'`.
        6. **Nhánh `GiuNguyen`**:
            - Xác định `@TrangThaiMoiDS`: `'Chờ hoàn cọc'` nếu `SoTienHoanThucTe > 0`; `'Chờ thanh toán thêm'` nếu `SoTienKhachPhaiTT > 0`; `'Đã quyết toán'` nếu cả hai = 0.
            - `UPDATE DoiSoat SET TrangThai = @TrangThaiMoiDS`.
            - `UPDATE PhieuTraPhong SET TrangThai = N'Chờ ký biên bản'`.
        7. `COMMIT`. Trả về: `maDoiSoat`, `maPhieuTra`, `hanhDong`.

#### Lớp: `KhauTruDoiSoatRepository` (Repository truy xuất chi tiết khấu trừ)
*   **Phương thức**:
    *   `+ <<static>> LayChiTietKhauTru(db: Pool, maPhieuTra: String, maHopDong: String): KhauTruData` ➔ Truy vấn trực tiếp (không qua SP riêng) để lấy:
        - `hoaDonConNo`: Danh sách hóa đơn chưa thanh toán/nợ của hợp đồng
        - `chiTietHoaDon`: Chi tiết từng khoản (điện, nước, dịch vụ) theo hóa đơn
        - `bienBanViPham`: Danh sách biên bản vi phạm nội quy của hợp đồng
        - `chiTietHuHong`: Được bổ sung từ `recordsets[2]` của SP `ChiTietPhanHoi` (tái sử dụng kết quả đã có)

---

## 2. Sơ đồ tuần tự (Sequence Diagram) - Luồng Xử lý phản hồi đối soát

```mermaid
sequenceDiagram
    autonumber
    actor QL as :NhanVienQuanLy

    %% Tầng Giao Diện (1 lifeline duy nhất)
    participant GUI as :MHXuLyPhanHoi

    %% Tầng Nghiệp Vụ (BUS)
    participant BUS_PH as :PhanHoiDoiSoat

    %% Tầng Dữ Liệu (DB)
    participant DB_PH as :PhanHoiDoiSoatDB
    participant DB_KT as :KhauTruDoiSoatRepository

    %% Database Tables
    participant T_DS as dbo.DoiSoat
    participant T_PT as dbo.PhieuTraPhong
    participant T_NV as dbo.NhanVien

    %% ========================================================
    %% PHẦN 1: TẢI DANH SÁCH PHIẾU ĐỐI SOÁT CHỜ PHẢN HỒI
    %% ========================================================
    Note over QL, T_NV: PHẦN 1: TẢI DANH SÁCH PHIẾU ĐỐI SOÁT
    QL->>GUI: Truy cập "Xử lý phản hồi đối soát" (HienThi)
    activate GUI
    GUI->>BUS_PH: LayDanhSachChoXuLyPhanHoi(maNhanVien)
    activate BUS_PH
    BUS_PH->>DB_PH: LayDanhSachChoXuLyPhanHoi(maNhanVien)
    activate DB_PH
    DB_PH->>T_DS: EXEC SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi @MaNhanVien
    activate T_DS
    T_DS->>T_NV: Lấy @MaChiNhanh của quản lý
    activate T_NV
    T_NV-->>T_DS: @MaChiNhanh
    deactivate T_NV
    Note over T_DS: JOIN DoiSoat → PhieuTraPhong<br/>→ HopDongThue/PhieuDatCoc<br/>→ ChiTietDatCoc → Phong → NguoiDung<br/>WHERE TrangThai IN ('Chờ phản hồi', ...)
    T_DS-->>DB_PH: DataTable danh sách phiếu đối soát
    deactivate T_DS
    DB_PH-->>BUS_PH: DataTable
    deactivate DB_PH
    BUS_PH-->>GUI: List<DoiSoatSummary>
    deactivate BUS_PH
    GUI->>GUI: HienThi() (Lọc client lấy 'Chờ phản hồi', render dgvDanhSachDoiSoat)
    deactivate GUI

    %% ========================================================
    %% PHẦN 2: TẢI CHI TIẾT PHIẾU & MỞ MODAL
    %% ========================================================
    Note over QL, T_NV: PHẦN 2: MỞ MODAL VÀ TẢI CHI TIẾT PHẢN HỒI
    QL->>GUI: Click "Xử lý" hoặc "Xem chi tiết" (btnRow_Click)
    activate GUI
    GUI->>BUS_PH: LayChiTietPhanHoi(maDoiSoat, maNhanVien)
    activate BUS_PH

    BUS_PH->>DB_PH: LayChiTietPhanHoi(maDoiSoat, maNhanVien)
    activate DB_PH
    DB_PH->>T_DS: EXEC SP_TraPhong_QuanLy_ChiTietPhanHoi @MaDoiSoat, @MaNhanVien
    activate T_DS
    Note over T_DS: recordsets[0]: Thông tin tổng quát + tài chính đối soát<br/>recordsets[1]: Danh sách phòng/giường liên kết<br/>recordsets[2]: Chi tiết hư hỏng/mất mát tài sản
    T_DS-->>DB_PH: DataSet (3 recordsets)
    deactivate T_DS
    DB_PH-->>BUS_PH: DataSet
    deactivate DB_PH

    BUS_PH->>DB_KT: LayChiTietKhauTru(db, maPhieuTra, maHopDong)
    activate DB_KT
    Note over DB_KT: Truy vấn hoaDonConNo,<br/>chiTietHoaDon (điện/nước/dịch vụ),<br/>bienBanViPham<br/>Gộp chiTietHuHong từ recordsets[2]
    DB_KT-->>BUS_PH: KhauTruData { hoaDonConNo, chiTietHoaDon, chiTietHuHong, bienBanViPham }
    deactivate DB_KT

    BUS_PH-->>GUI: ChiTietPhanHoiResult { chiTiet, danhSachPhong, chiTietKhauTru }
    deactivate BUS_PH

    GUI->>GUI: HienThiChiTietModal(chiTiet, dsPhong, chiTietKhauTru)
    Note over GUI: buildFinanceGroups() — tổng hợp 6 nhóm khấu trừ client-side<br/>Xác định canAct = (trangThaiDoiSoat === 'Chờ phản hồi')<br/>Vô hiệu hóa 2 nút hành động nếu !canAct
    deactivate GUI

    %% ========================================================
    %% PHẦN 3A: XÁC NHẬN ĐIỀU CHỈNH (Luồng chính)
    %% ========================================================
    Note over QL, T_NV: PHẦN 3A: XÁC NHẬN ĐIỀU CHỈNH (Luồng chính bước 7-11)
    QL->>GUI: Nhấn "Xác nhận điều chỉnh" (btnXacNhanDieuChinh_Click)
    activate GUI
    GUI->>BUS_PH: XuLyPhanHoi(maDoiSoat, 'XacNhanDieuChinh', maNhanVien)
    activate BUS_PH
    BUS_PH->>BUS_PH: Kiểm tra ràng buộc nghiệp vụ (BR 1-4)

    alt [Hợp lệ: Phiếu vẫn ở 'Chờ phản hồi']
        BUS_PH->>DB_PH: XuLyPhanHoi(maDoiSoat, maNhanVien, 'XacNhanDieuChinh')
        activate DB_PH
        DB_PH->>T_DS: EXEC SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat @MaDoiSoat, @MaNhanVien, @HanhDong='XacNhanDieuChinh'
        activate T_DS
        Note over T_DS: UPDLOCK, HOLDLOCK kiểm tra TrangThai='Chờ phản hồi' (E9)<br/>UPDATE DoiSoat SET TrangThai = N'Cần điều chỉnh'<br/>PhieuTraPhong KHÔNG thay đổi (giữ 'Chờ đối soát')<br/>COMMIT
        T_DS-->>DB_PH: { maDoiSoat, maPhieuTra, hanhDong }
        deactivate T_DS
        DB_PH-->>BUS_PH: KetQuaXuLy
        deactivate DB_PH
        BUS_PH-->>GUI: KetQuaXuLy (Thành công)
        deactivate BUS_PH
        GUI->>GUI: HienThiThongBaoSuccess('XacNhanDieuChinh') (Popup "Đã chuyển phiếu cho kế toán điều chỉnh lại")
    else [Không hợp lệ (E9): Phiếu đã thay đổi trạng thái]
        BUS_PH-->>GUI: Exception THROW 50802
        deactivate BUS_PH
        GUI-->>QL: Toast lỗi "Phiếu đối soát đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác."
        GUI->>GUI: HienThi() (Reload danh sách)
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 3B: GIỮ NGUYÊN ĐỐI SOÁT (Biến thể A7)
    %% ========================================================
    Note over QL, T_NV: PHẦN 3B: GIỮ NGUYÊN ĐỐI SOÁT (Biến thể A7)
    QL->>GUI: Nhấn "Giữ nguyên đối soát" (btnGiuNguyen_Click)
    activate GUI
    GUI->>BUS_PH: XuLyPhanHoi(maDoiSoat, 'GiuNguyen', maNhanVien)
    activate BUS_PH
    BUS_PH->>BUS_PH: Kiểm tra ràng buộc nghiệp vụ (BR 1-4)

    alt [Hợp lệ: Phiếu vẫn ở 'Chờ phản hồi']
        BUS_PH->>DB_PH: XuLyPhanHoi(maDoiSoat, maNhanVien, 'GiuNguyen')
        activate DB_PH
        DB_PH->>T_DS: EXEC SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat @MaDoiSoat, @MaNhanVien, @HanhDong='GiuNguyen'
        activate T_DS

        alt [A7_B3.1: SoTienHoanThucTe > 0]
            Note over T_DS: @TrangThaiMoiDS = N'Chờ hoàn cọc'
        else [A7_B3.2: SoTienKhachPhaiTT > 0]
            Note over T_DS: @TrangThaiMoiDS = N'Chờ thanh toán thêm'
        else [A7_B3.3: Cả hai = 0]
            Note over T_DS: @TrangThaiMoiDS = N'Đã quyết toán'
        end

        Note over T_DS: UPDATE DoiSoat SET TrangThai = @TrangThaiMoiDS<br/>UPDATE PhieuTraPhong SET TrangThai = N'Chờ ký biên bản'<br/>COMMIT
        T_DS-->>DB_PH: { maDoiSoat, maPhieuTra, hanhDong }
        deactivate T_DS
        DB_PH-->>BUS_PH: KetQuaXuLy
        deactivate DB_PH
        BUS_PH-->>GUI: KetQuaXuLy (Thành công)
        deactivate BUS_PH
        GUI->>GUI: HienThiThongBaoSuccess('GiuNguyen') (Popup "Đã ghi nhận giữ nguyên kết quả đối soát")
    else [Không hợp lệ (E9): Phiếu đã thay đổi trạng thái]
        BUS_PH-->>GUI: Exception THROW 50802
        deactivate BUS_PH
        GUI-->>QL: Toast lỗi "Phiếu đối soát đã thay đổi trạng thái..."
        GUI->>GUI: HienThi() (Reload danh sách)
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 4: ĐÓNG POPUP THÀNH CÔNG VÀ CẬP NHẬT DANH SÁCH
    %% ========================================================
    Note over QL, T_NV: PHẦN 4: ĐÓNG POPUP VÀ CẬP NHẬT DANH SÁCH
    QL->>GUI: Click nút "Đóng" trên popup thành công (btnSuccessDong_Click)
    activate GUI
    GUI->>GUI: Đóng popup thành công & đóng modal chính
    GUI->>BUS_PH: LayDanhSachChoXuLyPhanHoi(maNhanVien)
    activate BUS_PH
    Note over BUS_PH, T_DS: (Luồng giống Phần 1 — tải lại để cập nhật trạng thái mới nhất)
    BUS_PH-->>GUI: List<DoiSoatSummary> (đã cập nhật)
    deactivate BUS_PH
    GUI->>GUI: HienThi() (Re-render dgvDanhSachDoiSoat)
    deactivate GUI
```
