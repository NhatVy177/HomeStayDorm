import { sql } from '../database/connection.js';

function requestFrom(db) {
  return typeof db.request === 'function' ? db.request() : new sql.Request(db);
}

async function execute(db, procedureName, parameters = []) {
  const request = requestFrom(db);

  for (const parameter of parameters) {
    request.input(parameter.name, parameter.type, parameter.value);
  }

  return request.execute(procedureName);
}

export async function getDanhSachChoDoiSoat(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachChoDoiSoat', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);
  return result.recordset;
}

export async function getPhieuTraPhongById(db, maPhieuTra, lockForUpdate = false, maNhanVienKeToan = null) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayPhieuTraPhong', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra },
    { name: 'LockForUpdate', type: sql.Bit, value: lockForUpdate ? 1 : 0 },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset?.[0] || null;
}

export async function hasDoiSoatDangXuLy(db, maPhieuTra) {
  const result = await execute(db, 'SP_TraPhong_KeToan_CoDoiSoatDangXuLy', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
  ]);

  return Boolean(result.recordset[0]?.hasDoiSoatDangXuLy);
}

export async function getHopDongHoSo(db, maHopDong) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayHopDongHoSo', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return result.recordset?.[0] || null;
}

export async function getPhieuDatCocHoSo(db, maPhieuDatCoc) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayPhieuDatCocHoSo', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc }
  ]);

  return result.recordset[0] || null;
}

export async function getPhongTrongPhieuCoc(db, maPhieuDatCoc) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayPhongTrongPhieuCoc', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc }
  ]);

  return result.recordset;
}

export async function getTongChiPhiSuaChua(db, maPhieuTra) {
  const result = await execute(db, 'SP_TraPhong_KeToan_TongChiPhiSuaChua', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
  ]);

  return result.recordset[0] || { tongChiPhiSuaChua: 0, soBienBanKiemTra: 0 };
}

export async function getTienPhatChoXuLy(db, maHopDong) {
  if (!maHopDong) return 0;

  const result = await execute(db, 'SP_TraPhong_KeToan_TienPhatChoXuLy', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return result.recordset[0]?.tienPhat || 0;
}

export async function getTienHoaDonConNo(db, maHopDong) {
  if (!maHopDong) return 0;

  const result = await execute(db, 'SP_TraPhong_KeToan_TienHoaDonConNo', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return {
    tienThueConNo: result.recordset[0]?.tienThueConNo || result.recordset[0]?.tienHoaDonConNo || 0,
    tienDichVuConNo: result.recordset[0]?.tienDichVuConNo || 0
  };
}

export async function getChiTietKhauTru(db, maPhieuTra, maHopDong) {
  const result = await execute(db, 'SP_TraPhong_KeToan_ChiTietKhauTru', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra },
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong || null }
  ]);

  return {
    hoaDonConNo: result.recordsets[0] || [],
    chiTietHoaDon: result.recordsets[1] || [],
    bienBanKiemTra: result.recordsets[2] || [],
    chiTietHuHong: result.recordsets[3] || [],
    bienBanViPham: result.recordsets[4] || [],
    dichVuHopDong: result.recordsets[5] || []
  };
}

export async function getMaQuyDinhHoanCoc(db, tyLeHoanCocHienTai) {
  const result = await execute(db, 'SP_TraPhong_KeToan_LayMaQuyDinhHoanCoc', [
    { name: 'TyLeHoanCocHienTai', type: sql.Decimal(5, 2), value: tyLeHoanCocHienTai }
  ]);

  return result.recordset[0]?.maQuyDinhHoanCoc || null;
}

export async function generateMaDoiSoat(db) {
  const result = await execute(db, 'SP_TraPhong_KeToan_SinhMaDoiSoat');
  return result.recordset[0]?.maDoiSoat;
}

export async function insertDoiSoat(db, data) {
  await execute(db, 'SP_TraPhong_KeToan_InsertDoiSoat', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'TienCocBanDau', type: sql.Decimal(15, 2), value: data.tienCocBanDau },
    { name: 'SoThangLuuTru', type: sql.Decimal(5, 1), value: data.soThangLuuTru },
    { name: 'TyLeHoanCocHienTai', type: sql.Decimal(5, 2), value: data.tyLeHoanCocHienTai },
    { name: 'TienCocDuocHoan', type: sql.Decimal(15, 2), value: data.tienCocDuocHoan },
    { name: 'TienThueConNo', type: sql.Decimal(15, 2), value: data.tienThueConNo },
    { name: 'TienDichVuConNo', type: sql.Decimal(15, 2), value: data.tienDichVuConNo },
    { name: 'TongChiPhiSuaChua', type: sql.Decimal(15, 2), value: data.tongChiPhiSuaChua },
    { name: 'TienPhat', type: sql.Decimal(15, 2), value: data.tienPhat },
    { name: 'TongKhauTru', type: sql.Decimal(15, 2), value: data.tongKhauTru },
    { name: 'SoTienHoanThucTe', type: sql.Decimal(15, 2), value: data.soTienHoanThucTe },
    { name: 'SoTienKhachPhaiTT', type: sql.Decimal(15, 2), value: data.soTienKhachPhaiTT },
    { name: 'GhiChuPhanHoiKhach', type: sql.NVarChar(500), value: data.ghiChuPhanHoiKhach || null },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan },
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: data.maPhieuTra },
    { name: 'MaQuyDinhHoanCoc', type: sql.VarChar(6), value: data.maQuyDinhHoanCoc }
  ]);
}

export async function updateDoiSoatCanDieuChinh(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_UpdateDoiSoatCanDieuChinh', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'TienCocBanDau', type: sql.Decimal(15, 2), value: data.tienCocBanDau },
    { name: 'SoThangLuuTru', type: sql.Decimal(5, 1), value: data.soThangLuuTru },
    { name: 'TyLeHoanCocHienTai', type: sql.Decimal(5, 2), value: data.tyLeHoanCocHienTai },
    { name: 'TienCocDuocHoan', type: sql.Decimal(15, 2), value: data.tienCocDuocHoan },
    { name: 'TienThueConNo', type: sql.Decimal(15, 2), value: data.tienThueConNo },
    { name: 'TienDichVuConNo', type: sql.Decimal(15, 2), value: data.tienDichVuConNo },
    { name: 'TongChiPhiSuaChua', type: sql.Decimal(15, 2), value: data.tongChiPhiSuaChua },
    { name: 'TienPhat', type: sql.Decimal(15, 2), value: data.tienPhat },
    { name: 'TongKhauTru', type: sql.Decimal(15, 2), value: data.tongKhauTru },
    { name: 'SoTienHoanThucTe', type: sql.Decimal(15, 2), value: data.soTienHoanThucTe },
    { name: 'SoTienKhachPhaiTT', type: sql.Decimal(15, 2), value: data.soTienKhachPhaiTT },
    { name: 'GhiChuPhanHoiKhach', type: sql.NVarChar(500), value: data.ghiChuPhanHoiKhach || null },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan },
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: data.maPhieuTra },
    { name: 'MaQuyDinhHoanCoc', type: sql.VarChar(6), value: data.maQuyDinhHoanCoc }
  ]);

  return result.recordset[0] || null;
}

export async function getDanhSachChoHoanCoc(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachChoHoanCoc', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getDanhSachDaHoanCoc(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachDaHoanCoc', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getDanhSachChoThuThem(db, maNhanVienKeToan, boLocThuThem = 'all') {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachChoThuThem', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null },
    { name: 'BoLocThuThem', type: sql.VarChar(30), value: boLocThuThem || 'all' }
  ]);

  return result.recordset;
}

export async function getDanhSachDaThuThem(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachDaThuThem', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getKetQuaDoiSoat(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_KetQuaDoiSoat', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return result.recordset;
}

export async function getChiTietThuThem(db, maDoiSoat, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_ChiTietThuThem', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return {
    chiTiet: result.recordsets[0]?.[0] || null,
    danhSachPhong: result.recordsets[1] || []
  };
}

export async function xacNhanThuThem(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_XacNhanThuThem', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan || null },
    { name: 'PhuongThucThanhToan', type: sql.NVarChar(20), value: data.phuongThucThanhToan },
    { name: 'NgayThanhToan', type: sql.Date, value: data.ngayThanhToan },
    { name: 'ChungTuThanhToan', type: sql.VarChar(500), value: data.chungTuThanhToan || null }
  ]);

  return result.recordset[0] || null;
}

export async function khongXacNhanThuThem(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_KhongXacNhanThuThem', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan || null }
  ]);

  return result.recordset[0] || null;
}

export async function getChiTietHoanCoc(db, maDoiSoat, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_ChiTietHoanCoc', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);

  return {
    chiTiet: result.recordsets[0]?.[0] || null,
    danhSachPhong: result.recordsets[1] || []
  };
}

export async function xacNhanHoanCoc(db, data) {
  const result = await execute(db, 'SP_TraPhong_KeToan_XacNhanHoanCoc', [
    { name: 'MaDoiSoat', type: sql.VarChar(6), value: data.maDoiSoat },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan || null },
    { name: 'PhuongThucThanhToan', type: sql.NVarChar(20), value: data.phuongThucThanhToan },
    { name: 'NgayThanhToan', type: sql.Date, value: data.ngayThanhToan },
    { name: 'ChungTuThanhToan', type: sql.VarChar(500), value: data.chungTuThanhToan || null }
  ]);

  return result.recordset[0] || null;
}
