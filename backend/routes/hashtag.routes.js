import express from 'express';
import { getTrendingHashtags, searchByHashtag } from '../controllers/hashtag.controller.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get('/trending', isAuth, getTrendingHashtags);
router.get('/search/:tag', isAuth, searchByHashtag);

export default router;