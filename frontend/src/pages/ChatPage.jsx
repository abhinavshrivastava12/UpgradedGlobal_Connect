import React from 'react'
import Nav from '../components/Nav'
import ChatWindow from '../components/chat/ChatWindow'
function ChatPage() {
  return (
    <>
      <Nav />
      <div className="mt-16">
        <ChatWindow />
      </div>
    </>
  )
}
export default ChatPage;