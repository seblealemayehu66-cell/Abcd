import express from "express";
import multer from "multer";

import {
  addProduct,
  getProducts,
  getProductsByCategory,
  publishCart ,
  getSellerProducts,
  getSingleProduct,
  bulkImportProducts
} from "../controllers/product.controller.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { bulkImportProducts } from "../controllers/product.controller.js";
const router = express.Router();

const excelUpload = multer({
  dest: "uploads/excel/"
});

// ✅ ADD PRODUCT (MULTIPLE IMAGES)
router.post("/", upload.array("images", 5), addProduct); 

router.get("/", getProducts);
router.get("/:id", getSingleProduct);
  

router.get("/category/:categoryId", getProductsByCategory);


// SELLER PUBLISH
router.post("/publish", authMiddleware, publishCart );


// SELLER STORE PRODUCTS
router.get("/seller", authMiddleware, getSellerProducts);
router.post(
  "/bulk-import",
  excelUpload.single("file"),
  bulkImportProducts
);


export default router;
