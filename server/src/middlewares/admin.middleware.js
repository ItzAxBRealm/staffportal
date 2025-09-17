import { ApiError } from "../utils/ApiError.js";

export const isAdmin = (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      throw new ApiError(401, "Authentication required");
    }

    if (!user.isAdmin){
      throw new ApiError(403, "Admin access required");
    }
    next();
  } 
  catch (error) {
    next(error);
  }
};
