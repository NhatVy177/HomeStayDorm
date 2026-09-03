const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function check() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Get the full source code of sp_dang_nhap
  const r = await client.query(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'sp_dang_nhap'
    LIMIT 1
  `);
  console.log('=== sp_dang_nhap source ===');
  console.log(r.rows[0]?.def || 'NOT FOUND');

  // Also check sp_dang_ky to see how password is stored  
  const r2 = await client.query(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'sp_dang_ky'
    LIMIT 1
  `);
  console.log('\n=== sp_dang_ky source (password hashing part) ===');
  const def2 = r2.rows[0]?.def || '';
  // Show only the password-related lines
  const lines = def2.split('\n').filter(l => l.toLowerCase().includes('mat_khau') || l.toLowerCase().includes('matkh') || l.toLowerCase().includes('hash') || l.toLowerCase().includes('encode') || l.toLowerCase().includes('crypt'));
  console.log(lines.join('\n') || 'No password-related lines found');

  // Verify what hash '123456' produces in PostgreSQL
  try {
    const hash1 = await client.query(`SELECT encode(digest('123456', 'sha256'), 'hex') as sha256_lower`);
    const hash2 = await client.query(`SELECT upper(encode(digest('123456', 'sha256'), 'hex')) as sha256_upper`);
    console.log('\n=== SHA256 of "123456" in PostgreSQL ===');
    console.log('lowercase:', hash1.rows[0].sha256_lower);
    console.log('UPPERCASE:', hash2.rows[0].sha256_upper);
    console.log('\n=== Hash stored in DB for user "binh" ===');
    const stored = await client.query(`SELECT "MatKhau" FROM "TaiKhoan" WHERE "TenDangNhap" = 'binh'`);
    console.log('Stored hash:', stored.rows[0]?.MatKhau);
    
    const matches = hash2.rows[0].sha256_upper === stored.rows[0]?.MatKhau;
    console.log('Matches SQL Server HASHBYTES format?', matches);
  } catch(e) {
    console.error('Hash check error:', e.message);
  }

  await client.end();
}

check().catch(e => { console.error(e); process.exit(1); });
