import express from "express";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  braintreePayment,
  braintreeToken,
  createProduct,
  deleteProduct,
  getAllProduct,
  getProductPhoto,
  getSingleProduct,
  productCategory,
  productCount,
  productFilter,
  productList,
  relatedProduct,
  searchProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import formidable from "express-formidable";
const router = express.Router();

//create product
router.post("/create-product", verifyJWT, isAdmin, formidable(), createProduct);

//get all producct
router.get("/get-product", getAllProduct);

//get single producct
router.get("/get-product/:slug", getSingleProduct);

//get photo
router.get("/product-photo/:pid", getProductPhoto);

//delete product
router.delete("/delete-product/:pid", deleteProduct);

// update product
router.put(
  "/update-product/:pid",
  verifyJWT,
  isAdmin,
  formidable(),
  updateProduct
);
//filter product
router.post("/product-filter", productFilter);

//productc count
router.get("/product-count", productCount);

//product per page
router.get("/product-list/:page", productList);

//search product
router.get("/search/:keyword", searchProduct);

// similar product
router.get("/related-product/:pid/:cid", relatedProduct);

//category wise product
router.get("/product-category/:slug", productCategory);

//payments route || token
router.get("/braintree/token", braintreeToken);
router.post("/braintree/payment", verifyJWT, braintreePayment);
export default router;
