import express from "express";
import multer from "multer";

import {
  addProduct,
  getProducts,
  getProductsByCategory,
  publishCart,
  getSellerProducts,
  getSingleProduct,
  bulkImportProducts
} from "../controllers/product.controller.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const excelUpload = multer({
  dest: "uploads/excel/"
});


// ========================
// 🔥 PRODUCT ROUTES (IMPORTANT ORDER FIX)
// ========================

// ADD PRODUCT
router.post("/", upload.array("images", 5), addProduct);

// GET PRODUCTS (PAGINATED)
router.get("/", getProducts);

// GET BY CATEGORY (MUST BE BEFORE /:id)
router.get("/category/:categoryId", getProductsByCategory);

// SELLER PRODUCTS
router.get("/seller", authMiddleware, getSellerProducts);

// BULK IMPORT
router.post("/bulk-import", excelUpload.single("file"), bulkImportProducts);

// PUBLISH CART
router.post("/publish", authMiddleware, publishCart);

// SINGLE PRODUCT (KEEP LAST)
router.get("/:id", getSingleProduct);

export default router;
