import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import slugify from "slugify";

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    throw new ApiError(404, "Name is required");
  }
  const exisingCategory = await Category.findOne({ name });
  if (exisingCategory) {
    throw new ApiError(500, "Category already exists");
  }

  const category = await Category.create({
    name,
    slug: slugify(name),
  });

  return res
    .status(201)
    .json(new ApiResponse(200, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  const category = await Category.findByIdAndUpdate(
    id,
    { name, slug: slugify(name) },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

// fetch all category
const getAllCategory = asyncHandler(async (req, res) => {
  const category = await Category.find({});
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Fetched All Category"));
});

//sigle category
const singleCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  return res
    .status(200)
    .json(
      new ApiResponse(200, category, "Fetched single category successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Category.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Deleted category successfully"));
});

export {
  createCategory,
  updateCategory,
  getAllCategory,
  singleCategory,
  deleteCategory,
};
