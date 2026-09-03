import { sql, getPool } from '../database/connection.js';
import { createServiceError } from './serviceErrors.js';

function requireNhanVien(maNhanVien) {
  if (!maNhanVien) throw createServiceError('Thiếu thông tin nhân viên.', 401);
  return String(maNhanVien).trim();
}

function requireMaPhieuTra(maPhieuTra) {
  const value = String(maPhieuTra || '').trim();
  if (!value) throw createServiceError('Thiếu mã phiếu trả phòng.', 400);
  return value;
}

function kiemTraTrangThaiHopLeChoThanhLy(chiTiet) {
  if (!chiTiet) throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);

  const trangThaiPhieu = chiTiet.trangThaiPhieuTra || chiTiet.trangThai;
  if (trangThaiPhieu !== 'Chờ ký biên bản') {
    throw createServiceError('Phiếu trả phòng không còn ở trạng thái Chờ ký biên bản.', 400);
  }

  const hasHopDong = Boolean(chiTiet.hasHopDong ?? chiTiet.maHopDong);
  const trangThaiDoiSoat = chiTiet.trangThaiDoiSoat;
  if (hasHopDong && !['Đã quyết toán', 'Chờ hoàn cọc'].includes(trangThaiDoiSoat)) {
    throw createServiceError('Phiếu đối soát không đủ điều kiện thanh lý hồ sơ.', 400);
  }
  if (!hasHopDong && trangThaiDoiSoat !== 'Chờ hoàn cọc') {
    throw createServiceError('Phiếu đặt cọc chưa đủ điều kiện thanh lý hồ sơ.', 400);
  }

  if (hasHopDong && chiTiet.trangThaiHopDong === 'Đã thanh lý') {
    throw createServiceError('Hợp đồng thuê đã được thanh lý trước đó.', 400);
  }
}

const thanhLyTraPhongService = {
  getDanhSachThanhLy: async (maNhanVien) => {
    try {
      const maNhanVienHopLe = requireNhanVien(maNhanVien);
      const pool = await getPool();
      const result = await pool.request()
        .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
        .execute('SP_TraPhong_QuanLy_DanhSachThanhLy');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  },

  getChiTietThanhLy: async (maPhieuTra, maNhanVien) => {
    try {
      const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
      const maNhanVienHopLe = requireNhanVien(maNhanVien);
      const pool = await getPool();
      const request = pool.request();
      request.input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe);
      request.input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe);
      const result = await request.execute('SP_TraPhong_QuanLy_ChiTietThanhLy');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  },

  xacNhanThanhLy: async (maPhieuTra, maNhanVien) => {
    try {
      const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
      const maNhanVienHopLe = requireNhanVien(maNhanVien);
      const chiTiet = await thanhLyTraPhongService.getChiTietThanhLy(maPhieuTraHopLe, maNhanVienHopLe);
      kiemTraTrangThaiHopLeChoThanhLy(chiTiet);

      const pool = await getPool();
      const request = pool.request();
      request.input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe);
      request.input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe);
      const result = await request.execute('SP_TraPhong_QuanLy_XacNhanThanhLy');
      return result.recordset?.[0] || null;
    } catch (err) {
      throw err;
    }
  }
};

export default thanhLyTraPhongService;
