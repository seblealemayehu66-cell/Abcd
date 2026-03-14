import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCustomerOrders, pickOrder } from "../controllers/order.controller.js";

const router = express.Router();

// Get customer orders
router.get("/orders", authMiddleware, getCustomerOrders);

// Pick order
router.post("/orders/pick/:id", authMiddleware, pickOrder);

export default router;