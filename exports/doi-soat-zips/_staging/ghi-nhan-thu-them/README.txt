Ghi nhan thu them - Nhan vien ke toan
=====================================

Goi nay gom SP, backend va frontend lien quan den chuc nang.

Stored procedures lien quan trong Database/SP_TraPhong/ke-toan-doi-soat.sql:
- SP_TraPhong_KeToan_DanhSachChoThuThem
- SP_TraPhong_KeToan_DanhSachDaThuThem
- SP_TraPhong_KeToan_ChiTietThuThem
- SP_TraPhong_KeToan_XacNhanThuThem
- SP_TraPhong_KeToan_KhongXacNhanThuThem

Backend routes lien quan:
- GET /api/accountant/doi-soat/cho-thu-them
- GET /api/accountant/doi-soat/da-thu-them
- GET /api/accountant/doi-soat/thu-them/:maDoiSoat
- POST /api/accountant/doi-soat/thu-them/xac-nhan
- POST /api/accountant/doi-soat/thu-them/khong-xac-nhan
- POST /api/accountant/doi-soat/chung-tu

Frontend entry lien quan:
- QuyetToanTraPhongTab.jsx tab ghi-nhan-thu-them
- doiSoat.api.js getDanhSachChoThuThem/getChiTietThuThem/xacNhanThuThem/khongXacNhanThuThem/uploadChungTu

File chinh:
- Database/SP_TraPhong/ke-toan-doi-soat.sql
- Web/backend/routes/doiSoat.routes.js
- Web/backend/controllers/doiSoat.controller.js
- Web/backend/services/doiSoat.service.js
- Web/backend/repositories/doiSoat.repository.js
- Web/backend/services/doiSoatCalculator.service.js
- Web/frontend/src/pages/nhanVienKeToan/QuyetToanTraPhongTab.jsx
- Web/frontend/src/pages/nhanVienKeToan/doiSoat.api.js
