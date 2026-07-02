import { httpClient } from '../../api/httpClient.js';

export const datCocApi = {
  getAll: () => httpClient.get('/dat-coc'),
  create: (data) => httpClient.post('/dat-coc', data),
  xacNhanKhaNang: (id, data) => httpClient.put(`/dat-coc/${id}/xac-nhan-kha-nang-nhan-coc`, data),
  phatHanhThanhToan: (id, data) => httpClient.put(`/dat-coc/${id}/phat-hanh-thanh-toan`, data),
  // formData: FormData gồm file ảnh + các trường giao dịch (multipart)
  capNhatMinhChung: (id, formData) => httpClient.put(`/dat-coc/${id}/minh-chung-thanh-toan`, formData, { headers: { 'Content-Type': undefined } }),
  // DC04 - khách hàng tự gửi chứng từ (FormData: file ảnh/PDF + ghiChu)
  capNhatMinhChungKhach: (id, formData) => httpClient.put(`/dat-coc/${id}/minh-chung-khach`, formData, { headers: { 'Content-Type': undefined } }),
  // DC04 - khách hàng chọn phương thức thanh toán ({ phuongThucThanhToan: 'Tiền mặt' | 'Chuyển khoản' })
  chonPhuongThucKhach: (id, data) => httpClient.put(`/dat-coc/${id}/phuong-thuc-khach`, data),
  xacNhanThanhToan: (id, data) => httpClient.put(`/dat-coc/${id}/xac-nhan-thanh-toan`, data),
  guiYeuCauDatCoc: (data) => httpClient.post('/dat-coc/gui-yeu-cau', data),
  getDanhSachChoXacNhan: () => httpClient.get('/dat-coc/cho-xac-nhan'),
  getDanhSachChoLapPhieu: () => httpClient.get('/dat-coc/cho-lap-phieu'),
  getGiuongTrong: (maPhong) => httpClient.get('/dat-coc/giuong-trong', { params: { maPhong } }),
  getDanhSachChoGhiNhanChungTu: () => httpClient.get('/dat-coc/cho-ghi-nhan-chung-tu'),
  getDanhSachChoXacNhanThanhToan: () => httpClient.get('/dat-coc/cho-xac-nhan-thanh-toan')
};
