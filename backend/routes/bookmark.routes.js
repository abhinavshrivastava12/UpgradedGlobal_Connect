import express from 'express';
import { toggleBookmark, getBookmarks, checkBookmark } from '../controllers/bookmark.controller.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post('/toggle/:postId', isAuth, toggleBookmark);
router.get('/', isAuth, getBookmarks);
router.get('/check/:postId', isAuth, checkBookmark);

export default router;