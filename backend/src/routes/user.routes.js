import express from "express";
import {
  allOrders,
  forgotPasswordController,
  getOrders,
  loginUser,
  orderStatus,
  registerUser,
  testController,
  updateProfile,
} from "../controllers/user.controller.js";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = express();
//register
router.post("/register", registerUser);
//login
router.post("/login", loginUser);

// forget password
router.post("/forgot-password", forgotPasswordController);

//test
router.get("/test", verifyJWT, isAdmin, testController);

// protected user routes
router.get("/user-auth", verifyJWT, (req, res) => {
  res.status(200).send({ ok: true });
});
// protected admin routes
router.get("/admin-auth", verifyJWT, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

// update profile
router.put("/profile", verifyJWT, updateProfile);

//orders
router.get("/orders", verifyJWT, getOrders);
//all orders
router.get("/all-orders", verifyJWT, isAdmin, allOrders);

//order status update
router.put("/order-status/:orderId", verifyJWT, isAdmin, orderStatus);

export default router;
