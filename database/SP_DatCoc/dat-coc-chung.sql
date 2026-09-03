USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: DAT COC - DUNG CHUNG (cap nhat tinh trang phong, nha cho coc het han)
-- =============================================

-- Cần cho việc tạo SP có INSERT vào bảng có filtered index (ChiTietDatCoc).
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID(N'dbo.PhieuDangKy', N'U') IS NULL
   OR OBJECT_ID(N'dbo.PhieuDatCoc', N'U') IS NULL
    THROW 50200, N'Chưa có schema HOMEDORM4. Hãy chạy app.sql trước khi chạy dat-coc.sql.', 1;
GO

-- Cho phép PhuongThucThanhToan = NULL: kế toán KHÔNG chọn phương thức khi lập phiếu (DC03);
-- khách hàng sẽ chọn phương thức sau (DC04). CHECK cũ vẫn cho qua NULL.
-- Idempotent: chỉ ALTER khi cột đang NOT NULL.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.PhieuDatCoc')
      AND name = 'PhuongThucThanhToan'
      AND is_nullable = 0
)
    ALTER TABLE dbo.PhieuDatCoc ALTER COLUMN PhuongThucThanhToan NVARCHAR(20) NULL;
GO

-- ============================================================
-- SP_CapNhatTinhTrangPhong — suy ra Phong.TinhTrang TỪ trạng thái các Giuong
-- trong phòng (nguồn sự thật duy nhất), thay vì để từng SP tự set tay.
-- Quy tắc (ưu tiên từ trên xuống):
--   1) Còn giường nào 'Giữ chỗ'                        -> 'Giữ chỗ'
--   2) Tất cả giường 'Trống'                           -> 'Trống'
--   3) Không còn giường 'Trống' và không có 'Đang thuê' -> 'Đã đặt cọc' (đã cọc hết, chưa ai dọn vào)
--   4) Không còn giường 'Trống' (có 'Đang thuê')        -> 'Đầy'
--   5) Còn lại (vừa có giường Trống, vừa có giường đã cọc/đang ở) -> 'Còn chỗ'
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_CapNhatTinhTrangPhong
    @MaPhong VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Tong INT, @Trong INT, @GiuCho INT, @DangThue INT;
    SELECT
        @Tong     = COUNT(*),
        @Trong    = SUM(CASE WHEN TinhTrang = N'Trống'     THEN 1 ELSE 0 END),
        @GiuCho   = SUM(CASE WHEN TinhTrang = N'Giữ chỗ'   THEN 1 ELSE 0 END),
        @DangThue = SUM(CASE WHEN TinhTrang = N'Đang thuê' THEN 1 ELSE 0 END)
    FROM dbo.Giuong
    WHERE MaPhong = @MaPhong;

    IF @Tong IS NULL RETURN; -- phòng không có giường (không nên xảy ra) -> không đổi gì

    UPDATE dbo.Phong
    SET TinhTrang = CASE
        WHEN @GiuCho > 0                 THEN N'Giữ chỗ'
        WHEN @Trong = @Tong               THEN N'Trống'
        WHEN @Trong = 0 AND @DangThue = 0 THEN N'Đã đặt cọc'
        WHEN @Trong = 0                   THEN N'Đầy'
        ELSE N'Còn chỗ'
    END
    WHERE MaPhong = @MaPhong;
END;
GO

-- ============================================================
-- SP_NhaChoCocHetHan — nhả 'Giữ chỗ' về 'Trống' cho các phiếu cọc quá hạn 24h
-- (đồng thời đặt phiếu sang 'Hết hạn' + 'Đã hủy'). Gọi ở DC03/DC04/DC05.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.SP_NhaChoCocHetHan
AS
BEGIN
    SET NOCOUNT ON;

    -- KHÔNG ĐƯỢC thêm SELECT trả kết quả ở cuối SP này (kể cả để trả số đếm):
    -- SP này được EXEC lồng bên trong 7 SP khác (SP_DanhSachPhongDaXem, SP_LapPhieuDatCoc,
    -- SP_DanhSachChoTinhTienCoc, SP_ChotPhieuDatCoc, SP_CapNhatMinhChungThanhToanCoc,
    -- SP_ChonPhuongThucThanhToanCoc, SP_XacNhanThanhToanCoc) TRƯỚC recordset thật của chúng.
    -- Package mssql lấy result.recordset = result.recordsets[0] (recordset ĐẦU TIÊN) -- nếu
    -- SP này trả thêm 1 recordset, nó sẽ CHIẾM vị trí [0] và đẩy recordset thật của SP cha
    -- xuống [1], làm mọi nơi đọc result.recordset[0] nhận NHẦM dữ liệu. Nếu cần đếm số phiếu
    -- hết hạn, đếm ở phía Node (job nền) bằng 1 câu SELECT COUNT riêng trước khi EXEC SP này.

    -- Ghi nhận các phòng bị ảnh hưởng TRƯỚC khi nhả (để mở khóa giới tính + cập nhật tình trạng sau).
    DECLARE @PhongAnhHuong TABLE (MaPhong VARCHAR(4) PRIMARY KEY);
    INSERT INTO @PhongAnhHuong (MaPhong)
    SELECT DISTINCT c.MaPhong
    FROM dbo.ChiTietDatCoc AS c
    INNER JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE();

    UPDATE g SET g.TinhTrang = N'Trống'
    FROM dbo.Giuong AS g
    INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = g.MaPhong AND c.MaGiuong = g.MaGiuong
    INNER JOIN dbo.PhieuDatCoc  AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE()
      AND g.TinhTrang = N'Giữ chỗ';

    UPDATE g SET g.TinhTrang = N'Trống'
    FROM dbo.Giuong AS g
    INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = g.MaPhong AND c.MaGiuong IS NULL
    INNER JOIN dbo.PhieuDatCoc  AS pdc ON pdc.MaPhieuDatCoc = c.MaPhieuDatCoc
    WHERE pdc.TrangThaiThanhToan = N'Chờ TT' AND pdc.ThoiHanThanhToan < GETDATE()
      AND g.TinhTrang = N'Giữ chỗ';

    UPDATE dbo.PhieuDatCoc
    SET TrangThaiThanhToan = N'Hết hạn', TrangThaiCoc = N'Đã hủy'
    WHERE TrangThaiThanhToan = N'Chờ TT' AND ThoiHanThanhToan < GETDATE();

    -- MỞ KHÓA GIỚI TÍNH: phòng nào không còn giường nào bị giữ/đặt cọc/đang thuê
    -- thì trả về 'Không phân biệt' (mô hình KPB-mặc-định, chỉ khóa khi có người giữ).
    UPDATE p SET p.GioiTinhChoPhep = N'Không phân biệt'
    FROM dbo.Phong AS p
    INNER JOIN @PhongAnhHuong AS a ON a.MaPhong = p.MaPhong
    WHERE p.GioiTinhChoPhep <> N'Không phân biệt'
      AND NOT EXISTS (
          SELECT 1 FROM dbo.Giuong AS g
          WHERE g.MaPhong = p.MaPhong AND g.TinhTrang <> N'Trống'
      );

    -- Suy lại Phong.TinhTrang từ trạng thái giường thật (thay vì set cứng 'Trống':
    -- phòng ghép có thể còn giường khác đang 'Giữ chỗ'/'Đã đặt cọc' bởi phiếu khác).
    DECLARE @MaPhongDangXet VARCHAR(4);
    DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT MaPhong FROM @PhongAnhHuong;
    OPEN cur;
    FETCH NEXT FROM cur INTO @MaPhongDangXet;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @MaPhongDangXet;
        FETCH NEXT FROM cur INTO @MaPhongDangXet;
    END
    CLOSE cur;
    DEALLOCATE cur;
END;
GO
