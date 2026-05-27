import { executeProcedure, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function requireCustomer(user) {
  if (!user || user.vaiTro !== 'KhachHang') {
    throw createServiceError('Chuc nang nay chi danh cho khach hang', 403);
  }

  return user.maNguoiDung;
}

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50101: 404,
    50102: 409,
    50103: 409,
    50104: 400,
    50105: 404,
    50106: 400
  });
}

async function getCustomerState(khachHangId) {
  try {
    const result = await executeProcedure('dbo.SP_KhachMoi_TrangThai', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId }
    ]);
    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

async function assertNewCustomer(khachHangId) {
  const state = await getCustomerState(khachHangId);
  if (!state?.laKhachMoi) {
    throw createServiceError('Tai khoan da co coc hoac hop dong, khong thuoc cong khach moi', 409);
  }
  return state;
}

export async function getTrangThai(user) {
  const khachHangId = requireCustomer(user);
  return getCustomerState(khachHangId);
}

async function getProfiles(khachHangId) {
  const result = await executeProcedure('dbo.SP_KhachMoi_DanhSachHoSo', [
    { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId }
  ]);
  return result.recordset;
}

async function getSchedules(khachHangId) {
  const result = await executeProcedure('dbo.SP_KhachMoi_DanhSachLichXem', [
    { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId }
  ]);
  return result.recordset;
}

async function getAvailableRooms(filter = {}) {
  const maxPrice = filter.mucGiaToiDa ? Number(filter.mucGiaToiDa) : null;
  const result = await executeProcedure('dbo.SP_KhachMoi_DanhSachPhong', [
    { name: 'LoaiPhong', type: sql.NVarChar(100), value: filter.loaiPhong || null },
    { name: 'KhuVuc', type: sql.NVarChar(100), value: filter.khuVuc || null },
    {
      name: 'MucGiaToiDa',
      type: sql.Decimal(15, 2),
      value: Number.isFinite(maxPrice) ? maxPrice : null
    }
  ]);
  return result.recordset;
}

export async function getTongQuan(user) {
  const khachHangId = requireCustomer(user);
  const trangThai = await assertNewCustomer(khachHangId);
  const [hoSo, lichXem, phongGoiY] = await Promise.all([
    getProfiles(khachHangId),
    getSchedules(khachHangId),
    getAvailableRooms()
  ]);

  return {
    trangThai,
    hoSo,
    lichXem,
    phongGoiY: phongGoiY.slice(0, 3)
  };
}

export async function getPhongKhaDung(user, filter = {}) {
  const khachHangId = requireCustomer(user);
  await assertNewCustomer(khachHangId);
  return getAvailableRooms(filter);
}

export async function createHoSo(user, data = {}) {
  const khachHangId = requireCustomer(user);
  const soNguoiO = Number(data.soNguoiO || 1);
  const ngayDuKienVaoO = data.ngayDuKienVaoO || null;

  if (!ngayDuKienVaoO || !Number.isInteger(soNguoiO) || soNguoiO < 1) {
    throw createServiceError('Vui long nhap ngay du kien va so nguoi o');
  }

  try {
    const result = await executeProcedure('dbo.SP_KhachMoi_TaoHoSo', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
      { name: 'HinhThucThue', type: sql.NVarChar(20), value: data.hinhThucThue || 'Ghép' },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(50), value: data.loaiPhongYeuCau || null },
      {
        name: 'MucGia',
        type: sql.Decimal(15, 2),
        value: data.mucGia == null || data.mucGia === '' ? null : Number(data.mucGia)
      },
      { name: 'SoNguoiO', type: sql.Int, value: soNguoiO },
      { name: 'NgayDuKienVaoO', type: sql.Date, value: ngayDuKienVaoO },
      { name: 'PhongQuanTam', type: sql.NVarChar(400), value: data.phongQuanTam || null },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: data.ghiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function yeuCauDieuChinhLich(user, id, data = {}) {
  const khachHangId = requireCustomer(user);
  const [maDangKy, sttText] = String(id || '').split('-');
  const sttLich = Number(sttText);
  if (!maDangKy || !Number.isInteger(sttLich)) {
    throw createServiceError('Ma lich xem phong khong hop le');
  }

  try {
    const result = await executeProcedure('dbo.SP_KhachMoi_YeuCauDieuChinhLich', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
      { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
      { name: 'STTLich', type: sql.Int, value: sttLich },
      { name: 'ThaoTac', type: sql.NVarChar(20), value: data.thaoTac || null },
      { name: 'ThoiGianMoi', type: sql.DateTime, value: data.thoiGianMoi || null },
      { name: 'LyDo', type: sql.NVarChar(sql.MAX), value: data.lyDo || null }
    ]);

    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}
