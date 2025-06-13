const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });
const io = require('socket.io')(server, {
  cors: {
    origin: "*",  // Allows all origins
    methods: ["GET", "POST"],
    credentials: false  // Must be false when origin is "*"
  }
});
//map of active users 
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

//checks if the username is valid
socket.on('checkUser', (name, callback) => {
  if (!name || name.length > 10 ||name.includes(" ")) {
    return callback({
      valid: false,
      error: "Username invalid!"
    });
  }
  if (Array.from(activeUsers.values()).includes(name)) {
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

  // handle user joining
  socket.on('join', (username) => {
    activeUsers.set(socket.id, username);
    io.emit('activeUsers', Array.from(activeUsers.values()));
    // console.log(Array.from(activeUsers.values()));
    console.log(`${username} joined the chat`);
  });

  
  // handle private messages
  socket.on('privateMessage', ({ recipient, message, sender }) => {
    const recipientSocket = findSocketIdByUsername(recipient);
    if (recipientSocket) {
      io.to(recipientSocket).emit('privateMessage', { sender, message });
    }
  });
  const pendingFriendRequests = new Set();


//handle friend requests 
socket.on('friendRequest', ({ recipient, sender }) => {
  if (!recipient || !sender) {
    console.error('Invalid friend request - missing recipient or sender');
    return;
  }
  const requestId = `${sender}-${recipient}`;
  // if (pendingFriendRequests.has(requestId)) {
  //   console.log(`Duplicate friend request from ${sender} to ${recipient}`);
  //   return;
  // }
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

//handle reponse to friend requests 
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

 // handle disconnection
 socket.on('disconnect', () => {
  const username = activeUsers.get(socket.id);
  if (username) {
    activeUsers.delete(socket.id);
    io.emit('activeUsers', Array.from(activeUsers.values()));
    for (const [requestId, request] of pendingFriendRequests.entries()) {
      if (request.sender === username || request.recipient === username) {
        pendingFriendRequests.delete(requestId);}}
    // console.log(Array.from(activeUsers.values()));
    // console.log(`${username} left the chat`);
  }
});


  //function to find socket ID by username
  function findSocketIdByUsername(username) {
    for (const [socketId, user] of activeUsers.entries()) {
      if (user === username) return socketId;
    }
    return null;
  }
});

const PORT = 80;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));