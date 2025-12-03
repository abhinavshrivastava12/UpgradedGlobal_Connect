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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #24b2ff; text-align: center;">Verify Your Account</h2>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h3>Your OTP Code</h3>
          <div style="font-size: 32px; font-weight: bold; color: #24b2ff; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP will expire in 10 minutes</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Sign Up: Send OTP
export const sendSignUpOTP = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;
    if (!firstName || !lastName || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already exists!" });
    }
    if (await User.findOne({ userName })) {
      return res.status(400).json({ message: "Username already exists!" });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);
    await OTP.findOneAndDelete({ email, type: "signup" });
    await OTP.create({
      email,
      otp,
      otpExpiry,
      userData: { firstName, lastName, userName, email, password: hashedPassword },
      type: "signup"
    });
    await sendOTPEmail(email, otp, "Sign Up");
    return res.status(200).json({ message: "OTP sent to your email", email });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Sign Up: Verify OTP (Corrected)
export const verifySignUpOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const otpRecord = await OTP.findOne({ email, type: "signup" });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }
    if (new Date() > otpRecord.otpExpiry) {
      await OTP.findOneAndDelete({ email, type: "signup" });
      return res.status(400).json({ message: "OTP expired" });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const user = await User.create(otpRecord.userData);
    await OTP.findOneAndDelete({ email, type: "signup" });
    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
      domain: '.onrender.com'
    });
    return res.status(201).json({
      message: "Account created successfully",
      token: token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Verification failed" });
  }
};

// Login: Send OTP
export const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist!" });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await OTP.findOneAndDelete({ email, type: "login" });
    await OTP.create({ email, otp, otpExpiry, type: "login" });
    await sendOTPEmail(email, otp, "Login");
    return res.status(200).json({ message: "OTP sent to your email", email });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Login: Verify OTP (Corrected)
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const otpRecord = await OTP.findOne({ email, type: "login" });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }
    if (new Date() > otpRecord.otpExpiry) {
      await OTP.findOneAndDelete({ email, type: "login" });
      return res.status(400).json({ message: "OTP expired" });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    await OTP.findOneAndDelete({ email, type: "login" });
    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "None",
      secure: true,
      domain: '.onrender.com'
    });
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Login failed" });
  }
};

// Resend OTP
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
    console.log(error);
    return res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// Logout
export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      secure: true,
      sameSite: "None",
      domain: '.onrender.com',
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Logout error" });
  }
};