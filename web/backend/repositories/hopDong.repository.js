import { getPool, executeProcedure, sql } from '../database/connection.js';

/**
 * Data Access Layer (DAL) for HopDongThue feature.
 * Directly interacts with SQL Server database using Stored Procedures.
 */

// Helper to create TVP_ThanhVienHopDong table object for mssql
function createThanhVienTvp(thanhVienList = []) {
  const table = new sql.Table('dbo.TVP_ThanhVienHopDong');
  table.columns.add('HoTen', sql.NVarChar(100), { nullable: false });
  table.columns.add('NgaySinh', sql.Date, { nullable: true });
  table.columns.add('GioiTinh', sql.NVarChar(4), { nullable: true });
  table.columns.add('CCCD', sql.VarChar(20), { nullable: true });
  table.columns.add('SDT', sql.VarChar(20), { nullable: true });
  table.columns.add('Email', sql.VarChar(100), { nullable: true });
  table.columns.add('QuocTich', sql.NVarChar(50), { nullable: true });

  for (const tv of thanhVienList) {
    table.rows.add(
      tv.hoTen || tv.ten || '',
      tv.ngaySinh ? new Date(tv.ngaySinh) : null,
      tv.gioiTinh || null,
      tv.cccd || null,
      tv.sdt || null,
      tv.email || null,
      tv.quocTich || 'Việt Nam'
    );
  }
  return table;
}

// Helper to create TVP_DichVuHopDong table object for mssql
function createDichVuTvp(dichVuList = []) {
  const table = new sql.Table('dbo.TVP_DichVuHopDong');
  table.columns.add('MaDichVu', sql.VarChar(6), { nullable: false });
  table.columns.add('GhiChu', sql.NVarChar(sql.MAX), { nullable: true });

  for (const dv of dichVuList) {
    table.rows.add(
      dv.maDichVu || dv.id || '',
      dv.ghiChu || null
    );
  }
  return table;
}

export async function traCuuPhieuCoc(tuKhoa = null, trangThaiCoc = null, ngayTao = null) {
  const result = await executeProcedure('dbo.SP_TraCuuPhieuCocLapHopDong', [
    { name: 'TuKhoa', type: sql.NVarChar(100), value: tuKhoa || null },
    { name: 'TrangThaiCoc', type: sql.NVarChar(20), value: trangThaiCoc || null },
    { name: 'NgayTao', type: sql.Date, value: ngayTao || null }
  ]);
  const rows = result.recordset || [];
  if (rows.length === 0) return rows;

  const pool = await getPool();
  const request = pool.request();
  const paramKeys = rows.map((_, i) => `$${i + 1}`);
  const paramValues = rows.map(r => r.MaPhieuDatCoc);

  const residenceResult = await getPool().query(`
    SELECT "MaPhieuDatCoc", "MaHoSoCuTru", "TrangThaiHoSo", "NgayDuyet"
    FROM "HoSoCuTru"
    WHERE "MaPhieuDatCoc" IN (${paramKeys.join(', ')});
  `, paramValues).catch(() => ({ rows: [] }));

  const residenceMap = new Map(
    (residenceResult.rows || []).map((item) => [item.MaPhieuDatCoc, item])
  );

  return rows.map((row) => {
    const residence = residenceMap.get(row.MaPhieuDatCoc);
    const trangThaiHoSoCuTru = residence?.TrangThaiHoSo || 'Chưa cập nhật';
    const daDuyetCuTru = trangThaiHoSoCuTru === 'Đã duyệt cư trú';
    return {
      ...row,
      MaHoSoCuTru: residence?.MaHoSoCuTru || null,
      TrangThaiHoSoCuTru: trangThaiHoSoCuTru,
      NgayDuyetCuTru: residence?.NgayDuyet || null,
      CoTheLapHopDong: (row.CoTheLapHopDong === true || row.CoTheLapHopDong === 1) && daDuyetCuTru ? 1 : 0
    };
  });
}

export async function layChiTietPhieuCoc(maPhieuDatCoc) {
  const result = await executeProcedure('dbo.SP_LayChiTietPhieuCocLapHopDong', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc }
  ]);
  return result.recordset;
}

export async function layHoSoCuTruDaDuyetTheoPhieuCoc(maPhieuDatCoc) {
  const pool = await getPool();

  const hoSoResult = await pool.query(`
    SELECT
      hs."MaHoSoCuTru",
      hs."MaPhieuDatCoc",
      hs."MaNhanVienQuanLy",
      hs."TrangThaiHoSo",
      hs."DaDoiChieuGiayTo",
      hs."NgayGuiDuyet",
      hs."NgayDuyet",
      hs."GhiChuSale",
      hs."GhiChuQuanLy"
    FROM "HoSoCuTru" hs
    WHERE hs."MaPhieuDatCoc" = $1
      AND (hs."TrangThaiHoSo" = 'Đã duyệt cư trú' OR hs."TrangThaiHoSo" LIKE '%duy%t%')
    LIMIT 1;
  `, [maPhieuDatCoc]);

  const thanhVienResult = await pool.query(`
    SELECT
      tv."MaThanhVien" AS "MaThanhVienCuTru",
      tv."HoTen",
      tv."NgaySinh",
      tv."GioiTinh",
      tv."CCCD",
      tv."SDT",
      tv."Email",
      tv."QuocTich",
      tv."TrangThai" AS "TrangThaiDuyet",
      tv."LyDoTuChoi"
    FROM "ThanhVienHopDong" tv
    JOIN "HoSoCuTru" hs ON hs."MaHoSoCuTru" = tv."MaHoSoCuTru"
    WHERE hs."MaPhieuDatCoc" = $1
      AND (hs."TrangThaiHoSo" = 'Đã duyệt cư trú' OR hs."TrangThaiHoSo" LIKE '%duy%t%')
    ORDER BY
      CASE WHEN (tv."TrangThai" = 'Đủ điều kiện' OR tv."TrangThai" LIKE '%di%u%') THEN 0 ELSE 1 END,
      tv."MaThanhVien";
  `, [maPhieuDatCoc]);

  return {
    hoSo: hoSoResult.rows[0] || null,
    thanhVien: thanhVienResult.rows || []
  };
}

export async function kiemTraDieuKienLapHopDong(maPhieuDatCoc) {
  const pool = await getPool();
  const request = pool.request();
  request.input('MaPhieuDatCoc', sql.VarChar(6), maPhieuDatCoc);
  request.output('HopLe', sql.Bit);
  request.output('MaLoi', sql.Int);
  request.output('ThongBao', sql.NVarChar(500));
  
  const result = await request.execute('dbo.SP_KiemTraDieuKienLapHopDong');
  
  return {
    hopLe: result.output.HopLe,
    maLoi: result.output.MaLoi,
    thongBao: result.output.ThongBao
  };
}

export async function layDanhSachDichVu() {
  const result = await executeProcedure('dbo.SP_LayDanhSachDichVu', []);
  return result.recordset;
}

export async function kiemTraThanhVienHopDongTam(maPhieuDatCoc, thanhVienList = []) {
  const tvpTable = createThanhVienTvp(thanhVienList);
  
  const pool = await executeProcedure('dbo.SP_KiemTraThanhVienHopDongTam', [
    { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: maPhieuDatCoc },
    { name: 'DanhSachThanhVien', type: sql.TVP, value: tvpTable }
  ]);

  return {
    thanhVienValidation: pool.recordsets[0], // list of members with validation details
    summary: pool.recordsets[1][0] // summary statistics
  };
}

export async function lapHopDongThue(data = {}) {
  const pool = await getPool();
  const request = pool.request();

  const tvpThanhVien = createThanhVienTvp(data.danhSachThanhVien || []);
  const tvpDichVu = createDichVuTvp(data.danhSachDichVu || []);

  request.input('MaPhieuDatCoc', sql.VarChar(6), data.maPhieuDatCoc);
  request.input('MaNhanVienQuanLy', sql.VarChar(6), data.maNhanVienQuanLy);
  request.input('NgayBatDau', sql.Date, data.ngayBatDau ? new Date(data.ngayBatDau) : null);
  request.input('NgayKetThuc', sql.Date, data.ngayKetThuc ? new Date(data.ngayKetThuc) : null);
  request.input('KyThanhToan', sql.NVarChar(20), data.kyThanhToan || 'Hàng tháng');
  request.input('KhachHangDaXacNhan', sql.Bit, data.khachHangDaXacNhan ? 1 : 0);
  request.input('NhanVienDaXacNhan', sql.Bit, data.nhanVienDaXacNhan ? 1 : 0);
  request.input('DanhSachThanhVien', sql.TVP, tvpThanhVien);
  request.input('DanhSachDichVu', sql.TVP, tvpDichVu);

  request.output('MaHopDong', sql.VarChar(6));
  request.output('MaLoi', sql.Int);
  request.output('ThongBao', sql.NVarChar(500));

  const result = await request.execute('dbo.SP_LapHopDongThue');

  return {
    maHopDong: result.output.MaHopDong,
    maLoi: result.output.MaLoi,
    thongBao: result.output.ThongBao
  };
}

export async function layChiTietHopDongThue(maHopDong) {
  const result = await executeProcedure('dbo.SP_LayChiTietHopDongThue', [
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDong }
  ]);

  return {
    hopDong: result.recordsets[0][0] || null,
    thanhVien: result.recordsets[1] || [],
    dichVu: result.recordsets[2] || [],
    dieuKhoan: result.recordsets[3] || [],
    dieuKhoanViPham: result.recordsets[4] || [],
    quyDinhHoanCoc: result.recordsets[5] || []
  };
}

export async function layMaHopDongTheoPhieuCoc(maPhieuDatCoc) {
  const pool = await getPool();
  const result = await pool.query('SELECT "MaHopDong" FROM "HopDongThue" WHERE "MaPhieuCoc" = $1', [maPhieuDatCoc]);
  return result.rows[0]?.MaHopDong || null;
}

export async function layDanhSachQuanLy() {
  const pool = await getPool();
  const result = await pool.query(
    `SELECT nv."MaNhanVien", nd."HoTen"
     FROM "NhanVien" nv 
     JOIN "NguoiDung" nd ON nd."MaNguoiDung" = nv."MaNhanVien" 
     WHERE nv."ChucVu" = 'Quản lý'`
  );
  return result.rows;
}
