import { executeProcedure } from '../database/connection.js';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

let intervalId = null;

function getIntervalMs() {
  const configured = Number(process.env.HOA_DON_QUA_HAN_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_INTERVAL_MS;
}

export async function capNhatHoaDonQuaHan() {
  const result = await executeProcedure('SP_HoaDon_CapNhatNoQuaHan');
  return result.recordset?.[0]?.soHoaDonCapNhat || 0;
}

export function startHoaDonQuaHanScheduler() {
  if (intervalId) {
    return intervalId;
  }

  async function run(label) {
    try {
      const soHoaDonCapNhat = await capNhatHoaDonQuaHan();
      if (soHoaDonCapNhat > 0) {
        console.log(`[hoa-don-qua-han:${label}] Da chuyen ${soHoaDonCapNhat} hoa don sang No.`);
      }
    } catch (error) {
      console.error(`[hoa-don-qua-han:${label}] Khong cap nhat duoc hoa don qua han:`, error.message);
    }
  }

  run('startup');
  intervalId = setInterval(() => run('interval'), getIntervalMs());
  intervalId.unref?.();

  return intervalId;
}
