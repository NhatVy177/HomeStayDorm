import { httpClient } from '../../api/httpClient.js';

export const traPhongApi = {
  // ─── Cũ ───────────────────────────────────────────────────────────────────
  dangKyLichTraPhong: (data) => httpClient.post('/tra-phong/lich-tra-phong', data),
  lapBienBanKiemTra:  (data) => httpClient.post('/tra-phong/bien-ban-kiem-tra', data),
  xuLyQuyetToan:      (data) => httpClient.post('/tra-phong/quyet-toan', data),
  thanhLyHopDong:     (data) => httpClient.put('/tra-phong/thanh-ly-hop-dong', data),

  // ─── Yêu cầu trả phòng (khách hàng) ──────────────────────────────────────
  /** Lấy danh sách hợp đồng + phiếu cọc hợp lệ */
  layDanhSachHopDong: () => httpClient.get('/tra-phong/yeu-cau/hop-dong'),
  /** Lấy lịch sử phiếu trả phòng */
  layLichSu: () => httpClient.get('/tra-phong/yeu-cau/lich-su'),
  /**
   * Gửi yêu cầu trả phòng mới
   * @param {{ maHopDong?: string, maPhieuDatCoc?: string, ngayDuKienTra: string }} data
   */
  taoYeuCau: (data) => httpClient.post('/tra-phong/yeu-cau', data),

  // ─── Nhân viên Sale – Đăng ký lịch trả phòng ─────────────────────────────
  /**
   * Tìm kiếm khách hàng theo tên / SĐT / CCCD
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

  /**
   * Lấy danh sách phiếu trả phòng (nhân viên Sale)
   * @param {{ trangThai?: string, tuKhoa?: string }} params
   */
  saleDanhSachPhieu: (params = {}) =>
    httpClient.get('/dang-ky-tra-phong/sale/danh-sach', { params }),
};
