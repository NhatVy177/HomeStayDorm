import { httpClient } from '../../api/httpClient.js';

export const thuNhanPhongApi = {
  getDanhSachHDChoThuDauKy: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.trangThaiThuTien) params.append('trangThaiThuTien', filters.trangThaiThuTien);
    if (filters.tuKhoa) params.append('tuKhoa', filters.tuKhoa);
    if (filters.maPhong) params.append('maPhong', filters.maPhong);
    if (filters.maGiuong) params.append('maGiuong', filters.maGiuong);
    return httpClient.get(`/nhan-phong/cho-thu-dau-ky?${params.toString()}`);
  },

  tinhKhoanThuNhanPhong: (maHopDong) =>
    httpClient.get(`/nhan-phong/tinh-khoan-thu/${maHopDong}`),

  layChiTietThuNhanPhong: (maHopDong) =>
    httpClient.get(`/nhan-phong/chi-tiet-thu/${maHopDong}`),

  ghiNhanThuDauKy: (payload) =>
    httpClient.post('/nhan-phong/ghi-nhan-thu-dau-ky', payload),

  kiemTraDieuKienBanGiaoSauThuTien: (maHopDong) =>
    httpClient.get(`/nhan-phong/kiem-tra-ban-giao/${maHopDong}`)
};
