import thanhLyTraPhongService from '../services/thanhlytraphong.service.js';

const thanhLyTraPhongController = {
  getDanhSachThanhLy: async (req, res) => {
    try {
      const maNhanVien = req.user?.maNguoiDung;
      const danhSach = await thanhLyTraPhongService.getDanhSachThanhLy(maNhanVien);
      res.status(200).json({ danhSach });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.message || 'Lỗi server' });
    }
  },

  getChiTietThanhLy: async (req, res) => {
    try {
      const { id } = req.params;
      const maNhanVien = req.user?.maNguoiDung;
      const chiTiet = await thanhLyTraPhongService.getChiTietThanhLy(id, maNhanVien);
      if (!chiTiet) {
        return res.status(404).json({ message: 'Không tìm thấy phiếu trả phòng' });
      }
      res.status(200).json({ chiTiet });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.message || 'Lỗi server' });
    }
  },

  xacNhanThanhLy: async (req, res) => {
    try {
      const { maPhieuTra } = req.body;
      const maNhanVien = req.user?.maNguoiDung;
      
      const result = await thanhLyTraPhongService.xacNhanThanhLy(maPhieuTra, maNhanVien);
      res.status(200).json({
        message: result?.message || 'Thanh lý trả phòng thành công',
        result
      });
    } catch (err) {
      console.error(err);
      res.status(err.statusCode || 500).json({ message: err.message || 'Lỗi server' });
    }
  }
};

export default thanhLyTraPhongController;
