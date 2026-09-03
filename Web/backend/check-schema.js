import { getHopDongDashboard } from './services/khachMoi.service.js';

async function checkSchema() {
  console.log('Testing KH0018 (Duong Anh Khoa):');
  const result18 = await getHopDongDashboard({ vaiTro: 'KhachHang', maNguoiDung: 'KH0018' });
  console.log('KH0018 contract:', result18?.data?.MaHopDong, 'Status:', result18?.data?.TrangThai);
  console.log('KH0018 contracts count:', result18?.data?.danhSachHopDong?.length);

  console.log('Testing KH0008:');
  const result08 = await getHopDongDashboard({ vaiTro: 'KhachHang', maNguoiDung: 'KH0008' });
  console.log('KH0008 contract:', result08?.data?.MaHopDong, 'Status:', result08?.data?.TrangThai);
  process.exit(0);
}

checkSchema().catch(console.error);
