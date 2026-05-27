import { httpClient } from '../../api/httpClient.js';

export const khachMoiApi = {
  getTrangThai: () => httpClient.get('/khach-moi/trang-thai'),
  getTongQuan: () => httpClient.get('/khach-moi/tong-quan'),
  getPhongKhaDung: (params = {}) => httpClient.get('/khach-moi/phong-kha-dung', { params }),
  createHoSo: (data) => httpClient.post('/khach-moi/ho-so', data),
  yeuCauDieuChinhLich: (id, data) => httpClient.put(`/khach-moi/lich-xem/${id}/yeu-cau-dieu-chinh`, data)
};
