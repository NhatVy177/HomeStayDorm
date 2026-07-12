import { httpClient } from '../../api/httpClient.js';

export const banGiaoRaApi = {
  getDanhSachBanGiaoRa: (status = 'Chờ bàn giao') => httpClient.get('/ban-giao-ra/danh-sach', { params: { status } }),
  getChiTietBanGiaoRa: (maPhieuTra) => httpClient.get(`/ban-giao-ra/chi-tiet/${maPhieuTra}`),
  ghiNhanBanGiaoRa: (data) => httpClient.post('/ban-giao-ra/xac-nhan', data)
};
