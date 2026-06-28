import * as service from '../services/lichXemPhong.service.js';

export async function createLichXemPhong(req, res, next) {
  try {
    res.status(201).json(await service.createLichXemPhong(req.body));
  } catch (err) {
    next(err);
  }
}

export async function getLichXemPhong(req, res, next) {
  try {
    res.json(await service.getLichXemPhong());
  } catch (err) {
    next(err);
  }
}

export async function yeuCauDieuChinhLich(req, res, next) {
  try {
    res.json(await service.yeuCauDieuChinhLich(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function capNhatLichXemPhong(req, res, next) {
  try {
    res.json(await service.capNhatLichXemPhong(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function getPhongPhuHop(req, res, next) {
  try {
    const { maDangKy } = req.query;
    res.json(await service.getPhongPhuHop(maDangKy));
  } catch (err) {
    next(err);
  }
}
