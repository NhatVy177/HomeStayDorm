import { executeProcedure, getPool, sql } from '../database/connection.js';

export async function traCuuHopDongChoThuNhanPhong(filters = {}) {
  const result = await executeProcedure('dbo.SP_TraCuuHopDongChoThuNhanPhong', [
    { name: 'TrangThaiThuTien', type: sql.NVarChar(20), value: filters.trangThaiThuTien || null },
    { name: 'TuKhoa', type: sql.NVarChar(100), value: filters.tuKhoa || null },
    { name: 'MaPhong', type: sql.VarChar(4), value: filters.maPhong || null },
    { name: 'MaGiuong', type: sql.VarChar(3), value: filters.maGiuong || null }
  ]);

  return result.recordset || [];
}

export async function tinhKhoanThuNhanPhong(maHopDong) {
  const result = await executeProcedure('dbo.SP_TinhKhoanThuNhanPhong', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return {
    summary: result.recordsets[0]?.[0] || null,
    details: result.recordsets[1] || []
  };
}

export async function layChiTietThuNhanPhong(maHopDong) {
  const result = await executeProcedure('dbo.SP_LayChiTietThuNhanPhong', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return {
    summary: result.recordsets[0]?.[0] || null,
    details: result.recordsets[1] || []
  };
}

export async function ghiNhanKhoanThuNhanPhong(data = {}) {
  const pool = await getPool();
  const request = pool.request();

  request.input('MaHopDong', sql.VarChar(6), data.maHopDong);
  request.input('MaNhanVienKeToan', sql.VarChar(6), data.maNhanVienKeToan);
  request.input('SoTienKhachThanhToan', sql.Decimal(15, 2), data.soTienKhachThanhToan);
  request.input('PhuongThucThanhToan', sql.NVarChar(20), data.phuongThucThanhToan);
  request.input('GhiChuThanhToan', sql.NVarChar(255), data.ghiChuThanhToan || null);
  request.output('MaHoaDon', sql.VarChar(6));
  request.output('MaLoi', sql.Int);
  request.output('ThongBao', sql.NVarChar(500));

  const result = await request.execute('dbo.SP_GhiNhanKhoanThuNhanPhong');

  return {
    maHoaDon: result.output.MaHoaDon,
    maLoi: result.output.MaLoi,
    thongBao: result.output.ThongBao
  };
}

export async function kiemTraDieuKienBanGiaoSauThuTien(maHopDong) {
  const pool = await getPool();
  const request = pool.request();

  request.input('MaHopDong', sql.VarChar(6), maHopDong);
  request.output('HopLe', sql.Bit);
  request.output('MaLoi', sql.Int);
  request.output('ThongBao', sql.NVarChar(500));

  const result = await request.execute('dbo.SP_KiemTraDieuKienBanGiaoSauThuTien');

  return {
    hopLe: result.output.HopLe,
    maLoi: result.output.MaLoi,
    thongBao: result.output.ThongBao
  };
}
