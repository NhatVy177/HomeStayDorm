import { executeProcedure, sql } from '../database/connection.js';

function serializeJson(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export async function traCuuPhieuCocCapNhatCuTru({ tuKhoa = null } = {}) {
  const result = await executeProcedure('dbo.SP_TraCuuPhieuCocCapNhatCuTru', [
    { name: 'TuKhoa', type: sql.NVarChar(100), value: tuKhoa || null }
  ]);
  return result.recordset || [];
}

export async function luuHoSoCuTru(data = {}) {
  const result = await executeProcedure('dbo.SP_LuuHoSoCuTru', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: data.maPhieuDatCoc },
    { name: 'MaNhanVienSale', type: sql.VarChar(6), value: data.maNhanVienSale },
    { name: 'DaDoiChieuGiayTo', type: sql.Bit, value: data.daDoiChieuGiayTo ? 1 : 0 },
    { name: 'GhiChu', type: sql.NVarChar(500), value: data.ghiChu || null },
    { name: 'DanhSachThanhVienJson', type: sql.NVarChar(sql.MAX), value: serializeJson(data.danhSachThanhVien) }
  ]);

  return {
    hoSo: result.recordsets?.[0]?.[0] || result.recordset?.[0] || null,
    thanhVien: result.recordsets?.[1] || []
  };
}

export async function guiDuyetHoSoCuTru(maHoSoCuTru) {
  const result = await executeProcedure('dbo.SP_GuiDuyetHoSoCuTru', [
    { name: 'MaHoSoCuTru', type: sql.VarChar(6), value: maHoSoCuTru }
  ]);
  return result.recordset?.[0] || null;
}

export async function layDanhSachHoSoCuTruChoDuyet({ tuKhoa = null, trangThai = null } = {}) {
  const result = await executeProcedure('dbo.SP_DanhSachHoSoCuTruChoDuyet', [
    { name: 'TuKhoa', type: sql.NVarChar(100), value: tuKhoa || null },
    { name: 'TrangThaiHoSo', type: sql.NVarChar(30), value: trangThai || null }
  ]);
  return result.recordset || [];
}

export async function layChiTietHoSoCuTru(maHoSoCuTru) {
  const result = await executeProcedure('dbo.SP_LayChiTietHoSoCuTru', [
    { name: 'MaHoSoCuTru', type: sql.VarChar(6), value: maHoSoCuTru }
  ]);

  return {
    hoSo: result.recordsets?.[0]?.[0] || null,
    thanhVien: result.recordsets?.[1] || []
  };
}

export async function duyetHoSoCuTru(data = {}) {
  const result = await executeProcedure('dbo.SP_DuyetHoSoCuTru', [
    { name: 'MaHoSoCuTru', type: sql.VarChar(6), value: data.maHoSoCuTru },
    { name: 'MaNhanVienQuanLy', type: sql.VarChar(6), value: data.maNhanVienQuanLy },
    { name: 'KetQua', type: sql.NVarChar(30), value: data.ketQua },
    { name: 'GhiChuQuanLy', type: sql.NVarChar(500), value: data.ghiChuQuanLy || null },
    { name: 'DanhSachKetQuaThanhVienJson', type: sql.NVarChar(sql.MAX), value: serializeJson(data.danhSachKetQuaThanhVien) }
  ]);

  return {
    hoSo: result.recordsets?.[0]?.[0] || result.recordset?.[0] || null,
    thanhVien: result.recordsets?.[1] || []
  };
}
