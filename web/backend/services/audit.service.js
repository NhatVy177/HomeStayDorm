import { executeProcedure, sql } from '../database/connection.js';

function safeJson(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getUserRole(user = {}) {
  return [user.vaiTro, user.chucVu].filter(Boolean).join(' - ') || null;
}

export async function ghiNhatKy({
  user = {},
  chucNang,
  hanhDong,
  doiTuong,
  maDoiTuong,
  noiDung,
  duLieuTruoc,
  duLieuSau
} = {}) {
  if (!hanhDong) return;

  const payload = {
    adminId: user.maNguoiDung || user.id || null,
    vaiTro: getUserRole(user),
    chucNang: chucNang || null,
    hanhDong,
    doiTuong: doiTuong || null,
    maDoiTuong: maDoiTuong ? String(maDoiTuong) : null,
    noiDung: safeJson(noiDung),
    duLieuTruoc: safeJson(duLieuTruoc),
    duLieuSau: safeJson(duLieuSau)
  };

  try {
    await executeProcedure('dbo.SP_Admin_GhiNhatKy', [
      { name: 'AdminId', type: sql.VarChar(6), value: payload.adminId },
      { name: 'VaiTro', type: sql.NVarChar(50), value: payload.vaiTro },
      { name: 'ChucNang', type: sql.NVarChar(100), value: payload.chucNang },
      { name: 'HanhDong', type: sql.NVarChar(100), value: payload.hanhDong },
      { name: 'DoiTuong', type: sql.NVarChar(100), value: payload.doiTuong },
      { name: 'MaDoiTuong', type: sql.NVarChar(50), value: payload.maDoiTuong },
      { name: 'NoiDung', type: sql.NVarChar(sql.MAX), value: payload.noiDung },
      { name: 'DuLieuTruoc', type: sql.NVarChar(sql.MAX), value: payload.duLieuTruoc },
      { name: 'DuLieuSau', type: sql.NVarChar(sql.MAX), value: payload.duLieuSau }
    ]);
  } catch (error) {
    await ghiNhatKyFallback(payload, error);
  }
}

async function ghiNhatKyFallback(payload, originalError) {
  try {
    const mergedNoiDung = safeJson({
      vaiTro: payload.vaiTro,
      chucNang: payload.chucNang,
      noiDung: payload.noiDung,
      auditWarning: 'Fallback do DB chua cap nhat cot VaiTro/ChucNang hoac tham so SP_Admin_GhiNhatKy.',
      originalError: originalError?.message
    });

    await executeProcedure('dbo.SP_Admin_GhiNhatKy', [
      { name: 'AdminId', type: sql.VarChar(6), value: payload.adminId },
      { name: 'HanhDong', type: sql.NVarChar(100), value: payload.hanhDong },
      { name: 'DoiTuong', type: sql.NVarChar(100), value: payload.doiTuong },
      { name: 'MaDoiTuong', type: sql.NVarChar(50), value: payload.maDoiTuong },
      { name: 'NoiDung', type: sql.NVarChar(sql.MAX), value: mergedNoiDung },
      { name: 'DuLieuTruoc', type: sql.NVarChar(sql.MAX), value: payload.duLieuTruoc },
      { name: 'DuLieuSau', type: sql.NVarChar(sql.MAX), value: payload.duLieuSau }
    ]);
  } catch {
    // Logging must never break the main business flow.
  }
}
