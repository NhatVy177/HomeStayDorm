import { createServiceError } from './serviceErrors.js';
import { safeNumber } from './doiSoatCalculator.service.js';
import * as khauTruDoiSoatRepository from '../repositories/khauTruDoiSoat.repository.js';

export async function tinhTienHoaDonConNo(maHopDong, db) {
  if (!maHopDong) {
    return {
      tienThueConNo: 0,
      tienDichVuConNo: 0
    };
  }

  return khauTruDoiSoatRepository.getTienHoaDonConNo(db, maHopDong);
}

export async function tinhTongChiPhiSuaChua(maPhieuTra, db) {
  return khauTruDoiSoatRepository.getTongChiPhiSuaChua(db, maPhieuTra);
}

export async function tinhTongTienPhat(maHopDong, db) {
  if (!maHopDong) return 0;
  return khauTruDoiSoatRepository.getTienPhatChoXuLy(db, maHopDong);
}

export async function layCacKhoanKhauTru(maPhieuTra, maHopDong, db) {
  const suaChua = await tinhTongChiPhiSuaChua(maPhieuTra, db);
  const tienHoaDonConNo = await tinhTienHoaDonConNo(maHopDong, db);
  const tienPhat = await tinhTongTienPhat(maHopDong, db);
  const chiTietKhauTru = await khauTruDoiSoatRepository.getChiTietKhauTru(db, maPhieuTra, maHopDong);

  return {
    defaults: {
      tienThueConNo: tienHoaDonConNo.tienThueConNo || 0,
      tienDichVuConNo: tienHoaDonConNo.tienDichVuConNo || 0,
      tongChiPhiSuaChua: suaChua.tongChiPhiSuaChua || 0,
      tienPhat
    },
    soBienBanKiemTra: suaChua.soBienBanKiemTra || 0,
    chiTietKhauTru
  };
}

export function kiemTraDaCoBienBanKiemTra(khauTru) {
  if (safeNumber(khauTru?.soBienBanKiemTra) <= 0) {
    throw createServiceError('Phiếu trả phòng chưa có biên bản kiểm tra phòng.', 400);
  }
}
