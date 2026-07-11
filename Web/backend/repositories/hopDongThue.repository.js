import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getHopDongHoSo(db, maHopDong) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayHopDongHoSo', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return result.recordset?.[0] || null;
}
