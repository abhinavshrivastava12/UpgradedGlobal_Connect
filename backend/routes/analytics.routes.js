import express from 'express';
import { getUserAnalytics, getNetworkAnalytics } from '../controllers/analytics.controller.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get('/user', isAuth, getUserAnalytics);
router.get('/network', isAuth, getNetworkAnalytics);

export default router;