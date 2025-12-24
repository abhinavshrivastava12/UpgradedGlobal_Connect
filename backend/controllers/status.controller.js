import Status from '../models/status.model.js';
import User from '../models/user.model.js';

// Set/Update Status
export const setStatus = async (req, res) => {
  try {
    const { text, emoji } = req.body;
    const userId = req.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Status text is required'
      });
    }

    if (text.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Status must be 100 characters or less'
      });
    }

    // Delete existing status
    await Status.deleteOne({ user: userId });

    // Create new status
    const status = await Status.create({
      user: userId,
      text: text.trim(),
      emoji: emoji || '🟢',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await status.populate('user', 'firstName lastName userName profileImage');

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Set status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set status'
    });
  }
};

// Get User Status
export const getStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const status = await Status.findOne({ user: userId })
      .populate('user', 'firstName lastName userName profileImage');

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get status'
    });
  }
};

// Get All Friend Statuses
export const getFriendStatuses = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('connection');
    const friendIds = user.connection || [];

    const statuses = await Status.find({
      user: { $in: friendIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'firstName lastName userName profileImage')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Get friend statuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statuses'
    });
  }
};

// Clear Status
export const clearStatus = async (req, res) => {
  try {
    const userId = req.userId;

    await Status.deleteOne({ user: userId });

    res.json({
      success: true,
      message: 'Status cleared'
    });
  } catch (error) {
    console.error('Clear status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear status'
    });
  }
};