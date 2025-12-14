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

        console.log('AI Request received:', code);

        // Check if AI is disabled
        if (!process.env.GOOGLE_GEMINI_KEY) {
            return res.json({ 
                success: true,
                reply: "AI service is currently unavailable. Please try again later or contact support for assistance." 
            });
        }

        const response = await aiService(code);
        
        console.log('AI Response generated:', response ? 'Success' : 'Failed');
        
        res.json({ 
            success: true,
            reply: response 
        });

    } catch (error) {
        console.error('AI Controller Error:', error);
        
        // Handle quota exceeded error
        if (error.status === 429) {
            return res.json({ 
                success: true,
                reply: "I'm currently experiencing high traffic. Please try again in a few minutes. Meanwhile, feel free to explore Global Connect features!" 
            });
        }
        
        // Fallback response
        res.json({ 
            success: true,
            reply: "I apologize, but I'm having trouble responding right now. However, I can tell you that Global Connect offers professional networking, job opportunities, messaging, and more. How can I assist you today?" 
        });
    }
};