
import React, { useContext, useEffect, useState } from 'react'
import logo2 from "../assets/GC.jpg"
import { IoSearchSharp } from "react-icons/io5";
import { TiHome } from "react-icons/ti";
import { FaUserGroup } from "react-icons/fa6";
import { IoNotificationsSharp } from "react-icons/io5";
import dp from "../assets/dp.webp"
import { userDataContext } from '../context/userContext';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function Nav() {
    const [activeSearch, setActiveSearch] = useState(false)
    const { userData, setUserData, handleGetProfile } = useContext(userDataContext)
    const [showPopup, setShowPopup] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { serverUrl } = useContext(authDataContext)
    const [searchInput, setSearchInput] = useState("")
    const [searchData, setSearchData] = useState([])

    const handleSignOut = async () => {
        try {
            await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true })
            setUserData(null)
            navigate("/login")
        } catch (error) {
            console.log(error);
        }
    }

    const handleSearch = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/user/search?query=${searchInput}`, { withCredentials: true })
            setSearchData(result.data)
        } catch (error) {
            setSearchData([])
        }
    }

    useEffect(() => {
        handleSearch()
    }, [searchInput])

    const isActive = (path) => location.pathname === path

    return (
        <div className='w-full h-[80px] bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] fixed top-0 shadow-md flex items-center px-4 lg:px-12 z-[80]'>
            {/* Left: Logo & Search */}
            <div className='flex items-center gap-4 flex-1 rounded-md'>
                <img
                    src={logo2}
                    alt="Logo"
                    className='w-[50px] cursor-pointer rounded-lg'
                    onClick={() => {
                        setActiveSearch(false)
                        navigate("/")
                    }}
                />
                {!activeSearch && (
                    <IoSearchSharp
                        className='w-[23px] h-[23px] text-gray-300 lg:hidden cursor-pointer'
                        onClick={() => setActiveSearch(true)}
                    />
                )}
                <form
                    className={`bg-[#f0efe7] h-[40px] rounded-md flex items-center gap-2 px-3 transition-all duration-300 ${activeSearch ? "flex" : "hidden"} lg:flex w-[200px] lg:w-[350px]`}
                >
                    <IoSearchSharp className='w-[20px] h-[20px] text-gray-600' />
                    <input
                        type="text"
                        placeholder='Search users...'
                        className='w-full bg-transparent outline-none text-gray-800'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </form>
            </div>

            {/* Search Results */}
            {searchData.length > 0 && (
                <div className="absolute top-[65px] left-0 lg:left-12 shadow-lg w-full lg:w-[500px] bg-white rounded-lg border border-gray-200 overflow-auto max-h-[250px] z-[90]">
                    {searchData.map((sea) => (
                        <div
                            key={sea._id}
                            className="flex gap-3 items-center border-b border-gray-100 px-3 py-2 hover:bg-gray-100 cursor-pointer transition"
                            onClick={() => handleGetProfile(sea.userName)}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                    src={sea.profileImage || dp}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">
                                    {`${sea.firstName} ${sea.lastName}`}
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {sea.headline}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Right: Nav Items */}
            <div className='flex items-center gap-6'>
                <div
                    className={`hidden lg:flex flex-col items-center cursor-pointer ${isActive("/") ? "text-yellow-400 font-semibold" : "text-gray-300"}`}
                    onClick={() => navigate("/")}
                >
                    <TiHome className='w-[23px] h-[23px]' />
                    <span className='text-sm'>Home</span>
                </div>
                <div
                    className={`hidden md:flex flex-col items-center cursor-pointer ${isActive("/network") ? "text-yellow-400 font-semibold" : "text-gray-300"}`}
                    onClick={() => navigate("/network")}
                >
                    <FaUserGroup className='w-[23px] h-[23px]' />
                    <span className='text-sm'>My Networks</span>
                </div>
                <div
                    className={`flex flex-col items-center cursor-pointer ${isActive("/notification") ? "text-yellow-400 font-semibold" : "text-gray-300"}`}
                    onClick={() => navigate("/notification")}
                >
                    <IoNotificationsSharp className='w-[23px] h-[23px]' />
                    <span className='hidden md:block text-sm'>Notifications</span>
                </div>

                {/* Profile Picture */}
                <div
                    className='w-[50px] h-[50px] rounded-full overflow-hidden cursor-pointer border-2 border-yellow-400'
                    onClick={() => setShowPopup(prev => !prev)}
                >
                    <img src={userData?.profileImage || dp} alt="Profile" className='w-full h-full object-cover' />
                </div>

                {/* Job Links */}
                {/* <div className='flex flex-col gap-1 text-gray-300'>
                    <Link to="/jobs" className="hover:text-yellow-400">Jobs</Link>
                    <Link to="/jobs/new" className="hover:text-yellow-400">Post Job</Link>
                </div> */}

            </div>

            {/* Profile Popup */}
            {showPopup && (
                <div className='absolute top-[75px] right-4 lg:right-12 w-[300px] bg-white shadow-lg rounded-lg p-4 flex flex-col items-center gap-4 z-[90]'>
                    <div className='w-[70px] h-[70px] rounded-full overflow-hidden'>
                        <img src={userData?.profileImage || dp} alt="" className='w-full h-full object-cover' />
                    </div>
                    <div className='text-lg font-semibold text-gray-800'>{`${userData.firstName} ${userData.lastName}`}</div>
                    <button
                        className='w-full h-[40px] rounded-full border border-yellow-400  bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71] hover:bg-yellow-50'
                        onClick={() => handleGetProfile(userData.userName)}
                    >
                        View Profile
                    </button>
                    <div className='w-full h-[1px] bg-gray-300'></div>
                    <div
                        className='flex items-center gap-2 text-gray-600 cursor-pointer w-full hover:text-yellow-400'
                        onClick={() => navigate("/network")}
                    >
                        <FaUserGroup className='w-[20px] h-[20px]' />
                        <span>My Networks</span>
                    </div>
                    <button
                        className='w-full h-[40px] rounded-full border border-red-500  bg-gradient-to-r from-[#aa0c0c] to-[#d23805] text-[#f1f2ff] hover:bg-red-50'
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}

export default Nav
