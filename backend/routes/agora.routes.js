import { Router } from "express";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import isAuth from "../middlewares/isAuth.js";

const router = Router();

const APP_ID = process.env.AGORA_APP_ID || '04d8a9031217470bb3b5c0d6b7a0db55';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// POST /api/agora/token - Generate Agora Token
router.post('/token', isAuth, (req, res) => {
  try {
    const { channelName, userId } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ 
        success: false,
        message: 'Channel name is required' 
      });
    }

    // Use authenticated user ID from middleware, fallback to provided userId
    const uid = req.userId || userId;
    if (!uid) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    // Convert to integer for Agora (use last 8 digits of user ID hash)
    let numericUserId;
    try {
      numericUserId = parseInt(uid.toString().slice(-8), 16) % 2147483647;
      // Ensure it's positive and not zero
      if (numericUserId <= 0) {
        numericUserId = Math.abs(numericUserId) + 1;
      }
    } catch (error) {
      // Fallback: use a hash of the user ID
      numericUserId = Math.abs(uid.toString().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) + 1;
    }

    console.log(`Generating token for user ${uid} -> numeric ID: ${numericUserId}`);

    // If no app certificate, return without token (for testing)
    if (!APP_CERTIFICATE) {
      console.warn('⚠️ AGORA_APP_CERTIFICATE not found in environment variables');
      console.warn('⚠️ For production, you MUST set AGORA_APP_CERTIFICATE');
      console.warn('⚠️ Returning null token for testing - this will not work for actual calls');
      
      return res.json({
        success: true,
        token: null, // No token without certificate
        appId: APP_ID,
        channelName,
        uid: numericUserId,
        warning: 'No app certificate configured - token generation disabled'
      });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      numericUserId,
      role,
      privilegeExpiredTs
    );

    console.log(`✅ Generated Agora token for user ${uid} in channel ${channelName}`);

    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid: numericUserId
    });

  } catch (error) {
    console.error('❌ Agora token generation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/agora/config - Get Agora Configuration
router.get('/config', isAuth, (req, res) => {
  res.json({
    success: true,
    appId: APP_ID,
    hasAppCertificate: !!APP_CERTIFICATE,
    certificateStatus: APP_CERTIFICATE ? 'configured' : 'missing'
  });
});

export default router;