import { GoogleGenerativeAI } from "@google/generative-ai";

/* ================================
   ENV CHECK
================================ */
const GEMINI_KEY = process.env.GOOGLE_GEMINI_KEY;

if (!GEMINI_KEY) {
  console.warn("⚠️ GOOGLE_GEMINI_KEY not found in environment variables");
  console.warn("⚠️ Gemini AI disabled → fallback responses will be used");
}

/* ================================
   INIT GEMINI (ONLY IF KEY EXISTS)
================================ */
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const model = genAI
  ? genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `
You are a friendly, knowledgeable AI assistant for the Global Connect platform.

Your responsibilities:
- Greet users politely
- Help with networking, jobs, chat, posts, stories, and profile management
- Guide users clearly and simply
- Keep responses short, helpful, and friendly (max 150 words)
- Use emojis to make responses engaging
- If unsure, guide users to platform features

Tone:
Professional, warm, and easy to understand.

Example greeting:
"Hi! 👋 I'm your Global Connect assistant. How can I help you today?"
      `,
    })
  : null;

/* ================================
   SIMPLE RATE LIMIT (ANTI-SPAM)
================================ */
let lastRequestTime = 0;

/* ================================
   IMPROVED FALLBACK FUNCTION
================================ */
function getFallbackResponse(prompt) {
    if (!prompt) {
        return "Hi! 👋 I'm your Global Connect assistant. I can help you with networking, jobs, messaging, and more. What would you like to know?";
    }

    const lowerPrompt = prompt.toLowerCase().trim();
    
    // ✅ Posts & Creating Content
    if (lowerPrompt.includes("post") || lowerPrompt.includes("create") || lowerPrompt.includes("publish") || lowerPrompt.includes("share")) {
        return "📝 **Creating a Post on Global Connect:**\n\n1. Click the '+ Share Your Thoughts' button on your feed\n2. Write your content in the text box\n3. Add images or videos (optional)\n4. Choose your audience (Public/Connections)\n5. Click 'Post' to share!\n\n💡 Tips:\n- Use hashtags to reach more people\n- Tag connections to notify them\n- You can edit or delete posts later\n\nWhat else would you like to know?";
    }
    
    // ✅ Stories
    if (lowerPrompt.includes("story") || lowerPrompt.includes("stories") || lowerPrompt.includes("status")) {
        return "📸 **Sharing Stories on Global Connect:**\n\n1. Click '+ Add Story' at the top of your feed\n2. Upload a photo or video (max 30 seconds)\n3. Add text, stickers, or filters if you want\n4. Choose who can see it (Public/Connections)\n5. Tap 'Share Story'\n\n⏰ Stories disappear after 24 hours!\n\n✨ Features:\n- See who viewed your story\n- Reply to others' stories\n- Save your stories before they expire\n\nAnything else you'd like to know?";
    }
    
    // ✅ Jobs
    if (lowerPrompt.includes("job") || lowerPrompt.includes("career") || lowerPrompt.includes("work") || lowerPrompt.includes("employment") || lowerPrompt.includes("hire")) {
        return "💼 **Finding Jobs on Global Connect:**\n\n1. Click on 'Jobs' in the navigation menu\n2. Use filters:\n   - Location\n   - Experience level\n   - Salary range\n   - Job type (Full-time, Part-time, Remote)\n3. Browse job listings\n4. Click on a job to see full details\n5. Hit 'Apply' and submit your resume\n\n💡 Pro Tips:\n- Save jobs to apply later\n- Set up job alerts\n- Update your profile to attract recruiters\n\nNeed help with anything else?";
    }
    
    // ✅ Networking & Connections
    if (lowerPrompt.includes("connect") || lowerPrompt.includes("network") || lowerPrompt.includes("friend") || lowerPrompt.includes("people") || lowerPrompt.includes("connection")) {
        return "🤝 **Connecting with People on Global Connect:**\n\n1. Search for people using the search bar 🔍\n2. Visit their profile\n3. Click the 'Connect' button\n4. Add a personal message (recommended!)\n5. Send your connection request\n\n✨ More ways to connect:\n- Check 'People You May Know' suggestions\n- Connect with colleagues and classmates\n- Join groups in your industry\n\nBuilding a strong network opens doors to opportunities! 🚀\n\nWhat else can I help with?";
    }
    
    // ✅ Messaging & Chat
    if (lowerPrompt.includes("message") || lowerPrompt.includes("chat") || lowerPrompt.includes("dm") || lowerPrompt.includes("text") || lowerPrompt.includes("talk")) {
        return "💬 **Using Messaging on Global Connect:**\n\n1. Click the 'Chat' icon in navigation\n2. Click 'New Message' to start\n3. Search for a connection\n4. Type your message and hit send!\n\n✨ Features:\n- Send images and files\n- Use emojis and GIFs\n- See when messages are read\n- Real-time notifications\n- Create group chats\n\n🔒 All messages are private and secure!\n\nNeed help with something else?";
    }
    
    // ✅ Profile Management
    if (lowerPrompt.includes("profile") || lowerPrompt.includes("edit") || lowerPrompt.includes("update") || lowerPrompt.includes("bio") || lowerPrompt.includes("skill")) {
        return "👤 **Managing Your Profile:**\n\n1. Click on your profile picture\n2. Select 'Edit Profile'\n3. Update:\n   - Profile photo & cover photo\n   - Headline and bio\n   - Work experience\n   - Education\n   - Skills & endorsements\n   - Location\n4. Click 'Save Changes'\n\n💡 A complete profile:\n- Gets more profile views\n- Attracts recruiters\n- Helps you connect with the right people\n\nWhat else would you like to know?";
    }
    
    // ✅ Video Calls
    if (lowerPrompt.includes("video") || lowerPrompt.includes("call") || lowerPrompt.includes("calling")) {
        return "📹 **Making Video Calls:**\n\n1. Go to 'Chat'\n2. Select a connection\n3. Click the 'Video Call' icon\n4. Wait for them to answer\n\n🎥 During the call:\n- Mute/unmute your microphone\n- Turn camera on/off\n- Share your screen (optional)\n- End call when done\n\n💡 Make sure you have a stable internet connection!\n\nAnything else I can help with?";
    }
    
    // ✅ Greetings
    if (lowerPrompt.match(/^(hi|hello|hey|greetings|sup|hola|namaste)$/i)) {
        return "Hello! 👋 Welcome to Global Connect!\n\nI'm your AI assistant, here to help you with:\n\n✨ Professional Networking\n💼 Job Opportunities\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n🔔 Notifications\n👤 Profile Management\n\nWhat would you like to know more about?";
    }
    
    // ✅ Help/Support
    if (lowerPrompt.includes("help") || lowerPrompt.includes("support") || lowerPrompt.includes("problem") || lowerPrompt.includes("issue") || lowerPrompt.includes("error")) {
        return "🆘 **Need Help?**\n\nI'm here to assist you! You can ask me about:\n\n• How to use features\n• Navigating the platform\n• Account settings\n• Troubleshooting issues\n• Privacy and security\n• Notifications\n\n💬 Just tell me what specific issue you're facing, and I'll guide you through it!\n\nWhat can I help you with?";
    }
    
    // ✅ Default Response
    return "I'm here to help you with Global Connect! 🌟\n\nYou can ask me about:\n\n🤝 Networking & Connections\n💼 Finding Jobs\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n📹 Video Calls\n👤 Profile Management\n🔔 Notifications\n\nWhat would you like to know? Just ask me anything!";
}

/* ================================
   MAIN FUNCTION
================================ */
export default async function generateContent(prompt) {
  try {
    if (!prompt || typeof prompt !== "string") {
      return {
        success: false,
        reply: getFallbackResponse(""),
        source: "fallback",
      };
    }

    // Rate limit: 1 request per 1.5 sec
    const now = Date.now();
    if (now - lastRequestTime < 1500) {
      console.log("⏱️ Rate limit hit, using fallback");
      return {
        success: false,
        reply: getFallbackResponse(prompt),
        source: "rate-limited",
      };
    }
    lastRequestTime = now;

    // If Gemini not available → fallback
    if (!model) {
      console.log("⚠️ Gemini not available, using fallback");
      return {
        success: false,
        reply: getFallbackResponse(prompt),
        source: "no-api",
      };
    }

    // ✅ Gemini call
    console.log("🤖 Calling Gemini AI for:", prompt);
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    console.log("✅ Gemini AI response generated successfully");

    return {
      success: true,
      reply,
      source: "gemini",
    };

  } catch (error) {
    console.error("❌ Gemini AI Error:", error.message);

    // Quota / rate limit from Gemini
    if (error?.status === 429) {
      return {
        success: false,
        reply: "I'm experiencing high traffic right now 🚦\n\nPlease try again in a few seconds. Meanwhile, I can still help you explore Global Connect features!\n\nWhat would you like to know about?",
        source: "gemini-rate-limited",
      };
    }

    // API key or authentication error
    if (error?.status === 401 || error?.status === 403) {
      console.warn("⚠️ Gemini API authentication error");
      return {
        success: false,
        reply: getFallbackResponse(prompt),
        source: "auth-error",
      };
    }

    // Any other error → fallback
    return {
      success: false,
      reply: getFallbackResponse(prompt),
      source: "error",
    };
  }
}