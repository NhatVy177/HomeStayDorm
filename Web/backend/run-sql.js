const fs = require('fs');
const sql = require('mssql');
require('dotenv').config();

async function run() {
  const pool = await sql.connect({
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false, trustServerCertificate: true }
  });

  async function executeFile(path) {
    const content = fs.readFileSync(path, 'utf8');
    const batches = content.split(/\bGO\b/i);
    for (const batch of batches) {
      const query = batch.trim();
      if (query) {
        try {
          await pool.request().query(query);
        } catch(e) {
          console.error('Error executing batch:', e.message);
        }
      }
    }
    console.log('Executed:', path);
  }

  await executeFile('../../Database/SP_DKyThue/khach-moi.sql');
  await executeFile('../../Database/SP_DKyThue/dang-ky-thue.sql');
  pool.close();
}

run();
