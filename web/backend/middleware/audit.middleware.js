import { ghiNhatKy } from '../services/audit.service.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const methodActions = {
  POST: 'Tạo mới',
  PUT: 'Cập nhật',
  PATCH: 'Cập nhật',
  DELETE: 'Xóa/Vô hiệu hóa'
};

function compactBody(body = {}) {
  if (!body || typeof body !== 'object') return body || null;

  const hiddenKeys = new Set(['matKhau', 'password', 'token', 'base64', 'anhPhong', 'file', 'minhChungBase64']);
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => {
      if (hiddenKeys.has(key)) return [key, '[ẩn]'];
      if (typeof value === 'string' && value.length > 500) return [key, `${value.slice(0, 500)}...`];
      return [key, value];
    })
  );
}

function findObjectId(req, responseBody) {
  const candidates = [
    ...Object.values(req.params || {}),
    req.body?.id,
    req.body?.ma,
    req.body?.maDangKy,
    req.body?.maLichXem,
    req.body?.maPhieuDatCoc,
    req.body?.maHopDong,
    req.body?.maHoaDon,
    responseBody?.id,
    responseBody?.maDangKy,
    responseBody?.maLichXem,
    responseBody?.maPhieuDatCoc,
    responseBody?.maHopDong,
    responseBody?.maHoaDon
  ];

  const fromCandidates = candidates.find((value) => value !== undefined && value !== null && value !== '');
  if (fromCandidates) return String(fromCandidates);

  const pathParts = String(req.originalUrl || req.url || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean);

  return [...pathParts].reverse().find((part) => /^[A-Z]{1,4}\d{2,}|^\d+$|^[A-Z]{1,4}\d{2,}-?\d*$/i.test(part)) || null;
}

export function auditMutations({ chucNang, doiTuong }) {
  return (req, res, next) => {
    if (!MUTATION_METHODS.has(req.method)) {
      return next();
    }

    const originalJson = res.json.bind(res);
    let responseBody = null;

    res.json = (body) => {
      responseBody = body;
      return originalJson(body);
    };

    res.on('finish', () => {
      if (res.statusCode >= 400) return;

      void ghiNhatKy({
        user: req.user,
        chucNang,
        hanhDong: methodActions[req.method] || req.method,
        doiTuong,
        maDoiTuong: findObjectId(req, responseBody),
        duLieuSau: {
          request: compactBody(req.body),
          response: compactBody(responseBody)
        },
        noiDung: {
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode
        }
      });
    });

    return next();
  };
}
