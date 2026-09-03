const fs = require('fs');
const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

(async function() {
  try {
    await sql.connect(config);
    const executeScript = async (path) => {
      const script = fs.readFileSync(path, 'utf8');
      const blocks = script.split(/^GO/im);
      for (const block of blocks) {
        if (block.trim()) {
          await sql.query(block);
        }
      }
      console.log('Successfully applied ' + path);
    };
    
    await executeScript('../../Database/SP_DKyThue/dang-ky-thue.sql');
    await executeScript('../../Database/SP_DKyThue/khach-moi.sql');
    await executeScript('../../Database/SP_DKyThue/sp_tudongxuly.sql');
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
})();
