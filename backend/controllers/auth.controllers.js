import genToken from "../config/token.js"
import User from "../models/user.model.js"
import OTP from "../models/otp.model.js"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer"
import crypto from "crypto"

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

console.log("Nodemailer Config - User:", process.env.EMAIL_USER); // Add this line
console.log("Nodemailer Config - Pass:", process.env.EMAIL_PASS); // Add this line

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP Email
const sendOTPEmail = async (email, otp, type) => {
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
  }
  
  await transporter.sendMail(mailOptions)
}

export const sendSignUpOTP = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body

    // Validation
    if (!firstName || !lastName || !userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" })
    }

    // Check if user already exists
    let existEmail = await User.findOne({ email })
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists!" })
    }

    let existUsername = await User.findOne({ userName })
    if (existUsername) {
      return res.status(400).json({ message: "Username already exists!" })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Store OTP and user data temporarily
    await OTP.findOneAndDelete({ email }) // Remove any existing OTP
    
    await OTP.create({
      email,
      otp,
      otpExpiry,
      userData: {
        firstName,
        lastName,
        userName,
        email,
        password: hashedPassword
      },
      type: 'signup'
    })

    // Send OTP email
    await sendOTPEmail(email, otp, 'Sign Up')

    return res.status(200).json({
      message: "OTP sent to your email",
      email: email
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Failed to send OTP" })
  }
}

export const verifySignUpOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" })
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, type: 'signup' })
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or expired" })
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.otpExpiry) {
      await OTP.findOneAndDelete({ email, type: 'signup' })
      return res.status(400).json({ message: "OTP expired" })
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    // Create user
    const user = await User.create(otpRecord.userData)

    // Delete OTP record
    await OTP.findOneAndDelete({ email, type: 'signup' })

    // Generate token
    let token = await genToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENVIRONMENT === "production"
    })

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email
      }
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Verification failed" })
  }
}

export const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User does not exist!" })
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP
    await OTP.findOneAndDelete({ email, type: 'login' }) // Remove any existing OTP
    
    await OTP.create({
      email,
      otp,
      otpExpiry,
      type: 'login'
    })

    // Send OTP email
    await sendOTPEmail(email, otp, 'Login')

    return res.status(200).json({
      message: "OTP sent to your email",
      email: email
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Failed to send OTP" })
  }
}

export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" })
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, type: 'login' })
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or expired" })
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.otpExpiry) {
      await OTP.findOneAndDelete({ email, type: 'login' })
      return res.status(400).json({ message: "OTP expired" })
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    // Delete OTP record
    await OTP.findOneAndDelete({ email, type: 'login' })

    // Generate token
    let token = await genToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENVIRONMENT === "production"
    })

    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email
      }
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Login failed" })
  }
}

export const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" })
    }

    // Find existing OTP record
    const existingOTP = await OTP.findOne({ email, type })
    if (!existingOTP) {
      return res.status(400).json({ message: "No OTP request found" })
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    // Update OTP
    existingOTP.otp = otp
    existingOTP.otpExpiry = otpExpiry
    await existingOTP.save()

    // Send OTP email
    await sendOTPEmail(email, otp, type === 'signup' ? 'Sign Up' : 'Login')

    return res.status(200).json({
      message: "OTP resent successfully",
      email: email
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Failed to resend OTP" })
  }
}

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token")
    return res.status(200).json({ message: "Logged out successfully" })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Logout error" })
  }
}