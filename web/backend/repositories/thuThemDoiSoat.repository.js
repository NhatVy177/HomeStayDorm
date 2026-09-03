import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getDanhSachChoThuThem(db, maNhanVienKeToan, boLocThuThem = 'all') {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachChoThuThem', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null },
    { name: 'BoLocThuThem', type: sql.VarChar(30), value: boLocThuThem || 'all' }
  ]);

  return result.recordset;
}

export async function getDanhSachDaThuThem(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachDaThuThem', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getChiTietThuThem(db, maDoiSoat, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_ChiTietThuThem', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return {
    chiTiet: result.recordsets[0]?.[0] || null,
    danhSachPhong: result.recordsets[1] || []
  };
}

export async function xacNhanThuThem(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_XacNhanThuThem', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan || null },
    { name: 'PhuongThucThanhToan', type: sql.NVarChar(20), value: data.phuongThucThanhToan },
    { name: 'NgayThanhToan', type: sql.Date, value: data.ngayThanhToan },
    { name: 'ChungTuThanhToan', type: sql.VarChar(500), value: data.chungTuThanhToan || null }
  ]);

  return result.recordset[0] || null;
}

export async function khongXacNhanThuThem(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_KhongXacNhanThuThem', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan || null }
  ]);

  return result.recordset[0] || null;
}
