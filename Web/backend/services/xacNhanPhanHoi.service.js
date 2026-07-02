import sql from 'mssql';
import { getPool } from '../database/connection.js';
import * as doiSoatRepository from '../repositories/doiSoat.repository.js';

const xacNhanPhanHoiService = {
  getDanhSachChoXuLyPhanHoi: async (maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .execute('SP_TraPhong_QuanLy_DanhSachChoXuLyPhanHoi');
    return result.recordset;
  },

  getChiTietPhanHoi: async (maDoiSoat, maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDoiSoat', sql.VarChar(6), maDoiSoat)
      .input('MaNhanVien', sql.VarChar(6), maNhanVien)
      .execute('SP_TraPhong_QuanLy_ChiTietPhanHoi');
    const chiTiet = result.recordsets[0]?.[0] || null;
    let chiTietKhauTru = null;
    if (chiTiet) {
      chiTietKhauTru = await doiSoatRepository.getChiTietKhauTru(pool, chiTiet.maPhieuTra, chiTiet.maHopDong);
    }

    return {
      chiTiet,
      danhSachPhong: result.recordsets[1] || [],
      chiTietKhauTru
    };
  },

  xuLyPhanHoi: async ({ maDoiSoat, hanhDong }, maNhanVien) => {
    const pool = await getPool();
    const result = await pool.request()
      .input('MaDoiSoat',    sql.VarChar(6),     maDoiSoat)
      .input('MaNhanVien',   sql.VarChar(6),     maNhanVien)
      .input('HanhDong',     sql.NVarChar(30),   hanhDong)
      .execute('SP_TraPhong_QuanLy_XuLyPhanHoiDoiSoat');
    return result.recordset[0];
  }
};

export default xacNhanPhanHoiService;
