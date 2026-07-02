import { capNhatTraPhongService } from '../services/capnhattraphong.service.js';

export const getDanhSachHoanTat = async (req, res, next) => {
  try {
    const maNhanVien = req.user?.maNguoiDung || 'NV0011';
    const danhSach = await capNhatTraPhongService.getDanhSachHoanTat(maNhanVien);
    res.json({ success: true, danhSach });
  } catch (error) {
    next(error);
  }
};

export const getChiTietHoanTat = async (req, res, next) => {
  try {
    const maNhanVien = req.user?.maNguoiDung || 'NV0011';
    const { maPhieuTra } = req.params;
    if (!maPhieuTra) {
      return res.status(400).json({ success: false, message: 'Thiếu mã phiếu trả' });
    }
    const data = await capNhatTraPhongService.getChiTietHoanTat(maPhieuTra, maNhanVien);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const capNhatHoanTat = async (req, res, next) => {
  try {
    const maNhanVien = req.user?.maNguoiDung || 'NV0011';
    const { maPhieuTra, danhSachBanGiao } = req.body;

    if (!maPhieuTra) {
      return res.status(400).json({ success: false, message: 'Thiếu mã phiếu trả' });
    }

    const jsonBanGiaoRa = danhSachBanGiao && danhSachBanGiao.length > 0 
      ? JSON.stringify(danhSachBanGiao) 
      : null;

    await capNhatTraPhongService.capNhatHoanTat(maPhieuTra, maNhanVien, jsonBanGiaoRa);
    res.json({ success: true, message: 'Cập nhật hoàn tất thành công' });
  } catch (error) {
    next(error);
  }
};
