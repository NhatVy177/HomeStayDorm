import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getTongChiPhiSuaChua(db, maPhieuTra) {
  const result = await execute(db, 'SP_TraPhong_KeToan_TongChiPhiSuaChua', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
  ]);

  return result.recordset[0] || { tongChiPhiSuaChua: 0, soBienBanKiemTra: 0 };
}

export async function getTienPhatChoXuLy(db, maHopDong) {
  if (!maHopDong) return 0;

  const result = await execute(db, 'SP_TraPhong_KeToan_TienPhatChoXuLy', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return result.recordset[0]?.tienPhat || 0;
}

export async function getTienHoaDonConNo(db, maHopDong) {
  if (!maHopDong) return 0;

  const result = await execute(db, 'SP_TraPhong_KeToan_TienHoaDonConNo', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return {
    tienThueConNo: result.recordset[0]?.tienThueConNo || result.recordset[0]?.tienHoaDonConNo || 0,
    tienDichVuConNo: result.recordset[0]?.tienDichVuConNo || 0
  };
}

export async function getChiTietKhauTru(db, maPhieuTra, maHopDong) {
  const result = await execute(db, 'SP_TraPhong_KeToan_ChiTietKhauTru', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra },
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong || null }
  ]);

  return {
    hoaDonConNo: result.recordsets[0] || [],
    chiTietHoaDon: result.recordsets[1] || [],
    bienBanKiemTra: result.recordsets[2] || [],
    chiTietHuHong: result.recordsets[3] || [],
    bienBanViPham: result.recordsets[4] || [],
    dichVuHopDong: result.recordsets[5] || []
  };
}
