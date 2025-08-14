// import React, { useContext, useState } from 'react'
// import logo from "../assets/GCF.jpg"
// import {useNavigate} from "react-router-dom"
// import { authDataContext } from '../context/AuthContext'
// import axios from "axios"
// import { userDataContext } from '../context/userContext'
// function Login() {
//   let [show,setShow]=useState(false)
//   let {serverUrl}=useContext(authDataContext)
//   let {userData,setUserData}=useContext(userDataContext)
//   let navigate=useNavigate()
//   let [email,setEmail]=useState("")
//   let [password,setPassword]=useState("")
//   let [loading,setLoading]=useState(false)
//   let [err,setErr]=useState("")

//   const handleSignIn=async (e)=>{
//     e.preventDefault()
//     setLoading(true)
//     try {
//       let result = await axios.post(serverUrl+"/api/auth/login",{
// email,
// password
//       },{withCredentials:true})
//       setUserData(result.data)
//       navigate("/")
//       setErr("")
//       setLoading(false)
//       setEmail("")
//       setPassword("")
//     } catch (error) {
//       setErr(error.response.data.message)
//       setLoading(false)
//     }
//   }
//   return (
//     <div className='w-full h-screen bg-[white] flex flex-col items-center justify-start gap-[10px]'>
//    <div className='p-[30px] lg:p-[35px] w-full h-[80px] flex items-center' >
//     <img src={logo} alt="" />
//    </div>
//    <form className='w-[90%] max-w-[400px] h-[600px] md:shadow-xl flex flex-col justify-center  gap-[10px] p-[15px]' onSubmit={handleSignIn}>
//     <h1 className='text-gray-800 text-[30px] font-semibold mb-[30px]'>Sign In</h1>
   
//     <input type="email" placeholder='email' required className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' value={email} onChange={(e)=>setEmail(e.target.value)}/>
//     <div className='w-[100%] h-[50px] border-2 border-gray-600 text-gray-800 text-[18px]  rounded-md relative'>
//     <input type={show?"text":"password"} placeholder='password' required className='w-full h-fullborder-none text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' value={password} onChange={(e)=>setPassword(e.target.value)}/>
//     <span className='absolute right-[20px] top-[10px] text-[#24b2ff] cursor-pointer font-semibold' onClick={()=>setShow(prev=>!prev)}>{show?"hidden":"show"}</span>
//     </div>
//    {err && <p className='text-center text-red-500'>
//     *{err}
//     </p>}
//     <button className='w-[100%] h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white' disabled={loading}>{loading?"Loading...":"Sign In"}</button>
//     <p className='text-center cursor-pointer' onClick={()=>navigate("/signup")}>want to create a new account ? <span className='text-[#2a9bd8]' >Sign Up</span></p>
//    </form>
//     </div>
//   )
// }

// export default Login

import React, { useContext, useState } from 'react';
import logo from "../assets/GCF.jpg";
import { useNavigate } from "react-router-dom";
import { authDataContext } from '../context/AuthContext';
import axios from "axios";
import { userDataContext } from '../context/userContext';

function Login() {
  let [show, setShow] = useState(false);
  let { serverUrl } = useContext(authDataContext);
  let { setUserData } = useContext(userDataContext);
  let navigate = useNavigate();
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [loading, setLoading] = useState(false);
  let [err, setErr] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let result = await axios.post(
        serverUrl + "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      setUserData(result.data);
      navigate("/");
      setErr("");
      setLoading(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      setErr(error.response?.data?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6">
      {/* Logo */}
      <div className="flex justify-center">
        <img src={logo} alt="Logo" className="h-[150px] object-contain" />
      </div>

      {/* Login Form */}
      <form
        className="w-[90%] max-w-[400px] bg-white shadow-lg rounded-xl px-6 py-8 flex flex-col gap-4"
        onSubmit={handleSignIn}
      >
        <h1 className="text-gray-800 text-3xl font-bold mb-4 text-center">Sign In</h1>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full h-[50px] border border-gray-300 focus:border-[#24b2ff] focus:ring-2 focus:ring-[#24b2ff] outline-none text-gray-800 text-[16px] px-4 rounded-lg transition-all"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div className="w-full h-[50px] border border-gray-300 focus-within:border-[#24b2ff] focus-within:ring-2 focus-within:ring-[#24b2ff] rounded-lg relative transition-all">
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            required
            className="w-full h-full outline-none text-gray-800 text-[16px] px-4 pr-16 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#24b2ff] cursor-pointer font-medium text-sm select-none hover:underline"
            onClick={() => setShow((prev) => !prev)}
          >
            {show ? "Hide" : "Show"}
          </span>
        </div>

        {/* Error */}
        {err && (
          <p className="text-center text-red-500 text-sm font-medium mt-1">
            *{err}
          </p>
        )}

        {/* Submit */}
        <button
          className="w-full h-[50px] rounded-full bg-[#24b2ff] hover:bg-[#1d9be0] transition-all text-white font-semibold mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <span
            className="text-[#24b2ff] font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;
