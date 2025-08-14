// import React, { useContext, useEffect, useState } from 'react'
// import dp from "../assets/dp.webp"
// import moment from "moment"
// import { FaRegCommentDots } from "react-icons/fa";
// import { BiLike } from "react-icons/bi";
// import axios from 'axios';
// import { authDataContext } from '../context/AuthContext';
// import { userDataContext } from '../context/userContext';
// import { BiSolidLike } from "react-icons/bi";
// import { LuSendHorizontal } from "react-icons/lu";
// import {io} from "socket.io-client"
// import ConnectionButton from './ConnectionButton';

// let socket=io("http://localhost:8000")
// function Post({ id, author, like, comment, description, image,createdAt }) {
    
//     let [more,setMore]=useState(false)
//   let {serverUrl}=useContext(authDataContext)
//   let {userData,setUserData,getPost,handleGetProfile}=useContext(userDataContext)
//   let [likes,setLikes]=useState(like)
//   let [commentContent,setCommentContent]=useState("")
//   let [comments,setComments]=useState(comment)
//   let [showComment,setShowComment]=useState(false)
//     const handleLike=async ()=>{
//       try {
//         let result=await axios.get(serverUrl+`/api/post/like/${id}`,{withCredentials:true})
//        setLikes(result.data.like)
//       } catch (error) {
//         console.log(error)
//       }
//     }
//     const handleComment=async (e)=>{
//        e.preventDefault()
//         try {
//           let result=await axios.post(serverUrl+`/api/post/comment/${id}`,{
//             content:commentContent
//           },{withCredentials:true})
//           setComments(result.data.comment)
//         setCommentContent("")
//         } catch (error) {
//           console.log(error)
//         }
//       }


//       useEffect(()=>{
//         socket.on("likeUpdated",({postId,likes})=>{
//           if(postId==id){
//             setLikes(likes)
//           }
//         })
//         socket.on("commentAdded",({postId,comm})=>{
//           if(postId==id){
//             setComments(comm)
//           }
//         })

//         return ()=>{
// socket.off("likeUpdated")
// socket.off("commentAdded")
//         }
//       },[id])

//    useEffect(()=>{
//     getPost()
    
//     },[likes,comments])


//     return (
//         <div className="w-full min-h-[200px] flex flex-col gap-[10px] bg-white rounded-lg shadow-lg  p-[20px] ">

//           <div className='flex justify-between items-center'>

//             <div className='flex justify-center items-start gap-[10px]' onClick={()=>handleGetProfile(author.userName)}>
//                 <div className='w-[70px] h-[70px] rounded-full overflow-hidden flex items-center justify-center  cursor-pointer' >
//                     <img src={author.profileImage || dp} alt="" className='h-full' />
//                 </div>
//                 <div>
//                 <div className='text-[22px] font-semibold'>{`${author.firstName} ${author.lastName}` }</div>
//                 <div className='text-[16px]'>{author.headline}</div>
//                 <div className='text-[16px]'>{moment(createdAt).fromNow()}</div>
//                 </div>
//             </div>
//             <div>

//               {userData._id!=author._id &&  <ConnectionButton userId={author._id}/>}
           
              
//             </div>
//             </div>
//          <div className={`w-full ${!more?"max-h-[100px] overflow-hidden":""} pl-[50px]`}>{description}</div>
//          <div className="pl-[50px] text-[19px] font-semibold cursor-pointer" onClick={()=>setMore(prev=>!prev)}>{more?"read less...":"read more..."}</div>

//          {image && 
//          <div className='w-full h-[300px] overflow-hidden flex justify-center rounded-lg'>
// <img src={image} alt="" className='h-full rounded-lg'/>
// </div>}

// <div>
// <div className='w-full flex justify-between items-center p-[20px] border-b-2 border-gray-500'>
// <div className='flex items-center justify-center gap-[5px] text-[18px]'>
//     <BiLike className='text-[#1ebbff] w-[20px] h-[20px]'/><span >{likes.length}</span></div>
// <div className='flex items-center justify-center gap-[5px] text-[18px] cursor-pointer' onClick={()=>setShowComment(prev=>!prev)}><span>{comment.length}</span><span>comments</span></div>
// </div>
// <div className='flex justify-start items-center w-full p-[20px] gap-[20px]'>
// {!likes.includes(userData._id) &&  <div className='flex justify-center items-center gap-[5px] cursor-pointer' onClick={handleLike}>
// <BiLike className=' w-[24px] h-[24px]'/>
// <span>Like</span>
// </div>}
// {likes.includes(userData._id) &&  <div className='flex justify-center items-center gap-[5px] cursor-pointer' onClick={handleLike}>
// <BiSolidLike className=' w-[24px] h-[24px] text-[#07a4ff]'/>
// <span className="text-[#07a4ff] font-semibold">Liked</span>
// </div>}

// <div className='flex justify-center items-center gap-[5px] cursor-pointer' onClick={()=>setShowComment(prev=>!prev)}>
// <FaRegCommentDots className=' w-[24px] h-[24px]'/>
// <span>comment</span>
// </div>
// </div>

// {showComment && <div>
//     <form className="w-full flex justify-between items-center border-b-2 border-b-gray-300 p-[10px] 
//     " onSubmit={handleComment}>
//     <input type="text" placeholder={"leave a comment"} className='outline-none  border-none' value={commentContent} onChange={(e)=>setCommentContent(e.target.value)}/>
//     <button><LuSendHorizontal className="text-[#07a4ff] w-[22px] h-[22px]"/></button>
//     </form>

//     <div className='flex flex-col gap-[10px]'>
//        {comments.map((com)=>(
//         <div key={com._id} className='flex flex-col gap-[10px] border-b-2 p-[20px] border-b-gray-300' >
//             <div className="w-full flex justify-start items-center gap-[10px]">
//             <div className='w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center  cursor-pointer' >
//                     <img src={com.user.profileImage || dp} alt="" className='h-full' />
//                 </div> 
                
//                 <div className='text-[16px] font-semibold'>{`${com.user.firstName} ${com.user.lastName}` }</div>
              
                
//             </div>
//             <div className='pl-[50px]'>{com.content}</div>
//         </div>
//        ))} 
//     </div>
// </div>}

// </div>
         
//         </div>
//     )
// }

// export default Post



import React, { useContext, useEffect, useState } from 'react'
import dp from "../assets/dp.webp"
import moment from "moment"
import { FaRegCommentDots } from "react-icons/fa";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/userContext';
import { io } from "socket.io-client"
import ConnectionButton from './ConnectionButton';

let socket = io("http://localhost:8000");

function Post({ id, author, like, comment, description, image, createdAt }) {
  let [more, setMore] = useState(false);
  let { serverUrl } = useContext(authDataContext);
  let { userData, getPost, handleGetProfile } = useContext(userDataContext);
  let [likes, setLikes] = useState(like);
  let [commentContent, setCommentContent] = useState("");
  let [comments, setComments] = useState(comment);
  let [showComment, setShowComment] = useState(false);

  const handleLike = async () => {
    try {
      let result = await axios.get(serverUrl + `/api/post/like/${id}`, { withCredentials: true });
      setLikes(result.data.like);
    } catch (error) {
      console.log(error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try {
      let result = await axios.post(serverUrl + `/api/post/comment/${id}`, {
        content: commentContent
      }, { withCredentials: true });
      setComments(result.data.comment);
      setCommentContent("");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    socket.on("likeUpdated", ({ postId, likes }) => {
      if (postId === id) setLikes(likes);
    });
    socket.on("commentAdded", ({ postId, comm }) => {
      if (postId === id) setComments(comm);
    });

    return () => {
      socket.off("likeUpdated");
      socket.off("commentAdded");
    };
  }, [id]);

  useEffect(() => {
    getPost();
  }, [likes, comments]);

  return (
    <div className="w-full min-h-[200px] flex flex-col gap-4 bg-white rounded-xl shadow-md p-5 transition-all hover:shadow-lg">

      {/* Header */}
      <div className='flex justify-between items-center'>
        <div
          className='flex gap-3 items-start cursor-pointer'
          onClick={() => handleGetProfile(author.userName)}
        >
          <div className='w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center border border-gray-200 shadow-sm'>
            <img src={author.profileImage || dp} alt="" className='h-full w-full object-cover' />
          </div>
          <div>
            <div className='text-lg font-semibold hover:text-[#0077b5] transition-colors'>
              {`${author.firstName} ${author.lastName}`}
            </div>
            <div className='text-sm text-gray-600'>{author.headline}</div>
            <div className='text-xs text-gray-500'>{moment(createdAt).fromNow()}</div>
          </div>
        </div>

        {userData._id !== author._id && <ConnectionButton userId={author._id} />}
      </div>

      {/* Post description */}
      <div className={`w-full ${!more ? "max-h-[100px] overflow-hidden" : ""} pl-[60px] text-gray-800`}>
        {description}
      </div>
      {description.length > 120 && (
        <div
          className="pl-[60px] text-sm font-medium text-[#0077b5] cursor-pointer hover:underline"
          onClick={() => setMore(prev => !prev)}
        >
          {more ? "Read less..." : "Read more..."}
        </div>
      )}

      {/* Image */}
      {image && (
        <div className='w-full h-[300px] overflow-hidden flex justify-center rounded-lg'>
          <img src={image} alt="" className='h-full object-cover hover:scale-[1.02] transition-transform duration-300' />
        </div>
      )}

      {/* Likes & comments count */}
      <div className='flex justify-between items-center px-4 py-2 border-t border-b border-gray-200'>
        <div className='flex items-center gap-2 text-gray-600 text-sm'>
          <BiLike className='text-[#1ebbff] w-4 h-4' /><span>{likes.length}</span>
        </div>
        <div
          className='flex items-center gap-2 text-gray-600 text-sm cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <span>{comments.length}</span>
          <span>Comments</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className='flex justify-around items-center text-gray-700 font-medium py-2'>
        {!likes.includes(userData._id) ? (
          <div
            className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5]'
            onClick={handleLike}
          >
            <BiLike className='w-5 h-5' /><span>Like</span>
          </div>
        ) : (
          <div
            className='flex items-center gap-2 cursor-pointer text-[#07a4ff]'
            onClick={handleLike}
          >
            <BiSolidLike className='w-5 h-5' /><span className="font-semibold">Liked</span>
          </div>
        )}

        <div
          className='flex items-center gap-2 cursor-pointer hover:text-[#0077b5]'
          onClick={() => setShowComment(prev => !prev)}
        >
          <FaRegCommentDots className='w-5 h-5' /><span>Comment</span>
        </div>
      </div>

      {/* Comments section */}
      {showComment && (
        <div className='mt-2'>
          <form
            className="flex justify-between items-center border border-gray-200 rounded-full px-4 py-1"
            onSubmit={handleComment}
          >
            <input
              type="text"
              placeholder="Leave a comment..."
              className='flex-1 outline-none border-none text-sm'
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <button type="submit">
              <LuSendHorizontal className="text-[#07a4ff] w-5 h-5" />
            </button>
          </form>

          {/* Comment list */}
          <div className='mt-3 flex flex-col gap-3'>
            {comments.map((com) => (
              <div key={com._id} className='flex flex-col gap-1 border-b border-gray-200 pb-2'>
                <div className="flex items-center gap-2">
                  <div className='w-[35px] h-[35px] rounded-full overflow-hidden'>
                    <img src={com.user.profileImage || dp} alt="" className='h-full w-full object-cover' />
                  </div>
                  <div className='text-sm font-semibold'>{`${com.user.firstName} ${com.user.lastName}`}</div>
                </div>
                <div className='pl-[45px] text-sm text-gray-700'>{com.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Post;
