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
};
