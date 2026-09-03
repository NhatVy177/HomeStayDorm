import { executeProcedure, executeQuery, sql } from '../database/connection.js';
import { capNhatLichXemDenGioThanhDaXem } from './lichXemPhong.repository.js';

export async function timLuongThueDangHoatDong(khachHangId) {
  const result = await executeQuery(`
    SELECT TOP (1) *
    FROM (
      SELECT
        N'Hợp đồng thuê' AS loai,
        hd.MaHopDong AS maThamChieu,
        hd.TrangThai AS trangThai,
        hd.NgayKyHD AS ngayTao,
        1 AS thuTu
      FROM dbo.HopDongThue AS hd
      WHERE hd.MaKhachHang = @KhachHangId
        AND hd.TrangThai NOT IN (N'Hết hạn', N'Đã thanh lý')

      UNION ALL

      SELECT
        N'Phiếu đặt cọc' AS loai,
        pdc.MaPhieuDatCoc AS maThamChieu,
        CONCAT(pdc.TrangThaiCoc, N' / ', pdc.TrangThaiThanhToan) AS trangThai,
        CAST(pdc.ThoiDiemDatCoc AS DATE) AS ngayTao,
        2 AS thuTu
      FROM dbo.PhieuDatCoc AS pdc
      WHERE pdc.MaKhachHang = @KhachHangId
        AND pdc.TrangThaiCoc <> N'Đã hủy'
        AND pdc.TrangThaiThanhToan <> N'Hết hạn'
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.HopDongThue AS hd
          WHERE hd.MaPhieuCoc = pdc.MaPhieuDatCoc
            AND hd.TrangThai IN (N'Hết hạn', N'Đã thanh lý')
        )

      UNION ALL

      SELECT
        N'Phiếu đăng ký' AS loai,
        pdk.MaDangKy AS maThamChieu,
        pdk.TrangThai AS trangThai,
        pdk.NgayDangKy AS ngayTao,
        3 AS thuTu
      FROM dbo.PhieuDangKy AS pdk
      WHERE pdk.MaKhachHang = @KhachHangId
        AND pdk.TrangThai <> N'Từ chối'
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.PhieuDatCoc AS pdc
          INNER JOIN dbo.HopDongThue AS hd ON hd.MaPhieuCoc = pdc.MaPhieuDatCoc
          WHERE pdc.MaPhieuYeuCauDangKy = pdk.MaDangKy
            AND hd.TrangThai IN (N'Hết hạn', N'Đã thanh lý')
        )
    ) AS activeFlow
    ORDER BY thuTu, ngayTao DESC;
  `, [
    { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId }
  ]);

  return result.recordset[0] || null;
}

export async function taoHoSoDangKy(data = {}) {
  const result = await executeProcedure('dbo.SP_TaoHoSoDangKy', [
    { name: 'KhachHangId', type: sql.NVarChar(20), value: data.khachHangId },
    { name: 'SoNguoiO', type: sql.Int, value: data.soNguoiO },
    { name: 'SoNamInput', type: sql.Int, value: data.soNam || 0 },
    { name: 'SoNuInput', type: sql.Int, value: data.soNu || 0 },
    { name: 'NgayDuKienVaoO', type: sql.Date, value: data.ngayDuKienVaoO },
    { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null },
    { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || null },
    { name: 'LoaiPhongYeuCau', type: sql.NVarChar(200), value: data.loaiPhongYeuCau },
    { name: 'MucGiaToiDa', type: sql.Decimal(18, 2), value: data.mucGiaToiDa },
    { name: 'ThoiHanThue', type: sql.Int, value: data.thoiHanThue ? Number(data.thoiHanThue) : null },
    { name: 'GioiTinh', type: sql.NVarChar(10), value: data.gioiTinh }
  ]);

  return result.recordset[0] || null;
}

export async function layDanhSachHoSoDangKy(filter = {}) {
  const result = await executeProcedure('dbo.SP_DanhSachHoSoDangKy', [
    { name: 'TrangThai', type: sql.NVarChar(30), value: filter.trangThai || null },
    { name: 'MaChiNhanh', type: sql.VarChar(6), value: filter.maChiNhanh || null },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: filter.nhanVienSaleId || null },
    { name: 'KhachHangId', type: sql.VarChar(6), value: filter.khachHangId || null }
  ]);

  return result.recordset || [];
}

export async function layMaDangKyBiHuyDoTatCaLichXemBiHuy() {
  const result = await executeQuery(`
    SELECT pdk.MaDangKy
    FROM dbo.PhieuDangKy AS pdk
    WHERE pdk.TrangThai = N'Từ chối'
      AND EXISTS (
        SELECT 1
        FROM dbo.LichXemPhong AS lxpAny
        WHERE lxpAny.MaDangKy = pdk.MaDangKy
      )
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.LichXemPhong AS lxpActive
        WHERE lxpActive.MaDangKy = pdk.MaDangKy
          AND lxpActive.TrangThai <> N'Đã hủy'
      );
  `);

  return result.recordset || [];
}

export async function kiemTraSdtCccdTonTai({ sdt, cccd } = {}) {
  const result = await executeQuery(`
    SELECT
      CAST(CASE WHEN EXISTS (
        SELECT 1
        FROM dbo.NguoiDung
        WHERE SDT = @SDT
          AND LoaiNguoiDung = 'KhachHang'
      ) THEN 1 ELSE 0 END AS bit) AS sdtTonTai,
      CAST(CASE WHEN EXISTS (
        SELECT 1
        FROM dbo.KhachHang
        WHERE CCCD = @CCCD
      ) THEN 1 ELSE 0 END AS bit) AS cccdTonTai
  `, [
    { name: 'SDT', type: sql.VarChar(20), value: sdt || null },
    { name: 'CCCD', type: sql.VarChar(20), value: cccd || null }
  ]);

  return result.recordset[0] || { sdtTonTai: false, cccdTonTai: false };
}

export async function timKhachHangTheoSdt(sdt) {
  const result = await executeQuery(`
    SELECT TOP (1)
      kh.MaKhachHang,
      nd.HoTen,
      nd.NgaySinh,
      nd.GioiTinh,
      nd.SDT,
      nd.Email,
      kh.QuocTich,
      kh.CCCD
    FROM dbo.KhachHang AS kh
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE @SDT IS NOT NULL AND nd.SDT = @SDT
  `, [
    { name: 'SDT', type: sql.VarChar(20), value: sdt || null }
  ]);

  return result.recordset[0] || null;
}

export async function timMaKhachHangTheoCccd(cccd) {
  const result = await executeQuery(`
    SELECT TOP (1) MaKhachHang
    FROM dbo.KhachHang
    WHERE CCCD = @CCCD
  `, [
    { name: 'CCCD', type: sql.VarChar(20), value: cccd }
  ]);

  return result.recordset[0]?.MaKhachHang || null;
}

export async function layTieuChiHoSoDangKy(hoSoId) {
  const result = await executeQuery(`
    SELECT MucGiaToiDa, SoNguoiDuKienO, SoNam, SoNu
    FROM dbo.PhieuDangKy
    WHERE MaDangKy = @HoSoId
  `, [
    { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
  ]);

  return result.recordset[0] || {};
}

export async function layDanhSachPhongGiuongKhaDung(filter = {}) {
  const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
    { name: 'Loai', type: sql.NVarChar(50), value: filter.loai || null },
    { name: 'GioiTinh', type: sql.NVarChar(5), value: filter.gioiTinh || null },
    { name: 'MaChiNhanh', type: sql.VarChar(6), value: filter.maChiNhanh || null },
    { name: 'KhuVuc', type: sql.NVarChar(100), value: filter.khuVuc || null },
    { name: 'LoaiPhong', type: sql.NVarChar(50), value: filter.loaiPhong || null },
    { name: 'MucGiaTu', type: sql.Decimal(15, 2), value: filter.mucGiaTu },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: filter.mucGiaToiDa },
    { name: 'SoNguoiO', type: sql.Int, value: filter.soNguoiO },
    { name: 'HoSoId', type: sql.VarChar(6), value: filter.hoSoId || null }
  ]);

  return result.recordset || [];
}

export async function kiemTraKhuVucHoSoHopLe(hoSoId) {
  const result = await executeQuery(`
    SELECT 1 
    FROM PhieuDangKy pdk
    JOIN ChiNhanh cn ON (
      cn.DiaChi LIKE N'%' + pdk.KhuVucMongMuon + N'%'
      OR cn.TenChiNhanh LIKE N'%' + pdk.KhuVucMongMuon + N'%'
      OR (
        cn.MaChiNhanh = 'CN0001'
        AND (
          pdk.KhuVucMongMuon LIKE N'%Quận 1%'
          OR pdk.KhuVucMongMuon LIKE N'%Quận 3%'
          OR pdk.KhuVucMongMuon LIKE N'%Quận 4%'
          OR pdk.KhuVucMongMuon LIKE N'%Quận 5%'
          OR pdk.KhuVucMongMuon LIKE N'%Quận 10%'
        )
      )
      OR (
        cn.MaChiNhanh = 'CN0002'
        AND (
          pdk.KhuVucMongMuon LIKE N'%Bình Thạnh%'
          OR pdk.KhuVucMongMuon LIKE N'%Phú Nhuận%'
          OR pdk.KhuVucMongMuon LIKE N'%Gò Vấp%'
          OR pdk.KhuVucMongMuon LIKE N'%Tân Bình%'
        )
      )
      OR (
        cn.MaChiNhanh = 'CN0003'
        AND (
          pdk.KhuVucMongMuon LIKE N'%Thủ Đức%'
          OR pdk.KhuVucMongMuon LIKE N'%Quận 2%'
          OR pdk.KhuVucMongMuon LIKE N'%Quận 9%'
        )
      )
    )
    WHERE pdk.MaDangKy = @HoSoId
  `, [
    { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
  ]);

  return result.recordset.length > 0;
}

export async function traCuuPhong(filter = {}) {
  const result = await executeProcedure('dbo.SP_TraCuuPhong', [
    { name: 'KhuVuc', type: sql.NVarChar(100), value: filter.khuVuc || null },
    { name: 'LoaiPhong', type: sql.NVarChar(50), value: filter.loaiPhong || null },
    { name: 'HinhThucThue', type: sql.NVarChar(50), value: filter.hinhThucThue || null },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: filter.mucGiaToiDa }
  ]);

  return result.recordset || [];
}

export async function kiemTraDieuKienThue(hoSoId) {
  const maDangKy = String(hoSoId || '').trim();
  await capNhatLichXemDenGioThanhDaXem({ maDangKy });

  const result = await executeProcedure('dbo.SP_KiemTraDieuKienThue', [
    { name: 'HoSoId', type: sql.NVarChar(30), value: maDangKy }
  ]);

  return result.recordset[0] || null;
}

export async function capNhatKetQuaXuLy(hoSoId, data = {}) {
  const maDangKy = String(hoSoId || '').trim();
  await capNhatLichXemDenGioThanhDaXem({ maDangKy });

  const result = await executeProcedure('dbo.SP_CapNhatKetQuaXuLyHoSo', [
    { name: 'HoSoId', type: sql.NVarChar(30), value: maDangKy },
    { name: 'TrangThai', type: sql.NVarChar(50), value: data.trangThai || null },
    { name: 'GhiChuXuLy', type: sql.NVarChar(sql.MAX), value: data.ghiChuXuLy || null },
    { name: 'NhanVienSaleId', type: sql.NVarChar(20), value: data.nhanVienSaleId || null }
  ]);

  return result.recordset[0] || null;
}

export async function tiepNhanHoSoDangKy(hoSoId, nhanVienSaleId) {
  const result = await executeProcedure('dbo.SP_TiepNhanHoSoDangKy', [
    { name: 'MaDangKy', type: sql.VarChar(6), value: String(hoSoId || '').trim() },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: String(nhanVienSaleId || '').trim() }
  ]);

  return result.recordset[0] || null;
}

export async function huyTiepNhanHoSoDangKy(hoSoId, nhanVienSaleId) {
  const result = await executeProcedure('dbo.SP_HuyTiepNhanHoSoDangKy', [
    { name: 'MaDangKy', type: sql.VarChar(6), value: String(hoSoId || '').trim() },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: String(nhanVienSaleId || '').trim() }
  ]);

  return result.recordset[0] || null;
}

export async function timKhachHangKhachVangLaiTheoSdt(sdt) {
  const result = await executeQuery(`
    SELECT TOP (1) kh.MaKhachHang, kh.CCCD
    FROM dbo.KhachHang AS kh
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE nd.SDT = @SDT
      AND nd.LoaiNguoiDung = 'KhachHang'
  `, [
    { name: 'SDT', type: sql.VarChar(20), value: sdt || null }
  ]);

  return result.recordset[0] || null;
}

export async function taoHoSoKhachVangLai(data = {}) {
  const result = await executeProcedure('dbo.SP_TaoHoSoKhachVangLai', [
    { name: 'HoTen', type: sql.NVarChar(100), value: data.hoTen },
    { name: 'NgaySinh', type: sql.Date, value: data.ngaySinh },
    { name: 'GioiTinh', type: sql.NVarChar(5), value: data.gioiTinh },
    { name: 'SDT', type: sql.VarChar(20), value: data.sdt },
    { name: 'Email', type: sql.VarChar(100), value: data.email || null },
    { name: 'QuocTich', type: sql.NVarChar(50), value: data.quocTich || 'Việt Nam' },
    { name: 'CCCD', type: sql.VarChar(20), value: data.cccd },
    { name: 'HinhThucThue', type: sql.NVarChar(20), value: data.hinhThucThue },
    { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon },
    { name: 'LoaiPhongYeuCau', type: sql.NVarChar(200), value: data.loaiPhongYeuCau },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: data.mucGiaToiDa },
    { name: 'SoNguoiO', type: sql.Int, value: data.soNguoiO },
    { name: 'SoNamInput', type: sql.Int, value: data.soNam || 0 },
    { name: 'SoNuInput', type: sql.Int, value: data.soNu || 0 },
    { name: 'NgayDuKienVaoO', type: sql.Date, value: data.ngayDuKienVaoO },
    { name: 'ThoiHanThue', type: sql.Int, value: data.thoiHanThue },
    { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: data.nhanVienSaleId }
  ]);

  return result.recordset[0] || null;
}
