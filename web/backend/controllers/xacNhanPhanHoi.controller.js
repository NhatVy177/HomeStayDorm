import xacNhanPhanHoiService from '../services/xacNhanPhanHoi.service.js';

const xacNhanPhanHoiController = {
  getDanhSachChoXuLyPhanHoi: async (req, res) => {
    try {
      const maNhanVien = req.user?.maNguoiDung || 'NV0003';
      const danhSach = await xacNhanPhanHoiService.getDanhSachChoXuLyPhanHoi(maNhanVien);
      res.status(200).json({ danhSach });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.message || 'Lỗi server' });
    }
  },

  getChiTietPhanHoi: async (req, res) => {
    try {
      const { id } = req.params;
      const maNhanVien = req.user?.maNguoiDung || 'NV0003';
      const { chiTiet, danhSachPhong, chiTietKhauTru } = await xacNhanPhanHoiService.getChiTietPhanHoi(id, maNhanVien);
      if (!chiTiet) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu đối soát' });
      }
      res.status(200).json({ chiTiet, danhSachPhong, chiTietKhauTru });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.message || 'Lỗi server' });
    }
  },

  xuLyPhanHoi: async (req, res) => {
    try {
      const { maDoiSoat, hanhDong } = req.body;
      const maNhanVien = req.user?.maNguoiDung || 'NV0003';

      if (!maDoiSoat || !hanhDong) {
        return res.status(400).json({ message: 'Thiếu tham số bắt buộc.' });
      }

      const result = await xacNhanPhanHoiService.xuLyPhanHoi({ maDoiSoat, hanhDong }, maNhanVien);
      res.status(200).json({ message: 'Xử lý phản hồi thành công.', data: result });
    } catch (err) {
      console.error(err);
      const status = err.statusCode || ([50801, 50802, 50800].includes(err.number) ? 400 : 500);
      res.status(status).json({ message: err.message || 'Lỗi server' });
    }
  }
};

export default xacNhanPhanHoiController;
