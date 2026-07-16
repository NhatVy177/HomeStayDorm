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

export async function ThemPhieuTraPhong(db, maKhachHang, maHopDong, maPhieuDatCoc, ngayDuKienTra) {
  const result = await execute(db, 'SP_TraPhong_KhachHang_GuiYeuCau', [
    { name: 'MaKhachHang', type: sql.VarChar(6), value: maKhachHang },
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong || null },
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc || null },
    { name: 'NgayDuKienTra', type: sql.Date, value: ngayDuKienTra ? new Date(ngayDuKienTra) : null }
  ]);

  return result.recordset?.[0] || null;
}
