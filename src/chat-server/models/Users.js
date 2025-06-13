const mongoose = require('mongoose');
const crypto = require('crypto');
const { getPublicKey } = require('../config/keys');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 10,
    match: /^[a-zA-Z0-9]+$/
  },
  password: {
    type: String,
    required: true
  },
  publicKey: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash password
UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();

  // Generate salt
  this.salt = crypto.randomBytes(16).toString('hex');
  
  // Hash password with SHA-256
  this.password = crypto.pbkdf2Sync(
    this.password, 
    this.salt, 
    1000, 
    64, 
    'sha256'
  ).toString('hex');
  
  next();
});

// Method to validate password
UserSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(
    password,
    this.salt,
    1000,
    64,
    'sha256'
  ).toString('hex');
  
  return this.password === hash;
};

// Generate RSA key pair for user
UserSchema.methods.generateKeyPair = function() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  this.publicKey = publicKey;
  return privateKey;
};

module.exports = mongoose.model('User', UserSchema);