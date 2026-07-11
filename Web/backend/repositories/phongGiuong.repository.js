import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getPhongTrongPhieuCoc(db, maPhieuDatCoc) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayPhongTrongPhieuCoc', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc }
  ]);

  return result.recordset;
}
