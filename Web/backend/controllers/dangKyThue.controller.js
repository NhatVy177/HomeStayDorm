import * as service from '../services/dangKyThue.service.js';

function isSaleUser(user = {}) {
  return (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Sale') || user?.vaiTro === 'NhanVienSale';
}

function ensureSale(req, res) {
  if (!isSaleUser(req.user)) {
    res.status(403).json({ message: 'Chỉ nhân viên Sale mới được thực hiện thao tác này.' });
    return false;
  }
  return true;
}

// UC: Gửi thông tin đăng ký thuê
// khachHangId lấy từ req.user (middleware requireAuth đã xác thực), KHÔNG nhận từ body
export async function createHoSoDangKy(req, res, next) {
  try {
    const data = {
      ...req.body,
      khachHangId: req.user?.maNguoiDung  // lấy từ tài khoản đang đăng nhập
    };
    res.status(201).json(await service.createHoSoDangKy(data));
  } catch (err) {
    next(err);
  }
}

export async function getHoSoDangKy(req, res, next) {
  try {
    const query = { ...req.query };
    if (req.user?.chucVu === 'Sale' && req.user?.maChiNhanh) {
      query.maChiNhanh = req.user.maChiNhanh;
    } else if (req.user?.vaiTro === 'KhachHang') {
      query.khachHangId = req.user.maNguoiDung;
    }
    res.json(await service.getHoSoDangKy(query));
  } catch (err) {
    next(err);
  }
}

export async function kiemTraKhachHangTonTai(req, res, next) {
  try {
    res.json(await service.kiemTraKhachHangTonTai(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getPhongGiuongKhaDung(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    res.json(await service.getPhongGiuongKhaDung(req.query));
  } catch (err) {
    next(err);
  }
}

export async function traCuuPhong(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    res.json(await service.traCuuPhong(req.query));
  } catch (err) {
    next(err);
  }
}

export async function kiemTraDieuKienThue(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    res.json(await service.kiemTraDieuKienThue(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function capNhatKetQuaXuLy(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    const data = {
      ...req.body,
      nhanVienSaleId: req.user?.maNguoiDung
    };
    res.json(await service.capNhatKetQuaXuLy(req.params.id, data));
  } catch (err) {
    next(err);
  }
}

export async function tiepNhanHoSoDangKy(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    const nhanVienSaleId = req.user?.maNguoiDung;
    res.json(await service.tiepNhanHoSoDangKy(req.params.id, nhanVienSaleId));
  } catch (err) {
    next(err);
  }
}

export async function huyTiepNhanHoSoDangKy(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    const nhanVienSaleId = req.user?.maNguoiDung;
    res.json(await service.huyTiepNhanHoSoDangKy(req.params.id, nhanVienSaleId));
  } catch (err) {
    next(err);
  }
}

export async function taoHoSoKhachVangLai(req, res, next) {
  try {
    if (!ensureSale(req, res)) return;
    const nhanVienSaleId = req.user?.maNguoiDung;
    res.status(201).json(await service.taoHoSoKhachVangLai(req.body, nhanVienSaleId));
  } catch (err) {
    next(err);
  }
}
