USE [HOMEDORM4];
GO

-- =============================================
-- TEST DATA: Thêm các phiếu đối soát ở trạng thái "Chờ xác nhận"
-- Dùng để test chức năng "Xác nhận đối soát" cho Nhân viên quản lý
-- =============================================

-- Xóa dữ liệu cũ nếu đã tồn tại để tránh lỗi trùng khóa chính (Primary Key)
DELETE FROM DoiSoat WHERE MaDoiSoat IN ('DS0005', 'DS0006', 'DS0007');

INSERT INTO DoiSoat (
    MaDoiSoat, NgayLap, TienCocBanDau, SoThangLuuTru, TyLeHoanCocHienTai, TienCocDuocHoan, 
    TienThueConNo, TienDichVuConNo, TongChiPhiSuaChua, TienPhat, TongKhauTru, 
    SoTienHoanThucTe, SoTienKhachPhaiTT, PhuongThucThanhToan, ChungTuThanhToan, NgayThanhToan, 
    GhiChuPhanHoiKhach, TrangThai, MaNhanVienKeToan, MaPhieuTra, MaQuyDinhHoanCoc
) VALUES
    -- DS0005: Khách được hoàn tiền cọc sau khi đã trừ đi công nợ
    ('DS0005', '2026-06-30', 2000000.00, 2.0, 100.00, 2000000.00, 0.00, 500000.00, 0.00, 0.00, 500000.00, 1500000.00, 0.00, NULL, NULL, NULL, NULL, N'Chờ xác nhận', 'NV0012', 'TP0007', 'QH0004'),
    
    -- DS0006: Khách phải đóng thêm tiền do chi phí sửa chữa vượt quá tiền cọc
    ('DS0006', '2026-06-30', 1500000.00, 4.0, 100.00, 1500000.00, 0.00, 500000.00, 1500000.00, 0.00, 2000000.00, 0.00, 500000.00, NULL, NULL, NULL, NULL, N'Chờ xác nhận', 'NV0012', 'TP0010', 'QH0004'),
    
    -- DS0007: Số tiền cọc bị trừ vừa hết (không hoàn, không thu thêm)
    ('DS0007', '2026-06-30', 1000000.00, 6.0, 100.00, 1000000.00, 0.00, 1000000.00, 0.00, 0.00, 1000000.00, 0.00, 0.00, NULL, NULL, NULL, NULL, N'Chờ xác nhận', 'NV0012', 'TP0011', 'QH0004');
GO
