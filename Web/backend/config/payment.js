const DEFAULT_PAYMENT_ACCOUNT = {
  nganHang: 'Vietcombank',
  soTaiKhoan: '1234567890',
  chuTaiKhoan: 'CONG TY HOMESTAY DORM'
};

export function getPaymentAccount() {
  return {
    nganHang: process.env.BANK_NAME || DEFAULT_PAYMENT_ACCOUNT.nganHang,
    soTaiKhoan: process.env.BANK_ACCOUNT_NUMBER || DEFAULT_PAYMENT_ACCOUNT.soTaiKhoan,
    chuTaiKhoan: process.env.BANK_ACCOUNT_HOLDER || DEFAULT_PAYMENT_ACCOUNT.chuTaiKhoan
  };
}

export function attachPaymentAccount(rows = []) {
  const taiKhoanThanhToan = getPaymentAccount();
  return rows.map((row) => ({
    ...row,
    taiKhoanThanhToan
  }));
}
