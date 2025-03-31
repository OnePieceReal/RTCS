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
    console.log(Array.from(activeUsers.values()));
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
      console.log(Array.from(activeUsers.values()));
      console.log(`${username} left the chat`);
    }
  });



const pendingFriendRequests = new Set();
socket.on('friendRequest', ({ recipient, sender }) => {
  if (!recipient || !sender) {
    console.error('Invalid friend request - missing recipient or sender');
    return;
  }
  const requestId = `${sender}-${recipient}`;
  if (pendingFriendRequests.has(requestId)) {
    console.log(`Duplicate friend request from ${sender} to ${recipient}`);
    return;
  }
  pendingFriendRequests.add(requestId);
  const recipientSocket = findSocketIdByUsername(recipient);
  if (recipientSocket) {
    io.to(recipientSocket).emit('friendRequest', { sender });
    console.log(`Friend request sent from ${sender} to ${recipient}`);
  } else {
    console.log(`Recipient ${recipient} not found - friend request failed`);
    pendingFriendRequests.delete(requestId); 
  }
});


socket.on('friendRequestResponse', ({ sender, recipient, response }) => {
  const requestId = `${sender}-${recipient}`;
  pendingFriendRequests.delete(requestId);
  console.log(`friend request response--> sender: ${sender}, recipient ${recipient}, response ${response}`);
  // Notify the"" original sender about the response
  const senderSocket = findSocketIdByUsername(sender);
  if (senderSocket) {
    io.to(senderSocket).emit('friendRequestResponse', { 
      recipient, 
      response 
    });
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