import { capNhatLichXemDenGioThanhDaXem } from '../repositories/lichXemPhong.repository.js';

const DEFAULT_INTERVAL_MS = 60 * 1000;

let intervalId = null;

function getIntervalMs() {
  const configured = Number(process.env.LICH_XEM_PHONG_DEN_GIO_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_INTERVAL_MS;
}

export async function capNhatLichXemPhongDenGio() {
  return capNhatLichXemDenGioThanhDaXem();
}

export function startLichXemPhongDenGioScheduler() {
  if (intervalId) {
    return intervalId;
  }

  async function run(label) {
    try {
      const soLichCapNhat = await capNhatLichXemPhongDenGio();
      if (soLichCapNhat > 0) {
        console.log(`[lich-xem-phong-den-gio:${label}] Da chuyen ${soLichCapNhat} lich xem phong sang Da xem.`);
      }
    } catch (error) {
      console.error(`[lich-xem-phong-den-gio:${label}] Khong cap nhat duoc lich xem phong den gio:`, error.message);
    }
  }

  run('startup');
  intervalId = setInterval(() => run('interval'), getIntervalMs());
  intervalId.unref?.();

  return intervalId;
}
