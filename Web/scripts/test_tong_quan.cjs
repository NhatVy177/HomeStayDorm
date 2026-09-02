const path = require('path');
const { pathToFileURL } = require('url');

async function testGetTongQuan() {
  process.env.DATABASE_URL = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

  const kmUrl = pathToFileURL(path.join(__dirname, '../backend/services/khachMoi.service.js')).href;
  const { getTongQuan, getPhongKhaDung } = await import(kmUrl);

  const mockUser = {
    id: 'KH0018',
    maNguoiDung: 'KH0018',
    vaiTro: 'KhachHang',
    hoTen: 'Dương Anh Khoa'
  };

  console.log('Testing getTongQuan for Dương Anh Khoa (KH0018)...');
  try {
    const res = await getTongQuan(mockUser);
    console.log('getTongQuan SUCCESS! Result:');
    console.log('  TrangThai:', res.trangThai);
    console.log('  HoSo count:', res.hoSo?.length);
    console.log('  LichXem count:', res.lichXem?.length);
    console.log('  PhongGoiY count:', res.phongGoiY?.length);
  } catch (err) {
    console.error('getTongQuan ERROR:', err);
  }

  console.log('\nTesting getPhongKhaDung for KH0018...');
  try {
    const rooms = await getPhongKhaDung(mockUser, {});
    console.log('getPhongKhaDung SUCCESS! Count:', rooms?.length);
  } catch (err) {
    console.error('getPhongKhaDung ERROR:', err);
  }

  process.exit(0);
}

testGetTongQuan().catch(e => { console.error('FATAL:', e); process.exit(1); });
