import mongoose from "mongoose"

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  otpExpiry: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['signup', 'login'],
    required: true
  },
  userData: {
    firstName: String,
    lastName: String,
    userName: String,
    email: String,
    password: String
  }
}, { timestamps: true })

// Auto delete expired OTPs
otpSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 0 })

const OTP = mongoose.model("OTP", otpSchema)
export default OTP