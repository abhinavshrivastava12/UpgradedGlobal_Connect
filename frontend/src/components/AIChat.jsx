import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Minimize2, Sparkles } from "lucide-react";
import axios from "axios";

function AIChat() {
  const [messages, setMessages] = useState([
    { 
      from: "ai", 
      text: "Hi! 👋 I'm your Global Connect assistant. I can help you with networking, jobs, messaging, and more. What would you like to know?", 
      id: Date.now() 
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

    const userMessage = { from: "user", text: input.trim(), id: Date.now() };
    const currentInput = input.trim();

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please login first');
      }

      console.log('📨 Sending AI request:', currentInput);

      const res = await axios.post("/api/ai/get-res", 
        { code: currentInput },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ AI Response received:', res.data);

      // Always check for reply in response
      const aiText = res.data?.reply || "I'm here to help! Ask me about Global Connect features.";
      
      setIsTyping(false);

      // Typing animation effect
      const words = aiText.split(" ");
      let displayText = "";

      const aiMessageId = Date.now();
      setMessages((prev) => [...prev, { from: "ai", text: "", id: aiMessageId }]);

      for (let i = 0; i < words.length; i++) {
        displayText += (i > 0 ? " " : "") + words[i];

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.findIndex(m => m.id === aiMessageId);
          if (lastIndex !== -1) {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              text: displayText,
            };
          }
          return newMessages;
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
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
      } else {
        errorMessage += "Ask me about:\n\n🤝 Connecting with professionals\n💼 Finding jobs\n💬 Messaging features\n📝 Creating posts\n📸 Sharing stories\n\nWhat would you like to know?";
      }
      
      setMessages((prev) => [
        ...prev,
        { 
          from: "ai", 
          text: errorMessage, 
          id: Date.now() 
        }
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
    <div className="flex items-center gap-2 p-3 bg-slate-700 rounded-2xl rounded-bl-md max-w-[80%] self-start">
      <Bot className="w-4 h-4 text-purple-400" />
      <div className="flex gap-1">
        {[0, 0.1, 0.2].map((delay, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    </div>
  );

  // Quick suggestion buttons
  const quickSuggestions = [
    "How do I connect with people?",
    "How can I find jobs?",
    "Tell me about messaging",
    "How to create a post?"
  ];

  const handleQuickSuggestion = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 animate-pulse"
        >
          <Bot className="w-6 h-6 text-white" />
          <span className="font-semibold">AI Assistant</span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[25%] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl flex flex-col h-[90vh] mt-[90px] border border-slate-700">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                AI Assistant
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-100">Always Available</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Minimize2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              msg.from === "ai" ? "self-start" : "self-end flex-row-reverse"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.from === "ai" ? "bg-purple-500" : "bg-pink-500"
              }`}
            >
              {msg.from === "ai" ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div
              className={`p-3 rounded-2xl max-w-[80%] shadow-md ${
                msg.from === "ai"
                  ? "bg-slate-700 text-white rounded-bl-md"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md font-medium"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {isTyping && <TypingIndicator />}

        {/* Quick Suggestions (show only if 1 message) */}
        {messages.length === 1 && !loading && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2 text-center">Quick questions:</p>
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

      {/* Input area */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-2xl">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full p-3 pr-12 rounded-xl bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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