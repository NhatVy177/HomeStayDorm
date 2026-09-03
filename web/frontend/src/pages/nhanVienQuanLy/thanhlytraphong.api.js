import { httpClient } from '../../api/httpClient.js';

export const thanhLyTraPhongApi = {
  getDanhSachThanhLy: () => {
    return httpClient.get('/thanh-ly-tra-phong/danh-sach');
  },
  
  getChiTietThanhLy: (maPhieuTra) => {
    return httpClient.get(`/thanh-ly-tra-phong/chi-tiet/${maPhieuTra}`);
  },

  xacNhanThanhLy: (data) => {
    return httpClient.post('/thanh-ly-tra-phong/xac-nhan', data);
  }
};
