import xacNhanKetQuaService from '../services/xacNhanKetQua.service.js';

const xacNhanKetQuaController = {
  getDanhSachChoXacNhan: async (req, res) => {
    try {
      const danhSach = await xacNhanKetQuaService.getDanhSachChoXacNhan(req.user);
      res.status(200).json({ danhSach });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : 'Lỗi server', error: err.message });
    }
  },

  getChiTietDoiSoat: async (req, res) => {
    try {
      const { id } = req.params;
      const chiTiet = await xacNhanKetQuaService.getChiTietDoiSoat(id, req.user);
      if (!chiTiet) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu đối soát' });
      }
      res.status(200).json({ chiTiet });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : 'Lỗi server', error: err.message });
    }
  },

  xacNhanDoiSoat: async (req, res) => {
    try {
      const { maDoiSoat, dongY, lyDoKhongDongY } = req.body;
      
      const data = await xacNhanKetQuaService.xacNhanDoiSoat({
        maDoiSoat, dongY, lyDoKhongDongY
      }, req.user);

      res.status(200).json({ message: 'Xác nhận kết quả đối soát thành công', data });
    } catch (err) {
      console.error(err);
      if (err.number === 50010) {
        return res.status(400).json({ message: err.message });
      }
      res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : 'Lỗi server', error: err.message });
    }
  }
};

export default xacNhanKetQuaController;
