import fs from 'fs';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true }
};

sql.connect(config).then(p => {
  const sqlStr = fs.readFileSync('../../Database/SP_DKyThue/khach-moi.sql', 'utf8');
  const batches = sqlStr.split(/\bGO\b/i);
  return batches.reduce((prom, batch) => prom.then(() => {
    if(batch.trim()) {
      return p.request().query(batch.trim()).catch(e => console.log('Batch failed, ignoring:', e.message));
    }
  }), Promise.resolve());
}).then(() => {
  console.log('Done');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
