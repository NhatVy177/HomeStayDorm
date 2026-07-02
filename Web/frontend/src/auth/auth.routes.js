export function getAuthenticatedHomePath(user) {
  if (user?.vaiTro === 'KhachHang') {
    return '/khach-hang';
  }

  if (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Sale') {
    return '/nhan-vien-sale';
  }

  if (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Quản lý') {
    return '/nhan-vien-quan-ly';
  }

  if (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Kế toán') {
    return '/nhan-vien-ke-toan';
  }

  if (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Admin') {
    return '/nhan-vien-admin';
  }

  return '/dashboard';
}
