import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    maxLength: 500
  },
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  poll: {
    question: {
      type: String,
      maxLength: 200
    },
    options: [{
      text: {
        type: String,
        required: true
      },
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    endsAt: {
      type: Date
    }
  },
  quiz: {
    question: {
      type: String,
      maxLength: 200
    },
    options: [{
      type: String,
      required: true
    }],
    correctAnswer: {
      type: Number, // Index of correct option
      required: true
    },
    attempts: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      answer: Number,
      isCorrect: Boolean,
      attemptedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  retweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxLength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isRetweet: {
    type: Boolean,
    default: false
  },
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'mentioned'],
    default: 'public'
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'poll.endsAt': 1 });

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for retweet count
postSchema.virtual('retweetCount').get(function() {
  return this.retweets.length;
});

// Method to check if poll has ended
postSchema.methods.isPollEnded = function() {
  if (!this.poll || !this.poll.endsAt) return false;
  return new Date() > this.poll.endsAt;
};

// Method to get poll results
postSchema.methods.getPollResults = function() {
  if (!this.poll) return null;
  
  const totalVotes = this.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  
  return this.poll.options.map(option => ({
    text: option.text,
    votes: option.votes.length,
    percentage: totalVotes > 0 ? ((option.votes.length / totalVotes) * 100).toFixed(1) : 0
  }));
};

// Method to check user's quiz attempt
postSchema.methods.getUserQuizAttempt = function(userId) {
  if (!this.quiz) return null;
  return this.quiz.attempts.find(attempt => 
    attempt.user.toString() === userId.toString()
  );
};

// Method to get quiz statistics
postSchema.methods.getQuizStats = function() {
  if (!this.quiz) return null;
  
  const totalAttempts = this.quiz.attempts.length;
  const correctAttempts = this.quiz.attempts.filter(a => a.isCorrect).length;
  
  return {
    totalAttempts,
    correctAttempts,
    successRate: totalAttempts > 0 ? ((correctAttempts / totalAttempts) * 100).toFixed(1) : 0
  };
};

// Middleware to extract hashtags before saving
postSchema.pre('save', function(next) {
  if (this.text) {
    const hashtagRegex = /#[\w]+/g;
    const hashtags = this.text.match(hashtagRegex);
    if (hashtags) {
      this.hashtags = [...new Set(hashtags.map(tag => tag.toLowerCase()))];
    }
    
    // Extract mentions
    const mentionRegex = /@[\w]+/g;
    const mentions = this.text.match(mentionRegex);
    if (mentions) {
      // You'll need to resolve usernames to user IDs
      // This is a placeholder
      this.mentions = [];
    }
  }
  next();
});

const Post = mongoose.model('Post', postSchema);

export default Post;