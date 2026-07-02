import { httpClient } from '../../api/httpClient.js';

export const xacNhanPhanHoiApi = {
  getDanhSachChoXuLy: () =>
    httpClient.get('/xac-nhan-phan-hoi/cho-xu-ly'),

  getChiTietPhanHoi: (maDoiSoat) =>
    httpClient.get(`/xac-nhan-phan-hoi/chi-tiet/${maDoiSoat}`),

  xuLyPhanHoi: (data) =>
    httpClient.post('/xac-nhan-phan-hoi/xu-ly', data),
};
