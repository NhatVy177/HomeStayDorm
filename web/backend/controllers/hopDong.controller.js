import * as service from '../services/hopDong.service.js';

/**
 * Presentation Layer - Backend Controller.
 * Handles HTTP requests, extracts parameters, and sends responses.
 */

export async function traCuuPhieuCoc(req, res, next) {
  try {
    const { tuKhoa, trangThaiCoc, ngayTao } = req.query;
    const result = await service.traCuuPhieuCoc(tuKhoa, trangThaiCoc, ngayTao);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function layChiTietPhieuCoc(req, res, next) {
  try {
    const result = await service.layChiTietPhieuCoc(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function kiemTraDieuKienLapHopDong(req, res, next) {
  try {
    const result = await service.kiemTraDieuKienLapHopDong(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function layHoSoCuTruDaDuyetTheoPhieuCoc(req, res, next) {
  try {
    const result = await service.layHoSoCuTruDaDuyetTheoPhieuCoc(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function layDanhSachDichVu(req, res, next) {
  try {
    const result = await service.layDanhSachDichVu();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function kiemTraThanhVienHopDongTam(req, res, next) {
  try {
    const result = await service.kiemTraThanhVienHopDongTam(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function lapHopDongThue(req, res, next) {
  try {
    const result = await service.lapHopDongThue(req.body, req.user || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function layChiTietHopDongThue(req, res, next) {
  try {
    const result = await service.layChiTietHopDongThue(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function layChiTietHopDongTheoPhieuCoc(req, res, next) {
  try {
    const result = await service.layChiTietHopDongTheoPhieuCoc(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function layDanhSachQuanLy(req, res, next) {
  try {
    const result = await service.layDanhSachQuanLy();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
