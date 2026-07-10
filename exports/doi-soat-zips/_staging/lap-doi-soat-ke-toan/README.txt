Lap phieu doi soat - Nhan vien ke toan
======================================

Goi nay gom SP, backend va frontend lien quan den chuc nang.

Stored procedures lien quan trong Database/SP_TraPhong/ke-toan-doi-soat.sql:
- SP_TraPhong_KeToan_DanhSachChoDoiSoat
- SP_TraPhong_KeToan_LayPhieuTraPhong
- SP_TraPhong_KeToan_CoDoiSoatDangXuLy
- SP_TraPhong_KeToan_LayHopDongHoSo
- SP_TraPhong_KeToan_LayPhieuDatCocHoSo
- SP_TraPhong_KeToan_LayPhongTrongPhieuCoc
- SP_TraPhong_KeToan_TongChiPhiSuaChua
- SP_TraPhong_KeToan_TienPhatChoXuLy
- SP_TraPhong_KeToan_TienHoaDonConNo
- SP_TraPhong_KeToan_ChiTietKhauTru
- SP_TraPhong_KeToan_LayMaQuyDinhHoanCoc
- SP_TraPhong_KeToan_SinhMaDoiSoat
- SP_TraPhong_KeToan_InsertDoiSoat
- SP_TraPhong_KeToan_UpdateDoiSoatCanDieuChinh

Backend routes lien quan:
- GET /api/accountant/doi-soat/cho-doi-soat
- GET /api/accountant/doi-soat/phieu-tra-phong/:maPhieuTra
- POST /api/accountant/doi-soat

Frontend entry lien quan:
- QuyetToanTraPhongTab.jsx tab lap-doi-soat
- doiSoat.api.js getDanhSachChoDoiSoat/getChiTietPhieuTraPhong/taoDoiSoat

File chinh:
- Database/SP_TraPhong/ke-toan-doi-soat.sql
- Web/backend/routes/doiSoat.routes.js
- Web/backend/controllers/doiSoat.controller.js
- Web/backend/services/doiSoat.service.js
- Web/backend/repositories/doiSoat.repository.js
- Web/backend/services/doiSoatCalculator.service.js
- Web/frontend/src/pages/nhanVienKeToan/QuyetToanTraPhongTab.jsx
- Web/frontend/src/pages/nhanVienKeToan/doiSoat.api.js
