import { getPool } from './database/connection.js';

async function test() {
  const pool = getPool();
  try {
    const res = await pool.query(`
      SELECT p.parameter_name, p.data_type, p.parameter_mode
      FROM information_schema.parameters p
      JOIN information_schema.routines r ON p.specific_name = r.specific_name
      WHERE r.routine_name = 'sp_lap_hop_dong_thue'
      ORDER BY p.ordinal_position;
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
