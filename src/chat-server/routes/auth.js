const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { encryptWithServerKey } = require('../utils/crypto');

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      password
    });

    // Generate RSA key pair for the user
    const privateKey = user.generateKeyPair();
    
    // Save user
    await user.save();

    // Encrypt the private key with the server's public key before sending to client
    const encryptedPrivateKey = encryptWithServerKey(privateKey);

    // Generate JWT
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey
      },
      encryptedPrivateKey
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateToken(user);

    // Encrypt the user's private key with the server's public key
    const encryptedPrivateKey = encryptWithServerKey(user.privateKey);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        publicKey: user.publicKey
      },
      encryptedPrivateKey
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;