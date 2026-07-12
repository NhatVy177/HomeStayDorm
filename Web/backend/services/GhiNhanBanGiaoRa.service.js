import sql from 'mssql';
import { getPool } from '../database/connection.js';

export const banGiaoRaService = {
  getDanhSachBanGiaoRa: async (maNhanVien, status) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .input('TrangThaiLoc', sql.NVarChar(50), status)
      .execute('SP_TraPhong_QuanLy_DanhSachBanGiaoRa');
    return result.recordset;
  },

  getChiTietBanGiaoRa: async (maPhieuTra, maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .execute('SP_TraPhong_QuanLy_ChiTietBanGiaoRa');

    return {
      chiTiet: result.recordsets[0]?.[0] || null,
      danhSachThanhVien: result.recordsets[1] || [],
      danhSachTaiSanBanGiao: result.recordsets[2] || [],
      ketQuaKiemTra: result.recordsets[3] || []
    };
  },

  ghiNhanBanGiaoRa: async (maPhieuTra, maNhanVien, jsonBanGiaoRa) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .input('JSONBanGiaoRa', sql.NVarChar(sql.MAX), jsonBanGiaoRa)
      .execute('SP_TraPhong_QuanLy_GhiNhanBanGiaoRa');
    return result.recordset?.[0] || null;
  }
};
