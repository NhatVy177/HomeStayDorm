import { createHmac, timingSafeEqual } from 'node:crypto';
import { executeProcedure, executeQuery, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'happyroom-auth-secret';
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getAuthSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = createHmac('sha256', getAuthSecret()).update(body).digest();
  const actualSignature = Buffer.from(signature, 'base64url');
  if (expectedSignature.length !== actualSignature.length) {
    return null;
  }

  if (!timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function toUser(record) {
  const user = {
    id: record.maNguoiDung ?? record.MaNguoiDung,
    maNguoiDung: record.maNguoiDung ?? record.MaNguoiDung,
    tenDangNhap: record.tenDangNhap ?? record.TenDangNhap,
    hoTen: record.hoTen ?? record.HoTen,
    ngaySinh: record.ngaySinh ?? record.NgaySinh,
    gioiTinh: record.gioiTinh ?? record.GioiTinh,
    email: record.email ?? record.Email,
    soDienThoai: record.soDienThoai ?? record.SoDienThoai ?? record.sdt ?? record.SDT,
    vaiTro: record.vaiTro ?? record.VaiTro ?? record.loaiNguoiDung ?? record.LoaiNguoiDung,
    trangThai: record.trangThai ?? record.TrangThai,
    chucVu: record.chucVu ?? record.ChucVu ?? null,
    maChiNhanh: record.maChiNhanh ?? record.MaChiNhanh ?? null,
    quocTich: record.quocTich ?? record.QuocTich ?? null,
    cccd: record.cccd ?? record.CCCD ?? null
  };

  return {
    token: signToken({
      maNguoiDung: user.maNguoiDung,
      tenDangNhap: user.tenDangNhap,
      hoTen: user.hoTen,
      ngaySinh: user.ngaySinh,
      gioiTinh: user.gioiTinh,
      email: user.email,
      soDienThoai: user.soDienThoai,
      vaiTro: user.vaiTro,
      trangThai: user.trangThai,
      chucVu: user.chucVu,
      maChiNhanh: user.maChiNhanh,
      quocTich: user.quocTich,
      cccd: user.cccd,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    }),
    user
  };
}

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50001: 400,
    50002: 409,
    50003: 400,
    50004: 401,
    50005: 401,
    50006: 409
  });
}

export async function dangKy(data = {}) {
  const tenDangNhap = String(data.tenDangNhap || '').trim();
  const matKhau = String(data.matKhau || '');
  const xacNhanMatKhau = String(data.xacNhanMatKhau || '');
  const hoTen = String(data.hoTen || '').trim();
  const ngaySinh = data.ngaySinh || null;
  const gioiTinh = String(data.gioiTinh || '').trim();
  const soDienThoai = String(data.soDienThoai || '').trim();

  if (!tenDangNhap || !matKhau || !xacNhanMatKhau || !hoTen || !ngaySinh || !gioiTinh || !soDienThoai) {
    throw createServiceError('Vui long nhap day du cac thong tin bat buoc');
  }

  if (matKhau !== xacNhanMatKhau) {
    throw createServiceError('Mat khau xac nhan khong khop');
  }

  if (!['Nam', 'Nữ'].includes(gioiTinh)) {
    throw createServiceError('Gioi tinh khong hop le');
  }

  if (!/^\d{10}$/.test(soDienThoai)) {
    throw createServiceError('Số điện thoại phải có đúng 10 chữ số.');
  }

  try {
    const result = await executeProcedure('dbo.SP_DangKy', [
      { name: 'TenDangNhap', type: sql.VarChar(50), value: tenDangNhap },
      { name: 'MatKhau', type: sql.VarChar(255), value: matKhau },
      { name: 'HoTen', type: sql.NVarChar(100), value: hoTen },
      { name: 'NgaySinh', type: sql.Date, value: ngaySinh },
      { name: 'GioiTinh', type: sql.NVarChar(5), value: gioiTinh },
      { name: 'SDT', type: sql.VarChar(20), value: soDienThoai },
      { name: 'Email', type: sql.VarChar(100), value: data.email || null }
    ]);

    const record = result.recordset[0];
    return record ? toUser(record) : null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function kiemTraSoDienThoai(value) {
  const soDienThoai = String(value || '').replace(/\D/g, '').slice(0, 10);
  if (!/^\d{10}$/.test(soDienThoai)) {
    throw createServiceError('Số điện thoại phải có đúng 10 chữ số.');
  }

  const result = await executeQuery(`
    SELECT TOP (1)
      nd.MaNguoiDung AS maKhachHang,
      nd.HoTen AS hoTen,
      CAST(CASE WHEN tk.MaNguoiDung IS NOT NULL THEN 1 ELSE 0 END AS bit) AS daCoTaiKhoan,
      (SELECT COUNT(*) FROM dbo.PhieuDangKy pdk WHERE pdk.MaKhachHang = nd.MaNguoiDung) AS soPhieuDangKy
    FROM dbo.NguoiDung nd
    INNER JOIN dbo.KhachHang kh ON kh.MaKhachHang = nd.MaNguoiDung
    LEFT JOIN dbo.TaiKhoan tk ON tk.MaNguoiDung = nd.MaNguoiDung
    WHERE nd.SDT = @SDT
      AND nd.LoaiNguoiDung = 'KhachHang'
  `, [
    { name: 'SDT', type: sql.VarChar(20), value: soDienThoai }
  ]);
  const customer = result.recordset[0] || null;

  return {
    tonTaiKhachHang: Boolean(customer),
    daCoTaiKhoan: Boolean(customer?.daCoTaiKhoan),
    maKhachHang: customer?.maKhachHang || null,
    hoTen: customer?.hoTen || null,
    soPhieuDangKy: Number(customer?.soPhieuDangKy || 0),
    seLienKetDuLieu: Boolean(customer && !customer.daCoTaiKhoan),
    thongBao: customer?.daCoTaiKhoan
      ? 'Số điện thoại này đã được liên kết với một tài khoản.'
      : customer
        ? `Đã tìm thấy khách hàng${customer.soPhieuDangKy ? ` và ${customer.soPhieuDangKy} phiếu đăng ký` : ''}. Dữ liệu cũ sẽ được liên kết sau khi tạo tài khoản.`
        : null
  };
}

export async function dangNhap(data = {}) {
  const tenDangNhap = String(data.tenDangNhap || '').trim();
  const matKhau = String(data.matKhau || '');

  if (!tenDangNhap || !matKhau) {
    throw createServiceError('Vui long nhap ten dang nhap va mat khau');
  }

  try {
    const result = await executeProcedure('dbo.SP_DangNhap', [
      { name: 'TenDangNhap', type: sql.VarChar(50), value: tenDangNhap },
      { name: 'MatKhau', type: sql.VarChar(255), value: matKhau }
    ]);

    const record = result.recordset[0];
    return record ? toUser(record) : null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getSessionUser(token) {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    token,
    id: payload.maNguoiDung,
    maNguoiDung: payload.maNguoiDung,
    tenDangNhap: payload.tenDangNhap,
    hoTen: payload.hoTen,
    ngaySinh: payload.ngaySinh,
    gioiTinh: payload.gioiTinh,
    email: payload.email,
    soDienThoai: payload.soDienThoai,
    vaiTro: payload.vaiTro,
    trangThai: payload.trangThai,
    chucVu: payload.chucVu || null,
    maChiNhanh: payload.maChiNhanh || null,
    quocTich: payload.quocTich || null,
    cccd: payload.cccd || null
  };
}

export async function dangXuat(token) {
  return token;
}
