import { Router } from "express";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import isAuth from "../middlewares/isAuth.js";

const router = Router();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// ✅ Startup validation
console.log('🔑 Agora Configuration:');
console.log('   APP_ID:', APP_ID ? '✅ Set' : '❌ Missing');
console.log('   CERTIFICATE:', APP_CERTIFICATE ? '✅ Set' : '❌ Missing');

// ✅ Generate Agora Token
router.post('/token', async (req, res) => {
  try {
    console.log('📞 Token request received');
    console.log('   Body:', req.body);
    
    const { channelName, userId } = req.body;
    
    // Validate channel name
    if (!channelName) {
      return res.status(400).json({ 
        success: false,
        message: 'Channel name is required' 
      });
    }

    // Validate Agora credentials
    if (!APP_ID || !APP_CERTIFICATE) {
      console.error('❌ Agora credentials not configured');
      return res.status(500).json({ 
        success: false,
        message: 'Agora not configured on server',
        details: {
          hasAppId: !!APP_ID,
          hasCertificate: !!APP_CERTIFICATE
        }
      });
    }

    // Generate numeric UID from string userId
    let numericUid;
    if (userId) {
      // Convert string to numeric UID
      const hash = userId.toString().split('').reduce((acc, char) => {
        acc = ((acc << 5) - acc) + char.charCodeAt(0);
        return acc & acc;
      }, 0);
      numericUid = Math.abs(hash) % 2147483647 || 1;
    } else {
      // Random UID if not provided
      numericUid = Math.floor(Math.random() * 2147483647) + 1;
    }

    console.log('   Generated UID:', numericUid);

    // Token parameters
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      numericUid,
      role,
      privilegeExpiredTs
    );

    console.log('✅ Token generated successfully');
    console.log('   Channel:', channelName);
    console.log('   UID:', numericUid);
    console.log('   Expires in:', expirationTimeInSeconds, 'seconds');

    return res.json({
      success: true,
      token: token,
      appId: APP_ID,
      channelName: channelName,
      uid: numericUid,
      expiresIn: expirationTimeInSeconds
    });

  } catch (error) {
    console.error('❌ Token generation error:', error);
    console.error('   Error details:', error.message);
    
    return res.status(500).json({ 
      success: false,
      message: 'Failed to generate token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ✅ Get Agora configuration (no token needed)
router.get('/config', (req, res) => {
  try {
    return res.json({
      success: true,
      appId: APP_ID,
      configured: !!(APP_ID && APP_CERTIFICATE),
      features: {
        videoCall: !!(APP_ID && APP_CERTIFICATE),
        screenShare: !!(APP_ID && APP_CERTIFICATE)
      }
    });
  } catch (error) {
    console.error('❌ Config error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to get config'
    });
  }
});

// ✅ Health check endpoint
router.get('/health', (req, res) => {
  const isHealthy = !!(APP_ID && APP_CERTIFICATE);
  
  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Agora Video Service',
    timestamp: new Date().toISOString()
  });
});

export default router;