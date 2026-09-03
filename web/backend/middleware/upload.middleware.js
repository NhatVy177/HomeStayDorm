import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Thư mục lưu ảnh chứng từ thanh toán cọc thật.
const CHUNG_TU_DIR = path.join(__dirname, '..', 'uploads', 'chung-tu');
fs.mkdirSync(CHUNG_TU_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CHUNG_TU_DIR),
  filename: (req, file, cb) => {
    const ma = String(req.params.id || 'PC').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(file.originalname).toLowerCase() || '.dat';
    cb(null, `${ma}-${Date.now()}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ok = /^image\/|application\/pdf$/.test(file.mimetype);
  cb(ok ? null : new Error('Chỉ chấp nhận file hình ảnh hoặc PDF'), ok);
}

// Đường dẫn công khai để lưu vào DB và hiển thị lại.
export function publicUrlFor(filename) {
  return `/uploads/chung-tu/${filename}`;
}

export const uploadChungTu = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
