import express from "express";
import { 
  acceptConnection, 
  getConnectionRequests, 
  getConnectionStatus, 
  getUserConnections, 
  rejectConnection, 
  removeConnection, 
  sendConnection,
  getCallStatus
} from "../controllers/connection.controllers.js";
import isAuth from "../middlewares/isAuth.js";

const connectionRouter = express.Router();

// Connection routes
connectionRouter.post("/send/:id", isAuth, sendConnection);
connectionRouter.put("/accept/:connectionId", isAuth, acceptConnection);
connectionRouter.put("/reject/:connectionId", isAuth, rejectConnection);
connectionRouter.get("/getstatus/:userId", isAuth, getConnectionStatus);
connectionRouter.get("/getStatus/:userId", isAuth, getConnectionStatus); // Alternate route
connectionRouter.delete("/remove/:userId", isAuth, removeConnection);
connectionRouter.get("/requests", isAuth, getConnectionRequests);
connectionRouter.get("/", isAuth, getUserConnections);

// Call status route
connectionRouter.get("/call-status/:userId", isAuth, getCallStatus);

export default connectionRouter;