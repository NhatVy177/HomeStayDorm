import { executeProcedure, executeQuery, getPool, sql } from '../database/connection.js';
import { createServiceError } from '../errors/serviceErrors.js';

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('vi-VN');
}

function normalizeStatus(value) {
  return normalizeText(value);
}

export async function capNhatLichXemDenGioThanhDaXem({ maDangKy = null } = {}) {
  const result = await executeQuery(`
    UPDATE dbo.LichXemPhong
    SET TrangThai = N'Đã xem'
    WHERE (@MaDangKy IS NULL OR MaDangKy = @MaDangKy)
      AND TrangThai IN (N'Chờ xem', N'Yêu cầu đổi lịch', N'Yêu cầu hủy')
      AND ThoiGianHen <= GETDATE();

    SELECT @@ROWCOUNT AS soLichCapNhat;
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy || null }
  ]);

  return Number(result.recordset?.[0]?.soLichCapNhat || 0);
}

export async function tuChoiHoSoNeuTatCaLichBiHuy(maDangKy) {
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

export async function taoLichXemPhong({
  maDangKy,
  thoiGianHen,
  phongIds = [],
  nhanVienSaleId = null,
  ghiChu = null,
  user = null
} = {}) {
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
    lichRequest.input('GhiChu', sql.NVarChar(500), ghiChu || null);
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
    return sttLich;
  } catch (error) {
    if (transaction._aborted !== true) {
      try {
        await transaction.rollback();
      } catch {
        // ignore rollback failure so the original error is surfaced
      }
    }
    throw error;
  }
}

export async function layDanhSachLichXemPhong(filter = {}) {
  await capNhatLichXemDenGioThanhDaXem({ maDangKy: filter.maDangKy || null });

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
      MIN(p.MaChiNhanh) AS maChiNhanh,
      CAST(CASE
        WHEN pdk.TrangThai IN (N'Chờ xác nhận cọc', N'Xác nhận cọc')
          OR EXISTS (
            SELECT 1
            FROM dbo.PhieuDatCoc AS pdc
            WHERE pdc.MaPhieuYeuCauDangKy = lxp.MaDangKy
              AND pdc.TrangThaiCoc <> N'Đã hủy'
          )
        THEN 1 ELSE 0
      END AS BIT) AS daGuiYeuCauDatCoc,
      CAST(CASE
        WHEN lxp.TrangThai <> N'Đã hủy'
          AND GETDATE() < DATEADD(MINUTE, 30, lxp.ThoiGianHen)
          AND pdk.TrangThai NOT IN (N'Chờ xác nhận cọc', N'Xác nhận cọc')
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.PhieuDatCoc AS pdc
            WHERE pdc.MaPhieuYeuCauDangKy = lxp.MaDangKy
              AND pdc.TrangThaiCoc <> N'Đã hủy'
          )
        THEN 1 ELSE 0
      END AS BIT) AS coTheHuy
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
      pdk.MaNhanVienSale, pdk.TrangThai, saleNd.HoTen, saleNd.SDT
    ORDER BY lxp.ThoiGianHen DESC, lxp.MaDangKy DESC, lxp.STTLich DESC
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: filter.maDangKy },
    { name: 'STTLich', type: sql.Int, value: filter.sttLich },
    { name: 'MaKhachHang', type: sql.VarChar(6), value: filter.maKhachHang },
    { name: 'NhanVienSaleId', type: sql.VarChar(6), value: filter.nhanVienSaleId },
    { name: 'MaChiNhanh', type: sql.VarChar(6), value: filter.maChiNhanh }
  ]);

  return result.recordset || [];
}

export async function ghiNhanYeuCauDieuChinhLich({ maDangKy, sttLich, lyDo } = {}) {
  await executeQuery(`
    UPDATE dbo.LichXemPhong
    SET TrangThai = N'Yêu cầu đổi lịch',
        GhiChu = COALESCE(@LyDo, GhiChu)
    WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich },
    { name: 'LyDo', type: sql.NVarChar(500), value: lyDo }
  ]);
}

export async function huyLichXemPhong({ maDangKy, sttLich, ghiChuXuLy } = {}) {
  const result = await executeQuery(`
    UPDATE lxp
    SET TrangThai = N'Đã hủy',
        GhiChu = COALESCE(@GhiChuXuLy, lxp.GhiChu)
    FROM dbo.LichXemPhong AS lxp
    INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
    WHERE lxp.MaDangKy = @MaDangKy AND lxp.STTLich = @STTLich
      AND lxp.TrangThai <> N'Đã hủy'
      AND GETDATE() < DATEADD(MINUTE, 30, lxp.ThoiGianHen)
      AND pdk.TrangThai NOT IN (N'Chờ xác nhận cọc', N'Xác nhận cọc')
      AND NOT EXISTS (
        SELECT 1
        FROM dbo.PhieuDatCoc AS pdc
        WHERE pdc.MaPhieuYeuCauDangKy = lxp.MaDangKy
          AND pdc.TrangThaiCoc <> N'Đã hủy'
      );

    SELECT @@ROWCOUNT AS soLichCapNhat;
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich },
    { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: ghiChuXuLy || null }
  ]);

  return Number(result.recordset?.[0]?.soLichCapNhat || 0);
}

export async function capNhatThoiGianLichXemPhong({ maDangKy, sttLich, thoiGianHen, ghiChuXuLy } = {}) {
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
    { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: ghiChuXuLy || null }
  ]);
}

export async function layHoSoDangKyChoPhongPhuHop(hoSoId) {
  const result = await executeQuery(`
    SELECT MucGiaToiDa, SoNguoiDuKienO, SoNam, SoNu, MaNhanVienSale, TrangThai
    FROM dbo.PhieuDangKy
    WHERE MaDangKy = @HoSoId
  `, [
    { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
  ]);

  return result.recordset[0] || null;
}

export async function layPhongGiuongKhaDungChoHoSo({ hoSoId, mucGiaToiDa } = {}) {
  const result = await executeProcedure('dbo.SP_DanhSachPhongGiuongKhaDung', [
    { name: 'MucGiaToiDa', type: sql.Decimal(15, 2), value: mucGiaToiDa },
    { name: 'HoSoId', type: sql.VarChar(6), value: hoSoId }
  ]);

  return result.recordset || [];
}
