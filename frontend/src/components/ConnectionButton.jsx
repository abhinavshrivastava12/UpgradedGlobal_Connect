import React, { useContext, useEffect, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client'

const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:8000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

function ConnectionButton({ userId }) {
  const { userData } = useContext(userDataContext)
  const [status, setStatus] = useState("loading")
  const [loading, setLoading] = useState(false)
  const [requestId, setRequestId] = useState(null)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleSendConnection = async () => {
    setLoading(true)
    try {
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      await axios.post(`/api/connection/send/${userId}`, {}, config)
      setStatus("pending")
    } catch (error) {
      console.error("Send connection error:", error)
      alert(error.response?.data?.message || "Failed to send connection")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptConnection = async () => {
    if (!requestId) {
      alert('Request ID not found');
      return;
    }
    
    setLoading(true)
    try {
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      await axios.put(`/api/connection/accept/${requestId}`, {}, config)
      setStatus("disconnect")
      alert('Connection accepted!')
    } catch (error) {
      console.error("Accept connection error:", error)
      alert('Failed to accept connection')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveConnection = async () => {
    if (!window.confirm("Remove this connection?")) return
    setLoading(true)
    try {
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      await axios.delete(`/api/connection/remove/${userId}`, config)
      setStatus("Connect")
      alert('Connection removed')
    } catch (error) {
      console.error("Remove connection error:", error)
      alert("Failed to remove connection")
    } finally {
      setLoading(false)
    }
  }

  const handleGetStatus = async () => {
    try {
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const result = await axios.get(`/api/connection/getStatus/${userId}`, config)
      
      setStatus(result.data.status)
      if (result.data.requestId) {
        setRequestId(result.data.requestId)
      }
    } catch (error) {
      console.error("Get status error:", error)
      setStatus("Connect")
    }
  }

  useEffect(() => {
    if (!userId || !userData?._id) return
    
    handleGetStatus()

    socket.on("statusUpdate", ({ updatedUserId, newStatus }) => {
      if (updatedUserId === userId) {
        setStatus(newStatus)
      }
    })

    return () => {
      socket.off("statusUpdate")
    }
  }, [userId, userData])

  const handleClick = async () => {
    if (loading) return
    
    if (status === "disconnect") {
      await handleRemoveConnection()
    } else if (status === "received") {
      await handleAcceptConnection()
    } else if (status === "Connect") {
      await handleSendConnection()
    } else if (status === "pending") {
      alert("Connection request already sent and pending")
    }
  }

  const getButtonStyle = () => {
    switch(status) {
      case "pending":
        return "bg-gray-600 text-gray-300 cursor-not-allowed border-gray-600"
      case "received":
        return "bg-green-600 hover:bg-green-700 text-white border-green-600"
      case "disconnect":
        return "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-purple-600"
      case "loading":
        return "bg-gray-600 text-gray-300 cursor-wait border-gray-600"
      default:
        return "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-blue-600"
    }
  }

  const getButtonText = () => {
    if (loading) return "Loading..."
    switch(status) {
      case "pending": return "Pending"
      case "received": return "Accept Request"
      case "disconnect": return "Connected ✓"
      case "loading": return "..."
      default: return "Connect"
    }
  }

  return (
    <button 
      className={`min-w-[140px] px-6 py-3 rounded-full font-semibold transition-all shadow-lg hover:scale-105 ${getButtonStyle()}`}
      onClick={handleClick}
      disabled={status === "pending" || status === "loading" || loading}
    >
      {getButtonText()}
    </button>
  )
}

export default ConnectionButton