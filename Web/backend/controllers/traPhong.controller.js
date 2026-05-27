import * as service from '../services/traPhong.service.js';

export async function dangKyLichTraPhong(req, res, next) {
  try { res.status(201).json(await service.dangKyLichTraPhong(req.body)); } catch (err) { next(err); }
}
export async function lapBienBanKiemTraTraPhong(req, res, next) {
  try { res.status(201).json(await service.lapBienBanKiemTraTraPhong(req.body)); } catch (err) { next(err); }
}
export async function xuLyQuyetToanTraPhong(req, res, next) {
  try { res.status(201).json(await service.xuLyQuyetToanTraPhong(req.body)); } catch (err) { next(err); }
}
export async function ghiNhanThanhLyHopDong(req, res, next) {
  try { res.json(await service.ghiNhanThanhLyHopDong(req.body)); } catch (err) { next(err); }
}
