import * as service from '../services/auth.service.js';
import { ghiNhatKy } from '../services/audit.service.js';

function getToken(req) {
  const authorization = req.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

export async function dangKy(req, res, next) {
  try {
    res.status(201).json(await service.dangKy(req.body));
  } catch (err) {
    next(err);
  }
}

export async function dangNhap(req, res, next) {
  try {
    const result = await service.dangNhap(req.body);
    res.json(result);
  } catch (err) {
    await ghiNhatKy({
      chucNang: 'Xác thực',
      hanhDong: 'Đăng nhập thất bại',
      doiTuong: 'TaiKhoan',
      maDoiTuong: req.body?.tenDangNhap,
      noiDung: {
        tenDangNhap: req.body?.tenDangNhap,
        ketQua: 'Thất bại',
        lyDo: err.message
      }
    });
    next(err);
  }
}

export async function kiemTraSoDienThoai(req, res, next) {
  try {
    res.json(await service.kiemTraSoDienThoai(req.query.sdt));
  } catch (err) {
    next(err);
  }
}

export function getToi(req, res) {
  res.json(req.user);
}

export async function dangXuat(req, res) {
  await service.dangXuat(getToken(req));
  res.status(204).send();
}
