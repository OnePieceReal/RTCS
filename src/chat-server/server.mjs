const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { verifyToken, socketAuth } = require('./middleware/auth');
const { encryptMessage, decryptMessage } = require('./utils/crypto');
const User = require('./models/User');
const Friend = require('./models/Friend');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Database connection
require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Socket.io server
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket authentication middleware
io.use(socketAuth);

// Map of active users (stores both socket.id and user info)
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, socket.user.username);

  // Add user to activeUsers map with their JWT info
  activeUsers.set(socket.id, {
    id: socket.user.id,
    username: socket.user.username,
    socket: socket
  });

  // Emit updated active users list
  io.emit('activeUsers', Array.from(activeUsers.values()).map(user => user.username));

  // Handle username validation (now using JWT auth, this might be redundant)
  socket.on('checkUser', (name, callback) => {
    if (!name || name.length > 10 || name.includes(" ")) {
      return callback({
        valid: false,
        error: "Username invalid!"
      });
    }
    if (Array.from(activeUsers.values()).some(user => user.username === name)) {
      return callback({
        valid: false,
        error: 'Username is already taken'
      });
    }
    callback({
      valid: true,
      name
    });
  });

  // Handle user joining (now using authenticated user)
  socket.on('join', () => {
    io.emit('activeUsers', Array.from(activeUsers.values()).map(user => user.username));
    console.log(`${socket.user.username} joined the chat`);
  });

  // Handle encrypted private messages
  socket.on('privateMessage', async ({ recipient, encryptedMessage }) => {
    try {
      const recipientData = findActiveUserByUsername(recipient);
      if (recipientData) {
        // Get sender's details from database
        const sender = await User.findById(socket.user.id);
        
        // Emit the encrypted message to recipient
        recipientData.socket.emit('privateMessage', { 
          sender: socket.user.username,
          encryptedMessage
        });
        
        console.log(`Encrypted message sent from ${socket.user.username} to ${recipient}`);
      } else {
        console.log(`Recipient ${recipient} not found - message not delivered`);
      }
    } catch (err) {
      console.error('Error handling private message:', err);
    }
  });

  // Handle friend requests using database
  socket.on('friendRequest', async ({ recipient }) => {
    try {
      if (!recipient) {
        console.error('Invalid friend request - missing recipient');
        return;
      }

      // Check if recipient exists and is online
      const recipientData = findActiveUserByUsername(recipient);
      if (!recipientData) {
        console.log(`Recipient ${recipient} not found - friend request failed`);
        return;
      }

      // Check if already friends or request exists
      const existingRelationship = await Friend.findOne({
        user: socket.user.id,
        friend: recipientData.id
      });

      if (existingRelationship) {
        console.log(existingRelationship.status === 'accepted' 
          ? 'Already friends' 
          : 'Friend request already sent');
        return;
      }

      // Create new friend request in database
      const friendRequest = new Friend({
        user: socket.user.id,
        friend: recipientData.id,
        status: 'pending'
      });

      await friendRequest.save();

      // Notify recipient
      recipientData.socket.emit('friendRequest', { 
        sender: socket.user.username 
      });

      console.log(`Friend request sent from ${socket.user.username} to ${recipient}`);
    } catch (err) {
      console.error('Error handling friend request:', err);
    }
  });

  // Handle friend request responses
  socket.on('friendRequestResponse', async ({ sender, response }) => {
    try {
      // Validate response
      if (!['accepted', 'rejected'].includes(response)) {
        console.error('Invalid friend request response');
        return;
      }

      // Find the sender's active connection
      const senderData = findActiveUserByUsername(sender);
      if (!senderData) {
        console.log(`Sender ${sender} not found - response not delivered`);
        return;
      }

      // Update the friend request in database
      const friendRequest = await Friend.findOneAndUpdate(
        {
          user: senderData.id,
          friend: socket.user.id,
          status: 'pending'
        },
        { status: response },
        { new: true }
      );

      if (!friendRequest) {
        console.log('Friend request not found');
        return;
      }

      // If accepted, create the reciprocal relationship
      if (response === 'accepted') {
        const reciprocalRequest = new Friend({
          user: socket.user.id,
          friend: senderData.id,
          status: 'accepted'
        });
        await reciprocalRequest.save();
      }

      // Notify the original sender about the response
      senderData.socket.emit('friendRequestResponse', { 
        recipient: socket.user.username,
        response 
      });

      console.log(`Friend request from ${sender} ${response} by ${socket.user.username}`);
    } catch (err) {
      console.error('Error handling friend request response:', err);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      activeUsers.delete(socket.id);
      io.emit('activeUsers', Array.from(activeUsers.values()).map(user => user.username));
      console.log(`${userData.username} left the chat`);
    }
  });

  // Helper function to find active user by username
  function findActiveUserByUsername(username) {
    for (const [_, userData] of activeUsers.entries()) {
      if (userData.username === username) return userData;
    }
    return null;
  }
});

const PORT = process.env.PORT || 80;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));