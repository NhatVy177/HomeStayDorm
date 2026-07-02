import { httpClient } from '../../api/httpClient.js';

export const cuTruApi = {
  traCuuPhieuCoc: (tuKhoa = '') =>
    httpClient.get(`/nhan-phong/cu-tru/phieu-coc?tuKhoa=${encodeURIComponent(tuKhoa)}`),

  luuHoSoCuTru: (payload) =>
    httpClient.post('/nhan-phong/cu-tru/ho-so', payload),

  guiDuyetHoSoCuTru: (maHoSo) =>
    httpClient.post(`/nhan-phong/cu-tru/ho-so/${maHoSo}/gui-duyet`),

  layDanhSachChoDuyet: ({ tuKhoa = '', trangThai = 'Chờ duyệt cư trú' } = {}) =>
    httpClient.get(`/nhan-phong/cu-tru/cho-duyet?tuKhoa=${encodeURIComponent(tuKhoa)}&trangThai=${encodeURIComponent(trangThai || '')}`),

  layChiTietHoSo: (maHoSo) =>
    httpClient.get(`/nhan-phong/cu-tru/ho-so/${maHoSo}`),

  duyetHoSoCuTru: (maHoSo, payload) =>
    httpClient.post(`/nhan-phong/cu-tru/ho-so/${maHoSo}/duyet`, payload)
};
