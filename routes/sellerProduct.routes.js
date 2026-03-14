import express from "express";
import SellerProduct from "../models/SellerProduct.js";
import { sellerAuth } from "../middleware/sellerAuth.js"; // make sure this is the JWT middleware

const router = express.Router();

// GET seller store products
router.get("/", sellerAuth, async (req, res) => {
  try {
    const sellerId = req.seller._id; // <- get seller ID from middleware

    const products = await SellerProduct.find({ seller: sellerId }).populate("productId");

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
