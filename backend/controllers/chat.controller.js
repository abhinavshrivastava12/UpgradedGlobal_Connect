import Message from "../models/Message.js";
import { Types } from "mongoose";

/**
 * GET /api/chat/history/:withUser?page=1&limit=30
 * Returns paginated DM history (both directions) with a specific user
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId; // From isAuth middleware
    const withUser = req.params.withUser;
    
    if (!userId || !withUser) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters" 
      });
    }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "30", 10), 1), 100);
    const skip = (page - 1) * limit;

    // Ensure we're working with valid ObjectIds
    let userObjectId, withUserObjectId;
    
    try {
      userObjectId = new Types.ObjectId(userId);
      withUserObjectId = new Types.ObjectId(withUser);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid user ID format" 
      });
    }

    const filter = {
      $or: [
        { from: userObjectId, to: withUserObjectId },
        { from: withUserObjectId, to: userObjectId }
      ]
    };

    const [items, total] = await Promise.all([
      Message.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance
      Message.countDocuments(filter)
    ]);

    // Convert ObjectIds to strings for consistency with frontend
    const processedItems = items.reverse().map(item => ({
      ...item,
      from: item.from.toString(),
      to: item.to.toString(),
    }));

    res.json({
      success: true,
      page, 
      limit, 
      total,
      items: processedItems
    });
  } catch (err) {
    console.error("getHistory error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch chat history" 
    });
  }
};

/**
 * GET /api/chat/inbox
 * Returns latest message per conversation partner for current user
 */
export const getInbox = async (req, res) => {
  try {
    const userId = req.userId; // From isAuth middleware

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    let userObjectId;
    try {
      userObjectId = new Types.ObjectId(userId);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid user ID format" 
      });
    }

    const pipeline = [
      {
        $match: {
          $or: [
            { from: userObjectId },
            { to: userObjectId }
          ]
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$from", userObjectId] }, "$to", "$from"]
          }
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" },
          unread: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$to", userObjectId] }, 
                    { $eq: ["$readAt", null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ];

    const rows = await Message.aggregate(pipeline);
    
    // Process the results to convert ObjectIds to strings
    const processedRows = rows.map(row => ({
      ...row,
      _id: row._id.toString(),
      lastMessage: {
        ...row.lastMessage,
        from: row.lastMessage.from.toString(),
        to: row.lastMessage.to.toString(),
      }
    }));

    res.json({
      success: true,
      data: processedRows
    });
  } catch (err) {
    console.error("getInbox error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch inbox" 
    });
  }
};

/**
 * PATCH /api/chat/read/:withUser
 * Marks messages from :withUser to me as read
 */
export const markRead = async (req, res) => {
  try {
    const userId = req.userId; // From isAuth middleware
    const withUser = req.params.withUser;

    if (!userId || !withUser) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters" 
      });
    }

    let userObjectId, withUserObjectId;
    try {
      userObjectId = new Types.ObjectId(userId);
      withUserObjectId = new Types.ObjectId(withUser);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid user ID format" 
      });
    }

    const result = await Message.updateMany(
      { 
        from: withUserObjectId, 
        to: userObjectId, 
        readAt: null 
      },
      { $set: { readAt: new Date() } }
    );

    res.json({ 
      success: true,
      updated: result.modifiedCount 
    });
  } catch (err) {
    console.error("markRead error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to mark as read" 
    });
  }
};