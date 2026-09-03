const fs = require('fs');
const path = require('path');
const { Client } = require('../backend/node_modules/pg');

const connectionString = 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

async function deployMissingProcs() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Supabase!\n');

  // Let's create key procedures directly in PostgreSQL for maximum reliability:

  // 1. sp_khach_moi_danh_sach_phong
  console.log('Deploying sp_khach_moi_danh_sach_phong...');
  await client.query(`
    CREATE OR REPLACE FUNCTION sp_khach_moi_danh_sach_phong(
      p_ten_phong text DEFAULT NULL,
      p_loai_phong text DEFAULT NULL,
      p_khu_vuc text DEFAULT NULL,
      p_muc_gia_toi_da numeric DEFAULT NULL
    )
    RETURNS TABLE (
      id varchar,
      "maPhong" varchar,
      "tenPhong" varchar,
      "loaiPhong" varchar,
      "moTa" text,
      "giaTheoGiuong" numeric,
      "giaNguyenPhong" numeric,
      "giaThue" numeric,
      "sucChua" int,
      "soChoTrong" bigint,
      "gioiTinhChoPhep" varchar,
      "chiNhanh" varchar,
      "diaChi" varchar,
      "urlImg" text
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        p."MaPhong"::VARCHAR AS id,
        p."MaPhong"::VARCHAR AS "maPhong",
        p."TenPhong"::VARCHAR AS "tenPhong",
        lp."TenLoaiPhong"::VARCHAR AS "loaiPhong",
        lp."MoTa"::TEXT AS "moTa",
        lp."GiaThueTheoGiuong"::NUMERIC AS "giaTheoGiuong",
        COALESCE(lp."GiaThueNguyenPhong", lp."GiaThueTheoGiuong" * lp."SucChuaToiDa")::NUMERIC AS "giaNguyenPhong",
        COALESCE(lp."GiaThueTheoGiuong", lp."GiaThueNguyenPhong")::NUMERIC AS "giaThue",
        lp."SucChuaToiDa"::INT AS "sucChua",
        COALESCE((
          SELECT COUNT(*)
          FROM "Giuong" g
          WHERE g."MaPhong" = p."MaPhong" AND g."TinhTrang" = 'Trống'
        ), 0)::BIGINT AS "soChoTrong",
        p."GioiTinhChoPhep"::VARCHAR AS "gioiTinhChoPhep",
        cn."TenChiNhanh"::VARCHAR AS "chiNhanh",
        cn."DiaChi"::VARCHAR AS "diaChi",
        (
          SELECT hap."UrlImg"
          FROM "HinhAnhPhong" hap
          WHERE hap."MaPhong" = p."MaPhong"
          ORDER BY hap."STTAnh"
          LIMIT 1
        )::TEXT AS "urlImg"
      FROM "Phong" p
      JOIN "LoaiPhong" lp ON lp."MaLoaiPhong" = p."MaLoaiPhong"
      JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = p."MaChiNhanh"
      WHERE (cn."TrangThai" = 'Hoạt động' OR cn."TrangThai" IS NULL)
        AND (p_ten_phong IS NULL OR p."TenPhong" ILIKE '%' || p_ten_phong || '%' OR cn."TenChiNhanh" ILIKE '%' || p_ten_phong || '%' OR cn."DiaChi" ILIKE '%' || p_ten_phong || '%')
        AND (p_loai_phong IS NULL OR lp."TenLoaiPhong" ILIKE '%' || p_loai_phong || '%')
        AND (p_khu_vuc IS NULL OR cn."DiaChi" ILIKE '%' || p_khu_vuc || '%')
        AND (p_muc_gia_toi_da IS NULL OR lp."GiaThueTheoGiuong" <= p_muc_gia_toi_da OR lp."GiaThueNguyenPhong" <= p_muc_gia_toi_da)
      ORDER BY p."MaPhong";
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. sp_khach_moi_chi_tiet_phong
  console.log('Deploying sp_khach_moi_chi_tiet_phong...');
  await client.query(`
    CREATE OR REPLACE FUNCTION sp_khach_moi_chi_tiet_phong(
      p_ma_phong varchar
    )
    RETURNS TABLE (
      id varchar,
      "maPhong" varchar,
      "tenPhong" varchar,
      "loaiPhong" varchar,
      "moTa" text,
      "giaTheoGiuong" numeric,
      "giaNguyenPhong" numeric,
      "giaThue" numeric,
      "sucChua" int,
      "soChoTrong" bigint,
      "gioiTinhChoPhep" varchar,
      "chiNhanh" varchar,
      "diaChi" varchar,
      "urlImg" text
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        p."MaPhong"::VARCHAR AS id,
        p."MaPhong"::VARCHAR AS "maPhong",
        p."TenPhong"::VARCHAR AS "tenPhong",
        lp."TenLoaiPhong"::VARCHAR AS "loaiPhong",
        lp."MoTa"::TEXT AS "moTa",
        lp."GiaThueTheoGiuong"::NUMERIC AS "giaTheoGiuong",
        COALESCE(lp."GiaThueNguyenPhong", lp."GiaThueTheoGiuong" * lp."SucChuaToiDa")::NUMERIC AS "giaNguyenPhong",
        COALESCE(lp."GiaThueTheoGiuong", lp."GiaThueNguyenPhong")::NUMERIC AS "giaThue",
        lp."SucChuaToiDa"::INT AS "sucChua",
        COALESCE((
          SELECT COUNT(*)
          FROM "Giuong" g
          WHERE g."MaPhong" = p."MaPhong" AND g."TinhTrang" = 'Trống'
        ), 0)::BIGINT AS "soChoTrong",
        p."GioiTinhChoPhep"::VARCHAR AS "gioiTinhChoPhep",
        cn."TenChiNhanh"::VARCHAR AS "chiNhanh",
        cn."DiaChi"::VARCHAR AS "diaChi",
        (
          SELECT hap."UrlImg"
          FROM "HinhAnhPhong" hap
          WHERE hap."MaPhong" = p."MaPhong"
          ORDER BY hap."STTAnh"
          LIMIT 1
        )::TEXT AS "urlImg"
      FROM "Phong" p
      JOIN "LoaiPhong" lp ON lp."MaLoaiPhong" = p."MaLoaiPhong"
      JOIN "ChiNhanh" cn ON cn."MaChiNhanh" = p."MaChiNhanh"
      WHERE p."MaPhong" = p_ma_phong;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 3. sp_khach_moi_trang_thai
  console.log('Deploying sp_khach_moi_trang_thai...');
  await client.query(`
    CREATE OR REPLACE FUNCTION sp_khach_moi_trang_thai(
      p_khach_hang_id varchar
    )
    RETURNS TABLE (
      "khachHangId" varchar,
      "laKhachMoi" boolean,
      "soHoSo" bigint,
      "soLichXem" bigint,
      "soPhieuCoc" bigint,
      "soHopDong" bigint
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        p_khach_hang_id::VARCHAR,
        NOT (
          EXISTS (SELECT 1 FROM "PhieuDatCoc" WHERE "MaKhachHang" = p_khach_hang_id)
          OR EXISTS (SELECT 1 FROM "HopDongThue" h JOIN "PhieuDatCoc" pd ON pd."MaPhieuDatCoc" = h."MaPhieuCoc" WHERE pd."MaKhachHang" = p_khach_hang_id)
        ) AS "laKhachMoi",
        (SELECT COUNT(*) FROM "PhieuDangKy" WHERE "MaKhachHang" = p_khach_hang_id)::BIGINT AS "soHoSo",
        (SELECT COUNT(*) FROM "LichXemPhong" lxp JOIN "PhieuDangKy" pdk ON pdk."MaDangKy" = lxp."MaDangKy" WHERE pdk."MaKhachHang" = p_khach_hang_id)::BIGINT AS "soLichXem",
        (SELECT COUNT(*) FROM "PhieuDatCoc" WHERE "MaKhachHang" = p_khach_hang_id)::BIGINT AS "soPhieuCoc",
        (SELECT COUNT(*) FROM "HopDongThue" h JOIN "PhieuDatCoc" pd ON pd."MaPhieuDatCoc" = h."MaPhieuCoc" WHERE pd."MaKhachHang" = p_khach_hang_id)::BIGINT AS "soHopDong";
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 4. sp_danh_sach_giuong_trong
  console.log('Deploying sp_danh_sach_giuong_trong...');
  await client.query(`
    CREATE OR REPLACE FUNCTION sp_danh_sach_giuong_trong(
      p_ma_phong varchar
    )
    RETURNS TABLE (
      "maGiuong" varchar,
      "soGiuong" int,
      "trangThai" varchar,
      "maPhong" varchar
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        g."MaGiuong"::VARCHAR,
        g."SoGiuong"::INT,
        g."TinhTrang"::VARCHAR AS "trangThai",
        g."MaPhong"::VARCHAR
      FROM "Giuong" g
      WHERE g."MaPhong" = p_ma_phong AND g."TinhTrang" = 'Trống'
      ORDER BY g."SoGiuong";
    END;
    $$ LANGUAGE plpgsql;
  `);

  console.log('\nAll missing core procedures deployed successfully!');
  await client.end();
}

deployMissingProcs().catch(console.error);
