import { sql, getPool } from '../database/connection.js';
import * as khauTruDoiSoatRepository from '../repositories/khauTruDoiSoat.repository.js';
import { createServiceError } from './serviceErrors.js';

const HANH_DONG_PHAN_HOI = new Set(['XacNhanDieuChinh', 'GiuNguyen']);

function requireNhanVien(maNhanVien) {
  if (!maNhanVien) throw createServiceError('Thiếu thông tin nhân viên.', 401);
  return String(maNhanVien).trim();
}

function requireMaDoiSoat(maDoiSoat) {
  const value = String(maDoiSoat || '').trim();
  if (!value) throw createServiceError('Thiếu mã đối soát.', 400);
  return value;
}

function requireHanhDong(hanhDong) {
  const value = String(hanhDong || '').trim();
  if (!HANH_DONG_PHAN_HOI.has(value)) {
    throw createServiceError('Hành động xử lý phản hồi không hợp lệ.', 400);
  }
  return value;
}

function kiemTraTrangThaiChoPhanHoi(doiSoat) {
  if (!doiSoat) throw createServiceError('Không tìm thấy phiếu đối soát.', 404);
  if (doiSoat.trangThaiDoiSoat !== 'Chờ phản hồi') {
    throw createServiceError('Phiếu đối soát này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác. Vui lòng làm mới danh sách.', 400);
  }
}

export function xacDinhTrangThaiSauKhiGiuNguyen(doiSoat) {
  const soTienHoan = Number(doiSoat?.soTienHoanThucTe || 0);
  const soTienThuThem = Number(doiSoat?.soTienKhachPhaiTT || 0);
  if (soTienHoan > 0) return 'Chờ hoàn cọc';
  if (soTienThuThem > 0) return 'Chờ thanh toán thêm';
  return 'Đã quyết toán';
}

const xacNhanPhanHoiService = {
  getDanhSachChoXuLyPhanHoi: async (maNhanVien) => {
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .execute('SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi');
    return result.recordset;
  },

  getChiTietPhanHoi: async (maDoiSoat, maNhanVien) => {
    const maDoiSoatHopLe = requireMaDoiSoat(maDoiSoat);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDoiSoat', sql.VarChar(6), maDoiSoatHopLe)
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .execute('SP_TraPhong_QuanLy_ChiTietPhanHoi');
    const chiTiet = result.recordsets[0]?.[0] || null;
    let chiTietKhauTru = null;
    if (chiTiet) {
      chiTietKhauTru = await khauTruDoiSoatRepository.getChiTietKhauTru(pool, chiTiet.maPhieuTra, chiTiet.maHopDong);
      if (result.recordsets.length > 2) {
        chiTietKhauTru = {
          ...chiTietKhauTru,
          chiTietHuHong: result.recordsets[2] || []
        };
      }
    }

    return {
      chiTiet,
      danhSachPhong: result.recordsets[1] || [],
      chiTietKhauTru
    };
  },

  xuLyPhanHoi: async ({ maDoiSoat, hanhDong }, maNhanVien) => {
    const maDoiSoatHopLe = requireMaDoiSoat(maDoiSoat);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const hanhDongHopLe = requireHanhDong(hanhDong);
    const { chiTiet } = await xacNhanPhanHoiService.getChiTietPhanHoi(maDoiSoatHopLe, maNhanVienHopLe);
    kiemTraTrangThaiChoPhanHoi(chiTiet);

    if (hanhDongHopLe === 'GiuNguyen') {
      xacDinhTrangThaiSauKhiGiuNguyen(chiTiet);
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('MaDoiSoat',    sql.VarChar(6),     maDoiSoatHopLe)
      .input('MaNhanVien',   sql.VarChar(6),     maNhanVienHopLe)
      .input('HanhDong',     sql.NVarChar(30),   hanhDongHopLe)
      .execute('SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat');
    return result.recordset[0];
  }
};

export default xacNhanPhanHoiService;
