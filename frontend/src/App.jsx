import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import { userDataContext } from './context/userContext'
import Network from './pages/Network'
import Profile from './pages/Profile'
import Notification from './pages/Notification'
import JobBoard from './pages/JobBoard'
import JobForm from './pages/JobForm'
import Nav from './components/Nav'

function App() {
  let {userData}=useContext(userDataContext)
  return (
   <Routes>
    <Route path='/' element={userData?<><Nav/><Home/></> :<Navigate to="/login"/>}/>
    <Route path='/signup' element={userData?<Navigate to="/"/>:<Signup/>}/>
    <Route path='/login' element={userData?<Navigate to="/"/>:<Login/>}/>
    <Route path='/network' element={userData?<Network/>:<Navigate to="/login"/>}/>
    <Route path='/profile' element={userData?<Profile/>:<Navigate to="/login"/>}/>
    <Route path='/notification' element={userData?<Notification/>:<Navigate to="/login"/>}/>
    <Route path='/jobs' element={<JobBoard/>}/>
    <Route path='/jobs/new' element={<JobForm/>}/>
  
   </Routes>
  )
}

export default App
