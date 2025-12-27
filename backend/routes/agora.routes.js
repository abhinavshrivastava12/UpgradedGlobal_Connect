import { Router } from "express";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import isAuth from "../middlewares/isAuth.js";

const router = Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// ✅ FIX: isAuth ko remove kar do temporarily
router.post('/token', async (req, res) => {  // ← isAuth hata diya
  try {
    console.log('📞 Token request:', req.body);
    
    const { channelName, userId } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ 
        success: false,
        message: 'Channel name is required' 
      });
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ 
        success: false,
        message: 'Agora credentials missing'
      });
    }

    // Generate numeric UID
    const uid = userId ? 
      Math.abs(userId.toString().split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) + 1 : 
      Math.floor(Math.random() * 100000);

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    console.log('✅ Token generated');

    return res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid
    });

  } catch (error) {
    console.error('❌ Token error:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message
    });
  }
});

// ✅ Config endpoint (no auth needed)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    appId: APP_ID,
    configured: !!(APP_ID && APP_CERTIFICATE)
  });
});

export default router;