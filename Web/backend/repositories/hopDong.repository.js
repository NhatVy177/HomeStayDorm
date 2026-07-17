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
  const paramNames = rows.map((row, index) => {
    const paramName = `MaPhieu${index}`;
    request.input(paramName, sql.VarChar(6), row.MaPhieuDatCoc);
    return `@${paramName}`;
  });

  const residenceResult = await request.query(`
    IF OBJECT_ID(N'dbo.HoSoCuTru', N'U') IS NULL
    BEGIN
      SELECT
        CAST(NULL AS VARCHAR(6)) AS MaPhieuDatCoc,
        CAST(NULL AS VARCHAR(6)) AS MaHoSoCuTru,
        CAST(NULL AS NVARCHAR(30)) AS TrangThaiHoSo,
        CAST(NULL AS DATETIME) AS NgayDuyet
      WHERE 1 = 0;
    END
    ELSE
    BEGIN
      SELECT
        MaPhieuDatCoc,
        MaHoSoCuTru,
        TrangThaiHoSo,
        NgayDuyet
      FROM dbo.HoSoCuTru
      WHERE MaPhieuDatCoc IN (${paramNames.join(', ')});
    END
  `);

  const residenceMap = new Map(
    (residenceResult.recordset || []).map((item) => [item.MaPhieuDatCoc, item])
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
  const request = pool.request();
  request.input('MaPhieuDatCoc', sql.VarChar(6), maPhieuDatCoc);

  const result = await request.query(`
    SELECT TOP 1
      hs.MaHoSoCuTru,
      hs.MaPhieuDatCoc,
      hs.MaNhanVienQuanLy,
      hs.TrangThaiHoSo,
      hs.DaDoiChieuGiayTo,
      hs.NgayGuiDuyet,
      hs.NgayDuyet,
      hs.GhiChuSale,
      hs.GhiChuQuanLy
    FROM dbo.HoSoCuTru hs
    WHERE hs.MaPhieuDatCoc = @MaPhieuDatCoc
      AND (hs.TrangThaiHoSo = N'Đã duyệt cư trú' OR hs.TrangThaiHoSo LIKE N'%duy%t%');

    SELECT
      tv.MaThanhVien AS MaThanhVienCuTru,
      tv.HoTen,
      tv.NgaySinh,
      tv.GioiTinh,
      tv.CCCD,
      tv.SDT,
      tv.Email,
      tv.QuocTich,
      tv.TrangThai AS TrangThaiDuyet,
      tv.LyDoTuChoi
    FROM dbo.ThanhVienHopDong tv
    JOIN dbo.HoSoCuTru hs ON hs.MaHoSoCuTru = tv.MaHoSoCuTru
    WHERE hs.MaPhieuDatCoc = @MaPhieuDatCoc
      AND (hs.TrangThaiHoSo = N'Đã duyệt cư trú' OR hs.TrangThaiHoSo LIKE N'%duy%t%')
    ORDER BY
      CASE WHEN (tv.TrangThai = N'Đủ điều kiện' OR tv.TrangThai LIKE N'%di%u%') THEN 0 ELSE 1 END,
      tv.MaThanhVien;
  `);

  return {
    hoSo: result.recordsets[0]?.[0] || null,
    thanhVien: result.recordsets[1] || []
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
  const result = await pool.request()
    .input('MaPhieuCoc', sql.VarChar(6), maPhieuDatCoc)
    .query('SELECT MaHopDong FROM dbo.HopDongThue WHERE MaPhieuCoc = @MaPhieuCoc');
  return result.recordset[0]?.MaHopDong || null;
}

export async function layDanhSachQuanLy() {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT nv.MaNhanVien, nd.HoTen 
     FROM dbo.NhanVien nv 
     JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = nv.MaNhanVien 
     WHERE nv.ChucVu = N'Quản lý'`
  );
  return result.recordset;
}
