import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

function requestFrom(db) {
  return typeof db.request === 'function' ? db.request() : new sql.Request(db);
}

export async function getTongChiPhiSuaChua(db, maPhieuTra) {
  const result = await execute(db, 'SP_TraPhong_KeToan_TongChiPhiSuaChua', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
  ]);

  return result.recordset[0] || { tongChiPhiSuaChua: 0, soBienBanKiemTra: 0 };
}

export async function updateChiPhiSuaChuaBienBan(db, maPhieuTra, chiTietChiPhiSuaChua = []) {
  const reportsWithDetails = new Set();

  for (const item of chiTietChiPhiSuaChua) {
    if (item.maChiTietHH) {
      const result = await requestFrom(db)
        .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
        .input('MaBienBanKT', sql.VarChar(6), item.maBienBanKT)
        .input('MaChiTietHH', sql.VarChar(6), item.maChiTietHH)
        .input('ChiPhiSuaChua', sql.Decimal(15, 2), item.chiPhiSuaChua)
        .query(`
          UPDATE cthh
          SET ChiPhiSuaChua = @ChiPhiSuaChua
          FROM dbo.ChiTietHuHong cthh
          INNER JOIN dbo.BienBanKiemTraPhong bbkt
              ON bbkt.MaBienBanKT = cthh.MaBienBanKT
          WHERE bbkt.MaPhieuTra = @MaPhieuTra
            AND cthh.MaBienBanKT = @MaBienBanKT
            AND cthh.MaChiTietHH = @MaChiTietHH;
        `);

      if ((result.rowsAffected?.[0] || 0) === 0) return false;
      reportsWithDetails.add(item.maBienBanKT);
      continue;
    }

    const result = await requestFrom(db)
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaBienBanKT', sql.VarChar(6), item.maBienBanKT)
      .input('TongChiPhiSuaChua', sql.Decimal(15, 2), item.tongChiPhiSuaChua)
      .query(`
        UPDATE bbkt
        SET TongChiPhiSuaChua = @TongChiPhiSuaChua
        FROM dbo.BienBanKiemTraPhong bbkt
        WHERE bbkt.MaPhieuTra = @MaPhieuTra
          AND bbkt.MaBienBanKT = @MaBienBanKT
          AND NOT EXISTS (
              SELECT 1
              FROM dbo.ChiTietHuHong cthh
              WHERE cthh.MaBienBanKT = bbkt.MaBienBanKT
          );
      `);

    if ((result.rowsAffected?.[0] || 0) === 0) return false;
  }

  for (const maBienBanKT of reportsWithDetails) {
    const result = await requestFrom(db)
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaBienBanKT', sql.VarChar(6), maBienBanKT)
      .query(`
        UPDATE bbkt
        SET TongChiPhiSuaChua = ISNULL((
            SELECT SUM(cthh.ChiPhiSuaChua)
            FROM dbo.ChiTietHuHong cthh
            WHERE cthh.MaBienBanKT = bbkt.MaBienBanKT
        ), 0)
        FROM dbo.BienBanKiemTraPhong bbkt
        WHERE bbkt.MaPhieuTra = @MaPhieuTra
          AND bbkt.MaBienBanKT = @MaBienBanKT;
      `);

    if ((result.rowsAffected?.[0] || 0) === 0) return false;
  }

  return true;
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
