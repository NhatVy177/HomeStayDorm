import { httpClient } from '../../api/httpClient.js';

export const datCocApi = {
  getAll: () => httpClient.get('/dat-coc'),
  create: (data) => httpClient.post('/dat-coc', data),
  xacNhanKhaNang: (id, data) => httpClient.put(`/dat-coc/${id}/xac-nhan-kha-nang-nhan-coc`, data),
  phatHanhThanhToan: (id, data) => httpClient.put(`/dat-coc/${id}/phat-hanh-thanh-toan`, data),
  capNhatMinhChung: (id, data) => httpClient.put(`/dat-coc/${id}/minh-chung-thanh-toan`, data),
  xacNhanThanhToan: (id, data) => httpClient.put(`/dat-coc/${id}/xac-nhan-thanh-toan`, data)
};
