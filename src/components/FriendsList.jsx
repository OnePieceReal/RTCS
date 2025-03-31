import React from 'react';

const FriendsList = ({ 
  friends, 
  friendRequests, 
  onRespondToRequest,
  onSelectUser,
  currentUser
}) => {
  return (
    <div className="w-1/5 border-r border-gray-700 flex flex-col">
      {/* Friends Section */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Friends</h2>
      </div>
      <div className="overflow-y-auto flex-1">
        {friends.length === 0 ? (
          <p className="p-4 text-gray-400">No friends yet</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li
                key={friend}
                className="p-4 cursor-pointer hover:bg-gray-800"
                onClick={() => onSelectUser(friend)}
              >
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span>{friend}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Friend Requests Section */}
      <div className="p-4 border-t border-b border-gray-700">
        <h2 className="text-xl font-semibold">Friend Requests</h2>
      </div>
      <div className="overflow-y-auto flex-1">
        {friendRequests.length === 0 ? (
          <p className="p-4 text-gray-400">No pending requests</p>
        ) : (
          <ul>
            {friendRequests.map((request, index) => (
              <li 
                key={index} 
                className="p-4 hover:bg-gray-800"
              >
                <div className="flex justify-between items-center">
                  <span>{request.sender}</span>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onRespondToRequest(request.sender, 'accepted')}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRespondToRequest(request.sender, 'rejected')}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {request.status !== 'pending' && (
                    <span className={`text-xs ${
                      request.status === 'accepted' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {request.status}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className=" border-t border-gray-700 p-5 h-[4.7rem]">
        <h2 className="text-xl font-semibold">Username: {currentUser}</h2>
      </div>
    </div>
  );
};

export default FriendsList;