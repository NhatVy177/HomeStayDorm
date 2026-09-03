import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getPhieuDatCocHoSo(db, maPhieuDatCoc) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayPhieuDatCocHoSo', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc }
  ]);

  return result.recordset[0] || null;
}
