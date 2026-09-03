const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function testAutoQuoting() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // 1. Get all columns and tables
  const colsRes = await client.query("SELECT DISTINCT column_name FROM information_schema.columns WHERE table_schema = 'public'");
  const cols = colsRes.rows.map(r => r.column_name).sort((a, b) => b.length - a.length);

  const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
  const tables = tablesRes.rows.map(r => r.table_name).sort((a, b) => b.length - a.length);

  function cleanSql(sql) {
    let s = sql;
    s = s.replace(/\bdbo\./gi, '');
    s = s.replace(/N'([^']*(?:''[^']*)*)'/g, "'$1'");
    s = s.replace(/\bGETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
    s = s.replace(/\bSYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP');
    s = s.replace(/\bISNULL\s*\(/gi, 'COALESCE(');

    s = s.replace(
      /OUTER\s+APPLY\s*\(\s*SELECT\s+TOP\s*(\d+)\s+([\s\S]*?)\)\s+AS\s+([a-zA-Z0-9_]+)/gi,
      'LEFT JOIN LATERAL (SELECT $2 LIMIT $1) AS $3 ON true'
    );

    s = s.replace(
      /^(\s*SELECT)\s+TOP\s*(?:\(\s*(\d+)\s*\)|(\d+))\s+([\s\S]*)$/i,
      (match, sel, p1, p2, rest) => {
        const limit = p1 || p2;
        const cleanRest = rest.trim().replace(/;$/, '');
        return `${sel} ${cleanRest} LIMIT ${limit};`;
      }
    );

    // Auto-quote tables
    for (const t of tables) {
      const re = new RegExp(`(?<!["'])\\b${t}\\b(?!["'])`, 'gi');
      s = s.replace(re, `"${t}"`);
    }

    // Auto-quote columns (only when preceded by dot or in select list/where)
    for (const c of cols) {
      // e.g. .ColumnName
      const dotRe = new RegExp(`\\.(\\b${c}\\b)(?!["'])`, 'gi');
      s = s.replace(dotRe, `."${c}"`);
    }

    return s;
  }

  const rawQuery = `
    SELECT *
    FROM (
      SELECT
        N'Hợp đồng thuê' AS loai,
        hd.MaHopDong AS maThamChieu,
        hd.TrangThai AS trangThai,
        hd.NgayKyHD AS ngayTao,
        1 AS thuTu
      FROM dbo.HopDongThue AS hd
      WHERE hd.MaKhachHang = $1
        AND hd.TrangThai NOT IN (N'Hết hạn', N'Đã thanh lý')

      UNION ALL

      SELECT
        N'Phiếu đặt cọc' AS loai,
        pdc.MaPhieuDatCoc AS maThamChieu,
        CONCAT(pdc.TrangThaiCoc, N' / ', pdc.TrangThaiThanhToan) AS trangThai,
        CAST(pdc.ThoiDiemDatCoc AS DATE) AS ngayTao,
        2 AS thuTu
      FROM dbo.PhieuDatCoc AS pdc
      WHERE pdc.MaKhachHang = $1
        AND pdc.TrangThaiCoc <> N'Đã hủy'
        AND pdc.TrangThaiThanhToan <> N'Hết hạn'
    ) AS activeFlow
    ORDER BY thuTu, ngayTao DESC
    LIMIT 1;
  `;

  const cleaned = cleanSql(rawQuery);
  console.log('Cleaned SQL:\n', cleaned);

  console.log('\nRunning cleaned query on Supabase...');
  try {
    const res = await client.query(cleaned, ['KH0018']);
    console.log('QUERY SUCCESS! Rows:', res.rows);
  } catch (err) {
    console.error('QUERY FAILED:', err.message);
  }

  await client.end();
}

testAutoQuoting().catch(console.error);
