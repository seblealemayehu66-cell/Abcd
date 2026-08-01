import express from "express";

import {
  addToCart,
  getUserCart,
  removeCartItem,
  clearCart,
  updateCartItem
} from "../controllers/cart.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();


// ✅ Add product to cart
router.post(
  "/add",
  authMiddleware,
  addToCart
);


// ✅ Get user cart
router.get(
  "/user",
  authMiddleware,
  getUserCart
);


// ✅ Update cart item quantity/options
router.put(
  "/update/:id",
  authMiddleware,
  updateCartItem
);


// ✅ Remove single cart item
router.delete(
  "/remove/:id",
  authMiddleware,
  removeCartItem
);


// ✅ Clear whole cart
router.delete(
  "/clear",
  authMiddleware,
  clearCart
);


export default router;
