import Story from '../models/story.model.js';
import uploadOnCloudinary from '../config/cloudinary.js';
import User from '../models/user.model.js';

// Create Story
export const createStory = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Media file is required' 
      });
    }

    // Upload to Cloudinary
    const mediaUrl = await uploadOnCloudinary(req.file.path);
    
    if (!mediaUrl) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to upload media' 
      });
    }

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Create story
    const story = await Story.create({
      user: req.userId,
      media: mediaUrl,
      mediaType,
      text: text || '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await story.populate('user', 'firstName lastName userName profileImage');

    res.status(201).json({
      success: true,
      story
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create story' 
    });
  }
};

// Get All Stories (from connections and own)
export const getStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select('connection');
    
    // Get stories from connections + own stories
    const userIds = [...(currentUser.connection || []), req.userId];
    
    const stories = await Story.find({
      user: { $in: userIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'firstName lastName userName profileImage')
    .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    const storyGroups = Object.values(groupedStories);

    res.json({
      success: true,
      stories: storyGroups
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch stories' 
    });
  }
};

// View Story
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ 
        success: false,
        message: 'Story not found' 
      });
    }

    // Check if already viewed
    const alreadyViewed = story.views.some(
      view => view.user.toString() === userId
    );

    if (!alreadyViewed) {
      story.views.push({
        user: userId,
        viewedAt: new Date()
      });
      await story.save();
    }

    res.json({
      success: true,
      message: 'Story viewed'
    });

  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to view story' 
    });
  }
};

// Delete Story
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ 
        success: false,
        message: 'Story not found' 
      });
    }

    // Check ownership
    if (story.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this story' 
      });
    }

    await Story.findByIdAndDelete(storyId);

    res.json({
      success: true,
      message: 'Story deleted'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete story' 
    });
  }
};

// Get Story Views
export const getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId)
      .populate('views.user', 'firstName lastName userName profileImage');

    if (!story) {
      return res.status(404).json({ 
        success: false,
        message: 'Story not found' 
      });
    }

    // Check ownership
    if (story.user.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized' 
      });
    }

    res.json({
      success: true,
      views: story.views
    });

  } catch (error) {
    console.error('Get story views error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch story views' 
    });
  }
};