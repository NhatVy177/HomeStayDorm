ALTER TABLE dbo.DoiSoat
ADD LoaiQuyetToan NVARCHAR(30) NOT NULL
    CONSTRAINT DF_DoiSoat_LoaiQuyetToan
    DEFAULT N'Không phát sinh' WITH VALUES;
GO

ALTER TABLE dbo.DoiSoat
ADD CONSTRAINT CHK_DS_LoaiQuyetToan
CHECK (
    LoaiQuyetToan IN (
        N'Thu thêm',
        N'Hoàn cọc',
        N'Không phát sinh'
    )
);
GO