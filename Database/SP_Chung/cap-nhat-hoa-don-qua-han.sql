USE [HOMEDORM4];
GO

-- ================================================================
-- SP_HoaDon_CapNhatNoQuaHan
-- Tu dong chuyen hoa don qua han thanh No.
-- Dung NCHAR de tranh loi encoding tieng Viet khi chay script.
-- ================================================================
IF OBJECT_ID(N'dbo.SP_HoaDon_CapNhatNoQuaHan', N'P') IS NULL
    EXEC(N'CREATE PROCEDURE dbo.SP_HoaDon_CapNhatNoQuaHan AS BEGIN SET NOCOUNT ON; END;');
GO

CREATE OR ALTER PROCEDURE dbo.SP_HoaDon_CapNhatNoQuaHan
    @TraKetQua BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TrangThaiChuaTT NVARCHAR(20) = N'Ch' + NCHAR(432) + N'a TT';
    DECLARE @TrangThaiNo NVARCHAR(20) = N'N' + NCHAR(7907);
    DECLARE @SoHoaDonCapNhat INT = 0;

    UPDATE dbo.HoaDon
    SET TrangThai = @TrangThaiNo
    WHERE TrangThai = @TrangThaiChuaTT
      AND NgayThanhToan IS NULL
      AND NgayHanTT IS NOT NULL
      AND CAST(NgayHanTT AS DATE) < CAST(GETDATE() AS DATE);

    SET @SoHoaDonCapNhat = @@ROWCOUNT;

    IF @TraKetQua = 1
    BEGIN
        SELECT @SoHoaDonCapNhat AS soHoaDonCapNhat;
    END
END;
GO
