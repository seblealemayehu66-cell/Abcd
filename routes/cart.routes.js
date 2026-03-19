import express from "express";
import {
  addToCart,
  getUserCart,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Add product to cart
router.post("/add", authMiddleware, addToCart);

// ✅ Get user cart
router.get("/user", authMiddleware, getUserCart);

// ✅ Remove cart item
router.delete("/remove/:id", authMiddleware, removeCartItem);

// ✅ Clear cart
router.delete("/clear", authMiddleware, clearCart);

export default router;
