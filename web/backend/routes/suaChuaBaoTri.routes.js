import { Router } from 'express';
import * as controller from '../controllers/suaChuaBaoTri.controller.js';

const router = Router();

router.post('/', controller.createYeuCauSuaChua);
router.get('/', controller.getYeuCauSuaChua);
router.put('/:id/tiep-nhan', controller.tiepNhanYeuCauSuaChua);
router.put('/:id/hoan-tat', controller.hoanTatYeuCauSuaChua);
router.put('/:id/tu-choi', controller.tuChoiYeuCauSuaChua);

export default router;
