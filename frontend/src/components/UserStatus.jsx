import React from 'react';

function UserStatus({ isOnline, lastSeen }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
      <span className="text-xs text-gray-400">
        {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
      </span>
    </div>
  );
}

export default UserStatus;