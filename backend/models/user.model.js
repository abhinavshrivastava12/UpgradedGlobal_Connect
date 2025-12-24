import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  profileImage: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  headline: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  education: {
    type: [{
      college: String,
      degree: String,
      fieldOfStudy: String,
      startYear: Number,
      endYear: Number
    }],
    default: []
  },
  experience: {
    type: [{
      title: String,
      company: String,
      location: String,
      description: String,
      startDate: Date,
      endDate: Date
    }],
    default: []
  },
  // ✅ FIX: Add connection field with default empty array
  connection: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Post',
  default: []
}],
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes

userSchema.index({ connection: 1 });

const User = mongoose.model('User', userSchema);

export default User;