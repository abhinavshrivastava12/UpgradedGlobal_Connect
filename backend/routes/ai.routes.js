import express from 'express';
import { protect } from '../middlewares/isAuth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
let genAI;
if (process.env.GOOGLE_GEMINI_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_KEY);
}

// Generate post content
router.post('/generate-post', protect, async (req, res) => {
  try {
    if (!process.env.GOOGLE_GEMINI_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GOOGLE_GEMINI_KEY to .env'
      });
    }

    const { prompt, tone = 'casual' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const fullPrompt = `Create a ${tone} social media post about: ${prompt}. 
    Keep it under 280 characters, engaging, and suitable for Twitter/X. 
    Don't use hashtags unless specifically requested.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      content: text.trim()
    });
  } catch (error) {
    console.error('AI generate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message
    });
  }
});

// Generate poll options
router.post('/generate-poll', protect, async (req, res) => {
  try {
    if (!process.env.GOOGLE_GEMINI_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GOOGLE_GEMINI_KEY to .env'
      });
    }

    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create 4 poll options for the topic: "${topic}". 
    Return ONLY a JSON array of strings, nothing else. Each option should be short (max 25 characters).
    Example format: ["Option 1", "Option 2", "Option 3", "Option 4"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const options = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      options
    });
  } catch (error) {
    console.error('AI poll generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate poll options',
      error: error.message
    });
  }
});

// Improve post text
router.post('/improve-post', protect, async (req, res) => {
  try {
    if (!process.env.GOOGLE_GEMINI_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GOOGLE_GEMINI_KEY to .env'
      });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Improve this social media post to make it more engaging and clear: "${text}"
    Keep the same general meaning but make it more compelling. Keep it under 280 characters.
    Return only the improved text, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedText = response.text();

    res.json({
      success: true,
      content: improvedText.trim()
    });
  } catch (error) {
    console.error('AI improve error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to improve content',
      error: error.message
    });
  }
});

// Generate quiz questions
router.post('/generate-quiz', protect, async (req, res) => {
  try {
    if (!process.env.GOOGLE_GEMINI_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GOOGLE_GEMINI_KEY to .env'
      });
    }

    const { topic, difficulty = 'medium' } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create a ${difficulty} difficulty multiple choice quiz question about: "${topic}".
    Return ONLY a JSON object with this exact format:
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
    The correctAnswer should be the index (0-3) of the correct option.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const quiz = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('AI quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz',
      error: error.message
    });
  }
});

// Chat with AI
router.post('/chat', protect, async (req, res) => {
  try {
    if (!process.env.GOOGLE_GEMINI_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please add GOOGLE_GEMINI_KEY to .env'
      });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      response: text
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to chat with AI',
      error: error.message
    });
  }
});

export default router;