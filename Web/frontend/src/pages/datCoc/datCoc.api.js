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
  chonPhuongThuc: (id, data) => httpClient.put(`/dat-coc/${id}/phuong-thuc`, data),
  xacNhanThanhToan: (id, data) => httpClient.put(`/dat-coc/${id}/xac-nhan-thanh-toan`, data),
  guiYeuCauDatCoc: (data) => httpClient.post('/dat-coc/gui-yeu-cau', data),
  // DC01 (A4) - Sale chỉnh sửa thông tin cá nhân/liên hệ/giấy tờ khách hàng trước khi gửi yêu cầu.
  capNhatThongTinCaNhan: (maDangKy, data) => httpClient.put(`/dat-coc/gui-yeu-cau/${maDangKy}/thong-tin-ca-nhan`, data),
  getDanhSachChoXacNhan: () => httpClient.get('/dat-coc/cho-xac-nhan'),
  // DC02B - hồ sơ Quản lý đã duyệt, chờ Sale lập phiếu cọc
  getDanhSachChoLapPhieu: () => httpClient.get('/dat-coc/cho-lap-phieu'),
  // DC03 - phiếu Sale đã lập, chờ Kế toán tính tiền và chốt
  getDanhSachChoTinhTien: () => httpClient.get('/dat-coc/cho-tinh-tien'),
  // DC03 - Kế toán chốt ({ chot: true }) hoặc hủy ({ chot: false, lyDo: '...' }) phiếu cọc
  chotPhieuDatCoc: (id, data) => httpClient.put(`/dat-coc/${id}/chot`, data),
  getGiuongTrong: (maPhong) => httpClient.get('/dat-coc/giuong-trong', { params: { maPhong } }),
  // DC01 - các phòng khách đã xem (để Sale chốt phòng khách muốn thuê)
  getPhongDaXem: (maDangKy) => httpClient.get('/dat-coc/phong-da-xem', { params: { maDangKy } }),
  // DC01 - Sale chốt/đổi phòng khách muốn thuê ({ maPhong: 'P102' })
  chonPhongChot: (maDangKy, data) => httpClient.put(`/dat-coc/gui-yeu-cau/${maDangKy}/phong-chot`, data),
  getDanhSachChoGhiNhanChungTu: () => httpClient.get('/dat-coc/cho-ghi-nhan-chung-tu'),
  getDanhSachChoXacNhanThanhToan: () => httpClient.get('/dat-coc/cho-xac-nhan-thanh-toan')
};
