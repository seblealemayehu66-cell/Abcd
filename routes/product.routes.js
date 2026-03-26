import express from "express";

import {
  addProduct,
  getProducts,
  getProductsByCategory,
  publishCart ,
  getSellerProducts,
  getSingleProduct
} from "../controllers/product.controller.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { bulkImportProducts } from "../controllers/product.controller.js";
const router = express.Router();



// ✅ ADD PRODUCT (MULTIPLE IMAGES)
router.post("/", upload.array("images", 5), addProduct); 

router.get("/", getProducts);
router.get("/:id", getSingleProduct);
  

router.get("/category/:categoryId", getProductsByCategory);


// SELLER PUBLISH
router.post("/publish", authMiddleware, publishCart );


// SELLER STORE PRODUCTS
router.get("/seller", authMiddleware, getSellerProducts);
router.post("/bulk-import", bulkImportProducts);


export default router;
