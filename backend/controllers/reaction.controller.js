import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';

const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

export const addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.userId;

    if (!reactionTypes.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reaction type'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Remove user from all reaction arrays first
    reactionTypes.forEach(type => {
      if (post.reactions[type]) {
        post.reactions[type] = post.reactions[type].filter(
          id => id.toString() !== userId.toString()
        );
      }
    });

    // Add user to the selected reaction
    if (!post.reactions[reactionType]) {
      post.reactions[reactionType] = [];
    }
    post.reactions[reactionType].push(userId);

    await post.save();

    // Create notification
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        receiver: post.author,
        type: 'reaction',
        reactionType,
        relatedUser: userId,
        relatedPost: postId
      });
    }

    res.json({
      success: true,
      reactions: post.reactions
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction'
    });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Remove user from all reaction arrays
    reactionTypes.forEach(type => {
      if (post.reactions[type]) {
        post.reactions[type] = post.reactions[type].filter(
          id => id.toString() !== userId.toString()
        );
      }
    });

    await post.save();

    res.json({
      success: true,
      reactions: post.reactions
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
};

export const getReactions = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('reactions.like', 'firstName lastName userName profileImage')
      .populate('reactions.love', 'firstName lastName userName profileImage')
      .populate('reactions.haha', 'firstName lastName userName profileImage')
      .populate('reactions.wow', 'firstName lastName userName profileImage')
      .populate('reactions.sad', 'firstName lastName userName profileImage')
      .populate('reactions.angry', 'firstName lastName userName profileImage');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      reactions: post.reactions
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reactions'
    });
  }
};
