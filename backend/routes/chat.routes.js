import { Router } from "express";
import { getHistory, getInbox, markRead } from "../controllers/chat.controller.js";
import isAuth from "../middlewares/isAuth.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuth);

// GET /api/chat/history/:withUser - Get chat history with a specific user
router.get("/history/:withUser", getHistory);

// GET /api/chat/inbox - Get inbox (latest message per conversation)
router.get("/inbox", getInbox);

// PATCH /api/chat/read/:withUser - Mark messages as read
router.patch("/read/:withUser", markRead);

export default router;