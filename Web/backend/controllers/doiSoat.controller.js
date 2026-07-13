import doiSoatService from '../services/doiSoat.service.js';
import hoanCocDoiSoatService from '../services/hoanCocDoiSoat.service.js';
import thuThemDoiSoatService from '../services/thuThemDoiSoat.service.js';

export async function uploadChungTuThanhToan(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await doiSoatService.uploadChungTuThanhToan(req.body, maNhanVienKeToan);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachChoDoiSoat(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await doiSoatService.getDanhSachChoDoiSoat(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getChiTietPhieuTraPhong(req, res, next) {
  try {
    const { maPhieuTra } = req.params;
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await doiSoatService.getChiTietPhieuTraPhong(maPhieuTra, maNhanVienKeToan);
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
    const danhSach = await hoanCocDoiSoatService.getDanhSachChoHoanCoc(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachDaHoanCoc(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await hoanCocDoiSoatService.getDanhSachDaHoanCoc(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachChoThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await thuThemDoiSoatService.getDanhSachChoThuThem(maNhanVienKeToan, req.query?.filter);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachDaThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await thuThemDoiSoatService.getDanhSachDaThuThem(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getKetQuaDoiSoat(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const danhSach = await doiSoatService.getKetQuaDoiSoat(maNhanVienKeToan);
    res.json({ danhSach });
  } catch (error) {
    next(error);
  }
}

export async function getChiTietThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const { maDoiSoat } = req.params;
    const data = await thuThemDoiSoatService.getChiTietThuThem(maDoiSoat, maNhanVienKeToan);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function xacNhanThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await thuThemDoiSoatService.xacNhanThuThem(req.body, maNhanVienKeToan);
    res.json({
      message: 'Ghi nhận thu thêm thành công.',
      doiSoat: data
    });
  } catch (error) {
    next(error);
  }
}

export async function khongXacNhanThuThem(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await thuThemDoiSoatService.khongXacNhanThuThem(req.body, maNhanVienKeToan);
    res.json({
      message: 'Đã không xác nhận chứng từ. Khách hàng cần tải lại minh chứng thanh toán.',
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
    const data = await hoanCocDoiSoatService.getChiTietHoanCoc(maDoiSoat, maNhanVienKeToan);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function xacNhanHoanCoc(req, res, next) {
  try {
    const maNhanVienKeToan = req.user?.maNguoiDung;
    const data = await hoanCocDoiSoatService.xacNhanHoanCoc(req.body, maNhanVienKeToan);
    res.json({
      message: 'Ghi nhận hoàn cọc thành công.',
      doiSoat: data
    });
  } catch (error) {
    next(error);
  }
}
