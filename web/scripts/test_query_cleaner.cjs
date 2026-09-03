const TABLES = [
  'BienBanBanGiao', 'BienBanKiemTraPhong', 'BienBanViPham', 'CauHinhSaoLuu',
  'ChiNhanh', 'ChiTietBanGiao', 'ChiTietDatCoc', 'ChiTietHoaDon', 'ChiTietHuHong',
  'ChiTietXemPhong', 'DichVu', 'DichVuHopDong', 'DieuKhoanViPham', 'DoiSoat',
  'Giuong', 'HinhAnhPhong', 'HoSoCuTru', 'HoaDon', 'HopDongThue', 'KhachHang',
  'LichSuSaoLuu', 'LichXemPhong', 'LoaiPhong', 'NguoiDung', 'NhanVien',
  'NhatKyHeThong', 'PDK_LoaiPhong', 'PhieuDangKy', 'PhieuDatCoc', 'PhieuGhiChiSo',
  'PhieuTraPhong', 'Phong', 'QuiDinh', 'QuyDinhHoanCoc', 'QuyDinhTruTien',
  'TaiKhoan', 'TaiSan', 'ThamSoHeThong', 'ThanhVienHopDong', 'YeuCauSuaChua'
];

function cleanPostgresQuery(sqlString) {
  let pgSql = sqlString;

  // 1. Remove dbo.
  pgSql = pgSql.replace(/\bdbo\./gi, '');

  // 2. String literal N'...' -> '...'
  pgSql = pgSql.replace(/N'([^']*(?:''[^']*)*)'/g, "'$1'");

  // 3. Date & Null functions
  pgSql = pgSql.replace(/\bGETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/\bSYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/\bISNULL\s*\(/gi, 'COALESCE(');

  // 4. Convert OUTER APPLY (SELECT TOP N ...) AS alias -> LEFT JOIN LATERAL (SELECT ... LIMIT N) AS alias ON true
  pgSql = pgSql.replace(
    /OUTER\s+APPLY\s*\(\s*SELECT\s+TOP\s*(\d+)\s+([\s\S]*?)\)\s+AS\s+([a-zA-Z0-9_]+)/gi,
    'LEFT JOIN LATERAL (SELECT $2 LIMIT $1) AS $3 ON true'
  );

  // 5. Convert standalone SELECT TOP (N) or SELECT TOP N
  pgSql = pgSql.replace(
    /^(\s*SELECT)\s+TOP\s*(?:\(\s*(\d+)\s*\)|(\d+))\s+([\s\S]*)$/i,
    (match, sel, p1, p2, rest) => {
      const limit = p1 || p2;
      const cleanRest = rest.trim().replace(/;$/, '');
      return `${sel} ${cleanRest} LIMIT ${limit};`;
    }
  );

  // 6. Subquery SELECT TOP
  pgSql = pgSql.replace(
    /(\(\s*SELECT)\s+TOP\s*(?:\(\s*(\d+)\s*\)|(\d+))\s+([\s\S]*?)\)/gi,
    (match, sel, p1, p2, rest) => {
      const limit = p1 || p2;
      return `${sel} ${rest} LIMIT ${limit})`;
    }
  );

  // 7. Auto-quote all known tables
  for (const t of TABLES) {
    const tableRegex = new RegExp(`(?<!["'])\\b${t}\\b(?!["'])`, 'gi');
    pgSql = pgSql.replace(tableRegex, `"${t}"`);
  }

  return pgSql;
}

const testQuery = `
  SELECT hd.MaHopDong
  FROM dbo.HopDongThue AS hd
  INNER JOIN PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
  WHERE hd.MaKhachHang = 'KH001'
`;

console.log(cleanPostgresQuery(testQuery));
