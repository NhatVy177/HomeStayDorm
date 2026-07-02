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
