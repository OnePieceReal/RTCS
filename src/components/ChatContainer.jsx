import React, { useState, useEffect, useRef } from 'react';

const ChatContainer = ({ messages, onSendMessage, selectedUser, currentUser, activeUsers }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  //function will add an escape sequence each time the word exceeds the specified limit 
  const formatMessage = (message, limit = 30) => {
    let prevWordLength = 0;
    
    return message
      .split(" ")
      .map(word => {
        let availableSpace = limit - prevWordLength;
  
        if (word.length > availableSpace) {
     
          let chunkSize = Math.max(1, availableSpace);
          let chunks = word.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [word];
  
          prevWordLength = chunks[chunks.length - 1].length; 
          
          return chunks.join("\n");
        } else {
          let formattedWord = word;
          prevWordLength += word.length + 1;
  
          if (prevWordLength > limit) {
            prevWordLength = word.length + 1; 
            return "\n" + formattedWord;
          }
  
          return formattedWord;
        }
      })
      .join(" ");
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && selectedUser && message.length <2000) {
      onSendMessage(formatMessage(message));
      setMessage('');
    }
  };

  if (!selectedUser || !activeUsers.includes(selectedUser) ) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="text-center p-6 rounded-lg bg-gray-700">
          <h3 className="text-xl font-semibold text-gray-200">No user selected</h3>
          <p className="text-gray-400 mt-2">Please friend or select a user from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <h2 className="text-xl font-semibold">Chat with {selectedUser}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">Send your first message to {selectedUser}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender === currentUser
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold">{msg.sender}</span>
                    <span className="text-xs ml-2 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="mt-1">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${selectedUser}...`}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-md transition duration-200"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatContainer;