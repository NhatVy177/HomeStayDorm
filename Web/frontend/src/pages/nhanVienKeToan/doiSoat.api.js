import { httpClient } from '../../api/httpClient.js';

export const doiSoatApi = {
  getDanhSachChoDoiSoat: () =>
    httpClient.get('/accountant/doi-soat/cho-doi-soat'),

  getChiTietPhieuTraPhong: (maPhieuTra) =>
    httpClient.get(`/accountant/doi-soat/phieu-tra-phong/${maPhieuTra}`),

  taoDoiSoat: (data) =>
    httpClient.post('/accountant/doi-soat', data),

  getDanhSachChoHoanCoc: () =>
    httpClient.get('/accountant/doi-soat/cho-hoan-coc'),

  getChiTietHoanCoc: (maDoiSoat) =>
    httpClient.get(`/accountant/doi-soat/hoan-coc/${maDoiSoat}`),

  xacNhanHoanCoc: (data) =>
    httpClient.post('/accountant/doi-soat/hoan-coc/xac-nhan', data),

  getDanhSachChoThuThem: () =>
    httpClient.get('/accountant/doi-soat/cho-thu-them'),

  getChiTietThuThem: (maDoiSoat) =>
    httpClient.get(`/accountant/doi-soat/thu-them/${maDoiSoat}`),

  xacNhanThuThem: (data) =>
    httpClient.post('/accountant/doi-soat/thu-them/xac-nhan', data)
};
