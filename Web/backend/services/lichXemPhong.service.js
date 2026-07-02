import { executeProcedure, executeQuery, getPool, sql } from '../database/connection.js';
import { createServiceError, mapDatabaseError } from './serviceErrors.js';

function handleDatabaseError(error) {
  mapDatabaseError(error, {
    50010: 404,
    50011: 400
  });
}

function parseScheduleId(id) {
  const raw = String(id || '').trim();
  const match = raw.match(/^([A-Za-z]{2}\d{4})-(\d+)$/);
  if (!match) {
    throw createServiceError('Mã lịch xem phòng không hợp lệ.');
  }
  return {
    maDangKy: match[1],
    sttLich: Number(match[2])
  };
}

function normalizeRooms(data = {}) {
  const source = Array.isArray(data.rooms)
    ? data.rooms
    : Array.isArray(data.phongIds)
      ? data.phongIds
      : data.maPhong
        ? [data.maPhong]
        : data.phongGiuongId
          ? [data.phongGiuongId]
          : [];

  return [...new Set(source
    .map((item) => String(item?.maPhong || item?.id || item || '').trim())
    .filter(Boolean))];
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

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('vi-VN');
}

function isWholeRoomOption(row = {}) {
  return ['nguyên căn', 'nguyên phòng'].includes(normalizeText(row.loaiThue || row.hinhThucThue));
}

function getAvailableSlots(row = {}) {
  return Math.max(0, Number(row.soGiuongTrong ?? row.soGiuongDuKienXep ?? row.sucChua ?? 0));
}

function filterRoomsByProfileCapacity(rows = [], profile = {}) {
  const total = Math.max(1, Number(profile.SoNguoiDuKienO || profile.soNguoiO || 1));
  const male = Math.max(0, Number(profile.SoNam || profile.soNam || 0));
  const female = Math.max(0, Number(profile.SoNu || profile.soNu || 0));

  const typeGroups = new Map();
  rows.forEach((row) => {
    const key = row.maLoaiPhong || row.MaLoaiPhong || row.loaiPhong || row.TenLoaiPhong || 'unknown';
    if (!typeGroups.has(key)) typeGroups.set(key, []);
    typeGroups.get(key).push(row);
  });

  const validTypes = new Set();
  typeGroups.forEach((items, key) => {
    const wholeCapacity = items
      .filter((row) => isWholeRoomOption(row) && normalizeText(row.gioiTinhChoPhep) === 'không phân biệt')
      .reduce((sum, row) => sum + Number(row.sucChua || getAvailableSlots(row)), 0);

    if (wholeCapacity >= total) {
      validTypes.add(key);
      return;
    }

    const sharedItems = items.filter((row) => !isWholeRoomOption(row));
    const maleSlots = sharedItems
      .filter((row) => normalizeText(row.gioiTinhChoPhep) === 'nam')
      .reduce((sum, row) => sum + getAvailableSlots(row), 0);
    const femaleSlots = sharedItems
      .filter((row) => normalizeText(row.gioiTinhChoPhep) === 'nữ')
      .reduce((sum, row) => sum + getAvailableSlots(row), 0);
    const neutralSlots = sharedItems
      .filter((row) => normalizeText(row.gioiTinhChoPhep) === 'không phân biệt')
      .reduce((sum, row) => sum + getAvailableSlots(row), 0);

    if (male > 0 || female > 0) {
      const missingMale = Math.max(0, male - maleSlots);
      const missingFemale = Math.max(0, female - femaleSlots);
      if (missingMale + missingFemale <= neutralSlots) validTypes.add(key);
      return;
    }

    if (maleSlots + femaleSlots + neutralSlots >= total) validTypes.add(key);
  });

  return rows.filter((row) => {
    const key = row.maLoaiPhong || row.MaLoaiPhong || row.loaiPhong || row.TenLoaiPhong || 'unknown';
    return validTypes.has(key);
  });
}

function isSaleUser(user = {}) {
  return (user?.vaiTro === 'NhanVien' && user?.chucVu === 'Sale') || user?.vaiTro === 'NhanVienSale';
}

function isCustomerUser(user = {}) {
  return user?.vaiTro === 'KhachHang';
}

function requireSaleUser(user = {}) {
  if (!isSaleUser(user)) {
    throw createServiceError('Chỉ nhân viên Sale mới được thực hiện thao tác này.', 403);
  }
}

function validateAppointmentTime(value) {
  const appointment = new Date(value);
  if (!value || Number.isNaN(appointment.valueOf())) {
    throw createServiceError('Thời gian xem phòng không hợp lệ.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDay = new Date(appointment);
  appointmentDay.setHours(0, 0, 0, 0);
  if (appointmentDay <= today) {
    throw createServiceError('Ngày xem phòng phải sau ngày hiện tại.');
  }

  const minutes = appointment.getHours() * 60 + appointment.getMinutes();
  if (minutes < 7 * 60 || minutes > 17 * 60) {
    throw createServiceError('Giờ xem phòng chỉ được chọn từ 07:00 đến 17:00.');
  }

  return appointment;
}

function normalizeStatus(value) {
  return normalizeText(value);
}

function assertCanAccessSchedule(row, user = {}) {
  if (!row) {
    throw createServiceError('Không tìm thấy lịch xem phòng.', 404);
  }

  if (isCustomerUser(user)) {
    if (row.maKhachHang !== user.maNguoiDung) {
      throw createServiceError('Bạn không có quyền truy cập lịch xem phòng này.', 403);
    }
    return;
  }

  if (isSaleUser(user)) {
    const sameSale = row.maNhanVienSale && row.maNhanVienSale === user.maNguoiDung;
    const sameBranch = row.maChiNhanh && user.maChiNhanh && row.maChiNhanh === user.maChiNhanh;
    if (!sameSale && !sameBranch) {
      throw createServiceError('Bạn không có quyền xử lý lịch xem phòng ngoài chi nhánh.', 403);
    }
  }
}

async function rejectRegistrationIfAllSchedulesCancelled(maDangKy) {
  await executeQuery(`
    UPDATE dbo.PhieuDangKy
    SET TrangThai = N'Từ chối'
    WHERE MaDangKy = @MaDangKy
      AND TrangThai <> N'Từ chối'
      AND EXISTS (
        SELECT 1
        FROM dbo.LichXemPhong AS lxpAny
        WHERE lxpAny.MaDangKy = @MaDangKy
      )
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.LichXemPhong AS lxpActive
        WHERE lxpActive.MaDangKy = @MaDangKy
          AND lxpActive.TrangThai <> N'Đã hủy'
      );
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy }
  ]);
}

export async function createLichXemPhong(data = {}, user = null) {
  requireSaleUser(user);
  const maDangKy = String(data.maDangKy || data.hoSoDangKyId || '').trim();
  const thoiGianHen = validateAppointmentTime(data.thoiGianXem || data.thoiGianHen || null);
  const phongIds = normalizeRooms(data);
  const nhanVienSaleId = String(data.nhanVienSaleId || user?.maNguoiDung || '').trim() || null;

  if (!maDangKy || phongIds.length === 0) {
    throw createServiceError('Vui lòng chọn hồ sơ, phòng và thời gian xem.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const hoSoRequest = new sql.Request(transaction);
    hoSoRequest.input('MaDangKy', sql.VarChar(6), maDangKy);
    const hoSo = await hoSoRequest.query(`
      SELECT
        pdk.MaDangKy,
        pdk.MaKhachHang,
        pdk.MaNhanVienSale,
        pdk.TrangThai
      FROM dbo.PhieuDangKy AS pdk WITH (UPDLOCK, HOLDLOCK)
      WHERE pdk.MaDangKy = @MaDangKy
    `);

    if (!hoSo.recordset.length) {
      throw createServiceError('Không tìm thấy hồ sơ đăng ký.', 404);
    }

    const profile = hoSo.recordset[0];
    if (normalizeStatus(profile.TrangThai) !== normalizeStatus('Đã tiếp nhận')) {
      throw createServiceError('Chỉ được lập lịch cho hồ sơ đã tiếp nhận.');
    }
    if (profile.MaNhanVienSale && profile.MaNhanVienSale !== user?.maNguoiDung) {
      throw createServiceError('Hồ sơ đang do nhân viên Sale khác xử lý.', 403);
    }

    const sttRequest = new sql.Request(transaction);
    sttRequest.input('MaDangKy', sql.VarChar(6), maDangKy);
    const sttResult = await sttRequest.query(`
      SELECT ISNULL(MAX(STTLich), 0) + 1 AS sttLich
      FROM dbo.LichXemPhong WITH (UPDLOCK, HOLDLOCK)
      WHERE MaDangKy = @MaDangKy
    `);
    const sttLich = Number(sttResult.recordset[0]?.sttLich || 1);

    const lichRequest = new sql.Request(transaction);
    lichRequest.input('MaDangKy', sql.VarChar(6), maDangKy);
    lichRequest.input('STTLich', sql.Int, sttLich);
    lichRequest.input('ThoiGianHen', sql.DateTime, thoiGianHen);
    lichRequest.input('GhiChu', sql.NVarChar(500), data.ghiChu || null);
    await lichRequest.query(`
      INSERT INTO dbo.LichXemPhong (MaDangKy, STTLich, ThoiGianHen, TrangThai, GhiChu)
      VALUES (@MaDangKy, @STTLich, @ThoiGianHen, N'Chờ xem', @GhiChu)
    `);

    for (const maPhong of phongIds) {
      const roomRequest = new sql.Request(transaction);
      roomRequest.input('MaPhong', sql.VarChar(4), maPhong);
      const room = await roomRequest.query(`
        SELECT MaPhong, MaChiNhanh, TinhTrang
        FROM dbo.Phong
        WHERE MaPhong = @MaPhong
      `);

      if (!room.recordset.length) {
        throw createServiceError(`Không tìm thấy phòng ${maPhong}.`);
      }

      const roomRecord = room.recordset[0];
      if (user?.maChiNhanh && roomRecord.MaChiNhanh !== user.maChiNhanh) {
        throw createServiceError(`Phòng ${maPhong} không thuộc chi nhánh của nhân viên Sale.`, 403);
      }
      if (normalizeStatus(roomRecord.TinhTrang) === normalizeStatus('Đầy')) {
        throw createServiceError(`Phòng ${maPhong} đã đầy, vui lòng chọn phòng khác.`);
      }

      const detailRequest = new sql.Request(transaction);
      detailRequest.input('MaDangKy', sql.VarChar(6), maDangKy);
      detailRequest.input('MaPhong', sql.VarChar(4), maPhong);
      detailRequest.input('STTLich', sql.Int, sttLich);
      await detailRequest.query(`
        INSERT INTO dbo.ChiTietXemPhong (MaDangKy, MaPhong, STTLich)
        VALUES (@MaDangKy, @MaPhong, @STTLich)
      `);
    }

    if (nhanVienSaleId) {
      const saleRequest = new sql.Request(transaction);
      saleRequest.input('MaDangKy', sql.VarChar(6), maDangKy);
      saleRequest.input('NhanVienSaleId', sql.VarChar(6), nhanVienSaleId);
      await saleRequest.query(`
        UPDATE dbo.PhieuDangKy
        SET MaNhanVienSale = COALESCE(MaNhanVienSale, @NhanVienSaleId)
        WHERE MaDangKy = @MaDangKy
      `);
    }

    await transaction.commit();

    const result = await getLichXemPhong({ maDangKy, sttLich }, user);
    return result[0] || { id: `${maDangKy}-${sttLich}`, maDangKy, sttLich };
  } catch (error) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch {
        // ignore rollback failure so the original error is surfaced
      }
    }
    handleDatabaseError(error);
  }
}

export async function getLichXemPhong(filter = {}, user = null) {
  const maDangKy = filter.maDangKy ? String(filter.maDangKy).trim() : null;
  const sttLich = filter.sttLich ? Number(filter.sttLich) : null;
  const maKhachHang = isCustomerUser(user)
    ? user.maNguoiDung
    : (filter.maKhachHang ? String(filter.maKhachHang).trim() : null);
  const nhanVienSaleId = isSaleUser(user)
    ? user.maNguoiDung
    : (filter.nhanVienSaleId ? String(filter.nhanVienSaleId).trim() : null);
  const maChiNhanh = isSaleUser(user)
    ? user.maChiNhanh
    : (filter.maChiNhanh ? String(filter.maChiNhanh).trim() : null);

  const result = await executeQuery(`
    SELECT
      CONCAT(lxp.MaDangKy, '-', lxp.STTLich) AS id,
      lxp.MaDangKy AS maDangKy,
      lxp.STTLich AS sttLich,
      lxp.ThoiGianHen AS thoiGianHen,
      lxp.TrangThai AS trangThai,
      lxp.GhiChu AS ghiChu,
      pdk.MaKhachHang AS maKhachHang,
      nd.HoTen AS hoTenKhach,
      nd.SDT AS sdtKhach,
      nd.Email AS emailKhach,
      pdk.MaNhanVienSale AS maNhanVienSale,
      saleNd.HoTen AS tenNhanVienSale,
      saleNd.SDT AS sdtNhanVienSale,
      STRING_AGG(CONCAT(CONVERT(NVARCHAR(10), p.MaPhong), N' - ', p.TenPhong), N', ') AS danhSachPhong,
      STRING_AGG(CONVERT(NVARCHAR(10), p.MaPhong), N',') AS maPhong,
      MIN(p.MaChiNhanh) AS maChiNhanh
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    LEFT JOIN dbo.NguoiDung AS saleNd ON saleNd.MaNguoiDung = pdk.MaNhanVienSale
    LEFT JOIN dbo.ChiTietXemPhong AS ctxp
      ON ctxp.MaDangKy = lxp.MaDangKy AND ctxp.STTLich = lxp.STTLich
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
    WHERE (@MaDangKy IS NULL OR lxp.MaDangKy = @MaDangKy)
      AND (@STTLich IS NULL OR lxp.STTLich = @STTLich)
      AND (@MaKhachHang IS NULL OR pdk.MaKhachHang = @MaKhachHang)
      AND (
        @NhanVienSaleId IS NULL
        OR pdk.MaNhanVienSale = @NhanVienSaleId
        OR EXISTS (
          SELECT 1
          FROM dbo.ChiTietXemPhong AS ctxpScope
          INNER JOIN dbo.Phong AS pScope ON pScope.MaPhong = ctxpScope.MaPhong
          WHERE ctxpScope.MaDangKy = lxp.MaDangKy
            AND ctxpScope.STTLich = lxp.STTLich
            AND pScope.MaChiNhanh = @MaChiNhanh
        )
      )
    GROUP BY
      lxp.MaDangKy, lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai, lxp.GhiChu,
      pdk.MaKhachHang, nd.HoTen, nd.SDT, nd.Email,
      pdk.MaNhanVienSale, saleNd.HoTen, saleNd.SDT
    ORDER BY lxp.ThoiGianHen DESC, lxp.MaDangKy DESC, lxp.STTLich DESC
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich },
    { name: 'MaKhachHang', type: sql.VarChar(6), value: maKhachHang },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: nhanVienSaleId },
    { name: 'MaChiNhanh', type: sql.VarChar(6), value: maChiNhanh }
  ]);

  return result.recordset;
}

export async function yeuCauDieuChinhLich(id, data = {}, user = null) {
  try {
    const { maDangKy, sttLich } = parseScheduleId(id);
    const current = (await getLichXemPhong({ maDangKy, sttLich }, user))[0];
    assertCanAccessSchedule(current, user);
    const thoiGianMoi = data.thoiGianMoi || data.timeText || null;
    const lyDo = data.lyDo || data.reason || null;
    const ghiChu = [
      thoiGianMoi ? `Thời gian đề xuất: ${thoiGianMoi}` : null,
      lyDo ? `Lý do đổi: ${lyDo}` : null
    ].filter(Boolean).join('. ');

    await executeQuery(`
      UPDATE dbo.LichXemPhong
      SET TrangThai = N'Yêu cầu đổi lịch',
          GhiChu = COALESCE(@LyDo, GhiChu)
      WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich
    `, [
      { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
      { name: 'STTLich', type: sql.Int, value: sttLich },
      { name: 'LyDo', type: sql.NVarChar(500), value: ghiChu || lyDo }
    ]);

    const result = await getLichXemPhong({ maDangKy, sttLich }, user);
    return result[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatLichXemPhong(id, data = {}, user = null) {
  requireSaleUser(user);
  try {
    const { maDangKy, sttLich } = parseScheduleId(id);
    const thaoTac = String(data.thaoTac || '').trim().toLowerCase();
    const current = (await getLichXemPhong({ maDangKy, sttLich }, user))[0];
    assertCanAccessSchedule(current, user);
    const currentStatus = normalizeStatus(current.trangThai);
    if (['đã hủy', 'đã xem'].includes(currentStatus)) {
      throw createServiceError('Lịch xem phòng đã kết thúc, không thể cập nhật.');
    }

    if (['huy', 'hủy', 'cancel'].includes(thaoTac)) {
      await executeQuery(`
        UPDATE dbo.LichXemPhong
        SET TrangThai = N'Đã hủy',
            GhiChu = COALESCE(@GhiChuXuLy, GhiChu)
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich
      `, [
        { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
        { name: 'STTLich', type: sql.Int, value: sttLich },
        { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: data.ghiChuXuLy || null }
      ]);
      await rejectRegistrationIfAllSchedulesCancelled(maDangKy);
    } else {
      if (!data.thoiGianXem) {
        throw createServiceError('Vui lòng chọn thời gian xem phòng mới.');
      }
      const thoiGianHen = validateAppointmentTime(data.thoiGianXem);

      await executeQuery(`
        UPDATE dbo.LichXemPhong
        SET ThoiGianHen = @ThoiGianHen,
            TrangThai = N'Chờ xem',
            GhiChu = NULLIF(@GhiChuXuLy, N'')
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich
      `, [
        { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
        { name: 'STTLich', type: sql.Int, value: sttLich },
        { name: 'ThoiGianHen', type: sql.DateTime, value: thoiGianHen },
        { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: data.ghiChuXuLy || null }
      ]);
    }

    const result = await getLichXemPhong({ maDangKy, sttLich }, user);
    return result[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getPhongPhuHop(maDangKy, user = null) {
  requireSaleUser(user);
  const hoSoId = String(maDangKy || '').trim();
  if (!hoSoId) {
    throw createServiceError('Vui lòng cung cấp mã đăng ký.');
  }

  try {
    const profile = await executeQuery(`
      SELECT MucGiaToiDa, SoNguoiDuKienO, SoNam, SoNu, MaNhanVienSale, TrangThai
      FROM dbo.PhieuDangKy
      WHERE MaDangKy = @HoSoId
    `, [
      { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
    ]);
    if (!profile.recordset.length) {
      throw createServiceError('Không tìm thấy hồ sơ đăng ký.', 404);
    }
    const profileRecord = profile.recordset[0] || {};
    if (normalizeStatus(profileRecord.TrangThai) !== normalizeStatus('Đã tiếp nhận')) {
      throw createServiceError('Chỉ được kiểm tra phòng cho hồ sơ đã tiếp nhận.');
    }
    if (profileRecord.MaNhanVienSale && profileRecord.MaNhanVienSale !== user?.maNguoiDung) {
      throw createServiceError('Hồ sơ đang do nhân viên Sale khác xử lý.', 403);
    }
    const mucGiaToiDa = normalizeMoneyVnd(profileRecord.MucGiaToiDa);

    const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
      { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: mucGiaToiDa },
      { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
    ]);

    const rows = filterRoomsByProfileCapacity(result.recordset || [], profileRecord)
      .filter((row) => !user?.maChiNhanh || row.maChiNhanh === user.maChiNhanh || row.MaChiNhanh === user.maChiNhanh);
    const khongCoChiNhanhPhuHop = rows.some((row) => Boolean(row.khongCoChiNhanhPhuHop));
    const rooms = rows
      .filter((row) => row.maPhong)
      .map((row) => ({
        ...row,
        id: row.maPhong,
        name: row.tenPhong,
        type: row.loaiPhong || row.loaiThue,
        price: row.giaThue,
        address: row.diaChi,
        img: row.urlImg,
        status: row.tinhTrang
      }));

    return {
      rooms,
      isRegionValid: !khongCoChiNhanhPhuHop,
      khongCoChiNhanhPhuHop
    };
  } catch (error) {
    handleDatabaseError(error);
  }
}
