import React from 'react';

const UserList = ({ users, currentUser, onSelectUser, selectedUser }) => {
  return (
    <div className="w-1/4 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Active Users</h2>
        <p className="text-sm text-gray-400">Logged in as: {currentUser}</p>
      </div>
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
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span>{user}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserList;