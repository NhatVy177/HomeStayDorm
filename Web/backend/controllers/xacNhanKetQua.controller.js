import xacNhanKetQuaService from '../services/xacNhanKetQua.service.js';

const xacNhanKetQuaController = {
  getDanhSachChoXacNhan: async (req, res) => {
    try {
      const maNhanVien = req.user?.maNguoiDung || 'NV0001';
      const danhSach = await xacNhanKetQuaService.getDanhSachChoXacNhan(maNhanVien);
      res.status(200).json({ danhSach });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  getChiTietDoiSoat: async (req, res) => {
    try {
      const { id } = req.params;
      const maNhanVien = req.user?.maNguoiDung || 'NV0001';
      const chiTiet = await xacNhanKetQuaService.getChiTietDoiSoat(id, maNhanVien);
      if (!chiTiet) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu đối soát' });
      }
      res.status(200).json({ chiTiet });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  xacNhanDoiSoat: async (req, res) => {
    try {
      const { maDoiSoat, dongY, phuongThucThanhToan, lyDoKhongDongY } = req.body;
      const maNhanVien = req.user?.maNguoiDung || 'NV0001';
      
      await xacNhanKetQuaService.xacNhanDoiSoat({
        maDoiSoat, dongY, phuongThucThanhToan, lyDoKhongDongY
      }, maNhanVien);

      res.status(200).json({ message: 'Xác nhận kết quả đối soát thành công' });
    } catch (err) {
      console.error(err);
      if (err.number === 50010) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  }
};

export default xacNhanKetQuaController;
