import express from "express";
import {
  placeOrder,
  getCustomerOrders,
  getSellerOrders,
  getInvoice,
  pickOrder,
   // add this
} from "../controllers/order.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { sellerAuth } from "../middleware/sellerAuth.js";

const router = express.Router();

// Admin places order
router.post("/place", placeOrder);

// Customer orders
router.get("/customer/orders", sellerAuth, getCustomerOrders);

// Invoice
router.get("/invoice/:id", authMiddleware, getInvoice);

// Seller routes
router.get("/seller/orders", sellerAuth, getSellerOrders);
router.post("/pick/:id", sellerAuth, pickOrder); // pickup order


export default router;
