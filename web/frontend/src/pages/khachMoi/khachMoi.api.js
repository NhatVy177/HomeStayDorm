import { httpClient } from '../../api/httpClient.js';

export const khachMoiApi = {
  getTrangThai: () => httpClient.get('/khach-moi/trang-thai'),
  getTongQuan: () => httpClient.get('/khach-moi/tong-quan'),
  getPhongKhaDung: (params = {}) => httpClient.get('/khach-moi/phong-kha-dung', { params }),
  getChiTietPhong: (maPhong) => httpClient.get(`/khach-moi/phong/${maPhong}`),
  getLichXemDetail: (id) => httpClient.get(`/khach-moi/lich-xem/${id}`),
  createHoSo: (data) => httpClient.post('/khach-moi/ho-so', data),
  getHoSoDetail: (id) => httpClient.get(`/khach-moi/ho-so/${id}`),
  updateHoSo: (id, data) => httpClient.put(`/khach-moi/ho-so/${id}`, data),
  yeuCauDieuChinhLich: (id, data) => httpClient.put(`/khach-moi/lich-xem/${id}/yeu-cau-dieu-chinh`, data),
  getDatCoc: () => httpClient.get('/khach-moi/dat-coc'),
  uploadMinhChung: (id, data) => httpClient.post(`/khach-moi/dat-coc/${id}/minh-chung`, data),
  getHopDongDashboard: (params = {}) => httpClient.get('/khach-moi/hop-dong-dashboard', { params }),
  guiYeuCauTraPhong: (data) => httpClient.post('/khach-moi/hop-dong-dashboard/tra-phong', data),
  huyYeuCauTraPhong: (id) => httpClient.delete(`/khach-moi/hop-dong-dashboard/tra-phong/${id}`),
  phanHoiDoiSoatTraPhong: (id, data) => httpClient.post(`/khach-moi/hop-dong-dashboard/doi-soat/${id}/phan-hoi`, data),
  ghiNhanThanhToanDoiSoatTraPhong: (id, formData) => httpClient.post(`/khach-moi/hop-dong-dashboard/doi-soat/${id}/thanh-toan`, formData, { headers: { 'Content-Type': undefined } })
};
