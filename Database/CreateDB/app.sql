CREATE DATABASE HOMEDORM4
GO

USE HOMEDORM4
GO

SET QUOTED_IDENTIFIER ON;
GO

-- 1. CHI NHÁNH
CREATE TABLE ChiNhanh (
    MaChiNhanh      VARCHAR(6)      PRIMARY KEY,
    TenChiNhanh     NVARCHAR(100)   NOT NULL,
    DiaChi          NVARCHAR(255),
    SDT				VARCHAR(20),
    Email           VARCHAR(100),
    TrangThai       NVARCHAR(20)     NOT NULL DEFAULT N'Hoạt động',
    CONSTRAINT CHK_ChiNhanh_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Ngừng hoạt động'))
);

-- 2. LOẠI PHÒNG
CREATE TABLE LoaiPhong (
    MaLoaiPhong             VARCHAR(6)      PRIMARY KEY,
    TenLoaiPhong            NVARCHAR(100)   NOT NULL,
    SucChuaToiDa            INT             NOT NULL,
    MoTa                    NVARCHAR(MAX),
    GiaThueTheoGiuong       DECIMAL(15,2),
    GiaThueNguyenPhong      DECIMAL(15,2)
);

-- 3. NGƯỜI DÙNG
CREATE TABLE NguoiDung (
    MaNguoiDung     VARCHAR(6)      PRIMARY KEY,
    HoTen           NVARCHAR(100)   NOT NULL,
    NgaySinh        DATE,
    GioiTinh        NVARCHAR(5),
    SDT             VARCHAR(20),
    Email           VARCHAR(100),
    UrlAvt          VARCHAR(500),
    LoaiNguoiDung   VARCHAR(20)     NOT NULL,
    CONSTRAINT CHK_ND_GioiTinh  CHECK (GioiTinh IN (N'Nam', N'Nữ')),
    CONSTRAINT CHK_ND_LoaiND    CHECK (LoaiNguoiDung IN (N'NhanVien', N'KhachHang'))
);

-- 4. NHÂN VIÊN
CREATE TABLE NhanVien (
    MaNhanVien      VARCHAR(6)      PRIMARY KEY,
    MaChiNhanh      VARCHAR(6)      NOT NULL,
    NgayVaoLam      DATE,
    ChucVu          NVARCHAR(20)     NOT NULL,
    CONSTRAINT CHK_NV_ChucVu CHECK (ChucVu IN (N'Sale', N'Quản lý', N'Kế toán', N'Admin'))
);

-- 5. KHÁCH HÀNG
CREATE TABLE KhachHang (
    MaKhachHang     VARCHAR(6)      PRIMARY KEY,
    QuocTich        NVARCHAR(50),
    CCCD            VARCHAR(20)
);

-- 6. TÀI KHOẢN
CREATE TABLE TaiKhoan (
    TenDangNhap     VARCHAR(50)     PRIMARY KEY,
    MatKhau         VARCHAR(255)    NOT NULL,
    TrangThai       NVARCHAR(20)     NOT NULL DEFAULT N'Hoạt động',
    MaNguoiDung     VARCHAR(6)      NOT NULL,
    CONSTRAINT CHK_TK_TrangThai CHECK (TrangThai IN (N'Hoạt động', N'Vô hiệu hóa'))
);

-- 7. PHÒNG
CREATE TABLE Phong (
    MaPhong         VARCHAR(4)      PRIMARY KEY,
    TenPhong        NVARCHAR(100)   NOT NULL,
    GioiTinhChoPhep NVARCHAR(20)    NOT NULL, 
    TinhTrang       NVARCHAR(20)    NOT NULL DEFAULT N'Trống', 
    MaChiNhanh      VARCHAR(6)      NOT NULL,
    MaLoaiPhong     VARCHAR(6)      NOT NULL,

    CONSTRAINT CHK_Phong_GioiTinh   
        CHECK (GioiTinhChoPhep IN (N'Nam', N'Nữ', N'Không phân biệt')),

    CONSTRAINT CHK_Phong_TinhTrang  
        CHECK (TinhTrang IN (N'Trống', N'Đã đặt cọc', N'Còn chỗ', N'Đầy', N'Giữ chỗ'))
);

CREATE TABLE HinhAnhPhong (
    MaPhong VARCHAR(4) NOT NULL,
    STTAnh INT NOT NULL,
    UrlImg VARCHAR(500) NOT NULL,

    PRIMARY KEY (MaPhong, STTAnh),

    CONSTRAINT FK_HinhAnhPhong_Phong
        FOREIGN KEY (MaPhong) REFERENCES Phong(MaPhong)
);
-- 8. GIƯỜNG 
CREATE TABLE Giuong (
    MaPhong     VARCHAR(4)      NOT NULL,
    MaGiuong    VARCHAR(3)      NOT NULL,
    SoGiuong    INT             NOT NULL,
    TinhTrang   NVARCHAR(20)    NOT NULL DEFAULT N'Trống', 
PRIMARY KEY (MaPhong, MaGiuong),
    CONSTRAINT CHK_Giuong_TinhTrang CHECK (TinhTrang IN (N'Trống', N'Đã đặt cọc', N'Đang thuê', N'Giữ chỗ'))
);
-- 9. PHIẾU ĐĂNG KÝ
CREATE TABLE PhieuDangKy (
    MaDangKy            VARCHAR(6)      PRIMARY KEY,
    NgayDangKy          DATE            NOT NULL,
    SoNam               INT             DEFAULT 0,
    SoNu                INT             DEFAULT 0,
    SoNguoiDuKienO      INT,
    KhuVucMongMuon      NVARCHAR(100),
    LoaiPhongYeuCau     NVARCHAR(50),
    MucGiaToiDa         DECIMAL(15,2),  
    ThoiGianDuKienVaoO  DATE,
    ThoiHanThue         INT,
    YeuCauKhac          NVARCHAR(MAX),
    TrangThai           NVARCHAR(30)     NOT NULL DEFAULT N'Chờ tiếp nhận',
    MaKhachHang         VARCHAR(6)      NOT NULL,
    MaNhanVienSale      VARCHAR(6),
    GhiChuSale          NVARCHAR(MAX)   NULL,
    CONSTRAINT CHK_PDK_SoNguoi CHECK (
        SoNguoiDuKienO > 0
        AND SoNam >= 0
        AND SoNu >= 0
        AND SoNam + SoNu = SoNguoiDuKienO
    ),
    CONSTRAINT CHK_PDK_TrangThai    CHECK (TrangThai IN (N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối', N'Chờ tiếp nhận', N'Đã tiếp nhận')),
    CONSTRAINT CHK_PDK_MucGia CHECK (MucGiaToiDa > 0)
);

-- 10. LỊCH XEM PHÒNG
CREATE TABLE LichXemPhong (
    MaDangKy    VARCHAR(6)      NOT NULL,
    STTLich     INT             NOT NULL,
    ThoiGianHen DATETIME        NOT NULL,
    TrangThai   NVARCHAR(30)     NOT NULL DEFAULT N'Chờ xem',
    GhiChu      NVARCHAR(500),
    PRIMARY KEY (MaDangKy, STTLich),
    CONSTRAINT CHK_LXP_TrangThai    CHECK (TrangThai IN (N'Chờ xem', N'Đã xem', N'Đã hủy', N'Yêu cầu đổi lịch', N'Yêu cầu hủy'))
);

-- 11. CHI TIẾT XEM PHÒNG
CREATE TABLE ChiTietXemPhong (
    MaDangKy    VARCHAR(6)      NOT NULL,
    MaPhong     VARCHAR(4)      NOT NULL,
    STTLich     INT             NOT NULL,
	PRIMARY KEY (MaDangKy, MaPhong, STTLich)
);

-- 12. PHIẾU ĐẶT CỌC
CREATE TABLE PhieuDatCoc (
    MaPhieuDatCoc           VARCHAR(6)      PRIMARY KEY,
    ThoiDiemDatCoc          DATETIME        NOT NULL,
    ThoiHanThanhToan        DATETIME        NOT NULL,
    SoTienCoc               DECIMAL(15,2),
    PhuongThucThanhToan     NVARCHAR(20)    
    TrangThaiThanhToan      NVARCHAR(20)     NOT NULL DEFAULT N'Chờ TT',
    ThoiGianXacNhanTT       DATETIME,
    ChungTuThanhToan        VARCHAR(500),
    ThoiGianNhanPhong       DATETIME,
    HinhThucThue            NVARCHAR(20)     NOT NULL,
    TrangThaiCoc            NVARCHAR(20)     NOT NULL DEFAULT N'Hiệu lực',
    MaPhieuYeuCauDangKy     VARCHAR(6)      NOT NULL,
    MaKhachHang             VARCHAR(6)      NOT NULL,
    MaNhanVienKeToan        VARCHAR(6),
    CONSTRAINT CHK_PDC_PhuongThuc   CHECK (PhuongThucThanhToan IN (N'Tiền mặt', N'Chuyển khoản')),
    CONSTRAINT CHK_PDC_TrangThaiTT  CHECK (TrangThaiThanhToan IN (N'Chờ TT', N'Đã TT', N'Hết hạn')),
    CONSTRAINT CHK_PDC_HinhThuc     CHECK (HinhThucThue IN (N'Nguyên phòng', N'Ghép giường')),
CONSTRAINT CHK_PDC_TrangThaiCoc CHECK (TrangThaiCoc IN (N'Hiệu lực', N'Đã hủy', N'Đã lập HĐ'))
);

-- 13. CHI TIẾT ĐẶT CỌC
CREATE TABLE ChiTietDatCoc (
    MaChiTietDC     VARCHAR(6)      NOT NULL,
    MaPhieuDatCoc   VARCHAR(6)      NOT NULL,
    MaPhong         VARCHAR(4)      NOT NULL,
    MaGiuong        VARCHAR(3)      NULL,
    GiaThue         DECIMAL(15,2)   ,
    PRIMARY KEY (MaChiTietDC),
    CONSTRAINT FK_CTDC_PhieuDatCoc  FOREIGN KEY (MaPhieuDatCoc)         REFERENCES PhieuDatCoc(MaPhieuDatCoc),
    CONSTRAINT FK_CTDC_Phong        FOREIGN KEY (MaPhong)               REFERENCES Phong(MaPhong),
    CONSTRAINT FK_CTDC_Giuong       FOREIGN KEY (MaPhong, MaGiuong)     REFERENCES Giuong(MaPhong, MaGiuong)
);

-- Filtered index: đảm bảo mỗi phòng chỉ xuất hiện 1 lần khi thuê nguyên phòng
CREATE UNIQUE INDEX UX_CTDC_NguyCan
ON ChiTietDatCoc (MaPhieuDatCoc, MaPhong)
WHERE MaGiuong IS NULL;

-- Filtered index: đảm bảo mỗi giường không bị đặt cọc 2 lần trong cùng 1 phiếu
CREATE UNIQUE INDEX UX_CTDC_Giuong
ON ChiTietDatCoc (MaPhieuDatCoc, MaPhong, MaGiuong)
WHERE MaGiuong IS NOT NULL;


-- 14. HỢP ĐỒNG THUÊ
CREATE TABLE HopDongThue (
    MaHopDong           VARCHAR(6)      PRIMARY KEY,
    NgayKyHD            DATE            NOT NULL,
    NgayBatDau          DATE            NOT NULL,
    NgayKetThuc         DATE            NOT NULL,
    SoGiuongThue        INT             ,
    GiaThue             DECIMAL(15,2)   ,
    KyThanhToan         NVARCHAR(20)     NOT NULL,
    TrangThai           NVARCHAR(20)     NOT NULL DEFAULT N'Hiệu lực',
    MaPhieuCoc          VARCHAR(6)      NOT NULL,
    MaKhachHang         VARCHAR(6)      NOT NULL,
    MaNhanVienQuanLy    VARCHAR(6),
    CONSTRAINT CHK_HDT_KyTT      CHECK (KyThanhToan IN (N'Hàng tháng', N'Hàng quý')),
    CONSTRAINT CHK_HDT_TrangThai CHECK (TrangThai IN (N'Hiệu lực', N'Hết hạn', N'Đã thanh lý'))
);

-- 15. DỊCH VỤ
CREATE TABLE DichVu (
    MaDichVu    VARCHAR(6)      PRIMARY KEY,
    TenDichVu   NVARCHAR(100)   NOT NULL,
    DonViTinh   VARCHAR(20)     NOT NULL,
    DonGia      DECIMAL(15,2)   NOT NULL
);

-- 16. DỊCH VỤ HỢP ĐỒNG
CREATE TABLE DichVuHopDong (
    MaChiTietDVHD   VARCHAR(6)      PRIMARY KEY,
    MaDichVu        VARCHAR(6)      NOT NULL,
    MaHopDong       VARCHAR(6)      NOT NULL,
    GhiChu          NVARCHAR(MAX)
);

-- 17. THÀNH VIÊN HỢP ĐỒNG
CREATE TABLE ThanhVienHopDong (
    MaThanhVien VARCHAR(6)      PRIMARY KEY,
    HoTen       NVARCHAR(100)   NOT NULL,
    NgaySinh    DATE,
    GioiTinh    NVARCHAR(4),
    CCCD        VARCHAR(20),
    SDT         VARCHAR(20),
    Email       VARCHAR(100),
    QuocTich    NVARCHAR(50),
    TrangThai   NVARCHAR(20)     NOT NULL DEFAULT N'Đang ở',
    MaHopDong   VARCHAR(6)      NOT NULL,
    CONSTRAINT CHK_TVHD_GioiTinh  CHECK (GioiTinh IN (N'Nam', N'Nữ')),
    CONSTRAINT CHK_TVHD_TrangThai CHECK (TrangThai IN (N'Đang ở', N'Đã rời', N'Bị từ chối'))
);

-- 18. TÀI SẢN
CREATE TABLE TaiSan (
	MaPhong     VARCHAR(4)      NOT NULL,
MaTaiSan    VARCHAR(6)      NOT NULL,
    TenTaiSan   NVARCHAR(100)   NOT NULL,
    SoLuong     INT             NOT NULL DEFAULT 1,
    DonGia      DECIMAL(15,2),
    PRIMARY KEY (MaPhong, MaTaiSan)
);

-- 19. BIÊN BẢN BÀN GIAO
CREATE TABLE BienBanBanGiao (
    MaBienBan           VARCHAR(6)      PRIMARY KEY,
    NgayBanGiao         DATE            NOT NULL,
    LoaiBanGiao         NVARCHAR(20)     NOT NULL,
    MaHopDong           VARCHAR(6)      NOT NULL,
    MaNhanVienQuanLy    VARCHAR(6),
    CONSTRAINT CHK_BBBG_Loai CHECK (LoaiBanGiao IN (N'Bàn giao vào', N'Bàn giao ra'))
);

-- 20. CHI TIẾT BÀN GIAO
CREATE TABLE ChiTietBanGiao (
    MaChiTietBG     VARCHAR(6)      PRIMARY KEY,
    MaBienBan       VARCHAR(6)      NOT NULL,
	MaPhong         VARCHAR(4)      NOT NULL,
    MaTaiSan        VARCHAR(6)      NOT NULL,
    SoLuongThucTe   INT             NOT NULL,
    GhiChu          NVARCHAR(255)
);

-- 21. PHIẾU GHI CHỈ SỐ
CREATE TABLE PhieuGhiChiSo (
    MaPhieuGhi          VARCHAR(6)      PRIMARY KEY,
    KyGhi               VARCHAR(7)      NOT NULL,
    NgayGhi             DATE            NOT NULL,
    ChiSoNuocDau        DECIMAL(10,2)   NOT NULL,
    ChiSoNuocCuoi       DECIMAL(10,2)   NOT NULL,
    ChiSoDienDau        DECIMAL(10,2)   NOT NULL,
    ChiSoDienCuoi       DECIMAL(10,2)   NOT NULL,
    TrangThai           NVARCHAR(20)     NOT NULL DEFAULT N'Chưa Lập HD',
    MaNhanVienQuanLy    VARCHAR(6),
    MaPhong             VARCHAR(4)      NOT NULL,
    CONSTRAINT CHK_PGCS_TrangThai   CHECK (TrangThai IN (N'Chưa Lập HD', N'Đã Lập HD')),
    CONSTRAINT CHK_PGCS_Nuoc        CHECK (ChiSoNuocCuoi >= ChiSoNuocDau),
    CONSTRAINT CHK_PGCS_Dien        CHECK (ChiSoDienCuoi >= ChiSoDienDau)
);

-- 22. HÓA ĐƠN
CREATE TABLE HoaDon (
    MaHoaDon            VARCHAR(6)      PRIMARY KEY,
    KyThanhToan         VARCHAR(7)      NOT NULL,
    NgayLap             DATE            NOT NULL,
    NgayHanTT           DATE,
    TongTien            DECIMAL(15,2),
    TrangThai           NVARCHAR(20),
    NgayThanhToan       DATE,
    PhuongThucThanhToan NVARCHAR(20),
    MaHopDong           VARCHAR(6)      NOT NULL,
    MaNhanVienKeToan    VARCHAR(6),
    CONSTRAINT CHK_HD_TrangThai  CHECK (TrangThai IN (N'Chưa TT', N'Đã TT', N'Nợ', N'Tạm tính')),
    CONSTRAINT CHK_HD_PhuongThuc CHECK (PhuongThucThanhToan IN (N'Tiền mặt', N'Chuyển khoản'))
);

-- 23. CHI TIẾT HÓA ĐƠN
CREATE TABLE ChiTietHoaDon (
    MaChiTietHD     VARCHAR(6)      PRIMARY KEY,
    SoLuong         DECIMAL(10,2)   ,
    DonViTinh       VARCHAR(20)     ,
    DonGia          DECIMAL(15,2)   ,
    ThanhTien       DECIMAL(15,2)   ,
    MaHoaDon        VARCHAR(6)      NOT NULL,
    MaChiTietDVHD   VARCHAR(6)      NOT NULL,
    MaPhieuGhi      VARCHAR(6)      NULL
);

-- 24. PHIẾU TRẢ PHÒNG
CREATE TABLE PhieuTraPhong (
MaPhieuTra      VARCHAR(6)      PRIMARY KEY,
    NgayDangKyTra   DATE            NOT NULL,
    NgayDuKienTra   DATE,
    NgayTraThucTe   DATE,
    TrangThai       NVARCHAR(50)     NOT NULL DEFAULT N'Chờ xử lý',
    MaHopDong       VARCHAR(6)      NULL,
    MaPhieuDatCoc   VARCHAR(6)      NULL,
    CONSTRAINT CHK_PTP_TrangThai CHECK (TrangThai IN (N'Chờ xử lý', N'Chờ đối soát', N'Chờ ký biên bản', N'Chờ hoàn cọc', N'Chờ hoàn tất', N'Hoàn tất', N'Hủy')),
    CONSTRAINT CHK_PTP_CoHD      CHECK (MaHopDong IS NOT NULL OR MaPhieuDatCoc IS NOT NULL)
);

-- 25. BIÊN BẢN KIỂM TRA PHÒNG
CREATE TABLE BienBanKiemTraPhong (
    MaBienBanKT         VARCHAR(6)      PRIMARY KEY,
    MaPhieuTra          VARCHAR(6)      NOT NULL,
    MaNhanVienQL        VARCHAR(6),
    NgayKiemTra         DATE            NOT NULL,
    TinhTrangPhong      NVARCHAR(MAX),
    TongChiPhiSuaChua   DECIMAL(15,2)   DEFAULT 0
);

-- 26. CHI TIẾT HƯ HỎNG
CREATE TABLE ChiTietHuHong (
    MaChiTietHH     VARCHAR(6)      PRIMARY KEY,
    MaBienBanKT     VARCHAR(6)      NOT NULL,
    MaPhong         VARCHAR(4)      NOT NULL,
    MaTaiSan        VARCHAR(6)      NOT NULL,
    MoTaHuHong      NVARCHAR(MAX),
    ChiPhiSuaChua   DECIMAL(15,2)   DEFAULT 0
);

-- 27. QUY ĐỊNH HOÀN CỌC
CREATE TABLE QuyDinhHoanCoc (
    MaQuyDinhHoanCoc    VARCHAR(6)      PRIMARY KEY,
    TenQuyDinh          NVARCHAR(255)   NOT NULL,
    TyLeHoanCoc         DECIMAL(5,2)    NOT NULL
);

-- 28. ĐỐI SOÁT (QUYẾT TOÁN)
CREATE TABLE DoiSoat (
    MaDoiSoat    VARCHAR(6)      PRIMARY KEY,
    NgayLap             DATE            NOT NULL,
    TienCocBanDau       DECIMAL(15,2),
    SoThangLuuTru       DECIMAL(5,1),
    TyLeHoanCocHienTai  DECIMAL(5,2),
    TienCocDuocHoan     DECIMAL(15,2),
    TienThueConNo       DECIMAL(15,2)   DEFAULT 0,
    TienDichVuConNo     DECIMAL(15,2)   DEFAULT 0,
    TongChiPhiSuaChua   DECIMAL(15,2)   DEFAULT 0,
    TienPhat            DECIMAL(15,2)   DEFAULT 0,
    TongKhauTru         DECIMAL(15,2)   DEFAULT 0,
    SoTienHoanThucTe    DECIMAL(15,2)   DEFAULT 0,
    SoTienKhachPhaiTT   DECIMAL(15,2)   DEFAULT 0,
    PhuongThucThanhToan NVARCHAR(20),
	ChungTuThanhToan	VARCHAR(500),
	NgayThanhToan		DATE,
	GhiChuPhanHoiKhach  NVARCHAR(500),
    LoaiQuyetToan      NVARCHAR(30)     NOT NULL DEFAULT N'Không phát sinh',
    TrangThai           NVARCHAR(30)     NOT NULL DEFAULT N'Chờ quản lý xác nhận',
    MaNhanVienKeToan    VARCHAR(6),
    MaPhieuTra          VARCHAR(6)      NOT NULL,
    MaQuyDinhHoanCoc    VARCHAR(6),
    CONSTRAINT CHK_DS_PhuongThuc CHECK (PhuongThucThanhToan IN (N'Tiền mặt', N'Chuyển khoản')),
    CONSTRAINT CHK_DS_LoaiQuyetToan CHECK (LoaiQuyetToan IN (N'Hoàn cọc', N'Thu thêm', N'Không phát sinh')),
    CONSTRAINT CHK_DS_TrangThai  CHECK (TrangThai IN (N'Chờ phản hồi', N'Chờ xác nhận', N'Cần điều chỉnh', N'Chờ hoàn cọc', N'Chờ thanh toán thêm', N'Đã quyết toán'))
);

-- 29. QUY ĐỊNH
CREATE TABLE QuiDinh (
    MaQuyDinh       VARCHAR(6)      PRIMARY KEY,
    TieuDeNoiQuy    NVARCHAR(255)   NOT NULL,
    NoiDung         NVARCHAR(MAX),
    TrangThai       NVARCHAR(20)     NOT NULL DEFAULT N'Hiệu lực',
    CONSTRAINT CHK_QD_TrangThai CHECK (TrangThai IN (N'Hiệu lực', N'Hết hiệu lực'))
);

-- 30. ĐIỀU KHOẢN VI PHẠM
CREATE TABLE DieuKhoanViPham (
    MaDieuKhoan     VARCHAR(6)      PRIMARY KEY,
    TenDieuKhoan    NVARCHAR(255)   NOT NULL,
    HinhThucXuPhat  NVARCHAR(20)     NOT NULL,
    MucPhat         DECIMAL(15,2),
    TrangThai       NVARCHAR(20)     NOT NULL DEFAULT N'Hiệu lực',
    CONSTRAINT CHK_DKVP_HinhThuc  CHECK (HinhThucXuPhat IN (N'Nhắc nhở', N'Phạt tiền')),
    CONSTRAINT CHK_DKVP_TrangThai CHECK (TrangThai IN (N'Hiệu lực', N'Hết hiệu lực'))
);

-- 31. YÊU CẦU SỬA CHỮA
CREATE TABLE YeuCauSuaChua (
    MaYeuCau            VARCHAR(6)      PRIMARY KEY,
    NgayYeuCau          DATE        NOT NULL,
    MoTaHuHong          NVARCHAR(MAX),
    HinhAnhMinhChung    VARCHAR(500),
    TrangThai           NVARCHAR(20)     NOT NULL DEFAULT N'Chờ tiếp nhận',
    NgayTiepNhan        DATE,
    NgayHoanTat         DATE,
    ChiPhiSuaChua       DECIMAL(15,2),
    LoiDoKhachGayRa     BIT             DEFAULT 0,
    GhiChuXuLy          NVARCHAR(MAX),
    MaHopDong           VARCHAR(6),
    MaPhong             VARCHAR(4),
    MaTaiSan            VARCHAR(6),
    MaNhanVienQuanLy    VARCHAR(6),
    CONSTRAINT CHK_YCSC_TrangThai CHECK (TrangThai IN (N'Chờ tiếp nhận', N'Đang xử lý', N'Hoàn tất', N'Từ chối'))
);

-- 32. BIÊN BẢN VI PHẠM 
CREATE TABLE BienBanViPham (
	MaBBViPham			VARCHAR(6)		PRIMARY KEY,
	NgayViPham			DATE,
	MoTaViPham			NVARCHAR(MAX),
	SoTienPhat			DECIMAL(15,2),
	TrangThai			NVARCHAR(20),
	MaKhachHang			VARCHAR(6),
	MaHopDong			VARCHAR(6),
	MaDieuKhoan			VARCHAR(6),
	CONSTRAINT CHK_BBVP_TrangThai CHECK (TrangThai IN (N'Chờ xử lý', N'Đã xử lý'))

);

-- =============================================
-- PHẦN KHÓA NGOẠI
-- =============================================

-- NHÂN VIÊN
ALTER TABLE NhanVien
    ADD CONSTRAINT FK_NhanVien_NguoiDung    FOREIGN KEY (MaNhanVien)        REFERENCES NguoiDung(MaNguoiDung),
        CONSTRAINT FK_NhanVien_ChiNhanh     FOREIGN KEY (MaChiNhanh)        REFERENCES ChiNhanh(MaChiNhanh);

-- KHÁCH HÀNG
ALTER TABLE KhachHang
    ADD CONSTRAINT FK_KhachHang_NguoiDung   FOREIGN KEY (MaKhachHang)       REFERENCES NguoiDung(MaNguoiDung);

-- TÀI KHOẢN
ALTER TABLE TaiKhoan
    ADD CONSTRAINT FK_TaiKhoan_NguoiDung    FOREIGN KEY (MaNguoiDung)       REFERENCES NguoiDung(MaNguoiDung);

-- PHÒNG
ALTER TABLE Phong
    ADD CONSTRAINT FK_Phong_ChiNhanh        FOREIGN KEY (MaChiNhanh)        REFERENCES ChiNhanh(MaChiNhanh),
        CONSTRAINT FK_Phong_LoaiPhong       FOREIGN KEY (MaLoaiPhong)       REFERENCES LoaiPhong(MaLoaiPhong);

-- GIƯỜNG
ALTER TABLE Giuong
    ADD CONSTRAINT FK_Giuong_Phong          FOREIGN KEY (MaPhong)           REFERENCES Phong(MaPhong);

-- PHIẾU ĐĂNG KÝ
ALTER TABLE PhieuDangKy
    ADD CONSTRAINT FK_PDK_KhachHang         FOREIGN KEY (MaKhachHang)       REFERENCES KhachHang(MaKhachHang),
        CONSTRAINT FK_PDK_NhanVienSale      FOREIGN KEY (MaNhanVienSale)    REFERENCES NhanVien(MaNhanVien);

-- LỊCH XEM PHÒNG
ALTER TABLE LichXemPhong
ADD CONSTRAINT FK_LXP_PhieuDangKy       FOREIGN KEY (MaDangKy)          REFERENCES PhieuDangKy(MaDangKy);

-- CHI TIẾT XEM PHÒNG
ALTER TABLE ChiTietXemPhong
    ADD CONSTRAINT FK_CTXP_LichXem          FOREIGN KEY (MaDangKy, STTLich) REFERENCES LichXemPhong(MaDangKy, STTLich),
        CONSTRAINT FK_CTXP_Phong			FOREIGN KEY (MaPhong) REFERENCES Phong(MaPhong);

-- PHIẾU ĐẶT CỌC
ALTER TABLE PhieuDatCoc
    ADD CONSTRAINT FK_PDC_PhieuDangKy       FOREIGN KEY (MaPhieuYeuCauDangKy)   REFERENCES PhieuDangKy(MaDangKy),
        CONSTRAINT FK_PDC_KhachHang         FOREIGN KEY (MaKhachHang)           REFERENCES KhachHang(MaKhachHang),
        CONSTRAINT FK_PDC_NhanVienKeToan    FOREIGN KEY (MaNhanVienKeToan)      REFERENCES NhanVien(MaNhanVien);

-- HỢP ĐỒNG THUÊ
ALTER TABLE HopDongThue
    ADD CONSTRAINT FK_HDT_PhieuCoc          FOREIGN KEY (MaPhieuCoc)            REFERENCES PhieuDatCoc(MaPhieuDatCoc),
        CONSTRAINT FK_HDT_KhachHang         FOREIGN KEY (MaKhachHang)           REFERENCES KhachHang(MaKhachHang),
        CONSTRAINT FK_HDT_NhanVienQuanLy    FOREIGN KEY (MaNhanVienQuanLy)      REFERENCES NhanVien(MaNhanVien);

-- DỊCH VỤ HỢP ĐỒNG
ALTER TABLE DichVuHopDong
    ADD CONSTRAINT FK_DVHD_DichVu           FOREIGN KEY (MaDichVu)          REFERENCES DichVu(MaDichVu),
        CONSTRAINT FK_DVHD_HopDong          FOREIGN KEY (MaHopDong)         REFERENCES HopDongThue(MaHopDong);

-- THÀNH VIÊN HỢP ĐỒNG
ALTER TABLE ThanhVienHopDong
    ADD CONSTRAINT FK_TVHD_HopDong          FOREIGN KEY (MaHopDong)         REFERENCES HopDongThue(MaHopDong);

-- TÀI SẢN
ALTER TABLE TaiSan
    ADD CONSTRAINT FK_TaiSan_Phong          FOREIGN KEY (MaPhong)           REFERENCES Phong(MaPhong);

-- BIÊN BẢN BÀN GIAO
ALTER TABLE BienBanBanGiao
    ADD CONSTRAINT FK_BBBG_HopDong          FOREIGN KEY (MaHopDong)             REFERENCES HopDongThue(MaHopDong),
        CONSTRAINT FK_BBBG_NhanVienQuanLy   FOREIGN KEY (MaNhanVienQuanLy)      REFERENCES NhanVien(MaNhanVien);

-- CHI TIẾT BÀN GIAO
ALTER TABLE ChiTietBanGiao
    ADD CONSTRAINT FK_CTBG_BienBan          FOREIGN KEY (MaBienBan)         REFERENCES BienBanBanGiao(MaBienBan),
	CONSTRAINT FK_CTBG_TaiSan				FOREIGN KEY (MaPhong, MaTaiSan) REFERENCES TaiSan(MaPhong, MaTaiSan);

-- PHIẾU GHI CHỈ SỐ
ALTER TABLE PhieuGhiChiSo
    ADD CONSTRAINT FK_PGCS_Phong            FOREIGN KEY (MaPhong)               REFERENCES Phong(MaPhong),
        CONSTRAINT FK_PGCS_NhanVienQuanLy   FOREIGN KEY (MaNhanVienQuanLy)      REFERENCES NhanVien(MaNhanVien);

-- HÓA ĐƠN
ALTER TABLE HoaDon
    ADD CONSTRAINT FK_HD_HopDong            FOREIGN KEY (MaHopDong)         REFERENCES HopDongThue(MaHopDong),
        CONSTRAINT FK_HD_NhanVienKeToan     FOREIGN KEY (MaNhanVienKeToan)  REFERENCES NhanVien(MaNhanVien);

-- CHI TIẾT HÓA ĐƠN
ALTER TABLE ChiTietHoaDon
    ADD CONSTRAINT FK_CTHD_HoaDon           FOREIGN KEY (MaHoaDon)          REFERENCES HoaDon(MaHoaDon),
CONSTRAINT FK_CTHD_DichVuHD         FOREIGN KEY (MaChiTietDVHD)     REFERENCES DichVuHopDong(MaChiTietDVHD),
        CONSTRAINT FK_CTHD_PhieuGhi         FOREIGN KEY (MaPhieuGhi)        REFERENCES PhieuGhiChiSo(MaPhieuGhi);

-- PHIẾU TRẢ PHÒNG
ALTER TABLE PhieuTraPhong
    ADD CONSTRAINT FK_PTP_HopDong           FOREIGN KEY (MaHopDong)         REFERENCES HopDongThue(MaHopDong),
        CONSTRAINT FK_PTP_PhieuDatCoc       FOREIGN KEY (MaPhieuDatCoc)     REFERENCES PhieuDatCoc(MaPhieuDatCoc);

-- BIÊN BẢN KIỂM TRA PHÒNG
ALTER TABLE BienBanKiemTraPhong
    ADD CONSTRAINT FK_BBKT_PhieuTra         FOREIGN KEY (MaPhieuTra)        REFERENCES PhieuTraPhong(MaPhieuTra),
        CONSTRAINT FK_BBKT_NhanVienQL       FOREIGN KEY (MaNhanVienQL)      REFERENCES NhanVien(MaNhanVien);

-- CHI TIẾT HƯ HỎNG
ALTER TABLE ChiTietHuHong
    ADD CONSTRAINT FK_CTHH_BienBanKT        FOREIGN KEY (MaBienBanKT)       REFERENCES BienBanKiemTraPhong(MaBienBanKT),
        CONSTRAINT FK_CTHH_TaiSan			FOREIGN KEY (MaPhong, MaTaiSan) REFERENCES TaiSan(MaPhong, MaTaiSan);

-- ĐỐI SOÁT
ALTER TABLE DoiSoat
    ADD CONSTRAINT FK_DS_PhieuTra           FOREIGN KEY (MaPhieuTra)            REFERENCES PhieuTraPhong(MaPhieuTra),
        CONSTRAINT FK_DS_NhanVienKeToan     FOREIGN KEY (MaNhanVienKeToan)      REFERENCES NhanVien(MaNhanVien),
        CONSTRAINT FK_DS_QuyDinhHoanCoc     FOREIGN KEY (MaQuyDinhHoanCoc)      REFERENCES QuyDinhHoanCoc(MaQuyDinhHoanCoc);

-- YÊU CẦU SỬA CHỮA
ALTER TABLE YeuCauSuaChua
    ADD CONSTRAINT FK_YCSC_HopDong          FOREIGN KEY (MaHopDong)             REFERENCES HopDongThue(MaHopDong),
        CONSTRAINT FK_YCSC_TaiSan			FOREIGN KEY (MaPhong, MaTaiSan)		REFERENCES TaiSan(MaPhong, MaTaiSan),
        CONSTRAINT FK_YCSC_NhanVienQuanLy   FOREIGN KEY (MaNhanVienQuanLy)      REFERENCES NhanVien(MaNhanVien);

-- BIÊN BẢN VI PHẠM
ALTER TABLE BienBanViPham
    ADD CONSTRAINT FK_BBVP_HopDong          FOREIGN KEY (MaHopDong)             REFERENCES HopDongThue(MaHopDong),
        CONSTRAINT FK_BBVP_KhachHang		FOREIGN KEY (MaKhachHang)			REFERENCES KhachHang(MaKhachHang),
        CONSTRAINT FK_BBVP_DieuKhoanViPham  FOREIGN KEY (MaDieuKhoan)			REFERENCES DieuKhoanViPham(MaDieuKhoan);


