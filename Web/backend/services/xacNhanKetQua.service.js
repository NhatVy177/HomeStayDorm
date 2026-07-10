import sql from 'mssql';
import { getPool } from '../database/connection.js';
import { phanHoiDoiSoatTraPhong } from './khachMoi.service.js';
import { createServiceError } from './serviceErrors.js';

function requireCustomer(user) {
  if (!user || user.vaiTro !== 'KhachHang') {
    throw createServiceError('Chức năng này chỉ dành cho khách hàng.', 403);
  }

  return user.maNguoiDung;
}

const xacNhanKetQuaService = {
  getDanhSachChoXacNhan: async (user) => {
    try {
      const maKhachHang = requireCustomer(user);
      const pool = await getPool();
      const result = await pool.request()
        .input('MaKhachHang', sql.VarChar(6), maKhachHang)
        .query(`
          SELECT
            ds.MaDoiSoat AS maDoiSoat,
            pt.MaPhieuTra AS maPhieuTra,
            ds.NgayLap AS ngayLap,
            nd.HoTen AS hoTenKhach,
            MIN(p.TenPhong) AS tenPhong,
            MIN(ctdc.MaGiuong) AS maGiuong,
            CASE WHEN pt.MaHopDong IS NOT NULL THEN N'HopDong' ELSE N'DatCoc' END AS loaiNguon
          FROM dbo.DoiSoat ds
          INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
          LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
          LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
          LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
          LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
          LEFT JOIN dbo.ChiTietDatCoc ctdc ON ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
          LEFT JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
          WHERE ds.TrangThai = N'Chờ xác nhận'
            AND kh.MaKhachHang = @MaKhachHang
          GROUP BY
            ds.MaDoiSoat,
            pt.MaPhieuTra,
            ds.NgayLap,
            nd.HoTen,
            pt.MaHopDong
          ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
        `);
      return result.recordset;
    } catch (err) {
      throw err;
    }
  },

  getChiTietDoiSoat: async (maDoiSoat, user) => {
    try {
      const maKhachHang = requireCustomer(user);
      const pool = await getPool();
      const request = pool.request();
      request.input('MaDoiSoat', sql.VarChar(6), maDoiSoat);
      request.input('MaKhachHang', sql.VarChar(6), maKhachHang);
      const result = await request.query(`
        SELECT TOP 1
          ds.MaDoiSoat AS maDoiSoat,
          ds.NgayLap AS ngayLap,
          pt.MaPhieuTra AS maPhieuTra,
          pt.NgayTraThucTe AS ngayTraThucTe,
          nd.HoTen AS hoTenKhach,
          pt.MaHopDong AS maHopDong,
          pt.MaPhieuDatCoc AS maPhieuDatCoc,
          phong.TenPhong AS tenPhong,
          phong.MaGiuong AS maGiuong,
          ds.TienCocBanDau AS tienCocBanDau,
          ds.SoThangLuuTru AS soThangLuuTru,
          ds.TyLeHoanCocHienTai AS tyLeHoanCocHienTai,
          ds.TienCocDuocHoan AS tienCocDuocHoan,
          ds.TienThueConNo AS tienThueConNo,
          ds.TienDichVuConNo AS tienDichVuConNo,
          ds.TongChiPhiSuaChua AS tongChiPhiSuaChua,
          ds.TienPhat AS tienPhat,
          ds.TongKhauTru AS tongKhauTru,
          ds.SoTienHoanThucTe AS soTienHoanThucTe,
          ds.SoTienKhachPhaiTT AS soTienKhachPhaiTT,
          ds.LoaiQuyetToan AS loaiQuyetToan,
          ds.TrangThai AS trangThaiDoiSoat,
          pt.TrangThai AS trangThaiPhieuTra
        FROM dbo.DoiSoat ds
        INNER JOIN dbo.PhieuTraPhong pt ON pt.MaPhieuTra = ds.MaPhieuTra
        LEFT JOIN dbo.HopDongThue hd ON hd.MaHopDong = pt.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
        LEFT JOIN dbo.KhachHang kh ON kh.MaKhachHang = COALESCE(hd.MaKhachHang, pdc.MaKhachHang)
        LEFT JOIN dbo.NguoiDung nd ON nd.MaNguoiDung = kh.MaKhachHang
        OUTER APPLY (
          SELECT TOP 1 p.TenPhong, ctdc.MaGiuong
          FROM dbo.ChiTietDatCoc ctdc
          INNER JOIN dbo.Phong p ON p.MaPhong = ctdc.MaPhong
          WHERE ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
          ORDER BY p.MaPhong, ctdc.MaGiuong
        ) phong
        WHERE ds.MaDoiSoat = @MaDoiSoat
          AND ds.TrangThai = N'Chờ xác nhận'
          AND kh.MaKhachHang = @MaKhachHang;
      `);
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  },

  xacNhanDoiSoat: async (data, user) => {
    try {
      return await phanHoiDoiSoatTraPhong(user, data.maDoiSoat, {
        dongY: data.dongY,
        lyDoKhongDongY: data.lyDoKhongDongY || data.lyDo
      });
    } catch (err) {
      throw err;
    }
  }
};

export default xacNhanKetQuaService;
