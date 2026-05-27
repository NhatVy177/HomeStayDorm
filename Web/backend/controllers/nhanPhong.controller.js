import * as service from '../services/nhanPhong.service.js';

export async function capNhatThongTinCuTru(req, res, next) {
  try { res.status(201).json(await service.capNhatThongTinCuTru(req.body)); } catch (err) { next(err); }
}
export async function lapHopDongThue(req, res, next) {
  try { res.status(201).json(await service.lapHopDongThue(req.body)); } catch (err) { next(err); }
}
export async function ghiNhanKhoanThuNhanPhong(req, res, next) {
  try { res.status(201).json(await service.ghiNhanKhoanThuNhanPhong(req.body)); } catch (err) { next(err); }
}
export async function lapBienBanBanGiao(req, res, next) {
  try { res.status(201).json(await service.lapBienBanBanGiao(req.body)); } catch (err) { next(err); }
}
