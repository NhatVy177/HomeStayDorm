# Thiết kế chi tiết 3 lớp (3-Layer) & Sơ đồ tuần tự - Use Case: Ghi nhận bàn giao ra

Tài liệu này đặc tả cấu trúc thiết kế 3 lớp (Giao diện, Nghiệp vụ, Truy cập dữ liệu) và Sơ đồ tuần tự chi tiết cho chức năng **Ghi nhận bàn giao ra** dành cho tác nhân **Nhân viên Quản lý** của hệ thống HomeStayDorm. Use-case này **chỉ áp dụng** cho hồ sơ có hợp đồng thuê đã thanh lý và phiếu đối soát đã quyết toán.

---

## 1. Thiết kế các Lớp chi tiết (Class Design)

### 1.1. Tầng Giao Diện (GUI Layer)

**Tên lớp**: `MHGhiNhanBanGiaoRa`

**Thuộc tính (UI Controls)**:

*   **Phần danh sách và bộ lọc (Trang chính)**:
    *   `- txtTimKiem: TextBox` (Tra cứu theo tên khách, mã phiếu trả, mã đối soát)
    *   `- tabsFilterTrangThai: StatusFilterTabs` (Lọc theo: Tất cả / Chờ bàn giao / Đã bàn giao)
    *   `- dgvDanhSachBanGiaoRa: GridView` (Lưới hiển thị: mã phiếu trả, khách hàng, phòng/giường, mã đối soát, ngày đăng ký trả, trạng thái bàn giao, thao tác)
    *   `- btnRowBanGiao: Button` (Nút "Bàn giao" — khi `trangThaiBanGiao = 'Chờ bàn giao'`)
    *   `- btnRowXemChiTiet: Button` (Nút "Xem chi tiết" — khi `trangThaiBanGiao = 'Đã bàn giao'`)

*   **Modal Ghi nhận bàn giao ra**:
    *   `- lblModalTitle: Label` ("Ghi nhận bàn giao ra")
    *   `- btnDongModal: Button` (Nút X đóng modal)
    *   **Lưới 3 thẻ thông tin**:
        *   **Card Khách hàng**: `- lblHoTenKhach`, `- lblSoDienThoai`, `- lblCccdKhach`
        *   **Card Hợp đồng**: `- lblMaHopDong`, `- lblThoiHanHopDong` (`NgayBatDau - NgayKetThuc`), `- badgeTrangThaiHopDong`
        *   **Card Phòng/Giường**: `- lblKhuVuc`, `- lblTenPhong`, `- lblMaGiuong`
    *   **Bảng Ghi nhận bàn giao tài sản** (`tblTaiSan: Table`) — mỗi dòng gồm:
        *   `- lblTenTaiSan: Label` (Tên tài sản, read-only)
        *   `- lblSoLuongBanGiaoVao: Label` (Số lượng đã giao khi nhận phòng, read-only)
        *   `- txtSoLuongThuHoi: NumberInput` (Số lượng thu hồi thực tế; min=0, max=`soLuongBanGiaoVao`; disabled nếu đã bàn giao)
        *   `- txtGhiChu: TextInput` (Ghi chú tình trạng tài sản khi thu hồi; disabled nếu đã bàn giao)
    *   **Bảng Thành viên hợp đồng** (`tblThanhVien: Table`) — hiển thị: STT, họ tên, giới tính, SĐT, ngày sinh, trạng thái
    *   `- chkXacNhanRoi: Checkbox` ("Xác nhận khách hàng đã kết thúc lưu trú." — bắt buộc tick trước khi lập biên bản; disabled nếu đã bàn giao)
    *   `- lblErrorMsg: Label` (Hiển thị thông báo lỗi validate client)
    *   `- btnLapBienBan: Button` ("Lập biên bản bàn giao ra" — chỉ hiện khi `trangThaiBanGiao = 'Chờ bàn giao'` và chưa submit)
    *   `- btnDong: Button` (Nút "Đóng" modal)

*   **Popup Thông báo thành công**:
    *   `- lblSuccessTitle: Label` ("Thành công!")
    *   `- lblSuccessMessage: Label` ("Ghi nhận bàn giao ra thành công.")
    *   `- btnSuccessDong: Button`

*   **Toast lỗi**: `- toastError: Toast` (Auto-dismiss sau 3 giây)

**Phương thức (Events & Helpers)**:

*   `+ HienThi(): void` — Gọi `BanGiaoRa::LayDanhSachBanGiaoRa` với `status = 'Tất cả'`, nạp toàn bộ về client, lọc client theo tab và từ khóa.
*   `+ tabsFilterTrangThai_Change(key: String): void` — Lọc client-side theo 'Tất cả' / 'Chờ bàn giao' / 'Đã bàn giao'.
*   `+ txtTimKiem_Change(tuKhoa: String): void` — Lọc client-side theo từ khóa tên khách, mã phiếu, mã đối soát.
*   `+ btnRow_Click(row: BanGiaoRaSummary): void` — Mở modal, gọi `BanGiaoRa::LayChiTietBanGiaoRa(maPhieuTra)`, khởi tạo state `dsTaiSan` với `soLuongThuHoi` mặc định = `soLuongBanGiaoVao` (hoặc giá trị thu hồi đã lưu nếu đã bàn giao).
*   `+ handleTaiSanChange(index: Int, field: String, value: Any): void` — Cập nhật state `dsTaiSan` khi NV nhập số lượng thu hồi hoặc ghi chú.
*   `+ KiemTraHopLeGiaoDien(): Boolean` — Validate client: `chkXacNhanRoi` phải được tích.
*   `+ btnLapBienBan_Click(): void`:
    1. Validate client (A7): kiểm tra `xacNhanRoi === true`, nếu không hiển thị `errorMsg`.
    2. Serialize `dsTaiSan` thành `danhSachBanGiao` (JSON array với `maPhong`, `maTaiSan`, `soLuongThuHoi`, `ghiChu`).
    3. Gọi `BanGiaoRa::GhiNhanBanGiaoRa(maPhieuTra, danhSachBanGiao)`.
    4. Nếu thành công: `setIsSubmitted(true)` → mở Popup thành công, reload danh sách.
    5. Nếu lỗi: hiển thị `errorMsg` từ server.
*   `+ btnSuccessDong_Click(): void` — Đóng popup và modal, danh sách đã được reload trong bước 4.

---

### 1.2. Tầng Nghiệp Vụ (BUS Layer)

#### Lớp: `BanGiaoRa` (Thực thể Nghiệp vụ Bàn giao ra)

*   **Thuộc tính**: Không có (Stateless service)
*   **Phương thức**:

    *   `+ <<static>> LayDanhSachBanGiaoRa(maNhanVien: String, trangThaiLoc: String): List<BanGiaoRaSummary>`
        > Gọi `BanGiaoRaDB::LayDanhSachBanGiaoRa`. Trả về danh sách phiếu trả phòng "Hoàn tất" có HĐ đã thanh lý, đối soát đã quyết toán, đã có biên bản bàn giao vào, đã có biên bản kiểm tra trả phòng. Phân biệt `trangThaiBanGiao = 'Chờ bàn giao'` (chưa có BBBG ra) hoặc `'Đã bàn giao'` (đã có).

    *   `+ <<static>> LayChiTietBanGiaoRa(maPhieuTra: String, maNhanVien: String): ChiTietBanGiaoRaResult`
        > Gọi `BanGiaoRaDB::LayChiTietBanGiaoRa`. Trả về object tổng hợp 4 tập dữ liệu:
        > - `chiTiet`: Thông tin tổng quan (phiếu, khách, HĐ, phòng, biên bản kiểm tra, biên bản bàn giao ra nếu có).
        > - `danhSachThanhVien`: Danh sách thành viên hợp đồng.
        > - `danhSachTaiSanBanGiao`: Danh sách tài sản từ biên bản bàn giao vào kèm số lượng thu hồi (nếu đã có BBBG ra) và thông tin hư hỏng từ biên bản kiểm tra.
        > - `ketQuaKiemTra`: Danh sách chi tiết hư hỏng/mất mát từ biên bản kiểm tra trả phòng.

    *   `+ <<static>> GhiNhanBanGiaoRa(maPhieuTra: String, maNhanVien: String, danhSachBanGiao: List<ChiTietBanGiaoItem>): KetQuaBanGiaoRa`
        > **Kiểm tra ràng buộc nghiệp vụ (Business Rules)**:
        > 1. Nhân viên phải tồn tại và thuộc chi nhánh hợp lệ.
        > 2. Phiếu trả phòng phải tồn tại và thuộc chi nhánh của nhân viên.
        > 3. Phiếu phải liên kết với hợp đồng thuê (`MaHopDong IS NOT NULL`) — không áp dụng cho phiếu đặt cọc.
        > 4. Phiếu phải ở trạng thái `'Hoàn tất'` (E7.2).
        > 5. Hợp đồng phải `'Đã thanh lý'` VÀ Đối soát phải `'Đã quyết toán'` (E7.2).
        > 6. Chưa tồn tại biên bản bàn giao ra của hợp đồng — kiểm tra với `UPDLOCK, HOLDLOCK` (E7.1).
        > 7. Phải tồn tại biên bản bàn giao vào để đối chiếu.
        > 8. Phải tồn tại biên bản kiểm tra trả phòng.
        > 9. `danhSachBanGiao` (JSON) phải hợp lệ, không rỗng (A7).
        > 10. Số lượng thu hồi từng tài sản ≥ 0 và ≤ số lượng đã bàn giao vào (A7).
        >
        > Sau khi vượt qua kiểm tra, gọi `BanGiaoRaDB::GhiNhanBanGiaoRa` trong 1 Transaction.

#### Lớp: `BanGiaoRaSummary` (DTO - Dòng trong lưới danh sách)
*   **Thuộc tính**: `- MaPhieuTra`, `- HoTenKhach`, `- SdtKhach`, `- TenPhong`, `- MaGiuong`, `- MaDoiSoat`, `- NgayDangKyTra`, `- NgayTraThucTe`, `- TrangThaiPhieuTra`, `- TrangThaiHopDong`, `- TrangThaiDoiSoat`, `- TrangThaiBanGiao` (`'Chờ bàn giao'` / `'Đã bàn giao'`), `- MaBienBanBanGiaoRa`, `- LoaiNguon` (luôn là `'HopDong'`)

#### Lớp: `ChiTietBanGiaoRaResult` (DTO - Dữ liệu chi tiết trong Modal)
*   **Thuộc tính**:
    *   `- ChiTiet: ChiTietHoSoBanGiaoRa` (Thông tin tổng quan)
    *   `- DanhSachThanhVien: List<ThanhVienHopDong>`
    *   `- DanhSachTaiSanBanGiao: List<TaiSanBanGiaoItem>` (JOIN từ BBBG vào + BBBG ra + hư hỏng kiểm tra)
    *   `- KetQuaKiemTra: List<ChiTietHuHong>` (Từ biên bản kiểm tra trả phòng)

#### Lớp: `ChiTietBanGiaoItem` (Value Object — một khoản tài sản thu hồi)
*   **Thuộc tính**: `- MaPhong: String`, `- MaTaiSan: String`, `- SoLuongThuHoi: Int`, `- GhiChu: String`

---

### 1.3. Tầng Truy Cập Dữ Liệu (DB Layer / DAL)

#### Lớp: `BanGiaoRaDB`

*   `+ <<static>> LayDanhSachBanGiaoRa(maNhanVien: String, trangThaiLoc: String): DataTable`
    ➔ Gọi `dbo.SP_TraPhong_QuanLy_DanhSachBanGiaoRa`

    | Tham số SP | Kiểu | Mô tả |
    |---|---|---|
    | `@MaNhanVien` | VARCHAR(6) | Lọc theo chi nhánh NV |
    | `@TrangThaiLoc` | NVARCHAR(50) | `'Chờ bàn giao'` / `'Đã bàn giao'` / `'Tất cả'` |

    **Logic SP**: Lấy `@MaChiNhanh` từ `NhanVien`. Lọc phiếu trả phòng thỏa tất cả: `pt.MaHopDong IS NOT NULL`, `pt.TrangThai = 'Hoàn tất'`, `hd.TrangThai = 'Đã thanh lý'`, `ds.TrangThai = 'Đã quyết toán'`. INNER JOIN `BienBanBanGiao` (loại vào) và `BienBanKiemTraPhong`. LEFT JOIN `BienBanBanGiao` (loại ra) để tính `trangThaiBanGiao`. Sắp xếp theo `NgayTraThucTe DESC, MaPhieuTra DESC`.

*   `+ <<static>> LayChiTietBanGiaoRa(maPhieuTra: String, maNhanVien: String): DataSet`
    ➔ Gọi `dbo.SP_TraPhong_QuanLy_ChiTietBanGiaoRa`

    | Tham số SP | Kiểu | Mô tả |
    |---|---|---|
    | `@MaPhieuTra` | VARCHAR(6) | Mã phiếu cần xem chi tiết |
    | `@MaNhanVien` | VARCHAR(6) | Kiểm tra quyền theo chi nhánh |

    Trả về **4 recordsets**:
    - `recordsets[0]`: Thông tin tổng quan (phiếu, khách, HĐ, phòng, BBBG ra nếu có — `SELECT TOP 1`).
    - `recordsets[1]`: Danh sách thành viên hợp đồng từ `ThanhVienHopDong`.
    - `recordsets[2]`: Danh sách tài sản — JOIN từ `BienBanBanGiao (Vào) → ChiTietBanGiao → TaiSan`, LEFT JOIN `BienBanBanGiao (Ra) → ChiTietBanGiao` và `BienBanKiemTraPhong → ChiTietHuHong`. Trả về `soLuongBanGiaoVao`, `soLuongThuHoi` (null nếu chưa có BBBG ra), `mucDoHuHong`, `chiPhiSuaChua`.
    - `recordsets[3]`: Chi tiết hư hỏng/mất mát từ `BienBanKiemTraPhong → ChiTietHuHong → TaiSan`.

*   `+ <<static>> GhiNhanBanGiaoRa(maPhieuTra: String, maNhanVien: String, jsonBanGiaoRa: String): DataTable`
    ➔ Gọi `dbo.SP_TraPhong_QuanLy_GhiNhanBanGiaoRa`

    | Tham số SP | Kiểu | Mô tả |
    |---|---|---|
    | `@MaPhieuTra` | VARCHAR(6) | Mã phiếu trả phòng |
    | `@MaNhanVien` | VARCHAR(6) | Mã NV quản lý lập biên bản |
    | `@JSONBanGiaoRa` | NVARCHAR(MAX) | JSON array `[{maPhong, maTaiSan, soLuongThuHoi, ghiChu}]` |

    **Logic SP** (trong 1 transaction với `SET XACT_ABORT ON`):
    1. Kiểm tra NV, phiếu, chi nhánh (THROW 50200–50202 nếu vi phạm).
    2. Bắt buộc có `MaHopDong` (THROW 50203).
    3. Bắt buộc `TrangThaiPT = 'Hoàn tất'` (THROW 50204 — E7.2).
    4. Bắt buộc `TrangThaiHD = 'Đã thanh lý'` VÀ `TrangThaiDS = 'Đã quyết toán'` (THROW 50205 — E7.2).
    5. Kiểm tra chưa tồn tại BBBG ra với `UPDLOCK, HOLDLOCK` (THROW 50206 — E7.1).
    6. Kiểm tra tồn tại BBBG vào (THROW 50207) và biên bản kiểm tra (THROW 50208).
    7. Parse JSON và validate: `ISJSON`, không rỗng, các item hợp lệ, `SoLuongThuHoi ≥ 0` và `≤ SoLuongThucTe` của BBBG vào (THROW 50209–50211 — A7).
    8. Sinh mã `BG####` tăng dần → `INSERT INTO BienBanBanGiao`.
    9. `INSERT INTO ChiTietBanGiao` cho từng tài sản (mã `CB####` tăng dần).
    10. `UPDATE TaiSan SET SoLuong = SoLuong - (soLuongBanGiaoVao - soLuongThuHoi)` — trừ số bị thất thoát.
    11. `UPDATE ThanhVienHopDong SET TrangThai = 'Đã rời' WHERE TrangThai = 'Đang ở'`.
    12. `UPDATE Giuong SET TinhTrang = 'Trống'` (các giường thuộc HĐ từ `ChiTietDatCoc`).
    13. `UPDATE Phong SET TinhTrang` = tính lại dựa trên trạng thái toàn bộ giường: `'Trống'` / `'Còn chỗ'` / `'Đầy'`.
    14. `UPDATE PhieuDatCoc SET TrangThaiCoc = 'Đã hủy'`.
    15. `COMMIT`. Trả về: `maBienBanBanGiaoRa`, `maPhieuTra`, `maHopDong`, `message`.

---

## 2. Sơ đồ tuần tự (Sequence Diagram) - Luồng Ghi nhận bàn giao ra

```mermaid
sequenceDiagram
    autonumber
    actor QL as :NhanVienQuanLy

    participant GUI as :MHGhiNhanBanGiaoRa
    participant BUS as :BanGiaoRa
    participant DB as :BanGiaoRaDB

    participant T_PT as dbo.PhieuTraPhong
    participant T_BBBG as dbo.BienBanBanGiao
    participant T_TS as dbo.TaiSan
    participant T_TV as dbo.ThanhVienHopDong
    participant T_GG as dbo.Giuong
    participant T_PH as dbo.Phong
    participant T_PDC as dbo.PhieuDatCoc

    %% ========================================================
    %% PHẦN 1: TẢI DANH SÁCH
    %% ========================================================
    Note over QL, T_PDC: PHẦN 1: TẢI DANH SÁCH HỒ SƠ BÀN GIAO RA
    QL->>GUI: Truy cập chức năng "Ghi nhận bàn giao ra"
    activate GUI
    GUI->>BUS: LayDanhSachBanGiaoRa(maNhanVien, 'Tất cả')
    activate BUS
    BUS->>DB: LayDanhSachBanGiaoRa(maNhanVien, 'Tất cả')
    activate DB
    DB->>T_PT: EXEC SP_TraPhong_QuanLy_DanhSachBanGiaoRa @MaNhanVien, @TrangThaiLoc
    activate T_PT
    Note over T_PT: Lọc: MaHopDong NOT NULL<br/>TrangThai='Hoàn tất'<br/>HĐ='Đã thanh lý', ĐS='Đã quyết toán'<br/>INNER JOIN BienBanBanGiao (Vào) + BienBanKiemTra<br/>LEFT JOIN BienBanBanGiao (Ra) → tính trangThaiBanGiao
    T_PT-->>DB: DataTable danh sách
    deactivate T_PT
    DB-->>BUS: DataTable
    deactivate DB
    BUS-->>GUI: List<BanGiaoRaSummary>
    deactivate BUS
    GUI->>GUI: HienThi() (Render lưới; lọc client theo tab và từ khóa)
    deactivate GUI

    %% ========================================================
    %% PHẦN 2: TẢI CHI TIẾT & MỞ MODAL
    %% ========================================================
    Note over QL, T_PDC: PHẦN 2: TẢI CHI TIẾT VÀ MỞ MODAL
    QL->>GUI: Click "Bàn giao" (btnRow_Click)
    activate GUI
    GUI->>BUS: LayChiTietBanGiaoRa(maPhieuTra, maNhanVien)
    activate BUS
    BUS->>DB: LayChiTietBanGiaoRa(maPhieuTra, maNhanVien)
    activate DB
    DB->>T_PT: EXEC SP_TraPhong_QuanLy_ChiTietBanGiaoRa @MaPhieuTra, @MaNhanVien
    activate T_PT
    Note over T_PT: recordsets[0]: Thông tin tổng quan (phiếu, khách, HĐ, phòng, BBBG ra)<br/>recordsets[1]: Danh sách ThanhVienHopDong<br/>recordsets[2]: Tài sản bàn giao (BBBG vào + BBBG ra + hư hỏng kiểm tra)<br/>recordsets[3]: Chi tiết hư hỏng từ BienBanKiemTraPhong
    T_PT-->>DB: DataSet (4 recordsets)
    deactivate T_PT
    DB-->>BUS: DataSet
    deactivate DB
    BUS-->>GUI: ChiTietBanGiaoRaResult { chiTiet, danhSachThanhVien, danhSachTaiSanBanGiao, ketQuaKiemTra }
    deactivate BUS
    GUI->>GUI: Khởi tạo state dsTaiSan (soLuongThuHoi = soLuongBanGiaoVao mặc định)
    GUI->>GUI: HienThiChiTietModal() (Render 3 card + bảng tài sản + bảng thành viên)
    deactivate GUI

    %% ========================================================
    %% PHẦN 3: NHẬP LIỆU & LẬP BIÊN BẢN
    %% ========================================================
    Note over QL, T_PDC: PHẦN 3: NHẬP LIỆU VÀ LẬP BIÊN BẢN BÀN GIAO RA
    QL->>GUI: Nhập soLuongThuHoi, ghiChu cho từng tài sản (handleTaiSanChange)
    activate GUI
    GUI->>GUI: Cập nhật state dsTaiSan (client-side)
    deactivate GUI

    QL->>GUI: Tích checkbox "Xác nhận khách hàng đã kết thúc lưu trú"
    activate GUI
    GUI->>GUI: setXacNhanRoi(true)
    deactivate GUI

    QL->>GUI: Click "Lập biên bản bàn giao ra" (btnLapBienBan_Click)
    activate GUI

    GUI->>GUI: KiemTraHopLeGiaoDien() (Validate: xacNhanRoi phải = true)

    alt [Không hợp lệ (A7): Chưa tích xác nhận]
        GUI-->>QL: Hiển thị errorMsg "Vui lòng xác nhận khách hàng đã kết thúc lưu trú."
    else [Hợp lệ]
        GUI->>BUS: GhiNhanBanGiaoRa(maPhieuTra, maNhanVien, danhSachBanGiao)
        activate BUS
        BUS->>DB: GhiNhanBanGiaoRa(maPhieuTra, maNhanVien, JSON(danhSachBanGiao))
        activate DB
        DB->>T_PT: EXEC SP_TraPhong_QuanLy_GhiNhanBanGiaoRa @MaPhieuTra, @MaNhanVien, @JSONBanGiaoRa
        activate T_PT

        Note over T_PT: BEGIN TRANSACTION + SET XACT_ABORT ON<br/>Kiểm tra NV, phiếu, chi nhánh (THROW 50200-50202)<br/>Bắt buộc MaHopDong IS NOT NULL (THROW 50203)<br/>Kiểm tra TrangThaiPT='Hoàn tất' (THROW 50204 — E7.2)<br/>Kiểm tra HĐ='Đã thanh lý' & ĐS='Đã quyết toán' (THROW 50205 — E7.2)

        alt [E7.1: Đã tồn tại BBBG ra]
            Note over T_PT: THROW 50206 (UPDLOCK, HOLDLOCK)
            T_PT-->>DB: Exception
            DB-->>BUS: Exception
            BUS-->>GUI: Exception
            GUI-->>QL: Hiển thị errorMsg "Hồ sơ này đã được ghi nhận bàn giao ra trước đó."
        else [E7.2: Điều kiện không thỏa]
            Note over T_PT: THROW 50204/50205
            T_PT-->>DB: Exception
            DB-->>BUS: Exception
            BUS-->>GUI: Exception
            GUI-->>QL: Hiển thị errorMsg "Hồ sơ không đủ điều kiện ghi nhận bàn giao ra."
        else [A7: JSON hoặc SL không hợp lệ]
            Note over T_PT: THROW 50209/50210/50211
            T_PT-->>DB: Exception
            DB-->>BUS: Exception
            BUS-->>GUI: Exception
            GUI-->>QL: Hiển thị errorMsg "Thông tin bàn giao ra không hợp lệ."
        else [Hợp lệ: Tất cả điều kiện thỏa]
            Note over T_PT: Sinh mã BG#### → INSERT BienBanBanGiao (Bàn giao ra)
            T_PT->>T_BBBG: INSERT ChiTietBanGiao (CB#### cho từng tài sản)
            T_BBBG->>T_TS: UPDATE TaiSan SET SoLuong = SoLuong - (slGiaoVao - slThuHoi) [trừ thất thoát]
            T_TS->>T_TV: UPDATE ThanhVienHopDong SET TrangThai='Đã rời' WHERE TrangThai='Đang ở'
            T_TV->>T_GG: UPDATE Giuong SET TinhTrang='Trống' [giường thuộc HĐ]
            T_GG->>T_PH: UPDATE Phong SET TinhTrang = tính lại ('Trống'/'Còn chỗ'/'Đầy') dựa trên toàn bộ giường
            T_PH->>T_PDC: UPDATE PhieuDatCoc SET TrangThaiCoc='Đã hủy'
            Note over T_PDC: COMMIT TRANSACTION
            T_PDC-->>T_PT: 
            T_PT-->>DB: { maBienBanBanGiaoRa, maPhieuTra, maHopDong, message }
            deactivate T_PT
            DB-->>BUS: KetQuaBanGiaoRa
            deactivate DB
            BUS-->>GUI: KetQuaBanGiaoRa (Thành công)
            deactivate BUS
            GUI->>GUI: setIsSubmitted(true), HienThi() reload danh sách
            GUI->>GUI: HienThiThongBaoSuccess() (Popup "Ghi nhận bàn giao ra thành công.")
        end
    end
    deactivate GUI

    %% ========================================================
    %% PHẦN 4: ĐÓNG POPUP VÀ KẾT THÚC
    %% ========================================================
    Note over QL, T_PDC: PHẦN 4: ĐÓNG POPUP VÀ KẾT THÚC
    QL->>GUI: Click "Đóng" trên popup thành công (btnSuccessDong_Click)
    activate GUI
    GUI->>GUI: Đóng popup thành công & đóng modal chính
    Note over GUI: Danh sách đã được reload ở bước trước<br/>Phiếu vừa xử lý chuyển sang 'Đã bàn giao' trong lưới
    deactivate GUI
```
