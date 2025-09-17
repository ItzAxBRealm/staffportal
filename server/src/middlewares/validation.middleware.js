import { ApiError } from "../utils/ApiError.js";

export const validateResource = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } 
  catch (error) {
    throw new ApiError(400, error.errors[0].message || "Invalid input data");
  }
};