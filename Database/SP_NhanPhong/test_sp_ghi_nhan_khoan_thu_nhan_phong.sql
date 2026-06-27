USE HOMEDORM4;
GO

PRINT N'================================================================';
PRINT N'BẮT ĐẦU CHẠY THỬ NGHIỆM CÁC TEST CASES THỰC TẾ TRÊN WEB (USER FLOWS)';
PRINT N'================================================================';
GO

-- ================================================================
-- KỊCH BẢN 1: Màn hình danh sách hợp đồng chờ thu tiền
-- Phản ánh hành động: Nhân viên mở tab "Thu nhận phòng" và thao tác bộ lọc trên Web
-- ================================================================
PRINT N'';
PRINT N'=== KỊCH BẢN 1: TẢI TRANG DANH SÁCH & BỘ LỌC TRÊN WEB ===';

-- [1-A] Load toàn bộ danh sách mặc định khi vào trang
PRINT N'>> [1-A] Danh sách tất cả hợp đồng chờ thu tiền:';
EXEC SP_TraCuuHopDongChoThuNhanPhong;
GO

-- [1-B] Tìm kiếm theo từ khóa 'Nguyễn' (Người dùng gõ ô tìm kiếm)
PRINT N'>> [1-B] Kết quả tìm kiếm từ khóa N''Nguyễn'':';
EXEC SP_TraCuuHopDongChoThuNhanPhong @TuKhoa = N'Nguyễn';
GO

-- [1-C] Lọc trạng thái 'Chưa thanh toán' (Chọn dropdown lọc trạng thái)
PRINT N'>> [1-C] Kết quả lọc hợp đồng Chưa thanh toán:';
EXEC SP_TraCuuHopDongChoThuNhanPhong @TrangThaiThuTien = N'Chưa thanh toán';
GO

-- [1-D] Lọc trạng thái 'Đã thanh toán' (Chọn dropdown lọc trạng thái)
PRINT N'>> [1-D] Kết quả lọc hợp đồng Đã thanh toán:';
EXEC SP_TraCuuHopDongChoThuNhanPhong @TrangThaiThuTien = N'Đã thanh toán';
GO

-- [1-E] Lọc theo mã phòng 'P204' (Chọn dropdown lọc theo phòng)
PRINT N'>> [1-E] Kết quả lọc theo phòng P204:';
EXEC SP_TraCuuHopDongChoThuNhanPhong @MaPhong = 'P204';
GO


-- ================================================================
-- KỊCH BẢN 2: Luồng nghiệp vụ Ghi nhận đóng tiền đủ (Hợp đồng chưa lập hóa đơn)
-- Phản ánh hành động: Khách hàng check-in, Kế toán mở Modal, tính tiền và đóng ĐỦ
-- Sử dụng Hợp đồng mẫu HD9002 (Hiện đang Hiệu lực và chưa phát sinh hóa đơn kỳ đầu)
-- ================================================================
PRINT N'';
PRINT N'=== KỊCH BẢN 2: LUỒNG ĐÓNG TIỀN ĐỦ KHI CHECK-IN (HD9002) ===';

-- Sử dụng TRANSACTION để không làm bẩn dữ liệu thật của Web khi test đi test lại
BEGIN TRAN;

-- [2-A] Load Modal đóng tiền: Tính toán khoản cần thu của HD9002
PRINT N'>> [2-A] Kết quả tính toán hiển thị lên Modal đóng tiền của HD9002:';
EXEC SP_TinhKhoanThuNhanPhong @MaHopDong = 'HD9002';

-- Tính động tổng tiền cần đóng cho HD9002 từ database để khớp chính xác giá thuê/kỳ thanh toán thực tế
DECLARE @TongCanThu2 DECIMAL(15,2);
SELECT @TongCanThu2 = (CASE WHEN KyThanhToan = N'Hàng tháng' THEN GiaThue ELSE GiaThue * 3 END)
                      + ISNULL((SELECT SUM(dv.DonGia) FROM DichVuHopDong dvhd JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu WHERE dvhd.MaHopDong = hd.MaHopDong), 0)
FROM HopDongThue hd WHERE hd.MaHopDong = 'HD9002';

-- [2-B] Xác nhận đóng tiền: Khách hàng thanh toán đủ cho HD9002
DECLARE @MaHD2B VARCHAR(6), @MaLoi2B INT, @ThongBao2B NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong
    @MaHopDong = 'HD9002',
    @MaNhanVienKeToan = 'NV0004',
    @SoTienKhachThanhToan = @TongCanThu2, -- Đóng đủ
    @PhuongThucThanhToan = N'Chuyển khoản',
    @GhiChuThanhToan = N'Khách đóng đủ qua chuyển khoản ngân hàng',
    @MaHoaDon = @MaHD2B OUTPUT,
    @MaLoi = @MaLoi2B OUTPUT,
    @ThongBao = @ThongBao2B OUTPUT;

PRINT N'>> [2-B] Kết quả đóng tiền: MaLoi = ' + CAST(@MaLoi2B AS VARCHAR) + N', ThongBao = ' + @ThongBao2B + N', MaHoaDon = ' + ISNULL(@MaHD2B, 'NULL');

-- [2-C] Tải lại danh sách lọc theo HD9002 (Kiểm tra xem Web đã cập nhật trạng thái "Đã thanh toán" và nút "Chi tiết" chưa)
PRINT N'>> [2-C] Trạng thái HD9002 trên danh sách sau khi đóng tiền thành công:';
EXEC SP_TraCuuHopDongChoThuNhanPhong @TuKhoa = 'HD9002';

-- [2-D] Click nút "Chi tiết": Tải dữ liệu Modal Chi tiết đã thanh toán
PRINT N'>> [2-D] Chi tiết hóa đơn hiển thị lên Modal xem lại của HD9002:';
EXEC SP_LayChiTietThuNhanPhong @MaHopDong = 'HD9002';

-- [2-E] Bước Bàn giao phòng: SP kiểm tra điều kiện check-in xem khách có được nhận phòng không
DECLARE @HL2E BIT, @ML2E INT, @TB2E NVARCHAR(500);
EXEC SP_KiemTraDieuKienBanGiaoSauThuTien @MaHopDong = 'HD9002', @HopLe = @HL2E OUTPUT, @MaLoi = @ML2E OUTPUT, @ThongBao = @TB2E OUTPUT;
PRINT N'>> [2-E] Kết quả kiểm tra bàn giao: HopLe = ' + CAST(@HL2E AS VARCHAR) + N', MaLoi = ' + CAST(@ML2E AS VARCHAR) + N', ThongBao = ' + @TB2E;

ROLLBACK TRAN;
PRINT N'>> Đã Rollback dữ liệu thử nghiệm Kịch bản 2.';
GO


-- ================================================================
-- KỊCH BẢN 3: Luồng đóng tiền 2 lần (Đóng thiếu lần 1, đóng nốt lần 2)
-- Phản ánh hành động: Khách đóng trước một phần, hệ thống chưa cho nhận phòng. 
-- Sau đó khách đóng nốt số tiền còn lại, hệ thống mở khóa cho nhận phòng.
-- Sử dụng Hợp đồng mẫu HD9002
-- ================================================================
PRINT N'';
PRINT N'=== KỊCH BẢN 3: LUỒNG ĐÓNG THIẾU TIỀN VÀ ĐÓNG NỐT LẦN 2 (HD9002) ===';

BEGIN TRAN;

-- Tính động tổng tiền cần đóng cho HD9002 từ database
DECLARE @TongCanThu3 DECIMAL(15,2);
SELECT @TongCanThu3 = (CASE WHEN KyThanhToan = N'Hàng tháng' THEN GiaThue ELSE GiaThue * 3 END)
                      + ISNULL((SELECT SUM(dv.DonGia) FROM DichVuHopDong dvhd JOIN DichVu dv ON dv.MaDichVu = dvhd.MaDichVu WHERE dvhd.MaHopDong = hd.MaHopDong), 0)
FROM HopDongThue hd WHERE hd.MaHopDong = 'HD9002';

-- [3-A] Khách đóng thiếu lần 1: Chỉ đóng một phần tiền (bớt đi 3 triệu)
DECLARE @SoTienDongThieu DECIMAL(15,2) = @TongCanThu3 - 3000000;
DECLARE @MaHD3A VARCHAR(6), @MaLoi3A INT, @ThongBao3A NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong
    @MaHopDong = 'HD9002',
    @MaNhanVienKeToan = 'NV0004',
    @SoTienKhachThanhToan = @SoTienDongThieu, -- Đóng thiếu
    @PhuongThucThanhToan = N'Tiền mặt',
    @GhiChuThanhToan = N'Khách đóng trước một phần tiền mặt',
    @MaHoaDon = @MaHD3A OUTPUT,
    @MaLoi = @MaLoi3A OUTPUT,
    @ThongBao = @ThongBao3A OUTPUT;

PRINT N'>> [3-A] Kết quả đóng tiền Lần 1: MaLoi = ' + CAST(@MaLoi3A AS VARCHAR) + N', ThongBao = ' + @ThongBao3A + N', MaHoaDon = ' + ISNULL(@MaHD3A, 'NULL');

-- Kiểm tra trạng thái trên danh sách (Vẫn là "Chưa thanh toán" và nút "Ghi nhận thu tiền")
PRINT N'>> Trạng thái HD9002 sau đóng tiền Lần 1:';
EXEC SP_TraCuuHopDongChoThuNhanPhong @TuKhoa = 'HD9002';

-- Kiểm tra điều kiện bàn giao phòng (Kỳ vọng: HopLe = 0, chưa được nhận phòng)
DECLARE @HL3A BIT, @ML3A INT, @TB3A NVARCHAR(500);
EXEC SP_KiemTraDieuKienBanGiaoSauThuTien @MaHopDong = 'HD9002', @HopLe = @HL3A OUTPUT, @MaLoi = @ML3A OUTPUT, @ThongBao = @TB3A OUTPUT;
PRINT N'>> Kiểm tra bàn giao sau Lần 1: HopLe = ' + CAST(@HL3A AS VARCHAR) + N', MaLoi = ' + CAST(@ML3A AS VARCHAR) + N', ThongBao = ' + @TB3A;

-- [3-B] Khách đóng nốt tiền lần 2: Đóng lũy kế đủ 100%
-- Thủ tục sẽ cập nhật trực tiếp trên hóa đơn vừa tạo ở bước 3A
DECLARE @MaHD3B VARCHAR(6), @MaLoi3B INT, @ThongBao3B NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong
    @MaHopDong = 'HD9002',
    @MaNhanVienKeToan = 'NV0004',
    @SoTienKhachThanhToan = @TongCanThu3, -- Đóng đủ tổng cộng
    @PhuongThucThanhToan = N'Tiền mặt',
    @GhiChuThanhToan = N'Khách đóng nốt số còn lại',
    @MaHoaDon = @MaHD3B OUTPUT,
    @MaLoi = @MaLoi3B OUTPUT,
    @ThongBao = @ThongBao3B OUTPUT;

PRINT N'>> [3-B] Kết quả đóng tiền Lần 2: MaLoi = ' + CAST(@MaLoi3B AS VARCHAR) + N', ThongBao = ' + @ThongBao3B + N', MaHoaDon = ' + ISNULL(@MaHD3B, 'NULL');

-- Kiểm tra trạng thái trên danh sách (Đã chuyển sang "Đã thanh toán" và nút "Chi tiết")
PRINT N'>> Trạng thái HD9002 sau đóng tiền Lần 2:';
EXEC SP_TraCuuHopDongChoThuNhanPhong @TuKhoa = 'HD9002';

-- Kiểm tra điều kiện bàn giao phòng (Kỳ vọng: HopLe = 1, được nhận phòng)
DECLARE @HL3B BIT, @ML3B INT, @TB3B NVARCHAR(500);
EXEC SP_KiemTraDieuKienBanGiaoSauThuTien @MaHopDong = 'HD9002', @HopLe = @HL3B OUTPUT, @MaLoi = @ML3B OUTPUT, @ThongBao = @TB3B OUTPUT;
PRINT N'>> Kiểm tra bàn giao sau Lần 2: HopLe = ' + CAST(@HL3B AS VARCHAR) + N', MaLoi = ' + CAST(@ML3B AS VARCHAR) + N', ThongBao = ' + @TB3B;

ROLLBACK TRAN;
PRINT N'>> Đã Rollback dữ liệu thử nghiệm Kịch bản 3.';
GO


-- ================================================================
-- KỊCH BẢN 4: Xem chi tiết hóa đơn đã được thanh toán trước đó
-- Phản ánh hành động: Click nút "Chi tiết" của hợp đồng đã đóng tiền từ trước
-- Sử dụng Hợp đồng mẫu HD0001 (Đã có hóa đơn HO0001 ở trạng thái Đã TT)
-- ================================================================
PRINT N'';
PRINT N'=== KỊCH BẢN 4: XEM CHI TIẾT HÓA ĐƠN ĐÃ THANH TOÁN TRƯỚC ĐÓ (HD0001) ===';

-- [4-A] Load Modal chi tiết
PRINT N'>> [4-A] Chi tiết hóa đơn hiển thị trên Modal xem lại của HD0001:';
EXEC SP_LayChiTietThuNhanPhong @MaHopDong = 'HD0001';

-- [4-B] Kiểm tra điều kiện bàn giao phòng (Kỳ vọng: Chấp nhận bàn giao ngay)
DECLARE @HL4B BIT, @ML4B INT, @TB4B NVARCHAR(500);
EXEC SP_KiemTraDieuKienBanGiaoSauThuTien @MaHopDong = 'HD0001', @HopLe = @HL4B OUTPUT, @MaLoi = @ML4B OUTPUT, @ThongBao = @TB4B OUTPUT;
PRINT N'>> [4-B] Kiểm tra bàn giao HD0001: HopLe = ' + CAST(@HL4B AS VARCHAR) + N', MaLoi = ' + CAST(@ML4B AS VARCHAR) + N', ThongBao = ' + @TB4B;

-- [4-C] Đóng trùng: Thử gọi SP đóng tiền tiếp cho HD0001 (Kỳ vọng: Trả lỗi -3 để chống đóng tiền 2 lần)
DECLARE @MaHD4C VARCHAR(6), @MaLoi4C INT, @ThongBao4C NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong
    @MaHopDong = 'HD0001',
    @MaNhanVienKeToan = 'NV0004',
    @SoTienKhachThanhToan = 3500000,
    @PhuongThucThanhToan = N'Chuyển khoản',
    @MaHoaDon = @MaHD4C OUTPUT,
    @MaLoi = @MaLoi4C OUTPUT,
    @ThongBao = @ThongBao4C OUTPUT;

PRINT N'>> [4-C] Kết quả thử đóng trùng: MaLoi = ' + CAST(@MaLoi4C AS VARCHAR) + N', ThongBao = ' + @ThongBao4C + N', MaHoaDon = ' + ISNULL(@MaHD4C, 'NULL');
GO


-- ================================================================
-- KỊCH BẢN 5: Các trường hợp ngoại lệ nghiệp vụ thực tế
-- ================================================================
PRINT N'';
PRINT N'=== KỊCH BẢN 5: CÁC TRƯỜNG HỢP NGOẠI LỆ NGHIỆP VỤ THỰC TẾ ===';

-- [5-A] Hợp đồng không tồn tại (Ví dụ nhập nhầm mã trên Web) -> Kỳ vọng: MaLoi = -1
DECLARE @MaHD5A VARCHAR(6), @MaLoi5A INT, @ThongBao5A NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong @MaHopDong = 'HD9999', @MaNhanVienKeToan = 'NV0004', @SoTienKhachThanhToan = 1000, @PhuongThucThanhToan = N'Tiền mặt', @MaHoaDon = @MaHD5A OUTPUT, @MaLoi = @MaLoi5A OUTPUT, @ThongBao = @ThongBao5A OUTPUT;
PRINT N'>> [5-A] Hợp đồng không tồn tại: MaLoi = ' + CAST(@MaLoi5A AS VARCHAR) + N', ThongBao = ' + @ThongBao5A;

-- [5-B] Hợp đồng hết hạn/đã thanh lý -> Kỳ vọng: MaLoi = -2
DECLARE @MaHD5B VARCHAR(6), @MaLoi5B INT, @ThongBao5B NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong @MaHopDong = 'HD0002', @MaNhanVienKeToan = 'NV0004', @SoTienKhachThanhToan = 1000, @PhuongThucThanhToan = N'Tiền mặt', @MaHoaDon = @MaHD5B OUTPUT, @MaLoi = @MaLoi5B OUTPUT, @ThongBao = @ThongBao5B OUTPUT;
PRINT N'>> [5-B] Hợp đồng đã thanh lý: MaLoi = ' + CAST(@MaLoi5B AS VARCHAR) + N', ThongBao = ' + @ThongBao5B;

-- [5-C] Nhập số tiền thanh toán âm -> Kỳ vọng: MaLoi = -6
DECLARE @MaHD5C VARCHAR(6), @MaLoi5C INT, @ThongBao5C NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong @MaHopDong = 'HD9002', @MaNhanVienKeToan = 'NV0004', @SoTienKhachThanhToan = -1000, @PhuongThucThanhToan = N'Tiền mặt', @MaHoaDon = @MaHD5C OUTPUT, @MaLoi = @MaLoi5C OUTPUT, @ThongBao = @ThongBao5C OUTPUT;
PRINT N'>> [5-C] Nhập số tiền khách trả bị âm: MaLoi = ' + CAST(@MaLoi5C AS VARCHAR) + N', ThongBao = ' + @ThongBao5C;

-- [5-D] Chọn phương thức thanh toán không được hỗ trợ -> Kỳ vọng: MaLoi = -7
DECLARE @MaHD5D VARCHAR(6), @MaLoi5D INT, @ThongBao5D NVARCHAR(500);
EXEC SP_GhiNhanKhoanThuNhanPhong @MaHopDong = 'HD9002', @MaNhanVienKeToan = 'NV0004', @SoTienKhachThanhToan = 3180000, @PhuongThucThanhToan = N'Ví Momo', @MaHoaDon = @MaHD5D OUTPUT, @MaLoi = @MaLoi5D OUTPUT, @ThongBao = @ThongBao5D OUTPUT;
PRINT N'>> [5-D] Chọn sai phương thức thanh toán: MaLoi = ' + CAST(@MaLoi5D AS VARCHAR) + N', ThongBao = ' + @ThongBao5D;
GO

PRINT N'================================================================';
PRINT N'CHẠY XONG CÁC TEST CASES GHI NHẬN KHOẢN THU THỰC TẾ TRÊN WEB';
PRINT N'================================================================';
GO
