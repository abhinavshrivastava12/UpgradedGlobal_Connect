import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster queries
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for faster queries
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting
  },
  readAt: {
    type: Date,
    default: null,
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'call'],
    default: 'text'
  },
  // Optional fields for future features
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Compound indexes for efficient querying
MessageSchema.index({ from: 1, to: 1, timestamp: -1 });
MessageSchema.index({ to: 1, readAt: 1 }); // For unread message queries

// Instance method to mark as read
MessageSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  return this.save();
};

// Static method to get conversation between two users
MessageSchema.statics.getConversation = function(user1, user2, options = {}) {
  const { page = 1, limit = 30 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 }
    ]
  })
  .sort({ timestamp: -1 })
  .skip(skip)
  .limit(limit)
  .populate('from', 'email name')
  .populate('to', 'email name');
};

// Static method to get unread count
MessageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    to: userId,
    readAt: null
  });
};

export default mongoose.model('Message', MessageSchema);