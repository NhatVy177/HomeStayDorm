import sql from 'mssql';
import { getPool } from '../database/connection.js';
import { createServiceError } from './serviceErrors.js';

const TRANG_THAI_LOC_HOP_LE = new Set(['Tất cả', 'Chờ xử lý', 'Đã xử lý']);
const MUC_DO_HU_HONG = {
  'Hư hỏng nhẹ': { tyLe: 0.2, maQuyDinh: 'QD001' },
  'Hư hỏng nặng': { tyLe: 0.6, maQuyDinh: 'QD002' },
  'Mất mát': { tyLe: 1.0, maQuyDinh: 'QD003' }
};

function requireNhanVien(maNhanVien) {
  if (!maNhanVien) throw createServiceError('Thiếu thông tin nhân viên.', 401);
  return String(maNhanVien).trim();
}

function requireMaPhieuTra(maPhieuTra) {
  const value = String(maPhieuTra || '').trim();
  if (!value) throw createServiceError('Thiếu mã phiếu trả phòng.', 400);
  return value;
}

function normalizeTrangThaiLoc(trangThaiLoc = 'Chờ xử lý') {
  const value = String(trangThaiLoc || 'Chờ xử lý').trim();
  if (!TRANG_THAI_LOC_HOP_LE.has(value)) {
    throw createServiceError('Trạng thái lọc không hợp lệ.', 400);
  }
  return value;
}

function parseNgayKiemTra(ngayTraThucTe) {
  const value = String(ngayTraThucTe || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw createServiceError('Ngày trả thực tế không hợp lệ.', 400);

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    throw createServiceError('Ngày trả thực tế không hợp lệ.', 400);
  }

  return value;
}

function kiemTraTrangThaiChoXuLy(phieu) {
  if (!phieu) throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);
  const trangThai = phieu.trangThai || phieu.trangThaiPhieu;
  if (trangThai !== 'Chờ xử lý') {
    throw createServiceError('Phiếu trả phòng này đã thay đổi trạng thái hoặc đã được xử lý bởi nhân viên khác, vui lòng làm mới lại danh sách.', 400);
  }
}

function kiemTraHoSoHopDong(phieu) {
  if (!(phieu?.loaiNguon === 'HopDong' || phieu?.maHopDong)) {
    throw createServiceError('Phiếu trả phòng này không thuộc hồ sơ hợp đồng thuê.', 400);
  }
}

function kiemTraHoSoDatCoc(phieu) {
  if (phieu?.loaiNguon === 'HopDong' || phieu?.maHopDong) {
    throw createServiceError('Phiếu trả phòng này thuộc hợp đồng thuê, cần lập biên bản kiểm tra.', 400);
  }
}

function kiemTraThongTinBienBanHopLe(ngayTraThucTe, tinhTrangPhong, dsHuHong = []) {
  const ngayHopLe = parseNgayKiemTra(ngayTraThucTe);
  const tinhTrang = String(tinhTrangPhong || '').trim();
  if (!tinhTrang) throw createServiceError('Vui lòng nhập tình trạng phòng thực tế', 400);
  if (!Array.isArray(dsHuHong)) throw createServiceError('Danh sách hư hỏng không hợp lệ.', 400);

  dsHuHong.forEach((hh, index) => {
    if (!hh?.maTaiSan) throw createServiceError(`Thiếu mã tài sản tại dòng hư hỏng ${index + 1}.`, 400);
    if (!MUC_DO_HU_HONG[hh.mucDoHuHong]) throw createServiceError(`Mức độ hư hỏng tại dòng ${index + 1} không hợp lệ.`, 400);
    const soLuong = Number(hh.soLuong || 0);
    if (!Number.isInteger(soLuong) || soLuong <= 0) throw createServiceError(`Số lượng hư/mất tại dòng ${index + 1} không hợp lệ.`, 400);
    if (Number(hh.donGiaBoiThuong || 0) < 0) throw createServiceError(`Đơn giá bồi thường tại dòng ${index + 1} không hợp lệ.`, 400);
  });

  return { ngayHopLe, tinhTrang };
}

export const kiemTraTraPhongService = {
  quanLyDanhSachChoXuLy: async (maNhanVien, trangThaiLoc) => {
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const trangThaiHopLe = normalizeTrangThaiLoc(trangThaiLoc);
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .input('TrangThaiLoc', sql.NVarChar(50), trangThaiHopLe)
      .execute('SP_TraPhong_QuanLy_DanhSachChoXuLy');
    return result.recordset;
  },

  quanLyChiTietPhieu: async (maPhieuTra, maNhanVien) => {
    const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe)
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .execute('SP_TraPhong_QuanLy_ChiTietPhieu');
    
    // Result contains multiple recordsets
    const thongTinChung = result.recordsets[0]?.[0] || null;
    const nghiaVu = result.recordsets[1] || [];
    const taiSan = result.recordsets[2] || [];

    const data = {
      ...thongTinChung,
      nghiaVu,
      taiSan
    };
    if (!thongTinChung) throw createServiceError('Không tìm thấy phiếu trả phòng.', 404);
    return data;
  },

  quanLyXacNhanHuyCoc: async (maPhieuTra, maNhanVien) => {
    const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const phieu = await kiemTraTraPhongService.quanLyChiTietPhieu(maPhieuTraHopLe, maNhanVienHopLe);
    kiemTraTrangThaiChoXuLy(phieu);
    kiemTraHoSoDatCoc(phieu);

    const pool = await getPool();
    await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe)
      .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
      .execute('SP_TraPhong_QuanLy_XacNhanHuyCoc');
    return true;
  },

  quanLyLapBienBanKiemTra: async (maPhieuTra, maNhanVien, ngayTraThucTe, tinhTrangPhong, dsHuHong) => {
    const maPhieuTraHopLe = requireMaPhieuTra(maPhieuTra);
    const maNhanVienHopLe = requireNhanVien(maNhanVien);
    const { ngayHopLe, tinhTrang } = kiemTraThongTinBienBanHopLe(ngayTraThucTe, tinhTrangPhong, dsHuHong);
    const phieu = await kiemTraTraPhongService.quanLyChiTietPhieu(maPhieuTraHopLe, maNhanVienHopLe);
    kiemTraTrangThaiChoXuLy(phieu);
    kiemTraHoSoHopDong(phieu);

    let tongChiPhi = 0;
    const processedDsHuHong = (dsHuHong || []).map(hh => {
      const quyDinh = MUC_DO_HU_HONG[hh.mucDoHuHong];
      const soLuong = Number(hh.soLuong || 1);
      const donGia = Number(hh.donGiaBoiThuong || 0);
      const chiPhi = donGia * quyDinh.tyLe * soLuong;
      
      tongChiPhi += chiPhi;
      
      return {
        ...hh,
        soLuong,
        tyLeHuHong: quyDinh.tyLe,
        maQuyDinhTruTien: quyDinh.maQuyDinh,
        chiPhi
      };
    });

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const result = await transaction.request()
        .input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe)
        .input('MaNhanVien', sql.VarChar(6), maNhanVienHopLe)
        .input('NgayTraThucTe', sql.Date, ngayHopLe)
        .input('TinhTrangPhong', sql.NVarChar(sql.MAX), tinhTrang)
        .input('TongChiPhi', sql.Decimal(15,2), tongChiPhi)
        .output('MaBienBanKT', sql.VarChar(6))
        .execute('SP_TraPhong_QuanLy_LapBienBanKiemTra');

      const maBienBanKT = result.output.MaBienBanKT;

      if (processedDsHuHong.length > 0) {
        for (const hh of processedDsHuHong) {
          await transaction.request()
            .input('MaBienBanKT', sql.VarChar(6), maBienBanKT)
            .input('MaPhieuTra', sql.VarChar(6), maPhieuTraHopLe)
            .input('MaTaiSan', sql.VarChar(6), hh.maTaiSan)
            .input('MoTaHuHong', sql.NVarChar(sql.MAX), hh.moTa || '')
            .input('ChiPhiSuaChua', sql.Decimal(15,2), hh.chiPhi || 0)
            .input('SoLuong', sql.Int, hh.soLuong || 1)
            .input('MucDoHuHong', sql.NVarChar(100), hh.mucDoHuHong || '')
            .input('TyLeHuHong', sql.Decimal(5,2), hh.tyLeHuHong || 0)
            .input('MaQuyDinhTruTien', sql.VarChar(6), hh.maQuyDinhTruTien || null)
            .execute('SP_TraPhong_QuanLy_ThemChiTietHuHong');
        }
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};
