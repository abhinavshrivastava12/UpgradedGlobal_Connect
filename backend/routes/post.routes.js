import express from 'express';
import { protect } from '../middlewares/isAuth.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Create post
router.post('/', protect, async (req, res) => {
  try {
    const { text, images, poll } = req.body;

    if (!text && (!images || images.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain text or images'
      });
    }

    const post = await Post.create({
      user: req.user._id,
      text,
      images: images || [],
      poll: poll || null
    });

    await post.populate('user', 'name username profilePicture');

    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all posts
router.get('/', protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name username profilePicture')
      .populate('comments.user', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Like post
router.post('/like/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Retweet post
router.post('/retweet/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const isRetweeted = post.retweets.includes(req.user._id);

    if (isRetweeted) {
      post.retweets = post.retweets.filter(
        (userId) => userId.toString() !== req.user._id.toString()
      );
    } else {
      post.retweets.push(req.user._id);
    }

    await post.save();

    res.json({
      success: true,
      isRetweeted: !isRetweeted,
      retweetCount: post.retweets.length
    });
  } catch (error) {
    console.error('Retweet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Comment on post
router.post('/comment/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'name username profilePicture');

    res.json({
      success: true,
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete post
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete images from cloudinary if they exist
    if (post.images && post.images.length > 0) {
      for (const imageUrl of post.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting image from cloudinary:', error);
        }
      }
    }

    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user posts
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name username profilePicture')
      .populate('comments.user', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;