import Post from "../models/post.model.js"
import uploadOnCloudinary from "../config/cloudinary.js"
import { io } from "../index.js";
import Notification from "../models/notification.model.js";

export const createPost=async (req,res)=>{
    try {
        let {description}=req.body
        let newPost;
    if(req.file){
        let image=await uploadOnCloudinary(req.file.path)
            newPost=await Post.create({
                author:req.userId,
                description,
                image
        })
    }else{
        newPost=await Post.create({
            author:req.userId,
            description
        })
    }
return res.status(201).json(newPost)

    } catch (error) {
        return res.status(201).json(`create post error ${error}`)
    }
}


export const getPost=async (req,res)=>{
    try {
        const post=await Post.find()
        .populate("author","firstName lastName profileImage headline userName")
        .populate("comment.user","firstName lastName profileImage headline")
        .populate("repostOf")
        .sort({createdAt:-1})
        return res.status(200).json(post)
    } catch (error) {
        return res.status(500).json({message:"getPost error"})
    }
}

export const like =async (req,res)=>{
    try {
        let postId=req.params.id
        let userId=req.userId
        let post=await Post.findById(postId)
        if(!post){
            return res.status(400).json({message:"post not found"})
        }
        if(post.like.includes(userId)){
          post.like=post.like.filter((id)=>id!=userId)
        }else{
            post.like.push(userId)
            if(post.author!=userId){
                let notification=await Notification.create({
                    receiver:post.author,
                    type:"like",
                    relatedUser:userId,
                    relatedPost:postId
                })
            }
            
        }
        await post.save()
      io.emit("likeUpdated",{postId,likes:post.like})
        

      return res.status(200).json(post)

    } catch (error) {
      return res.status(500).json({message:`like error ${error}`}) 
    }
}

export const comment=async (req,res)=>{
    try {
        let postId=req.params.id
        let userId=req.userId
        let {content}=req.body

        let post=await Post.findByIdAndUpdate(postId,{
            $push:{comment:{content,user:userId}}
        },{new:true})
        .populate("comment.user","firstName lastName profileImage headline")
        if(post.author!=userId){
        let notification=await Notification.create({
            receiver:post.author,
            type:"comment",
            relatedUser:userId,
            relatedPost:postId
        })
    }
        io.emit("commentAdded",{postId,comm:post.comment})
        return res.status(200).json(post)

    } catch (error) {
        return res.status(500).json({message:`comment error ${error}`}) 
    }
}

export const repost = async (req, res) => {
    try {
        let postId = req.params.id;
        let userId = req.userId;
        
        const originalPost = await Post.findById(postId);
        if (!originalPost) {
            return res.status(404).json({ message: "Original post not found" });
        }

        const newRepost = await Post.create({
            author: userId,
            description: `Reposted a post from ${originalPost.author}`,
            repostOf: originalPost._id
        });

        const populatedRepost = await newRepost.populate("author", "firstName lastName profileImage headline userName");

        return res.status(201).json(populatedRepost);

    } catch (error) {
        return res.status(500).json({ message: `Repost error: ${error.message}` });
    }
};

// New controller function for deleting a post
export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const postToDelete = await Post.findById(postId);

        if (!postToDelete) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the user is the author of the post
        if (postToDelete.author.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }

        await Post.findByIdAndDelete(postId);

        return res.status(200).json({ message: "Post deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: `Delete post error: ${error.message}` });
    }
};
