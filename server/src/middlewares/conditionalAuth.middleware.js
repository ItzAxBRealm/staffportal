import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const allowOnlyIfNoAdminExists = asyncHandler(async (req, res, next) => {
    try {
        const adminExists = await User.exists({ isAdmin: true });
        if (!adminExists) {
            console.log("No admin users exist yet. Allowing public registration.");
            return next();
        }
        
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Registration restricted. Please login as admin.");
        }
        
        try {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id);
            if (!user || !user.isAdmin) {
                throw new ApiError(403, "Only administrators can register new users");
            }
            req.user = user;
            next();
            
        } 
        catch (error) {
            throw new ApiError(401, "Invalid or expired token. Admin access required.");
        }

    } 
    catch (error) {
        next(error);
    }
});
