-- Kịch bản cập nhật Database: Tách GhiChuSale ra thành cột riêng cho bảng PhieuDangKy
USE HOMEDORM4;
GO

-- 1. Thêm cột GhiChuSale vào bảng PhieuDangKy nếu cột này chưa tồn tại
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE Name = N'GhiChuSale' AND Object_ID = Object_ID(N'dbo.PhieuDangKy')
)
BEGIN
    ALTER TABLE dbo.PhieuDangKy ADD GhiChuSale NVARCHAR(MAX) NULL;
    PRINT N'Đã thêm cột GhiChuSale vào bảng PhieuDangKy';
END
ELSE
BEGIN
    PRINT N'Cột GhiChuSale đã tồn tại, bỏ qua bước thêm cột.';
END
GO

-- 2. Xóa ràng buộc cũ nếu nó vẫn còn tồn tại
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CHK_PDK_TrangThai')
BEGIN
    ALTER TABLE dbo.PhieuDangKy DROP CONSTRAINT CHK_PDK_TrangThai;
    PRINT N'Đã xóa ràng buộc CHK_PDK_TrangThai cũ.';
END
GO

-- 3. Tách dữ liệu cũ: Cắt phần "Ghi chú Sale" từ YeuCauKhac sang cột GhiChuSale mới
UPDATE dbo.PhieuDangKy
SET GhiChuSale = SUBSTRING(YeuCauKhac, CHARINDEX(' | Ghi chú Sale: ', YeuCauKhac) + 17, LEN(YeuCauKhac)),
    YeuCauKhac = SUBSTRING(YeuCauKhac, 1, CHARINDEX(' | Ghi chú Sale: ', YeuCauKhac) - 1)
WHERE YeuCauKhac LIKE '% | Ghi chú Sale: %';
GO

-- 4. Thêm lại ràng buộc mới (ĐẦY ĐỦ các trạng thái)
ALTER TABLE dbo.PhieuDangKy ADD CONSTRAINT CHK_PDK_TrangThai 
CHECK (TrangThai IN (N'Chờ xác nhận cọc', N'Xác nhận cọc', N'Từ chối', N'Chờ tiếp nhận', N'Đã tiếp nhận'));
PRINT N'Đã thêm lại ràng buộc CHK_PDK_TrangThai mới.';
GO
