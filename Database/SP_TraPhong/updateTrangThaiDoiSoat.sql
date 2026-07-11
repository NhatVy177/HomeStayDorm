BEGIN TRY
    BEGIN TRANSACTION;

    /* 1. Xóa CHECK trạng thái cũ */
    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CHK_DS_TrangThai'
          AND parent_object_id = OBJECT_ID(N'dbo.DoiSoat')
    )
    BEGIN
        ALTER TABLE dbo.DoiSoat
        DROP CONSTRAINT CHK_DS_TrangThai;
    END;

    /* 2. Tìm và xóa DEFAULT cũ của cột TrangThai */
    DECLARE @TenDefaultTrangThai SYSNAME;
    DECLARE @SQL NVARCHAR(MAX);

    SELECT @TenDefaultTrangThai = dc.name
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.DoiSoat')
      AND c.name = N'TrangThai';

    IF @TenDefaultTrangThai IS NOT NULL
    BEGIN
        SET @SQL =
            N'ALTER TABLE dbo.DoiSoat DROP CONSTRAINT '
            + QUOTENAME(@TenDefaultTrangThai)
            + N';';

        EXEC sp_executesql @SQL;
    END;

    /* 3. Chuyển dữ liệu trạng thái cũ */
    UPDATE dbo.DoiSoat
    SET TrangThai =
        CASE
            WHEN TrangThai = N'Đã hoàn cọc'
                THEN N'Đã quyết toán'

            ELSE TrangThai
        END;

    /* 4. Thêm DEFAULT mới */
    ALTER TABLE dbo.DoiSoat
    ADD CONSTRAINT DF_DoiSoat_TrangThai
        DEFAULT N'Chờ xác nhận' FOR TrangThai;

    /* 5. Thêm CHECK mới */
    ALTER TABLE dbo.DoiSoat
    ADD CONSTRAINT CHK_DS_TrangThai
    CHECK (
        TrangThai IN (
            N'Chờ phản hồi',
            N'Chờ xác nhận',
            N'Cần điều chỉnh',
            N'Chờ hoàn cọc',
            N'Chờ thanh toán thêm',
            N'Đã quyết toán'
        )
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
