import * as service from '../services/khachMoi.service.js';

export async function getTrangThai(req, res, next) {
  try {
    res.json(await service.getTrangThai(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getTongQuan(req, res, next) {
  try {
    res.json(await service.getTongQuan(req.user));
  } catch (error) {
    next(error);
  }
}

export async function getPhongKhaDung(req, res, next) {
  try {
    res.json(await service.getPhongKhaDung(req.user, req.query));
  } catch (error) {
    next(error);
  }
}

export async function createHoSo(req, res, next) {
  try {
    res.status(201).json(await service.createHoSo(req.user, req.body));
  } catch (error) {
    next(error);
  }
}

export async function yeuCauDieuChinhLich(req, res, next) {
  try {
    res.json(await service.yeuCauDieuChinhLich(req.user, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}
