import { httpClient } from '../../api/httpClient.js';

export const hopDongApi = {
  traCuuPhieuCoc: (tuKhoa = '') => 
    httpClient.get(`/hop-dong/phieu-coc?tuKhoa=${encodeURIComponent(tuKhoa)}`),
    
  layChiTietPhieuCoc: (id) => 
    httpClient.get(`/hop-dong/phieu-coc/${id}`),
    
  kiemTraDieuKienLapHopDong: (id) => 
    httpClient.get(`/hop-dong/phieu-coc/${id}/kiem-tra`),

  layHoSoCuTruDaDuyet: (id) =>
    httpClient.get(`/hop-dong/phieu-coc/${id}/cu-tru-duyet`),
    
  layDanhSachDichVu: () => 
    httpClient.get('/hop-dong/dich-vu'),
    
  kiemTraThanhVienHopDongTam: (id, thanhVienList) => 
    httpClient.post(`/hop-dong/phieu-coc/${id}/thanh-vien/kiem-tra`, thanhVienList),
    
  lapHopDongThue: (payload) => 
    httpClient.post('/hop-dong', payload),
    
  layChiTietHopDongThue: (id) => 
    httpClient.get(`/hop-dong/${id}`),

  layChiTietHopDongTheoPhieuCoc: (id) =>
    httpClient.get(`/hop-dong/phieu-coc/${id}/hop-dong`),

  layDanhSachQuanLy: () =>
    httpClient.get('/hop-dong/quan-ly')
};
