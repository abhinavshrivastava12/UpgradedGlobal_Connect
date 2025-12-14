import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import { getRes } from '../controllers/ai.controller.js';

const router = express.Router();

// AI chat route - FIXED path
router.post('/get-res', isAuth, getRes);

export default router;