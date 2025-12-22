import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key exists
if (!process.env.GOOGLE_GEMINI_KEY) {
    console.warn('⚠️ WARNING: GOOGLE_GEMINI_KEY not found in environment variables');
    console.warn('⚠️ AI chat will return fallback responses');
}

const genAI = process.env.GOOGLE_GEMINI_KEY 
    ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY)
    : null;

// Use gemini-pro model (better quota management)
const model = genAI ? genAI.getGenerativeModel({
    model: "gemini-pro",
    systemInstruction: `
        Role of AI: You are a friendly, knowledgeable, and interactive assistant for the Global Connect platform. Your goal is to guide users, answer questions, and help them navigate the website and its features efficiently.

Primary Responsibilities:
- Welcome Users: Greet new users politely and give a brief overview of the platform.
- Guide Navigation: Help users understand where to find different features.
- Answer Questions: Provide clear answers about website usage, features, and troubleshooting.
- Provide Suggestions & Tips: Give users helpful hints to enhance their experience.
- Handle Errors / Issues Gracefully: Provide guidance or contact information if users encounter problems.
- Keep Communication Friendly & Professional: Maintain a conversational tone, avoid jargon, and make users feel welcomed.

Default Greeting Example:
"Hi there! I'm your Global Connect guide. I can help you navigate the website, find jobs, connect with professionals, and make the most out of your experience here. What would you like to do today?"
    `
}) : null;

export default async function generateContent(prompt) {
    try {
        // If no API key, return a helpful fallback response
        if (!model) {
            return getFallbackResponse(prompt);
        }

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        console.log('✅ AI Response generated successfully');
        return response;
    } catch (error) {
        console.error('❌ AI Service Error:', error.message);
        
        // Handle quota exceeded
        if (error.status === 429) {
            return "I'm currently experiencing high traffic. Please try again in a few minutes. Meanwhile, feel free to explore Global Connect features like networking, job search, and messaging!";
        }
        
        // Handle other errors
        return getFallbackResponse(prompt);
    }
}

// Fallback responses when AI is not available
function getFallbackResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Greetings
    if (lowerPrompt.match(/\b(hi|hello|hey|greetings)\b/)) {
        return "Hello! 👋 Welcome to Global Connect! I'm here to help you with:\n\n✨ Professional Networking\n💼 Job Opportunities\n💬 Messaging & Chat\n📝 Creating Posts\n🔔 Notifications\n\nWhat would you like to know more about?";
    }
    
    // Jobs
    if (lowerPrompt.match(/\b(job|jobs|career|work|employment)\b/)) {
        return "Looking for jobs? 💼\n\nGlobal Connect offers:\n\n1. Browse job listings from top companies\n2. Apply directly with your resume\n3. Get job recommendations based on your skills\n4. Post job openings if you're a recruiter\n\nClick on 'Jobs' in the navigation menu to get started!";
    }
    
    // Networking
    if (lowerPrompt.match(/\b(connect|connection|network|friend|people)\b/)) {
        return "Want to expand your network? 🤝\n\nHere's how:\n\n1. Search for professionals in your field\n2. Send connection requests\n3. View connection suggestions\n4. Accept/reject incoming requests\n\nGo to 'My Networks' to manage your connections!";
    }
    
    // Messaging
    if (lowerPrompt.match(/\b(message|chat|talk|dm|text)\b/)) {
        return "Need to chat with someone? 💬\n\nGlobal Connect messaging features:\n\n1. Send text messages\n2. Share images\n3. Real-time chat\n4. Video calls with connections\n5. See online status\n\nClick on 'Chat' to start a conversation!";
    }
    
    // Posts
    if (lowerPrompt.match(/\b(post|share|publish|upload)\b/)) {
        return "Want to share something? 📝\n\nYou can:\n\n1. Create text posts\n2. Upload images\n3. Share your thoughts\n4. Get likes and comments\n5. Repost others' content\n\nClick the '+ Share Your Thoughts' button on the home page!";
    }
    
    // Profile
    if (lowerPrompt.match(/\b(profile|edit|update|bio|skills)\b/)) {
        return "Managing your profile? 👤\n\nYou can:\n\n1. Update profile picture\n2. Add headline and bio\n3. List your skills\n4. Add education & experience\n5. Set your location\n\nClick on your profile picture → 'Edit Profile'!";
    }
    
    // Stories
    if (lowerPrompt.match(/\b(story|stories|status)\b/)) {
        return "Want to share a story? 📸\n\nStories feature:\n\n1. Share photos or videos\n2. Stories expire after 24 hours\n3. See who viewed your story\n4. View stories from connections\n\nClick '+ Add Story' on the home page!";
    }
    
    // Video calls
    if (lowerPrompt.match(/\b(video|call|calling)\b/)) {
        return "Want to make a video call? 📹\n\nVideo calling features:\n\n1. Call any of your connections\n2. High-quality video & audio\n3. Mute/unmute controls\n4. Turn camera on/off\n\nGo to Chat → Select a connection → Click 'Video Call'!";
    }
    
    // Help/Support
    if (lowerPrompt.match(/\b(help|support|problem|issue|error)\b/)) {
        return "Need help? 🆘\n\nI'm here to assist! You can ask me about:\n\n• How to use features\n• Navigating the platform\n• Account settings\n• Troubleshooting\n\nWhat specific issue are you facing?";
    }
    
    // Default response
    return "I'm here to help you with Global Connect! 🌟\n\nYou can ask me about:\n\n🤝 Networking & Connections\n💼 Finding Jobs\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n📹 Video Calls\n👤 Profile Management\n\nWhat would you like to know?";
}