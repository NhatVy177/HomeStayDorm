// ============================================================
// trace-layers.mjs — Công cụ tra cứu hàm theo sơ đồ 3 lớp
// ------------------------------------------------------------
// Quét code của một module nghiệp vụ và in ra chuỗi gọi:
//   GUI (api.js)  ->  BUS (route -> controller -> service)  ->  DAO (stored procedure)
// Đồng thời báo SP nào đã được định nghĩa trong file .sql, SP nào CHƯA có.
//
// Cách dùng (chạy trong thư mục Web/):
//   node scripts/trace-layers.mjs datCoc
//   node scripts/trace-layers.mjs            (liệt kê các module có thể quét)
// ============================================================

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const FE = join(WEB, 'frontend', 'src', 'pages');
const BE = join(WEB, 'backend');
const SQLDIR = join(BE, 'database', 'sql');

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

// --- Lấy danh sách module từ thư mục routes ---
function listModules() {
  return readdirSync(join(BE, 'routes'))
    .filter((f) => f.endsWith('.routes.js'))
    .map((f) => f.replace('.routes.js', ''));
}

// --- GUI: các hàm export trong frontend/src/pages/<mod>/<mod>.api.js ---
function parseApi(mod) {
  const txt = read(join(FE, mod, `${mod}.api.js`));
  if (!txt) return [];
  // bắt:  key: (args) => httpClient.get('/url')
  const re = /(\w+)\s*:\s*\(([^)]*)\)\s*=>\s*httpClient\.(\w+)\(\s*[`'"]([^`'"]+)[`'"]/g;
  const out = [];
  let m;
  while ((m = re.exec(txt))) out.push({ fn: m[1], http: m[3].toUpperCase(), url: m[4] });
  return out;
}

// --- BUS (route): router.<method>('/path', controller.<fn>) ---
function parseRoutes(mod) {
  const txt = read(join(BE, 'routes', `${mod}.routes.js`));
  if (!txt) return [];
  // Cho phép 0..n middleware đứng trước controller, kể cả middleware dạng gọi hàm: uploadChungTu.single('file')
  const re = /router\.(\w+)\(\s*[`'"]([^`'"]+)[`'"]\s*,\s*(?:[\w.]+(?:\([^)]*\))?\s*,\s*)*controller\.(\w+)/g;
  const out = [];
  let m;
  while ((m = re.exec(txt))) out.push({ http: m[1].toUpperCase(), path: m[2], ctrl: m[3] });
  return out;
}

// --- BUS (controller): controller.<fn> -> service.<fn> ---
function parseController(mod) {
  const txt = read(join(BE, 'controllers', `${mod}.controller.js`));
  if (!txt) return {};
  const re = /export\s+async\s+function\s+(\w+)[\s\S]*?service\.(\w+)\(/g;
  const map = {};
  let m;
  while ((m = re.exec(txt))) map[m[1]] = m[2];
  return map;
}

// --- BUS (service): service.<fn> -> executeProcedure('dbo.SP_X') ---
function parseService(mod) {
  const txt = read(join(BE, 'services', `${mod}.service.js`));
  if (!txt) return {};
  const re = /export\s+async\s+function\s+(\w+)\s*\([\s\S]*?executeProcedure\(\s*[`'"]([\w.]+)[`'"]/g;
  const map = {};
  let m;
  while ((m = re.exec(txt))) map[m[1]] = m[2].replace(/^dbo\./, '');
  return map;
}

// --- DAO: tập hợp mọi SP được CREATE trong các file .sql ---
function definedProcedures() {
  const set = new Set();
  for (const f of readdirSync(SQLDIR).filter((x) => x.endsWith('.sql'))) {
    const txt = read(join(SQLDIR, f)) || '';
    const re = /CREATE\s+(?:OR\s+ALTER\s+)?PROCEDURE\s+(?:dbo\.)?(\w+)/gi;
    let m;
    while ((m = re.exec(txt))) set.add(m[1]);
  }
  return set;
}

function main() {
  const mod = process.argv[2];
  if (!mod) {
    console.log('Cac module co the quet:\n  ' + listModules().join('\n  '));
    console.log('\nVi du: node scripts/trace-layers.mjs datCoc');
    return;
  }

  const api = parseApi(mod);
  const routes = parseRoutes(mod);
  const ctrl = parseController(mod);
  const svc = parseService(mod);
  const defined = definedProcedures();

  const apiByUrl = new Map(api.map((a) => [`${a.http} ${a.url}`, a.fn]));

  console.log(`\n================ SO DO 3 LOP: module "${mod}" ================`);
  console.log('GUI(api.js) -> ROUTE -> CONTROLLER -> SERVICE -> SP(DAO)  [trang thai SP]\n');

  for (const r of routes) {
    const svcFn = ctrl[r.ctrl];
    const sp = svcFn ? svc[svcFn] : undefined;
    const guiFn =
      apiByUrl.get(`${r.http} ${r.path}`) ||
      apiByUrl.get(`${r.http} /${mod.replace(/([A-Z])/g, '-$1').toLowerCase()}${r.path}`) ||
      '(chua noi GUI)';
    let spLabel = sp || '(service khong goi SP)';
    if (sp) spLabel += defined.has(sp) ? '  [OK da co]' : '  [THIEU - chua tao SP]';

    console.log(`${r.http} ${r.path}`);
    console.log(`   GUI       : ${guiFn}`);
    console.log(`   controller: ${r.ctrl || '-'}`);
    console.log(`   service   : ${svcFn || '(route khong tro toi service?)'}`);
    console.log(`   SP (DAO)  : ${spLabel}\n`);
  }

  // Liệt kê SP còn thiếu (service gọi nhưng chưa có trong .sql)
  const missing = [...new Set(Object.values(svc))].filter((sp) => !defined.has(sp));
  if (missing.length) {
    console.log('---- SP service dang goi nhung CHUA co trong file .sql ----');
    missing.forEach((sp) => console.log('   - ' + sp));
  } else {
    console.log('Tat ca SP ma service goi deu da co trong file .sql.');
  }
}

main();
