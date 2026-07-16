import { httpClient } from '../../api/httpClient.js';

export const dangKyTraPhongApi = {
  /**
   * Tìm kiếm khách hàng theo từ khóa.
   * Kèm cờ coPhieuTraHienHanh để UI quyết định nút "Chọn" / "Xem phiếu".
   * @param {string} tuKhoa
   */
  saleTimKhachHang: (tuKhoa) =>
    httpClient.get('/dang-ky-tra-phong/sale/tim-khach', { params: { tuKhoa } }),

  /**
   * Lấy hồ sơ lưu trú hiện hành của khách tại chi nhánh NV sale.
   * Trả về { hoSo } – null nếu không có hồ sơ hợp lệ.
   * @param {string} maKhachHang
   */
  saleLayHoSoHienHanh: (maKhachHang) =>
    httpClient.get(`/dang-ky-tra-phong/sale/ho-so-hien-hanh/${maKhachHang}`),

  /**
   * Nhân viên Sale tạo phiếu đăng ký lịch trả phòng.
   * @param {{ maKhachHang: string, maHopDong?: string, maPhieuDatCoc?: string, ngayDuKienTra: string }} data
   */
  saleDangKyLichTraPhong: (data) =>
    httpClient.post('/dang-ky-tra-phong/sale/dang-ky', data),
};
