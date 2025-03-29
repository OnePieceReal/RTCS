const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Update this to match your frontend URL
    methods: ["GET", "POST"]
  }
});

// Store active users
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user joining
  socket.on('join', (username) => {
    activeUsers.set(socket.id, username);
    io.emit('activeUsers', Array.from(activeUsers.values()));
    console.log(`${username} joined the chat`);
  });

  // Handle private messages
  socket.on('privateMessage', ({ recipient, message, sender }) => {
    const recipientSocket = findSocketIdByUsername(recipient);
    if (recipientSocket) {
      io.to(recipientSocket).emit('privateMessage', { sender, message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = activeUsers.get(socket.id);
    if (username) {
      activeUsers.delete(socket.id);
      io.emit('activeUsers', Array.from(activeUsers.values()));
      console.log(`${username} left the chat`);
    }
  });

  // Helper function to find socket ID by username
  function findSocketIdByUsername(username) {
    for (const [socketId, user] of activeUsers.entries()) {
      if (user === username) return socketId;
    }
    return null;
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));