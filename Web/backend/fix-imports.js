import fs from 'fs';

const files = [
  'services/xacNhanKetQua.service.js',
  'services/thanhlytraphong.service.js',
  'services/kiemTraTraPhong.service.js',
  'services/GhiNhanBanGiaoRa.service.js'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ getPool \} from '\.\.\/database\/connection\.js';\r?\n/g, '');
  fs.writeFileSync(file, content);
}
console.log('Fixed imports');
