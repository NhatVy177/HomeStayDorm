import { layDanhSachDichVu } from './repositories/hopDong.repository.js';

async function test() {
  try {
    const list = await layDanhSachDichVu();
    console.log('Dich vu:', list);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
test();
