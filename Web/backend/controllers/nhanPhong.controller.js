import * as service from '../services/nhanPhong.service.js';

export async function getDanhSachChoNhanPhong(req, res, next) {
  try { res.json(await service.getDanhSachChoNhanPhong(req.user.maNguoiDung)); } catch (err) { next(err); }
}

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
export async function getDanhSachHDChoThuDauKy(req, res, next) {
  try { res.json(await service.getDanhSachHDChoThuDauKy()); } catch (err) { next(err); }
}
export async function ghiNhanThuDauKy(req, res, next) {
  try { res.status(201).json(await service.ghiNhanThuDauKy({ ...req.body, maNhanVienKeToan: req.user.maNguoiDung })); } catch (err) { next(err); }
}
