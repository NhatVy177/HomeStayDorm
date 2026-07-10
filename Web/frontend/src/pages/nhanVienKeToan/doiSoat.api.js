import { httpClient } from '../../api/httpClient.js';

export const doiSoatApi = {
  getDanhSachChoDoiSoat: () =>
    httpClient.get('/accountant/doi-soat/cho-doi-soat'),

  getChiTietPhieuTraPhong: (maPhieuTra) =>
    httpClient.get(`/accountant/doi-soat/phieu-tra-phong/${maPhieuTra}`),

  taoDoiSoat: (data) =>
    httpClient.post('/accountant/doi-soat', data),

  uploadChungTu: (data) =>
    httpClient.post('/accountant/doi-soat/chung-tu', data),

  getKetQuaDoiSoat: () =>
    httpClient.get('/accountant/doi-soat/ket-qua'),

  getDanhSachChoHoanCoc: () =>
    httpClient.get('/accountant/doi-soat/cho-hoan-coc'),

  getDanhSachDaHoanCoc: () =>
    httpClient.get('/accountant/doi-soat/da-hoan-coc'),

  getChiTietHoanCoc: (maDoiSoat) =>
    httpClient.get(`/accountant/doi-soat/hoan-coc/${maDoiSoat}`),

  xacNhanHoanCoc: (data) =>
    httpClient.post('/accountant/doi-soat/hoan-coc/xac-nhan', data),

  getDanhSachChoThuThem: (filter) =>
    httpClient.get('/accountant/doi-soat/cho-thu-them', { params: filter ? { filter } : {} }),

  getDanhSachDaThuThem: () =>
    httpClient.get('/accountant/doi-soat/da-thu-them'),

  getChiTietThuThem: (maDoiSoat) =>
    httpClient.get(`/accountant/doi-soat/thu-them/${maDoiSoat}`),

  xacNhanThuThem: (data) =>
    httpClient.post('/accountant/doi-soat/thu-them/xac-nhan', data),

  khongXacNhanThuThem: (data) =>
    httpClient.post('/accountant/doi-soat/thu-them/khong-xac-nhan', data)
};
