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
    UPDATE "LichXemPhong"
    SET "TrangThai" = 'Đã xem'
    WHERE ($1::VARCHAR IS NULL OR "MaDangKy" = $1)
      AND "TrangThai" IN ('Chờ xem', 'Yêu cầu đổi lịch', 'Yêu cầu hủy')
      AND "ThoiGianHen" <= CURRENT_TIMESTAMP;
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy || null }
  ]);

  // executeQuery now returns rowsAffected
  return Number(result.rowsAffected?.[0] || 0);
}

export async function tuChoiHoSoNeuTatCaLichBiHuy(maDangKy) {
  await executeQuery(`
    UPDATE "PhieuDangKy"
    SET "TrangThai" = 'Từ chối'
    WHERE "MaDangKy" = $1
      AND "TrangThai" <> 'Từ chối'
      AND EXISTS (
        SELECT 1
        FROM "LichXemPhong" AS lxpAny
        WHERE lxpAny."MaDangKy" = $1
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "LichXemPhong" AS lxpActive
        WHERE lxpActive."MaDangKy" = $1
          AND lxpActive."TrangThai" <> 'Đã hủy'
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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hoSo = await client.query(`
      SELECT
        pdk."MaDangKy",
        pdk."MaKhachHang",
        pdk."MaNhanVienSale",
        pdk."TrangThai"
      FROM "PhieuDangKy" AS pdk
      WHERE pdk."MaDangKy" = $1
      FOR UPDATE
    `, [maDangKy]);

    if (!hoSo.rows.length) {
      throw createServiceError('Không tìm thấy hồ sơ đăng ký.', 404);
    }

    const profile = hoSo.rows[0];
    if (normalizeStatus(profile.TrangThai) !== normalizeStatus('Đã tiếp nhận')) {
      throw createServiceError('Chỉ được lập lịch cho hồ sơ đã tiếp nhận.');
    }
    if (profile.MaNhanVienSale && profile.MaNhanVienSale !== user?.maNguoiDung) {
      throw createServiceError('Hồ sơ đang do nhân viên Sale khác xử lý.', 403);
    }

    const sttResult = await client.query(`
      SELECT COALESCE(MAX("STTLich"), 0) + 1 AS "sttLich"
      FROM "LichXemPhong"
      WHERE "MaDangKy" = $1
      FOR UPDATE
    `, [maDangKy]);
    const sttLich = Number(sttResult.rows[0]?.sttLich || 1);

    await client.query(`
      INSERT INTO "LichXemPhong" ("MaDangKy", "STTLich", "ThoiGianHen", "TrangThai", "GhiChu")
      VALUES ($1, $2, $3, 'Chờ xem', $4)
    `, [maDangKy, sttLich, thoiGianHen, ghiChu || null]);

    for (const maPhong of phongIds) {
      const room = await client.query(`
        SELECT "MaPhong", "MaChiNhanh", "TinhTrang"
        FROM "Phong"
        WHERE "MaPhong" = $1
      `, [maPhong]);

      if (!room.rows.length) {
        throw createServiceError(`Không tìm thấy phòng ${maPhong}.`);
      }

      const roomRecord = room.rows[0];
      if (user?.maChiNhanh && roomRecord.MaChiNhanh !== user.maChiNhanh) {
        throw createServiceError(`Phòng ${maPhong} không thuộc chi nhánh của nhân viên Sale.`, 403);
      }
      if (normalizeStatus(roomRecord.TinhTrang) === normalizeStatus('Đầy')) {
        throw createServiceError(`Phòng ${maPhong} đã đầy, vui lòng chọn phòng khác.`);
      }

      await client.query(`
        INSERT INTO "ChiTietXemPhong" ("MaDangKy", "MaPhong", "STTLich")
        VALUES ($1, $2, $3)
      `, [maDangKy, maPhong, sttLich]);
    }

    if (nhanVienSaleId) {
      await client.query(`
        UPDATE "PhieuDangKy"
        SET "MaNhanVienSale" = COALESCE("MaNhanVienSale", $2)
        WHERE "MaDangKy" = $1
      `, [maDangKy, nhanVienSaleId]);
    }

    await client.query('COMMIT');
    return sttLich;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function layDanhSachLichXemPhong(filter = {}) {
  await capNhatLichXemDenGioThanhDaXem({ maDangKy: filter.maDangKy || null });

  const result = await executeQuery(`
    SELECT
      CONCAT(lxp."MaDangKy", '-', lxp."STTLich") AS "id",
      lxp."MaDangKy" AS "maDangKy",
      lxp."STTLich" AS "sttLich",
      lxp."ThoiGianHen" AS "thoiGianHen",
      lxp."TrangThai" AS "trangThai",
      lxp."GhiChu" AS "ghiChu",
      pdk."MaKhachHang" AS "maKhachHang",
      nd."HoTen" AS "hoTenKhach",
      nd."SDT" AS "sdtKhach",
      nd."Email" AS "emailKhach",
      pdk."MaNhanVienSale" AS "maNhanVienSale",
      saleNd."HoTen" AS "tenNhanVienSale",
      saleNd."SDT" AS "sdtNhanVienSale",
      STRING_AGG(CONCAT(p."MaPhong"::VARCHAR, ' - ', p."TenPhong"), ', ') AS "danhSachPhong",
      STRING_AGG(p."MaPhong"::VARCHAR, ',') AS "maPhong",
      MIN(p."MaChiNhanh") AS "maChiNhanh",
      CAST(CASE
        WHEN pdk."TrangThai" IN ('Chờ xác nhận cọc', 'Xác nhận cọc')
          OR EXISTS (
            SELECT 1
            FROM "PhieuDatCoc" AS pdc
            WHERE pdc."MaPhieuYeuCauDangKy" = lxp."MaDangKy"
              AND pdc."TrangThaiCoc" <> 'Đã hủy'
          )
        THEN 1 ELSE 0
      END AS BOOLEAN) AS "daGuiYeuCauDatCoc",
      CAST(CASE
        WHEN lxp."TrangThai" <> 'Đã hủy'
          AND CURRENT_TIMESTAMP < lxp."ThoiGianHen" + INTERVAL '30 minutes'
          AND pdk."TrangThai" NOT IN ('Chờ xác nhận cọc', 'Xác nhận cọc')
          AND NOT EXISTS (
            SELECT 1
            FROM "PhieuDatCoc" AS pdc
            WHERE pdc."MaPhieuYeuCauDangKy" = lxp."MaDangKy"
              AND pdc."TrangThaiCoc" <> 'Đã hủy'
          )
        THEN 1 ELSE 0
      END AS BOOLEAN) AS "coTheHuy"
    FROM "LichXemPhong" AS lxp
    INNER JOIN "PhieuDangKy" AS pdk ON pdk."MaDangKy" = lxp."MaDangKy"
    INNER JOIN "NguoiDung" AS nd ON nd."MaNguoiDung" = pdk."MaKhachHang"
    LEFT JOIN "NguoiDung" AS saleNd ON saleNd."MaNguoiDung" = pdk."MaNhanVienSale"
    LEFT JOIN "ChiTietXemPhong" AS ctxp
      ON ctxp."MaDangKy" = lxp."MaDangKy" AND ctxp."STTLich" = lxp."STTLich"
    LEFT JOIN "Phong" AS p ON p."MaPhong" = ctxp."MaPhong"
    WHERE ($1::VARCHAR IS NULL OR lxp."MaDangKy" = $1)
      AND ($2::INT IS NULL OR lxp."STTLich" = $2)
      AND ($3::VARCHAR IS NULL OR pdk."MaKhachHang" = $3)
      AND (
        $4::VARCHAR IS NULL
        OR pdk."MaNhanVienSale" = $4
        OR EXISTS (
          SELECT 1
          FROM "ChiTietXemPhong" AS ctxpScope
          INNER JOIN "Phong" AS pScope ON pScope."MaPhong" = ctxpScope."MaPhong"
          WHERE ctxpScope."MaDangKy" = lxp."MaDangKy"
            AND ctxpScope."STTLich" = lxp."STTLich"
            AND pScope."MaChiNhanh" = $5
        )
      )
    GROUP BY
      lxp."MaDangKy", lxp."STTLich", lxp."ThoiGianHen", lxp."TrangThai", lxp."GhiChu",
      pdk."MaKhachHang", pdk."TrangThai", nd."HoTen", nd."SDT", nd."Email",
      pdk."MaNhanVienSale", saleNd."HoTen", saleNd."SDT"
    ORDER BY lxp."ThoiGianHen" DESC, lxp."MaDangKy" DESC, lxp."STTLich" DESC
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
    UPDATE "LichXemPhong"
    SET "TrangThai" = 'Yêu cầu đổi lịch',
        "GhiChu" = COALESCE($3, "GhiChu")
    WHERE "MaDangKy" = $1 AND "STTLich" = $2
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich },
    { name: 'LyDo', type: sql.NVarChar(500), value: lyDo }
  ]);
}

export async function huyLichXemPhong({ maDangKy, sttLich, ghiChuXuLy } = {}) {
  const result = await executeQuery(`
    UPDATE "LichXemPhong" AS lxp
    SET "TrangThai" = 'Đã hủy',
        "GhiChu" = COALESCE($3, lxp."GhiChu")
    FROM "PhieuDangKy" AS pdk
    WHERE pdk."MaDangKy" = lxp."MaDangKy"
      AND lxp."MaDangKy" = $1 AND lxp."STTLich" = $2
      AND lxp."TrangThai" <> 'Đã hủy'
      AND CURRENT_TIMESTAMP < lxp."ThoiGianHen" + INTERVAL '30 minutes'
      AND pdk."TrangThai" NOT IN ('Chờ xác nhận cọc', 'Xác nhận cọc')
      AND NOT EXISTS (
        SELECT 1
        FROM "PhieuDatCoc" AS pdc
        WHERE pdc."MaPhieuYeuCauDangKy" = lxp."MaDangKy"
          AND pdc."TrangThaiCoc" <> 'Đã hủy'
      );
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich },
    { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: ghiChuXuLy || null }
  ]);

  return Number(result.rowsAffected?.[0] || 0);
}

export async function capNhatThoiGianLichXemPhong({ maDangKy, sttLich, thoiGianHen, ghiChuXuLy } = {}) {
  await executeQuery(`
    UPDATE "LichXemPhong"
    SET "ThoiGianHen" = $3,
        "TrangThai" = 'Chờ xem',
        "GhiChu" = NULLIF($4, '')
    WHERE "MaDangKy" = $1 AND "STTLich" = $2
  `, [
    { name: 'MaDangKy', type: sql.VarChar(6), value: maDangKy },
    { name: 'STTLich', type: sql.Int, value: sttLich },
    { name: 'ThoiGianHen', type: sql.DateTime, value: thoiGianHen },
    { name: 'GhiChuXuLy', type: sql.NVarChar(500), value: ghiChuXuLy || null }
  ]);
}

export async function layHoSoDangKyChoPhongPhuHop(hoSoId) {
  const result = await executeQuery(`
    SELECT "MucGiaToiDa", "SoNguoiDuKienO", "SoNam", "SoNu", "MaNhanVienSale", "TrangThai"
    FROM "PhieuDangKy"
    WHERE "MaDangKy" = $1
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
