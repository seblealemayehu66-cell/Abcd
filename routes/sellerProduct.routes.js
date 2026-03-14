import express from "express";
import SellerProduct from "../models/SellerProduct.js";
const router = express.Router();

// GET seller store products
router.get("/", async(req,res)=>{
  const sellerId = req.headers["x-seller-id"]; // dev testing
  const products = await SellerProduct.find({sellerId}).populate("productId");
  res.json(products);
});

export default router;
