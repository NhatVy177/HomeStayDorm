import { executeProcedure, getPool, sql } from '../database/connection.js';

function buildChiTietBanGiaoTable(items = []) {
  const table = new sql.Table('dbo.TVP_ChiTietBanGiao');
  table.columns.add('MaPhong', sql.VarChar(4), { nullable: false });
  table.columns.add('MaTaiSan', sql.VarChar(6), { nullable: false });
  table.columns.add('SoLuongThucTe', sql.Int, { nullable: true });
  table.columns.add('GhiChu', sql.NVarChar(255), { nullable: true });

  for (const item of items) {
    table.rows.add(
      item.maPhong,
      item.maTaiSan,
      item.soLuongThucTe == null ? null : Number(item.soLuongThucTe),
      item.ghiChu || null
    );
  }

  return table;
}

export async function traCuuHopDongBanGiao(maHopDong) {
  const result = await executeProcedure('dbo.SP_TraCuuHopDongBanGiao', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return result.recordset?.[0] || null;
}

export async function kiemTraDieuKienBanGiaoVao(maHopDong) {
  const pool = await getPool();
  const request = pool.request();

  request.input('MaHopDong', sql.VarChar(6), maHopDong);
  request.output('HopLe', sql.Bit);
  request.output('MaLoi', sql.Int);
  request.output('ThongBao', sql.NVarChar(500));

  const result = await request.execute('dbo.SP_KiemTraDieuKienBanGiaoVao');

  return {
    hopLe: result.output.HopLe,
    maLoi: result.output.MaLoi,
    thongBao: result.output.ThongBao
  };
}

export async function layDanhSachTaiSanBanGiao(maHopDong) {
  const result = await executeProcedure('dbo.SP_LayDanhSachTaiSanBanGiao', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return result.recordset || [];
}

export async function lapBienBanBanGiaoVao(data = {}) {
  const pool = await getPool();
  const request = pool.request();

  request.input('MaHopDong', sql.VarChar(6), data.maHopDong);
  request.input('MaNhanVienQuanLy', sql.VarChar(6), data.maNhanVienQuanLy);
  request.input('KhachCoMat', sql.Bit, data.khachCoMat);
  request.input('DaKyBienBan', sql.Bit, data.daKyBienBan);
  request.input('GhiChuChung', sql.NVarChar(500), data.ghiChuChung || null);
  request.input('DanhSachTaiSan', buildChiTietBanGiaoTable(data.danhSachTaiSan));
  request.output('MaBienBan', sql.VarChar(6));
  request.output('MaLoi', sql.Int);
  request.output('ThongBao', sql.NVarChar(500));

  const result = await request.execute('dbo.SP_LapBienBanBanGiaoVao');

  return {
    maBienBan: result.output.MaBienBan,
    maLoi: result.output.MaLoi,
    thongBao: result.output.ThongBao
  };
}

export async function layKetQuaLapBienBanBanGiao(maBienBan) {
  const result = await executeProcedure('dbo.SP_LayKetQuaLapBienBanBanGiao', [
    { name: 'MaBienBan', type: sql.VarChar(6), value: maBienBan }
  ]);

  return result.recordset?.[0] || null;
}

export async function layChiTietBienBanBanGiao(maBienBan) {
  const result = await executeProcedure('dbo.SP_LayChiTietBienBanBanGiao', [
    { name: 'MaBienBan', type: sql.VarChar(6), value: maBienBan }
  ]);

  return {
    bienBan: result.recordsets?.[0]?.[0] || null,
    hopDong: result.recordsets?.[1]?.[0] || null,
    phongGiuong: result.recordsets?.[2] || [],
    thanhVien: result.recordsets?.[3] || [],
    taiSan: result.recordsets?.[4] || []
  };
}
