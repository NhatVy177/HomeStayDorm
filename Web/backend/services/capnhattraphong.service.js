import sql from 'mssql';
import { getPool } from '../database/connection.js';

export const capNhatTraPhongService = {
  getDanhSachHoanTat: async (maNhanVien, status) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .input('TrangThaiLoc', sql.NVarChar(50), status)
      .execute('SP_TraPhong_QuanLy_DanhSachHoanTat');
    return result.recordset;
  },

  getChiTietHoanTat: async (maPhieuTra, maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .execute('SP_TraPhong_QuanLy_ChiTietHoanTat');

    return {
      chiTiet: result.recordsets[0]?.[0] || null,
      danhSachTaiSanBanGiao: result.recordsets[1] || []
    };
  },

  capNhatHoanTat: async (maPhieuTra, maNhanVien, jsonBanGiaoRa) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .input('JSONBanGiaoRa', sql.NVarChar(sql.MAX), jsonBanGiaoRa)
      .execute('SP_TraPhong_QuanLy_CapNhatHoanTat');
    return true;
  }
};
