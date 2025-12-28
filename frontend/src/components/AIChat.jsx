import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Minimize2, Sparkles } from "lucide-react";
import axios from 'axios';

function AIChat() {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hi! 👋 I'm your Global Connect assistant. I can help you with networking, jobs, messaging, and more. What would you like to know?",
      id: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      from: "user",
      text: input.trim(),
      id: Date.now(),
    };
    const currentInput = input.trim();

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      console.log('📨 Sending AI request:', currentInput);
      
      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };

      // ✅ FIXED: Correct API endpoint
      const response = await axios.post(
        '/api/ai/get-res',
        { code: currentInput },
        config
      );

      console.log('✅ AI Response received:', response.data);
      setIsTyping(false);

      // ✅ Parse AI response correctly
      let aiText = "";
      if (response.data?.reply) {
        aiText = response.data.reply;
      } else if (response.data?.message) {
        aiText = response.data.message;
      } else if (typeof response.data === 'string') {
        aiText = response.data;
      } else {
        aiText = "I'm here to help! What would you like to know about Global Connect?";
      }

      console.log('✅ Extracted AI text:', aiText);

      // ✅ NON-BLOCKING typing animation
      const aiMessageId = Date.now() + Math.random();
      setMessages((prev) => [...prev, { from: "ai", text: "", id: aiMessageId }]);

      const words = aiText.split(" ");
      let currentIndex = 0;

      const typeWord = () => {
        if (currentIndex >= words.length) {
          console.log('✅ Typing animation completed');
          return;
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.findIndex((m) => m.id === aiMessageId);
          if (lastIndex !== -1) {
            const displayText = words.slice(0, currentIndex + 1).join(" ");
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              text: displayText,
            };
          }
          return newMessages;
        });

        currentIndex++;
        setTimeout(typeWord, 20);
      };

      typeWord();

    } catch (error) {
      console.error("❌ AI Error:", error);
      setIsTyping(false);

      let errorMessage = "I'm here to help! ";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += "Request timeout. Let me help you with: networking, jobs, messaging, posts, and profile management. What would you like to know?";
      } else if (error.response?.status === 401) {
        errorMessage += "Please login to continue. Once logged in, I can assist you with all Global Connect features!";
      } else if (error.response?.status === 429) {
        errorMessage += "I'm experiencing high traffic right now. Meanwhile, you can explore features like: 🤝 Networking, 💼 Jobs, 💬 Chat, 📝 Posts. What interests you?";
      } else if (error.response?.data?.reply) {
        errorMessage = error.response.data.reply;
      } else {
        errorMessage += "Ask me about:\n\n🤝 Connecting with professionals\n💼 Finding jobs\n💬 Messaging features\n📝 Creating posts\n📸 Sharing stories\n\nWhat would you like to know?";
      }

      setMessages((prev) => [
        ...prev,
        { from: "ai", text: errorMessage, id: Date.now() + Math.random() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-1 p-3 bg-slate-700 rounded-2xl max-w-[80px]">
      {[0, 0.1, 0.2].map((delay, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
          style={{
            animationDelay: `${delay}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const quickSuggestions = [
    "How do I connect with people?",
    "How can I find jobs?",
    "Tell me about messaging",
    "How to create a post?",
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 animate-pulse"
        >
          <Sparkles className="w-6 h-6" />
          <span className="font-semibold">AI Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-700">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-white" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800"></div>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">AI Assistant</h3>
            <p className="text-xs text-purple-100">Always Available</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Minimize2 className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.from === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.from === "ai"
                  ? "bg-gradient-to-br from-purple-600 to-pink-600"
                  : "bg-gradient-to-br from-blue-600 to-cyan-600"
              }`}
            >
              {msg.from === "ai" ? (
                <Bot className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div
              className={`max-w-[70%] p-3 rounded-2xl ${
                msg.from === "ai"
                  ? "bg-slate-700 text-gray-100"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-600 to-pink-600">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <TypingIndicator />
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2 font-semibold">
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="text-xs px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-slate-700 rounded-xl overflow-hidden">
            <textarea
              ref={inputRef}
              className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-400 outline-none resize-none"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              rows={1}
              style={{
                minHeight: "48px",
                maxHeight: "120px",
                overflowY: input.length > 50 ? "auto" : "hidden",
              }}
            />
          </div>
          <button
            className={`p-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center min-w-[48px] h-12 ${
              loading || !input.trim()
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {loading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
            Thinking...
          </div>
        )}
      </div>
    </div>
  );
}

export default AIChat;