import { banGiaoRaService } from '../services/GhiNhanBanGiaoRa.service.js';

export const getDanhSachBanGiaoRa = async (req, res, next) => {
  try {
    const maNhanVien = req.user.maNguoiDung;
    const status = req.query.status || 'Chờ bàn giao';
    const danhSach = await banGiaoRaService.getDanhSachBanGiaoRa(maNhanVien, status);
    res.json({ success: true, danhSach });
  } catch (error) {
    next(error);
  }
};

export const getChiTietBanGiaoRa = async (req, res, next) => {
  try {
    const maNhanVien = req.user.maNguoiDung;
    const { maPhieuTra } = req.params;
    if (!maPhieuTra) {
      return res.status(400).json({ success: false, message: 'Thiếu mã phiếu trả' });
    }
    const data = await banGiaoRaService.getChiTietBanGiaoRa(maPhieuTra, maNhanVien);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const ghiNhanBanGiaoRa = async (req, res, next) => {
  try {
    const maNhanVien = req.user.maNguoiDung;
    const { maPhieuTra, danhSachBanGiao } = req.body;

    if (!maPhieuTra) {
      return res.status(400).json({ success: false, message: 'Thiếu mã phiếu trả' });
    }

    const jsonBanGiaoRa = danhSachBanGiao && danhSachBanGiao.length > 0 
      ? JSON.stringify(danhSachBanGiao) 
      : null;

    const result = await banGiaoRaService.ghiNhanBanGiaoRa(maPhieuTra, maNhanVien, jsonBanGiaoRa);
    res.json({ success: true, message: result?.message || 'Ghi nhận bàn giao ra thành công', result });
  } catch (error) {
    next(error);
  }
};
