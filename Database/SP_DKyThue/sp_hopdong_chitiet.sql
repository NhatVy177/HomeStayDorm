IF OBJECT_ID(N'dbo.SP_KhachMoi_ChiTietHopDong', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_KhachMoi_ChiTietHopDong AS BEGIN SET NOCOUNT ON; RETURN 0; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_KhachMoi_ChiTietHopDong
    @KhachHangId VARCHAR(6),
    @MaHopDong VARCHAR(6) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Xác thực và chọn hợp đồng mặc định nếu @MaHopDong rỗng
    IF NOT EXISTS (SELECT 1 FROM dbo.KhachHang WHERE MaKhachHang = @KhachHangId)
    BEGIN
        THROW 50101, N'Không tìm thấy khách hàng.', 1;
    END

    IF @MaHopDong IS NULL OR @MaHopDong = ''
    BEGIN
        SELECT TOP 1 @MaHopDong = hd.MaHopDong
        FROM dbo.HopDongThue hd
        WHERE hd.MaKhachHang = @KhachHangId
        ORDER BY 
            CASE WHEN hd.TrangThai = N'Hiệu lực' THEN 0 ELSE 1 END,
            hd.NgayKyHD DESC,
            hd.MaHopDong DESC;
    END

    -- 2. RECORDSET 0: Chi tiết hợp đồng được chọn
    SELECT
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
      pdc.HinhThucThue AS HinhThucThue,
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
      ds.ThongTinNhanHoanCoc AS ThongTinNhanHoanCocTraPhong,
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
        ptp_inner.MaPhieuTra,
        ptp_inner.NgayDangKyTra,
        ptp_inner.NgayDuKienTra,
        ptp_inner.NgayTraThucTe,
        ptp_inner.TrangThai
      FROM dbo.PhieuTraPhong AS ptp_inner
      WHERE ptp_inner.MaHopDong = hd.MaHopDong
        AND ptp_inner.TrangThai NOT IN (N'Hủy', N'Hoàn tất')
      ORDER BY ptp_inner.NgayDangKyTra DESC, ptp_inner.MaPhieuTra DESC
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
    WHERE hd.MaHopDong = @MaHopDong AND hd.MaKhachHang = @KhachHangId;

    -- 3. RECORDSET 1: Danh sách tất cả hợp đồng của khách hàng
    SELECT
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
      pdc.HinhThucThue AS HinhThucThue,
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
      ds.ThongTinNhanHoanCoc AS ThongTinNhanHoanCocTraPhong,
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
        ptp_inner.MaPhieuTra,
        ptp_inner.NgayDangKyTra,
        ptp_inner.NgayDuKienTra,
        ptp_inner.NgayTraThucTe,
        ptp_inner.TrangThai
      FROM dbo.PhieuTraPhong AS ptp_inner
      WHERE ptp_inner.MaHopDong = hd.MaHopDong
        AND ptp_inner.TrangThai NOT IN (N'Hủy', N'Hoàn tất')
      ORDER BY ptp_inner.NgayDangKyTra DESC, ptp_inner.MaPhieuTra DESC
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
    WHERE hd.MaKhachHang = @KhachHangId
    ORDER BY
      CASE WHEN hd.TrangThai = N'Hiệu lực' THEN 0 ELSE 1 END,
      hd.NgayKyHD DESC,
      hd.MaHopDong DESC;

    -- 4. RECORDSET 2: Danh sách tài sản phòng
    DECLARE @MaPhong VARCHAR(4);
    SELECT TOP 1 @MaPhong = ct.MaPhong
    FROM dbo.HopDongThue hd
    INNER JOIN dbo.PhieuDatCoc pdc ON pdc.MaPhieuDatCoc = hd.MaPhieuCoc
    OUTER APPLY (
      SELECT TOP 1 ctdc.MaPhong FROM dbo.ChiTietDatCoc ctdc WHERE ctdc.MaPhieuDatCoc = pdc.MaPhieuDatCoc
    ) AS ct
    WHERE hd.MaHopDong = @MaHopDong;

    IF EXISTS (
        SELECT 1 FROM dbo.ChiTietBanGiao AS ctbg
        INNER JOIN dbo.BienBanBanGiao AS bbbg ON bbbg.MaBienBan = ctbg.MaBienBan
        WHERE bbbg.MaHopDong = @MaHopDong AND bbbg.LoaiBanGiao = N'Bàn giao vào'
    )
    BEGIN
        SELECT ts.MaTaiSan, ts.TenTaiSan, ctbg.SoLuongThucTe AS SoLuong, ts.DonGia
        FROM dbo.ChiTietBanGiao AS ctbg
        INNER JOIN dbo.BienBanBanGiao AS bbbg ON bbbg.MaBienBan = ctbg.MaBienBan
        INNER JOIN dbo.TaiSan AS ts ON ts.MaTaiSan = ctbg.MaTaiSan AND ts.MaPhong = ctbg.MaPhong
        WHERE bbbg.MaHopDong = @MaHopDong AND bbbg.LoaiBanGiao = N'Bàn giao vào'
        ORDER BY ts.MaTaiSan;
    END
    ELSE
    BEGIN
        SELECT MaTaiSan, TenTaiSan, SoLuong, DonGia
        FROM dbo.TaiSan
        WHERE MaPhong = @MaPhong
        ORDER BY MaTaiSan;
    END

    -- 5. RECORDSET 3: Danh sách quy định nội quy
    SELECT MaQuyDinh, TieuDeNoiQuy, NoiDung
    FROM dbo.QuiDinh
    WHERE TrangThai = N'Hiệu lực'
    ORDER BY MaQuyDinh;

    -- 6. RECORDSET 4: Thành viên hợp đồng
    SELECT 
        MaThanhVien,
        HoTen,
        NgaySinh,
        GioiTinh,
        CCCD,
        SDT,
        Email,
        QuocTich,
        TrangThai,
        LyDoTuChoi
    FROM dbo.ThanhVienHopDong
    WHERE MaHopDong = @MaHopDong
    ORDER BY MaThanhVien;

    -- 7. RECORDSET 5: Dịch vụ sử dụng
    SELECT 
        dvhd.MaChiTietDVHD,
        dv.MaDichVu,
        dv.TenDichVu,
        dv.DonGia,
        dv.DonViTinh,
        dvhd.GhiChu
    FROM dbo.DichVuHopDong dvhd
    INNER JOIN dbo.DichVu dv ON dv.MaDichVu = dvhd.MaDichVu
    WHERE dvhd.MaHopDong = @MaHopDong
    ORDER BY dv.MaDichVu;

    -- 8. RECORDSET 6: Biên bản vi phạm
    SELECT 
        bbvp.MaBBViPham,
        bbvp.NgayViPham,
        bbvp.MoTaViPham,
        bbvp.SoTienPhat,
        bbvp.TrangThai,
        dkvp.TenDieuKhoan,
        dkvp.HinhThucXuPhat
    FROM dbo.BienBanViPham bbvp
    LEFT JOIN dbo.DieuKhoanViPham dkvp ON dkvp.MaDieuKhoan = bbvp.MaDieuKhoan
    WHERE bbvp.MaHopDong = @MaHopDong
    ORDER BY bbvp.NgayViPham DESC, bbvp.MaBBViPham DESC;

    -- 9. RECORDSET 7: Quyết toán đối soát hoàn cọc
    SELECT 
        ds.MaDoiSoat,
        ds.NgayLap,
        ds.TienCocBanDau,
        ds.SoThangLuuTru,
        ds.TyLeHoanCocHienTai,
        ds.TienCocDuocHoan,
        ds.TienThueConNo,
        ds.TienDichVuConNo,
        ds.TongChiPhiSuaChua,
        ds.TienPhat,
        ds.TongKhauTru,
        ds.SoTienHoanThucTe,
        ds.SoTienKhachPhaiTT,
        ds.PhuongThucThanhToan,
        ds.ChungTuThanhToan,
        ds.NgayThanhToan,
        ds.ThongTinNhanHoanCoc,
        ds.LoaiQuyetToan,
        ds.TrangThai AS TrangThaiDoiSoat,
        ptp.MaPhieuTra,
        ptp.NgayDangKyTra,
        ptp.TrangThai AS TrangThaiPhieuTra
    FROM dbo.DoiSoat ds
    INNER JOIN dbo.PhieuTraPhong ptp ON ptp.MaPhieuTra = ds.MaPhieuTra
    WHERE ptp.MaHopDong = @MaHopDong
    ORDER BY ds.NgayLap DESC, ds.MaDoiSoat DESC;
END;
GO
