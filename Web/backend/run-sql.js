import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import sql from 'mssql';

// Load .env
dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || 'HOMEDORM4',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

async function main() {
  console.log('Connecting to database with config:', {
    server: dbConfig.server,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
  });

  const sqlFilePath = path.join(process.cwd(), 'database', 'sql', 'nhan-phong.sql');
  console.log('Reading SQL file:', sqlFilePath);
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('SQL file not found!');
    return;
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Split sql statements by GO line
  const statements = sqlContent.split(/\r?\n[gG][oO]\r?\n/);
  
  console.log(`Found ${statements.length} sql batches to run.`);

  try {
    const pool = await sql.connect(dbConfig);
    console.log('Database connected successfully.');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      console.log(`Running batch ${i + 1}/${statements.length}...`);
      try {
        await pool.request().query(stmt);
      } catch (err) {
        console.error(`Error executing batch ${i + 1}:`, err.message);
        console.log('Batch content:', stmt.substring(0, 200) + '...');
      }
    }

    await sql.close();
    console.log('Done executing SQL script.');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

main();
