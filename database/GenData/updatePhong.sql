-- Update dữ liệu bảng Phong từ bản cũ sang bản mới

UPDATE Phong
SET TinhTrang = N'Còn chỗ'
WHERE MaPhong = N'P102';

UPDATE Phong
SET GioiTinhChoPhep = N'Không phân biệt'
WHERE MaPhong = N'P103';

UPDATE Phong
SET GioiTinhChoPhep = N'Không phân biệt'
WHERE MaPhong = N'P105';

UPDATE Phong
SET GioiTinhChoPhep = N'Không phân biệt'
WHERE MaPhong = N'P202';

UPDATE Phong
SET 
    GioiTinhChoPhep = N'Không phân biệt',
    TinhTrang = N'Trống'
WHERE MaPhong = N'P203';

UPDATE Phong
SET GioiTinhChoPhep = N'Không phân biệt'
WHERE MaPhong = N'P205';

UPDATE Phong
SET TinhTrang = N'Còn chỗ'
WHERE MaPhong = N'P206';

UPDATE Phong
SET GioiTinhChoPhep = N'Không phân biệt'
WHERE MaPhong = N'P301';

UPDATE Phong
SET TinhTrang = N'Trống'
WHERE MaPhong = N'P302';

UPDATE Phong
SET TinhTrang = N'Trống'
WHERE MaPhong = N'P303';

UPDATE Phong
SET GioiTinhChoPhep = N'Nam'
WHERE MaPhong = N'P304';

UPDATE Phong
SET TinhTrang = N'Trống'
WHERE MaPhong = N'P305';

GO

-- Bảng liên kết Phiếu đăng ký - Loại phòng
CREATE TABLE PDK_LoaiPhong (
    MaDangKy   VARCHAR(6) NOT NULL,
    MaLoaiPhong VARCHAR(6) NOT NULL,

    CONSTRAINT PK_PDK_LoaiPhong 
        PRIMARY KEY (MaDangKy, MaLoaiPhong),

    CONSTRAINT FK_PDK_LoaiPhong_PhieuDangKy
        FOREIGN KEY (MaDangKy) 
        REFERENCES PhieuDangKy(MaDangKy),

    CONSTRAINT FK_PDK_LoaiPhong_LoaiPhong
        FOREIGN KEY (MaLoaiPhong) 
        REFERENCES LoaiPhong(MaLoaiPhong)
);
GO
-- 15. PDK_LoaiPhong
INSERT INTO PDK_LoaiPhong (MaDangKy, MaLoaiPhong) VALUES
    (N'DK0001', N'LP0002'),
    (N'DK0002', N'LP0002'),
    (N'DK0003', N'LP0003'),
    (N'DK0004', N'LP0002'),
    (N'DK0005', N'LP0002'),
    (N'DK0006', N'LP0003'),
    (N'DK0007', N'LP0004'),
    (N'DK0008', N'LP0002'),
    (N'DK0009', N'LP0004'),
    (N'DK0010', N'LP0003'),
    (N'DK0011', N'LP0001'),
    (N'DK0012', N'LP0004'),
    (N'DK0013', N'LP0002'),
    (N'DK0014', N'LP0001'),
    (N'DK0015', N'LP0004'),
    (N'DK0016', N'LP0002'),
    (N'DK0017', N'LP0003'),
    (N'DK0018', N'LP0003'),
    (N'DK0019', N'LP0001'),
    (N'DK0020', N'LP0004'),
    (N'DK0021', N'LP0004'),
    (N'DK0022', N'LP0004'),
    (N'DK0023', N'LP0002'),
    (N'DK0024', N'LP0003'),
    (N'DK0025', N'LP0004'),
    (N'DK0026', N'LP0002'),
    (N'DK0027', N'LP0001'),
    (N'DK0028', N'LP0002'),
    (N'DK0029', N'LP0001'),
    (N'DK0030', N'LP0001'),
    (N'DK0031', N'LP0002'),
    (N'DK0032', N'LP0001'),
    (N'DK0033', N'LP0001'),
    (N'DK0034', N'LP0001'),
    (N'DK0035', N'LP0003'),
    (N'DK0036', N'LP0004'),
    (N'DK0037', N'LP0002'),
    (N'DK0038', N'LP0002'),
    (N'DK0039', N'LP0004'),
    (N'DK0040', N'LP0004'),
    (N'DK0041', N'LP0004'),
    (N'DK0042', N'LP0001');
GO

ALTER TABLE PhieuDangKy
DROP COLUMN LoaiPhongYeuCau;
GO