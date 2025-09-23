import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isAuth = async (req, res, next) => {
    try {
        let token = null;
        
        console.log("Auth middleware - Checking authentication");
        console.log("Cookies:", req.cookies);
        console.log("Authorization header:", req.headers.authorization);
        
        // Try to get token from cookies first
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log("Token found in cookies");
        }
        
        // If no token in cookies, try Authorization header
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                console.log("Token found in Authorization header");
            }
        }
        
        if (!token) {
            console.log("No token found in cookies or headers");
            return res.status(401).json({ message: "No authentication token provided" });
        }
        
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!verifyToken) {
            return res.status(401).json({ message: "Invalid authentication token" });
        }
        
        console.log("Token verified successfully for user:", verifyToken.userId);
        req.userId = verifyToken.userId;
        req.user = verifyToken;
        next();
    } catch (error) {
        console.log("Auth middleware error:", error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token format" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired" });
        }
        
        return res.status(500).json({ message: "Authentication error" });
    }
};

export default isAuth;