import sql from 'mssql';
import { getPool } from '../database/connection.js';

const xacNhanKetQuaService = {
  getDanhSachChoXacNhan: async (maNhanVien) => {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('MaNhanVien', sql.VarChar(6), maNhanVien)
        .execute('SP_TraPhong_QuanLy_DanhSachDoiSoat');
      return result.recordset;
    } catch (err) {
      throw err;
    }
  },

  getChiTietDoiSoat: async (maDoiSoat, maNhanVien) => {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('MaDoiSoat', sql.VarChar(6), maDoiSoat);
      request.input('MaNhanVien', sql.VarChar(6), maNhanVien);
      const result = await request.execute('SP_TraPhong_QuanLy_ChiTietDoiSoat');
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  },

  xacNhanDoiSoat: async (data, maNhanVien = 'NV0001') => {
    try {
      const pool = await getPool();
      const request = pool.request();
      request.input('MaDoiSoat', sql.VarChar(6), data.maDoiSoat);
      request.input('MaNhanVien', sql.VarChar(6), maNhanVien);
      request.input('DongY', sql.Bit, data.dongY);
      request.input('PhuongThucThanhToan', sql.NVarChar(20), data.phuongThucThanhToan || null);
      request.input('LyDoKhongDongY', sql.NVarChar(500), data.lyDoKhongDongY || null);
      
      const result = await request.execute('SP_TraPhong_QuanLy_XacNhanDoiSoat');
      return result;
    } catch (err) {
      throw err;
    }
  }
};

export default xacNhanKetQuaService;
