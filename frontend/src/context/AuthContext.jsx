import React, { createContext } from 'react'
export const authDataContext=createContext()
function AuthContext({children}) {
const serverUrl=import.meta.env.VITE_SERVER_URL;
    let value={
        serverUrl
    }
  return (
    <div>
     <authDataContext.Provider value={value}> 
     {children}
     </authDataContext.Provider> 
    </div>
  )
}

export default AuthContext
