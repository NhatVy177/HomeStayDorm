const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../Database/supabase_all_procedures_and_triggers.sql');

function convertTsqlFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  text = text.replace(/^\uFEFF/, '');

  // Strip database header & GO
  text = text.replace(/^\s*USE\s+\[?[a-zA-Z0-9_]+\]?;?\s*$/gmi, '');
  text = text.replace(/^\s*GO\s*$/gmi, '');
  text = text.replace(/SET\s+NOCOUNT\s+ON;?/gi, '');
  text = text.replace(/SET\s+XACT_ABORT\s+ON;?/gi, '');
  text = text.replace(/SET\s+QUOTED_IDENTIFIER\s+ON;?/gi, '');
  text = text.replace(/SET\s+ANSI_NULLS\s+ON;?/gi, '');
  text = text.replace(/IF\s+OBJECT_ID\([^)]+\)\s+IS\s+NULL\s+EXEC\([^)]+\);?/gi, '');
  text = text.replace(/IF\s+OBJECT_ID\([^)]+\)\s+IS\s+NOT\s+NULL\s+DROP\s+PROCEDURE\s+[^;]+;?/gi, '');

  // Type conversions
  text = text.replace(/\bNVARCHAR\(MAX\)/gi, 'TEXT');
  text = text.replace(/\bVARCHAR\(MAX\)/gi, 'TEXT');
  text = text.replace(/\bNVARCHAR\b/gi, 'VARCHAR');
  text = text.replace(/\bNCHAR\b/gi, 'CHAR');
  text = text.replace(/\bDATETIME2\(\d+\)/gi, 'TIMESTAMP');
  text = text.replace(/\bDATETIME2\b/gi, 'TIMESTAMP');
  text = text.replace(/\bDATETIME\b/gi, 'TIMESTAMP');
  text = text.replace(/\bBIT\b/gi, 'BOOLEAN');

  // String literals
  text = text.replace(/N'([^']*(?:''[^']*)*)'/g, "'$1'");

  // Built-in functions
  text = text.replace(/\bGETDATE\(\)/gi, 'CURRENT_TIMESTAMP');
  text = text.replace(/\bSYSDATETIME\(\)/gi, 'CURRENT_TIMESTAMP');
  text = text.replace(/\bISNULL\s*\(/gi, 'COALESCE(');
  text = text.replace(/\bLEN\s*\(/gi, 'LENGTH(');
  text = text.replace(/\bLTRIM\s*\(\s*RTRIM\s*\(/gi, 'TRIM(');
  text = text.replace(/TRY_CONVERT\s*\(\s*INT\s*,\s*([^)]+)\)/gi, "CASE WHEN ($1) ~ '^[0-9]+$' THEN ($1)::INT ELSE NULL END");

  // Error handling
  text = text.replace(/THROW\s+\d+\s*,\s*([^,;]+)\s*,\s*\d+;?/gi, 'RAISE EXCEPTION %;', '$1');
  text = text.replace(/RAISERROR\s*\(\s*([^,]+)\s*,\s*\d+\s*,\s*\d+\s*\);?/gi, 'RAISE EXCEPTION %;', '$1');

  // Remove table locking hints
  text = text.replace(/WITH\s*\(\s*(?:UPDLOCK\s*,\s*HOLDLOCK|UPDLOCK|HOLDLOCK|NOLOCK|READPAST)\s*\)/gi, '');

  return text;
}

const moduleFiles = [
  { name: 'PHẦN 2: CHỨC NĂNG CHUNG & AUTH', files: ['Database/SP_Chung/auth.sql', 'Database/SP_Chung/cap-nhat-hoa-don-qua-han.sql'] },
  { name: 'PHẦN 3: ĐĂNG KÝ THUÊ & KHÁCH MỚI', files: ['Database/SP_DKyThue/dang-ky-thue.sql', 'Database/SP_DKyThue/khach-moi.sql', 'Database/SP_DKyThue/sp_tudongxuly.sql'] },
  { name: 'PHẦN 4: ĐẶT CỌC & THANH TOÁN CỌC', files: ['Database/SP_DatCoc/dat-coc-chung.sql', 'Database/SP_DatCoc/dat-coc-gui-yeu-cau.sql', 'Database/SP_DatCoc/dat-coc-lap-phieu.sql', 'Database/SP_DatCoc/dat-coc-xac-nhan-kha-nang.sql', 'Database/SP_DatCoc/dat-coc-thanh-toan.sql', 'Database/SP_DatCoc/dat-coc-xac-nhan-thanh-toan.sql', 'Database/SP_DatCoc/dat-coc-chot-phieu.sql'] },
  { name: 'PHẦN 5: NHẬN PHÒNG & HỢP ĐỒNG', files: ['Database/SP_NhanPhong/sp_cu_tru_nhan_phong.sql', 'Database/SP_NhanPhong/sp_lap_hop_dong_thue.sql', 'Database/SP_NhanPhong/sp_lap_bien_ban_ban_giao.sql', 'Database/SP_NhanPhong/sp_ghi_nhan_khoan_thu_nhan_phong.sql', 'Database/SP_NhanPhong/sp_hopdong_chitiet.sql', 'Database/SP_NhanPhong/sp_gethopdong.sql'] },
  { name: 'PHẦN 6: TRẢ PHÒNG, ĐỐI SOÁT & HOÀN CỌC', files: ['Database/SP_TraPhong/00_All_SP_TraPhong_AIO.sql'] },
  { name: 'PHẦN 7: ADMIN & QUẢN TRỊ HỆ THỐNG', files: ['Database/SP_Admin/admin.sql'] }
];

let existingSql = fs.readFileSync(targetPath, 'utf8');

for (const mod of moduleFiles) {
  existingSql += `\n-- ============================================================================\n`;
  existingSql += `-- ${mod.name}\n`;
  existingSql += `-- ============================================================================\n\n`;

  for (const f of mod.files) {
    const fullPath = path.resolve(__dirname, '../../', f);
    if (fs.existsSync(fullPath)) {
      console.log(`Processing ${f}...`);
      existingSql += `-- Source: ${f}\n`;
      existingSql += convertTsqlFile(fullPath);
      existingSql += '\n\n';
    } else {
      console.warn(`File not found: ${fullPath}`);
    }
  }
}

fs.writeFileSync(targetPath, existingSql, 'utf8');
console.log(`\nSuccessfully compiled all triggers and procedures into: ${targetPath}`);
console.log(`Total output file size: ${fs.statSync(targetPath).size} bytes`);
