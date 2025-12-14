import React, { useContext, useEffect, useState } from 'react'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import io from "socket.io-client"
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'

const socket = io();

function ConnectionButton({ userId }) {
  const { userData } = useContext(userDataContext)
  const [status, setStatus] = useState("loading")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const handleSendConnection = async () => {
    setLoading(true)
    try {
      await axios.post(`/api/connection/send/${userId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      })
      setStatus("pending")
    } catch (error) {
      console.error("Send connection error:", error)
      alert(error.response?.data?.message || "Failed to send connection")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveConnection = async () => {
    if (!window.confirm("Remove this connection?")) return
    setLoading(true)
    try {
      await axios.delete(`/api/connection/remove/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      })
      setStatus("Connect")
    } catch (error) {
      console.error("Remove connection error:", error)
      alert("Failed to remove connection")
    } finally {
      setLoading(false)
    }
  }

  const handleGetStatus = async () => {
    try {
      const result = await axios.get(`/api/connection/getStatus/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      })
      setStatus(result.data.status)
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
      navigate("/network")
    } else if (status === "Connect") {
      await handleSendConnection()
    }
  }

  const getButtonStyle = () => {
    switch(status) {
      case "pending":
        return "bg-gray-600 text-gray-300 cursor-not-allowed border-gray-600"
      case "received":
        return "bg-green-600 hover:bg-green-700 text-white border-green-600"
      case "disconnect":
        return "bg-red-600 hover:bg-red-700 text-white border-red-600"
      case "loading":
        return "bg-gray-600 text-gray-300 cursor-wait border-gray-600"
      default:
        return "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
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
      className={`min-w-[140px] px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${getButtonStyle()}`}
      onClick={handleClick}
      disabled={status === "pending" || status === "loading" || loading}
    >
      {getButtonText()}
    </button>
  )
}

export default ConnectionButton