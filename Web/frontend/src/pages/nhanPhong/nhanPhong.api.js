import { httpClient } from '../../api/httpClient.js';

export const nhanPhongApi = {
  capNhatThongTinCuTru: (data) => httpClient.post('/nhan-phong/thong-tin-cu-tru', data),
  lapHopDong: (data) => httpClient.post('/nhan-phong/hop-dong', data),
  ghiNhanThuDauKy: (data) => httpClient.post('/nhan-phong/thu-dau-ky', data),
  lapBienBanBanGiao: (data) => httpClient.post('/nhan-phong/ban-giao', data)
};
