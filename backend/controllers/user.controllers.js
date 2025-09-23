import uploadOnCloudinary from "../config/cloudinary.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";

// -------------------- Get Current User --------------------
export const getCurrentUser = async (req, res) => {
  try {
    const id = req.userId;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Get current user error" });
  }
};

// -------------------- Update Profile --------------------
export const updateProfile = async (req, res) => {
  try {
    let { firstName, lastName, userName, headline, location, gender } = req.body;

    let skills = req.body.skills ? JSON.parse(req.body.skills) : [];
    let education = req.body.education ? JSON.parse(req.body.education) : [];
    let experience = req.body.experience ? JSON.parse(req.body.experience) : [];

    let profileImage, coverImage;

    if (req.files?.profileImage) {
      profileImage = await uploadOnCloudinary(req.files.profileImage[0].path);
    }
    if (req.files?.coverImage) {
      coverImage = await uploadOnCloudinary(req.files.coverImage[0].path);
    }

    const updateData = {
      firstName,
      lastName,
      userName,
      headline,
      location,
      gender,
      skills,
      education,
      experience,
    };

    if (profileImage) updateData.profileImage = profileImage;
    if (coverImage) updateData.coverImage = coverImage;

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
    }).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Update profile error: ${error}` });
  }
};

// -------------------- Get Profile by Username --------------------
export const getprofile = async (req, res) => {
  try {
    const { userName } = req.params;
    const user = await User.findOne({ userName }).select("-password");
    if (!user) {
      return res.status(400).json({ message: "Username does not exist" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Get profile error: ${error}` });
  }
};

// -------------------- Search Users --------------------
export const search = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { userName: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `Search error: ${error}` });
  }
};

// -------------------- Suggested Users --------------------
export const getSuggestedUser = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).select("connection");

    const suggestedUsers = await User.find({
      _id: { $ne: req.userId, $nin: currentUser.connection },
    }).select("-password");

    return res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: `SuggestedUser error: ${error}` });
  }
};

// -------------------- User Stats (CORRECTED) --------------------
export const getUserStats = async (req, res) => {
  try {
    const userId = req.userId;

    const postsCount = await Post.countDocuments({ author: userId });
    const user = await User.findById(userId).select("followers following");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      posts: postsCount,
      followers: user.followers?.length || 0,
      following: user.following?.length || 0,
    });
  } catch (err) {
    console.error("Error fetching user stats:", err.message);
    res.status(500).json({ message: "Server error while fetching stats" });
  }
};