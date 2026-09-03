import * as adminService from '../services/admin.service.js';

export async function getDanhSachNhanVien(req, res, next) {
  try {
    const query = {
      maNhanVien: req.query.maNhanVien,
      maChiNhanh: req.query.maChiNhanh,
      chucVu: req.query.chucVu,
      trangThaiTaiKhoan: req.query.trangThaiTaiKhoan,
      tuKhoa: req.query.tuKhoa
    };
    const data = await adminService.getDanhSachNhanVien(query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getChiTietNhanVien(req, res, next) {
  try {
    const data = await adminService.getChiTietNhanVien(req.params.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getMaNhanVienTiepTheo(req, res, next) {
  try {
    const data = await adminService.getMaNhanVienTiepTheo();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachChiNhanh(req, res, next) {
  try {
    const data = await adminService.getDanhSachChiNhanh({
      maChiNhanh: req.query.maChiNhanh,
      trangThai: req.query.trangThai
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function taoChiNhanh(req, res, next) {
  try {
    const data = await adminService.taoChiNhanh(req.body, req.user);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function capNhatChiNhanh(req, res, next) {
  try {
    const data = await adminService.capNhatChiNhanh(req.params.id, req.body, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function xoaChiNhanh(req, res, next) {
  try {
    const data = await adminService.xoaChiNhanh(req.params.id, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachLoaiPhong(req, res, next) {
  try {
    const data = await adminService.getDanhSachLoaiPhong({
      maLoaiPhong: req.query.maLoaiPhong
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachPhong(req, res, next) {
  try {
    const data = await adminService.getDanhSachPhong({
      maPhong: req.query.maPhong,
      maChiNhanh: req.query.maChiNhanh,
      maLoaiPhong: req.query.maLoaiPhong,
      tinhTrang: req.query.tinhTrang
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function taoPhongGiuong(req, res, next) {
  try {
    const data = await adminService.taoPhongGiuong(req.body, req.user);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function capNhatPhong(req, res, next) {
  try {
    const data = await adminService.capNhatPhong(req.params.id, req.body, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function xoaPhong(req, res, next) {
  try {
    const data = await adminService.xoaPhong(req.params.id, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function capNhatTrangThaiPhong(req, res, next) {
  try {
    const data = await adminService.capNhatTrangThaiPhongGiuong({
      loaiDoiTuong: 'PHONG',
      maPhong: req.params.id,
      trangThai: req.body.trangThai
    }, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function taoTaiKhoanNhanVien(req, res, next) {
  try {
    const data = await adminService.taoTaiKhoanNhanVien(req.body, req.user);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function khoaMoTaiKhoan(req, res, next) {
  try {
    const data = await adminService.khoaMoTaiKhoan({
      maNhanVien: req.params.id,
      isLocked: req.body.isLocked,
      adminId: req.user?.maNguoiDung
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function ganChucVuNhanVien(req, res, next) {
  try {
    const data = await adminService.ganChucVuNhanVien({
      maNhanVien: req.params.id,
      adminId: req.user?.maNguoiDung,
      ...req.body
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function capNhatThongTinNhanVien(req, res, next) {
  try {
    const data = await adminService.capNhatThongTinNhanVien({
      maNhanVien: req.params.id,
      adminId: req.user?.maNguoiDung,
      ...req.body
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function quanLyDichVu(req, res, next) {
  try {
    const data = await adminService.quanLyDichVu({
      ...req.query,
      ...req.body,
      adminId: req.user?.maNguoiDung
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function quanLyQuyDinhHoanCoc(req, res, next) {
  try {
    const data = await adminService.quanLyQuyDinhHoanCoc({
      ...req.query,
      ...req.body,
      adminId: req.user?.maNguoiDung
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function quanLyNoiQuy(req, res, next) {
  try {
    const data = await adminService.quanLyNoiQuy({
      ...req.query,
      ...req.body,
      adminId: req.user?.maNguoiDung
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function quanLyDieuKhoanViPham(req, res, next) {
  try {
    const data = await adminService.quanLyDieuKhoanViPham({
      ...req.query,
      ...req.body,
      adminId: req.user?.maNguoiDung
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getSettings(req, res, next) {
  try {
    const data = await adminService.getSettings();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const data = await adminService.updateSettings(req.body, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getDanhSachSaoLuu(req, res, next) {
  try {
    const data = await adminService.getDanhSachSaoLuu({
      soDong: req.query.soDong,
      trangThai: req.query.trangThai,
      loaiSaoLuu: req.query.loaiSaoLuu
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function saoLuuThuCong(req, res, next) {
  try {
    const data = await adminService.saoLuuThuCong(req.body, req.user);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function phucHoiDuLieu(req, res, next) {
  try {
    const data = await adminService.phucHoiDuLieu(req.params.id, req.body, req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function getNhatKyHeThong(req, res, next) {
  try {
    const data = await adminService.getNhatKyHeThong({
      tuNgay: req.query.tuNgay,
      denNgay: req.query.denNgay,
      adminId: req.query.adminId,
      doiTuong: req.query.doiTuong,
      hanhDong: req.query.hanhDong,
      tuKhoa: req.query.tuKhoa,
      soDong: req.query.soDong
    });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function quanLyGiuong(req, res, next) {
  try {
    const data = await adminService.quanLyGiuong({
      ...req.query,
      ...req.body,
      adminId: req.user?.maNguoiDung
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function quanLyTaiSanPhong(req, res, next) {
  try {
    const data = await adminService.quanLyTaiSanPhong({
      ...req.query,
      ...req.body,
      adminId: req.user?.maNguoiDung
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
