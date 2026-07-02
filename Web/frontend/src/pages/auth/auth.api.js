import { httpClient } from '../../api/httpClient.js';

export const authApi = {
  dangKy: (data) => httpClient.post('/auth/dang-ky', data),
  kiemTraSoDienThoai: (sdt) => httpClient.get('/auth/kiem-tra-sdt', { params: { sdt } }),
  dangNhap: (data) => httpClient.post('/auth/dang-nhap', data),
  getToi: () => httpClient.get('/auth/toi'),
  dangXuat: () => httpClient.post('/auth/dang-xuat')
};
