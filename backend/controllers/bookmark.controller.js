import User from '../models/user.model.js';
import Post from '../models/post.model.js';

// Toggle Bookmark
export const toggleBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    
    if (!user.bookmarks) {
      user.bookmarks = [];
    }

    const bookmarkIndex = user.bookmarks.findIndex(
      id => id.toString() === postId
    );

    if (bookmarkIndex > -1) {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
      await user.save();
      
      res.json({
        success: true,
        message: 'Bookmark removed',
        bookmarked: false
      });
    } else {
      // Add bookmark
      user.bookmarks.push(postId);
      await user.save();
      
      res.json({
        success: true,
        message: 'Post bookmarked',
        bookmarked: true
      });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to toggle bookmark' 
    });
  }
};

// Get All Bookmarks
export const getBookmarks = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate({
        path: 'bookmarks',
        populate: {
          path: 'author',
          select: 'firstName lastName userName profileImage headline'
        }
      });

    res.json({
      success: true,
      bookmarks: user.bookmarks || []
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bookmarks' 
    });
  }
};

// Check if Post is Bookmarked
export const checkBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const user = await User.findById(userId);
    const isBookmarked = user.bookmarks?.includes(postId) || false;

    res.json({
      success: true,
      bookmarked: isBookmarked
    });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check bookmark' 
    });
  }
};