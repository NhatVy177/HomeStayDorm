/**
 * Data Transfer Objects (DTO) for HopDongThue feature.
 * Decouples the database schema naming convention from the presentation layer API.
 */

export class PhieuDatCocDTO {
  constructor(dbRow) {
    this.maPhieuDatCoc = dbRow.MaPhieuDatCoc;
    this.thoiDiemDatCoc = dbRow.ThoiDiemDatCoc;
    this.thoiGianNhanPhong = dbRow.ThoiGianNhanPhong;
    this.hinhThucThue = dbRow.HinhThucThue;
    this.trangThaiCoc = dbRow.TrangThaiCoc;
    this.trangThaiThanhToan = dbRow.TrangThaiThanhToan;
    this.soTienCoc = dbRow.SoTienCoc;
    
    // Khach hang
    this.maKhachHang = dbRow.MaKhachHang;
    this.hoTenKhachHang = dbRow.HoTenKhachHang;
    this.ngaySinh = dbRow.NgaySinh;
    this.gioiTinh = dbRow.GioiTinh;
    this.sdt = dbRow.SDT;
    this.email = dbRow.Email;
    this.cccd = dbRow.CCCD;
    this.quocTich = dbRow.QuocTich;

    // Room info
    this.maPhong = dbRow.MaPhong;
    this.tenPhong = dbRow.TenPhong;
    this.maGiuong = dbRow.MaGiuong;
    this.gioiTinhChoPhep = dbRow.GioiTinhChoPhep;
    this.maLoaiPhong = dbRow.MaLoaiPhong;
    this.tenLoaiPhong = dbRow.TenLoaiPhong;
    this.sucChuaToiDa = dbRow.SucChuaToiDa;
    this.giaThue = dbRow.GiaThue ?? dbRow.TongGiaThue;
    this.tongGiaThue = dbRow.TongGiaThue ?? dbRow.GiaThue;
    
    // Computed helper
    this.viTriThue = dbRow.ViTriThue || (dbRow.MaGiuong ? `${dbRow.MaPhong}-${dbRow.MaGiuong}` : dbRow.MaPhong);
    this.coTheLapHopDong = dbRow.CoTheLapHopDong === true || dbRow.CoTheLapHopDong === 1;
    this.maHoSoCuTru = dbRow.MaHoSoCuTru || null;
    this.trangThaiHoSoCuTru = dbRow.TrangThaiHoSoCuTru || 'Chưa cập nhật';
    this.ngayDuyetCuTru = dbRow.NgayDuyetCuTru || null;
  }

  static fromList(dbList = []) {
    return dbList.map(row => new PhieuDatCocDTO(row));
  }
}

export class DichVuDTO {
  constructor(dbRow) {
    this.maDichVu = dbRow.MaDichVu;
    this.tenDichVu = dbRow.TenDichVu;
    this.donViTinh = dbRow.DonViTinh;
    this.donGia = dbRow.DonGia;
    this.batBuoc = dbRow.BatBuoc === true || dbRow.BatBuoc === 1;
  }

  static fromList(dbList = []) {
    return dbList.map(row => new DichVuDTO(row));
  }
}

export class ThanhVienHopDongDTO {
  constructor(dbRow) {
    this.hoTen = dbRow.HoTen;
    this.ngaySinh = dbRow.NgaySinh;
    this.gioiTinh = dbRow.GioiTinh;
    this.cccd = dbRow.CCCD;
    this.sdt = dbRow.SDT;
    this.email = dbRow.Email;
    this.quocTich = dbRow.QuocTich;
    this.trangThaiKiemTra = dbRow.TrangThaiKiemTra;
    this.lyDo = dbRow.LyDo;
  }

  static fromList(dbList = []) {
    return dbList.map(row => new ThanhVienHopDongDTO(row));
  }
}

export class HopDongThueDTO {
  constructor(dbDetailResult) {
    const rawHd = dbDetailResult.hopDong || {};
    this.maHopDong = rawHd.MaHopDong;
    this.ngayKyHD = rawHd.NgayKyHD;
    this.thoiHanThue = rawHd.ThoiHanThue;
    this.trangThaiKy = rawHd.TrangThaiKy;
    this.kyThanhToan = rawHd.KyThanhToan;
    this.hinhThucThue = rawHd.HinhThucThue;
    this.soGiuongThue = rawHd.SoGiuongThue;
    this.tenPhong = rawHd.TenPhong;
    this.tenPhongDayDu = rawHd.TenPhongDayDu;
    this.maPhong = rawHd.MaPhong;
    this.diaChiChiNhanh = rawHd.DiaChiChiNhanh;
    this.giaThueThang = rawHd.GiaThueThang;
    this.soTienCoc = rawHd.SoTienCoc;
    this.benChoThue = rawHd.BenChoThue;
    this.daiDienChoThue = rawHd.DaiDienChoThue;
    this.benThue = rawHd.BenThue;
    this.cccdBenThue = rawHd.CCCD_BenThue;
    this.maKhachHang = rawHd.MaKhachHang;

    // Members list
    this.thanhVien = (dbDetailResult.thanhVien || []).map(tv => ({
      hoTen: tv.HoTen,
      quanHe: tv.QuanHe,
      sdt: tv.SDT
    }));

    // Services list
    this.dichVu = (dbDetailResult.dichVu || []).map(dv => ({
      tenDichVu: dv.TenDichVu,
      donGia: dv.DonGia,
      donViTinh: dv.DonViTinh
    }));

    // Terms list (from QuiDinh table)
    this.dieuKhoan = (dbDetailResult.dieuKhoan || []).map(dk => ({
      maQuyDinh: dk.MaQuyDinh,
      tieuDeNoiQuy: dk.TieuDeNoiQuy,
      noiDung: dk.NoiDung
    }));

    // Violation clauses (from DieuKhoanViPham table)
    this.dieuKhoanViPham = (dbDetailResult.dieuKhoanViPham || []).map(dk => ({
      maDieuKhoan: dk.MaDieuKhoan,
      tenDieuKhoan: dk.TenDieuKhoan,
      hinhThucXuPhat: dk.HinhThucXuPhat,
      mucPhat: dk.MucPhat
    }));

    // Deposit refund policies
    this.quyDinhHoanCoc = (dbDetailResult.quyDinhHoanCoc || []).map(qh => ({
      maQuyDinhHoanCoc: qh.MaQuyDinhHoanCoc,
      tenQuyDinh: qh.TenQuyDinh,
      tyLeHoanCoc: qh.TyLeHoanCoc
    }));
  }
}
