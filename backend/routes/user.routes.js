import express from "express";
import {
  getCurrentUser,
  getprofile,
  getSuggestedUser,
  search,
  updateProfile,
  getUserStats,   // 👈 नया controller
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// Get current logged-in user
userRouter.get("/currentuser", isAuth, getCurrentUser);

// Update profile (with image upload)
userRouter.put(
  "/updateprofile",
  isAuth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateProfile
);

// Get profile by username
userRouter.get("/profile/:userName", isAuth, getprofile);

// Search users
userRouter.get("/search", isAuth, search);

// Suggested users
userRouter.get("/suggestedusers", isAuth, getSuggestedUser);

// ✅ User stats route (fixes frontend error)
userRouter.get("/stats", isAuth, getUserStats);

export default userRouter;
