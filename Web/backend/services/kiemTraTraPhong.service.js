import sql from 'mssql';
import { getPool } from '../database/connection.js';

export const kiemTraTraPhongService = {
  quanLyDanhSachChoXuLy: async (maNhanVien, trangThaiLoc) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .input('TrangThaiLoc', sql.NVarChar(50), trangThaiLoc)
      .execute('SP_TraPhong_QuanLy_DanhSachChoXuLy');
    return result.recordset;
  },

  quanLyChiTietPhieu: async (maPhieuTra, maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .execute('SP_TraPhong_QuanLy_ChiTietPhieu');
    
    // Result contains multiple recordsets
    const thongTinChung = result.recordsets[0]?.[0] || null;
    const nghiaVu = result.recordsets[1] || [];
    const taiSan = result.recordsets[2] || [];

    return {
      ...thongTinChung,
      nghiaVu,
      taiSan
    };
  },

  quanLyXacNhanHuyCoc: async (maPhieuTra, maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .execute('SP_TraPhong_QuanLy_XacNhanHuyCoc');
    return true;
  },

  quanLyLapBienBanKiemTra: async (maPhieuTra, maNhanVien, ngayTraThucTe, tinhTrangPhong, dsHuHong) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const tongChiPhi = dsHuHong ? dsHuHong.reduce((sum, item) => sum + (Number(item.chiPhi) || 0), 0) : 0;

      const result = await transaction.request()
        .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
        .input('MaNhanVien', sql.VarChar(6), maNhanVien)
        .input('NgayTraThucTe', sql.Date, ngayTraThucTe)
        .input('TinhTrangPhong', sql.NVarChar(sql.MAX), tinhTrangPhong)
        .input('TongChiPhi', sql.Decimal(15,2), tongChiPhi)
        .output('MaBienBanKT', sql.VarChar(6))
        .execute('SP_TraPhong_QuanLy_LapBienBanKiemTra');

      const maBienBanKT = result.output.MaBienBanKT;

      if (dsHuHong && dsHuHong.length > 0) {
        for (const hh of dsHuHong) {
          await transaction.request()
            .input('MaBienBanKT', sql.VarChar(6), maBienBanKT)
            .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
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
