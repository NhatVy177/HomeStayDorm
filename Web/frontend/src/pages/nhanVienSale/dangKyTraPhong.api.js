import { httpClient } from '../../api/httpClient.js';

export const dangKyTraPhongApi = {
  /**
   * Tìm kiếm khách hàng theo từ khóa
   * @param {string} tuKhoa
   */
  saleTimKhachHang: (tuKhoa) =>
    httpClient.get('/dang-ky-tra-phong/sale/tim-khach', { params: { tuKhoa } }),

  /**
   * Lấy danh sách HĐ + Phiếu cọc hợp lệ của một khách hàng
   * @param {string} maKhachHang
   */
  saleDanhSachHopDong: (maKhachHang) =>
    httpClient.get(`/dang-ky-tra-phong/sale/hop-dong/${maKhachHang}`),

  /**
   * Nhân viên Sale tạo phiếu đăng ký lịch trả phòng
   * @param {{ maKhachHang: string, maHopDong?: string, maPhieuDatCoc?: string, ngayDuKienTra: string }} data
   */
  saleDangKyLichTraPhong: (data) =>
    httpClient.post('/dang-ky-tra-phong/sale/dang-ky', data),

};
