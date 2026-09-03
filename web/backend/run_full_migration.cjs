const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || '123456',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'HOMEDORM4',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function executeFile(pool, relativePath) {
  const absolutePath = path.join(__dirname, relativePath);
  console.log(`\n--- Executing script: ${relativePath} ---`);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`File does not exist: ${absolutePath}`);
    return false;
  }
  
  const content = fs.readFileSync(absolutePath, 'utf8');
  // Split batches by GO boundary (case-insensitive, matching word boundary or start/end of line)
  const batches = content.split(/(?:\r?\n\s*\bGO\b\s*\r?\n)|(?:^\s*\bGO\b\s*$)/mi);
  console.log(`Found ${batches.length} batches to execute.`);

  for (let i = 0; i < batches.length; i++) {
    const query = batches[i].trim();
    if (query) {
      if (query.toUpperCase().startsWith('USE ')) {
        continue;
      }
      try {
        await pool.request().query(query);
      } catch (err) {
        console.error(`[ERROR] Batch ${i + 1} execution failed:`, err.message);
        console.error(`Query snippet: ${query.slice(0, 300)}...\n`);
        return false;
      }
    }
  }
  console.log(`[SUCCESS] Finished executing: ${relativePath}`);
  return true;
}

async function run() {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server successfully.');

    // 1. Run migration
    let success = await executeFile(pool, '../../Database/SP_NhanPhong/migration_gop_thanh_vien.sql');
    if (!success) {
      console.error('Migration failed. Aborting rest of execution.');
      await pool.close();
      process.exit(1);
    }

    // 2. Run residency SPs
    success = await executeFile(pool, '../../Database/SP_NhanPhong/sp_cu_tru_nhan_phong.sql');
    if (!success) {
      console.error('Residency SPs compilation failed. Aborting rest of execution.');
      await pool.close();
      process.exit(1);
    }

    // 3. Run contract SPs
    success = await executeFile(pool, '../../Database/SP_NhanPhong/sp_lap_hop_dong_thue.sql');
    if (!success) {
      console.error('Contract SPs compilation failed. Aborting rest of execution.');
      await pool.close();
      process.exit(1);
    }

    // 4. Reload test data
    success = await executeFile(pool, '../../Database/SP_NhanPhong/sql_data.sql');
    if (!success) {
      console.error('Reloading mock data failed.');
      await pool.close();
      process.exit(1);
    }

    await pool.close();
    console.log('\n=============================================');
    console.log('DATABASE REFACTOR & SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
  } catch (err) {
    console.error('Database migration/execution failed:', err);
    process.exit(1);
  }
}

run();
