import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

function AIChat() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi! I'm your Global Connect assistant. How can I help you today?", id: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    console.log("DEBUG messages state:", messages); // ✅ Debug messages on each render
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { from: "user", text: input.trim(), id: Date.now() };
    const currentInput = input.trim();

    // ✅ Defensive update
    setMessages((prev) =>
      Array.isArray(prev) ? [...prev, userMessage] : [userMessage]
    );

    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/get-res", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: currentInput }),
      });

      const data = await res.json();
      console.log("DEBUG API response:", data); // ✅ Debug API response

      const aiText = data?.reply || "Sorry, I couldn't respond.";
      setIsTyping(false);

      const words = aiText.split(" ");
      let displayText = "";

      // ✅ Add empty AI response
      setMessages((prev) =>
        Array.isArray(prev)
          ? [...prev, { from: "ai", text: "", id: Date.now() }]
          : [{ from: "ai", text: "", id: Date.now() }]
      );

      for (let i = 0; i < words.length; i++) {
        displayText += (i > 0 ? " " : "") + words[i];

        setMessages((prev) => {
          if (!Array.isArray(prev)) return [{ from: "ai", text: displayText, id: Date.now() }];
          const newMessages = [...prev];
          const lastMessageIndex = newMessages.length - 1;

          if (newMessages[lastMessageIndex]?.from === "ai") {
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              text: displayText,
            };
          }
          return newMessages;
        });

        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setIsTyping(false);
      setMessages((prev) =>
        Array.isArray(prev)
          ? [
              ...prev,
              {
                from: "ai",
                text: "Sorry, I couldn't respond. Please try again.",
                id: Date.now(),
              },
            ]
          : [
              {
                from: "ai",
                text: "Sorry, I couldn't respond. Please try again.",
                id: Date.now(),
              },
            ]
      );
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
    <div className="flex items-center gap-2 p-3 bg-[#1A1F71] rounded-2xl rounded-bl-md max-w-[80%] self-start animate-pulse">
      <Bot className="w-4 h-4 text-[#FFD700]" />
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="w-full lg:w-[25%] bg-gradient-to-br from-[#2C2C2C] to-[#1e1e1e] rounded-2xl shadow-2xl flex flex-col h-[90vh] mt-[90px] border border-[#3a3a3a]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A1F71] to-[#2a2f8a] p-4 rounded-t-2xl border-b border-[#3a3a3a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#1A1F71]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">AI Assistant</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-300">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a4a4a] scrollbar-track-transparent">
        {Array.isArray(messages) &&
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300 ${
                msg.from === "ai"
                  ? "self-start"
                  : "self-end flex-row-reverse"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.from === "ai" ? "bg-[#FFD700]" : "bg-[#1A1F71]"
                }`}
              >
                {msg.from === "ai" ? (
                  <Bot className="w-4 h-4 text-[#1A1F71]" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`p-3 rounded-2xl max-w-[80%] shadow-md transition-all duration-200 hover:shadow-lg ${
                  msg.from === "ai"
                    ? "bg-[#1A1F71] text-white rounded-bl-md"
                    : "bg-gradient-to-r from-[#FFD700] to-[#ffd700dd] text-[#1A1F71] rounded-br-md font-medium"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-[#3a3a3a] bg-[#2a2a2a] rounded-b-2xl">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="w-full p-3 pr-12 rounded-xl bg-[#1A1F71] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD700] resize-none transition-all duration-200"
              placeholder="Type your message..."
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
            {input && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {input.length}/500
              </div>
            )}
          </div>
          <button
            className={`p-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center min-w-[48px] h-12 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-[#FFD700] to-[#ffd700dd] text-[#1A1F71] hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[#1A1F71] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <div className="w-1 h-1 bg-[#FFD700] rounded-full animate-pulse"></div>
            AI is thinking...
          </div>
        )}
      </div>
    </div>
  );
}

export default AIChat;
