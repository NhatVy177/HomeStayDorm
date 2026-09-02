const path = require('path');
const { pathToFileURL } = require('url');

async function testAllCustomerApis() {
  process.env.DATABASE_URL = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

  const kmUrl = pathToFileURL(path.join(__dirname, '../backend/services/khachMoi.service.js')).href;
  const km = await import(kmUrl);

  const mockUser = {
    id: 'KH0018',
    maNguoiDung: 'KH0018',
    vaiTro: 'KhachHang',
    hoTen: 'Dương Anh Khoa'
  };

  console.log('1. Testing getTrangThai:');
  const tt = await km.getTrangThai(mockUser);
  console.log('  Status:', tt?.coQuyTrinhThueDangHoatDong);

  console.log('\n2. Testing getTongQuan:');
  const tq = await km.getTongQuan(mockUser);
  console.log('  Overview OK, rooms:', tq?.phongGoiY?.length);

  console.log('\n3. Testing getPhongKhaDung:');
  const pkd = await km.getPhongKhaDung(mockUser, {});
  console.log('  Available rooms:', pkd?.length);

  console.log('\n4. Testing getHoSoDetail (first profile if exists):');
  if (tq.hoSo && tq.hoSo.length > 0) {
    const detail = await km.getHoSoDetail(mockUser, tq.hoSo[0].maDangKy);
    console.log('  Profile detail OK:', detail?.maDangKy);
  }

  console.log('\nALL CUSTOMER SERVICES TESTED SUCCESSFULLY!');
  process.exit(0);
}

testAllCustomerApis().catch(e => { console.error('FAILED:', e); process.exit(1); });
