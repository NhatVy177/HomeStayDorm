import { httpClient } from '../../api/httpClient.js';

export const dangKyThueApi = {
  getAll: (params) => httpClient.get('/dang-ky-thue', { params }),
  create: (data) => httpClient.post('/dang-ky-thue', data),
  getPhongGiuongKhaDung: (params) => httpClient.get('/dang-ky-thue/phong-giuong-kha-dung', { params }),
  traCuuPhong: (params) => httpClient.get('/dang-ky-thue/tra-cuu-phong', { params }),
  kiemTraDieuKien: (id) => httpClient.get(`/dang-ky-thue/${id}/kiem-tra-dieu-kien`),
  capNhatKetQuaXuLy: (id, data) => httpClient.put(`/dang-ky-thue/${id}/ket-qua-xu-ly`, data),
  tiepNhan: (id) => httpClient.put(`/dang-ky-thue/${id}/tiep-nhan`),
  taoHoSoKhachVangLai: (data) => httpClient.post('/dang-ky-thue/khach-vang-lai', data)
};
