# Ghi chu schema dat coc

Huong schema hien tai:

- `PhieuDatCoc.HinhThucThue` la cot chinh, bat buoc co gia tri.
- `ChiTietDatCoc` khong con cot `HinhThucThue`.
- Cac SP, trigger, backend can doc hinh thuc thue tu alias `pdc.HinhThucThue`.
- Cac script seed/test khi insert `PhieuDatCoc` phai co `HinhThucThue`.
- Cac script seed/test khi insert `ChiTietDatCoc` khong duoc liet ke `HinhThucThue`.

Migration dung cho DB dang lech schema:

```sql
USE HOMEDORM4;
GO

IF COL_LENGTH('dbo.PhieuDatCoc', 'HinhThucThue') IS NULL
BEGIN
    ALTER TABLE dbo.PhieuDatCoc
    ADD HinhThucThue NVARCHAR(30) NULL;
END
GO

UPDATE dbo.PhieuDatCoc
SET HinhThucThue = N'Ghép giường'
WHERE HinhThucThue IS NULL;
GO

ALTER TABLE dbo.PhieuDatCoc
ALTER COLUMN HinhThucThue NVARCHAR(30) NOT NULL;
GO

DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += N'
ALTER TABLE dbo.ChiTietDatCoc DROP CONSTRAINT ' + QUOTENAME(dc.name) + N';'
FROM sys.default_constraints dc
JOIN sys.columns c ON c.default_object_id = dc.object_id
WHERE dc.parent_object_id = OBJECT_ID(N'dbo.ChiTietDatCoc')
  AND c.name = N'HinhThucThue';

SELECT @sql += N'
ALTER TABLE dbo.ChiTietDatCoc DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';'
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.ChiTietDatCoc')
  AND cc.definition LIKE N'%HinhThucThue%';

IF @sql <> N''
    EXEC sp_executesql @sql;
GO

IF COL_LENGTH('dbo.ChiTietDatCoc', 'HinhThucThue') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ChiTietDatCoc
    DROP COLUMN HinhThucThue;
END
GO
```
