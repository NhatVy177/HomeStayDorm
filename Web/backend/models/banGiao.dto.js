function boolValue(value) {
  return value === true || value === 1;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export class HopDongBanGiaoDTO {
  constructor(row = {}) {
    this.maHopDong = row.MaHopDong;
    this.trangThaiHopDong = row.TrangThaiHopDong;
    this.ngayBatDau = row.NgayBatDau;
    this.thoiHanThue = row.ThoiHanThue;
    this.maKhachHang = row.MaKhachHang;
    this.hoTenKhachHang = row.HoTenKhachHang;
    this.sdt = row.SDT;
    this.soNguoiO = Math.max(numberOrZero(row.SoNguoiO), 1);
    this.maPhong = row.MaPhong;
    this.tenPhong = row.TenPhong;
    this.tenChiNhanh = row.TenChiNhanh;
    this.danhSachGiuong = row.DanhSachGiuong;
    this.tinhTrangGiuong = row.TinhTrangGiuong;
    this.trangThaiHoaDonKyDau = row.TrangThaiHoaDonKyDau;
    this.daCoBienBanBanGiaoVao = boolValue(row.DaCoBienBanBanGiaoVao);
    this.coTheBanGiao = boolValue(row.CoTheBanGiao);
  }
}

export class TaiSanBanGiaoDTO {
  constructor(row = {}) {
    this.maPhong = row.MaPhong;
    this.tenPhong = row.TenPhong;
    this.maGiuong = row.MaGiuong;
    this.maTaiSan = row.MaTaiSan;
    this.tenTaiSan = row.TenTaiSan;
    this.soLuongHeThong = numberOrZero(row.SoLuongHeThong ?? row.SoLuong);
    this.soLuongThucTe = row.SoLuongThucTe == null ? numberOrZero(row.SoLuongHeThong ?? row.SoLuong) : numberOrZero(row.SoLuongThucTe);
    this.ghiChu = row.GhiChu || '';
  }

  static fromList(rows = []) {
    return rows.map((row) => new TaiSanBanGiaoDTO(row));
  }
}

export class KetQuaLapBienBanBanGiaoDTO {
  constructor(result = {}, summary = null) {
    this.maBienBan = result.maBienBan;
    this.maLoi = result.maLoi;
    this.thongBao = result.thongBao;
    this.ketQua = summary
      ? {
          maBienBan: summary.MaBienBan,
          maHopDong: summary.MaHopDong,
          hoTenKhachHang: summary.HoTenKhachHang,
          tenPhong: summary.TenPhong,
          danhSachGiuong: summary.DanhSachGiuong,
          ngayBanGiao: summary.NgayBanGiao,
          loaiBanGiao: summary.LoaiBanGiao,
          trangThaiPhong: summary.TrangThaiPhong,
          soTaiSanBanGiao: numberOrZero(summary.SoTaiSanBanGiao)
        }
      : null;
  }
}
