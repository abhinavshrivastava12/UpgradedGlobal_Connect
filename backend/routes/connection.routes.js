import express from "express"
import { 
    acceptConnection, 
    getConnectionRequests, 
    getConnectionStatus, 
    getUserConnections, 
    rejectConnection, 
    removeConnection, 
    sendConnection 
} from "../controllers/connection.controllers.js"
import isAuth from "../middlewares/isAuth.js"

let connectionRouter = express.Router()

// Existing connection routes
connectionRouter.post("/send/:id", isAuth, sendConnection)
connectionRouter.put("/accept/:connectionId", isAuth, acceptConnection)
connectionRouter.put("/reject/:connectionId", isAuth, rejectConnection)
connectionRouter.get("/getstatus/:userId", isAuth, getConnectionStatus)
connectionRouter.delete("/remove/:userId", isAuth, removeConnection)
connectionRouter.get("/requests", isAuth, getConnectionRequests)
connectionRouter.get("/", isAuth, getUserConnections)

// Add the route that the frontend is looking for (for call availability)
connectionRouter.get("/getStatus/:userId", isAuth, getConnectionStatus)

export default connectionRouter