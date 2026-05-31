import { httpClient } from '../../api/httpClient.js';

export const nhanPhongApi = {
  getDanhSachChoNhanPhong: () => httpClient.get('/nhan-phong/danh-sach'),
  capNhatThongTinCuTru: (data) => httpClient.post('/nhan-phong/thong-tin-cu-tru', data),
  lapHopDong: (data) => httpClient.post('/nhan-phong/hop-dong', data),
  ghiNhanThuDauKy: (data) => httpClient.post('/nhan-phong/ghi-nhan-thu-dau-ky', data),
  lapBienBanBanGiao: (data) => httpClient.post('/nhan-phong/ban-giao', data),
  getDanhSachChoThuDauKy: () => httpClient.get('/nhan-phong/cho-thu-dau-ky'),
};

