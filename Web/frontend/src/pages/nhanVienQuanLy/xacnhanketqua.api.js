import { httpClient } from '../../api/httpClient.js';

export const xacNhanKetQuaApi = {
  getDanhSachChoXacNhan: () =>
    httpClient.get('/xac-nhan-ket-qua/cho-xac-nhan'),

  getChiTietDoiSoat: (maDoiSoat) =>
    httpClient.get(`/xac-nhan-ket-qua/chi-tiet/${maDoiSoat}`),

  xacNhanDoiSoat: (data) =>
    httpClient.post('/xac-nhan-ket-qua/xac-nhan', data)
};
