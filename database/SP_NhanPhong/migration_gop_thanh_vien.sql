USE HOMEDORM4;
GO

-- 1. Cập nhật cấu trúc bảng ThanhVienHopDong và Drop các ràng buộc cũ
PRINT N'Bắt đầu cập nhật cấu trúc bảng ThanhVienHopDong...';

-- Drop khóa ngoại FK_TVHD_HopDong cũ để cho phép cột MaHopDong chấp nhận NULL
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TVHD_HopDong')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong DROP CONSTRAINT FK_TVHD_HopDong;
END

-- Drop check constraint CHK_TVHD_TrangThai cũ để tránh xung đột khi chuyển đổi dữ liệu
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'CHK_TVHD_TrangThai' AND type = 'C')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong DROP CONSTRAINT CHK_TVHD_TrangThai;
END

-- Sửa cột MaHopDong thành NULL
ALTER TABLE dbo.ThanhVienHopDong ALTER COLUMN MaHopDong VARCHAR(6) NULL;

-- Thêm cột MaHoSoCuTru làm khóa ngoại liên kết với HoSoCuTru
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ThanhVienHopDong') AND name = 'MaHoSoCuTru')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong ADD MaHoSoCuTru VARCHAR(6) NULL;
END

-- Thêm cột LyDoTuChoi để lưu thông tin từ chối duyệt
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ThanhVienHopDong') AND name = 'LyDoTuChoi')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong ADD LyDoTuChoi NVARCHAR(500) NULL;
END
GO

-- 2. Chuyển đổi dữ liệu từ ThanhVienCuTru sang ThanhVienHopDong và xóa bảng cũ
IF OBJECT_ID('dbo.ThanhVienCuTru', 'U') IS NOT NULL
BEGIN
    PRINT N'Phát hiện bảng ThanhVienCuTru. Tiến hành chuyển đổi dữ liệu...';

    -- Chuyển dữ liệu thành viên từ ThanhVienCuTru sang ThanhVienHopDong
    -- Ánh xạ mã thành viên từ TCxxxx thành TVxxxx để đồng bộ
    INSERT INTO dbo.ThanhVienHopDong (
        MaThanhVien, MaHoSoCuTru, MaHopDong, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, LyDoTuChoi
    )
    SELECT 
        'TV' + SUBSTRING(tc.MaThanhVienCuTru, 3, 4),
        tc.MaHoSoCuTru,
        NULL,
        tc.HoTen,
        tc.NgaySinh,
        tc.GioiTinh,
        tc.CCCD,
        tc.SDT,
        tc.Email,
        tc.QuocTich,
        CASE 
            WHEN tc.TrangThaiDuyet = N'Chờ duyệt' THEN N'Chờ duyệt'
            WHEN tc.TrangThaiDuyet = N'Đủ điều kiện' THEN N'Đủ điều kiện'
            WHEN tc.TrangThaiDuyet = N'Bị từ chối' THEN N'Bị từ chối'
            ELSE N'Chờ duyệt'
        END,
        tc.LyDoTuChoi
    FROM dbo.ThanhVienCuTru tc
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.ThanhVienHopDong th 
        WHERE th.MaThanhVien = 'TV' + SUBSTRING(tc.MaThanhVienCuTru, 3, 4)
    );

    -- Xóa bảng ThanhVienCuTru cũ
    DROP TABLE dbo.ThanhVienCuTru;
    PRINT N'Đã hoàn tất chuyển đổi dữ liệu và xóa bảng ThanhVienCuTru.';
END
GO

-- 3. Cập nhật lại các Ràng buộc & Khóa ngoại mới
PRINT N'Cập nhật lại các ràng buộc kiểm tra và khóa ngoại cho ThanhVienHopDong...';

-- Thêm check constraint CHK_TVHD_TrangThai mới với đầy đủ trạng thái cả 2 giai đoạn
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'CHK_TVHD_TrangThai' AND type = 'C')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong ADD CONSTRAINT CHK_TVHD_TrangThai CHECK (TrangThai IN (
        N'Chờ duyệt', N'Đủ điều kiện', N'Bị từ chối', N'Đang ở', N'Đã rời'
    ));
END
GO

-- Thêm lại FK_TVHD_HopDong liên kết với bảng HopDongThue
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TVHD_HopDong')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong
        ADD CONSTRAINT FK_TVHD_HopDong FOREIGN KEY (MaHopDong) REFERENCES dbo.HopDongThue(MaHopDong);
END
GO

-- Thêm FK_TVHD_HoSoCuTru liên kết với bảng HoSoCuTru
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_TVHD_HoSoCuTru')
BEGIN
    ALTER TABLE dbo.ThanhVienHopDong
        ADD CONSTRAINT FK_TVHD_HoSoCuTru FOREIGN KEY (MaHoSoCuTru) REFERENCES dbo.HoSoCuTru(MaHoSoCuTru);
END
GO

PRINT N'Hoàn tất cập nhật Migration Cơ sở dữ liệu thành công.';
GO
