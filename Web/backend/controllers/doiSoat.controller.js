import doiSoatService from '../services/doiSoat.service.js';

export async function getDanhSachChoDoiSoat(req, res, next) {
  try {
    const danhSach = await doiSoatService.getDanhSachChoDoiSoat();
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getChiTietPhieuTraPhong(req, res, next) {
  try {
    const { maPhieuTra } = req.params;
    const data = await doiSoatService.getChiTietPhieuTraPhong(maPhieuTra);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function taoDoiSoat(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await doiSoatService.taoDoiSoat(req.body, maNhanVienKeToan);
    res.status(201).json({
      message: 'Lập phiếu đối soát trả phòng thành công.',
      doiSoat: data
    });
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachChoHoanCoc(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await doiSoatService.getDanhSachChoHoanCoc(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachChoThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await doiSoatService.getDanhSachChoThuThem(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getChiTietThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const { maDoiSoat } = req.params;
    const data = await doiSoatService.getChiTietThuThem(maDoiSoat, maNhanVienKeToan);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function xacNhanThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await doiSoatService.xacNhanThuThem(req.body, maNhanVienKeToan);
    res.json({
      message: 'Ghi nhận thu thêm thành công.',
      doiSoat: data
    });
  } catch (error) {
    next(error);
  }
}

export async function getChiTietHoanCoc(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const { maDoiSoat } = req.params;
    const data = await doiSoatService.getChiTietHoanCoc(maDoiSoat, maNhanVienKeToan);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function xacNhanHoanCoc(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await doiSoatService.xacNhanHoanCoc(req.body, maNhanVienKeToan);
    res.json({
      message: 'Ghi nhận hoàn cọc thành công.',
      doiSoat: data
    });
  } catch (error) {
    next(error);
  }
}
