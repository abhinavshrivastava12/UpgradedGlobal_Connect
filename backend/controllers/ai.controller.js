import aiService from "../service/ai.service.js";

export const getRes = async (req, res) => {
    try {
        const code = req.body.code;

        if (!code) {
            return res.status(400).json({ 
                success: false,
                message: "Prompt is required" 
            });
        }

        console.log('📨 AI Request received:', code);

        // Always try to get a response (either from AI or fallback)
        const response = await aiService(code);
        
        console.log('✅ AI Service Response:', response);
        console.log('✅ Response type:', typeof response);
        
        // ✅ CRITICAL FIX: Extract text properly
        let replyText = "";
        
        if (typeof response === 'string') {
            replyText = response;
        } else if (response?.reply && typeof response.reply === 'string') {
            replyText = response.reply;
        } else if (response?.success && response.reply) {
            replyText = response.reply;
        } else if (response?.message && typeof response.message === 'string') {
            replyText = response.message;
        } else {
            replyText = "I'm here to help! Ask me about Global Connect features like networking, jobs, messaging, and more!";
        }
        
        console.log('✅ Final reply text:', replyText);
        console.log('✅ Reply text type:', typeof replyText);
        
        // ✅ ALWAYS return string in reply field
        res.json({ 
            success: true,
            reply: replyText
        });

    } catch (error) {
        console.error('❌ AI Controller Error:', error);
        
        // Always return a helpful response, never fail completely
        res.json({ 
            success: true,
            reply: "I'm here to help you with Global Connect! 🌟\n\nYou can ask me about:\n\n🤝 Networking & Connections\n💼 Finding Jobs\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n📹 Video Calls\n👤 Profile Management\n🔔 Notifications\n\nWhat would you like to know?"
        });
    }
};