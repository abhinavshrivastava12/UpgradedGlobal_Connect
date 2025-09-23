import dotenv from "dotenv";
dotenv.config();

import genToken from "../config/token.js";
import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Create Nodemailer transporter after dotenv loads env vars
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  secure: false,
  port: 587
});

console.log("Nodemailer Config - User:", process.env.EMAIL_USER);
console.log("Nodemailer Config - Pass:", process.env.EMAIL_PASS ? "******" : "undefined");

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP Email
export const sendOTPEmail = async (email, otp, type) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your ${type} OTP`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1A1F71; text-align: center;">OTP for Your Account</h2>
        <p style="font-size: 16px; color: #555;">Dear User,</p>
        <p style="font-size: 16px; color: #555;">Your One-Time Password for ${type} is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <h1 style="font-size: 32px; font-weight: bold; color: #1A1F71; letter-spacing: 5px; padding: 10px 20px; background-color: #f0f0f0; border-radius: 5px; display: inline-block;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes. Do not share this with anyone.</p>
        <p style="font-size: 16px; color: #555;">Thank you,<br/>The Connect Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new Error("Failed to send OTP email");
  }
};

// -------------------- Sign Up Routes --------------------
export const sendSignUpOTP = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;
    if (!firstName || !lastName || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save or update OTP in the database
    const newOTP = await OTP.findOneAndUpdate(
      { email, type: "signup" },
      { otp, otpExpiry, userData: req.body },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOTPEmail(email, otp, "Sign Up");

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("sendSignUpOTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifySignUpOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, type: "signup" });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or has expired" });
    }
    if (otpRecord.otp !== otp || otpRecord.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const userData = otpRecord.userData;
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await User.create({
      ...userData,
      password: hashedPassword,
      isEmailVerified: true,
    });

    await OTP.deleteOne({ email, type: "signup" });

    const token = await genToken(newUser._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // ✅ FIX: cookie ko common domain ke liye set karna
      domain: '.onrender.com', 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        _id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userName: newUser.userName,
      },
    });
  } catch (error) {
    console.error("verifySignUpOTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// -------------------- Login Routes --------------------
export const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await OTP.findOneAndUpdate(
      { email, type: "login" },
      { otp, otpExpiry },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOTPEmail(email, otp, "Login");

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("sendLoginOTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, type: "login" });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (otpRecord.otp !== otp || otpRecord.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await OTP.deleteOne({ email, type: "login" });

    const token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // ✅ FIX: cookie ko common domain ke liye set karna
      domain: '.onrender.com', 
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      }
    });
  } catch (error) {
    console.error("verifyLoginOTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// -------------------- Logout --------------------
export const logOut = (req, res) => {
  try {
    res.clearCookie("token", {
      secure: process.env.NODE_ENV === "production",
      // ✅ FIX: logout mein bhi domain specify karna
      domain: '.onrender.com', 
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logOut error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// -------------------- Resend OTP --------------------
export const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" });
    }
    const existingOTP = await OTP.findOne({ email, type });
    if (!existingOTP) {
      return res.status(400).json({ message: "No OTP request found" });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    existingOTP.otp = otp;
    existingOTP.otpExpiry = otpExpiry;
    await existingOTP.save();
    await sendOTPEmail(email, otp, type === "signup" ? "Sign Up" : "Login");
    return res.status(200).json({ message: "OTP resent successfully", email });
  } catch (error) {
    console.error("resendOTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};