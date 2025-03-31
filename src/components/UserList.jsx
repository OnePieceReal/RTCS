import React from 'react';

const UserList = ({ 
  users = [], 
  currentUser = '', 
  onSelectUser = () => {}, 
  selectedUser,
  onSendFriendRequest = () => {} 
}) => {
  return (
    <div className="w-1/5 border-l border-gray-700 flex flex-col">
      {/* Header - matches FriendsList exactly */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Active Users</h2>
        
      </div>

      {/* User list - matches FriendsList styling exactly */}
      <div className="overflow-y-auto flex-1">
        {users.length === 0 ? (
          <p className="p-4 text-gray-400">No other users online</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li
                key={user}
                className={`p-4 cursor-pointer hover:bg-gray-800 ${
                  selectedUser === user ? 'bg-gray-800 border-l-4 border-purple-500' : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span>{user}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendFriendRequest(user);
                    }}
                    className="ml-2 px-3 py-1 bg-purple-600 hover:bg-lime-600 text-white text-xs rounded-md"
                  
                  >
                     Send Friend Request
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