import * as service from '../services/datCoc.service.js';

export async function createPhieuDatCoc(req, res, next) {
  try { res.status(201).json(await service.createPhieuDatCoc(req.body)); } catch (err) { next(err); }
}
export async function getPhieuDatCoc(req, res, next) {
  try { res.json(await service.getPhieuDatCoc(req.user.maNguoiDung)); } catch (err) { next(err); }
}
export async function xacNhanKhaNangNhanCoc(req, res, next) {
  try { res.json(await service.xacNhanKhaNangNhanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function phatHanhYeuCauThanhToanCoc(req, res, next) {
  try { res.json(await service.phatHanhYeuCauThanhToanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function capNhatMinhChungThanhToanCoc(req, res, next) {
  try { res.json(await service.capNhatMinhChungThanhToanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function xacNhanThanhToanCoc(req, res, next) {
  try { res.json(await service.xacNhanThanhToanCoc(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function guiYeuCauDatCoc(req, res, next) {
  try { res.status(200).json(await service.guiYeuCauDatCoc(req.body)); } catch (err) { next(err); }
}
export async function getDanhSachChoXacNhan(req, res, next) {
  try { res.json(await service.getDanhSachChoXacNhan()); } catch (err) { next(err); }
}
export async function getDanhSachChoLapPhieu(req, res, next) {
  try { res.json(await service.getDanhSachChoLapPhieu()); } catch (err) { next(err); }
}
