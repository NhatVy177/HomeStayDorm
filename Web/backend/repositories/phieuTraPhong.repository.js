import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

async function getPhieuTraPhong(db, maPhieuTra, lockForUpdate, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayPhieuTraPhong', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra },
    { name: 'LockForUpdate', type: sql.Bit, value: lockForUpdate ? 1 : 0 },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset?.[0] || null;
}

export async function getPhieuTraPhongById(db, maPhieuTra, maNhanVienKeToan = null) {
  return getPhieuTraPhong(db, maPhieuTra, false, maNhanVienKeToan);
}

export async function getPhieuTraPhongByIdForUpdate(db, maPhieuTra, maNhanVienKeToan = null) {
  return getPhieuTraPhong(db, maPhieuTra, true, maNhanVienKeToan);
}
