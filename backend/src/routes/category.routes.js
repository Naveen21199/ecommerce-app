import express from "express";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  singleCategory,
  updateCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post("/create-category", verifyJWT, isAdmin, createCategory);
router.put("/update-category/:id", verifyJWT, isAdmin, updateCategory);
router.get("/get-category", getAllCategory);
//single category
router.get("/single-category/:slug", singleCategory);
//delete cateogry
router.delete("/delete-category/:id", verifyJWT, isAdmin, deleteCategory);

export default router;
