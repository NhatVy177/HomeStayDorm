import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeProcedure, executeQuery, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roomUploadDir = path.join(backendDir, 'uploads', 'phong');
const imageMimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    51001: 400,
    51002: 400,
    51003: 400,
    51004: 404,
    51005: 409,
    51006: 409,
    51007: 409,
    51008: 409,
    51011: 400,
    51012: 400,
    51013: 404,
    51021: 400,
    51022: 400,
    51023: 404,
    51024: 409,
    51031: 400,
    51032: 404,
    51033: 400,
    51034: 400,
    51035: 404,
    51036: 409,
    51037: 409,
    51038: 404,
    51041: 400,
    51042: 400,
    51043: 400,
    51044: 409,
    51045: 409,
    51046: 404,
    51047: 400,
    51048: 409,
    51051: 400,
    51052: 400,
    51053: 400,
    51054: 400,
    51055: 400,
    51056: 409,
    51057: 409,
    51058: 404,
    51059: 409,
    51060: 409,
    51061: 400,
    51062: 400,
    51063: 400,
    51064: 404,
    51065: 404,
    51066: 400,
    51067: 409,
    51068: 409,
    51069: 400,
    51091: 400,
    51092: 400,
    51093: 400,
    51094: 404,
    51095: 409,
    51101: 400,
    51102: 400,
    51103: 400,
    51104: 400,
    51105: 404,
    51106: 404,
    51107: 409,
    51108: 409,
    51109: 404,
    51110: 409,
    51111: 409,
    51112: 409,
    51113: 409,
    51281: 400,
    51282: 400,
    51291: 400,
    51292: 400,
    51301: 400
  });
}

async function saveRoomImageUpload(image) {
  if (!image?.base64) return null;

  const dataUrlMatch = String(image.base64).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const mimeType = dataUrlMatch?.[1] || image.mimeType;
  const base64Payload = dataUrlMatch?.[2] || image.base64;
  const extension = imageMimeExtensions[mimeType];

  if (!extension) {
    throw createServiceError('Ảnh phòng chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF.', 400);
  }

  const buffer = Buffer.from(base64Payload, 'base64');
  if (buffer.length === 0) {
    throw createServiceError('File ảnh phòng không hợp lệ.', 400);
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw createServiceError('Ảnh phòng tối đa 5MB.', 400);
  }

  await mkdir(roomUploadDir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await writeFile(path.join(roomUploadDir, fileName), buffer);
  return `/uploads/phong/${fileName}`;
}

export async function getDanhSachNhanVien(query = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_DanhSachNhanVien', [
      { name: 'MaNhanVien', type: sql.VarChar(6), value: query.maNhanVien || null },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: query.maChiNhanh || null },
      { name: 'ChucVu', type: sql.NVarChar(50), value: query.chucVu || null },
      { name: 'TrangThaiTaiKhoan', type: sql.NVarChar(20), value: query.trangThaiTaiKhoan || null },
      { name: 'TuKhoa', type: sql.NVarChar(100), value: query.tuKhoa || null }
    ]);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getChiTietNhanVien(id) {
  const rows = await getDanhSachNhanVien({ maNhanVien: String(id || '').trim() });
  const employee = rows[0];
  if (!employee) {
    throw createServiceError('Không tìm thấy nhân viên.', 404);
  }
  return employee;
}

export async function getMaNhanVienTiepTheo() {
  const result = await executeQuery(`
    SELECT CONCAT(
      'NV',
      RIGHT(CONCAT('0000', ISNULL(MAX(TRY_CONVERT(INT, SUBSTRING(MaNguoiDung, 3, 4))), 0) + 1), 4)
    ) AS maNhanVien
    FROM dbo.NguoiDung
    WHERE MaNguoiDung LIKE 'NV[0-9][0-9][0-9][0-9]';
  `);

  return result.recordset[0] || { maNhanVien: 'NV0001' };
}

export async function getDanhSachChiNhanh(query = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyChiNhanh', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'DANH_SACH' },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: query.maChiNhanh || null },
      { name: 'TenChiNhanh', type: sql.NVarChar(100), value: null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: null },
      { name: 'SDT', type: sql.VarChar(20), value: null },
      { name: 'Email', type: sql.VarChar(100), value: null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: query.trangThai || null },
      { name: 'AdminId', type: sql.VarChar(6), value: null }
    ]);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function taoChiNhanh(data, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyChiNhanh', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'TAO' },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: data.maChiNhanh || null },
      { name: 'TenChiNhanh', type: sql.NVarChar(100), value: data.tenChiNhanh },
      { name: 'DiaChi', type: sql.NVarChar(255), value: data.diaChi || null },
      { name: 'SDT', type: sql.VarChar(20), value: data.soDienThoai || null },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: data.trangThai || 'Hoạt động' },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset[0];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatChiNhanh(id, data, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyChiNhanh', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'CAP_NHAT' },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: id },
      { name: 'TenChiNhanh', type: sql.NVarChar(100), value: data.tenChiNhanh || null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: data.diaChi || null },
      { name: 'SDT', type: sql.VarChar(20), value: data.soDienThoai || null },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: data.trangThai || null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset[0];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function xoaChiNhanh(id, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyChiNhanh', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'XOA' },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: id },
      { name: 'TenChiNhanh', type: sql.NVarChar(100), value: null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: null },
      { name: 'SDT', type: sql.VarChar(20), value: null },
      { name: 'Email', type: sql.VarChar(100), value: null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset?.[0] || { success: true };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachLoaiPhong(query = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyLoaiPhong', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'DANH_SACH' },
      { name: 'MaLoaiPhong', type: sql.VarChar(6), value: query.maLoaiPhong || null },
      { name: 'TenLoaiPhong', type: sql.NVarChar(100), value: null },
      { name: 'SucChuaToiDa', type: sql.Int, value: null },
      { name: 'MoTa', type: sql.NVarChar(sql.MAX), value: null },
      { name: 'GiaThueTheoGiuong', type: sql.Decimal(15, 2), value: null },
      { name: 'GiaThueNguyenPhong', type: sql.Decimal(15, 2), value: null },
      { name: 'AdminId', type: sql.VarChar(6), value: null }
    ]);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachPhong(query = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyPhong', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'DANH_SACH' },
      { name: 'MaPhong', type: sql.VarChar(4), value: query.maPhong || null },
      { name: 'TenPhong', type: sql.NVarChar(100), value: null },
      { name: 'GioiTinhChoPhep', type: sql.NVarChar(20), value: null },
      { name: 'TinhTrang', type: sql.NVarChar(20), value: query.tinhTrang || null },
      { name: 'UrlImg', type: sql.VarChar(500), value: null },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: query.maChiNhanh || null },
      { name: 'MaLoaiPhong', type: sql.VarChar(6), value: query.maLoaiPhong || null },
      { name: 'AdminId', type: sql.VarChar(6), value: null }
    ]);
    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function taoPhongGiuong(data, user = {}) {
  try {
    const uploadedImageUrl = await saveRoomImageUpload(data.anhPhong);
    const result = await executeProcedure('dbo.SP_Admin_TaoPhongGiuong', [
      { name: 'MaPhong', type: sql.VarChar(4), value: data.maPhong || null },
      { name: 'TenPhong', type: sql.NVarChar(100), value: data.tenPhong },
      { name: 'GioiTinhChoPhep', type: sql.NVarChar(20), value: data.gioiTinhChoPhep },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: data.maChiNhanh },
      { name: 'MaLoaiPhong', type: sql.VarChar(6), value: data.maLoaiPhong },
      { name: 'TinhTrang', type: sql.NVarChar(20), value: data.tinhTrang || 'Trống' },
      { name: 'UrlImg', type: sql.VarChar(500), value: uploadedImageUrl || data.urlImg || null },
      { name: 'SoGiuong', type: sql.Int, value: Number(data.soGiuong) || null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    const rows = result.recordset;
    const room = rows[0] || {};
    return {
      ...room,
      giuong: rows
        .filter((row) => row.maGiuong)
        .map((row) => ({
          maGiuong: row.maGiuong,
          soGiuong: row.soGiuong,
          tinhTrangGiuong: row.tinhTrangGiuong
        }))
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatPhong(id, data, user = {}) {
  try {
    const uploadedImageUrl = await saveRoomImageUpload(data.anhPhong);
    const result = await executeProcedure('dbo.SP_Admin_QuanLyPhong', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'CAP_NHAT' },
      { name: 'MaPhong', type: sql.VarChar(4), value: id },
      { name: 'TenPhong', type: sql.NVarChar(100), value: data.tenPhong || null },
      { name: 'GioiTinhChoPhep', type: sql.NVarChar(20), value: data.gioiTinhChoPhep || null },
      { name: 'TinhTrang', type: sql.NVarChar(20), value: data.tinhTrang || data.trangThai || null },
      { name: 'UrlImg', type: sql.VarChar(500), value: uploadedImageUrl || data.urlImg || null },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: data.maChiNhanh || null },
      { name: 'MaLoaiPhong', type: sql.VarChar(6), value: data.maLoaiPhong || null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset?.[0] || { success: true };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function xoaPhong(id, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyPhong', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'XOA' },
      { name: 'MaPhong', type: sql.VarChar(4), value: id },
      { name: 'TenPhong', type: sql.NVarChar(100), value: null },
      { name: 'GioiTinhChoPhep', type: sql.NVarChar(20), value: null },
      { name: 'TinhTrang', type: sql.NVarChar(20), value: null },
      { name: 'UrlImg', type: sql.VarChar(500), value: null },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: null },
      { name: 'MaLoaiPhong', type: sql.VarChar(6), value: null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset?.[0] || { success: true };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatTrangThaiPhongGiuong(data, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_CapNhatTrangThaiPhongGiuong', [
      { name: 'LoaiDoiTuong', type: sql.NVarChar(20), value: data.loaiDoiTuong },
      { name: 'MaPhong', type: sql.VarChar(4), value: data.maPhong },
      { name: 'MaGiuong', type: sql.VarChar(3), value: data.maGiuong || null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: data.trangThai },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    const rows = result.recordset;
    if (rows && rows.length > 0) {
      const room = rows[0] || {};
      return {
        ...room,
        giuong: rows
          .filter((row) => row.maGiuong)
          .map((row) => ({
            maGiuong: row.maGiuong,
            soGiuong: row.soGiuong,
            tinhTrangGiuong: row.tinhTrangGiuong
          }))
      };
    }
    return null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function taoTaiKhoanNhanVien(data, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_TaoTaiKhoanNhanVien', [
      { name: 'TenDangNhap', type: sql.VarChar(50), value: data.tenDangNhap },
      { name: 'MatKhau', type: sql.VarChar(255), value: data.matKhau },
      { name: 'HoTen', type: sql.NVarChar(100), value: data.hoTen },
      { name: 'NgaySinh', type: sql.Date, value: data.ngaySinh },
      { name: 'GioiTinh', type: sql.NVarChar(5), value: data.gioiTinh },
      { name: 'SDT', type: sql.VarChar(20), value: data.soDienThoai },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: data.diaChi || null },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: data.maChiNhanh },
      { name: 'NgayVaoLam', type: sql.Date, value: data.ngayVaoLam },
      { name: 'ChucVu', type: sql.NVarChar(20), value: data.chucVu },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset[0];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function khoaMoTaiKhoan(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_KhoaMoTaiKhoan', [
      { name: 'MaNhanVien', type: sql.VarChar(6), value: data.maNhanVien },
      { name: 'TrangThai', type: sql.NVarChar(20), value: data.isLocked ? 'Vô hiệu hóa' : 'Hoạt động' },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset[0] || { success: true };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function ganChucVuNhanVien(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_GanChucVuNhanVien', [
      { name: 'MaNhanVien', type: sql.VarChar(6), value: data.maNhanVien },
      { name: 'ChucVu', type: sql.NVarChar(20), value: data.chucVu },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset[0] || { success: true };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatThongTinNhanVien(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_CapNhatThongTinNhanVien', [
      { name: 'MaNhanVien', type: sql.VarChar(6), value: data.maNhanVien },
      { name: 'HoTen', type: sql.NVarChar(100), value: data.hoTen || null },
      { name: 'NgaySinh', type: sql.Date, value: data.ngaySinh || null },
      { name: 'GioiTinh', type: sql.NVarChar(5), value: data.gioiTinh || null },
      { name: 'SDT', type: sql.VarChar(20), value: data.soDienThoai || null },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null },
      { name: 'DiaChi', type: sql.NVarChar(255), value: data.diaChi || null },
      { name: 'MaChiNhanh', type: sql.VarChar(6), value: data.maChiNhanh || null },
      { name: 'NgayVaoLam', type: sql.Date, value: data.ngayVaoLam || null },
      { name: 'TrangThaiTaiKhoan', type: sql.NVarChar(20), value: data.trangThaiTaiKhoan || null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset[0] || { success: true };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function quanLyDichVu(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyDichVu', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || 'DANH_SACH' },
      { name: 'MaDichVu', type: sql.VarChar(6), value: data.maDichVu || null },
      { name: 'TenDichVu', type: sql.NVarChar(100), value: data.tenDichVu || null },
      { name: 'DonViTinh', type: sql.VarChar(20), value: data.donViTinh || null },
      { name: 'DonGia', type: sql.Decimal(15, 2), value: data.donGia || null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function quanLyQuyDinhHoanCoc(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_CauHinhQuyDinhHoanCoc', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || 'DANH_SACH' },
      { name: 'MaQuyDinhHoanCoc', type: sql.VarChar(6), value: data.maQuyDinhHoanCoc || null },
      { name: 'TenQuyDinh', type: sql.NVarChar(255), value: data.tenQuyDinh || null },
      { name: 'TyLeHoanCoc', type: sql.Decimal(5, 2), value: data.tyLeHoanCoc !== undefined ? data.tyLeHoanCoc : null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function quanLyNoiQuy(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyNoiQuy', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || 'DANH_SACH' },
      { name: 'MaQuyDinh', type: sql.VarChar(6), value: data.maQuyDinh || null },
      { name: 'TieuDeNoiQuy', type: sql.NVarChar(255), value: data.tieuDeNoiQuy || null },
      { name: 'NoiDung', type: sql.NVarChar(sql.MAX), value: data.noiDung || null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: data.trangThai || null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function quanLyDieuKhoanViPham(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyDieuKhoanViPham', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || 'DANH_SACH' },
      { name: 'MaDieuKhoan', type: sql.VarChar(6), value: data.maDieuKhoan || null },
      { name: 'TenDieuKhoan', type: sql.NVarChar(255), value: data.tenDieuKhoan || null },
      { name: 'HinhThucXuPhat', type: sql.NVarChar(20), value: data.hinhThucXuPhat || null },
      { name: 'MucPhat', type: sql.Decimal(15, 2), value: data.mucPhat || null },
      { name: 'TrangThai', type: sql.NVarChar(20), value: data.trangThai || null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getSettings() {
  try {
    const thamSoResult = await executeProcedure('dbo.SP_Admin_CauHinhThamSo', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: 'DANH_SACH' }
    ]);
    const saoLuuResult = await executeProcedure('dbo.SP_Admin_CauHinhSaoLuu', []);
    
    return {
      parameters: thamSoResult.recordset,
      backup: saoLuuResult.recordset[0] || null
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function updateSettings(data, user = {}) {
  try {
    if (data.maThamSoCoc) {
      await executeProcedure('dbo.SP_Admin_CauHinhThamSo', [
        { name: 'ThaoTac', type: sql.NVarChar(20), value: 'CAP_NHAT' },
        { name: 'MaThamSo', type: sql.VarChar(50), value: data.maThamSoCoc },
        { name: 'GiaTri', type: sql.NVarChar(255), value: data.thoiHanCoc?.toString() },
        { name: 'DonViTinh', type: sql.NVarChar(30), value: data.donViCoc },
        { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
      ]);
    }
    
    await executeProcedure('dbo.SP_Admin_CauHinhSaoLuu', [
      { name: 'ChuKyFull', type: sql.NVarChar(20), value: data.chuKyFull || null },
      { name: 'ChuKyIncremental', type: sql.NVarChar(20), value: data.chuKyIncremental || null },
      { name: 'ThuMucLuuTru', type: sql.NVarChar(500), value: data.thuMucLuuTru || null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);

    return { message: 'Cập nhật cấu hình thành công' };
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDanhSachSaoLuu(query = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_DanhSachSaoLuu', [
      { name: 'SoDong', type: sql.Int, value: query.soDong ? Number(query.soDong) : 100 },
      { name: 'TrangThai', type: sql.NVarChar(20), value: query.trangThai || null },
      { name: 'LoaiSaoLuu', type: sql.NVarChar(20), value: query.loaiSaoLuu || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function saoLuuThuCong(data = {}, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_SaoLuuThuCong', [
      { name: 'LoaiSaoLuu', type: sql.NVarChar(20), value: data.loaiSaoLuu || 'Full' },
      { name: 'DuongDanFile', type: sql.NVarChar(500), value: data.duongDanFile || null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null }
    ]);
    return result.recordset?.[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function phucHoiDuLieu(maSaoLuu, data = {}, user = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_PhucHoiDuLieu', [
      { name: 'MaSaoLuu', type: sql.Int, value: Number(maSaoLuu) || null },
      { name: 'DuongDanFile', type: sql.NVarChar(500), value: data.duongDanFile || null },
      { name: 'AdminId', type: sql.VarChar(6), value: user.maNguoiDung || null },
      { name: 'ChiTaoLenh', type: sql.Bit, value: data.chiTaoLenh !== false }
    ]);
    return result.recordset?.[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getNhatKyHeThong(query = {}) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_XemNhatKyHeThong', [
      { name: 'TuNgay', type: sql.DateTime2, value: query.tuNgay || null },
      { name: 'DenNgay', type: sql.DateTime2, value: query.denNgay || null },
      { name: 'AdminId', type: sql.VarChar(6), value: query.adminId || null },
      { name: 'DoiTuong', type: sql.NVarChar(100), value: query.doiTuong || null },
      { name: 'HanhDong', type: sql.NVarChar(100), value: query.hanhDong || null },
      { name: 'TuKhoa', type: sql.NVarChar(100), value: query.tuKhoa || null },
      { name: 'SoDong', type: sql.Int, value: query.soDong ? Number(query.soDong) : 200 }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function quanLyGiuong(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyGiuong', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || 'DANH_SACH' },
      { name: 'MaPhong', type: sql.VarChar(4), value: data.maPhong || null },
      { name: 'MaGiuong', type: sql.VarChar(3), value: data.maGiuong || null },
      { name: 'SoGiuong', type: sql.Int, value: data.soGiuong !== undefined ? data.soGiuong : null },
      { name: 'TinhTrang', type: sql.NVarChar(20), value: data.tinhTrang || null },
      { name: 'UrlImg', type: sql.VarChar(500), value: data.urlImg || null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function quanLyTaiSanPhong(data) {
  try {
    const result = await executeProcedure('dbo.SP_Admin_QuanLyTaiSanPhong', [
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || 'DANH_SACH' },
      { name: 'MaPhong', type: sql.VarChar(4), value: data.maPhong || null },
      { name: 'MaTaiSan', type: sql.VarChar(6), value: data.maTaiSan || null },
      { name: 'TenTaiSan', type: sql.NVarChar(100), value: data.tenTaiSan || null },
      { name: 'SoLuong', type: sql.Int, value: data.soLuong !== undefined ? data.soLuong : null },
      { name: 'DonGia', type: sql.Decimal(15, 2), value: data.donGia !== undefined ? data.donGia : null },
      { name: 'LoaiTaiSan', type: sql.NVarChar(20), value: data.loaiTaiSan || null },
      { name: 'MaGiuong', type: sql.VarChar(3), value: data.maGiuong || null },
      { name: 'AdminId', type: sql.VarChar(6), value: data.adminId || null }
    ]);
    return result.recordset || [];
  } catch (error) {
    handleDatabaseError(error);
  }
}
