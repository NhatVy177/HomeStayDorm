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
    const pool = await getPool();
    const result = await pool.request()
      .input('KhachHangId', sql.VarChar(6), khachHangId)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
          THROW 50101, N'Không tìm thấy khách hàng.', 1;

        SELECT
          @KhachHangId AS khachHangId,
          CAST(CASE
            WHEN EXISTS (SELECT 1 FROM dbo.PhieuDatCoc WHERE MaKhachHang = @KhachHangId)
              OR EXISTS (SELECT 1 FROM dbo.HopDongThue WHERE MaKhachHang = @KhachHangId)
            THEN 0 ELSE 1 END AS BIT) AS laKhachMoi,
          (SELECT COUNT(*) FROM dbo.PhieuDangKy WHERE MaKhachHang = @KhachHangId) AS soHoSo,
          (SELECT COUNT(*)
             FROM dbo.LichXemPhong AS lxp
             INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
             WHERE pdk.MaKhachHang = @KhachHangId) AS soLichXem,
          (SELECT COUNT(*) FROM dbo.PhieuDatCoc WHERE MaKhachHang = @KhachHangId) AS soPhieuCoc,
          (SELECT COUNT(*) FROM dbo.HopDongThue WHERE MaKhachHang = @KhachHangId) AS soHopDong;
      `);
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
  const pool = await getPool();
  const result = await pool.request()
    .input('KhachHangId', sql.VarChar(6), khachHangId)
    .query(`
      SELECT
        pdk.MaDangKy AS id,
        pdk.MaDangKy AS maDangKy,
        pdk.NgayDangKy AS ngayDangKy,
        pdk.HinhThucThue AS hinhThucThue,
        pdk.KhuVucMongMuon AS khuVucMongMuon,
        pdk.LoaiPhongYeuCau AS loaiPhongYeuCau,
        pdk.MucGia AS mucGia,
        pdk.SoNguoiDuKienO AS soNguoiO,
        pdk.ThoiGianDuKienVaoO AS ngayDuKienVaoO,
        pdk.ThoiHanThue AS thoiHanThue,
        pdk.YeuCauKhac AS ghiChu,
        pdk.TrangThai AS trangThai,
        lich.STTLich AS sttLich,
        lich.ThoiGianHen AS thoiGianHen,
        lich.TrangThai AS trangThaiLich
      FROM dbo.PhieuDangKy AS pdk
      OUTER APPLY (
        SELECT TOP (1) lxp.STTLich, lxp.ThoiGianHen, lxp.TrangThai
        FROM dbo.LichXemPhong AS lxp
        WHERE lxp.MaDangKy = pdk.MaDangKy
        ORDER BY lxp.STTLich DESC
      ) AS lich
      WHERE pdk.MaKhachHang = @KhachHangId
      ORDER BY pdk.NgayDangKy DESC, pdk.MaDangKy DESC;
    `);
  return result.recordset;
}

async function getSchedules(khachHangId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('KhachHangId', sql.VarChar(6), khachHangId)
    .query(`
      SELECT
        CONCAT(lxp.MaDangKy, '-', lxp.STTLich) AS id,
        lxp.MaDangKy AS maDangKy,
        lxp.STTLich AS sttLich,
        lxp.ThoiGianHen AS thoiGianHen,
        lxp.TrangThai AS trangThai,
        phong.phongXem
      FROM dbo.LichXemPhong AS lxp
      INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
      OUTER APPLY (
        SELECT STUFF((
          SELECT N', ' + p.TenPhong
          FROM dbo.ChiTietXemPhong AS ctxp
          INNER JOIN dbo.Phong AS p ON p.MaPhong = ctxp.MaPhong
          WHERE ctxp.MaDangKy = lxp.MaDangKy AND ctxp.STTLich = lxp.STTLich
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, N'') AS phongXem
      ) AS phong
      WHERE pdk.MaKhachHang = @KhachHangId
      ORDER BY lxp.ThoiGianHen DESC, lxp.MaDangKy DESC, lxp.STTLich DESC;
    `);
  return result.recordset;
}

function normalizeKeyword(value) {
  return String(value || '')
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function roomMatchesKeyword(room, keyword) {
  if (!keyword) return true;
  return normalizeKeyword([
    room.tenPhong,
    room.maPhong,
    room.chiNhanh,
    room.diaChi,
    room.loaiPhong
  ].join(' ')).includes(keyword);
}

async function getAvailableRooms(filter = {}) {
  const keyword = String(filter.tuKhoa || filter.tenPhong || '').trim();
  const rooms = await getDanhSachPhongKhamPha(filter);
  const normalizedKeyword = normalizeKeyword(keyword);
  return rooms.filter((room) => roomMatchesKeyword(room, normalizedKeyword));
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
    const ghiChu = [
      data.ghiChu,
      data.phongQuanTam ? `Phòng quan tâm: ${data.phongQuanTam}` : ''
    ].filter(Boolean).join('\n') || null;
    const result = await executeProcedure('dbo.SP_TaoHoSoDangKy', [
      { name: 'KhachHangId', type: sql.NVarChar(20), value: khachHangId },
      { name: 'NhuCau', type: sql.NVarChar(200), value: data.hinhThucThue === 'Nguyên căn' ? 'Nguyên căn' : 'Ghép' },
      { name: 'SoNguoiO', type: sql.Int, value: soNguoiO },
      { name: 'NgayDuKienVaoO', type: sql.Date, value: ngayDuKienVaoO },
      { name: 'GhiChu', type: sql.NVarChar(sql.MAX), value: ghiChu },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(50), value: data.loaiPhongYeuCau || null },
      {
        name: 'MucGia',
        type: sql.Decimal(15, 2),
        value: data.mucGia == null || data.mucGia === '' ? null : Number(data.mucGia)
      },
      { name: 'ThoiHanThue', type: sql.Int, value: data.thoiHanThue ? Number(data.thoiHanThue) : null }
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
        pdk.HinhThucThue,
        pdk.KhuVucMongMuon,
        pdk.LoaiPhongYeuCau,
        pdk.MucGia,
        pdk.SoNguoiDuKienO  AS soNguoiO,
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

  await pool.request()
    .input('MaDangKy', sql.VarChar(6), maDangKy)
    .input('KhuVucMongMuon', sql.NVarChar(100), data.khuVucMongMuon || null)
    .input('LoaiPhongYeuCau', sql.NVarChar(50), data.loaiPhongYeuCau || null)
    .input('MucGia', sql.Decimal(15, 2), data.mucGia ? Number(data.mucGia) : null)
    .input('SoNguoiO', sql.Int, data.soNguoiO ? Number(data.soNguoiO) : null)
    .input('NgayDuKienVaoO', sql.Date, data.ngayDuKienVaoO || null)
    .input('ThoiHanThue', sql.Int, data.thoiHanThue ? Number(data.thoiHanThue) : null)
    .input('GhiChu', sql.NVarChar(sql.MAX), data.ghiChu || null)
    .query(`
      UPDATE dbo.PhieuDangKy SET
        KhuVucMongMuon      = @KhuVucMongMuon,
        LoaiPhongYeuCau     = @LoaiPhongYeuCau,
        MucGia              = @MucGia,
        SoNguoiDuKienO     = @SoNguoiO,
        ThoiGianDuKienVaoO  = @NgayDuKienVaoO,
        ThoiHanThue         = @ThoiHanThue,
        YeuCauKhac          = @GhiChu
      WHERE MaDangKy = @MaDangKy;
    `);

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
    const pool = await getPool();
    const result = await pool.request()
      .input('KhachHangId', sql.VarChar(6), khachHangId)
      .input('MaDangKy', sql.VarChar(6), maDangKy)
      .input('STTLich', sql.Int, sttLich)
      .input('ThaoTac', sql.NVarChar(20), data.thaoTac || null)
      .input('ThoiGianMoi', sql.DateTime, data.thoiGianMoi || null)
      .query(`
        IF NOT EXISTS (
          SELECT 1
          FROM dbo.LichXemPhong AS lxp
          INNER JOIN dbo.PhieuDangKy AS pdk ON pdk.MaDangKy = lxp.MaDangKy
          WHERE lxp.MaDangKy = @MaDangKy
            AND lxp.STTLich = @STTLich
            AND pdk.MaKhachHang = @KhachHangId
        )
          THROW 50105, N'Không tìm thấy lịch xem phòng.', 1;

        UPDATE dbo.LichXemPhong
        SET
          TrangThai = CASE WHEN @ThaoTac = N'Hủy' THEN N'Yêu cầu hủy' ELSE N'Yêu cầu đổi lịch' END,
          ThoiGianHen = COALESCE(@ThoiGianMoi, ThoiGianHen)
        WHERE MaDangKy = @MaDangKy AND STTLich = @STTLich;

        SELECT
          CONCAT(lxp.MaDangKy, '-', lxp.STTLich) AS id,
          lxp.MaDangKy AS maDangKy,
          lxp.STTLich AS sttLich,
          lxp.ThoiGianHen AS thoiGianHen,
          lxp.TrangThai AS trangThai
        FROM dbo.LichXemPhong AS lxp
        WHERE lxp.MaDangKy = @MaDangKy AND lxp.STTLich = @STTLich;
      `);

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
