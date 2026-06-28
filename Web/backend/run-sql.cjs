const sql = require('mssql');
const fs = require('fs');

async function run() {
  try {
    const pool = await new sql.ConnectionPool({
      server: 'localhost',
      database: 'HOMEDORM4',
      user: 'sa',
      password: '123456',
      options: { encrypt: false, trustServerCertificate: true }
    }).connect();
    
    const content = fs.readFileSync('d:/NAM3/HomeStayDorm/Web/backend/database/sql/khach-moi.sql', 'utf8');
    const batches = content.split(/^\s*GO\s*$/im).map(b => b.trim()).filter(Boolean);
    for (const batch of batches) {
      await pool.request().query(batch);
    }
    console.log('SPs updated successfully');
    process.exit(0);
  } catch(err) {
    console.error(err.message || err);
    process.exit(1);
  }
}
run();
