import Message from "../models/Message.js";
import { Types } from "mongoose";

export const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const withUser = req.params.withUser;
    
    if (!userId || !withUser) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required parameters" 
      });
    }

    // ✅ OPTIMIZATION: Smaller default limit for faster loading
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "30", 10), 1), 100);
    const skip = (page - 1) * limit;

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

    // ✅ OPTIMIZATION: Use lean() for faster queries
    const [items, total] = await Promise.all([
      Message.find(filter)
        .populate('from', 'firstName lastName userName profileImage')
        .populate('to', 'firstName lastName userName profileImage')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments(filter)
    ]);

    const processedItems = items.reverse().map(item => ({
      ...item,
      from: {
        _id: item.from._id.toString(),
        firstName: item.from.firstName,
        lastName: item.from.lastName,
        userName: item.from.userName,
        profileImage: item.from.profileImage
      },
      to: {
        _id: item.to._id.toString(),
        firstName: item.to.firstName,
        lastName: item.to.lastName,
        userName: item.to.userName,
        profileImage: item.to.profileImage
      }
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

export const getInbox = async (req, res) => {
  try {
    const userId = req.userId;

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

    // ✅ OPTIMIZATION: More efficient aggregation pipeline
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
      { $sort: { "lastMessage.timestamp": -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
          // ✅ OPTIMIZATION: Only fetch needed fields
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                userName: 1,
                profileImage: 1,
                headline: 1
              }
            }
          ]
        }
      },
      { $unwind: "$userInfo" }
    ];

    const rows = await Message.aggregate(pipeline);
    
    const processedRows = rows.map(row => ({
      _id: row._id.toString(),
      lastMessage: {
        ...row.lastMessage,
        from: row.lastMessage.from.toString(),
        to: row.lastMessage.to.toString(),
      },
      unread: row.unread,
      userInfo: {
        _id: row.userInfo._id.toString(),
        firstName: row.userInfo.firstName,
        lastName: row.userInfo.lastName,
        userName: row.userInfo.userName,
        profileImage: row.userInfo.profileImage,
        headline: row.userInfo.headline
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

export const markRead = async (req, res) => {
  try {
    const userId = req.userId;
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