import { httpClient } from '../../api/httpClient.js';

export const dangKyThueApi = {
  getAll: () => httpClient.get('/dang-ky-thue'),
  create: (data) => httpClient.post('/dang-ky-thue', data),
  getPhongGiuongKhaDung: () => httpClient.get('/dang-ky-thue/phong-giuong-kha-dung'),
  kiemTraDieuKien: (id) => httpClient.get(`/dang-ky-thue/${id}/kiem-tra-dieu-kien`),
  capNhatKetQuaXuLy: (id, data) => httpClient.put(`/dang-ky-thue/${id}/ket-qua-xu-ly`, data)
};
