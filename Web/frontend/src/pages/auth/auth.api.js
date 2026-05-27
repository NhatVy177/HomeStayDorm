import { httpClient } from '../../api/httpClient.js';

export const authApi = {
  dangKy: (data) => httpClient.post('/auth/dang-ky', data),
  dangNhap: (data) => httpClient.post('/auth/dang-nhap', data),
  getToi: () => httpClient.get('/auth/toi'),
  dangXuat: () => httpClient.post('/auth/dang-xuat')
};
