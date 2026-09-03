import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getDanhSachChoHoanCoc(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachChoHoanCoc', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getDanhSachDaHoanCoc(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachDaHoanCoc', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getChiTietHoanCoc(db, maDoiSoat, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_ChiTietHoanCoc', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return {
    chiTiet: result.recordsets[0]?.[0] || null,
    danhSachPhong: result.recordsets[1] || []
  };
}

export async function xacNhanHoanCoc(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_XacNhanHoanCoc', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan || null },
    { name: 'PhuongThucThanhToan', type: sql.NVarChar(20), value: data.phuongThucThanhToan },
    { name: 'NgayThanhToan', type: sql.Date, value: data.ngayThanhToan },
    { name: 'ChungTuThanhToan', type: sql.VarChar(500), value: data.chungTuThanhToan || null }
  ]);

  return result.recordset[0] || null;
}
