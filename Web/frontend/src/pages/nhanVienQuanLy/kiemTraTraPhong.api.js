import { httpClient } from '../../api/httpClient.js';

export const kiemTraTraPhongApi = {
  quanLyDanhSachChoXuLy: () =>
    httpClient.get('/kiem-tra-tra-phong/quan-ly/cho-xu-ly'),

  quanLyChiTietPhieu: (maPhieuTra) =>
    httpClient.get(`/kiem-tra-tra-phong/quan-ly/chi-tiet/${maPhieuTra}`),

  quanLyXacNhanHuyCoc: (data) =>
    httpClient.post('/kiem-tra-tra-phong/quan-ly/xac-nhan-huy-coc', data),

  quanLyLapBienBanKiemTra: (data) =>
    httpClient.post('/kiem-tra-tra-phong/quan-ly/kiem-tra', data),
};
