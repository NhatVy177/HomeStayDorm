USE HOMEDORM4;
GO
SET DATEFORMAT ymd;
GO


/* ============================================================
   SEED DATA HOMEDORM4 - ĐÃ CHỈNH LOGIC NGHIỆP VỤ
   - Giới tính chỉ Nam/Nữ
   - Mỗi phòng chỉ cho một giới tính, không dùng Hỗn hợp
   - Thành viên cùng phòng cùng giới tính
   - Mỗi người dùng có một tài khoản
   - Ngày tháng hợp lệ, tiền cọc không NULL
   ============================================================ */
GO


INSERT INTO ChiNhanh (MaChiNhanh, TenChiNhanh, DiaChi, SDT, Email, TrangThai) VALUES
    (N'CN0001', N'HomeDorm Quận 1', N'12 Nguyễn Trãi, Quận 1, TP.HCM', N'02811110001', N'q1@homedorm.vn', N'Hoạt động'),
    (N'CN0002', N'HomeDorm Bình Thạnh', N'45 Điện Biên Phủ, Bình Thạnh, TP.HCM', N'02811110002', N'binhthanh@homedorm.vn', N'Hoạt động'),
    (N'CN0003', N'HomeDorm Thủ Đức', N'88 Võ Văn Ngân, Thủ Đức, TP.HCM', N'02811110003', N'thuduc@homedorm.vn', N'Hoạt động');
GO

INSERT INTO LoaiPhong (MaLoaiPhong, TenLoaiPhong, SucChuaToiDa, MoTa, GiaThueTheoGiuong, GiaThueNguyenPhong) VALUES
    (N'LP0001', N'Phòng 2 người', 2, N'Phòng tiêu chuẩn 2 giường, có điều hòa', 2200000, NULL),
    (N'LP0002', N'Phòng 4 người', 4, N'Phòng 4 giường, có điều hòa', 1800000, NULL),
    (N'LP0003', N'Phòng 6 người', 6, N'Phòng 6 giường, quạt và tiện ích cơ bản', 1400000, NULL),
    (N'LP0004', N'Phòng VIP 2 người', 2, N'Phòng cao cấp 2 giường, đầy đủ tiện nghi', 3000000, NULL);
GO

INSERT INTO NguoiDung (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung) VALUES
    (N'NV0001', N'Nguyễn Minh Khoa', N'1990-01-15', N'Nam', N'090100001', N'nv0001@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0002', N'Trần Bảo Khuê', N'1991-02-15', N'Nữ', N'090100002', N'nv0002@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0003', N'Lê Thành Nhân', N'1992-03-15', N'Nam', N'090100003', N'nv0003@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0004', N'Phạm Hoài Thương', N'1993-04-15', N'Nữ', N'090100004', N'nv0004@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0005', N'Bùi Duy Đăng', N'1994-05-15', N'Nam', N'090100005', N'nv0005@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0006', N'Võ Linh Chi', N'1995-06-15', N'Nữ', N'090100006', N'nv0006@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0007', N'Đặng Song Toàn', N'1996-07-15', N'Nam', N'090100007', N'nv0007@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0008', N'Bùi Hà Kim', N'1997-08-15', N'Nữ', N'090100008', N'nv0008@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0009', N'Huỳnh Khoa Minh', N'1998-09-15', N'Nam', N'090100009', N'nv0009@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0010', N'Ngô Mai Thảo', N'1999-01-15', N'Nữ', N'090100010', N'nv0010@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0011', N'Đỗ Long Châu', N'1990-02-15', N'Nam', N'090100011', N'nv0011@homedorm.vn', NULL, N'NhanVien'),
    (N'NV0012', N'Đinh Lan Ngọc', N'1991-03-15', N'Nữ', N'090100012', N'nv0012@homedorm.vn', NULL, N'NhanVien');
GO

INSERT INTO NhanVien (MaNhanVien, MaChiNhanh, NgayVaoLam, ChucVu) VALUES
    (N'NV0001', N'CN0001', N'2024-01-01', N'Sale'),
    (N'NV0002', N'CN0001', N'2024-02-01', N'Sale'),
    (N'NV0003', N'CN0001', N'2024-03-01', N'Quản lý'),
    (N'NV0004', N'CN0001', N'2024-04-01', N'Kế toán'),
    (N'NV0005', N'CN0002', N'2024-05-01', N'Sale'),
    (N'NV0006', N'CN0002', N'2024-06-01', N'Sale'),
    (N'NV0007', N'CN0002', N'2024-07-01', N'Quản lý'),
    (N'NV0008', N'CN0002', N'2024-08-01', N'Kế toán'),
    (N'NV0009', N'CN0003', N'2024-09-01', N'Sale'),
    (N'NV0010', N'CN0003', N'2024-01-01', N'Sale'),
    (N'NV0011', N'CN0003', N'2024-02-01', N'Quản lý'),
    (N'NV0012', N'CN0003', N'2024-03-01', N'Kế toán');
GO

INSERT INTO NguoiDung (MaNguoiDung, HoTen, NgaySinh, GioiTinh, SDT, Email, UrlAvt, LoaiNguoiDung) VALUES
    (N'KH0001', N'Nguyễn Văn An', N'1996-02-02', N'Nam', N'091200001', N'kh0001@mail.com', NULL, N'KhachHang'),
    (N'KH0002', N'Trần Thị Bình', N'1997-03-03', N'Nữ', N'091200002', N'kh0002@mail.com', NULL, N'KhachHang'),
    (N'KH0003', N'Lê Quốc Cường', N'1998-04-04', N'Nam', N'091200003', N'kh0003@mail.com', NULL, N'KhachHang'),
    (N'KH0004', N'Phạm Minh Duy', N'1999-05-05', N'Nam', N'091200004', N'kh0004@mail.com', NULL, N'KhachHang'),
    (N'KH0005', N'Hoàng Thảo Vy', N'2000-06-06', N'Nữ', N'091200005', N'kh0005@mail.com', NULL, N'KhachHang'),
    (N'KH0006', N'Võ Gia Hân', N'2001-07-07', N'Nữ', N'091200006', N'kh0006@mail.com', NULL, N'KhachHang'),
    (N'KH0007', N'Đặng Minh Khôi', N'2002-08-08', N'Nam', N'091200007', N'kh0007@mail.com', NULL, N'KhachHang'),
    (N'KH0008', N'Bùi Thanh Lam', N'1995-09-09', N'Nữ', N'091200008', N'kh0008@mail.com', NULL, N'KhachHang'),
    (N'KH0009', N'Huỳnh Nhật Nam', N'1996-01-01', N'Nam', N'091200009', N'kh0009@mail.com', NULL, N'KhachHang'),
    (N'KH0010', N'Ngô Bảo Ngọc', N'1997-02-02', N'Nữ', N'091200010', N'kh0010@mail.com', NULL, N'KhachHang'),
    (N'KH0011', N'Đỗ Hoài Phương', N'1998-03-03', N'Nam', N'091200011', N'kh0011@mail.com', NULL, N'KhachHang'),
    (N'KH0012', N'Đinh Đức Quang', N'1999-04-04', N'Nam', N'091200012', N'kh0012@mail.com', NULL, N'KhachHang'),
    (N'KH0013', N'Mai Thu Trang', N'2000-05-05', N'Nữ', N'091200013', N'kh0013@mail.com', NULL, N'KhachHang'),
    (N'KH0014', N'Phan Hải Yến', N'2001-06-06', N'Nữ', N'091200014', N'kh0014@mail.com', NULL, N'KhachHang'),
    (N'KH0015', N'Tô Khánh Linh', N'2002-07-07', N'Nữ', N'091200015', N'kh0015@mail.com', NULL, N'KhachHang'),
    (N'KH0016', N'Cao Minh Tú', N'1995-08-08', N'Nam', N'091200016', N'kh0016@mail.com', NULL, N'KhachHang'),
    (N'KH0017', N'Lý Gia Bảo', N'1996-09-09', N'Nam', N'091200017', N'kh0017@mail.com', NULL, N'KhachHang'),
    (N'KH0018', N'Dương Anh Khoa', N'1997-01-01', N'Nam', N'091200018', N'kh0018@mail.com', NULL, N'KhachHang'),
    (N'KH0019', N'Hồ Thanh Nhã', N'1998-02-02', N'Nữ', N'091200019', N'kh0019@mail.com', NULL, N'KhachHang'),
    (N'KH0020', N'Vương Ngọc Mai', N'1999-03-03', N'Nữ', N'091200020', N'kh0020@mail.com', NULL, N'KhachHang'),
    (N'KH0021', N'Nguyễn Kiều Oanh', N'2000-04-04', N'Nữ', N'091200021', N'kh0021@mail.com', NULL, N'KhachHang'),
    (N'KH0022', N'Trần Tuấn Kiệt', N'2001-05-05', N'Nam', N'091200022', N'kh0022@mail.com', NULL, N'KhachHang'),
    (N'KH0023', N'Lê Hoàng Sơn', N'2002-06-06', N'Nam', N'091200023', N'kh0023@mail.com', NULL, N'KhachHang'),
    (N'KH0024', N'Phạm Bích Ngân', N'1995-07-07', N'Nữ', N'091200024', N'kh0024@mail.com', NULL, N'KhachHang'),
    (N'KH0025', N'Hoàng Gia Huy', N'1996-08-08', N'Nam', N'091200025', N'kh0025@mail.com', NULL, N'KhachHang'),
    (N'KH0026', N'Võ Mỹ Duyên', N'1997-09-09', N'Nữ', N'091200026', N'kh0026@mail.com', NULL, N'KhachHang'),
    (N'KH0027', N'Đặng Hà My', N'1998-01-01', N'Nữ', N'091200027', N'kh0027@mail.com', NULL, N'KhachHang'),
    (N'KH0028', N'Bùi Quang Hưng', N'1999-02-02', N'Nam', N'091200028', N'kh0028@mail.com', NULL, N'KhachHang'),
    (N'KH0029', N'Huỳnh Thảo Nhi', N'2000-03-03', N'Nữ', N'091200029', N'kh0029@mail.com', NULL, N'KhachHang'),
    (N'KH0030', N'Ngô Nhật Minh', N'2001-04-04', N'Nam', N'091200030', N'kh0030@mail.com', NULL, N'KhachHang');
GO

INSERT INTO KhachHang (MaKhachHang, QuocTich, CCCD) VALUES
    (N'KH0001', N'Việt Nam', N'079200000001'),
    (N'KH0002', N'Việt Nam', N'079200000002'),
    (N'KH0003', N'Việt Nam', N'079200000003'),
    (N'KH0004', N'Việt Nam', N'079200000004'),
    (N'KH0005', N'Việt Nam', N'079200000005'),
    (N'KH0006', N'Việt Nam', N'079200000006'),
    (N'KH0007', N'Việt Nam', N'079200000007'),
    (N'KH0008', N'Việt Nam', N'079200000008'),
    (N'KH0009', N'Việt Nam', N'079200000009'),
    (N'KH0010', N'Việt Nam', N'079200000010'),
    (N'KH0011', N'Việt Nam', N'079200000011'),
    (N'KH0012', N'Việt Nam', N'079200000012'),
    (N'KH0013', N'Việt Nam', N'079200000013'),
    (N'KH0014', N'Việt Nam', N'079200000014'),
    (N'KH0015', N'Việt Nam', N'079200000015'),
    (N'KH0016', N'Việt Nam', N'079200000016'),
    (N'KH0017', N'Việt Nam', N'079200000017'),
    (N'KH0018', N'Việt Nam', N'079200000018'),
    (N'KH0019', N'Việt Nam', N'079200000019'),
    (N'KH0020', N'Việt Nam', N'079200000020'),
    (N'KH0021', N'Việt Nam', N'079200000021'),
    (N'KH0022', N'Việt Nam', N'079200000022'),
    (N'KH0023', N'Việt Nam', N'079200000023'),
    (N'KH0024', N'Việt Nam', N'079200000024'),
    (N'KH0025', N'Việt Nam', N'079200000025'),
    (N'KH0026', N'Việt Nam', N'079200000026'),
    (N'KH0027', N'Việt Nam', N'079200000027'),
    (N'KH0028', N'Việt Nam', N'079200000028'),
    (N'KH0029', N'Việt Nam', N'079200000029'),
    (N'KH0030', N'Việt Nam', N'079200000030');
GO

INSERT INTO TaiKhoan (TenDangNhap, MatKhau, TrangThai, MaNguoiDung) VALUES
    (N'nv0001', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0001'),
    (N'nv0002', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0002'),
    (N'nv0003', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0003'),
    (N'nv0004', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0004'),
    (N'nv0005', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0005'),
    (N'nv0006', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0006'),
    (N'nv0007', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0007'),
    (N'nv0008', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0008'),
    (N'nv0009', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0009'),
    (N'nv0010', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0010'),
    (N'nv0011', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0011'),
    (N'nv0012', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'NV0012'),
    (N'kh0001', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0001'),
    (N'kh0002', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0002'),
    (N'kh0003', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0003'),
    (N'kh0004', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0004'),
    (N'kh0005', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0005'),
    (N'kh0006', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0006'),
    (N'kh0007', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0007'),
    (N'kh0008', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0008'),
    (N'kh0009', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0009'),
    (N'kh0010', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0010'),
    (N'kh0011', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0011'),
    (N'kh0012', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0012'),
    (N'kh0013', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0013'),
    (N'kh0014', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0014'),
    (N'kh0015', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0015'),
    (N'kh0016', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0016'),
    (N'kh0017', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0017'),
    (N'kh0018', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0018'),
    (N'kh0019', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0019'),
    (N'kh0020', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0020'),
    (N'kh0021', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0021'),
    (N'kh0022', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0022'),
    (N'kh0023', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0023'),
    (N'kh0024', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0024'),
    (N'kh0025', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0025'),
    (N'kh0026', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Hoạt động', N'KH0026'),
    (N'kh0027', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Vô hiệu hóa', N'KH0027'),
    (N'kh0028', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Vô hiệu hóa', N'KH0028'),
    (N'kh0029', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Vô hiệu hóa', N'KH0029'),
    (N'kh0030', N'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3', N'Vô hiệu hóa', N'KH0030');
GO

INSERT INTO Phong (MaPhong, TenPhong, GioiTinhChoPhep, TinhTrang, UrlImg, MaChiNhanh, MaLoaiPhong) VALUES
    (N'P101', N'Phòng P101', N'Nam', N'Đầy', NULL, N'CN0001', N'LP0001'),
    (N'P102', N'Phòng P102', N'Nữ', N'Đầy', NULL, N'CN0001', N'LP0001'),
    (N'P103', N'Phòng P103', N'Nam', N'Đầy', NULL, N'CN0001', N'LP0002'),
    (N'P104', N'Phòng P201', N'Nam', N'Trống', NULL, N'CN0001', N'LP0002'),
    (N'P105', N'Phòng P202', N'Nữ', N'Đầy', NULL, N'CN0001', N'LP0003'),
    (N'P106', N'Phòng P203', N'Nữ', N'Trống', NULL, N'CN0001', N'LP0004'),
    (N'P201', N'Phòng P101', N'Nam', N'Trống', NULL, N'CN0002', N'LP0001'),
    (N'P202', N'Phòng P102', N'Nữ', N'Đầy', NULL, N'CN0002', N'LP0001'),
    (N'P203', N'Phòng P103', N'Nam', N'Còn chỗ', NULL, N'CN0002', N'LP0002'),
    (N'P204', N'Phòng P201', N'Nam', N'Trống', NULL, N'CN0002', N'LP0002'),
    (N'P205', N'Phòng P202', N'Nữ', N'Đã đặt cọc', NULL, N'CN0002', N'LP0003'),
    (N'P206', N'Phòng P203', N'Nữ', N'Đã đặt cọc', NULL, N'CN0002', N'LP0004'),
    (N'P301', N'Phòng P101', N'Nam', N'Còn chỗ', NULL, N'CN0003', N'LP0001'),
    (N'P302', N'Phòng P102', N'Nữ', N'Trống', NULL, N'CN0003', N'LP0001'),
    (N'P303', N'Phòng P103', N'Nữ', N'Trống', NULL, N'CN0003', N'LP0002'),
    (N'P304', N'Phòng P201', N'Nam', N'Trống', NULL, N'CN0003', N'LP0002'),
    (N'P305', N'Phòng P202', N'Nam', N'Trống', NULL, N'CN0003', N'LP0003'),
    (N'P306', N'Phòng P203', N'Nữ', N'Trống', NULL, N'CN0003', N'LP0004');
GO

INSERT INTO Giuong (MaPhong, MaGiuong, SoGiuong, TinhTrang, UrlImg) VALUES
    (N'P101', N'G01', 1, N'Đang thuê', NULL),
    (N'P101', N'G02', 2, N'Đang thuê', NULL),
    (N'P102', N'G01', 1, N'Đang thuê', NULL),
    (N'P102', N'G02', 2, N'Đang thuê', NULL),
    (N'P103', N'G01', 1, N'Đang thuê', NULL),
    (N'P103', N'G02', 2, N'Đang thuê', NULL),
    (N'P103', N'G03', 3, N'Đang thuê', NULL),
    (N'P103', N'G04', 4, N'Đang thuê', NULL),
    (N'P104', N'G01', 1, N'Trống', NULL),
    (N'P104', N'G02', 2, N'Trống', NULL),
    (N'P104', N'G03', 3, N'Trống', NULL),
    (N'P104', N'G04', 4, N'Trống', NULL),
    (N'P105', N'G01', 1, N'Đang thuê', NULL),
    (N'P105', N'G02', 2, N'Đang thuê', NULL),
    (N'P105', N'G03', 3, N'Đang thuê', NULL),
    (N'P105', N'G04', 4, N'Đang thuê', NULL),
    (N'P105', N'G05', 5, N'Đang thuê', NULL),
    (N'P105', N'G06', 6, N'Đang thuê', NULL),
    (N'P106', N'G01', 1, N'Trống', NULL),
    (N'P106', N'G02', 2, N'Trống', NULL),
    (N'P201', N'G01', 1, N'Trống', NULL),
    (N'P201', N'G02', 2, N'Trống', NULL),
    (N'P202', N'G01', 1, N'Đang thuê', NULL),
    (N'P202', N'G02', 2, N'Đang thuê', NULL),
    (N'P203', N'G01', 1, N'Đang thuê', NULL),
    (N'P203', N'G02', 2, N'Trống', NULL),
    (N'P203', N'G03', 3, N'Trống', NULL),
    (N'P203', N'G04', 4, N'Trống', NULL),
    (N'P204', N'G01', 1, N'Trống', NULL),
    (N'P204', N'G02', 2, N'Trống', NULL),
    (N'P204', N'G03', 3, N'Trống', NULL),
    (N'P204', N'G04', 4, N'Trống', NULL),
    (N'P205', N'G01', 1, N'Đã đặt cọc', NULL),
    (N'P205', N'G02', 2, N'Trống', NULL),
    (N'P205', N'G03', 3, N'Trống', NULL),
    (N'P205', N'G04', 4, N'Trống', NULL),
    (N'P205', N'G05', 5, N'Trống', NULL),
    (N'P205', N'G06', 6, N'Trống', NULL),
    (N'P206', N'G01', 1, N'Đã đặt cọc', NULL),
    (N'P206', N'G02', 2, N'Trống', NULL),
    (N'P301', N'G01', 1, N'Đang thuê', NULL),
    (N'P301', N'G02', 2, N'Trống', NULL),
    (N'P302', N'G01', 1, N'Trống', NULL),
    (N'P302', N'G02', 2, N'Trống', NULL),
    (N'P303', N'G01', 1, N'Trống', NULL),
    (N'P303', N'G02', 2, N'Trống', NULL),
    (N'P303', N'G03', 3, N'Trống', NULL),
    (N'P303', N'G04', 4, N'Trống', NULL),
    (N'P304', N'G01', 1, N'Trống', NULL),
    (N'P304', N'G02', 2, N'Trống', NULL),
    (N'P304', N'G03', 3, N'Trống', NULL),
    (N'P304', N'G04', 4, N'Trống', NULL),
    (N'P305', N'G01', 1, N'Trống', NULL),
    (N'P305', N'G02', 2, N'Trống', NULL),
    (N'P305', N'G03', 3, N'Trống', NULL),
    (N'P305', N'G04', 4, N'Trống', NULL),
    (N'P305', N'G05', 5, N'Trống', NULL),
    (N'P305', N'G06', 6, N'Trống', NULL),
    (N'P306', N'G01', 1, N'Trống', NULL),
    (N'P306', N'G02', 2, N'Trống', NULL);
GO

INSERT INTO PhieuDangKy (MaDangKy, NgayDangKy, SoNguoiDuKienO, GioiTinh, HinhThucThue, KhuVucMongMuon, LoaiPhongYeuCau, MucGia, ThoiGianDuKienVaoO, ThoiHanThue, YeuCauKhac, TrangThai, MaKhachHang, MaNhanVienSale) VALUES
    (N'DK0001', N'2025-02-02', 2, N'Nam', N'Ghép', N'Quận 1', N'Phòng 4 người', 1550000, N'2025-03-01', 7, N'Ưu tiên phòng yên tĩnh, có chỗ gửi xe máy', N'Chấp nhận', N'KH0001', N'NV0002'),
    (N'DK0002', N'2025-03-03', 3, N'Nữ', N'Ghép', N'Bình Thạnh', N'Phòng 4 người', 1600000, N'2025-04-01', 8, N'Muốn ở gần trạm xe buýt, có cửa sổ thoáng', N'Chấp nhận', N'KH0002', N'NV0005'),
    (N'DK0003', N'2025-04-04', 4, N'Nam', N'Nguyên căn', N'Thủ Đức', N'Phòng 2 người', 1650000, N'2025-05-01', 9, N'Cần phòng có bàn học riêng và wifi ổn định', N'Chấp nhận', N'KH0003', N'NV0006'),
    (N'DK0004', N'2025-05-05', 1, N'Nam', N'Ghép', N'Quận 1', N'Phòng 4 người', 1700000, N'2025-06-01', 10, N'Muốn tầng thấp, hạn chế leo cầu thang', N'Chấp nhận', N'KH0004', N'NV0009'),
    (N'DK0005', N'2025-06-06', 2, N'Nữ', N'Ghép', N'Bình Thạnh', N'Phòng 4 người', 1750000, N'2025-07-01', 11, N'Ưu tiên có máy lạnh và khu phơi đồ riêng', N'Chấp nhận', N'KH0005', N'NV0010'),
    (N'DK0006', N'2025-07-07', 3, N'Nữ', N'Ghép', N'Thủ Đức', N'Phòng 2 người', 1800000, N'2025-08-01', 12, N'Cần nhận phòng buổi tối sau giờ làm', N'Chấp nhận', N'KH0006', N'NV0001'),
    (N'DK0007', N'2025-08-08', 4, N'Nam', N'Ghép', N'Quận 1', N'Phòng 4 người', 1850000, N'2025-09-01', 13, N'Muốn ở chung với bạn cùng giới, không hút thuốc', N'Chấp nhận', N'KH0007', N'NV0002'),
    (N'DK0008', N'2025-09-09', 6, N'Nữ', N'Nguyên căn', N'Bình Thạnh', N'Phòng 4 người', 1900000, N'2025-10-01', 14, N'Ưu tiên phòng gần thang máy, an ninh tốt', N'Chấp nhận', N'KH0008', N'NV0005'),
    (N'DK0009', N'2025-10-10', 2, N'Nam', N'Ghép', N'Thủ Đức', N'Phòng 2 người', 1950000, N'2025-11-01', 15, N'Cần chỗ để xe đạp và giờ giấc linh hoạt', N'Chấp nhận', N'KH0009', N'NV0006'),
    (N'DK0010', N'2025-11-11', 3, N'Nữ', N'Ghép', N'Quận 1', N'Phòng 4 người', 2000000, N'2025-12-01', 16, N'Muốn phòng có nhà vệ sinh sạch, ít người qua lại', N'Chấp nhận', N'KH0010', N'NV0009'),
    (N'DK0011', N'2025-12-12', 4, N'Nam', N'Ghép', N'Bình Thạnh', N'Phòng 4 người', 2050000, N'2025-01-01', 17, N'Ưu tiên gần trường học và khu ăn uống', N'Chấp nhận', N'KH0011', N'NV0010'),
    (N'DK0012', N'2025-01-13', 1, N'Nam', N'Nguyên căn', N'Thủ Đức', N'Phòng 2 người', 2100000, N'2025-02-01', 6, N'Cần hỗ trợ xem phòng online trước khi đến', N'Chấp nhận', N'KH0012', N'NV0001'),
    (N'DK0013', N'2025-02-14', 2, N'Nữ', N'Ghép', N'Quận 1', N'Phòng 4 người', 2150000, N'2025-03-01', 7, N'Muốn giường tầng dưới, phòng có ánh sáng tự nhiên', N'Chờ xác nhận cọc', N'KH0013', N'NV0002'),
    (N'DK0014', N'2025-03-15', 3, N'Nữ', N'Ghép', N'Bình Thạnh', N'Phòng 4 người', 2200000, N'2025-04-01', 8, N'Ưu tiên khu vực yên tĩnh để học buổi tối', N'Chờ xác nhận cọc', N'KH0014', N'NV0005'),
    (N'DK0015', N'2025-04-16', 4, N'Nữ', N'Ghép', N'Thủ Đức', N'Phòng 2 người', 2250000, N'2025-05-01', 9, N'Cần phòng cho nhóm nhỏ, có không gian sinh hoạt chung', N'Chờ tiếp nhận', N'KH0015', N'NV0006'),
    (N'DK0016', N'2025-05-17', 1, N'Nam', N'Nguyên căn', N'Quận 1', N'Phòng 4 người', 2300000, N'2025-06-01', 10, N'Muốn thủ tục nhanh, có thể đặt cọc chuyển khoản', N'Chờ tiếp nhận', N'KH0016', N'NV0009'),
    (N'DK0017', N'2025-06-18', 2, N'Nam', N'Ghép', N'Bình Thạnh', N'Phòng 4 người', 2350000, N'2025-07-01', 11, N'Ưu tiên phòng giá mềm, gần nơi thực tập', N'Từ chối', N'KH0017', N'NV0010'),
    (N'DK0018', N'2025-07-19', 3, N'Nam', N'Ghép', N'Thủ Đức', N'Phòng 2 người', 2400000, N'2025-08-01', 12, N'Cần phòng có tủ cá nhân lớn và khóa riêng', N'Chờ xác nhận cọc', N'KH0018', N'NV0001'),
    (N'DK0019', N'2025-08-20', 4, N'Nữ', N'Ghép', N'Quận 1', N'Phòng 4 người', 2450000, N'2025-09-01', 13, N'Muốn được tư vấn thêm về nội quy trước khi thuê', N'Chờ tiếp nhận', N'KH0019', N'NV0002'),
    (N'DK0020', N'2025-09-21', 1, N'Nữ', N'Ghép', N'Bình Thạnh', N'Phòng 4 người', 2500000, N'2025-10-01', 14, N'Cần lịch xem phòng vào cuối tuần', N'Từ chối', N'KH0020', N'NV0005');
GO

INSERT INTO LichXemPhong (MaDangKy, STTLich, ThoiGianHen, TrangThai) VALUES
    (N'DK0001', 1, N'2025-04-05 09:00:00', N'Đã xem'),
    (N'DK0002', 1, N'2025-05-06 09:00:00', N'Đã xem'),
    (N'DK0003', 1, N'2025-06-07 09:00:00', N'Đã xem'),
    (N'DK0004', 1, N'2025-07-08 09:00:00', N'Đã xem'),
    (N'DK0005', 1, N'2025-08-09 09:00:00', N'Đã xem'),
    (N'DK0006', 1, N'2025-09-10 09:00:00', N'Đã xem'),
    (N'DK0007', 1, N'2025-10-11 09:00:00', N'Đã xem'),
    (N'DK0008', 1, N'2025-11-12 09:00:00', N'Đã xem'),
    (N'DK0009', 1, N'2025-12-13 09:00:00', N'Đã xem'),
    (N'DK0010', 1, N'2025-01-14 09:00:00', N'Đã xem'),
    (N'DK0011', 1, N'2025-02-15 09:00:00', N'Đã xem'),
    (N'DK0012', 1, N'2025-03-16 09:00:00', N'Đã xem'),
    (N'DK0013', 1, N'2025-04-17 09:00:00', N'Đã xem'),
    (N'DK0014', 1, N'2025-05-18 09:00:00', N'Đã xem'),
    (N'DK0015', 1, N'2025-06-19 09:00:00', N'Chờ xem'),
    (N'DK0016', 1, N'2025-07-20 09:00:00', N'Chờ xem'),
    (N'DK0017', 1, N'2025-08-21 09:00:00', N'Chờ xem'),
    (N'DK0018', 1, N'2025-09-22 09:00:00', N'Chờ xem'),
    (N'DK0019', 1, N'2025-10-23 09:00:00', N'Chờ xem'),
    (N'DK0020', 1, N'2025-11-24 09:00:00', N'Chờ xem');
GO

INSERT INTO ChiTietXemPhong (MaDangKy, MaPhong, STTLich, MaGiuong) VALUES
    (N'DK0001', N'P101', 1, N'G01'),
    (N'DK0002', N'P102', 1, N'G01'),
    (N'DK0003', N'P103', 1, NULL),
    (N'DK0004', N'P101', 1, N'G02'),
    (N'DK0005', N'P102', 1, N'G02'),
    (N'DK0006', N'P202', 1, N'G02'),
    (N'DK0007', N'P204', 1, N'G01'),
    (N'DK0008', N'P105', 1, NULL),
    (N'DK0009', N'P201', 1, N'G01'),
    (N'DK0010', N'P202', 1, N'G01'),
    (N'DK0011', N'P203', 1, N'G01'),
    (N'DK0012', N'P301', 1, N'G01'),
    (N'DK0013', N'P206', 1, N'G01'),
    (N'DK0014', N'P205', 1, N'G01'),
    (N'DK0015', N'P302', 1, N'G01'),
    (N'DK0016', N'P304', 1, N'G01'),
    (N'DK0017', N'P305', 1, N'G01'),
    (N'DK0018', N'P304', 1, N'G02'),
    (N'DK0019', N'P306', 1, N'G01'),
    (N'DK0020', N'P302', 1, N'G02');
GO

INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT, ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan) VALUES
    (N'PC0001', N'2025-03-05 10:00:00', N'2025-03-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-03-05 15:00:00', NULL, N'2025-04-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0001', N'KH0001', N'NV0008'),
    (N'PC0002', N'2025-04-05 10:00:00', N'2025-04-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-04-05 15:00:00', NULL, N'2025-05-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0002', N'KH0002', N'NV0012'),
    (N'PC0003', N'2025-05-05 10:00:00', N'2025-05-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-05-05 15:00:00', NULL, N'2025-06-01 08:00:00', N'Nguyên phòng', N'Đã lập HĐ', N'DK0003', N'KH0003', N'NV0004'),
    (N'PC0004', N'2025-06-05 10:00:00', N'2025-06-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-06-05 15:00:00', NULL, N'2025-07-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0004', N'KH0004', N'NV0008'),
    (N'PC0005', N'2025-07-05 10:00:00', N'2025-07-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-07-05 15:00:00', NULL, N'2025-08-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0005', N'KH0005', N'NV0012'),
    (N'PC0006', N'2025-08-05 10:00:00', N'2025-08-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-08-05 15:00:00', NULL, N'2025-09-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0006', N'KH0006', N'NV0004'),
    (N'PC0007', N'2025-09-05 10:00:00', N'2025-09-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-09-05 15:00:00', NULL, N'2025-10-01 08:00:00', N'Ghép giường', N'Đã hủy', N'DK0007', N'KH0007', N'NV0008'),
    (N'PC0008', N'2025-10-05 10:00:00', N'2025-10-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-10-05 15:00:00', NULL, N'2025-11-01 08:00:00', N'Nguyên phòng', N'Đã lập HĐ', N'DK0008', N'KH0008', N'NV0012'),
    (N'PC0009', N'2025-11-05 10:00:00', N'2025-11-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-11-05 15:00:00', NULL, N'2025-12-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0009', N'KH0009', N'NV0004'),
    (N'PC0010', N'2025-12-05 10:00:00', N'2025-12-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-12-05 15:00:00', NULL, N'2025-01-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0010', N'KH0010', N'NV0008'),
    (N'PC0011', N'2025-01-05 10:00:00', N'2025-01-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-01-05 15:00:00', NULL, N'2025-02-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0011', N'KH0011', N'NV0012'),
    (N'PC0012', N'2025-02-05 10:00:00', N'2025-02-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-02-05 15:00:00', NULL, N'2025-03-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0012', N'KH0012', N'NV0004'),
    (N'PC0013', N'2025-03-05 10:00:00', N'2025-03-06 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2025-03-05 15:00:00', NULL, N'2025-04-01 08:00:00', N'Ghép giường', N'Hiệu lực', N'DK0013', N'KH0013', N'NV0008'),
    (N'PC0014', N'2025-04-05 10:00:00', N'2025-04-06 10:00:00', NULL, N'Tiền mặt', N'Đã TT', N'2025-04-05 15:00:00', NULL, N'2025-05-01 08:00:00', N'Ghép giường', N'Hiệu lực', N'DK0014', N'KH0014', N'NV0012'),
    (N'PC0015', N'2025-05-05 10:00:00', N'2025-05-06 10:00:00', NULL, N'Chuyển khoản', N'Hết hạn', NULL, NULL, N'2025-06-01 08:00:00', N'Ghép giường', N'Đã hủy', N'DK0015', N'KH0015', N'NV0004'),
    (N'PC0016', N'2025-06-05 10:00:00', N'2025-06-06 10:00:00', NULL, N'Tiền mặt', N'Hủy', NULL, NULL, N'2025-07-01 08:00:00', N'Ghép giường', N'Đã hủy', N'DK0016', N'KH0016', N'NV0008');
GO

INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue) VALUES
    (N'CD0001', N'PC0001', N'P101', N'G01', 2200000),
    (N'CD0002', N'PC0002', N'P102', N'G01', 2200000),
    (N'CD0003', N'PC0003', N'P103', NULL, 7200000),
    (N'CD0004', N'PC0004', N'P101', N'G02', 2200000),
    (N'CD0005', N'PC0005', N'P102', N'G02', 2200000),
    (N'CD0006', N'PC0006', N'P202', N'G02', 2200000),
    (N'CD0007', N'PC0007', N'P204', N'G01', 1800000),
    (N'CD0008', N'PC0008', N'P105', NULL, 8400000),
    (N'CD0009', N'PC0009', N'P201', N'G01', 2200000),
    (N'CD0010', N'PC0010', N'P202', N'G01', 2200000),
    (N'CD0011', N'PC0011', N'P203', N'G01', 1800000),
    (N'CD0012', N'PC0012', N'P301', N'G01', 2200000),
    (N'CD0013', N'PC0013', N'P206', N'G01', 3000000),
    (N'CD0014', N'PC0014', N'P205', N'G01', 1400000),
    (N'CD0015', N'PC0015', N'P302', N'G01', 2200000),
    (N'CD0016', N'PC0016', N'P304', N'G01', 1800000);
GO

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy) VALUES
    (N'HD0001', N'2025-02-01', N'2025-03-01', N'2026-02-28', 1, 2200000, N'Hàng tháng', N'Hiệu lực', N'PC0001', N'KH0001', N'NV0007'),
    (N'HD0002', N'2025-03-01', N'2025-04-01', N'2026-03-31', 1, 2200000, N'Hàng tháng', N'Hiệu lực', N'PC0002', N'KH0002', N'NV0011'),
    (N'HD0003', N'2025-04-01', N'2025-05-01', N'2026-04-30', 4, 7200000, N'Hàng tháng', N'Hiệu lực', N'PC0003', N'KH0003', N'NV0003'),
    (N'HD0004', N'2025-05-01', N'2025-06-01', N'2026-05-31', 1, 2200000, N'Hàng quý', N'Hiệu lực', N'PC0004', N'KH0004', N'NV0007'),
    (N'HD0005', N'2025-06-01', N'2025-07-01', N'2026-06-30', 1, 2200000, N'Hàng tháng', N'Hiệu lực', N'PC0005', N'KH0005', N'NV0011'),
    (N'HD0006', N'2025-07-01', N'2025-08-01', N'2026-07-31', 1, 2200000, N'Hàng tháng', N'Hiệu lực', N'PC0006', N'KH0006', N'NV0003'),
    (N'HD0007', N'2025-08-01', N'2025-09-01', N'2026-08-31', 1, 1800000, N'Hàng tháng', N'Hủy', N'PC0007', N'KH0007', N'NV0007'),
    (N'HD0008', N'2025-09-01', N'2025-10-01', N'2026-09-30', 6, 8400000, N'Hàng quý', N'Hiệu lực', N'PC0008', N'KH0008', N'NV0011'),
    (N'HD0009', N'2024-01-01', N'2024-01-01', N'2024-12-31', 1, 2200000, N'Hàng tháng', N'Đã thanh lý', N'PC0009', N'KH0009', N'NV0003'),
    (N'HD0010', N'2025-11-01', N'2025-12-01', N'2026-11-30', 1, 2200000, N'Hàng tháng', N'Hiệu lực', N'PC0010', N'KH0010', N'NV0007'),
    (N'HD0011', N'2025-12-01', N'2025-12-01', N'2026-11-30', 1, 1800000, N'Hàng tháng', N'Hiệu lực', N'PC0011', N'KH0011', N'NV0011'),
    (N'HD0012', N'2025-01-01', N'2025-07-01', N'2026-06-30', 1, 2200000, N'Hàng quý', N'Hiệu lực', N'PC0012', N'KH0012', N'NV0003');
GO

INSERT INTO DichVu (MaDichVu, TenDichVu, DonViTinh, DonGia) VALUES
    (N'DV0001', N'Điện', N'kWh', 4000),
    (N'DV0002', N'Nước', N'm3', 18000),
    (N'DV0003', N'Wifi', N'tháng', 100000),
    (N'DV0004', N'Gửi xe', N'tháng', 150000),
    (N'DV0005', N'Vệ sinh', N'tháng', 80000);
GO

INSERT INTO DichVuHopDong (MaChiTietDVHD, MaDichVu, MaHopDong, GhiChu) VALUES
    (N'DH0001', N'DV0001', N'HD0001', N'Áp dụng theo hợp đồng'),
    (N'DH0002', N'DV0002', N'HD0001', N'Áp dụng theo hợp đồng'),
    (N'DH0003', N'DV0003', N'HD0001', N'Áp dụng theo hợp đồng'),
    (N'DH0004', N'DV0004', N'HD0001', N'Áp dụng theo hợp đồng'),
    (N'DH0005', N'DV0001', N'HD0002', N'Áp dụng theo hợp đồng'),
    (N'DH0006', N'DV0002', N'HD0002', N'Áp dụng theo hợp đồng'),
    (N'DH0007', N'DV0003', N'HD0002', N'Áp dụng theo hợp đồng'),
    (N'DH0008', N'DV0004', N'HD0002', N'Áp dụng theo hợp đồng'),
    (N'DH0009', N'DV0001', N'HD0003', N'Áp dụng theo hợp đồng'),
    (N'DH0010', N'DV0002', N'HD0003', N'Áp dụng theo hợp đồng'),
    (N'DH0011', N'DV0003', N'HD0003', N'Áp dụng theo hợp đồng'),
    (N'DH0012', N'DV0004', N'HD0003', N'Áp dụng theo hợp đồng'),
    (N'DH0013', N'DV0001', N'HD0004', N'Áp dụng theo hợp đồng'),
    (N'DH0014', N'DV0002', N'HD0004', N'Áp dụng theo hợp đồng'),
    (N'DH0015', N'DV0003', N'HD0004', N'Áp dụng theo hợp đồng'),
    (N'DH0016', N'DV0004', N'HD0004', N'Áp dụng theo hợp đồng'),
    (N'DH0017', N'DV0001', N'HD0005', N'Áp dụng theo hợp đồng'),
    (N'DH0018', N'DV0002', N'HD0005', N'Áp dụng theo hợp đồng'),
    (N'DH0019', N'DV0003', N'HD0005', N'Áp dụng theo hợp đồng'),
    (N'DH0020', N'DV0004', N'HD0005', N'Áp dụng theo hợp đồng'),
    (N'DH0021', N'DV0001', N'HD0006', N'Áp dụng theo hợp đồng'),
    (N'DH0022', N'DV0002', N'HD0006', N'Áp dụng theo hợp đồng'),
    (N'DH0023', N'DV0003', N'HD0006', N'Áp dụng theo hợp đồng'),
    (N'DH0024', N'DV0004', N'HD0006', N'Áp dụng theo hợp đồng'),
    (N'DH0025', N'DV0001', N'HD0007', N'Áp dụng theo hợp đồng'),
    (N'DH0026', N'DV0002', N'HD0007', N'Áp dụng theo hợp đồng'),
    (N'DH0027', N'DV0003', N'HD0007', N'Áp dụng theo hợp đồng'),
    (N'DH0028', N'DV0004', N'HD0007', N'Áp dụng theo hợp đồng'),
    (N'DH0029', N'DV0001', N'HD0008', N'Áp dụng theo hợp đồng'),
    (N'DH0030', N'DV0002', N'HD0008', N'Áp dụng theo hợp đồng'),
    (N'DH0031', N'DV0003', N'HD0008', N'Áp dụng theo hợp đồng'),
    (N'DH0032', N'DV0004', N'HD0008', N'Áp dụng theo hợp đồng'),
    (N'DH0033', N'DV0001', N'HD0009', N'Áp dụng theo hợp đồng'),
    (N'DH0034', N'DV0002', N'HD0009', N'Áp dụng theo hợp đồng'),
    (N'DH0035', N'DV0003', N'HD0009', N'Áp dụng theo hợp đồng'),
    (N'DH0036', N'DV0004', N'HD0009', N'Áp dụng theo hợp đồng'),
    (N'DH0037', N'DV0001', N'HD0010', N'Áp dụng theo hợp đồng'),
    (N'DH0038', N'DV0002', N'HD0010', N'Áp dụng theo hợp đồng'),
    (N'DH0039', N'DV0003', N'HD0010', N'Áp dụng theo hợp đồng'),
    (N'DH0040', N'DV0004', N'HD0010', N'Áp dụng theo hợp đồng'),
    (N'DH0041', N'DV0001', N'HD0011', N'Áp dụng theo hợp đồng'),
    (N'DH0042', N'DV0002', N'HD0011', N'Áp dụng theo hợp đồng'),
    (N'DH0043', N'DV0003', N'HD0011', N'Áp dụng theo hợp đồng'),
    (N'DH0044', N'DV0004', N'HD0011', N'Áp dụng theo hợp đồng'),
    (N'DH0045', N'DV0001', N'HD0012', N'Áp dụng theo hợp đồng'),
    (N'DH0046', N'DV0002', N'HD0012', N'Áp dụng theo hợp đồng'),
    (N'DH0047', N'DV0003', N'HD0012', N'Áp dụng theo hợp đồng'),
    (N'DH0048', N'DV0004', N'HD0012', N'Áp dụng theo hợp đồng');
GO

INSERT INTO ThanhVienHopDong (MaThanhVien, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, MaHopDong) VALUES
    (N'TV0001', N'Nguyễn Văn An', N'1996-01-01', N'Nam', N'079200000001', N'091200001', N'kh0001@mail.com', N'Việt Nam', N'Đang ở', N'HD0001'),
    (N'TV0002', N'Trần Thị Bình', N'1997-01-01', N'Nữ', N'079200000002', N'091200002', N'kh0002@mail.com', N'Việt Nam', N'Đang ở', N'HD0002'),
    (N'TV0003', N'Lê Quốc Cường', N'1998-01-01', N'Nam', N'079200000003', N'091200003', N'kh0003@mail.com', N'Việt Nam', N'Đang ở', N'HD0003'),
    (N'TV0004', N'Trần Minh Huy', N'2000-02-02', N'Nam', N'079990000003', N'093300003', N'phu3a@mail.com', N'Việt Nam', N'Đang ở', N'HD0003'),
    (N'TV0005', N'Phạm Anh Tuấn', N'2001-03-03', N'Nam', N'079990000004', N'093300004', N'phu3b@mail.com', N'Việt Nam', N'Đang ở', N'HD0003'),
    (N'TV0006', N'Đỗ Gia Phúc', N'2001-04-04', N'Nam', N'079990000005', N'093300005', N'phu3c@mail.com', N'Việt Nam', N'Đang ở', N'HD0003'),
    (N'TV0007', N'Phạm Minh Duy', N'1999-01-01', N'Nam', N'079200000004', N'091200004', N'kh0004@mail.com', N'Việt Nam', N'Đang ở', N'HD0004'),
    (N'TV0008', N'Hoàng Thảo Vy', N'2000-01-01', N'Nữ', N'079200000005', N'091200005', N'kh0005@mail.com', N'Việt Nam', N'Đang ở', N'HD0005'),
    (N'TV0009', N'Võ Gia Hân', N'2001-01-01', N'Nữ', N'079200000006', N'091200006', N'kh0006@mail.com', N'Việt Nam', N'Đang ở', N'HD0006'),
    (N'TV0010', N'Đặng Minh Khôi', N'2002-01-01', N'Nam', N'079200000007', N'091200007', N'kh0007@mail.com', N'Việt Nam', N'Đã rời', N'HD0007'),
    (N'TV0011', N'Bùi Thanh Lam', N'1995-01-01', N'Nữ', N'079200000008', N'091200008', N'kh0008@mail.com', N'Việt Nam', N'Đang ở', N'HD0008'),
    (N'TV0012', N'Trần Thị Hảo', N'2000-02-02', N'Nữ', N'079990000008', N'093300008', N'phu8a@mail.com', N'Việt Nam', N'Đang ở', N'HD0008'),
    (N'TV0013', N'Đinh Nhật Yến', N'2001-03-02', N'Nữ', N'078888000002', N'094408002', N'phu8b@mail.com', N'Việt Nam', N'Đang ở', N'HD0008'),
    (N'TV0014', N'Phạm Thanh Yên', N'2001-03-03', N'Nữ', N'078888000003', N'094408003', N'phu8c@mail.com', N'Việt Nam', N'Đang ở', N'HD0008'),
    (N'TV0015', N'Lê Mỹ Linh', N'2001-03-04', N'Nữ', N'078888000004', N'094408004', N'phu8d@mail.com', N'Việt Nam', N'Đang ở', N'HD0008'),
    (N'TV0016', N'Nguyễn Thu Hà', N'2001-03-05', N'Nữ', N'078888000005', N'094408005', N'phu8e@mail.com', N'Việt Nam', N'Đang ở', N'HD0008'),
    (N'TV0017', N'Huỳnh Nhật Nam', N'1996-01-01', N'Nam', N'079200000009', N'091200009', N'kh0009@mail.com', N'Việt Nam', N'Đã rời', N'HD0009'),
    (N'TV0018', N'Ngô Bảo Ngọc', N'1997-01-01', N'Nữ', N'079200000010', N'091200010', N'kh0010@mail.com', N'Việt Nam', N'Đang ở', N'HD0010'),
    (N'TV0019', N'Đỗ Hoài Phương', N'1998-01-01', N'Nam', N'079200000011', N'091200011', N'kh0011@mail.com', N'Việt Nam', N'Đang ở', N'HD0011'),
    (N'TV0020', N'Đinh Đức Quang', N'1999-01-01', N'Nam', N'079200000012', N'091200012', N'kh0012@mail.com', N'Việt Nam', N'Đang ở', N'HD0012');
GO

INSERT INTO TaiSan (MaPhong, MaTaiSan, TenTaiSan, SoLuong, DonGia) VALUES
    (N'P101', N'TS0001', N'Giường', 2, 1800000),
    (N'P101', N'TS0002', N'Nệm', 2, 900000),
    (N'P101', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P101', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P102', N'TS0001', N'Giường', 2, 1800000),
    (N'P102', N'TS0002', N'Nệm', 2, 900000),
    (N'P102', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P102', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P103', N'TS0001', N'Giường', 4, 1800000),
    (N'P103', N'TS0002', N'Nệm', 4, 900000),
    (N'P103', N'TS0003', N'Tủ cá nhân', 4, 1200000),
    (N'P103', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P104', N'TS0001', N'Giường', 4, 1800000),
    (N'P104', N'TS0002', N'Nệm', 4, 900000),
    (N'P104', N'TS0003', N'Tủ cá nhân', 4, 1200000),
    (N'P104', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P105', N'TS0001', N'Giường', 6, 1800000),
    (N'P105', N'TS0002', N'Nệm', 6, 900000),
    (N'P105', N'TS0003', N'Tủ cá nhân', 6, 1200000),
    (N'P105', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P106', N'TS0001', N'Giường', 2, 1800000),
    (N'P106', N'TS0002', N'Nệm', 2, 900000),
    (N'P106', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P106', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P201', N'TS0001', N'Giường', 2, 1800000),
    (N'P201', N'TS0002', N'Nệm', 2, 900000),
    (N'P201', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P201', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P202', N'TS0001', N'Giường', 2, 1800000),
    (N'P202', N'TS0002', N'Nệm', 2, 900000),
    (N'P202', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P202', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P203', N'TS0001', N'Giường', 4, 1800000),
    (N'P203', N'TS0002', N'Nệm', 4, 900000),
    (N'P203', N'TS0003', N'Tủ cá nhân', 4, 1200000),
    (N'P203', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P204', N'TS0001', N'Giường', 4, 1800000),
    (N'P204', N'TS0002', N'Nệm', 4, 900000),
    (N'P204', N'TS0003', N'Tủ cá nhân', 4, 1200000),
    (N'P204', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P205', N'TS0001', N'Giường', 6, 1800000),
    (N'P205', N'TS0002', N'Nệm', 6, 900000),
    (N'P205', N'TS0003', N'Tủ cá nhân', 6, 1200000),
    (N'P205', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P206', N'TS0001', N'Giường', 2, 1800000),
    (N'P206', N'TS0002', N'Nệm', 2, 900000),
    (N'P206', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P206', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P301', N'TS0001', N'Giường', 2, 1800000),
    (N'P301', N'TS0002', N'Nệm', 2, 900000),
    (N'P301', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P301', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P302', N'TS0001', N'Giường', 2, 1800000),
    (N'P302', N'TS0002', N'Nệm', 2, 900000),
    (N'P302', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P302', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P303', N'TS0001', N'Giường', 4, 1800000),
    (N'P303', N'TS0002', N'Nệm', 4, 900000),
    (N'P303', N'TS0003', N'Tủ cá nhân', 4, 1200000),
    (N'P303', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P304', N'TS0001', N'Giường', 4, 1800000),
    (N'P304', N'TS0002', N'Nệm', 4, 900000),
    (N'P304', N'TS0003', N'Tủ cá nhân', 4, 1200000),
    (N'P304', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P305', N'TS0001', N'Giường', 6, 1800000),
    (N'P305', N'TS0002', N'Nệm', 6, 900000),
    (N'P305', N'TS0003', N'Tủ cá nhân', 6, 1200000),
    (N'P305', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000),
    (N'P306', N'TS0001', N'Giường', 2, 1800000),
    (N'P306', N'TS0002', N'Nệm', 2, 900000),
    (N'P306', N'TS0003', N'Tủ cá nhân', 2, 1200000),
    (N'P306', N'TS0004', N'Chìa khóa/thẻ từ', 2, 100000);
GO

INSERT INTO BienBanBanGiao (MaBienBan, NgayBanGiao, LoaiBanGiao, MaHopDong, MaNhanVienQuanLy) VALUES
    (N'BB0001', N'2025-03-01', N'Bàn giao vào', N'HD0001', N'NV0007'),
    (N'BB0002', N'2025-04-01', N'Bàn giao vào', N'HD0002', N'NV0011'),
    (N'BB0003', N'2025-05-01', N'Bàn giao vào', N'HD0003', N'NV0003'),
    (N'BB0004', N'2025-06-01', N'Bàn giao vào', N'HD0004', N'NV0007'),
    (N'BB0005', N'2025-07-01', N'Bàn giao vào', N'HD0005', N'NV0011'),
    (N'BB0006', N'2025-08-01', N'Bàn giao vào', N'HD0006', N'NV0003'),
    (N'BB0007', N'2025-09-01', N'Bàn giao vào', N'HD0007', N'NV0007'),
    (N'BB0008', N'2025-10-01', N'Bàn giao vào', N'HD0008', N'NV0011'),
    (N'BB0009', N'2024-01-01', N'Bàn giao vào', N'HD0009', N'NV0003'),
    (N'BB0010', N'2025-12-01', N'Bàn giao vào', N'HD0010', N'NV0007'),
    (N'BB0011', N'2025-12-01', N'Bàn giao vào', N'HD0011', N'NV0011'),
    (N'BB0012', N'2025-07-01', N'Bàn giao vào', N'HD0012', N'NV0003'),
    (N'BB0013', N'2024-12-31', N'Bàn giao ra', N'HD0009', N'NV0003'),
    (N'BB0014', N'2026-02-01', N'Bàn giao ra', N'HD0006', N'NV0003'),
    (N'BB0015', N'2025-12-20', N'Bàn giao ra', N'HD0010', N'NV0007');
GO

INSERT INTO ChiTietBanGiao (MaChiTietBG, MaBienBan, MaPhong, MaTaiSan, SoLuongThucTe, GhiChu) VALUES
    (N'BG0001', N'BB0001', N'P101', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0002', N'BB0001', N'P101', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0003', N'BB0001', N'P101', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0004', N'BB0001', N'P101', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0005', N'BB0002', N'P102', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0006', N'BB0002', N'P102', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0007', N'BB0002', N'P102', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0008', N'BB0002', N'P102', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0009', N'BB0003', N'P103', N'TS0001', 4, N'Bàn giao lúc nhận phòng'),
    (N'BG0010', N'BB0003', N'P103', N'TS0002', 4, N'Bàn giao lúc nhận phòng'),
    (N'BG0011', N'BB0003', N'P103', N'TS0003', 4, N'Bàn giao lúc nhận phòng'),
    (N'BG0012', N'BB0003', N'P103', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0013', N'BB0004', N'P101', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0014', N'BB0004', N'P101', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0015', N'BB0004', N'P101', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0016', N'BB0004', N'P101', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0017', N'BB0005', N'P102', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0018', N'BB0005', N'P102', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0019', N'BB0005', N'P102', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0020', N'BB0005', N'P102', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0021', N'BB0006', N'P202', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0022', N'BB0006', N'P202', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0023', N'BB0006', N'P202', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0024', N'BB0006', N'P202', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0025', N'BB0007', N'P204', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0026', N'BB0007', N'P204', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0027', N'BB0007', N'P204', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0028', N'BB0007', N'P204', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0029', N'BB0008', N'P105', N'TS0001', 6, N'Bàn giao lúc nhận phòng'),
    (N'BG0030', N'BB0008', N'P105', N'TS0002', 6, N'Bàn giao lúc nhận phòng'),
    (N'BG0031', N'BB0008', N'P105', N'TS0003', 6, N'Bàn giao lúc nhận phòng'),
    (N'BG0032', N'BB0008', N'P105', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0033', N'BB0009', N'P201', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0034', N'BB0009', N'P201', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0035', N'BB0009', N'P201', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0036', N'BB0009', N'P201', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0037', N'BB0010', N'P202', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0038', N'BB0010', N'P202', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0039', N'BB0010', N'P202', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0040', N'BB0010', N'P202', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0041', N'BB0011', N'P203', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0042', N'BB0011', N'P203', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0043', N'BB0011', N'P203', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0044', N'BB0011', N'P203', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0045', N'BB0012', N'P301', N'TS0001', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0046', N'BB0012', N'P301', N'TS0002', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0047', N'BB0012', N'P301', N'TS0003', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0048', N'BB0012', N'P301', N'TS0004', 1, N'Bàn giao lúc nhận phòng'),
    (N'BG0049', N'BB0013', N'P201', N'TS0001', 1, N'Thu hồi đủ'),
    (N'BG0050', N'BB0013', N'P201', N'TS0002', 1, N'Thu hồi đủ'),
    (N'BG0051', N'BB0013', N'P201', N'TS0003', 1, N'Thu hồi đủ'),
    (N'BG0052', N'BB0013', N'P201', N'TS0004', 1, N'Thu hồi đủ'),
    (N'BG0053', N'BB0014', N'P202', N'TS0001', 1, N'Thu hồi đủ'),
    (N'BG0054', N'BB0014', N'P202', N'TS0002', 1, N'Thu hồi đủ'),
    (N'BG0055', N'BB0014', N'P202', N'TS0003', 1, N'Thu hồi đủ'),
    (N'BG0056', N'BB0014', N'P202', N'TS0004', 1, N'Thu hồi đủ'),
    (N'BG0057', N'BB0015', N'P202', N'TS0001', 1, N'Thu hồi đủ'),
    (N'BG0058', N'BB0015', N'P202', N'TS0002', 1, N'Thu hồi đủ'),
    (N'BG0059', N'BB0015', N'P202', N'TS0003', 1, N'Thu hồi đủ'),
    (N'BG0060', N'BB0015', N'P202', N'TS0004', 1, N'Thu hồi đủ');
GO

INSERT INTO PhieuGhiChiSo (MaPhieuGhi, KyGhi, NgayGhi, ChiSoNuocDau, ChiSoNuocCuoi, ChiSoDienDau, ChiSoDienCuoi, TrangThai, MaNhanVienQuanLy, MaPhong) VALUES
    (N'PG0001', N'2025-02', N'2025-02-25', 21, 26, 103, 154, N'Đã Lập HD', N'NV0007', N'P101'),
    (N'PG0002', N'2025-03', N'2025-03-25', 22, 27, 106, 158, N'Đã Lập HD', N'NV0011', N'P102'),
    (N'PG0003', N'2025-04', N'2025-04-25', 23, 28, 109, 162, N'Đã Lập HD', N'NV0003', N'P103'),
    (N'PG0004', N'2025-05', N'2025-05-25', 24, 29, 112, 166, N'Đã Lập HD', N'NV0007', N'P101'),
    (N'PG0005', N'2025-06', N'2025-06-25', 25, 30, 115, 170, N'Đã Lập HD', N'NV0011', N'P102'),
    (N'PG0006', N'2025-01', N'2025-01-25', 26, 31, 118, 174, N'Đã Lập HD', N'NV0003', N'P202'),
    (N'PG0007', N'2025-02', N'2025-02-25', 27, 32, 121, 178, N'Đã Lập HD', N'NV0007', N'P204'),
    (N'PG0008', N'2025-03', N'2025-03-25', 28, 33, 124, 182, N'Đã Lập HD', N'NV0011', N'P105'),
    (N'PG0009', N'2025-04', N'2025-04-25', 29, 34, 127, 186, N'Đã Lập HD', N'NV0003', N'P201'),
    (N'PG0010', N'2025-05', N'2025-05-25', 30, 35, 130, 190, N'Đã Lập HD', N'NV0007', N'P202'),
    (N'PG0011', N'2025-06', N'2025-06-25', 31, 36, 133, 194, N'Đã Lập HD', N'NV0011', N'P203'),
    (N'PG0012', N'2025-01', N'2025-01-25', 32, 37, 136, 198, N'Đã Lập HD', N'NV0003', N'P301'),
    (N'PG0013', N'2025-02', N'2025-02-25', 33, 38, 139, 202, N'Đã Lập HD', N'NV0007', N'P101'),
    (N'PG0014', N'2025-03', N'2025-03-25', 34, 39, 142, 206, N'Đã Lập HD', N'NV0011', N'P102'),
    (N'PG0015', N'2025-04', N'2025-04-25', 35, 40, 145, 210, N'Đã Lập HD', N'NV0003', N'P103'),
    (N'PG0016', N'2025-05', N'2025-05-25', 36, 41, 148, 214, N'Đã Lập HD', N'NV0007', N'P101'),
    (N'PG0017', N'2025-06', N'2025-06-25', 37, 42, 151, 218, N'Chưa Lập HD', N'NV0011', N'P102'),
    (N'PG0018', N'2025-01', N'2025-01-25', 38, 43, 154, 222, N'Chưa Lập HD', N'NV0003', N'P202'),
    (N'PG0019', N'2025-02', N'2025-02-25', 39, 44, 157, 226, N'Chưa Lập HD', N'NV0007', N'P204'),
    (N'PG0020', N'2025-03', N'2025-03-25', 40, 45, 160, 230, N'Chưa Lập HD', N'NV0011', N'P105');
GO

INSERT INTO HoaDon (MaHoaDon, KyThanhToan, NgayLap, NgayHanTT, TongTien, TrangThai, NgayThanhToan, PhuongThucThanhToan, MaHopDong, MaNhanVienKeToan) VALUES
    (N'HDN001', N'2025-02', N'2025-02-26', N'2025-02-28', NULL, N'Chưa TT', NULL, NULL, N'HD0001', N'NV0008'),
    (N'HDN002', N'2025-03', N'2025-03-26', N'2025-03-28', NULL, N'Chưa TT', NULL, NULL, N'HD0002', N'NV0012'),
    (N'HDN003', N'2025-04', N'2025-04-26', N'2025-04-28', NULL, N'Đã TT', N'2025-04-27', N'Chuyển khoản', N'HD0003', N'NV0004'),
    (N'HDN004', N'2025-05', N'2025-05-26', N'2025-05-28', NULL, N'Chưa TT', NULL, NULL, N'HD0004', N'NV0008'),
    (N'HDN005', N'2025-06', N'2025-06-26', N'2025-06-28', NULL, N'Nợ', NULL, NULL, N'HD0005', N'NV0012'),
    (N'HDN006', N'2025-01', N'2025-01-26', N'2025-01-28', NULL, N'Đã TT', N'2025-01-27', N'Chuyển khoản', N'HD0006', N'NV0004'),
    (N'HDN007', N'2025-02', N'2025-02-26', N'2025-02-28', NULL, N'Chưa TT', NULL, NULL, N'HD0007', N'NV0008'),
    (N'HDN008', N'2025-03', N'2025-03-26', N'2025-03-28', NULL, N'Chưa TT', NULL, NULL, N'HD0008', N'NV0012'),
    (N'HDN009', N'2025-04', N'2025-04-26', N'2025-04-28', NULL, N'Đã TT', N'2025-04-27', N'Chuyển khoản', N'HD0009', N'NV0004'),
    (N'HDN010', N'2025-05', N'2025-05-26', N'2025-05-28', NULL, N'Chưa TT', NULL, NULL, N'HD0010', N'NV0008'),
    (N'HDN011', N'2025-06', N'2025-06-26', N'2025-06-28', NULL, N'Nợ', NULL, NULL, N'HD0011', N'NV0012'),
    (N'HDN012', N'2025-01', N'2025-01-26', N'2025-01-28', NULL, N'Đã TT', N'2025-01-27', N'Chuyển khoản', N'HD0012', N'NV0004'),
    (N'HDN013', N'2025-02', N'2025-02-26', N'2025-02-28', NULL, N'Chưa TT', NULL, NULL, N'HD0001', N'NV0008'),
    (N'HDN014', N'2025-03', N'2025-03-26', N'2025-03-28', NULL, N'Chưa TT', NULL, NULL, N'HD0002', N'NV0012'),
    (N'HDN015', N'2025-04', N'2025-04-26', N'2025-04-28', NULL, N'Đã TT', N'2025-04-27', N'Chuyển khoản', N'HD0003', N'NV0004'),
    (N'HDN016', N'2025-05', N'2025-05-26', N'2025-05-28', NULL, N'Chưa TT', NULL, NULL, N'HD0004', N'NV0008'),
    (N'HDN017', N'2025-06', N'2025-06-26', N'2025-06-28', NULL, N'Nợ', NULL, NULL, N'HD0005', N'NV0012'),
    (N'HDN018', N'2025-01', N'2025-01-26', N'2025-01-28', NULL, N'Đã TT', N'2025-01-27', N'Chuyển khoản', N'HD0006', N'NV0004'),
    (N'HDN019', N'2025-02', N'2025-02-26', N'2025-02-28', NULL, N'Chưa TT', NULL, NULL, N'HD0007', N'NV0008'),
    (N'HDN020', N'2025-03', N'2025-03-26', N'2025-03-28', NULL, N'Chưa TT', NULL, NULL, N'HD0008', N'NV0012'),
    (N'HDN021', N'2025-04', N'2025-04-26', N'2025-04-28', NULL, N'Đã TT', N'2025-04-27', N'Chuyển khoản', N'HD0009', N'NV0004'),
    (N'HDN022', N'2025-05', N'2025-05-26', N'2025-05-28', NULL, N'Chưa TT', NULL, NULL, N'HD0010', N'NV0008'),
    (N'HDN023', N'2025-06', N'2025-06-26', N'2025-06-28', NULL, N'Nợ', NULL, NULL, N'HD0011', N'NV0012'),
    (N'HDN024', N'2025-01', N'2025-01-26', N'2025-01-28', NULL, N'Đã TT', N'2025-01-27', N'Chuyển khoản', N'HD0012', N'NV0004');
GO

INSERT INTO ChiTietHoaDon (MaChiTietHD, SoLuong, DonViTinh, DonGia, ThanhTien, MaHoaDon, MaChiTietDVHD, MaPhieuGhi) VALUES
    (N'CT0001', 50, N'kWh', 4000, 200000, N'HDN001', N'DH0001', N'PG0001'),
    (N'CT0002', 5, N'm3', 18000, 90000, N'HDN001', N'DH0002', N'PG0001'),
    (N'CT0003', 1, N'tháng', 100000, 100000, N'HDN001', N'DH0003', NULL),
    (N'CT0004', 1, N'tháng', 150000, 150000, N'HDN001', N'DH0004', NULL),
    (N'CT0005', 50, N'kWh', 4000, 200000, N'HDN002', N'DH0005', N'PG0002'),
    (N'CT0006', 5, N'm3', 18000, 90000, N'HDN002', N'DH0006', N'PG0002'),
    (N'CT0007', 1, N'tháng', 100000, 100000, N'HDN002', N'DH0007', NULL),
    (N'CT0008', 1, N'tháng', 150000, 150000, N'HDN002', N'DH0008', NULL),
    (N'CT0009', 50, N'kWh', 4000, 200000, N'HDN003', N'DH0009', N'PG0003'),
    (N'CT0010', 5, N'm3', 18000, 90000, N'HDN003', N'DH0010', N'PG0003'),
    (N'CT0011', 1, N'tháng', 100000, 100000, N'HDN003', N'DH0011', NULL),
    (N'CT0012', 1, N'tháng', 150000, 150000, N'HDN003', N'DH0012', NULL),
    (N'CT0013', 50, N'kWh', 4000, 200000, N'HDN004', N'DH0013', N'PG0004'),
    (N'CT0014', 5, N'm3', 18000, 90000, N'HDN004', N'DH0014', N'PG0004'),
    (N'CT0015', 1, N'tháng', 100000, 100000, N'HDN004', N'DH0015', NULL),
    (N'CT0016', 1, N'tháng', 150000, 150000, N'HDN004', N'DH0016', NULL),
    (N'CT0017', 50, N'kWh', 4000, 200000, N'HDN005', N'DH0017', N'PG0005'),
    (N'CT0018', 5, N'm3', 18000, 90000, N'HDN005', N'DH0018', N'PG0005'),
    (N'CT0019', 1, N'tháng', 100000, 100000, N'HDN005', N'DH0019', NULL),
    (N'CT0020', 1, N'tháng', 150000, 150000, N'HDN005', N'DH0020', NULL),
    (N'CT0021', 50, N'kWh', 4000, 200000, N'HDN006', N'DH0021', N'PG0006'),
    (N'CT0022', 5, N'm3', 18000, 90000, N'HDN006', N'DH0022', N'PG0006'),
    (N'CT0023', 1, N'tháng', 100000, 100000, N'HDN006', N'DH0023', NULL),
    (N'CT0024', 1, N'tháng', 150000, 150000, N'HDN006', N'DH0024', NULL),
    (N'CT0025', 50, N'kWh', 4000, 200000, N'HDN007', N'DH0025', N'PG0007'),
    (N'CT0026', 5, N'm3', 18000, 90000, N'HDN007', N'DH0026', N'PG0007'),
    (N'CT0027', 1, N'tháng', 100000, 100000, N'HDN007', N'DH0027', NULL),
    (N'CT0028', 1, N'tháng', 150000, 150000, N'HDN007', N'DH0028', NULL),
    (N'CT0029', 50, N'kWh', 4000, 200000, N'HDN008', N'DH0029', N'PG0008'),
    (N'CT0030', 5, N'm3', 18000, 90000, N'HDN008', N'DH0030', N'PG0008'),
    (N'CT0031', 1, N'tháng', 100000, 100000, N'HDN008', N'DH0031', NULL),
    (N'CT0032', 1, N'tháng', 150000, 150000, N'HDN008', N'DH0032', NULL),
    (N'CT0033', 50, N'kWh', 4000, 200000, N'HDN009', N'DH0033', N'PG0009'),
    (N'CT0034', 5, N'm3', 18000, 90000, N'HDN009', N'DH0034', N'PG0009'),
    (N'CT0035', 1, N'tháng', 100000, 100000, N'HDN009', N'DH0035', NULL),
    (N'CT0036', 1, N'tháng', 150000, 150000, N'HDN009', N'DH0036', NULL),
    (N'CT0037', 50, N'kWh', 4000, 200000, N'HDN010', N'DH0037', N'PG0010'),
    (N'CT0038', 5, N'm3', 18000, 90000, N'HDN010', N'DH0038', N'PG0010'),
    (N'CT0039', 1, N'tháng', 100000, 100000, N'HDN010', N'DH0039', NULL),
    (N'CT0040', 1, N'tháng', 150000, 150000, N'HDN010', N'DH0040', NULL),
    (N'CT0041', 50, N'kWh', 4000, 200000, N'HDN011', N'DH0041', N'PG0011'),
    (N'CT0042', 5, N'm3', 18000, 90000, N'HDN011', N'DH0042', N'PG0011'),
    (N'CT0043', 1, N'tháng', 100000, 100000, N'HDN011', N'DH0043', NULL),
    (N'CT0044', 1, N'tháng', 150000, 150000, N'HDN011', N'DH0044', NULL),
    (N'CT0045', 50, N'kWh', 4000, 200000, N'HDN012', N'DH0045', N'PG0012'),
    (N'CT0046', 5, N'm3', 18000, 90000, N'HDN012', N'DH0046', N'PG0012'),
    (N'CT0047', 1, N'tháng', 100000, 100000, N'HDN012', N'DH0047', NULL),
    (N'CT0048', 1, N'tháng', 150000, 150000, N'HDN012', N'DH0048', NULL),
    (N'CT0049', 50, N'kWh', 4000, 200000, N'HDN013', N'DH0001', N'PG0001'),
    (N'CT0050', 5, N'm3', 18000, 90000, N'HDN013', N'DH0002', N'PG0001'),
    (N'CT0051', 1, N'tháng', 100000, 100000, N'HDN013', N'DH0003', NULL),
    (N'CT0052', 1, N'tháng', 150000, 150000, N'HDN013', N'DH0004', NULL),
    (N'CT0053', 50, N'kWh', 4000, 200000, N'HDN014', N'DH0005', N'PG0002'),
    (N'CT0054', 5, N'm3', 18000, 90000, N'HDN014', N'DH0006', N'PG0002'),
    (N'CT0055', 1, N'tháng', 100000, 100000, N'HDN014', N'DH0007', NULL),
    (N'CT0056', 1, N'tháng', 150000, 150000, N'HDN014', N'DH0008', NULL),
    (N'CT0057', 50, N'kWh', 4000, 200000, N'HDN015', N'DH0009', N'PG0003'),
    (N'CT0058', 5, N'm3', 18000, 90000, N'HDN015', N'DH0010', N'PG0003'),
    (N'CT0059', 1, N'tháng', 100000, 100000, N'HDN015', N'DH0011', NULL),
    (N'CT0060', 1, N'tháng', 150000, 150000, N'HDN015', N'DH0012', NULL),
    (N'CT0061', 50, N'kWh', 4000, 200000, N'HDN016', N'DH0013', N'PG0004'),
    (N'CT0062', 5, N'm3', 18000, 90000, N'HDN016', N'DH0014', N'PG0004'),
    (N'CT0063', 1, N'tháng', 100000, 100000, N'HDN016', N'DH0015', NULL),
    (N'CT0064', 1, N'tháng', 150000, 150000, N'HDN016', N'DH0016', NULL),
    (N'CT0065', 50, N'kWh', 4000, 200000, N'HDN017', N'DH0017', N'PG0005'),
    (N'CT0066', 5, N'm3', 18000, 90000, N'HDN017', N'DH0018', N'PG0005'),
    (N'CT0067', 1, N'tháng', 100000, 100000, N'HDN017', N'DH0019', NULL),
    (N'CT0068', 1, N'tháng', 150000, 150000, N'HDN017', N'DH0020', NULL),
    (N'CT0069', 50, N'kWh', 4000, 200000, N'HDN018', N'DH0021', N'PG0006'),
    (N'CT0070', 5, N'm3', 18000, 90000, N'HDN018', N'DH0022', N'PG0006'),
    (N'CT0071', 1, N'tháng', 100000, 100000, N'HDN018', N'DH0023', NULL),
    (N'CT0072', 1, N'tháng', 150000, 150000, N'HDN018', N'DH0024', NULL),
    (N'CT0073', 50, N'kWh', 4000, 200000, N'HDN019', N'DH0025', N'PG0007'),
    (N'CT0074', 5, N'm3', 18000, 90000, N'HDN019', N'DH0026', N'PG0007'),
    (N'CT0075', 1, N'tháng', 100000, 100000, N'HDN019', N'DH0027', NULL),
    (N'CT0076', 1, N'tháng', 150000, 150000, N'HDN019', N'DH0028', NULL),
    (N'CT0077', 50, N'kWh', 4000, 200000, N'HDN020', N'DH0029', N'PG0008'),
    (N'CT0078', 5, N'm3', 18000, 90000, N'HDN020', N'DH0030', N'PG0008'),
    (N'CT0079', 1, N'tháng', 100000, 100000, N'HDN020', N'DH0031', NULL),
    (N'CT0080', 1, N'tháng', 150000, 150000, N'HDN020', N'DH0032', NULL),
    (N'CT0081', 50, N'kWh', 4000, 200000, N'HDN021', N'DH0033', N'PG0009'),
    (N'CT0082', 5, N'm3', 18000, 90000, N'HDN021', N'DH0034', N'PG0009'),
    (N'CT0083', 1, N'tháng', 100000, 100000, N'HDN021', N'DH0035', NULL),
    (N'CT0084', 1, N'tháng', 150000, 150000, N'HDN021', N'DH0036', NULL),
    (N'CT0085', 50, N'kWh', 4000, 200000, N'HDN022', N'DH0037', N'PG0010'),
    (N'CT0086', 5, N'm3', 18000, 90000, N'HDN022', N'DH0038', N'PG0010'),
    (N'CT0087', 1, N'tháng', 100000, 100000, N'HDN022', N'DH0039', NULL),
    (N'CT0088', 1, N'tháng', 150000, 150000, N'HDN022', N'DH0040', NULL),
    (N'CT0089', 50, N'kWh', 4000, 200000, N'HDN023', N'DH0041', N'PG0011'),
    (N'CT0090', 5, N'm3', 18000, 90000, N'HDN023', N'DH0042', N'PG0011'),
    (N'CT0091', 1, N'tháng', 100000, 100000, N'HDN023', N'DH0043', NULL),
    (N'CT0092', 1, N'tháng', 150000, 150000, N'HDN023', N'DH0044', NULL),
    (N'CT0093', 50, N'kWh', 4000, 200000, N'HDN024', N'DH0045', N'PG0012'),
    (N'CT0094', 5, N'm3', 18000, 90000, N'HDN024', N'DH0046', N'PG0012'),
    (N'CT0095', 1, N'tháng', 100000, 100000, N'HDN024', N'DH0047', NULL),
    (N'CT0096', 1, N'tháng', 150000, 150000, N'HDN024', N'DH0048', NULL);
GO

INSERT INTO PhieuTraPhong (MaPhieuTra, NgayDangKyTra, NgayDuKienTra, NgayTraThucTe, TrangThai, MaHopDong, MaPhieuDatCoc) VALUES
    (N'PT0001', N'2026-01-10', N'2026-01-20', NULL, N'Chờ xử lý', N'HD0004', NULL),
    (N'PT0002', N'2026-01-05', N'2026-01-15', N'2026-01-15', N'Chờ đối soát', N'HD0005', NULL),
    (N'PT0003', N'2026-01-02', N'2026-01-12', N'2026-01-12', N'Chờ thanh lý', N'HD0006', NULL),
    (N'PT0004', N'2024-12-20', N'2024-12-31', N'2024-12-31', N'Hoàn tất', N'HD0009', NULL),
    (N'PT0005', N'2025-11-01', N'2025-11-10', NULL, N'Hủy', N'HD0007', NULL),
    (N'PT0006', N'2025-07-20', N'2025-07-22', N'2025-07-22', N'Chờ đối soát', NULL, N'PC0014'),
    (N'PT0007', N'2026-01-14', N'2026-01-20', N'2026-01-20', N'Chờ đối soát', N'HD0008', NULL),
    (N'PT0008', N'2025-12-10', N'2025-12-20', N'2025-12-20', N'Chờ thanh lý', N'HD0010', NULL);
GO

INSERT INTO BienBanKiemTraPhong (MaBienBanKT, MaPhieuTra, MaNhanVienQL, NgayKiemTra, TinhTrangPhong, TongChiPhiSuaChua) VALUES
    (N'KT0001', N'PT0002', N'NV0003', N'2026-01-15', N'Phòng sạch, mất 1 thẻ từ', NULL),
    (N'KT0002', N'PT0003', N'NV0003', N'2026-01-12', N'Nệm rách nhẹ, vệ sinh đạt', NULL),
    (N'KT0003', N'PT0004', N'NV0007', N'2024-12-31', N'Phòng bình thường, bàn giao đủ', NULL),
    (N'KT0004', N'PT0006', N'NV0007', N'2025-07-22', N'Khách hủy trước khi ký hợp đồng, không nhận phòng', NULL),
    (N'KT0005', N'PT0007', N'NV0003', N'2026-01-20', N'Hỏng tủ cá nhân và nợ vệ sinh', NULL),
    (N'KT0006', N'PT0008', N'NV0007', N'2025-12-20', N'Phòng bình thường, đã thu hồi tài sản', NULL);
GO

INSERT INTO ChiTietHuHong (MaChiTietHH, MaBienBanKT, MaPhong, MaTaiSan, MoTaHuHong, ChiPhiSuaChua) VALUES
    (N'HH0001', N'KT0001', N'P102', N'TS0004', N'Mất thẻ từ/chìa khóa', 100000),
    (N'HH0002', N'KT0002', N'P202', N'TS0002', N'Nệm rách nhẹ', 200000),
    (N'HH0003', N'KT0005', N'P105', N'TS0003', N'Tủ cá nhân hỏng bản lề', 250000),
    (N'HH0004', N'KT0005', N'P105', N'TS0004', N'Mất một thẻ ra vào', 100000);
GO

INSERT INTO QuyDinhHoanCoc (MaQuyDinhHoanCoc, TenQuyDinh, TyLeHoanCoc) VALUES
    (N'QH0001', N'Đã đặt cọc nhưng chưa ký hợp đồng', 80),
    (N'QH0002', N'Đã ký hợp đồng, chưa hết hạn, lưu trú dưới 6 tháng', 50),
    (N'QH0003', N'Đã ký hợp đồng, chưa hết hạn, lưu trú từ 6 tháng trở lên', 70),
    (N'QH0004', N'Hết hạn thuê theo hợp đồng', 100);
GO

INSERT INTO DoiSoat (MaDoiSoat, NgayLap, PhuongThucThanhToan, TrangThai, MaNhanVienKeToan, MaPhieuTra, MaQuyDinhHoanCoc) VALUES
    (N'DS0001', N'2026-01-13', N'Chuyển khoản', N'Đã hoàn cọc', N'NV0004', N'PT0003', N'QH0002'),
    (N'DS0002', N'2024-12-31', N'Tiền mặt', N'Đã hoàn cọc', N'NV0008', N'PT0004', N'QH0004'),
    (N'DS0003', N'2025-07-22', N'Chuyển khoản', N'Chờ hoàn cọc', N'NV0008', N'PT0006', N'QH0001'),
    (N'DS0004', N'2025-12-20', N'Chuyển khoản', N'Đã quyết toán', N'NV0008', N'PT0008', N'QH0003');
GO

INSERT INTO QuiDinh (MaQuyDinh, TieuDeNoiQuy, NoiDung, TrangThai) VALUES
    (N'QD0001', N'Giờ giấc sinh hoạt', N'Giữ trật tự sau 22h, hạn chế gây ồn.', N'Hiệu lực'),
    (N'QD0002', N'Sử dụng tài sản chung', N'Không tự ý di chuyển hoặc làm hư hỏng tài sản.', N'Hiệu lực'),
    (N'QD0003', N'Vệ sinh phòng', N'Giữ vệ sinh khu vực ở và khu vực chung.', N'Hiệu lực'),
    (N'QD0004', N'Thanh toán đúng hạn', N'Thanh toán tiền thuê và dịch vụ đúng hạn.', N'Hiệu lực'),
    (N'QD0005', N'An ninh ra vào', N'Không cho người lạ lưu trú qua đêm khi chưa đăng ký.', N'Hiệu lực');
GO

INSERT INTO DieuKhoanViPham (MaDieuKhoan, TenDieuKhoan, HinhThucXuPhat, MucPhat, TrangThai) VALUES
    (N'VP0001', N'Không giữ vệ sinh chung', N'Phạt tiền', 100000, N'Hiệu lực'),
    (N'VP0002', N'Làm hư tài sản tại nơi sinh hoạt chung', N'Phạt tiền', 500000, N'Hiệu lực'),
    (N'VP0003', N'Gây ồn sau giờ quy định', N'Phạt tiền', 200000, N'Hiệu lực'),
    (N'VP0004', N'Thanh toán quá hạn', N'Phạt tiền', 100000, N'Hiệu lực'),
    (N'VP0005', N'Vi phạm vệ sinh phòng', N'Nhắc nhở', 0, N'Hiệu lực'),
    (N'VP0006', N'Tự ý cho người ngoài ở lại', N'Phạt tiền', 500000, N'Hiệu lực');
GO

INSERT INTO BienBanViPham (MaBBViPham, NgayViPham, MoTaViPham, SoTienPhat, TrangThai, MaKhachHang, MaHopDong, MaDieuKhoan) VALUES
    (N'BV0001', N'2025-02-12', N'Khách không giữ vệ sinh khu vực sinh hoạt chung, để rác sai nơi quy định.', 100000, N'Đã xử lý', N'KH0001', N'HD0001', N'VP0001'),
    (N'BV0002', N'2025-03-18', N'Khách làm hư tài sản tại khu sinh hoạt chung trong quá trình sử dụng.', 500000, N'Chờ xử lý', N'KH0002', N'HD0002', N'VP0002'),
    (N'BV0003', N'2025-04-05', N'Khách gây ồn sau giờ quy định, ảnh hưởng đến các phòng xung quanh.', 200000, N'Đã xử lý', N'KH0003', N'HD0003', N'VP0003'),
    (N'BV0004', N'2025-05-10', N'Khách thanh toán tiền thuê quá hạn so với thời hạn quy định trong hợp đồng.', 100000, N'Đã xử lý', N'KH0004', N'HD0004', N'VP0004'),
    (N'BV0005', N'2025-06-22', N'Khách vi phạm vệ sinh phòng ở, chưa dọn dẹp khu vực cá nhân theo nhắc nhở.', 0, N'Chờ xử lý', N'KH0005', N'HD0005', N'VP0005'),
    (N'BV0006', N'2025-07-03', N'Khách tự ý cho người ngoài ở lại qua đêm khi chưa đăng ký với quản lý.', 500000, N'Chờ xử lý', N'KH0006', N'HD0006', N'VP0006'),
    (N'BV0007', N'2025-08-14', N'Khách tiếp tục gây tiếng ồn lớn sau 22h dù đã được nhắc nhở trước đó.', 200000, N'Đã xử lý', N'KH0008', N'HD0008', N'VP0003'),
    (N'BV0008', N'2025-09-01', N'Khách không giữ vệ sinh khu vực sinh hoạt chung sau khi sử dụng bếp chung.', 100000, N'Đã xử lý', N'KH0010', N'HD0010', N'VP0001'),
    (N'BV0009', N'2025-10-12', N'Khách làm hư tài sản tại nơi sinh hoạt chung và chưa hoàn tất bồi thường.', 500000, N'Chờ xử lý', N'KH0011', N'HD0011', N'VP0002'),
    (N'BV0010', N'2025-11-08', N'Khách thanh toán phí thuê phòng quá hạn theo thông báo của kế toán.', 100000, N'Đã xử lý', N'KH0012', N'HD0012', N'VP0004');
GO

INSERT INTO YeuCauSuaChua (MaYeuCau, NgayYeuCau, MoTaHuHong, HinhAnhMinhChung, TrangThai, NgayTiepNhan, NgayHoanTat, ChiPhiSuaChua, LoiDoKhachGayRa, GhiChuXuLy, MaHopDong, MaPhong, MaTaiSan, MaNhanVienQuanLy) VALUES
    (N'SC0001', N'2025-12-01', N'Máy lạnh không lạnh', NULL, N'Hoàn tất', N'2025-12-01', N'2025-12-02', 350000, 0, N'Vệ sinh máy lạnh và nạp gas', N'HD0001', N'P101', N'TS0001', N'NV0003'),
    (N'SC0002', N'2025-12-04', N'Ổ khóa tủ bị kẹt', NULL, N'Đang xử lý', N'2025-12-05', NULL, 0, 0, N'Đã đặt lịch thợ sửa', N'HD0005', N'P102', N'TS0003', N'NV0003'),
    (N'SC0003', N'2025-11-20', N'Nệm bị rách do khách làm đổ vật sắc', NULL, N'Hoàn tất', N'2025-11-20', N'2025-11-21', 200000, 1, N'Thay vỏ nệm, tính vào khấu trừ nếu trả phòng', N'HD0006', N'P202', N'TS0002', N'NV0003'),
    (N'SC0004', N'2025-10-02', N'Đèn phòng chập chờn', NULL, N'Hoàn tất', N'2025-10-02', N'2025-10-02', 80000, 0, N'Thay bóng đèn', N'HD0011', N'P203', N'TS0001', N'NV0007'),
    (N'SC0005', N'2025-09-15', N'Wifi yếu trong phòng', NULL, N'Từ chối', N'2025-09-15', NULL, 0, 0, N'Đã kiểm tra, do thiết bị cá nhân của khách', N'HD0012', N'P301', NULL, N'NV0011'),
    (N'SC0006', N'2025-12-12', N'Vòi nước rò rỉ', NULL, N'Chờ tiếp nhận', NULL, NULL, 0, 0, NULL, N'HD0008', N'P105', NULL, NULL),
    (N'SC0007', N'2025-12-13', N'Tủ cá nhân hỏng bản lề', NULL, N'Hoàn tất', N'2025-12-13', N'2025-12-14', 250000, 1, N'Thay bản lề tủ', N'HD0008', N'P105', N'TS0003', N'NV0003'),
    (N'SC0008', N'2025-12-18', N'Thẻ từ không mở được cửa', NULL, N'Đang xử lý', N'2025-12-19', NULL, 100000, 0, N'Đang kiểm tra đầu đọc thẻ', N'HD0010', N'P202', N'TS0004', N'NV0007');
GO


/* ===== DỮ LIỆU TEST CHO KH0001 ĐỂ TEST TÌM KIẾM PHÒNG/GIƯỜNG ===== */
INSERT INTO PhieuDatCoc (MaPhieuDatCoc, ThoiDiemDatCoc, ThoiHanThanhToan, SoTienCoc, PhuongThucThanhToan, TrangThaiThanhToan, ThoiGianXacNhanTT, ChungTuThanhToan, ThoiGianNhanPhong, HinhThucThue, TrangThaiCoc, MaPhieuYeuCauDangKy, MaKhachHang, MaNhanVienKeToan) VALUES
    (N'PC0017', N'2026-05-01 10:00:00', N'2026-05-02 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2026-05-01 15:00:00', NULL, N'2026-06-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0017', N'KH0001', N'NV0008'),
    (N'PC0018', N'2026-06-01 10:00:00', N'2026-06-02 10:00:00', NULL, N'Chuyển khoản', N'Đã TT', N'2026-06-01 15:00:00', NULL, N'2026-07-01 08:00:00', N'Ghép giường', N'Đã lập HĐ', N'DK0018', N'KH0001', N'NV0012');
GO

INSERT INTO ChiTietDatCoc (MaChiTietDC, MaPhieuDatCoc, MaPhong, MaGiuong, GiaThue) VALUES
    (N'CD0017', N'PC0017', N'P305', N'G01', 1800000),
    (N'CD0018', N'PC0018', N'P304', N'G02', 1800000);
GO

INSERT INTO HopDongThue (MaHopDong, NgayKyHD, NgayBatDau, NgayKetThuc, SoGiuongThue, GiaThue, KyThanhToan, TrangThai, MaPhieuCoc, MaKhachHang, MaNhanVienQuanLy) VALUES
    (N'HD0013', N'2026-05-05', N'2026-06-01', N'2027-05-31', 1, 1800000, N'Hàng tháng', N'Hiệu lực', N'PC0017', N'KH0001', N'NV0007'),
    (N'HD0014', N'2026-06-05', N'2026-07-01', N'2027-06-30', 1, 1800000, N'Hàng tháng', N'Hiệu lực', N'PC0018', N'KH0001', N'NV0011');
GO

INSERT INTO ThanhVienHopDong (MaThanhVien, HoTen, NgaySinh, GioiTinh, CCCD, SDT, Email, QuocTich, TrangThai, MaHopDong) VALUES
    (N'TV0021', N'Nguyễn Văn An', N'1996-01-01', N'Nam', N'079200000001', N'091200001', N'kh0001@mail.com', N'Việt Nam', N'Đang ở', N'HD0013'),
    (N'TV0022', N'Nguyễn Văn An', N'1996-01-01', N'Nam', N'079200000001', N'091200001', N'kh0001@mail.com', N'Việt Nam', N'Đang ở', N'HD0014');
GO

INSERT INTO PhieuTraPhong (MaPhieuTra, NgayDangKyTra, NgayDuKienTra, NgayTraThucTe, TrangThai, MaHopDong, MaPhieuDatCoc) VALUES
    (N'PT0009', N'2026-05-30', N'2026-06-10', NULL, N'Chờ xử lý', N'HD0013', NULL),
    (N'PT0010', N'2026-05-31', N'2026-06-15', NULL, N'Chờ xử lý', N'HD0014', NULL);
GO

/* ===== QUERY CHECK NHANH SAU KHI CHẠY =====
SELECT MaNguoiDung, HoTen, GioiTinh FROM NguoiDung WHERE GioiTinh NOT IN (N'Nam', N'Nữ');
SELECT MaPhong, GioiTinhChoPhep FROM Phong WHERE GioiTinhChoPhep NOT IN (N'Nam', N'Nữ');
SELECT tk.MaNguoiDung, COUNT(*) AS SoTaiKhoan FROM TaiKhoan tk GROUP BY tk.MaNguoiDung HAVING COUNT(*) > 1;
SELECT ctdc.MaPhong, COUNT(DISTINCT tv.GioiTinh) AS SoLoaiGioiTinh
FROM HopDongThue hd
JOIN ChiTietDatCoc ctdc ON hd.MaPhieuCoc = ctdc.MaPhieuDatCoc
JOIN ThanhVienHopDong tv ON hd.MaHopDong = tv.MaHopDong
WHERE hd.TrangThai = N'Hiệu lực' AND tv.TrangThai = N'Đang ở'
GROUP BY ctdc.MaPhong
HAVING COUNT(DISTINCT tv.GioiTinh) > 1;
*/