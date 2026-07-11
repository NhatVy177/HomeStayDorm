import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getMaQuyDinhHoanCoc(db, tyLeHoanCocHienTai) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayMaQuyDinhHoanCoc', [
    { name: 'TyLeHoanCocHienTai', type: sql.Decimal(5, 2), value: tyLeHoanCocHienTai }
  ]);

  return result.recordset[0]?.maQuyDinhHoanCoc || null;
}
