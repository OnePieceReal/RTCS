import React, { useState } from 'react';

const LoginModal = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-4 text-white">Enter Chat</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition duration-200"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;