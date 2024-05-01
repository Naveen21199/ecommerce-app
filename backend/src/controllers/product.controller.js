import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import { Order } from "../models/oder.model.js";

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MARCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

//create product
const createProduct = asyncHandler(async (req, res) => {
  let { name, slug, description, price, category, quantity, shipping } =
    req.fields;
  const { photo } = req.files;
  switch (true) {
    case !name:
      throw new ApiError(404, "Name is required");
    case !description:
      throw new ApiError(404, "Description is required");
    case !price:
      throw new ApiError(404, "Price is required");
    case !category:
      throw new ApiError(404, "Category is required");
    case !quantity:
      throw new ApiError(404, "Quantity is required");
    case !photo && photo.size > 1000000:
      // case !photo && photo > 1000000:
      throw new ApiError(404, "Photo is required and should be less than 1MB");
  }

  const product = await Product.create({
    name,
    slug: slugify(name),
    description,
    price,
    category,
    quantity,
    shipping,
  });
  if (photo) {
    product.photo.data = fs.readFileSync(photo.path);
    product.photo.contentType = photo.type;
  }
  await product.save();
  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

//fetch all products
const getAllProduct = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate("category")
    .select("-photo")
    // .limit(2)
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

//fetch single product
const getSingleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .select("-photo")
    .populate("category");

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Single Product Fetched successfully"));
});

//get photo
const getProductPhoto = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.pid).select("photo");

  if (product.photo.data) {
    res.set("Content-Type", product.photo.contentType);
    res.status(200).send(product.photo.data);
    // .json(
    //   new ApiResponse(200, product.photo.data, "fetched photo successfully")
    // );
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.pid).select("-photo");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "delete product successfully"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const { name, slug, description, price, category, quantity } = req.fields;
  const { photo } = req.files;
  switch (true) {
    case !name:
      throw new ApiError(404, "Name is required");
    case !description:
      throw new ApiError(404, "Description is required");
    case !price:
      throw new ApiError(404, "Price is required");
    case !category:
      throw new ApiError(404, "Category is required");
    case !quantity:
      throw new ApiError(404, "Quantity is required");
    case photo && photo.size > 1000000:
      throw new ApiError(404, "Photo is required and should be less than 1MB");
  }

  const product = await Product.findByIdAndUpdate(
    req.params.pid,
    {
      ...req.fields,
      slug: slugify(name),
    },
    {
      new: true,
    }
  );

  if (photo) {
    product.photo.data = fs.readFileSync(photo.path);
    product.photo.contentType = photo.type;
  }
  await product.save();
  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product Updated successfully"));
});

//filter
const productFilter = asyncHandler(async (req, res) => {
  const { checked, radio } = req.body;
  let args = {};
  if (checked.length > 0) args.category = checked;
  if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
  const products = await Product.find(args);
  return res.status(200).json(new ApiResponse(200, products, ""));
});
const productCount = asyncHandler(async (req, res) => {
  const total = await Product.find({}).estimatedDocumentCount();
  return res.status(200).json(new ApiResponse(200, total, ""));
});

//product list base on page
const productList = asyncHandler(async (req, res) => {
  const perPage = 2;
  const page = req.params.page ? req.params.page : 1;
  const product = await Product.find({})
    .select("-photo")
    .skip((page - 1) * perPage)
    .limit(perPage)
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, product, ""));
});

// search product
const searchProduct = asyncHandler(async (req, res) => {
  const { keyword } = req.params;
  const result = await Product.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  }).select("-photo");

  return res.status(200).json(new ApiResponse(200, result));
});

const relatedProduct = asyncHandler(async (req, res) => {
  const { pid, cid } = req.params;
  const product = await Product.find({
    category: cid,
    _id: { $ne: pid },
  })
    .select("-photo")
    .limit(3)
    .populate("category");

  return res.status(200).json(new ApiResponse(200, product));
});

//product category
const productCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  const product = await Product.find({ category }).populate("category");
  return res.status(200).json(new ApiResponse(200, { category, product }));
});

//payment getway api
//tokne

const braintreeToken = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
const braintreePayment = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;
    cart.map((i) => {
      total += i.price;
    });
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new Order({
            products: cart.map((c) => c._id),
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};

export {
  createProduct,
  getAllProduct,
  getSingleProduct,
  getProductPhoto,
  deleteProduct,
  updateProduct,
  productFilter,
  productCount,
  productList,
  searchProduct,
  relatedProduct,
  productCategory,
  braintreeToken,
  braintreePayment,
};
