USE HOMEDORM4;
GO



-- ----------------------------------------------------------------
-- TEST CASE 1: Lập biên bản bàn giao vào thành công (Ghép giường)
-- Kỳ vọng: @MaLoi = 0, giường đổi sang 'Đang thuê', phòng đổi sang 'Còn chỗ' hoặc 'Đầy'
-- ----------------------------------------------------------------
BEGIN TRY
    BEGIN TRAN;

    PRINT N'--- [TC1] LẬP BIÊN BẢN BÀN GIAO VÀO THÀNH CÔNG ---';

    -- 1. Setup dữ liệu mẫu
    -- Đảm bảo giường P204/G01 có trạng thái 'Đã đặt cọc'
    UPDATE Giuong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P204' AND MaGiuong = 'G01';
    UPDATE Phong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P204';

    -- Tạo phiếu đặt cọc giả
    INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
    VALUES ('DC9901', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

    INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
    VALUES ('CT9901', 'DC9901', 'P204', 'G01', 1800000);

    -- Tạo hợp đồng giả
    INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
    VALUES ('HD9901', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hiệu lực', 'DC9901', 'KH0001', 'NV0003');

    -- Tạo hóa đơn kỳ đầu đã thanh toán
    INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, TongTien, TrangThai, MaHopDong, MaNhanVienKeToan)
    VALUES ('HD9901', '2026-06', CAST(GETDATE() AS DATE), 1800000, N'Đã TT', 'HD9901', 'NV0004');

    -- 2. Gọi SP_TraCuuHopDongBanGiao để kiểm tra xem thông tin có khớp UI không
    PRINT N'>> [TC1.1] Kết quả tra cứu hợp đồng:';
    EXEC SP_TraCuuHopDongBanGiao @MaHopDong = 'HD9901';

    -- 3. Gọi SP_LayDanhSachTaiSanBanGiao để lấy danh sách tài sản
    PRINT N'>> [TC1.2] Danh sách tài sản cần bàn giao:';
    EXEC SP_LayDanhSachTaiSanBanGiao @MaHopDong = 'HD9901';

    -- 4. Giả lập danh sách tài sản thực tế từ UI truyền xuống TVP
    DECLARE @TS dbo.TVP_ChiTietBanGiao;
    INSERT INTO @TS (MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
    SELECT MaPhong, MaTaiSan, SoLuongThucTeMacDinh, GhiChuMacDinh
    FROM (
        -- Lấy danh sách từ SP
        SELECT 'P204' AS MaPhong, 'TS0001' AS MaTaiSan, 1 AS SoLuongThucTeMacDinh, CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
        UNION ALL
        SELECT 'P204' AS MaPhong, 'TS0002' AS MaTaiSan, 1 AS SoLuongThucTeMacDinh, CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
        UNION ALL
        SELECT 'P204' AS MaPhong, 'TS0003' AS MaTaiSan, 1 AS SoLuongThucTeMacDinh, CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
        UNION ALL
        SELECT 'P204' AS MaPhong, 'TS0004' AS MaTaiSan, 1 AS SoLuongThucTeMacDinh, CAST(NULL AS NVARCHAR(255)) AS GhiChuMacDinh
    ) tmp;

    -- 5. Tiến hành lưu biên bản
    DECLARE @MaBB VARCHAR(6), @MaLoi INT, @ThongBao NVARCHAR(500);
    EXEC SP_LapBienBanBanGiaoVao
        @MaHopDong          = 'HD9901',
        @MaNhanVienQuanLy   = 'NV0003',
        @KhachCoMat         = 1,
        @DaKyBienBan        = 1,
        @GhiChuChung        = N'Bàn giao đầy đủ không hư hại',
        @DanhSachTaiSan     = @TS,
        @MaBienBan          = @MaBB OUTPUT,
        @MaLoi              = @MaLoi OUTPUT,
        @ThongBao           = @ThongBao OUTPUT;

    PRINT N'>> [TC1.3] Kết quả lưu: MaLoi = ' + CAST(@MaLoi AS VARCHAR) + N', ThongBao = ' + @ThongBao + N', MaBienBan = ' + ISNULL(@MaBB, 'NULL');

    -- 6. Xem kết quả trả về cho popup thành công
    IF @MaLoi = 0
    BEGIN
        PRINT N'>> [TC1.4] Thông tin hiển thị popup thành công:';
        EXEC SP_LayKetQuaLapBienBanBanGiao @MaBienBan = @MaBB;
    END;

    -- 7. Xem trạng thái giường và phòng sau cập nhật
    SELECT MaPhong, MaGiuong, TinhTrang AS TinhTrangGiuong FROM Giuong WHERE MaPhong = 'P204' AND MaGiuong = 'G01';
    SELECT MaPhong, TinhTrang AS TinhTrangPhong FROM Phong WHERE MaPhong = 'P204';

    ROLLBACK TRAN;
    PRINT N'>> [TC1] Đã Rollback dữ liệu thử nghiệm.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    PRINT N'>> [TC1] LỖI HỆ THỐNG: ' + ERROR_MESSAGE();
END CATCH;
GO

-- ----------------------------------------------------------------
-- TEST CASE 2: Mã hợp đồng không tồn tại
-- Kỳ vọng: @MaLoi = -1
-- ----------------------------------------------------------------
DECLARE @TC2_MaBB VARCHAR(6), @TC2_MaLoi INT, @TC2_ThongBao NVARCHAR(500);
DECLARE @TC2_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9999', -- Không tồn tại
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC2_TS,
    @MaBienBan          = @TC2_MaBB OUTPUT,
    @MaLoi              = @TC2_MaLoi OUTPUT,
    @ThongBao           = @TC2_ThongBao OUTPUT;
PRINT N'--- [TC2] Hợp đồng không tồn tại ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC2_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC2_ThongBao;
GO

-- ----------------------------------------------------------------
-- TEST CASE 3: Hợp đồng không còn hiệu lực
-- Kỳ vọng: @MaLoi = -2
-- ----------------------------------------------------------------
BEGIN TRAN;
-- Tạo hợp đồng hết hiệu lực
INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
VALUES ('DC9903', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
VALUES ('HD9903', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hết hạn', 'DC9903', 'KH0001', 'NV0003');

DECLARE @TC3_MaBB VARCHAR(6), @TC3_MaLoi INT, @TC3_ThongBao NVARCHAR(500);
DECLARE @TC3_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9903',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC3_TS,
    @MaBienBan          = @TC3_MaBB OUTPUT,
    @MaLoi              = @TC3_MaLoi OUTPUT,
    @ThongBao           = @TC3_ThongBao OUTPUT;
PRINT N'--- [TC3] Hợp đồng không còn hiệu lực ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC3_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC3_ThongBao;
ROLLBACK;
GO

-- ----------------------------------------------------------------
-- TEST CASE 4: Hóa đơn kỳ đầu chưa thanh toán
-- Kỳ vọng: @MaLoi = -4
-- ----------------------------------------------------------------
BEGIN TRAN;
-- Hợp đồng có hóa đơn nhưng trạng thái là 'Chưa TT'
INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
VALUES ('DC9904', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
VALUES ('HD9904', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hiệu lực', 'DC9904', 'KH0001', 'NV0003');

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, TongTien, TrangThai, MaHopDong, MaNhanVienKeToan)
VALUES ('HD9904', '2026-06', CAST(GETDATE() AS DATE), 1800000, N'Chưa TT', 'HD9904', 'NV0004');

DECLARE @TC4_MaBB VARCHAR(6), @TC4_MaLoi INT, @TC4_ThongBao NVARCHAR(500);
DECLARE @TC4_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9904',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC4_TS,
    @MaBienBan          = @TC4_MaBB OUTPUT,
    @MaLoi              = @TC4_MaLoi OUTPUT,
    @ThongBao           = @TC4_ThongBao OUTPUT;
PRINT N'--- [TC4] Hóa đơn kỳ đầu chưa thanh toán ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC4_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC4_ThongBao;
ROLLBACK;
GO

-- ----------------------------------------------------------------
-- TEST CASE 5: Hợp đồng đã có biên bản bàn giao vào
-- Kỳ vọng: @MaLoi = -5
-- ----------------------------------------------------------------
BEGIN TRAN;
INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
VALUES ('DC9905', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
VALUES ('HD9905', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hiệu lực', 'DC9905', 'KH0001', 'NV0003');

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, TongTien, TrangThai, MaHopDong, MaNhanVienKeToan)
VALUES ('HD9905', '2026-06', CAST(GETDATE() AS DATE), 1800000, N'Đã TT', 'HD9905', 'NV0004');

-- Thêm sẵn biên bản đã lập
INSERT INTO BienBanBanGiao (MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy, TrangThai)
VALUES ('BG9905', CAST(GETDATE() AS DATE), N'Bàn giao vào', 'HD9905', 'NV0003', N'Đã lập');

DECLARE @TC5_MaBB VARCHAR(6), @TC5_MaLoi INT, @TC5_ThongBao NVARCHAR(500);
DECLARE @TC5_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9905',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC5_TS,
    @MaBienBan          = @TC5_MaBB OUTPUT,
    @MaLoi              = @TC5_MaLoi OUTPUT,
    @ThongBao           = @TC5_ThongBao OUTPUT;
PRINT N'--- [TC5] Hợp đồng đã lập biên bản bàn giao vào trước đó ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC5_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC5_ThongBao;
ROLLBACK;
GO

-- ----------------------------------------------------------------
-- TEST CASE 6: Giường không ở trạng thái "Đã đặt cọc" (đang trống hoặc đang thuê)
-- Kỳ vọng: @MaLoi = -6
-- ----------------------------------------------------------------
BEGIN TRAN;
-- Cập nhật giường sang trạng thái 'Đang thuê' (hoặc 'Trống') trước khi lập
UPDATE Giuong SET TinhTrang = N'Đang thuê' WHERE MaPhong = 'P204' AND MaGiuong = 'G01';

INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
VALUES ('DC9906', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
VALUES ('CT9906', 'DC9906', 'P204', 'G01', 1800000);

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
VALUES ('HD9906', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hiệu lực', 'DC9906', 'KH0001', 'NV0003');

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, TongTien, TrangThai, MaHopDong, MaNhanVienKeToan)
VALUES ('HD9906', '2026-06', CAST(GETDATE() AS DATE), 1800000, N'Đã TT', 'HD9906', 'NV0004');

DECLARE @TC6_MaBB VARCHAR(6), @TC6_MaLoi INT, @TC6_ThongBao NVARCHAR(500);
DECLARE @TC6_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9906',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC6_TS,
    @MaBienBan          = @TC6_MaBB OUTPUT,
    @MaLoi              = @TC6_MaLoi OUTPUT,
    @ThongBao           = @TC6_ThongBao OUTPUT;
PRINT N'--- [TC6] Giường không ở trạng thái "Đã đặt cọc" ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC6_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC6_ThongBao;
ROLLBACK;
GO

-- ----------------------------------------------------------------
-- TEST CASE 7: Thiếu tài sản bắt buộc trong danh sách truyền vào
-- Kỳ vọng: @MaLoi = -11
-- ----------------------------------------------------------------
BEGIN TRAN;
UPDATE Giuong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P204' AND MaGiuong = 'G01';

INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
VALUES ('DC9907', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
VALUES ('CT9907', 'DC9907', 'P204', 'G01', 1800000);

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
VALUES ('HD9907', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hiệu lực', 'DC9907', 'KH0001', 'NV0003');

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, TongTien, TrangThai, MaHopDong, MaNhanVienKeToan)
VALUES ('HD9907', '2026-06', CAST(GETDATE() AS DATE), 1800000, N'Đã TT', 'HD9907', 'NV0004');

-- Truyền TVP rỗng
DECLARE @TC7_MaBB VARCHAR(6), @TC7_MaLoi INT, @TC7_ThongBao NVARCHAR(500);
DECLARE @TC7_TS dbo.TVP_ChiTietBanGiao; -- Rỗng

EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9907',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC7_TS,
    @MaBienBan          = @TC7_MaBB OUTPUT,
    @MaLoi              = @TC7_MaLoi OUTPUT,
    @ThongBao           = @TC7_ThongBao OUTPUT;
PRINT N'--- [TC7] Danh sách tài sản trống / thiếu tài sản bắt buộc ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC7_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC7_ThongBao;
ROLLBACK;
GO

-- ----------------------------------------------------------------
-- TEST CASE 8: Có chênh lệch số lượng thực tế nhưng thiếu ghi chú
-- Kỳ vọng: @MaLoi = -13
-- ----------------------------------------------------------------
BEGIN TRAN;
UPDATE Giuong SET TinhTrang = N'Đã đặt cọc' WHERE MaPhong = 'P204' AND MaGiuong = 'G01';

INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang)
VALUES ('DC9908', GETDATE(), GETDATE()+1, 3600000, N'Chuyển khoản', N'Đã TT', N'Ghép giường', N'Đã lập HĐ', 'DK0001', 'KH0001');

INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue)
VALUES ('CT9908', 'DC9908', 'P204', 'G01', 1800000);

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy)
VALUES ('HD9908', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE), DATEADD(month, 6, GETDATE()), 1, 1800000, N'Hàng tháng', N'Hiệu lực', 'DC9908', 'KH0001', 'NV0003');

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, TongTien, TrangThai, MaHopDong, MaNhanVienKeToan)
VALUES ('HD9908', '2026-06', CAST(GETDATE() AS DATE), 1800000, N'Đã TT', 'HD9908', 'NV0004');

-- Truyền TVP có chênh lệch số lượng (nệm định mức 1, truyền thực tế 0) nhưng GhiChu để trống
DECLARE @TC8_MaBB VARCHAR(6), @TC8_MaLoi INT, @TC8_ThongBao NVARCHAR(500);
DECLARE @TC8_TS dbo.TVP_ChiTietBanGiao;
INSERT INTO @TC8_TS (MaPhong, MaTaiSan, SoLuongThucTe, GhiChu)
VALUES 
    ('P204', 'TS0001', 1, NULL),
    ('P204', 'TS0002', 0, NULL), -- Chênh lệch từ 1 xuống 0 nhưng không nhập GhiChu!
    ('P204', 'TS0003', 1, NULL),
    ('P204', 'TS0004', 2, NULL);

EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD9908',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC8_TS,
    @MaBienBan          = @TC8_MaBB OUTPUT,
    @MaLoi              = @TC8_MaLoi OUTPUT,
    @ThongBao           = @TC8_ThongBao OUTPUT;
PRINT N'--- [TC8] Chênh lệch số lượng thực tế nhưng thiếu ghi chú ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC8_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC8_ThongBao;
ROLLBACK;
GO

-- ----------------------------------------------------------------
-- TEST CASE 9: Khách hàng vắng mặt tại thời điểm bàn giao
-- Kỳ vọng: @MaLoi = -8
-- ----------------------------------------------------------------
DECLARE @TC9_MaBB VARCHAR(6), @TC9_MaLoi INT, @TC9_ThongBao NVARCHAR(500);
DECLARE @TC9_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD0001',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 0, -- Vắng mặt
    @DaKyBienBan        = 1,
    @DanhSachTaiSan     = @TC9_TS,
    @MaBienBan          = @TC9_MaBB OUTPUT,
    @MaLoi              = @TC9_MaLoi OUTPUT,
    @ThongBao           = @TC9_ThongBao OUTPUT;
PRINT N'--- [TC9] Khách hàng vắng mặt ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC9_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC9_ThongBao;
GO

-- ----------------------------------------------------------------
-- TEST CASE 10: Khách hàng chưa ký biên bản xác nhận
-- Kỳ vọng: @MaLoi = -9
-- ----------------------------------------------------------------
DECLARE @TC10_MaBB VARCHAR(6), @TC10_MaLoi INT, @TC10_ThongBao NVARCHAR(500);
DECLARE @TC10_TS dbo.TVP_ChiTietBanGiao;
EXEC SP_LapBienBanBanGiaoVao
    @MaHopDong          = 'HD0001',
    @MaNhanVienQuanLy   = 'NV0003',
    @KhachCoMat         = 1,
    @DaKyBienBan        = 0, -- Chưa ký
    @DanhSachTaiSan     = @TC10_TS,
    @MaBienBan          = @TC10_MaBB OUTPUT,
    @MaLoi              = @TC10_MaLoi OUTPUT,
    @ThongBao           = @TC10_ThongBao OUTPUT;
PRINT N'--- [TC10] Khách hàng chưa ký xác nhận biên bản ---';
PRINT N'Kết quả: MaLoi = ' + CAST(@TC10_MaLoi AS VARCHAR) + N', ThongBao = ' + @TC10_ThongBao;
GO

