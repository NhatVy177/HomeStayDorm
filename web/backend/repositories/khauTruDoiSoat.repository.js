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
        .input('ChiPhiSuaChua', sql.Decimal(15, 2), item.chiPhiSuaChua)
        .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
        .input('MaBienBanKT', sql.VarChar(6), item.maBienBanKT)
        .input('MaChiTietHH', sql.VarChar(6), item.maChiTietHH)
        .query(`
          UPDATE "ChiTietHuHong" AS cthh
          SET "ChiPhiSuaChua" = $1
          FROM "BienBanKiemTraPhong" AS bbkt
          WHERE bbkt."MaBienBanKT" = cthh."MaBienBanKT"
            AND bbkt."MaPhieuTra" = $2
            AND cthh."MaBienBanKT" = $3
            AND cthh."MaChiTietHH" = $4;
        `);

      if ((result.rowsAffected?.[0] || 0) === 0) return false;
      reportsWithDetails.add(item.maBienBanKT);
      continue;
    }

    const result = await requestFrom(db)
      .input('TongChiPhiSuaChua', sql.Decimal(15, 2), item.tongChiPhiSuaChua)
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaBienBanKT', sql.VarChar(6), item.maBienBanKT)
      .query(`
        UPDATE "BienBanKiemTraPhong" AS bbkt
        SET "TongChiPhiSuaChua" = $1
        WHERE bbkt."MaPhieuTra" = $2
          AND bbkt."MaBienBanKT" = $3
          AND NOT EXISTS (
              SELECT 1
              FROM "ChiTietHuHong" AS cthh
              WHERE cthh."MaBienBanKT" = bbkt."MaBienBanKT"
          );
      `);

    if ((result.rowsAffected?.[0] || 0) === 0) return false;
  }

  for (const maBienBanKT of reportsWithDetails) {
    const result = await requestFrom(db)
      .input('MaPhieuTra', sql.VarChar(6), maPhieuTra)
      .input('MaBienBanKT', sql.VarChar(6), maBienBanKT)
      .query(`
        UPDATE "BienBanKiemTraPhong" AS bbkt
        SET "TongChiPhiSuaChua" = COALESCE((
            SELECT SUM(cthh."ChiPhiSuaChua")
            FROM "ChiTietHuHong" AS cthh
            WHERE cthh."MaBienBanKT" = bbkt."MaBienBanKT"
        ), 0)
        WHERE bbkt."MaPhieuTra" = $1
          AND bbkt."MaBienBanKT" = $2;
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
