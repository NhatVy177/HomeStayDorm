USE [HOMEDORM4];
GO

IF OBJECT_ID(N'dbo.DoiSoat', N'U') IS NULL
    THROW 50000, N'Chua co bang DoiSoat. Hay chay app.sql truoc.', 1;
GO

IF COL_LENGTH('dbo.DoiSoat', 'ThongTinNhanHoanCoc') IS NULL
BEGIN
    ALTER TABLE dbo.DoiSoat
    ADD ThongTinNhanHoanCoc NVARCHAR(500) NULL;
END;
GO

