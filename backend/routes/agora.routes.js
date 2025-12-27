import { Router } from "express";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import isAuth from "../middlewares/isAuth.js";

const router = Router();

const APP_ID = process.env.AGORA_APP_ID || 'ef988355eaba4008a6ccf392a7302e8c';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// ✅ COMPLETELY FIXED TOKEN GENERATION
router.post('/token', isAuth, (req, res) => {
  try {
    const { channelName, userId } = req.body;
    
    console.log('🎥 Token request:', { channelName, userId });
    
    if (!channelName) {
      return res.status(400).json({ 
        success: false,
        message: 'Channel name is required' 
      });
    }

    const uid = req.userId || userId;
    if (!uid) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    let numericUserId;
    try {
      numericUserId = parseInt(uid.toString().slice(-8), 16) % 2147483647;
      if (numericUserId <= 0) {
        numericUserId = Math.abs(numericUserId) + 1;
      }
    } catch (error) {
      numericUserId = Math.abs(uid.toString().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) + 1;
    }

    console.log(`✅ Generated numeric UID: ${numericUserId}`);

    // ✅ CRITICAL: Always return valid JSON
    if (!APP_CERTIFICATE) {
      console.warn('⚠️ AGORA_APP_CERTIFICATE not set');
      
      return res.json({
        success: true,
        token: null,
        appId: APP_ID,
        channelName,
        uid: numericUserId,
        warning: 'Token generation disabled (no certificate)'
      });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      numericUserId,
      role,
      privilegeExpiredTs
    );

    console.log(`✅ Token generated for ${channelName}`);

    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid: numericUserId
    });

  } catch (error) {
    console.error('❌ Token generation error:', error);
    
    // ✅ ALWAYS return JSON
    res.status(500).json({ 
      success: false,
      message: 'Token generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
});

router.get('/config', isAuth, (req, res) => {
  res.json({
    success: true,
    appId: APP_ID,
    hasAppCertificate: !!APP_CERTIFICATE
  });
});

export default router;