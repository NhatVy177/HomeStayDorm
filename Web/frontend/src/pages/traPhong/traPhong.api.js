import { httpClient } from '../../api/httpClient.js';

export const traPhongApi = {
  dangKyLichTraPhong: (data) => httpClient.post('/tra-phong/lich-tra-phong', data),
  lapBienBanKiemTra: (data) => httpClient.post('/tra-phong/bien-ban-kiem-tra', data),
  xuLyQuyetToan: (data) => httpClient.post('/tra-phong/quyet-toan', data),
  thanhLyHopDong: (data) => httpClient.put('/tra-phong/thanh-ly-hop-dong', data)
};
