export const STATUS_LABEL = {
  CHO_SALE_XU_LY: 'Chờ sale xử lý',
  PHU_HOP: 'Phù hợp',
  KHONG_PHU_HOP: 'Không phù hợp',
  CHO_BO_SUNG: 'Chờ bổ sung',

  DA_LEN_LICH: 'Đã lên lịch',
  CHO_DIEU_CHINH: 'Chờ điều chỉnh',
  DA_DOI_LICH: 'Đã đổi lịch',
  DA_HUY: 'Đã hủy',

  CHO_XAC_NHAN_NHAN_COC: 'Chờ xác nhận nhận cọc',
  TU_CHOI_NHAN_COC: 'Từ chối nhận cọc',
  CHO_THANH_TOAN: 'Chờ thanh toán',
  CHO_XAC_NHAN_THANH_TOAN: 'Chờ xác nhận thanh toán',
  DA_THANH_TOAN: 'Đã thanh toán',
  QUA_HAN: 'Quá hạn',

  CHO_TIEP_NHAN: 'Chờ tiếp nhận',
  DANG_XU_LY: 'Đang xử lý',
  HOAN_TAT: 'Hoàn tất',
  TU_CHOI: 'Từ chối'
};

export function getStatusLabel(status) {
  return STATUS_LABEL[status] || status || 'Không rõ';
}
