import * as service from '../services/khachMoi.service.js';
import { getChiTietPhong } from '../services/phongKhamPha.service.js';

export async function getChiTietPhongHandler(req, res, next) {
  try {
    const phong = await getChiTietPhong(req.params.maPhong);
    if (!phong) return res.status(404).json({ message: 'Không tìm thấy phòng.' });
    res.json({ data: phong });
  } catch (error) {
    next(error);
  }
}


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

export async function getHoSoDetail(req, res, next) {
  try {
    res.json(await service.getHoSoDetail(req.user, req.params.id));
  } catch (error) {
    next(error);
  }
}

export async function updateHoSo(req, res, next) {
  try {
    res.json(await service.updateHoSo(req.user, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}

export async function getLichXemDetail(req, res, next) {
  try {
    res.json(await service.getLichXemDetail(req.user, req.params.id));
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

export async function getDatCoc(req, res, next) {
  try {
    res.json(await service.getDatCoc(req.user));
  } catch (error) {
    next(error);
  }
}

export async function uploadMinhChung(req, res, next) {
  try {
    res.json(await service.uploadMinhChungKhachHang(req.user, req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}

export async function getHopDongDashboard(req, res, next) {
  try {
    res.json(await service.getHopDongDashboard(req.user));
  } catch (error) {
    next(error);
  }
}
