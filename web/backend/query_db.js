import { getPool } from './database/connection.js';

async function main() {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TaiSan'");
    console.log("TaiSan columns:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
