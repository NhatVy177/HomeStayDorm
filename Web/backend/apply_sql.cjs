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
    
    // Read dang-ky-thue.sql and khach-moi.sql
    let alterLoaiPhong = fs.readFileSync('alter_loaiphong.sql', 'utf8');
    let dangKyThue = fs.readFileSync('../../Database/SP_DKyThue/dang-ky-thue.sql', 'utf8');
    let khachMoi = fs.readFileSync('../../Database/SP_DKyThue/khach-moi.sql', 'utf8');
    
    // Split by GO and execute
    const executeScript = async (script) => {
        const blocks = script.split(/^GO/im);
        for (const block of blocks) {
            if (block.trim()) {
                await sql.query(block);
            }
        }
    };
    
    await executeScript(alterLoaiPhong);
    console.log('Successfully applied alter_loaiphong.sql');
    
    await executeScript(dangKyThue);
    console.log('Successfully applied dang-ky-thue.sql');
    
    await executeScript(khachMoi);
    console.log('Successfully applied khach-moi.sql');
    
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
})();
