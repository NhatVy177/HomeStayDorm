import { kiemTraTraPhongService } from '../services/kiemTraTraPhong.service.js';

export const quanLyDanhSachChoXuLy = async (req, res, next) => {
  try {
    const maNhanVien = req.user.maNguoiDung;
    const trangThaiLoc = req.query.trangThaiLoc || 'Chờ xử lý';
    const data = await kiemTraTraPhongService.quanLyDanhSachChoXuLy(maNhanVien, trangThaiLoc);
    res.json({ danhSach: data });
  } catch (error) {
    next(error);
  }
};

export const quanLyChiTietPhieu = async (req, res, next) => {
  try {
    const { maPhieuTra } = req.params;
    const maNhanVien = req.user.maNguoiDung;
    const data = await kiemTraTraPhongService.quanLyChiTietPhieu(maPhieuTra, maNhanVien);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const quanLyXacNhanHuyCoc = async (req, res, next) => {
  try {
    const { maPhieuTra } = req.body;
    const maNhanVien = req.user.maNguoiDung;
    await kiemTraTraPhongService.quanLyXacNhanHuyCoc(maPhieuTra, maNhanVien);
    res.status(200).json({ message: 'Xác nhận hủy cọc thành công.' });
  } catch (error) {
    next(error);
  }
};

export const quanLyLapBienBanKiemTra = async (req, res, next) => {
  try {
    const { maPhieuTra, ngayTraThucTe, tinhTrangPhong, dsHuHong } = req.body;
    const maNhanVien = req.user.maNguoiDung;
    await kiemTraTraPhongService.quanLyLapBienBanKiemTra(maPhieuTra, maNhanVien, ngayTraThucTe, tinhTrangPhong, dsHuHong);
    res.status(201).json({ message: 'Lập biên bản kiểm tra thành công.' });
  } catch (error) {
    next(error);
  }
};
