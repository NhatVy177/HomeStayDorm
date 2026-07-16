import sql from 'mssql';
import { getPool } from '../database/connection.js';
import { createServiceError } from './serviceErrors.js';

const TRANG_THAI_BAN_GIAO = new Set(['Tất cả', 'Chờ bàn giao', 'Đã bàn giao']);

function requireNhanVien(maNhanVien) {
  if (!maNhanVien) throw createServiceError('Thiếu thông tin nhân viên.', 401);
  return String(maNhanVien).trim();
}

function requireMaPhieuTra(maPhieuTra) {
  const value = String(maPhieuTra || '').trim();
  if (!value) throw createServiceError('Thiếu mã phiếu trả.', 400);
  return value;
}

function normalizeStatus(status = 'Chờ bàn giao') {
  const value = String(status || 'Chờ bàn giao').trim();
  if (!TRANG_THAI_BAN_GIAO.has(value)) {
    throw createServiceError('Trạng thái lọc bàn giao ra không hợp lệ.', 400);
  }
  return value;
}

function parseDanhSachBanGiao(jsonBanGiaoRa) {
  if (!jsonBanGiaoRa) return [];
  try {
    const data = typeof jsonBanGiaoRa === 'string' ? JSON.parse(jsonBanGiaoRa) : jsonBanGiaoRa;
    if (!Array.isArray(data)) throw new Error('Danh sách bàn giao không phải mảng');
    return data;
  } catch {
    throw createServiceError('Danh sách bàn giao ra không hợp lệ.', 400);
  }
}

function kiemTraThongTinBanGiaoHopLe(danhSachBanGiao) {
  if (!Array.isArray(danhSachBanGiao)) throw createServiceError('Danh sách bàn giao ra không hợp lệ.', 400);
  danhSachBanGiao.forEach((item, index) => {
    if (!item?.maTaiSan) throw createServiceError(`Thiếu mã tài sản tại dòng bàn giao ${index + 1}.`, 400);
    const soLuongThuHoi = Number(item.soLuongThuHoi);
    if (!Number.isInteger(soLuongThuHoi) || soLuongThuHoi < 0) {
      throw createServiceError(`Số lượng thu hồi tại dòng ${index + 1} không hợp lệ.`, 400);
    }
    const soLuongBanGiao = item.soLuongBanGiaoVao ?? item.soLuongBanGiao;
    if (soLuongBanGiao != null && soLuongThuHoi > Number(soLuongBanGiao)) {
      throw createServiceError(`Số lượng thu hồi tại dòng ${index + 1} vượt quá số lượng đã bàn giao.`, 400);
    }
  });
}

function kiemTraDuDieuKienBanGiaoRa(data) {
  const chiTiet = data?.chiTiet;
  if (!chiTiet) throw createServiceError('Không tìm thấy hồ sơ bàn giao ra.', 404);
  if (chiTiet.hasHopDong === false || (!chiTiet.hasHopDong && !chiTiet.maHopDong)) {
    throw createServiceError('Chức năng bàn giao ra chỉ áp dụng cho hồ sơ có hợp đồng thuê.', 400);
  }
  if (chiTiet.trangThaiBanGiao && chiTiet.trangThaiBanGiao !== 'Chờ bàn giao') {
    throw createServiceError('Hồ sơ này đã được ghi nhận bàn giao ra trước đó.', 400);
  }
  if (chiTiet.trangThaiPhieuTra && chiTiet.trangThaiPhieuTra !== 'Hoàn tất') {
    throw createServiceError('Phiếu trả phòng chưa đủ điều kiện ghi nhận bàn giao ra.', 400);
  }
  if (chiTiet.trangThaiHopDong && chiTiet.trangThaiHopDong !== 'Đã thanh lý') {
    throw createServiceError('Hợp đồng thuê chưa được thanh lý.', 400);
  }
  if (chiTiet.trangThaiDoiSoat && chiTiet.trangThaiDoiSoat !== 'Đã quyết toán') {
    throw createServiceError('Phiếu đối soát chưa hoàn tất xử lý tiền.', 400);
  }
}

export const banGiaoRaService = {
  getDanhSachBanGiaoRa: async (maNhanVien, status) => {
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const statusHopLe = normalizeStatus(status);
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .input('TrangThaiLoc', sql.NVarChar(50), statusHopLe)
      .execute('SP_TraPhong_QuanLy_DanhSachBanGiaoRa');
    return result.recordset;
  },

  getChiTietBanGiaoRa: async (maPhieuTra, maNhanVien) => {
    const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe)
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .execute('SP_TraPhong_QuanLy_ChiTietBanGiaoRa');

    return {
      chiTiet: result.recordsets[0]?.[0] || null,
      danhSachThanhVien: result.recordsets[1] || [],
      danhSachTaiSanBanGiao: result.recordsets[2] || [],
      ketQuaKiemTra: result.recordsets[3] || []
    };
  },

  ghiNhanBanGiaoRa: async (maPhieuTra, maNhanVien, jsonBanGiaoRa) => {
    const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const danhSachBanGiao = parseDanhSachBanGiao(jsonBanGiaoRa);
    kiemTraThongTinBanGiaoHopLe(danhSachBanGiao);
    const chiTietBanGiaoRa = await banGiaoRaService.getChiTietBanGiaoRa(maPhieuTraHopLe, maNhanVienHopLe);
    kiemTraDuDieuKienBanGiaoRa(chiTietBanGiaoRa);

    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe)
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .input('JSONBanGiaoRa', sql.NVarChar(sql.MAX), danhSachBanGiao.length > 0 ? JSON.stringify(danhSachBanGiao) : null)
      .execute('SP_TraPhong_QuanLy_GhiNhanBanGiaoRa');
    return result.recordset?.[0] || null;
  }
};
