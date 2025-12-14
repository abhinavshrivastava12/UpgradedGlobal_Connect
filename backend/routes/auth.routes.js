import express from 'express';
import {
  sendSignUpOTP,
  verifySignUpOTP,
  sendLoginOTP,
  verifyLoginOTP,
  resendOTP,
  logOut
} from '../controllers/auth.controllers.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

// Signup routes
router.post('/send-signup-otp', sendSignUpOTP);
router.post('/verify-signup-otp', verifySignUpOTP);

// Login routes
router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

// Resend OTP
router.post('/resend-otp', resendOTP);

// Logout
router.get('/logout', isAuth, logOut);

// Get current user (for auth check)
router.get('/me', isAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
});

export default router;