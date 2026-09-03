import { kiemTraThanhVienHopDongTam } from './repositories/hopDong.repository.js';

async function test() {
  try {
    const list = [
      { hoTen: 'Test User', ngaySinh: '2000-01-01', gioiTinh: 'Nam', cccd: '123456789012', sdt: '0123456789', email: 'test@example.com', quocTich: 'Việt Nam' }
    ];
    // Need a valid MaPhieuDatCoc in the DB, let's just pass 'DC0001' or similar
    const result = await kiemTraThanhVienHopDongTam('PDC001', list);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
test();
