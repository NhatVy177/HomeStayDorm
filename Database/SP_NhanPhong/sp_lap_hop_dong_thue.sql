
USE HOMEDORM4;
GO

-- ============================================================
-- PHẦN 0: ALTER TABLE thêm cột DonGiaApDung vào DichVuHopDong
-- (đề xuất theo Use Case – ghi lại đơn giá tại thời điểm lập HĐ)
-- ============================================================
-- Kiểm tra trước khi ALTER để script có thể chạy nhiều lần
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.DichVuHopDong')
      AND name = N'DonGiaApDung'
)
BEGIN
    ALTER TABLE DichVuHopDong
    ADD DonGiaApDung DECIMAL(15,2) NULL;

    PRINT N'Đã thêm cột DonGiaApDung vào DichVuHopDong.';
END
ELSE
BEGIN
    PRINT N'Cột DonGiaApDung đã tồn tại trong DichVuHopDong – bỏ qua ALTER.';
END
GO

-- ============================================================
-- PHẦN 1: TABLE-VALUED PARAMETER TYPES
-- ============================================================

-- ---- TYPE01: TVP_ThanhVienHopDong ----
-- Dùng để truyền danh sách thành viên từ BUS xuống SP
IF TYPE_ID(N'dbo.TVP_ThanhVienHopDong') IS NOT NULL
BEGIN
    -- Không thể DROP TYPE nếu đang được dùng bởi SP.
    -- Nếu cần tái tạo: DROP các SP dùng type này trước, DROP TYPE, rồi CREATE lại.
    PRINT N'TYPE TVP_ThanhVienHopDong đã tồn tại – bỏ qua CREATE TYPE.';
END
ELSE
BEGIN
    EXEC (N'
    CREATE TYPE dbo.TVP_ThanhVienHopDong AS TABLE (
        HoTen       NVARCHAR(100)   NOT NULL,
        NgaySinh    DATE            NULL,
        GioiTinh    NVARCHAR(4)     NULL,   -- N''Nam'' | N''Nữ''
        CCCD        VARCHAR(20)     NULL,
        SDT         VARCHAR(20)     NULL,
        Email       VARCHAR(100)    NULL,
        QuocTich    NVARCHAR(50)    NULL
    );');
    PRINT N'Đã tạo TYPE TVP_ThanhVienHopDong.';
END
GO

-- ---- TYPE02: TVP_DichVuHopDong ----
-- Dùng để truyền danh sách dịch vụ đã chọn từ BUS xuống SP
IF TYPE_ID(N'dbo.TVP_DichVuHopDong') IS NOT NULL
BEGIN
    PRINT N'TYPE TVP_DichVuHopDong đã tồn tại – bỏ qua CREATE TYPE.';
END
ELSE
BEGIN
    EXEC (N'
    CREATE TYPE dbo.TVP_DichVuHopDong AS TABLE (
        MaDichVu    VARCHAR(6)      NOT NULL,
        GhiChu      NVARCHAR(MAX)   NULL
    );');
    PRINT N'Đã tạo TYPE TVP_DichVuHopDong.';
END
GO

-- ============================================================
-- PHẦN 2: STORED PROCEDURES
-- ============================================================

-- ============================================================
-- SP01 – SP_TraCuuPhieuCocLapHopDong
-- Màn hình : Bước 1 – Tra cứu phiếu cọc
-- Mục đích : Tìm kiếm và lọc danh sách phiếu đặt cọc để nhân
--            viên chọn ra một phiếu cần lập hợp đồng.
-- Input    : @TuKhoa        – mã phiếu / tên / SĐT khách hàng
--            @TrangThaiCoc  – lọc theo trạng thái cọc (NULL = tất cả)
--            @NgayTao       – lọc theo ngày tạo phiếu cọc (NULL = tất cả)
-- Output   : Result set danh sách phiếu cọc
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_TraCuuPhieuCocLapHopDong
    @TuKhoa         NVARCHAR(100)   = NULL,
    @TrangThaiCoc   NVARCHAR(20)    = NULL,
    @NgayTao        DATE            = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Chuẩn hóa từ khóa tìm kiếm (LIKE pattern)
    DECLARE @TuKhoaLike NVARCHAR(104) = NULL;
    IF @TuKhoa IS NOT NULL AND LTRIM(RTRIM(@TuKhoa)) <> N''
        SET @TuKhoaLike = N'%' + LTRIM(RTRIM(@TuKhoa)) + N'%';

    SELECT
        pdc.MaPhieuDatCoc,
        pdc.ThoiDiemDatCoc,
        nd.HoTen                                        AS HoTenKhachHang,
        nd.SDT,
        -- ViTriThue: ghép phòng – giường nếu ghép giường (gộp các giường của cùng phiếu cọc)
        CASE
            WHEN MAX(ctdc.MaGiuong) IS NOT NULL
                THEN MAX(ctdc.MaPhong) + N'-' + STRING_AGG(ctdc.MaGiuong, ', ') WITHIN GROUP (ORDER BY ctdc.MaGiuong)
            ELSE MAX(ctdc.MaPhong)
        END                                             AS ViTriThue,
        SUM(ctdc.GiaThue)                               AS TongGiaThue,
        pdc.ThoiGianNhanPhong,
        pdc.HinhThucThue,
        pdc.TrangThaiCoc,
        pdc.TrangThaiThanhToan,
        hs.MaHoSoCuTru,
        ISNULL(hs.TrangThaiHoSo, N'Chưa cập nhật')      AS TrangThaiHoSoCuTru,
        hs.NgayDuyet                                    AS NgayDuyetCuTru,
        -- CoTheLapHopDong = 1 khi đủ điều kiện cọc, thanh toán, chưa có HĐ và đã duyệt cư trú
        CASE
            WHEN pdc.TrangThaiCoc       = N'Hiệu lực'
             AND pdc.TrangThaiThanhToan = N'Đã TT'
             AND hs.TrangThaiHoSo       = N'Đã duyệt cư trú'
             AND NOT EXISTS (
                    SELECT 1 FROM dbo.HopDongThue hdt
                    WHERE hdt.MaPhieuCoc = pdc.MaPhieuDatCoc
                )
            THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END                                             AS CoTheLapHopDong
    FROM        dbo.PhieuDatCoc     pdc
    JOIN        dbo.KhachHang       kh   ON kh.MaKhachHang  = pdc.MaKhachHang
    JOIN        dbo.NguoiDung       nd   ON nd.MaNguoiDung   = kh.MaKhachHang
    JOIN        dbo.ChiTietDatCoc   ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    LEFT JOIN   dbo.HoSoCuTru       hs   ON hs.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    WHERE
        -- Lọc từ khóa
        (
            @TuKhoaLike IS NULL
            OR pdc.MaPhieuDatCoc    LIKE @TuKhoaLike
            OR nd.HoTen             LIKE @TuKhoaLike
            OR nd.SDT               LIKE @TuKhoaLike
        )
        -- Lọc trạng thái cọc
        AND (@TrangThaiCoc IS NULL OR pdc.TrangThaiCoc = @TrangThaiCoc)
        -- Lọc ngày tạo
        AND (@NgayTao IS NULL OR CAST(pdc.ThoiDiemDatCoc AS DATE) = @NgayTao)
    GROUP BY
        pdc.MaPhieuDatCoc,
        pdc.ThoiDiemDatCoc,
        nd.HoTen,
        nd.SDT,
        pdc.ThoiGianNhanPhong,
        pdc.HinhThucThue,
        pdc.TrangThaiCoc,
        pdc.TrangThaiThanhToan,
        hs.MaHoSoCuTru,
        hs.TrangThaiHoSo,
        hs.NgayDuyet
    ORDER BY pdc.ThoiDiemDatCoc DESC;
END;
GO

-- ---- Test SP01 ----
-- EXEC dbo.SP_TraCuuPhieuCocLapHopDong @TuKhoa = N'Tuấn';
-- EXEC dbo.SP_TraCuuPhieuCocLapHopDong @TrangThaiCoc = N'Hiệu lực';
-- EXEC dbo.SP_TraCuuPhieuCocLapHopDong;  -- Lấy tất cả

-- ============================================================
-- SP02 – SP_LayChiTietPhieuCocLapHopDong
-- Màn hình : Bước 2 – Kiểm tra điều kiện (phần hiển thị thông tin)
-- Mục đích : Lấy toàn bộ thông tin chi tiết của một phiếu đặt cọc
--            để hiển thị ở các bước tiếp theo.
-- Input    : @MaPhieuDatCoc
-- Output   : Result set chi tiết phiếu cọc (1 dòng / 1 dòng chi tiết)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_LayChiTietPhieuCocLapHopDong
    @MaPhieuDatCoc  VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        pdc.MaPhieuDatCoc,
        pdc.ThoiDiemDatCoc,
        pdc.ThoiGianNhanPhong,
        pdc.HinhThucThue,
        pdc.TrangThaiCoc,
        pdc.TrangThaiThanhToan,
        pdc.SoTienCoc,
        pdc.MaKhachHang,
        nd.HoTen            AS HoTenKhachHang,
        nd.NgaySinh,
        nd.GioiTinh,
        nd.SDT,
        nd.Email,
        kh.CCCD,
        kh.QuocTich,
        p.MaPhong,
        p.TenPhong,
        ctdc.MaGiuong,
        p.GioiTinhChoPhep,
        lp.MaLoaiPhong,
        lp.TenLoaiPhong,
        lp.SucChuaToiDa,
        ctdc.GiaThue
    FROM        dbo.PhieuDatCoc     pdc
    JOIN        dbo.KhachHang       kh   ON kh.MaKhachHang  = pdc.MaKhachHang
    JOIN        dbo.NguoiDung       nd   ON nd.MaNguoiDung   = kh.MaKhachHang
    JOIN        dbo.ChiTietDatCoc   ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN        dbo.Phong           p    ON p.MaPhong         = ctdc.MaPhong
    JOIN        dbo.LoaiPhong       lp   ON lp.MaLoaiPhong    = p.MaLoaiPhong
    LEFT JOIN   dbo.Giuong          g    ON g.MaPhong         = ctdc.MaPhong
                                        AND g.MaGiuong        = ctdc.MaGiuong
    WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;
    -- Nếu không tìm thấy → trả result set rỗng (BUS sẽ kiểm tra)
END;
GO

-- ---- Test SP02 ----
-- EXEC dbo.SP_LayChiTietPhieuCocLapHopDong @MaPhieuDatCoc = 'DC0001';

-- ============================================================
-- SP03 – SP_KiemTraDieuKienLapHopDong
-- Màn hình : Bước 2 – Kiểm tra điều kiện (checklist bên phải)
-- Mục đích : Kiểm tra phiếu cọc có đủ điều kiện lập hợp đồng.
--            Trả OUTPUT để BUS quyết định cho phép tiếp tục hay không.
-- Input    : @MaPhieuDatCoc
-- Output   : @HopLe BIT, @MaLoi INT, @ThongBao NVARCHAR(500)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_KiemTraDieuKienLapHopDong
    @MaPhieuDatCoc  VARCHAR(6),
    @HopLe          BIT             OUTPUT,
    @MaLoi          INT             OUTPUT,
    @ThongBao       NVARCHAR(500)   OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Khởi tạo output mặc định hợp lệ
    SET @HopLe    = 0;
    SET @MaLoi    = 0;
    SET @ThongBao = N'';

    BEGIN TRY
        -- [1] Phiếu cọc tồn tại?
        IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc)
        BEGIN
            SET @MaLoi    = -1;
            SET @ThongBao = N'Phiếu đặt cọc không tồn tại.';
            RETURN;
        END;

        DECLARE
            @TrangThaiCoc       NVARCHAR(20),
            @TrangThaiThanhToan NVARCHAR(20),
            @HinhThucThue       NVARCHAR(20);

        SELECT
            @TrangThaiCoc       = TrangThaiCoc,
            @TrangThaiThanhToan = TrangThaiThanhToan,
            @HinhThucThue       = HinhThucThue
        FROM dbo.PhieuDatCoc
        WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

        -- [2] Phiếu cọc còn hiệu lực?
        IF @TrangThaiCoc <> N'Hiệu lực'
        BEGIN
            SET @MaLoi    = -2;
            SET @ThongBao = N'Phiếu đặt cọc không còn hiệu lực (trạng thái: ' + @TrangThaiCoc + N').';
            RETURN;
        END;

        -- [3] Đã thanh toán?
        IF @TrangThaiThanhToan <> N'Đã TT'
        BEGIN
            SET @MaLoi    = -3;
            SET @ThongBao = N'Phiếu đặt cọc chưa được thanh toán (trạng thái: ' + @TrangThaiThanhToan + N').';
            RETURN;
        END;

        -- [4] Chưa lập hợp đồng?
        IF EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaPhieuCoc = @MaPhieuDatCoc)
        BEGIN
            SET @MaLoi    = -4;
            SET @ThongBao = N'Phiếu đặt cọc đã được lập hợp đồng.';
            RETURN;
        END;

        -- [5] Hồ sơ cư trú đã được quản lý duyệt?
        IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NULL
           OR NOT EXISTS (
                SELECT 1
                FROM dbo.HoSoCuTru
                WHERE MaPhieuDatCoc = @MaPhieuDatCoc
                  AND TrangThaiHoSo = N'Đã duyệt cư trú'
           )
        BEGIN
            SET @MaLoi    = -30;
            SET @ThongBao = N'Phiếu đặt cọc chưa có hồ sơ cư trú được quản lý duyệt. Vui lòng chờ duyệt cư trú trước khi lập hợp đồng.';
            RETURN;
        END;

        -- [6] Phòng/giường chưa bị hợp đồng hiệu lực khác chiếm
        IF @HinhThucThue = N'Nguyên phòng'
        BEGIN
            -- Kiểm tra theo phòng
            IF EXISTS (
                SELECT 1
                FROM        dbo.ChiTietDatCoc   ctdc
                JOIN        dbo.HopDongThue     hdt  ON hdt.MaPhieuCoc = ctdc.MaPhieuDatCoc
                                                     AND hdt.TrangThai   = N'Hiệu lực'
                JOIN        dbo.ChiTietDatCoc   ctdc2 ON ctdc2.MaPhieuDatCoc <> @MaPhieuDatCoc
                                                      AND ctdc2.MaPhong       = ctdc.MaPhong
                                                      AND ctdc2.MaGiuong      IS NULL
                JOIN        dbo.HopDongThue     hdt2 ON hdt2.MaPhieuCoc = ctdc2.MaPhieuDatCoc
                                                     AND hdt2.TrangThai   = N'Hiệu lực'
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
                  AND ctdc.MaGiuong IS NULL
            )
            BEGIN
                SET @MaLoi    = -5;
                SET @ThongBao = N'Phòng đã có hợp đồng hiệu lực khác.';
                RETURN;
            END;
        END
        ELSE -- Ghép giường
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM        dbo.ChiTietDatCoc   ctdc
                JOIN        dbo.ChiTietDatCoc   ctdc2 ON ctdc2.MaPhieuDatCoc <> @MaPhieuDatCoc
                                                      AND ctdc2.MaPhong       = ctdc.MaPhong
                                                      AND ctdc2.MaGiuong      = ctdc.MaGiuong
                JOIN        dbo.HopDongThue     hdt2 ON hdt2.MaPhieuCoc = ctdc2.MaPhieuDatCoc
                                                     AND hdt2.TrangThai   = N'Hiệu lực'
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
                  AND ctdc.MaGiuong IS NOT NULL
            )
            BEGIN
                SET @MaLoi    = -5;
                SET @ThongBao = N'Giường đã có hợp đồng hiệu lực khác.';
                RETURN;
            END;
        END;

        -- Tất cả điều kiện đều hợp lệ
        SET @HopLe    = 1;
        SET @MaLoi    = 0;
        SET @ThongBao = N'Phiếu đặt cọc hợp lệ. Có thể tiến hành lập hợp đồng.';

    END TRY
    BEGIN CATCH
        SET @HopLe    = 0;
        SET @MaLoi    = -99;
        SET @ThongBao = N'Lỗi hệ thống: ' + ERROR_MESSAGE();
    END CATCH;
END;
GO

-- ---- Test SP03 ----
/*
DECLARE @HopLe BIT, @MaLoi INT, @ThongBao NVARCHAR(500);
EXEC dbo.SP_KiemTraDieuKienLapHopDong
    @MaPhieuDatCoc = 'DC0001',
    @HopLe         = @HopLe    OUTPUT,
    @MaLoi         = @MaLoi    OUTPUT,
    @ThongBao      = @ThongBao OUTPUT;
SELECT @HopLe AS HopLe, @MaLoi AS MaLoi, @ThongBao AS ThongBao;
*/

-- ============================================================
-- SP04 – SP_LayDanhSachDichVu
-- Màn hình : Bước 4 – Thông tin & Dịch vụ
-- Mục đích : Trả danh sách dịch vụ cho nhân viên chọn.
--            Điện và Nước được đánh dấu BatBuoc = 1.
-- Input    : (không có)
-- Output   : Result set danh sách dịch vụ
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_LayDanhSachDichVu
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MaDichVu,
        TenDichVu,
        DonViTinh,
        DonGia,
        CASE
            WHEN TenDichVu LIKE N'%Điện%' OR TenDichVu LIKE N'%Nước%'
            THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS BatBuoc
    FROM dbo.DichVu
    ORDER BY
        CASE
            WHEN TenDichVu LIKE N'%Điện%' OR TenDichVu LIKE N'%Nước%' THEN 0
            ELSE 1
        END,
        TenDichVu;
END;
GO

-- ---- Test SP04 ----
-- EXEC dbo.SP_LayDanhSachDichVu;

-- ============================================================
-- SP05 – SP_KiemTraThanhVienHopDongTam
-- Màn hình : Bước 3 – Thành viên hợp đồng (kiểm tra trước khi lưu)
-- Mục đích : Validate danh sách thành viên tạm: giới tính, CCCD,
--            SĐT, sức chứa. Trả result set từng thành viên + kết quả.
-- Input    : @MaPhieuDatCoc, @DanhSachThanhVien TVP
-- Output   : Result set thành viên kèm TrangThaiKiemTra & LyDo
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_KiemTraThanhVienHopDongTam
    @MaPhieuDatCoc      VARCHAR(6),
    @DanhSachThanhVien  dbo.TVP_ThanhVienHopDong READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- Lấy thông tin phòng (giới tính, sức chứa) và hình thức thuê, số lượng giường đã đặt
    DECLARE
        @GioiTinhChoPhep    NVARCHAR(20),
        @SucChuaToiDa       INT,
        @HinhThucThue       NVARCHAR(20),
        @SoGiuongDat        INT;

    SELECT TOP 1
        @GioiTinhChoPhep = p.GioiTinhChoPhep,
        @SucChuaToiDa    = lp.SucChuaToiDa,
        @HinhThucThue    = pdc.HinhThucThue
    FROM        dbo.ChiTietDatCoc   ctdc
    JOIN        dbo.PhieuDatCoc     pdc  ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
    JOIN        dbo.Phong           p    ON p.MaPhong      = ctdc.MaPhong
    JOIN        dbo.LoaiPhong       lp   ON lp.MaLoaiPhong = p.MaLoaiPhong
    WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc;

    SELECT @SoGiuongDat = COUNT(*) 
    FROM dbo.ChiTietDatCoc 
    WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

    -- Đặt giới hạn số thành viên tối đa
    DECLARE @GioiHanThanhVien INT = @SucChuaToiDa;
    IF @HinhThucThue = N'Ghép giường'
        SET @GioiHanThanhVien = @SoGiuongDat;

    -- Validate từng thành viên + đánh dấu vượt giới hạn ngay tại result set 1
    ;WITH Validity AS (
        SELECT
            tv.HoTen, tv.NgaySinh, tv.GioiTinh, tv.CCCD, tv.SDT, tv.Email, tv.QuocTich,
            -- 1 = hợp lệ về cá nhân, 0 = không hợp lệ
            CASE
                WHEN ISNULL(LTRIM(RTRIM(tv.CCCD)), '') = ''             THEN 0
                WHEN ISNULL(LTRIM(RTRIM(tv.SDT)),  '') = ''             THEN 0
                WHEN @GioiTinhChoPhep = N'Nam' AND tv.GioiTinh = N'Nữ'  THEN 0
                WHEN @GioiTinhChoPhep = N'Nữ'  AND tv.GioiTinh = N'Nam' THEN 0
                ELSE 1
            END AS IsValid,
            -- Lý do từ chối cá nhân (NULL nếu hợp lệ)
            CASE
                WHEN ISNULL(LTRIM(RTRIM(tv.CCCD)), '') = ''             THEN N'Thiếu CCCD/Hộ chiếu'
                WHEN ISNULL(LTRIM(RTRIM(tv.SDT)),  '') = ''             THEN N'Thiếu số điện thoại'
                WHEN @GioiTinhChoPhep = N'Nam' AND tv.GioiTinh = N'Nữ'  THEN N'Phòng chỉ dành cho Nam – thành viên Nữ bị từ chối'
                WHEN @GioiTinhChoPhep = N'Nữ'  AND tv.GioiTinh = N'Nam' THEN N'Phòng chỉ dành cho Nữ – thành viên Nam bị từ chối'
                ELSE NULL
            END AS LyDoCaNhan
        FROM @DanhSachThanhVien tv
    ),
    Ranked AS (
        SELECT *,
            -- Đánh số thứ tự riêng trong nhóm hợp lệ (IsValid=1)
            CASE WHEN IsValid = 1
                 THEN ROW_NUMBER() OVER (PARTITION BY IsValid ORDER BY HoTen)
                 ELSE NULL
            END AS ValidRank
        FROM Validity
    )
    SELECT
        HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich,
        -- Trạng thái cuối: bị từ chối nếu sai cá nhân HOẶC vượt giới hạn
        CASE
            WHEN IsValid = 0                         THEN N'Bị từ chối'
            WHEN ValidRank > @GioiHanThanhVien       THEN N'Bị từ chối'
            ELSE N'Đang ở'
        END AS TrangThaiKiemTra,
        -- Lý do
        CASE
            WHEN IsValid = 0                         THEN LyDoCaNhan
            WHEN ValidRank > @GioiHanThanhVien       THEN 
                CASE 
                    WHEN @HinhThucThue = N'Ghép giường' 
                    THEN N'Vượt số giường đã đặt cọc (' + CAST(@GioiHanThanhVien AS NVARCHAR) + N' giường)'
                    ELSE N'Vượt sức chứa tối đa (' + CAST(@GioiHanThanhVien AS NVARCHAR) + N' người)'
                END
            ELSE NULL
        END AS LyDo
    FROM Ranked;

    -- Thống kê tóm tắt (result set 2)
    SELECT
        COUNT(*)                                                        AS TongThanhVien,
        SUM(CASE
                WHEN ISNULL(LTRIM(RTRIM(tv.CCCD)), '') = ''            THEN 0
                WHEN ISNULL(LTRIM(RTRIM(tv.SDT)),  '') = ''            THEN 0
                WHEN @GioiTinhChoPhep = N'Nam' AND tv.GioiTinh = N'Nữ' THEN 0
                WHEN @GioiTinhChoPhep = N'Nữ'  AND tv.GioiTinh = N'Nam' THEN 0
                ELSE 1
            END)                                                        AS ThanhVienHopLe,
        @GioiHanThanhVien                                               AS SucChuaToiDa,
        CASE
            WHEN SUM(CASE
                        WHEN ISNULL(LTRIM(RTRIM(tv.CCCD)), '') = ''             THEN 0
                        WHEN ISNULL(LTRIM(RTRIM(tv.SDT)),  '') = ''             THEN 0
                        WHEN @GioiTinhChoPhep = N'Nam' AND tv.GioiTinh = N'Nữ' THEN 0
                        WHEN @GioiTinhChoPhep = N'Nữ'  AND tv.GioiTinh = N'Nam' THEN 0
                        ELSE 1
                    END) > @GioiHanThanhVien
            THEN 
                CASE 
                    WHEN @HinhThucThue = N'Ghép giường' THEN N'Vượt số giường'
                    ELSE N'Vượt sức chứa'
                END
            WHEN SUM(CASE
                        WHEN ISNULL(LTRIM(RTRIM(tv.CCCD)), '') = ''             THEN 0
                        WHEN ISNULL(LTRIM(RTRIM(tv.SDT)),  '') = ''             THEN 0
                        WHEN @GioiTinhChoPhep = N'Nam' AND tv.GioiTinh = N'Nữ' THEN 0
                        WHEN @GioiTinhChoPhep = N'Nữ'  AND tv.GioiTinh = N'Nam' THEN 0
                        ELSE 1
                    END) = 0
            THEN N'Không có thành viên hợp lệ'
            ELSE N'Phù hợp'
        END                                                             AS KetLuan
    FROM @DanhSachThanhVien tv;
END;
GO

-- ---- Test SP05 ----
/*
DECLARE @TV dbo.TVP_ThanhVienHopDong;
INSERT INTO @TV(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES
    (N'Nguyễn Văn An',   '1995-05-15', N'Nam', '038201089988', '0901234567', 'an@gmail.com',   N'Việt Nam'),
    (N'Trần Thị Bình',   '1997-08-20', N'Nữ',  '038201012345', '0909876543', 'binh@gmail.com', N'Việt Nam'),
    (N'Lê Văn Cường',    '1992-12-10', N'Nam', '038201056789', '0988776655', 'cuong@gmail.com',N'Việt Nam');

EXEC dbo.SP_KiemTraThanhVienHopDongTam
    @MaPhieuDatCoc     = 'DC0001',
    @DanhSachThanhVien = @TV;
*/

-- ============================================================
-- SP06 – SP_LapHopDongThue
-- Màn hình : Bước 5 – Xác nhận & Lưu hợp đồng
-- Mục đích : SP chính – tạo hợp đồng và toàn bộ dữ liệu liên quan
--            trong một TRANSACTION.  Có UPDLOCK/HOLDLOCK để tránh
--            race condition giữa 2 nhân viên sale.
-- Input    : Xem bên dưới
-- Output   : @MaHopDong, @MaLoi, @ThongBao
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_LapHopDongThue
    -- Thông tin từ giao diện
    @MaPhieuDatCoc      VARCHAR(6),
    @MaNhanVienQuanLy   VARCHAR(6),
    @NgayBatDau         DATE,
    @NgayKetThuc        DATE,
    @KyThanhToan            NVARCHAR(20),   -- N'Hàng tháng' | N'Hàng quý'
    @KhachHangDaXacNhan     BIT,            -- checkbox 1: Khách hàng đã kiểm tra và đồng ý ký HĐ
    @NhanVienDaXacNhan      BIT,            -- checkbox 2: Nhân viên Sale xác nhận thông tin chính xác
    -- Danh sách thành viên và dịch vụ qua TVP
    @DanhSachThanhVien  dbo.TVP_ThanhVienHopDong READONLY,
    @DanhSachDichVu     dbo.TVP_DichVuHopDong    READONLY,
    -- Output
    @MaHopDong          VARCHAR(6)          OUTPUT,
    @MaLoi              INT                 OUTPUT,
    @ThongBao           NVARCHAR(500)       OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Khởi tạo
    SET @MaHopDong = NULL;
    SET @MaLoi     = 0;
    SET @ThongBao  = N'';

    BEGIN TRY
        BEGIN TRAN;

        -- =====================================================
        -- LOCK & ĐỌC thông tin phiếu cọc (chống race condition)
        -- =====================================================
        DECLARE
            @TrangThaiCoc       NVARCHAR(20),
            @TrangThaiThanhToan NVARCHAR(20),
            @HinhThucThue       NVARCHAR(20),
            @MaKhachHang        VARCHAR(6);

        SELECT
            @TrangThaiCoc       = pdc.TrangThaiCoc,
            @TrangThaiThanhToan = pdc.TrangThaiThanhToan,
            @HinhThucThue       = pdc.HinhThucThue,
            @MaKhachHang        = pdc.MaKhachHang
        FROM dbo.PhieuDatCoc pdc WITH (UPDLOCK, HOLDLOCK)
        WHERE pdc.MaPhieuDatCoc = @MaPhieuDatCoc;

        -- -----------------------------------------------
        -- BƯỚC KT-1: Phiếu cọc tồn tại?
        -- -----------------------------------------------
        IF @TrangThaiCoc IS NULL
        BEGIN
            SET @MaLoi    = -1;
            SET @ThongBao = N'Phiếu đặt cọc không tồn tại.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-2: Còn hiệu lực?
        -- -----------------------------------------------
        IF @TrangThaiCoc <> N'Hiệu lực'
        BEGIN
            SET @MaLoi    = -2;
            SET @ThongBao = N'Phiếu đặt cọc không còn hiệu lực.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-3: Đã thanh toán?
        -- -----------------------------------------------
        IF @TrangThaiThanhToan <> N'Đã TT'
        BEGIN
            SET @MaLoi    = -3;
            SET @ThongBao = N'Phiếu đặt cọc chưa thanh toán.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-4: Chưa có hợp đồng?
        -- -----------------------------------------------
        IF EXISTS (
            SELECT 1 FROM dbo.HopDongThue WITH (UPDLOCK, HOLDLOCK)
            WHERE MaPhieuCoc = @MaPhieuDatCoc
        )
        BEGIN
            SET @MaLoi    = -4;
            SET @ThongBao = N'Phiếu đặt cọc đã được lập hợp đồng.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-5: Hồ sơ cư trú đã được quản lý duyệt?
        -- -----------------------------------------------
        IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NULL
           OR NOT EXISTS (
                SELECT 1
                FROM dbo.HoSoCuTru
                WHERE MaPhieuDatCoc = @MaPhieuDatCoc
                  AND TrangThaiHoSo = N'Đã duyệt cư trú'
           )
        BEGIN
            SET @MaLoi    = -30;
            SET @ThongBao = N'Phiếu đặt cọc chưa có hồ sơ cư trú được quản lý duyệt. Vui lòng chờ duyệt cư trú trước khi lập hợp đồng.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-6: Ngày hợp lệ?
        -- -----------------------------------------------
        IF @NgayBatDau IS NULL OR @NgayKetThuc IS NULL OR @NgayKetThuc <= @NgayBatDau
        BEGIN
            SET @MaLoi    = -5;
            SET @ThongBao = N'Ngày bắt đầu / kết thúc hợp đồng không hợp lệ.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-7: Kỳ thanh toán hợp lệ?
        -- -----------------------------------------------
        IF @KyThanhToan NOT IN (N'Hàng tháng', N'Hàng quý')
        BEGIN
            SET @MaLoi    = -6;
            SET @ThongBao = N'Kỳ thanh toán không hợp lệ. Chọn ''Hàng tháng'' hoặc ''Hàng quý''.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-8: 2 checkbox xác nhận trên màn 5
        --   Checkbox 1: Khách hàng đã kiểm tra thông tin và đồng ý ký HĐ
        --   Checkbox 2: Nhân viên Sale xác nhận thông tin HĐ là chính xác
        -- -----------------------------------------------
        IF ISNULL(@KhachHangDaXacNhan, 0) = 0
        BEGIN
            SET @MaLoi    = -7;
            SET @ThongBao = N'Khách hàng chưa xác nhận đồng ý ký hợp đồng.';
            ROLLBACK TRAN;
            RETURN;
        END;

        IF ISNULL(@NhanVienDaXacNhan, 0) = 0
        BEGIN
            SET @MaLoi    = -7;
            SET @ThongBao = N'Nhân viên Sale chưa xác nhận thông tin hợp đồng là chính xác.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-8: Nhân viên quản lý hợp lệ?
        -- -----------------------------------------------
        IF NOT EXISTS (SELECT 1 FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVienQuanLy)
        BEGIN
            SET @MaLoi    = -12;
            SET @ThongBao = N'Nhân viên quản lý không tồn tại hoặc không hợp lệ.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-9: Kiểm tra xung đột phòng/giường
        -- -----------------------------------------------
        IF @HinhThucThue = N'Nguyên phòng'
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM        dbo.ChiTietDatCoc   ctdc
                JOIN        dbo.ChiTietDatCoc   ctdc2 ON ctdc2.MaPhong         = ctdc.MaPhong
                                                      AND ctdc2.MaGiuong        IS NULL
                                                      AND ctdc2.MaPhieuDatCoc  <> @MaPhieuDatCoc
                JOIN        dbo.HopDongThue     hdt2  ON hdt2.MaPhieuCoc       = ctdc2.MaPhieuDatCoc
                                                      AND hdt2.TrangThai        = N'Hiệu lực'
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
                  AND ctdc.MaGiuong      IS NULL
            )
            BEGIN
                SET @MaLoi    = -8;
                SET @ThongBao = N'Phòng đã có hợp đồng hiệu lực khác.';
                ROLLBACK TRAN;
                RETURN;
            END;
        END
        ELSE
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM        dbo.ChiTietDatCoc   ctdc
                JOIN        dbo.ChiTietDatCoc   ctdc2 ON ctdc2.MaPhong         = ctdc.MaPhong
                                                      AND ctdc2.MaGiuong        = ctdc.MaGiuong
                                                      AND ctdc2.MaPhieuDatCoc  <> @MaPhieuDatCoc
                JOIN        dbo.HopDongThue     hdt2  ON hdt2.MaPhieuCoc       = ctdc2.MaPhieuDatCoc
                                                      AND hdt2.TrangThai        = N'Hiệu lực'
                WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
                  AND ctdc.MaGiuong      IS NOT NULL
            )
            BEGIN
                SET @MaLoi    = -8;
                SET @ThongBao = N'Giường đã có hợp đồng hiệu lực khác.';
                ROLLBACK TRAN;
                RETURN;
            END;
        END;

        -- (KT-10 đã bỏ: UI màn 4 auto-chọn Điện & Nước, người dùng không thể bỏ chọn)


        -- -----------------------------------------------
        -- BƯỚC KT-11: Dịch vụ truyền vào phải tồn tại trong bảng DichVu
        -- -----------------------------------------------
        IF EXISTS (
            SELECT 1
            FROM @DanhSachDichVu dv_tvp
            WHERE NOT EXISTS (
                SELECT 1 FROM dbo.DichVu dv WHERE dv.MaDichVu = dv_tvp.MaDichVu
            )
        )
        BEGIN
            SET @MaLoi    = -11;
            SET @ThongBao = N'Có dịch vụ không tồn tại trong hệ thống.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- -----------------------------------------------
        -- BƯỚC KT-12: Kiểm tra thành viên
        -- -----------------------------------------------
        -- Lấy thông tin phòng để validate
        DECLARE
            @GioiTinhChoPhep    NVARCHAR(20),
            @SucChuaToiDa       INT;

        SELECT TOP 1
            @GioiTinhChoPhep = p.GioiTinhChoPhep,
            @SucChuaToiDa    = lp.SucChuaToiDa
        FROM        dbo.ChiTietDatCoc   ctdc
        JOIN        dbo.Phong           p    ON p.MaPhong      = ctdc.MaPhong
        JOIN        dbo.LoaiPhong       lp   ON lp.MaLoaiPhong = p.MaLoaiPhong
        WHERE ctdc.MaPhieuDatCoc = @MaPhieuDatCoc;

        -- Nếu thuê nguyên phòng: danh sách không được rỗng
        IF @HinhThucThue = N'Nguyên phòng' AND NOT EXISTS (SELECT 1 FROM @DanhSachThanhVien)
        BEGIN
            SET @MaLoi    = -10;
            SET @ThongBao = N'Thuê nguyên phòng nhưng danh sách thành viên trống.';
            ROLLBACK TRAN;
            RETURN;
        END;

        -- Đếm số thành viên hợp lệ (đúng giới tính + có CCCD + có SĐT)
        DECLARE @SoThanhVienHopLe INT;
        SELECT @SoThanhVienHopLe = COUNT(*)
        FROM @DanhSachThanhVien tv
        WHERE
            ISNULL(LTRIM(RTRIM(tv.CCCD)), '') <> ''
            AND ISNULL(LTRIM(RTRIM(tv.SDT)),  '') <> ''
            AND (
                @GioiTinhChoPhep = N'Không phân biệt'
                OR (@GioiTinhChoPhep = N'Nam' AND tv.GioiTinh = N'Nam')
                OR (@GioiTinhChoPhep = N'Nữ'  AND tv.GioiTinh = N'Nữ')
            );

        -- Nếu TVP rỗng và ghép giường → tự tạo 1 thành viên từ khách hàng đại diện
        -- (đặt cờ xử lý bên dưới)
        DECLARE @TuTaoThanhVien BIT = 0;
        IF NOT EXISTS (SELECT 1 FROM @DanhSachThanhVien)
        BEGIN
            IF @HinhThucThue = N'Ghép giường'
                SET @TuTaoThanhVien = 1;
            -- Nguyên phòng đã bắt lỗi bên trên
        END;

        -- Nếu không tự tạo → kiểm tra số thành viên hợp lệ
        IF @TuTaoThanhVien = 0
        BEGIN
            IF @SoThanhVienHopLe = 0
            BEGIN
                SET @MaLoi    = -10;
                SET @ThongBao = N'Không có thành viên hợp lệ (sai giới tính hoặc thiếu CCCD/SĐT).';
                ROLLBACK TRAN;
                RETURN;
            END;

            -- Lấy số giường đã cọc để so sánh
            DECLARE @SoGiuongCoc INT;
            SELECT @SoGiuongCoc = COUNT(*) FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

            IF @HinhThucThue = N'Ghép giường' AND @SoThanhVienHopLe > @SoGiuongCoc
            BEGIN
                SET @MaLoi    = -10;
                SET @ThongBao = N'Số thành viên hợp lệ (' + CAST(@SoThanhVienHopLe AS NVARCHAR)
                                + N') vượt quá số giường đã đặt cọc (' + CAST(@SoGiuongCoc AS NVARCHAR) + N' giường).';
                ROLLBACK TRAN;
                RETURN;
            END;

            IF @HinhThucThue = N'Nguyên phòng' AND @SoThanhVienHopLe > @SucChuaToiDa
            BEGIN
                SET @MaLoi    = -10;
                SET @ThongBao = N'Số thành viên hợp lệ (' + CAST(@SoThanhVienHopLe AS NVARCHAR)
                                + N') vượt sức chứa tối đa của phòng/căn hộ (' + CAST(@SucChuaToiDa AS NVARCHAR) + N' người).';
                ROLLBACK TRAN;
                RETURN;
            END;
        END;

        -- =====================================================
        -- INSERT DỮ LIỆU
        -- =====================================================

        -- -----------------------------------------------
        -- BƯỚC INSERT-1: Sinh mã hợp đồng HD0001, HD0002 ...
        -- -----------------------------------------------
        DECLARE @SoMaMax INT;
        SELECT @SoMaMax = ISNULL(MAX(CAST(SUBSTRING(MaHopDong, 3, 4) AS INT)), 0)
        FROM dbo.HopDongThue
        WHERE MaHopDong LIKE 'HD[0-9][0-9][0-9][0-9]';

        SET @MaHopDong = 'HD' + RIGHT('0000' + CAST(@SoMaMax + 1 AS VARCHAR(4)), 4);

        -- -----------------------------------------------
        -- BƯỚC INSERT-2: Lấy thông tin từ ChiTietDatCoc (chỉ lấy số giường tương ứng số thành viên được duyệt nếu thuê ghép giường)
        -- -----------------------------------------------
        DECLARE
            @SoGiuongThue   INT,
            @TongGiaThue    DECIMAL(15,2);

        DECLARE @SoMaHoSo VARCHAR(6);
        SELECT @SoMaHoSo = MaHoSoCuTru FROM dbo.HoSoCuTru WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

        DECLARE @SoTVHopLe INT = 0;
        IF @SoMaHoSo IS NOT NULL
        BEGIN
            SELECT @SoTVHopLe = COUNT(*) 
            FROM dbo.ThanhVienHopDong 
            WHERE MaHoSoCuTru = @SoMaHoSo AND TrangThai = N'Đủ điều kiện';
        END;

        IF @HinhThucThue = N'Ghép giường' AND @SoTVHopLe > 0
        BEGIN
            -- Chỉ thuê số lượng giường tương ứng số thành viên được duyệt cư trú
            SELECT
                @SoGiuongThue = COUNT(*),
                @TongGiaThue  = SUM(GiaThue)
            FROM (
                SELECT TOP (@SoTVHopLe) GiaThue
                FROM dbo.ChiTietDatCoc
                WHERE MaPhieuDatCoc = @MaPhieuDatCoc
                ORDER BY MaChiTietDC
            ) AS SubBeds;

            -- Giải phóng các giường dư thừa (chuyển sang trạng thái 'Trống')
            UPDATE g
            SET    g.TinhTrang = N'Trống'
            FROM   dbo.Giuong g
            JOIN   dbo.ChiTietDatCoc ctdc ON ctdc.MaPhong = g.MaPhong AND ctdc.MaGiuong = g.MaGiuong
            WHERE  ctdc.MaPhieuDatCoc = @MaPhieuDatCoc
              AND  ctdc.MaChiTietDC NOT IN (
                  SELECT TOP (@SoTVHopLe) MaChiTietDC
                  FROM dbo.ChiTietDatCoc
                  WHERE MaPhieuDatCoc = @MaPhieuDatCoc
                  ORDER BY MaChiTietDC
              );
        END
        ELSE
        BEGIN
            -- Nguyên phòng hoặc trường hợp khác: giữ nguyên theo phiếu đặt cọc
            SELECT
                @SoGiuongThue = COUNT(*),
                @TongGiaThue  = SUM(GiaThue)
            FROM dbo.ChiTietDatCoc
            WHERE MaPhieuDatCoc = @MaPhieuDatCoc;
        END;

        -- -----------------------------------------------
        -- BƯỚC INSERT-3: Insert HopDongThue
        -- -----------------------------------------------
        INSERT INTO dbo.HopDongThue (
            MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc,
            SoGiuongThue, GiaThue, KyThanhToan, TrangThai,
            MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy
        )
        VALUES (
            @MaHopDong,
            CAST(GETDATE() AS DATE),    -- NgayKyHD = ngày hôm nay
            @NgayBatDau,
            @NgayKetThuc,
            @SoGiuongThue,
            @TongGiaThue,
            @KyThanhToan,
            N'Hiệu lực',
            @MaPhieuDatCoc,
            @MaKhachHang,
            @MaNhanVienQuanLy
        );

        -- (Không chụp lại nội quy / điều khoản vi phạm – lấy trực tiếp từ bảng gốc khi xem hợp đồng)

        -- -----------------------------------------------
        -- BƯỚC INSERT-4: Cập nhật hoặc Thêm mới thành viên hợp đồng
        -- -----------------------------------------------
        DECLARE @MaHoSoCuTru VARCHAR(6);
        SELECT @MaHoSoCuTru = MaHoSoCuTru FROM dbo.HoSoCuTru WHERE MaPhieuDatCoc = @MaPhieuDatCoc;

        IF @MaHoSoCuTru IS NOT NULL
        BEGIN
            -- Nếu có hồ sơ cư trú đã được duyệt, cập nhật MaHopDong và đổi trạng thái sang 'Đang ở' cho các thành viên 'Đủ điều kiện'
            UPDATE dbo.ThanhVienHopDong
            SET MaHopDong = @MaHopDong,
                TrangThai = N'Đang ở'
            WHERE MaHoSoCuTru = @MaHoSoCuTru
              AND TrangThai = N'Đủ điều kiện';
        END
        ELSE
        BEGIN
            -- Trường hợp lập hợp đồng không qua duyệt cư trú trước (hoặc tự tạo)
            DECLARE @SoMaTVMax INT;
            SELECT @SoMaTVMax = ISNULL(MAX(CAST(SUBSTRING(MaThanhVien, 3, 4) AS INT)), 0)
            FROM dbo.ThanhVienHopDong
            WHERE MaThanhVien LIKE 'TV[0-9][0-9][0-9][0-9]';

            IF @TuTaoThanhVien = 1
            BEGIN
                -- Lấy thông tin khách hàng đại diện
                DECLARE
                    @HoTenKH    NVARCHAR(100),
                    @NgaySinhKH DATE,
                    @GioiTinhKH NVARCHAR(5),
                    @CCCCKH     VARCHAR(20),
                    @SDTKH      VARCHAR(20),
                    @EmailKH    VARCHAR(100),
                    @QuocTichKH NVARCHAR(50);

                SELECT
                    @HoTenKH    = nd.HoTen,
                    @NgaySinhKH = nd.NgaySinh,
                    @GioiTinhKH = nd.GioiTinh,
                    @CCCCKH     = kh.CCCD,
                    @SDTKH      = nd.SDT,
                    @EmailKH    = nd.Email,
                    @QuocTichKH = kh.QuocTich
                FROM        dbo.KhachHang kh
                JOIN        dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
                WHERE kh.MaKhachHang = @MaKhachHang;

                SET @SoMaTVMax = @SoMaTVMax + 1;

                INSERT INTO dbo.ThanhVienHopDong (
                    MaThanhVien, MaHoSoCuTru, MaHopDong, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, LyDoTuChoi
                )
                VALUES (
                    'TV' + RIGHT('0000' + CAST(@SoMaTVMax AS VARCHAR(4)), 4),
                    NULL,
                    @MaHopDong,
                    @HoTenKH,
                    @NgaySinhKH,
                    @GioiTinhKH,
                    @CCCCKH,
                    @SDTKH,
                    @EmailKH,
                    @QuocTichKH,
                    N'Đang ở',
                    NULL
                );
            END
            ELSE
            BEGIN
                -- Insert từng thành viên từ TVP
                DECLARE tv_cursor CURSOR LOCAL FAST_FORWARD FOR
                    SELECT HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich
                    FROM @DanhSachThanhVien;

                DECLARE
                    @TV_HoTen   NVARCHAR(100),
                    @TV_NS      DATE,
                    @TV_GT      NVARCHAR(4),
                    @TV_CCCD    VARCHAR(20),
                    @TV_SDT     VARCHAR(20),
                    @TV_Email   VARCHAR(100),
                    @TV_QT      NVARCHAR(50);

                OPEN tv_cursor;
                FETCH NEXT FROM tv_cursor INTO @TV_HoTen, @TV_NS, @TV_GT, @TV_CCCD, @TV_SDT, @TV_Email, @TV_QT;

                WHILE @@FETCH_STATUS = 0
                BEGIN
                    SET @SoMaTVMax = @SoMaTVMax + 1;

                    -- Xác định trạng thái: hợp lệ hay bị từ chối
                    DECLARE @TrangThaiTV NVARCHAR(20);
                    SET @TrangThaiTV = N'Đang ở'; -- mặc định hợp lệ

                    IF ISNULL(LTRIM(RTRIM(@TV_CCCD)), '') = ''
                        OR ISNULL(LTRIM(RTRIM(@TV_SDT)), '') = ''
                        SET @TrangThaiTV = N'Bị từ chối';

                    IF @GioiTinhChoPhep = N'Nam' AND @TV_GT = N'Nữ'
                        SET @TrangThaiTV = N'Bị từ chối';

                    IF @GioiTinhChoPhep = N'Nữ' AND @TV_GT = N'Nam'
                        SET @TrangThaiTV = N'Bị từ chối';

                    -- GioiTinh chỉ nhận 'Nam' hoặc 'Nữ' (CHECK constraint)
                    DECLARE @TV_GT_Insert NVARCHAR(4);
                    SET @TV_GT_Insert = CASE WHEN @TV_GT IN (N'Nam', N'Nữ') THEN @TV_GT ELSE NULL END;

                    INSERT INTO dbo.ThanhVienHopDong (
                        MaThanhVien, MaHoSoCuTru, MaHopDong, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, LyDoTuChoi
                    )
                    VALUES (
                        'TV' + RIGHT('0000' + CAST(@SoMaTVMax AS VARCHAR(4)), 4),
                        NULL,
                        @MaHopDong,
                        @TV_HoTen,
                        @TV_NS,
                        @TV_GT_Insert,
                        NULLIF(LTRIM(RTRIM(@TV_CCCD)), ''),
                        NULLIF(LTRIM(RTRIM(@TV_SDT)),  ''),
                        @TV_Email,
                        @TV_QT,
                        @TrangThaiTV,
                        NULL
                    );

                    FETCH NEXT FROM tv_cursor INTO @TV_HoTen, @TV_NS, @TV_GT, @TV_CCCD, @TV_SDT, @TV_Email, @TV_QT;
                END;

                CLOSE tv_cursor;
                DEALLOCATE tv_cursor;
            END;
        END;

        -- -----------------------------------------------
        -- BƯỚC INSERT-5: Insert DichVuHopDong
        -- -----------------------------------------------
        DECLARE @SoMaDVMax INT;
        SELECT @SoMaDVMax = ISNULL(MAX(CAST(SUBSTRING(MaChiTietDVHD, 4, 3) AS INT)), 0)
        FROM dbo.DichVuHopDong
        WHERE MaChiTietDVHD LIKE 'DVH[0-9][0-9][0-9]';

        DECLARE dv_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT dv_tvp.MaDichVu, dv_tvp.GhiChu, dv.DonGia
            FROM        @DanhSachDichVu dv_tvp
            JOIN        dbo.DichVu      dv ON dv.MaDichVu = dv_tvp.MaDichVu;

        DECLARE
            @DV_MaDV    VARCHAR(6),
            @DV_GhiChu  NVARCHAR(MAX),
            @DV_DonGia  DECIMAL(15,2);

        OPEN dv_cursor;
        FETCH NEXT FROM dv_cursor INTO @DV_MaDV, @DV_GhiChu, @DV_DonGia;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            SET @SoMaDVMax = @SoMaDVMax + 1;

            INSERT INTO dbo.DichVuHopDong (
                MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu, DonGiaApDung
            )
            VALUES (
                'DVH' + RIGHT('000' + CAST(@SoMaDVMax AS VARCHAR(3)), 3),
                @DV_MaDV,
                @MaHopDong,
                @DV_GhiChu,
                @DV_DonGia   -- ghi lại đơn giá tại thời điểm lập HĐ
            );

            FETCH NEXT FROM dv_cursor INTO @DV_MaDV, @DV_GhiChu, @DV_DonGia;
        END;

        CLOSE dv_cursor;
        DEALLOCATE dv_cursor;

        -- -----------------------------------------------
        -- BƯỚC INSERT-6: Cập nhật trạng thái phiếu cọc
        -- -----------------------------------------------
        UPDATE dbo.PhieuDatCoc
        SET    TrangThaiCoc = N'Đã lập HĐ'
        WHERE  MaPhieuDatCoc = @MaPhieuDatCoc;

        -- -----------------------------------------------
        -- COMMIT
        -- -----------------------------------------------
        COMMIT TRAN;

        SET @MaLoi    = 0;
        SET @ThongBao = N'Lập hợp đồng thuê thành công. Mã hợp đồng: ' + @MaHopDong;

    END TRY
    BEGIN CATCH
        -- Rollback nếu chưa commit
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;

        SET @MaHopDong = NULL;
        SET @MaLoi     = -99;
        SET @ThongBao  = N'Lỗi hệ thống: ' + ERROR_MESSAGE()
                        + N' (Line ' + CAST(ERROR_LINE() AS NVARCHAR) + N')';
    END CATCH;
END;
GO

-- ---- Test SP06 ----
/*
DECLARE @TV dbo.TVP_ThanhVienHopDong;
DECLARE @DV dbo.TVP_DichVuHopDong;
DECLARE @MaHD VARCHAR(6), @MaLoi INT, @ThongBao NVARCHAR(500);

-- Điền thành viên
INSERT INTO @TV(HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich)
VALUES
    (N'Nguyễn Văn An',  '1995-05-15', N'Nam', '038201089988', '0901234567', 'an@gmail.com',    N'Việt Nam'),
    (N'Trần Thị Bình',  '1997-08-20', N'Nữ',  '038201012345', '0909876543', 'binh@gmail.com',  N'Việt Nam');

-- Điền dịch vụ (phải tồn tại trong bảng DichVu)
INSERT INTO @DV(MaDichVu, GhiChu)
VALUES
    ('DV0001', N'Dịch vụ điện bắt buộc'),
    ('DV0002', N'Dịch vụ nước bắt buộc');

EXEC dbo.SP_LapHopDongThue
    @MaPhieuDatCoc      = 'DC0001',
    @MaNhanVienQuanLy   = 'NV0001',
    @NgayBatDau         = '2024-11-01',
    @NgayKetThuc        = '2025-11-01',
    @KyThanhToan        = N'Hàng tháng',
    @KhachHangDaXacNhan = 1,
    @NhanVienDaXacNhan  = 1,
    @DanhSachThanhVien  = @TV,
    @DanhSachDichVu     = @DV,
    @MaHopDong          = @MaHD      OUTPUT,
    @MaLoi              = @MaLoi     OUTPUT,
    @ThongBao           = @ThongBao  OUTPUT;

SELECT @MaHD AS MaHopDong, @MaLoi AS MaLoi, @ThongBao AS ThongBao;
*/
GO

-- ============================================================
-- SP07 – SP_LayChiTietHopDongThue
-- Màn hình : Hiển thị chi tiết hợp đồng sau khi lập / tra cứu chi tiết
-- Mục đích : Lấy toàn bộ thông tin chi tiết của hợp đồng để hiển thị lên UI.
-- Input    : @MaHopDong
-- Output   : 6 Result sets
-- ============================================================
CREATE OR ALTER PROCEDURE SP_LayChiTietHopDongThue
    @MaHopDong VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- [Result Set 1] Thông tin chung hợp đồng, phòng, và bên thuê/bên cho thuê
    SELECT TOP 1
        hd.MaHopDong,
        hd.NgayKyHD,
        DATEDIFF(MONTH, hd.NgayBatDau, hd.NgayKetThuc) AS ThoiHanThue,
        hd.TrangThai AS TrangThaiKy, -- Hiển thị ở Trạng thái ký (Hiệu lực / Đã xác nhận)
        hd.KyThanhToan,
        pdc.HinhThucThue,
        hd.SoGiuongThue,
        p.TenPhong,
        -- Ghép phòng-giường nếu là ghép giường
        CASE
            WHEN ctdc.MaGiuong IS NOT NULL
                THEN p.TenPhong + N' - Giường ' + ctdc.MaGiuong
            ELSE p.TenPhong
        END AS TenPhongDayDu,
        p.MaPhong,
        cn.DiaChi AS DiaChiChiNhanh,
        hd.GiaThue AS GiaThueThang,
        pdc.SoTienCoc,
        cn.TenChiNhanh AS BenChoThue,
        N'Quản lý chi nhánh' AS DaiDienChoThue,
        nd_kh.HoTen AS BenThue,
        kh.CCCD AS CCCD_BenThue,
        kh.MaKhachHang
    FROM HopDongThue hd
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    JOIN NguoiDung nd_kh ON nd_kh.MaNguoiDung = kh.MaKhachHang
    JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    JOIN ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    JOIN Phong p ON p.MaPhong = ctdc.MaPhong
    JOIN ChiNhanh cn ON cn.MaChiNhanh = p.MaChiNhanh
    WHERE hd.MaHopDong = @MaHopDong;

    -- [Result Set 2] Thành viên cư trú
    SELECT
        tv.HoTen,
        CASE
            WHEN tv.CCCD = kh.CCCD THEN N'Chủ hợp đồng'
            ELSE N'Thành viên'
        END AS QuanHe,
        tv.SDT
    FROM ThanhVienHopDong tv
    JOIN HopDongThue hd ON hd.MaHopDong = tv.MaHopDong
    JOIN KhachHang kh ON kh.MaKhachHang = hd.MaKhachHang
    WHERE tv.MaHopDong = @MaHopDong
    ORDER BY 
        CASE WHEN tv.CCCD = kh.CCCD THEN 0 ELSE 1 END,
        tv.HoTen;

    -- [Result Set 3] Dịch vụ đăng ký
    SELECT
        dv.TenDichVu,
        ISNULL(dvhd.DonGiaApDung, dv.DonGia) AS DonGia,
        dv.DonViTinh
    FROM DichVuHopDong dvhd
    JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE dvhd.MaHopDong = @MaHopDong
    ORDER BY dv.TenDichVu;

    -- [Result Set 4] Nội quy cư trú (lấy trực tiếp từ bảng QuiDinh đang hiệu lực)
    SELECT
        qd.MaQuyDinh,
        qd.TieuDeNoiQuy,
        qd.NoiDung
    FROM dbo.QuiDinh qd
    WHERE qd.TrangThai = N'Hiệu lực'
    ORDER BY qd.MaQuyDinh;

    -- [Result Set 5] Điều khoản vi phạm (lấy trực tiếp từ bảng DieuKhoanViPham đang hiệu lực)
    SELECT
        dk.MaDieuKhoan,
        dk.TenDieuKhoan,
        dk.HinhThucXuPhat,
        dk.MucPhat
    FROM dbo.DieuKhoanViPham dk
    WHERE dk.TrangThai = N'Hiệu lực'
    ORDER BY dk.MaDieuKhoan;

    -- [Result Set 6] Quy định hoàn cọc đang áp dụng
    SELECT
        qh.MaQuyDinhHoanCoc,
        qh.TenQuyDinh,
        qh.TyLeHoanCoc
    FROM dbo.QuyDinhHoanCoc qh
    ORDER BY qh.MaQuyDinhHoanCoc;
END;
GO

-- ============================================================
-- KẾT THÚC FILE 05_sp_lap_hop_dong_thue.sql
-- ============================================================
