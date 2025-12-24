import express from 'express';
import { addReaction, removeReaction, getReactions } from '../controllers/reaction.controller.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post('/:postId', isAuth, addReaction);
router.delete('/:postId', isAuth, removeReaction);
router.get('/:postId', isAuth, getReactions);

export default router;