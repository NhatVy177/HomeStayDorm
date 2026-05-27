import * as service from '../services/dangKyThue.service.js';

export async function createHoSoDangKy(req, res, next) {
  try {
    res.status(201).json(await service.createHoSoDangKy(req.body));
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
