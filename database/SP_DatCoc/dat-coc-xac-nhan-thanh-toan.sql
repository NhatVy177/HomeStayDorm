USE [HOMEDORM4];
GO

-- =============================================
-- MODULE: DAT COC - XAC NHAN THANH TOAN (Nhan vien Quan ly) - DC05
-- =============================================

-- ============================================================
-- DC05 - SP_DanhSachChoXacNhanThanhToan
-- Danh sách phiếu "Chờ TT" đã có chứng từ, cho Quản lý đối chiếu & xác nhận.
-- ============================================================
IF OBJECT_ID(N'dbo.SP_DanhSachChoXacNhanThanhToan', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_DanhSachChoXacNhanThanhToan AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_DanhSachChoXacNhanThanhToan
    @MaNhanVien VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Giới hạn theo chi nhánh của Quản lý: chỉ thấy phiếu của phòng thuộc chi nhánh mình.
    DECLARE @MaChiNhanh VARCHAR(6) = (SELECT MaChiNhanh FROM dbo.NhanVien WHERE MaNhanVien = @MaNhanVien);

    SELECT
        pdc.MaPhieuDatCoc       AS maPhieuDatCoc,
        nd.HoTen                AS hoTen,
        nd.SDT                  AS soDienThoai,
        ctdc.MaPhong            AS maPhong,
        ctdc.MaGiuong           AS maGiuong,
        p.TenPhong              AS tenPhong,
        pdc.SoTienCoc           AS soTienCoc,
        pdc.PhuongThucThanhToan AS phuongThucThanhToan,
        pdc.ThoiDiemDatCoc      AS thoiDiemDatCoc,
        pdc.ThoiHanThanhToan    AS thoiHanThanhToan,
        pdc.TrangThaiThanhToan  AS trangThaiThanhToan,
        pdc.ChungTuThanhToan    AS chungTuThanhToan,
        pdc.GhiChu              AS lyDoTuChoi,
        -- Chuỗi gộp phòng/giường cho DataGrid
        (SELECT STRING_AGG(CONCAT(p2.TenPhong,
                    CASE WHEN c2.MaGiuong IS NOT NULL THEN N' - ' + c2.MaGiuong ELSE N'' END), N', ')
                WITHIN GROUP (ORDER BY c2.MaPhong, c2.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c2
         INNER JOIN dbo.Phong AS p2 ON p2.MaPhong = c2.MaPhong
         WHERE c2.MaPhieuDatCoc = pdc.MaPhieuDatCoc)          AS danhSachPhong,
        -- Chỉ mã giường (NULL khi thuê nguyên phòng) -> modal tách riêng nhãn Phòng / Giường.
        -- CAST sang NVARCHAR: MaGiuong là VARCHAR, không ghép được với dấu phân cách N', '
        (SELECT STRING_AGG(CAST(c4.MaGiuong AS NVARCHAR(3)), N', ') WITHIN GROUP (ORDER BY c4.MaGiuong)
         FROM dbo.ChiTietDatCoc AS c4
         WHERE c4.MaPhieuDatCoc = pdc.MaPhieuDatCoc AND c4.MaGiuong IS NOT NULL) AS danhSachGiuong
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    OUTER APPLY (
        SELECT TOP 1 MaPhong, MaGiuong
        FROM dbo.ChiTietDatCoc
        WHERE MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ctdc
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
    -- Chờ xác nhận (Chờ TT + đã có chứng từ + CHƯA bị từ chối) + lịch sử (Đã TT / Hết hạn).
    -- GhiChu IS NULL: phiếu đã bị quản lý từ chối (GhiChu có lý do) vẫn giữ chứng từ cũ, nên phải
    -- loại khỏi hàng đợi — nếu không nó kẹt lại mãi. Nó quay lại khi Sale/khách gửi chứng từ mới
    -- (lúc đó SP_CapNhatMinhChungThanhToanCoc xóa GhiChu về NULL).
    WHERE (
        (pdc.TrangThaiThanhToan = N'Chờ TT'
         AND pdc.ChungTuThanhToan IS NOT NULL
         AND LTRIM(RTRIM(pdc.ChungTuThanhToan)) <> ''
         AND pdc.GhiChu IS NULL)
       OR pdc.TrangThaiThanhToan IN (N'Đã TT', N'Hết hạn')
    )
      -- Phiếu kế toán chưa chốt thì không bao giờ có chứng từ hợp lệ (guard 50275).
      -- Loại luôn để phiếu Sale lập rồi bỏ quên (hết hạn chờ chốt) không lẫn vào lịch sử của Quản lý.
      AND pdc.MaNhanVienKeToan IS NOT NULL
      AND (p.MaChiNhanh IS NULL OR p.MaChiNhanh = @MaChiNhanh)
    ORDER BY pdc.ThoiHanThanhToan DESC;
END;
GO

-- ============================================================
-- DC05 - SP_XacNhanThanhToanCoc
-- Quản lý xác nhận (Đã TT + phòng/giường 'Đã đặt cọc') hoặc từ chối (giữ 'Chờ TT').
-- ============================================================
IF OBJECT_ID(N'dbo.SP_XacNhanThanhToanCoc', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_XacNhanThanhToanCoc AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_XacNhanThanhToanCoc
    @PhieuId                  NVARCHAR(30),
    @HopLe                    BIT,
    @GhiChu                   NVARCHAR(MAX) = NULL,
    @QuanLyXacNhanThanhToanId NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ma VARCHAR(6) = CAST(@PhieuId AS VARCHAR(6));

    IF NOT EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma)
        THROW 50230, N'Không tìm thấy phiếu đặt cọc.', 1;

    DECLARE @TrangThai NVARCHAR(20), @ThoiHan DATETIME, @ChungTu VARCHAR(500);
    SELECT @TrangThai = TrangThaiThanhToan, @ThoiHan = ThoiHanThanhToan, @ChungTu = ChungTuThanhToan
    FROM dbo.PhieuDatCoc WHERE MaPhieuDatCoc = @Ma;

    IF @TrangThai <> N'Chờ TT'
        THROW 50231, N'Phiếu đặt cọc không ở trạng thái "Chờ TT".', 1;

    IF @ThoiHan < GETDATE()
    BEGIN
        EXEC dbo.SP_NhaChoCocHetHan; -- nhả 'Giữ chỗ' về 'Trống' + đặt phiếu 'Hết hạn'
        THROW 50234, N'Phiếu đặt cọc đã hết hạn thanh toán và bị hủy tự động.', 1;
    END

    IF @ChungTu IS NULL OR LTRIM(RTRIM(@ChungTu)) = ''
        THROW 50232, N'Phiếu chưa có chứng từ thanh toán để xác nhận.', 1;

    IF @HopLe = 0 AND NULLIF(LTRIM(RTRIM(COALESCE(@GhiChu, N''))), N'') IS NULL
        THROW 50233, N'Vui lòng nhập lý do từ chối.', 1;

    IF @HopLe = 1
    BEGIN
        BEGIN TRY
            BEGIN TRAN;
                UPDATE dbo.PhieuDatCoc
                SET TrangThaiThanhToan = N'Đã TT', ThoiGianXacNhanTT = GETDATE(),
                    GhiChu = NULL   -- duyệt xong: dọn lý do từ chối cũ (nếu từng bị từ chối)
                WHERE MaPhieuDatCoc = @Ma;

                -- Ghép giường: lật ĐÚNG các giường của phiếu (MỌI dòng, MỌI phòng).
                -- (Trước đây dùng SELECT TOP 1 nên chỉ lật 1 giường -> bỏ sót giường thứ 2 trở đi.)
                UPDATE g SET g.TinhTrang = N'Đã đặt cọc'
                FROM dbo.Giuong AS g
                INNER JOIN dbo.ChiTietDatCoc AS c
                        ON c.MaPhong = g.MaPhong AND c.MaGiuong = g.MaGiuong
                WHERE c.MaPhieuDatCoc = @Ma AND c.MaGiuong IS NOT NULL;

                -- Nguyên phòng (MaGiuong NULL): lật TOÀN BỘ giường của mỗi phòng trong phiếu.
                UPDATE g SET g.TinhTrang = N'Đã đặt cọc'
                FROM dbo.Giuong AS g
                INNER JOIN dbo.ChiTietDatCoc AS c ON c.MaPhong = g.MaPhong
                WHERE c.MaPhieuDatCoc = @Ma AND c.MaGiuong IS NULL;

                -- Suy lại Phong.TinhTrang cho TỪNG phòng distinct của phiếu.
                DECLARE @PhongXN VARCHAR(4);
                DECLARE curPhongXN CURSOR LOCAL FAST_FORWARD FOR
                    SELECT DISTINCT MaPhong FROM dbo.ChiTietDatCoc WHERE MaPhieuDatCoc = @Ma;
                OPEN curPhongXN;
                FETCH NEXT FROM curPhongXN INTO @PhongXN;
                WHILE @@FETCH_STATUS = 0
                BEGIN
                    EXEC dbo.SP_CapNhatTinhTrangPhong @MaPhong = @PhongXN;
                    FETCH NEXT FROM curPhongXN INTO @PhongXN;
                END
                CLOSE curPhongXN;
                DEALLOCATE curPhongXN;
            COMMIT;
        END TRY
        BEGIN CATCH
            IF @@TRANCOUNT > 0 ROLLBACK;
            THROW;
        END CATCH
    END
    ELSE
    BEGIN
        -- @HopLe = 0: từ chối chứng từ -> GIỮ NGUYÊN chứng từ cũ (để Sale/khách xem lại chỗ sai),
        -- chỉ lưu lý do từ chối vào GhiChu. Phiếu vẫn 'Chờ TT'.
        -- Suy ra trạng thái "Bị từ chối" = ChungTuThanhToan IS NOT NULL AND GhiChu IS NOT NULL.
        -- Lý do sẽ bị xóa khi Sale/khách gửi chứng từ mới (SP_CapNhatMinhChungThanhToanCoc).
        UPDATE dbo.PhieuDatCoc
        SET GhiChu = @GhiChu
        WHERE MaPhieuDatCoc = @Ma;
    END

    SELECT
        pdc.MaPhieuDatCoc      AS maPhieuDatCoc,
        pdc.TrangThaiThanhToan AS trangThaiThanhToan,
        pdc.ThoiGianXacNhanTT  AS thoiGianXacNhanTT,
        nd.HoTen               AS hoTen
    FROM dbo.PhieuDatCoc AS pdc
    INNER JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdc.MaKhachHang
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE pdc.MaPhieuDatCoc = @Ma;
END;
GO
