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

export async function createLichXemPhong(data = {}, user = null) {
  const maDangKy = String(data.maDangKy || data.hoSoDangKyId || '').trim();
  const thoiGianHen = data.thoiGianXem || data.thoiGianHen || null;
  const phongIds = normalizeRooms(data);
  const nhanVienSaleId = String(data.nhanVienSaleId || user?.maNguoiDung || '').trim() || null;

  if (!maDangKy || !thoiGianHen || phongIds.length === 0) {
    throw createServiceError('Vui lòng chọn hồ sơ, phòng và thời gian xem.');
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const hoSoRequest = new sql.Request(transaction);
    hoSoRequest.input('MaDangKy', sql.VarChar(6), maDangKy);
    const hoSo = await hoSoRequest.query(`
      SELECT MaDangKy, MaKhachHang, MaNhanVienSale
      FROM dbo.PhieuDangKy WITH (UPDLOCK, HOLDLOCK)
      WHERE MaDangKy = @MaDangKy
    `);

    if (!hoSo.recordset.length) {
      throw createServiceError('Không tìm thấy hồ sơ đăng ký.', 404);
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
        SELECT 1
        FROM dbo.Phong
        WHERE MaPhong = @MaPhong
      `);

      if (!room.recordset.length) {
        throw createServiceError(`Không tìm thấy phòng ${maPhong}.`);
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

    const result = await getLichXemPhong({ maDangKy, sttLich });
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

export async function getLichXemPhong(filter = {}) {
  const maDangKy = filter.maDangKy ? String(filter.maDangKy).trim() : null;
  const sttLich = filter.sttLich ? Number(filter.sttLich) : null;

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
      STRING_AGG(CONCAT(CONVERT(NVARCHAR(10), p.MaPhong), N' - ', p.TenPhong), N', ') AS danhSachPhong,
      STRING_AGG(CONVERT(NVARCHAR(10), p.MaPhong), N',') AS maPhong
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    INNER JOIN dbo.NguoiDung AS nd ON nd.MaNguoiDung = pdk.MaKhachHang
    LEFT JOIN dbo.ChiTietXemPhong AS ctxp
      ON ctxp.MaDangKy = lxp.MaDangKy AND ctxp.STTLich = lxp.STTLich
    LEFT JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
    WHERE (@MaDangKy IS NULL OR lxp.MaDangKy = @MaDangKy)
      AND (@STTLich IS NULL OR lxp.STTLich = @STTLich)
    GROUP BY
      lxp.MaDangKy, lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai, lxp.GhiChu,
      pdk.MaKhachHang, nd.HoTen, nd.SDT, nd.Email
    ORDER BY lxp.ThoiGianHen DESC, lxp.MaDangKy DESC, lxp.STTLich DESC
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich }
  ]);

  return result.recordset;
}

export async function yeuCauDieuChinhLich(id, data = {}) {
  try {
    const { maDangKy, sttLich } = parseScheduleId(id);
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

    const result = await getLichXemPhong({ maDangKy, sttLich });
    return result[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function capNhatLichXemPhong(id, data = {}) {
  try {
    const { maDangKy, sttLich } = parseScheduleId(id);
    const thaoTac = String(data.thaoTac || '').trim().toLowerCase();

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
    } else {
      if (!data.thoiGianXem) {
        throw createServiceError('Vui lòng chọn thời gian xem phòng mới.');
      }

      await executeQuery(`
        UPDATE dbo.LichXemPhong
        SET ThoiGianHen = @ThoiGianHen,
            TrangThai = N'Chờ xem',
            GhiChu = NULLIF(@GhiChuXuLy, N'')
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich
      `, [
        { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
        { name: 'STTLich', type: sql.Int, value: sttLich },
        { name: 'ThoiGianHen', type: sql.DateTime, value: data.thoiGianXem },
        { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: data.ghiChuXuLy || null }
      ]);
    }

    const result = await getLichXemPhong({ maDangKy, sttLich });
    return result[0] || null;
  } catch (error) {
    handleDatabaseError(error);
  }
}

export async function getPhongPhuHop(maDangKy) {
  const hoSoId = String(maDangKy || '').trim();
  if (!hoSoId) {
    throw createServiceError('Vui lòng cung cấp mã đăng ký.');
  }

  try {
    const profile = await executeQuery(`
      SELECT MucGiaToiDa
      FROM dbo.PhieuDangKy
      WHERE MaDangKy = @HoSoId
    `, [
      { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
    ]);
    const mucGiaToiDa = normalizeMoneyVnd(profile.recordset[0]?.MucGiaToiDa);

    const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
      { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: mucGiaToiDa },
      { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
    ]);

    const rows = result.recordset || [];
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
