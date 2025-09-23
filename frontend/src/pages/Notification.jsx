import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import { RxCross1 } from "react-icons/rx";
import dp from "../assets/dp.webp";
import { userDataContext } from '../context/UserContext';

function Notification() {
  let { serverUrl } = useContext(authDataContext);
  let [notificationData, setNotificationData] = useState([]);
  let { userData } = useContext(userDataContext);

  const handleGetNotification = async () => {
    try {
      let result = await axios.get(serverUrl + "/api/notification/get", { withCredentials: true });
      setNotificationData(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(serverUrl + `/api/notification/deleteone/${id}`, { withCredentials: true });
      await handleGetNotification();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClearAllNotification = async () => {
    try {
      await axios.delete(serverUrl + "/api/notification", { withCredentials: true });
      await handleGetNotification();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessage = (type) => {
    if (type === "like") {
      return "liked your post";
    } else if (type === "comment") {
      return "commented on your post";
    } else {
      return "accepted your connection";
    }
  };

  const typeColor = (type) => {
    if (type === "like") return "bg-pink-100 border-pink-300";
    if (type === "comment") return "bg-blue-100 border-blue-300";
    return "bg-green-100 border-green-300";
  };

  useEffect(() => {
    handleGetNotification();
  }, []);

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] pt-[80px] px-[20px] flex flex-col items-center">
      <Nav />

      {/* Top Bar */}
      <div className="w-full max-w-[900px] sticky top-[80px] z-10 bg-white shadow-lg rounded-lg flex items-center p-4 text-lg text-gray-700 justify-between mt-5">
        <span className="font-semibold">
          Notifications ({notificationData.length})
        </span>
        {notificationData.length > 0 && (
          <button
            className="px-4 py-1 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            onClick={handleClearAllNotification}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Notification List */}
      {notificationData.length > 0 ? (
        <div className="w-full max-w-[900px] bg-white shadow-lg rounded-lg flex flex-col divide-y divide-gray-200 mt-4">
          {notificationData.map((noti, index) => (
            <div
              key={index}
              className={`flex flex-col gap-2 p-4 border-l-4 ${typeColor(noti.type)} hover:bg-gray-50 transition-all`}
            >
              <div className="flex justify-between items-center">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="w-[50px] h-[50px] rounded-full overflow-hidden">
                    <img
                      src={noti.relatedUser?.profileImage || dp}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[16px] font-medium text-gray-700">
                    {`${noti.relatedUser?.firstName || ""} ${noti.relatedUser?.lastName || ""} ${handleMessage(noti.type)}`}
                  </div>
                </div>

                {/* Delete Icon */}
                <RxCross1
                  className="w-6 h-6 text-gray-500 hover:text-red-500 cursor-pointer"
                  onClick={() => handleDeleteNotification(noti._id)}
                />
              </div>

              {/* Related Post */}
              {noti.relatedPost && (
                <div className="flex items-center gap-3 ml-[60px]">
                  <div className="w-[80px] h-[50px] rounded overflow-hidden border">
                    <img
                      src={noti.relatedPost.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-gray-600 text-sm">{noti.relatedPost.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 mt-10">No notifications yet.</div>
      )}
    </div>
  );
}

export default Notification;
