import { getPool } from './database/connection.js'; 
import 'dotenv/config';

async function run() { 
    const pool = await getPool(); 
    await pool.request().query("UPDATE KhachHang SET QuocTich = N'Việt Nam', CCCD = '0795749721' WHERE MaKhachHang = 'KH0031'"); 
    console.log('Fixed DB'); 
    process.exit(0); 
} 
run();
