import express from "express";
import SellerProduct from "../models/SellerProduct.js";
import { sellerAuth } from "../middleware/sellerAuth.js";

const router = express.Router();

// GET seller store products
router.get("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller._id;

    const products = await SellerProduct
      .find({ sellerId: sellerId })
      .populate("productId");

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

