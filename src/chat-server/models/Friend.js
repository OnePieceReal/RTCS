const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique friend relationships
FriendSchema.index({ user: 1, friend: 1 }, { unique: true });

// Update the updatedAt field before saving
FriendSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get friends list
FriendSchema.statics.getFriends = async function(userId) {
  return this.find({
    user: userId,
    status: 'accepted'
  }).populate('friend', 'username publicKey');
};

// Static method to get pending friend requests
FriendSchema.statics.getPendingRequests = async function(userId) {
  return this.find({
    friend: userId,
    status: 'pending'
  }).populate('user', 'username publicKey');
};

module.exports = mongoose.model('Friend', FriendSchema);