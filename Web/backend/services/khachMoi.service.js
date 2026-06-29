import { executeProcedure, getPool, sql } from '../database/connection.js';
import { getDanhSachPhongKhamPha } from './phongKhamPha.service.js';
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
  const keyword = String(filter.tuKhoa || filter.tenPhong || '').trim();
  const result = await executeProcedure('dbo.SP_KhachMoi_DanhSachPhong', [
    { name: 'TenPhong', type: sql.NVarChar(100), value: keyword || null },
    { name: 'LoaiPhong', type: sql.NVarChar(100), value: filter.loaiPhong || filter.loai || null },
    { name: 'KhuVuc', type: sql.NVarChar(100), value: filter.khuVuc || null },
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: filter.mucGiaToiDa ? Number(filter.mucGiaToiDa) : null }
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
    let finalGhiChu = data.ghiChu || '';

    const result = await executeProcedure('dbo.SP_KhachMoi_TaoHoSo', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
      { name: 'GioiTinh', type: sql.NVarChar(10), value: data.gioiTinhThue || null },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(50), value: data.loaiPhongYeuCau || null },
      { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: data.mucGiaToiDa == null || data.mucGiaToiDa === '' ? null : Number(data.mucGiaToiDa) },
      { name: 'SoNguoiO', type: sql.Int, value: soNguoiO },
      { name: 'NgayDuKienVaoO', type: sql.Date, value: ngayDuKienVaoO },
      { name: 'ThoiHanThue', type: sql.Int, value: data.thoiHanThue ? Number(data.thoiHanThue) : null },
      { name: 'PhongQuanTam', type: sql.NVarChar(400), value: data.phongQuanTam || null },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: finalGhiChu || null }
    ]);

    return result.recordset[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getHoSoDetail(user, maDangKy) {
  const khachHangId = requireCustomer(user);
  if (!maDangKy) throw createServiceError('Mã đăng ký không hợp lệ', 400);

  const pool = await getPool();
  const result = await pool.request()
    .input('KhachHangId', sql.VarChar(6), khachHangId)
    .input('MaDangKy', sql.VarChar(6), maDangKy)
    .query(`
      SELECT
        pdk.MaDangKy,
        pdk.NgayDangKy,
        pdk.KhuVucMongMuon,
        pdk.LoaiPhongYeuCau,
        pdk.MucGiaToiDa,
        pdk.SoNguoiDuKienO  AS soNguoiO,
        pdk.GioiTinh,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.ThoiHanThue,
        pdk.YeuCauKhac AS ghiChu,
        pdk.TrangThai
      FROM dbo.PhieuDangKy AS pdk
      WHERE pdk.MaDangKy = @MaDangKy
        AND pdk.MaKhachHang = @KhachHangId;
    `);

  const record = result.recordset[0];
  if (!record) throw createServiceError('Không tìm thấy hồ sơ', 404);
  return record;
}

export async function updateHoSo(user, maDangKy, data = {}) {
  const khachHangId = requireCustomer(user);
  if (!maDangKy) throw createServiceError('Mã đăng ký không hợp lệ', 400);

  const pool = await getPool();
  const checkResult = await pool.request()
    .input('MaDangKy', sql.VarChar(6), maDangKy)
    .input('KhachHangId', sql.VarChar(6), khachHangId)
    .query(`SELECT TrangThai FROM dbo.PhieuDangKy WHERE MaDangKy = @MaDangKy AND MaKhachHang = @KhachHangId;`);

  if (!checkResult.recordset[0]) throw createServiceError('Không tìm thấy hồ sơ', 404);
  const { TrangThai } = checkResult.recordset[0];
  if (TrangThai !== 'Chờ tiếp nhận') {
    throw createServiceError(`Không thể cập nhật hồ sơ đang ở trạng thái "${TrangThai}"`, 400);
  }



  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    await transaction.request()
      .input('MaDangKy', sql.VarChar(6), maDangKy)
      .input('GioiTinh', sql.NVarChar(10), data.gioiTinh || null)
      .input('KhuVucMongMuon', sql.NVarChar(100), data.khuVucMongMuon || null)
      .input('LoaiPhongYeuCau', sql.NVarChar(50), data.loaiPhongYeuCau || null)
      .input('MucGiaToiDa', sql.Decimal(15, 2), data.mucGiaToiDa ? Number(data.mucGiaToiDa) : null)
      .input('SoNguoiO', sql.Int, data.soNguoiO ? Number(data.soNguoiO) : null)
      .input('NgayDuKienVaoO', sql.Date, data.ngayDuKienVaoO || null)
      .input('ThoiHanThue', sql.Int, data.thoiHanThue ? Number(data.thoiHanThue) : null)
      .input('GhiChu', sql.NVarChar(sql.MAX), data.ghiChu || null)
      .query(`
        UPDATE dbo.PhieuDangKy SET
          GioiTinh            = @GioiTinh,
          KhuVucMongMuon      = @KhuVucMongMuon,
          LoaiPhongYeuCau     = @LoaiPhongYeuCau,
          MucGiaToiDa         = @MucGiaToiDa,
          SoNguoiDuKienO      = @SoNguoiO,
          ThoiGianDuKienVaoO  = @NgayDuKienVaoO,
          ThoiHanThue         = @ThoiHanThue,
          YeuCauKhac          = @GhiChu
        WHERE MaDangKy = @MaDangKy;
      `);

    if (data.hoTen) {
      await transaction.request()
        .input('KhachHangId', sql.VarChar(6), khachHangId)
        .input('HoTen', sql.NVarChar(100), data.hoTen)
        .input('NgaySinh', sql.Date, data.ngaySinh || null)
        .input('GioiTinh', sql.NVarChar(5), data.gioiTinh || null)
        .input('SDT', sql.VarChar(20), data.soDienThoai || null)
        .input('Email', sql.VarChar(100), data.email || null)
        .query(`
          UPDATE dbo.NguoiDung SET
            HoTen = @HoTen,
            NgaySinh = @NgaySinh,
            GioiTinh = @GioiTinh,
            SDT = @SDT,
            Email = @Email
          WHERE MaNguoiDung = @KhachHangId;
        `);
    }

    if (data.quocTich || data.cccd) {
      await transaction.request()
        .input('KhachHangId', sql.VarChar(6), khachHangId)
        .input('QuocTich', sql.NVarChar(50), data.quocTich || null)
        .input('CCCD', sql.VarChar(20), data.cccd || null)
        .query(`
          UPDATE dbo.KhachHang SET
            QuocTich = @QuocTich,
            CCCD = @CCCD
          WHERE MaKhachHang = @KhachHangId;
        `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  return getHoSoDetail(user, maDangKy);
}

export async function getLichXemDetail(user, id) {
  const khachHangId = requireCustomer(user);
  const [maDangKy, sttText] = String(id || '').split('-');
  const sttLich = Number(sttText);

  if (!maDangKy || !Number.isInteger(sttLich)) {
    throw createServiceError('Mã lịch xem phòng không hợp lệ', 400);
  }

  try {
    const result = await executeProcedure('dbo.SP_KhachMoi_ChiTietLichXem', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
      { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
      { name: 'STTLich', type: sql.Int, value: sttLich }
    ]);

    const detail = result.recordsets?.[0]?.[0] || null;
    if (!detail) throw createServiceError('Không tìm thấy lịch xem phòng', 404);

    return {
      ...detail,
      phongXem: result.recordsets?.[1] || []
    };
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
      { name: 'ThoiGianMoi', type: sql.NVarChar(255), value: data.thoiGianMoi || null },
      { name: 'LyDo', type: sql.NVarChar(sql.MAX), value: data.lyDo || null }
    ]);

    return result.recordset;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getDatCoc(user) {
  const khachHangId = requireCustomer(user);
  const pool = await getPool();
  const result = await pool.request()
    .input('KhachHangId', sql.VarChar(6), khachHangId)
    .query(`
      SELECT
        pdc.MaPhieuDatCoc          AS maPhieuCoc,
        pdc.MaPhieuYeuCauDangKy    AS maDangKy,
        pdc.ThoiDiemDatCoc         AS ngayLap,
        pdc.ThoiHanThanhToan       AS thoiHanThanhToan,
        pdc.SoTienCoc              AS soTienCoc,
        pdc.PhuongThucThanhToan    AS phuongThucThanhToan,
        pdc.TrangThaiThanhToan     AS trangThaiThanhToan,
        pdc.TrangThaiCoc           AS trangThaiCoc,
        pdc.ChungTuThanhToan       AS minhChungThanhToan,
        pdc.ThoiGianXacNhanTT      AS thoiGianXacNhanTT,
        -- Trạng thái hiển thị cho frontend
        CASE
          WHEN pdc.TrangThaiThanhToan = N'Hết hạn' OR pdc.TrangThaiCoc = N'Đã hủy'
            THEN N'Hết hạn'
          WHEN pdc.TrangThaiThanhToan = N'Chờ TT'
            THEN N'Chờ thanh toán'
          WHEN pdc.TrangThaiThanhToan = N'Đã TT' AND pdc.ThoiGianXacNhanTT IS NOT NULL
            THEN N'Hoàn tất'
          WHEN pdc.ChungTuThanhToan IS NOT NULL
            THEN N'Chờ xác nhận'
          ELSE pdc.TrangThaiThanhToan
        END                        AS trangThai,
        -- Thông tin phòng (từ ChiTietDatCoc)
        p.TenPhong                 AS tenPhong,
        p.MaPhong                  AS maPhong,
        cn.DiaChi                  AS diaChi,
        lp.TenLoaiPhong            AS loaiPhong,
        cn.TenChiNhanh             AS tenChiNhanh,
        -- Nhân viên sale phụ trách
        nd.HoTen                   AS tenNhanVienPhuTrach
      FROM dbo.PhieuDatCoc AS pdc
      -- Lấy 1 chi tiết đặt cọc đầu tiên (phòng/giường đầu tiên)
      OUTER APPLY (
        SELECT TOP 1 ctdc.MaPhong
        FROM dbo.ChiTietDatCoc AS ctdc
        WHERE ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        ORDER BY ctdc.MaChiTietDC
      ) AS ct
      LEFT JOIN dbo.Phong    AS p  ON p.MaPhong    = ct.MaPhong
      LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
      LEFT JOIN dbo.ChiNhanh  AS cn ON cn.MaChiNhanh  = p.MaChiNhanh
      LEFT JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = pdc.MaPhieuYeuCauDangKy
      LEFT JOIN dbo.NhanVien    AS nv  ON nv.MaNhanVien = pdk.MaNhanVienSale
      LEFT JOIN dbo.NguoiDung   AS nd  ON nd.MaNguoiDung = nv.MaNhanVien
      WHERE pdc.MaKhachHang = @KhachHangId
      ORDER BY pdc.ThoiDiemDatCoc DESC;
    `);
  return result.recordset;
}

export async function uploadMinhChungKhachHang(user, maPhieuCoc, data = {}) {
  const khachHangId = requireCustomer(user);
  if (!maPhieuCoc) throw createServiceError('Mã phiếu cọc không hợp lệ', 400);

  const pool = await getPool();
  // Verify ownership and status
  const check = await pool.request()
    .input('MaPhieuCoc', sql.VarChar(6), maPhieuCoc)
    .input('KhachHangId', sql.VarChar(6), khachHangId)
    .query(`
      SELECT pdc.MaPhieuDatCoc, pdc.TrangThaiThanhToan
      FROM dbo.PhieuDatCoc AS pdc
      WHERE pdc.MaPhieuDatCoc = @MaPhieuCoc
        AND pdc.MaKhachHang   = @KhachHangId;
    `);

  if (!check.recordset[0]) throw createServiceError('Không tìm thấy phiếu cọc', 404);
  if (check.recordset[0].TrangThaiThanhToan !== 'Chờ TT') {
    throw createServiceError('Phiếu cọc không ở trạng thái chờ thanh toán', 400);
  }

  const minhChung = typeof data.minhChung === 'string'
    ? data.minhChung
    : JSON.stringify(data.minhChung || {});

  await pool.request()
    .input('MaPhieuCoc', sql.VarChar(6), maPhieuCoc)
    .input('MinhChung', sql.NVarChar(sql.MAX), minhChung)
    .query(`
      UPDATE dbo.PhieuDatCoc
      SET ChungTuThanhToan = @MinhChung
      WHERE MaPhieuDatCoc = @MaPhieuCoc;
    `);

  return { maPhieuCoc, trangThai: 'Chờ xác nhận' };
}

export async function getHopDongDashboard(user) {
  const khachHangId = requireCustomer(user);
  const pool = await getPool();
  const result = await pool.request()
    .input('MaKhachHang', sql.VarChar(6), khachHangId)
    .execute('sp_GetHopDongDashboard');

  if (!result.recordsets || result.recordsets.length === 0 || !result.recordsets[0] || result.recordsets[0].length === 0) {
    return { data: null };
  }

  const hopDong = result.recordsets[0][0];
  const taiSan = result.recordsets[1] || [];
  const quyDinh = result.recordsets[2] || [];

  hopDong.taiSan = taiSan;
  hopDong.quyDinh = quyDinh;

  return { data: hopDong };
}
