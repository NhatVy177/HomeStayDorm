const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || '123',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'HOMEDORM4',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  try {
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server successfully.');

    const sqlFilePath = path.join(__dirname, '..', '..', 'Database', 'SP_NhanPhong', 'sql_data.sql');
    console.log('Reading SQL file:', sqlFilePath);
    const content = fs.readFileSync(sqlFilePath, 'utf8');
    const batches = content.split(/\bGO\b/i);
    console.log(`Found ${batches.length} batches to execute.`);

    for (let index = 0; index < batches.length; index += 1) {
      const query = batches[index].trim();
      if (!query) continue;
      if (query.toUpperCase().startsWith('USE ')) {
        console.log(`Skipping USE batch: ${query}`);
        continue;
      }

      try {
        const result = await pool.request().query(query);
        console.log(`Successfully executed batch ${index + 1}/${batches.length}`);
        if (result.recordset?.length) {
          console.table(result.recordset);
        }
      } catch (error) {
        console.error(`Error in batch ${index + 1}:`, error.message);
        console.error(`${query.slice(0, 200)}...`);
        throw error;
      }
    }

    await pool.close();
    console.log('Handover test data import finished.');
  } catch (error) {
    console.error('Handover test data import failed:', error);
    process.exitCode = 1;
  }
}

run();
