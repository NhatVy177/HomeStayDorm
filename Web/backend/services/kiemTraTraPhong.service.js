import sql from 'mssql';
import { getPool } from '../database/connection.js';

export const kiemTraTraPhongService = {
  quanLyDanhSachChoXuLy: async (maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
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
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .input('NgayTraThucTe', sql.Date, ngayTraThucTe)
      .input('TinhTrangPhong', sql.NVarChar(sql.MAX), tinhTrangPhong)
      .input('JSONHuHong', sql.NVarChar(sql.MAX), JSON.stringify(dsHuHong || []))
      .execute('SP_TraPhong_QuanLy_LapBienBanKiemTra');
    return true;
  }
};
