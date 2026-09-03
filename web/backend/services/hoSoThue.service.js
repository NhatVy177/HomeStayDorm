import { createServiceError } from './serviceErrors.js';
import { LOAI_HO_SO_TRA_PHONG, safeNumber } from './doiSoatCalculator.service.js';
import * as hopDongThueRepository from '../repositories/hopDongThue.repository.js';
import * as phieuDatCocRepository from '../repositories/phieuDatCoc.repository.js';
import * as phongGiuongRepository from '../repositories/phongGiuong.repository.js';

export function xacDinhLoaiHoSo(phieuTraPhong) {
  if (phieuTraPhong.maHopDong) {
    return LOAI_HO_SO_TRA_PHONG.HOP_DONG_THUE;
  }

  if (phieuTraPhong.maPhieuDatCoc) {
    return LOAI_HO_SO_TRA_PHONG.DAT_COC_CHUA_KY_HOP_DONG;
  }

  throw createServiceError('Phiếu trả phòng thiếu thông tin hợp đồng hoặc phiếu đặt cọc.', 400);
}

export async function layThongTinHopDong(maHopDong, db) {
  const hopDong = await hopDongThueRepository.getHopDongHoSo(db, maHopDong);

  if (!hopDong) {
    throw createServiceError('Không tìm thấy hợp đồng thuê hợp lệ cho phiếu trả phòng.', 400);
  }

  return hopDong;
}

export async function layThongTinPhieuDatCoc(maPhieuDatCoc, db) {
  const phieuDatCoc = await phieuDatCocRepository.getPhieuDatCocHoSo(db, maPhieuDatCoc);

  if (!phieuDatCoc) {
    throw createServiceError('Không tìm thấy phiếu đặt cọc cho phiếu trả phòng.', 400);
  }

  if (phieuDatCoc.trangThaiThanhToan !== 'Đã TT' || phieuDatCoc.trangThaiCoc !== 'Hiệu lực') {
    throw createServiceError('Phiếu đặt cọc chưa đủ điều kiện đối soát.', 400);
  }

  return phieuDatCoc;
}

export async function layPhongGiuongTheoHoSo(context, db) {
  const maPhieuCoc = context.hopDong?.maPhieuCoc || context.phieuDatCoc?.maPhieuDatCoc;
  if (!maPhieuCoc) return [];

  return phongGiuongRepository.getPhongTrongPhieuCoc(db, maPhieuCoc);
}

export async function layThongTinHoSo(phieuTraPhong, db) {
  const loaiHoSo = xacDinhLoaiHoSo(phieuTraPhong);

  if (loaiHoSo === LOAI_HO_SO_TRA_PHONG.HOP_DONG_THUE) {
    const hopDong = await layThongTinHopDong(phieuTraPhong.maHopDong, db);

    if (!phieuTraPhong.ngayTraThucTe) {
      throw createServiceError('Ngày trả thực tế chưa có dữ liệu để tính thời gian lưu trú.', 400);
    }

    const context = {
      loaiHoSo,
      hopDong,
      phieuDatCoc: null,
      danhSachPhong: [],
      defaults: {
        tienThueConNo: 0,
        tienDichVuConNo: 0,
        tongChiPhiSuaChua: 0,
        tienPhat: 0
      },
      tienCocBanDau: safeNumber(hopDong.soTienCoc),
      ngayBatDau: hopDong.ngayBatDau,
      ngayKetThuc: hopDong.ngayKetThuc,
      ngayTraThucTe: phieuTraPhong.ngayTraThucTe
    };

    return {
      ...context,
      danhSachPhong: await layPhongGiuongTheoHoSo(context, db)
    };
  }

  const phieuDatCoc = await layThongTinPhieuDatCoc(phieuTraPhong.maPhieuDatCoc, db);
  const context = {
    loaiHoSo,
    hopDong: null,
    phieuDatCoc,
    danhSachPhong: [],
    defaults: {
      tienThueConNo: 0,
      tienDichVuConNo: 0,
      tongChiPhiSuaChua: 0,
      tienPhat: 0
    },
    tienCocBanDau: safeNumber(phieuDatCoc.soTienCoc),
    ngayBatDau: null,
    ngayKetThuc: null,
    ngayTraThucTe: phieuTraPhong.ngayTraThucTe
  };

  return {
    ...context,
    danhSachPhong: await layPhongGiuongTheoHoSo(context, db)
  };
}

