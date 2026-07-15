import { executeProcedure, executeQuery, getPool, sql } from '../database/connection.js';
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
    50010: 404,
    50011: 400,
    50101: 404,
    50102: 409,
    50103: 409,
    50104: 400,
    50105: 404,
    50106: 400
  });
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const raw = String(value).trim();
  if (!raw) return null;

  const numericText = raw.replace(/[^\d,.-]/g, '');
  const commaAsDecimal = numericText.includes(',') && numericText.lastIndexOf(',') > numericText.lastIndexOf('.');
  const cleaned = commaAsDecimal
    ? numericText.replace(/\./g, '').replace(',', '.')
    : numericText.replace(/,/g, '');
  const compact = (cleaned.match(/\./g) || []).length > 1
    ? cleaned.replace(/\./g, '')
    : cleaned;
  const number = Number(compact);

  return Number.isFinite(number) ? number : null;
}

function normalizeMoneyVnd(value) {
  const number = parseMoney(value);
  if (number == null || number <= 0) return null;
  const vnd = Math.round(number);
  const remainder = ((vnd % 1000) + 1000) % 1000;
  if (remainder <= 10) return vnd - remainder;
  if (1000 - remainder <= 10) return vnd + (1000 - remainder);
  return vnd;
}

const ACTIVE_RENT_FLOW_MESSAGE = 'Bạn đang có phiếu đăng ký/đặt cọc/hợp đồng chưa kết thúc. Chỉ được tạo phiếu đăng ký mới khi luồng thuê hiện tại kết thúc.';

async function getActiveRentFlow(khachHangId) {
  const id = String(khachHangId || '').trim();
  if (!id) return null;

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
        AND (
          NOT EXISTS (
            SELECT 1
            FROM dbo.LichXemPhong AS lxpAny
            WHERE lxpAny.MaDangKy = pdk.MaDangKy
          )
          OR EXISTS (
            SELECT 1
            FROM dbo.LichXemPhong AS lxpActive
            WHERE lxpActive.MaDangKy = pdk.MaDangKy
              AND lxpActive.TrangThai <> N'Đã hủy'
          )
        )
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
    { name: 'KhachHangId', type: sql.VarChar(6), value: id }
  ]);

  return result.recordset[0] || null;
}

async function assertCanCreateRentRegistration(khachHangId) {
  const activeFlow = await getActiveRentFlow(khachHangId);
  if (activeFlow) {
    throw createServiceError(
      `${ACTIVE_RENT_FLOW_MESSAGE} Đang tồn tại ${activeFlow.loai} ${activeFlow.maThamChieu} (${activeFlow.trangThai}).`,
      409
    );
  }
}

function assertContactFormat(data = {}) {
  const phone = String(data.soDienThoai || '').trim();
  const cccd = String(data.cccd || '').trim();

  if (phone && !/^\d{10}$/.test(phone)) {
    throw createServiceError('Số điện thoại phải có đúng 10 chữ số.');
  }
  if (cccd && !/^\d{12}$/.test(cccd)) {
    throw createServiceError('CCCD phải có đúng 12 chữ số.');
  }
}

async function assertUniqueCustomerContact(data = {}, khachHangId) {
  const phone = String(data.soDienThoai || '').trim() || null;
  const cccd = String(data.cccd || '').trim() || null;
  if (!phone && !cccd) return;

  const result = await executeQuery(`
    SELECT TOP (1)
      CASE
        WHEN @SDT IS NOT NULL AND nd.SDT = @SDT THEN N'SDT'
        WHEN @CCCD IS NOT NULL AND kh.CCCD = @CCCD THEN N'CCCD'
      END AS duplicateField
    FROM dbo.KhachHang AS kh
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = kh.MaKhachHang
    WHERE kh.MaKhachHang <> @KhachHangId
      AND (
        (@SDT IS NOT NULL AND nd.SDT = @SDT)
        OR (@CCCD IS NOT NULL AND kh.CCCD = @CCCD)
      );
  `, [
    { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
    { name: 'SDT', type: sql.VarChar(20), value: phone },
    { name: 'CCCD', type: sql.VarChar(20), value: cccd }
  ]);

  const duplicateField = result.recordset[0]?.duplicateField;
  if (duplicateField === 'SDT') {
    throw createServiceError('Số điện thoại đã tồn tại trong hồ sơ khách hàng khác.', 409);
  }
  if (duplicateField === 'CCCD') {
    throw createServiceError('CCCD đã tồn tại trong hồ sơ khách hàng khác.', 409);
  }
}

async function getCustomerState(khachHangId) {
  try {
    const result = await executeProcedure('dbo.SP_KhachMoi_TrangThai', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId }
    ]);
    const state = result.recordset[0] || null;
    if (!state) return null;

    const activeFlow = await getActiveRentFlow(khachHangId);
    return {
      ...state,
      coQuyTrinhThueDangHoatDong: Boolean(activeFlow),
      luongThueDangHoatDong: activeFlow || null,
      thongBaoKhoaDangKy: activeFlow
        ? `${ACTIVE_RENT_FLOW_MESSAGE} Đang tồn tại ${activeFlow.loai} ${activeFlow.maThamChieu} (${activeFlow.trangThai}).`
        : null
    };
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
  const cancelledResult = await executeQuery(`
    SELECT pdk.MaDangKy
    FROM dbo.PhieuDangKy AS pdk
    WHERE pdk.MaKhachHang = @KhachHangId
      AND pdk.TrangThai = N'Từ chối'
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
  `, [
    { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId }
  ]);
  const cancelledIds = new Set(cancelledResult.recordset.map((row) => row.MaDangKy));

  return result.recordset.map((row) => {
    const biHuyDoTatCaLich = cancelledIds.has(row.maDangKy);
    return {
      ...row,
      biHuyDoTatCaLich,
      trangThaiHienThi: biHuyDoTatCaLich ? 'Hủy' : row.trangThai
    };
  });
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
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: normalizeMoneyVnd(filter.mucGiaToiDa) }
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
  assertContactFormat(data);

  if (!ngayDuKienVaoO || !Number.isInteger(soNguoiO) || soNguoiO < 1) {
    throw createServiceError('Vui long nhap ngay du kien va so nguoi o');
  }

  await assertCanCreateRentRegistration(khachHangId);
  await assertUniqueCustomerContact(data, khachHangId);

  try {
    let finalGhiChu = data.ghiChu || '';

    const result = await executeProcedure('dbo.SP_KhachMoi_TaoHoSo', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
      { name: 'GioiTinh', type: sql.NVarChar(10), value: data.gioiTinhThue || null },
      { name: 'SoNamInput', type: sql.Int, value: data.soNam || 0 },
      { name: 'SoNuInput', type: sql.Int, value: data.soNu || 0 },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(200), value: data.loaiPhongYeuCau || null },
      { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: normalizeMoneyVnd(data.mucGiaToiDa) },
      { name: 'SoNguoiO', type: sql.Int, value: soNguoiO },
      { name: 'NgayDuKienVaoO', type: sql.Date, value: ngayDuKienVaoO },
      { name: 'ThoiHanThue', type: sql.Int, value: data.thoiHanThue ? Number(data.thoiHanThue) : null },
      { name: 'PhongQuanTam', type: sql.NVarChar(400), value: data.phongQuanTam || null },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: finalGhiChu || null },
      { name: 'HoTenKhach', type: sql.NVarChar(100), value: data.hoTen || null },
      { name: 'NgaySinhKhach', type: sql.Date, value: data.ngaySinh || null },
      { name: 'GioiTinhKhach', type: sql.NVarChar(5), value: data.gioiTinh || null },
      { name: 'SDTKhach', type: sql.VarChar(20), value: data.soDienThoai || null },
      { name: 'EmailKhach', type: sql.VarChar(100), value: data.email || null },
      { name: 'QuocTichKhach', type: sql.NVarChar(50), value: data.quocTich || null },
      { name: 'CCCDKhach', type: sql.VarChar(20), value: data.cccd || null }
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
        (SELECT STRING_AGG(lp.TenLoaiPhong, ', ')
         FROM dbo.PDK_LoaiPhong AS pdklp
         JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = pdklp.MaLoaiPhong
         WHERE pdklp.MaDangKy = pdk.MaDangKy) AS LoaiPhongYeuCau,
        pdk.MucGiaToiDa,
        pdk.MucGiaToiDa AS mucGia,
        pdk.SoNguoiDuKienO  AS soNguoiO,
        pdk.SoNam AS soNam,
        pdk.SoNu AS soNu,
        CASE
          WHEN ISNULL(pdk.SoNam, 0) > 0 AND ISNULL(pdk.SoNu, 0) = 0 THEN N'Nam'
          WHEN ISNULL(pdk.SoNu, 0) > 0 AND ISNULL(pdk.SoNam, 0) = 0 THEN N'Nữ'
          ELSE N'Khác'
        END AS GioiTinhThue,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.ThoiHanThue,
        pdk.YeuCauKhac AS ghiChu,
        pdk.TrangThai,
        CAST(CASE
          WHEN pdk.TrangThai = N'Từ chối'
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
            )
          THEN 1 ELSE 0
        END AS bit) AS biHuyDoTatCaLich,
        CASE
          WHEN pdk.TrangThai = N'Từ chối'
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
            )
          THEN N'Hủy'
          ELSE pdk.TrangThai
        END AS trangThaiHienThi,
        nd.HoTen AS hoTen,
        nd.NgaySinh AS ngaySinh,
        nd.GioiTinh AS gioiTinhKhach,
        nd.SDT AS soDienThoai,
        nd.Email AS email,
        kh.QuocTich AS quocTich,
        kh.CCCD AS cccd
      FROM dbo.PhieuDangKy AS pdk
      JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
      LEFT JOIN dbo.KhachHang AS kh ON kh.MaKhachHang = pdk.MaKhachHang
      WHERE pdk.MaDangKy = @MaDangKy
        AND pdk.MaKhachHang = @KhachHangId;
    `);

  const record = result.recordset[0];
  if (!record) throw createServiceError('Không tìm thấy hồ sơ', 404);
  return record;
}

export async function updateHoSo(user, maDangKy, data = {}) {
  const khachHangId = requireCustomer(user);
  assertContactFormat(data);
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



  await assertUniqueCustomerContact(data, khachHangId);

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    let soNam = data.soNam ? Number(data.soNam) : 0;
    let soNu = data.soNu ? Number(data.soNu) : 0;
    const soNguoiO = data.soNguoiO ? Number(data.soNguoiO) : null;
    const gioiTinhThue = data.gioiTinhThue || data.gioiTinh;
    if (gioiTinhThue === 'Nam') {
      soNam = soNguoiO || 0;
      soNu = 0;
    } else if (gioiTinhThue === 'Nữ') {
      soNu = soNguoiO || 0;
      soNam = 0;
    } else if (gioiTinhThue === 'Khác' || gioiTinhThue === 'Hỗn hợp') {
      if (soNam === 0 && soNu === 0) soNam = soNguoiO || 0;
    } else {
      soNam = soNguoiO || 0;
      soNu = 0;
    }

    await transaction.request()
      .input('MaDangKy', sql.VarChar(6), maDangKy)
      .input('SoNam', sql.Int, soNam)
      .input('SoNu', sql.Int, soNu)
      .input('KhuVucMongMuon', sql.NVarChar(100), data.khuVucMongMuon || null)
      .input('MucGiaToiDa', sql.Decimal(15, 2), normalizeMoneyVnd(data.mucGiaToiDa))
      .input('SoNguoiO', sql.Int, soNguoiO)
      .input('NgayDuKienVaoO', sql.Date, data.ngayDuKienVaoO || null)
      .input('ThoiHanThue', sql.Int, data.thoiHanThue ? Number(data.thoiHanThue) : null)
      .input('GhiChu', sql.NVarChar(sql.MAX), data.ghiChu || null)
      .query(`
        UPDATE dbo.PhieuDangKy SET
          SoNam               = @SoNam,
          SoNu                = @SoNu,
          KhuVucMongMuon      = @KhuVucMongMuon,
          MucGiaToiDa         = @MucGiaToiDa,
          SoNguoiDuKienO      = @SoNguoiO,
          ThoiGianDuKienVaoO  = @NgayDuKienVaoO,
          ThoiHanThue         = @ThoiHanThue,
          YeuCauKhac          = @GhiChu
        WHERE MaDangKy = @MaDangKy;
      `);

    await transaction.request()
      .input('MaDangKy', sql.VarChar(6), maDangKy)
      .query(`
        DELETE FROM dbo.PDK_LoaiPhong
        WHERE MaDangKy = @MaDangKy;
      `);

    if (data.loaiPhongYeuCau) {
      await transaction.request()
        .input('MaDangKy', sql.VarChar(6), maDangKy)
        .input('LoaiPhongYeuCau', sql.NVarChar(200), data.loaiPhongYeuCau)
        .query(`
          INSERT INTO dbo.PDK_LoaiPhong (MaDangKy, MaLoaiPhong)
          SELECT @MaDangKy, lp.MaLoaiPhong
          FROM dbo.LoaiPhong AS lp
          WHERE lp.TenLoaiPhong IN (
            SELECT LTRIM(RTRIM(value))
            FROM STRING_SPLIT(@LoaiPhongYeuCau, ',')
          );
        `);
    }

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
        pdc.HinhThucThue            AS hinhThucThue,

        pdc.ChungTuThanhToan       AS minhChungThanhToan,
        pdc.ThoiGianXacNhanTT      AS thoiGianXacNhanTT,
        khUser.HoTen               AS tenKhachHang,
        khUser.SDT                 AS sdtKhachHang,
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
        ct.MaGiuong                AS maGiuong,
        ct.GiaThue                 AS giaThue,
        cn.DiaChi                  AS diaChi,
        lp.TenLoaiPhong            AS loaiPhong,
        cn.TenChiNhanh             AS tenChiNhanh,
        ha.UrlImg                  AS urlImg,
        -- Nhân viên sale phụ trách
        nd.HoTen                   AS tenNhanVienPhuTrach,
        nd.SDT                     AS sdtNhanVienPhuTrach,
        ndKeToan.HoTen             AS tenNhanVienKeToan,
        ndKeToan.SDT               AS sdtNhanVienKeToan,
        ptp.MaPhieuTra             AS maPhieuTra,
        ptp.NgayDangKyTra          AS ngayDangKyTra,
        ptp.NgayDuKienTra          AS ngayDuKienTra,
        ptp.NgayTraThucTe          AS ngayTraThucTe,
        ptp.TrangThaiTraPhong      AS trangThaiTraPhong,
        ds.MaDoiSoat               AS maDoiSoatTraPhong,
        ds.NgayLap                 AS ngayLapDoiSoatTraPhong,
        ds.TienCocBanDau           AS tienCocBanDauTraPhong,
        ds.SoThangLuuTru           AS soThangLuuTruTraPhong,
        ds.TyLeHoanCocHienTai      AS tyLeHoanCocHienTaiTraPhong,
        ds.TienCocDuocHoan         AS tienCocDuocHoanTraPhong,
        ds.TienThueConNo           AS tienThueConNoTraPhong,
        ds.TienDichVuConNo         AS tienDichVuConNoTraPhong,
        ds.TongChiPhiSuaChua       AS tongChiPhiSuaChuaTraPhong,
        ds.TienPhat                AS tienPhatTraPhong,
        ds.TongKhauTru             AS tongKhauTruTraPhong,
        ds.SoTienHoanThucTe        AS soTienHoanThucTeTraPhong,
        ds.SoTienKhachPhaiTT       AS soTienKhachPhaiTTTraPhong,
        ds.PhuongThucThanhToan     AS phuongThucThanhToanTraPhong,
        ds.ChungTuThanhToan        AS chungTuThanhToanTraPhong,
        ds.NgayThanhToan           AS ngayThanhToanTraPhong,
        ds.ThongTinNhanHoanCoc     AS thongTinNhanHoanCocTraPhong,
        ds.GhiChuPhanHoiKhach      AS ghiChuPhanHoiKhachTraPhong,
        ds.LoaiQuyetToan           AS loaiQuyetToanTraPhong,
        ds.TrangThai               AS trangThaiDoiSoatTraPhong,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM dbo.HopDongThue AS hd
            WHERE hd.MaPhieuCoc = pdc.MaPhieuDatCoc
          )
            THEN CAST(1 AS BIT)
          ELSE CAST(0 AS BIT)
        END                        AS coHopDong
      FROM dbo.PhieuDatCoc AS pdc
      -- Lấy 1 chi tiết đặt cọc đầu tiên (phòng/giường đầu tiên)
      OUTER APPLY (
        SELECT TOP 1 ctdc.MaPhong, ctdc.MaGiuong, ctdc.GiaThue
        FROM dbo.ChiTietDatCoc AS ctdc
        WHERE ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        ORDER BY ctdc.MaChiTietDC
      ) AS ct
      LEFT JOIN dbo.Phong    AS p  ON p.MaPhong    = ct.MaPhong
      LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
      LEFT JOIN dbo.ChiNhanh  AS cn ON cn.MaChiNhanh  = p.MaChiNhanh
      OUTER APPLY (
        SELECT TOP 1 hap.UrlImg
        FROM dbo.HinhAnhPhong AS hap
        WHERE hap.MaPhong = p.MaPhong
        ORDER BY hap.STTAnh
      ) AS ha
      LEFT JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = pdc.MaPhieuYeuCauDangKy
      LEFT JOIN dbo.NhanVien    AS nv  ON nv.MaNhanVien = pdk.MaNhanVienSale
      LEFT JOIN dbo.NguoiDung   AS nd  ON nd.MaNguoiDung = nv.MaNhanVien
      LEFT JOIN dbo.NhanVien    AS nvKeToan ON nvKeToan.MaNhanVien = pdc.MaNhanVienKeToan
      LEFT JOIN dbo.NguoiDung   AS ndKeToan ON ndKeToan.MaNguoiDung = nvKeToan.MaNhanVien
      LEFT JOIN dbo.NguoiDung   AS khUser ON khUser.MaNguoiDung = pdc.MaKhachHang
      OUTER APPLY (
        SELECT TOP 1
          ptra.MaPhieuTra,
          ptra.NgayDangKyTra,
          ptra.NgayDuKienTra,
          ptra.NgayTraThucTe,
          ptra.TrangThai AS TrangThaiTraPhong
        FROM dbo.PhieuTraPhong AS ptra
        WHERE ptra.MaPhieuDatCoc = pdc.MaPhieuDatCoc
          AND ptra.TrangThai NOT IN (N'Hủy', N'Hoàn tất')
        ORDER BY ptra.NgayDangKyTra DESC, ptra.MaPhieuTra DESC
      ) AS ptp
      OUTER APPLY (
        SELECT TOP 1
          d.MaDoiSoat,
          d.NgayLap,
          d.TienCocBanDau,
          d.SoThangLuuTru,
          d.TyLeHoanCocHienTai,
          d.TienCocDuocHoan,
          d.TienThueConNo,
          d.TienDichVuConNo,
          d.TongChiPhiSuaChua,
          d.TienPhat,
          d.TongKhauTru,
          d.SoTienHoanThucTe,
          d.SoTienKhachPhaiTT,
          d.PhuongThucThanhToan,
          d.ChungTuThanhToan,
          d.NgayThanhToan,
          d.ThongTinNhanHoanCoc,
          d.GhiChuPhanHoiKhach,
          d.LoaiQuyetToan,
          d.TrangThai
        FROM dbo.DoiSoat AS d
        WHERE d.MaPhieuTra = ptp.MaPhieuTra
        ORDER BY d.NgayLap DESC, d.MaDoiSoat DESC
      ) AS ds
      WHERE pdc.MaKhachHang = @KhachHangId
      ORDER BY pdc.ThoiDiemDatCoc DESC;
    `);

  const deposits = result.recordset || [];
  if (!deposits.length) return [];

  const maPhieuValues = deposits.map((row) => row.maPhieuCoc).filter(Boolean);
  const detailRequest = pool.request();
  const detailParams = maPhieuValues.map((value, index) => {
    const name = `MaPhieuCoc${index}`;
    detailRequest.input(name, sql.VarChar(6), value);
    return `@${name}`;
  });

  const [roomResult, quyDinhResult] = await Promise.all([
    detailRequest.query(`
      SELECT
        ctdc.MaPhieuDatCoc AS maPhieuCoc,
        ctdc.MaChiTietDC   AS maChiTietDC,
        ctdc.MaPhong       AS maPhong,
        p.TenPhong         AS tenPhong,
        ctdc.MaGiuong      AS maGiuong,
        ctdc.GiaThue       AS giaThue,
        p.GioiTinhChoPhep  AS gioiTinhChoPhep,
        p.TinhTrang        AS tinhTrangPhong,
        pdc.HinhThucThue   AS hinhThucThue,

        lp.TenLoaiPhong    AS loaiPhong,
        cn.TenChiNhanh     AS tenChiNhanh,
        cn.DiaChi          AS diaChi,
        ha.UrlImg          AS urlImg
      FROM dbo.ChiTietDatCoc AS ctdc
      INNER JOIN dbo.PhieuDatCoc AS pdc ON pdc.MaPhieuDatCoc = ctdc.MaPhieuDatCoc
      LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctdc.MaPhong
      LEFT JOIN dbo.LoaiPhong AS lp ON lp.MaLoaiPhong = p.MaLoaiPhong
      LEFT JOIN dbo.ChiNhanh AS cn ON cn.MaChiNhanh = p.MaChiNhanh
      OUTER APPLY (
        SELECT TOP 1 hap.UrlImg
        FROM dbo.HinhAnhPhong AS hap
        WHERE hap.MaPhong = ctdc.MaPhong
        ORDER BY hap.STTAnh
      ) AS ha
      WHERE ctdc.MaPhieuDatCoc IN (${detailParams.join(', ')})
      ORDER BY ctdc.MaPhieuDatCoc, ctdc.MaChiTietDC;
    `),
    pool.request().query(`
      SELECT MaQuyDinh, TieuDeNoiQuy, NoiDung
      FROM dbo.QuiDinh
      WHERE TrangThai = N'Hiệu lực'
      ORDER BY MaQuyDinh;
    `)
  ]);

  const rooms = roomResult.recordset || [];
  const maPhongValues = [...new Set(rooms.map((room) => room.maPhong).filter(Boolean))];
  const [assetResult, imageResult] = maPhongValues.length
    ? await Promise.all([
        (() => {
          const request = pool.request();
          const params = maPhongValues.map((value, index) => {
            const name = `MaPhongAsset${index}`;
            request.input(name, sql.VarChar(4), value);
            return `@${name}`;
          });
          return request.query(`
            SELECT MaPhong AS maPhong, MaTaiSan AS maTaiSan, TenTaiSan AS tenTaiSan, SoLuong AS soLuong, DonGia AS donGia
            FROM dbo.TaiSan
            WHERE MaPhong IN (${params.join(', ')})
            ORDER BY MaPhong, MaTaiSan;
          `);
        })(),
        (() => {
          const request = pool.request();
          const params = maPhongValues.map((value, index) => {
            const name = `MaPhongImage${index}`;
            request.input(name, sql.VarChar(4), value);
            return `@${name}`;
          });
          return request.query(`
            SELECT MaPhong AS maPhong, STTAnh AS sttAnh, UrlImg AS urlAnh, UrlImg AS urlImg
            FROM dbo.HinhAnhPhong
            WHERE MaPhong IN (${params.join(', ')})
            ORDER BY MaPhong, STTAnh;
          `);
        })()
      ])
    : [{ recordset: [] }, { recordset: [] }];

  const imagesByRoom = new Map();
  for (const image of imageResult.recordset || []) {
    if (!imagesByRoom.has(image.maPhong)) imagesByRoom.set(image.maPhong, []);
    imagesByRoom.get(image.maPhong).push(image);
  }

  const assetsByRoom = new Map();
  for (const asset of assetResult.recordset || []) {
    if (!assetsByRoom.has(asset.maPhong)) assetsByRoom.set(asset.maPhong, []);
    assetsByRoom.get(asset.maPhong).push(asset);
  }

  const roomsByDeposit = new Map();
  for (const room of rooms) {
    if (!roomsByDeposit.has(room.maPhieuCoc)) roomsByDeposit.set(room.maPhieuCoc, []);
    const hinhAnh = imagesByRoom.get(room.maPhong) || [];
    roomsByDeposit.get(room.maPhieuCoc).push({
      ...room,
      hinhAnh,
      taiSan: assetsByRoom.get(room.maPhong) || [],
      urlImg: room.urlImg || hinhAnh[0]?.urlAnh || null
    });
  }

  const quyDinh = quyDinhResult.recordset || [];
  return deposits.map((deposit) => {
    const phongDatCoc = roomsByDeposit.get(deposit.maPhieuCoc) || [];
    return {
      ...deposit,
      phongDatCoc,
      taiSan: phongDatCoc.flatMap((room) => room.taiSan || []),
      quyDinh,
      urlImg: deposit.urlImg || phongDatCoc[0]?.urlImg || null,
      yeuCauTraPhong: deposit.maPhieuTra
        ? {
            maPhieuTra: deposit.maPhieuTra,
            maPhieuDatCoc: deposit.maPhieuCoc,
            ngayDangKyTra: deposit.ngayDangKyTra,
            ngayDuKienTra: deposit.ngayDuKienTra,
            ngayTraThucTe: deposit.ngayTraThucTe,
            trangThai: deposit.trangThaiTraPhong,
            doiSoat: deposit.maDoiSoatTraPhong
              ? {
                  maDoiSoat: deposit.maDoiSoatTraPhong,
                  ngayLap: deposit.ngayLapDoiSoatTraPhong,
                  tienCocBanDau: deposit.tienCocBanDauTraPhong,
                  soThangLuuTru: deposit.soThangLuuTruTraPhong,
                  tyLeHoanCocHienTai: deposit.tyLeHoanCocHienTaiTraPhong,
                  tienCocDuocHoan: deposit.tienCocDuocHoanTraPhong,
                  tienThueConNo: deposit.tienThueConNoTraPhong,
                  tienDichVuConNo: deposit.tienDichVuConNoTraPhong,
                  tongChiPhiSuaChua: deposit.tongChiPhiSuaChuaTraPhong,
                  tienPhat: deposit.tienPhatTraPhong,
                  tongKhauTru: deposit.tongKhauTruTraPhong,
                  soTienHoanThucTe: deposit.soTienHoanThucTeTraPhong,
                  soTienKhachPhaiTT: deposit.soTienKhachPhaiTTTraPhong,
                  phuongThucThanhToan: deposit.phuongThucThanhToanTraPhong,
                  chungTuThanhToan: deposit.chungTuThanhToanTraPhong,
                  ngayThanhToan: deposit.ngayThanhToanTraPhong,
                  thongTinNhanHoanCoc: deposit.thongTinNhanHoanCocTraPhong,
                  ghiChuPhanHoiKhach: deposit.ghiChuPhanHoiKhachTraPhong,
                  loaiQuyetToan: deposit.loaiQuyetToanTraPhong,
                  trangThai: deposit.trangThaiDoiSoatTraPhong
                }
              : null
          }
        : null
    };
  });
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

export async function getHopDongDashboard(user, options = {}) {
  const khachHangId = requireCustomer(user);
  const maHopDongChon = String(options.maHopDong || options.MaHopDong || '').trim() || null;
  const pool = await getPool();

  // Gọi Stored Procedure để lấy chi tiết hợp đồng
  const result = await executeProcedure('dbo.SP_KhachMoi_ChiTietHopDong', [
    { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
    { name: 'MaHopDong', type: sql.VarChar(6), value: maHopDongChon }
  ]);

  const hopDong = result.recordsets[0]?.[0] || null;
  if (!hopDong) {
    return { data: null };
  }

  let chiTietKhauTru = {
    hoaDonConNo: [],
    chiTietHoaDon: [],
    bienBanKiemTra: [],
    chiTietHuHong: [],
    bienBanViPham: [],
    dichVuHopDong: []
  };

  if (hopDong.MaDoiSoatTraPhong && hopDong.MaPhieuTra) {
    const [
      hoaDonConNoResult,
      chiTietHoaDonResult,
      bienBanKiemTraResult,
      chiTietHuHongResult,
      bienBanViPhamResult,
      dichVuHopDongResult
    ] = await Promise.all([
      pool.request()
        .input('MaHopDong', sql.VarChar(6), hopDong.MaHopDong || null)
        .query(`
          SELECT
            hd.MaHoaDon AS maHoaDon,
            N'Tiền thuê kỳ ' + ISNULL(hd.KyThanhToan, N'--') AS tenKhoanThue,
            hd.KyThanhToan AS kyThanhToan,
            hd.NgayLap AS ngayLap,
            hd.NgayHanTT AS ngayHanTT,
            hdt.GiaThue AS thanhTien,
            ISNULL(dvNo.tienDichVuConNo, 0) AS tienDichVuConNo,
            hdt.GiaThue + ISNULL(dvNo.tienDichVuConNo, 0) AS tongTienNo,
            hd.TongTien AS tongTienHoaDon,
            hd.TrangThai AS trangThai,
            hdt.MaHopDong AS maHopDong,
            hdt.GiaThue AS giaThueHopDong,
            hdt.KyThanhToan AS kyThanhToanHopDong
          FROM dbo.HoaDon AS hd
          INNER JOIN dbo.HopDongThue AS hdt ON hdt.MaHopDong = hd.MaHopDong
          OUTER APPLY (
            SELECT SUM(ct.ThanhTien) AS tienDichVuConNo
            FROM dbo.ChiTietHoaDon AS ct
            WHERE ct.MaHoaDon = hd.MaHoaDon
              AND ct.GhiChu <> N'Tiền phòng'
          ) AS dvNo
          WHERE hd.TrangThai = N'Chưa thanh toán'
            AND hdt.MaHopDong = @MaHopDong;
        `),
      pool.request()
        .input('MaHopDong', sql.VarChar(6), hopDong.MaHopDong || null)
        .query(`
          SELECT
            ct.MaChiTietHD AS maChiTietHD,
            ct.NoiDung AS noiDung,
            ct.SoLuong AS soLuong,
            ct.DonGia AS donGia,
            ct.ThanhTien AS thanhTien,
            ct.GhiChu AS ghiChu,
            hd.MaHoaDon AS maHoaDon,
            hd.TrangThai AS trangThaiHoaDon
          FROM dbo.ChiTietHoaDon AS ct
          INNER JOIN dbo.HoaDon AS hd ON hd.MaHoaDon = ct.MaHoaDon
          WHERE hd.TrangThai = N'Chưa thanh toán'
            AND hd.MaHopDong = @MaHopDong;
        `),
      pool.request()
        .input('MaPhieuTra', sql.VarChar(6), hopDong.MaPhieuTra || null)
        .query(`
          SELECT
            bbkt.MaBienBanKT AS maBienBanKT,
            bbkt.MaPhieuTra AS maPhieuTra,
            bbkt.NgayKiemTra AS ngayKiemTra,
            bbkt.TinhTrangPhong AS tinhTrangPhong,
            bbkt.TongChiPhiSuaChua AS tongChiPhiSuaChua
          FROM dbo.BienBanKiemTraPhong bbkt
          WHERE bbkt.MaPhieuTra = @MaPhieuTra;
        `),
      pool.request()
        .input('MaPhieuTra', sql.VarChar(6), hopDong.MaPhieuTra || null)
        .query(`
          SELECT
            bbkt.MaBienBanKT AS maBienBanKT,
            cthh.MaChiTietHH AS maChiTietHH,
            cthh.MaPhong AS maPhong,
            cthh.MaTaiSan AS maTaiSan,
            ts.TenTaiSan AS tenTaiSan,
            cthh.MoTaHuHong AS moTaHuHong,
            cthh.ChiPhiSuaChua AS chiPhiSuaChua
          FROM dbo.BienBanKiemTraPhong bbkt
          INNER JOIN dbo.ChiTietHuHong cthh ON cthh.MaBienBanKT = bbkt.MaBienBanKT
          LEFT JOIN dbo.TaiSan ts ON ts.MaPhong = cthh.MaPhong AND ts.MaTaiSan = cthh.MaTaiSan
          WHERE bbkt.MaPhieuTra = @MaPhieuTra
          ORDER BY bbkt.MaBienBanKT ASC, cthh.MaChiTietHH ASC;
        `),
      pool.request()
        .input('MaHopDong', sql.VarChar(6), hopDong.MaHopDong || null)
        .query(`
          SELECT
            bbvp.MaBBViPham AS maBBViPham,
            bbvp.NgayViPham AS ngayViPham,
            bbvp.MoTaViPham AS moTaViPham,
            bbvp.SoTienPhat AS soTienPhat,
            bbvp.TrangThai AS trangThai,
            bbvp.MaDieuKhoan AS maDieuKhoan,
            dkvp.TenDieuKhoan AS tenDieuKhoan,
            dkvp.HinhThucXuPhat AS hinhThucXuPhat
          FROM dbo.BienBanViPham bbvp
          LEFT JOIN dbo.DieuKhoanViPham dkvp ON dkvp.MaDieuKhoan = bbvp.MaDieuKhoan
          WHERE @MaHopDong IS NOT NULL
            AND bbvp.MaHopDong = @MaHopDong
          ORDER BY bbvp.NgayViPham ASC, bbvp.MaBBViPham ASC;
        `),
      pool.request()
        .input('MaHopDong', sql.VarChar(6), hopDong.MaHopDong || null)
        .query(`
          SELECT
            dvhd.MaChiTietDVHD AS maChiTietDVHD,
            dvhd.MaDichVu AS maDichVu,
            dv.TenDichVu AS tenDichVu,
            dv.DonViTinh AS donViTinh,
            dv.DonGia AS donGia,
            dvhd.GhiChu AS ghiChu
          FROM dbo.DichVuHopDong dvhd
          LEFT JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
          WHERE @MaHopDong IS NOT NULL
            AND dvhd.MaHopDong = @MaHopDong
          ORDER BY dv.TenDichVu ASC, dvhd.MaChiTietDVHD ASC;
        `)
    ]);

    chiTietKhauTru = {
      hoaDonConNo: hoaDonConNoResult.recordset || [],
      chiTietHoaDon: chiTietHoaDonResult.recordset || [],
      bienBanKiemTra: bienBanKiemTraResult.recordset || [],
      chiTietHuHong: chiTietHuHongResult.recordset || [],
      bienBanViPham: bienBanViPhamResult.recordset || [],
      dichVuHopDong: dichVuHopDongResult.recordset || []
    };
  }

  const taiKhoanThanhToan = {
    nganHang: process.env.BANK_NAME || 'Vietcombank',
    soTaiKhoan: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    chuTaiKhoan: process.env.BANK_ACCOUNT_HOLDER || 'CONG TY HOMESTAY DORM'
  };

  const normalizeHopDongDashboardItem = (row, chiTietKhauTruOverride = null) => ({
    ...row,
    yeuCauTraPhong: row.MaPhieuTra
      ? {
          maPhieuTra: row.MaPhieuTra,
          maHopDong: row.MaHopDong,
          ngayDangKyTra: row.NgayDangKyTra,
          ngayDuKienTra: row.NgayDuKienTra,
          ngayTraThucTe: row.NgayTraThucTe,
          trangThai: row.TrangThaiTraPhong,
          doiSoat: row.MaDoiSoatTraPhong
            ? {
                maDoiSoat: row.MaDoiSoatTraPhong,
                ngayLap: row.NgayLapDoiSoatTraPhong,
                tienCocBanDau: row.TienCocBanDauTraPhong,
                soThangLuuTru: row.SoThangLuuTruTraPhong,
                tyLeHoanCocHienTai: row.TyLeHoanCocHienTaiTraPhong,
                tienCocDuocHoan: row.TienCocDuocHoanTraPhong,
                tienThueConNo: row.TienThueConNoTraPhong,
                tienDichVuConNo: row.TienDichVuConNoTraPhong,
                tongChiPhiSuaChua: row.TongChiPhiSuaChuaTraPhong,
                tienPhat: row.TienPhatTraPhong,
                tongKhauTru: row.TongKhauTruTraPhong,
                soTienHoanThucTe: row.SoTienHoanThucTeTraPhong,
                soTienKhachPhaiTT: row.SoTienKhachPhaiTTTraPhong,
                phuongThucThanhToan: row.PhuongThucThanhToanTraPhong,
                chungTuThanhToan: row.ChungTuThanhToanTraPhong,
                ngayThanhToan: row.NgayThanhToanTraPhong,
                thongTinNhanHoanCoc: row.ThongTinNhanHoanCocTraPhong,
                ghiChuPhanHoiKhach: row.GhiChuPhanHoiKhachTraPhong,
                loaiQuyetToan: row.LoaiQuyetToanTraPhong,
                trangThai: row.TrangThaiDoiSoatTraPhong,
                ...(chiTietKhauTruOverride ? { chiTietKhauTru: chiTietKhauTruOverride } : {})
              }
            : null
        }
      : null,
    taiKhoanThanhToan
  });

  const danhSachHopDongRaw = result.recordsets[1] || [];
  const danhSachHopDong = danhSachHopDongRaw.map((row) => normalizeHopDongDashboardItem(row));
  const hopDongDaChon = normalizeHopDongDashboardItem(hopDong, chiTietKhauTru);

  hopDongDaChon.taiSan = result.recordsets[2] || [];
  hopDongDaChon.quyDinh = result.recordsets[3] || [];
  hopDongDaChon.thanhVien = result.recordsets[4] || [];
  hopDongDaChon.dichVu = result.recordsets[5] || [];
  hopDongDaChon.viPham = result.recordsets[6] || [];
  hopDongDaChon.hoanCoc = result.recordsets[7] || [];

  hopDongDaChon.danhSachHopDong = danhSachHopDong.map((item) => (
    item.MaHopDong === hopDongDaChon.MaHopDong
      ? { ...item, yeuCauTraPhong: hopDongDaChon.yeuCauTraPhong }
      : item
  ));

  return { data: hopDongDaChon };
}

export async function guiYeuCauTraPhong(user, data = {}) {
  const khachHangId = requireCustomer(user);
  try {
    const result = await executeProcedure('dbo.SP_TraPhong_KhachHang_GuiYeuCau', [
      { name: 'MaKhachHang', type: sql.VarChar(6), value: khachHangId },
      { name: 'MaHopDong', type: sql.VarChar(6), value: data.maHopDong || null },
      { name: 'MaPhieuDatCoc', type: sql.VarChar(6), value: data.maPhieuDatCoc || data.maPhieuCoc || null },
      { name: 'NgayDuKienTra', type: sql.Date, value: data.ngayDuKienTra ? new Date(data.ngayDuKienTra) : null }
    ]);

    return result.recordset?.[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function huyYeuCauTraPhong(user, maPhieuTra) {
  const khachHangId = requireCustomer(user);
  if (!maPhieuTra) throw createServiceError('Thiếu mã yêu cầu trả phòng.', 400);

  try {
    const result = await executeProcedure('dbo.SP_TraPhong_KhachHang_HuyYeuCau', [
      { name: 'MaKhachHang', type: sql.VarChar(6), value: khachHangId },
      { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
    ]);

    return result.recordset?.[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function phanHoiDoiSoatTraPhong(user, maDoiSoat, data = {}) {
  const khachHangId = requireCustomer(user);
  const maDoiSoatValue = String(maDoiSoat || '').trim();
  const dongY = Boolean(data.dongY);
  const lyDoKhongDongY = String(data.lyDoKhongDongY || data.lyDo || '').trim();

  if (!maDoiSoatValue || maDoiSoatValue.length > 6) {
    throw createServiceError('Mã đối soát không hợp lệ.', 400);
  }

  if (!dongY && !lyDoKhongDongY) {
    throw createServiceError('Vui lòng nhập nội dung cần điều chỉnh.', 400);
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const checkResult = await transaction.request()
      .input('MaDoiSoat', sql.VarChar(6), maDoiSoatValue)
      .input('MaKhachHang', sql.VarChar(6), khachHangId)
      .query(`
        SELECT TOP 1
          ds.MaDoiSoat,
          ds.TrangThai AS TrangThaiDoiSoat,
          ds.LoaiQuyetToan,
          ds.SoTienHoanThucTe,
          ds.SoTienKhachPhaiTT,
          ds.GhiChuPhanHoiKhach,
          pt.MaPhieuTra,
          pt.TrangThai AS TrangThaiPhieuTra
        FROM dbo.DoiSoat ds WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PhieuTraPhong pt WITH (UPDLOCK, HOLDLOCK)
          ON pt.MaPhieuTra = ds.MaPhieuTra
        LEFT JOIN dbo.HopDongThue hd
          ON hd.MaHopDong = pt.MaHopDong
        LEFT JOIN dbo.PhieuDatCoc pdc
          ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
        WHERE ds.MaDoiSoat = @MaDoiSoat
          AND COALESCE(hd.MaKhachHang, pdc.MaKhachHang) = @MaKhachHang;
      `);

    const doiSoat = checkResult.recordset?.[0];
    if (!doiSoat) {
      throw createServiceError('Không tìm thấy phiếu đối soát.', 404);
    }

    if (!['Chờ phản hồi', 'Chờ xác nhận'].includes(doiSoat.TrangThaiDoiSoat)) {
      throw createServiceError('Phiếu đối soát này đã được phản hồi hoặc không còn chờ xử lý.', 409);
    }

    if (doiSoat.TrangThaiDoiSoat === 'Chờ phản hồi' && doiSoat.GhiChuPhanHoiKhach) {
      throw createServiceError('Phiếu đối soát này đã có phản hồi từ khách hàng.', 409);
    }

    let trangThaiMoi = 'Chờ phản hồi';
    if (dongY) {
      if (doiSoat.LoaiQuyetToan === 'Hoàn cọc' || Number(doiSoat.SoTienHoanThucTe || 0) > 0) {
        trangThaiMoi = 'Chờ hoàn cọc';
      } else if (doiSoat.LoaiQuyetToan === 'Thu thêm' || Number(doiSoat.SoTienKhachPhaiTT || 0) > 0) {
        trangThaiMoi = 'Chờ thanh toán thêm';
      } else {
        trangThaiMoi = 'Đã quyết toán';
      }
    }

    await transaction.request()
      .input('MaDoiSoat', sql.VarChar(6), maDoiSoatValue)
      .input('TrangThaiMoi', sql.NVarChar(30), trangThaiMoi)
      .input('GhiChu', sql.NVarChar(500), dongY ? null : lyDoKhongDongY)
      .query(`
        UPDATE dbo.DoiSoat
        SET TrangThai = @TrangThaiMoi,
            GhiChuPhanHoiKhach = @GhiChu
        WHERE MaDoiSoat = @MaDoiSoat;
      `);

    if (dongY) {
      await transaction.request()
        .input('MaPhieuTra', sql.VarChar(6), doiSoat.MaPhieuTra)
        .query(`
          UPDATE dbo.PhieuTraPhong
          SET TrangThai = N'Chờ ký biên bản'
          WHERE MaPhieuTra = @MaPhieuTra
            AND TrangThai = N'Chờ đối soát';
        `);
    }

    await transaction.commit();

    return {
      maDoiSoat: maDoiSoatValue,
      maPhieuTra: doiSoat.MaPhieuTra,
      trangThaiDoiSoat: trangThaiMoi,
      trangThaiPhieuTra: dongY ? 'Chờ ký biên bản' : doiSoat.TrangThaiPhieuTra,
      dongY
    };
  } catch (error) {
    if (transaction._aborted !== true) {
      try { await transaction.rollback(); } catch (_) { /* transaction already closed */ }
    }
    throw error;
  }
}

export async function ghiNhanThanhToanDoiSoatTraPhong(user, maDoiSoat, data = {}) {
  const khachHangId = requireCustomer(user);
  const maDoiSoatValue = String(maDoiSoat || '').trim();
  const phuongThucThanhToan = String(data.phuongThucThanhToan || '').trim();
  const chungTuThanhToan = String(data.chungTuThanhToan || '').trim() || null;
  const thongTinNhanHoanCoc = String(data.thongTinNhanHoanCoc || '').trim() || null;

  if (!maDoiSoatValue || maDoiSoatValue.length > 6) {
    throw createServiceError('Mã đối soát không hợp lệ.', 400);
  }

  if (!['Tiền mặt', 'Chuyển khoản'].includes(phuongThucThanhToan)) {
    throw createServiceError('Phương thức thanh toán không hợp lệ.', 400);
  }

  const pool = await getPool();
  const doiSoatTypeResult = await pool.request()
    .input('MaDoiSoat', sql.VarChar(6), maDoiSoatValue)
    .input('MaKhachHang', sql.VarChar(6), khachHangId)
    .query(`
      SELECT TOP 1
        ds.LoaiQuyetToan,
        ds.SoTienHoanThucTe,
        ds.SoTienKhachPhaiTT,
        ds.PhuongThucThanhToan,
        ds.ChungTuThanhToan,
        ds.TrangThai
      FROM dbo.DoiSoat ds
      INNER JOIN dbo.PhieuTraPhong pt
        ON pt.MaPhieuTra = ds.MaPhieuTra
      LEFT JOIN dbo.HopDongThue hd
        ON hd.MaHopDong = pt.MaHopDong
      LEFT JOIN dbo.PhieuDatCoc pdc
        ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
      WHERE ds.MaDoiSoat = @MaDoiSoat
        AND COALESCE(hd.MaKhachHang, pdc.MaKhachHang) = @MaKhachHang;
    `);
  const doiSoatType = doiSoatTypeResult.recordset?.[0] || null;
  const isHoanCoc = String(data.loaiGhiNhan || '').toLowerCase() === 'hoan-coc'
    || String(doiSoatType?.LoaiQuyetToan || '').toLowerCase().includes('hoàn cọc')
    || Number(doiSoatType?.SoTienHoanThucTe || 0) > 0;
  const isThuThemUploadLai = !isHoanCoc
    && doiSoatType?.TrangThai === 'Chờ thanh toán thêm'
    && doiSoatType?.LoaiQuyetToan === 'Thu thêm'
    && doiSoatType?.PhuongThucThanhToan === 'Chuyển khoản'
    && !String(doiSoatType?.ChungTuThanhToan || '').trim();
  const phuongThucCanLuu = isThuThemUploadLai ? 'Chuyển khoản' : phuongThucThanhToan;

  if (phuongThucCanLuu === 'Chuyển khoản' && !chungTuThanhToan && !isHoanCoc) {
    throw createServiceError('Vui lòng tải minh chứng thanh toán khi chọn chuyển khoản.', 400);
  }

  if (isHoanCoc && phuongThucCanLuu === 'Chuyển khoản' && !thongTinNhanHoanCoc) {
    throw createServiceError('Vui lòng nhập thông tin tài khoản nhận hoàn cọc.', 400);
  }

  const result = await pool.request()
    .input('MaDoiSoat', sql.VarChar(6), maDoiSoatValue)
    .input('MaKhachHang', sql.VarChar(6), khachHangId)
    .input('PhuongThucThanhToan', sql.NVarChar(20), phuongThucCanLuu)
    .input('ChungTuThanhToan', sql.VarChar(500), chungTuThanhToan)
    .input('ThongTinNhanHoanCoc', sql.NVarChar(500), isHoanCoc ? thongTinNhanHoanCoc : null)
    .query(`
      UPDATE ds
      SET ds.PhuongThucThanhToan = @PhuongThucThanhToan,
          ds.ChungTuThanhToan = @ChungTuThanhToan,
          ds.NgayThanhToan = CASE
            WHEN ds.LoaiQuyetToan = N'Thu thêm'
              AND @PhuongThucThanhToan = N'Chuyển khoản'
              AND @ChungTuThanhToan IS NOT NULL
            THEN CONVERT(date, GETDATE())
            ELSE ds.NgayThanhToan
          END,
          ds.ThongTinNhanHoanCoc = @ThongTinNhanHoanCoc
      OUTPUT
        inserted.MaDoiSoat AS maDoiSoat,
        inserted.MaPhieuTra AS maPhieuTra,
        inserted.TrangThai AS trangThaiDoiSoat,
        inserted.PhuongThucThanhToan AS phuongThucThanhToan,
        inserted.ChungTuThanhToan AS chungTuThanhToan,
        inserted.NgayThanhToan AS ngayThanhToan,
        inserted.ThongTinNhanHoanCoc AS thongTinNhanHoanCoc
      FROM dbo.DoiSoat ds
      INNER JOIN dbo.PhieuTraPhong pt
        ON pt.MaPhieuTra = ds.MaPhieuTra
      LEFT JOIN dbo.HopDongThue hd
        ON hd.MaHopDong = pt.MaHopDong
      LEFT JOIN dbo.PhieuDatCoc pdc
        ON pdc.MaPhieuDatCoc = COALESCE(pt.MaPhieuDatCoc, hd.MaPhieuCoc)
      WHERE ds.MaDoiSoat = @MaDoiSoat
        AND COALESCE(hd.MaKhachHang, pdc.MaKhachHang) = @MaKhachHang
        AND (
          (
            ds.TrangThai = N'Chờ thanh toán thêm'
            AND ds.LoaiQuyetToan = N'Thu thêm'
            AND ISNULL(ds.SoTienKhachPhaiTT, 0) > 0
          )
          OR (
            ds.TrangThai = N'Chờ hoàn cọc'
            AND ds.LoaiQuyetToan = N'Hoàn cọc'
            AND ISNULL(ds.SoTienHoanThucTe, 0) > 0
          )
        );
    `);

  const record = result.recordset?.[0];
  if (!record) {
    throw createServiceError('Không tìm thấy phiếu đối soát chờ xử lý thanh toán.', 404);
  }

  return record;
}
