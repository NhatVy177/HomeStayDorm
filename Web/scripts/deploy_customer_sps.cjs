const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function deployCustomerSPs() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase!\n');

  // 1. sp_khach_moi_danh_sach_ho_so
  console.log('Deploying sp_khach_moi_danh_sach_ho_so...');
  await client.query(`
    CREATE OR REPLACE FUNCTION sp_khach_moi_danh_sach_ho_so(
      p_khach_hang_id varchar
    )
    RETURNS TABLE (
      id varchar,
      "maDangKy" varchar,
      "ngayDangKy" timestamp,
      "khuVucMongMuon" varchar,
      "loaiPhongYeuCau" text,
      "mucGia" numeric,
      "soNguoiO" int,
      "soNam" int,
      "soNu" int,
      "ngayDuKienVaoO" date,
      "thoiHanThue" int,
      "ghiChu" text,
      "trangThai" varchar,
      "sttLich" int,
      "thoiGianHen" timestamp,
      "trangThaiLich" varchar
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        pdk."MaDangKy"::VARCHAR AS id,
        pdk."MaDangKy"::VARCHAR AS "maDangKy",
        pdk."NgayDangKy"::TIMESTAMP AS "ngayDangKy",
        pdk."KhuVucMongMuon"::VARCHAR AS "khuVucMongMuon",
        (
          SELECT string_agg(lp."TenLoaiPhong", ', ')
          FROM "PDK_LoaiPhong" pdklp
          JOIN "LoaiPhong" lp ON pdklp."MaLoaiPhong" = lp."MaLoaiPhong"
          WHERE pdklp."MaDangKy" = pdk."MaDangKy"
        )::TEXT AS "loaiPhongYeuCau",
        pdk."MucGiaToiDa"::NUMERIC AS "mucGia",
        pdk."SoNguoiDuKienO"::INT AS "soNguoiO",
        pdk."SoNam"::INT AS "soNam",
        pdk."SoNu"::INT AS "soNu",
        pdk."ThoiGianDuKienVaoO"::DATE AS "ngayDuKienVaoO",
        pdk."ThoiHanThue"::INT AS "thoiHanThue",
        pdk."YeuCauKhac"::TEXT AS "ghiChu",
        pdk."TrangThai"::VARCHAR AS "trangThai",
        lich."STTLich"::INT AS "sttLich",
        lich."ThoiGianHen"::TIMESTAMP AS "thoiGianHen",
        lich."TrangThai"::VARCHAR AS "trangThaiLich"
      FROM "PhieuDangKy" pdk
      LEFT JOIN LATERAL (
        SELECT lxp."STTLich", lxp."ThoiGianHen", lxp."TrangThai"
        FROM "LichXemPhong" lxp
        WHERE lxp."MaDangKy" = pdk."MaDangKy"
        ORDER BY lxp."STTLich" DESC
        LIMIT 1
      ) AS lich ON true
      WHERE pdk."MaKhachHang" = p_khach_hang_id
      ORDER BY pdk."NgayDangKy" DESC, pdk."MaDangKy" DESC;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. sp_khach_moi_danh_sach_lich_xem
  console.log('Deploying sp_khach_moi_danh_sach_lich_xem...');
  await client.query(`
    CREATE OR REPLACE FUNCTION sp_khach_moi_danh_sach_lich_xem(
      p_khach_hang_id varchar
    )
    RETURNS TABLE (
      id text,
      "maDangKy" varchar,
      "sttLich" int,
      "thoiGianHen" timestamp,
      "trangThai" varchar,
      "ghiChu" text,
      "maNhanVienSale" varchar,
      "tenNhanVienSale" varchar,
      "sdtNhanVienSale" varchar,
      "phongXem" text
    ) AS $$
    BEGIN
      -- Cập nhật lịch quá hạn thành Đã xem
      UPDATE "LichXemPhong" lxp
      SET "TrangThai" = 'Đã xem'
      FROM "PhieuDangKy" pdk
      WHERE pdk."MaDangKy" = lxp."MaDangKy"
        AND pdk."MaKhachHang" = p_khach_hang_id
        AND lxp."TrangThai" IN ('Chờ xem', 'Yêu cầu đổi lịch', 'Yêu cầu hủy')
        AND lxp."ThoiGianHen" <= CURRENT_TIMESTAMP;

      RETURN QUERY
      SELECT
        (lxp."MaDangKy" || '-' || lxp."STTLich")::TEXT AS id,
        lxp."MaDangKy"::VARCHAR AS "maDangKy",
        lxp."STTLich"::INT AS "sttLich",
        lxp."ThoiGianHen"::TIMESTAMP AS "thoiGianHen",
        lxp."TrangThai"::VARCHAR AS "trangThai",
        lxp."GhiChu"::TEXT AS "ghiChu",
        pdk."MaNhanVienSale"::VARCHAR AS "maNhanVienSale",
        ndSale."HoTen"::VARCHAR AS "tenNhanVienSale",
        ndSale."SDT"::VARCHAR AS "sdtNhanVienSale",
        phong."phongXem"::TEXT AS "phongXem"
      FROM "LichXemPhong" lxp
      INNER JOIN "PhieuDangKy" pdk ON pdk."MaDangKy" = lxp."MaDangKy"
      LEFT JOIN "NguoiDung" ndSale ON ndSale."MaNguoiDung" = pdk."MaNhanVienSale"
      LEFT JOIN LATERAL (
        SELECT string_agg(p."TenPhong", ', ') AS "phongXem"
        FROM "ChiTietXemPhong" ctxp
        INNER JOIN "Phong" p ON p."MaPhong" = ctxp."MaPhong"
        WHERE ctxp."MaDangKy" = lxp."MaDangKy" AND ctxp."STTLich" = lxp."STTLich"
      ) AS phong ON true
      WHERE pdk."MaKhachHang" = p_khach_hang_id
      ORDER BY lxp."ThoiGianHen" DESC;
    END;
    $$ LANGUAGE plpgsql;
  `);

  console.log('Customer SPs deployed successfully!\n');
  await client.end();
}

deployCustomerSPs().catch(console.error);
