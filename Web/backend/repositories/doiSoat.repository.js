import { sql } from '../database/connection.js';
import { execute } from './repositoryUtils.js';

export async function getDanhSachChoDoiSoat(db, maNhanVienKeToan) {
  const result = await execute(db, 'SP_TraPhong_KeToan_DanhSachChoDoiSoat', [
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: maNhanVienKeToan || null }
  ]);
  return result.recordset;
}

export async function hasDoiSoatDangXuLy(db, maPhieuTra) {
  const result = await execute(db, 'SP_TraPhong_KeToan_CoDoiSoatDangXuLy', [
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
  ]);

  return Boolean(result.recordset[0]?.hasDoiSoatDangXuLy);
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
    { name: 'LoaiQuyetToan', type: sql.NVarChar(30), value: data.loaiQuyetToan },
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
    { name: 'LoaiQuyetToan', type: sql.NVarChar(30), value: data.loaiQuyetToan },
    { name: 'GhiChuPhanHoiKhach', type: sql.NVarChar(500), value: data.ghiChuPhanHoiKhach || null },
    { name: 'MaNhanVienKeToan', type: sql.VarChar(6), value: data.maNhanVienKeToan },
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: data.maPhieuTra },
    { name: 'MaQuyDinhHoanCoc', type: sql.VarChar(6), value: data.maQuyDinhHoanCoc }
  ]);

  return result.recordset[0] || null;
}
