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
        
        console.log('✅ AI Response generated:', response ? 'Success' : 'Failed');
        
        res.json({ 
            success: true,
            reply: response || "I'm here to help! Ask me about Global Connect features like networking, jobs, messaging, and more!"
        });

    } catch (error) {
        console.error('❌ AI Controller Error:', error);
        
        // Always return a helpful response, never fail completely
        res.json({ 
            success: true,
            reply: "I'm here to help you with Global Connect! 🌟\n\nYou can ask me about:\n\n🤝 Networking & Connections\n💼 Finding Jobs\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n📹 Video Calls\n👤 Profile Management\n\nWhat would you like to know?"
        });
    }
};