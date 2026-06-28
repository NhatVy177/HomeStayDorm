import { httpClient } from '../../api/httpClient.js';

export const lichXemPhongApi = {
  getAll: () => httpClient.get('/lich-xem-phong'),
  getPhongPhuHop: (maDangKy) => httpClient.get(`/lich-xem-phong/phong-phu-hop?maDangKy=${maDangKy}`),
  create: (data) => httpClient.post('/lich-xem-phong', data),
  yeuCauDieuChinh: (id, data) => httpClient.put(`/lich-xem-phong/${id}/yeu-cau-dieu-chinh`, data),
  capNhat: (id, data) => httpClient.put(`/lich-xem-phong/${id}/cap-nhat`, data)
};
