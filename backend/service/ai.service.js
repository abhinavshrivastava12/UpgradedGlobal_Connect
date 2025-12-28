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
    
    // ✅ Jobs
    if (lowerPrompt.includes("job") || lowerPrompt.includes("career") || lowerPrompt.includes("work") || lowerPrompt.includes("employment") || lowerPrompt.includes("hire")) {
        return "💼 **Finding Jobs on Global Connect:**\n\n1. Click on 'Jobs' in the navigation menu\n2. Use filters:\n   - Location\n   - Experience level\n   - Job type\n3. Browse job listings\n4. Click on a job to see full details\n5. Hit 'Apply' and submit your resume\n\n💡 Pro Tips:\n- Save jobs to apply later\n- Set up job alerts\n- Update your profile to attract recruiters\n\nNeed help with anything else?";
    }
    
    // ✅ Networking & Connections
    if (lowerPrompt.includes("connect") || lowerPrompt.includes("network") || lowerPrompt.includes("friend") || lowerPrompt.includes("people") || lowerPrompt.includes("connection")) {
        return "🤝 **Connecting with People on Global Connect:**\n\n1. Search for people using the search bar 🔍\n2. Visit their profile\n3. Click the 'Connect' button\n4. Add a personal message (recommended!)\n5. Send your connection request\n\n✨ More ways to connect:\n- Check 'People You May Know' suggestions\n- Connect with colleagues and classmates\n- Join groups in your industry\n\nWhat else can I help with?";
    }
    
    // ✅ Greetings
    if (lowerPrompt.match(/^(hi|hello|hey|greetings|sup|hola|namaste|dude|bro|what are you doing|wassup)$/i)) {
        return "Hello! 👋 Welcome to Global Connect!\n\nI'm your AI assistant, here to help you with:\n\n✨ Professional Networking\n💼 Job Opportunities\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n👤 Profile Management\n\nWhat would you like to know more about?";
    }
    
    // ✅ Default Response
    return "I'm here to help you with Global Connect! 🌟\n\nYou can ask me about:\n\n🤝 Networking & Connections\n💼 Finding Jobs\n💬 Messaging & Chat\n📝 Creating Posts\n📸 Sharing Stories\n📹 Video Calls\n👤 Profile Management\n\nWhat would you like to know?";
}

/* ================================
   MAIN FUNCTION - RETURNS STRING
================================ */
export default async function generateContent(prompt) {
  try {
    if (!prompt || typeof prompt !== "string") {
      return getFallbackResponse("");
    }

    // Rate limit: 1 request per 1.5 sec
    const now = Date.now();
    if (now - lastRequestTime < 1500) {
      console.log("⏱️ Rate limit hit, using fallback");
      return getFallbackResponse(prompt);
    }
    lastRequestTime = now;

    // If Gemini not available → fallback
    if (!model) {
      console.log("⚠️ Gemini not available, using fallback");
      return getFallbackResponse(prompt);
    }

    // ✅ Gemini call
    console.log("🤖 Calling Gemini AI for:", prompt);
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    console.log("✅ Gemini AI response generated successfully");
    console.log("✅ Reply type:", typeof reply);

    // ✅ ALWAYS RETURN STRING
    return String(reply);

  } catch (error) {
    console.error("❌ Gemini AI Error:", error.message);

    // Quota / rate limit from Gemini
    if (error?.status === 429) {
      return "I'm experiencing high traffic right now 🚦\n\nPlease try again in a few seconds. Meanwhile, I can still help you explore Global Connect features!\n\nWhat would you like to know about?";
    }

    // API key or authentication error
    if (error?.status === 401 || error?.status === 403) {
      console.warn("⚠️ Gemini API authentication error");
      return getFallbackResponse(prompt);
    }

    // Any other error → fallback
    return getFallbackResponse(prompt);
  }
}