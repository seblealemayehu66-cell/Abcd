import express from "express";

import {
  addProduct,
  getProducts,
  getProductsByCategory,
  publishProducts,
  getSellerProducts
} from "../controllers/product.controller.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", upload.single("image"), addProduct);

router.get("/", getProducts);

router.get("/category/:categoryId", getProductsByCategory);


// SELLER PUBLISH
router.post("/publish", authMiddleware, publishProducts);


// SELLER STORE PRODUCTS
router.get("/seller", authMiddleware, getSellerProducts);

export default router;