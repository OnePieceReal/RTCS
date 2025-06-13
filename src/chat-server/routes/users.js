const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { encryptOutgoingMessages } = require('../middleware/crypto');
const User = require('../models/User');
const Friend = require('../models/Friend');

// @route   GET api/users/me
// @desc    Get current user's profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -salt -__v');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/search/:username
// @desc    Search for users by username
router.get('/search/:username', verifyToken, async (req, res) => {
  try {
    const users = await User.find({
      username: new RegExp(req.params.username, 'i'),
      _id: { $ne: req.user.id } // Exclude current user
    }).select('username publicKey').limit(10);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/friends
// @desc    Get user's friends list
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user.id);
    res.json(friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/friend-requests
// @desc    Get pending friend requests
router.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    const requests = await Friend.getPendingRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/send-message
// @desc    Send an encrypted message to another user
router.post(
  '/send-message', 
  verifyToken, 
  encryptOutgoingMessages, 
  async (req, res) => {
    try {
      // The message was encrypted by the middleware
      // Here you would typically save it to the database or send via socket.io
      res.json({ 
        success: true,
        recipient: req.body.recipient,
        encryptedMessage: req.body.encryptedMessage
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/friend-request
// @desc    Send a friend request
router.post('/friend-request', verifyToken, async (req, res) => {
  try {
    const { recipientUsername } = req.body;

    // Check if recipient exists
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already friends or request exists
    const existingRelationship = await Friend.findOne({
      user: req.user.id,
      friend: recipient._id
    });

    if (existingRelationship) {
      return res.status(400).json({ 
        msg: existingRelationship.status === 'accepted' 
          ? 'Already friends' 
          : 'Friend request already sent' 
      });
    }

    // Create new friend request
    const friendRequest = new Friend({
      user: req.user.id,
      friend: recipient._id,
      status: 'pending'
    });

    await friendRequest.save();

    res.json({ 
      success: true,
      recipient: recipientUsername,
      status: 'pending'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/friend-request/respond
// @desc    Respond to a friend request
router.put('/friend-request/respond', verifyToken, async (req, res) => {
  try {
    const { senderId, response } = req.body;

    // Validate response
    if (!['accepted', 'rejected'].includes(response)) {
      return res.status(400).json({ msg: 'Invalid response' });
    }

    // Find and update the friend request
    const friendRequest = await Friend.findOneAndUpdate(
      {
        user: senderId,
        friend: req.user.id,
        status: 'pending'
      },
      { status: response },
      { new: true }
    );

    if (!friendRequest) {
      return res.status(404).json({ msg: 'Friend request not found' });
    }

    // If accepted, create the reciprocal relationship
    if (response === 'accepted') {
      const reciprocalRequest = new Friend({
        user: req.user.id,
        friend: senderId,
        status: 'accepted'
      });
      await reciprocalRequest.save();
    }

    res.json({ 
      success: true,
      status: response
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;