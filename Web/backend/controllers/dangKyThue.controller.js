import * as service from '../services/dangKyThue.service.js';

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
    res.json(await service.getPhongGiuongKhaDung(req.query));
  } catch (err) {
    next(err);
  }
}

export async function traCuuPhong(req, res, next) {
  try {
    res.json(await service.traCuuPhong(req.query));
  } catch (err) {
    next(err);
  }
}

export async function kiemTraDieuKienThue(req, res, next) {
  try {
    res.json(await service.kiemTraDieuKienThue(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function capNhatKetQuaXuLy(req, res, next) {
  try {
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
    const nhanVienSaleId = req.user?.maNguoiDung;
    res.json(await service.tiepNhanHoSoDangKy(req.params.id, nhanVienSaleId));
  } catch (err) {
    next(err);
  }
}

export async function huyTiepNhanHoSoDangKy(req, res, next) {
  try {
    const nhanVienSaleId = req.user?.maNguoiDung;
    res.json(await service.huyTiepNhanHoSoDangKy(req.params.id, nhanVienSaleId));
  } catch (err) {
    next(err);
  }
}

export async function taoHoSoKhachVangLai(req, res, next) {
  try {
    const nhanVienSaleId = req.user?.maNguoiDung;
    res.status(201).json(await service.taoHoSoKhachVangLai(req.body, nhanVienSaleId));
  } catch (err) {
    next(err);
  }
}
