import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'HOMEDORM4',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

import { getHopDongDashboard } from './services/khachMoi.service.js';

async function checkSchema() {
  const result = await getHopDongDashboard({ vaiTro: 'KhachHang', maNguoiDung: 'KH0008' });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

checkSchema().catch(console.error);
