import express from "express";
import {
  createPost,
  getPost,
  like,
  comment,
  repost,
  deletePost
} from "../controllers/post.Controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const postRouter = express.Router();

// Create post (with optional image)
postRouter.post("/create", isAuth, upload.single("image"), createPost);

// Get all posts
postRouter.get("/getpost", isAuth, getPost);

// Like post
postRouter.post("/like/:id", isAuth, like);

// Comment on post
postRouter.post("/comment/:id", isAuth, comment);

// Repost
postRouter.post("/repost/:id", isAuth, repost);

// Delete post
postRouter.delete("/delete/:id", isAuth, deletePost);

export default postRouter;