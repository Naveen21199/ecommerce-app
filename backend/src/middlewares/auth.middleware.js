import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const decode = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
  const user = await User.findById(decode?._id).select("-password");
  req.user = user;
  next();
});

export const isAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.role !== 1) {
    throw new ApiError(401, "Unauthorized access");
  } else {
    next();
  }
});
