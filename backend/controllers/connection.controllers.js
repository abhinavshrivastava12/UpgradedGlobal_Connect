import Connection from "../models/connection.model.js"
import User from "../models/user.model.js"
import {io,userSocketMap} from "../index.js"
import Notification from "../models/notification.model.js"

export const sendConnection= async (req,res)=>{
    try {
        let {id}=req.params
        let sender=req.userId
        let user=await User.findById(sender)

        if(sender==id){
            return res.status(400).json({message:"you can not send request yourself"})
        }

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        if(!user.connection){
            user.connection = []
        }

        if(user.connection.includes(id)){
            return res.status(400).json({message:"you are already connected"})
        }

        let existingConnection=await Connection.findOne({
            sender,
            receiver:id,
            status:"pending"
        })
        if(existingConnection){
            return res.status(400).json({message:"request already exist"})
        }

        let newRequest=await Connection.create({
            sender,
            receiver:id
        })

        let receiverSocketId=userSocketMap.get(id)
        let senderSocketId=userSocketMap.get(sender)

        if(receiverSocketId){
            io.to(receiverSocketId).emit("statusUpdate",{updatedUserId:sender,newStatus:"received"})
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate",{updatedUserId:id,newStatus:"pending"})
        }

        return res.status(200).json(newRequest)

    } 
    catch (error) {
        console.error("sendConnection error:", error)
        return res.status(500).json({message:`sendconnection error ${error.message}`}) 
    }
}

export const acceptConnection=async (req,res)=>{
    try {
        let {connectionId}=req.params
        let userId=req.userId
        let connection=await Connection.findById(connectionId)

        if(!connection){
            return res.status(400).json({message:"connection does not exist"})
        }
    
        if(connection.status!="pending"){
            return res.status(400).json({message:"request under process"})
        }

        connection.status="accepted"
        let notification=await Notification.create({
            receiver:connection.sender,
            type:"connectionAccepted",
            relatedUser:userId,
        })
        await connection.save()
        
        await User.findByIdAndUpdate(req.userId,{
            $addToSet:{connection:connection.sender._id}
        })
        await User.findByIdAndUpdate(connection.sender._id,{
            $addToSet:{connection:userId}
        })

        let receiverSocketId=userSocketMap.get(userId)
        let senderSocketId=userSocketMap.get(connection.sender._id.toString())

        if(receiverSocketId){
            io.to(receiverSocketId).emit("statusUpdate",{updatedUserId:connection.sender._id,newStatus:"disconnect"})
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate",{updatedUserId:userId,newStatus:"disconnect"})
        }

        return res.status(200).json({message:"connection accepted"})

    } catch (error) {
        console.error("acceptConnection error:", error)
        return res.status(500).json({message:`connection accepted error ${error.message}`})
    }
}

export const rejectConnection=async (req,res)=>{
    try {
        let {connectionId}=req.params
        let connection=await Connection.findById(connectionId)

        if(!connection){
            return res.status(400).json({message:"connection does not exist"})
        }
        if(connection.status!="pending"){
            return res.status(400).json({message:"request under process"})
        }

        connection.status="rejected"
        await connection.save()

        return res.status(200).json({message:"connection rejected"})

    } catch (error) {
        console.error("rejectConnection error:", error)
        return res.status(500).json({message:`connection rejected error ${error.message}`})
    }
}

export const getConnectionStatus = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.userId;

        let currentUser=await User.findById(currentUserId)
        
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if(!currentUser.connection){
            currentUser.connection = []
        }
        
        if (currentUser.connection.includes(targetUserId)) {
            return res.json({ status: "disconnect" });
        }

        const pendingRequest = await Connection.findOne({
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId },
            ],
            status: "pending",
        });

        if (pendingRequest) {
            if (pendingRequest.sender.toString() === currentUserId.toString()) {
                return res.json({ status: "pending" });
            } else {
                return res.json({ status: "received", requestId: pendingRequest._id });
            }
        }

        return res.json({ status: "Connect" });
    } catch (error) {
        console.error("getConnectionStatus error:", error);
        return res.status(500).json({ message: "getConnectionStatus error" });
    }
};

// ✅ FIXED: getCallStatus with better logging
export const getCallStatus = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.userId;

        console.log('📞 Checking call status:');
        console.log('   Current User:', currentUserId);
        console.log('   Target User:', targetUserId);
        console.log('   Online Users:', Array.from(userSocketMap.keys()));

        if (targetUserId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: "Cannot check call status with yourself"
            });
        }

        // ✅ Check if user is online
        const targetSocketId = userSocketMap.get(targetUserId);
        const isOnline = !!targetSocketId;

        console.log('   Target Socket ID:', targetSocketId);
        console.log('   Is Online:', isOnline);

        if (!isOnline) {
            return res.json({
                success: true,
                available: false,
                online: false,
                reason: "User is offline"
            });
        }

        // ✅ Check if connected
        let currentUser;
        try {
            currentUser = await User.findById(currentUserId);
        } catch (error) {
            console.error("Error finding current user:", error);
            return res.status(500).json({
                success: false,
                message: "Error checking user status"
            });
        }

        if(!currentUser.connection){
            currentUser.connection = []
        }

        const isConnected = currentUser.connection.includes(targetUserId);
        console.log('   Is Connected:', isConnected);

        // ✅ User is online and available for calls
        return res.json({
            success: true,
            available: true,
            online: true,
            connected: isConnected,
            socketId: targetSocketId, // For debugging
            lastSeen: new Date()
        });

    } catch (error) {
        console.error("getCallStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to check call availability"
        });
    }
};

export const removeConnection = async (req, res) => {
    try {
        const myId = req.userId;
        const otherUserId = req.params.userId;

        await User.findByIdAndUpdate(myId, { $pull: { connection: otherUserId } });
        await User.findByIdAndUpdate(otherUserId, { $pull: { connection: myId } });
      
        let receiverSocketId=userSocketMap.get(otherUserId)
        let senderSocketId=userSocketMap.get(myId)

        if(receiverSocketId){
            io.to(receiverSocketId).emit("statusUpdate",{updatedUserId:myId,newStatus:"connect"})
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("statusUpdate",{updatedUserId:otherUserId,newStatus:"connect"})
        }

        return res.json({ message: "Connection removed successfully" });
    } catch (error) {
        console.error("removeConnection error:", error)
        return res.status(500).json({ message: "removeConnection error" });
    }
};

export const getConnectionRequests = async (req, res) => {
    try {
        const userId = req.userId;

        const requests = await Connection.find({ receiver: userId, status: "pending" })
            .populate("sender", "firstName lastName email userName profileImage headline")

        return res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getConnectionRequests controller:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getUserConnections = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).populate(
            "connection",
            "firstName lastName userName profileImage headline connection"
        );

        return res.status(200).json(user?.connection || []);
    } catch (error) {
        console.error("Error in getUserConnections controller:", error);
        return res.status(500).json({ message: "Server error" });
    }
};