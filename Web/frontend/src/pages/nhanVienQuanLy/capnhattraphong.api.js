import { httpClient } from '../../api/httpClient.js';

export const capNhatTraPhongApi = {
  getDanhSachHoanTat: (status = 'Chờ hoàn tất') => httpClient.get('/cap-nhat-tra-phong/danh-sach', { params: { status } }),
  getChiTietHoanTat: (maPhieuTra) => httpClient.get(`/cap-nhat-tra-phong/chi-tiet/${maPhieuTra}`),
  xacNhanHoanTat: (data) => httpClient.post('/cap-nhat-tra-phong/xac-nhan', data)
};
