export const LOAI_HO_SO_TRA_PHONG = {
  HOP_DONG_THUE: 'HOP_DONG_THUE',
  DAT_COC_CHUA_KY_HOP_DONG: 'DAT_COC_CHUA_KY_HOP_DONG'
};

export function safeNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0;
  }
  return Number(value);
}

export function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function roundMoney(value) {
  return Math.round(value);
}

export function calculateStayMonths(startDate, returnDate) {
  let months =
    (returnDate.getFullYear() - startDate.getFullYear()) * 12 +
    (returnDate.getMonth() - startDate.getMonth());

  if (returnDate.getDate() > startDate.getDate()) {
    months += 1;
  }

  return months <= 0 ? 1 : months;
}

export function calculateDoiSoatTraPhong(input) {
  const tienCocBanDau = safeNumber(input.tienCocBanDau);
  const tienThueConNo = safeNumber(input.tienThueConNo);
  const tienDichVuConNo = safeNumber(input.tienDichVuConNo);
  const tongChiPhiSuaChua = safeNumber(input.tongChiPhiSuaChua);
  const tienPhat = safeNumber(input.tienPhat);

  if (
    tienCocBanDau < 0 ||
    tienThueConNo < 0 ||
    tienDichVuConNo < 0 ||
    tongChiPhiSuaChua < 0 ||
    tienPhat < 0
  ) {
    throw new Error('Các khoản tiền không được âm.');
  }

  let soThangLuuTru = 0;
  let tyLeHoanCocHienTai = 0;

  if (input.loaiHoSo === LOAI_HO_SO_TRA_PHONG.DAT_COC_CHUA_KY_HOP_DONG) {
    tyLeHoanCocHienTai = 80;
  } else {
    const ngayBatDau = toDate(input.ngayBatDau);
    const ngayKetThuc = toDate(input.ngayKetThuc);
    const ngayTraThucTe = toDate(input.ngayTraThucTe);

    if (!ngayBatDau || !ngayKetThuc || !ngayTraThucTe) {
      throw new Error('Thiếu ngày bắt đầu, ngày kết thúc hoặc ngày trả thực tế.');
    }

    soThangLuuTru = calculateStayMonths(ngayBatDau, ngayTraThucTe);

    if (ngayTraThucTe >= ngayKetThuc) {
      tyLeHoanCocHienTai = 100;
    } else if (soThangLuuTru < 6) {
      tyLeHoanCocHienTai = 50;
    } else {
      tyLeHoanCocHienTai = 70;
    }
  }

  const tienCocDuocHoan = roundMoney(tienCocBanDau * tyLeHoanCocHienTai / 100);
  const tongKhauTru = roundMoney(
    tienThueConNo +
    tienDichVuConNo +
    tongChiPhiSuaChua +
    tienPhat
  );
  const chenhLech = tienCocDuocHoan - tongKhauTru;

  let soTienHoanThucTe = 0;
  let soTienKhachPhaiTT = 0;

  if (chenhLech > 0) {
    soTienHoanThucTe = chenhLech;
  } else if (chenhLech < 0) {
    soTienKhachPhaiTT = Math.abs(chenhLech);
  }

  return {
    soThangLuuTru,
    tyLeHoanCocHienTai,
    tienCocDuocHoan,
    tienThueConNo,
    tienDichVuConNo,
    tongChiPhiSuaChua,
    tienPhat,
    tongKhauTru,
    soTienHoanThucTe,
    soTienKhachPhaiTT
  };
}
