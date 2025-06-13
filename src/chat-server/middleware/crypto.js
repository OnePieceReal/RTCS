const { encryptMessage, decryptMessage } = require('../utils/crypto');
const User = require('../models/User');

// Middleware to encrypt outgoing messages
const encryptOutgoingMessages = async (req, res, next) => {
  try {
    if (req.body.recipient && req.body.message) {
      const recipient = await User.findOne({ username: req.body.recipient });
      if (!recipient) {
        return res.status(404).json({ msg: 'Recipient not found' });
      }
      
      req.body.encryptedMessage = encryptMessage(
        req.body.message, 
        recipient.publicKey
      );
      delete req.body.message; // Remove plaintext message
    }
    next();
  } catch (err) {
    console.error('Encryption error:', err);
    res.status(500).json({ msg: 'Message encryption failed' });
  }
};

// Middleware to decrypt incoming messages
const decryptIncomingMessages = async (req, res, next) => {
  try {
    if (req.body.encryptedMessage && req.user) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      req.body.message = decryptMessage(
        req.body.encryptedMessage,
        user.privateKey
      );
      delete req.body.encryptedMessage; // Remove encrypted message
    }
    next();
  } catch (err) {
    console.error('Decryption error:', err);
    res.status(500).json({ msg: 'Message decryption failed' });
  }
};

module.exports = {
  encryptOutgoingMessages,
  decryptIncomingMessages
};