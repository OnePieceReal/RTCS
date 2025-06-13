const { verifyToken } = require('../utils/jwt');

// Middleware for HTTP routes
const authMiddleware = (req, res, next) => {
  // Get token from header or cookie
  let token = req.header('x-auth-token') || req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Middleware for Socket.io connections
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.user = decoded;
    next();
  } catch (err) {
    console.error('Socket authentication error:', err);
    next(new Error('Authentication error'));
  }
};

module.exports = {
  verifyToken: authMiddleware,
  socketAuth
};