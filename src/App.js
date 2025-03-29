import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatContainer from './components/ChatContainer';
import UserList from './components/UserList';
import LoginModal from './components/LoginModal';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [messages, setMessages] = useState({}); // Now using an object to store conversations

  useEffect(() => {
    const handlePrivateMessage = ({ sender, message }) => {
      setMessages(prev => ({
        ...prev,
        [sender]: [...(prev[sender] || []), {
          sender,
          message,
          isReceived: true,
          timestamp: new Date()
        }]
      }));
    };

    socket.on('activeUsers', (users) => {
      setActiveUsers(users.filter(user => user !== username));
    });

    socket.on('privateMessage', handlePrivateMessage);

    return () => {
      socket.off('activeUsers');
      socket.off('privateMessage', handlePrivateMessage);
    };
  }, [username]);

  const handleLogin = (name) => {
    setUsername(name);
    socket.emit('join', name);
    setShowLogin(false);
  };

  const handleSendMessage = (message) => {
    if (!selectedUser || !message.trim()) return;
    
    const newMessage = {
      sender: username,
      message,
      isReceived: false,
      timestamp: new Date()
    };

    socket.emit('privateMessage', {
      recipient: selectedUser,
      message,
      sender: username
    });

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), newMessage]
    }));
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {showLogin ? (
        <LoginModal onLogin={handleLogin} />
      ) : (
        <>
          <UserList 
            users={activeUsers} 
            currentUser={username} 
            onSelectUser={setSelectedUser} 
            selectedUser={selectedUser}
          />
          <ChatContainer 
            messages={selectedUser ? messages[selectedUser] || [] : []}
            onSendMessage={handleSendMessage}
            selectedUser={selectedUser}
            currentUser={username}
          />
        </>
      )}
    </div>
  );
}

export default App;