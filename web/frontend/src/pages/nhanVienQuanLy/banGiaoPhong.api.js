import { httpClient } from '../../api/httpClient.js';

export const banGiaoPhongApi = {
  getDanhSachChoBanGiao: () =>
    httpClient.get('/nhan-phong/cho-ban-giao'),

  traCuuHopDongBanGiao: (maHopDong) =>
    httpClient.get(`/nhan-phong/ban-giao/${maHopDong}`),

  lapBienBanBanGiao: (payload) =>
    httpClient.post('/nhan-phong/ban-giao', payload),

  layKetQuaLapBienBanBanGiao: (maBienBan) =>
    httpClient.get(`/nhan-phong/ban-giao/ket-qua/${maBienBan}`)
};
