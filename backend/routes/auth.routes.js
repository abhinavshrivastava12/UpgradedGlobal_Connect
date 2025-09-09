import express from "express"
import { 
  sendSignUpOTP, 
  verifySignUpOTP, 
  sendLoginOTP, 
  verifyLoginOTP, 
  logOut,
  resendOTP
} from "../controllers/auth.controllers.js"

let authRouter = express.Router()

// SignUp routes
authRouter.post("/send-signup-otp", sendSignUpOTP)
authRouter.post("/verify-signup-otp", verifySignUpOTP)

// Login routes  
authRouter.post("/send-login-otp", sendLoginOTP)
authRouter.post("/verify-login-otp", verifyLoginOTP)

// Resend OTP
authRouter.post("/resend-otp", resendOTP)

// Logout
authRouter.get("/logout", logOut)

export default authRouter