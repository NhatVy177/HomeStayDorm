import { createServiceError } from './serviceErrors.js';
import * as phieuTraPhongRepository from '../repositories/phieuTraPhong.repository.js';

export const TRANG_THAI_CHO_DOI_SOAT = 'Chờ đối soát';

export async function layThongTinPhieuTra(maPhieuTra, maNhanVienKeToan, db) {
  const phieuTraPhong = await phieuTraPhongRepository.getPhieuTraPhongById(
    db,
    maPhieuTra,
    maNhanVienKeToan
  );

  if (!phieuTraPhong) {
    throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);
  }

  return phieuTraPhong;
}

export async function layThongTinPhieuTraKhoaDong(maPhieuTra, maNhanVienKeToan, db) {
  const phieuTraPhong = await phieuTraPhongRepository.getPhieuTraPhongByIdForUpdate(
    db,
    maPhieuTra,
    maNhanVienKeToan
  );

  if (!phieuTraPhong) {
    throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);
  }

  return phieuTraPhong;
}

export function kiemTraPhieuTraDuDieuKienLapDoiSoat(phieuTraPhong) {
  if (phieuTraPhong.trangThai !== TRANG_THAI_CHO_DOI_SOAT) {
    throw createServiceError(
      'Phiếu trả phòng chưa được quản lý xử lý nên chưa thể lập đối soát.',
      409
    );
  }
}

