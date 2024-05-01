import { Order } from "../models/oder.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address, answer } = req.body;

  if (
    [name, email, password, address, phone, answer].some(
      (item) => item.trim() === ""
    )
  ) {
    throw new ApiError(404, "Please provide all fields");
  }

  //check user
  const existingUser = await User.findOne({ email });

  //existing User
  if (existingUser) {
    throw new ApiError(404, "User is registered with this email address");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    answer,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User registered successfully"));
});

// login controller
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(404, "Invalid email or password");
  }

  //check user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError("404", "Email not registered");
  }

  const isValidPassword = await user.isPasswordCorrect(password);
  if (!isValidPassword) {
    throw new ApiError(404, "Invalid user credentials");
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { user, token }, "User login successfully"));
});

//test
const testController = asyncHandler(async (req, res) => {
  res.send("Protected routes");
});

//forgot password
const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email, answer, newPassword } = req.body;

  if ([email, answer].some((item) => item.trim() === "")) {
    throw new ApiError(404, "Please provide all fields");
  }
  if (!newPassword) {
    throw new ApiError(404, "Please provide all fields");
  }

  // check
  const user = await User.findOne({ email, answer });
  if (!user) {
    throw new ApiError(404, "Wrong Email Or Answer");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

//update controller
const updateProfile = asyncHandler(async (req, res) => {
  const { name, address, phone } = req.body;
  const user = await User.findById(req.user._id);

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address,
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

// get orders
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user._id })
    .populate("products", "-photo")
    .populate("buyer", "name");
  return res.status(200).json(orders);
});
// get all orders
const allOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("products", "-photo")
    .populate("buyer", "name")
    .sort({ createdAt: -1 });
  return res.status(200).json(orders);
});

//order status
const orderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const orders = await Order.findByIdAndUpdate(
    orderId,
    { status },
    {
      new: true,
    }
  );
  return res.status(200).json(orders);
});
export {
  registerUser,
  loginUser,
  testController,
  forgotPasswordController,
  updateProfile,
  getOrders,
  allOrders,
  orderStatus,
};
