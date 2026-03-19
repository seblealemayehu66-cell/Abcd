import express from "express";
import {
  placeOrder,
  getCustomerOrders,
  getSellerOrders,
  getInvoice,
  pickOrder,
} from "../controllers/order.controller.js";

import authMiddleware from "../middleware/authMiddleware.js"; // for customers
import { sellerAuth } from "../middleware/sellerAuth.js"; // for sellers

const router = express.Router();

/* =========================
   ✅ ADMIN / VIRTUAL BUYER PLACE ORDER
========================= */
router.post("/place", placeOrder); // anyone/admin can place order (virtual buyer)

/* =========================
   ✅ CUSTOMER ORDERS
========================= */
router.get("/customer/orders", authMiddleware, getCustomerOrders);

/* =========================
   ✅ GET INVOICE
========================= */
router.get("/invoice/:id", authMiddleware, getInvoice);

/* =========================
   ✅ SELLER ORDERS
========================= */
router.get("/seller/orders", sellerAuth, getSellerOrders);

/* =========================
   ✅ PICK ORDER (SELLER)
========================= */
router.put("/pick/:id", sellerAuth, pickOrder);

export default router;
