import dotenv from "dotenv";
dotenv.config();

import genToken from "../config/token.js";
import User from "../models/user.model.js";
import OTP from "../models/otp.model.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// ✅ Enhanced transporter configuration with better error handling
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  secure: false, // Use TLS
  port: 587,
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2"
  },
  // Add timeout settings
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// ✅ Verify transporter configuration on startup
(async () => {
  try {
    console.log("🔍 Verifying email configuration...");
    console.log("📧 Email User:", process.env.EMAIL_USER || "❌ NOT SET");
    console.log("🔑 Email Pass:", process.env.EMAIL_PASS ? "✅ SET" : "❌ NOT SET");
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ CRITICAL: EMAIL_USER or EMAIL_PASS not set in environment variables!");
      console.error("⚠️  OTP emails will fail until these are configured.");
    } else {
      await transporter.verify();
      console.log("✅ Email transporter verified successfully!");
    }
  } catch (error) {
    console.error("❌ Email transporter verification failed:");
    console.error("Error:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Make sure EMAIL_USER is your Gmail address");
    console.error("2. Make sure EMAIL_PASS is a Gmail App Password (not your regular password)");
    console.error("3. Enable 2FA and create App Password at: https://myaccount.google.com/apppasswords");
    console.error("4. Check if 'Less secure app access' is enabled (if not using App Password)");
  }
})();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ✅ Enhanced email sending with better error handling
export const sendOTPEmail = async (email, otp, type) => {
  try {
    console.log(`📧 Attempting to send ${type} OTP to: ${email}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Email configuration missing. Check EMAIL_USER and EMAIL_PASS environment variables.");
    }

    const mailOptions = {
      from: {
        name: "Global Connect",
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `Your ${type} OTP - Global Connect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #24b2ff; text-align: center; margin-bottom: 30px;">🔐 Verify Your Account</h2>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="color: white; margin: 0 0 15px 0; font-size: 16px;">Your OTP Code</p>
              <div style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 5px 0;">⏱️ This OTP will expire in <strong>10 minutes</strong></p>
              <p style="color: #999; font-size: 12px; margin: 20px 0 0 0;">If you didn't request this, please ignore this email.</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-align: center; margin: 0;">
              Global Connect - Connecting the world, one call at a time
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
    
    // Provide specific error messages based on error type
    if (error.code === 'EAUTH') {
      throw new Error("Email authentication failed. Please check your Gmail App Password.");
    } else if (error.code === 'ESOCKET') {
      throw new Error("Network error. Please check your internet connection.");
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error("Email service timeout. Please try again.");
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
};

// ✅ SIGNUP OTP
export const sendSignUpOTP = async (req, res) => {
  try {
    console.log("📝 Sign up OTP request received");
    const { firstName, lastName, userName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check existing user
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists!" });
    }

    const existingUsername = await User.findOne({ userName });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists!" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Delete any existing OTP
    await OTP.findOneAndDelete({ email, type: "signup" });

    // Create new OTP record
    await OTP.create({
      email,
      otp,
      otpExpiry,
      userData: { firstName, lastName, userName, email, password: hashedPassword },
      type: "signup"
    });

    // Send OTP email
    await sendOTPEmail(email, otp, "Sign Up");

    console.log("✅ Sign up OTP sent successfully to:", email);
    return res.status(200).json({ 
      message: "OTP sent to your email", 
      email,
      success: true 
    });
  } catch (error) {
    console.error("❌ Error in sendSignUpOTP:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({ 
      message: error.message || "Failed to send OTP",
      success: false 
    });
  }
};

// ✅ VERIFY SIGNUP OTP
export const verifySignUpOTP = async (req, res) => {
  try {
    console.log("🔍 Verifying sign up OTP");
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
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Create user
    const user = await User.create(otpRecord.userData);
    await OTP.findOneAndDelete({ email, type: "signup" });

    // Generate token
    let token = await genToken(user._id);
    
    // Cookie configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "None" : "Lax",
      secure: isProduction
    };
    
    if (isProduction && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    res.cookie("token", token, cookieOptions);
    
    console.log("✅ User created successfully:", user.email);
    return res.status(201).json({
      message: "Account created successfully",
      token: token,
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      }
    });
  } catch (error) {
    console.error("❌ Error in verifySignUpOTP:", error.message);
    return res.status(500).json({ 
      message: "Verification failed",
      success: false 
    });
  }
};

// ✅ LOGIN OTP
export const sendLoginOTP = async (req, res) => {
  try {
    console.log("🔐 Login OTP request received");
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist!" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing login OTP
    await OTP.findOneAndDelete({ email, type: "login" });

    // Create new OTP record
    await OTP.create({ email, otp, otpExpiry, type: "login" });

    // Send OTP email
    await sendOTPEmail(email, otp, "Login");

    console.log("✅ Login OTP sent successfully to:", email);
    return res.status(200).json({ 
      message: "OTP sent to your email", 
      email,
      success: true 
    });
  } catch (error) {
    console.error("❌ Error in sendLoginOTP:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({ 
      message: error.message || "Failed to send OTP",
      success: false 
    });
  }
};

// ✅ VERIFY LOGIN OTP
export const verifyLoginOTP = async (req, res) => {
  try {
    console.log("🔍 Verifying login OTP");
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
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    await OTP.findOneAndDelete({ email, type: "login" });

    // Generate token
    let token = await genToken(user._id);
    
    // Cookie configuration
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "None" : "Lax",
      secure: isProduction
    };
    
    if (isProduction && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    res.cookie("token", token, cookieOptions);
    
    console.log("✅ User logged in successfully:", user.email);
    return res.status(200).json({
      message: "Login successful",
      token: token,
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      }
    });
  } catch (error) {
    console.error("❌ Error in verifyLoginOTP:", error.message);
    return res.status(500).json({ 
      message: "Login failed",
      success: false 
    });
  }
};

// ✅ RESEND OTP
export const resendOTP = async (req, res) => {
  try {
    console.log("🔄 Resend OTP request received");
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" });
    }

    if (!["signup", "login"].includes(type)) {
      return res.status(400).json({ message: "Invalid OTP type" });
    }

    const existingOTP = await OTP.findOne({ email, type });
    if (!existingOTP) {
      return res.status(400).json({ 
        message: "No OTP request found. Please start the process again." 
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    existingOTP.otp = otp;
    existingOTP.otpExpiry = otpExpiry;
    await existingOTP.save();

    // Send new OTP
    await sendOTPEmail(email, otp, type === "signup" ? "Sign Up" : "Login");

    console.log("✅ OTP resent successfully to:", email);
    return res.status(200).json({ 
      message: "OTP resent successfully", 
      email,
      success: true 
    });
  } catch (error) {
    console.error("❌ Error in resendOTP:", error.message);
    return res.status(500).json({ 
      message: error.message || "Failed to resend OTP",
      success: false 
    });
  }
};

// ✅ LOGOUT
export const logOut = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const clearOptions = {
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax"
    };
    
    if (isProduction && process.env.COOKIE_DOMAIN) {
      clearOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    res.clearCookie("token", clearOptions);
    console.log("✅ User logged out successfully");
    return res.status(200).json({ 
      message: "Logged out successfully",
      success: true 
    });
  } catch (error) {
    console.error("❌ Error in logOut:", error.message);
    return res.status(500).json({ 
      message: "Logout error",
      success: false 
    });
  }
};