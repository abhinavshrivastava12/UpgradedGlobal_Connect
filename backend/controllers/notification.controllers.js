import Notification from "../models/notification.model.js"

export const getNotifications = async (req, res) => {
    try {
        console.log('📬 Fetching notifications for user:', req.userId);
        
        const notifications = await Notification.find({ receiver: req.userId })
            .populate("relatedUser", "firstName lastName profileImage userName")
            .populate("relatedPost", "image description")
            .sort({ createdAt: -1 }) // Latest first
            .lean(); // Better performance

        console.log('✅ Found notifications:', notifications.length);

        // ✅ Return array directly (frontend expects this)
        return res.status(200).json(notifications);
        
    } catch (error) {
        console.error('❌ Get notification error:', error);
        return res.status(500).json({ 
            message: `get notification error: ${error.message}` 
        });
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Deleting notification:', id);
        
        const deleted = await Notification.findOneAndDelete({
            _id: id,
            receiver: req.userId // Security: only delete own notifications
        });

        if (!deleted) {
            return res.status(404).json({ 
                message: "Notification not found or unauthorized" 
            });
        }

        console.log('✅ Notification deleted');
        
        return res.status(200).json({ 
            success: true,
            message: "Notification deleted successfully" 
        });
        
    } catch (error) {
        console.error('❌ Delete notification error:', error);
        return res.status(500).json({ 
            message: `delete notification error: ${error.message}` 
        });
    }
}

export const clearAllNotification = async (req, res) => {
    try {
        console.log('🗑️ Clearing all notifications for user:', req.userId);
        
        const result = await Notification.deleteMany({
            receiver: req.userId
        });

        console.log('✅ Deleted notifications:', result.deletedCount);
        
        return res.status(200).json({ 
            success: true,
            message: "All notifications deleted successfully",
            deletedCount: result.deletedCount
        });
        
    } catch (error) {
        console.error('❌ Clear all notifications error:', error);
        return res.status(500).json({ 
            message: `delete all notification error: ${error.message}` 
        });
    }
}