import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import dp from "../assets/dp.webp";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { RxCrossCircled } from "react-icons/rx";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

function Network() {
  let { serverUrl } = useContext(authDataContext);
  let [connections, setConnections] = useState([]);

  const handleGetRequests = async () => {
    try {
      let result = await axios.get(`${serverUrl}/api/connection/requests`, { withCredentials: true });
      setConnections(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAcceptConnection = async (requestId) => {
    try {
      await axios.put(`${serverUrl}/api/connection/accept/${requestId}`, {}, { withCredentials: true });
      setConnections(connections.filter((con) => con._id !== requestId));
    } catch (error) {
      console.log(error);
    }
  };

  const handleRejectConnection = async (requestId) => {
    try {
      await axios.put(`${serverUrl}/api/connection/reject/${requestId}`, {}, { withCredentials: true });
      setConnections(connections.filter((con) => con._id !== requestId)); // fixed here
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    handleGetRequests();
  }, []);

  return (
    <div className='w-screen min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] flex flex-col items-center'>
      {/* Navbar */}
      <div className='fixed top-0 w-full z-50'>
        <Nav />
      </div>

      {/* Main content */}
      <div className='w-full max-w-[900px] mt-[90px] px-4 sm:px-6 lg:px-8 flex flex-col gap-6'>

        {/* Invitations Count */}
        <div className='bg-white shadow-md rounded-lg p-4 flex items-center justify-between text-lg font-semibold text-gray-700'>
          <span>Invitations</span>
          <span className='text-[#0a66c2]'>{connections.length}</span>
        </div>

        {/* Invitations List */}
        {connections.length > 0 ? (
          <div className='bg-white shadow-lg rounded-lg divide-y'>
            {connections.map((connection, index) => (
              <div
                key={index}
                className='flex flex-col sm:flex-row justify-between items-center p-4 gap-4 sm:gap-6'
              >
                {/* User Info */}
                <div className='flex items-center gap-4'>
                  <div className='w-14 h-14 rounded-full overflow-hidden border border-gray-300'>
                    <img
                      src={connection.sender?.profileImage || dp}
                      alt=""
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div className='text-base sm:text-lg font-medium text-gray-800'>
                    {`${connection.sender?.firstName || ''} ${connection.sender?.lastName || ''}`}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex items-center gap-3'>
                  <button
                    className='text-[#18c5ff] hover:text-[#0ea5e9] transition-colors'
                    onClick={() => handleAcceptConnection(connection._id)}
                  >
                    <IoIosCheckmarkCircleOutline className='w-9 h-9' />
                  </button>
                  <button
                    className='text-[#ff4218] hover:text-red-600 transition-colors'
                    onClick={() => handleRejectConnection(connection._id)}
                  >
                    <RxCrossCircled className='w-8 h-8' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='bg-white shadow-lg rounded-lg p-6 text-center text-gray-500'>
            No new invitations.
          </div>
        )}
      </div>
    </div>
  );
}

export default Network;
