import express from 'express';
import {
  setStatus,
  getStatus,
  getFriendStatuses,
  clearStatus
} from '../controllers/status.controller.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post('/set', isAuth, setStatus);
router.get('/user/:userId', isAuth, getStatus);
router.get('/friends', isAuth, getFriendStatuses);
router.delete('/clear', isAuth, clearStatus);

export default router;