import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatContainer from './components/ChatContainer';
import UserList from './components/UserList';
import LoginModal from './components/LoginModal';
import FriendsList from './components/FriendsList';

const socket = io('http://localhost');

function App() {
  const [username, setUsername] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [messages, setMessages] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends,setFriends] = useState([]);
  const [loginError, setLoginError] = useState('');
  const [displayErrorFlag, setErrorFlag] = useState(false)
  const handleError = () =>{
    setErrorFlag((displayErrorFlag)=>!displayErrorFlag)
  }
  //for list of active users +  messages between the users
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
    const handleActiveUsersUpdate = (users) => {
      const currentActiveUsers = users.filter(user => user !== username);
      setActiveUsers(currentActiveUsers);
      // Filter other state using the fresh users list
      setFriendRequests(prev => 
        prev.filter(request => currentActiveUsers.includes(request.sender))
      );
      setFriends(prev => 
        prev.filter(friend => currentActiveUsers.includes(friend))
      );
      setMessages(prevMessages => {
        return Object.fromEntries(
          Object.entries(prevMessages).filter(([sender]) => currentActiveUsers.includes(sender))
        );
      });
    };
    
    // socket.on('activeUsers', (users) => {
    //   setActiveUsers(users.filter(user => user !== username));
    //   setFriendRequests(friendRequests.filter((request)=> activeUsers.includes(request.sender)));
    //   setFriends(friends.filter((friend)=> activeUsers.includes(friend)));
      
    // });
    socket.on('activeUsers', handleActiveUsersUpdate);
    socket.on('privateMessage', handlePrivateMessage);
    return () => {
      socket.off('activeUsers', handleActiveUsersUpdate);
      socket.off('privateMessage', handlePrivateMessage);
    };
  }, [username]);

  //listen for friend requests 
  useEffect(() => {
    const handleFriendRequest=({ sender}) => { 
      if(friendRequests.find((request)=>request.sender === sender ) || friends.includes(sender)) return;
      console.log(`[Friend request recieved From: ${sender} at ${new Date().toLocaleTimeString()}`);
      setFriendRequests(prev => [...prev, { sender, status: 'pending' }]);
    };
    socket.on('friendRequest', handleFriendRequest);
    return () => {
      socket.off('friendRequest');
    };
  }, [friendRequests, friends]);

  //users listens to see if the friend request have been accepted or rejected 
  useEffect(() => {
    const handleFriendRequestResponse = ({ recipient, response }) => {
      console.log(`friend request response From: ${recipient}, Status: ${response}`);
      if (!response || response === 'rejected' || friends.includes(recipient)) return;
      setFriends(prev =>  [...prev, recipient]);
    };
    socket.on('friendRequestResponse', handleFriendRequestResponse);
    return () => {
      socket.off('friendRequestResponse', handleFriendRequestResponse);
    };
  }, [friends]);


   // sends a friend request
   const sendFriendRequest = (recipient) => {
    if (!username || !recipient || recipient === username || friendRequests.find((request)=>request.sender === recipient) || friends.includes(recipient) ) return;
    console.log(`Friend request sent to: ${recipient} at ${new Date().toLocaleTimeString()}`);
    //send the request
    socket.emit('friendRequest', { recipient, sender: username });
  };

  // handle adding friends
  const respondToFriendRequest = (sender, response) => {
    console.log(`${username} is responding to the friend request and sending the info To: ${sender}, w/ Response: ${response}`);
    setFriendRequests(prev => 
      prev.map(req => 
        req.sender === sender ? { ...req, status: response } : req
      )
    );
    if (response === 'accepted') setFriends(prev => [...prev, sender]);
    // send response 
    socket.emit('friendRequestResponse', { sender, recipient: username, response });
  };



  const handleLogin = (name) => {
    if (!name || name.length > 10 || name.includes(" ")) {
      setLoginError('Username must be 1-10 characters + no spaces');
      if(!displayErrorFlag)handleError();
      return;
    }
    socket.emit('checkUser', name, (response) => {
      if (response.valid) {
        setUsername(name);
        socket.emit('join', name);
        setShowLogin(false);
        setLoginError('');
        socket.off('checkUserStatus');
      } else {
        setLoginError(response.error || 'Username is taken');
        if(!displayErrorFlag)handleError();
      }
    });
  };

  //sending messages to other users
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
        <LoginModal onLogin={handleLogin} message={loginError} displayErrorFlag={displayErrorFlag} handleError={handleError} />
      ) : (
        <>
          <FriendsList
            friends={friends}
            friendRequests={friendRequests}
            onRespondToRequest={respondToFriendRequest}
            onSelectUser={setSelectedUser}
            currentUser={username}
            selectedUser={selectedUser}
          />
          <ChatContainer 
            messages={selectedUser ? messages[selectedUser] || [] : []}
            onSendMessage={handleSendMessage}
            selectedUser={selectedUser}
            currentUser={username}
            activeUsers={activeUsers}
          />

         <UserList
  users={activeUsers || []}
  currentUser={username}
  selectedUser={selectedUser}
  onSendFriendRequest={sendFriendRequest}
  friends={friends}
/>
        
        </>
      )}
    </div>
  );
}

export default App;