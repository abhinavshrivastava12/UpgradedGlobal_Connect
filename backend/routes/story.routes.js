import express from 'express';
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
  getStoryViews
} from '../controllers/story.controller.js';
import isAuth from '../middlewares/isAuth.js';
import upload from '../middlewares/multer.js';

const router = express.Router();

// Create story
router.post('/create', isAuth, upload.single('media'), createStory);

// Get all stories
router.get('/', isAuth, getStories);

// View a story
router.post('/view/:storyId', isAuth, viewStory);

// Delete story
router.delete('/:storyId', isAuth, deleteStory);

// Get story views
router.get('/:storyId/views', isAuth, getStoryViews);

export default router;