const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));
const crypto = require('crypto');

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

// Passwords that were commonly used: default is '123456'
// SQL Server HASHBYTES('SHA2_256', '123456') in style 2 (no 0x prefix, uppercase hex)
// = A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3
// PostgreSQL sha256 of '123456' uppercase
// = 8D969EEF6ECAD3C29A3A629280E686CF0C3F5D5A86AFF3CA12020C923ADC6C92

// We'll just update ALL users whose stored hash matches SQL Server '123456' hash
// to instead have PostgreSQL '123456' hash
const SQLSERVER_HASH_123456 = 'A665A45920422F9D417E4867EFDC4FB8A04A1F3FFF1FA07E998E86F7F7A27AE3';
const PG_HASH_123456 = crypto.createHash('sha256').update('123456').digest('hex').toUpperCase();

async function fixPasswords() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!\n');

  console.log('SQL Server hash of 123456:', SQLSERVER_HASH_123456);
  console.log('PostgreSQL hash of 123456:', PG_HASH_123456);
  console.log('');

  // Count how many users have the SQL Server hash
  const count = await client.query(`
    SELECT COUNT(*) as cnt FROM "TaiKhoan" 
    WHERE upper("MatKhau") = $1
  `, [SQLSERVER_HASH_123456]);
  console.log(`Users with SQL Server '123456' hash: ${count.rows[0].cnt}`);

  // Update them all to PostgreSQL hash
  const update = await client.query(`
    UPDATE "TaiKhoan"
    SET "MatKhau" = $1
    WHERE upper("MatKhau") = $2
  `, [PG_HASH_123456, SQLSERVER_HASH_123456]);
  console.log(`Updated ${update.rowCount} accounts to PostgreSQL hash format`);

  // Verify with a test login
  console.log('\nVerifying login for "binh" with password "123456"...');
  try {
    const loginResult = await client.query(`SELECT * FROM sp_dang_nhap($1, $2)`, ['binh', '123456']);
    if (loginResult.rows.length > 0) {
      console.log('✓ Login WORKS! User data:');
      console.log(JSON.stringify(loginResult.rows[0], null, 2));
    } else {
      console.log('✗ Login returned no rows');
    }
  } catch(e) {
    console.error('✗ Login still failed:', e.message);
  }

  // Also check if there are any other hash formats in DB
  const otherHashes = await client.query(`
    SELECT length("MatKhau") as hash_len, count(*) as cnt 
    FROM "TaiKhoan" 
    GROUP BY length("MatKhau")
    ORDER BY cnt DESC
  `);
  console.log('\nHash lengths in DB:', otherHashes.rows);

  await client.end();
  console.log('\nDone!');
}

fixPasswords().catch(e => { console.error('FATAL:', e); process.exit(1); });
