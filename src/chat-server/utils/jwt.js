const jwt = require('jsonwebtoken');
const { getPrivateKey } = require('../config/keys');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    getPrivateKey(),
    { algorithm: 'RS256', expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    const { getPublicKey } = require('../config/keys');
    return jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};