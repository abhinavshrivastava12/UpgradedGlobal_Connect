// ChatBox.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
  withCredentials: true,
});

function ChatBox() {
  const [userId, setUserId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, { ...data, incoming: true }]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const registerUser = () => {
    if (!userId.trim()) return;
    socket.emit("register", userId);
    setRegistered(true);
  };

  const sendMessage = () => {
    if (!receiverId || !message.trim()) return;

    setChat((prev) => [
      ...prev,
      { senderId: userId, text: message, incoming: false },
    ]);

    socket.emit("send_message", {
      senderId: userId,
      receiverId,
      text: message,
    });

    setMessage("");
  };

  if (!registered) {
    return (
      <div className="flex items-center justify-center h-screen  bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
        <div className="bg-white p-6 rounded-lg shadow-md w-80 ">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Enter Your ID to Start Chat
          </h3>
          <input
            type="text"
            placeholder="Your ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={registerUser}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition duration-200"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
      <div className="bg-white mt-[100px] w-96 h-[600px] rounded-lg shadow-md flex flex-col p-4">
        <h3 className="text-lg font-semibold text-center mb-4">
          Real-Time Chat
        </h3>

        {/* Receiver ID Input */}
        <input
          type="text"
          placeholder="Enter Receiver ID"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto border border-gray-300 rounded p-2 mb-3 h-56 bg-gray-50 scrollbar-hide"
          style={{
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE & Edge
          }}
        >
          <style>
            {`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.incoming ? "justify-start" : "justify-end"
              } mb-2`}
            >
              <span
                className={`px-3 py-2 rounded-lg text-sm ${
                  msg.incoming
                    ? "bg-gray-300 text-black"
                    : "bg-blue-500 text-white"
                }`}
              >
                {msg.text}
              </span>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex">
          <input
            type="text"
            placeholder="Type message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r transition duration-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;
