import { executeQuery, executeProcedure } from '../database/connection.js';

// Luồng đặt cọc có 2 cửa sổ 24h (chờ kế toán chốt, chờ khách thanh toán) -- quét thường
// xuyên hơn hoá đơn định kỳ (chu kỳ dài hơn nhiều) để giường/phòng không bị "Giữ chỗ" treo lâu.
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

let intervalId = null;

function getIntervalMs() {
  const configured = Number(process.env.DAT_COC_HET_HAN_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_INTERVAL_MS;
}

export async function nhaChoCocHetHan() {
  // Đếm TRƯỚC ở phía Node bằng 1 câu SELECT riêng. SP_NhaChoCocHetHan CỐ Ý không trả recordset:
  // nó được EXEC lồng bên trong nhiều SP khác của luồng đặt cọc (xem ghi chú trong dat-coc.sql),
  // nên không thể thêm SELECT vào đó mà không làm sai lệch result.recordset ở các nơi gọi khác.
  const countResult = await executeQuery(`
    SELECT COUNT(*) AS soPhieu FROM "PhieuDatCoc"
    WHERE "TrangThaiThanhToan" = 'Chờ TT' AND "ThoiHanThanhToan" < CURRENT_TIMESTAMP;
  `);
  const soPhieu = countResult.recordset?.[0]?.soPhieu || 0;

  await executeProcedure('dbo.SP_NhaChoCocHetHan');
  return soPhieu;
}

export function startDatCocHetHanScheduler() {
  if (intervalId) {
    return intervalId;
  }

  async function run(label) {
    try {
      const soPhieu = await nhaChoCocHetHan();
      if (soPhieu > 0) {
        console.log(`[dat-coc-het-han:${label}] Da huy ${soPhieu} phieu dat coc qua han, nha giuong/phong ve Trong.`);
      }
    } catch (error) {
      console.error(`[dat-coc-het-han:${label}] Khong quet duoc phieu dat coc qua han:`, error.message);
    }
  }

  run('startup');
  intervalId = setInterval(() => run('interval'), getIntervalMs());
  intervalId.unref?.();

  return intervalId;
}
