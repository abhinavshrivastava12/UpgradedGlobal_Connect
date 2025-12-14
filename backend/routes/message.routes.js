import express from 'express';
import { protect } from '../middlewares/isAuth.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/user.model.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name username profilePicture')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get or create conversation
router.post('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] }
    })
    .populate('participants', 'name username profilePicture')
    .populate('lastMessage');

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId]
      });
      
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name username profilePicture')
        .populate('lastMessage');
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Get/Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get messages for a conversation
router.get('/conversation/:conversationId/messages', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    if (!conversationId || conversationId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID'
      });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Build query
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false
      },
      { read: true }
    );

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send message - FIXED VERSION
router.post('/send', protect, async (req, res) => {
  try {
    const { conversationId, recipientId, text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain text or image'
      });
    }

    let conversation;

    // If conversationId provided, use it
    if (conversationId && conversationId !== 'undefined') {
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      if (!conversation.participants.includes(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    } 
    // Otherwise create new conversation
    else if (recipientId && recipientId !== 'undefined') {
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, recipientId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user._id, recipientId]
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either conversationId or recipientId is required'
      });
    }

    // Create message
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text: text || '',
      image: image || null
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate message
    await message.populate('sender', 'name username profilePicture');

    // Emit socket event - FIXED: Different variable name
    const io = req.app.get('io');
    if (io) {
      const otherUserId = conversation.participants.find(
        p => p.toString() !== req.user._id.toString()
      );
      
      if (otherUserId) {
        io.to(otherUserId.toString()).emit('receive-message', {
          message,
          conversationId: conversation._id
        });
        console.log('📨 Socket message sent to user:', otherUserId.toString());
      }
    }

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete message
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search users for messaging
router.get('/search-users', protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        users: []
      });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name username profilePicture')
    .limit(10);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark conversation as read
router.put('/conversation/:conversationId/read', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false
      },
      { read: true }
    );

    res.json({
      success: true
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get unread message count
router.get('/unread-count', protect, async (req, res) => {
  try {
    // Get all conversations
    const conversations = await Conversation.find({
      participants: req.user._id
    });

    const conversationIds = conversations.map(c => c._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user._id },
      read: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;