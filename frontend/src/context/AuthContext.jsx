import React, { createContext } from 'react';

export const authDataContext = createContext();

const AuthContext = ({ children }) => {
    // serverUrl ko yahan se hata dein
     const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

    const value = {
         serverUrl, // isse bhi hata dein
    };

    return (
        <authDataContext.Provider value={value}>
            {children}
        </authDataContext.Provider>
    );
};

export default AuthContext;