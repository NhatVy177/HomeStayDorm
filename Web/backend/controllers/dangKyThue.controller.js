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
    res.json(await service.getHoSoDangKy());
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

export async function kiemTraDieuKienThue(req, res, next) {
  try {
    res.json(await service.kiemTraDieuKienThue(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function capNhatKetQuaXuLy(req, res, next) {
  try {
    res.json(await service.capNhatKetQuaXuLy(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}
