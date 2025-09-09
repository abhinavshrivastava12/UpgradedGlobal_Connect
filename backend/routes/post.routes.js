import express from "express"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"
import { comment, createPost, getPost, like, repost, deletePost } from "../controllers/post.Controllers.js"
const postRouter=express.Router()

// Existing routes
postRouter.post("/create",isAuth,upload.single("image"),createPost)
postRouter.get("/getpost",isAuth,getPost)
postRouter.get("/like/:id",isAuth,like)
postRouter.post("/comment/:id",isAuth,comment)
postRouter.post("/repost/:id", isAuth, repost)

// New route for deleting a post
postRouter.delete("/delete/:id", isAuth, deletePost)

export default postRouter