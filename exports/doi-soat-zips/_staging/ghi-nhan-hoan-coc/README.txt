Ghi nhan hoan coc - Nhan vien ke toan
=====================================

Goi nay gom SP, backend va frontend lien quan den chuc nang.

Stored procedures lien quan trong Database/SP_TraPhong/ke-toan-doi-soat.sql:
- SP_TraPhong_KeToan_DanhSachChoHoanCoc
- SP_TraPhong_KeToan_DanhSachDaHoanCoc
- SP_TraPhong_KeToan_ChiTietHoanCoc
- SP_TraPhong_KeToan_XacNhanHoanCoc

Backend routes lien quan:
- GET /api/accountant/doi-soat/cho-hoan-coc
- GET /api/accountant/doi-soat/da-hoan-coc
- GET /api/accountant/doi-soat/hoan-coc/:maDoiSoat
- POST /api/accountant/doi-soat/hoan-coc/xac-nhan
- POST /api/accountant/doi-soat/chung-tu

Frontend entry lien quan:
- QuyetToanTraPhongTab.jsx tab ghi-nhan-hoan-coc
- doiSoat.api.js getDanhSachChoHoanCoc/getChiTietHoanCoc/xacNhanHoanCoc/uploadChungTu

File chinh:
- Database/SP_TraPhong/ke-toan-doi-soat.sql
- Web/backend/routes/doiSoat.routes.js
- Web/backend/controllers/doiSoat.controller.js
- Web/backend/services/doiSoat.service.js
- Web/backend/repositories/doiSoat.repository.js
- Web/backend/services/doiSoatCalculator.service.js
- Web/frontend/src/pages/nhanVienKeToan/QuyetToanTraPhongTab.jsx
- Web/frontend/src/pages/nhanVienKeToan/doiSoat.api.js
