import sql from 'mssql';
import { getPool } from '../database/connection.js';

const thanhLyTraPhongService = {
  getDanhSachThanhLy: async (maNhanVien) => {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('MaNhanVien', sql.VarChar(6), maNhanVien)
        .execute('SP_TraPhong_QuanLy_DanhSachThanhLy');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  },

  getChiTietThanhLy: async (maPhieuTra, maNhanVien) => {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('MaPhieuTra', sql.VarChar(6), maPhieuTra);
      request.input('MaNhanVien', sql.VarChar(6), maNhanVien);
      const result = await request.execute('SP_TraPhong_QuanLy_ChiTietThanhLy');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  },

  xacNhanThanhLy: async (maPhieuTra, maNhanVien) => {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('MaPhieuTra', sql.VarChar(6), maPhieuTra);
      request.input('MaNhanVien', sql.VarChar(6), maNhanVien);
      const result = await request.execute('SP_TraPhong_QuanLy_XacNhanThanhLy');
      return result.recordset?.[0] || null;
    } catch (err) {
      throw err;
    }
  }
};

export default thanhLyTraPhongService;
