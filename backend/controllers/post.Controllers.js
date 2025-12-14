import Post from "../models/post.model.js"
import uploadOnCloudinary from "../config/cloudinary.js"
import { io } from "../index.js";
import Notification from "../models/notification.model.js";

export const createPost = async (req, res) => {
    try {
        let { description } = req.body
        let newPost;
        
        if (req.file) {
            let image = await uploadOnCloudinary(req.file.path)
            newPost = await Post.create({
                author: req.userId,
                description,
                image
            })
        } else {
            newPost = await Post.create({
                author: req.userId,
                description
            })
        }
        
        await newPost.populate("author", "firstName lastName profileImage headline userName");
        return res.status(201).json(newPost)
    } catch (error) {
        console.error("Create post error:", error);
        return res.status(500).json({ message: `Create post error: ${error}` })
    }
}

export const getPost = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "firstName lastName profileImage headline userName")
            .populate("comment.user", "firstName lastName profileImage headline")
            .populate({
                path: "repostOf",
                populate: {
                    path: "author",
                    select: "firstName lastName profileImage headline userName"
                }
            })
            .sort({ createdAt: -1 });
        
        return res.status(200).json(posts);
    } catch (error) {
        console.error("Get posts error:", error);
        return res.status(500).json({ message: "Get posts error" });
    }
}

export const like = async (req, res) => {
    try {
        let postId = req.params.id
        let userId = req.userId
        let post = await Post.findById(postId)
        
        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }
        
        const userIdStr = userId.toString();
        const likeExists = post.like.some(id => id.toString() === userIdStr);
        
        if (likeExists) {
            post.like = post.like.filter((id) => id.toString() !== userIdStr)
        } else {
            post.like.push(userId)
            if (post.author.toString() !== userIdStr) {
                await Notification.create({
                    receiver: post.author,
                    type: "like",
                    relatedUser: userId,
                    relatedPost: postId
                })
            }
        }
        
        await post.save()
        io.emit("likeUpdated", { postId: postId, likes: post.like })
        return res.status(200).json(post)
    } catch (error) {
        console.error("Like error:", error);
        return res.status(500).json({ message: `Like error: ${error}` })
    }
}

export const comment = async (req, res) => {
    try {
        let postId = req.params.id
        let userId = req.userId
        let { content } = req.body

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content required" })
        }

        let post = await Post.findByIdAndUpdate(
            postId,
            { $push: { comment: { content: content.trim(), user: userId } } },
            { new: true }
        ).populate("comment.user", "firstName lastName profileImage headline")
        
        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        if (post.author.toString() !== userId.toString()) {
            await Notification.create({
                receiver: post.author,
                type: "comment",
                relatedUser: userId,
                relatedPost: postId
            })
        }
        
        io.emit("commentAdded", { postId: postId, comments: post.comment })
        return res.status(200).json(post)
    } catch (error) {
        console.error("Comment error:", error);
        return res.status(500).json({ message: `Comment error: ${error}` })
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

        const existingRepost = await Post.findOne({
            author: userId,
            repostOf: postId
        });

        if (existingRepost) {
            return res.status(400).json({ message: "Already reposted" });
        }

        const newRepost = await Post.create({
            author: userId,
            description: req.body.description || `Reposted`,
            repostOf: originalPost._id
        });

        await newRepost.populate("author", "firstName lastName profileImage headline userName");
        await newRepost.populate({
            path: "repostOf",
            populate: {
                path: "author",
                select: "firstName lastName profileImage headline userName"
            }
        });

        return res.status(201).json(newRepost);
    } catch (error) {
        console.error("Repost error:", error);
        return res.status(500).json({ message: `Repost error: ${error.message}` });
    }
};

export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId;

        const postToDelete = await Post.findById(postId);
        if (!postToDelete) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (postToDelete.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Post.findByIdAndDelete(postId);
        await Notification.deleteMany({ relatedPost: postId });
        io.emit("postDeleted", { postId });

        return res.status(200).json({ message: "Post deleted" });
    } catch (error) {
        console.error("Delete post error:", error);
        return res.status(500).json({ message: `Delete error: ${error.message}` });
    }
};