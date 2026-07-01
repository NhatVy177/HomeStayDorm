import { httpClient } from '../../api/httpClient.js';

export const capNhatTraPhongApi = {
  getDanhSachHoanTat: () => httpClient.get('/cap-nhat-tra-phong/danh-sach'),
  getChiTietHoanTat: (maPhieuTra) => httpClient.get(`/cap-nhat-tra-phong/chi-tiet/${maPhieuTra}`),
  xacNhanHoanTat: (data) => httpClient.post('/cap-nhat-tra-phong/xac-nhan', data)
};
