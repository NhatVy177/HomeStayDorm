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

  if (!ngayDuKienVaoO || !Number.isInteger(soNguoiO) || soNguoiO < 1) {
    throw createServiceError('Vui long nhap ngay du kien va so nguoi o');
  }

  try {
    let finalGhiChu = data.ghiChu || '';

    const result = await executeProcedure('dbo.SP_KhachMoi_TaoHoSo', [
      { name: 'KhachHangId', type: sql.VarChar(6), value: khachHangId },
      { name: 'GioiTinh', type: sql.NVarChar(10), value: data.gioiTinhThue || null },
      { name: 'SoNamInput', type: sql.Int, value: data.soNam || 0 },
      { name: 'SoNuInput', type: sql.Int, value: data.soNu || 0 },
      { name: 'KhuVucMongMuon', type: sql.NVarChar(100), value: data.khuVucMongMuon || null },
      { name: 'LoaiPhongYeuCau', type: sql.NVarChar(50), value: data.loaiPhongYeuCau || null },
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
    let soNam = data.soNam ? Number(data.soNam) : 0;
    let soNu = data.soNu ? Number(data.soNu) : 0;
    const soNguoiO = data.soNguoiO ? Number(data.soNguoiO) : null;
    if (data.gioiTinh === 'Nam') {
      soNam = soNguoiO || 0;
      soNu = 0;
    } else if (data.gioiTinh === 'Nữ') {
      soNu = soNguoiO || 0;
      soNam = 0;
    } else if (data.gioiTinh === 'Khác' || data.gioiTinh === 'Hỗn hợp') {
      if (soNam === 0 && soNu === 0) soNam = soNguoiO || 0;
    } else {
      soNam = soNguoiO || 0;
      soNu = 0;
    }

    await transaction.request()
      .input('MaDangKy', sql.VarChar(6), maDangKy)
      .input('GioiTinh', sql.NVarChar(10), data.gioiTinh || null)
      .input('SoNam', sql.Int, soNam)
      .input('SoNu', sql.Int, soNu)
      .input('KhuVucMongMuon', sql.NVarChar(100), data.khuVucMongMuon || null)
      .input('LoaiPhongYeuCau', sql.NVarChar(50), data.loaiPhongYeuCau || null)
      .input('MucGiaToiDa', sql.Decimal(15, 2), normalizeMoneyVnd(data.mucGiaToiDa))
      .input('SoNguoiO', sql.Int, soNguoiO)
      .input('NgayDuKienVaoO', sql.Date, data.ngayDuKienVaoO || null)
      .input('ThoiHanThue', sql.Int, data.thoiHanThue ? Number(data.thoiHanThue) : null)
      .input('GhiChu', sql.NVarChar(sql.MAX), data.ghiChu || null)
      .query(`
        UPDATE dbo.PhieuDangKy SET
          GioiTinh            = @GioiTinh,
          SoNam               = @SoNam,
          SoNu                = @SoNu,
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

  const hopDongResult = await pool.request()
    .input('MaKhachHang', sql.VarChar(6), khachHangId)
    .query(`
      SELECT TOP 1
        hd.MaHopDong,
        hd.NgayKyHD,
        hd.NgayBatDau,
        hd.NgayKetThuc,
        hd.SoGiuongThue,
        hd.GiaThue,
        hd.KyThanhToan,
        hd.TrangThai,
        hd.MaPhieuCoc,
        hd.MaKhachHang,
        pdc.HinhThucThue,
        pdc.SoTienCoc,
        p.MaPhong,
        p.TenPhong,
        ct.MaGiuong,
        lp.TenLoaiPhong,
        cn.TenChiNhanh,
        cn.DiaChi,
        ha.UrlImg,
        ptp.MaPhieuTra,
        ptp.NgayDangKyTra,
        ptp.NgayDuKienTra,
        ptp.NgayTraThucTe,
        ptp.TrangThai AS TrangThaiTraPhong,
        ds.MaDoiSoat AS MaDoiSoatTraPhong,
        ds.NgayLap AS NgayLapDoiSoatTraPhong,
        ds.TienCocBanDau AS TienCocBanDauTraPhong,
        ds.SoThangLuuTru AS SoThangLuuTruTraPhong,
        ds.TyLeHoanCocHienTai AS TyLeHoanCocHienTaiTraPhong,
        ds.TienCocDuocHoan AS TienCocDuocHoanTraPhong,
        ds.TienThueConNo AS TienThueConNoTraPhong,
        ds.TienDichVuConNo AS TienDichVuConNoTraPhong,
        ds.TongChiPhiSuaChua AS TongChiPhiSuaChuaTraPhong,
        ds.TienPhat AS TienPhatTraPhong,
        ds.TongKhauTru AS TongKhauTruTraPhong,
        ds.SoTienHoanThucTe AS SoTienHoanThucTeTraPhong,
        ds.SoTienKhachPhaiTT AS SoTienKhachPhaiTTTraPhong,
        ds.PhuongThucThanhToan AS PhuongThucThanhToanTraPhong,
        ds.ChungTuThanhToan AS ChungTuThanhToanTraPhong,
        ds.NgayThanhToan AS NgayThanhToanTraPhong,
        ds.GhiChuPhanHoiKhach AS GhiChuPhanHoiKhachTraPhong,
        ds.LoaiQuyetToan AS LoaiQuyetToanTraPhong,
        ds.TrangThai AS TrangThaiDoiSoatTraPhong
      FROM dbo.HopDongThue AS hd
      INNER JOIN dbo.PhieuDatCoc AS pdc
        ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
      OUTER APPLY (
        SELECT TOP 1 ctdc.MaPhong, ctdc.MaGiuong
        FROM dbo.ChiTietDatCoc AS ctdc
        WHERE ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
        ORDER BY ctdc.MaChiTietDC
      ) AS ct
      LEFT JOIN dbo.Phong AS p
        ON p.MaPhong = ct.MaPhong
      LEFT JOIN dbo.LoaiPhong AS lp
        ON lp.MaLoaiPhong = p.MaLoaiPhong
      LEFT JOIN dbo.ChiNhanh AS cn
        ON cn.MaChiNhanh = p.MaChiNhanh
      OUTER APPLY (
        SELECT TOP 1 hap.UrlImg
        FROM dbo.HinhAnhPhong AS hap
        WHERE hap.MaPhong = p.MaPhong
        ORDER BY hap.STTAnh
      ) AS ha
      OUTER APPLY (
        SELECT TOP 1
          p.MaPhieuTra,
          p.NgayDangKyTra,
          p.NgayDuKienTra,
          p.NgayTraThucTe,
          p.TrangThai
        FROM dbo.PhieuTraPhong AS p
        WHERE p.MaHopDong = hd.MaHopDong
          AND p.TrangThai <> N'Hủy'
        ORDER BY p.NgayDangKyTra DESC, p.MaPhieuTra DESC
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
          d.GhiChuPhanHoiKhach,
          d.LoaiQuyetToan,
          d.TrangThai
        FROM dbo.DoiSoat AS d
        WHERE d.MaPhieuTra = ptp.MaPhieuTra
        ORDER BY d.NgayLap DESC, d.MaDoiSoat DESC
      ) AS ds
      WHERE hd.MaKhachHang = @MaKhachHang
      ORDER BY
        CASE WHEN hd.TrangThai = N'Hiệu lực' THEN 0 ELSE 1 END,
        hd.NgayKyHD DESC,
        hd.MaHopDong DESC;
    `);

  const hopDong = hopDongResult.recordset?.[0] || null;
  if (!hopDong) {
    return { data: null };
  }

  const [taiSanResult, quyDinhResult] = await Promise.all([
    pool.request()
      .input('MaPhong', sql.VarChar(4), hopDong.MaPhong || null)
      .query(`
        SELECT MaTaiSan, TenTaiSan, SoLuong, DonGia
        FROM dbo.TaiSan
        WHERE MaPhong = @MaPhong
        ORDER BY MaTaiSan;
      `),
    pool.request()
      .query(`
        SELECT MaQuyDinh, TieuDeNoiQuy, NoiDung
        FROM dbo.QuiDinh
        WHERE TrangThai = N'Hiệu lực'
        ORDER BY MaQuyDinh;
      `)
  ]);

  hopDong.taiSan = taiSanResult.recordset || [];
  hopDong.quyDinh = quyDinhResult.recordset || [];

  let chiTietKhauTru = {
    hoaDonConNo: [],
    chiTietHoaDon: [],
    bienBanKiemTra: [],
    chiTietHuHong: [],
    bienBanViPham: []
  };

  if (hopDong.MaDoiSoatTraPhong && hopDong.MaPhieuTra) {
    const [
      hoaDonConNoResult,
      chiTietHoaDonResult,
      bienBanKiemTraResult,
      chiTietHuHongResult,
      bienBanViPhamResult
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
          FROM dbo.HoaDon hd
          INNER JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
          OUTER APPLY (
            SELECT SUM(ISNULL(cthd.ThanhTien, 0)) AS tienDichVuConNo
            FROM dbo.ChiTietHoaDon cthd
            WHERE cthd.MaHoaDon = hd.MaHoaDon
          ) dvNo
          WHERE @MaHopDong IS NOT NULL
            AND hdt.MaHopDong = @MaHopDong
            AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
          ORDER BY hd.NgayHanTT ASC, hd.NgayLap ASC, hd.MaHoaDon ASC;
        `),
      pool.request()
        .input('MaHopDong', sql.VarChar(6), hopDong.MaHopDong || null)
        .query(`
          SELECT
            hd.MaHoaDon AS maHoaDon,
            cthd.MaChiTietHD AS maChiTietHD,
            N'Dịch vụ' AS loaiKhoanNo,
            dv.TenDichVu AS tenDichVu,
            cthd.SoLuong AS soLuong,
            cthd.DonViTinh AS donViTinh,
            cthd.DonGia AS donGia,
            ISNULL(cthd.ThanhTien, 0) AS thanhTien,
            cthd.MaPhieuGhi AS maPhieuGhi
          FROM dbo.HoaDon hd
          INNER JOIN dbo.HopDongThue hdt ON hdt.MaHopDong = hd.MaHopDong
          INNER JOIN dbo.ChiTietHoaDon cthd ON cthd.MaHoaDon = hd.MaHoaDon
          LEFT JOIN dbo.DichVuHopDong dvhd ON dvhd.MaChiTietDVHD = cthd.MaChiTietDVHD
          LEFT JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
          WHERE @MaHopDong IS NOT NULL
            AND hdt.MaHopDong = @MaHopDong
            AND hd.TrangThai IN (N'Chưa TT', N'Nợ')
          ORDER BY hd.MaHoaDon ASC, cthd.MaChiTietHD ASC;
        `),
      pool.request()
        .input('MaPhieuTra', sql.VarChar(6), hopDong.MaPhieuTra)
        .query(`
          SELECT
            bbkt.MaBienBanKT AS maBienBanKT,
            bbkt.NgayKiemTra AS ngayKiemTra,
            bbkt.TinhTrangPhong AS tinhTrangPhong,
            bbkt.TongChiPhiSuaChua AS tongChiPhiSuaChua
          FROM dbo.BienBanKiemTraPhong bbkt
          WHERE bbkt.MaPhieuTra = @MaPhieuTra
          ORDER BY bbkt.NgayKiemTra ASC, bbkt.MaBienBanKT ASC;
        `),
      pool.request()
        .input('MaPhieuTra', sql.VarChar(6), hopDong.MaPhieuTra)
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
            AND bbvp.TrangThai = N'Chờ xử lý'
          ORDER BY bbvp.NgayViPham ASC, bbvp.MaBBViPham ASC;
        `)
    ]);

    chiTietKhauTru = {
      hoaDonConNo: hoaDonConNoResult.recordset || [],
      chiTietHoaDon: chiTietHoaDonResult.recordset || [],
      bienBanKiemTra: bienBanKiemTraResult.recordset || [],
      chiTietHuHong: chiTietHuHongResult.recordset || [],
      bienBanViPham: bienBanViPhamResult.recordset || []
    };
  }

  hopDong.yeuCauTraPhong = hopDong.MaPhieuTra
    ? {
        maPhieuTra: hopDong.MaPhieuTra,
        ngayDangKyTra: hopDong.NgayDangKyTra,
        ngayDuKienTra: hopDong.NgayDuKienTra,
        ngayTraThucTe: hopDong.NgayTraThucTe,
        trangThai: hopDong.TrangThaiTraPhong,
        doiSoat: hopDong.MaDoiSoatTraPhong
          ? {
              maDoiSoat: hopDong.MaDoiSoatTraPhong,
              ngayLap: hopDong.NgayLapDoiSoatTraPhong,
              tienCocBanDau: hopDong.TienCocBanDauTraPhong,
              soThangLuuTru: hopDong.SoThangLuuTruTraPhong,
              tyLeHoanCocHienTai: hopDong.TyLeHoanCocHienTaiTraPhong,
              tienCocDuocHoan: hopDong.TienCocDuocHoanTraPhong,
              tienThueConNo: hopDong.TienThueConNoTraPhong,
              tienDichVuConNo: hopDong.TienDichVuConNoTraPhong,
              tongChiPhiSuaChua: hopDong.TongChiPhiSuaChuaTraPhong,
              tienPhat: hopDong.TienPhatTraPhong,
              tongKhauTru: hopDong.TongKhauTruTraPhong,
              soTienHoanThucTe: hopDong.SoTienHoanThucTeTraPhong,
              soTienKhachPhaiTT: hopDong.SoTienKhachPhaiTTTraPhong,
              phuongThucThanhToan: hopDong.PhuongThucThanhToanTraPhong,
              chungTuThanhToan: hopDong.ChungTuThanhToanTraPhong,
              ngayThanhToan: hopDong.NgayThanhToanTraPhong,
              ghiChuPhanHoiKhach: hopDong.GhiChuPhanHoiKhachTraPhong,
              loaiQuyetToan: hopDong.LoaiQuyetToanTraPhong,
              trangThai: hopDong.TrangThaiDoiSoatTraPhong,
              chiTietKhauTru
            }
          : null
      }
    : null;
  hopDong.taiKhoanThanhToan = {
    nganHang: process.env.BANK_NAME || 'Vietcombank',
    soTaiKhoan: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    chuTaiKhoan: process.env.BANK_ACCOUNT_HOLDER || 'CONG TY HOMESTAY DORM'
  };

  return { data: hopDong };
}

export async function guiYeuCauTraPhong(user, data = {}) {
  const khachHangId = requireCustomer(user);
  const result = await executeProcedure('dbo.SP_TraPhong_KhachHang_GuiYeuCau', [
    { name: 'MaKhachHang', type: sql.VarChar(6), value: khachHangId },
    { name: 'MaHopDong', type: sql.VarChar(6), value: data.maHopDong || null },
    { name: 'NgayDuKienTra', type: sql.Date, value: data.ngayDuKienTra ? new Date(data.ngayDuKienTra) : null }
  ]);

  return result.recordset?.[0] || null;
}

export async function huyYeuCauTraPhong(user, maPhieuTra) {
  const khachHangId = requireCustomer(user);
  if (!maPhieuTra) throw createServiceError('Thiếu mã yêu cầu trả phòng.', 400);

  const result = await executeProcedure('dbo.SP_TraPhong_KhachHang_HuyYeuCau', [
    { name: 'MaKhachHang', type: sql.VarChar(6), value: khachHangId },
    { name: 'MaPhieuTra', type: sql.VarChar(6), value: maPhieuTra }
  ]);

  return result.recordset?.[0] || null;
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
    throw createServiceError('Vui lòng nhập lý do không đồng ý.', 400);
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
        ds.SoTienHoanThucTe
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

  if (phuongThucThanhToan === 'Chuyển khoản' && !chungTuThanhToan && !isHoanCoc) {
    throw createServiceError('Vui lòng tải minh chứng thanh toán khi chọn chuyển khoản.', 400);
  }

  const result = await pool.request()
    .input('MaDoiSoat', sql.VarChar(6), maDoiSoatValue)
    .input('MaKhachHang', sql.VarChar(6), khachHangId)
    .input('PhuongThucThanhToan', sql.NVarChar(20), phuongThucThanhToan)
    .input('ChungTuThanhToan', sql.VarChar(500), chungTuThanhToan)
    .query(`
      UPDATE ds
      SET ds.PhuongThucThanhToan = @PhuongThucThanhToan,
          ds.ChungTuThanhToan = @ChungTuThanhToan
      OUTPUT
        inserted.MaDoiSoat AS maDoiSoat,
        inserted.MaPhieuTra AS maPhieuTra,
        inserted.TrangThai AS trangThaiDoiSoat,
        inserted.PhuongThucThanhToan AS phuongThucThanhToan,
        inserted.ChungTuThanhToan AS chungTuThanhToan
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
