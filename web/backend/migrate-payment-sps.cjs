const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

async function run() {
  const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || '123',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_NAME || 'HOMEDORM4',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  try {
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server successfully.');

    const sqlFilePath = path.join(__dirname, '../../Database/SP_NhanPhong/sp_ghi_nhan_khoan_thu_nhan_phong.sql');
    console.log('Reading SQL file:', sqlFilePath);
    const content = fs.readFileSync(sqlFilePath, 'utf8');

    // Split batches by GO
    const batches = content.split(/\bGO\b/i);
    console.log(`Found ${batches.length} batches to execute.`);

    for (let i = 0; i < batches.length; i++) {
      const query = batches[i].trim();
      if (query) {
        if (query.toUpperCase().startsWith('USE ')) {
          console.log(`Skipping USE batch: ${query}`);
          continue;
        }
        try {
          await pool.request().query(query);
          console.log(`Successfully executed batch ${i + 1}/${batches.length}`);
        } catch (err) {
          console.error(`Error in batch ${i + 1}:`, err.message);
          console.error(query.slice(0, 200) + '...');
        }
      }
    }

    await pool.close();
    console.log('Migration finished.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
