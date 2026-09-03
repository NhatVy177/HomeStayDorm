import * as service from '../services/suaChuaBaoTri.service.js';

export async function createYeuCauSuaChua(req, res, next) {
  try { res.status(201).json(await service.createYeuCauSuaChua(req.body)); } catch (err) { next(err); }
}
export async function getYeuCauSuaChua(req, res, next) {
  try { res.json(await service.getYeuCauSuaChua()); } catch (err) { next(err); }
}
export async function tiepNhanYeuCauSuaChua(req, res, next) {
  try { res.json(await service.tiepNhanYeuCauSuaChua(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function hoanTatYeuCauSuaChua(req, res, next) {
  try { res.json(await service.hoanTatYeuCauSuaChua(req.params.id, req.body)); } catch (err) { next(err); }
}
export async function tuChoiYeuCauSuaChua(req, res, next) {
  try { res.json(await service.tuChoiYeuCauSuaChua(req.params.id, req.body)); } catch (err) { next(err); }
}
