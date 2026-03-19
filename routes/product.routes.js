import express from "express";

import {
  addProduct,
  getProducts,
  getProductsByCategory,
  publishCart ,
  getSellerProducts
} from "../controllers/product.controller.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", upload.single("image"), addProduct);

router.get("/", getProducts);
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("seller");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/category/:categoryId", getProductsByCategory);


// SELLER PUBLISH
router.post("/publish", authMiddleware, publishCart );


// SELLER STORE PRODUCTS
router.get("/seller", authMiddleware, getSellerProducts);

export default router;
