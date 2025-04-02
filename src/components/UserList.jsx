import React, { useEffect } from 'react';
import { useState } from "react";
const UserList = ({ 
  users = [], 
  currentUser = '', 
  selectedUser,
  onSendFriendRequest = () => {} ,
  friends ={friends},
}) => {
  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    setSentRequests(prev => {
      const filtered = new Set(
        Array.from(prev).filter(user => users.includes(user))
      );
      return filtered.size === prev.size ? prev : filtered; 
    });
  }, [users]); 
  const handleSendRequest = (user) => {
    if (users.includes(user)) { 
      onSendFriendRequest(user);
      setSentRequests(prev => new Set(prev).add(user));
    }
  };
  const filteredUsers = users.filter(user => user !== currentUser);
  return (
    <div className="w-1/5 border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Active Users</h2>      
      </div>

 
      <div className="overflow-y-auto flex-1">
        {filteredUsers.length === 0 ? (
          <p className="p-4 text-gray-400">No other users online</p>
        ) : (
          <ul>
            {filteredUsers.map((user) => (
              <li
                key={user}
                className={`p-4 cursor-pointer hover:bg-gray-800 ${
                  selectedUser === user ? 'bg-gray-800 border-l-4 border-purple-500' : ''
                }`}
            
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span>{user}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendRequest(user);
                    }}
                    className={`ml-2 px-3 py-1 text-white text-xs rounded-md transition-colors ${
                      friends.includes(user)
                        ? 'bg-green-600 cursor-default'
                        : sentRequests.has(user)
                          ? 'bg-blue-600 cursor-default'
                          : 'bg-purple-600 hover:bg-lime-600'
                    }`}
                    disabled={friends.includes(user) || sentRequests.has(user)}
                  >
                    {friends.includes(user)
                      ? 'Friended'
                      : sentRequests.has(user)
                        ? 'Friend Request Sent'
                        : 'Send Friend Request'}
                  </button>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className=" border-t border-gray-700 p-5 h-[4.7rem]">   
      </div>
    </div>
  );
};

export default UserList;