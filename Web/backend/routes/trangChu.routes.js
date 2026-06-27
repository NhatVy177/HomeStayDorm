import express from 'express';
import {
  getBoLocKhamPhaPhong,
  getLoaiPhong,
  getPhongKhamPha,
  getPhongNoiBat
} from '../controllers/trangChu.controller.js';

const router = express.Router();

// Public routes — không cần requireAuth
router.get('/phong-noi-bat', getPhongNoiBat);
router.get('/loai-phong', getLoaiPhong);
router.get('/kham-pha-phong/bo-loc', getBoLocKhamPhaPhong);
router.get('/kham-pha-phong', getPhongKhamPha);

export default router;
