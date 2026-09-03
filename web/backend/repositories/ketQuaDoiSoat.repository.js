import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getKetQuaDoiSoat(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_KetQuaDoiSoat', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}
